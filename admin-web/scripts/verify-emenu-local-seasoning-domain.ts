import {
  SEASONING_ACTIONS,
  buildRelationKey,
  expandBatchCandidates,
  normalizePriceDelta,
  replaceSeasoningSelection,
  type ProductSeasoningRelation,
} from "../src/emenu-local/seasoning/seasoning-domain";
import {
  buildTerminalSeasoningGroups,
  createOrderSeasoningSnapshot,
} from "../src/emenu-local/seasoning/seasoning-terminal-rules";
import {
  calculateActualMarkupPrice,
  createBatchOptionPricing,
  generateMarkupCoefficient,
  updateBatchInputPrice,
} from "../src/emenu-local/seasoning/seasoning-batch-pricing";
import { previewPageItems } from "../src/emenu-local/seasoning/seasoning-preview-pagination";
import {
  assignSeasoningSortOrders,
  encodeSeasoningSortOrder,
  isEncodedSeasoningOrder,
  moveOrderedItem,
  seasoningActionOrder,
  sortSeasoningProductRelations,
} from "../src/emenu-local/seasoning/seasoning-relation-order";
import {
  createProductConfigurationDraft,
  moveDraftAction,
  moveDraftOption,
} from "../src/emenu-local/seasoning/seasoning-configuration-workspace-ui";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(SEASONING_ACTIONS.map((item) => item.code).join(",") === "ADD,LESS,MORE,NONE", "Action order must be fixed");
assert(buildRelationKey("p1", "MORE", "o1") === "p1::MORE::o1", "Relation key is unstable");
assert(normalizePriceDelta(1.005) === 1.01, "Money must round to two decimals");

let rejectedNegative = false;
try {
  normalizePriceDelta(-0.01);
} catch {
  rejectedNegative = true;
}
assert(rejectedNegative, "Negative price delta must be rejected");

assert(generateMarkupCoefficient(() => 0) === 0.5, "Coefficient must start at 0.50");
assert(generateMarkupCoefficient(() => 0.5) === 1.25, "Coefficient must be distributed across the configured range");
assert(generateMarkupCoefficient(() => 1) === 2, "Coefficient must not exceed 2.00");
assert(calculateActualMarkupPrice(10, 1.25) === 12.5, "Actual markup price must multiply input price by coefficient");
assert(calculateActualMarkupPrice(1.01, 1.5) === 1.52, "Actual markup price must round to cents");
assert(calculateActualMarkupPrice(0.05, 0.5) === 0.03, "Half-cent products must round once using integer pricing");
let rejectedUnsafePricing = false;
try {
  calculateActualMarkupPrice(90071992547409.91, 2);
} catch {
  rejectedUnsafePricing = true;
}
assert(rejectedUnsafePricing, "Unsafe pricing products must be rejected by the client contract");
assert(previewPageItems(1, 20).map((item) => item ?? "…").join(" ") === "1 2 3 … 20", "First-page pagination range is incorrect");
assert(previewPageItems(2, 20).map((item) => item ?? "…").join(" ") === "1 2 3 4 … 20", "Near-start pagination range is incorrect");
assert(previewPageItems(10, 20).map((item) => item ?? "…").join(" ") === "1 … 8 9 10 11 12 … 20", "Middle pagination range is incorrect");
assert(previewPageItems(19, 20).map((item) => item ?? "…").join(" ") === "1 … 17 18 19 20", "Near-end pagination range is incorrect");
assert(previewPageItems(20, 20).map((item) => item ?? "…").join(" ") === "1 … 18 19 20", "Last-page pagination range is incorrect");

const pricing = createBatchOptionPricing(() => 0.5);
assert(pricing.markupCoefficient === 1.25, "Pricing draft must retain its generated coefficient");
assert(updateBatchInputPrice(pricing, 33).inputPrice === 33, "Every pricing draft must accept price input");

const existing: ProductSeasoningRelation[] = [
  { id: "r1", productId: "p1", action: "ADD", optionId: "o1", priceDelta: 1, sortOrder: 10, status: "active", createdAt: "", updatedAt: "" },
  { id: "r2", productId: "p1", action: "ADD", optionId: "o2", priceDelta: 0, sortOrder: 20, status: "inactive", createdAt: "", updatedAt: "" },
];

