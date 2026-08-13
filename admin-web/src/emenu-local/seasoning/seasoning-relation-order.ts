import { SEASONING_ACTIONS } from "./seasoning-domain";
import type { ProductSeasoningRelation, SeasoningActionCode } from "./seasoning-types";

export const SEASONING_SORT_MARKER = 10_000_000;
export const SEASONING_ACTION_SORT_SPAN = 1_000_000;
export const SEASONING_OPTION_SORT_STEP = 10;
export const SEASONING_MAX_OPTIONS_PER_ACTION = 10_000;

const fallbackActionOrder = new Map(SEASONING_ACTIONS.map(({ code }, index) => [code, index]));

export function encodeSeasoningSortOrder(actionIndex: number, optionIndex: number): number {
  if (!Number.isInteger(actionIndex) || actionIndex < 0 || actionIndex >= SEASONING_ACTIONS.length) throw new Error("invalid_action_order");
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= SEASONING_MAX_OPTIONS_PER_ACTION) throw new Error("invalid_option_order");
  return SEASONING_SORT_MARKER + actionIndex * SEASONING_ACTION_SORT_SPAN + (optionIndex + 1) * SEASONING_OPTION_SORT_STEP;
}

export function isEncodedSeasoningOrder(relations: Pick<ProductSeasoningRelation, "action" | "sortOrder">[]): boolean {
  if (!relations.length) return false;
  const actionBuckets = new Map<SeasoningActionCode, number>();
  const usedBuckets = new Set<number>();
  const usedOrders = new Set<number>();
  for (const relation of relations) {
    const order = relation.sortOrder;
    if (!Number.isSafeInteger(order) || order < SEASONING_SORT_MARKER + SEASONING_OPTION_SORT_STEP || usedOrders.has(order)) return false;
    const encoded = order - SEASONING_SORT_MARKER;
    const bucket = Math.floor(encoded / SEASONING_ACTION_SORT_SPAN);
    const within = encoded - bucket * SEASONING_ACTION_SORT_SPAN;
    if (bucket < 0 || bucket >= SEASONING_ACTIONS.length || within < SEASONING_OPTION_SORT_STEP || within % SEASONING_OPTION_SORT_STEP !== 0 || within / SEASONING_OPTION_SORT_STEP > SEASONING_MAX_OPTIONS_PER_ACTION) return false;
    const existingBucket = actionBuckets.get(relation.action);
    if (existingBucket !== undefined && existingBucket !== bucket) return false;
    if (existingBucket === undefined && usedBuckets.has(bucket)) return false;
    actionBuckets.set(relation.action, bucket);
    usedBuckets.add(bucket);
    usedOrders.add(order);
  }
  return true;
}

export function seasoningActionOrder(relations: Pick<ProductSeasoningRelation, "action" | "sortOrder">[]): SeasoningActionCode[] {
  const actions = [...new Set(relations.map((relation) => relation.action))];
  if (!isEncodedSeasoningOrder(relations)) return actions.sort((left, right) => (fallbackActionOrder.get(left) ?? 99) - (fallbackActionOrder.get(right) ?? 99));
  const minimums = new Map<SeasoningActionCode, number>();
  for (const relation of relations) minimums.set(relation.action, Math.min(minimums.get(relation.action) ?? Number.POSITIVE_INFINITY, relation.sortOrder));
  return actions.sort((left, right) => (minimums.get(left) ?? 0) - (minimums.get(right) ?? 0));
}

export function sortSeasoningProductRelations<T extends Pick<ProductSeasoningRelation, "action" | "sortOrder" | "optionId">>(relations: T[]): T[] {
  const actionOrder = new Map(seasoningActionOrder(relations).map((action, index) => [action, index]));
  return [...relations].sort((left, right) => (actionOrder.get(left.action) ?? 99) - (actionOrder.get(right.action) ?? 99) || left.sortOrder - right.sortOrder || left.optionId.localeCompare(right.optionId));
}

export function assignSeasoningSortOrders<T extends { action: SeasoningActionCode }>(relations: T[]): Array<T & { sortOrder: number }> {
  const actionIndexes = new Map<SeasoningActionCode, number>();
  const optionIndexes = new Map<SeasoningActionCode, number>();
  return relations.map((relation) => {
    if (!actionIndexes.has(relation.action)) actionIndexes.set(relation.action, actionIndexes.size);
    const optionIndex = optionIndexes.get(relation.action) ?? 0;
    optionIndexes.set(relation.action, optionIndex + 1);
    return { ...relation, sortOrder: encodeSeasoningSortOrder(actionIndexes.get(relation.action) ?? 0, optionIndex) };
  });
}

export function moveOrderedItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length || fromIndex === toIndex) return [...items];
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
