import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storeSource = fs.readFileSync(
  path.join(root, "src/config/duration-billing-rules-store.ts"),
  "utf8",
);
const executableStoreSource = stripTypeScriptTypes(
  storeSource.replace(
    /import \{ readScopeFilters \} from "\.\.\/auth\/session-scope";/,
    "const readScopeFilters = () => ({ store: '' });",
  ),
  { mode: "transform" },
);
const storeModuleUrl = `data:text/javascript;base64,${Buffer.from(executableStoreSource).toString("base64")}`;
const {
  DURATION_BILLING_RULES_STORAGE_KEY_PREFIX,
  formatDurationBillingSceneLabels,
  formatRulePricingSummary,
  listDurationBillingRules,
  resolveDurationBillingIntervalAmount,
  setDurationBillingRuleEnabled,
  storageKeyForStore,
  upsertDurationBillingRule,
  validateDurationBillingRule,
} = await import(storeModuleUrl);
const uiSource = fs.readFileSync(
  path.join(root, "src/config/duration-billing-rules-ui.ts"),
  "utf8",
);
const mainSource = fs.readFileSync(path.join(root, "src/main.ts"), "utf8");
const catalogSource = fs.readFileSync(
  path.join(root, "src/config/module-settings-catalog.ts"),
  "utf8",
);

const failures = [];

const memoryStorage = new Map();
globalThis.window = {};
globalThis.localStorage = {
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, value) => memoryStorage.set(key, String(value)),
  removeItem: (key) => memoryStorage.delete(key),
};

