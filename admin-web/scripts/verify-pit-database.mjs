import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { resolvePitConfig } from "../server/pit/pit-config.mjs";
import {
  getSystemSetting,
  openPitDatabase,
  setSystemSetting,
  withImmediateTransaction,
} from "../server/pit/pit-database.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "pit-db-"));

try {
  const db = await openPitDatabase({ dataDir: root, backupBeforeMigrate: false });

  try {
    assert.equal(db.prepare("PRAGMA journal_mode").get().journal_mode, "wal");
    assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1);
    assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");

    const tables = new Set(
      db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((row) => row.name),
    );

    for (const name of [
      "users",
      "sessions",
      "requirements",
      "requirement_product_lines",
      "requirement_assignees",
      "requirement_mids",
      "requirement_followers",
      "dictionaries",
      "audit_events",
      "import_jobs",
      "import_rows",
      "export_jobs",
      "backup_records",
      "system_settings",
    ]) {
      assert(tables.has(name), `missing ${name}`);
    }

    assert.equal(
      db
        .prepare("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1")
        .get().version,
      1,
    );

    for (const directory of ["imports", "exports", "backups"]) {
      assert(fs.statSync(path.join(root, directory)).isDirectory());
    }

    db.prepare(`
      INSERT INTO users (
        id, username, display_name, password_hash, role, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run("user-1", "admin", "Admin", "hash", "admin", 1, "2026-08-31", "2026-08-31");

    const insertRequirement = db.prepare(`
      INSERT INTO requirements (
        id, requirement_no, title, description, status, priority, implementation_side,
        planned_month, is_highlighted, paused_from_status, created_by, updated_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const requirementValues = (id, overrides = {}) => [
      id,
      id,
      "Requirement",
      "Description",
      overrides.status ?? "review_pending",
      overrides.priority ?? null,
      overrides.implementationSide ?? null,
      overrides.plannedMonth ?? null,
      0,
      overrides.pausedFromStatus ?? null,
      "user-1",
      "user-1",
      "2026-08-31",
      "2026-08-31",
    ];

    insertRequirement.run(...requirementValues("valid", {
      priority: "urgent",
      implementationSide: "both",
      plannedMonth: 12,
      status: "paused",
      pausedFromStatus: "testing",
    }));
    assert.throws(() =>
      insertRequirement.run(...requirementValues("bad-priority", { priority: "critical" })),
    );
    assert.throws(() =>
      insertRequirement.run(
        ...requirementValues("bad-side", { implementationSide: "database" }),
      ),
    );
    assert.throws(() =>
      insertRequirement.run(...requirementValues("bad-month", { plannedMonth: 13 })),
    );
    assert.throws(() =>
      insertRequirement.run(
        ...requirementValues("bad-paused-from", {
          status: "paused",
          pausedFromStatus: "rejected",
        }),
      ),
    );

    db.prepare(`
      INSERT INTO import_jobs (
        id, file_name, file_hash, status, summary_json, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("import-1", "requirements.xlsx", "file-hash", "preview", "{}", "user-1", "2026-08-31");
    db.prepare(`
      INSERT INTO import_rows (
        id, import_job_id, sheet_name, row_number, raw_json, normalized_json, issue_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run("row-1", "import-1", "Kiosk", 2, "{}", "{}", "[]");
    assert.throws(() => db.prepare("DELETE FROM import_jobs WHERE id = ?").run("import-1"));

    setSystemSetting(db, "verification", { enabled: true });
    assert.deepEqual(getSystemSetting(db, "verification"), { enabled: true });
    assert.equal(getSystemSetting(db, "missing"), null);

    assert.throws(() =>
      withImmediateTransaction(db, () => {
        setSystemSetting(db, "rolled-back", true);
        throw new Error("force rollback");
      }),
    );
    assert.equal(getSystemSetting(db, "rolled-back"), null);
  } finally {
    db.close();
  }

  const config = resolvePitConfig(
    {
      PIT_HOST: "127.0.0.1",
      PIT_PORT: "4020",
      PIT_DATA_DIR: path.join(root, "configured-data"),
      PIT_DIST_DIR: path.join(root, "configured-dist"),
    },
    root,
  );
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 4020);
  assert.equal(config.dbPath, path.join(root, "configured-data", "pit.sqlite3"));
  assert.equal(config.distDir, path.join(root, "configured-dist"));

  const backupRoot = path.join(root, "backup-case");
  fs.mkdirSync(backupRoot, { recursive: true });
  const legacyDb = new DatabaseSync(path.join(backupRoot, "pit.sqlite3"));
  legacyDb.exec("CREATE TABLE legacy_marker (id INTEGER PRIMARY KEY, value TEXT)");
  legacyDb.prepare("INSERT INTO legacy_marker (value) VALUES (?)").run("before migration");
  legacyDb.close();

  const migratedDb = await openPitDatabase({
    dataDir: backupRoot,
    backupBeforeMigrate: true,
    logger: { info() {} },
  });
  try {
    assert.equal(
      migratedDb.prepare("SELECT count(*) AS count FROM backup_records").get().count,
      1,
    );
    const migrationBackup = migratedDb
      .prepare("SELECT kind, schema_version FROM backup_records")
      .get();
    assert.equal(migrationBackup.kind, "migration");
    assert.equal(migrationBackup.schema_version, 0);
  } finally {
    migratedDb.close();
  }

  const backupFiles = fs
    .readdirSync(path.join(backupRoot, "backups"))
    .filter((name) => name.endsWith(".sqlite3"));
  const manifestFiles = fs
    .readdirSync(path.join(backupRoot, "backups"))
    .filter((name) => name.endsWith(".manifest.json"));
  assert.equal(backupFiles.length, 1);
  assert.equal(manifestFiles.length, 1);
  const backupPath = path.join(backupRoot, "backups", backupFiles[0]);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(backupRoot, "backups", manifestFiles[0]), "utf8"),
  );
  assert.equal(typeof manifest.createdAt, "string");
  assert.equal(manifest.schemaVersion, 0);
  assert.equal(manifest.byteSize, fs.statSync(backupPath).size);
  assert.equal(
    manifest.sha256,
    createHash("sha256").update(fs.readFileSync(backupPath)).digest("hex"),
  );
  const snapshotDb = new DatabaseSync(backupPath, { readOnly: true });
  assert.equal(
    snapshotDb.prepare("SELECT value FROM legacy_marker WHERE id = 1").get().value,
    "before migration",
  );
  snapshotDb.close();

  const futureRoot = path.join(root, "future-schema");
  fs.mkdirSync(futureRoot, { recursive: true });
  const futureDb = new DatabaseSync(path.join(futureRoot, "pit.sqlite3"));
  futureDb.exec(`
    CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    INSERT INTO schema_migrations (version, applied_at) VALUES (2, '2026-08-31');
  `);
  futureDb.close();
  await assert.rejects(
    openPitDatabase({ dataDir: futureRoot, backupBeforeMigrate: false }),
    (error) => error?.code === "schema_newer_than_code",
  );

  const unknownRoot = path.join(root, "unknown-schema");
  fs.mkdirSync(unknownRoot, { recursive: true });
  const unknownDb = new DatabaseSync(path.join(unknownRoot, "pit.sqlite3"));
  unknownDb.exec(`
    CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    INSERT INTO schema_migrations (version, applied_at) VALUES (0, '2026-08-31');
  `);
  unknownDb.close();
  await assert.rejects(
    openPitDatabase({ dataDir: unknownRoot, backupBeforeMigrate: false }),
    (error) => error?.code === "unknown_migration",
  );
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
