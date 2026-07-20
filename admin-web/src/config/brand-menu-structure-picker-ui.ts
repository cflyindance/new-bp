/**
 * 店中店 · 品牌菜单 · 组 / 类 / 菜三级选择（对齐平台预设一/二/三级列式交互）
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 原型：组 → 类 → 菜 */
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

export function groupKey(groupId: string): string {
  return `g:${groupId}`;
}

export function categoryKey(groupId: string, categoryId: string): string {
  return `c:${groupId}:${categoryId}`;
}

export function dishKey(groupId: string, categoryId: string, dishId: string): string {
  return `d:${groupId}:${categoryId}:${dishId}`;
}

function findGroup(groupId: string): BrandMenuGroupNode | undefined {
  return BRAND_MENU_STRUCTURE_TREE.find((g) => g.id === groupId);
}

function findCategory(
  groupId: string,
  categoryId: string,
): BrandMenuCategoryNode | undefined {
  return findGroup(groupId)?.categories.find((c) => c.id === categoryId);
}

/** 节点及其全部后代 key（不含自身时仍返回后代） */
export function getBrandMenuDescendantKeys(key: string): string[] {
  if (key.startsWith("g:")) {
    const groupId = key.slice(2);
    const group = findGroup(groupId);
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
    const cat = findCategory(groupId, categoryId);
    if (!cat) return [];
    return cat.dishes.map((d) => dishKey(groupId, categoryId, d.id));
  }
  return [];
}

export function cascadeBrandMenuSelection(
  selection: BrandMenuStructureSelection,
  key: string,
  enabled: boolean,
): BrandMenuStructureSelection {
  const next = { ...selection, [key]: enabled };
  for (const d of getBrandMenuDescendantKeys(key)) {
    next[d] = enabled;
  }
  // 向上回写父节点：全选则勾选，部分则不勾（半选由 UI indeterminate 表示）
  if (key.startsWith("d:")) {
    const [, groupId = "", categoryId = ""] = key.split(":");
    syncParentCategory(next, groupId, categoryId);
    syncParentGroup(next, groupId);
  } else if (key.startsWith("c:")) {
    const [, groupId = ""] = key.split(":");
    syncParentGroup(next, groupId);
  }
  return next;
}

function syncParentCategory(
  selection: BrandMenuStructureSelection,
  groupId: string,
  categoryId: string,
): void {
  const cat = findCategory(groupId, categoryId);
  if (!cat) return;
  const dishKeys = cat.dishes.map((d) => dishKey(groupId, categoryId, d.id));
  const enabledCount = dishKeys.filter((k) => selection[k]).length;
  selection[categoryKey(groupId, categoryId)] = enabledCount === dishKeys.length && dishKeys.length > 0;
}

function syncParentGroup(selection: BrandMenuStructureSelection, groupId: string): void {
  const group = findGroup(groupId);
  if (!group) return;
  const catKeys = group.categories.map((c) => categoryKey(groupId, c.id));
  const enabledCount = catKeys.filter((k) => selection[k]).length;
  // 组勾选：其下所有类全选；若仅部分类全选则组不勾（半选）
  const allCatsFull = enabledCount === catKeys.length && catKeys.length > 0;
  selection[groupKey(groupId)] = allCatsFull;
}

