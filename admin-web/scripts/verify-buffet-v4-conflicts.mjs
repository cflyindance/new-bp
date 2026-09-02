import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = {};
for (const file of ["buffet-rule-policy.js", "buffet-rule-domain.js"]) {
  const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets", file), "utf8");
  vm.runInNewContext(source, { window, Date, Math, Number, String, Array, Object, JSON, Set, Error });
}
const domain = window.BuffetRuleDomain;

const always = { activityCycle: "daily", memberMode: "all" };

function cell(value) {
  return { configured: true, value };
}

function bounds(min, max) {
  return {
    minConfigured: min != null,
    min: min ?? null,
    maxConfigured: max != null,
    max: max ?? null,
  };
}

function v4(overrides = {}) {
  const store = {
    productLines: ["kiosk"],
    dishTargets: [{ productLineId: "kiosk", dishId: "dish-a" }],
    categoryTargets: [],
    dishSetMembers: [],
    structureByLine: { kiosk: [{ id: "dish-a", categoryId: "cat-a" }] },
    periodValues: {
      per_round: {
        totalBounds: { "0|0": bounds(null, 5) },
        tableTotalBounds: {},
        targetLimits: { "0|0|kiosk|dish-a": cell(5) },
        tableTargetCaps: {},
        defaultDishLimits: {},
        exceptionDishLimits: {},
      },
      order_lifetime: {},
      multi_round: {},
    },
  };
  return {
    schemaVersion: 4,
    subject: "party_size",
    targetType: "dish",
    enabledPeriods: ["per_round"],
    periodPolicies: { per_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: false } } },
    partyRanges: [{ min: 1, max: 2 }],
    roundRanges: [{ min: 1, max: null }],
    deployStoreIds: ["store-a"],
    conditions: always,
    storeConfigs: { "store-a": store },
    ...overrides,
  };
}

function active(rule, id = "active-rule") {
  return { id, status: "active", authoringConfig: rule };
}

const sameDish = v4();
assert.equal(domain.findConflict(sameDish, [active(v4())], []).code, "DUPLICATE_TARGET_RULE");
assert.equal(domain.findConflict(sameDish, [active(v4({ subject: "order" }))], []), null, "different subjects may overlap");
assert.equal(domain.findConflict(sameDish, [active(v4({ enabledPeriods: ["order_lifetime"] }))], []), null, "independent order and round periods may overlap");
assert.equal(domain.findConflict(sameDish, [active(v4({ enabledPeriods: ["multi_round"] }))], []), null, "per-round and multi-round constraints may overlap");
assert.equal(domain.findConflict(sameDish, [active(v4({ targetType: "category" }))], []), null, "dish and category constraints may overlap");

const lateOnly = v4({ conditions: { ...always, businessHourSlots: [{ mode: "custom", from: "20:00", to: "22:00" }] } });
const lunchOnly = v4({ conditions: { ...always, businessHourSlots: [{ mode: "custom", from: "11:00", to: "13:00" }] } });
assert.equal(domain.findConflict(lateOnly, [active(lunchOnly)], []), null, "non-overlapping conditions may coexist");

const numericMonday = { ...always, activityCycle: "weekly", daysOfWeek: [1] };
const numericTuesday = { ...always, activityCycle: "weekly", daysOfWeek: [2] };
const legacyMonday = { ...always, activityCycle: "weekly", daysOfWeek: ["mon"] };
assert.equal(domain.findConflict(v4({ conditions: numericMonday }), [active(v4({ conditions: numericMonday }))], []).code, "DUPLICATE_TARGET_RULE", "same numeric profile weekdays must overlap");
assert.equal(domain.findConflict(v4({ conditions: numericMonday }), [active(v4({ conditions: legacyMonday }))], []).code, "DUPLICATE_TARGET_RULE", "numeric and historical weekday formats must overlap");
assert.equal(domain.findConflict(v4({ conditions: numericMonday }), [active(v4({ conditions: numericTuesday }))], []), null, "different numeric weekdays must not overlap");

