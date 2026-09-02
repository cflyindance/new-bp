import fs from "node:fs";

const runtime = fs.readFileSync("src/team/employees/employees-legacy-runtime.ts", "utf8");
const page = fs.readFileSync("src/team/employees-page.ts", "utf8");
const failures = [];
for (const token of [
  "new AbortController()",
  "signal: controller.signal",
  "controller.abort()",
  "cleanups.forEach",
  "timers.forEach",
  "intervals.forEach",
  "animationFrames.forEach",
  "timers.clear()",
  "intervals.clear()",
  "animationFrames.clear()",
]) {
  if (!runtime.includes(token)) failures.push(`missing runtime cleanup behavior: ${token}`);
}
for (const token of ["mountedPages.get(container)?.destroy()", "runtime?.destroy()", "container.removeEventListener(\"wheel\"", "shadowRoot.innerHTML = \"\""]) {
  if (!page.includes(token)) failures.push(`missing page cleanup behavior: ${token}`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team employees lifecycle verification passed.");