function check(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${name}: ${message}`);
  }
}

const ktvProductBinding = {
  productId: "ktv-product-1",
  productNameSnapshot: "KTV",
  requiredTag: "KTV",
  snapshotUpdatedAt: "2026-08-21T00:00:00.000Z",
};

check("exports storage key prefix", () => {
  assert.equal(DURATION_BILLING_RULES_STORAGE_KEY_PREFIX, "bplant-duration-billing-rules:v1");
});

check("storageKeyForStore encodes store id", () => {
  assert.equal(
    storageKeyForStore("store-01"),
    "bplant-duration-billing-rules:v1:store:store-01",
  );
});

check("validate accepts unit pricing rule", () => {
  const result = validateDurationBillingRule({
    name: "工作日白天",
    scenes: ["ktv"],
    enabled: true,
    productBinding: ktvProductBinding,
    pricing: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true },
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.pricing.type, "unit");
    if (result.value.pricing.type === "unit") {
      assert.equal(result.value.pricing.amount, 5);
      assert.equal(result.value.pricing.unitMinutes, 30);
    }
  }
});

check("validate accepts rule without scenes", () => {
  const result = validateDurationBillingRule({
    name: "通用计价",
    enabled: true,
    productBinding: ktvProductBinding,
    pricing: { type: "unit", amount: 8, unitMinutes: 60, roundUp: true },
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value.scenes, []);
});

check("new rules require a KTV product binding", () => {
  const result = validateDurationBillingRule({
    name: "缺少商品",
    enabled: true,
    pricing: { type: "unit", amount: 8, unitMinutes: 60, roundUp: true },
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.message, /KTV.*商品/);
});

check("create stores empty scenes and edit preserves legacy scenes", () => {
  const storeId = "scene-compat-store";
  const created = upsertDurationBillingRule(storeId, {
    name: "通用计价",
    enabled: true,
    productBinding: ktvProductBinding,
    pricing: { type: "unit", amount: 8, unitMinutes: 60, roundUp: true },
  });
  assert.equal(created.ok, true);
  if (created.ok) assert.deepEqual(created.rule.scenes, []);

  memoryStorage.set(storageKeyForStore(storeId), JSON.stringify({ rules: [{
    ...created.rule,
    id: "legacy-rule",
    scenes: ["ktv"],
  }] }));
  const edited = upsertDurationBillingRule(storeId, {
    id: "legacy-rule",
    name: "旧规则已编辑",
    scenes: listDurationBillingRules(storeId)[0].scenes,
    enabled: true,
    productBinding: ktvProductBinding,
    pricing: { type: "unit", amount: 10, unitMinutes: 60, roundUp: true },
  });
  assert.equal(edited.ok, true);
  if (edited.ok) assert.deepEqual(edited.rule.scenes, ["ktv"]);
});

check("read normalizes missing scenes to empty array", () => {
  const storeId = "missing-scenes-store";
  memoryStorage.set(storageKeyForStore(storeId), JSON.stringify({ rules: [{
    id: "legacy-without-scenes",
    name: "旧规则",
    enabled: true,
    pricing: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true },
    storeIds: [storeId],
    lines: ["emenu"],
    createdAt: "",
    updatedAt: "",
  }] }));
  assert.deepEqual(listDurationBillingRules(storeId)[0].scenes, []);
});

check("validate rejects empty name", () => {
  const result = validateDurationBillingRule({
    name: "   ",
    scenes: ["ktv"],
    enabled: true,
    pricing: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true },
  });
  assert.equal(result.ok, false);
});

check("validate rejects invalid amount", () => {
  const result = validateDurationBillingRule({
    name: "测试",
    scenes: ["ktv"],
    enabled: true,
    pricing: { type: "unit", amount: 0, unitMinutes: 30, roundUp: true },
  });
  assert.equal(result.ok, false);
});

check("validate rejects tiered in P0 default", () => {
  const result = validateDurationBillingRule({
    name: "阶梯",
    scenes: ["ktv"],
    enabled: true,
    pricing: {
      type: "tiered",
      tiers: [{ start: "09:00", end: "18:00", amount: 10, unitMinutes: 60 }],
    },
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /单价/);
  }
});

const intervalPricing = {
  type: "interval",
  intervals: [
    { endMinutes: 30, amount: 10 },
    { endMinutes: 60, amount: 18 },
    { endMinutes: null, amount: 25 },
  ],
};

check("interval pricing saves and reloads", () => {
  const storeId = "interval-store";
  const result = upsertDurationBillingRule(storeId, {
    name: "区间计价",
    enabled: true,
    productBinding: ktvProductBinding,
    pricing: intervalPricing,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(listDurationBillingRules(storeId)[0].pricing, intervalPricing);
});

check("interval pricing validates store-level edge cases", () => {
  const invalidIntervals = [
    [{ endMinutes: null, amount: 10 }],
    [{ endMinutes: null, amount: 10 }, { endMinutes: null, amount: 20 }],
    [{ endMinutes: 30, amount: 10 }, { endMinutes: 30, amount: 20 }, { endMinutes: null, amount: 30 }],
    [{ endMinutes: 30.5, amount: 10 }, { endMinutes: null, amount: 20 }],
    [{ endMinutes: Number.NaN, amount: 10 }, { endMinutes: null, amount: 20 }],
    [{ endMinutes: Number.POSITIVE_INFINITY, amount: 10 }, { endMinutes: null, amount: 20 }],
    [{ endMinutes: 30, amount: 10.123 }, { endMinutes: null, amount: 20 }],
    [{ endMinutes: 30, amount: Number.NaN }, { endMinutes: null, amount: 20 }],
    [{ endMinutes: 30, amount: 10 }, { endMinutes: null, amount: Number.POSITIVE_INFINITY }],
  ];
  for (const intervals of invalidIntervals) {
    assert.equal(validateDurationBillingRule({
      name: "无效区间",
      enabled: true,
      pricing: { type: "interval", intervals },
    }).ok, false);
  }
});

check("interval amount resolves exact boundaries", () => {
  assert.equal(resolveDurationBillingIntervalAmount(intervalPricing, 1), 10);
  assert.equal(resolveDurationBillingIntervalAmount(intervalPricing, 30), 10);
  assert.equal(resolveDurationBillingIntervalAmount(intervalPricing, 30.1), 18);
  assert.equal(resolveDurationBillingIntervalAmount(intervalPricing, 31), 18);
  assert.equal(resolveDurationBillingIntervalAmount(intervalPricing, 60), 18);
  assert.equal(resolveDurationBillingIntervalAmount(intervalPricing, 61), 25);
  for (const invalid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(resolveDurationBillingIntervalAmount(intervalPricing, invalid), null);
  }
});

check("interval summary truncates after three of four total tiers", () => {
  const rule = {
    id: "interval-summary",
    name: "四档",
    scenes: [],
    enabled: true,
    pricing: {
      type: "interval",
      intervals: [
        { endMinutes: 30, amount: 10 },
        { endMinutes: 60, amount: 18 },
        { endMinutes: 90, amount: 25 },
        { endMinutes: null, amount: 30 },
      ],
    },
    storeIds: ["s1"],
    lines: ["emenu"],
    createdAt: "",
    updatedAt: "",
  };
  assert.equal(
    formatRulePricingSummary(rule),
    "1–30min ¥10 · 31–60min ¥18 · 61–90min ¥25 · 共 4 档",
  );
});

check("legacy tiered pricing survives read and toggle", () => {
  const storeId = "legacy-tiered-store";
  const legacyPricing = {
    type: "tiered",
    tiers: [{ start: "09:00", end: "18:00", amount: 10, unitMinutes: 60 }],
  };
  memoryStorage.set(storageKeyForStore(storeId), JSON.stringify({ rules: [{
    id: "legacy-tiered",
    name: "旧时段规则",
    scenes: ["ktv"],
    enabled: true,
    pricing: legacyPricing,
    storeIds: [storeId],
    lines: ["emenu"],
    createdAt: "old",
    updatedAt: "old",
  }] }));
  assert.deepEqual(listDurationBillingRules(storeId)[0].pricing, legacyPricing);
  assert.equal(setDurationBillingRuleEnabled(storeId, "legacy-tiered", false).ok, true);
  assert.deepEqual(listDurationBillingRules(storeId)[0].pricing, legacyPricing);
  assert.equal(upsertDurationBillingRule(storeId, {
    name: "另一条规则",
    enabled: true,
    productBinding: ktvProductBinding,
    pricing: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true },
  }).ok, true);
  assert.deepEqual(
    listDurationBillingRules(storeId).find((rule) => rule.id === "legacy-tiered")?.pricing,
    legacyPricing,
  );
});

check("formatRulePricingSummary unit mode", () => {
  const rule = {
    id: "r1",
    name: "测试",
    scenes: ["ktv"],
    enabled: true,
    pricing: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true },
    storeIds: ["s1"],
    lines: ["emenu"],
    createdAt: "",
    updatedAt: "",
  };
  assert.equal(formatRulePricingSummary(rule), "¥5/30min");
});

check("formatDurationBillingSceneLabels", () => {
  assert.equal(formatDurationBillingSceneLabels(["ktv", "vip-room"]), "KTV、VIP包间");
});

check("source declares CRUD exports", () => {
  assert.match(storeSource, /export function listDurationBillingRules\(/);
  assert.match(storeSource, /export function getDurationBillingRule\(/);
  assert.match(storeSource, /export function upsertDurationBillingRule\(/);
  assert.match(storeSource, /export function deleteDurationBillingRule\(/);
  assert.match(storeSource, /export function countTableBindings\(/);
  assert.match(storeSource, /export function validateDurationBillingRule\(/);
  assert.match(storeSource, /export function formatRulePricingSummary\(/);
  assert.match(storeSource, /export function resolveDurationBillingIntervalAmount\(/);
  assert.match(storeSource, /export function resolveDurationBillingAmount\(/);
});

check("rule UI is group-level and has no scene selector or column", () => {
  assert.match(mainSource, /group\.groupKey === "foh-guest-duration-scenarios"/);
  assert.match(mainSource, /data-duration-billing-rules-group-row/);
  assert.doesNotMatch(uiSource, /data-duration-billing-drawer-scene/);
  assert.doesNotMatch(uiSource, />适用场景</);
  assert.doesNotMatch(uiSource, /data-duration-billing-pricing-mode/);
  assert.match(uiSource, /data-duration-billing-rate-row/);
  assert.match(uiSource, /data-duration-billing-rate-charge-type/);
  assert.match(uiSource, /data-duration-billing-rate-add/);
  assert.match(uiSource, />固定收费</);
  assert.match(uiSource, />按单位收费</);
  assert.match(uiSource, /loadKposKtvSaleItems/);
  assert.doesNotMatch(uiSource, /fetchKtvMenuProducts/);
  assert.match(uiSource, /data-duration-billing-drawer-product/);
  assert.match(uiSource, /requiredTag: "KTV"/);
  assert.match(uiSource, /rates\.length <= 1/);
  assert.match(uiSource, /pricing: \{ type: "rates", rates: readRateRows\(drawer\) \}/);
  assert.match(uiSource, /旧版时段计价规则暂不支持编辑/);
});

check("catalog no longer contains duration billing seq 443", () => {
  assert.doesNotMatch(catalogSource, /seq:\s*443/);
  assert.doesNotMatch(catalogSource, /按照时长收费/);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nverify-duration-billing-rules-store: OK");
