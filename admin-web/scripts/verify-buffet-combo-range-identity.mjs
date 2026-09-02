import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policySource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"), "utf8");
const profileSource = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-profile.js"), "utf8");
const context = {
  window: {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
};
vm.runInNewContext(policySource, context);
vm.runInNewContext(profileSource, context);
const api = context.window.ORDER_LIMIT_MODULE_PROFILE.comboRanges;

assert.equal(api.scenarioKey("pr_a"), "party:pr_a|round:0");
assert.equal(api.targetKey("pr_a", "kiosk", "dish:1"), "party:pr_a|round:0|line:kiosk|target:dish:1");
assert.equal(api.keyMode({ partyRanges: [{ rangeId: "pr_a", min: 1, max: null }] }), "range_id");
assert.equal(api.keyMode({ partyRanges: [{ min: 1, max: null }] }), "legacy_index");

const ranges = [{ rangeId: "pr_a", min: 1, max: 3 }, { rangeId: "pr_b", min: 4, max: null }];
assert.deepEqual(JSON.parse(JSON.stringify(api.validateRanges(ranges))), { valid: true, code: "" });
assert.equal(api.validateRanges([{ rangeId: "pr_a", min: 1, max: 3 }, { rangeId: "pr_a", min: 4, max: null }]).code, "DUPLICATE_RANGE_ID");
assert.equal(api.validateRanges([{ rangeId: "pr_a", min: 1, max: 3 }, { rangeId: "", min: 4, max: null }]).code, "MISSING_RANGE_ID");

const values = {
  tableTotalBounds: { "party:pr_a|round:0": { minConfigured: true, min: 1 }, "party:gone|round:0": { minConfigured: true, min: 9 } },
  tableTargetCaps: { "party:pr_a|round:0|line:kiosk|target:dish:1": { configured: true, value: 2 } },
  targetLimits: {}, defaultDishLimits: { "party:gone|round:0": { configured: true, value: 1 } },
  totalBounds: {}, exceptionDishLimits: {},
};
const cleaned = api.removeOrphanKeys(values, ranges);
assert.deepEqual(Object.keys(cleaned.tableTotalBounds), ["party:pr_a|round:0"]);
assert.deepEqual(Object.keys(cleaned.defaultDishLimits), []);
assert.deepEqual(Object.keys(cleaned.tableTargetCaps), ["party:pr_a|round:0|line:kiosk|target:dish:1"]);

assert.equal(api.detectStoredKeyMode({ targetLimits: {
  "party:pr_a|round:0": { configured: true, value: 1 },
  "0|0|kiosk|dish:1": { configured: true, value: 1 },
} }), "mixed");
assert.equal(api.detectStoredKeyMode({ targetLimits: { "0|0|kiosk|dish:1": { configured: true, value: 1 } } }), "legacy_index");
assert.equal(api.detectStoredKeyMode({ targetLimits: { "party:pr_a|round:0": { configured: true, value: 1 } } }), "range_id");

console.log("verify-buffet-combo-range-identity: OK");
