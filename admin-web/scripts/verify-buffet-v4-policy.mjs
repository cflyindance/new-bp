import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policyPath = path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js");
const source = fs.readFileSync(policyPath, "utf8");
const window = {};
vm.runInNewContext(source, { window, Number, String, Array, Object, Math, JSON });
const policy = window.BuffetRulePolicy;

assert.equal(policy.schemaVersion, 4);
assert.deepEqual(Array.from(policy.periods), ["order_lifetime", "per_round", "multi_round"]);
assert.equal(policy.scenarioKey(1, 2), "1|2");
assert.notEqual(
  policy.scenarioKey("1|2", "3"),
  policy.scenarioKey("1", "2|3"),
  "scenarioKey segments must not collide"
);
assert.equal(policy.targetCellKey(1, 2, "kiosk", "dish-a"), "1|2|kiosk|dish-a");
assert.notEqual(
  policy.targetCellKey(1, 2, "kiosk|dish", "a"),
  policy.targetCellKey(1, 2, "kiosk", "dish|a"),
  "targetCellKey segments must not collide"
);
assert.notEqual(
  policy.menuIdentity({ productLineId: "kiosk|dish", dishId: "a" }),
  policy.menuIdentity({ productLineId: "kiosk", dishId: "dish|a" }),
  "menu identity segments must not collide"
);
assert.doesNotThrow(
  () => policy.menuIdentity({ productLineId: "\uD800", dishId: "a" }),
  "isolated surrogate strings must be supported"
);
assert.notEqual(
  policy.menuIdentity({ productLineId: "\uD800|dish", dishId: "a" }),
  policy.menuIdentity({ productLineId: "\uD800", dishId: "dish|a" }),
  "JSON string edge cases must retain tuple boundaries"
);
assert.notEqual(
  policy.targetCellKey(1, 2, "\uD800|dish", "a"),
  policy.targetCellKey(1, 2, "\uD800", "dish|a"),
  "target keys must support isolated surrogate strings without collisions"
);
assert.deepEqual(
  { ...policy.effectiveBounds({ perPersonMin: 2, tableMin: 7, perPersonMax: 4, tableMax: 10 }, "party_size", 3) },
  { min: 7, max: 10, valid: true }
);
assert.deepEqual(
  { ...policy.effectiveBounds({ perPersonMin: 4, tableMax: 10 }, "party_size", 3) },
  { min: 12, max: 10, valid: false }
);
assert.deepEqual(
  { ...policy.effectiveBounds({ perPersonMax: 4, tableMax: 10 }, "party_size", 0) },
  { min: null, max: 10, valid: false, code: "PARTY_SIZE_INVALID" }
);
assert.deepEqual(
  { ...policy.effectiveBounds({ perPersonMin: 1 }, "party_size", "1.5") },
  { min: null, max: null, valid: false, code: "PARTY_SIZE_INVALID" }
);
assert.deepEqual(
  { ...policy.effectiveBounds({ tableMin: 2, tableMax: 8 }, "party_size", "invalid") },
  { min: 2, max: 8, valid: true },
  "party size is not required when no per-person bound participates"
);
assert.equal(policy.menuIdentity({ productLineId: "kiosk", dishId: "1" }), "kiosk|1");
assert.equal(policy.menuIdentity({ productLineId: "emenu", dishId: "1" }), "emenu|1");

const storeInput = {
  productLines: ["kiosk", "kiosk", "emenu", "", "__proto__", "__proto__"],
  dishTargets: [
    { productLineId: "kiosk", dishId: "1" },
    { productLineId: "kiosk", dishId: "1" },
    { productLineId: "emenu", dishId: "1" },
    { productLineId: "", dishId: "2" },
  ],
  categoryTargets: [
    { productLineId: "kiosk", categoryId: "hot" },
    { productLineId: "kiosk", categoryId: "hot" },
    { productLineId: "emenu", categoryId: "hot" },
  ],
  dishSetMembers: [
    { productLineId: "kiosk", dishId: "1" },
    { productLineId: "kiosk", dishId: "1" },
    { productLineId: "emenu", dishId: "1" },
  ],
  periodValues: {
    per_round: {
      totalBounds: {
        "0|0": { minConfigured: true, min: "2", maxConfigured: true, max: 1000000 },
      },
      tableTotalBounds: {},
      targetLimits: {
        "0|0|kiosk|1": { configured: true, value: "0" },
        invalid: { configured: true, value: -1 },
      },
      tableTargetCaps: {},
      defaultDishLimits: {},
      exceptionDishLimits: {
        "0|0": [
          {
            dishes: [
              { productLineId: "kiosk", dishId: "1" },
              { productLineId: "kiosk", dishId: "1" },
              { productLineId: "emenu", dishId: "1" },
            ],
            limit: { configured: true, value: "3" },
          },
        ],
      },
    },
  },
};
const storeSnapshot = JSON.stringify(storeInput);
const store = policy.normalizeStoreConfig(storeInput);

