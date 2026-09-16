import fs from "node:fs";

const summaryTemplate = fs.readFileSync("src/team/tips/templates/distribution.html", "utf8");
const detailTemplate = fs.readFileSync("src/team/tips/templates/employee-reconciliation.html", "utf8");
const summaryProgram = fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8");
const detailProgram = fs.readFileSync("src/team/tips/programs/employee-reconciliation.js.txt", "utf8");
const exportProgram = fs.readFileSync("src/team/tips/legacy/export.js.txt", "utf8");
const failures = [];

if (!summaryTemplate.includes('>打卡工时</button></th>') || !summaryTemplate.includes('<th>分配工时</th>')) failures.push('summary dual-hours headers missing');
if (!detailTemplate.includes('<th>打卡工时</th><th>分配工时</th>')) failures.push('detail dual-hours headers missing');
if (summaryTemplate.includes('<th>班次</th>')) failures.push('summary still exposes shifts');
if (/employeeDetailDateSortIcon[\s\S]*<th>班次<\/th>/.test(detailTemplate)) failures.push('detail still exposes shifts');
if (detailTemplate.includes('<th>上班时间</th>') || detailTemplate.includes('<th>下班时间</th>')) failures.push('detail still exposes punch times');
if (!summaryProgram.includes('aggregate.punchHoursDisplay')) failures.push('summary punch hours missing');
if (!summaryProgram.includes('aggregate.allocationHourSummaries.map')) failures.push('summary allocation hours missing');
if (!detailProgram.includes('punchHours: row.punchHoursValid')) failures.push('detail export punch hours missing');
if (!detailProgram.includes('allocationHours: TipOutSummaryUi.normalizeEmployeeHoursRow')) failures.push('detail export allocation hours missing');
if (!exportProgram.includes('punchHours: aggregate.punchHoursDisplay')) failures.push('summary export punch hours missing');
if (!exportProgram.includes('allocationHours: (aggregate.allocationHourSummaries')) failures.push('summary export allocation hours missing');
if (exportProgram.includes("'Shifts', 'Hours'")) failures.push('summary export still uses old columns');

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Employee reconciliation shifts/hours column verification passed.");
