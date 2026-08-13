import type {
  BatchCandidate,
  BatchOptionPrice,
  OrderSeasoningSelection,
  ProductSeasoningRelation,
  SeasoningActionCode,
  SeasoningActionDefinition,
} from "./seasoning-types";

export type {
  BatchCandidate,
  ProductSeasoningRelation,
  SeasoningActionCode,
} from "./seasoning-types";

export const SEASONING_ACTIONS: readonly SeasoningActionDefinition[] = [
  { code: "ADD", labelKey: "seasoning.action.add" },
  { code: "LESS", labelKey: "seasoning.action.less" },
  { code: "MORE", labelKey: "seasoning.action.more" },
  { code: "NONE", labelKey: "seasoning.action.none" },
] as const;

export function buildRelationKey(productId: string, action: SeasoningActionCode, optionId: string): string {
  return `${productId}::${action}::${optionId}`;
}

export function normalizePriceDelta(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error("invalid_price_delta");
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function candidateId(productId: string, action: SeasoningActionCode, optionId: string): string {
  return `${buildRelationKey(productId, action, optionId)}::candidate`;
}

export function expandBatchCandidates(input: {
  action: SeasoningActionCode;
  optionPrices: BatchOptionPrice[];
  productIds: string[];
  existingRelations: ProductSeasoningRelation[];
  activeProductIds: Set<string>;
  sellableProductIds?: Set<string>;
  activeOptionIds: Set<string>;
  optionOrder: Map<string, number>;
}): BatchCandidate[] {
  const existingByKey = new Map(input.existingRelations.map((relation) => [buildRelationKey(relation.productId, relation.action, relation.optionId), relation]));
  const nextOrderByProduct = new Map<string, number>();
  for (const productId of input.productIds) {
    const maximum = input.existingRelations
      .filter((relation) => relation.productId === productId && relation.action === input.action)
      .reduce((max, relation) => Math.max(max, relation.sortOrder), 0);
    nextOrderByProduct.set(productId, maximum + 10);
  }

  const orderedOptions = [...input.optionPrices].sort((left, right) => {
    const order = (input.optionOrder.get(left.optionId) ?? 0) - (input.optionOrder.get(right.optionId) ?? 0);
    return order || left.optionId.localeCompare(right.optionId);
  });
  const candidates: BatchCandidate[] = [];

  for (const productId of input.productIds) {
    let nextOrder = nextOrderByProduct.get(productId) ?? 10;
    for (const option of orderedOptions) {
      const priceDelta = normalizePriceDelta(option.priceDelta);
      const existing = existingByKey.get(buildRelationKey(productId, input.action, option.optionId));
      let kind: BatchCandidate["kind"] = "new";
      let reason: BatchCandidate["reason"];
      if (!input.activeProductIds.has(productId)) {
        kind = "unavailable";
        reason = "product_inactive";
      } else if (input.sellableProductIds && !input.sellableProductIds.has(productId)) {
        kind = "unavailable";
        reason = "product_not_sellable";
      } else if (!input.activeOptionIds.has(option.optionId)) {
        kind = "unavailable";
        reason = "option_inactive";
      } else if (existing?.status === "inactive") {
        kind = "inactive";
      } else if (existing) {
        kind = normalizePriceDelta(existing.priceDelta) === priceDelta ? "same" : "different";
      }
      candidates.push({
        candidateId: candidateId(productId, input.action, option.optionId),
        productId,
        optionId: option.optionId,
        action: input.action,
        priceDelta,
        existingPriceDelta: existing?.priceDelta,
        sortOrder: existing?.sortOrder ?? nextOrder,
        status: existing?.status ?? "active",
        kind,
        reason,
      });
      if (!existing) nextOrder += 10;
    }
  }
  return candidates;
}

export function replaceSeasoningSelection(
  selections: OrderSeasoningSelection[],
  next: OrderSeasoningSelection,
): OrderSeasoningSelection[] {
  return [...selections.filter((selection) => selection.optionId !== next.optionId), next];
}
