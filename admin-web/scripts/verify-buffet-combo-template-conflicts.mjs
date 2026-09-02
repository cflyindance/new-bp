import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = {};
for (const file of ["buffet-rule-policy.js", "buffet-rule-domain.js"]) vm.runInNewContext(fs.readFileSync(path.join(root, "dist/Configuration center/assets", file), "utf8"), { window, Date, Math, Number, String, Array, Object, JSON, Set, Error });
const domain = window.BuffetRuleDomain;
const cell = (value) => ({ configured: true, value });
const bounds = (min, max) => ({ minConfigured: true, min, maxConfigured: true, max });
const conditions = { effectiveFrom: "2026-01-01", effectiveTo: "", activityCycle: "daily", businessHourSlots: [], memberMode: "all" };
const scenario = "party:pr_a|round:0";

function rule({ id, type = "dish_set", unit = "piece", perPerson = false, same = false, dish = "a", total = true } = {}) {
  const values = { totalBounds: {}, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {}, defaultDishLimits: {}, exceptionDishLimits: {} };
  if (total) values.tableTotalBounds[scenario] = bounds(1, 8);
  const targetKey = type === "dish" ? `${scenario}|line:kiosk|target:${dish}` : scenario;
  values[perPerson ? "targetLimits" : "tableTargetCaps"][targetKey] = cell(2);
  if (same) values.defaultDishLimits[scenario] = cell(1);
  return {
    id, version: 1, schemaVersion: 4, subject: "party_size", targetType: type, measureUnit: unit,
    defaultScenarioKey: `combo|per_round|${type}${type === "dish_set" ? `|${unit}` : ""}|${perPerson ? "party_size" : "table"}`,
    enabledPeriods: ["per_round"], periodPolicies: { per_round: { blocks: { totalEnabled: total, targetEnabled: true, sameDishEnabled: same } } },
    partyRanges: [{ rangeId: "pr_a", min: 1, max: null }], deployStoreIds: ["s"], conditions,
    storeConfigs: { s: { dishTargets: type === "dish" ? [{ productLineId: "kiosk", dishId: dish }] : [], dishSetMembers: type === "dish_set" ? [{ productLineId: "kiosk", dishId: dish }, { productLineId: "emenu", dishId: "b" }] : [], periodValues: { per_round: values } } },
  };
}
const active = (config) => ({ id: config.id, status: "active", publishedConfig: config });

const c02 = rule({ id: "c02", unit: "piece", same: true });
const c03 = rule({ id: "c03", unit: "kind", same: true });
let conflicts = domain.findConflicts(c02, [active(c03)], []);
assert.deepEqual(Array.from(new Set(conflicts.map((item) => item.block))).sort(), ["same_dish", "total"]);

const fixedNoTotal = rule({ id: "fixed", type: "dish", total: false, perPerson: false });
const personNoTotal = rule({ id: "person", type: "dish", total: false, perPerson: true });
assert.equal(domain.findConflicts(fixedNoTotal, [active(personNoTotal)], []).length, 0, "固定 X 与人均 X 父额度兼容");

const disjoint = rule({ id: "disjoint", type: "dish", total: false, dish: "z" });
assert.equal(domain.findConflicts(fixedNoTotal, [active(disjoint)], []).length, 0, "商品范围不相交不冲突");

const totalOnly = rule({ id: "total", type: "dish", dish: "z", total: true });
conflicts = domain.findConflicts(c02, [active(totalOnly)], []);
assert.equal(conflicts.some((item) => item.block === "total"), true, "总量冲突与商品范围无关");

console.log("verify-buffet-combo-template-conflicts: OK");
