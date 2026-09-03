import fs from "node:fs";

const required = {
  distribution: ["data-team-tips-view=\"distribution\"", "dailySummaryList", "emailModal"],
  details: ["data-team-tips-view=\"details\"", "detailMain", "formulaModal"],
  rules: ["data-team-tips-view=\"rules\"", "rulesTableBody", "poolTypeModal"],
  "rule-editor": ["data-team-tips-view=\"rule-editor\"", "ruleEditorMain", "fieldDescModal", "salesDrawer"],
};
const failures = [];
const pageCss = fs.readFileSync("src/team/tips/tips-page.css", "utf8");
const sourceCss = fs.readFileSync("dist/TipOut/prototype-fidelity.css", "utf8");
for (const token of [".tipout-page-rule-editor .content-area", "width: min(100%, 1280px)", "margin-inline: auto"]) {
  if (!pageCss.includes(token)) failures.push(`rule-editor centered layout missing ${token}`);
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
}
if (!fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8").includes("function doCancelAllocate()")) failures.push("distribution program: cancel allocation function missing");
if (failures.length) { failures.forEach((failure) => console.error(failure)); process.exit(1); }
console.log("Team tips native view verification passed.");
