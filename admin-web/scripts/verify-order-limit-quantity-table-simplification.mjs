import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const flowPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(flowPath, "utf8"), readFile(cssPath, "utf8")]);

const rowsRenderer = source.match(/function renderLimitRows\(draft\)[\s\S]*?(?=\n\s*function renderStepFourLegacy)/)?.[0];
assert.ok(rowsRenderer, "应能定位限购数量行渲染函数");
assert.match(rowsRenderer, /data-limit-target=/, "单项数量输入应继续绑定目标商品或分类");
assert.match(rowsRenderer, /type=["']number["'][\s\S]*?min=["']0["']/, "数量输入应继续沿用非负数约束");
assert.doesNotMatch(rowsRenderer, /stateText|stateClass|actual|olf-limit-state/, "数量行不应继续计算或渲染状态和实际限额");

const currentStepRenderer = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0];
assert.ok(currentStepRenderer, "应能定位当前限购数量步骤渲染函数");
assert.doesNotMatch(currentStepRenderer, /<th>状态<\/th>|<th>实际限额<\/th>/, "当前产线配置表格不应展示状态和实际限额表头");
assert.match(currentStepRenderer, /selectHeader[\s\S]*?data-limit-target|selectHeader[\s\S]*?renderLimitRows/, "批量选择列和数量行应继续组合渲染");

const legacyStepRenderer = source.match(/function renderStepFourLegacy\(draft\)[\s\S]*?(?=\n\s*function renderStepFour)/)?.[0];
assert.ok(legacyStepRenderer, "应能定位兼容限购数量步骤渲染函数");
assert.doesNotMatch(legacyStepRenderer, /<th>状态<\/th>|<th>实际限额<\/th>/, "兼容表格也不应保留已移除的冗余表头");

assert.match(source, /data-apply-batch=["']zero["']/, "批量设为禁止能力应继续保留");
assert.match(source, /mode\s*===\s*["']value["']\s*\?\s*Number\(input\.value\)\s*:\s*0/, "批量设为禁止应继续把数量写为 0");
assert.match(source, /configured:\s*true,\s*value:\s*value/, "批量数量 0 应继续保存为已配置状态");
assert.match(source, /target\.value\s*===\s*["']["'][\s\S]{0,180}configured:\s*true/, "单项输入 0 应继续保存为已配置状态");
assert.doesNotMatch(css, /\.olf-limit-state(?:\s|\.|\{)/, "状态列移除后不应保留专用状态样式");

console.log("Menu order limit quantity table simplification verification passed");
