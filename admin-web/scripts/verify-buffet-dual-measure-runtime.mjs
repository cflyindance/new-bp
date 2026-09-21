import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = {};
for (const file of ["buffet-rule-policy.js", "buffet-rule-domain.js"]) vm.runInNewContext(fs.readFileSync(path.join(root, "dist/Configuration center/assets", file), "utf8"), { window, Date, Math, Number, String, Array, Object, JSON, Set, Error });
const domain = window.BuffetRuleDomain;
const cell = value => ({ configured: true, value });
const scene = "p1|r1";
const rule = {
  id: "dual", version: 2, schemaVersion: 4, quotaSchemaVersion: 2, subject: "party_size", targetType: "dish_set",
  enabledPeriods: ["per_round"], periodPolicies: { per_round: { blocks: { targetEnabled: true, sameDishEnabled: false } } },
  partyRanges: [{ min: 1, max: null, rangeId: "p1" }], roundRanges: [{ min: 1, max: null, rangeId: "r1" }], deployStoreIds: ["s"],
  storeConfigs: { s: { dishSetMembers: [{ productLineId: "kiosk", dishId: "a" }, { productLineId: "kiosk", dishId: "b" }, { productLineId: "emenu", dishId: "c" }], periodValues: { per_round: {
    targetLimits: {}, tableTargetCaps: {}, defaultDishLimits: {}, exceptionDishLimits: {},
    measures: {
      piece: { enabled: { [scene]: true }, perPersonMax: { [scene]: cell(2) }, perTableMax: {} },
      kind: { enabled: { [scene]: true }, perPersonMax: { [scene]: cell(1) }, perTableMax: {} }
    }
  } } } }
};
const input = items => ({ context: { orderMode: "buffet", buffetSessionId: "x", storeId: "s", orderId: "o", partySize: 1, roundNo: 1 }, operationId: Math.random().toString(), rules: [rule], counters: { order: [], round: [] }, items, phase: "add" });

let result = domain.evaluateBatch(input([{ productLineId: "kiosk", dishId: "a", quantity: 2 }]));
assert.equal(result.allowed, true, "达到份数上限且只有一种时允许");
result = domain.evaluateBatch(input([{ productLineId: "kiosk", dishId: "a", quantity: 2 }, { productLineId: "kiosk", dishId: "b", quantity: 1 }]));
assert.equal(result.allowed, false);
assert.deepEqual(Array.from(result.violations, item => item.code), ["DISH_SET_KIND_LIMIT_EXCEEDED", "DISH_SET_PIECE_LIMIT_EXCEEDED"]);
assert.deepEqual(Array.from(result.violations, item => item.targetKey), ["dish_set:dual", "dish_set:dual"]);
result = domain.evaluateBatch(input([{ productLineId: "kiosk", dishId: "a", quantity: 1 }, { productLineId: "kiosk", dishId: "a", quantity: 1 }]));
assert.equal(result.violations.some(item => item.code === "DISH_SET_KIND_LIMIT_EXCEEDED"), false, "同商品增加份数不增加种数");
console.log("buffet dual measure runtime verification passed");
