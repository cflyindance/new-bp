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
import { l2HasCatalogNavSections } from "./module-settings-subnav";
import type { PlatformPresetNodeSelection } from "./platform-preset-store";
import type { NavBlueprintStructureOrder } from "./nav-blueprint-store";
import { tierBadgeClass, tierBadgeLabel, type BusinessTypeTier } from "./platform-preset-catalog";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type FourColumnMatrixMode = "platform-preset" | "rbac" | "nav-blueprint-system";

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

export function resolveFourColumnHeaders(
  l2Node: PermissionTreeNode | undefined,
  headers: readonly string[] = FOUR_COLUMN_HEADERS,
): string[] {
  const out = [...headers];
  if (l2HasCatalogNavSections(l2Node)) {
    out[2] = "三级 / 分组 · 侧栏分类";
  }
  return out;
}

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

function mountKindBadgeClass(kind: "page" | "features"): string {
  return kind === "page"
    ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
    : "bg-amber-500/15 text-amber-800 dark:text-amber-300";
}

function mountKindBadgeLabel(kind: "page" | "features"): string {
  return kind === "page" ? "页面" : "设置";
}

export type FourColumnMatrixRenderOpts = {
  enableSiblingSort?: boolean;
  structureOrder?: NavBlueprintStructureOrder;
  seqOrder?: Record<string, number[]>;
};

