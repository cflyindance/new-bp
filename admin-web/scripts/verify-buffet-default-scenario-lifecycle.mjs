import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const asset = (name) => fs.readFileSync(path.join(root, "dist/Configuration center/assets", name), "utf8");
const storage = new Map();
const localStorage = {
  getItem: (key) => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
const window = {};
for (const name of ["buffet-rule-policy.js", "buffet-rule-domain.js"]) {
  vm.runInNewContext(asset(name), { window, Date, Math, Number, String, Array, Object, JSON, Set, Error });
}
vm.runInNewContext(asset("buffet-rule-profile.js"), { window, localStorage, Date, Math, Number, String, Array, Object, JSON, Set, Error });

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
const domain = window.BuffetRuleDomain;
const cell = (value) => ({ configured: true, value });
const blank = () => ({ configured: false, value: null });
const bounds = (min, max) => ({
  minConfigured: min !== null, min,
  maxConfigured: max !== null, max,
});
const dishes = [
  { productLineId: "kiosk", dishId: "dish-a", categoryId: "hot" },
  { productLineId: "emenu", dishId: "dish-b", categoryId: "hot" },
  { productLineId: "kiosk", dishId: "dish-c", categoryId: "cold" },
];
const context = (overrides = {}) => ({
  orderMode: "buffet", buffetSessionId: "session-a", storeId: "store-a",
  orderId: "order-a", partySize: 3, roundNo: 1, ...overrides,
});

function configuredRecord(template, id) {
  const record = profile.createDefaultScenarioRule(template, id);
  const draft = record.authoringConfig;
  const period = template.enabledPeriods[0];
  const isCombo = template.group === "per_round_combo";
  if (isCombo) draft.partyRanges = [{ rangeId: draft.partyRanges[0].rangeId, min: 1, max: null }];
  const scenario = isCombo ? `party:${draft.partyRanges[0].rangeId}|round:0` : "0|0";
  // A finite table fallback max can only be feasible while the per-person minimum
  // remains below it. Cover the runtime N=3 case with the exact valid range.
  if (!isCombo && template.subject === "party_size" && template.blocks.totalEnabled) draft.partyRanges = [{ min: 3, max: 3 }];
  draft.name = `acceptance-${template.key}`;
  draft.participatingStoreIds = ["store-a"];
  draft.deployStoreIds = ["store-a"];
  draft.activeStoreId = "store-a";
  draft.conditions.activityCycle = "daily";
  draft.conditions.memberMode = "all";
  draft.authorization = {
    enabled: true,
    allowedScopes: ["operation", "round", "order"],
    defaultScope: period === "order_lifetime" ? "order" : "round",
    scopePermissions: { operation: "manager", round: "manager", order: "manager" },
    reasonRequired: true,
  };
  const config = {
    productLines: ["kiosk", "emenu"],
    dishTargets: template.targetType === "dish" ? dishes.map((item) => ({ ...item })) : [],
    categoryTargets: [],
    dishSetMembers: template.targetType === "dish_set" ? dishes.map((item) => ({ ...item })) : [],
    periodValues: {},
  };
  const values = { totalBounds: {}, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {}, defaultDishLimits: {}, exceptionDishLimits: {} };
  if (isCombo) {
    values.tableTotalBounds[scenario] = bounds(1, 8);
    const targetMap = template.key.endsWith("|party_size") ? values.targetLimits : values.tableTargetCaps;
    if (template.targetType === "dish") {
      for (const dish of dishes) targetMap[`${scenario}|line:${dish.productLineId}|target:${dish.dishId}`] = cell(2);
    } else targetMap[scenario] = cell(2);
    if (template.blocks.sameDishEnabled) values.defaultDishLimits[scenario] = cell(2);
  } else if (template.blocks.totalEnabled) {
    values.totalBounds[scenario] = bounds(template.subject === "party_size" ? 1 : 2, template.subject === "party_size" ? 3 : 5);
    if (template.subject === "party_size") values.tableTotalBounds[scenario] = bounds(4, 8);
  }
  if (!isCombo && template.targetType === "dish") {
    for (const dish of dishes) values.targetLimits[`${scenario}|${dish.productLineId}|${dish.dishId}`] = cell(2);
  } else if (!isCombo) {
    values.targetLimits[scenario] = cell(2);
    if (template.blocks.sameDishEnabled) values.defaultDishLimits[scenario] = cell(2);
  }
  config.periodValues[period] = values;
  draft.storeConfigs = { "store-a": config };
  record.authoringConfig = draft;
  record.editorDraft = structuredClone(draft);
  return record;
}

const records = profile.defaultScenarios.map((template, index) => configuredRecord(template, index + 1));
assert.equal(records.length, 18);
for (const record of records) {
  const check = profile.lifecycle.validateActivation(record, []);
  assert.equal(check.valid, true, `${record.defaultScenarioKey}: ${check.message}`);
  profile.lifecycle.prepareActivation(record);
  record.status = "active";
  assert.deepEqual(Object.keys(record.publishedConfig.storeConfigs), ["store-a"]);
  assert.equal(domain.compileRuntimeRules([record], 11).length, 1);
}

const byKey = Object.fromEntries(records.map((record) => [record.defaultScenarioKey, record.publishedConfig]));
function evaluate(rule, items, options = {}) {
  return domain.evaluateBatch({
    context: context(options.context), operationId: options.operationId || "op",
    rules: [rule], counters: options.counters || { order: [], round: [] },
    items, phase: options.phase || "add", authorizationCredential: options.authorizationCredential,
  });
}

// Four whole-order defaults: dish limits are independent; dish sets share across lines; party limits multiply by N.
let result = evaluate(byKey["order|order_lifetime|dish"], [{ ...dishes[0], quantity: 2 }, { ...dishes[1], quantity: 2 }]);
assert.equal(result.allowed, true, "whole-order dish limits each selected dish independently");
result = evaluate(byKey["order|order_lifetime|dish"], [{ ...dishes[0], quantity: 3 }]);
assert.equal(result.allowed, false);
result = evaluate(byKey["order|order_lifetime|dish_set"], [{ ...dishes[0], quantity: 1 }, { ...dishes[1], quantity: 2 }]);
assert.equal(result.allowed, false, "whole-order dish set is one cross-line shared pool");
result = evaluate(byKey["party_size|order_lifetime|dish"], [{ ...dishes[0], quantity: 6 }]);
assert.equal(result.allowed, true);
result = evaluate(byKey["party_size|order_lifetime|dish"], [{ ...dishes[0], quantity: 7 }]);
assert.equal(result.allowed, false, "party dish cap 2 becomes 6 for N=3");
result = evaluate(byKey["party_size|order_lifetime|dish_set"], [{ ...dishes[0], quantity: 3 }, { ...dishes[1], quantity: 3 }]);
assert.equal(result.allowed, true);
result = evaluate(byKey["party_size|order_lifetime|dish_set"], [{ ...dishes[0], quantity: 4 }, { ...dishes[1], quantity: 3 }]);
assert.equal(result.allowed, false, "party dish-set shared cap 2 becomes 6 for N=3");

// Per-round dish total max is immediate, min is submission-only, target is independent, and the next round is fresh.
const orderRoundTotal = byKey["order|per_round|total"];
const orderRoundDish = byKey["order|per_round|dish"];
assert.equal(evaluate(orderRoundTotal, [{ ...dishes[0], quantity: 6 }]).violations.some((v) => v.code === "TOTAL_LIMIT_EXCEEDED"), true);
assert.equal(evaluate(orderRoundTotal, [{ ...dishes[0], quantity: 1 }]).allowed, true);
assert.equal(evaluate(orderRoundTotal, [{ ...dishes[0], quantity: 1 }], { phase: "submit_round" }).violations.some((v) => v.code === "TOTAL_MIN_NOT_MET"), true);
assert.equal(evaluate(orderRoundDish, [{ ...dishes[0], quantity: 3 }]).violations.some((v) => v.code === "TARGET_LIMIT_EXCEEDED"), true);
assert.equal(evaluate(orderRoundDish, [{ ...dishes[0], quantity: 2 }], { context: { roundNo: 2 } }).allowed, true);
assert.equal(evaluate(orderRoundDish, [{ ...dishes[0], quantity: 2 }], {
  context: { roundNo: 2 },
  counters: {
    order: [{ ...dishes[0], quantity: 5, roundNo: 1 }],
    round: [{ ...dishes[0], quantity: 5, roundNo: 1 }],
  },
}).allowed, true, "round 2 ignores tagged counters retained from round 1");

// Per-person total [3,9] merged with table fallback [4,8] => [4,8]; target cap 2*N => 6.
const partyRoundTotal = byKey["party_size|per_round|total"];
const partyRoundDish = byKey["party_size|per_round|dish"];
assert.equal(evaluate(partyRoundTotal, [{ ...dishes[0], quantity: 9 }]).violations.some((v) => v.code === "TOTAL_LIMIT_EXCEEDED"), true);
assert.equal(evaluate(partyRoundTotal, [{ ...dishes[0], quantity: 3 }], { phase: "submit_round" }).violations.some((v) => v.code === "TOTAL_MIN_NOT_MET"), true);
assert.equal(evaluate(partyRoundDish, [{ ...dishes[0], quantity: 6 }]).allowed, true);
assert.equal(evaluate(partyRoundDish, [{ ...dishes[0], quantity: 7 }]).violations.some((v) => v.code === "TARGET_LIMIT_EXCEEDED"), true);

// Per-round dish sets share the pool across lines. Party pool multiplies, same-dish protection remains fixed at 2.
for (const key of ["order|per_round|dish_set|piece", "party_size|per_round|dish_set|piece"]) {
  const rule = byKey[key];
  const party = key.startsWith("party_size");
  result = evaluate(rule, party
    ? [{ ...dishes[0], quantity: 2 }, { ...dishes[1], quantity: 2 }, { ...dishes[2], quantity: 2 }]
    : [{ ...dishes[0], quantity: 2 }, { ...dishes[1], quantity: 1 }]);
  assert.equal(result.allowed, party, `${key} cross-line members share the configured pool`);
  result = evaluate(rule, [{ ...dishes[0], quantity: 3 }]);
  assert.equal(result.allowed, false, `${key} same-dish cap stays 2 and never multiplies`);
  assert.equal(result.violations.some((v) => v.code === "SAME_DISH_LIMIT_EXCEEDED"), true);
}

// Blank is unconfigured; zero minimum is valid; zero maximum prohibits; min > max blocks activation/publication.
const blankRule = structuredClone(orderRoundTotal);
blankRule.storeConfigs["store-a"].periodValues.per_round.totalBounds["0|0"] = {
  minConfigured: false, min: null, maxConfigured: false, max: null,
};
assert.equal(evaluate(blankRule, [{ ...dishes[0], quantity: 1 }]).allowed, true);
const zeroMin = structuredClone(orderRoundTotal);
zeroMin.storeConfigs["store-a"].periodValues.per_round.totalBounds["0|0"] = bounds(0, null);
assert.equal(evaluate(zeroMin, [], { phase: "submit_round" }).allowed, true);
const zeroMax = structuredClone(orderRoundTotal);
zeroMax.storeConfigs["store-a"].periodValues.per_round.totalBounds["0|0"] = bounds(null, 0);
assert.equal(evaluate(zeroMax, [{ ...dishes[0], quantity: 1 }]).allowed, false);
const invalidRecord = configuredRecord(profile.defaultScenarios.find((t) => t.key === "order|per_round|total"), 99);
invalidRecord.authoringConfig.storeConfigs["store-a"].periodValues.per_round.totalBounds["0|0"] = bounds(6, 5);
assert.equal(profile.lifecycle.validateActivation(invalidRecord, []).valid, false, "min > max blocks publication");

// A cancellation can make a formerly valid round fall below minimum; submission must recheck current counters.
result = evaluate(orderRoundTotal, [{ ...dishes[0], quantity: -1 }], {
  counters: { order: [], round: [{ ...dishes[0], quantity: 2 }] }, phase: "change",
});
assert.equal(result.allowed, true);
result = evaluate(orderRoundTotal, [], {
  counters: { order: [], round: [{ ...dishes[0], quantity: 1 }] }, phase: "submit_round",
});
assert.equal(result.allowed, false);
assert.equal(result.violations.some((v) => v.code === "TOTAL_MIN_NOT_MET"), true);

// Authorization contracts: operation is one attempt, round stays in one round, order crosses rounds but not orders.
const authRule = structuredClone(orderRoundDish);
authRule.id = "auth-rule";
authRule.version = 1;
const violationInput = [{ ...dishes[0], quantity: 3 }];
const denied = evaluate(authRule, violationInput, { operationId: "op-auth" });
const refs = denied.violations.filter((v) => v.code !== "TOTAL_MIN_NOT_MET").map((v) => ({
  id: v.ruleId, version: v.ruleVersion, period: v.period, target: v.target, approvedQuantity: v.used,
}));
const credential = (scope, extra = {}) => ({ storeId: "store-a", orderId: "order-a", roundNo: 1, scope, ruleRefs: refs, ...extra });
assert.equal(evaluate(authRule, violationInput, { operationId: "op-auth", authorizationCredential: credential("operation", { operationId: "op-auth" }) }).allowed, true);
assert.equal(evaluate(authRule, violationInput, { operationId: "op-next", authorizationCredential: credential("operation", { operationId: "op-auth" }) }).allowed, false);
assert.equal(evaluate(authRule, violationInput, { operationId: "op-round", authorizationCredential: credential("round") }).allowed, true);
assert.equal(evaluate(authRule, violationInput, { operationId: "op-round-2", context: { roundNo: 2 }, authorizationCredential: credential("round") }).allowed, false);
assert.equal(evaluate(authRule, violationInput, { operationId: "op-order", context: { roundNo: 2 }, authorizationCredential: credential("order") }).allowed, true);
assert.equal(evaluate(authRule, violationInput, { operationId: "op-other", context: { orderId: "order-b" }, authorizationCredential: credential("order") }).allowed, false);

// The factory must preserve true blanks rather than converting them to zero.
const fresh = profile.createDefaultScenarioRule(profile.defaultScenarios[0], 1000);
assert.equal(fresh.authoringConfig.deployStoreIds.length, 0);
assert.equal(Object.keys(fresh.authoringConfig.storeConfigs).length, 0);
assert.deepEqual(blank(), { configured: false, value: null });

console.log("verify-buffet-default-scenario-lifecycle: PASS");
