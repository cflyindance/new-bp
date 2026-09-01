import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const root = {};
const profile = {
  moduleId: "buffet-rule",
  storage: { rulesKey: "test", recoveryPrefix: "test:" },
  steps: [],
  allowedPeriods: ["order_lifetime", "per_round", "multi_round"],
  allowedTargetTypes: ["dish", "category", "dish_set"],
  usesV4Capability(draft) { return Number(draft?.schemaVersion) >= 4; },
  upgradeDraftToV4(draft) { return draft; }
};
const window = {
  ORDER_LIMIT_MODULE_PROFILE: profile,
  __BUFFET_V4_VALIDATION_TEST__: true,
  location: { search: "" },
  BuffetRulePolicy: {
    scenarioKey: (party, round) => `${party}|${round}`,
    targetCellKey: (party, round, line, target) => `${party}|${round}|${line}|${target}`,
    menuIdentity: (item) => `${item.productLineId}|${item.dishId}`
  }
};
const document = { body: { getAttribute: () => "test" }, getElementById: () => root };
vm.runInNewContext(flow, { window, document, URLSearchParams, Number, String, Array, Object, Math, JSON, Date, Set, console });
const api = window.BuffetV4ValidationTestApi;

const categoryDraft = {
  schemaVersion: 4,
  subject: "order",
  targetType: "category",
  enabledPeriods: ["per_round"],
  periodPolicies: { per_round: { blocks: { targetEnabled: true, sameDishEnabled: true } } },
  partyRanges: [{ min: 1, max: null }],
  roundRanges: [{ min: 1, max: null }],
  activeStoreId: "ny-midtown",
  participatingStoreIds: ["ny-midtown"],
  deployStoreIds: ["ny-midtown"],
  targetIds: ["category:kiosk|hot", "category:emenu|hot"],
  storeConfigs: {
    "ny-midtown": {
      productLines: ["kiosk", "emenu"],
      targetIds: ["category:kiosk|hot", "category:emenu|hot"],
      categoryTargets: [
        { productLineId: "kiosk", categoryId: "hot", name: "热菜" },
        { productLineId: "emenu", categoryId: "hot", name: "热菜" }
      ],
      structureByLine: {
        kiosk: [{ id: "dish-a", categoryId: "hot", name: "A" }],
        emenu: [{ id: "dish-b", categoryId: "hot", name: "B" }],
        sdi: [{ id: "dish-c", categoryId: "cold", name: "C" }]
      },
      periodValues: {}
    }
  }
};
assert.deepEqual(
  Array.from(api.eligibleExceptionDishes(categoryDraft, "ny-midtown"), item => ({ ...item })).map(api.menuIdentity),
  ["kiosk|dish-a", "emenu|dish-b"],
  "例外商品只能来自当前规则选择分类的菜品范围，且应保留产线身份"
);

const scenario = "0|0";
const duplicateExceptionDraft = structuredClone(categoryDraft);
duplicateExceptionDraft.storeConfigs["ny-midtown"].periodValues = {
  per_round: {
    targetLimits: { [`${scenario}|kiosk|hot`]: { configured: true, value: 3 }, [`${scenario}|emenu|hot`]: { configured: true, value: 3 } },
    exceptionDishLimits: {
      [scenario]: [
        { dishes: [{ productLineId: "kiosk", dishId: "dish-a" }], limit: { configured: true, value: 1 } },
        { dishes: [{ productLineId: "kiosk", dishId: "dish-a" }], limit: { configured: true, value: 2 } }
      ]
    }
  }
};
assert.equal(api.validateV4Draft(duplicateExceptionDraft).code, "EXCEPTION_DISH_DUPLICATED");
assert.equal(api.exceptionLimitFor(duplicateExceptionDraft, "ny-midtown", "per_round", scenario, { productLineId: "kiosk", dishId: "dish-a" }).value, 1);

categoryDraft.storeConfigs["ny-midtown"].periodValues = {
  per_round: {
    exceptionDishLimits: {
      [scenario]: [{ dishes: [{ productLineId: "kiosk", dishId: "dish-a" }], limit: { configured: false, value: null } }]
    }
  }
};
const rendered = api.renderBuffetV4QuantityEditor(categoryDraft, ["ny-midtown"]);
assert.match(rendered, /data-v4-exception-add/);
assert.match(rendered, /data-v4-exception-dish/);
assert.match(rendered, /data-v4-exception-remove/);
assert.match(rendered, /默认每种最多/);

console.log("verify-buffet-same-dish-exceptions: PASS");
