/**
 * 四级导航 · 四列矩阵共用 UI（平台预设配置页、RBAC 角色权限页）
 */
import type { PermissionTreeNode } from "./permission-registry";
import {
  findL2Node,
  findL3Node,
  formatGroupNavLabel,
  pickNodeTitle,
  renderL3Column,
  type PermissionModuleGroupLike,
} from "./permission-four-column-nav";
import type { PlatformPresetNodeSelection } from "./platform-preset-store";
import { tierBadgeClass, tierBadgeLabel, type BusinessTypeTier } from "./platform-preset-catalog";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type FourColumnMatrixMode = "platform-preset" | "rbac";

function renderL4EditableCheckbox(
  key: string,
  selection: Record<string, PlatformPresetNodeSelection>,
  itemEnabled: boolean,
): string {
  if (!itemEnabled) return "";
  const editable = selection[key]?.l4EditMode === "editable";
  return `<label class="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground" onclick="event.stopPropagation()">
    <input type="checkbox" class="rbac-l4-editable size-3.5 accent-primary" data-rbac-l4-editable="${escapeHtml(key)}" ${editable ? "checked" : ""} aria-label="可编辑" />
    可编辑
  </label>`;
}

export type FourColumnTreeIndex = {
  groups: PermissionModuleGroupLike[];
  getDescendantKeys: (key: string) => string[];
};

export const FOUR_COLUMN_HEADERS = [
  "一级导航",
  "二级导航",
  "三级 / 分组",
  "分组内功能 / 设置",
] as const;

export function fourColumnCheckboxState(
  key: string,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: FourColumnTreeIndex,
): { checked: boolean; indeterminate: boolean } {
  const self = selection[key]?.enabled ?? false;
  const descendants = index.getDescendantKeys(key);
  if (descendants.length === 0) return { checked: self, indeterminate: false };
  const enabledCount = descendants.filter((d) => selection[d]?.enabled).length;
  if (self && enabledCount === descendants.length) return { checked: true, indeterminate: false };
  if (!self && enabledCount === 0) return { checked: false, indeterminate: false };
  return { checked: false, indeterminate: true };
}

export function renderFourColumnItem(
  key: string,
  title: string,
  selected: boolean,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: FourColumnTreeIndex,
  options: {
    tier?: BusinessTypeTier;
    level?: number;
    showL4AccessMode?: boolean;
    childCount?: number;
    nested?: boolean;
    filter?: string;
  } = {},
): string {
  const {
    tier,
    level,
    showL4AccessMode = false,
    childCount,
    nested = false,
    filter = "",
  } = options;
  const q = filter.trim().toLowerCase();
  if (q && !title.toLowerCase().includes(q) && !key.toLowerCase().includes(q)) {
    return "";
  }
  const { checked, indeterminate } = fourColumnCheckboxState(key, selection, index);
  const countBadge =
    childCount != null && level === 3
      ? `<span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">${childCount}</span>`
      : "";
  return `
    <button
      type="button"
      data-pp-col-select="${escapeHtml(key)}"
      data-pp-level="${level ?? ""}"
      class="flex w-full items-start gap-2 rounded-lg py-2 text-left text-sm transition-colors ${nested ? "pl-4 pr-2" : "px-2"} ${selected ? "bg-primary/10 ring-1 ring-primary/25" : "hover:bg-muted/50"}"
    >
      <input
        type="checkbox"
        class="pp-enable-cb mt-0.5 size-4 shrink-0 accent-primary"
        data-pp-enable="${escapeHtml(key)}"
        ${checked ? "checked" : ""}
        ${indeterminate ? 'data-indeterminate="1"' : ""}
        onclick="event.stopPropagation()"
      />
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-1">
          ${tier ? `<span class="rounded px-1.5 py-0.5 text-[10px] font-medium ${tierBadgeClass(tier)}">${escapeHtml(tierBadgeLabel(tier))}</span>` : ""}
          <span class="min-w-0 flex-1 truncate ${level === 4 ? "text-muted-foreground" : "font-medium text-card-foreground"}">${escapeHtml(title)}</span>
          ${countBadge}
        </span>
        ${showL4AccessMode ? renderL4EditableCheckbox(key, selection, checked && !indeterminate) : ""}
      </span>
    </button>`;
}

function renderFourColumnL3(
  l2Node: PermissionTreeNode | undefined,
  activeL3: string,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: FourColumnTreeIndex,
  filter: string,
): string {
  return renderL3Column(l2Node, activeL3, (node, nested) =>
    renderFourColumnItem(
      node.resource.key,
      formatGroupNavLabel(pickNodeTitle(node.resource.title, node.resource.titleEn)),
      node.resource.key === activeL3,
      selection,
      index,
      { level: 3, childCount: node.children.length, nested, filter },
    ),
  );
}

