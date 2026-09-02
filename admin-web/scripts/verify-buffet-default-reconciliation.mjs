import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policySource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"), "utf8");
const profileSource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");
const repositoryKey = "buffet-rule:repository:v1";

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

function load(seed) {
  const storage = storageMock(seed);
  const window = {};
  const context = { window, localStorage: storage };
  vm.runInNewContext(policySource, context);
  vm.runInNewContext(profileSource, context);
  return { storage, profile: window.ORDER_LIMIT_MODULE_PROFILE };
}

function envelope(rules = [], extra = {}) {
  return JSON.stringify({ schemaVersion: 1, revision: 3, rules, drafts: [], snapshots: {}, currentSnapshotId: null, ...extra });
}

function draft(subject, targetType, overrides = {}) {
  return {
    subject, period: "order_lifetime", enabledPeriods: ["order_lifetime"], targetType,
    name: "", description: "", participatingStoreIds: [], deployStoreIds: [], storeConfigs: {},
    productLines: [], targetIds: [], selectedCategories: [], selectedDishes: [], limits: {}, quantitySettings: {},
    partyRanges: [{ min: 1, max: null }], roundRanges: [{ min: 1, max: null }],
    ...overrides,
  };
}

function legacy(id, subject, targetType, overrides = {}) {
  const authoringConfig = draft(subject, targetType, overrides.authoringConfig || {});
  return {
    id, status: "disabled", origin: "system_default", defaultScenarioKey: `${subject}|${targetType}`,
    defaultCatalogVersion: 1, name: overrides.name ?? "", description: "", created: overrides.created || "2026-01-01",
    authoringConfig, editorDraft: structuredClone(authoringConfig), ...overrides,
    authoringConfig, editorDraft: structuredClone(authoringConfig),
  };
}

function run(seed) {
  const loaded = load({ [repositoryKey]: seed });
  const rules = loaded.profile.repository.loadForAuthoringList(loaded.profile.createDefaultScenarioRule);
  return { ...loaded, rules, persisted: loaded.profile.repository.readEnvelope() };
}

// A/B. Empty repository seeds exactly twelve defaults once and is byte/write idempotent.
{
  const loaded = load();
  const first = loaded.profile.repository.loadForAuthoringList(loaded.profile.createDefaultScenarioRule);
  assert.equal(first.length, 12);
  assert.equal(loaded.profile.repository.readEnvelope().revision, 1);
  const bytes = loaded.storage.getItem(repositoryKey);
  const writes = loaded.storage.writes;
  loaded.profile.repository.loadForAuthoringList(loaded.profile.createDefaultScenarioRule);
  assert.equal(loaded.storage.getItem(repositoryKey), bytes);
  assert.equal(loaded.storage.writes, writes);
}

// C. A deleted canonical default is refilled blank and disabled.
{
  const first = run(envelope([]));
  const retained = first.persisted.rules.filter((rule) => rule.defaultScenarioKey !== "order|per_round|dish");
  const second = run(envelope(retained));
  const restored = second.rules.find((rule) => rule.defaultScenarioKey === "order|per_round|dish");
  assert.equal(restored.status, "disabled");
  assert.deepEqual(JSON.parse(JSON.stringify(restored.authoringConfig.deployStoreIds)), []);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.authoringConfig.storeConfigs)), {});
}

// D. Four verified v1 defaults migrate in place and eight per-round defaults are added.
{
  const old = [
    legacy(11, "order", "dish", { name: "保留名称", authoringConfig: { targetIds: ["a"], participatingStoreIds: ["s1"] } }),
    legacy(12, "order", "dish_set", { status: "active" }), legacy(13, "party_size", "dish"), legacy(14, "party_size", "dish_set"),
  ];
  const result = run(envelope(old));
  assert.equal(result.rules.length, 12);
  const migrated = result.rules.find((rule) => rule.id === 11);
  assert.equal(migrated.defaultScenarioKey, "order|order_lifetime|dish");
  assert.equal(migrated.defaultCatalogVersion, 3);
  assert.equal(migrated.name, "保留名称");
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.authoringConfig.targetIds)), ["a"]);
  assert.equal(result.rules.find((rule) => rule.id === 12).status, "active", "迁移不得改变启用状态");
  assert.equal(result.rules.filter((rule) => rule.defaultScenarioKey?.includes("|per_round|")).length, 8);
  const bytes = result.storage.getItem(repositoryKey);
  const writes = result.storage.writes;
  result.profile.repository.loadForAuthoringList(result.profile.createDefaultScenarioRule);
  assert.equal(result.storage.getItem(repositoryKey), bytes, "迁移完成后的再次加载必须字节级幂等");
  assert.equal(result.storage.writes, writes);
}

