export type FloorPlanGeometry = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FloorPlanGeometryAction =
  | "align-left"
  | "align-right"
  | "align-top"
  | "align-bottom"
  | "align-center-x"
  | "align-center-y"
  | "distribute-x"
  | "distribute-y"
  | "equal-width"
  | "equal-height"
  | "wider"
  | "narrower"
  | "taller"
  | "shorter"
  | "move-left"
  | "move-right"
  | "move-up"
  | "move-down";

export type FloorPlanGeometryResult =
  | { ok: true; tables: FloorPlanGeometry[] }
  | { ok: false; reason: string };

const MIN_WIDTH = 60;
const MIN_HEIGHT = 40;
const STEP = 5;

export function requiredFloorPlanSelectionCount(action: FloorPlanGeometryAction): number {
  if (action.startsWith("distribute-")) return 3;
  if (action.startsWith("align-") || action.startsWith("equal-")) return 2;
  return 1;
}

function inside(table: FloorPlanGeometry, canvasWidth: number, canvasHeight: number): boolean {
  return table.x >= 0 && table.y >= 0 && table.x + table.width <= canvasWidth && table.y + table.height <= canvasHeight;
}

export function applyFloorPlanGeometryAction(
  selected: FloorPlanGeometry[],
  action: FloorPlanGeometryAction,
  canvasWidth: number,
  canvasHeight: number,
): FloorPlanGeometryResult {
  const minimum = requiredFloorPlanSelectionCount(action);
  if (selected.length < minimum) return { ok: false, reason: `请至少选择 ${minimum} 张桌台` };
  const base = selected[0]!;
  let next = selected.map((table) => ({ ...table }));

  if (action === "align-left") next = next.map((table) => ({ ...table, x: base.x }));
  if (action === "align-right") next = next.map((table) => ({ ...table, x: base.x + base.width - table.width }));
  if (action === "align-top") next = next.map((table) => ({ ...table, y: base.y }));
  if (action === "align-bottom") next = next.map((table) => ({ ...table, y: base.y + base.height - table.height }));
  if (action === "align-center-x") next = next.map((table) => ({ ...table, x: base.x + (base.width - table.width) / 2 }));
  if (action === "align-center-y") next = next.map((table) => ({ ...table, y: base.y + (base.height - table.height) / 2 }));
  if (action === "equal-width") next = next.map((table) => ({ ...table, width: base.width }));
  if (action === "equal-height") next = next.map((table) => ({ ...table, height: base.height }));
  if (action === "wider") next = next.map((table) => ({ ...table, width: table.width + STEP }));
  if (action === "narrower") next = next.map((table) => ({ ...table, width: Math.max(MIN_WIDTH, table.width - STEP) }));
  if (action === "taller") next = next.map((table) => ({ ...table, height: table.height + STEP }));
  if (action === "shorter") next = next.map((table) => ({ ...table, height: Math.max(MIN_HEIGHT, table.height - STEP) }));
  if (action === "move-left") next = next.map((table) => ({ ...table, x: table.x - STEP }));
  if (action === "move-right") next = next.map((table) => ({ ...table, x: table.x + STEP }));
  if (action === "move-up") next = next.map((table) => ({ ...table, y: table.y - STEP }));
  if (action === "move-down") next = next.map((table) => ({ ...table, y: table.y + STEP }));

  if (action === "distribute-x") {
    const sorted = [...next].sort((a, b) => a.x - b.x);
    const first = sorted[0]!;
    const last = sorted.at(-1)!;
    const span = last.x + last.width - first.x;
    const gap = (span - sorted.reduce((sum, table) => sum + table.width, 0)) / (sorted.length - 1);
    if (gap < 0) return { ok: false, reason: "桌台水平空间不足，无法等距分布" };
    let cursor = first.x;
    next = sorted.map((table) => {
      const positioned = { ...table, x: cursor };
      cursor += table.width + gap;
      return positioned;
    });
  }
  if (action === "distribute-y") {
    const sorted = [...next].sort((a, b) => a.y - b.y);
    const first = sorted[0]!;
    const last = sorted.at(-1)!;
    const span = last.y + last.height - first.y;
    const gap = (span - sorted.reduce((sum, table) => sum + table.height, 0)) / (sorted.length - 1);
    if (gap < 0) return { ok: false, reason: "桌台垂直空间不足，无法等距分布" };
    let cursor = first.y;
    next = sorted.map((table) => {
      const positioned = { ...table, y: cursor };
      cursor += table.height + gap;
      return positioned;
    });
  }

  next = next.map((table) => ({ ...table, x: Math.round(table.x), y: Math.round(table.y), width: Math.round(table.width), height: Math.round(table.height) }));
  if (next.some((table) => !inside(table, canvasWidth, canvasHeight))) {
    return { ok: false, reason: "操作会使桌台超出画布范围" };
  }
  return { ok: true, tables: next };
}
