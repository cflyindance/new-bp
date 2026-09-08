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
const window = {
  ORDER_LIMIT_MODULE_PROFILE: profile,
  __BUFFET_V4_VALIDATION_TEST__: true,
  location: { search: "" },
  BuffetRulePolicy: {
    scenarioKey: (party, round) => `${party}|${round}`,
    targetCellKey: (party, round, line, target) => `${party}|${round}|${line}|${target}`,
    menuIdentity: (item) => `${item.productLineId}|${item.dishId}`,
    normalizePeriodSelection: (draft) => ({ valid: (draft.enabledPeriods || []).length === 1, periods: draft.enabledPeriods || [] }),
    allowedLimitBlocks: (_draft, period) => ({ total: period !== "order_lifetime", target: true, sameDish: period !== "order_lifetime" })
  }
};
const document = { body: { getAttribute: () => "test" }, getElementById: () => root };
vm.runInNewContext(flow, { window, document, URLSearchParams, Number, String, Array, Object, Math, JSON, Date, Set, console });
const api = window.BuffetV4ValidationTestApi;

function createDraft() {
  return {
    schemaVersion: 4,
    subject: "order",
    targetType: "dish_set",
    enabledPeriods: ["per_round"],
    periodPolicies: { per_round: { blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: true } } },
    partyRanges: [{ rangeId: "p1", min: 1, max: null }],
    roundRanges: [{ rangeId: "r1", min: 1, max: null }],
    participatingStoreIds: ["store-a"],
    storeConfigs: {
      "store-a": {
        targetIds: ["dish_set"],
        dishSetMembers: [
          { productLineId: "kiosk", dishId: "dish-a" },
          { productLineId: "kiosk", dishId: "dish-b" }
        ],
        periodValues: {
          per_round: {
            totalBounds: {}, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {},
            defaultDishLimits: {}, exceptionDishLimits: {}
          }
        }
      }
    }
  };
}

const draft = createDraft();
assert.equal(typeof api.deriveQuantityBlocks, "function", "validation API must expose quantity-derived compatibility state");
api.deriveQuantityBlocks(draft);
assert.deepEqual({ ...draft.periodPolicies.per_round.blocks }, { totalEnabled: false, targetEnabled: false, sameDishEnabled: false });

const values = draft.storeConfigs["store-a"].periodValues.per_round;
values.totalBounds["p1|r1"] = { minConfigured: false, maxConfigured: true, max: 0 };
api.deriveQuantityBlocks(draft);
assert.equal(draft.periodPolicies.per_round.blocks.totalEnabled, true, "0 is a configured total limit");

values.targetLimits["p1|r1"] = { configured: true, value: 2 };
values.defaultDishLimits["p1|r1"] = { configured: true, value: 1 };
api.deriveQuantityBlocks(draft);
assert.equal(draft.periodPolicies.per_round.blocks.targetEnabled, true);
assert.equal(draft.periodPolicies.per_round.blocks.sameDishEnabled, true);

values.totalBounds = {};
values.targetLimits = {};
values.defaultDishLimits = {};
api.deriveQuantityBlocks(draft);
assert.deepEqual({ ...draft.periodPolicies.per_round.blocks }, { totalEnabled: false, targetEnabled: false, sameDishEnabled: false });
assert.equal(draft.storeConfigs["store-a"].dishSetMembers.length, 2, "clearing quantities must preserve product scope");
assert.equal(api.enabledPeriodsHaveConfiguredQuantity(draft), false, "an enabled period without values must fail quantity presence validation");

console.log("verify-buffet-quantity-auto-enable: PASS");
