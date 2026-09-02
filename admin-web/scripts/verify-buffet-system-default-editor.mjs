import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const policySource = fs.readFileSync("dist/Configuration center/assets/buffet-rule-policy.js", "utf8");
const profileSource = fs.readFileSync("dist/Configuration center/assets/buffet-rule-profile.js", "utf8");
const flowSource = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const cssSource = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.css", "utf8");

function loadProfile() {
  const storage = new Map();
  const window = {};
  const context = {
    window,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
    },
  };
  vm.runInNewContext(policySource, context);
  vm.runInNewContext(profileSource, context);
  return window.ORDER_LIMIT_MODULE_PROFILE;
}

function loadFlow(profile) {
  const root = {};
  const window = {
    ORDER_LIMIT_MODULE_PROFILE: profile,
    __BUFFET_SCENARIO_TEST__: true,
    location: { search: "" },
  };
  const document = {
    body: { getAttribute: () => "test" },
    getElementById: (id) => id === "orderLimitFlowRoot" ? root : null,
  };
  vm.runInNewContext(flowSource, {
    window, document, URLSearchParams, Number, String, Array, Object, Math, JSON, Date, Set, console,
  });
  return window.BuffetPeriodScenarioTestApi;
}

const profile = loadProfile();
profile.conflictPolicy = {
  dishSetOverlapDetails(candidate, records, excludedIds) {
    if (candidate.targetType !== "dish_set" || excludedIds.map(String).includes("active-overlap")) return null;
    return records.some((record) => record.id === "active-overlap")
      ? { ruleId: "active-overlap", storeIds: ["store1"], dishIds: ["kiosk|dish:a"] }
      : null;
  },
};
const api = loadFlow(profile);

const copied = profile.lifecycle.prepareDraftCopy({
  origin: "system_default",
  defaultScenarioKey: "order|per_round|dish",
  defaultCatalogVersion: 3,
  name: "每轮指定菜品最多下多少份",
});
assert.equal(copied.origin, undefined);
assert.equal(copied.defaultScenarioKey, undefined);
assert.equal(copied.defaultCatalogVersion, undefined);

const template = profile.defaultScenarios.find((item) => item.key === "order|per_round|dish");
const draft = profile.createDefaultScenarioRule(template, 101).editorDraft;
draft.storeConfigs = {
  store1: {
    periodValues: {
      per_round: { targetLimits: { "1|1|kiosk|dish:a": { configured: true, value: 7 } } },
    },
  },
};
const beforeQuantity = JSON.stringify(draft.storeConfigs);
api.normalizeDraftForProfile(draft);
assert.equal(api.isSystemDefaultDraft(draft), true);
assert.equal(api.systemDefaultTemplate(draft).key, template.key);
assert.deepEqual(Array.from(draft.enabledPeriods), ["per_round"]);
assert.deepEqual(
  { ...draft.periodPolicies.per_round.blocks },
  { totalEnabled: false, targetEnabled: true, sameDishEnabled: false },
);
assert.equal(JSON.stringify(draft.storeConfigs), beforeQuantity, "template repair must preserve business quantity values");

draft.periodPolicies.per_round.blocks.totalEnabled = false;
draft.periodPolicies.per_round.blocks.sameDishEnabled = true;
api.normalizeDraftForProfile(draft);
assert.deepEqual(
  { ...draft.periodPolicies.per_round.blocks },
  { totalEnabled: false, targetEnabled: true, sameDishEnabled: true },
  "editable period blocks must not be reset to the system template",
);

function quantityBearingSystemDraft(overrides = {}) {
  const candidate = JSON.parse(JSON.stringify(profile.createDefaultScenarioRule(template, 102).editorDraft));
  candidate.storeConfigs = {
    store1: {
      targetIds: ["dish:a"],
      periodValues: {
        per_round: { targetLimits: { "1|1|kiosk|dish:a": { configured: true, value: 7 } } },
      },
    },
  };
  Object.assign(candidate, overrides);
  return candidate;
}

