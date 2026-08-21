import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const {
  apportionRevenueByPaymentMethods,
  normalizeSelectedMethods,
  formatPaymentMethodsLabelZh,
  roundMoney,
} = require(path.join(root, "dist/TipOut/paymentMethodApportion.js"));

const tenders = [
  { method: "credit_card", amount: 80 },
  { method: "cash", amount: 20 },
];

assert.equal(apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders, selectedMethods: [] }), 100);
assert.equal(apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders }), 100);

assert.equal(
  apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders, selectedMethods: ["credit_card"] }),
  80,
);

assert.equal(
  apportionRevenueByPaymentMethods({
    revenueAmount: 100,
    tenders,
    selectedMethods: ["credit_card", "cash"],
  }),
  100,
);

assert.equal(
  apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders, selectedMethods: ["gift_card"] }),
  0,
);

assert.equal(
  apportionRevenueByPaymentMethods({ revenueAmount: 100, tenders: [], selectedMethods: ["cash"] }),
  0,
);

assert.equal(
  apportionRevenueByPaymentMethods({
    revenueAmount: 100,
    tenders: [{ method: "cash", amount: 0 }],
    selectedMethods: ["cash"],
  }),
  0,
);

assert.equal(
  apportionRevenueByPaymentMethods({
    revenueAmount: 90,
    tenders: [
      { method: "credit_card", amount: 95 },
      { method: "cash", amount: 20 },
    ],
    selectedMethods: ["credit_card"],
  }),
  roundMoney((90 * 95) / 115),
);

assert.deepEqual(normalizeSelectedMethods(["cash", "cash", "nope"]), ["cash"]);
assert.equal(formatPaymentMethodsLabelZh(["credit_card", "cash"]), "信用卡、现金");
assert.equal(formatPaymentMethodsLabelZh(["alipay", "points"]), "ALIPAY、积分抵扣");
assert.equal(
  formatPaymentMethodsLabelZh(["doordash_d_pay", "uber_eats_d_pay"]),
  "DOORDASH_D-PAY（自定义）、UBER_EATS_D-PAY（自定义）",
);
assert.equal(
  apportionRevenueByPaymentMethods({
    revenueAmount: 100,
    tenders: [
      { method: "wechatpay", amount: 40 },
      { method: "coupon", amount: 60 },
    ],
    selectedMethods: ["wechatpay"],
  }),
  40,
);

console.log("verify-payment-method-apportion: OK");
