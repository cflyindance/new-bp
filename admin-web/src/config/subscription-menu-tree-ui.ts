import {
  collectSelectableRouteNodeIds,
  filterSubscriptionMenuTree,
  flattenSubscriptionMenuTree,
  type SubscriptionMenuTreeNode,
  type SubscriptionPublishedMenuTree,
} from "./subscription-published-menu-tree";

function esc(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderNode(node: SubscriptionMenuTreeNode, selected: Set<string>): string {
  const selectableIds = collectSelectableRouteNodeIds(node);
  const selectedCount = selectableIds.filter((id) => selected.has(id)).length;
  const checked = selectableIds.length > 0 && selectedCount === selectableIds.length;
  const partial = selectedCount > 0 && !checked;
  const checkbox = selectableIds.length
    ? `<input type="checkbox" data-sub-tree-select-ids="${esc(JSON.stringify(selectableIds))}" data-sub-tree-state="${partial ? "partial" : checked ? "checked" : "empty"}" ${checked ? "checked" : ""} class="mt-0.5 size-4 shrink-0 accent-emerald-700">`
    : `<span class="mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-border text-[9px] text-muted-foreground">·</span>`;
  const row = `<div class="flex min-h-11 items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/60">${checkbox}<span class="min-w-0 flex-1"><span class="block text-sm font-medium">${esc(node.title)}</span>${node.path ? `<span class="block truncate font-mono text-[10px] text-muted-foreground">${esc(node.path)}</span>` : ""}</span><span class="shrink-0 text-[10px] text-muted-foreground">L${node.level}${selectableIds.length ? ` · ${selectedCount}/${selectableIds.length}` : " · 目录"}</span></div>`;
  if (!node.children.length) return row;
  return `<details open class="group/tree"><summary class="list-none cursor-pointer">${row}</summary><div class="ml-5 space-y-1 border-l border-border pl-3">${node.children.map((child) => renderNode(child, selected)).join("")}</div></details>`;
}

export function renderSubscriptionMenuTree(input: { tree: SubscriptionPublishedMenuTree | null; selectedIds: string[]; query: string }): string {
  if (!input.tree) return `<div class="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-10 text-center"><h3 class="font-semibold text-amber-900">尚无已发布的菜单路由结构</h3><p class="mt-2 text-sm text-amber-800">请先前往菜单路由配置完成发布，再创建或编辑服务包。</p></div>`;
  const roots = filterSubscriptionMenuTree(input.tree.roots, input.query);
  const matchedSelectableCount = flattenSubscriptionMenuTree(roots).filter((node) => node.selectable).length;
  const selected = new Set(input.selectedIds);
  return `<div data-subscription-menu-tree>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"><div><strong class="text-sm">已发布菜单树 v${input.tree.blueprintVersion}</strong><p class="mt-1 text-xs text-muted-foreground">${input.tree.source === "menu-document" ? "菜单路由配置" : input.tree.source === "custom" ? "自定义导航树" : "系统默认导航"} · ${input.tree.structureNodeCount} 个结构节点 · ${input.tree.selectableNodeCount} 个可选菜单${input.query ? ` · 当前匹配 ${matchedSelectableCount} 个` : ""}</p></div><span class="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">已选 ${selected.size} 个菜单</span></div>
    <div class="space-y-3">${roots.map((root) => `<section class="rounded-xl border border-border bg-card p-2 shadow-sm">${renderNode(root, selected)}</section>`).join("") || `<div class="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">没有匹配的菜单路由</div>`}</div>
  </div>`;
}

export function initializeSubscriptionMenuTreeIndeterminate(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>("[data-sub-tree-state='partial']").forEach((input) => { input.indeterminate = true; });
}

export function readSubscriptionMenuTreeToggle(input: HTMLInputElement): { routeNodeIds: string[]; checked: boolean } {
  try {
    const routeNodeIds = JSON.parse(input.dataset.subTreeSelectIds ?? "[]") as unknown;
    return { routeNodeIds: Array.isArray(routeNodeIds) ? routeNodeIds.map(String) : [], checked: input.checked };
  } catch {
    return { routeNodeIds: [], checked: input.checked };
  }
}
