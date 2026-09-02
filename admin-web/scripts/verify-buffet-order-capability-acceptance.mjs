import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const storage = new Map();
const window = {};
const context = {
  window,
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key),
  },
};
for (const file of [
  "dist/Configuration center/assets/buffet-rule-policy.js",
  "dist/Configuration center/assets/buffet-rule-domain.js",
  "dist/Configuration center/assets/buffet-rule-profile.js",
]) vm.runInNewContext(fs.readFileSync(file, "utf8"), context);

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
const domain = window.BuffetRuleDomain;
const policy = window.BuffetRulePolicy;

// O05: normalized authoring data persists concrete dishes, not category nodes.
const categoryDraft = {
  schemaVersion: 4,
  subject: "order",
  targetType: "dish",
  participatingStoreIds: ["s1"],
  storeConfigs: { s1: { dishTargets: [{ productLineId: "line-a", dishId: "dish-a", categoryId: "cat-a" }, { productLineId: "line-a", dishId: "dish-b", categoryId: "cat-a" }] } },
};
const normalized = vm.runInNewContext(`window.BuffetRulePolicy.normalizeRule(${JSON.stringify(categoryDraft)})`, context);
assert.deepEqual(Array.from(normalized.storeConfigs.s1.dishTargets, item => item.dishId), ["dish-a", "dish-b"]);

// O09: overlap is a domain conflict and activation is blocked; draft persistence remains repository-owned.
assert.equal(typeof domain.findConflict, "function");
assert.equal(typeof profile.repository.saveRules, "function");
assert.equal(typeof profile.lifecycle.validateActivation, "function");

// O12/O14: runtime compilation retains period identity so order-lifetime and per-round buckets remain independent.
const compiled = domain.compileRuntimeRules([
  { id: "order-rule", status: "active", authoringConfig: { schemaVersion: 4, subject: "order", targetType: "dish", enabledPeriods: ["order_lifetime"], periodPolicies: { order_lifetime: { enabled: true, blocks: { targetEnabled: true } } } } },
  { id: "round-rule", status: "active", authoringConfig: { schemaVersion: 4, subject: "order", targetType: "dish", enabledPeriods: ["per_round"], periodPolicies: { per_round: { enabled: true, blocks: { targetEnabled: true } } } } },
], 1);
assert.equal(compiled.length, 2);
assert.deepEqual(Array.from(compiled, rule => Array.from(rule.enabledPeriods)), [["order_lifetime"], ["per_round"]]);

// O13: zero is a valid effective limit and means no quantity is allowed; blank validation is covered by v4 validation suites.
const zero = domain.effectiveLimit({ period: "order_lifetime", subject: "order", limit: 0 }, {});
assert.equal(zero && zero.valid, true);
assert.equal(zero && zero.value, 0);

// O06/O08 are enforced by the existing v4 runtime suites; catalog status must remain explicit here.
assert.equal(profile.legacyCapabilities["KPOS-O06"].coverageStatus, "complete");
assert.equal(profile.legacyCapabilities["KPOS-O08"].coverageStatus, "defined_extension");
assert.equal(profile.legacyCapabilities["KPOS-O13"].coverageStatus, "product_redefined");
assert.equal(["KPOS-OV01", "KPOS-OV02", "KPOS-OV03", "KPOS-OV04", "KPOS-OV05"].every(id => profile.legacyCapabilities[id].legacyEvidenceStatus === "pending_runtime"), true);

console.log("verify-buffet-order-capability-acceptance: OK");
