import fs from "node:fs";

const required = {
  distribution: ["data-team-tips-view=\"distribution\"", "dailySummaryList", "emailModal"],
  details: ["data-team-tips-view=\"details\"", "detailMain", "formulaModal"],
  rules: ["data-team-tips-view=\"rules\"", "rulesTableBody", "poolTypeModal"],
  "rule-editor": ["data-team-tips-view=\"rule-editor\"", "ruleEditorMain", "fieldDescModal", "salesDrawer"],
};
const failures = [];
for (const [view, tokens] of Object.entries(required)) {
  const template = fs.readFileSync(`src/team/tips/templates/${view}.html`, "utf8");
  const program = fs.readFileSync(`src/team/tips/programs/${view}.js.txt`, "utf8");
  for (const token of tokens) if (!template.includes(token)) failures.push(`${view}: missing ${token}`);
  for (const forbidden of ["<html", "<body", "<script", "<link", " onclick=", " onchange=", "href=\"javascript:"]) {
    if (template.toLowerCase().includes(forbidden)) failures.push(`${view}: forbidden template token ${forbidden}`);
  }
  if (!program.trim()) failures.push(`${view}: page program is empty`);
}
if (failures.length) { failures.forEach((failure) => console.error(failure)); process.exit(1); }
console.log("Team tips native view verification passed.");
