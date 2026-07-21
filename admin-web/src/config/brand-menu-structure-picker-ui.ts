/**
 * 店中店 · 品牌菜单 · 组 / 类 / 菜三级选择（对齐平台预设一/二/三级列式交互）
 * 品牌编辑可启用左侧产线列（Kiosk / eMenu / SDI），各产线独立商品树与勾选。
 * 原型数据，后续对接商品中心菜单 API。
 */

export type BrandMenuDishNode = {
  id: string;
  name: string;
};

export type BrandMenuCategoryNode = {
  id: string;
  name: string;
  dishes: BrandMenuDishNode[];
};

export type BrandMenuGroupNode = {
  id: string;
  name: string;
  categories: BrandMenuCategoryNode[];
};

export type BrandMenuStructureSelection = Record<string, boolean>;

/** 品牌菜单产线（组左侧列） */
export const BRAND_MENU_LINE_OPTIONS = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type BrandMenuLineId = (typeof BRAND_MENU_LINE_OPTIONS)[number]["id"];

export type BrandMenuStructureByLine = Record<BrandMenuLineId, string[]>;

export const DEFAULT_BRAND_MENU_LINE_ID: BrandMenuLineId = "kiosk";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cloneTree(tree: BrandMenuGroupNode[]): BrandMenuGroupNode[] {
  return tree.map((g) => ({
    id: g.id,
    name: g.name,
    categories: g.categories.map((c) => ({
      id: c.id,
      name: c.name,
      dishes: c.dishes.map((d) => ({ id: d.id, name: d.name })),
    })),
  }));
}

/** 品类/分类等共用的完整组类菜树 */
export const BRAND_MENU_STRUCTURE_TREE: BrandMenuGroupNode[] = [
  {
    id: "g-hotpot",
    name: "火锅",
    categories: [
      {
        id: "c-hotpot-base",
        name: "锅底",
        dishes: [
          { id: "d-pot-single", name: "单锅" },
          { id: "d-pot-yinyang", name: "鸳鸯锅" },
          { id: "d-pot-run", name: "奔跑锅" },
        ],
      },
      {
        id: "c-hotpot-meat",
        name: "肉类",
        dishes: [
          { id: "d-beef-premium", name: "极品肥牛" },
          { id: "d-pork-belly", name: "五花肉" },
          { id: "d-combo-1", name: "牛羊组合" },
        ],
      },
      {
        id: "c-hotpot-veg",
        name: "蔬菜",
        dishes: [
          { id: "d-lettuce", name: "油麦菜" },
          { id: "d-tofu", name: "豆腐" },
          { id: "d-mushroom", name: "香菇" },
        ],
      },
    ],
  },
  {
    id: "g-chinese",
    name: "中餐",
    categories: [
      {
        id: "c-chinese-hot",
        name: "热菜",
        dishes: [
          { id: "d-kungpao", name: "宫保鸡丁" },
          { id: "d-mapo", name: "麻婆豆腐" },
          { id: "d-fish", name: "清蒸鲈鱼" },
        ],
      },
      {
        id: "c-chinese-cold",
        name: "冷菜",
        dishes: [
          { id: "d-cucumber", name: "拍黄瓜" },
          { id: "d-jelly", name: "皮蛋豆腐" },
        ],
      },
      {
        id: "c-chinese-staple",
        name: "主食",
        dishes: [
          { id: "d-rice", name: "白米饭" },
          { id: "d-noodles", name: "阳春面" },
        ],
      },
    ],
  },
  {
    id: "g-japanese",
    name: "日料",
    categories: [
      {
        id: "c-jp-sushi",
        name: "寿司",
        dishes: [
          { id: "d-salmon", name: "三文鱼寿司" },
          { id: "d-tuna", name: "金枪鱼寿司" },
        ],
      },
      {
        id: "c-jp-ramen",
        name: "拉面",
        dishes: [
          { id: "d-tonkotsu", name: "豚骨拉面" },
          { id: "d-miso", name: "味噌拉面" },
        ],
      },
    ],
  },
  {
    id: "g-drink",
    name: "饮品",
    categories: [
      {
        id: "c-drink-hot",
        name: "热饮",
        dishes: [
          { id: "d-tea", name: "热茶" },
          { id: "d-coffee", name: "美式咖啡" },
        ],
      },
      {
        id: "c-drink-cold",
        name: "冷饮",
        dishes: [
          { id: "d-cola", name: "可乐" },
          { id: "d-juice", name: "鲜榨橙汁" },
        ],
      },
    ],
  },
];

