import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const start = source.indexOf("  function buffetRuleHelpContent(");
const end = source.indexOf("  function renderV4LimitInput(", start);

assert.ok(start >= 0, "buffetRuleHelpContent must exist");
assert.ok(end > start, "help renderer must be defined before renderV4LimitInput");

const ctx = vm.createContext({
  esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
vm.runInContext(source.slice(start, end), ctx);

const cases = [
  [{ kind: "total", subject: "party_size", period: "per_round" }, "每轮菜品总数", "有效人数"],
  [{ kind: "target", targetType: "dish" }, "商品限购数量", "不同门店分别"],
  [{ kind: "target", targetType: "category" }, "分类限购数量", "同一门店、同一产线"],
  [{ kind: "target", targetType: "dish_set" }, "菜品集额度与商品", "共享一个额度"],
  [{ kind: "shared" }, "菜品集共享额度", "同时启用时须分别满足"],
  [{ kind: "shared_metric", metric: "piece" }, "按份限制", "合计最多 5 份"],
  [{ kind: "shared_metric", metric: "kind" }, "按种限制（SPU）", "同一商品点多份仍算 1 种"],
  [{ kind: "protection", targetType: "dish_set" }, "相同菜品保护 / 菜品集内部保护", "删除例外记录后才恢复"],
  [{ kind: "quota", subject: "party_size", period: "per_round", scope: "person" }, "每人每轮最多", "有效人数"],
  [{ kind: "quota", subject: "order", period: "per_round", scope: "table" }, "整桌每轮最多", "不乘人数"],
  [{ kind: "quota", subject: "party_size", period: "order_lifetime", scope: "person" }, "每人每单最多", "整个订单"],
  [{ kind: "quota", subject: "party_size", period: "multi_round", scope: "person" }, "每人本轮最多", "当前轮次区间"]
];

for (const [context, label, fragment] of cases) {
  const help = ctx.buffetRuleHelpContent(context);
  assert.equal(help.label, label);
  assert.match(help.description + help.example, new RegExp(fragment));
  const html = ctx.renderBuffetHelpExample(help);
  assert.match(html, /<details class="olf-bound-example/);
  assert.match(html, new RegExp(`aria-label="查看${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}说明示例"`));
  assert.match(html, /<strong>说明：<\/strong>/);
  assert.match(html, /<strong>示例：<\/strong>/);
}

assert.equal(ctx.buffetRuleHelpContent({ kind: "unknown" }), null);
assert.equal(ctx.renderBuffetHelpExample(null), "");
assert.match(source, /var help = buffetRuleHelpContent\(\{ kind: "shared" \}\)/, "shared card must use the combined help");
const metricBlockStart = source.indexOf("function metricBlock(metric, label, unit)");
const metricBlockEnd = source.indexOf("return '<div class=\"olf-v4-target-row olf-v4-target-row--dish-set\"", metricBlockStart);
assert.ok(metricBlockStart >= 0 && metricBlockEnd > metricBlockStart, "dish-set metric card must exist");
const metricBlock = source.slice(metricBlockStart, metricBlockEnd);
assert.match(metricBlock, /olf-dish-set-measure__heading/);
assert.match(metricBlock, /<\/label>' \+ renderBuffetHelpExample\(buffetRuleHelpContent\(\{ kind: "shared_metric", metric: metric \}\)\)/, "help must sit outside the toggle label");
assert.match(source, /querySelectorAll\("\.olf-bound-example\[open\]"\)/, "clicking elsewhere must close open help examples");
assert.match(source, /querySelector\("\.olf-bound-example\[open\]"\)/, "Escape must find and close an open help example");
assert.match(source, /quantityDialog\.querySelector\("\.olf-bound-example\[open\]"\)/, "dialog cancel must close help before closing the quota dialog");
console.log(`verify-buffet-quota-help-examples: PASS (${cases.length} contexts)`);