// E/F. Untouched disabled category defaults are removed; configured/active ones become ordinary.
{
  const emptyCategory = legacy(21, "order", "category");
  const configuredCategory = legacy(22, "party_size", "category", { authoringConfig: { targetIds: ["cat-a"] } });
  const activeCategory = legacy(23, "order", "category", { status: "active" });
  const editorConfiguredCategory = legacy(24, "order", "category");
  editorConfiguredCategory.editorDraft.targetIds = ["cat-only-in-editor"];
  const result = run(envelope([emptyCategory, configuredCategory, activeCategory, editorConfiguredCategory]));
  assert.equal(result.rules.some((rule) => rule.id === 21), false);
  [22, 23, 24].forEach((id) => {
    const retained = result.rules.find((rule) => rule.id === id);
    assert.ok(retained);
    assert.equal("origin" in retained, false);
    assert.equal("defaultScenarioKey" in retained, false);
    assert.equal("defaultCatalogVersion" in retained, false);
  });
}

// E2. Legacy root-only range fields and unknown business fields make a record non-blank.
{
  const personRange = legacy(25, "order", "category");
  personRange.personRanges = [{ min: 2, max: 4 }];
  const rounds = legacy(26, "party_size", "category");
  rounds.rounds = [{ min: 2, max: 3 }];
  const unknown = legacy(27, "order", "category");
  unknown.experimentalQuota = { configured: true, value: 3 };
  const result = run(envelope([personRange, rounds, unknown]));
  [25, 26, 27].forEach((id) => {
    const retained = result.rules.find((rule) => rule.id === id);
    assert.ok(retained, `根记录 ${id} 的业务数据不可被删除`);
    assert.equal("defaultScenarioKey" in retained, false);
  });
}

// E3. A nested dish id equal to a rule id is not a snapshot rule reference.
{
  const category = legacy(28, "order", "category");
  const result = run(envelope([category], {
    snapshots: { current: { snapshotId: "current", rules: [{ id: 999, dishes: [{ id: 28 }] }] } },
    currentSnapshotId: "current",
  }));
  assert.equal(result.rules.some((rule) => rule.id === 28), false, "嵌套商品 id 不得阻止空白分类默认规则清理");
}

// E4. Known containers are fail-closed for non-default nested values and unknown fields.
{
  const policyChanged = legacy(29, "order", "category");
  policyChanged.authoringConfig.periodPolicies = {
    order_lifetime: { enabled: true, blocks: { targetEnabled: false } },
  };
  const blackout = legacy(30, "order", "category");
  blackout.authoringConfig.conditions = { blackoutDates: ["2026-10-01"] };
  const authorizationExtension = legacy(33, "party_size", "category");
  authorizationExtension.authoringConfig.authorization = {
    enabled: true,
    allowedScopes: ["operation", "round", "order"],
    defaultScope: "round",
    reasonRequired: true,
    scopePermissions: { operation: "值班经理", round: "主管", order: "店长" },
    emergencyOverrideCode: "required",
  };
  const result = run(envelope([policyChanged, blackout, authorizationExtension]));
  [29, 30, 33].forEach((id) => {
    const retained = result.rules.find((rule) => rule.id === id);
    assert.ok(retained, `known container 内的非默认数据不得删除规则 ${id}`);
    assert.equal("defaultScenarioKey" in retained, false);
  });
}

