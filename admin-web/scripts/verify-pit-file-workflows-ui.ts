import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PitApiError } from "../src/pit/pit-api-error";
import { PIT_IMPORT_ACCEPT, PIT_IMPORT_MAX_BYTES, createPitSingleFlight, isPitInitialImportLocked, loadPitImportDecisionWorkset, mergePitImportDecisions, movePitPriority, orderedPitDuplicateRows, renderPitImportPage, validatePitImportFile } from "../src/pit/pit-import-page";
import { canDownloadPitExport, pitExportFilterFromPath, renderPitExportPage } from "../src/pit/pit-export-page";
import { publicPitBackup, renderPitBackupPage } from "../src/pit/pit-backup-page";
import { pitDownloadFileName } from "../src/pit/pit-file-workflow-ui";
import type { PitBackupRecord, PitExportJob, PitImportDetail, PitImportJob, PitUser } from "../src/pit/pit-types";

const user: PitUser = { id: "u1", username: "admin", displayName: "管理员 <script>", role: "admin", active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
const summary = { totalRows: 12, importableRows: 10, missingTicketCount: 1, duplicateGroupCount: 1, unknownStatusCount: 1, unknownDictionaryCount: 1, highlightMatches: { matched: 1, ambiguous: 0, unmatched: 1 }, ignoredSheets: ["说明"], blockingIssueCount: 3 };
const job: PitImportJob = { id: "i1", fileName: "需求<script>.xlsx", fileHash: "hash", status: "previewed", summary, decisions: {}, sourcePath: null, createdBy: "u1", createdAt: "2026-08-31T00:00:00Z", committedAt: null, errorMessage: null };
const detail: PitImportDetail = { job, page: 1, pageSize: 100, total: 1, rows: [{ id: "r1", sheetName: "需求池<script>", rowNumber: 8, raw: {}, normalized: { jiraTicket: null, title: "标题<script>", description: "", useCase: null, notes: null, requirementSource: null, requirementType: null, industry: null, customerManager: null, sourceStatus: "", statusSuggestion: null, productLines: [], implementationSide: null, developers: [], testers: [], priority: null, problemCategory: null, mids: [], versionNo: null, proposedAt: null, plannedYear: null, plannedMonth: null, developmentStartedAt: null, developmentCompletedAt: null, posMergeVersion: null }, issues: [{ code: "missing_title", severity: "blocking" }] }], issues: [
  { code: "unknown_status", severity: "blocking", message: "未知 <状态>", sourceValue: "研发<script>" },
  { code: "unknown_dictionary", severity: "blocking", sourceValue: "餐饮<业态>", dictionaryType: "industry" },
  { code: "missing_ticket", severity: "warning", message: "缺少 ticket" },
], duplicateGroups: [{ jiraTicket: "PIT-1<script>", rowIds: ["r1", "r2"] }], highlights: [{ rowNumber: 3, match: "unmatched", matchedRowIds: [], issues: [{ code: "highlight_unmatched", severity: "blocking" }] }] };

assert.equal(PIT_IMPORT_ACCEPT, ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
assert.equal(PIT_IMPORT_MAX_BYTES, 20 * 1024 * 1024);
assert.equal(validatePitImportFile({ name: "pool.xls", size: 1 }), "仅支持 .xlsx 工作簿");
assert.equal(validatePitImportFile({ name: "pool.XLSX", size: PIT_IMPORT_MAX_BYTES }), null);
assert.equal(validatePitImportFile({ name: "pool.xlsx", size: PIT_IMPORT_MAX_BYTES + 1 }), "工作簿不能超过 20 MiB");

const decisions = mergePitImportDecisions(
  { duplicateGroups: [{ jiraTicket: "PIT-1", action: "skip" }], statusMappings: [{ source: "研发", status: "development" }] },
  { duplicateGroups: [{ jiraTicket: "PIT-1", action: "merge", targetRowId: "r1" }], dictionaryMappings: [{ type: "industry", source: "餐饮", action: "create" }] },
);
assert.equal(decisions.duplicateGroups?.length, 1);
assert.equal(decisions.duplicateGroups?.[0].action, "merge");
assert.equal(decisions.statusMappings?.[0].status, "development");
assert.equal(decisions.dictionaryMappings?.[0].action, "create");
assert.deepEqual(orderedPitDuplicateRows(["r1", "r2", "r3"], ["r3", "r1", "r2"]), ["r3", "r1", "r2"]);
assert.deepEqual(movePitPriority(["r1", "r2", "r3"], "r2", -1), ["r2", "r1", "r3"]);

const makeRow = (index: number) => ({ ...detail.rows[0], id: `row-${index}`, rowNumber: index, issues: index === 125 ? [{ code: "unknown_status", severity: "blocking" as const, sourceValue: "后页状态" }, { code: "unknown_dictionary", severity: "blocking" as const, sourceValue: "后页业态", dictionaryType: "industry" as const }, { code: "missing_title", severity: "blocking" as const }] : [] });
const allRows = Array.from({ length: 150 }, (_, index) => makeRow(index + 1));
const pages: number[] = []; let loadingProgress = 0;
const workset = await loadPitImportDecisionWorkset({ getImport: async (_id, query) => { const page = query.page ?? 1; pages.push(page); const start = (page - 1) * 100; return { ...detail, rows: allRows.slice(start, start + 100), page, pageSize: 100, total: 150, issues: [], duplicateGroups: [{ jiraTicket: "PIT-SPAN", rowIds: ["row-50", "row-125"] }] }; } } as never, "i1", undefined, (loaded) => { loadingProgress = loaded; });
assert.deepEqual(pages, [1, 2], "decision workset must read pages sequentially");
assert.equal(loadingProgress, 150); assert.equal(workset.rows.length, 150);
assert.ok(workset.issues.some((issue) => issue.sourceValue === "后页状态"));
assert.deepEqual(workset.duplicateGroups[0].rowIds, ["row-50", "row-125"], "cross-page duplicate groups remain complete");
const afterPage100Html = renderPitImportPage({ user, items: [job], detail: { ...workset, job: { ...job, summary: { ...summary, blockingIssueCount: 3 } } }, dictionaries: [] });
assert.ok(afterPage100Html.includes("后页状态") && afterPage100Html.includes("后页业态") && afterPage100Html.includes('data-pit-row-action="row-125"'), "actionable controls after row 100 must render");
await assert.rejects(() => loadPitImportDecisionWorkset({ getImport: async () => ({ ...detail, page: 1, pageSize: 0, total: 150 }) } as never, "bad"), /安全范围/);
await assert.rejects(() => loadPitImportDecisionWorkset({ getImport: async () => ({ ...detail, page: 1, pageSize: 100, total: 250_001 }) } as never, "huge"), /安全范围/);
let activeSaves = 0; let maxConcurrentSaves = 0; let saveCalls = 0; let openCalls = 0; let acceptedGeneration = 0; let releaseSave!: () => void;
const saveGate = new Promise<void>((resolve) => { releaseSave = resolve; });
const operationGate = createPitSingleFlight(async (operation: "save" | "open") => { acceptedGeneration += 1; if (operation === "open") { openCalls += 1; return operation; } saveCalls += 1; activeSaves += 1; maxConcurrentSaves = Math.max(maxConcurrentSaves, activeSaves); await saveGate; activeSaves -= 1; return operation; });
const firstSave = operationGate("save"); const generationWhileSaving = acceptedGeneration; const rejectedOpen = await operationGate("open");
assert.equal(rejectedOpen, undefined, "open/workset cannot dispatch while save+refresh owns the gate"); assert.equal(openCalls, 0); assert.equal(acceptedGeneration, generationWhileSaving, "rejected operation cannot advance generation"); assert.equal(saveCalls, 1); assert.equal(maxConcurrentSaves, 1); releaseSave(); assert.equal(await firstSave, "save"); assert.equal(await operationGate("open"), "open"); assert.equal(openCalls, 1);

const previewHtml = renderPitImportPage({ user, items: [job], detail, dictionaries: [{ id: "d1", type: "industry", code: "food", label: "餐饮", sortOrder: 1, active: true, createdAt: "", updatedAt: "" }], progress: 47, busy: "upload", issueFilter: "blocking" });
for (const marker of ["data-pit-import-file", "上传 47%", "来源行", "可导入", "重复组", "未知状态", "未处理阻断", "data-pit-duplicate", "data-pit-duplicate-target", "data-pit-status-source", "data-pit-dictionary-source", "data-pit-dictionary-target", "data-pit-row-action", "data-pit-highlight-action", "保存决策", "确认提交导入"]) assert.ok(previewHtml.includes(marker), marker);
assert.ok(previewHtml.includes("disabled"), "commit remains disabled while blockers exist");
assert.ok(!previewHtml.includes("<script>"), "workbook content must be escaped");
assert.equal(isPitInitialImportLocked([job]), false);
const committed = { ...job, status: "committed", committedAt: "2026-09-01T00:00:00Z", decisions: { ...decisions, rows: [{ rowId: "r1", action: "merge" as const, mergeTargetRowId: "r2", fieldPriority: ["r1", "r2"] }], duplicateGroups: [{ jiraTicket: "PIT-1", action: "merge" as const, targetRowId: "r2", fieldPriority: ["r2", "r1"] }], highlights: [{ rowNumber: 3, action: "match" as const, targetRowId: "r2" }] } };
assert.equal(isPitInitialImportLocked([committed]), true);
const lockedHtml = renderPitImportPage({ user, items: [committed], detail: { ...detail, job: committed } });
assert.ok(lockedHtml.includes("首次导入已完成") && lockedHtml.includes("data-pit-import-locked"));
assert.ok(!lockedHtml.includes("data-pit-import-file") && !lockedHtml.includes("data-pit-import-upload"));
for (const value of ["主记录 r2", "字段优先顺序 r2 → r1", "高亮第 3 行", "match → r2", "映射为 development", "create"]) assert.ok(lockedHtml.includes(value), value);
assert.ok(!lockedHtml.includes("<select") && !lockedHtml.includes("data-pit-save-") && !lockedHtml.includes("data-pit-import-commit"), "locked history is display-only");
const conflict = new PitApiError(409, { code: "initial_import_completed", message: "首次导入已完成" });
assert.equal(conflict.status, 409); assert.equal(conflict.code, "initial_import_completed");

const filter = pitExportFilterFromPath("/pit/exports?q=pay&status=development&productLine=pos&page=9&pageSize=100&sort=-priority&highlighted=true");
assert.deepEqual(filter, { q: "pay", productLine: ["pos"], status: ["development"], highlighted: true, sort: "-priority" });
const exportJob: PitExportJob = { id: "e1", filter, rowCount: 8, fileName: "private-name.xlsx", status: "completed", errorMessage: null, createdBy: "u1", createdAt: "2026-08-31T00:00:00Z", completedAt: "2026-08-31T00:01:00Z", expiresAt: "2099-01-01T00:00:00Z", expired: false, downloadable: true };
assert.equal(canDownloadPitExport(exportJob, new Date("2026-09-01")), true);
assert.equal(canDownloadPitExport({ ...exportJob, expired: true }, new Date("2026-09-01")), false);
const exportHtml = renderPitExportPage({ user, items: [exportJob], scope: "all", currentFilter: filter });
assert.ok(exportHtml.includes("导出当前筛选") && exportHtml.includes("全部用户") && exportHtml.includes("data-pit-export-download"));
assert.ok(!renderPitExportPage({ user: { ...user, role: "viewer" }, items: [] }).includes("全部用户"), "viewer cannot request all-user scope");
const expiredHtml = renderPitExportPage({ user, items: [{ ...exportJob, expired: true, downloadable: false }] });
assert.ok(expiredHtml.includes("已过期") && expiredHtml.includes("data-pit-export-regenerate"));

const backup: PitBackupRecord = { id: "b1", kind: "manual", fileName: "C:\\secret\\pit.sqlite3", manifestName: "C:\\secret\\pit.json", sha256: "a".repeat(64), byteSize: 2048, schemaVersion: 1, createdBy: "u1", createdAt: "2026-09-01T00:00:00Z" };
assert.deepEqual(Object.keys(publicPitBackup(backup)).sort(), ["byteSize", "createdAt", "createdBy", "id", "kind", "schemaVersion", "sha256"].sort());
const backupHtml = renderPitBackupPage({ user, items: [backup], busy: true });
assert.ok(backupHtml.includes("正在创建") && backupHtml.includes("2.0 KB") && backupHtml.includes("data-pit-backup-download"));
assert.ok(!backupHtml.includes("secret") && !backupHtml.includes("fileName") && !backupHtml.includes("manifestName"), "physical paths/names must not be exposed");
assert.ok(renderPitBackupPage({ user: { ...user, role: "viewer" } }).includes("无权访问"));

const importSource = readFileSync(new URL("../src/pit/pit-import-page.ts", import.meta.url), "utf8");
const exportSource = readFileSync(new URL("../src/pit/pit-export-page.ts", import.meta.url), "utf8");
const backupSource = readFileSync(new URL("../src/pit/pit-backup-page.ts", import.meta.url), "utf8");
const shellSource = readFileSync(new URL("../src/pit/pit-shell.ts", import.meta.url), "utf8");
assert.ok(importSource.includes("XMLHttpRequest") && importSource.includes("xhr.upload.onprogress"), "raw workbook upload must expose progress");
assert.ok(importSource.includes("controller.abort()") && exportSource.includes("controller.abort()") && backupSource.includes("controller.abort()"), "page lifetimes must abort in-flight work");
assert.ok(importSource.includes('e.status === 409') && importSource.includes('e.code === "initial_import_completed"'), "409 lock must switch immediately");
assert.ok(importSource.includes("stopImmediatePropagation") && importSource.includes("decisionControls") && importSource.includes("control.disabled = true"), "decision controls must be single-flight disabled while saving/refreshing");
assert.ok(importSource.includes("const runExclusive = createPitSingleFlight") && importSource.includes("void runExclusive(load)"), "production page must use one shared gate for bootstrap and every async trigger");
assert.ok(!importSource.includes("window.confirm") && importSource.includes("data-pit-import-confirm-dialog"), "commit confirmation must use an accessible in-app dialog");
for (const marker of ["aria-modal=\"true\"", "inert aria-hidden", "queueMicrotask", 'event.key === "Escape"', 'event.key !== "Tab"', "event.shiftKey", "fieldPriority"]) assert.ok(importSource.includes(marker), marker);
assert.ok(shellSource.includes("bindPitImportPage") && shellSource.includes("bindPitExportPage") && shellSource.includes("bindPitBackupPage"));
assert.ok(exportSource.includes("job.filter") && exportSource.includes("scope === \"all\""));
assert.ok(backupSource.includes("if (busy) return"), "manual backup is single-flight");
assert.equal(pitDownloadFileName("attachment; filename*=UTF-8''..%2Fsecret.xlsx", "fallback.xlsx"), "_secret.xlsx");
assert.equal(pitDownloadFileName("attachment; filename*=UTF-8''%E0%A4%A", "fallback.xlsx"), "fallback.xlsx");
assert.ok(readFileSync(new URL("../src/pit/pit-file-workflow-ui.ts", import.meta.url), "utf8").includes("setTimeout(() => URL.revokeObjectURL(url), 1_000)"));

console.log("PIT file workflow UI verification passed.");