/** 各产线各自商品树（原型：范围与命名略有差异） */
export const BRAND_MENU_STRUCTURE_BY_LINE: Record<BrandMenuLineId, BrandMenuGroupNode[]> = {
  kiosk: (() => {
    const tree = cloneTree(BRAND_MENU_STRUCTURE_TREE).filter((g) =>
      ["g-hotpot", "g-drink"].includes(g.id),
    );
    for (const g of tree) {
      for (const c of g.categories) {
        for (const d of c.dishes) d.name = `${d.name}（Kiosk）`;
      }
    }
    return tree;
  })(),
  emenu: (() => {
    const tree = cloneTree(BRAND_MENU_STRUCTURE_TREE).filter((g) =>
      ["g-chinese", "g-japanese", "g-drink"].includes(g.id),
    );
    for (const g of tree) {
      for (const c of g.categories) {
        for (const d of c.dishes) d.name = `${d.name}（eMenu）`;
      }
    }
    return tree;
  })(),
  sdi: (() => {
    const tree = cloneTree(BRAND_MENU_STRUCTURE_TREE).filter((g) =>
      ["g-chinese", "g-drink"].includes(g.id),
    );
    for (const g of tree) {
      for (const c of g.categories) {
        for (const d of c.dishes) d.name = `${d.name}（SDI）`;
      }
    }
    return tree;
  })(),
};

export function emptyBrandMenuStructureByLine(): BrandMenuStructureByLine {
  return { kiosk: [], emenu: [], sdi: [] };
}

export function isBrandMenuLineId(value: string): value is BrandMenuLineId {
  return BRAND_MENU_LINE_OPTIONS.some((l) => l.id === value);
}

export function normalizeBrandMenuStructureByLine(raw: unknown): BrandMenuStructureByLine {
  const empty = emptyBrandMenuStructureByLine();
  if (!raw || typeof raw !== "object") return empty;
  const obj = raw as Record<string, unknown>;
  for (const line of BRAND_MENU_LINE_OPTIONS) {
    const keys = obj[line.id];
    if (!Array.isArray(keys)) continue;
    empty[line.id] = [
      ...new Set(keys.filter((k): k is string => typeof k === "string" && k.length > 0)),
    ];
  }
  return empty;
}

/** 优先读按产线结构；若无则把旧版全局 keys 复制到三产线 */
export function coerceBrandMenuStructureByLine(
  byLineRaw: unknown,
  legacyKeysRaw?: unknown,
): BrandMenuStructureByLine {
  const byLine = normalizeBrandMenuStructureByLine(byLineRaw);
  if (Object.values(byLine).some((keys) => keys.length > 0)) return byLine;
  if (!Array.isArray(legacyKeysRaw)) return emptyBrandMenuStructureByLine();
  const legacy = [
    ...new Set(legacyKeysRaw.filter((k): k is string => typeof k === "string" && k.length > 0)),
  ];
  if (legacy.length === 0) return emptyBrandMenuStructureByLine();
  return { kiosk: [...legacy], emenu: [...legacy], sdi: [...legacy] };
}

