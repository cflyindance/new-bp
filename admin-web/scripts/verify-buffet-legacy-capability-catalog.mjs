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
const orderIds = Array.from({ length: 14 }, (_, index) => `KPOS-O${String(index + 1).padStart(2, "0")}`);
const evidenceIds = Array.from({ length: 5 }, (_, index) => `KPOS-OV${String(index + 1).padStart(2, "0")}`);
for (const id of [...orderIds, ...evidenceIds]) assert.ok(profile.legacyCapabilities[id], `missing ${id}`);
const orderTemplates = profile.defaultScenarios.filter(item => item.group === "order_lifetime");
assert.deepEqual(Array.from(orderTemplates, item => Array.from(item.legacyCapabilityIds)), [
  ["KPOS-O01", "KPOS-O05", "KPOS-O06"],
  ["KPOS-O02", "KPOS-O05", "KPOS-O07", "KPOS-O08"],
  ["KPOS-O03", "KPOS-O05", "KPOS-O06"],
  ["KPOS-O04", "KPOS-O05", "KPOS-O07", "KPOS-O08"]
]);
assert.equal(profile.legacyCapabilities["KPOS-O08"].coverageStatus, "defined_extension");
assert.equal(profile.legacyCapabilities["KPOS-O08"].legacyEvidenceStatus, "not_legacy");
assert.equal(profile.legacyCapabilities["KPOS-O13"].coverageStatus, "product_redefined");
assert.equal(evidenceIds.every(id => profile.legacyCapabilities[id].legacyEvidenceStatus === "pending_runtime"), true);
const orderGroup = profile.legacyCapabilityGroups.find(item => item.group === "order_lifetime");
assert.deepEqual(Array.from(orderGroup.capabilityIds), orderIds.slice(8));
assert.deepEqual(Array.from(orderGroup.evidenceIds), evidenceIds);
for (let index = 1; index <= 11; index += 1) assert.equal(referenced.has(`KPOS-R${String(index).padStart(2, "0")}`), true);
for (const id of ["KPOS-R12", "KPOS-R13"]) {
  assert.equal(profile.legacyCapabilities[id].level, "group");
  assert.equal(profile.legacyCapabilities[id].coverageStatus, "partial");
  assert.ok(profile.legacyCapabilities[id].gap);
}
for (const template of profile.defaultScenarios) for (const id of template.legacyCapabilityIds) assert.ok(profile.legacyCapabilities[id], `unknown capability ${id}`);
console.log("verify-buffet-legacy-capability-catalog: OK");
