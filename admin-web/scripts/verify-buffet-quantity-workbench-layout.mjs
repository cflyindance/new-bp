import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const start = flow.indexOf("function renderBuffetQuantityStep(draft)");
const end = flow.indexOf("function renderStepFive", start);
assert.ok(start >= 0 && end > start);
const source = flow.slice(start, end);
const expected = [
  "renderBuffetScenarioWorkspace(draft)",
  "renderBuffetQuantityWorkbench(draft)"
];
let cursor = -1;
for (const token of expected) {
  const next = source.indexOf(token);
  assert.ok(next > cursor, `${token} must follow the previous quantity section`);
  cursor = next;
}
assert.doesNotMatch(source, /renderBuffetRuleContext\(draft\)/);
assert.doesNotMatch(flow, /<h3>当前规则<\/h3>/);
assert.doesNotMatch(flow, /<h3>适用场景<\/h3>/);
assert.doesNotMatch(flow, /先定义人数与轮次区间，再选择当前编辑场景/);
assert.doesNotMatch(flow, /<h3>当前配置场景<\/h3>/);
assert.doesNotMatch(source, /renderBuffetActiveScenario\(draft\)/);
assert.match(flow, /<h3>门店与商品数量<\/h3>/);

const styles = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.css", "utf8");
assert.doesNotMatch(styles, /\.olf-quantity-context/);

console.log("verify-buffet-quantity-workbench-layout: PASS");
