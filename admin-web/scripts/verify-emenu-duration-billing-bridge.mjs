import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bridgePath = path.join(
  root,
  "vendor/emenu-new/src/services/durationBillingBridge.js",
);
const bridgeSource = fs.readFileSync(bridgePath, "utf8");
const tablesSource = fs.readFileSync(
  path.join(root, "vendor/emenu-new/src/services/tables.js"),
  "utf8",
);
const bridge = await import(
  `data:text/javascript;base64,${Buffer.from(bridgeSource).toString("base64")}`
);

function createStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

const storeId = "store-01";
const enabledRule = {
  id: "rule-enabled",
  name: "包间计价",
  enabled: true,
  scenes: [],
  productBinding: {
    productId: "ktv-product-1",
    productNameSnapshot: "KTV",
    requiredTag: "KTV",
    snapshotUpdatedAt: "2026-08-21T00:00:00.000Z",
  },
  pricing: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true },
};
const disabledRule = { ...enabledRule, id: "rule-disabled", enabled: false };
const storage = createStorage({
  "menusifu-scope-filter-meta": JSON.stringify({ storeId }),
  [bridge.durationBillingRulesStorageKey(storeId)]: JSON.stringify({
    rules: [enabledRule, disabledRule],
  }),
  [bridge.floorPlanStorageKey(storeId)]: JSON.stringify({
    areas: [
      {
        id: 1,
        tables: [
          { id: 10, category: "ktv", defaultSaleItemId: "ktv-product-1", durationBillingRuleId: "rule-enabled" },
          { id: 11, category: "ktv", defaultSaleItemId: "ktv-product-1", durationBillingRuleId: "rule-disabled" },
        ],
      },
    ],
  }),
});

assert.equal(bridge.resolveDurationBillingBridgeStoreId(storage), storeId);
assert.equal(
  bridge.resolveDurationBillingBridgeStoreId(createStorage()),
  "__default__",
);

const sourceAreas = [
  {
    id: 1,
    name: "一楼",
    tables: [
      { id: 10, name: "A10" },
      { id: 11, name: "A11" },
      { id: 12, name: "A12", shape: "KTV", defaultSaleItemId: "ktv-product-1" },
    ],
  },
];
const enrichedAreas = bridge.enrichAreasWithDurationBilling(sourceAreas, storage);
assert.equal(enrichedAreas[0].tables[0].durationBillingRuleId, "rule-enabled");
assert.equal(enrichedAreas[0].tables[0].category, "ktv");
assert.equal(enrichedAreas[0].tables[0].defaultSaleItemId, "ktv-product-1");
assert.deepEqual(enrichedAreas[0].tables[0].durationBillingRule, enabledRule);
assert.equal(enrichedAreas[0].tables[1].durationBillingRuleId, "rule-disabled");
assert.equal(enrichedAreas[0].tables[1].durationBillingRule, null);
assert.equal(enrichedAreas[0].tables[2].durationBillingRuleId, "rule-enabled");
assert.deepEqual(enrichedAreas[0].tables[2].durationBillingRule, enabledRule);
assert.equal(sourceAreas[0].tables[0].durationBillingRuleId, undefined);

const fetched = bridge.enrichTableResponseWithDurationBilling(
  { table: { id: 10, name: "A10" } },
  storage,
  1,
);
assert.equal(fetched.table.durationBillingRuleId, "rule-enabled");
assert.deepEqual(fetched.table.durationBillingRule, enabledRule);

const duplicateTableInOtherArea = bridge.enrichTableResponseWithDurationBilling(
  { table: { id: 10, name: "B10" } },
  storage,
  2,
);
assert.equal(duplicateTableInOtherArea.table.durationBillingRuleId, undefined);

const ambiguousStorage = createStorage({
  "menusifu-scope-filter-meta": JSON.stringify({ storeId }),
  [bridge.durationBillingRulesStorageKey(storeId)]: JSON.stringify({
    rules: [enabledRule, { ...enabledRule, id: "rule-enabled-2" }],
  }),
});
const ambiguousMatch = bridge.enrichTableResponseWithDurationBilling(
  { table: { id: 12, name: "A12", shape: "KTV", defaultSaleItemId: "ktv-product-1" } },
  ambiguousStorage,
  1,
);
assert.equal(ambiguousMatch.table.durationBillingRuleId, undefined);
assert.equal(ambiguousMatch.table.durationBillingRule, undefined);

assert.doesNotMatch(tablesSource, /enrichAreasWithDurationBilling/);
assert.doesNotMatch(tablesSource, /enrichTableResponseWithDurationBilling/);
assert.match(tablesSource, /export function getAreas/);
assert.match(tablesSource, /export function getTables/);
assert.match(tablesSource, /export function fetchTable/);

console.log("verify-emenu-duration-billing-bridge: OK");
