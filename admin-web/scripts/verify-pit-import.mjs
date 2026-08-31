import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  PIT_SOURCE_HEADERS,
  PIT_STANDARD_SHEETS,
  parsePitWorkbook,
  suggestNormalizedStatus,
} from "../server/pit/pit-import-parser.mjs";
import { getSystemSetting } from "../server/pit/pit-database.mjs";
import {
  createPitBackup,
  listPitBackups,
  resolvePitBackupDownload,
} from "../server/pit/pit-backup-service.mjs";
import { createPitImportService } from "../server/pit/pit-import-service.mjs";
import {
  PIT_TEST_SOURCE_HEADERS,
  PIT_TEST_STANDARD_SHEETS,
  buildPitTestWorkbook,
} from "./lib/pit-test-workbook.mjs";
import { startPitTestServer } from "./lib/pit-test-server.mjs";

const nodeMajor = Number(process.versions.node.split(".")[0]);
assert(nodeMajor >= 24, `PIT verification requires Node 24+, received ${process.versions.node}`);
assert.deepEqual(PIT_STANDARD_SHEETS, PIT_TEST_STANDARD_SHEETS);
assert.deepEqual(PIT_SOURCE_HEADERS, PIT_TEST_SOURCE_HEADERS);

const EXISTING_MERGE_FIELDS = [
  "jiraTicket", "title", "description", "useCase", "notes", "status", "priority",
  "requirementType", "requirementSource", "problemCategory", "industry", "customerManager",
  "implementationSide", "proposedAt", "plannedYear", "plannedMonth", "versionNo",
  "developmentStartedAt", "developmentCompletedAt", "posMergeVersion",
  "productLines", "mids", "developers", "testers",
];

function mergeStrategy(overrides = {}) {
  return Object.fromEntries(EXISTING_MERGE_FIELDS.map((field) => [field, overrides[field] || "source"]));
}

assert.equal(suggestNormalizedStatus("已完成"), "completed");
assert.equal(suggestNormalizedStatus("已实现"), "completed");
assert.equal(suggestNormalizedStatus("开发中"), "development");
assert.equal(suggestNormalizedStatus("待测试"), "testing");
assert.equal(suggestNormalizedStatus("待分配,已设计"), "scheduling_pending");
assert.equal(suggestNormalizedStatus("待排期"), "scheduling_pending");
assert.equal(suggestNormalizedStatus("待设计"), "design_pending");
assert.equal(suggestNormalizedStatus("暂停"), "paused");
assert.equal(suggestNormalizedStatus("拒绝"), "rejected");
assert.equal(suggestNormalizedStatus("已打回"), "review_pending");
assert.equal(suggestNormalizedStatus(""), "review_pending");
assert.equal(suggestNormalizedStatus("神秘阶段"), null);

const fixture = await buildPitTestWorkbook();
const noCacheFixture = await buildPitTestWorkbook({ includeFormulaWithoutCached: true });
const ambiguousFixture = await buildPitTestWorkbook({ includeAmbiguousHighlight: true });
const mixedSharedStringFixture = await buildPitTestWorkbook({ includeMixedSharedString: true });
const formulaOnlyFixture = await buildPitTestWorkbook({ includeFormulaOnlyWithoutCached: true });
const compressionBombFixture = await buildPitTestWorkbook({ includeCompressionBomb: true });
const blockingDuplicateFixture = await buildPitTestWorkbook({ includeBlockingDuplicate: true });
const pausedFixture = await buildPitTestWorkbook({ includePausedRow: true });

function issuesByCode(parsed, code) {
  return [
    ...parsed.issues,
    ...parsed.rows.flatMap((row) => row.issues),
    ...parsed.highlights.flatMap((highlight) => highlight.issues),
  ].filter((issue) => issue.code === code);
}

const parsed = await parsePitWorkbook(fixture.filePath);
assert.deepEqual(parsed.processedSheets, PIT_STANDARD_SHEETS);
assert.deepEqual(parsed.ignoredSheets, ["原始数据（测试用）"]);
assert.equal(parsed.rows.length, 10);
assert.equal(parsed.rows.some((item) => item.sheetName === "原始数据（测试用）"), false);
assert.equal(JSON.stringify(parsed).includes("删除数据库"), false, "ignored sheet content must not enter parser output");

const valid = parsed.rows.find((item) => item.normalized.jiraTicket === "PIT-100");
assert(valid);
assert.equal(valid.normalized.title, "订单总览");
assert.equal(valid.normalized.description, "收银员需要查看订单");
assert.equal(valid.normalized.plannedYear, 2026);
assert.equal(valid.normalized.plannedMonth, 9);
assert.deepEqual(valid.normalized.productLines, ["Kiosk"]);
assert.deepEqual(valid.normalized.developers, ["张三", "李四", "王五"]);
assert.deepEqual(valid.normalized.testers, ["赵六", "钱七"]);
assert.deepEqual(valid.normalized.mids, ["10001", "10002"]);
assert.equal(valid.raw["研发"], " 张三，李四\n王五 ");
assert.equal(valid.raw["MID"], " 10001，10002\n10001 ");

const serialDate = parsed.rows.find((item) => item.normalized.jiraTicket === "PIT-DATE");
assert.equal(serialDate.normalized.proposedAt, "2024-09-01");
assert.equal(serialDate.normalized.plannedMonth, 10);
const monthPrecision = parsed.rows.find((item) => item.normalized.jiraTicket === "PIT-MONTH");
assert.equal(monthPrecision.normalized.proposedAt, "2026-08-15");
assert.equal(monthPrecision.normalized.plannedYear, 2027);
assert.equal(monthPrecision.normalized.plannedMonth, null);
assert.equal(monthPrecision.normalized.plannedMonthSource, "待排期");

