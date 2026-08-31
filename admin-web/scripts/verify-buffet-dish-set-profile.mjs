import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");
const storage = new Map();
const window = {};
vm.runInNewContext(source, {
  window,
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  Date,
  Math,
  JSON,
  Error,
});

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
assert.ok(profile.allowedTargetTypes.includes("dish_set"), "自助餐 profile 应允许 dish_set");
const dishSetScenarios = profile.defaultScenarios.filter((item) => item.targetType === "dish_set");
assert.equal(profile.defaultScenarios.length, 12, "自助餐规则应包含 12 个合法场景");
assert.equal(dishSetScenarios.length, 4, "应补充 4 个菜品集场景");
assert.deepEqual(
  [...new Set(dishSetScenarios.map((item) => `${item.subject}|${item.period}`))].sort(),
  ["order|order_lifetime", "party_size|multi_round", "party_size|order_lifetime", "party_size|per_round"].sort(),
);

for (const scenario of dishSetScenarios) {
  const record = profile.createDefaultScenarioRule(scenario, 1);
  assert.equal(record.status, "disabled");
  assert.equal(record.authoringConfig.schemaVersion, 2);
  assert.equal(record.authoringConfig.targetType, "dish_set");
  assert.equal(record.method, "按菜品集限购");
}

console.log("verify-buffet-dish-set-profile: OK");
