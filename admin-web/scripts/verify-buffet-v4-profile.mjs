import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policySource = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"),
  "utf8",
);
const profileSource = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"),
  "utf8",
);
const flowSource = fs.readFileSync(
  path.join(root, "dist/Configuration center/assets/order-limit-flow.js"),
  "utf8",
);

function storageMock(seed = {}) {
  const values = new Map(Object.entries(seed));
  let writes = 0;
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { writes += 1; values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    get writes() { return writes; },
  };
}

function loadProfile(storage) {
  const window = {};
  const context = { window, localStorage: storage };
  vm.runInNewContext(policySource, context);
  vm.runInNewContext(profileSource, context);
  return window.ORDER_LIMIT_MODULE_PROFILE;
}

const profile = loadProfile(storageMock());

assert.deepEqual(Array.from(profile.periodTemplates, (item) => item.id), [
  "order-basic",
  "round-party-table-cap",
  "order-round-protection",
  "multi-round-desc",
  "custom",
]);
assert.deepEqual(Array.from(profile.allowedTargetTypes), ["category", "dish", "dish_set"]);
assert.deepEqual(Array.from(profile.allowedPeriods), ["order_lifetime", "per_round", "multi_round"]);

const defaultRule = profile.createDefaultScenarioRule(
  profile.defaultScenarios.find((item) => item.key === "order|order_lifetime|dish"),
  1,
);
assert.equal(defaultRule.editorDraft.schemaVersion, 4);
assert.equal(defaultRule.defaultScenarioKey, "order|order_lifetime|dish");
assert.equal(defaultRule.defaultCatalogVersion, 3);
assert.equal(defaultRule.name, "每个订单指定菜品限制下单份数");
assert.deepEqual(Array.from(defaultRule.editorDraft.enabledPeriods), ["order_lifetime"]);
assert.ok(defaultRule.editorDraft.storeConfigs && typeof defaultRule.editorDraft.storeConfigs === "object");

for (const subject of ["order", "party_size"]) {
  for (const period of ["order_lifetime", "per_round"]) {
    for (const targetType of ["dish", "dish_set"]) {
      const prefix = `${subject}|${period}|${targetType}`;
      assert.ok(
        profile.defaultScenarios.some((item) => item.key === prefix || item.key.startsWith(prefix + "|")),
        `默认规则应覆盖 ${subject} × ${period} × ${targetType}`,
      );
    }
  }
}
assert.equal(profile.defaultScenarios.length, 12, "默认规则应为固定的十二场景目录");
assert.equal(profile.defaultScenarios.some((item) => item.targetType === "category"), false);

const legacyDraft = {
  schemaVersion: 2,
  subject: "party_size",
  period: "per_round",
  targetType: "dish_set",
  measureUnit: "piece",
  dishSetLimits: { "0|0": { configured: true, value: 3 } },
  storeConfigs: {
    "ny-midtown": {
      productLines: ["kiosk"],
      dishSetMembers: [
        { productLineId: "kiosk", dishId: "dish-a" },
        { productLineId: "kiosk", dishId: "dish-b" },
      ],
      dishSetLimits: { "0|0": { configured: true, value: 3 } },
    },
  },
};
const legacyBefore = JSON.stringify(legacyDraft);
assert.equal(profile.usesV4Capability(legacyDraft), false);
assert.equal(JSON.stringify(legacyDraft), legacyBefore, "能力检测不得修改旧草稿");

const repositoryKey = profile.storage.rulesKey;
const legacyRecord = { id: 9, status: "disabled", editorDraft: legacyDraft };
const legacyStorage = storageMock({
  [repositoryKey]: JSON.stringify({
    schemaVersion: 1,
    revision: 3,
    rules: [legacyRecord],
    drafts: [],
    snapshots: {},
    currentSnapshotId: null,
  }),
});
const legacyProfile = loadProfile(legacyStorage);
const writesBeforeLoad = legacyStorage.writes;
const loadedLegacy = legacyProfile.repository.loadRules()[0].editorDraft;
assert.equal(loadedLegacy.schemaVersion, 2);
assert.equal(loadedLegacy.period, "per_round");
assert.deepEqual(JSON.parse(JSON.stringify(loadedLegacy.dishSetLimits)), legacyDraft.dishSetLimits);
assert.equal(legacyStorage.writes, writesBeforeLoad, "旧规则只读加载不得自动写回升级");

