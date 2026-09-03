import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";

const required = {
  distribution: ["data-team-tips-view=\"distribution\"", "dailySummaryList", "emailModal"],
  details: ["data-team-tips-view=\"details\"", "detailMain", "formulaModal"],
  rules: ["data-team-tips-view=\"rules\"", "rulesTableBody", "poolTypeModal"],
  "rule-editor": ["data-team-tips-view=\"rule-editor\"", "ruleEditorMain", "fieldDescModal", "salesDrawer"],
  "employee-reconciliation": ["data-team-tips-view=\"employee-reconciliation\"", "employeeDetailRows", "employeeDetailEmpty"],
};
const failures = [];
const pageCss = fs.readFileSync("src/team/tips/tips-page.css", "utf8");
const sourceCss = fs.readFileSync("dist/TipOut/prototype-fidelity.css", "utf8");
const ruleEditorContentCss = pageCss.match(/\.tipout-page-rule-editor \.content-area\s*\{([^}]*)\}/)?.[1] ?? "";
for (const token of ["width: min(100%, 1280px)", "margin-inline: auto", "align-items: stretch"]) {
  if (!ruleEditorContentCss.includes(token)) failures.push(`rule-editor centered layout missing ${token}`);
}
for (const [view, tokens] of Object.entries(required)) {
  const template = fs.readFileSync(`src/team/tips/templates/${view}.html`, "utf8");
  const program = fs.readFileSync(`src/team/tips/programs/${view}.js.txt`, "utf8");
  for (const token of tokens) if (!template.includes(token)) failures.push(`${view}: missing ${token}`);
  for (const forbidden of ["<html", "<body", "<script", "<link", " onclick=", " onchange=", "href=\"javascript:", "href=\"index.html", "href=\"rules.html"]) {
    if (template.toLowerCase().includes(forbidden)) failures.push(`${view}: forbidden template token ${forbidden}`);
  }
  if (!program.trim()) failures.push(`${view}: page program is empty`);
  if (view === "rule-editor" && (template.includes("ruleEditorContextRail") || template.includes("tipout-workspace has-aside"))) {
    failures.push("rule-editor: removed context summary rail returned");
  }
}

const sourceDetail = fs.readFileSync("dist/TipOut/detail.html", "utf8");
const nativeDetail = fs.readFileSync("src/team/tips/templates/details.html", "utf8");
const nativeDetailProgram = fs.readFileSync("src/team/tips/programs/details.js.txt", "utf8");
for (const token of ["detailContextRail", "tipout-workspace has-aside", "renderDetailContextRail"]) {
  if (sourceDetail.includes(token)) failures.push(`detail source: removed summary token returned ${token}`);
}
for (const token of ["分配核算", "查看并核对当前日期与门店的小费分配结果。", "tipout-detail-context-bar__current", "当前页面"]) {
  if (sourceDetail.includes(token) || nativeDetail.includes(token)) failures.push(`detail: removed helper copy or current-page region returned ${token}`);
}
if (sourceCss.includes(".tipout-page-detail .tipout-detail-context-bar__current") || pageCss.includes(".tipout-page-detail .tipout-detail-context-bar__current")) failures.push("detail styles: removed current-page region selector returned");
for (const token of ["detailContextRail", "tipout-workspace has-aside"]) {
  if (nativeDetail.includes(token)) failures.push(`detail template: removed summary token returned ${token}`);
}
if (nativeDetailProgram.includes("renderDetailContextRail")) failures.push("detail program: removed summary renderer returned");
for (const token of [".tipout-page-detail .tipout-workspace.has-aside", ".tipout-page-detail .tipout-context-rail"]) {
  if (sourceCss.includes(token) || pageCss.includes(token)) failures.push(`detail styles: removed summary selector returned ${token}`);
}
for (const token of ["detailDate", "storeSelect", "detailRulesContainer", "returnToSummary()", "saveDetail()", "saveAndNext()"]) {
  if (!sourceDetail.includes(token) || !nativeDetail.includes(token)) failures.push(`detail: required business entry missing ${token}`);
}

