import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");

assert.match(flow, /data-buffet-template/);
assert.match(flow, /data-period-select="order_lifetime"/);
assert.match(flow, /data-period-select="per_round"/);
assert.match(flow, /data-period-select="multi_round"/);
assert.doesNotMatch(flow, /data-period-toggle=/);
assert.match(flow, /function applyBuffetTemplate\(draft, templateId\)/);
assert.match(flow, /function renderBuffetScenarioConfiguration\(draft\)/);

// 区间新增、编辑都必须通过同一条“先确认、后重建”路径；取消只重绘，不改草稿。
assert.match(flow, /function hasStoreQuantityData\(draft\)/);
assert.match(flow, /Object\.keys\(draft\.limits \|\| \{\}\)\.length \|\| Object\.keys\(draft\.dishSetLimits \|\| \{\}\)\.length/);
assert.match(flow, /function requestRangeMatrixChange\(kind, nextRanges, trigger\)/);
assert.match(flow, /if \(!hasStoreQuantityData\(draft\)\) \{ applyRangeMatrixChange\(draft, kind, nextRanges\); return; \}/);
assert.match(flow, /会重建对应" \+ label \+ "矩阵并清空限额/);
assert.match(flow, /onCancel: function \(\) \{ renderEditor\(\); \}/);
assert.match(flow, /function addRange\(kind\)[\s\S]*?requestRangeMatrixChange\(kind, ranges, document\.activeElement\)/);
assert.match(flow, /if \(target\.hasAttribute\("data-range-kind"\)\)[\s\S]*?event\.type !== "change"[\s\S]*?requestRangeMatrixChange\(rangeKind, ranges, target\)/);
assert.match(flow, /function clearAllRangeQuantityData\(draft\)[\s\S]*?draft\.dishSetLimits = \{\}/);

const root = {};
const profile = {
  moduleId: "buffet-rule",
  storage: { rulesKey: "test", recoveryPrefix: "test:" },
  steps: [],
  allowedPeriods: ["order_lifetime", "per_round", "multi_round"],
  allowedTargetTypes: ["dish", "category", "dish_set"],
  periodTemplates: [
    { id: "round", name: "每轮模板", periods: ["per_round"], blocks: { per_round: ["total", "target"] } }
  ],
  usesV4Capability(draft) {
    return Number(draft?.schemaVersion) >= 4 || Array.isArray(draft?.enabledPeriods);
  },
  upgradeDraftToV4(draft) {
    return { ...draft, schemaVersion: 4, enabledPeriods: [], periodPolicies: {} };
  }
};
const window = {
  ORDER_LIMIT_MODULE_PROFILE: profile,
  __BUFFET_SCENARIO_TEST__: true,
  location: { search: "" },
  BuffetRulePolicy: {
    normalizePeriodSelection(draft) {
      const periods = Array.from(draft.enabledPeriods || []);
      if (periods.length === 1) return { valid: true, mode: "single", periods, templateId: "" };
      return { valid: false, mode: "repair", periods, templateId: "", code: "PERIOD_COMBINATION_INVALID" };
    },
    selectSinglePeriod(draft, period) {
      draft.enabledPeriods = [period];
      draft.buffetTemplateId = "custom";
    }
  }
};
const document = {
  body: { getAttribute: () => "test" },
  getElementById: (id) => id === "orderLimitFlowRoot" ? root : null
};
vm.runInNewContext(flow, { window, document, URLSearchParams, Number, String, Array, Object, Math, JSON, Date, Set, console });
const api = window.BuffetPeriodScenarioTestApi;

const legacy = {
  schemaVersion: 2,
  subject: "party_size",
  period: "per_round",
  targetType: "dish",
  partyRanges: [{ min: 1, max: null }],
  roundRanges: [{ min: 1, max: null }],
  conditions: { childCountPolicy: "inherit" }
};
const legacyBefore = JSON.parse(JSON.stringify(legacy));
api.normalizeDraftForProfile(legacy);
api.renderStepOne(legacy);
api.renderStepThree(legacy);
assert.deepEqual(legacy, legacyBefore, "legacy render/normalize must not upgrade or write v4 fields");

api.applyBuffetTemplate(legacy, "round");
assert.equal(legacy.schemaVersion, 4, "explicit template selection upgrades legacy draft");
assert.deepEqual(Array.from(legacy.enabledPeriods), ["per_round"]);
assert.equal(legacy.periodPolicies.per_round.blocks.targetEnabled, true);

const modern = {
  schemaVersion: 4,
  subject: "party_size",
  targetType: "dish",
  enabledPeriods: ["per_round", "multi_round"],
  periodPolicies: {
    per_round: { enabled: true, blocks: { totalEnabled: false, targetEnabled: false, sameDishEnabled: false } },
    multi_round: { enabled: true, blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: false } }
  },
  partyRanges: [{ min: 1, max: null }],
  roundRanges: [{ min: 1, max: null }],
  conditions: { childCountPolicy: "inherit" }
};
api.ensureBuffetScenarioModel(modern);
assert.equal(modern.periodPolicies.per_round.blocks.targetEnabled, false, "scenario normalization must preserve an explicit disabled target block");
assert.equal(api.enabledPeriodsHaveQuantityBlocks(modern), false);
assert.equal(api.validateStep(2, modern), "限制周期组合不合法，请选择单周期或受控组合模板");

api.selectSingleBuffetPeriod(modern, "multi_round");
assert.deepEqual(Array.from(modern.enabledPeriods), ["multi_round"]);
assert.match(api.renderBuffetScenarioConfiguration(modern), /type="radio"/);

const malformedV4 = {
  schemaVersion: 4,
  subject: "party_size",
  targetType: "dish",
  enabledPeriods: ["per_round"],
  periodPolicies: {
    per_round: { enabled: true, blocks: { totalEnabled: false, targetEnabled: false, sameDishEnabled: false } }
  },
  partyRanges: [{ min: 1, max: null }],
  roundRanges: [{ min: 1, max: null }],
  conditions: { childCountPolicy: "inherit" }
};
assert.equal(api.validateStep(2, malformedV4), "每个启用周期至少保留一个限购维度");
assert.equal(malformedV4.periodPolicies.per_round.blocks.targetEnabled, false, "validation must not normalize a malformed v4 policy");

const periodBlocks = flow.match(/function renderBuffetPeriodBlocks\(draft\)[\s\S]*?(?=\n  function renderBuffetScenarioConfiguration)/)?.[0] ?? "";
assert.match(periodBlocks, /data-period-block="target"/, "target block must be independently toggleable for total-only defaults");
assert.match(flow, /if \(blockName === "target"\) policy\.blocks\.targetEnabled = target\.checked/);

console.log("verify-buffet-period-scenario-editor: PASS");
