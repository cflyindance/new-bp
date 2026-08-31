import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = {};
for (const file of ["buffet-rule-policy.js", "buffet-rule-domain.js"]) {
  vm.runInNewContext(
    fs.readFileSync(path.join(root, "dist/Configuration center/assets", file), "utf8"),
    { window, Date, Math, Number, String, Array, Object, JSON, Set, Error }
  );
}
const domain = window.BuffetRuleDomain;
const cell = (value) => ({ configured: true, value });
const bounds = (min, max) => ({ minConfigured: min != null, min: min ?? null, maxConfigured: max != null, max: max ?? null });
const always = { activityCycle: "daily", memberMode: "all" };

// 同一菜品的正负原子变更先按净变化合并，再统一截断为非负；输入顺序不应改变候选数量。
const mixedChanges = (items) => domain.evaluateBatch({
  context: { orderMode: "buffet", buffetSessionId: "session", storeId: "store-a", orderId: "order", partySize: 2, roundNo: 1 },
  operationId: "op-mixed",
  rules: [rule({ enabledPeriods: ["per_round"], periodPolicies: { per_round: { blocks: { totalEnabled: false, targetEnabled: false, sameDishEnabled: false } } } })],
  counters: { order: [], round: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 1 }] },
  items,
  phase: "add"
});
assert.equal(mixedChanges([{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: -4 }, { productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 4 }]).candidate.round["kiosk|a"].quantity, 1);
assert.equal(mixedChanges([{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 4 }, { productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: -4 }]).candidate.round["kiosk|a"].quantity, 1);

function rule(overrides = {}) {
  return {
    id: "rule-1", version: 7, schemaVersion: 4, subject: "party_size", targetType: "dish_set", measureUnit: "piece",
    enabledPeriods: ["order_lifetime", "per_round", "multi_round"],
    periodPolicies: {
      order_lifetime: { blocks: { targetEnabled: true } },
      per_round: { blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: true } },
      multi_round: { blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: false } },
    },
    partyRanges: [{ min: 1, max: 2 }, { min: 3, max: null }],
    roundRanges: [{ min: 1, max: 1 }, { min: 2, max: null }],
    deployStoreIds: ["store-a"], conditions: always,
    storeConfigs: {
      "store-a": {
        productLines: ["kiosk", "emenu"],
        dishTargets: [], categoryTargets: [],
        dishSetMembers: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot" }, { productLineId: "emenu", dishId: "b", categoryId: "hot" }],
        periodValues: {
          order_lifetime: { targetLimits: { "0|0": cell(4) } },
          per_round: {
            totalBounds: { "1|0": bounds(1, 4) }, tableTotalBounds: { "1|0": bounds(null, 5) },
            targetLimits: { "1|0": cell(3) }, tableTargetCaps: { "1|0": cell(5) },
            defaultDishLimits: { "1|0": cell(1) },
            exceptionDishLimits: { "1|0": [{ dishes: [{ productLineId: "kiosk", dishId: "a" }], limit: cell(2) }] },
          },
          multi_round: { totalBounds: { "1|1": bounds(null, 2) }, targetLimits: { "1|1": cell(2) } },
        },
      },
    },
    ...overrides,
  };
}

const compiled = domain.compileRuntimeRules([{ id: "r", status: "active", version: 9, authoringConfig: rule() }], 99);
assert.equal(compiled.length, 1);
assert.equal(compiled[0].version, 9);
assert.deepEqual([...compiled[0].deployStoreIds], ["store-a"]);
assert.equal(compiled[0].storeConfigs["store-a"].periodValues.per_round.defaultDishLimits["1|0"].value, 1);

const context = { orderMode: "buffet", buffetSessionId: "session", storeId: "store-a", orderId: "order", partySize: 3, roundNo: 2 };
const base = { operationId: "op-1", context, rules: [rule()], counters: { order: [], round: [] } };

// 同时命中整单、每轮与分轮次；整批校验不得部分接受。
let result = domain.evaluateBatch({ ...base, items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 7 }, { productLineId: "emenu", dishId: "b", categoryId: "hot", quantity: 1 }], phase: "add" });
assert.equal(result.allowed, false);
assert.ok(result.violations.some((item) => item.code === "TARGET_LIMIT_EXCEEDED"));
assert.ok(result.violations.some((item) => item.code === "SAME_DISH_LIMIT_EXCEEDED"));
assert.equal(result.acceptedItems, undefined);