const mondayOvernight = {
  ...always,
  activityCycle: "weekly",
  daysOfWeek: ["mon"],
  businessHourSlots: [{ mode: "custom", from: "23:00", to: "01:00" }],
};
const tuesdayTail = {
  ...always,
  activityCycle: "weekly",
  daysOfWeek: ["tue"],
  businessHourSlots: [{ mode: "custom", from: "00:30", to: "00:45" }],
};
const mondayEarly = {
  ...always,
  activityCycle: "weekly",
  daysOfWeek: ["mon"],
  businessHourSlots: [{ mode: "custom", from: "00:30", to: "00:45" }],
};
assert.equal(domain.findConflict(v4({ conditions: mondayOvernight }), [active(v4({ conditions: tuesdayTail }))], []).code, "DUPLICATE_TARGET_RULE", "Monday overnight tail belongs to Tuesday");
assert.equal(domain.findConflict(v4({ conditions: mondayOvernight }), [active(v4({ conditions: mondayEarly }))], []), null, "Monday early time must not intersect the tail produced after Monday night");
assert.equal(domain.conditionsOverlap(
  { ...always, businessHourSlots: [{ mode: "custom", from: "23:00", to: "01:00" }] },
  { ...always, businessHourSlots: [{ mode: "custom", from: "00:30", to: "00:45" }] },
), true, "daily schedules must compare the next-day overnight tail");
assert.equal(domain.conditionsOverlap(
  { ...always, activityCycle: "monthly", daysOfMonth: [31], businessHourSlots: [{ mode: "custom", from: "23:00", to: "01:00" }] },
  { ...always, activityCycle: "monthly", daysOfMonth: [1], businessHourSlots: [{ mode: "custom", from: "00:30", to: "00:45" }] },
), true, "monthly schedules must carry an overnight tail into the next month");
assert.equal(domain.conditionsOverlap(
  { ...mondayOvernight, effectiveFrom: "2026-01-05", effectiveTo: "2026-01-05" },
  { ...tuesdayTail, effectiveFrom: "2026-01-06", effectiveTo: "2026-01-06" },
), true, "the last effective service day may overlap the next calendar day's first effective window");

const setA = v4({
  targetType: "dish_set",
  storeConfigs: { "store-a": { ...v4().storeConfigs["store-a"], dishSetMembers: [{ productLineId: "kiosk", dishId: "dish-a" }, { productLineId: "emenu", dishId: "dish-b" }] } },
});
const setB = v4({
  targetType: "dish_set",
  storeConfigs: { "store-a": { ...v4().storeConfigs["store-a"], dishSetMembers: [{ productLineId: "kiosk", dishId: "dish-a" }, { productLineId: "emenu", dishId: "dish-c" }] } },
});
assert.equal(domain.findConflict(setA, [active(setB)], []).code, "DISH_SET_MEMBER_OVERLAP");
const setDifferentLine = v4({
  targetType: "dish_set",
  storeConfigs: { "store-a": { ...v4().storeConfigs["store-a"], dishSetMembers: [{ productLineId: "sdi", dishId: "dish-a" }, { productLineId: "emenu", dishId: "dish-c" }] } },
});
assert.equal(domain.findConflict(setA, [active(setDifferentLine)], []), null, "same dishId in another product line is not an overlap");

const setOverlapDetails = domain.dishSetOverlapDetails(setA, [active(setB, "set-b")], []);
assert.deepEqual(
  { ruleId: setOverlapDetails.ruleId, storeIds: Array.from(setOverlapDetails.storeIds), dishIds: Array.from(setOverlapDetails.dishIds) },
  { ruleId: "set-b", storeIds: ["store-a"], dishIds: ["kiosk|dish-a"] },
  "dish-set overlap details must expose the conflicting rule, stores and line-qualified dishes",
);
assert.equal(domain.dishSetOverlapDetails(v4(), [active(setB)], []), null, "ordinary dish rules do not use dish-set overlap warnings");
assert.equal(domain.dishSetOverlapDetails(v4({ targetType: "category" }), [active(setB)], []), null, "category rules do not use dish-set overlap warnings");
assert.equal(domain.dishSetOverlapDetails(setA, [active(setB, "excluded")], ["excluded"]), null, "excluded records are ignored");

