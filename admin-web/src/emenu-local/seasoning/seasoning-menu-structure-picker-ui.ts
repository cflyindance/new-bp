import type {
  MenuNodeSelection,
  SeasoningMenuCategory,
  SeasoningMenuDish,
  SeasoningMenuGroup,
  SeasoningMenuStructure,
} from "./seasoning-types";
import { escapeSeasoningHtml, secondaryButtonClass } from "./seasoning-ui-helpers";

function selectionState(node: MenuNodeSelection): { checked: boolean; partial: boolean } {
  const checked = node.selectableCount > 0 && node.selectedCount === node.selectableCount;
  return { checked, partial: node.selectedCount > 0 && !checked };
}

function renderBranchRow(
  node: SeasoningMenuGroup | SeasoningMenuCategory,
  level: "group" | "category",
  active: boolean,
): string {
  const state = selectionState(node);
  const childCount = "categoryCount" in node ? node.categoryCount : node.dishCount;
  return `
    <div class="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${active ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/55"}">
      <input
        type="checkbox"
        class="size-4 shrink-0 accent-primary"
        data-menu-toggle-level="${level}"
        data-menu-toggle-id="${escapeSeasoningHtml(node.id)}"
        ${checkedAttr(state.checked)}
        ${state.partial ? 'data-menu-indeterminate="1"' : ""}
        aria-checked="${state.partial ? "mixed" : state.checked ? "true" : "false"}"
        ${node.selectableCount === 0 ? "disabled" : ""}
        aria-label="选择${escapeSeasoningHtml(node.name)}"
      />
      <button
        type="button"
        data-menu-activate-${level}="${escapeSeasoningHtml(node.id)}"
        class="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">${escapeSeasoningHtml(node.name)}</span>
        <span class="shrink-0 rounded-md bg-background/80 px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">${node.selectedCount}/${node.selectableCount}</span>
        <span class="text-xs text-muted-foreground" aria-hidden="true">›</span>
      </button>
      <span class="sr-only">${childCount} 个下级</span>
    </div>`;
}

function checkedAttr(checked: boolean): string {
  return checked ? "checked" : "";
}

function renderDishRow(dish: SeasoningMenuDish): string {
  return `
    <label class="flex items-start gap-2 rounded-lg px-2 py-2 transition-colors ${dish.selected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/55"} ${dish.selectable ? "cursor-pointer" : "cursor-not-allowed opacity-55"}">
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 accent-primary"
        data-menu-toggle-level="dish"
        data-menu-toggle-id="${escapeSeasoningHtml(dish.id)}"
        ${checkedAttr(dish.selected)}
        ${dish.selectable ? "" : "disabled"}
      />
      <span class="min-w-0 flex-1">
        <span class="flex items-center justify-between gap-2">
          <strong class="truncate text-sm font-medium text-foreground">${escapeSeasoningHtml(dish.name)}</strong>
          <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">${dish.relationCount ?? 0} Option</span>
        </span>
      </span>
    </label>`;
}

function emptyState(message: string): string {
  return `<div class="flex min-h-32 items-center justify-center px-4 text-center text-sm text-muted-foreground">${message}</div>`;
}

export function renderSeasoningMenuStructurePicker(structure: SeasoningMenuStructure): string {
  const groups = structure.groups.map((group) => renderBranchRow(group, "group", group.id === structure.activeGroupId)).join("");
  const categories = structure.categories.map((category) => renderBranchRow(category, "category", category.id === structure.activeCategoryId)).join("");
  const dishes = structure.dishes.items.map(renderDishRow).join("");
  return `
    <div data-seasoning-menu-structure-picker class="overflow-x-auto rounded-xl border border-border bg-card">
      <div class="grid min-h-[19rem] min-w-[720px] grid-cols-3 divide-x divide-border">
        <section class="flex min-h-0 flex-col" data-menu-column="group">
          <header class="border-b border-border bg-muted/35 px-3 py-2.5">
            <p class="text-xs font-semibold tracking-wide text-foreground">组</p>
            <p class="mt-0.5 text-[11px] text-muted-foreground">选择菜单分组</p>
          </header>
          <div class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">${groups || emptyState("暂无匹配的菜单组")}</div>
        </section>
        <section class="flex min-h-0 flex-col" data-menu-column="category">
          <header class="border-b border-border bg-muted/35 px-3 py-2.5">
            <p class="text-xs font-semibold tracking-wide text-foreground">类</p>
            <p class="mt-0.5 text-[11px] text-muted-foreground">选择商品分类</p>
          </header>
          <div class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">${categories || emptyState("请选择菜单组")}</div>
        </section>
        <section class="flex min-h-0 flex-col" data-menu-column="dish">
          <header class="border-b border-border bg-muted/35 px-3 py-2.5">
            <p class="text-xs font-semibold tracking-wide text-foreground">菜</p>
            <p class="mt-0.5 text-[11px] text-muted-foreground">勾选适用商品</p>
          </header>
          <div class="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">${dishes || emptyState(structure.query ? "没有匹配的菜品" : "请选择商品分类")}</div>
          ${structure.dishes.nextCursor ? `<div class="border-t border-border p-2"><button type="button" data-menu-load-more class="w-full ${secondaryButtonClass}">加载更多</button></div>` : ""}
        </section>
      </div>
    </div>`;
}

export function syncSeasoningMenuIndeterminate(root: ParentNode): void {
  const apply = () => root.querySelectorAll<HTMLInputElement>('[data-menu-indeterminate="1"]').forEach((checkbox) => {
    checkbox.indeterminate = true;
    checkbox.setAttribute("aria-checked", "mixed");
  });
  apply();
  requestAnimationFrame(apply);
}
