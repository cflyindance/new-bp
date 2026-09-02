import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const storage = new Map();
const window = {};
const context = { window, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) } };
vm.runInNewContext(fs.readFileSync("dist/Configuration center/assets/buffet-rule-policy.js", "utf8"), context);
vm.runInNewContext(fs.readFileSync("dist/Configuration center/assets/buffet-rule-profile.js", "utf8"), context);

const profile = window.ORDER_LIMIT_MODULE_PROFILE;
const referenced = new Set(profile.defaultScenarios.flatMap(template => Array.from(template.legacyCapabilityIds || [])));
for (let index = 1; index <= 11; index += 1) assert.equal(referenced.has(`KPOS-R${String(index).padStart(2, "0")}`), true);
for (const id of ["KPOS-R12", "KPOS-R13"]) {
  assert.equal(profile.legacyCapabilities[id].level, "group");
  assert.equal(profile.legacyCapabilities[id].coverageStatus, "partial");
  assert.ok(profile.legacyCapabilities[id].gap);
}
assert.equal(profile.defaultScenarios.filter(item => item.group === "order_lifetime").every(item => item.coverageStatus === "not_applicable" && item.legacyCapabilityIds.length === 0), true);
for (const template of profile.defaultScenarios) for (const id of template.legacyCapabilityIds) assert.ok(profile.legacyCapabilities[id], `unknown capability ${id}`);
console.log("verify-buffet-legacy-capability-catalog: OK");