const setOtherStore = structuredClone(setB);
setOtherStore.deployStoreIds = ["store-b"];
setOtherStore.storeConfigs = { "store-b": setOtherStore.storeConfigs["store-a"] };
assert.equal(domain.dishSetOverlapDetails(setA, [active(setOtherStore)], []), null, "non-overlapping stores may coexist");
assert.equal(domain.dishSetOverlapDetails(setA, [active(v4({ ...setB, subject: "order" }))], []), null, "different subjects may coexist");
assert.equal(domain.dishSetOverlapDetails(setA, [active(v4({ ...setB, enabledPeriods: ["order_lifetime"] }))], []), null, "different periods may coexist");
const lunchSet = structuredClone(setA);
lunchSet.conditions = { ...always, businessHourSlots: [{ mode: "custom", from: "11:00", to: "13:00" }] };
assert.equal(domain.dishSetOverlapDetails(lunchSet, [active(v4({ ...setB, conditions: { ...always, businessHourSlots: [{ mode: "custom", from: "20:00", to: "22:00" }] } }))], []), null, "disjoint time windows do not overlap");
const januarySet = structuredClone(setA);
januarySet.conditions = { ...always, effectiveFrom: "2026-01-01", effectiveTo: "2026-01-31" };
const februarySet = structuredClone(setB);
februarySet.conditions = { ...always, effectiveFrom: "2026-02-01", effectiveTo: "2026-02-28" };
assert.equal(domain.dishSetOverlapDetails(januarySet, [active(februarySet)], []), null, "disjoint effective dates do not overlap");
const goldSet = structuredClone(setA);
goldSet.conditions = { ...always, memberMode: "specified", memberLevelIds: ["gold"] };
const silverSet = structuredClone(setB);
silverSet.conditions = { ...always, memberMode: "specified", memberLevelIds: ["silver"] };
assert.equal(domain.dishSetOverlapDetails(goldSet, [active(silverSet)], []), null, "disjoint member levels do not overlap");
const smallPartySet = structuredClone(setA);
smallPartySet.partyRanges = [{ min: 1, max: 2 }];
const largePartySet = structuredClone(setB);
largePartySet.partyRanges = [{ min: 3, max: null }];
assert.equal(domain.dishSetOverlapDetails(smallPartySet, [active(largePartySet)], []), null, "disjoint party ranges do not overlap");

const impossibleBounds = v4();
impossibleBounds.storeConfigs["store-a"].periodValues.per_round.totalBounds["0|0"] = bounds(4, 3);
let result = domain.validateStaticFeasibility(impossibleBounds);
assert.equal(result.valid, false);
assert.ok(result.violations.length >= 1);
assert.ok(result.violations.every((item) => item.code === "RULE_UNSATISFIABLE"));
assert.deepEqual(
  { storeId: result.violations[0].storeId, partyRangeIndex: result.violations[0].partyRangeIndex, roundRangeIndex: result.violations[0].roundRangeIndex },
  { storeId: "store-a", partyRangeIndex: 0, roundRangeIndex: 0 },
);

const impossibleTargetCapacity = v4();
impossibleTargetCapacity.storeConfigs["store-a"].periodValues.per_round.totalBounds["0|0"] = bounds(3, 5);
impossibleTargetCapacity.storeConfigs["store-a"].periodValues.per_round.targetLimits["0|0|kiosk|dish-a"] = cell(2);
result = domain.validateStaticFeasibility(impossibleTargetCapacity);
assert.equal(result.valid, false);
assert.match(result.violations[0].message, /最少/);

const satisfiableWithException = v4({
  subject: "order",
  partyRanges: [],
  periodPolicies: { per_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: true } } },
  storeConfigs: {
    "store-a": {
      ...v4().storeConfigs["store-a"],
      dishTargets: [{ productLineId: "kiosk", dishId: "dish-a" }, { productLineId: "kiosk", dishId: "dish-b" }],
      structureByLine: { kiosk: [{ id: "dish-a", categoryId: "cat-a" }, { id: "dish-b", categoryId: "cat-a" }] },
      periodValues: {
        per_round: {
          totalBounds: { "0|0": bounds(3, 5) }, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {},
          defaultDishLimits: { "0|0": cell(1) },
          exceptionDishLimits: { "0|0": [{ dishes: [{ productLineId: "kiosk", dishId: "dish-a" }], limit: cell(2) }] },
        }, order_lifetime: {}, multi_round: {},
      },
    },
  },
});
result = domain.validateStaticFeasibility(satisfiableWithException);
assert.equal(result.valid, true);
assert.equal(result.violations.length, 0);