// 例外菜品为 2，默认单品为 1；人均 3 × 3 与整桌 5 取严格的 5。
result = domain.evaluateBatch({ ...base, operationId: "op-2", items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 2 }], phase: "add" });
assert.equal(result.allowed, true);
result = domain.evaluateBatch({ ...base, operationId: "op-3", items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 7 }], phase: "add" });
assert.equal(result.allowed, false);
assert.ok(result.violations.some((item) => item.code === "SAME_DISH_LIMIT_EXCEEDED"));
const operationCredential = { storeId: "store-a", orderId: "order", scope: "operation", operationId: "op-3-auth", ruleRefs: [
  { id: "rule-1", version: 7, period: "per_round", target: "__total__", approvedQuantity: 7 },
  { id: "rule-1", version: 7, period: "per_round", target: "__dish_set__", approvedQuantity: 7 },
  { id: "rule-1", version: 7, period: "per_round", target: "kiosk|a", approvedQuantity: 7 }
] };
const authorizedRule = rule({ enabledPeriods: ["per_round"], authorization: { allowedScopes: ["operation"] } });
result = domain.evaluateBatch({ ...base, operationId: "op-3-auth", rules: [authorizedRule], items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 7 }], phase: "add", authorizationCredential: operationCredential });
assert.equal(result.allowed, true, "授权只放行已命中的上限，并将结果接受进入候选统计");
result = domain.evaluateBatch({ ...base, operationId: "op-3-retry", rules: [authorizedRule], items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 8 }], phase: "add", authorizationCredential: { ...operationCredential, operationId: "op-3-retry" } });
assert.equal(result.allowed, false, "超过批准的最终数量后必须重新授权");

// 分轮次于第二轮起生效；分类桶按产线分类身份聚合。
const categoryRule = rule({ id: "category", subject: "order", targetType: "category", measureUnit: "piece", storeConfigs: {
  "store-a": { productLines: ["kiosk"], dishTargets: [], categoryTargets: [{ productLineId: "kiosk", categoryId: "hot" }], dishSetMembers: [], periodValues: {
    multi_round: { targetLimits: { "0|1|kiosk|hot": cell(2) } },
  } },
} });
result = domain.evaluateBatch({ ...base, operationId: "op-4", rules: [categoryRule], items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 1 }, { productLineId: "kiosk", dishId: "c", categoryId: "hot", quantity: 2 }], phase: "add" });
assert.equal(result.allowed, false);
assert.equal(result.violations[0].code, "TARGET_LIMIT_EXCEEDED");

// 每轮菜品总数不受本规则已选菜单范围限制；未选菜品也必须进入总量上下限。
const totalRule = rule({ id: "total", subject: "order", targetType: "dish", enabledPeriods: ["per_round"], periodPolicies: { per_round: { blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: false } } }, storeConfigs: {
  "store-a": { productLines: ["kiosk"], dishTargets: [{ productLineId: "kiosk", dishId: "a" }], categoryTargets: [], dishSetMembers: [], periodValues: { per_round: { totalBounds: { "0|0": bounds(2, 2) } } } }
} });
result = domain.evaluateBatch({ ...base, operationId: "op-total-max", rules: [totalRule], items: [{ productLineId: "kiosk", dishId: "not-selected", categoryId: "cold", quantity: 3 }], phase: "add" });
assert.equal(result.allowed, false, "未选菜品不得绕过每轮总量上限");
assert.equal(result.violations[0].code, "TOTAL_LIMIT_EXCEEDED");
result = domain.evaluateBatch({ ...base, operationId: "op-total-min", rules: [totalRule], items: [{ productLineId: "kiosk", dishId: "not-selected", categoryId: "cold", quantity: 1 }], phase: "submit_round" });
assert.equal(result.allowed, false, "仅有未选菜品时仍须按完整轮次桶检查最低总量");
assert.equal(result.violations[0].code, "TOTAL_MIN_NOT_MET");

// 菜品集按份只统计集合成员；集合外菜品不应占用该集合的目标额度。
const pieceRule = rule({ id: "piece", subject: "order", measureUnit: "piece", enabledPeriods: ["per_round"], periodPolicies: { per_round: { blocks: { targetEnabled: true } } }, storeConfigs: {
  "store-a": { productLines: ["kiosk"], dishTargets: [], categoryTargets: [], dishSetMembers: [{ productLineId: "kiosk", dishId: "a" }], periodValues: { per_round: { targetLimits: { "0|0": cell(1) } } } }
} });
result = domain.evaluateBatch({ ...base, operationId: "op-piece-external", rules: [pieceRule], items: [{ productLineId: "kiosk", dishId: "not-selected", categoryId: "cold", quantity: 8 }], phase: "add" });
assert.equal(result.allowed, true, "菜品集按份不统计集合外菜品");

