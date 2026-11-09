import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const window = {};
vm.runInNewContext(fs.readFileSync("dist/Configuration center/assets/buffet-rule-list-view.js", "utf8"), { window });
const view = window.BuffetRuleListView;
const column = view.columnDefinitions().find(item => item.id === "period");
assert.ok(column, "字段设置必须包含限购周期");
assert.equal(column.label, "限购周期");
assert.equal(column.defaultVisible, false);
assert.equal(column.fixed, false);
assert.equal(column.width, 140);
assert.equal(view.columnDefinitions().length, 12);
assert.equal(view.defaultVisibleColumns().length, 7);
assert.ok(!view.defaultVisibleColumns().includes("period"));
for (const version of [1, 2]) {
  const pref = view.normalizeColumnPreference({ version, visible: ["name", "period", "period", "removed"] });
  assert.equal(pref.visible.join(","), "name,period,status,actions");
  assert.equal(view.normalizeColumnPreference({ version, visible: ["name", "description"] }).visible.includes("period"), false);
}
function periodCell(config) {
  return view.projectColumns(view.createViewModel({ id: "period-test", status: "disabled", authoringConfig: config }, {}, [])).period.main;
}
assert.equal(periodCell({ period: "order_lifetime" }), "整个订单");
assert.equal(periodCell({ period: "per_round" }), "每轮");
assert.equal(periodCell({ period: "multi_round" }), "多轮");
assert.equal(periodCell({ enabledPeriods: ["order_lifetime", "per_round"] }), "整个订单＋每轮");
assert.equal(periodCell({ enabledPeriods: ["order_lifetime", "multi_round", "multi_round"] }), "整个订单＋多轮");
assert.equal(periodCell({ enabledPeriods: [], period: "per_round" }), "每轮");
assert.equal(periodCell({ period: "invalid" }), "—");
assert.equal(periodCell({}), "—");
console.log("verify-buffet-period-column: PASS");