const upgraded = legacyProfile.upgradeDraftToV4(loadedLegacy);
assert.equal(upgraded.schemaVersion, 4);
assert.deepEqual(Array.from(upgraded.enabledPeriods), ["per_round"]);
assert.ok(upgraded.storeConfigs["ny-midtown"].periodValues.per_round);
assert.deepEqual(JSON.parse(JSON.stringify(upgraded.dishSetLimits)), legacyDraft.dishSetLimits);
assert.equal(loadedLegacy.schemaVersion, 2, "显式升级不得修改原旧草稿");

const rootDishLegacy = {
  schemaVersion: 1,
  subject: "order",
  period: "per_round",
  targetType: "dish",
  deployStoreIds: ["ny-midtown", "flushing"],
  structureByLine: { kiosk: [{ id: "dish:1" }], emenu: [], sdi: [] },
  productLines: ["kiosk"],
  targetIds: ["dish:1"],
  limits: { "0|0|kiosk|dish:1": { configured: true, value: 4 } },
};
const rootDishSnapshot = JSON.stringify(rootDishLegacy);
const upgradedRootDish = profile.upgradeDraftToV4(rootDishLegacy);
for (const storeId of rootDishLegacy.deployStoreIds) {
  assert.deepEqual(
    { ...upgradedRootDish.storeConfigs[storeId].periodValues.per_round.targetLimits["0|0|kiosk|dish:1"] },
    { configured: true, value: 4 },
    `根级旧菜品额度必须迁移到 ${storeId}`,
  );
}
assert.deepEqual(JSON.parse(JSON.stringify(upgradedRootDish.limits)), rootDishLegacy.limits, "必须保留根级旧菜品额度兼容字段");
assert.equal(JSON.stringify(rootDishLegacy), rootDishSnapshot, "根级菜品升级不得修改输入草稿");

const rootDishSetLegacy = {
  schemaVersion: 2,
  subject: "party_size",
  period: "order_lifetime",
  targetType: "dish_set",
  deployStoreIds: ["ny-midtown", "flushing"],
  structureByLine: { kiosk: [{ id: "dish:a" }, { id: "dish:b" }], emenu: [], sdi: [] },
  productLines: ["kiosk"],
  targetIds: ["dish:a", "dish:b"],
  dishSetMembers: [
    { productLineId: "kiosk", dishId: "dish-a" },
    { productLineId: "kiosk", dishId: "dish-b" },
  ],
  dishSetLimits: { "0|0": { configured: true, value: 3 } },
};
const rootDishSetSnapshot = JSON.stringify(rootDishSetLegacy);
const upgradedRootDishSet = profile.upgradeDraftToV4(rootDishSetLegacy);
for (const storeId of rootDishSetLegacy.deployStoreIds) {
  assert.deepEqual(
    { ...upgradedRootDishSet.storeConfigs[storeId].periodValues.order_lifetime.targetLimits["0|0"] },
    { configured: true, value: 3 },
    `根级旧菜品集额度必须按 ScenarioKey 迁移到 ${storeId}`,
  );
}
assert.deepEqual(
  JSON.parse(JSON.stringify(upgradedRootDishSet.dishSetLimits)),
  rootDishSetLegacy.dishSetLimits,
  "必须保留根级旧菜品集额度兼容字段",
);
assert.equal(JSON.stringify(rootDishSetLegacy), rootDishSetSnapshot, "根级菜品集升级不得修改输入草稿");

assert.equal(profile.usesV4Capability({ schemaVersion: 2, period: "per_round" }), false);
assert.equal(profile.usesV4Capability({ schemaVersion: 4, enabledPeriods: ["per_round"] }), true);
assert.equal(profile.usesV4Capability({ schemaVersion: 2, measureUnit: "kind" }), true);
assert.equal(profile.usesV4Capability({ schemaVersion: 2, tableTargetCaps: { "0|0": { configured: true, value: 5 } } }), true);
assert.equal(profile.usesV4Capability({ schemaVersion: 2, totalBounds: { "0|0": { maxConfigured: true, max: 8 } } }), true);
assert.equal(profile.usesV4Capability({ schemaVersion: 2, defaultDishLimits: { "0|0": { configured: true, value: 2 } } }), true);

assert.match(flowSource, /usesV4Capability/);
assert.match(flowSource, /upgradeDraftToV4/);

console.log("verify-buffet-v4-profile: OK");
