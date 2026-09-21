import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = new Map();
const window = {
  localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) }
};
const context = { window, Date, Math, Number, String, Array, Object, JSON, Set, Error, console };
for (const file of ["buffet-rule-policy.js", "buffet-rule-domain.js", "buffet-rule-profile.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(root, "dist/Configuration center/assets", file), "utf8"), context);
}
const profile = window.ORDER_LIMIT_MODULE_PROFILE;
const rule = { targetType: "dish_set", quotaSchemaVersion: 2 };
assert.equal(profile.requiredCapability(rule), "buffet_dish_set_dual_measure_v1");
assert.equal(profile.canMutateRule(rule, []).code, "UNSUPPORTED_BUFFET_QUOTA_SCHEMA");
assert.equal(profile.canMutateRule(rule, ["buffet_dish_set_dual_measure_v1"]).allowed, true);
assert.equal(profile.requiredCapability({ targetType: "dish", quotaSchemaVersion: 2 }), null);
console.log("buffet dual measure lifecycle verification passed");
