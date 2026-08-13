import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.doesNotMatch(source, /data-set-unlimited/, "不应继续渲染或处理单项不限制操作");
assert.doesNotMatch(source, /data-apply-batch=["']unlimited["']/, "批量工具栏不应继续提供不限制操作");
assert.doesNotMatch(source, /设为不限制|显式设为不限制|不限制场景/, "规则编辑流程不应继续展示不限制口径");
assert.doesNotMatch(css, /\.olf-limit-state\.is-unlimited/, "应删除不再使用的不限制状态样式");

const stepFour = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0];
assert.ok(stepFour, "应能定位产线数量配置渲染函数");
assert.doesNotMatch(stepFour, /<th>操作<\/th>/, "产线配置表不应继续展示操作列");

assert.match(source, /function normalizeUnlimitedLimitCells\(draft\)/, "应提供草稿限额归一化函数");
assert.match(source, /cell\.configured\s*&&\s*cell\.value\s*==\s*null/, "应识别历史明确不限制状态");
assert.match(source, /configured:\s*false,\s*value:\s*null/, "历史不限制应恢复为未配置");
assert.match(source, /function normalizeUnlimitedRule\(rule\)/, "应统一归一化草稿和兼容层数据");

const loadRules = source.match(/function loadRules\(\)[\s\S]*?(?=\n\s*function saveRules)/)?.[0];
assert.ok(loadRules, "应能定位规则读取函数");
assert.match(loadRules, /normalizeUnlimitedRule/, "所有规则读取入口都应执行归一化");
assert.match(loadRules, /localStorage\.setItem\(RULES_KEY/, "发现历史状态后应立即持久化");

const compatibility = source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function toast)/)?.[0];
assert.ok(compatibility, "应能定位兼容规则构建函数");
assert.match(compatibility, /normalizeUnlimitedLimitCells\(draft\)/, "兼容输出前应防御性归一化");

assert.match(source, /data-apply-batch=["']value["']/, "批量应用数量能力应保留");
assert.match(source, /data-apply-batch=["']zero["']/, "批量设为禁止能力应保留");
assert.match(source, /data-limit-target=/, "单项数量输入能力应保留");

console.log("Menu order limit unlimited removal verification passed");
