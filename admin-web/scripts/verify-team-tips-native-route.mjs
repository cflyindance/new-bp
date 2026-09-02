import fs from "node:fs";

const main = fs.readFileSync("src/main.ts", "utf8");
const failures = [];
for (const token of ["import { mountTipsPage", "data-team-tips-scroll", "data-team-tips-root", "mountTipsPage(tipsRoot", "destroyTeamTipsPage()"]) {
  if (!main.includes(token)) failures.push(`missing native tips token: ${token}`);
}
for (const token of ["TEAM_TIPS_DISTRIBUTION_IFRAME_SRC", "TEAM_TIPS_DETAILS_IFRAME_SRC", "TEAM_TIPS_RULES_IFRAME_SRC", "getTeamTipsManagementIframeSrc", "renderTeamTipsManagementIframePanel"]) {
  if (main.includes(token)) failures.push(`legacy tips iframe token remains: ${token}`);
}
if (failures.length) { failures.forEach((failure) => console.error(failure)); process.exit(1); }
console.log("Team tips native route verification passed.");
