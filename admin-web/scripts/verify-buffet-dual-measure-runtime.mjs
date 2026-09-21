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

const exceeding = input([{ productLineId: "kiosk", dishId: "a", quantity: 2 }, { productLineId: "kiosk", dishId: "b", quantity: 1 }]);
const raw = domain.evaluateBatch(exceeding);
const refs = raw.violations.map(item => ({
  id: item.ruleId, version: item.ruleVersion, period: item.period,
  metric: item.metric, sceneKey: item.sceneKey, targetKey: item.targetKey,
  approvedLimit: item.configuredLimit, approvedQuantity: item.candidateValue
}));
const credential = ruleRefs => ({ storeId: "s", orderId: "o", operationId: exceeding.operationId, scope: "operation", ruleRefs });
rule.authorization = { enabled: true, allowedScopes: ["operation"] };
exceeding.authorizationCredential = credential([refs.find(item => item.metric === "piece")]);
result = domain.evaluateBatch(exceeding);
assert.deepEqual(Array.from(result.violations, item => item.metric), ["kind"], "按份授权不能放行按种超限");
exceeding.authorizationCredential = credential([refs.find(item => item.metric === "kind")]);
result = domain.evaluateBatch(exceeding);
assert.deepEqual(Array.from(result.violations, item => item.metric), ["piece"], "按种授权不能放行按份超限");
exceeding.authorizationCredential = credential(refs);
result = domain.evaluateBatch(exceeding);
assert.equal(result.allowed, true, "两个精确授权引用可以放行两个超限项");
exceeding.authorizationCredential = credential(refs.map(item => ({ ...item, sceneKey: "wrong" })));
result = domain.evaluateBatch(exceeding);
assert.equal(result.allowed, false, "场景不匹配的授权不能放行");
console.log("buffet dual measure runtime verification passed");