export function renderFourColumnMatrix(
  selection: Record<string, PlatformPresetNodeSelection>,
  index: FourColumnTreeIndex,
  activeL1: string,
  activeL2: string,
  activeL3: string,
  filter: string,
  tierForModule?: (moduleId: string) => BusinessTypeTier | undefined,
  matrixMode: FourColumnMatrixMode = "platform-preset",
): { col1: string; col2: string; col3: string; col4: string } {
  const l1Node = index.groups.find((g) => g.moduleKey === activeL1)?.tree;
  const l2Node = findL2Node(index.groups, activeL2);
  const l3Node = findL3Node(index.groups, activeL3);

  const col1 = index.groups
    .map((g) =>
      renderFourColumnItem(
        g.moduleKey,
        pickNodeTitle(g.moduleTitle, g.moduleTitleEn),
        g.moduleKey === activeL1,
        selection,
        index,
        { tier: tierForModule?.(g.moduleId), level: 1, filter },
      ),
    )
    .filter(Boolean)
    .join("");

  const col2 = (l1Node?.children ?? [])
    .map((c) =>
      renderFourColumnItem(
        c.resource.key,
        pickNodeTitle(c.resource.title, c.resource.titleEn),
        c.resource.key === activeL2,
        selection,
        index,
        { level: 2, filter },
      ),
    )
    .filter(Boolean)
    .join("");

  const col3 = renderFourColumnL3(l2Node, activeL3, selection, index, filter);
  const col4 = (l3Node?.children ?? [])
    .map((c) =>
      renderFourColumnItem(
        c.resource.key,
        pickNodeTitle(c.resource.title, c.resource.titleEn),
        false,
        selection,
        index,
        { level: 4, showL4AccessMode: matrixMode === "rbac", filter },
      ),
    )
    .filter(Boolean)
    .join("");

  return { col1, col2, col3, col4 };
}

export function renderFourColumnMatrixShell(
  col1: string,
  col2: string,
  col3: string,
  col4: string,
): string {
  const empty = (text: string) => `<p class="p-3 text-sm text-muted-foreground">${text}</p>`;
  return `
    <div class="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
      <div class="flex min-h-0 flex-col">
        <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${FOUR_COLUMN_HEADERS[0]}</p>
        <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="1">${col1 || empty("无模块")}</div>
      </div>
      <div class="flex min-h-0 flex-col">
        <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${FOUR_COLUMN_HEADERS[1]}</p>
        <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="2">${col2 || empty("请选择一级导航")}</div>
      </div>
      <div class="flex min-h-0 flex-col">
        <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${FOUR_COLUMN_HEADERS[2]}</p>
        <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="3">${col3 || empty("请选择二级导航")}</div>
      </div>
      <div class="flex min-h-0 flex-col">
        <p class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${FOUR_COLUMN_HEADERS[3]}</p>
        <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="4">${col4 || empty("请选择分组")}</div>
      </div>
    </div>`;
}

export function syncFourColumnIndeterminate(root: ParentNode): void {
  root.querySelectorAll<HTMLInputElement>(".pp-enable-cb[data-indeterminate]").forEach((cb) => {
    cb.indeterminate = true;
  });
}

export function rerenderFourColumnMatrix(
  root: HTMLElement,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: FourColumnTreeIndex,
  filter: string,
  tierForModule?: (moduleId: string) => BusinessTypeTier | undefined,
  matrixMode: FourColumnMatrixMode = "platform-preset",
): void {
  let l1 = root.dataset.activeL1 ?? index.groups[0]?.moduleKey ?? "";
  let l2 = root.dataset.activeL2 ?? "";
  let l3 = root.dataset.activeL3 ?? "";

  const l1Node = index.groups.find((g) => g.moduleKey === l1)?.tree;
  if (!l2 || !l1Node?.children.some((c) => c.resource.key === l2)) {
    l2 = l1Node?.children[0]?.resource.key ?? "";
    root.dataset.activeL2 = l2;
  }
  const l2Node = findL2Node(index.groups, l2);
  if (!l3 || !l2Node?.children.some((c) => c.resource.key === l3)) {
    l3 = l2Node?.children[0]?.resource.key ?? "";
    root.dataset.activeL3 = l3;
  }

  const { col1, col2, col3, col4 } = renderFourColumnMatrix(
    selection,
    index,
    l1,
    l2,
    l3,
    filter,
    tierForModule,
    matrixMode,
  );

  const col1El = root.querySelector('[data-pp-col="1"]');
  const col2El = root.querySelector('[data-pp-col="2"]');
  const col3El = root.querySelector('[data-pp-col="3"]');
  const col4El = root.querySelector('[data-pp-col="4"]');

  if (col1El) col1El.innerHTML = col1 || `<p class="p-3 text-sm text-muted-foreground">无模块</p>`;
  if (col2El) {
    col2El.innerHTML = col2 || `<p class="p-3 text-sm text-muted-foreground">请选择一级导航</p>`;
  }
  if (col3El) {
    col3El.innerHTML = col3 || `<p class="p-3 text-sm text-muted-foreground">请选择二级导航</p>`;
  }
  if (col4El) {
    col4El.innerHTML = col4 || `<p class="p-3 text-sm text-muted-foreground">请选择分组</p>`;
  }

  syncFourColumnIndeterminate(root);
}

