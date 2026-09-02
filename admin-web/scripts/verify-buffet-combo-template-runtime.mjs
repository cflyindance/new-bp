import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = {};
for (const file of ["buffet-rule-policy.js", "buffet-rule-domain.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(root, "dist/Configuration center/assets", file), "utf8"), { window, Date, Math, Number, String, Array, Object, JSON, Set, Error });
}
const domain = window.BuffetRuleDomain;
const cell = (value) => ({ configured: true, value });
const bounds = (min, max) => ({ minConfigured: true, min, maxConfigured: true, max });
const scenario = "party:pr_low|round:0";
const dishKey = `${scenario}|line:kiosk|target:a`;

assert.equal(domain.limitMultiplierMode("party_size", "targetLimits"), "party_multiplier");
assert.equal(domain.limitMultiplierMode("order", "targetLimits"), "table_fixed");
assert.equal(domain.limitMultiplierMode("party_size", "tableTargetCaps"), "table_fixed");

function combo({ perPerson = false, targetType = "dish", measureUnit = "piece", sameDish = false } = {}) {
  const targetMap = perPerson ? "targetLimits" : "tableTargetCaps";
  const values = { tableTotalBounds: { [scenario]: bounds(1, 8) }, tableTargetCaps: {}, targetLimits: {}, defaultDishLimits: {}, exceptionDishLimits: {} };
  values[targetMap][targetType === "dish" ? dishKey : scenario] = cell(2);
  if (sameDish) values.defaultDishLimits[scenario] = cell(3);
  return {
    id: `combo-${perPerson}-${targetType}-${measureUnit}`, version: 1, schemaVersion: 4,
    defaultScenarioKey: `combo|per_round|${targetType}${targetType === "dish_set" ? `|${measureUnit}` : ""}|${perPerson ? "party_size" : "table"}`,
    subject: "party_size", targetType, measureUnit, enabledPeriods: ["per_round"],
    periodPolicies: { per_round: { blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: sameDish } } },
    partyRanges: [{ rangeId: "pr_low", min: 1, max: 3 }, { rangeId: "pr_high", min: 4, max: null }],
    deployStoreIds: ["store-a"], authorization: { allowedScopes: [] },
    storeConfigs: { "store-a": {
      dishTargets: targetType === "dish" ? [{ productLineId: "kiosk", dishId: "a" }] : [],
      dishSetMembers: targetType === "dish_set" ? [{ productLineId: "kiosk", dishId: "a" }, { productLineId: "emenu", dishId: "b" }] : [],
      periodValues: { per_round: values },
    } },
  };
}

function evaluate(rule, partySize, quantity, counters = []) {
  return domain.evaluateBatch({
    context: { orderMode: "buffet", buffetSessionId: "session", storeId: "store-a", orderId: "order", partySize, roundNo: 1 },
    operationId: `${rule.id}-${partySize}-${quantity}-${counters.length}`, rules: [rule], counters: { order: [], round: counters },
    items: [{ productLineId: "kiosk", dishId: "a", quantity }], phase: "add",
  });
}

assert.equal(evaluate(combo({ perPerson: false }), 2, 3).violations.some((item) => item.code === "TARGET_LIMIT_EXCEEDED"), true, "固定 X 不乘人数");
assert.equal(evaluate(combo({ perPerson: true }), 2, 3).allowed, true, "人均 X 在 2 人时为 2X");
assert.equal(evaluate(combo({ perPerson: true }), 2, 5).violations.some((item) => item.effectiveLimit === 4), true);
assert.equal(evaluate(combo({ perPerson: true }), 3, 2, [{ productLineId: "kiosk", dishId: "a", quantity: 5 }]).violations.some((item) => item.effectiveLimit === 6), true, "当前轮累计必须包含历史数量");

const piece = combo({ perPerson: true, targetType: "dish_set", measureUnit: "piece", sameDish: true });
assert.equal(evaluate(piece, 2, 4).violations.some((item) => item.code === "SAME_DISH_LIMIT_EXCEEDED"), true, "P 始终固定整桌，不乘人数");
assert.equal(domain.evaluateBatch({
  context: { orderMode: "buffet", buffetSessionId: "session", storeId: "store-a", orderId: "order", partySize: 2, roundNo: 1 },
  operationId: "cross-line", rules: [piece], counters: { order: [], round: [] }, phase: "add",
  items: [{ productLineId: "kiosk", dishId: "a", quantity: 2 }, { productLineId: "emenu", dishId: "b", quantity: 3 }],
}).violations.some((item) => item.code === "TARGET_LIMIT_EXCEEDED"), true, "菜品集跨产线合并统计");

console.log("verify-buffet-combo-template-runtime: OK");
