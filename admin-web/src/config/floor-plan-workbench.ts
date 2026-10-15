import type { FloorPlanArea } from "./floor-plan-ui";

export const TABLE_MANAGEMENT_PATH = "/operations/queue-call/tables";

export function escapeFloorPlanText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function filterFloorPlanTables(areas: FloorPlanArea[], areaId: string, search: string) {
  const query = search.trim().toLocaleLowerCase();
  return areas.filter((area) => !areaId || area.id === areaId).flatMap((area) =>
    area.tables.filter((table) => !query || table.name.toLocaleLowerCase().includes(query)).map((table) => ({ area, table })),
  );
}

export function renderFloorPlanManagement(areas: FloorPlanArea[], areaId: string, search: string): string {
  const e = escapeFloorPlanText;
  const rows = filterFloorPlanTables(areas, areaId, search);
  const shapes = { rectangle: "矩形", circle: "圆形", oval: "铁板桌 / 长桌", bar: "吧台", ktv: "卡拉 OK" };
  return `<section class="space-y-4 min-w-0 flex-1" aria-label="餐位管理列表">
    <div class="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
      <label class="block flex-1 min-w-48 space-y-1"><span class="text-xs text-muted-foreground">餐位名称</span><input type="search" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="搜索餐位名称" data-floor-plan-search value="${e(search)}" /></label>
      <label class="block min-w-40 space-y-1"><span class="text-xs text-muted-foreground">区域筛选</span><select data-floor-plan-filter-area class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">全部区域</option>${areas.map((area) => `<option value="${e(area.id)}"${areaId === area.id ? " selected" : ""}>${e(area.name)}</option>`).join("")}</select></label>
      <button type="button" class="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted" data-floor-plan-filter-reset>重置</button>
    </div>
    <div class="rounded-xl border border-border bg-card overflow-hidden">
      <div class="border-b border-border px-4 py-3 text-sm text-muted-foreground" data-floor-plan-result-count>共 ${rows.length} 个餐位</div>
      <div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-muted/40 text-muted-foreground"><tr>${["餐位名称", "所属区域", "容纳人数", "形状", "操作"].map((label) => `<th class="px-4 py-3 font-medium">${label}</th>`).join("")}</tr></thead><tbody data-floor-plan-table-rows>${renderRows()}</tbody></table></div>
    </div>
  </section>`;

  function renderRows(): string {
    return rows.length ? rows.map(({ area, table }) => `<tr class="border-t border-border hover:bg-muted/30">
      <td class="px-4 py-3 font-medium">${e(table.name)}</td><td class="px-4 py-3">${e(area.name)}</td><td class="px-4 py-3">${table.seats} 人</td><td class="px-4 py-3">${shapes[table.shape] ?? e(table.shape)}</td>
      <td class="px-2 py-1"><div class="flex items-center gap-1"><button type="button" class="rounded-md px-3 py-2.5 text-primary hover:bg-primary/10" data-floor-plan-manage-edit="${e(table.id)}" data-area-id="${e(area.id)}" aria-label="编辑餐位 ${e(table.name)}">编辑</button><a class="rounded-md px-3 py-2.5 text-primary hover:bg-primary/10" data-floor-plan-locate href="#/operations/queue-call/floor-plan/locate?area=${encodeURIComponent(area.id)}&table=${encodeURIComponent(table.id)}" aria-label="在平面图中定位 ${e(table.name)}">平面图定位</a></div></td>
    </tr>`).join("") : `<tr><td colspan="5" class="px-4 py-16 text-center text-muted-foreground">${areas.length ? "没有符合条件的餐位，可调整筛选或新增餐位" : "请先新增区域，再创建餐位"}</td></tr>`;
  }
}

/** Undo snapshots are business data only; UI selection and view zoom never enter history. */
export class FloorPlanHistory {
  private past: FloorPlanArea[][] = [];
  private future: FloorPlanArea[][] = [];
  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
  record(before: FloorPlanArea[], after: FloorPlanArea[]) {
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    this.past.push(structuredClone(before));
    if (this.past.length > 30) this.past.shift();
    this.future = [];
  }
  undo(current: FloorPlanArea[]) {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(structuredClone(current));
    return previous;
  }
  redo(current: FloorPlanArea[]) {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(structuredClone(current));
    return next;
  }
}

export function snapFloorPlanPosition(
  moving: { id: string; width: number; height: number }, x: number, y: number,
  peers: { id: string; x: number; y: number; width: number; height: number }[], tolerance: number,
) {
  let nextX = Math.max(0, Math.min(1000 - moving.width, x));
  let nextY = Math.max(0, Math.min(650 - moving.height, y));
  let guideX: number | null = null;
  let guideY: number | null = null;
  let distanceX = tolerance, distanceY = tolerance;
  for (const peer of peers.filter((item) => item.id !== moving.id)) {
    for (const target of [peer.x, peer.x + peer.width / 2, peer.x + peer.width]) {
      for (const offset of [0, moving.width / 2, moving.width]) {
        const candidate = target - offset;
        const distance = Math.abs(candidate - x);
        if (candidate >= 0 && candidate + moving.width <= 1000 && distance < distanceX) {
          nextX = candidate; distanceX = distance; guideX = target;
        }
      }
    }
    for (const target of [peer.y, peer.y + peer.height / 2, peer.y + peer.height]) {
      for (const offset of [0, moving.height / 2, moving.height]) {
        const candidate = target - offset;
        const distance = Math.abs(candidate - y);
        if (candidate >= 0 && candidate + moving.height <= 650 && distance < distanceY) {
          nextY = candidate; distanceY = distance; guideY = target;
        }
      }
    }
  }
  return { x: Math.round(nextX), y: Math.round(nextY), guideX, guideY,
    clipped: x < 0 || y < 0 || x + moving.width > 1000 || y + moving.height > 650 };
}
