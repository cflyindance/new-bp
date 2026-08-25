import assert from "node:assert/strict";
import {
  mapKposHourlyRateGroups,
  type KposHourlyRate,
} from "../src/config/kpos-hourly-rate-client";

const groups = new Map<string, KposHourlyRate[]>([
  ["13359", [{
    id: "16",
    from: 0,
    to: 100,
    step: 10,
    price: 5,
    fixPrice: null,
    saleItemId: "13359",
  }]],
  ["2960", [
    {
      id: "7",
      from: 0,
      to: 1,
      step: null,
      price: null,
      fixPrice: 60,
      saleItemId: "2960",
    },
    {
      id: "8",
      from: 1,
      to: null,
      step: 60,
      price: 60,
      fixPrice: null,
      saleItemId: "2960",
    },
  ]],
]);

const result = mapKposHourlyRateGroups(groups, new Map([
  ["13359", "KTV"],
  ["2960", "Legacy KTV"],
]));

assert.equal(result.length, 2);
assert.equal(result[0].id, "13359");
assert.equal(result[0].parseError, undefined);
assert.equal(result[1].id, "2960");
assert.match(result[1].parseError ?? "", /混用|字段/);
assert.deepEqual(result[1].hourlyRateIds, ["7", "8"]);

console.log("verify-kpos-hourly-rate-isolation: OK");
