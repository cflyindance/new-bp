import assert from "node:assert/strict";
import fs from "node:fs";

const utilityPath = new URL("../vendor/emenu-new/src/utils/durationBilling.js", import.meta.url);
const hookPath = new URL("../vendor/emenu-new/src/hooks/useDurationBilling.js", import.meta.url);
const utilitySource = fs.readFileSync(utilityPath, "utf8");
const hookSource = fs.readFileSync(hookPath, "utf8");
const storageSource = fs.readFileSync(
  new URL("../vendor/emenu-new/src/utils/storage.js", import.meta.url),
  "utf8",
);
const localStorageHookSource = fs.readFileSync(
  new URL("../vendor/emenu-new/src/hooks/useLocalStorage.js", import.meta.url),
  "utf8",
);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(utilitySource).toString("base64")}`;
const billing = await import(moduleUrl);

const unitRule = {
  id: "unit-1",
  enabled: true,
  pricing: { type: "unit", amount: 10, unitMinutes: 30, roundUp: true },
};
assert.equal(billing.calcUnitPricingFee(unitRule, 0, 1), 10);
assert.equal(billing.calcUnitPricingFee(unitRule, 0, 30 * 60 * 1000), 10);

const mixedRateRule = {
  id: "mixed-rates",
  enabled: true,
  pricing: {
    type: "rates",
    rates: [
      { fromMinutes: 0, toMinutes: 200, charge: { type: "fixed", amount: 100 } },
      { fromMinutes: 200, toMinutes: 300, charge: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true } },
      { fromMinutes: 300, toMinutes: null, charge: { type: "unit", amount: 10, unitMinutes: 60, roundUp: true } },
    ],
  },
};
for (const [minutes, expected] of [[0, 0], [1, 100], [199, 100], [200, 100], [201, 105], [250, 110], [300, 120], [301, 130]]) {
  assert.equal(billing.calcRatesPricingFee(mixedRateRule, 0, minutes * 60 * 1000), expected);
  assert.equal(billing.calcDurationBillingFee(mixedRateRule, 0, minutes * 60 * 1000), expected);
}
assert.equal(billing.calcUnitPricingFee(unitRule, 0, 30 * 60 * 1000 + 1), 20);
assert.equal(billing.calcUnitPricingFee(unitRule, 10, 0), null);

const proratedRule = {
  ...unitRule,
  pricing: { ...unitRule.pricing, roundUp: false },
};
assert.equal(billing.calcUnitPricingFee(proratedRule, 0, 15 * 60 * 1000), 5);

const intervalRule = {
  id: "interval-1",
  enabled: true,
  productBinding: {
    productId: "ktv-1",
    productNameSnapshot: "KTV",
    requiredTag: "KTV",
    snapshotUpdatedAt: "2026-08-21T00:00:00.000Z",
  },
  pricing: {
    type: "interval",
    intervals: [
      { endMinutes: 30, amount: 10 },
      { endMinutes: 60, amount: 18 },
      { endMinutes: null, amount: 25 },
    ],
  },
};
assert.equal(billing.calcIntervalPricingFee(intervalRule, 0, 30 * 60 * 1000), 10);
assert.equal(billing.calcIntervalPricingFee(intervalRule, 0, 30 * 60 * 1000 + 1), 18);
assert.equal(billing.calcIntervalPricingFee(intervalRule, 0, 61 * 60 * 1000), 25);
assert.equal(billing.isKtvDurationBillingTable({ category: "ktv" }), true);
assert.equal(billing.isKtvDurationBillingTable({ shape: "KTV" }), true);
assert.equal(billing.isKtvDurationBillingTable({ kposShape: "KTV" }), true);
assert.equal(billing.isKtvDurationBillingTable({ shape: "RECTANGLE" }), false);

const originalTableInfo = {
  currentOrder: {
    id: 7,
    emenuKioskextendedInfo: JSON.stringify({ menuClassify: "dinner" }),
  },
};
const session = billing.createDurationBillingSession(intervalRule, {
  sessionId: "session-1",
  orderId: 7,
  orderItemId: 9,
  idempotencyKey: "start-1",
}, 1234);
intervalRule.pricing.intervals[0].amount = 999;
assert.equal(session.ruleSnapshot.pricing.intervals[0].amount, 10);
assert.equal(session.productSnapshot.productId, "ktv-1");
assert.equal(session.orderItemId, 9);
const nextTableInfo = billing.withDurationBillingSession(originalTableInfo, session);
const extendedInfo = JSON.parse(nextTableInfo.currentOrder.emenuKioskextendedInfo);
assert.equal(extendedInfo.menuClassify, "dinner");
assert.deepEqual(extendedInfo.durationBilling, session);
assert.deepEqual(billing.readDurationBillingSession(nextTableInfo), session);
assert.equal(
  billing.readCurrentDurationBillingSession({
    ...nextTableInfo,
    currentOrder: {
      emenuKioskextendedInfo: nextTableInfo.currentOrder.emenuKioskextendedInfo,
    },
  }),
  null,
);
assert.equal(
  billing.readCurrentDurationBillingSession({
    ...nextTableInfo,
    currentOrder: {
      id: 8,
      emenuKioskextendedInfo: nextTableInfo.currentOrder.emenuKioskextendedInfo,
    },
  }),
  null,
);
assert.deepEqual(billing.readCurrentDurationBillingSession(nextTableInfo), session);
assert.equal(originalTableInfo.currentOrder.emenuKioskextendedInfo.includes("durationBilling"), false);

const refreshedOrder = billing.mergeDurationBillingSessionIntoOrder(
  nextTableInfo.currentOrder,
  {
    id: 7,
    emenuKioskextendedInfo: JSON.stringify({ menuClassify: "dinner", serverValue: true }),
  },
);
const refreshedExtra = JSON.parse(refreshedOrder.emenuKioskextendedInfo);
assert.deepEqual(refreshedExtra.durationBilling, session);
assert.equal(refreshedExtra.serverValue, true);
assert.equal(
  billing.mergeDurationBillingSessionIntoOrder(nextTableInfo.currentOrder, { id: 8 })
    .emenuKioskextendedInfo,
  undefined,
);
const serverSession = { ...session, id: "server-session" };
const serverOrder = {
  id: 7,
  emenuKioskextendedInfo: JSON.stringify({ durationBilling: serverSession }),
};
assert.deepEqual(
  billing.readDurationBillingSession({
    currentOrder: billing.mergeDurationBillingSessionIntoOrder(
      nextTableInfo.currentOrder,
      serverOrder,
    ),
  }),
  serverSession,
);

assert.match(hookSource, /ESTIMATE_REFRESH_MS = 30 \* 1000/);
assert.match(hookSource, /startTiming/);
assert.match(hookSource, /endTiming/);
assert.match(hookSource, /withDurationBillingSession/);
assert.match(hookSource, /readCurrentDurationBillingSession/);
assert.match(hookSource, /addEventListener\('emenu_table_changed'/);
assert.match(storageSource, /key === 'emenu_table'[\s\S]*?emenu_table_changed/);
assert.match(localStorageHookSource, /key === 'emenu_table'[\s\S]*?emenu_table_changed/);
assert.match(
  hookSource,
  /persistSession\(next,\s*result\?\.order\)/,
  "开单成功后必须将返回订单和计时会话一起设为当前订单",
);

console.log("verify-emenu-duration-billing-session: OK");