const formulaRow = parsed.rows.find((item) => item.normalized.jiraTicket === "PIT-FORMULA");
assert.equal(formulaRow.normalized.title, "公式缓存标题");
assert.equal(formulaRow.raw["产品需求名称"].formula, "\"不得执行此公式\"");
assert.equal(formulaRow.raw["产品需求名称"].result, " 公式缓存标题 ");
assert.equal(issuesByCode(parsed, "formula_result_missing").length, 0);
const noCacheParsed = await parsePitWorkbook(noCacheFixture.filePath);
const noCacheIssues = issuesByCode(noCacheParsed, "formula_result_missing");
assert.equal(noCacheIssues.length, 1);
assert.equal(noCacheIssues[0].severity, "blocking");
const formulaOnlyParsed = await parsePitWorkbook(formulaOnlyFixture.filePath);
assert.equal(issuesByCode(formulaOnlyParsed, "formula_result_missing").length, 1, "formula-only rows cannot be skipped as blank");
await assert.rejects(
  parsePitWorkbook(compressionBombFixture.filePath),
  (error) => error?.code === "unsafe_workbook_archive",
  "high-compression workbook entries must be rejected before decompression",
);

assert.equal(issuesByCode(parsed, "missing_ticket").length, 1);
assert.equal(issuesByCode(parsed, "duplicate_ticket").length, 2);
assert.equal(parsed.duplicateGroups.length, 1);
assert.equal(parsed.duplicateGroups[0].jiraTicket, "DUP-1");
assert.equal(parsed.duplicateGroups[0].rowIds.length, 2);
assert.deepEqual(parsed.highlights.map((item) => item.match), ["matched"]);
assert.equal(parsed.highlights[0].matchedRowIds.length, 1);
const ambiguousParsed = await parsePitWorkbook(ambiguousFixture.filePath);
assert.equal(issuesByCode(ambiguousParsed, "highlight_ambiguous").length, 1);
assert.equal(ambiguousParsed.highlights.find((item) => item.title === "重复需求").match, "ambiguous");
const mixedSharedStringParsed = await parsePitWorkbook(mixedSharedStringFixture.filePath);
assert.equal(
  mixedSharedStringParsed.rows.find((item) => item.normalized.jiraTicket === "PIT-100").normalized.notes,
  "兼容富文本",
  "Excel-compatible empty direct text before rich-text runs must not break parsing",
);

