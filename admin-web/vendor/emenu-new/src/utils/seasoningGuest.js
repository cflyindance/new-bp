export const SEASONING_ACTION_CODES = ["ADD", "LESS", "MORE", "NONE"];

export const SEASONING_ACTION_LABELS = {
  ADD: "Add",
  LESS: "Less",
  MORE: "More",
  NONE: "None",
};

export function buildTerminalSeasoningGroups({ product, options, relations }) {
  if (!product || product.status !== "active" || !product.emenuSellable) return [];
  const optionMap = new Map(options.filter((o) => o.status === "active").map((o) => [o.id, o]));
  return SEASONING_ACTION_CODES.map((action) => ({
    action,
    choices: relations
      .filter((r) => r.action === action && r.status === "active" && optionMap.has(r.optionId))
      .map((r) => {
        const option = optionMap.get(r.optionId);
        return {
          action,
          optionId: option.id,
          optionCode: option.code,
          optionName: option.name,
          priceDelta: r.priceDelta,
          sortOrder: r.sortOrder,
        };
      })
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          (optionMap.get(a.optionId)?.sortOrder ?? 0) - (optionMap.get(b.optionId)?.sortOrder ?? 0) ||
          a.optionName.localeCompare(b.optionName),
      ),
  })).filter((g) => g.choices.length > 0);
}

export function productHasGuestSeasoningDetail(input) {
  return buildTerminalSeasoningGroups(input).some((g) => g.choices.length > 0);
}

export function selectTerminalSeasoning(current, choice) {
  const next = (current || []).filter((s) => s.optionId !== choice.optionId);
  next.push({ action: choice.action, optionId: choice.optionId, priceDelta: choice.priceDelta });
  return next;
}

export function createOrderSeasoningSnapshot(choice) {
  return {
    action: choice.action,
    optionId: choice.optionId,
    optionCode: choice.optionCode,
    optionName: choice.optionName,
    transactionPrice: choice.priceDelta,
    sortOrder: choice.sortOrder,
  };
}

export function buildOrderSeasoningSnapshots(selections, groups) {
  const map = new Map();
  for (const g of groups) for (const c of g.choices) map.set(`${c.action}::${c.optionId}`, c);
  return (selections || [])
    .map((s) => map.get(`${s.action}::${s.optionId}`))
    .filter(Boolean)
    .map(createOrderSeasoningSnapshot);
}