for (const [label, overrides, expected] of [
  ["subject", { subject: "party_size" }, { subject: "party_size" }],
  ["target", { targetType: "dish_set" }, { targetType: "dish_set" }],
  ["period", {
    period: "order_lifetime",
    enabledPeriods: ["order_lifetime"],
    periodPolicies: {
      order_lifetime: { enabled: true, blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    },
  }, { period: "order_lifetime", enabledPeriods: ["order_lifetime"] }],
]) {
  const conflicted = quantityBearingSystemDraft(overrides);
  const quantityBefore = JSON.stringify(conflicted.storeConfigs);
  api.normalizeDraftForProfile(conflicted);
  assert.equal(conflicted.origin, undefined, `${label} conflict with business data must downgrade`);
  assert.equal(conflicted.defaultScenarioKey, undefined);
  assert.equal(conflicted.defaultCatalogVersion, undefined);
  for (const [field, value] of Object.entries(expected)) {
    assert.deepEqual(Array.isArray(value) ? Array.from(conflicted[field]) : conflicted[field], value, `${label} semantics must be preserved`);
  }
  assert.equal(JSON.stringify(conflicted.storeConfigs), quantityBefore, `${label} quantity must be preserved`);
}

const blankMissingStructure = JSON.parse(JSON.stringify(profile.createDefaultScenarioRule(template, 103).editorDraft));
delete blankMissingStructure.enabledPeriods;
delete blankMissingStructure.periodPolicies;
delete blankMissingStructure.period;
api.normalizeDraftForProfile(blankMissingStructure);
assert.equal(blankMissingStructure.origin, "system_default", "blank draft may safely repair missing structure");
assert.deepEqual(Array.from(blankMissingStructure.enabledPeriods), ["per_round"]);
assert.deepEqual(
  { ...blankMissingStructure.periodPolicies.per_round.blocks },
  { totalEnabled: false, targetEnabled: true, sameDishEnabled: false },
);

const stepOne = api.renderStepOne(draft);
assert.doesNotMatch(stepOne, /系统默认场景，规则类型不可修改/);
assert.doesNotMatch(stepOne, /data-choice-field="subject"[^>]*disabled/);
assert.doesNotMatch(stepOne, /data-choice-field="targetType"[^>]*disabled/);
assert.doesNotMatch(stepOne, /olf-choice[^"']*is-locked/);
assert.match(stepOne, /限购主体/);

const stepTwo = api.renderStepThree(draft);
assert.match(stepTwo, /每轮/);
assert.match(stepTwo, /data-period-toggle="per_round"/);
assert.match(stepTwo, /data-period-block="total"/);

const ordinary = {
  schemaVersion: 4,
  subject: "order",
  targetType: "dish",
  enabledPeriods: ["per_round"],
  periodPolicies: { per_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: false } } },
  partyRanges: [{ min: 1, max: null }],
  roundRanges: [{ min: 1, max: null }],
  conditions: { childCountPolicy: "inherit" },
  name: "普通规则",
  description: "",
};
assert.equal(api.isSystemDefaultDraft(ordinary), false);
assert.equal(api.systemDefaultTemplate(ordinary), null);
const ordinaryStepOne = api.renderStepOne(ordinary);
assert.doesNotMatch(ordinaryStepOne, /系统默认场景，规则类型不可修改/);
assert.doesNotMatch(ordinaryStepOne, /data-choice-field="subject"[^>]*disabled/);
assert.doesNotMatch(ordinaryStepOne, /data-choice-field="targetType"[^>]*disabled/);
const ordinaryStepTwo = api.renderStepThree(ordinary);
assert.match(ordinaryStepTwo, /data-period-toggle="per_round"/);
assert.match(ordinaryStepTwo, /data-period-block="total"/);

const unsafeIdentity = {
  ...ordinary,
  origin: "system_default",
  defaultScenarioKey: "order|per_round|unknown",
  defaultCatalogVersion: 2,
};
api.normalizeDraftForProfile(unsafeIdentity);
assert.equal(unsafeIdentity.origin, undefined, "unrecognized identity must be downgraded to an ordinary rule");
assert.equal(unsafeIdentity.defaultScenarioKey, undefined);
assert.equal(unsafeIdentity.defaultCatalogVersion, undefined);

assert.doesNotMatch(flowSource, /系统默认规则的限购主体、额度周期和限购对象不可修改/);
assert.doesNotMatch(flowSource, /系统默认规则的额度周期不可修改/);
assert.doesNotMatch(flowSource, /系统默认规则的限购维度不可修改/);
assert.doesNotMatch(cssSource, /\.olf-page \.olf-choice\.is-locked/);
assert.match(cssSource, /\.olf-page \.olf-system-default-note/);

const sourceRule = profile.createDefaultScenarioRule(template, 201);
const editableRule = {
  id: 301,
  sourceRuleId: sourceRule.id,
  status: "draft",
  editorDraft: JSON.parse(JSON.stringify(sourceRule.editorDraft)),
};
assert.equal(api.systemDefaultIdentityDecision(editableRule, [sourceRule, editableRule]), "preserve");
editableRule.editorDraft.subject = "party_size";
assert.equal(api.applySystemDefaultIdentityDecision(editableRule, [sourceRule, editableRule]), "detach");
assert.equal(editableRule.editorDraft.defaultScenarioKey, undefined);
assert.equal(editableRule.sourceRuleId, sourceRule.id, "detach must preserve immutable source reference");
editableRule.editorDraft.subject = sourceRule.editorDraft.subject;
editableRule.editorDraft.targetType = sourceRule.editorDraft.targetType;
editableRule.editorDraft.enabledPeriods = Array.from(sourceRule.editorDraft.enabledPeriods);
assert.equal(api.applySystemDefaultIdentityDecision(editableRule, [sourceRule, editableRule]), "preserve");
assert.equal(editableRule.editorDraft.defaultScenarioKey, template.key, "reverting axes must restore default identity from source");

const ordinaryWrapper = { id: 401, sourceRuleId: "ordinary-source", editorDraft: JSON.parse(JSON.stringify(ordinary)) };
assert.equal(api.applySystemDefaultIdentityDecision(ordinaryWrapper, [{ id: "ordinary-source", ...ordinary }]), "ordinary");
assert.equal(ordinaryWrapper.editorDraft.origin, undefined);
assert.match(flowSource, /function saveEditorDraft\(immediate\)[\s\S]*?applySystemDefaultIdentityDecision\(prepared, rules, false\)/);
assert.match(flowSource, /function publishDraft\(draftRule\)[\s\S]*?applySystemDefaultIdentityDecision\(prepared, rules, true\)/);

const overlappingDraftRule = { id: "draft-1", editorDraft: { targetType: "dish_set" } };
const activeOverlap = { id: "active-overlap", status: "active", authoringConfig: { name: "海鲜菜品集" } };
assert.equal(
  api.dishSetDraftOverlapWarning(overlappingDraftRule, [overlappingDraftRule, activeOverlap]),
  "草稿已保存，但与“海鲜菜品集”在 1 家门店存在菜品集重叠；启用或发布前需要调整。",
);
assert.equal(api.dishSetDraftOverlapWarning({ id: "dish", editorDraft: { targetType: "dish" } }, [activeOverlap]), "");
assert.equal(api.dishSetDraftOverlapWarning({ id: "category", editorDraft: { targetType: "category" } }, [activeOverlap]), "");
assert.match(flowSource, /saveRules\(rules\);[\s\S]*?dishSetDraftOverlapWarning\(built, loadRules\(\)\)/, "warning must run only after persistence");
assert.match(flowSource, /if \(overlapWarning\) toast\(overlapWarning, true\)/);
assert.match(profileSource, /activationValidation[\s\S]*?domain\.findConflict\(draft, records \|\| \[\], \[record && record\.id\]\.filter\(Boolean\)\)/, "activation must block domain conflicts");
assert.match(flowSource, /function publishDraft\(draftRule\)[\s\S]*?validateBuffetRuleConflict\(draftRule\)[\s\S]*?if \(conflict\) throw new Error/, "publication must block the same domain conflict");

console.log("verify-buffet-system-default-editor: PASS");