const encodedRelations: ProductSeasoningRelation[] = [
  { ...existing[0], id: "r-more-1", action: "MORE", optionId: "o3", sortOrder: encodeSeasoningSortOrder(0, 0) },
  { ...existing[0], id: "r-more-2", action: "MORE", optionId: "o1", sortOrder: encodeSeasoningSortOrder(0, 1) },
  { ...existing[0], id: "r-add-1", action: "ADD", optionId: "o2", sortOrder: encodeSeasoningSortOrder(1, 0), priceDelta: 2, status: "inactive" },
];
assert(isEncodedSeasoningOrder(encodedRelations), "Encoded relation orders must be recognized");
assert(seasoningActionOrder(encodedRelations).join(",") === "MORE,ADD", "Encoded action order must override the legacy fixed order");
assert(sortSeasoningProductRelations(encodedRelations).map((item) => item.optionId).join(",") === "o3,o1,o2", "Encoded option order must be preserved inside each action");
assert(!isEncodedSeasoningOrder([{ ...encodedRelations[0], sortOrder: 10 }, encodedRelations[1]]), "Partially encoded product data must fall back as one legacy set");
assert(seasoningActionOrder([{ ...encodedRelations[0], sortOrder: 10 }, encodedRelations[2]]).join(",") === "ADD,MORE", "Invalid encoded data must use the fixed legacy action order");
assert(moveOrderedItem(["a", "b", "c"], 0, 2).join(",") === "b,c,a", "Generic reorder must move an item to its target index");

const assigned = assignSeasoningSortOrders([
  { action: "NONE" as const, optionId: "o1" },
  { action: "NONE" as const, optionId: "o2" },
  { action: "LESS" as const, optionId: "o3" },
]);
assert(assigned.map((item) => item.sortOrder).join(",") === "10000010,10000020,11000010", "Saved ordering must encode action and Option positions deterministically");

const productDraft = createProductConfigurationDraft(encodedRelations);
assert(productDraft.map((group) => group.action).join(",") === "MORE,ADD", "Product editor must initialize actions using saved order");
assert(productDraft[0].options.map((option) => option.optionId).join(",") === "o3,o1", "Product editor must initialize Option order from saved relations");
assert(productDraft[1].options[0].inputPrice === 2 && productDraft[1].options[0].markupCoefficient === 1, "Historical relations must initialize base price from priceDelta and coefficient to 1.00");
assert(productDraft[1].options[0].status === "inactive", "Product editor must retain relation status");
assert(moveDraftAction(productDraft, "MORE", "ADD").map((group) => group.action).join(",") === "ADD,MORE", "Action drag must update draft order");
assert(moveDraftOption(productDraft, "MORE", "o3", "o1")[0].options.map((option) => option.optionId).join(",") === "o1,o3", "Option drag must update order only inside its action");

const candidates = expandBatchCandidates({
  action: "ADD",
  optionPrices: [
    { optionId: "o1", inputPrice: 1, markupCoefficient: 1, priceDelta: 1 },
    { optionId: "o2", inputPrice: 0, markupCoefficient: 1, priceDelta: 0 },
    { optionId: "o3", inputPrice: 2, markupCoefficient: 1, priceDelta: 2 },
  ],
  productIds: ["p1", "p2"],
  existingRelations: existing,
  activeProductIds: new Set(["p1", "p2"]),
  activeOptionIds: new Set(["o1", "o2", "o3"]),
  optionOrder: new Map([["o1", 10], ["o2", 20], ["o3", 30]]),
});

assert(candidates.length === 6, "Batch expansion must create Option × Product candidates");
assert(candidates.find((item) => item.productId === "p1" && item.optionId === "o1")?.kind === "same", "Same relation classification failed");
assert(candidates.find((item) => item.productId === "p1" && item.optionId === "o2")?.kind === "inactive", "Inactive relation classification failed");
assert(candidates.find((item) => item.productId === "p1" && item.optionId === "o3")?.sortOrder === 30, "New relation must append after existing relations");
assert(candidates.find((item) => item.productId === "p2" && item.optionId === "o1")?.status === "active", "New relation must default active");

const replaced = replaceSeasoningSelection(
  [{ action: "LESS", optionId: "o1", priceDelta: 0 }, { action: "NONE", optionId: "o2", priceDelta: 0 }],
  { action: "MORE", optionId: "o1", priceDelta: 0 },
);
assert(replaced.length === 2, "Replacing an action must not duplicate the option");
assert(replaced.some((item) => item.optionId === "o1" && item.action === "MORE"), "Last action must replace the previous action for the same option");

const terminalGroups = buildTerminalSeasoningGroups({
  product: { id: "p1", code: "D1", name: "Dish", categoryId: "c1", categoryName: "Category", status: "active", emenuSellable: true, sortOrder: 10 },
  options: [{ id: "o1", code: "CHILI", name: "辣椒", status: "active", sortOrder: 10, createdAt: "", updatedAt: "" }],
  relations: existing,
});
assert(terminalGroups.length === 1 && terminalGroups[0].action === "ADD", "Terminal groups must hide inactive relations and empty actions");
const snapshot = createOrderSeasoningSnapshot(terminalGroups[0].choices[0]);
assert(snapshot.optionCode === "CHILI" && snapshot.transactionPrice === 1, "Order snapshot must preserve code, name, and transaction price");

console.log("eMenu local seasoning domain verification passed");
