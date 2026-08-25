import assert from "node:assert/strict";
import {
  formatRulePricingSummary,
  resolveDurationBillingAmount,
  validateDurationBillingRule,
  type DurationBillingRatesPricing,
} from "../src/config/duration-billing-rules-store";
import { mapKposHourlyRateGroups } from "../src/config/kpos-hourly-rate-client";

const pricing: DurationBillingRatesPricing = {
  type: "rates",
  rates: [
    { fromMinutes: 0, toMinutes: 200, charge: { type: "fixed", amount: 100 } },
    { fromMinutes: 200, toMinutes: 300, charge: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true } },
    { fromMinutes: 300, toMinutes: null, charge: { type: "unit", amount: 10, unitMinutes: 60, roundUp: true } },
  ],
};

for (const [minutes, expected] of [[0, 0], [1, 100], [199, 100], [200, 100], [201, 105], [250, 110], [300, 120], [301, 130]] as const) {
  assert.equal(resolveDurationBillingAmount(pricing, minutes), expected, `${minutes} 分钟`);
}
assert.equal(resolveDurationBillingAmount(pricing, -1), null);
assert.equal(resolveDurationBillingAmount(pricing, Number.NaN), null);

const validation = validateDurationBillingRule({
  name: "KTV",
  enabled: true,
  pricing,
  productBinding: {
    productId: "13359",
    productNameSnapshot: "KTV",
    requiredTag: "KTV",
    snapshotUpdatedAt: new Date().toISOString(),
  },
});
assert.equal(validation.ok, true);
if (!validation.ok) throw new Error(validation.message);

const invalid = validateDurationBillingRule({
  name: "KTV",
  enabled: true,
  pricing: {
    type: "rates",
    rates: [
      { fromMinutes: 0, toMinutes: 200, charge: { type: "fixed", amount: 100 } },
      { fromMinutes: 201, toMinutes: null, charge: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true } },
    ],
  },
  productBinding: {
    productId: "13359",
    productNameSnapshot: "KTV",
    requiredTag: "KTV",
    snapshotUpdatedAt: new Date().toISOString(),
  },
});
assert.equal(invalid.ok, false);

assert.match(formatRulePricingSummary({ ...validation.value, id: "13359", createdAt: "", updatedAt: "" }), /固定 ¥100/);

const mapped = mapKposHourlyRateGroups(new Map([
  ["13359", [
    { id: "3", saleItemId: "13359", from: 300, to: null, price: 10, step: 60, fixPrice: null },
    { id: "1", saleItemId: "13359", from: 0, to: 200, price: null, step: null, fixPrice: 100 },
    { id: "2", saleItemId: "13359", from: 200, to: 300, price: 5, step: 30, fixPrice: null },
  ]],
  ["bad", [
    { id: "bad-1", saleItemId: "bad", from: 10, to: null, price: 5, step: 30, fixPrice: null },
  ]],
]), new Map([["13359", "KTV"], ["bad", "Bad"]]));
assert.equal(mapped[0].pricing.type, "rates");
assert.deepEqual(mapped[0].pricing.type === "rates" ? mapped[0].pricing.rates.map((rate) => rate.fromMinutes) : [], [0, 200, 300]);
assert.equal("parseError" in mapped[0], false);
assert.equal("parseError" in mapped[1], true);
console.log("KPOS mixed HourlyRate pricing verification passed");
