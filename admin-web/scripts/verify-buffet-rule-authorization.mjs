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
const violations = [
  { ruleId: 1, ruleVersion: 3, period: "per_round", target: "kiosk|dish-a", used: 3, allowedScopes: ["operation", "round", "order"] },
  { ruleId: 2, ruleVersion: 5, period: "per_round", target: "kiosk|dish-b", used: 4, allowedScopes: ["operation", "round", "order"] }
];
const credential = {
  storeId: "store-a",
  orderId: "order-a",
  roundNo: 2,
  scope: "round",
  ruleRefs: [
    { id: 1, version: 3, period: "per_round", target: "kiosk|dish-a", approvedQuantity: 3 },
    { id: 2, version: 5, period: "per_round", target: "kiosk|dish-b", approvedQuantity: 4 }
  ],
};

assert.equal(validate(credential, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), true);
assert.equal(validate({ ...credential, ruleRefs: [credential.ruleRefs[0]] }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), false);
assert.equal(validate(credential, violations, { storeId: "store-a", orderId: "order-a", roundNo: null }), false);
assert.equal(validate({ ...credential, ruleRefs: [{ ...credential.ruleRefs[0], version: 4 }, credential.ruleRefs[1]] }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), false);
assert.equal(validate({ ...credential, scope: "operation", operationId: "op-1" }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2, operationId: "op-1" }), true);
assert.equal(validate({ ...credential, scope: "operation", operationId: "op-1" }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2, operationId: "op-2" }), false);
assert.equal(validate({ ...credential, scope: "operation" }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2, operationId: "op-1" }), false, "本次操作授权必须绑定 operationId");
assert.equal(
  validate({ ...credential, ruleRefs: [{ ...credential.ruleRefs[0], period: "order_lifetime", target: "__total__" }] }, [{ ruleId: 1, ruleVersion: 3, period: "order_lifetime", target: "__total__", used: 3, allowedScopes: ["round", "order"] }], { storeId: "store-a", orderId: "order-a", roundNo: 2 }),
  false,
  "整单累计规则不允许使用当前轮授权"
);
assert.equal(validate({ ...credential, scope: "order", ruleRefs: [{ ...credential.ruleRefs[0], period: "order_lifetime", target: "__total__" }] }, [{ ruleId: 1, ruleVersion: 3, period: "order_lifetime", target: "__total__", used: 3, allowedScopes: ["round", "order"] }], { storeId: "store-a", orderId: "order-a", roundNo: 2 }), true);
assert.equal(validate({ ...credential, ruleRefs: [{ ...credential.ruleRefs[0], target: "kiosk|dish-b" }, credential.ruleRefs[1]] }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), false, "不同对象不能复用授权");
assert.equal(validate({ ...credential, ruleRefs: [{ ...credential.ruleRefs[0], approvedQuantity: 2 }, credential.ruleRefs[1]] }, violations, { storeId: "store-a", orderId: "order-a", roundNo: 2 }), false, "超过批准最终数量必须重新授权");
assert.equal(validate({ ...credential, scope: "round" }, [{ ...violations[0], allowedScopes: ["operation"] }], { storeId: "store-a", orderId: "order-a", roundNo: 2 }), false, "规则未显式允许的授权范围不得放行");

console.log("verify-buffet-rule-authorization: OK");
