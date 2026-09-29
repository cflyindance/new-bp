import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const runtime = read("src/team/payroll/legacy/payroll.js.txt");
const exporter = read("src/team/payroll/legacy/payroll-detail-export.js.txt");
const template = read("src/team/payroll/payroll-template.html");
const page = read("src/team/payroll-page.ts");
const functionSource = (name) => {
  const start = runtime.indexOf(`  function ${name}(`);
  assert.ok(start >= 0, name);
  const end = runtime.indexOf("\n  }", start);
  return runtime.slice(start, end + 4);
};
const sandbox = {
  escapeHtml: (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"),
  fmtMoney: (value) => Number(value ?? 0).toFixed(2),
};
vm.createContext(sandbox);
vm.runInContext(functionSource("buildCompactDeclarationHtml") + functionSource("buildCompactDetailHtml"), sandbox);
const payload = {
  summary: {}, weeks: [], employeeName: "Test", periodNumber: 1,
  declarationText: "Legacy declaration",
  declarationPresentation: {
    primary: { localeCode: "ar", renderedText: "إقرار\n<script>" },
    english: { localeCode: "en-US", renderedText: "English confirmation" },
  },
};
const html = sandbox.buildCompactDetailHtml(payload);
assert.match(html, /lang="ar" dir="rtl"/);
assert.match(html, /&lt;script>/);
assert.match(html, /English confirmation/);
assert.doesNotMatch(html, /Legacy declaration/);
assert.equal(sandbox.buildCompactDeclarationHtml({ declarationText: "Legacy declaration" }), "Legacy declaration");
payload.declarationPresentation.english = null;
assert.doesNotMatch(sandbox.buildCompactDetailHtml(payload), /English confirmation/);

assert.equal((template.match(/data-detail-variant="detail"/g) || []).length, 1);
assert.equal((template.match(/data-detail-variant="compact"/g) || []).length, 1);
assert.doesNotMatch(template + runtime, /switch-employee-detail|employeeDetailView/);
assert.doesNotMatch(functionSource("renderEmployeeDetailPreview"), /setPayrollDetailVariant/);
assert.match(runtime, /printPayrollDetail\(detailPresentation.activeVariant, detailPresentation.printPagination\)/);
assert.match(exporter, /const docHtml = getPayrollDetailPrintDocumentHtml\(variant, pagination\)/);
assert.match(page, /schedule.destroy\(\)/);
assert.match(page, /declarationSettings\?\.destroy\(\)/);
assert.match(page, /isFilterInteraction/);
assert.match(page, /data-payroll-declaration-settings/);
new Function(runtime);
new Function(exporter);
assert.equal(read("dist/TipOut/payroll.js"), runtime);
assert.equal(read("dist/TipOut/payroll-detail-export.js"), exporter);
console.log("Payroll declaration merge regressions passed.");