assert.equal(JSON.stringify(storeInput), storeSnapshot, "normalizeStoreConfig must not mutate input");
assert.deepEqual(Array.from(store.productLines), ["kiosk", "emenu", "__proto__"]);
assert.deepEqual(Array.from(store.dishTargets, policy.menuIdentity), ["kiosk|1", "emenu|1"]);
assert.deepEqual(
  Array.from(store.categoryTargets, (item) => `${item.productLineId}|${item.categoryId}`),
  ["kiosk|hot", "emenu|hot"]
);
assert.deepEqual(Array.from(store.dishSetMembers, policy.menuIdentity), ["kiosk|1", "emenu|1"]);
assert.deepEqual({ ...store.periodValues.per_round.totalBounds["0|0"] }, {
  minConfigured: true,
  min: 2,
  maxConfigured: false,
  max: null,
});
assert.deepEqual({ ...store.periodValues.per_round.targetLimits["0|0|kiosk|1"] }, { configured: true, value: 0 });
assert.deepEqual({ ...store.periodValues.per_round.targetLimits.invalid }, { configured: false, value: null });
assert.deepEqual(
  Array.from(store.periodValues.per_round.exceptionDishLimits["0|0"], row => policy.menuIdentity(row.dishes[0])),
  ["kiosk|1", "emenu|1"],
  "旧的一行多菜品例外必须拆为保留顺序的多行单菜品例外"
);
assert.deepEqual(
  { ...store.periodValues.per_round.exceptionDishLimits["0|0"][0].limit },
  { configured: true, value: 3 }
);
assert.deepEqual(
  { ...store.periodValues.per_round.exceptionDishLimits["0|0"][1].limit },
  { configured: true, value: 3 },
  "拆分后的每行必须保留同一上限"
);

// 例外商品编辑器的旧 dish 单值必须在自动保存规范化后保留为规范 dishes 数组；非法行不得进入持久化结果。
const exceptionRoundTrip = policy.normalizeRule({
  enabledPeriods: ["per_round"],
  storeConfigs: {
    storeA: {
      periodValues: {
        per_round: {
          exceptionDishLimits: {
            "0|0": [
              { dish: { productLineId: "kiosk", dishId: "legacy-dish" }, limit: { configured: true, value: 2 } },
              { dishes: [{ productLineId: "emenu", dishId: "current-dish" }], limit: { configured: true, value: 0 } },
              { dishes: [{ productLineId: "kiosk", dishId: "multi-a" }, { productLineId: "sdi", dishId: "multi-b" }], limit: { configured: true, value: 5 } },
              { dishes: [], dish: { productLineId: "sdi", dishId: "legacy-fallback" }, limit: { configured: true, value: 1 } },
              { dish: { productLineId: "", dishId: "missing-line" }, limit: { configured: true, value: 3 } },
              { dishes: [], limit: { configured: true, value: 4 } },
              null,
            ],
          },
        },
      },
    },
  },
});
const roundTripRows = exceptionRoundTrip.storeConfigs.storeA.periodValues.per_round.exceptionDishLimits["0|0"];
assert.equal(roundTripRows.length, 5, "非法例外行必须安全过滤，并兼容 dishes 为空时的旧 dish 数据与一行多菜品数据");
assert.deepEqual(
  Array.from(roundTripRows, row => ({ dishes: Array.from(row.dishes, policy.menuIdentity), limit: { ...row.limit }, hasLegacyDish: Object.hasOwn(row, "dish") })),
  [
    { dishes: ["kiosk|legacy-dish"], limit: { configured: true, value: 2 }, hasLegacyDish: false },
    { dishes: ["emenu|current-dish"], limit: { configured: true, value: 0 }, hasLegacyDish: false },
    { dishes: ["kiosk|multi-a"], limit: { configured: true, value: 5 }, hasLegacyDish: false },
    { dishes: ["sdi|multi-b"], limit: { configured: true, value: 5 }, hasLegacyDish: false },
    { dishes: ["sdi|legacy-fallback"], limit: { configured: true, value: 1 }, hasLegacyDish: false },
  ],
  "例外行写回必须使用保留产线身份的唯一 dishes 规范结构"
);
assert.ok(store.periodValues.order_lifetime);
assert.ok(store.periodValues.multi_round);

