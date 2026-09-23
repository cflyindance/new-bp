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

await api.commit(snapshot("Golden Dragon - Dallas", "2026-09-11", 12.34));
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11").summary.allocatedAmount, 12.34);
assert.equal(api.read("Golden Dragon - Plano", "2026-09-11"), null);
await api.commit(snapshot("Golden Dragon - Dallas", "2026-09-11", 20));
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11").summary.allocatedAmount, 20);
assert.deepEqual(JSON.parse(data.get("tipout_allocated"))["Golden Dragon - Dallas"], ["2026-09-11"]);
data.set("tipout_allocated", JSON.stringify({ "Golden Dragon - Dallas": [] }));
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11"), null);
await assert.rejects(api.commit(snapshot("", "2026-09-11", 1)), /请选择门店/);
await assert.rejects(api.commit(snapshot("Store", "2026-09-11", -1)), /无效/);

console.log("Tip allocation result store verification passed.");

// Quick allocation must check the current state inside the date lock.
let queue = Promise.resolve();
let locked = false;
context.window.TipOutDateState = {
  withLock(store, day, fn) { const next = queue.then(fn); queue = next.catch(() => {}); return next; },
  assertDateWritable() { if (locked) throw new Error('已发放'); },
  prepareSnapshot: async value => value,
};
const quick = snapshot('Quick store', '2026-09-23', 30);
const concurrent = await Promise.allSettled([api.commit(quick, {onlyIfUnallocated:true}), api.commit(quick, {onlyIfUnallocated:true})]);
assert.deepEqual(concurrent.map(x=>x.status), ['fulfilled','rejected']);
assert.equal(api.read('Quick store','2026-09-23').summary.allocatedAmount,30);
locked = true;
await assert.rejects(api.commit(snapshot('Quick store','2026-09-22',40), {onlyIfUnallocated:true}), /已发放/);
assert.equal(api.read('Quick store','2026-09-22'),null);
console.log('Quick allocation duplicate and locked-date guards passed.');
