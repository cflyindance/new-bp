import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const policySource = fs.readFileSync("dist/Configuration center/assets/buffet-rule-policy.js", "utf8");
const profileSource = fs.readFileSync("dist/Configuration center/assets/buffet-rule-profile.js", "utf8");

assert.match(profileSource, /id: "order-basic"[^\n]*presetSubject: "order"/);
assert.match(profileSource, /id: "round-party-table-cap"[^\n]*presetSubject: "party_size"/);
assert.match(profileSource, /id: "order-round-protection"[^\n]*presetSubject: "order"[^\n]*presetTargetType: "dish_set"/);
assert.match(profileSource, /id: "order-multi-round-protection"[^\n]*presetSubject: "order"/);
assert.doesNotMatch(profileSource, /id: "multi-round-desc"[^\n]*presetSubject:/);
assert.doesNotMatch(profileSource, /id: "custom"[^\n]*presetSubject:/);
const policyWindow = {};
vm.runInNewContext(policySource, { window: policyWindow, Object, Array, Number, String, JSON, Set, Math });
const policy = policyWindow.BuffetRulePolicy;

const roundParty = { subjects: ["party_size"], targetTypes: ["category", "dish", "dish_set"] };
const orderRound = { subjects: ["order", "party_size"], targetTypes: ["dish_set"] };
assert.equal(policy.templateAvailability({ subject: "order", targetType: "dish" }, roundParty).enabled, false);
assert.match(policy.templateAvailability({ subject: "order", targetType: "dish" }, roundParty).reason, /主体/);
assert.equal(policy.templateAvailability({ subject: "party_size", targetType: "dish" }, roundParty).enabled, true);
assert.equal(policy.templateAvailability({ subject: "order", targetType: "dish" }, orderRound).enabled, false);
assert.match(policy.templateAvailability({ subject: "order", targetType: "dish" }, orderRound).reason, /对象/);
assert.equal(policy.templateAvailability({ subject: "order", targetType: "dish_set" }, orderRound).enabled, true);

assert.equal(policy.allowedLimitBlocks({ subject: "order", targetType: "dish" }, "order_lifetime").total, false);
assert.equal(policy.allowedLimitBlocks({ subject: "order", targetType: "dish" }, "per_round").sameDish, false);
assert.equal(policy.allowedLimitBlocks({ subject: "order", targetType: "dish_set", measureUnit: "piece" }, "per_round").sameDish, true);
assert.equal(policy.allowedLimitBlocks({ subject: "party_size", targetType: "category" }, "per_round").tableFallback, true);
assert.equal(policy.allowedLimitBlocks({ subject: "order", targetType: "dish_set" }, "per_round").tableFallback, false);

console.log("verify-buffet-template-applicability: PASS");
