import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync, backup } from "node:sqlite";
import { fileURLToPath } from "node:url";

const PIT_DATABASE_FILE = "pit.sqlite3";
const MIGRATION_FILE_PATTERN = /^(\d+)-.+\.sql$/;
const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

function listMigrations() {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && MIGRATION_FILE_PATTERN.test(entry.name))
    .map((entry) => {
      const match = MIGRATION_FILE_PATTERN.exec(entry.name);
      return {
        fileName: entry.name,
        version: Number(match[1]),
        sql: fs.readFileSync(path.join(migrationsDir, entry.name), "utf8"),
      };
    })
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

function tableExists(db, tableName) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName),
  );
}

function readAppliedMigrationVersions(db) {
  if (!tableExists(db, "schema_migrations")) return new Set();

  return new Set(db.prepare("SELECT version FROM schema_migrations").all().map((row) => row.version));
}

function createMigrationHistoryError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertKnownMigrationHistory(migrations, appliedVersions) {
  const knownVersions = new Set(migrations.map((migration) => migration.version));
  const maxKnownVersion = Math.max(0, ...knownVersions);
  const maxAppliedVersion = Math.max(0, ...appliedVersions);

  if (maxAppliedVersion > maxKnownVersion) {
    throw createMigrationHistoryError(
      "schema_newer_than_code",
      `PIT database schema version ${maxAppliedVersion} is newer than code version ${maxKnownVersion}`,
    );
  }

  const unknownVersions = [...appliedVersions].filter((version) => !knownVersions.has(version));
  if (unknownVersions.length > 0) {
    throw createMigrationHistoryError(
      "unknown_migration",
      `PIT database contains unknown migration version(s): ${unknownVersions.join(", ")}`,
    );
  }

  const missingVersions = migrations
    .filter((migration) => migration.version <= maxAppliedVersion)
    .map((migration) => migration.version)
    .filter((version) => !appliedVersions.has(version));
  if (missingVersions.length > 0) {
    throw createMigrationHistoryError(
      "unknown_migration",
      `PIT database migration history is missing version(s): ${missingVersions.join(", ")}`,
    );
  }
}

function currentSchemaVersion(appliedVersions) {
  return Math.max(0, ...appliedVersions);
}

function formatBackupTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function backupDatabaseBeforeMigration(db, backupsDir, schemaVersion, logger) {
  const createdAt = new Date().toISOString();
  const baseName = `pit-pre-migrate-${formatBackupTimestamp(new Date(createdAt))}-${randomUUID()}`;
  const fileName = `${baseName}.sqlite3`;
  const manifestName = `${baseName}.manifest.json`;
  const backupPath = path.join(backupsDir, fileName);
  const manifestPath = path.join(backupsDir, manifestName);

  await backup(db, backupPath);

  const backupBytes = fs.readFileSync(backupPath);
  const manifest = {
    createdAt,
    schemaVersion,
    byteSize: backupBytes.byteLength,
    sha256: createHash("sha256").update(backupBytes).digest("hex"),
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  logger?.info?.(`PIT database backup created before migration: ${backupPath}`);

  return { ...manifest, fileName, manifestName };
}

function recordMigrationBackup(db, backupManifest) {
  db.prepare(`
    INSERT INTO backup_records (
      id, kind, file_name, manifest_name, sha256, byte_size, schema_version, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `).run(
    randomUUID(),
    "migration",
    backupManifest.fileName,
    backupManifest.manifestName,
    backupManifest.sha256,
    backupManifest.byteSize,
    backupManifest.schemaVersion,
    backupManifest.createdAt,
  );
}

async function applyMigrations(
  db,
  { databaseExisted, backupsDir, backupBeforeMigrate, logger },
) {
  const migrations = listMigrations();
  const appliedVersions = readAppliedMigrationVersions(db);
  assertKnownMigrationHistory(migrations, appliedVersions);

  const pendingMigrations = migrations.filter(
    (migration) => !appliedVersions.has(migration.version),
  );

  if (pendingMigrations.length === 0) return;

  let backupManifest = null;
  if (databaseExisted && backupBeforeMigrate) {
    backupManifest = await backupDatabaseBeforeMigration(
      db,
      backupsDir,
      currentSchemaVersion(appliedVersions),
      logger,
    );
  }

  for (const migration of pendingMigrations) {
    withImmediateTransaction(db, () => {
      db.exec(migration.sql);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
        migration.version,
        new Date().toISOString(),
      );
    });
    logger?.info?.(`Applied PIT database migration ${migration.fileName}`);
  }

  if (backupManifest && tableExists(db, "backup_records")) {
    recordMigrationBackup(db, backupManifest);
  }
}

// Returns Promise<DatabaseSync>: migration backups use the asynchronous node:sqlite backup API.
export async function openPitDatabase({ dataDir, backupBeforeMigrate = true, logger = console }) {
  if (!dataDir) throw new TypeError("openPitDatabase requires dataDir");

  const resolvedDataDir = path.resolve(dataDir);
  const importsDir = path.join(resolvedDataDir, "imports");
  const exportsDir = path.join(resolvedDataDir, "exports");
  const backupsDir = path.join(resolvedDataDir, "backups");
  const dbPath = path.join(resolvedDataDir, PIT_DATABASE_FILE);
  const databaseExisted = fs.existsSync(dbPath);

  for (const directory of [resolvedDataDir, importsDir, exportsDir, backupsDir]) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  try {
    db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=NORMAL;",
    );
    await applyMigrations(db, { databaseExisted, backupsDir, backupBeforeMigrate, logger });
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function withImmediateTransaction(db, operation) {
  db.exec("BEGIN IMMEDIATE");

  try {
    const result = operation();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Preserve the operation error when SQLite already ended the transaction.
    }
    throw error;
  }
}

export function getSystemSetting(db, key) {
  const row = db.prepare("SELECT value_json FROM system_settings WHERE key = ?").get(key);
  return row ? JSON.parse(row.value_json) : null;
}

export function setSystemSetting(db, key, value) {
  const updatedAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO system_settings (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value_json = excluded.value_json,
      updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), updatedAt);
}
