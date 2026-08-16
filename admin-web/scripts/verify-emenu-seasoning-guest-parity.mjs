import assert from "node:assert/strict";
import {
  buildTerminalSeasoningGroups as jsGroups,
  selectTerminalSeasoning as jsSelect,
  buildOrderSeasoningSnapshots as jsSnapshots,
  productHasGuestSeasoningDetail as jsHas,
} from "../vendor/emenu-new/src/utils/seasoningGuest.js";

const product = { id: "p1", status: "active", emenuSellable: true };
const options = [
  { id: "o1", code: "CHILI", name: "辣椒", status: "active", sortOrder: 10 },
  { id: "o2", code: "SALT", name: "盐", status: "active", sortOrder: 20 },
];
const relations = [
  { productId: "p1", action: "ADD", optionId: "o1", priceDelta: 1, sortOrder: 10, status: "active" },
  { productId: "p1", action: "LESS", optionId: "o1", priceDelta: 0, sortOrder: 10, status: "active" },
];

assert.equal(jsHas({ product, options, relations }), true);
assert.equal(jsHas({ product: { ...product, status: "inactive" }, options, relations }), false);

const groups = jsGroups({ product, options, relations });
assert.equal(groups.some((g) => g.action === "ADD"), true);
let selections = jsSelect([], groups.find((g) => g.action === "ADD").choices[0]);
selections = jsSelect(selections, groups.find((g) => g.action === "LESS").choices[0]);
assert.equal(selections.length, 1);
assert.equal(selections[0].action, "LESS");
const snaps = jsSnapshots(selections, groups);
assert.equal(snaps[0].optionCode, "CHILI");
assert.equal(snaps[0].transactionPrice, 0);
assert.deepEqual(jsSnapshots([], groups), []);
console.log("eMenu seasoning guest parity verification passed");
