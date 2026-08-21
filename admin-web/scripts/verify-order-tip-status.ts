import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { hasPaidTip, matchOrderTipStatus, filterOrdersByTipStatus } = require(
  path.join(root, "dist/TipOut/orderTipStatus.js"),
);

assert.equal(hasPaidTip({ cardTip: 1, cashTip: 0 }), true);
assert.equal(hasPaidTip({ cardTip: 0, cashTip: 2 }), true);
assert.equal(hasPaidTip({ cardTip: 0, cashTip: 0, serviceCharge: 10 }), false);
assert.equal(hasPaidTip({}), false);

assert.equal(matchOrderTipStatus({ cardTip: 1 }, undefined), true);
assert.equal(matchOrderTipStatus({ cardTip: 0, cashTip: 0 }, "has_tip"), false);
assert.equal(matchOrderTipStatus({ cardTip: 1 }, "has_tip"), true);
assert.equal(matchOrderTipStatus({ cardTip: 0, cashTip: 0 }, "no_tip"), true);
assert.equal(matchOrderTipStatus({ cashTip: 3 }, "no_tip"), false);
assert.equal(matchOrderTipStatus({ cardTip: 1 }, "weird"), true);

const orders = [
  { id: "a", cardTip: 5, cashTip: 0, amount: 100 },
  { id: "b", cardTip: 0, cashTip: 0, amount: 200 },
  { id: "c", cardTip: 0, cashTip: 1, amount: 50 },
];
assert.deepEqual(
  filterOrdersByTipStatus(orders, "has_tip").map((o: { id: string }) => o.id),
  ["a", "c"],
);
assert.deepEqual(
  filterOrdersByTipStatus(orders, "no_tip").map((o: { id: string }) => o.id),
  ["b"],
);
assert.equal(filterOrdersByTipStatus(orders, "").length, 3);

const tipped = filterOrdersByTipStatus(orders, "has_tip");
const base = tipped.reduce((s: number, o: { amount: number }) => s + o.amount, 0);
assert.equal(base, 150);
assert.equal(Number((base * 0.025).toFixed(2)), 3.75);

console.log("verify-order-tip-status: OK");
