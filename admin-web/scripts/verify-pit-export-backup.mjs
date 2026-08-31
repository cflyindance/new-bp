import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import ExcelJS from "exceljs";
import {
  createPitBackup,
  enforcePitBackupRetention,
  listPitBackups,
  resolvePitBackupDownload,
  scheduleDailyPitBackup,
  verifyPitBackup,
} from "../server/pit/pit-backup-service.mjs";
import { PIT_EXPORT_COLUMNS } from "../server/pit/pit-export-service.mjs";
import { restorePitDatabase } from "../server/pit-restore.mjs";
import { openPitDatabase, setSystemSetting } from "../server/pit/pit-database.mjs";
import { requestPitHttp, startPitTestServer } from "./lib/pit-test-server.mjs";

const nodeMajor = Number(process.versions.node.split(".")[0]);
assert(nodeMajor >= 24, `PIT verification requires Node 24+, received ${process.versions.node}`);

const APPROVED_COLUMNS = [
  "提出时间", "实现月份", "实现年度", "Jira Ticket", "需求描述", "产品需求名称",
  "使用场景描述", "补充说明", "需求来源", "需求类别", "状态", "产品线", "前后端",
  "研发", "优先级", "问题分类", "MID", "版本号", "研发开始时间", "研发完成时间", "测试", "合入POS",
];
assert.deepEqual(PIT_EXPORT_COLUMNS, APPROVED_COLUMNS);

const clock = { now: new Date("2026-08-31T08:00:00.000Z") };
const server = await startPitTestServer({
  setupToken: "export-backup-setup-token",
  clock: () => new Date(clock.now),
});

function createClient() {
  let sessionToken = null;
  let csrfToken = null;
  const origin = server.baseUrl.replace(/\/api\/v1\/pit$/, "");
  async function request(method, requestPath, { body, csrf = false } = {}) {
    const headers = new Headers({ origin });
    if (sessionToken) headers.set("cookie", `pit_session=${encodeURIComponent(sessionToken)}`);
    if (csrf && csrfToken) headers.set("x-csrf-token", csrfToken);
    let payload;
    if (body !== undefined) {
      headers.set("content-type", "application/json");
      payload = JSON.stringify(body);
    }
    const response = await requestPitHttp(`${server.baseUrl}${requestPath}`, { method, headers, body: payload });
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = String(response.headers.get("content-type") || "");
    const responseBody = contentType.includes("application/json") && bytes.length
      ? JSON.parse(bytes.toString("utf8"))
      : bytes;
    const setCookie = response.headers.get("set-cookie");
    const match = setCookie && /(?:^|[,;]\s*)pit_session=([^;]*)/i.exec(setCookie);
    if (match) sessionToken = match[1] ? decodeURIComponent(match[1]) : null;
    if (responseBody?.data?.csrfToken) csrfToken = responseBody.data.csrfToken;
    return { status: response.status, headers: response.headers, body: responseBody, bytes };
  }
  return {
    get: (requestPath) => request("GET", requestPath),
    post: (requestPath, body, options = {}) => request("POST", requestPath, { ...options, body }),
  };
}

async function login(client, username, password) {
  const response = await client.post("/auth/login", { username, password });
  assert.equal(response.status, 200, `login failed for ${username}: ${JSON.stringify(response.body)}`);
  const me = await client.get("/auth/me");
  assert.equal(me.status, 200);
  return me.body.data.user;
}