export function flattenBrandMenuStructureByLine(byLine: BrandMenuStructureByLine): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of BRAND_MENU_LINE_OPTIONS) {
    for (const key of byLine[line.id] ?? []) {
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

export function groupKey(groupId: string): string {
  return `g:${groupId}`;
}

export function categoryKey(groupId: string, categoryId: string): string {
  return `c:${groupId}:${categoryId}`;
}

export function dishKey(groupId: string, categoryId: string, dishId: string): string {
  return `d:${groupId}:${categoryId}:${dishId}`;
}

function resolveTree(lineId?: BrandMenuLineId | null): BrandMenuGroupNode[] {
  if (lineId && BRAND_MENU_STRUCTURE_BY_LINE[lineId]) {
    return BRAND_MENU_STRUCTURE_BY_LINE[lineId];
  }
  return BRAND_MENU_STRUCTURE_TREE;
}

function findGroup(
  groupId: string,
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): BrandMenuGroupNode | undefined {
  return tree.find((g) => g.id === groupId);
}

function findCategory(
  groupId: string,
  categoryId: string,
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): BrandMenuCategoryNode | undefined {
  return findGroup(groupId, tree)?.categories.find((c) => c.id === categoryId);
}

/** 节点及其全部后代 key（不含自身时仍返回后代） */
export function getBrandMenuDescendantKeys(
  key: string,
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): string[] {
  if (key.startsWith("g:")) {
    const groupId = key.slice(2);
    const group = findGroup(groupId, tree);
    if (!group) return [];
    const out: string[] = [];
    for (const cat of group.categories) {
      out.push(categoryKey(groupId, cat.id));
      for (const dish of cat.dishes) {
        out.push(dishKey(groupId, cat.id, dish.id));
      }
    }
    return out;
  }
  if (key.startsWith("c:")) {
    const parts = key.split(":");
    const groupId = parts[1] ?? "";
    const categoryId = parts[2] ?? "";
    const cat = findCategory(groupId, categoryId, tree);
    if (!cat) return [];
    return cat.dishes.map((d) => dishKey(groupId, categoryId, d.id));
  }
  return [];
}

export function cascadeBrandMenuSelection(
  selection: BrandMenuStructureSelection,
  key: string,
  enabled: boolean,
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): BrandMenuStructureSelection {
  const next = { ...selection, [key]: enabled };
  for (const d of getBrandMenuDescendantKeys(key, tree)) {
    next[d] = enabled;
  }
  if (key.startsWith("d:")) {
    const [, groupId = "", categoryId = ""] = key.split(":");
    syncParentCategory(next, groupId, categoryId, tree);
    syncParentGroup(next, groupId, tree);
  } else if (key.startsWith("c:")) {
    const [, groupId = ""] = key.split(":");
    syncParentGroup(next, groupId, tree);
  }
  return next;
}

function syncParentCategory(
  selection: BrandMenuStructureSelection,
  groupId: string,
  categoryId: string,
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): void {
  const cat = findCategory(groupId, categoryId, tree);
  if (!cat) return;
  const dishKeys = cat.dishes.map((d) => dishKey(groupId, categoryId, d.id));
  const enabledCount = dishKeys.filter((k) => selection[k]).length;
  selection[categoryKey(groupId, categoryId)] =
    enabledCount === dishKeys.length && dishKeys.length > 0;
}

function syncParentGroup(
  selection: BrandMenuStructureSelection,
  groupId: string,
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): void {
  const group = findGroup(groupId, tree);
  if (!group) return;
  const catKeys = group.categories.map((c) => categoryKey(groupId, c.id));
  const enabledCount = catKeys.filter((k) => selection[k]).length;
  const allCatsFull = enabledCount === catKeys.length && catKeys.length > 0;
  selection[groupKey(groupId)] = allCatsFull;
}

export function brandMenuCheckboxState(
  key: string,
  selection: BrandMenuStructureSelection,
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): { checked: boolean; indeterminate: boolean } {
  const self = !!selection[key];
  const descendants = getBrandMenuDescendantKeys(key, tree);
  if (descendants.length === 0) return { checked: self, indeterminate: false };
  const enabledCount = descendants.filter((d) => selection[d]).length;
  if (enabledCount === descendants.length && descendants.length > 0) {
    return { checked: true, indeterminate: false };
  }
  if (enabledCount === 0) return { checked: false, indeterminate: false };
  return { checked: false, indeterminate: true };
}

export function selectionToKeys(selection: BrandMenuStructureSelection): string[] {
  return Object.keys(selection).filter((k) => selection[k]);
}

export function keysToSelection(
  keys: string[],
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): BrandMenuStructureSelection {
  const selection: BrandMenuStructureSelection = {};
  for (const key of keys) selection[key] = true;
  for (const group of tree) {
    for (const cat of group.categories) {
      syncParentCategory(selection, group.id, cat.id, tree);
    }
    syncParentGroup(selection, group.id, tree);
  }
  return selection;
}

export function formatBrandMenuStructureSummary(
  keys: string[],
  tree: BrandMenuGroupNode[] = BRAND_MENU_STRUCTURE_TREE,
): string {
  if (keys.length === 0) return "—";
  const selection = keysToSelection(keys, tree);
  const names: string[] = [];
  for (const group of tree) {
    const gk = groupKey(group.id);
    const gState = brandMenuCheckboxState(gk, selection, tree);
    if (gState.checked) {
      names.push(group.name);
      continue;
    }
    for (const cat of group.categories) {
      const ck = categoryKey(group.id, cat.id);
      const cState = brandMenuCheckboxState(ck, selection, tree);
      if (cState.checked) {
        names.push(`${group.name}/${cat.name}`);
        continue;
      }
      for (const dish of cat.dishes) {
        const dk = dishKey(group.id, cat.id, dish.id);
        if (selection[dk]) names.push(dish.name);
      }
    }
  }
  if (names.length === 0) return "—";
  const unique = [...new Set(names)];
  if (unique.length <= 3) return unique.join("、");
  return `${unique.slice(0, 3).join("、")} 等 ${unique.length} 项`;
}

export function formatBrandMenuStructureByLineSummary(byLine: BrandMenuStructureByLine): string {
  const parts = BRAND_MENU_LINE_OPTIONS.map((line) => {
    const keys = byLine[line.id] ?? [];
    if (keys.length === 0) return null;
    const summary = formatBrandMenuStructureSummary(keys, resolveTree(line.id));
    if (summary === "—") return null;
    return `${line.label}：${summary}`;
  }).filter((p): p is string => !!p);
  return parts.length > 0 ? parts.join("；") : "—";
}

/** 统计各产线下已勾选的菜品数量（同菜跨产线分别计数） */
export function countBrandMenuStructureDishesByLine(byLine: BrandMenuStructureByLine): number {
  return BRAND_MENU_LINE_OPTIONS.reduce((sum, line) => {
    const tree = resolveTree(line.id);
    const selection = keysToSelection(byLine[line.id] ?? [], tree);
    let n = 0;
    for (const group of tree) {
      for (const cat of group.categories) {
        for (const dish of cat.dishes) {
          if (selection[dishKey(group.id, cat.id, dish.id)]) n += 1;
        }
      }
    }
    return sum + n;
  }, 0);
}

function renderStructureItem(
  key: string,
  title: string,
  selected: boolean,
  selection: BrandMenuStructureSelection,
  tree: BrandMenuGroupNode[],
  opts?: { childCount?: number; readOnly?: boolean },
): string {
  const { checked, indeterminate } = brandMenuCheckboxState(key, selection, tree);
  const countBadge =
    opts?.childCount != null
      ? `<span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">${opts.childCount}</span>`
      : "";
  const disabledAttr = opts?.readOnly ? "disabled" : "";
  return `
    <button
      type="button"
      data-brand-menu-col-select="${escapeHtml(key)}"
      class="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
        selected ? "bg-primary/10 ring-1 ring-primary/25" : "hover:bg-muted/50"
      }"
    >
      <input
        type="checkbox"
        class="brand-menu-enable-cb mt-0.5 size-4 shrink-0 accent-primary"
        data-brand-menu-enable="${escapeHtml(key)}"
        ${checked ? "checked" : ""}
        ${indeterminate ? 'data-indeterminate="1"' : ""}
        ${disabledAttr}
        onclick="event.stopPropagation()"
      />
      <span class="min-w-0 flex-1 truncate font-medium text-card-foreground">${escapeHtml(title)}</span>
      ${countBadge}
    </button>`;
}

function renderLineItem(lineId: BrandMenuLineId, label: string, selected: boolean, selectedCount: number): string {
  return `
    <button
      type="button"
      data-brand-menu-line-select="${escapeHtml(lineId)}"
      class="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
        selected ? "bg-primary/10 ring-1 ring-primary/25" : "hover:bg-muted/50"
      }"
    >
      <span class="min-w-0 flex-1 truncate font-medium text-card-foreground">${escapeHtml(label)}</span>
      <span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">${selectedCount}</span>
    </button>`;
}

export type RenderBrandMenuStructurePickerOptions = {
  enableLines?: boolean;
  selectionByLine?: BrandMenuStructureByLine;
  activeLineId?: BrandMenuLineId;
  /** 只读：可切换产线/组/类浏览，不可勾选 */
  readOnly?: boolean;
  /** 固定使用某产线商品树，且不展示产线列（宿主已按产线分栏时） */
  treeLineId?: BrandMenuLineId;
};

export function renderBrandMenuStructurePickerHtml(
  selectedKeys: string[],
  activeGroupId?: string,
  activeCategoryId?: string,
  options?: RenderBrandMenuStructurePickerOptions,
): string {
  const enableLines = !!options?.enableLines;
  const readOnly = !!options?.readOnly;
  const treeLineId =
    options?.treeLineId && isBrandMenuLineId(options.treeLineId) ? options.treeLineId : null;
  const byLine = normalizeBrandMenuStructureByLine(
    options?.selectionByLine ?? (enableLines ? emptyBrandMenuStructureByLine() : undefined),
  );
  const activeLine: BrandMenuLineId =
    enableLines && options?.activeLineId && isBrandMenuLineId(options.activeLineId)
      ? options.activeLineId
      : DEFAULT_BRAND_MENU_LINE_ID;

  const tree = treeLineId
    ? resolveTree(treeLineId)
    : enableLines
      ? resolveTree(activeLine)
      : BRAND_MENU_STRUCTURE_TREE;
  const lineKeys = enableLines ? (byLine[activeLine] ?? []) : selectedKeys;
  const selection = keysToSelection(lineKeys, tree);
  const groups = tree;
  const activeG = activeGroupId && findGroup(activeGroupId, tree) ? activeGroupId : groups[0]?.id ?? "";
  const group = findGroup(activeG, tree);
  const activeC =
    activeCategoryId && group?.categories.some((c) => c.id === activeCategoryId)
      ? activeCategoryId
      : group?.categories[0]?.id ?? "";

  const colLine = enableLines
    ? BRAND_MENU_LINE_OPTIONS.map((line) =>
        renderLineItem(line.id, line.label, line.id === activeLine, byLine[line.id]?.length ?? 0),
      ).join("")
    : "";

  const col1 = groups
    .map((g) =>
      renderStructureItem(groupKey(g.id), g.name, g.id === activeG, selection, tree, {
        childCount: g.categories.length,
        readOnly,
      }),
    )
    .join("");

  const col2 = (group?.categories ?? [])
    .map((c) =>
      renderStructureItem(categoryKey(activeG, c.id), c.name, c.id === activeC, selection, tree, {
        childCount: c.dishes.length,
        readOnly,
      }),
    )
    .join("");

  const category = findCategory(activeG, activeC, tree);
  const col3 = (category?.dishes ?? [])
    .map((d) =>
      renderStructureItem(dishKey(activeG, activeC, d.id), d.name, false, selection, tree, {
        readOnly,
      }),
    )
    .join("");

  const empty = (text: string) => `<p class="p-3 text-sm text-muted-foreground">${text}</p>`;
  const gridClass = enableLines
    ? "grid min-h-[14rem] grid-cols-1 divide-y divide-border sm:grid-cols-4 sm:divide-x sm:divide-y-0"
    : "grid min-h-[14rem] grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0";

  const hiddenValue = enableLines
    ? escapeHtml(JSON.stringify(byLine))
    : escapeHtml(JSON.stringify(selectedKeys));
  const hiddenAttr = enableLines
    ? "data-brand-menu-structure-by-line"
    : "data-brand-menu-structure-keys";

  return `
    <div
      class="overflow-hidden rounded-md border border-border"
      data-brand-menu-structure-picker
      ${enableLines ? 'data-enable-lines="1"' : ""}
      ${readOnly ? 'data-read-only="1"' : ""}
      ${treeLineId ? `data-tree-line="${escapeHtml(treeLineId)}"` : ""}
      data-active-line="${escapeHtml(activeLine)}"
      data-active-group="${escapeHtml(activeG)}"
      data-active-category="${escapeHtml(activeC)}"
    >
      <input type="hidden" ${hiddenAttr} value="${hiddenValue}" />
      <div class="${gridClass}">
        ${
          enableLines
            ? `<div class="flex min-h-0 flex-col">
          <p class="shrink-0 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">产线</p>
          <div class="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1" data-brand-menu-col="line">${colLine}</div>
        </div>`
            : ""
        }
        <div class="flex min-h-0 flex-col">
          <p class="shrink-0 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">组</p>
          <div class="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1" data-brand-menu-col="group">${col1 || empty("暂无分组")}</div>
        </div>
        <div class="flex min-h-0 flex-col">
          <p class="shrink-0 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">类</p>
          <div class="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1" data-brand-menu-col="category">${col2 || empty("请选择组")}</div>
        </div>
        <div class="flex min-h-0 flex-col">
          <p class="shrink-0 border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">菜</p>
          <div class="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1" data-brand-menu-col="dish">${col3 || empty("请选择分类")}</div>
        </div>
      </div>
    </div>`;
}

export function syncBrandMenuStructureIndeterminate(root: ParentNode): void {
  root.querySelectorAll<HTMLInputElement>(".brand-menu-enable-cb[data-indeterminate]").forEach((cb) => {
    cb.indeterminate = true;
  });
}

export function readBrandMenuStructureKeysFromPicker(picker: HTMLElement): string[] {
  const raw = picker.querySelector<HTMLInputElement>("[data-brand-menu-structure-keys]")?.value ?? "[]";
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is string => typeof k === "string");
  } catch {
    return [];
  }
}