function seedDictionaries(server, clock) {
  const entries = [
    ...PIT_STANDARD_SHEETS.map((label) => ["product_line", label.toLowerCase(), label]),
    ["requirement_source", "customer_feedback", "客户反馈"],
    ["requirement_type", "feature", "新功能"],
    ["problem_category", "experience", "体验问题"],
    ["industry", "restaurant", "餐饮"],
  ];
  const byKey = new Map();
  let sortOrder = 10;
  for (const [type, code, label] of entries) {
    const id = randomUUID();
    server.db.prepare(`
      INSERT INTO dictionaries (id, type, code, label, sort_order, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, type, code, label, sortOrder, clock.toISOString(), clock.toISOString());
    byKey.set(`${type}|${label}`, id);
    sortOrder += 10;
  }
  return byKey;
}

async function bootstrap(server, token) {
  const response = await server.client.post("/setup/bootstrap", {
    token,
    username: "admin",
    displayName: "Import Admin",
    password: "PIT-import-2026",
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  const login = await server.client.post("/auth/login", {
    username: "admin",
    password: "PIT-import-2026",
  });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  const me = await server.client.get("/auth/me");
  assert.equal(me.status, 200);
  return me.body.data.user;
}

function importFiles(server) {
  const directory = path.join(server.dataDir, "imports");
  return fs.existsSync(directory) ? fs.readdirSync(directory).sort() : [];
}

async function uploadForDecisions(server, workbookPath = fixture.filePath) {
  const response = await server.client.rawWorkbook("/imports/preview", workbookPath);
  assert.equal(response.status, 201, JSON.stringify(response.body));
  const job = response.body.data.job;
  const get = await server.client.get(`/imports/${job.id}?page=1&pageSize=50`);
  assert.equal(get.status, 200, JSON.stringify(get.body));
  return { job, rows: get.body.data.rows, highlights: get.body.data.highlights };
}

async function preparePreview(server, dictionaryIds) {
  const response = await server.client.rawWorkbook("/imports/preview", fixture.filePath);
  assert.equal(response.status, 201, JSON.stringify(response.body));
  const { job } = response.body.data;
  assert(job.id);
  assert.equal(job.status, "previewed");
  assert.equal(job.fileName, path.basename(fixture.filePath));
  assert.equal(job.fileHash, createHash("sha256").update(fs.readFileSync(fixture.filePath)).digest("hex"));
  assert.deepEqual(job.summary, {
    totalRows: 10,
    importableRows: 8,
    missingTicketCount: 1,
    duplicateGroupCount: 1,
    unknownStatusCount: 1,
    unknownDictionaryCount: 1,
    highlightMatches: { matched: 1, ambiguous: 0, unmatched: 0 },
    ignoredSheets: ["原始数据（测试用）"],
    blockingIssueCount: 2,
  });
  assert.equal(importFiles(server).length, 1);
  assert.equal(path.basename(job.sourcePath), `${job.id}.xlsx`);

  const get = await server.client.get(`/imports/${job.id}?page=1&pageSize=50`);
  assert.equal(get.status, 200);
  assert.equal(get.body.data.job.id, job.id);
  assert.equal(get.body.data.rows.length, 10);
  assert.equal(get.body.data.total, 10);
  const list = await server.client.get("/imports");
  assert.equal(list.status, 200);
  assert.equal(list.body.data.items.some((item) => item.id === job.id), true);

  const duplicate = await server.client.rawWorkbook("/imports/preview", fixture.filePath);
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error.code, "duplicate_preview");
  assert.equal(duplicate.body.error.fields.existingImportId, job.id);
  assert.equal(importFiles(server).length, 1);

  const rows = get.body.data.rows;
  const missing = rows.find((item) => item.normalized.jiraTicket === null);
  const validRow = rows.find((item) => item.normalized.jiraTicket === "PIT-100");
  const duplicateRows = rows.filter((item) => item.normalized.jiraTicket === "DUP-1");
  const dateRow = rows.find((item) => item.normalized.jiraTicket === "PIT-DATE");
  const monthRow = rows.find((item) => item.normalized.jiraTicket === "PIT-MONTH");
  assert.equal(duplicateRows.length, 2);
  async function assertRejected(candidate, label) {
    const rejected = await server.client.post(`/imports/${job.id}/decisions`, candidate, { csrf: true });
    assert.equal(rejected.status, 422, `${label}: ${JSON.stringify(rejected.body)}`);
    assert.equal(rejected.body.error.code, "validation_failed", label);
  }
  await assertRejected({
    rows: [{
      rowId: duplicateRows[0].id,
      action: "merge",
      mergeTargetRowId: duplicateRows[1].id,
      fieldPriority: duplicateRows.map((item) => item.id),
    }],
    duplicateGroups: [{ jiraTicket: "DUP-1", action: "keep_separate" }],
  }, "duplicate keep_separate cannot be overridden by row merge");
  await assertRejected({
    rows: [
      { rowId: validRow.id, action: "keep_separate" },
      { rowId: dateRow.id, action: "merge", mergeTargetRowId: validRow.id, fieldPriority: [dateRow.id, validRow.id] },
    ],
  }, "explicit row keep_separate cannot become a merge target");
  await assertRejected({
    rows: [{ rowId: dateRow.id, action: "merge", mergeTargetRowId: monthRow.id }],
  }, "row merge requires exact field priority");
  await assertRejected({
    rows: [
      { rowId: dateRow.id, action: "merge", mergeTargetRowId: monthRow.id, fieldPriority: [dateRow.id, monthRow.id] },
      { rowId: monthRow.id, action: "merge", mergeTargetRowId: dateRow.id, fieldPriority: [monthRow.id, dateRow.id] },
    ],
  }, "merge cycles are rejected");
  await assertRejected({
    rows: [
      { rowId: dateRow.id, action: "merge", mergeTargetRowId: validRow.id, fieldPriority: [dateRow.id, validRow.id] },
      { rowId: monthRow.id, action: "merge", mergeTargetRowId: validRow.id, fieldPriority: [monthRow.id, validRow.id] },
    ],
  }, "many-to-one row merges are rejected");
  await assertRejected({
    rows: [
      { rowId: monthRow.id, action: "skip" },
      { rowId: dateRow.id, action: "merge", mergeTargetRowId: monthRow.id, fieldPriority: [dateRow.id, monthRow.id] },
    ],
  }, "merge target cannot also be skipped");
  const decisions = {
    rows: [
      { rowId: validRow.id, action: "keep_separate" },
      { rowId: missing.id, action: "skip" },
    ],
    duplicateGroups: [{
      jiraTicket: "DUP-1",
      action: "merge",
      targetRowId: duplicateRows[0].id,
      fieldPriority: duplicateRows.map((item) => item.id),
    }],
    statusMappings: [{ source: "神秘阶段", status: "design_pending" }],
    dictionaryMappings: [{
      type: "requirement_type",
      source: "未知类别",
      action: "create",
      label: "未知类别",
    }],
  };
  const saved = await server.client.post(`/imports/${job.id}/decisions`, decisions, { csrf: true });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.data.job.summary.blockingIssueCount, 0);
  assert.deepEqual(saved.body.data.job.decisions.statusMappings, decisions.statusMappings);
  assert.deepEqual(saved.body.data.job.decisions.dictionaryMappings, decisions.dictionaryMappings);
  const persistedRows = server.db.prepare(`
    SELECT id, decision_json FROM import_rows WHERE import_job_id = ? AND decision_json IS NOT NULL
  `).all(job.id);
  assert(persistedRows.some((item) => JSON.parse(item.decision_json).action === "keep_separate"));
  assert(persistedRows.some((item) => JSON.parse(item.decision_json).action === "skip"));
  assert.equal(persistedRows.filter((item) => JSON.parse(item.decision_json).duplicateAction === "merge").length, 2);

  assert(dictionaryIds.get("requirement_type|新功能"));
  return { job, rows, decisions };
}

const FETCH_FORBIDDEN_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79, 87, 95,
  101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137, 139, 143, 161, 179,
  389, 427, 465, 512, 513, 514, 515, 526, 530, 531, 532, 540, 548, 554, 556, 563, 587, 601,
  636, 989, 990, 993, 995, 1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000,
  6566, 6665, 6666, 6667, 6668, 6669, 6697, 10080,
]);

async function startSafeTestServer(options) {
  for (;;) {
    const server = await startPitTestServer(options);
    if (!FETCH_FORBIDDEN_PORTS.has(Number(new URL(server.baseUrl).port))) return server;
    await server.close();
  }
}

const clock = new Date("2026-08-31T08:00:00.000Z");
const main = await startSafeTestServer({
  setupToken: "pit-import-main",
  clock: () => new Date(clock),
});
const rollback = await startSafeTestServer({
  setupToken: "pit-import-rollback",
  clock: () => new Date(clock),
});
const concurrent = await startSafeTestServer({
  setupToken: "pit-import-concurrent",
  clock: () => new Date(clock),
});
const extraServers = [];

async function extraServer(setupToken) {
  const server = await startSafeTestServer({ setupToken, clock: () => new Date(clock) });
  extraServers.push(server);
  return server;
}

try {
  const admin = await bootstrap(main, "pit-import-main");
  const dictionaryIds = seedDictionaries(main, clock);

  const editorCreate = await main.client.post("/users", {
    username: "editor",
    displayName: "Editor",
    password: "PIT-editor-2026",
    role: "editor",
  }, { csrf: true });
  assert.equal(editorCreate.status, 201);

  const wrongMime = await main.client.request("POST", "/imports/preview", {
    rawBody: fs.readFileSync(fixture.filePath),
    csrf: true,
    headers: {
      "content-type": "application/octet-stream",
      "x-pit-file-name": encodeURIComponent("bad.xlsx"),
    },
  });
  assert.equal(wrongMime.status, 415);
  assert.equal(wrongMime.body.error.code, "unsupported_file_type");

  const wrongExtension = await main.client.request("POST", "/imports/preview", {
    rawBody: fs.readFileSync(fixture.filePath),
    csrf: true,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "x-pit-file-name": encodeURIComponent("bad.xls"),
    },
  });
  assert.equal(wrongExtension.status, 415);
  assert.equal(importFiles(main).length, 0);

  const doubleEncoded = await main.client.request("POST", "/imports/preview", {
    rawBody: fs.readFileSync(fixture.filePath),
    csrf: true,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "x-pit-file-name": encodeURIComponent(encodeURIComponent("../bad.xlsx")),
    },
  });
  assert.equal(doubleEncoded.status, 415, "filename must be decoded exactly once");
  assert.equal(importFiles(main).length, 0);

  const oversized = await main.client.request("POST", "/imports/preview", {
    rawBody: Buffer.alloc(50 * 1024 * 1024 + 1),
    csrf: true,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "x-pit-file-name": encodeURIComponent("too-large.xlsx"),
    },
  });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.body.error.code, "file_too_large");
  assert.equal(importFiles(main).length, 0);

  const malformed = await main.client.request("POST", "/imports/preview", {
    rawBody: Buffer.from("PK\u0003\u0004malformed workbook"),
    csrf: true,
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "x-pit-file-name": encodeURIComponent("malformed.xlsx"),
    },
  });
  assert.equal(malformed.status, 422);
  assert.equal(malformed.body.error.code, "import_parse_failed");
  const failedJob = main.db.prepare("SELECT status, source_path, error_message FROM import_jobs WHERE file_name = 'malformed.xlsx'").get();
  assert.equal(failedJob.status, "failed");
  assert.equal(failedJob.source_path, null);
  assert.match(failedJob.error_message, /workbook|zip|parse|解析/i);
  assert.equal(importFiles(main).length, 0, "malformed upload must not leave a partial file");

  const preview = await preparePreview(main, dictionaryIds);
  const beforeCommitBackups = listPitBackups({ db: main.db }).length;
  const committed = await main.client.post(`/imports/${preview.job.id}/commit`, {}, { csrf: true });
  assert.equal(committed.status, 200, JSON.stringify(committed.body));
  assert.equal(committed.body.data.job.status, "committed");
  assert.equal(committed.body.data.importedCount, 8);
  assert.equal(listPitBackups({ db: main.db }).length, beforeCommitBackups + 1);
  assert.equal(listPitBackups({ db: main.db })[0].kind, "pre_import");
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM requirements").get().count, 8);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM requirements WHERE jira_ticket = 'DUP-1'").get().count, 1);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM requirements WHERE is_highlighted = 1").get().count, 1);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM requirement_mids").get().count >= 4, true);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM requirement_assignees WHERE role = 'developer'").get().count >= 3, true);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM requirement_assignees WHERE role = 'tester'").get().count >= 2, true);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM dictionaries WHERE type = 'requirement_type' AND label = '未知类别'").get().count, 1);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'import.commit'").get().count, 1);
  assert.equal(main.db.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'requirement.import'").get().count, 8);
  assert.equal(getSystemSetting(main.db, "initial_import_completed_at"), clock.toISOString());
  assert.equal(main.db.prepare("SELECT source_status FROM requirements WHERE jira_ticket = 'PIT-STATUS'").get().source_status, "神秘阶段");
  assert.equal(main.db.prepare("SELECT status FROM requirements WHERE jira_ticket = 'PIT-STATUS'").get().status, "design_pending");
  assert.equal(main.db.prepare("SELECT title FROM requirements WHERE jira_ticket = 'PIT-FORMULA'").get().title, "公式缓存标题");

  for (const mutation of [
    () => main.client.rawWorkbook("/imports/preview", fixture.filePath),
    () => main.client.post(`/imports/${preview.job.id}/decisions`, preview.decisions, { csrf: true }),
    () => main.client.post(`/imports/${preview.job.id}/commit`, {}, { csrf: true }),
  ]) {
    const response = await mutation();
    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "initial_import_completed");
  }

  const rollbackAdmin = await bootstrap(rollback, "pit-import-rollback");
  const rollbackDictionaries = seedDictionaries(rollback, clock);
  const rollbackPreview = await preparePreview(rollback, rollbackDictionaries);
  rollback.db.exec(`
    CREATE TRIGGER pit_test_reject_import
    BEFORE INSERT ON audit_events
    WHEN NEW.action IN ('requirement.import', 'import.fail')
    BEGIN
      SELECT RAISE(ABORT, 'injected import failure');
    END;
  `);
  const requirementCountBefore = rollback.db.prepare("SELECT count(*) AS count FROM requirements").get().count;
  const dictionaryCountBefore = rollback.db.prepare("SELECT count(*) AS count FROM dictionaries").get().count;
  const failedCommit = await rollback.client.post(`/imports/${rollbackPreview.job.id}/commit`, {}, { csrf: true });
  assert.equal(failedCommit.status, 500);
  assert.equal(failedCommit.body.error.code, "import_commit_failed");
  assert.equal(rollback.db.prepare("SELECT count(*) AS count FROM requirements").get().count, requirementCountBefore);
  assert.equal(rollback.db.prepare("SELECT count(*) AS count FROM dictionaries").get().count, dictionaryCountBefore);
  assert.equal(rollback.db.prepare("SELECT count(*) AS count FROM audit_events WHERE action IN ('requirement.import', 'import.commit')").get().count, 0);
  assert.equal(getSystemSetting(rollback.db, "initial_import_completed_at"), null);
  assert.equal(rollback.db.prepare("SELECT status FROM import_jobs WHERE id = ?").get(rollbackPreview.job.id).status, "failed");
  assert.equal(listPitBackups({ db: rollback.db }).some((item) => item.kind === "pre_import"), true, "pre-import backup survives transaction rollback");
  assert.equal(rollbackAdmin.role, "admin");
  assert.equal(admin.role, "admin");

  await bootstrap(concurrent, "pit-import-concurrent");
  const concurrentDictionaries = seedDictionaries(concurrent, clock);
  const concurrentPreview = await preparePreview(concurrent, concurrentDictionaries);
  const concurrentCommits = await Promise.all([
    concurrent.client.post(`/imports/${concurrentPreview.job.id}/commit`, {}, { csrf: true }),
    concurrent.client.post(`/imports/${concurrentPreview.job.id}/commit`, {}, { csrf: true }),
  ]);
  assert.deepEqual(concurrentCommits.map((item) => item.status).sort((a, b) => a - b), [200, 409]);
  assert.equal(concurrentCommits.find((item) => item.status === 409).body.error.code, "import_commit_in_progress");
  assert.equal(concurrent.db.prepare("SELECT status FROM import_jobs WHERE id = ?").get(concurrentPreview.job.id).status, "committed");
  assert.equal(concurrent.db.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'import.commit'").get().count, 1);

  const summaryServer = await extraServer("pit-import-summary-skip");
  await bootstrap(summaryServer, "pit-import-summary-skip");
  seedDictionaries(summaryServer, clock);
  const summaryPreview = await uploadForDecisions(summaryServer, blockingDuplicateFixture.filePath);
  const summaryMissing = summaryPreview.rows.find((row) => row.normalized.jiraTicket === null);
  const summaryStatus = summaryPreview.rows.find((row) => row.normalized.jiraTicket === "PIT-STATUS");
  const summaryDictionary = summaryPreview.rows.find((row) => row.normalized.jiraTicket === "PIT-DICT");
  const summarySaved = await summaryServer.client.post(`/imports/${summaryPreview.job.id}/decisions`, {
    rows: [summaryMissing, summaryStatus, summaryDictionary].map((row) => ({ rowId: row.id, action: "skip" })),
    duplicateGroups: [{ jiraTicket: "DUP-1", action: "skip" }],
  }, { csrf: true });
  assert.equal(summarySaved.status, 200, JSON.stringify(summarySaved.body));
  assert.equal(summarySaved.body.data.job.summary.blockingIssueCount, 0, "group skip must resolve blocking issues on every group row");
  assert.equal(summarySaved.body.data.job.summary.importableRows, 5, "group skip must remove every group row from importable count");

  const corruptServer = await extraServer("pit-import-corrupt-backup");
  const corruptAdmin = await bootstrap(corruptServer, "pit-import-corrupt-backup");
  const corruptDictionaries = seedDictionaries(corruptServer, clock);
  const corruptPreview = await preparePreview(corruptServer, corruptDictionaries);
  let corruptBackupRecord;
  const corruptService = createPitImportService({
    db: corruptServer.db,
    config: { dataDir: corruptServer.dataDir },
    clock: () => new Date(clock),
    backupService: async (options) => {
      corruptBackupRecord = await createPitBackup(options);
      const resolved = resolvePitBackupDownload({
        db: corruptServer.db,
        config: { dataDir: corruptServer.dataDir },
        id: corruptBackupRecord.id,
      });
      fs.appendFileSync(resolved.filePath, Buffer.from("corrupt-after-manifest"));
      return corruptBackupRecord;
    },
  });
  await assert.rejects(
    corruptService.commit(corruptPreview.job.id, corruptAdmin),
    (error) => error?.status === 500 && error?.code === "pre_import_backup_failed",
  );
  assert.equal(corruptServer.db.prepare("SELECT count(*) AS count FROM requirements").get().count, 0);
  assert.equal(getSystemSetting(corruptServer.db, "initial_import_completed_at"), null);
  assert.equal(corruptServer.db.prepare("SELECT status FROM import_jobs WHERE id = ?").get(corruptPreview.job.id).status, "previewed");
  assert(corruptServer.db.prepare("SELECT 1 FROM backup_records WHERE id = ?").get(corruptBackupRecord.id));
  assert(fs.existsSync(resolvePitBackupDownload({
    db: corruptServer.db,
    config: { dataDir: corruptServer.dataDir },
    id: corruptBackupRecord.id,
  }).filePath), "failed verification must retain backup for diagnosis");

  const decisionRaceServer = await extraServer("pit-import-decision-race");
  const decisionRaceAdmin = await bootstrap(decisionRaceServer, "pit-import-decision-race");
  const decisionRaceDictionaries = seedDictionaries(decisionRaceServer, clock);
  const decisionRacePreview = await preparePreview(decisionRaceServer, decisionRaceDictionaries);
  let releaseBackup;
  const backupRelease = new Promise((resolve) => { releaseBackup = resolve; });
  let backupStarted;
  const backupStart = new Promise((resolve) => { backupStarted = resolve; });
  let snapshotBackup;
  const decisionRaceService = createPitImportService({
    db: decisionRaceServer.db,
    config: { dataDir: decisionRaceServer.dataDir },
    clock: () => new Date(clock),
    backupService: async (options) => {
      snapshotBackup = await createPitBackup(options);
      backupStarted();
      await backupRelease;
      return snapshotBackup;
    },
  });
  const racingCommit = decisionRaceService.commit(decisionRacePreview.job.id, decisionRaceAdmin);
  await backupStart;
  assert.equal(decisionRaceServer.db.prepare("SELECT status FROM import_jobs WHERE id = ?").get(decisionRacePreview.job.id).status, "previewed");
  const snapshotPath = resolvePitBackupDownload({
    db: decisionRaceServer.db,
    config: { dataDir: decisionRaceServer.dataDir },
    id: snapshotBackup.id,
  }).filePath;
  const snapshotDb = new DatabaseSync(snapshotPath, { readOnly: true });
  try {
    assert.equal(snapshotDb.prepare("SELECT status FROM import_jobs WHERE id = ?").get(decisionRacePreview.job.id).status, "previewed");
    assert.equal(snapshotDb.prepare("SELECT count(*) AS count FROM audit_events WHERE action = 'import.commit.claim'").get().count, 0);
  } finally {
    snapshotDb.close();
  }
  assert.throws(
    () => decisionRaceService.saveDecisions(decisionRacePreview.job.id, decisionRacePreview.decisions, decisionRaceAdmin),
    (error) => error?.status === 409 && error?.code === "import_commit_in_progress",
  );
  releaseBackup();
  const decisionRaceCommitted = await racingCommit;
  assert.equal(decisionRaceCommitted.job.status, "committed");

  const previewRaceServer = await extraServer("pit-import-preview-race");
  const previewRaceAdmin = await bootstrap(previewRaceServer, "pit-import-preview-race");
  const previewRaceDictionaries = seedDictionaries(previewRaceServer, clock);
  const existingCommit = await preparePreview(previewRaceServer, previewRaceDictionaries);
  let releaseParser;
  const parserRelease = new Promise((resolve) => { releaseParser = resolve; });
  let parserStarted;
  const parserStart = new Promise((resolve) => { parserStarted = resolve; });
  const previewRaceService = createPitImportService({
    db: previewRaceServer.db,
    config: { dataDir: previewRaceServer.dataDir },
    clock: () => new Date(clock),
    workbookParser: async (filePath) => {
      parserStarted();
      await parserRelease;
      return parsePitWorkbook(filePath);
    },
  });
  const racingPreview = previewRaceService.preview({
    fileName: "racing.xlsx",
    bytes: fs.readFileSync(ambiguousFixture.filePath),
  }, previewRaceAdmin);
  await parserStart;
  const lockingCommit = await previewRaceServer.client.post(`/imports/${existingCommit.job.id}/commit`, {}, { csrf: true });
  assert.equal(lockingCommit.status, 200, JSON.stringify(lockingCommit.body));
  releaseParser();
  await assert.rejects(racingPreview, (error) => error?.status === 409 && error?.code === "initial_import_completed");
  const racingJob = previewRaceServer.db.prepare("SELECT status, source_path FROM import_jobs WHERE file_name = 'racing.xlsx'").get();
  assert.equal(racingJob.status, "failed");
  assert.equal(racingJob.source_path, null);
  assert.equal(previewRaceServer.db.prepare("SELECT count(*) AS count FROM import_rows WHERE import_job_id = (SELECT id FROM import_jobs WHERE file_name = 'racing.xlsx')").get().count, 0);
  assert.equal(importFiles(previewRaceServer).includes("racing.xlsx"), false);

  const existingServer = await extraServer("pit-import-existing-merge");
  const existingAdmin = await bootstrap(existingServer, "pit-import-existing-merge");
  const existingDictionaries = seedDictionaries(existingServer, clock);
  const existingCreated = await existingServer.client.post("/requirements", {
    jiraTicket: "OLD-1",
    title: "旧标题",
    description: "旧描述",
    useCase: "旧场景",
    notes: "必须保留的旧说明",
    priority: "low",
    requirementTypeId: existingDictionaries.get("requirement_type|新功能"),
    sourceId: existingDictionaries.get("requirement_source|客户反馈"),
    problemCategoryId: existingDictionaries.get("problem_category|体验问题"),
    industryId: existingDictionaries.get("industry|餐饮"),
    customerManager: "旧客户经理",
    implementationSide: "backend",
    proposedAt: "2025-01-01",
    plannedYear: 2025,
    plannedMonth: 1,
    versionNo: "old-version",
    developmentStartedAt: "2025-01-02",
    developmentCompletedAt: "2025-01-03",
    posMergeVersion: "old-pos",
    isHighlighted: false,
    productLineIds: [existingDictionaries.get("product_line|E-Menu")],
    mids: ["OLD-MID"],
    assignees: [
      { role: "owner", userId: existingAdmin.id, displayName: existingAdmin.displayName },
      { role: "developer", userId: null, displayName: "Old Developer" },
      { role: "tester", userId: null, displayName: "Old Tester" },
    ],
  }, { csrf: true });
  assert.equal(existingCreated.status, 201, JSON.stringify(existingCreated.body));
  const existingId = existingCreated.body.data.requirement.id;
  existingServer.db.prepare("UPDATE requirements SET status = 'completed' WHERE id = ?").run(existingId);
  const existingPreview = await uploadForDecisions(existingServer);
  const existingSource = existingPreview.rows.find((row) => row.normalized.jiraTicket === "PIT-100");
  const existingDuplicates = existingPreview.rows.filter((row) => row.normalized.jiraTicket === "DUP-1");
  const existingOtherRows = existingPreview.rows.filter((row) => row.id !== existingSource.id && !existingDuplicates.some((dup) => dup.id === row.id));
  const missingStrategy = await existingServer.client.post(`/imports/${existingPreview.job.id}/decisions`, {
    rows: [{ rowId: existingSource.id, action: "merge", existingRequirementId: existingId }],
  }, { csrf: true });
  assert.equal(missingStrategy.status, 422);
  const skippedHighlight = await existingServer.client.post(`/imports/${existingPreview.job.id}/decisions`, {
    rows: existingPreview.rows.filter((row) => !existingDuplicates.some((dup) => dup.id === row.id))
      .map((row) => ({ rowId: row.id, action: "skip" })),
    duplicateGroups: [{ jiraTicket: "DUP-1", action: "skip" }],
  }, { csrf: true });
  assert.equal(skippedHighlight.status, 422, "an auto-matched highlight target cannot be silently skipped");
  const existingFieldStrategy = mergeStrategy({ notes: "existing", industry: "existing", testers: "existing" });
  const existingSaved = await existingServer.client.post(`/imports/${existingPreview.job.id}/decisions`, {
    rows: [
      { rowId: existingSource.id, action: "merge", existingRequirementId: existingId, fieldStrategy: existingFieldStrategy },
      ...existingOtherRows.map((row) => ({ rowId: row.id, action: "skip" })),
    ],
    duplicateGroups: [{ jiraTicket: "DUP-1", action: "skip" }],
  }, { csrf: true });
  assert.equal(existingSaved.status, 200, JSON.stringify(existingSaved.body));
  assert.equal(existingSaved.body.data.job.summary.blockingIssueCount, 0);
  assert.equal(existingSaved.body.data.job.summary.importableRows, 1);
  const existingCommitted = await existingServer.client.post(`/imports/${existingPreview.job.id}/commit`, {}, { csrf: true });
  assert.equal(existingCommitted.status, 200, JSON.stringify(existingCommitted.body));
  assert.equal(existingCommitted.body.data.insertedCount, 0);
  const mergedExisting = existingServer.db.prepare("SELECT * FROM requirements WHERE id = ?").get(existingId);
  assert.equal(mergedExisting.jira_ticket, "PIT-100");
  assert.equal(mergedExisting.title, "订单总览");
  assert.equal(mergedExisting.description, "收银员需要查看订单");
  assert.equal(mergedExisting.notes, "必须保留的旧说明");
  assert.equal(mergedExisting.status, "review_pending");
  assert.equal(mergedExisting.priority, "high");
  assert.equal(mergedExisting.industry_id, existingDictionaries.get("industry|餐饮"));
  assert.equal(mergedExisting.is_highlighted, 1, "highlight must propagate into an existing merge target");
  assert.deepEqual(existingServer.db.prepare(`
    SELECT dictionary_id FROM requirement_product_lines WHERE requirement_id = ? ORDER BY dictionary_id
  `).all(existingId).map((row) => row.dictionary_id), [existingDictionaries.get("product_line|Kiosk")]);
  assert.deepEqual(existingServer.db.prepare("SELECT mid FROM requirement_mids WHERE requirement_id = ? ORDER BY mid").all(existingId).map((row) => row.mid), ["10001", "10002"]);
  assert.deepEqual(existingServer.db.prepare(`
    SELECT display_name FROM requirement_assignees WHERE requirement_id = ? AND role = 'developer' ORDER BY sort_order
  `).all(existingId).map((row) => row.display_name), ["张三", "李四", "王五"]);
  assert.deepEqual(existingServer.db.prepare(`
    SELECT display_name FROM requirement_assignees WHERE requirement_id = ? AND role = 'tester' ORDER BY sort_order
  `).all(existingId).map((row) => row.display_name), ["Old Tester"]);
  assert.deepEqual(existingServer.db.prepare(`
    SELECT display_name FROM requirement_assignees WHERE requirement_id = ? AND role = 'owner' ORDER BY sort_order
  `).all(existingId).map((row) => row.display_name), [existingAdmin.displayName]);
  const existingAudit = existingServer.db.prepare(`
    SELECT after_json, metadata_json FROM audit_events WHERE action = 'requirement.import' AND resource_id = ?
  `).get(existingId);
  const existingAuditAfter = JSON.parse(existingAudit.after_json);
  assert.equal(existingAuditAfter.title, "订单总览");
  assert.equal(existingAuditAfter.notes, "必须保留的旧说明");
  assert.equal(existingAuditAfter.status, "review_pending");
  assert.deepEqual(existingAuditAfter.relations.mids, ["10001", "10002"]);
  assert.deepEqual(JSON.parse(existingAudit.metadata_json).fieldStrategy, existingFieldStrategy);

  const highlightMergeServer = await extraServer("pit-import-highlight-row-merge");
  await bootstrap(highlightMergeServer, "pit-import-highlight-row-merge");
  seedDictionaries(highlightMergeServer, clock);
  const highlightPreview = await uploadForDecisions(highlightMergeServer);
  const highlightSource = highlightPreview.rows.find((row) => row.normalized.jiraTicket === "PIT-100");
  const highlightTarget = highlightPreview.rows.find((row) => row.normalized.jiraTicket === "PIT-DATE");
  const highlightDuplicates = highlightPreview.rows.filter((row) => row.normalized.jiraTicket === "DUP-1");
  const highlightSaved = await highlightMergeServer.client.post(`/imports/${highlightPreview.job.id}/decisions`, {
    rows: [
      {
        rowId: highlightSource.id,
        action: "merge",
        mergeTargetRowId: highlightTarget.id,
        fieldPriority: [highlightSource.id, highlightTarget.id],
      },
      ...highlightPreview.rows.filter((row) => ![highlightSource.id, highlightTarget.id].includes(row.id)
        && !highlightDuplicates.some((dup) => dup.id === row.id)).map((row) => ({ rowId: row.id, action: "skip" })),
    ],
    duplicateGroups: [{ jiraTicket: "DUP-1", action: "skip" }],
  }, { csrf: true });
  assert.equal(highlightSaved.status, 200, JSON.stringify(highlightSaved.body));
  assert.equal(highlightSaved.body.data.job.summary.blockingIssueCount, 0);
  const highlightCommitted = await highlightMergeServer.client.post(`/imports/${highlightPreview.job.id}/commit`, {}, { csrf: true });
  assert.equal(highlightCommitted.status, 200, JSON.stringify(highlightCommitted.body));
  assert.equal(highlightMergeServer.db.prepare("SELECT count(*) AS count FROM requirements").get().count, 1);
  assert.equal(highlightMergeServer.db.prepare("SELECT is_highlighted FROM requirements").get().is_highlighted, 1);

  const pausedServer = await extraServer("pit-import-paused-resume");
  const pausedAdmin = await bootstrap(pausedServer, "pit-import-paused-resume");
  const pausedDictionaries = seedDictionaries(pausedServer, clock);
  const pausedExistingResponse = await pausedServer.client.post("/requirements", {
    jiraTicket: "PAUSED-OLD",
    title: "existing paused merge target",
    description: "existing",
    requirementTypeId: pausedDictionaries.get("requirement_type|新功能"),
    sourceId: pausedDictionaries.get("requirement_source|客户反馈"),
    problemCategoryId: pausedDictionaries.get("problem_category|体验问题"),
    isHighlighted: false,
    productLineIds: [pausedDictionaries.get("product_line|云报表")],
    mids: [],
    assignees: [{ role: "owner", userId: pausedAdmin.id, displayName: pausedAdmin.displayName }],
  }, { csrf: true });
  assert.equal(pausedExistingResponse.status, 201, JSON.stringify(pausedExistingResponse.body));
  const pausedExistingId = pausedExistingResponse.body.data.requirement.id;
  const pausedPreview = await uploadForDecisions(pausedServer, pausedFixture.filePath);
  const pausedRow = pausedPreview.rows.find((row) => row.normalized.jiraTicket === "PIT-MONTH");
  const pausedMergeRow = pausedPreview.rows.find((row) => row.normalized.jiraTicket === "PIT-DATE");
  const pausedDuplicates = pausedPreview.rows.filter((row) => row.normalized.jiraTicket === "DUP-1");
  const pausedSaved = await pausedServer.client.post(`/imports/${pausedPreview.job.id}/decisions`, {
    rows: [
      {
        rowId: pausedMergeRow.id,
        action: "merge",
        existingRequirementId: pausedExistingId,
        fieldStrategy: mergeStrategy(),
      },
      ...pausedPreview.rows.filter((row) => ![pausedRow.id, pausedMergeRow.id].includes(row.id)
        && !pausedDuplicates.some((dup) => dup.id === row.id)).map((row) => ({ rowId: row.id, action: "skip" })),
    ],
    duplicateGroups: [{ jiraTicket: "DUP-1", action: "skip" }],
    highlights: [{ rowNumber: 2, action: "skip" }],
  }, { csrf: true });
  assert.equal(pausedSaved.status, 200, JSON.stringify(pausedSaved.body));
  assert.equal(pausedSaved.body.data.job.summary.blockingIssueCount, 0);
  const pausedCommitted = await pausedServer.client.post(`/imports/${pausedPreview.job.id}/commit`, {}, { csrf: true });
  assert.equal(pausedCommitted.status, 200, JSON.stringify(pausedCommitted.body));
  assert.equal(pausedCommitted.body.data.insertedCount, 1);
  const importedPausedRows = pausedServer.db.prepare(`
    SELECT id, jira_ticket, status, paused_from_status, row_version FROM requirements ORDER BY jira_ticket
  `).all();
  assert.deepEqual(importedPausedRows.map((row) => row.jira_ticket), ["PIT-DATE", "PIT-MONTH"]);
  for (const importedPaused of importedPausedRows) {
    assert.equal(importedPaused.status, "paused");
    assert.equal(importedPaused.paused_from_status, "review_pending");
    const resumed = await pausedServer.client.post(`/requirements/${importedPaused.id}/transitions`, {
      action: "resume",
      reason: "import baseline verified",
      rowVersion: importedPaused.row_version,
    }, { csrf: true });
    assert.equal(resumed.status, 200, JSON.stringify(resumed.body));
    assert.equal(resumed.body.data.requirement.status, "review_pending");
    assert.equal(resumed.body.data.requirement.pausedFromStatus, null);
  }

  console.log("PIT import verification passed");
} finally {
  await Promise.allSettled([main.close(), rollback.close(), concurrent.close(), ...extraServers.map((server) => server.close())]);
  fixture.cleanup();
  noCacheFixture.cleanup();
  ambiguousFixture.cleanup();
  mixedSharedStringFixture.cleanup();
  formulaOnlyFixture.cleanup();
  compressionBombFixture.cleanup();
  blockingDuplicateFixture.cleanup();
  pausedFixture.cleanup();
}
