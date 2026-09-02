import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const template = read("src/team/payroll/payroll-template.html");
const templateModule = read("src/team/payroll/payroll-template.ts");
const css = read("src/team/payroll/payroll-page.css");
const failures = [];

function requireText(source, text, label) {
  if (!source.includes(text)) failures.push(`${label}: missing ${text}`);
}

function forbidText(source, text, label) {
  if (source.includes(text)) failures.push(`${label}: unexpected ${text}`);
}

[
  "payroll-workspace-topbar",
  "payroll-workspace-filters",
  "payroll-employee-hero",
  "payrollEmployeePickerModal",
  "payrollEmployeeEditModal",
  "workspace-period-filter",
  "payroll-header-save",
  "adj-exempt",
  "adj-incentive",
  "adj-breakfast",
  "adj-lunch",
  "adj-dinner",
  "adj-sick",
  "adj-svcw",
  "adj-tips",
  "adj-child-sup",
  "adj-med-ded",
  "adj-eee40",
  "adj-eer60",
].forEach((token) => requireText(template, token, "native Payroll template"));

[
  '<aside class="sidebar"',
  '<header class="header"',
  '<script',
  '<link',
  '<iframe',
].forEach((token) => forbidText(template, token, "native Payroll template"));

requireText(templateModule, "renderPayrollPageTemplate", "template module");
requireText(templateModule, "payroll-template.html?raw", "bundled native template");
requireText(css, ".team-payroll-page", "scoped Payroll CSS");
forbidText(css, "@import url", "external font import");
forbidText(css, ":root", "global CSS variables");

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}

console.log("Team Payroll native view verification passed.");