export function readBrandMenuStructureByLineFromPicker(picker: HTMLElement): BrandMenuStructureByLine {
  const raw =
    picker.querySelector<HTMLInputElement>("[data-brand-menu-structure-by-line]")?.value ?? "{}";
  try {
    return normalizeBrandMenuStructureByLine(JSON.parse(raw) as unknown);
  } catch {
    return emptyBrandMenuStructureByLine();
  }
}

function pickerUsesLines(picker: HTMLElement): boolean {
  return picker.getAttribute("data-enable-lines") === "1";
}

function pickerTreeLineId(picker: HTMLElement): BrandMenuLineId | null {
  const raw = picker.getAttribute("data-tree-line") ?? "";
  return isBrandMenuLineId(raw) ? raw : null;
}

function resolvePickerTree(picker: HTMLElement): BrandMenuGroupNode[] {
  const treeLine = pickerTreeLineId(picker);
  if (treeLine) return resolveTree(treeLine);
  if (pickerUsesLines(picker)) {
    const activeLineRaw = picker.dataset.activeLine ?? DEFAULT_BRAND_MENU_LINE_ID;
    const activeLine = isBrandMenuLineId(activeLineRaw) ? activeLineRaw : DEFAULT_BRAND_MENU_LINE_ID;
    return resolveTree(activeLine);
  }
  return BRAND_MENU_STRUCTURE_TREE;
}

