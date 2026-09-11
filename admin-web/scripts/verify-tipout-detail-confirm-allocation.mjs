import assert from "node:assert/strict";
import fs from "node:fs";

const template = fs.readFileSync("src/team/tips/templates/details.html", "utf8");
const program = fs.readFileSync("src/team/tips/programs/details.js.txt", "utf8");
const distribution = fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8");
const payroll = fs.readFileSync("src/team/tips/legacy/tipout-payroll-bridge.js.txt", "utf8");

assert.match(template, /id="confirmDetailAllocationBtn"[^>]*confirmDetailAllocation\(\)/);
assert.doesNotMatch(template, /saveDetail\(\)|saveAndNext\(\)|小费池执行结果|detailPoolExecutionList/);
assert.match(program, /function collectDetailAllocationSnapshot\(store, dateKey, rules\)/);
assert.match(program, /split\(\/\\s\*\\\/\\s\*\/\)/, "combined receiver roles must resolve to a real roster role");
assert.match(program, /function syncDetailAllocationAction\(\)/);
assert.match(program, /function confirmDetailAllocation\(\)/);
assert.match(program, /该日期已分配，重新确认将覆盖当天原分配结果。/);
assert.match(program, /TipOutAllocationResults\.commit\(snapshot\)/);
assert.match(program, /TipOutPayrollBridge\.syncAfterAllocation\(store, dateKey, dateKey\)/);
assert.match(program, /分配结果已保存，但薪资同步失败，请重试/);
assert.match(distribution, /TipOutAllocationResults\.read/);
assert.match(payroll, /TipOutAllocationResults\.read/);
const cancelBody = distribution.match(/function doCancelAllocate\(\)\s*\{[\s\S]*?\n\s*\}/)?.[0] || "";
assert.doesNotMatch(cancelBody, /TipOutAllocationResults|tipout_allocation_results_v1/);

console.log("Tip detail confirmation allocation verification passed.");
