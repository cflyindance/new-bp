import fs from "node:fs";
const source=fs.readFileSync("src/team/tips/tips-escape.ts","utf8"),failures=[];
for(const token of ["capture: true","event.defaultPrevented","tipout-rule-more","modal-overlay","drawer-overlay","select, [role='combobox']","preventDefault()","stopPropagation()","controller.abort()"]){if(!source.includes(token))failures.push(`escape missing ${token}`)}
if(failures.length){failures.forEach(console.error);process.exit(1)}console.log("Team tips fullscreen escape verification passed.");
