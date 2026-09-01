import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([
  readFile(jsPath, "utf8"),
  readFile(cssPath, "utf8"),
]);

assert.match(source, /scopeEntries/, "草稿应包含 scopeEntries");
assert.match(source, /function migrateScopeAndOverridesToEntries\(/, "应提供 scope→entries 迁移");
assert.match(source, /function renderStepScopeEntries\(/, "应渲染应用范围卡片步");
assert.match(source, /quantityMode/, "条目应支持 quantityMode inherit/override");

const stepsBlock = source.match(/var steps = \[[\s\S]*?\];/)?.[0] ?? "";
assert.match(stepsBlock, /应用范围/, "步骤应含应用范围");
assert.match(stepsBlock, /超限授权/, "步骤应含超限授权");
assert.match(stepsBlock, /生效范围/, "步骤应含生效范围");
const authIdx = stepsBlock.indexOf("超限授权");
const effectiveIdx = stepsBlock.indexOf("生效范围");
const scopeIdx = stepsBlock.indexOf("应用范围");
assert.ok(authIdx >= 0 && effectiveIdx >= 0 && scopeIdx >= 0, "步骤标题应齐全");
assert.ok(authIdx < effectiveIdx, "超限授权应排在生效范围之前");
assert.ok(effectiveIdx < scopeIdx, "生效范围应排在应用范围之前");
assert.doesNotMatch(stepsBlock, /例外覆盖/, "步骤序不应含独立例外覆盖步");

assert.match(source, /data-scope-entry-add/, "应用范围步应有新增入口");

const stepFiveFn =
  source.match(/function renderStepFive\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.ok(stepFiveFn.length > 80, "renderStepFive 应存在且非空");
assert.doesNotMatch(stepFiveFn, /data-effective-store/, "第 5 步不得含生效门店勾选");

assert.match(css, /\.olf-scope-entry-list/, "应有应用范围卡片列表样式");
assert.match(css, /\.olf-scope-entry-card/, "应有应用范围卡片样式");
assert.match(css, /\.olf-scope-entry-wizard/, "应有应用范围向导样式");

console.log("Menu order limit scopeEntries P0.1 verification passed");
