import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const program = fs.readFileSync("src/team/tips/programs/details.js.txt", "utf8");
const helperStart = program.indexOf("function getDetailAutoAllocationEligibility(store, dateKey, rules)");
const helperEnd = program.indexOf("function executeDetailAllocation(options)", helperStart);
const helper = helperStart >= 0 && helperEnd > helperStart ? program.slice(helperStart, helperEnd) : "";
assert.ok(helper, "auto-allocation eligibility helper must exist");

const context = {
  window: { TipOutAllocationResults: { isAllocated: () => false } },
  TipOutAllocationResults: { isAllocated: () => false },
};
vm.createContext(context);
vm.runInContext(helper, context);
const eligible = context.getDetailAutoAllocationEligibility;

assert.equal(eligible("Store", "2026-09-11", [{ clockin: "clock" }]).eligible, true);
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "clock" }, { clockin: "clock" }]).eligible, true);
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "noclock" }]).reason, "manual-rule");
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "clock" }, { clockin: "noclock" }]).reason, "manual-rule");
assert.equal(eligible("", "2026-09-11", [{ clockin: "clock" }]).reason, "invalid-scope");
assert.equal(eligible("Store", "2026-09-11", []).reason, "no-rules");

context.TipOutAllocationResults.isAllocated = () => true;
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "clock" }]).reason, "allocated");
assert.match(program, /setTimeout\(function\(\) \{ scheduleDetailAutoAllocation\(store, dateKey, rules\); \}, 0\)/);
assert.match(program, /detailAutoAllocationAttemptedKey === key/);
assert.match(program, /automatic:\s*true/);
const schedulerStart = program.indexOf("function scheduleDetailAutoAllocation(store, dateKey, rules)");
const schedulerEnd = program.indexOf("function confirmDetailAllocation()", schedulerStart);
assert.doesNotMatch(program.slice(schedulerStart, schedulerEnd), /window\.confirm/);

console.log("Tip clock-rule auto allocation verification passed.");
