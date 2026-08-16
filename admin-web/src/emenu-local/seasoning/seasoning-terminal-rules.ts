import { SEASONING_ACTIONS, replaceSeasoningSelection } from "./seasoning-domain";
import type {
  OrderSeasoningSelection,
  ProductSeasoningRelation,
  SeasoningActionCode,
  SeasoningOption,
  SeasoningProduct,
} from "./seasoning-types";

export type TerminalSeasoningChoice = {
  action: SeasoningActionCode;
  optionId: string;
  optionCode: string;
  optionName: string;
  priceDelta: number;
  sortOrder: number;
};

export function buildTerminalSeasoningGroups(input: {
  product: SeasoningProduct;
  options: SeasoningOption[];
  relations: ProductSeasoningRelation[];
}): { action: SeasoningActionCode; choices: TerminalSeasoningChoice[] }[] {
  if (input.product.status !== "active" || !input.product.emenuSellable) return [];
  const options = new Map(input.options.filter((option) => option.status === "active").map((option) => [option.id, option]));
  return SEASONING_ACTIONS.map(({ code }) => ({
    action: code,
    choices: input.relations
      .filter((relation) => relation.action === code && relation.status === "active" && options.has(relation.optionId))
      .map((relation) => {
        const option = options.get(relation.optionId)!;
        return { action: code, optionId: option.id, optionCode: option.code, optionName: option.name, priceDelta: relation.priceDelta, sortOrder: relation.sortOrder };
      })
      .sort((left, right) => left.sortOrder - right.sortOrder || (options.get(left.optionId)?.sortOrder ?? 0) - (options.get(right.optionId)?.sortOrder ?? 0) || left.optionName.localeCompare(right.optionName)),
  })).filter((group) => group.choices.length > 0);
}

export function selectTerminalSeasoning(
  current: OrderSeasoningSelection[],
  choice: TerminalSeasoningChoice,
): OrderSeasoningSelection[] {
  return replaceSeasoningSelection(current, { action: choice.action, optionId: choice.optionId, priceDelta: choice.priceDelta });
}

export function createOrderSeasoningSnapshot(choice: TerminalSeasoningChoice): {
  action: SeasoningActionCode;
  optionId: string;
  optionCode: string;
  optionName: string;
  transactionPrice: number;
  sortOrder: number;
} {
  return {
    action: choice.action,
    optionId: choice.optionId,
    optionCode: choice.optionCode,
    optionName: choice.optionName,
    transactionPrice: choice.priceDelta,
    sortOrder: choice.sortOrder,
  };
}

export function productHasGuestSeasoningDetail(input: {
  product: SeasoningProduct;
  options: SeasoningOption[];
  relations: ProductSeasoningRelation[];
}): boolean {
  return buildTerminalSeasoningGroups(input).some((group) => group.choices.length > 0);
}

export function buildOrderSeasoningSnapshots(
  selections: OrderSeasoningSelection[],
  groups: { action: SeasoningActionCode; choices: TerminalSeasoningChoice[] }[],
): ReturnType<typeof createOrderSeasoningSnapshot>[] {
  const choiceByKey = new Map<string, TerminalSeasoningChoice>();
  for (const group of groups) {
    for (const choice of group.choices) {
      choiceByKey.set(`${choice.action}::${choice.optionId}`, choice);
    }
  }
  const snapshots: ReturnType<typeof createOrderSeasoningSnapshot>[] = [];
  for (const selection of selections) {
    const choice = choiceByKey.get(`${selection.action}::${selection.optionId}`);
    if (choice) snapshots.push(createOrderSeasoningSnapshot(choice));
  }
  return snapshots;
}
