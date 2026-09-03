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
if (!html.includes('id="employeesDetailExportStatus"')) failures.push("employee detail modal missing export status region");
for (const id of ["btn-payroll-detail-email-close", "btn-payroll-detail-email-cancel", "btn-payroll-detail-email-send"]) {
  if (!html.includes(`id="${id}"`)) failures.push(`email modal missing ${id}`);
}
if (/payrollDetailEmailModal[\s\S]{0,2000}onclick=/.test(html)) failures.push("email modal must not rely on inline onclick handlers");

for (const token of [
  "menusifu.payroll.detail.print-pagination.v1", "compactClockPairs", "remainingClockPairCount",
  "compactRegularHours", "compactRegularAmount", "buildCompactDetailHtml", "payroll-compact-week",
]) if (!runtime.includes(token)) failures.push(`runtime missing ${token}`);

for (const token of ["exportCompactPayrollDetailCSV", "additional_clock_pairs", "payrollEmailExportSnapshot", "_Compact"]) {
  if (!exporter.includes(token)) failures.push(`export missing ${token}`);
}
for (const token of ["setPayrollDetailExportStatus", "正在生成详细明细 PDF", "详细明细 PDF 已导出", "PDF 生成失败"]) {
  if (!exporter.includes(token)) failures.push(`PDF status missing ${token}`);
}
if ((exporter.match(/document\.defaultView && document\.defaultView\.document/g) || []).length !== 2) {
  failures.push("PDF libraries must load through the host document when Payroll runs inside Shadow DOM");
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
