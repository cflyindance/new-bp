import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-domain.js"), "utf8");
const window = {};
vm.runInNewContext(source, { window, Date, Math, Number, String, Array, JSON, Error });
const domain = window.BuffetRuleDomain;

const context = { orderMode: "buffet", buffetSessionId: "session-1", storeId: "store-a", partySize: 2, roundNo: 1 };
const total = (id, subject, min, max) => ({
  id, version: 3, schemaVersion: 3, constraintKind: "round_total", subject, period: "per_round", targetType: null,
  supportedPartySizeMax: 8,
  partyRanges: [{ min: 1, max: null }],
  storeConfigs: { "store-a": { included: true, totalBounds: { "0|0": { minConfigured: min != null, min, maxConfigured: max != null, max } } } },
});

const merged = domain.mergeTotalBounds([total("fixed", "order", 2, 8), total("party", "party_size", 1, 3)], context);
assert.deepEqual({ ...merged, minRuleIds: Array.from(merged.minRuleIds), maxRuleIds: Array.from(merged.maxRuleIds) }, { valid: true, min: 2, max: 6, minRuleIds: ["fixed", "party"], maxRuleIds: ["fixed", "party"] });
assert.equal(domain.effectiveLimit(total("fixed", "order", 2, 8), { ...context, partySize: 9 }).code, "PARTY_SIZE_ABOVE_SUPPORTED_MAX");

const underMinimum = { operationId: "op-min", context, rules: [total("fixed", "order", 2, 8)], items: [{ productLineId: "p", dishId: "a", categoryId: "c", quantity: 1 }] };
assert.equal(domain.evaluateBatch({ ...underMinimum, phase: "add" }).allowed, true, "minimum is not checked while building a round");
assert.equal(domain.evaluateBatch({ ...underMinimum, phase: "submit_round" }).violations[0].code, "ROUND_TOTAL_MIN_NOT_MET");

const rules = [
  { id: "dish", version: 3, constraintKind: "target_max", subject: "order", period: "per_round", targetType: "dish", targets: [{ productLineId: "p", targetId: "a" }], limit: 1, supportedPartySizeMax: 8 },
  { id: "category", version: 3, constraintKind: "target_max", subject: "order", period: "per_round", targetType: "category", targets: [{ productLineId: "p", targetId: "c" }], supportedPartySizeMax: 8, storeConfigs: { "store-a": { limits: { "0|0|p|c": { configured: true, value: 1 } } } } },
  { id: "set", version: 3, constraintKind: "target_max", subject: "order", period: "per_round", targetType: "dish_set", limit: 1, supportedPartySizeMax: 8, storeConfigs: { "store-a": { dishSetMembers: [{ productLineId: "p", dishId: "a" }, { productLineId: "p", dishId: "b" }], dishSetLimits: { "0|0": { configured: true, value: 1 } } } } },
  { id: "same", version: 3, constraintKind: "same_dish_max", subject: "order", period: "per_round", targetType: null, limit: 1, supportedPartySizeMax: 8, storeConfigs: { "store-a": { included: true, sameDishLimits: { "0|0": { configured: true, value: 1 } } } } },
];
const twoA = [{ productLineId: "p", dishId: "a", categoryId: "c", quantity: 2 }];
const violations = domain.evaluateBatch({ operationId: "op-aggregate", context, phase: "add", rules, items: twoA }).violations;
assert.deepEqual(Array.from(violations, item => item.ruleId).sort(), ["category", "dish", "same", "set"]);

console.log("verify-buffet-per-round-runtime: OK");
