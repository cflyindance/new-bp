import fs from "node:fs";

const names = ["common.js", "global-scope-filter.js", "ruleData.js", "employees-field-help.js", "employees.js"];
const failures = [];
for (const name of names) {
  const source = fs.readFileSync(`dist/TipOut/${name}`, "utf8");
  const copy = fs.readFileSync(`src/team/employees/legacy/${name}.txt`, "utf8");
  if (source !== copy) failures.push(`${name}: native runtime copy is stale`);
}
const runtime = fs.readFileSync("src/team/employees/employees-legacy-runtime.ts", "utf8");
for (const token of ["AbortController", "setInterval", "requestAnimationFrame", "close-employee-modal", "controller.abort()", "timers.clear()", "intervals.clear()", "animationFrames.clear()"] ) {
  if (!runtime.includes(token)) failures.push(`runtime missing lifecycle contract: ${token}`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team employees native runtime verification passed.");
