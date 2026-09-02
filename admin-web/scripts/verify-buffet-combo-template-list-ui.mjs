import assert from "node:assert/strict";
import fs from "node:fs";

const list = fs.readFileSync("dist/Configuration center/buffet-rule.html", "utf8");
const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

for (const copy of ["整单限制", "每轮常用组合模板", "每轮原子规则", "其他规则"]) {
  assert.ok(list.includes(copy), `默认列表缺少分组：${copy}`);
}
assert.ok(list.includes("per_round_combo"));
assert.ok(list.indexOf("整单限制") < list.indexOf("每轮常用组合模板"));
assert.ok(list.indexOf("每轮常用组合模板") < list.indexOf("每轮原子规则"));

for (const marker of [
  "function isBuffetComboDraft",
  "comboScenarioKeyFor",
  "每人每轮最多",
  "整桌每轮最多",
  "整桌每轮总量：",
  "相同菜品每轮最多",
  "每种菜品每轮最多",
  "按有效人数乘算",
  "删除后，该人数区间在全部门店中的 M/N/X/P 数量配置将一并删除",
]) assert.ok(flow.includes(marker), `组合模板流程缺少：${marker}`);

assert.ok(flow.includes('"tableTotalBounds", "整桌每轮"'));
assert.ok(flow.includes('values.defaultDishLimits[sameDishKey]'));
assert.ok(flow.includes('comboUsesPartyMultiplier(draft) ? "targetLimits" : "tableTargetCaps"'));

console.log("verify-buffet-combo-template-list-ui: OK");
