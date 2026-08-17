import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const htmlPath = new URL("../dist/Configuration%20center/order-limit.html", import.meta.url);
const flowPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const [html, flow] = await Promise.all([readFile(htmlPath, "utf8"), readFile(flowPath, "utf8")]);

assert.match(html, /function formatRuleStoreLineLabel\(/, "规则列表应提供门店/产线文案格式化");
assert.match(html, /formatRuleStoreLineLabel\(rule\)\.replace\(\/；\/g,\s*"\\n"\)/, "多门店应换行展示");
assert.match(html, /white-space:pre-line/, "门店/产线列应支持换行显示");
assert.match(html, /门店\/产线/, "表头应展示门店/产线");
assert.match(html, /RULE_STORE_CATALOG/, "列表应具备门店名称映射");
assert.match(html, /RULE_LINE_NAMES/, "列表应具备产线名称映射");
assert.match(html, /未选产线/, "无产线时应展示未选产线");

assert.match(flow, /built\.storeLineLabel\s*=/, "保存规则时应写入 storeLineLabel");
assert.match(flow, /storeLineSummary\(storedDraft/, "保存规则时应按门店汇总产线");
assert.match(flow, /lineText \|\| "未选产线"/, "产线为空时应回退未选产线");

console.log("Order limit store/line list label verification passed");
