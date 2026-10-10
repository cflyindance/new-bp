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
assert.match(html, /data-detail-type="summary"/);
assert.doesNotMatch(html, /按所选门店及当前年份|payrollBatchFormatLabel|请选择所选门店/);
assert.match(html, /data-detail-type="detailed"/);
assert.doesNotMatch(html, /name="payrollBatch(?:Scope|Format|Organization|Detail)"/);
assert.match(controller, /selectedIds.size < 10/);
assert.match(controller, /openingContext !== contextKey/);
for (const action of ["toggle-batch-detail-export", "batch-clear-selection", "beforeunload", "task.retry", "task.cancel"]) {
  assert.match(controller, new RegExp(action.replace(".", "\\.")));
}
console.log("Payroll batch export UI verification passed.");
