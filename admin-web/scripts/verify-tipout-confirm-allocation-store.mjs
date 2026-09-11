import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("src/team/tips/legacy/tipout-allocation-results-store.js.txt", "utf8");
const data = new Map();
const localStorage = {
  getItem(key) { return data.has(key) ? data.get(key) : null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); },
};
const context = { window: {}, localStorage, isFinite };
vm.createContext(context);
vm.runInContext(source, context);
const api = context.window.TipOutAllocationResults;
const snapshot = (store, dateKey, amount) => ({
  version: 1, store, dateKey, confirmedAt: "2026-09-11T00:00:00.000Z",
  pools: [{ poolId: "pool-1", ruleId: "rule-1", poolAmount: amount, employees: [{ employeeId: "emp-1", name: "A", role: "Server", hours: 8, percentage: 100, amount }] }],
  summary: { originalTips: amount, poolAmount: amount, allocatedAmount: amount, unallocatedAmount: 0, poolCount: 1 },
});

api.commit(snapshot("Golden Dragon - Dallas", "2026-09-11", 12.34));
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11").summary.allocatedAmount, 12.34);
assert.equal(api.read("Golden Dragon - Plano", "2026-09-11"), null);
api.commit(snapshot("Golden Dragon - Dallas", "2026-09-11", 20));
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11").summary.allocatedAmount, 20);
assert.deepEqual(JSON.parse(data.get("tipout_allocated"))["Golden Dragon - Dallas"], ["2026-09-11"]);
data.set("tipout_allocated", JSON.stringify({ "Golden Dragon - Dallas": [] }));
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11"), null);
assert.throws(() => api.commit(snapshot("", "2026-09-11", 1)), /请选择门店/);
assert.throws(() => api.commit(snapshot("Store", "2026-09-11", -1)), /无效/);

console.log("Tip allocation result store verification passed.");
