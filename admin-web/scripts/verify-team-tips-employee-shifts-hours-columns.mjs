import fs from "node:fs";

const summaryTemplate = fs.readFileSync("src/team/tips/templates/distribution.html", "utf8");
const detailTemplate = fs.readFileSync("src/team/tips/templates/employee-reconciliation.html", "utf8");
const summaryProgram = fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8");
const detailProgram = fs.readFileSync("src/team/tips/programs/employee-reconciliation.js.txt", "utf8");
const exportProgram = fs.readFileSync("src/team/tips/legacy/export.js.txt", "utf8");
const failures = [];

if (!summaryTemplate.includes("<th>班次</th><th>工时</th>")) failures.push("summary headers are not split");
if (!detailTemplate.includes("<th>班次</th><th>工时</th>")) failures.push("detail headers are not split");
if (!summaryProgram.includes("aggregate.shifts + ' 个班次</strong></td>'")) failures.push("summary shifts cell missing");
if (!summaryProgram.includes("formatHoursDisplay(aggregate.hours) + ' h</strong></td>'")) failures.push("summary hours cell missing");
if (!detailProgram.includes("shifts: attendance.shifts > 0 ? attendance.shifts + ' 个班次' : '—'")) failures.push("detail export shifts missing");
if (!detailProgram.includes("hours: (attendance.hourLines || []).map")) failures.push("detail export hours missing");
if (!exportProgram.includes("shifts: aggregate.shifts + ' 个班次'")) failures.push("summary export shifts missing");
if (!exportProgram.includes("hours: formatHoursDisplay(aggregate.hours) + ' h'")) failures.push("summary export hours missing");
if (detailProgram.includes("'班次 / 工时'")) failures.push("detail export still uses combined header");
if (exportProgram.includes("'Shifts / Hours'")) failures.push("summary export still uses combined header");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Employee reconciliation shifts/hours column verification passed.");
