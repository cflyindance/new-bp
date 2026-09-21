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
assert.deepEqual(plain(policy.validateDishSetMeasures(empty, empty.storeConfigs.s1, "per_round", 0, 0)), { valid: true, empty: true, sceneKey: "p1|r1" }, "全部关闭应作为未配置状态，而不是校验错误");

const copied = policy.copyDishSetSceneQuota(migratedOrder.rule.storeConfigs.s1.periodValues.per_round, {}, "p1|r1", "p2|r1");
assert.equal(copied.measures.piece.enabled["p2|r1"], true);
assert.deepEqual(plain(copied.measures.piece.perTableMax["p2|r1"]), cell(3));
copied.measures.piece.perTableMax["p2|r1"].value = 8;
assert.equal(migratedOrder.rule.storeConfigs.s1.periodValues.per_round.measures.piece.perTableMax["p1|r1"].value, 3, "复制后不能共享引用");

const batchSource = plain(migratedOrder.rule);
batchSource.subject = "party_size";
batchSource.partyRanges.push({ min: 4, max: null, rangeId: "p2" });
const batchOriginal = plain(batchSource);
let batch = policy.applyDishSetMetricBatch(batchSource, [
  { storeId: "s1", period: "per_round", partyIndex: 0, roundIndex: 0 },
  { storeId: "s1", period: "per_round", partyIndex: 1, roundIndex: 0 }
], { piece: { mode: "disable_and_clear" }, kind: { mode: "ignore" } });
assert.equal(batch.ok, true, "关闭唯一计量方式应成功并回到未配置状态");
assert.notEqual(batch.draft.storeConfigs.s1.periodValues.per_round.measures.piece.enabled["p1|r1"], true);
assert.deepEqual(plain(batchSource), batchOriginal, "批量操作不能修改传入的原草稿");
batch = policy.applyDishSetMetricBatch(batchSource, [
  { storeId: "s1", period: "per_round", partyIndex: 0, roundIndex: 0 },
  { storeId: "s1", period: "per_round", partyIndex: 1, roundIndex: 0 }
], { piece: { mode: "enable_and_set", perTableMax: 0 }, kind: { mode: "ignore" } });
assert.equal(batch.ok, true);
assert.equal(batch.draft.storeConfigs.s1.periodValues.per_round.measures.piece.perTableMax["p2|r1"].value, 0, "显式零值必须保留");

console.log("buffet dual measure policy verification passed");
