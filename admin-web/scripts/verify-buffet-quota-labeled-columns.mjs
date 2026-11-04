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

const rangeDraft = { subject: "order", measureUnit: "piece", roundRanges: [{min:1,max:2},{min:3,max:5},{min:6,max:null},{min:2,max:2}] };
for (const [roundIndex, expected] of [[0,"第1-2轮每轮最多"],[1,"第3-5轮每轮最多"],[2,"第6轮起每轮最多"],[3,"第2轮最多"]]) {
  const combo = {period:"multi_round",roundIndex};
  assert.equal(ctx.buffetProductQuotaColumns(rangeDraft,combo)[0].label,expected);
  assert.equal(ctx.buffetProductTableColumns({...rangeDraft,targetType:"dish_set"},combo).find(x=>x.key==="sameDish").label,expected.replace(/最多$/,"每种最多份数"));
}
const peopleColumns = ctx.buffetProductQuotaColumns({...rangeDraft,subject:"party_size"},{period:"multi_round",roundIndex:0});
assert.equal(peopleColumns[0].label,"第1-2轮每人每轮最多");
assert.equal(peopleColumns[1].label,"第1-2轮整桌每轮最多");
assert.equal(ctx.buffetProductQuotaColumns({...rangeDraft,combo:true,multiplier:false},{period:"multi_round",roundIndex:1})[0].label,"第3-5轮整桌每轮最多");
assert.equal(ctx.buffetProductQuotaColumns(rangeDraft,round)[0].label,"每轮最多");
assert.equal(ctx.buffetProductQuotaColumns(rangeDraft,order)[0].label,"每单最多");
const beforeLabels = JSON.stringify(rangeDraft);
ctx.buffetProductQuotaColumns(rangeDraft,{period:"multi_round",roundIndex:2});
assert.equal(JSON.stringify(rangeDraft),beforeLabels,"labels must not mutate configuration");
const sharedStart = source.indexOf('  function buffetDishSetQuotaLabels(');
vm.runInContext(source.slice(sharedStart,source.indexOf('  function v4TargetRows(',sharedStart)),ctx);
assert.equal(ctx.buffetDishSetQuotaLabels({...rangeDraft,subject:'party_size'},{period:'multi_round',roundIndex:1}).primary,'第3-5轮每人每轮最多');
assert.equal(ctx.buffetDishSetQuotaLabels(rangeDraft,{period:'multi_round',roundIndex:2}).primary,'第6轮起整桌每轮最多');
assert.equal(ctx.buffetDishSetQuotaLabels(rangeDraft,round).primary,'整桌每轮最多');
assert.equal(ctx.buffetProductQuotaColumns(rangeDraft,{period:'multi_round',roundIndex:99})[0].label,'每轮最多','missing range must not invent an interval');

assert.match(source, /function renderBuffetQuotaTableCells\(draft, combo, values, key, extraAttrs\)/);
assert.match(source, /quotaHeadings = quotaColumns\.map/);
assert.doesNotMatch(source, /identityHeadings \+ '<th>限购数量<\/th>'/);
assert.match(source, /visibleCells\.some\(function \(item\) \{ return Number\(item\.value\) === 0; \}\) \? "forbidden" : "configured"/);
assert.match(source, /data-buffet-workbench-bulk-map/);

console.log("verify-buffet-quota-labeled-columns: PASS");

