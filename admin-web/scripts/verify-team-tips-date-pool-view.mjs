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

for (const heading of ["日期", "分配状态", "原始小费", "入池金额", "已分配", "未分配", "小费池", "操作"]) {
  if (!template.includes(heading)) failures.push(`date task: pool-view heading missing ${heading}`);
}
if (!template.includes('id="summaryPoolCount"')) failures.push("date task: pool-count metric missing");
if (!distribution.includes("TipOutDatePoolView.projectDate")) failures.push("date task: shared pool projection missing");
if (!distribution.includes("row.poolSummary.poolCount + ' 个</button></td>'")) failures.push("date task: pool-count cell missing");
if (!distribution.includes("money(row.poolSummary.poolAmount)")) failures.push("date task: pool amount must always render");
if (distribution.includes("row.allocated ? money(row.poolSummary.poolAmount) : '—'")) failures.push("date task: pending pool amount must not render dash");
if (!details.includes("detailPoolAmount').textContent = money(summary.poolAmount || 0)")) failures.push("date detail: pool amount must always render");
if (detailTemplate.includes('id="detailPoolExecutionList"') || detailTemplate.includes("小费池执行结果")) failures.push("date detail: removed pool execution block returned");
if (!detailTemplate.includes('id="detailOriginalTips"')) failures.push("date detail: date metric strip missing");
if (!details.includes("renderDatePoolOverview")) failures.push("date detail: pool overview renderer missing");
if (!details.includes("if (!list) return;")) failures.push("date detail: removed pool execution block must be guarded");
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