function insertDictionary(type, code, label, sortOrder = 10) {
  const id = `${type}-${code}`;
  const now = clock.now.toISOString();
  server.db.prepare(`
    INSERT INTO dictionaries (id, type, code, label, sort_order, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, type, code, label, sortOrder, now, now);
  return id;
}

function insertRequirement({
  actorId,
  number,
  title,
  status,
  sourceStatus,
  deleted = false,
  proposedAt = "2026-08-15",
  plannedYear = 2026,
  plannedMonth = 9,
}) {
  const id = randomUUID();
  const now = clock.now.toISOString();
  server.db.prepare(`
    INSERT INTO requirements (
      id, requirement_no, jira_ticket, title, description, use_case, notes, status, priority,
      requirement_type_id, source_id, problem_category_id, industry_id, implementation_side,
      proposed_at, planned_year, planned_month, version_no, development_started_at,
      development_completed_at, pos_merge_version, is_highlighted, source_status,
      row_version, deleted_at, deleted_by, created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'high', ?, ?, ?, ?, 'both', ?, ?, ?, 'v3.2',
      '2026-08-20', '2026-08-29', 'POS-7.1', 0, ?, 1, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    number,
    `PIT-${number.slice(-3)}`,
    title,
    `${title} description`,
    `${title} scene`,
    `${title} notes`,
    status,
    ids.requirementType,
    ids.source,
    ids.problemCategory,
    ids.industry,
    proposedAt,
    plannedYear,
    plannedMonth,
    sourceStatus,
    deleted ? now : null,
    deleted ? actorId : null,
    actorId,
    actorId,
    now,
    now,
  );
  server.db.prepare(`
    INSERT INTO requirement_product_lines (requirement_id, dictionary_id) VALUES (?, ?)
  `).run(id, ids.productLine);
  server.db.prepare(`INSERT INTO requirement_mids (requirement_id, mid) VALUES (?, ?), (?, ?)`)
    .run(id, `${number}-MID-1`, id, `${number}-MID-2`);
  server.db.prepare(`
    INSERT INTO requirement_assignees (id, requirement_id, role, user_id, display_name, sort_order)
    VALUES (?, ?, 'developer', ?, '研发甲', 0), (?, ?, 'tester', ?, '测试乙', 1)
  `).run(randomUUID(), id, actorId, randomUUID(), id, actorId);
  return id;
}

const ids = {
  productLine: insertDictionary("product_line", "kiosk", "Kiosk"),
  source: insertDictionary("requirement_source", "product", "产品"),
  requirementType: insertDictionary("requirement_type", "feature", "功能"),
  problemCategory: insertDictionary("problem_category", "checkout", "结账"),
  industry: insertDictionary("industry", "restaurant", "餐饮"),
};

const admin = createClient();
const viewer = createClient();

try {
  const bootstrap = await admin.post("/setup/bootstrap", {
    token: "export-backup-setup-token",
    username: "admin",
    displayName: "Admin User",
    password: "PIT-admin-2026",
  });
  assert.equal(bootstrap.status, 201);
  const adminUser = await login(admin, "admin", "PIT-admin-2026");
  const viewerCreated = await admin.post("/users", {
    username: "viewer",
    displayName: "Viewer User",
    password: "PIT-viewer-2026",
    role: "viewer",
  }, { csrf: true });
  assert.equal(viewerCreated.status, 201);
  await login(viewer, "viewer", "PIT-viewer-2026");

  const matchingId = insertRequirement({
    actorId: adminUser.id,
    number: "REQ-000001",
    title: "国际手机号结账",
    status: "development",
    sourceStatus: "研发中",
  });
  insertRequirement({
    actorId: adminUser.id,
    number: "REQ-000002",
    title: "其他月份需求",
    status: "development",
    sourceStatus: "研发中",
    proposedAt: "2026-07-31",
  });
  const deletedId = insertRequirement({
    actorId: adminUser.id,
    number: "REQ-000003",
    title: "已删除需求",
    status: "development",
    sourceStatus: "待研发",
    deleted: true,
  });

  const exportSource = fs.readFileSync(path.join(process.cwd(), "server", "pit", "pit-export-service.mjs"), "utf8");
  assert.match(exportSource, /import\s*\{[^}]*\}\s*from\s*["']\.\/pit-requirement-service\.mjs["']/s);
  assert.match(exportSource.split("from \"./pit-requirement-service.mjs\"")[0].slice(-300), /parseRequirementListQuery/);
  assert.match(exportSource.split("from \"./pit-requirement-service.mjs\"")[0].slice(-300), /buildRequirementListSql/);
  assert.match(exportSource, /parseRequirementListQuery\s*\(/);
  assert.match(exportSource, /buildRequirementListSql\s*\(/);
  assert.equal((await viewer.post("/exports", { unknownFilter: true }, { csrf: true })).status, 422);

  const viewerExport = await viewer.post("/exports", {
    status: ["development"],
    proposedFrom: "2026-08",
    proposedTo: "2026-08",
    sort: "createdAt",
  }, { csrf: true });
  assert.equal(viewerExport.status, 201, JSON.stringify(viewerExport.body));
  const viewerJob = viewerExport.body.data.exportJob;
  assert.equal(viewerJob.status, "completed");
  assert.equal(viewerJob.rowCount, 1);
  assert.equal(viewerJob.expiresAt, "2026-09-01T08:00:00.000Z");
  assert.equal(viewerJob.fileName.includes(".."), false);

  const ownDownload = await viewer.get(`/exports/${viewerJob.id}/download`);
  assert.equal(ownDownload.status, 200);
  assert.match(String(ownDownload.headers.get("content-disposition")), /^attachment;/);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(ownDownload.bytes);
  const sheet = workbook.getWorksheet("PIT需求池");
  assert(sheet);
  assert.deepEqual(sheet.getRow(1).values.slice(1), APPROVED_COLUMNS);
  assert.equal(sheet.rowCount, 2);
  assert.equal(sheet.views[0].state, "frozen");
  assert.equal(sheet.views[0].ySplit, 1);
  assert(sheet.autoFilter);
  const row = sheet.getRow(2).values.slice(1);
  assert.equal(row[5], "国际手机号结账");
  assert.match(String(row[10]), /研发中/);
  assert.match(String(row[10]), /development/);
  assert.equal(row[11], "Kiosk");
  assert.equal(row[13], "研发甲");
  assert.equal(row[20], "测试乙");
  assert.equal(row[16], "REQ-000001-MID-1、REQ-000001-MID-2");

  const adminExport = await admin.post("/exports", {
    deleted: "only",
    status: ["development"],
  }, { csrf: true });
  assert.equal(adminExport.status, 201);
  assert.equal(adminExport.body.data.exportJob.rowCount, 1);
  const deletedWorkbook = new ExcelJS.Workbook();
  const deletedDownload = await admin.get(`/exports/${adminExport.body.data.exportJob.id}/download`);
  await deletedWorkbook.xlsx.load(deletedDownload.bytes);
  assert.equal(deletedWorkbook.getWorksheet("PIT需求池").getRow(2).getCell(6).value, "已删除需求");
  assert.equal((await viewer.post("/exports", { deleted: "only" }, { csrf: true })).status, 403);

  for (let index = 0; index < 105; index += 1) {
    insertRequirement({
      actorId: adminUser.id,
      number: `REQ-${String(1000 + index).padStart(6, "0")}`,
      title: `批量导出需求 ${index + 1}`,
      status: "testing",
      sourceStatus: "测试中",
    });
  }
  const bulkExport = await viewer.post("/exports", { status: ["testing"], sort: "createdAt" }, { csrf: true });
  assert.equal(bulkExport.status, 201);
  assert.equal(bulkExport.body.data.exportJob.rowCount, 105, "export must not inherit the list endpoint's 100-row page cap");
  const bulkDownload = await viewer.get(`/exports/${bulkExport.body.data.exportJob.id}/download`);
  const bulkWorkbook = new ExcelJS.Workbook();
  await bulkWorkbook.xlsx.load(bulkDownload.bytes);
  assert.equal(bulkWorkbook.getWorksheet("PIT需求池").rowCount, 106);

  const adminHistory = await admin.get("/exports?scope=all");
  assert.equal(adminHistory.status, 200);
  assert.equal(adminHistory.body.data.items.length, 3);
  assert.equal((await viewer.get("/exports?scope=all")).status, 403);
  assert.equal((await viewer.get(`/exports/${adminExport.body.data.exportJob.id}/download`)).status, 403);
  assert.equal((await admin.get(`/exports/${viewerJob.id}/download`)).status, 200);

  clock.now = new Date("2026-09-01T08:00:00.000Z");
  await login(viewer, "viewer", "PIT-viewer-2026");
  await login(admin, "admin", "PIT-admin-2026");
  const expired = await viewer.get(`/exports/${viewerJob.id}/download`);
  assert.equal(expired.status, 410);
  assert.equal(expired.body.error.code, "export_expired");
  assert.equal(fs.existsSync(path.join(server.dataDir, "exports", viewerJob.fileName)), false);
  const retainedHistory = await viewer.get("/exports");
  assert.equal(retainedHistory.status, 200);
  assert.equal(retainedHistory.body.data.items.length, 2);
  assert(retainedHistory.body.data.items.every((item) => item.expired));
  const retainedViewerJob = retainedHistory.body.data.items.find((item) => item.id === viewerJob.id);
  assert.equal(retainedViewerJob.rowCount, 1);
  assert.equal(retainedViewerJob.filter.proposedFrom, "2026-08");

  const manual = await admin.post("/backups", {}, { csrf: true });
  assert.equal(manual.status, 201, JSON.stringify(manual.body));
  assert.equal(manual.body.data.backup.kind, "manual");
  const backupHistory = await admin.get("/backups");
  assert.equal(backupHistory.status, 200);
  assert(backupHistory.body.data.items.some((item) => item.id === manual.body.data.backup.id));
  const backupDownload = await admin.get(`/backups/${manual.body.data.backup.id}/download`);
  assert.equal(backupDownload.status, 200);
  assert.match(String(backupDownload.headers.get("content-disposition")), /^attachment;/);
  assert.equal((await viewer.get("/backups")).status, 403);
  assert.equal((await viewer.post("/backups", {}, { csrf: true })).status, 403);
  assert.equal((await viewer.get(`/backups/${manual.body.data.backup.id}/download`)).status, 403);

  server.db.prepare("UPDATE export_jobs SET file_name = '../pit.sqlite3' WHERE id = ?").run(adminExport.body.data.exportJob.id);
  assert.equal((await admin.get(`/exports/${adminExport.body.data.exportJob.id}/download`)).status, 404);
  server.db.prepare("UPDATE backup_records SET file_name = '../pit.sqlite3' WHERE id = ?").run(manual.body.data.backup.id);
  assert.equal((await admin.get(`/backups/${manual.body.data.backup.id}/download`)).status, 404);

  const backupConfig = {
    dataDir: server.dataDir,
    backupsDir: path.join(server.dataDir, "backups"),
  };
  const kinds = ["startup", "migration", "pre_import", "daily", "pre_restore"];
  for (let index = 0; index < kinds.length; index += 1) {
    const backupClock = () => new Date(Date.UTC(2026, 8, 2 + index, 3, 0, 0));
    const created = await createPitBackup({
      db: server.db,
      config: backupConfig,
      kind: kinds[index],
      actorId: adminUser.id,
      clock: backupClock,
    });
    assert.equal(created.kind, kinds[index]);
    const filePath = path.join(backupConfig.backupsDir, created.fileName);
    const manifestPath = path.join(backupConfig.backupsDir, created.manifestName);
    assert(fs.existsSync(filePath));
    assert(fs.existsSync(manifestPath));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.deepEqual(Object.keys(manifest).sort(), ["schemaVersion", "sha256", "size", "timestamp"].sort());
    assert.equal(manifest.size, fs.statSync(filePath).size);
    assert.equal(manifest.sha256, createHash("sha256").update(fs.readFileSync(filePath)).digest("hex"));
    await verifyPitBackup(filePath, created.schemaVersion);
  }
  const dailySchedule = scheduleDailyPitBackup({
    db: server.db,
    config: backupConfig,
    logger: { error() {} },
    clock: () => new Date(clock.now),
  });
  await dailySchedule.ready;
  const scheduledDailyCount = listPitBackups({ db: server.db }).filter((item) => item.kind === "daily" && item.createdAt.startsWith("2026-09-01")).length;
  await dailySchedule.runNow();
  dailySchedule.stop();
  assert.equal(scheduledDailyCount, 1);
  assert.equal(listPitBackups({ db: server.db }).filter((item) => item.kind === "daily" && item.createdAt.startsWith("2026-09-01")).length, 1);

  const seed = new Date("2026-06-01T00:00:00.000Z");
  for (let index = 0; index < 16; index += 1) {
    await createPitBackup({
      db: server.db,
      config: backupConfig,
      kind: "daily",
      clock: () => new Date(seed.getTime() + index * 86_400_000),
    });
  }
  for (let index = 0; index < 7; index += 1) {
    await createPitBackup({
      db: server.db,
      config: backupConfig,
      kind: index % 2 ? "startup" : "pre_import",
      clock: () => new Date(seed.getTime() + index * 60_000),
    });
  }
  const manualBeforeRetention = listPitBackups({ db: server.db }).filter((item) => item.kind === "manual");
  const beforeFailedRetention = listPitBackups({ db: server.db });
  const expiringDaily = beforeFailedRetention.filter((item) => item.kind === "daily")[14];
  const expiringDailyPath = path.join(backupConfig.backupsDir, expiringDaily.fileName);
  const expiringDailyManifestPath = path.join(backupConfig.backupsDir, expiringDaily.manifestName);
  assert(fs.existsSync(expiringDailyPath));
  assert(fs.existsSync(expiringDailyManifestPath));
  server.db.exec(`
    CREATE TRIGGER pit_test_abort_retention_audit
    BEFORE INSERT ON audit_events
    WHEN NEW.action = 'backup.retention.delete'
    BEGIN
      SELECT RAISE(ABORT, 'retention audit blocked');
    END;
  `);
  assert.throws(
    () => enforcePitBackupRetention({ db: server.db, config: backupConfig }),
    /retention audit blocked/,
  );
  assert(server.db.prepare("SELECT 1 FROM backup_records WHERE id = ?").get(expiringDaily.id), "failed retention must preserve the catalog record");
  assert(fs.existsSync(expiringDailyPath), "failed retention must preserve the sqlite3 file");
  assert(fs.existsSync(expiringDailyManifestPath), "failed retention must preserve the manifest");
  server.db.exec("DROP TRIGGER pit_test_abort_retention_audit");
  enforcePitBackupRetention({ db: server.db, config: backupConfig });
  const retainedBackups = listPitBackups({ db: server.db });
  assert.equal(retainedBackups.filter((item) => item.kind === "daily").length, 14);
  assert.equal(retainedBackups.filter((item) => ["startup", "migration", "pre_import", "pre_restore"].includes(item.kind)).length, 5);
  assert.deepEqual(
    retainedBackups.filter((item) => item.kind === "manual").map((item) => item.id).sort(),
    manualBeforeRetention.map((item) => item.id).sort(),
  );

  const backupAuditActions = server.db.prepare(`
    SELECT action FROM audit_events WHERE resource_type IN ('export', 'backup') ORDER BY rowid
  `).all().map((item) => item.action);
  assert(backupAuditActions.includes("export.create"));
  assert(backupAuditActions.includes("export.complete"));
  assert(backupAuditActions.includes("backup.create"));
  assert.equal(server.db.prepare("SELECT count(*) AS count FROM requirements WHERE id = ?").get(matchingId).count, 1);
  assert.equal(server.db.prepare("SELECT count(*) AS count FROM requirements WHERE id = ?").get(deletedId).count, 1);
} finally {
  await server.close();
}

const restoreRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-restore-"));
const restoreConfig = {
  dataDir: restoreRoot,
  dbPath: path.join(restoreRoot, "pit.sqlite3"),
  importsDir: path.join(restoreRoot, "imports"),
  exportsDir: path.join(restoreRoot, "exports"),
  backupsDir: path.join(restoreRoot, "backups"),
};
try {
  const restoreDb = await openPitDatabase({ dataDir: restoreRoot, backupBeforeMigrate: false, logger: { info() {} } });
  setSystemSetting(restoreDb, "restore_probe", { value: "source" });
  const sourceBackup = await createPitBackup({
    db: restoreDb,
    config: restoreConfig,
    kind: "manual",
    clock: () => new Date("2026-08-01T00:00:00.000Z"),
  });
  setSystemSetting(restoreDb, "restore_probe", { value: "current" });
  restoreDb.close();

  const lockDb = new DatabaseSync(restoreConfig.dbPath);
  lockDb.exec("PRAGMA busy_timeout=0; BEGIN IMMEDIATE;");
  await assert.rejects(
    restorePitDatabase({ backupArg: sourceBackup.fileName, config: restoreConfig, logger: { info() {} } }),
    /locked|busy|正在使用/i,
  );
  lockDb.exec("ROLLBACK");
  lockDb.close();

  const restored = await restorePitDatabase({
    backupArg: sourceBackup.fileName,
    config: restoreConfig,
    logger: { info() {} },
  });
  assert.equal(restored.status, "restored");
  assert.equal(path.basename(restored.preRestorePath).includes("pre_restore"), true);
  const checkDb = new DatabaseSync(restoreConfig.dbPath);
  try {
    assert.deepEqual(JSON.parse(checkDb.prepare("SELECT value_json FROM system_settings WHERE key = 'restore_probe'").get().value_json), { value: "source" });
    const restoredCatalog = listPitBackups({ db: checkDb });
    assert(restoredCatalog.some((item) => item.id === sourceBackup.id), "restored catalog must retain the source backup record");
    assert(restoredCatalog.some((item) => item.id === restored.preRestore.id), "restored catalog must retain the new pre_restore record");
    const sourceDownloadAfterRestore = resolvePitBackupDownload({ db: checkDb, config: restoreConfig, id: sourceBackup.id });
    const preRestoreDownloadAfterRestore = resolvePitBackupDownload({ db: checkDb, config: restoreConfig, id: restored.preRestore.id });
    await verifyPitBackup(sourceDownloadAfterRestore.filePath, restored.schemaVersion);
    await verifyPitBackup(preRestoreDownloadAfterRestore.filePath, restored.schemaVersion);
  } finally {
    checkDb.close();
  }

  const missingCatalogDb = new DatabaseSync(restoreConfig.dbPath);
  missingCatalogDb.prepare("DELETE FROM backup_records WHERE id = ?").run(sourceBackup.id);
  missingCatalogDb.close();
  const reconstructed = await restorePitDatabase({
    backupArg: sourceBackup.fileName,
    config: restoreConfig,
    logger: { info() {} },
  });
  const reconstructedDb = new DatabaseSync(restoreConfig.dbPath, { readOnly: true });
  assert(reconstructedDb.prepare("SELECT 1 FROM backup_records WHERE id = ?").get(sourceBackup.id), "service-format source names must safely reconstruct a missing catalog record");
  assert(reconstructedDb.prepare("SELECT 1 FROM backup_records WHERE id = ?").get(reconstructed.preRestore.id));
  reconstructedDb.close();

  const changedDb = new DatabaseSync(restoreConfig.dbPath);
  setSystemSetting(changedDb, "restore_probe", { value: "rollback-target" });
  changedDb.close();
  await assert.rejects(
    restorePitDatabase({
      backupArg: sourceBackup.fileName,
      config: restoreConfig,
      logger: { info() {} },
      afterReplace() {
        throw new Error("forced post-replacement validation failure");
      },
    }),
    /已自动恢复原数据库/,
  );
  const rolledBackDb = new DatabaseSync(restoreConfig.dbPath, { readOnly: true });
  assert.deepEqual(JSON.parse(rolledBackDb.prepare("SELECT value_json FROM system_settings WHERE key = 'restore_probe'").get().value_json), { value: "rollback-target" });
  rolledBackDb.close();

  const catalogFailureId = randomUUID();
  const catalogFailureName = `pit-manual-20260801T000000Z-${catalogFailureId}.sqlite3`;
  const catalogFailurePath = path.join(restoreConfig.backupsDir, catalogFailureName);
  fs.copyFileSync(path.join(restoreConfig.backupsDir, sourceBackup.fileName), catalogFailurePath);
  const catalogFailureDb = new DatabaseSync(catalogFailurePath);
  catalogFailureDb.exec(`
    CREATE TRIGGER pit_test_abort_restore_catalog
    BEFORE INSERT ON backup_records
    BEGIN
      SELECT RAISE(ABORT, 'restore catalog blocked');
    END;
  `);
  catalogFailureDb.close();
  const catalogFailureBytes = fs.readFileSync(catalogFailurePath);
  fs.writeFileSync(path.join(restoreConfig.backupsDir, catalogFailureName.replace(/\.sqlite3$/, ".manifest.json")), JSON.stringify({
    timestamp: "2026-08-01T00:00:00.000Z",
    schemaVersion: restored.schemaVersion,
    size: catalogFailureBytes.length,
    sha256: createHash("sha256").update(catalogFailureBytes).digest("hex"),
  }));
  await assert.rejects(
    restorePitDatabase({ backupArg: catalogFailureName, config: restoreConfig, logger: { info() {} } }),
    /已自动恢复原数据库/,
  );
  const afterCatalogFailureDb = new DatabaseSync(restoreConfig.dbPath, { readOnly: true });
  assert.deepEqual(JSON.parse(afterCatalogFailureDb.prepare("SELECT value_json FROM system_settings WHERE key = 'restore_probe'").get().value_json), { value: "rollback-target" });
  afterCatalogFailureDb.close();

  const corruptName = `pit-corrupt-${randomUUID()}.sqlite3`;
  const corruptPath = path.join(restoreConfig.backupsDir, corruptName);
  fs.copyFileSync(path.join(restoreConfig.backupsDir, sourceBackup.fileName), corruptPath);
  fs.appendFileSync(corruptPath, "corrupt");
  const sourceManifest = JSON.parse(fs.readFileSync(path.join(restoreConfig.backupsDir, sourceBackup.manifestName), "utf8"));
  fs.writeFileSync(path.join(restoreConfig.backupsDir, corruptName.replace(/\.sqlite3$/, ".manifest.json")), JSON.stringify(sourceManifest));
  const preRestoreCountBeforeCorrupt = fs.readdirSync(restoreConfig.backupsDir).filter((name) => name.includes("pre_restore") && name.endsWith(".sqlite3")).length;
  await assert.rejects(
    restorePitDatabase({ backupArg: corruptName, config: restoreConfig, logger: { info() {} } }),
    /SHA-256|size|corrupt|完整/i,
  );
  const preRestoreCountAfterCorrupt = fs.readdirSync(restoreConfig.backupsDir).filter((name) => name.includes("pre_restore") && name.endsWith(".sqlite3")).length;
  assert.equal(preRestoreCountAfterCorrupt, preRestoreCountBeforeCorrupt + 1, "restore must create pre_restore before validating source integrity");
  const afterCorruptDb = new DatabaseSync(restoreConfig.dbPath, { readOnly: true });
  assert.deepEqual(JSON.parse(afterCorruptDb.prepare("SELECT value_json FROM system_settings WHERE key = 'restore_probe'").get().value_json), { value: "rollback-target" });
  afterCorruptDb.close();

  const wrongSchemaName = `pit-wrong-schema-${randomUUID()}.sqlite3`;
  const wrongSchemaPath = path.join(restoreConfig.backupsDir, wrongSchemaName);
  const wrongDb = new DatabaseSync(wrongSchemaPath);
  wrongDb.exec("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES (999, '2026-08-01T00:00:00.000Z');");
  wrongDb.close();
  const wrongBytes = fs.readFileSync(wrongSchemaPath);
  fs.writeFileSync(path.join(restoreConfig.backupsDir, wrongSchemaName.replace(/\.sqlite3$/, ".manifest.json")), JSON.stringify({
    timestamp: "2026-08-01T00:00:00.000Z",
    schemaVersion: 999,
    size: wrongBytes.length,
    sha256: createHash("sha256").update(wrongBytes).digest("hex"),
  }));
  await assert.rejects(
    restorePitDatabase({ backupArg: wrongSchemaName, config: restoreConfig, logger: { info() {} } }),
    /schema|版本/i,
  );
  const afterWrongSchemaDb = new DatabaseSync(restoreConfig.dbPath, { readOnly: true });
  assert.deepEqual(JSON.parse(afterWrongSchemaDb.prepare("SELECT value_json FROM system_settings WHERE key = 'restore_probe'").get().value_json), { value: "rollback-target" });
  afterWrongSchemaDb.close();
  await assert.rejects(
    restorePitDatabase({ backupArg: path.join(restoreRoot, "outside.sqlite3"), config: restoreConfig, logger: { info() {} } }),
    /backups|目录|范围/i,
  );
} finally {
  fs.rmSync(restoreRoot, { recursive: true, force: true });
}

const operationRestoreRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-operation-restore-"));
const operationRestoreConfig = {
  dataDir: operationRestoreRoot,
  dbPath: path.join(operationRestoreRoot, "pit.sqlite3"),
  importsDir: path.join(operationRestoreRoot, "imports"),
  exportsDir: path.join(operationRestoreRoot, "exports"),
  backupsDir: path.join(operationRestoreRoot, "backups"),
};
try {
  const operationDb = await openPitDatabase({
    dataDir: operationRestoreRoot,
    backupBeforeMigrate: false,
    logger: { info() {} },
  });
  setSystemSetting(operationDb, "operation_restore_probe", { value: "oldest-source" });
  const operationKinds = ["startup", "migration", "pre_import", "startup", "migration"];
  const operationBackups = [];
  for (let index = 0; index < operationKinds.length; index += 1) {
    operationBackups.push(await createPitBackup({
      db: operationDb,
      config: operationRestoreConfig,
      kind: operationKinds[index],
      clock: () => new Date(Date.UTC(2026, 6, index + 1, 0, 0, 0)),
    }));
    if (index === 0) setSystemSetting(operationDb, "operation_restore_probe", { value: "current" });
  }
  operationDb.close();
  const oldestOperation = operationBackups[0];
  const oldestOperationPath = path.join(operationRestoreConfig.backupsDir, oldestOperation.fileName);
  assert(fs.existsSync(oldestOperationPath));
  const operationRestored = await restorePitDatabase({
    backupArg: oldestOperation.fileName,
    config: operationRestoreConfig,
    logger: { info() {}, error() {} },
    clock: () => new Date("2026-08-31T08:00:00.000Z"),
  });
  assert.equal(operationRestored.status, "restored", "the oldest of five operation backups must remain available until source verification finishes");
  const operationCheckDb = new DatabaseSync(operationRestoreConfig.dbPath, { readOnly: true });
  assert.deepEqual(
    JSON.parse(operationCheckDb.prepare("SELECT value_json FROM system_settings WHERE key = 'operation_restore_probe'").get().value_json),
    { value: "oldest-source" },
  );
  operationCheckDb.close();
} finally {
  fs.rmSync(operationRestoreRoot, { recursive: true, force: true });
}

console.log("PIT export and backup verification passed.");
