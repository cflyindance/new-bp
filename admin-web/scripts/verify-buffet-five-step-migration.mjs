import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const policySource = fs.readFileSync("dist/Configuration center/assets/buffet-rule-policy.js", "utf8");
const policyWindow = {};
vm.runInNewContext(policySource, { window: policyWindow, Object, Array, Number, String, JSON, Set, Math });
const policy = policyWindow.BuffetRulePolicy;
const expected = [1, 2, 2, 3, 4, 5];

expected.forEach((next, index) => {
  const result = policy.migrateEditorProgress({ stepVersion: 1, currentStep: index + 1, highestStep: index + 1 });
  assert.equal(result.currentStep, next);
  assert.equal(result.highestStep, next);
  assert.equal(result.stepVersion, 2);
});

const stable = policy.migrateEditorProgress({ stepVersion: 2, currentStep: 4, highestStep: 5 });
assert.deepEqual(JSON.parse(JSON.stringify(stable)), {
  currentStep: 4, highestStep: 5, migrated: false, fallbackApplied: false, stepVersion: 2
});

const profileSource = fs.readFileSync("dist/Configuration center/assets/buffet-rule-profile.js", "utf8");
const profileWindow = { location: { href: "" }, BuffetRuleDomain: null, BuffetRulePolicy: policy };
vm.runInNewContext(profileSource, { window: profileWindow, Object, Array, Number, String, JSON, Date, Math, Set });
assert.equal(profileWindow.ORDER_LIMIT_MODULE_PROFILE.steps.length, 5);
assert.deepEqual(Array.from(profileWindow.ORDER_LIMIT_MODULE_PROFILE.steps, step => step.title), ["规则类型", "限购数量", "超限授权", "生效范围", "确认发布"]);

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const menuSteps = flow.match(/var MENU_ORDER_LIMIT_PROFILE = \{[\s\S]*?steps: \[([\s\S]*?)\]\s*\n\s*\};/);
assert.ok(menuSteps);
assert.equal((menuSteps[1].match(/title:/g) || []).length, 6);

console.log("verify-buffet-five-step-migration: PASS");
