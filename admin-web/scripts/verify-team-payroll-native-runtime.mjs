import fs from "node:fs";
import vm from 'node:vm';

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

const runtime = fs.readFileSync("src/team/payroll/payroll-legacy-runtime.ts", "utf8");
for (const name of sources) {
  const nativeCopy = fs.readFileSync(`src/team/payroll/legacy/${name}.txt`, "utf8");
  try { new vm.Script(nativeCopy, {filename:name}); } catch(error) { failures.push(`${name}: ${error.message}`); }
  if (!runtime.includes(`./legacy/${name}.txt?raw`)) failures.push(`${name}: native source is not imported`);
}

const payroll = fs.readFileSync("src/team/payroll/legacy/payroll.js.txt", "utf8");
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
