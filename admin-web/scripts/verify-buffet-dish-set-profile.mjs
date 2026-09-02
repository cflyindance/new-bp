import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policySource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"), "utf8");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");
const storage = new Map();
const window = {};
const context = {
  window,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};
vm.runInNewContext(policySource, context);
vm.runInNewContext(source, context);

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
assert.ok(profile.allowedTargetTypes.includes("dish_set"), "自助餐 profile 应允许 dish_set");
const dishSetScenarios = profile.defaultScenarios.filter((item) => item.targetType === "dish_set");
assert.equal(profile.defaultScenarios.length, 18, "自助餐规则应包含 4 条整单、6 条组合和 8 条每轮原子默认场景");
assert.equal(dishSetScenarios.length, 10, "菜品集默认规则应包含 2 条整单、4 条组合和 4 条按份/按种每轮原子规则");
assert.equal(profile.defaultScenarios.some((item) => item.targetType === "category"), false, "分类不属于系统默认场景");
assert.deepEqual(
  [...new Set(dishSetScenarios.map((item) => item.subject))].sort(),
  ["order", "party_size"].sort(),
);

for (const scenario of dishSetScenarios) {
  const record = profile.createDefaultScenarioRule(scenario, 1);
  assert.equal(record.status, "disabled");
  assert.equal(record.authoringConfig.schemaVersion, 4);
  assert.equal(record.authoringConfig.targetType, "dish_set");
  assert.equal(record.method, "按菜品集限购");
  assert.equal(record.defaultScenarioKey, scenario.key);
}

console.log("verify-buffet-dish-set-profile: OK");
