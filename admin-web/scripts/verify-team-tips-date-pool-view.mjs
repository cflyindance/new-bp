import fs from "node:fs";
import vm from "node:vm";

const failures = [];
const template = fs.readFileSync("src/team/tips/templates/distribution.html", "utf8");
const detailTemplate = fs.readFileSync("src/team/tips/templates/details.html", "utf8");
const distribution = fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8");
const details = fs.readFileSync("src/team/tips/programs/details.js.txt", "utf8");
const exportCode = fs.readFileSync("src/team/tips/legacy/export.js.txt", "utf8");
const runtime = fs.readFileSync("src/team/tips/tips-legacy-runtime.ts", "utf8");
const projectionCode = fs.readFileSync("src/team/tips/legacy/tipout-date-pool-view.js.txt", "utf8");

const expectedHeader = "<th>日期</th><th>分配状态</th><th>原始小费</th><th>入池金额</th><th>已分配</th><th>未分配</th><th>小费池</th><th aria-label=\"进入明细\">操作</th>";
if (!template.includes(expectedHeader)) failures.push("date task: pool-view table headings missing");
if (!template.includes('id="summaryPoolCount"')) failures.push("date task: pool-count metric missing");
if (!distribution.includes("TipOutDatePoolView.projectDate")) failures.push("date task: shared pool projection missing");
if (!distribution.includes("row.poolSummary.poolCount + ' 个</button></td>'")) failures.push("date task: pool-count cell missing");
if (!distribution.includes("row.allocated ? money(row.poolSummary.poolAmount) : '—'")) failures.push("date task: uncalculated pool amount must render dash");
if (!detailTemplate.includes('id="detailPoolExecutionList"')) failures.push("date detail: pool execution table missing");
if (!detailTemplate.includes('id="detailOriginalTips"')) failures.push("date detail: date metric strip missing");
if (!details.includes("renderDatePoolOverview")) failures.push("date detail: pool overview renderer missing");
if (!runtime.includes('datePoolView from "./legacy/tipout-date-pool-view.js.txt?raw"')) failures.push("runtime: shared pool projection dependency missing");
if (!exportCode.includes("dailySummaries")) failures.push("date export: daily pool summaries missing");
if (!exportCode.includes("Pool Count")) failures.push("date export: pool columns missing");

const sandbox = { window: {} };
vm.runInNewContext(projectionCode, sandbox);
const projected = sandbox.window.TipOutDatePoolView.projectDate({
  dateKey: "2026-01-02",
  originalTips: 720,
  allocated: false,
  rules: [
    { id: "servers", name: "Server Pool", poolRules: [{ id: "tip", type: "tips", pct: 10 }] },
    { id: "bar", name: "Bar Pool", poolRules: [{ id: "manual", type: "manual", pct: 50 }] }
  ]
});
if (projected.poolCount !== 2 || projected.poolExecutions.length !== 2) failures.push("projection: multiple pools must remain separate");
if (projected.originalTips !== 720) failures.push("projection: original tips changed");
if (projected.allocatedAmount !== null || projected.unallocatedAmount !== null) failures.push("projection: pending values must remain uncalculated");
if (projected.aggregateStatus !== "未分配") failures.push("projection: pending status mismatch");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Team tips date pool view verification passed.");