assert.deepEqual(
  Array.from(policy.normalizeStoreConfig({ productLines: [" kiosk ", "kiosk"] }).productLines),
  ["kiosk"]
);
assert.deepEqual(
  Array.from(policy.normalizeStoreConfig({ productLines: ["kiosk", " kiosk "] }).productLines),
  ["kiosk"],
  "trimmed product-line deduplication must not depend on input order"
);

const canonicalIdentityStore = policy.normalizeStoreConfig({
  productLines: [" kiosk ", "kiosk"],
  dishTargets: [
    { productLineId: " kiosk ", dishId: " dish-1 ", label: "spaced" },
    { productLineId: "kiosk", dishId: "dish-1", label: "canonical duplicate" },
    { productLineId: " ", dishId: "dish-2" },
  ],
  categoryTargets: [
    { productLineId: " kiosk ", categoryId: " hot ", label: "spaced" },
    { productLineId: "kiosk", categoryId: "hot", label: "canonical duplicate" },
    { productLineId: "kiosk", categoryId: " " },
  ],
  dishSetMembers: [
    { productLineId: " kiosk ", dishId: " dish-1 ", serving: "piece" },
    { productLineId: "kiosk", dishId: "dish-1", serving: "duplicate" },
  ],
  periodValues: {
    per_round: {
      exceptionDishLimits: {
        "0|0": [{
          dishes: [
            { productLineId: " kiosk ", dishId: " dish-1 ", reason: "spaced" },
            { productLineId: "kiosk", dishId: "dish-1", reason: "canonical duplicate" },
            { productLineId: " ", dishId: "dish-2" },
          ],
          limit: { configured: true, value: 1 },
        }],
      },
    },
  },
});
assert.deepEqual(Array.from(canonicalIdentityStore.productLines), ["kiosk"]);
assert.deepEqual(Array.from(canonicalIdentityStore.dishTargets, policy.menuIdentity), ["kiosk|dish-1"]);
assert.equal(canonicalIdentityStore.dishTargets[0].productLineId, "kiosk");
assert.equal(canonicalIdentityStore.dishTargets[0].dishId, "dish-1");
assert.equal(canonicalIdentityStore.dishTargets[0].label, "spaced", "unrelated target fields must be preserved");
assert.deepEqual(
  Array.from(canonicalIdentityStore.categoryTargets, (item) => `${item.productLineId}|${item.categoryId}`),
  ["kiosk|hot"]
);
assert.deepEqual(Array.from(canonicalIdentityStore.dishSetMembers, policy.menuIdentity), ["kiosk|dish-1"]);
const canonicalException = canonicalIdentityStore.periodValues.per_round.exceptionDishLimits["0|0"][0];
assert.deepEqual(Array.from(canonicalException.dishes, policy.menuIdentity), ["kiosk|dish-1"]);
assert.equal(canonicalException.dishes[0].reason, "spaced", "unrelated exception fields must be preserved");
assert.equal(
  policy.targetCellKey(0, 0, " kiosk ", " dish-1 "),
  policy.targetCellKey(0, 0, "kiosk", "dish-1"),
  "target keys must use the same canonical identity fields"
);
assert.equal(
  policy.menuIdentity({ productLineId: " kiosk ", dishId: " dish-1 " }),
  "kiosk|dish-1",
  "menuIdentity must use canonical identity fields"
);

