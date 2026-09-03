import fs from "node:fs";

const html = fs.readFileSync("dist/TipOut/payroll.html", "utf8");
const css = fs.readFileSync("dist/TipOut/payroll.css", "utf8");
const runtime = fs.readFileSync("dist/TipOut/payroll.js", "utf8");
const exporter = fs.readFileSync("dist/TipOut/payroll-detail-export.js", "utf8");
const pages = fs.readFileSync("dist/TipOut/payroll-detail-pages.js", "utf8");
const failures = [];

for (const token of [
  'data-detail-variant="detail"', 'data-detail-variant="compact"',
  'id="employeesDetailCompactBody"', 'data-print-pagination="fit-one-page"',
  'data-print-pagination="paginate"', 'payroll-detail-pages.js',
]) if (!html.includes(token)) failures.push(`html missing ${token}`);
if (html.includes("data-export-variant")) failures.push("export menu must use the active detail tab without a second variant selection");

for (const token of [
  "menusifu.payroll.detail.print-pagination.v1", "compactClockPairs", "remainingClockPairCount",
  "compactRegularHours", "compactRegularAmount", "buildCompactDetailHtml", "payroll-compact-week",
]) if (!runtime.includes(token)) failures.push(`runtime missing ${token}`);

for (const token of ["exportCompactPayrollDetailCSV", "additional_clock_pairs", "payrollEmailExportSnapshot", "_Compact"]) {
  if (!exporter.includes(token)) failures.push(`export missing ${token}`);
}

for (const token of ["size:A4 portrait", "width:210mm", "min-height:297mm", "padding:8mm", "break-after:auto", "*.995"]) {
  if (!pages.includes(token)) failures.push(`A4 builder missing ${token}`);
}

for (const token of ["payroll-detail-variant-tabs", "payroll-print-pagination", "payroll-compact-summary", "payroll-compact-signature"]) {
  if (!css.includes(token)) failures.push(`css missing ${token}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Payroll dual detail static contract passed.");
