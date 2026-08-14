import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const html = read("dist/TipOut/payroll.html");
const css = read("dist/TipOut/payroll.css");
const commonCss = read("dist/TipOut/common.css");
const js = read("dist/TipOut/payroll.js");
const i18n = read("dist/TipOut/payroll-i18n.js");

const failures = [];

function expectIncludes(source, needle, label) {
  if (!source.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function expectExcludes(source, needle, label) {
  if (source.includes(needle)) failures.push(`${label}: unexpected ${needle}`);
}

function expectCount(source, pattern, expected, label) {
  const matches = source.match(pattern) || [];
  if (matches.length !== expected) {
    failures.push(`${label}: expected ${expected}, received ${matches.length}`);
  }
}

[
  "payroll-workspace-topbar",
  "payroll-workspace-filters",
  "payroll-employee-hero",
  "payroll-adp-export-menu",
  "payrollEmployeePickerModal",
  "payrollEmployeeEditModal",
  "workspace-period-filter",
  "ws-employee-avatar",
  "ws-total-salary",
  "ws-total-hours",
  "payroll-store-trigger",
  "payroll-store-picker",
  "payroll-year-trigger",
  "payroll-year-menu",
  "payroll-period-trigger",
  "payroll-period-menu",
  "payroll-header-save",
  "employee-picker-employees",
  "employee-picker-roles",
  "btn-employee-picker-confirm",
  "btn-employee-edit-close",
  "btn-employee-edit-confirm",
  "employee-edit-title",
].forEach((token) => expectIncludes(html, token, "payroll HTML structure"));

expectExcludes(html, "payroll-identity-editor", "retired inline identity editor");

[
  "preview-adp-report",
  "export-batch-adp",
  "preview-employees-detail",
  "refresh-employee-data",
  "confirm-employee",
  "open-employee-picker",
  "open-employee-identity-edit",
].forEach((action) => expectIncludes(html, `data-action="${action}"`, "payroll action"));

[
  "field-adp-file",
  "field-ssn",
  "field-hire-date",
  "ws-employee-switch",
  "ws-employee-role-tag",
  "ws-breadcrumb-period",
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
].forEach((id) => expectCount(html, new RegExp(`id=["']${id}["']`, "g"), 1, `unique #${id}`));

[
  ".payroll-workspace-topbar",
  ".payroll-employee-hero",
  ".payroll-adp-export-menu",
  ".payroll-employee-picker",
  ".payroll-employee-edit-modal",
  ".payroll-employee-edit-input",
  "body.payroll-employee-edit-open",
  ".payroll-filter-popover",
  ".payroll-screenshot-manage-group",
  ".payroll-seg-week-toolbar",
  "Reference-style payroll workspace restoration · 2026-08-10",
  ".payroll-attendance-section > .payroll-manage-section-title",
  "font-variant-numeric: tabular-nums",
  "prefers-reduced-motion",
].forEach((token) => expectIncludes(css, token, "payroll CSS"));

[
  "body.tipout-embedded .sidebar",
  "body.tipout-embedded .header",
  "body.tipout-embedded .main-content",
].forEach((token) => expectIncludes(commonCss, token, "embedded shell CSS"));

[
  "renderWorkspaceHero",
  "renderEmployeePicker",
  "workspace-period-filter",
  "open-employee-picker",
  "toggle-adp-export-menu",
  "renderCustomFilterMenus",
  "getEmployeeAvailableRoles",
  "confirmEmployeePickerSelection",
  "showEmployeeEditModal",
  "hideEmployeeEditModal",
  "confirmEmployeeEditModal",
  "trapFocusInModal",
  "setEmployeeEditBackgroundInert",
  "closeWorkspaceMenus",
].forEach((token) => expectIncludes(js, token, "payroll JS"));

[
  "workspace.title",
  "workspace.switchEmployee",
  "workspace.totalSalary",
  "workspace.totalHours",
  "export.currentAdp",
  "workspace.confirmSave",
  "workspace.storeSearch",
  "workspace.employeeColumn",
  "workspace.roleColumn",
  "workspace.confirmSwitch",
  "workspace.employeeEditTitle",
  "workspace.employeeEditConfirm",
  "workspace.employeeEditAdpId",
].forEach((token) => expectIncludes(i18n, token, "payroll i18n"));

if (failures.length > 0) {
  console.error("Payroll Figma redesign verification failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Payroll Figma redesign verification passed.");
