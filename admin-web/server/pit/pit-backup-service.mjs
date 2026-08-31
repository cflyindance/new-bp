import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync, backup } from "node:sqlite";
import { recordAuditEvent } from "./pit-audit-service.mjs";
import { withImmediateTransaction } from "./pit-database.mjs";
import { notFound } from "./pit-errors.mjs";

const BACKUP_KINDS = new Set([
  "startup",
  "migration",
  "pre_import",
  "daily",
  "manual",
  "pre_restore",
]);
const OPERATION_KINDS = new Set(["startup", "migration", "pre_import", "pre_restore"]);

function dateFromClock(clock) {
  const date = new Date(clock());
  if (Number.isNaN(date.getTime())) throw new TypeError("clock must return a valid date");
  return date;
}

function backupDirectory(config) {
  const directory = path.resolve(config?.backupsDir || path.join(config?.dataDir || ".data/pit", "backups"));
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function timestampForFile(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function schemaVersion(db) {
  const row = db.prepare("SELECT max(version) AS version FROM schema_migrations").get();
  return Number(row?.version || 0);
}

function safeStoredPath(directory, fileName) {
  if (typeof fileName !== "string" || !fileName || path.basename(fileName) !== fileName) {
    throw new Error("Backup file name is outside the configured backups directory");
  }
  const resolved = path.resolve(directory, fileName);
  const relative = path.relative(directory, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Backup file path is outside the configured backups directory");
  }
  return resolved;
}

function removeIfPresent(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function toBackupRecord(row) {
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

export async function createPitBackup({
  db,
  config,
  kind,
  actorId = null,
  clock = () => new Date(),
}) {
  if (!db) throw new TypeError("createPitBackup requires db");
  if (!BACKUP_KINDS.has(kind)) throw new TypeError(`Unsupported PIT backup kind: ${kind}`);
  const directory = backupDirectory(config);
  const createdAt = dateFromClock(clock).toISOString();
  const id = randomUUID();
  const baseName = `pit-${kind}-${timestampForFile(new Date(createdAt))}-${id}`;
  const fileName = `${baseName}.sqlite3`;
  const manifestName = `${baseName}.manifest.json`;
  const filePath = safeStoredPath(directory, fileName);
  const manifestPath = safeStoredPath(directory, manifestName);
  const version = schemaVersion(db);

  try {
    await backup(db, filePath);
    const bytes = fs.readFileSync(filePath);
    const manifest = {
      timestamp: createdAt,
      schemaVersion: version,
      size: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    withImmediateTransaction(db, () => {
      db.prepare(`
        INSERT INTO backup_records (
          id, kind, file_name, manifest_name, sha256, byte_size,
          schema_version, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        kind,
        fileName,
        manifestName,
        manifest.sha256,
        manifest.size,
        manifest.schemaVersion,
        actorId,
        createdAt,
      );
      recordAuditEvent(db, {
        actorUserId: actorId,
        action: "backup.create",
        resourceType: "backup",
        resourceId: id,
        after: { id, kind, fileName, ...manifest },
        createdAt,
      });
    });
    return toBackupRecord(db.prepare(`
      SELECT id, kind, file_name, manifest_name, sha256, byte_size,
        schema_version, created_by, created_at
      FROM backup_records WHERE id = ?
    `).get(id));
  } catch (error) {
    removeIfPresent(manifestPath);
    removeIfPresent(filePath);
    throw error;
  }
}

export function listPitBackups({ db }) {
  return db.prepare(`
    SELECT id, kind, file_name, manifest_name, sha256, byte_size,
      schema_version, created_by, created_at
    FROM backup_records
    ORDER BY created_at DESC, id DESC
  `).all().map(toBackupRecord);
}

export function resolvePitBackupDownload({ db, config, id }) {
  const row = db.prepare(`
    SELECT id, kind, file_name, manifest_name, sha256, byte_size,
      schema_version, created_by, created_at
    FROM backup_records WHERE id = ?
  `).get(id);
  if (!row) throw notFound("备份不存在");
  const directory = backupDirectory(config);
  let filePath;
  try {
    filePath = safeStoredPath(directory, row.file_name);
  } catch {
    throw notFound("备份文件不存在");
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw notFound("备份文件不存在");
  return {
    filePath,
    fileName: row.file_name,
    contentType: "application/vnd.sqlite3",
    backup: toBackupRecord(row),
  };
}

export function enforcePitBackupRetention({ db, config }) {
  const directory = backupDirectory(config);
  const records = listPitBackups({ db });
  const daily = records.filter((item) => item.kind === "daily");
  const operations = records.filter((item) => OPERATION_KINDS.has(item.kind));
  const expired = [...daily.slice(14), ...operations.slice(5)];
  const removed = [];
  for (const item of expired) {
    const filePath = safeStoredPath(directory, item.fileName);
    const manifestPath = safeStoredPath(directory, item.manifestName);
    const deleted = withImmediateTransaction(db, () => {
      const result = db.prepare("DELETE FROM backup_records WHERE id = ? AND kind <> 'manual'").run(item.id);
      if (result.changes !== 1) return false;
      recordAuditEvent(db, {
        action: "backup.retention.delete",
        resourceType: "backup",
        resourceId: item.id,
        before: item,
      });
      return true;
    });
    if (!deleted) continue;
    // Commit catalog/audit first. A filesystem failure may leave an unreferenced
    // file for later cleanup, but must never leave a record pointing at a missing file.
    removeIfPresent(filePath);
    removeIfPresent(manifestPath);
    removed.push(item.id);
  }
  return { removed };
}

export function scheduleDailyPitBackup({ db, config, logger = console, clock = () => new Date() }) {
  let stopped = false;
  let timer = null;
  async function runNow() {
    const date = dateFromClock(clock);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);
    const existed = db.prepare(`
      SELECT 1 FROM backup_records
      WHERE kind = 'daily' AND created_at >= ? AND created_at < ? LIMIT 1
    `).get(dayStart.toISOString(), nextDay.toISOString());
    if (existed) return null;
    const created = await createPitBackup({ db, config, kind: "daily", clock });
    enforcePitBackupRetention({ db, config });
    return created;
  }
  function arm() {
    if (stopped) return;
    const current = dateFromClock(clock);
    const next = new Date(current);
    next.setHours(24, 0, 0, 0);
    const delay = Math.max(1_000, Math.min(next.getTime() - current.getTime(), 2_147_483_647));
    timer = setTimeout(async () => {
      try {
        await runNow();
      } catch (error) {
        logger?.error?.("PIT daily backup failed", error);
      } finally {
        arm();
      }
    }, delay);
    timer.unref?.();
  }
  const ready = runNow().catch((error) => {
    logger?.error?.("PIT daily backup failed", error);
    return null;
  }).finally(arm);
  return {
    ready,
    runNow,
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export async function verifyPitBackup(filePath, expectedSchemaVersion) {
  const resolved = path.resolve(filePath);
  if (path.extname(resolved).toLowerCase() !== ".sqlite3") {
    throw new Error("PIT backup must be a .sqlite3 file");
  }
  const manifestPath = resolved.replace(/\.sqlite3$/i, ".manifest.json");
  if (!fs.existsSync(resolved) || !fs.existsSync(manifestPath)) {
    throw new Error("PIT backup or manifest is missing");
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error("PIT backup manifest is invalid", { cause: error });
  }
  const bytes = fs.readFileSync(resolved);
  const actualSize = bytes.byteLength;
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  const manifestSize = Number(manifest.size ?? manifest.byteSize);
  if (manifestSize !== actualSize) throw new Error("PIT backup size does not match its manifest");
  if (manifest.sha256 !== actualHash) throw new Error("PIT backup SHA-256 does not match its manifest");
  const manifestVersion = Number(manifest.schemaVersion);
  const manifestTimestamp = manifest.timestamp ?? manifest.createdAt;
  if (typeof manifestTimestamp !== "string" || Number.isNaN(new Date(manifestTimestamp).getTime())) {
    throw new Error("PIT backup timestamp is invalid");
  }
  if (!Number.isSafeInteger(manifestVersion) || manifestVersion < 0) {
    throw new Error("PIT backup schema version is invalid");
  }
  if (expectedSchemaVersion !== undefined && manifestVersion !== Number(expectedSchemaVersion)) {
    throw new Error(`PIT backup schema version ${manifestVersion} does not match expected version ${expectedSchemaVersion}`);
  }

  let checkDb;
  try {
    checkDb = new DatabaseSync(resolved, { readOnly: true });
    const integrity = checkDb.prepare("PRAGMA integrity_check").all();
    if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") {
      throw new Error("PIT backup integrity check failed");
    }
    const row = checkDb.prepare("SELECT max(version) AS version FROM schema_migrations").get();
    const actualVersion = Number(row?.version || 0);
    if (actualVersion !== manifestVersion) {
      throw new Error(`PIT backup database schema version ${actualVersion} does not match manifest version ${manifestVersion}`);
    }
  } catch (error) {
    if (/PIT backup/.test(String(error?.message))) throw error;
    throw new Error("PIT backup is corrupt or unreadable", { cause: error });
  } finally {
    checkDb?.close();
  }
  return {
    timestamp: manifestTimestamp,
    schemaVersion: manifestVersion,
    size: actualSize,
    sha256: actualHash,
    filePath: resolved,
    manifestPath,
  };
}