export function readFourColumnSelection(root: HTMLElement): Record<string, PlatformPresetNodeSelection> {
  const raw = root.querySelector<HTMLInputElement>("[data-pp-selection-json]")?.value;
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, PlatformPresetNodeSelection>;
    } catch {
      /* fall through */
    }
  }
  return {};
}

export function writeFourColumnSelection(
  root: HTMLElement,
  selection: Record<string, PlatformPresetNodeSelection>,
): void {
  const input = root.querySelector<HTMLInputElement>("[data-pp-selection-json]");
  if (input) input.value = JSON.stringify(selection);
}

function findTreeNodeLevel(index: FourColumnTreeIndex, key: string): number | undefined {
  for (const g of index.groups) {
    const walk = (node: PermissionTreeNode): number | undefined => {
      if (node.resource.key === key) return node.resource.level;
      for (const c of node.children) {
        const found = walk(c);
        if (found != null) return found;
      }
      return undefined;
    };
    const level = walk(g.tree);
    if (level != null) return level;
  }
  return undefined;
}

export function bindFourColumnMatrix(
  root: HTMLElement,
  options: {
    getIndex: () => FourColumnTreeIndex;
    onEnableToggle: (
      selection: Record<string, PlatformPresetNodeSelection>,
      key: string,
      enabled: boolean,
    ) => Record<string, PlatformPresetNodeSelection>;
    getFilter?: () => string;
    tierForModule?: (moduleId: string) => BusinessTypeTier | undefined;
    matrixMode?: FourColumnMatrixMode;
  },
): { getSelection: () => Record<string, PlatformPresetNodeSelection>; setSelection: (s: Record<string, PlatformPresetNodeSelection>) => void } {
  let selection = readFourColumnSelection(root);
  const matrixMode = options.matrixMode ?? "platform-preset";

  const rerender = (): void => {
    writeFourColumnSelection(root, selection);
    rerenderFourColumnMatrix(
      root,
      selection,
      options.getIndex(),
      options.getFilter?.() ?? "",
      options.tierForModule,
      matrixMode,
    );
  };

  root.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement;
    const colSelect = target.closest<HTMLElement>("[data-pp-col-select]");
    if (!colSelect) return;
    const key = colSelect.dataset.ppColSelect!;
    const index = options.getIndex();
    const level = findTreeNodeLevel(index, key);
    if (level == null) return;
    if (level === 1) {
      root.dataset.activeL1 = key;
      root.dataset.activeL2 = "";
      root.dataset.activeL3 = "";
    } else if (level === 2) {
      root.dataset.activeL2 = key;
      root.dataset.activeL3 = "";
    } else if (level === 3) {
      root.dataset.activeL3 = key;
    } else if (level >= 4) {
      return;
    }
    rerender();
  });

  root.addEventListener("change", (ev) => {
    const target = ev.target as HTMLInputElement;

    if (target.matches("[data-pp-enable]")) {
      const key = target.dataset.ppEnable!;
      selection = options.onEnableToggle(selection, key, target.checked);
      rerender();
      return;
    }

    if (target.matches("[data-rbac-l4-editable]") && matrixMode === "rbac") {
      const key = target.dataset.rbacL4Editable!;
      selection[key] = {
        ...selection[key],
        enabled: true,
        l4EditMode: target.checked ? "editable" : "display-only",
      };
      writeFourColumnSelection(root, selection);
      rerender();
    }
  });

  syncFourColumnIndeterminate(root);

  return {
    getSelection: () => selection,
    setSelection: (s) => {
      selection = s;
      rerender();
    },
  };
}