const strictNumberStore = policy.normalizeStoreConfig({
  periodValues: {
    per_round: {
      targetLimits: {
        boolean: { configured: true, value: true },
        array: { configured: true, value: [1] },
        hexadecimal: { configured: true, value: "0x10" },
        whitespace: { configured: true, value: " 1 " },
        decimal: { configured: true, value: "001" },
        finiteInteger: { configured: true, value: 2 },
      },
    },
  },
});
assert.deepEqual({ ...strictNumberStore.periodValues.per_round.targetLimits.boolean }, { configured: false, value: null });
assert.deepEqual({ ...strictNumberStore.periodValues.per_round.targetLimits.array }, { configured: false, value: null });
assert.deepEqual({ ...strictNumberStore.periodValues.per_round.targetLimits.hexadecimal }, { configured: false, value: null });
assert.deepEqual({ ...strictNumberStore.periodValues.per_round.targetLimits.whitespace }, { configured: false, value: null });
assert.deepEqual({ ...strictNumberStore.periodValues.per_round.targetLimits.decimal }, { configured: true, value: 1 });
assert.deepEqual({ ...strictNumberStore.periodValues.per_round.targetLimits.finiteInteger }, { configured: true, value: 2 });

const prototypeKeyMap = JSON.parse('{"__proto__":{"configured":true,"value":"4"}}');
const prototypeSafeStore = policy.normalizeStoreConfig({
  periodValues: { per_round: { targetLimits: prototypeKeyMap } },
});
const prototypeSafeLimits = prototypeSafeStore.periodValues.per_round.targetLimits;
assert.equal(Object.getPrototypeOf(prototypeSafeLimits), null, "external-key maps must have no prototype");
assert.equal(Object.hasOwn(prototypeSafeLimits, "__proto__"), true);
assert.deepEqual({ ...prototypeSafeLimits.__proto__ }, { configured: true, value: 4 });

for (const invalidInput of [null, undefined, "not-an-object", 3, true, [], new Date(0)]) {
  const normalizedStore = policy.normalizeStoreConfig(invalidInput);
  assert.deepEqual(Array.from(normalizedStore.productLines), []);
  assert.deepEqual(Array.from(normalizedStore.dishTargets), []);
  assert.ok(normalizedStore.periodValues.order_lifetime);

  const normalizedRule = policy.normalizeRule(invalidInput);
  assert.equal(normalizedRule.schemaVersion, 4);
  assert.deepEqual(Array.from(normalizedRule.enabledPeriods), []);
  assert.equal(normalizedRule.measureUnit, "piece");
}

const ruleInput = {
  period: "per_round",
  enabledPeriods: ["per_round", "invalid", "per_round", "order_lifetime"],
  measureUnit: "kind",
  periodPolicies: {
    per_round: {
      enabled: false,
      blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: true },
    },
  },
  storeConfigs: { storeA: storeInput },
};
const ruleSnapshot = JSON.stringify(ruleInput);
const rule = policy.normalizeRule(ruleInput);

assert.equal(JSON.stringify(ruleInput), ruleSnapshot, "normalizeRule must not mutate input");
assert.equal(rule.schemaVersion, 4);
assert.deepEqual(Array.from(rule.enabledPeriods), ["per_round", "order_lifetime"]);
assert.equal(rule.measureUnit, "kind");
assert.equal(rule.periodPolicies.per_round.enabled, true, "enabledPeriods is authoritative");
assert.deepEqual({ ...rule.periodPolicies.per_round.blocks }, {
  totalEnabled: true,
  targetEnabled: false,
  sameDishEnabled: true,
});
assert.equal(rule.periodPolicies.order_lifetime.enabled, true);
assert.equal(rule.periodPolicies.multi_round.enabled, false);
assert.notEqual(rule.storeConfigs.storeA, storeInput);

for (const page of [
  "buffet-rule.html",
  "buffet-rule-editor.html",
  "buffet-rule-publish-confirm.html",
]) {
  const html = fs.readFileSync(path.join(root, "dist/Configuration center", page), "utf8");
  const policyIndex = html.indexOf('src="assets/buffet-rule-policy.js"');
  const domainIndex = html.indexOf('src="assets/buffet-rule-domain.js"');
  const profileIndex = html.indexOf('src="assets/buffet-rule-profile.js"');
  assert.ok(policyIndex >= 0, `${page} must load buffet-rule-policy.js`);
  assert.ok(policyIndex < domainIndex, `${page} must load policy before domain`);
  assert.ok(domainIndex < profileIndex, `${page} must load domain before profile`);
}

for (const page of [
  "order-limit.html",
  "order-limit-rule-editor.html",
  "order-limit-publish-confirm.html",
]) {
  const html = fs.readFileSync(path.join(root, "dist/Configuration center", page), "utf8");
  assert.doesNotMatch(html, /buffet-rule-policy\.js/, `${page} must remain isolated from buffet policy`);
}

console.log("verify-buffet-v4-policy: OK");
