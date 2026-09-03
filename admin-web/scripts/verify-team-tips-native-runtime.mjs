import fs from "node:fs";

const names = ["common.js", "global-scope-filter.js", "ruleData.js", "personalSalesDeduct.js", "tipAllocation.js", "attendanceMock.js", "tipout-summary-ui.js", "tipout-payroll-bridge.js", "orderTipStatus.js", "paymentMethodApportion.js", "export.js"];
const failures = [];
for (const name of names) {
  if (fs.readFileSync(`dist/TipOut/${name}`, "utf8") !== fs.readFileSync(`src/team/tips/legacy/${name}.txt`, "utf8")) failures.push(`${name}: native runtime copy is stale`);
}
const runtime = fs.readFileSync("src/team/tips/tips-legacy-runtime.ts", "utf8");
for (const token of ["MutationObserver", "data-native-on", "AbortController", "requestAnimationFrame", "controller.abort()", "observers.forEach", "timers.clear()", "intervals.clear()", "animationFrames.clear()", "closest<HTMLAnchorElement>(\"a[href]\")", "rewriteLegacyTipsUrl", "context.navigate(mapped)"]) {
  if (!runtime.includes(token)) failures.push(`runtime missing ${token}`);
}
if (failures.length) { failures.forEach((failure) => console.error(failure)); process.exit(1); }
console.log("Team tips native runtime verification passed.");