const categoryPickerScope = v4({
  subject: "order", targetType: "category", partyRanges: [],
  periodPolicies: { per_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: true } } },
  storeConfigs: {
    "store-a": {
      ...v4().storeConfigs["store-a"], dishTargets: [],
      categoryTargets: [{ productLineId: "kiosk", categoryId: "c:g-hotpot:c-hotpot-meat" }],
      structureByLine: { kiosk: ["c:g-hotpot:c-hotpot-meat", "d:g-hotpot:c-hotpot-meat:d-beef-premium", "d:g-hotpot:c-hotpot-meat:d-pork-belly"] },
      periodValues: {
        per_round: {
          totalBounds: { "0|0": bounds(2, 4) }, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {},
          defaultDishLimits: { "0|0": cell(1) }, exceptionDishLimits: {},
        }, order_lifetime: {}, multi_round: {},
      },
    },
  },
});
result = domain.validateStaticFeasibility(categoryPickerScope);
assert.equal(result.valid, true, "category picker keys must expand all selected category dishes for same-dish capacity");

const dishPickerScope = v4({
  subject: "order", partyRanges: [],
  periodPolicies: { per_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: true } } },
  storeConfigs: {
    "store-a": {
      ...v4().storeConfigs["store-a"], dishTargets: [],
      structureByLine: { kiosk: ["d:g-hotpot:c-hotpot-meat:d-beef-premium", "d:g-hotpot:c-hotpot-meat:d-pork-belly"] },
      periodValues: {
        per_round: {
          totalBounds: { "0|0": bounds(2, 4) }, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {},
          defaultDishLimits: { "0|0": cell(1) }, exceptionDishLimits: {},
        }, order_lifetime: {}, multi_round: {},
      },
    },
  },
});
assert.equal(domain.validateStaticFeasibility(dishPickerScope).valid, true, "dish picker keys must contribute to same-dish capacity");

const kindSet = v4({
  subject: "order", targetType: "dish_set", measureUnit: "kind", partyRanges: [],
  periodPolicies: { per_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: false } } },
  storeConfigs: {
    "store-a": {
      ...v4().storeConfigs["store-a"],
      dishSetMembers: [{ productLineId: "kiosk", dishId: "dish-a" }, { productLineId: "emenu", dishId: "dish-b" }],
      periodValues: {
        per_round: {
          totalBounds: { "0|0": bounds(10, null) }, tableTotalBounds: {}, targetLimits: { "0|0": cell(2) }, tableTargetCaps: {},
          defaultDishLimits: {}, exceptionDishLimits: {},
        }, order_lifetime: {}, multi_round: {},
      },
    },
  },
});
assert.equal(domain.validateStaticFeasibility(kindSet).valid, true, "kind-set maximum is not a piece-cap when no same-dish cap exists");
const kindSetWithSingleCap = structuredClone(kindSet);
kindSetWithSingleCap.periodPolicies.per_round.blocks.sameDishEnabled = true;
kindSetWithSingleCap.storeConfigs["store-a"].periodValues.per_round.defaultDishLimits["0|0"] = cell(3);
result = domain.validateStaticFeasibility(kindSetWithSingleCap);
assert.equal(result.valid, false);
assert.match(result.violations[0].message, /最少/);

const pieceSet = structuredClone(kindSet);
pieceSet.measureUnit = "piece";
pieceSet.periodPolicies.per_round.blocks.totalEnabled = false;
kindSet.periodPolicies.per_round.blocks.totalEnabled = false;
assert.equal(domain.findConflict(kindSet, [{ id: "piece-rule", status: "active", authoringConfig: pieceSet }], []), null, "同一成员的按份和按种规则允许共同发布");
const duplicateKind = domain.findConflict(kindSet, [{ id: "kind-rule", status: "active", authoringConfig: structuredClone(kindSet) }], []);
assert.equal(duplicateKind.code, "DISH_SET_MEMBER_OVERLAP", "同计量口径的成员重叠仍需阻断");

const totalOnly = v4({ subject: "order", targetType: "dish", partyRanges: [], periodPolicies: { per_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: false } } } });
assert.equal(domain.findConflict(totalOnly, [{ id: "total-rule", status: "active", authoringConfig: structuredClone(totalOnly) }], []).code, "DUPLICATE_TOTAL_RULE");

console.log("verify-buffet-v4-conflicts: PASS");
