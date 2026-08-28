import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-domain.js"), "utf8");
const window = {};
vm.runInNewContext(source, { window, Date, Math, Number, String, Array, JSON, Error });
const validate = window.BuffetRuleDomain.validateAuthorizationCredential;
const violations = [{ ruleId: 1, ruleVersion: 3 }, { ruleId: 2, ruleVersion: 5 }];
const credential = {
  storeId: "store-a",
  orderId: "order-a",
  roundNo: 2,
  scope: "round",
  ruleRefs: [{ id: 1, version: 3 }, { id: 2, version: 5 }],
};

assert.equal(validate(credential, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), true);
assert.equal(validate({ ...credential, ruleRefs: [{ id: 1, version: 3 }] }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), false);
assert.equal(validate(credential, violations, { storeId: "store-a", orderId: "order-a", roundNo: null }), false);
assert.equal(validate({ ...credential, ruleRefs: [{ id: 1, version: 4 }, { id: 2, version: 5 }] }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), false);

console.log("verify-buffet-rule-authorization: OK");