export function brandMenuCheckboxState(
  key: string,
  selection: BrandMenuStructureSelection,
): { checked: boolean; indeterminate: boolean } {
  const self = !!selection[key];
  const descendants = getBrandMenuDescendantKeys(key);
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

export function keysToSelection(keys: string[]): BrandMenuStructureSelection {
  const selection: BrandMenuStructureSelection = {};
  for (const key of keys) selection[key] = true;
  // 根据叶子回写父级，保证勾选态一致
  for (const group of BRAND_MENU_STRUCTURE_TREE) {
    for (const cat of group.categories) {
      syncParentCategory(selection, group.id, cat.id);
    }
    syncParentGroup(selection, group.id);
  }
  return selection;
}

export function formatBrandMenuStructureSummary(keys: string[]): string {
  if (keys.length === 0) return "—";
  const selection = keysToSelection(keys);
  const names: string[] = [];
  for (const group of BRAND_MENU_STRUCTURE_TREE) {
    const gk = groupKey(group.id);
    const gState = brandMenuCheckboxState(gk, selection);
    if (gState.checked) {
      names.push(group.name);
      continue;
    }
    for (const cat of group.categories) {
      const ck = categoryKey(group.id, cat.id);
      const cState = brandMenuCheckboxState(ck, selection);
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

function renderStructureItem(
  key: string,
  title: string,
  selected: boolean,
  selection: BrandMenuStructureSelection,
  opts?: { childCount?: number },
): string {
  const { checked, indeterminate } = brandMenuCheckboxState(key, selection);
  const countBadge =
    opts?.childCount != null
      ? `<span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">${opts.childCount}</span>`
      : "";
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
        onclick="event.stopPropagation()"
      />
      <span class="min-w-0 flex-1 truncate font-medium text-card-foreground">${escapeHtml(title)}</span>
      ${countBadge}
    </button>`;
}

export function renderBrandMenuStructurePickerHtml(
  selectedKeys: string[],
  activeGroupId?: string,
  activeCategoryId?: string,
): string {
  const selection = keysToSelection(selectedKeys);
  const groups = BRAND_MENU_STRUCTURE_TREE;
  const activeG = activeGroupId && findGroup(activeGroupId) ? activeGroupId : groups[0]?.id ?? "";
  const group = findGroup(activeG);
  const activeC =
    activeCategoryId && group?.categories.some((c) => c.id === activeCategoryId)
      ? activeCategoryId
      : group?.categories[0]?.id ?? "";

  const col1 = groups
    .map((g) =>
      renderStructureItem(groupKey(g.id), g.name, g.id === activeG, selection, {
        childCount: g.categories.length,
      }),
    )
    .join("");

  const col2 = (group?.categories ?? [])
    .map((c) =>
      renderStructureItem(categoryKey(activeG, c.id), c.name, c.id === activeC, selection, {
        childCount: c.dishes.length,
      }),
    )
    .join("");

  const category = findCategory(activeG, activeC);
  const col3 = (category?.dishes ?? [])
    .map((d) =>
      renderStructureItem(dishKey(activeG, activeC, d.id), d.name, false, selection),
    )
    .join("");

  const empty = (text: string) => `<p class="p-3 text-sm text-muted-foreground">${text}</p>`;

  return `
    <div
      class="overflow-hidden rounded-md border border-border"
      data-brand-menu-structure-picker
      data-active-group="${escapeHtml(activeG)}"
      data-active-category="${escapeHtml(activeC)}"
    >
      <input type="hidden" data-brand-menu-structure-keys value="${escapeHtml(JSON.stringify(selectedKeys))}" />
      <div class="grid min-h-[14rem] grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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

/** 在品牌弹窗内绑定组/类/菜三列选择（事件委托到 picker 根） */
export function bindBrandMenuStructurePicker(picker: HTMLElement): void {
  if (picker.dataset.brandMenuStructureBound === "1") return;
  picker.dataset.brandMenuStructureBound = "1";

  const rerender = (keys: string[], activeGroup: string, activeCategory: string) => {
    const html = renderBrandMenuStructurePickerHtml(keys, activeGroup, activeCategory);
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
    const selectBtn = target.closest<HTMLElement>("[data-brand-menu-col-select]");
    if (!selectBtn || target.closest("[data-brand-menu-enable]")) return;
    const key = selectBtn.getAttribute("data-brand-menu-col-select") ?? "";
    const keys = readBrandMenuStructureKeysFromPicker(picker);
    if (key.startsWith("g:")) {
      const groupId = key.slice(2);
      const group = findGroup(groupId);
      rerender(keys, groupId, group?.categories[0]?.id ?? "");
      return;
    }
    if (key.startsWith("c:")) {
      const parts = key.split(":");
      const groupId = parts[1] ?? "";
      const categoryId = parts[2] ?? "";
      rerender(keys, groupId, categoryId);
    }
  });

  picker.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches("[data-brand-menu-enable]")) return;
    const key = input.getAttribute("data-brand-menu-enable");
    if (!key) return;
    const prevKeys = readBrandMenuStructureKeysFromPicker(picker);
    const nextSelection = cascadeBrandMenuSelection(keysToSelection(prevKeys), key, input.checked);
    const nextKeys = selectionToKeys(nextSelection);
    const activeGroup = picker.dataset.activeGroup ?? "";
    const activeCategory = picker.dataset.activeCategory ?? "";
    rerender(nextKeys, activeGroup, activeCategory);
  });

  syncBrandMenuStructureIndeterminate(picker);
}
