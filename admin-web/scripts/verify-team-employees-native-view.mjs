import fs from "node:fs";

const template = fs.readFileSync("src/team/employees/employees-template.html", "utf8");
const failures = [];
for (const token of [
  "data-team-employees-page",
  'data-employees-tab="employees"',
  'data-employees-tab="roles"',
  'id="employeesTableBody"',
  'id="rolesTableBody"',
  'id="addEmployeeModal"',
  'id="employeeRoleAddModal"',
  'id="employeeDeleteConfirmModal"',
  'data-action="close-employee-modal"',
]) {
  if (!template.includes(token)) failures.push(`missing template token: ${token}`);
}
for (const forbidden of ["<html", "<body", "<aside", "<header", "<script", "<link", "onclick="]) {
  if (template.toLowerCase().includes(forbidden)) failures.push(`standalone or inline markup remains: ${forbidden}`);
}
const closeActions = template.match(/data-action="close-employee-modal"/g) ?? [];
if (closeActions.length !== 2) failures.push(`expected two employee close actions, found ${closeActions.length}`);
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team employees native view verification passed.");
