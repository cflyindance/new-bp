import fs from "node:fs";

const sources = [
  "common.js",
  "ruleData.js",
  "payroll-adp-mapping.js",
  "payroll-i18n.js",
  "payroll-detail-pages.js",
  "payroll-detail-export.js",
  "payroll-api-client.js",
  "payroll-period-calendar.js",
  "payroll.js",
];
const failures = [];

for (const name of sources) {
  const original = fs.readFileSync(`dist/TipOut/${name}`, "utf8");
  const nativeCopy = fs.readFileSync(`src/team/payroll/legacy/${name}.txt`, "utf8");
  if (original !== nativeCopy) failures.push(`${name}: native runtime copy is stale`);
}

const runtime = fs.readFileSync("src/team/payroll/payroll-legacy-runtime.ts", "utf8");
const payroll = fs.readFileSync("dist/TipOut/payroll.js", "utf8");
const page = fs.readFileSync("src/team/payroll-page.ts", "utf8");
for (const token of [
  "mountLegacyPayrollRuntime",
  "TipOutGlobalScopeFilter",
  "periodCalendarCode",
  "detailPagesCode",
  "controller.abort()",
  "timers.clear()",
  "cleanups.clear()",
]) {
  if (!runtime.includes(token)) failures.push(`runtime: missing ${token}`);
}
if (runtime.indexOf("periodCalendarCode") > runtime.indexOf("payrollCode")) {
  failures.push("runtime: payroll period calendar must execute before payroll.js");
}
if (runtime.indexOf("detailPagesCode") > runtime.indexOf("detailExportCode")) {
  failures.push("runtime: payroll detail pages must execute before detail export");
}
for (const token of ["PayrollPeriodCalendar.buildSupportedPeriods", "PayrollPeriodCalendar.migrateSnapshot"]) {
  if (!payroll.includes(token)) failures.push(`payroll calendar integration: missing ${token}`);
}
if (payroll.includes("function buildYearPeriods")) failures.push("payroll calendar integration: legacy annual generator remains");
for (const token of ["attachShadow", "mountLegacyPayrollRuntime", "destroy()"] ) {
  if (!page.includes(token)) failures.push(`page lifecycle: missing ${token}`);
}
if (/TipOut\/payroll\.html|<iframe/i.test(runtime + page)) {
  failures.push("native module still references a Payroll iframe or standalone page");
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team Payroll native runtime verification passed.");