function wrapSortableRow(key: string, level: number, innerHtml: string): string {
  return `<div class="flex items-start gap-0.5" data-nb-draggable-row data-nb-sort-key="${escapeHtml(key)}" data-nb-sort-level="${level}">
    <button type="button" class="mt-2 shrink-0 cursor-grab touch-none rounded px-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing" data-nb-drag-handle draggable="true" aria-label="拖动排序" title="拖动排序">⋮⋮</button>
    <div class="min-w-0 flex-1">${innerHtml}</div>
  </div>`;
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
    mountTag?: "page" | "features";
    customL1NodeId?: string;
    /** 只读展示项（无勾选、不可选中） */
    displayOnly?: boolean;
    /** 导航蓝图：显示拖动手柄 */
    sortable?: boolean;
  } = {},
): string {
  const {
    tier,
    level,
    showL4AccessMode = false,
    childCount,
    nested = false,
    filter = "",
    mountTag,
    customL1NodeId,
    displayOnly = false,
    sortable = false,
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
  const mountBadge = mountTag
    ? `<span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${mountKindBadgeClass(mountTag)}">${escapeHtml(mountKindBadgeLabel(mountTag))}</span>`
    : "";
  if (displayOnly) {
    return `<div class="rounded-lg px-2 py-2 text-sm">
      <span class="flex items-center gap-1">
        ${mountBadge}
        <span class="min-w-0 flex-1 truncate font-medium text-card-foreground">${escapeHtml(title)}</span>
      </span>
    </div>`;
  }
  const selectBtnClass = customL1NodeId
    ? `flex min-w-0 flex-1 items-start gap-2 rounded-lg py-2 text-left text-sm transition-colors ${nested ? "pl-4 pr-2" : "px-2"} ${selected ? "bg-primary/10 ring-1 ring-primary/25" : "hover:bg-muted/50"}`
    : `flex w-full items-start gap-2 rounded-lg py-2 text-left text-sm transition-colors ${nested ? "pl-4 pr-2" : "px-2"} ${selected ? "bg-primary/10 ring-1 ring-primary/25" : "hover:bg-muted/50"}`;
  const itemBody = `
    <button
      type="button"
      data-pp-col-select="${escapeHtml(key)}"
      data-pp-level="${level ?? ""}"
      class="${selectBtnClass}"
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
          ${mountBadge}
          <span class="min-w-0 flex-1 truncate ${level === 4 ? "text-muted-foreground" : "font-medium text-card-foreground"}">${escapeHtml(title)}</span>
          ${countBadge}
        </span>
        ${showL4AccessMode ? renderL4EditableCheckbox(key, selection, checked && !indeterminate) : ""}
      </span>
    </button>`;
  if (!customL1NodeId) {
    const body = itemBody;
    return sortable && level != null ? wrapSortableRow(key, level, body) : body;
  }
  const wrapped = `<div class="flex w-full items-start gap-0.5">${itemBody}<div class="flex shrink-0 flex-col gap-0.5 py-2 pr-1">
        <button type="button" data-nb-edit-l1="${escapeHtml(customL1NodeId)}" class="text-xs text-primary hover:underline whitespace-nowrap">编辑</button>
        <button type="button" data-nb-delete-l1="${escapeHtml(customL1NodeId)}" class="text-xs text-destructive hover:underline whitespace-nowrap">删除</button>
      </div></div>`;
  return sortable && level != null ? wrapSortableRow(key, level, wrapped) : wrapped;
}

function renderFourColumnL3(
  l2Node: PermissionTreeNode | undefined,
  activeL3: string,
  selection: Record<string, PlatformPresetNodeSelection>,
  index: FourColumnTreeIndex,
  filter: string,
  matrixMode: FourColumnMatrixMode = "platform-preset",
  flatOrder?: string[],
  sortable = false,
): string {
  return renderL3Column(l2Node, activeL3, (node, nested) => {
    const isMountedPage =
      matrixMode === "platform-preset" && node.resource.key.endsWith(":mounted-page-l3");
    const isCustomL3 =
      matrixMode === "platform-preset" &&
      Boolean(node.resource.groupKey?.startsWith("custom-3-") || node.resource.key.includes("custom-3-"));
    return renderFourColumnItem(
      node.resource.key,
      formatGroupNavLabel(pickNodeTitle(node.resource.title, node.resource.titleEn)),
      node.resource.key === activeL3,
      selection,
      index,
      {
        level: 3,
        childCount: node.children.length,
        nested,
        filter,
        mountTag: isCustomL3 || isMountedPage ? node.resource.customL3MountKind : undefined,
        displayOnly: isMountedPage,
        sortable,
      },
    );
  }, flatOrder);
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
  matrixRenderOpts?: FourColumnMatrixRenderOpts,
): { col1: string; col2: string; col3: string; col4: string } {
  const sortable = matrixRenderOpts?.enableSiblingSort ?? false;
  const l3FlatOrder =
    sortable && activeL2 ? matrixRenderOpts?.structureOrder?.l3?.[activeL2] : undefined;
  const l1Node = index.groups.find((g) => g.moduleKey === activeL1)?.tree;
  const l2Node = findL2Node(index.groups, activeL2);
  const l3Node = findL3Node(index.groups, activeL3);

  const col1 = index.groups
    .map((g) => {
      const isCustomL1 = matrixMode === "platform-preset" && g.moduleId.startsWith("custom-1-");
      return renderFourColumnItem(
        g.moduleKey,
        pickNodeTitle(g.moduleTitle, g.moduleTitleEn),
        g.moduleKey === activeL1,
        selection,
        index,
        {
          tier: tierForModule?.(g.moduleId),
          level: 1,
          filter,
          mountTag: g.customL1MountKind,
          customL1NodeId: isCustomL1 ? g.moduleId : undefined,
          sortable,
        },
      );
    })
    .filter(Boolean)
    .join("");

  const col2 = (l1Node?.children ?? [])
    .map((c) => {
      const isCustomL2 = matrixMode === "platform-preset" && c.resource.key.startsWith("custom-2-");
      const isMountedPage =
        matrixMode === "platform-preset" && c.resource.key.endsWith(":mounted-page");
      return renderFourColumnItem(
        c.resource.key,
        pickNodeTitle(c.resource.title, c.resource.titleEn),
        c.resource.key === activeL2,
        selection,
        index,
        {
          level: 2,
          filter,
          mountTag: isCustomL2 || isMountedPage ? c.resource.customL2MountKind : undefined,
          displayOnly: isMountedPage,
          sortable: sortable && !isMountedPage,
        },
      );
    })
    .filter(Boolean)
    .join("");

  const col3Raw = renderFourColumnL3(
    l2Node,
    activeL3,
    selection,
    index,
    filter,
    matrixMode,
    l3FlatOrder,
    sortable,
  );
  let col3 = col3Raw;
  if (
    matrixMode === "platform-preset" &&
    l2Node?.resource.key.endsWith(":mounted-page")
  ) {
    col3 = col3Raw;
  } else if (
    matrixMode === "platform-preset" &&
    l2Node?.resource.key.startsWith("custom-2-") &&
    l2Node.resource.customL2MountKind === "page" &&
    !col3Raw.trim()
  ) {
    col3 = col3Raw;
  } else if (matrixMode === "nav-blueprint-system" && l2Node && !l2Node.children.length) {
    col3 = `<p class="p-3 text-xs leading-relaxed text-muted-foreground">该入口为业务页面，勾选「二级导航」即可控制是否展示。新建、编辑、删除、导出、审核等操作按钮不在导航蓝图内配置（由权限角色单独管理）。</p>`;
  } else if (matrixMode === "nav-blueprint-system" && l2Node && l2Node.children.length && !col3Raw.trim()) {
    col3 = `<p class="p-3 text-xs text-muted-foreground">请选择三级分组</p>`;
  }

  let col4 = (l3Node?.children ?? [])
    .map((c) =>
      renderFourColumnItem(
        c.resource.key,
        pickNodeTitle(c.resource.title, c.resource.titleEn),
        false,
        selection,
        index,
        { level: 4, showL4AccessMode: matrixMode === "rbac", filter, sortable },
      ),
    )
    .filter(Boolean)
    .join("");

  if (matrixMode === "nav-blueprint-system" && l2Node?.children.length && !l3Node) {
    col4 = `<p class="p-3 text-xs text-muted-foreground">请先选择设置类三级分组</p>`;
  } else if (matrixMode === "nav-blueprint-system" && l3Node && !col4.trim()) {
    col4 = `<p class="p-3 text-xs text-muted-foreground">该分组下暂无设置项</p>`;
  }

  return { col1, col2, col3, col4 };
}

export function renderFourColumnMatrixShell(
  col1: string,
  col2: string,
  col3: string,
  col4: string,
  headers: readonly string[] = FOUR_COLUMN_HEADERS,
): string {
  const empty = (text: string) => `<p class="p-3 text-sm text-muted-foreground">${text}</p>`;
  return `
    <div class="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
      <div class="flex min-h-0 flex-col">
        <p data-pp-col-header="1" class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${headers[0]}</p>
        <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="1">${col1 || empty("无模块")}</div>
      </div>
      <div class="flex min-h-0 flex-col">
        <p data-pp-col-header="2" class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${headers[1]}</p>
        <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="2">${col2 || empty("请选择一级导航")}</div>
      </div>
      <div class="flex min-h-0 flex-col">
        <p data-pp-col-header="3" class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${headers[2]}</p>
        <div class="pp-col-scroll min-h-0 flex-1 overflow-y-auto p-1 space-y-0.5" data-pp-col="3">${col3 || empty("请选择二级导航")}</div>
      </div>
      <div class="flex min-h-0 flex-col">
        <p data-pp-col-header="4" class="shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">${headers[3]}</p>
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
  matrixOpts?: { preserveEmptyL2?: boolean; preserveEmptyL3?: boolean } & FourColumnMatrixRenderOpts,
): void {
  let l1 = root.dataset.activeL1 ?? index.groups[0]?.moduleKey ?? "";
  let l2 = root.dataset.activeL2 ?? "";
  let l3 = root.dataset.activeL3 ?? "";

  const l1Node = index.groups.find((g) => g.moduleKey === l1)?.tree;
  const preserveEmptyL2 = matrixOpts?.preserveEmptyL2 && root.dataset.activeL2 === "";
  if (!preserveEmptyL2 && (!l2 || !l1Node?.children.some((c) => c.resource.key === l2))) {
    l2 = l1Node?.children[0]?.resource.key ?? "";
    root.dataset.activeL2 = l2;
  }
  const l2Node = findL2Node(index.groups, l2);
  const preserveEmptyL3 = matrixOpts?.preserveEmptyL3 && root.dataset.activeL3 === "";
  if (!preserveEmptyL3 && (!l3 || !l2Node?.children.some((c) => c.resource.key === l3))) {
    l3 = l2Node?.children[0]?.resource.key ?? "";
    root.dataset.activeL3 = l3;
  }

  const headers = resolveFourColumnHeaders(l2Node);

  const { col1, col2, col3, col4 } = renderFourColumnMatrix(
    selection,
    index,
    l1,
    l2,
    l3,
    filter,
    tierForModule,
    matrixMode,
    matrixOpts,
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

  const col3Header = root.querySelector<HTMLElement>('[data-pp-col-header="3"]');
  if (col3Header) col3Header.textContent = headers[2] ?? FOUR_COLUMN_HEADERS[2];

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