/** 在品牌弹窗内绑定组/类/菜三列选择（事件委托到 picker 根）；启用产线时含产线列切换 */
export function bindBrandMenuStructurePicker(picker: HTMLElement): void {
  if (picker.dataset.brandMenuStructureBound === "1") return;
  picker.dataset.brandMenuStructureBound = "1";

  const rerender = (
    keysOrByLine: string[] | BrandMenuStructureByLine,
    activeGroup: string,
    activeCategory: string,
    activeLine?: BrandMenuLineId,
  ) => {
    const enableLines = pickerUsesLines(picker);
    const readOnly = picker.dataset.readOnly === "1";
    const treeLineId = pickerTreeLineId(picker);
    const html = enableLines
      ? renderBrandMenuStructurePickerHtml([], activeGroup, activeCategory, {
          enableLines: true,
          selectionByLine: keysOrByLine as BrandMenuStructureByLine,
          activeLineId: activeLine ?? DEFAULT_BRAND_MENU_LINE_ID,
          readOnly,
        })
      : renderBrandMenuStructurePickerHtml(keysOrByLine as string[], activeGroup, activeCategory, {
          readOnly,
          treeLineId: treeLineId ?? undefined,
        });
    const wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    const next = wrap.firstElementChild as HTMLElement | null;
    if (!next) return;
    picker.replaceWith(next);
    syncBrandMenuStructureIndeterminate(next);
    bindBrandMenuStructurePicker(next);
  };

  picker.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const lineBtn = target.closest<HTMLElement>("[data-brand-menu-line-select]");
    if (lineBtn && pickerUsesLines(picker)) {
      const lineId = lineBtn.getAttribute("data-brand-menu-line-select") ?? "";
      if (!isBrandMenuLineId(lineId)) return;
      const byLine = readBrandMenuStructureByLineFromPicker(picker);
      const tree = resolveTree(lineId);
      rerender(byLine, tree[0]?.id ?? "", tree[0]?.categories[0]?.id ?? "", lineId);
      return;
    }

    const selectBtn = target.closest<HTMLElement>("[data-brand-menu-col-select]");
    if (!selectBtn || target.closest("[data-brand-menu-enable]")) return;
    const key = selectBtn.getAttribute("data-brand-menu-col-select") ?? "";
    const enableLines = pickerUsesLines(picker);
    const activeLineRaw = picker.dataset.activeLine ?? DEFAULT_BRAND_MENU_LINE_ID;
    const activeLine = isBrandMenuLineId(activeLineRaw) ? activeLineRaw : DEFAULT_BRAND_MENU_LINE_ID;
    const tree = resolvePickerTree(picker);
    const keys = enableLines
      ? readBrandMenuStructureByLineFromPicker(picker)
      : readBrandMenuStructureKeysFromPicker(picker);

    if (key.startsWith("g:")) {
      const groupId = key.slice(2);
      const group = findGroup(groupId, tree);
      if (enableLines) {
        rerender(keys as BrandMenuStructureByLine, groupId, group?.categories[0]?.id ?? "", activeLine);
      } else {
        rerender(keys as string[], groupId, group?.categories[0]?.id ?? "");
      }
      return;
    }
    if (key.startsWith("c:")) {
      const parts = key.split(":");
      const groupId = parts[1] ?? "";
      const categoryId = parts[2] ?? "";
      if (enableLines) {
        rerender(keys as BrandMenuStructureByLine, groupId, categoryId, activeLine);
      } else {
        rerender(keys as string[], groupId, categoryId);
      }
    }
  });

  picker.addEventListener("change", (e) => {
    if (picker.dataset.readOnly === "1") return;
    const input = e.target as HTMLInputElement;
    if (!input.matches("[data-brand-menu-enable]")) return;
    const key = input.getAttribute("data-brand-menu-enable");
    if (!key) return;
    const enableLines = pickerUsesLines(picker);
    const activeLineRaw = picker.dataset.activeLine ?? DEFAULT_BRAND_MENU_LINE_ID;
    const activeLine = isBrandMenuLineId(activeLineRaw) ? activeLineRaw : DEFAULT_BRAND_MENU_LINE_ID;
    const tree = resolvePickerTree(picker);
    const activeGroup = picker.dataset.activeGroup ?? "";
    const activeCategory = picker.dataset.activeCategory ?? "";

    if (enableLines) {
      const byLine = readBrandMenuStructureByLineFromPicker(picker);
      const prevKeys = byLine[activeLine] ?? [];
      const nextSelection = cascadeBrandMenuSelection(
        keysToSelection(prevKeys, tree),
        key,
        input.checked,
        tree,
      );
      const nextKeys = selectionToKeys(nextSelection);
      rerender({ ...byLine, [activeLine]: nextKeys }, activeGroup, activeCategory, activeLine);
      return;
    }

    const prevKeys = readBrandMenuStructureKeysFromPicker(picker);
    const nextSelection = cascadeBrandMenuSelection(
      keysToSelection(prevKeys, tree),
      key,
      input.checked,
      tree,
    );
    const nextKeys = selectionToKeys(nextSelection);
    rerender(nextKeys, activeGroup, activeCategory);
  });

  syncBrandMenuStructureIndeterminate(picker);
}
