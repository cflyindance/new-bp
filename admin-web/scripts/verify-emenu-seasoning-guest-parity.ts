import assert from "node:assert/strict";
import {
  buildOrderSeasoningSnapshots as tsSnapshots,
  buildTerminalSeasoningGroups as tsGroups,
  productHasGuestSeasoningDetail as tsHas,
  selectTerminalSeasoning as tsSelect,
  type TerminalSeasoningChoice,
} from "../src/emenu-local/seasoning/seasoning-terminal-rules";
import type {
  OrderSeasoningSelection,
  ProductSeasoningRelation,
  SeasoningOption,
  SeasoningProduct,
} from "../src/emenu-local/seasoning/seasoning-types";
import * as seasoningGuestNs from "../vendor/emenu-new/src/utils/seasoningGuest.js";

type GuestApi = {
  productHasGuestSeasoningDetail: typeof tsHas;
  buildTerminalSeasoningGroups: typeof tsGroups;
  selectTerminalSeasoning: typeof tsSelect;
  buildOrderSeasoningSnapshots: typeof tsSnapshots;
};

function resolveGuestApi(mod: object): GuestApi {
  if ("buildTerminalSeasoningGroups" in mod && typeof (mod as GuestApi).buildTerminalSeasoningGroups === "function") {
    return mod as GuestApi;
  }
  const nested = (mod as { default?: unknown }).default;
  if (nested && typeof nested === "object" && "buildTerminalSeasoningGroups" in nested) {
    return nested as GuestApi;
  }
  throw new Error("Unable to resolve seasoningGuest.js exports under tsx");
}

const {
  buildOrderSeasoningSnapshots: jsSnapshots,
  buildTerminalSeasoningGroups: jsGroups,
  productHasGuestSeasoningDetail: jsHas,
  selectTerminalSeasoning: jsSelect,
} = resolveGuestApi(seasoningGuestNs);

const product: SeasoningProduct = {
  id: "p1",
  code: "P1",
  name: "Dish",
  categoryId: "c1",
  categoryName: "Cat",
  status: "active",
  emenuSellable: true,
  sortOrder: 1,
};
const inactiveProduct: SeasoningProduct = { ...product, status: "inactive" };
const options: SeasoningOption[] = [
  {
    id: "o1",
    code: "CHILI",
    name: "辣椒",
    categoryId: "oc1",
    status: "active",
    sortOrder: 10,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "o2",
    code: "SALT",
    name: "盐",
    categoryId: "oc1",
    status: "active",
    sortOrder: 20,
    createdAt: "",
    updatedAt: "",
  },
];
const relations: ProductSeasoningRelation[] = [
  {
    id: "r1",
    productId: "p1",
    action: "ADD",
    optionId: "o1",
    priceDelta: 1,
    sortOrder: 10,
    status: "active",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "r2",
    productId: "p1",
    action: "LESS",
    optionId: "o1",
    priceDelta: 0,
    sortOrder: 10,
    status: "active",
    createdAt: "",
    updatedAt: "",
  },
];

const activeInput = { product, options, relations };
const inactiveInput = { product: inactiveProduct, options, relations };

assert.deepEqual(jsHas(activeInput), tsHas(activeInput));
assert.equal(jsHas(activeInput), true);
assert.deepEqual(jsHas(inactiveInput), tsHas(inactiveInput));
assert.equal(jsHas(inactiveInput), false);

const jsBuiltGroups = jsGroups(activeInput);
const tsBuiltGroups = tsGroups(activeInput);
assert.deepEqual(jsBuiltGroups, tsBuiltGroups);

const jsAddChoice = jsBuiltGroups.find((g) => g.action === "ADD")!.choices[0] as TerminalSeasoningChoice;
const tsAddChoice = tsBuiltGroups.find((g) => g.action === "ADD")!.choices[0];
const jsLessChoice = jsBuiltGroups.find((g) => g.action === "LESS")!.choices[0] as TerminalSeasoningChoice;
const tsLessChoice = tsBuiltGroups.find((g) => g.action === "LESS")!.choices[0];

let jsSelections = jsSelect([], jsAddChoice) as OrderSeasoningSelection[];
let tsSelections = tsSelect([], tsAddChoice);
assert.deepEqual(jsSelections, tsSelections);

jsSelections = jsSelect(jsSelections, jsLessChoice) as OrderSeasoningSelection[];
tsSelections = tsSelect(tsSelections, tsLessChoice);
assert.deepEqual(jsSelections, tsSelections);
assert.equal(jsSelections.length, 1);
assert.equal(jsSelections[0].action, "LESS");

const jsSnaps = jsSnapshots(jsSelections, jsBuiltGroups);
const tsSnaps = tsSnapshots(tsSelections, tsBuiltGroups);
assert.deepEqual(jsSnaps, tsSnaps);
assert.equal(jsSnaps[0].optionCode, "CHILI");
assert.equal(jsSnaps[0].transactionPrice, 0);

assert.deepEqual(jsSnapshots([], jsBuiltGroups), tsSnapshots([], tsBuiltGroups));
assert.deepEqual(jsSnapshots([], jsBuiltGroups), []);

console.log("eMenu seasoning guest parity verification passed");
