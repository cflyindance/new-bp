import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const root = {};
const profile = {
  moduleId: "buffet-rule", storage: { rulesKey: "test", recoveryPrefix: "test:" }, steps: [],
  allowedPeriods: ["order_lifetime", "per_round", "multi_round"], allowedTargetTypes: ["dish", "category", "dish_set"],
  usesV4Capability(draft) { return Number(draft?.schemaVersion) >= 4; }, upgradeDraftToV4(draft) { return draft; }
};
const window = { ORDER_LIMIT_MODULE_PROFILE: profile, __BUFFET_V4_VALIDATION_TEST__: true, location: { search: "" }, BuffetRulePolicy: {
  scenarioKey: (party, round) => `${party}|${round}`, targetCellKey: (party, round, line, target) => `${party}|${round}|${line}|${target}`,
  menuIdentity: (item) => `${item.productLineId}|${item.dishId}`,
  normalizePeriodSelection: (draft) => ({ valid: (draft.enabledPeriods || []).length === 1, mode: "single", periods: draft.enabledPeriods || [], code: "PERIOD_COMBINATION_INVALID" })
} };
const document = { body: { getAttribute: () => "test" }, getElementById: () => root };
vm.runInNewContext(flow, { window, document, URLSearchParams, Number, String, Array, Object, Math, JSON, Date, Set, console });
const api = window.BuffetV4ValidationTestApi;

function draft(overrides = {}) {
  return {
    schemaVersion: 4, name: "测试规则", subject: "order", targetType: "dish", enabledPeriods: ["per_round"],
    periodPolicies: { per_round: { blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } } },
    partyRanges: [{ min: 1, max: null }], roundRanges: [{ min: 1, max: null }], targetIds: ["dish:a"],
    participatingStoreIds: ["store-a"], deployStoreIds: ["store-a"], deployExcludedStoreIds: [],
    authorization: { enabled: true, allowedScopes: ["operation", "round"], defaultScope: "round", scopePermissions: { operation: "经理", round: "经理" } },
    conditions: { activityCycle: "weekly", daysOfWeek: [1], daysOfMonth: [], effectiveFrom: "2026-08-31", effectiveTo: "", memberMode: "all", memberLevelIds: [], businessHourSlots: [{ id: "all", mode: "full" }], businessHourSetupMode: "all_full" },
    storeConfigs: { "store-a": { productLines: ["kiosk"], targetIds: ["dish:a"], dishTargets: [{ productLineId: "kiosk", dishId: "dish:a", name: "A" }], categoryTargets: [], dishSetMembers: [], structureByLine: { kiosk: [{ id: "dish:a", name: "A" }] }, periodValues: { per_round: { targetLimits: { "0|0|kiosk|dish:a": { configured: true, value: 2 } } } } } },
    ...overrides
  };
}

assert.equal(api.validateV4Draft(draft()), null, "完整 v4 草稿可发布");
assert.equal(api.validateV4Draft(draft({ enabledPeriods: [] })).code, "PERIOD_REQUIRED");
assert.equal(api.validateV4Draft(draft({ subject: "party_size", partyRanges: [{ min: 2, max: null }] })).code, "PARTY_RANGE_INVALID");
assert.equal(api.validateV4Draft(draft({ periodPolicies: { per_round: { blocks: { totalEnabled: false, targetEnabled: false, sameDishEnabled: false } } } })).code, "PERIOD_BLOCK_REQUIRED");
const missing = draft();
missing.storeConfigs["store-a"].periodValues.per_round.targetLimits = {};
assert.equal(api.validateV4Draft(missing).code, "QUANTITY_BLOCK_INCOMPLETE");
const reversed = draft();
reversed.periodPolicies.per_round.blocks.totalEnabled = true;
reversed.storeConfigs["store-a"].periodValues.per_round.totalBounds = { "0|0": { minConfigured: true, min: 4, maxConfigured: true, max: 2 } };
assert.equal(api.validateV4Draft(reversed).code, "BOUND_REVERSED");
const tooSmallDishSet = draft({ targetType: "dish_set", targetIds: ["dish_set"], storeConfigs: { "store-a": { productLines: ["kiosk"], targetIds: ["dish_set"], dishSetMembers: [{ productLineId: "kiosk", dishId: "dish:a", name: "A" }], structureByLine: { kiosk: [{ id: "dish:a", name: "A" }] }, periodValues: { per_round: { targetLimits: { "0|0": { configured: true, value: 2 } } } } } } });
assert.equal(api.validateV4Draft(tooSmallDishSet).code, "DISH_SET_MIN_MEMBERS");

const completion = api.quantityCompletion(draft(), ["store-a"]);
assert.deepEqual({ ...completion }, { complete: 1, total: 1 });
console.log("verify-buffet-v4-validation: PASS");
