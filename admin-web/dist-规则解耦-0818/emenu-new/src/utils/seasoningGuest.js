export const SEASONING_ACTION_CODES = ["ADD", "LESS", "MORE", "NONE"];

export const SEASONING_ACTION_LABELS = {
  ADD: "添加",
  LESS: "少放",
  MORE: "多放",
  NONE: "不要",
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

export function formatSeasoningSnapshotLabel(snap) {
  if (!snap) return "";
  const actionLabel = SEASONING_ACTION_LABELS[snap.action] || snap.action || "";
  return [actionLabel, snap.optionName || snap.optionCode].filter(Boolean).join(" ");
}

const SEASONING_NOTE_PREFIX = new RegExp(
  `^(${Object.values(SEASONING_ACTION_LABELS).join("|")})(?:\\s+|$)`,
);

export function parseSeasoningNoteLabel(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const match = raw.match(SEASONING_NOTE_PREFIX);
  if (!match) return null;
  const actionLabel = match[1];
  const action = Object.keys(SEASONING_ACTION_LABELS).find(
    (key) => SEASONING_ACTION_LABELS[key] === actionLabel,
  );
  const optionName = raw.slice(match[0].length).trim();
  return {
    action,
    optionName: optionName || actionLabel,
  };
}

function seasoningNoteText(option) {
  return (
    option?.label ||
    option?.name ||
    option?.optionName ||
    option?.displayText ||
    ""
  );
}

export function isSeasoningNoteOption(option) {
  if (!option || option.qtyVoid) return false;
  if (
    option.optionType &&
    option.optionType !== "NOTE" &&
    !option.isCustomOption
  ) {
    return false;
  }
  return !!parseSeasoningNoteLabel(seasoningNoteText(option));
}

export function getSeasoningLabelsFromOptions(options) {
  const labels = [];
  (options || []).forEach((group) => {
    const list = Array.isArray(group) ? group : [group];
    list.forEach((option) => {
      if (!isSeasoningNoteOption(option)) return;
      const text = String(seasoningNoteText(option)).trim();
      if (text) labels.push(text);
    });
  });
  return labels;
}

export function extractSeasoningSnapshotsFromPosOptions(posOptions) {
  return (posOptions || [])
    .filter((option) => option && option.optionType === "NOTE" && !option.qtyVoid)
    .map((option) => {
      const parsed = parseSeasoningNoteLabel(option.optionName || option.displayText);
      if (!parsed) return null;
      return {
        action: parsed.action,
        optionName: parsed.optionName,
        optionCode: parsed.optionName,
        transactionPrice: Number(option.price) || 0,
      };
    })
    .filter(Boolean);
}

export function buildOrderSeasoningSnapshots(selections, groups) {
  const map = new Map();
  for (const g of groups) for (const c of g.choices) map.set(`${c.action}::${c.optionId}`, c);
  return (selections || [])
    .map((s) => map.get(`${s.action}::${s.optionId}`))
    .filter(Boolean)
    .map(createOrderSeasoningSnapshot);
}
