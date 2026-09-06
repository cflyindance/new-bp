import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("dist/Configuration center/assets/buffet-rule-policy.js", "utf8");
const window = {};
vm.runInNewContext(source, { window, Object, Array, Number, String, JSON, Set, Math });
const policy = window.BuffetRulePolicy;

assert.deepEqual(JSON.parse(JSON.stringify(policy.normalizePeriodSelection({ enabledPeriods: ["per_round"] }))), {
  valid: true, mode: "single", code: "", periods: ["per_round"], templateId: ""
});
assert.equal(policy.normalizePeriodSelection({ enabledPeriods: ["per_round", "multi_round"] }).code, "PERIOD_COMBINATION_INVALID");
assert.equal(policy.normalizePeriodSelection({ enabledPeriods: ["order_lifetime", "per_round", "multi_round"] }).code, "PERIOD_COMBINATION_TOO_MANY");

const legacyLegal = policy.normalizePeriodSelection({ enabledPeriods: ["per_round", "order_lifetime"] });
assert.equal(legacyLegal.valid, true);
assert.equal(legacyLegal.mode, "controlled");
assert.equal(legacyLegal.templateId, "order-round-protection");
assert.equal(legacyLegal.inferred, true);

const draft = { enabledPeriods: ["order_lifetime", "per_round"], periodPolicies: {} };
policy.selectSinglePeriod(draft, "multi_round");
assert.deepEqual(Array.from(draft.enabledPeriods), ["multi_round"]);
assert.equal(draft.period, "multi_round");
assert.equal(draft.periodPolicies.multi_round.enabled, true);
assert.equal(draft.periodPolicies.per_round.enabled, false);

policy.applyControlledPeriodTemplate(draft, "order-multi-round-protection");
assert.deepEqual(Array.from(draft.enabledPeriods), ["order_lifetime", "multi_round"]);
assert.equal(draft.buffetTemplateId, "order-multi-round-protection");

console.log("verify-buffet-period-selection-policy: PASS");