const removedHeadingCopy = {
  "dist/TipOut/index.html": ["Tip Out 工作台", "按日期查看、核对并执行当前范围的小费分配。"],
  "dist/TipOut/rules.html": ["规则管理", "配置当前门店的小费池来源、扣除方和接收方。"],
  "dist/TipOut/rule-add.html": ["规则配置", "配置现有小费池来源、扣除方、接收方和分配口径。"],
  "src/team/tips/templates/distribution.html": ["Tip Out 工作台", "按日期查看、核对并执行当前范围的小费分配。"],
  "src/team/tips/templates/rules.html": ["规则管理", "配置当前门店的小费池来源、扣除方和接收方。"],
  "src/team/tips/templates/rule-editor.html": ["规则配置", "配置现有小费池来源、扣除方、接收方和分配口径。"],
};
for (const [file, tokens] of Object.entries(removedHeadingCopy)) {
  const content = fs.readFileSync(file, "utf8");
  for (const token of tokens) if (content.includes(token)) failures.push(`${file}: removed heading copy returned ${token}`);
}
for (const file of ["dist/TipOut/rule-add.html", "src/team/tips/templates/rule-editor.html"]) {
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("保存规则")) failures.push(`${file}: removed heading save button returned`);
  if (!content.includes("submitRule()") || !content.includes(">提交</button>")) failures.push(`${file}: bottom submit action missing`);
}
for (const file of ["dist/TipOut/index.html", "src/team/tips/templates/distribution.html"]) {
  const content = fs.readFileSync(file, "utf8");
  for (const token of ["pendingDateCount", "当前范围有", "待分配数量只按日期、门店与当前分配记录计算。", "tipout-inline-notice tipout-inline-notice--warning"]) {
    if (content.includes(token)) failures.push(`${file}: removed pending summary region returned ${token}`);
  }
  const cancelIndex = content.indexOf(">取消分配</button>");
  const ruleIndex = content.indexOf(">新建/查看规则</button>");
  if (cancelIndex < 0 || ruleIndex < 0 || cancelIndex > ruleIndex) failures.push(`${file}: cancel allocation must precede rule entry in heading actions`);
  if (!content.includes("doCancelAllocate()")) failures.push(`${file}: cancel allocation button handler missing`);
  const headingIndex = content.indexOf("tipout-page-heading");
  const filterIndex = content.indexOf("filter-surface tipout-compact-toolbar");
  const metricsIndex = content.indexOf("tipout-metric-strip");
  if (headingIndex < 0 || filterIndex < headingIndex || metricsIndex < filterIndex) failures.push(`${file}: filters must follow heading and precede metrics`);
}
if (!fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8").includes("function doCancelAllocate()")) failures.push("distribution program: cancel allocation function missing");
const distributionTemplate = fs.readFileSync("src/team/tips/templates/distribution.html", "utf8");
const distributionProgram = fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8");
for (const token of ["日期任务", "员工对账", "employeeReconciliationList"]) if (!distributionTemplate.includes(token)) failures.push(`distribution: employee reconciliation UI missing ${token}`);
for (const token of ["setSummaryView", "renderEmployeeReconciliationList", "openEmployeeReconciliationDetail", "canonicalEmployeeStore", "dedupeEmployees", "selectedStore"]) if (!distributionProgram.includes(token)) failures.push(`distribution: employee reconciliation program missing ${token}`);
for (const token of ["tipAllocationModal", "allocationStore", "allocationDateStart", "allocationDateEnd", "allocationScopeError", "confirmAllocateBtn"]) {
  if (!distributionTemplate.includes(token)) failures.push(`distribution: allocation scope dialog missing ${token}`);
}
for (const token of ["openTipAllocationModal", "closeTipAllocationModal", "submitTipAllocationScope", "executeTipAllocationScope", "allocationSubmitting"]) {
  if (!distributionProgram.includes(token)) failures.push(`distribution: allocation scope behavior missing ${token}`);
}
const allocationValidator = distributionProgram.match(/function validateAllocationScope\(scope\)\s*\{[\s\S]*?\n\s*\}/)?.[0];
if (!allocationValidator) {
  failures.push("distribution: allocation scope validator missing");
} else {
  const allocationContext = {};
  vm.createContext(allocationContext);
  vm.runInContext(allocationValidator, allocationContext);
  assert.deepEqual(JSON.parse(JSON.stringify(allocationContext.validateAllocationScope({ store: "", startDate: "2026-01-01", endDate: "2026-01-02" }))), { field: "store", message: "请选择门店" });
  assert.deepEqual(JSON.parse(JSON.stringify(allocationContext.validateAllocationScope({ store: "Nai Cha", startDate: "2026-01-03", endDate: "2026-01-02" }))), { field: "dateStart", message: "开始日期不能晚于结束日期" });
  assert.equal(allocationContext.validateAllocationScope({ store: "Nai Cha", startDate: "2026-01-01", endDate: "2026-01-02" }), null);
}
const pendingValueHelper = distributionProgram.match(/function dailySummaryResultValue\(allocated, value\)\s*\{[\s\S]*?\n\s*\}/)?.[0];
if (!pendingValueHelper) {
  failures.push("distribution: pending result value helper missing");
} else {
  const pendingValueContext = { money(value) { return `$${Number(value).toFixed(2)}`; } };
  vm.createContext(pendingValueContext);
  vm.runInContext(pendingValueHelper, pendingValueContext);
  const sourceRow = { deducted: 12.34, received: 56.78, after: 69.12 };
  const originalRow = { ...sourceRow };
  assert.equal(pendingValueContext.dailySummaryResultValue(false, sourceRow.deducted), "—");
  assert.equal(pendingValueContext.dailySummaryResultValue(false, sourceRow.received), "—");
  assert.equal(pendingValueContext.dailySummaryResultValue(false, sourceRow.after), "—");
  assert.equal(pendingValueContext.dailySummaryResultValue(true, sourceRow.deducted), "$12.34");
  assert.deepEqual(sourceRow, originalRow);
}

const employeeDetailTemplate = fs.readFileSync("src/team/tips/templates/employee-reconciliation.html", "utf8");
const employeeDetailProgram = fs.readFileSync("src/team/tips/programs/employee-reconciliation.js.txt", "utf8");
for (const token of ["employeeDetailStartDate", "employeeDetailEndDate", "employeeDetailRole"]) {
  if (!employeeDetailTemplate.includes(token)) failures.push(`employee reconciliation detail: missing ${token}`);
}
for (const token of ["employeeDetailStore", "employeeDetailChipName", "employeeDetailNotice"]) {
  if (employeeDetailTemplate.includes(token)) failures.push(`employee reconciliation detail: removed region returned ${token}`);
}
const employeeDetailContext = { document: { addEventListener() {} }, window: {}, URLSearchParams };
vm.createContext(employeeDetailContext);
vm.runInContext(employeeDetailProgram, employeeDetailContext);
assert.deepEqual(
  Array.from(employeeDetailContext.filterEmployeeDetailRows([
    { dateKey: "2026-01-01" }, { dateKey: "2026-01-02" }, { dateKey: "2026-01-03" }
  ], "2026-01-02", "2026-01-03"), (row) => row.dateKey),
  ["2026-01-02", "2026-01-03"]
);
assert.deepEqual(
  JSON.parse(JSON.stringify(employeeDetailContext.normalizeEmployeeDetailRange("2026-01-04", "2026-01-03", "start"))),
  { start: "2026-01-04", end: "2026-01-04" }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(employeeDetailContext.normalizeEmployeeDetailRange("2026-01-04", "2026-01-03", "end"))),
  { start: "2026-01-03", end: "2026-01-03" }
);
assert.equal(employeeDetailContext.employeeDetailRoleLabel(""), "未设置角色");
assert.equal(employeeDetailContext.employeeDetailAttendanceStatus({ clockStatus: "已打卡" }), "已打卡");
assert.equal(employeeDetailContext.employeeDetailAttendanceStatus({ clockStatus: "未打卡" }), "未打卡");
assert.equal(employeeDetailContext.employeeDetailAttendanceStatus({ requiresAttendance: false }), "未打卡");
assert.deepEqual(
  Array.from(employeeDetailContext.filterEmployeeDetailRows([
    { dateKey: "2026-01-01", clockStatus: "已打卡" },
    { dateKey: "2026-01-02", clockStatus: "未打卡" },
    { dateKey: "2026-01-03" },
  ], "2026-01-01", "2026-01-03", "未打卡"), (row) => row.dateKey),
  ["2026-01-02", "2026-01-03"]
);
assert.deepEqual(
  JSON.parse(JSON.stringify(employeeDetailContext.summarizeEmployeeDetailRows([
    { hours: 8, before: 10.1, deducted: 1, received: 2, after: 11.1 },
    { hours: 0, before: 3.2, deducted: 0.2, received: 0.4, after: 3.4 }
  ]))),
  { shifts: 1, hours: 8, before: 13.3, deducted: 1.2, received: 2.4, after: 14.5 }
);
if (failures.length) { failures.forEach((failure) => console.error(failure)); process.exit(1); }
console.log("Team tips native view verification passed.");
