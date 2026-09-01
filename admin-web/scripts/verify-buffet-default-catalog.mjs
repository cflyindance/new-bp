import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policySource = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"),
  "utf8",
);
const profileSource = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"),
  "utf8",
);
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
vm.runInNewContext(profileSource, context);

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
const expectedKeys = [
  "order|order_lifetime|dish",
  "order|order_lifetime|dish_set",
  "party_size|order_lifetime|dish",
  "party_size|order_lifetime|dish_set",
  "order|per_round|dish",
  "order|per_round|dish_set",
  "party_size|per_round|dish",
  "party_size|per_round|dish_set",
];

assert.deepEqual(Array.from(profile.defaultScenarios, (item) => item.key), expectedKeys);
assert.equal(profile.defaultScenarios.every((item) => item.version === 2), true);
assert.deepEqual(Array.from(profile.defaultScenarios, (item) => item.group), [
  "order_lifetime", "order_lifetime", "order_lifetime", "order_lifetime",
  "per_round", "per_round", "per_round", "per_round",
]);

for (const [index, template] of profile.defaultScenarios.entries()) {
  const rule = profile.createDefaultScenarioRule(template, index + 1);
  assert.equal(rule.status, "disabled");
  assert.equal(rule.origin, "system_default");
  assert.equal(rule.defaultScenarioKey, template.key);
  assert.equal(rule.defaultCatalogVersion, 2);
  assert.equal(rule.authoringConfig.origin, "system_default");
  assert.equal(rule.authoringConfig.defaultScenarioKey, template.key);
  assert.equal(rule.authoringConfig.defaultCatalogVersion, 2);
  assert.equal(rule.editorDraft.defaultScenarioKey, template.key);
  assert.equal(rule.editorDraft.defaultCatalogVersion, 2);
  assert.deepEqual(Array.from(rule.authoringConfig.enabledPeriods), Array.from(template.enabledPeriods));
  assert.deepEqual(Array.from(rule.authoringConfig.participatingStoreIds), []);
  assert.deepEqual(Array.from(rule.authoringConfig.deployStoreIds), []);
  assert.deepEqual(Object.keys(rule.authoringConfig.storeConfigs), []);
}

const byKey = Object.fromEntries(profile.defaultScenarios.map((item) => [item.key, item]));
assert.deepEqual(
  { ...byKey["order|per_round|dish"].blocks },
  { totalEnabled: true, targetEnabled: true, sameDishEnabled: false },
);
assert.deepEqual(
  { ...byKey["party_size|per_round|dish"].blocks },
  { totalEnabled: true, targetEnabled: true, sameDishEnabled: false },
);
assert.deepEqual(
  { ...byKey["order|per_round|dish_set"].blocks },
  { totalEnabled: false, targetEnabled: true, sameDishEnabled: true },
);
assert.deepEqual(
  { ...byKey["party_size|per_round|dish_set"].blocks },
  { totalEnabled: false, targetEnabled: true, sameDishEnabled: true },
);

console.log("verify-buffet-default-catalog: OK");