// 菜品集按“种”跨产线计数，已有 a 后新增 b 可到 2，第三种会被拒绝。
const kindRule = rule({ id: "kind", subject: "order", measureUnit: "kind", enabledPeriods: ["per_round"], periodPolicies: { per_round: { blocks: { targetEnabled: true } } }, storeConfigs: {
  "store-a": { productLines: ["kiosk", "emenu"], dishTargets: [], categoryTargets: [], dishSetMembers: [{ productLineId: "kiosk", dishId: "a" }, { productLineId: "emenu", dishId: "b" }, { productLineId: "emenu", dishId: "c" }], periodValues: { per_round: { targetLimits: { "0|0": cell(2) } } } }
} });
result = domain.evaluateBatch({ ...base, operationId: "op-5", rules: [kindRule], counters: { order: [], round: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 9 }] }, items: [{ productLineId: "emenu", dishId: "b", categoryId: "hot", quantity: 1 }], phase: "add" });
assert.equal(result.allowed, true);
result = domain.evaluateBatch({ ...base, operationId: "op-6", rules: [kindRule], counters: { order: [], round: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 1 }, { productLineId: "emenu", dishId: "b", categoryId: "hot", quantity: 1 }] }, items: [{ productLineId: "emenu", dishId: "c", categoryId: "hot", quantity: 1 }], phase: "add" });
assert.equal(result.allowed, false);
result = domain.evaluateBatch({ ...base, operationId: "op-6-close", rules: [kindRule], counters: { order: [], round: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 1 }, { productLineId: "emenu", dishId: "b", categoryId: "hot", quantity: 1 }, { productLineId: "emenu", dishId: "c", categoryId: "hot", quantity: 1 }] }, items: [], phase: "close_round" });
assert.equal(result.allowed, false, "结束当前轮必须重新阻断历史统计中已存在的超额");
assert.equal(result.violations[0].code, "TARGET_LIMIT_EXCEEDED");

// 负向变更释放已用额度，且不会把数量降到 0 以下。
result = domain.evaluateBatch({ ...base, operationId: "op-7", rules: [kindRule], counters: { order: [], round: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 1 }] }, items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: -4 }], phase: "change" });
assert.equal(result.allowed, true);
assert.equal(result.candidate.round["kiosk|a"].quantity, 0);

// 最低值仅在轮次提交类阶段校验；授权不得绕过最低值。
const minimumRule = rule({ id: "minimum", subject: "order", targetType: "dish", enabledPeriods: ["per_round"], periodPolicies: { per_round: { blocks: { totalEnabled: true, targetEnabled: false } } }, storeConfigs: {
  "store-a": { productLines: ["kiosk"], dishTargets: [{ productLineId: "kiosk", dishId: "a" }], categoryTargets: [], dishSetMembers: [], periodValues: { per_round: { totalBounds: { "0|0": bounds(2, null) } } } }
} });
result = domain.evaluateBatch({ ...base, operationId: "op-8", rules: [minimumRule], items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 1 }], phase: "add" });
assert.equal(result.allowed, true);
result = domain.evaluateBatch({ ...base, operationId: "op-9", rules: [minimumRule], items: [{ productLineId: "kiosk", dishId: "a", categoryId: "hot", quantity: 1 }], phase: "submit_round", authorizationCredential: { storeId: "store-a", orderId: "order", scope: "operation", operationId: "op-9", ruleRefs: [{ id: "minimum", version: 7, period: "per_round", target: "__total__", approvedQuantity: 1 }] } });
assert.equal(result.allowed, false);
assert.equal(result.violations[0].code, "TOTAL_MIN_NOT_MET");

// 同一操作幂等；整单规则没有当前轮授权。
assert.equal(domain.evaluateBatch({ ...base, processedOperationIds: ["op-1"], items: [], phase: "add" }).duplicate, true);
const auth = { storeId: "store-a", orderId: "order", roundNo: 2, scope: "round", ruleRefs: [{ id: "rule-1", version: 7 }] };
assert.equal(domain.validateAuthorizationCredential(auth, [{ ruleId: "rule-1", ruleVersion: 7, period: "order_lifetime", code: "TARGET_LIMIT_EXCEEDED" }], context), false);

console.log("verify-buffet-v4-runtime: PASS");
