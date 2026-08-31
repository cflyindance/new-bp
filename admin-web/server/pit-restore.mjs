import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { recordAuditEvent } from "./pit/pit-audit-service.mjs";
import {
  createPitBackup,
  enforcePitBackupRetention,
  verifyPitBackup,
} from "./pit/pit-backup-service.mjs";
import { resolvePitConfig } from "./pit/pit-config.mjs";
import { withImmediateTransaction } from "./pit/pit-database.mjs";

const BACKUP_KINDS = new Set(["startup", "migration", "pre_import", "daily", "manual", "pre_restore"]);
const SERVICE_BACKUP_NAME = /^pit-(startup|migration|pre_import|daily|manual|pre_restore)-\d{8}T\d{6}Z-([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.sqlite3$/i;

function backupDirectory(config) {
  return path.resolve(config.backupsDir || path.join(config.dataDir, "backups"));
}

function resolveBackupArgument(backupArg, config) {
  if (typeof backupArg !== "string" || !backupArg.trim()) {
    throw new Error("必须提供一个 backups 目录内的 PIT 备份文件");
  }
  const directory = backupDirectory(config);
  const resolved = path.resolve(path.isAbsolute(backupArg) ? backupArg : path.join(directory, backupArg));
  const relative = path.relative(directory, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("备份文件必须位于 PIT backups 目录内");
  }
  if (path.extname(resolved).toLowerCase() !== ".sqlite3") {
    throw new Error("备份文件必须是 .sqlite3 文件");
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error("备份文件不存在");
  return resolved;
}

function schemaVersion(db) {
  const row = db.prepare("SELECT max(version) AS version FROM schema_migrations").get();
  return Number(row?.version || 0);
}

function removeSqliteSidecars(dbPath) {
  for (const suffix of ["-wal", "-shm"]) {
    try {
      fs.unlinkSync(`${dbPath}${suffix}`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

function validateDatabaseFile(dbPath, expectedSchemaVersion) {
  let db;
  try {
    db = new DatabaseSync(dbPath, { readOnly: true });
    const integrity = db.prepare("PRAGMA integrity_check").all();
    if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") {
      throw new Error("恢复后的数据库完整性检查失败");
    }
    const actualVersion = schemaVersion(db);
    if (actualVersion !== expectedSchemaVersion) {
      throw new Error(`恢复后的 schema 版本 ${actualVersion} 与预期版本 ${expectedSchemaVersion} 不一致`);
    }
  } finally {
    db?.close();
  }
}

function toBackupRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    fileName: row.file_name,
    manifestName: row.manifest_name,
    sha256: row.sha256,
    byteSize: row.byte_size,
    schemaVersion: row.schema_version,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function readSourceCatalogRecord(db, fileName) {
  return toBackupRecord(db.prepare(`
    SELECT id, kind, file_name, manifest_name, sha256, byte_size,
      schema_version, created_by, created_at
    FROM backup_records WHERE file_name = ?
    ORDER BY created_at DESC, id DESC LIMIT 1
  `).get(fileName));
}

function buildSourceCatalogRecord(sourcePath, captured, verified) {
  const fileName = path.basename(sourcePath);
  const manifestName = path.basename(verified.manifestPath);
  if (captured) {
    if (!BACKUP_KINDS.has(captured.kind)) throw new Error(`源备份 catalog kind 不受支持：${captured.kind}`);
    return {
      ...captured,
      fileName,
      manifestName,
      sha256: verified.sha256,
      byteSize: verified.size,
      schemaVersion: verified.schemaVersion,
    };
  }
  const match = SERVICE_BACKUP_NAME.exec(fileName);
  if (!match) {
    throw new Error("源备份不在 catalog 中，且文件名不是可安全识别的 PIT 服务备份格式");
  }
  return {
    id: match[2].toLowerCase(),
    kind: match[1].toLowerCase(),
    fileName,
    manifestName,
    sha256: verified.sha256,
    byteSize: verified.size,
    schemaVersion: verified.schemaVersion,
    createdBy: null,
    createdAt: verified.timestamp,
  };
}

function catalogRestoredBackups(dbPath, { source, preRestore, restoredAt }) {
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    withImmediateTransaction(db, () => {
      const upsert = db.prepare(`
        INSERT INTO backup_records (
          id, kind, file_name, manifest_name, sha256, byte_size,
          schema_version, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          kind = excluded.kind,
          file_name = excluded.file_name,
          manifest_name = excluded.manifest_name,
          sha256 = excluded.sha256,
          byte_size = excluded.byte_size,
          schema_version = excluded.schema_version,
          created_by = excluded.created_by,
          created_at = excluded.created_at
      `);
      for (const record of [source, preRestore]) {
        const createdBy = record.createdBy && db.prepare("SELECT 1 FROM users WHERE id = ?").get(record.createdBy)
          ? record.createdBy
          : null;
        upsert.run(
          record.id,
          record.kind,
          record.fileName,
          record.manifestName,
          record.sha256,
          record.byteSize,
          record.schemaVersion,
          createdBy,
          record.createdAt,
        );
      }
      recordAuditEvent(db, {
        action: "database.restore",
        resourceType: "backup",
        resourceId: source.id,
        after: { sourceBackupId: source.id, preRestoreBackupId: preRestore.id },
        createdAt: restoredAt,
      });
    });
  } finally {
    db.close();
  }
}

function enforceRestoredRetention(dbPath, config, logger) {
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    enforcePitBackupRetention({ db, config });
  } catch (error) {
    logger?.error?.("PIT restore succeeded but backup retention cleanup failed", error);
  } finally {
    db.close();
  }
}

function openAndLockCurrentDatabase(dbPath) {
  if (!fs.existsSync(dbPath)) throw new Error("当前 PIT 数据库不存在，无法创建 pre_restore 备份");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=0;");
  try {
    db.exec("BEGIN IMMEDIATE");
    db.exec("ROLLBACK");
  } catch (error) {
    db.close();
    if (error?.code === "SQLITE_BUSY" || /locked|busy/i.test(String(error?.message))) {
      throw new Error("PIT 数据库正在使用或已 locked；请先停止 PIT 服务再恢复", { cause: error });
    }
    throw error;
  }
  return db;
}

export async function restorePitDatabase({
  backupArg,
  config = resolvePitConfig(),
  logger = console,
  clock = () => new Date(),
  afterReplace = () => {},
}) {
  const sourcePath = resolveBackupArgument(backupArg, config);
  const dbPath = path.resolve(config.dbPath || path.join(config.dataDir, "pit.sqlite3"));
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const currentDb = openAndLockCurrentDatabase(dbPath);
  let expectedSchemaVersion;
  let preRestore;
  let capturedSource;
  try {
    expectedSchemaVersion = schemaVersion(currentDb);
    capturedSource = readSourceCatalogRecord(currentDb, path.basename(sourcePath));
    preRestore = await createPitBackup({
      db: currentDb,
      config,
      kind: "pre_restore",
      clock,
    });
  } finally {
    currentDb.close();
  }

  const preRestorePath = path.join(backupDirectory(config), preRestore.fileName);
  const verifiedSource = await verifyPitBackup(sourcePath, expectedSchemaVersion);
  const sourceCatalog = buildSourceCatalogRecord(sourcePath, capturedSource, verifiedSource);

  const rollbackPath = path.join(path.dirname(dbPath), `.pit-restore-original-${randomUUID()}.sqlite3`);
  const replacementPath = path.join(path.dirname(dbPath), `.pit-restore-replacement-${randomUUID()}.sqlite3`);
  fs.copyFileSync(dbPath, rollbackPath);
  try {
    fs.copyFileSync(sourcePath, replacementPath);
    removeSqliteSidecars(dbPath);
    fs.copyFileSync(replacementPath, dbPath);
    removeSqliteSidecars(dbPath);
    await afterReplace({ dbPath, sourcePath });
    validateDatabaseFile(dbPath, expectedSchemaVersion);
    catalogRestoredBackups(dbPath, {
      source: sourceCatalog,
      preRestore,
      restoredAt: new Date(clock()).toISOString(),
    });
  } catch (error) {
    removeSqliteSidecars(dbPath);
    fs.copyFileSync(rollbackPath, dbPath);
    removeSqliteSidecars(dbPath);
    try {
      validateDatabaseFile(dbPath, expectedSchemaVersion);
    } catch (rollbackError) {
      throw new Error(
        `PIT 恢复失败，且原数据库自动恢复校验失败；请使用 ${preRestorePath} 手工恢复`,
        { cause: new AggregateError([error, rollbackError]) },
      );
    }
    throw new Error(`PIT 恢复失败，已自动恢复原数据库；pre_restore 备份：${preRestorePath}`, { cause: error });
  } finally {
    try {
      fs.unlinkSync(replacementPath);
    } catch (error) {
      if (error?.code !== "ENOENT") logger?.error?.("无法清理 PIT 恢复临时文件", error);
    }
    try {
      fs.unlinkSync(rollbackPath);
    } catch (error) {
      if (error?.code !== "ENOENT") logger?.error?.("无法清理 PIT 恢复回滚文件", error);
    }
  }

  enforceRestoredRetention(dbPath, config, logger);
  logger?.info?.(`PIT database restored from ${sourcePath}`);
  return {
    status: "restored",
    sourcePath,
    preRestorePath,
    sourceBackup: sourceCatalog,
    preRestore,
    schemaVersion: expectedSchemaVersion,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("用法: npm run pit:restore -- <backups目录内的backup.sqlite3>");
    process.exitCode = 1;
  } else {
    try {
      const result = await restorePitDatabase({ backupArg: args[0] });
      console.log(`PIT 数据库恢复成功（schema ${result.schemaVersion}）。pre_restore: ${result.preRestorePath}`);
    } catch (error) {
      console.error(error?.message || error);
      process.exitCode = 1;
    }
  }
}
