import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-domain.js"), "utf8");
const window = {};
vm.runInNewContext(source, { window, Date, Math, Number, String, Array, JSON, Error });
const domain = window.BuffetRuleDomain;

const mouths = ["order_lifetime", "party_order_lifetime", "party_per_round", "party_multi_round"];
const expected = [
  [true, false, false, false],
  [false, true, false, false],
  [false, false, true, true],
  [false, false, true, true],
];
mouths.forEach((left, i) => mouths.forEach((right, j) => assert.equal(domain.mouthsConflict(left, right), expected[i][j])));

const monday = { effectiveFrom: "2026-08-01", effectiveTo: "2026-09-30", activityCycle: "weekly", daysOfWeek: ["mon"], businessHourSlots: [{ mode: "custom", from: "17:00", to: "23:00" }], memberMode: "all" };
const tuesday = { ...monday, daysOfWeek: ["tue"] };
const mondayDinner = { ...monday, businessHourSlots: [{ mode: "custom", from: "20:00", to: "02:00" }] };
assert.equal(domain.conditionsOverlap(monday, tuesday), false);
assert.equal(domain.conditionsOverlap(monday, mondayDinner), true);

function draft(period = "per_round") {
  return {
    subject: "party_size",
    period,
    targetType: "dish",
    conditions: monday,
    deployStoreIds: ["store-a"],
    storeConfigs: { "store-a": { productLines: ["kiosk"], targetIds: ["dish:1"] } },
  };
}

const conflict = domain.findConflict(draft("multi_round"), [{ id: 7, status: "active", authoringConfig: draft("per_round") }], []);
assert.equal(conflict.ruleId, 7);
assert.equal(domain.findConflict(draft("order_lifetime"), [{ id: 7, status: "active", authoringConfig: draft("per_round") }], []), null);
assert.equal(domain.findConflict(draft("multi_round"), [{ id: 7, status: "disabled", authoringConfig: draft("per_round") }], []), null);
assert.equal(domain.findConflict(draft("multi_round"), [{ id: 7, status: "active", authoringConfig: draft("per_round") }], [7]), null);

console.log("verify-buffet-rule-conflicts: OK");
