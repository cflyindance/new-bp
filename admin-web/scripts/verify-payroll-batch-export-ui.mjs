import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/team/payroll/payroll-template.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/team/payroll/payroll-page.css", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../src/team/payroll-page.ts", import.meta.url), "utf8");
const runtime = fs.readFileSync(new URL("../src/team/payroll/payroll-legacy-runtime.ts", import.meta.url), "utf8");
const controller = fs.readFileSync(new URL("../src/team/payroll/payroll-batch-export-controller.ts", import.meta.url), "utf8");

assert.doesNotMatch(css, /^500;600;700&display=swap'\);$/m);

for (const marker of [
  'data-action="open-batch-detail-export"', 'id="payrollBatchExportModal"', 'role="dialog"',
  'id="payrollBatchEmployeeSearch"', 'id="payrollBatchEmployeeList"', 'id="payrollBatchExportSummary"',
  'id="payrollBatchExportStart"', 'id="payrollBatchExportTaskPanel"', 'role="progressbar"',
]) assert.match(html, new RegExp(marker));
assert.doesNotMatch(html, /<iframe[^>]+payroll/i);
assert.match(css, /\.payroll-batch-export-modal/);
assert.match(css, /overscroll-behavior:contain/);
assert.match(css, /@media \(max-width:768px\)/);
assert.match(page, /mountPayrollBatchExportController/);
assert.match(page, /batchExport\?\.destroy\(\)/);
assert.match(runtime, /getBatchBridge/);
assert.match(runtime, /injectBatchBridgeIntoPayrollIife/);
assert.match(runtime, /Payroll legacy runtime IIFE boundary was not found/);
for (const action of ["batch-select-results", "batch-clear-selection", "beforeunload", "task.retry", "task.cancel"]) {
  assert.match(controller, new RegExp(action.replace(".", "\\.")));
}
console.log("Payroll batch export UI verification passed.");
