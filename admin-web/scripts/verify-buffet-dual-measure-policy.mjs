import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"), "utf8"), { window, Number, String, Array, Object, Math, JSON, Set });
const policy = window.BuffetRulePolicy;
const plain = value => JSON.parse(JSON.stringify(value));
const cell = value => ({ configured: true, value });

assert.equal(policy.productKey({ productLineId: "kiosk", dishId: "beef" }), "kiosk:beef");

const oldOrder = {
  targetType: "dish_set", subject: "order", measureUnit: "piece",
  partyRanges: [{ min: 1, max: null, rangeId: "p1" }], roundRanges: [{ min: 1, max: null, rangeId: "r1" }],
  storeConfigs: { s1: { periodValues: { per_round: { targetLimits: { "p1|r1": cell(3) }, tableTargetCaps: {}, defaultDishLimits: { "p1|r1": cell(2) }, exceptionDishLimits: {} } } } }
};
const migratedOrder = policy.migrateDishSetQuotaV2(oldOrder);
assert.equal(migratedOrder.migrated, true);
assert.equal(migratedOrder.rule.quotaSchemaVersion, 2);
assert.deepEqual(plain(migratedOrder.rule.storeConfigs.s1.periodValues.per_round.measures.piece.perTableMax["p1|r1"]), cell(3));
assert.equal(migratedOrder.rule.storeConfigs.s1.periodValues.per_round.measures.piece.enabled["p1|r1"], true);
assert.equal(policy.migrateDishSetQuotaV2(migratedOrder.rule).migrated, false);

const oldParty = structuredClone(oldOrder);
oldParty.subject = "party_size";
oldParty.measureUnit = "kind";
const migratedParty = policy.migrateDishSetQuotaV2(oldParty).rule;
assert.deepEqual(plain(migratedParty.storeConfigs.s1.periodValues.per_round.measures.kind.perPersonMax["p1|r1"]), cell(3));

const state = policy.dishSetSceneMeasures(migratedOrder.rule, migratedOrder.rule.storeConfigs.s1, "per_round", 0, 0);
assert.equal(state.piece.enabled, true);
assert.equal(state.piece.perTableMax.value, 3);
assert.deepEqual(plain(policy.validateDishSetMeasures(migratedOrder.rule, migratedOrder.rule.storeConfigs.s1, "per_round", 0, 0)), { valid: true, sceneKey: "p1|r1" });

const empty = policy.normalizeRule({ targetType: "dish_set", subject: "order", enabledPeriods: ["per_round"], partyRanges: [{ rangeId: "p1" }], roundRanges: [{ rangeId: "r1" }], storeConfigs: { s1: { periodValues: {} } } });
assert.equal(policy.validateDishSetMeasures(empty, empty.storeConfigs.s1, "per_round", 0, 0).code, "DISH_SET_MEASURE_REQUIRED");

console.log("buffet dual measure policy verification passed");
