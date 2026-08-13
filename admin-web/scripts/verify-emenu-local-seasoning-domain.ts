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

assert(generateMarkupCoefficient(() => 0) === 0, "The lowest 20% of random samples must create a free option");
assert(generateMarkupCoefficient(() => 0.1999) === 0, "Free option probability boundary is incorrect");
assert(generateMarkupCoefficient(() => 0.2) === 0.5, "Paid coefficient must start at 0.50");
assert(generateMarkupCoefficient(() => 0.6) === 1.25, "Paid coefficient must be distributed across the configured range");
assert(generateMarkupCoefficient(() => 1) === 2, "Paid coefficient must not exceed 2.00");
assert(calculateActualMarkupPrice(10, 1.25) === 12.5, "Actual markup price must multiply input price by coefficient");
assert(calculateActualMarkupPrice(1.01, 1.5) === 1.52, "Actual markup price must round to cents");

const freePricing = createBatchOptionPricing(() => 0.1);
assert(freePricing.markupCoefficient === 0 && freePricing.inputPrice === 0, "Free pricing draft must start at zero");
assert(updateBatchInputPrice(freePricing, 33).inputPrice === 0, "Free pricing draft must reject price input");
const paidPricing = createBatchOptionPricing(() => 0.6);
assert(paidPricing.markupCoefficient === 1.25, "Paid pricing draft must retain its generated coefficient");
assert(updateBatchInputPrice(paidPricing, 33).inputPrice === 33, "Paid pricing draft must accept price input");

const existing: ProductSeasoningRelation[] = [
  { id: "r1", productId: "p1", action: "ADD", optionId: "o1", priceDelta: 1, sortOrder: 10, status: "active", createdAt: "", updatedAt: "" },
  { id: "r2", productId: "p1", action: "ADD", optionId: "o2", priceDelta: 0, sortOrder: 20, status: "inactive", createdAt: "", updatedAt: "" },
];

const candidates = expandBatchCandidates({
  action: "ADD",
  optionPrices: [{ optionId: "o1", priceDelta: 1 }, { optionId: "o2", priceDelta: 0 }, { optionId: "o3", priceDelta: 2 }],
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
