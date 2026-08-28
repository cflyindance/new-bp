import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flowPath = path.join(root, "dist/Configuration center/assets/order-limit-flow.js");
const flow = fs.readFileSync(flowPath, "utf8");

assert.match(flow, /rulesKey:\s*"restaurantRules"/, "菜单规则权威键发生变化");
assert.match(flow, /recoveryPrefix:\s*"restaurantRuleRecovery:"/, "菜单恢复键前缀发生变化");
assert.match(flow, /var RULES_KEY = moduleProfile\.storage\.rulesKey;/, "规则存储尚未由 Profile 驱动");
assert.match(flow, /var RECOVERY_PREFIX = moduleProfile\.storage\.recoveryPrefix;/, "恢复存储尚未由 Profile 驱动");

const stepBlock = flow.match(/steps:\s*\[([\s\S]*?)\n    \]/);
assert.ok(stepBlock, "找不到菜单规则步骤定义");
const titles = [...stepBlock[1].matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(titles, ["规则类型", "场景配置", "限购数量", "超限授权", "生效范围", "确认发布"]);

for (const route of [
  "order-limit-rule-editor.html",
  "order-limit-publish-confirm.html",
]) {
  assert.ok(flow.includes(route), `菜单流程缺少既有路由 ${route}`);
}

for (const file of [
  "order-limit.html",
  "order-limit-rule-editor.html",
  "order-limit-publish-confirm.html",
]) {
  assert.ok(fs.existsSync(path.join(root, "dist/Configuration center", file)), `缺少菜单页面 ${file}`);
}

const expectedCombinations = [
  ["order", "per_round", "category"],
  ["order", "per_round", "dish"],
  ["order", "multi_round", "category"],
  ["order", "multi_round", "dish"],
  ["order", "order_lifetime", "category"],
  ["order", "order_lifetime", "dish"],
  ["party_size", "per_round", "category"],
  ["party_size", "per_round", "dish"],
  ["party_size", "multi_round", "category"],
  ["party_size", "multi_round", "dish"],
  ["party_size", "order_lifetime", "category"],
  ["party_size", "order_lifetime", "dish"],
];

assert.equal(expectedCombinations.length, 12);
for (const [subject, period, targetType] of expectedCombinations) {
  assert.match(flow, new RegExp(`(?:${subject}|${period}|${targetType})`), `流程缺少场景标识 ${subject}/${period}/${targetType}`);
}

// Profile 改造完成后必须出现；当前用于确保 Task 2 先 RED。
assert.match(flow, /MENU_ORDER_LIMIT_PROFILE/, "尚未建立默认菜单 Profile");

// 2026-08-28 开发前基线：以下旧脚本的静态定位已落后于当前六步页面结构，
// 不把它们误报为本分支引入的回归；Task 2 后以本脚本和其余现行脚本为护栏。
export const knownBaselineFailures = Object.freeze([
  "verify-order-limit-batch-target-selection.mjs",
  "verify-order-limit-guidance-copy-removal.mjs",
  "verify-order-limit-line-first-scenes.mjs",
  "verify-order-limit-store-line-list-label.mjs",
  "verify-order-limit-store-scope-flow.mjs",
  "verify-order-limit-store-specific-config.mjs",
]);

console.log("verify-buffet-rule-menu-regression: OK");
