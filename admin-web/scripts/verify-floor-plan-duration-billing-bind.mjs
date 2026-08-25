import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const floorPlanSource = fs.readFileSync(
  path.join(root, "src/config/floor-plan-ui.ts"),
  "utf8",
);
const storeSource = fs.readFileSync(
  path.join(root, "src/config/duration-billing-rules-store.ts"),
  "utf8",
);

const failures = [];
let checkCount = 0;

function check(name, fn) {
  checkCount += 1;
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${name}: ${message}`);
  }
}

check("FloorPlanTable includes durationBillingRuleId", () => {
  assert.match(floorPlanSource, /durationBillingRuleId\?: string \| null/);
});

check("table form field for duration billing rule", () => {
  assert.match(floorPlanSource, /data-floor-plan-field="durationBillingRuleId"/);
});

check("canvas badge class floor-plan-table--duration-billing", () => {
  assert.match(floorPlanSource, /floor-plan-table--duration-billing/);
});

check("canShowDurationBillingRuleField exported", () => {
  assert.match(floorPlanSource, /export function canShowDurationBillingRuleField/);
  assert.match(floorPlanSource, /category !== "ktv"/);
  assert.match(floorPlanSource, /FloorPlanTableCategory = [^;]+\| "ktv"/);
  assert.doesNotMatch(floorPlanSource, /DURATION_BILLING_SEQ/);
  assert.doesNotMatch(floorPlanSource, /readModuleSettingToggleOn\(443\)/);
});

check("readFormTable uses KPOS defaultSaleItemId instead of local rule id", () => {
  assert.match(floorPlanSource, /defaultSaleItemId:/);
  assert.match(floorPlanSource, /durationBillingRuleId: string \| null = null/);
});

check("collection adapter tracks durationBillingRuleId", () => {
  assert.match(floorPlanSource, /key: "durationBillingRuleId"/);
});

check("countTableBindings scans floor plan storage", () => {
  assert.match(storeSource, /export function countTableBindings/);
  assert.match(storeSource, /durationBillingRuleId === ruleId/);
});

check("rule editor and KTV room share the same host POS source", () => {
  const ruleUiSource = fs.readFileSync(
    path.join(root, "src/config/duration-billing-rules-ui.ts"),
    "utf8",
  );
  const kposClientSource = fs.readFileSync(
    path.join(root, "src/config/kpos-floor-plan-client.ts"),
    "utf8",
  );
  assert.match(ruleUiSource, /loadKposKtvSaleItems\(\)/);
  assert.match(floorPlanSource, /loadKposKtvSaleItems\(\)/);
  assert.match(kposClientSource, /FindSaleItemsType/);
  assert.match(kposClientSource, /tag\("onlyKTVItem", true\)/);
  assert.match(kposClientSource, /ktvSaleItemsPromiseByConnection/);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checkCount} checks passed.`);
