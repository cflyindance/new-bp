import fs from "node:fs";

const employees = fs.readFileSync("src/team/employees/legacy/employees.js.txt", "utf8");
const scope = fs.readFileSync("src/team/employees/legacy/global-scope-filter.js.txt", "utf8");
const context = fs.readFileSync("src/team/employees/employees-context.ts", "utf8");
const failures = [];

for (const key of [
  "tipout-employees-roster-v1",
  "tipout-employee-role-options-v1",
  "tipout-employee-role-hidden-system-v1",
  "tipout-employee-role-meta-v1",
  "tipout-employees-page-tab",
]) {
  if (!employees.includes(key)) failures.push(`missing storage compatibility key: ${key}`);
}
for (const token of [
  'window.dispatchEvent(new CustomEvent("tipout-roster-updated"))',
  "localStorage.setItem(STORAGE_KEY",
  "localStorage.setItem(ROLES_STORAGE_KEY",
  "localStorage.setItem(HIDDEN_SYSTEM_ROLES_KEY",
  "localStorage.setItem(ROLE_META_STORAGE_KEY",
  "sessionStorage.setItem(TAB_STORAGE_KEY",
]) {
  if (!employees.includes(token)) failures.push(`missing data round-trip behavior: ${token}`);
}
for (const token of ["canonicalRosterStoreDisplayName", "isSuppressedRosterStoreAlias", "filterRosterByGlobalScope"]) {
  if (!scope.includes(token)) failures.push(`missing store alias behavior: ${token}`);
}
for (const token of ["readScopeFilters", "writeScopeFilters", "menusifu:scope-filter-change"]) {
  if (!context.includes(token)) failures.push(`missing main scope bridge: ${token}`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team employees data compatibility verification passed.");
