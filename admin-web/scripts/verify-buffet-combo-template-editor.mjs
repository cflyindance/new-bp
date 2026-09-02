import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policySource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"), "utf8");
const profileSource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");
const context = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
vm.runInNewContext(policySource, context);
vm.runInNewContext(profileSource, context);
const profile = context.window.ORDER_LIMIT_MODULE_PROFILE;
const api = profile.comboQuantities;

function configured(value) { return { configured: true, value }; }
function bound(min, max) { return { minConfigured: true, min, maxConfigured: true, max }; }

for (const [index, template] of profile.defaultScenarios.filter((item) => item.group === "per_round_combo").entries()) {
  const rule = profile.createDefaultScenarioRule(template, index + 1).authoringConfig;
  const rangeId = rule.partyRanges[0].rangeId;
  rule.participatingStoreIds = ["store-a"];
  rule.deployStoreIds = ["store-a"];
  rule.storeConfigs["store-a"] = {
    dishTargets: template.targetType === "dish" ? [{ productLineId: "kiosk", dishId: "dish:a", name: "A" }] : [],
    dishSetMembers: template.targetType === "dish_set" ? [
      { productLineId: "kiosk", dishId: "dish:a", name: "A" },
      { productLineId: "emenu", dishId: "dish:b", name: "B" },
    ] : [],
    periodValues: { per_round: api.emptyPeriodValues() },
  };
  api.write(rule, "store-a", rangeId, "total", null, bound(1, 8));
  api.write(rule, "store-a", rangeId, "target", template.targetType === "dish" ? { productLineId: "kiosk", dishId: "dish:a" } : null, configured(2));
  if (template.blocks.sameDishEnabled) api.write(rule, "store-a", rangeId, "same_dish", null, configured(1));

  const values = rule.storeConfigs["store-a"].periodValues.per_round;
  const scenario = profile.comboRanges.scenarioKey(rangeId);
  assert.deepEqual({ ...values.tableTotalBounds[scenario] }, bound(1, 8));
  const perPerson = template.key.endsWith("|party_size");
  const targetMap = perPerson ? values.targetLimits : values.tableTargetCaps;
  const otherMap = perPerson ? values.tableTargetCaps : values.targetLimits;
  const targetKey = template.targetType === "dish" ? profile.comboRanges.targetKey(rangeId, "kiosk", "dish:a") : scenario;
  assert.deepEqual({ ...targetMap[targetKey] }, configured(2));
  assert.equal(Object.keys(otherMap).length, 0);
  assert.equal(template.blocks.sameDishEnabled ? values.defaultDishLimits[scenario].value : values.defaultDishLimits[scenario], template.blocks.sameDishEnabled ? 1 : undefined);

  const projection = api.project(rule, "store-a", rangeId);
  assert.equal(projection.totalBounds.min, 1);
  assert.equal(projection.totalBounds.max, 8);
  assert.equal(template.targetType === "dish" ? projection.targetLimits[targetKey].value : projection.targetLimits.value, 2);

  let validation = api.validatePublication(rule, ["store-a"]);
  assert.equal(validation.valid, false, "第二个人数区间仍为空，发布必须失败");
  assert.equal(validation.rangeId, rule.partyRanges[1].rangeId);

  const secondId = rule.partyRanges[1].rangeId;
  api.write(rule, "store-a", secondId, "total", null, bound(0, 0));
  api.write(rule, "store-a", secondId, "target", template.targetType === "dish" ? { productLineId: "kiosk", dishId: "dish:a" } : null, configured(0));
  if (template.blocks.sameDishEnabled) api.write(rule, "store-a", secondId, "same_dish", null, configured(0));
  validation = api.validatePublication(rule, ["store-a"]);
  assert.equal(validation.valid, true, `${template.key} 配置完整后应通过`);
}

console.log("verify-buffet-combo-template-editor: OK");
