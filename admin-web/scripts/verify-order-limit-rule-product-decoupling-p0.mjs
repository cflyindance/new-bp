import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([
  readFile(jsPath, "utf8"),
  readFile(cssPath, "utf8"),
]);

assert.match(source, /quantityTemplate/, "草稿应包含 quantityTemplate");
assert.match(source, /brandTargetsByLine/, "scope 应包含 brandTargetsByLine");
assert.match(source, /localTargetsByStoreLine/, "scope 应包含 localTargetsByStoreLine");
assert.match(source, /function migrateStoreConfigsToDecoupled\(/, "应提供读时迁移");
assert.match(source, /function resolveLimitValue\(/, "应提供限购取值解析");
assert.match(source, /function materializeStoreConfigsFromDecoupled\(/, "应提供发布/编辑物化");
assert.match(source, /function allowedLines\(/, "应提供 allowedLines");
assert.match(source, /function scopeTargets\(/, "应提供 scopeTargets");
assert.match(source, /function cascadeRemoveTargetCells\(/, "应提供按 (line,targetKey) 级联删除");
assert.match(source, /function overridesOverlap\(/, "应提供例外重叠检测");
assert.match(source, /ambiguousKeys|localeCompare/, "迁移应含歧义键/字典序平局逻辑");

assert.match(source, /默认限购数量/, "步骤应含默认限购数量");
assert.match(source, /应用范围/, "步骤应含应用范围");
assert.match(source, /例外覆盖/, "步骤应含例外覆盖");

assert.match(source, /function renderStepDefaultLimits\(/, "应渲染默认限购数量步");
assert.match(source, /function renderStepScope\(/, "应渲染应用范围步");
assert.match(source, /function renderStepOverrides\(/, "应渲染例外覆盖步");

const defaultLimitsFn =
  source.match(/function renderStepDefaultLimits\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.ok(defaultLimitsFn.length > 80, "renderStepDefaultLimits 应存在且非空");
assert.doesNotMatch(defaultLimitsFn, /data-limit-store-select/, "默认限购数量步不得渲染配置门店下拉");

assert.match(source, /data-scope-tab/, "应用范围应有 Tab 标记");
assert.match(source, /productAddMode|data-product-add-mode/, "添加商品应支持 brand/local 模式");

assert.match(
  source,
  /lineIdsByStore[\s\S]{0,200}length\s*===\s*0|显式空数组|explicit empty/i,
  "应区分 lineIdsByStore 显式空数组与缺省推断",
);

assert.match(css, /\.olf-scope-tabs|\.olf-override-/, "应提供范围/例外相关样式");

console.log("Menu order limit rule-product decoupling P0 verification passed");
