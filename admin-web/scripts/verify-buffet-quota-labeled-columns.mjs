import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const start = source.indexOf("  function buffetQuotaPeriodLabels(");
const end = source.indexOf("  function buffetProductMeta(", start);
assert.ok(start >= 0 && end > start, "quota column helpers must exist");

const ctx = vm.createContext({
  isBuffetComboDraft: (draft) => !!draft.combo,
  comboUsesPartyMultiplier: (draft) => !!draft.multiplier
});
vm.runInContext(source.slice(start, end), ctx);

const round = { period: "per_round" };
const order = { period: "order_lifetime" };
const plain = (value) => JSON.parse(JSON.stringify(value));

assert.deepEqual(plain(ctx.buffetProductQuotaColumns({ combo: true, multiplier: false, measureUnit: "piece" }, round)), [
  { key: "tableCap", map: "tableTargetCaps", label: "整桌每轮最多", unit: "份" }
]);
assert.deepEqual(plain(ctx.buffetProductQuotaColumns({ combo: true, multiplier: true, measureUnit: "piece" }, round)), [
  { key: "limit", map: "targetLimits", label: "每人每轮最多", unit: "份" }
]);
assert.deepEqual(plain(ctx.buffetProductQuotaColumns({ subject: "party_size", measureUnit: "piece" }, order)), [
  { key: "limit", map: "targetLimits", label: "每人每单最多", unit: "份" },
  { key: "tableCap", map: "tableTargetCaps", label: "整桌整单最多", unit: "份" }
]);
assert.deepEqual(plain(ctx.buffetProductQuotaColumns({ subject: "order", measureUnit: "piece" }, round)), [
  { key: "limit", map: "targetLimits", label: "每轮最多", unit: "份" }
]);
assert.equal(ctx.buffetProductQuotaColumns({ combo: true, multiplier: false, measureUnit: "kind" }, round)[0].unit, "种（SPU）");
assert.equal(ctx.buffetProductQuotaColumns({ combo: true, multiplier: true, measureUnit: "kind" }, round)[0].unit, "种（SPU）");

assert.match(source, /function renderBuffetQuotaTableCells\(draft, combo, values, key, extraAttrs\)/);
assert.match(source, /quotaHeadings = quotaColumns\.map/);
assert.doesNotMatch(source, /identityHeadings \+ '<th>限购数量<\/th>'/);
assert.match(source, /visibleCells\.some\(function \(item\) \{ return Number\(item\.value\) === 0; \}\) \? "forbidden" : "configured"/);
assert.match(source, /data-buffet-workbench-bulk-map/);

console.log("verify-buffet-quota-labeled-columns: PASS");

