import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const start = flow.indexOf("function renderBuffetQuantityStep(draft)");
const end = flow.indexOf("function renderStepFive", start);
assert.ok(start >= 0 && end > start);
const source = flow.slice(start, end);
const expected = [
  "renderBuffetRuleContext(draft)",
  "renderBuffetLimitContent(draft)",
  "renderBuffetScenarioWorkspace(draft)",
  "renderBuffetActiveScenario(draft)",
  "renderBuffetQuantityWorkbench(draft)"
];
let cursor = -1;
for (const token of expected) {
  const next = source.indexOf(token);
  assert.ok(next > cursor, `${token} must follow the previous quantity section`);
  cursor = next;
}
assert.match(flow, /data-modify-rule-type/);
assert.match(flow, /<h3>适用场景<\/h3>/);
assert.match(flow, /<h3>当前配置场景<\/h3>/);
assert.match(flow, /<h3>门店与商品数量<\/h3>/);

console.log("verify-buffet-quantity-workbench-layout: PASS");
