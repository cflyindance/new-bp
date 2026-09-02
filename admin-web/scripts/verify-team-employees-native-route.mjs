import fs from "node:fs";

const main = fs.readFileSync("src/main.ts", "utf8");
const failures = [];
for (const required of [
  'import { mountEmployeesPage',
  'data-team-employees-scroll',
  'data-team-employees-root',
  'mountEmployeesPage(employeesRoot',
  'destroyTeamEmployeesPage()',
]) {
  if (!main.includes(required)) failures.push(`missing native employees contract: ${required}`);
}
for (const forbidden of [
  'TEAM_ROLES_EMPLOYEES_IFRAME_SRC',
  'renderTeamRolesEmployeesIframePanel',
  'src="${TEAM_ROLES_EMPLOYEES_IFRAME_SRC}"',
]) {
  if (main.includes(forbidden)) failures.push(`legacy employees iframe remains: ${forbidden}`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team employees native route verification passed.");