// E5. Explicit normalized legacy defaults remain blank and removable.
{
  const normalizedBlank = legacy(34, "order", "category");
  normalizedBlank.authoringConfig.periodPolicies = {
    order_lifetime: { enabled: true, blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    per_round: { enabled: false, blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    multi_round: { enabled: false, blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
  };
  normalizedBlank.authoringConfig.conditions = {
    effectiveFrom: "2026-01-01", effectiveTo: "", activityCycle: "weekly",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7], daysOfMonth: [],
    businessHourSlots: [{ id: "dinner", mode: "full", from: "", to: "" }],
    businessHourSetupMode: "all_full", businessHour: "dinner", businessHourTimeMode: "full",
    businessHourFrom: "", businessHourTo: "", memberMode: "all", memberLevelIds: [], childCountPolicy: "inherit",
  };
  normalizedBlank.authoringConfig.authorization = {
    enabled: true, allowedScopes: ["operation", "round", "order"], defaultScope: "round",
    scopePermissions: { operation: "值班经理", round: "主管", order: "店长" }, reasonRequired: true,
  };
  const result = run(envelope([normalizedBlank]));
  assert.equal(result.rules.some((rule) => rule.id === 34), false, "明确的旧默认嵌套基线仍应判为空白");
}

// E6. Deep unknown values inside known containers are fail-closed.
{
  const slotExtension = legacy(35, "order", "category");
  slotExtension.authoringConfig.conditions = {
    businessHourSlots: [{ id: "dinner", mode: "full", from: "", to: "", capacity: 12 }],
  };
  const periodExtension = legacy(36, "party_size", "category");
  periodExtension.authoringConfig.periodValues = {
    order_lifetime: { experimentalLimits: { beta: { configured: true, value: 2 } } },
  };
  const result = run(envelope([slotExtension, periodExtension]));
  [35, 36].forEach((id) => {
    const retained = result.rules.find((rule) => rule.id === id);
    assert.ok(retained, `known container 深层未知数据不可删除规则 ${id}`);
    assert.equal("defaultScenarioKey" in retained, false);
  });
}

// E7. Fully normalized empty period values remain baseline-empty.
{
  const normalized = legacy(37, "order", "category");
  normalized.authoringConfig.periodValues = Object.fromEntries(
    ["order_lifetime", "per_round", "multi_round"].map((period) => [period, {
      totalBounds: {}, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {},
      defaultDishLimits: {}, exceptionDishLimits: {},
    }]),
  );
  const result = run(envelope([normalized]));
  assert.equal(result.rules.some((rule) => rule.id === 37), false, "完整空白 periodValues 结构不得误报为业务数据");
}

// G. A verified legacy rule changed to multi-period becomes ordinary and gets a fresh canonical default.
{
  const changed = legacy(31, "order", "dish", { authoringConfig: { enabledPeriods: ["order_lifetime", "per_round"] } });
  const result = run(envelope([changed]));
  assert.equal("origin" in result.rules.find((rule) => rule.id === 31), false);
  assert.equal(result.rules.filter((rule) => rule.defaultScenarioKey === "order|order_lifetime|dish").length, 1);
}

// H. A semantic/name lookalike without verified provenance remains ordinary and does not cover the canonical default.
{
  const lookalike = { id: 41, status: "disabled", name: "按桌/订单·按菜品限购", authoringConfig: draft("order", "dish") };
  const result = run(envelope([lookalike]));
  assert.ok(result.rules.find((rule) => rule.id === 41));
  assert.equal(result.rules.filter((rule) => rule.defaultScenarioKey === "order|order_lifetime|dish").length, 1);
}

// I. Current-snapshot/published candidate wins; another configured candidate is retained as ordinary.
{
  const configured = legacy(51, "order", "dish", { status: "active", name: "普通候选", authoringConfig: { targetIds: ["a"] } });
  const published = legacy(52, "order", "dish", { name: "快照候选", publishedSnapshotVersion: 7, authoringConfig: { targetIds: ["b"] } });
  const result = run(envelope([configured, published], {
    snapshots: { stable: { snapshotId: "stable", rules: [{ id: 52 }] } }, currentSnapshotId: "stable",
  }));
  assert.equal(result.rules.find((rule) => rule.id === 52).defaultScenarioKey, "order|order_lifetime|dish");
  const demoted = result.rules.find((rule) => rule.id === 51);
  assert.ok(demoted);
  assert.equal("origin" in demoted, false);
  assert.equal(result.persisted.currentSnapshotId, "stable");
  assert.deepEqual(JSON.parse(JSON.stringify(result.persisted.snapshots)), { stable: { snapshotId: "stable", rules: [{ id: 52 }] } });
}

// J. An editing draft delays v2 template migration and preserves source/draft identity byte-for-byte.
{
  const source = {
    id: 61, status: "disabled", origin: "system_default", defaultScenarioKey: "order|per_round|dish",
    defaultCatalogVersion: 2, authoringConfig: draft("order", "dish", { period: "per_round", enabledPeriods: ["per_round"] }),
  };
  const editing = { id: 62, status: "draft", sourceRuleId: 61, editorDraft: structuredClone(source.authoringConfig) };
  const beforeSource = structuredClone(source);
  const beforeDraft = structuredClone(editing);
  const result = run(envelope([source], { drafts: [editing] }));
  assert.deepEqual(JSON.parse(JSON.stringify(result.persisted.rules.find((rule) => rule.id === 61))), beforeSource);
  assert.deepEqual(JSON.parse(JSON.stringify(result.persisted.drafts.find((rule) => rule.id === 62))), beforeDraft);
  assert.equal(result.rules.filter((rule) => rule.defaultScenarioKey === "order|per_round|dish" && rule.defaultCatalogVersion === 3).length, 0, "open draft delays replacement template");
}

// J. A configured duplicate is never deleted; only its system identity is removed.
{
  const primary = legacy(61, "party_size", "dish_set", { name: "主规则", publishedSnapshotVersion: 1 });
  const duplicate = legacy(62, "party_size", "dish_set", { name: "配置重复", authoringConfig: { targetIds: ["a", "b"] } });
  const editorDuplicate = legacy(63, "party_size", "dish_set");
  editorDuplicate.editorDraft.storeConfigs = { s1: { targetIds: ["editor-only"] } };
  const result = run(envelope([primary, duplicate, editorDuplicate]));
  assert.ok(result.rules.find((rule) => rule.id === 62));
  assert.equal("defaultScenarioKey" in result.rules.find((rule) => rule.id === 62), false);
  assert.ok(result.rules.find((rule) => rule.id === 63), "仅 editorDraft 有配置的重复候选不可删除");
  assert.equal("defaultScenarioKey" in result.rules.find((rule) => rule.id === 63), false);
}

// K. Candidate completeness is aggregated across every authoring copy.
{
  const editorRich = legacy(71, "order", "dish");
  editorRich.editorDraft.targetIds = ["a", "b"];
  editorRich.editorDraft.deployStoreIds = ["s1"];
  editorRich.editorDraft.name = "仅编辑草稿中的名称";
  editorRich.editorDraft.description = "仅编辑草稿中有说明";
  editorRich.editorDraft.conditions = { effectiveTo: "2026-12-31" };
  editorRich.editorDraft.authorization = { enabled: false };
  const authoringPoor = legacy(72, "order", "dish", { authoringConfig: { targetIds: ["c"] } });
  const result = run(envelope([authoringPoor, editorRich]));
  assert.equal(result.rules.find((rule) => rule.id === 71).defaultScenarioKey, "order|order_lifetime|dish");
  assert.equal("defaultScenarioKey" in result.rules.find((rule) => rule.id === 72), false);
}

// L. A reference from currentSnapshotId outranks a reference found only in historical snapshots.
{
  const historical = legacy(81, "order", "dish", { status: "active", authoringConfig: { targetIds: ["historical"] } });
  const current = legacy(82, "order", "dish");
  const result = run(envelope([historical, current], {
    snapshots: {
      old: { snapshotId: "old", rules: [{ id: 81 }] },
      current: { snapshotId: "current", rules: [{ id: 82 }] },
    },
    currentSnapshotId: "current",
  }));
  assert.equal(result.rules.find((rule) => rule.id === 82).defaultScenarioKey, "order|order_lifetime|dish");
  assert.equal("defaultScenarioKey" in result.rules.find((rule) => rule.id === 81), false);
}

console.log("verify-buffet-default-reconciliation: OK");
