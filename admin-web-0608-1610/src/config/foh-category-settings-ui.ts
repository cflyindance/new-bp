/**
 * 前厅管理中心 · 品类设置（自助餐场景：年龄/类别、菜单、营业时间、特殊菜单）
 * 路径：/operations/queue-call/category-settings/*
 */

import {
  readDishTags,
  renderStandaloneDishPickerHtml,
  type DishTag,
} from "./module-settings-dish-rules-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  bindMenuGroupDropdownPickers,
  collectMenuGroupsFromDropdownWithCatalog,
  ensureMenuGroupDropdownDocumentCloseListener,
  renderMenuGroupDropdownHtml,
  type MenuGroupTag,
} from "./module-settings-menu-group-ui";
import {
  expandScheduleActiveDays,
  formatScheduleTimeRange,
  readBusinessHourSchedules,
  STORE_BUSINESS_HOUR_DAY_BADGES,
  type StoreBusinessHourSchedule,
} from "./module-settings-store-business-hours-ui";

export const FOH_CATEGORY_SETTINGS_BASE = "/operations/queue-call/category-settings";

/** 与设置目录 seq 655 对齐，供菜品选择器原型使用 */
const FOH_MENU_PARENT_SEQ = 655;

export const FOH_CATEGORY_SETTINGS_TABS = [
  {
    id: "age-category",
    title: "类别设置",
    titleEn: "Age & category",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/age-category`,
  },
  {
    id: "menu",
    title: "菜单设置",
    titleEn: "Menu settings",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/menu`,
  },
  {
    id: "hours",
    title: "营业时间",
    titleEn: "Business hours",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/hours`,
  },
  {
    id: "special-menu",
    title: "特殊菜单",
    titleEn: "Special menu",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/special-menu`,
  },
] as const;

export type FohCategorySettingsTabId = (typeof FOH_CATEGORY_SETTINGS_TABS)[number]["id"];

const STORAGE_ID = "foh-category-settings:v1";

const AGE_TAG_OPTIONS = ["成人", "儿童", "长者", "未标记"] as const;

const STORE_BUSINESS_HOURS_PATH = "/store/business-hours";

type AgeBand = { id: string; name: string; tag: string };
type MealCategory = { id: string; name: string; /** 引用的门店营业时段 id（seq 418） */ scheduleIds: string[] };

export type MenuComboKey = string;

export type MenuComboConfig = {
  displayName: string;
  viewOnlyMode: "dish" | "category";
  /** 其他年龄×类别组合的 key（仅 viewOnlyMode=category 时） */
  viewOnlyCategoryKeys: MenuComboKey[];
};

export type ComboDefinition = {
  key: MenuComboKey;
  title: string;
  age: AgeBand;
  category: MealCategory;
};

export type FohSpecialMenuEntry = {
  id: string;
  name: string;
  /** 绑定的品牌菜单（seq 548 菜单库） */
  menus: MenuGroupTag[];
};

type FohCategorySettingsState = {
  ages: AgeBand[];
  categories: MealCategory[];
  menuByCombo: Record<MenuComboKey, MenuComboConfig>;
  hoursNote: string;
  specialMenuEnabled: boolean;
  specialMenus: FohSpecialMenuEntry[];
};

const DEFAULT_STATE: FohCategorySettingsState = {
  ages: [
    { id: "age-adult", name: "成人", tag: "成人" },
    { id: "age-child", name: "儿童", tag: "儿童" },
  ],
  categories: [],
  menuByCombo: {},
  hoursNote: "",
  specialMenuEnabled: false,
  specialMenus: [],
};

const FOH_SPECIAL_MENU_TOGGLE_TRACK_ON =
  "bg-primary border-primary shadow-sm";
const FOH_SPECIAL_MENU_TOGGLE_TRACK_OFF =
  "bg-neutral-300 border-neutral-400/80 shadow-inner dark:bg-neutral-600 dark:border-neutral-500";
const FOH_SPECIAL_MENU_TOGGLE_KNOB =
  "bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";

function newSpecialMenuId(): string {
  return `sm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeSpecialMenuEntry(raw: Partial<FohSpecialMenuEntry>): FohSpecialMenuEntry | null {
  if (!raw?.id) return null;
  const menus = Array.isArray(raw.menus)
    ? raw.menus.filter((m): m is MenuGroupTag => !!m && typeof m.id === "string" && typeof m.name === "string")
    : [];
  return {
    id: raw.id,
    name: typeof raw.name === "string" ? raw.name : "",
    menus,
  };
}

function defaultSpecialMenuDemoEntry(): FohSpecialMenuEntry {
  return {
    id: newSpecialMenuId(),
    name: "",
    menus: [
      { id: "menu-shangben-shiitake", name: "上本香菇锅" },
      { id: "menu-single-pot", name: "单锅" },
    ],
  };
}

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultAllDayScheduleIds(schedules: StoreBusinessHourSchedule[]): string[] {
  const allDay = schedules.find((s) => s.name === "All Day");
  if (allDay) return [allDay.id];
  return schedules.length > 0 ? [schedules[0]!.id] : [];
}

function normalizeCategoryScheduleIds(
  raw: Partial<MealCategory> & { hours?: string },
  schedules: StoreBusinessHourSchedule[],
): string[] {
  const validIds = new Set(schedules.map((s) => s.id));
  if (Array.isArray(raw.scheduleIds)) {
    const ids = raw.scheduleIds.filter((id) => typeof id === "string" && validIds.has(id));
    if (ids.length > 0) return ids;
  }
  if (typeof raw.hours === "string" && raw.hours.trim()) {
    const label = raw.hours.trim();
    const matched = schedules.filter(
      (s) => s.name === label || s.name.toLowerCase() === label.toLowerCase(),
    );
    if (matched.length > 0) return matched.map((s) => s.id);
  }
  return defaultAllDayScheduleIds(schedules);
}

function normalizeCategory(raw: Partial<MealCategory> & { hours?: string }): MealCategory | null {
  if (!raw?.id || !raw?.name) return null;
  const schedules = readBusinessHourSchedules();
  return {
    id: raw.id,
    name: raw.name,
    scheduleIds: normalizeCategoryScheduleIds(raw, schedules),
  };
}

function formatCategoryHoursLabel(scheduleIds: string[], schedules: StoreBusinessHourSchedule[]): string {
  if (scheduleIds.length === 0 || schedules.length === 0) return "未设置";
  const selected = schedules.filter((s) => scheduleIds.includes(s.id));
  if (selected.length === 0) return "未设置";
  if (selected.length === 1) return selected[0]!.name;
  return selected.map((s) => s.name).join("、");
}

function seedDefaultCategories(schedules: StoreBusinessHourSchedule[]): MealCategory[] {
  const defaultIds = defaultAllDayScheduleIds(schedules);
  const names = ["午餐烧烤", "午餐火锅", "午餐双拼", "晚餐烧烤", "晚餐火锅", "晚餐双拼"];
  const ids = [
    "cat-lunch-bbq",
    "cat-lunch-hotpot",
    "cat-lunch-combo",
    "cat-dinner-bbq",
    "cat-dinner-hotpot",
    "cat-dinner-combo",
  ];
  return names.map((name, i) => ({ id: ids[i]!, name, scheduleIds: [...defaultIds] }));
}

export function comboKey(ageId: string, categoryId: string): MenuComboKey {
  return `${ageId}__${categoryId}`;
}

export function comboTitle(age: AgeBand, category: MealCategory): string {
  return `${age.name}-${category.name}`;
}

export function listMenuCombinations(state: FohCategorySettingsState): ComboDefinition[] {
  const out: ComboDefinition[] = [];
  for (const age of state.ages) {
    for (const category of state.categories) {
      out.push({
        key: comboKey(age.id, category.id),
        title: comboTitle(age, category),
        age,
        category,
      });
    }
  }
  return out;
}

function orderableStorageId(comboKeyValue: MenuComboKey): string {
  return `foh-menu-${comboKeyValue}-orderable`;
}

function viewDishStorageId(comboKeyValue: MenuComboKey): string {
  return `foh-menu-${comboKeyValue}-view-dishes`;
}

function defaultMenuConfig(age: AgeBand, category: MealCategory): MenuComboConfig {
  return {
    displayName: `${age.name}${category.name}-1`,
    viewOnlyMode: "category",
    viewOnlyCategoryKeys: [],
  };
}

function normalizeMenuByCombo(
  raw: unknown,
  combos: ComboDefinition[],
): Record<MenuComboKey, MenuComboConfig> {
  const src = raw && typeof raw === "object" ? (raw as Record<string, Partial<MenuComboConfig>>) : {};
  const out: Record<MenuComboKey, MenuComboConfig> = {};
  for (const combo of combos) {
    const prev = src[combo.key];
    const mode = prev?.viewOnlyMode === "dish" ? "dish" : "category";
    const keys = Array.isArray(prev?.viewOnlyCategoryKeys)
      ? prev.viewOnlyCategoryKeys.filter((k): k is string => typeof k === "string")
      : [];
    const validKeys = new Set(combos.map((c) => c.key));
    out[combo.key] = {
      displayName:
        typeof prev?.displayName === "string" && prev.displayName.trim()
          ? prev.displayName.trim()
          : defaultMenuConfig(combo.age, combo.category).displayName,
      viewOnlyMode: mode,
      viewOnlyCategoryKeys: keys.filter((k) => k !== combo.key && validKeys.has(k)),
    };
  }
  return out;
}

function normalizeState(raw: unknown): FohCategorySettingsState {
  if (!raw || typeof raw !== "object") {
    const schedules = readBusinessHourSchedules();
    const base = {
      ...DEFAULT_STATE,
      ages: [...DEFAULT_STATE.ages],
      categories: seedDefaultCategories(schedules),
      menuByCombo: {},
    };
    const combos = listMenuCombinations(base);
    base.menuByCombo = normalizeMenuByCombo({}, combos);
    return base;
  }
  const o = raw as Partial<FohCategorySettingsState> & { menuNote?: string };
  const ages = Array.isArray(o.ages)
    ? o.ages.filter((a): a is AgeBand => !!a && typeof a.id === "string" && typeof a.name === "string")
    : [...DEFAULT_STATE.ages];
  const schedules = readBusinessHourSchedules();
  const categories = Array.isArray(o.categories)
    ? o.categories
        .map((c) => normalizeCategory(c as Partial<MealCategory> & { hours?: string }))
        .filter((c): c is MealCategory => c !== null)
    : [];
  const resolvedCategories =
    categories.length > 0 ? categories : seedDefaultCategories(schedules);
  const draft: FohCategorySettingsState = {
    ages: ages.length > 0 ? ages : [...DEFAULT_STATE.ages],
    categories: resolvedCategories,
    menuByCombo: {},
    hoursNote: typeof o.hoursNote === "string" ? o.hoursNote : "",
    specialMenuEnabled: o.specialMenuEnabled === true,
    specialMenus: Array.isArray(o.specialMenus)
      ? o.specialMenus
          .map((e) => normalizeSpecialMenuEntry(e as Partial<FohSpecialMenuEntry>))
          .filter((e): e is FohSpecialMenuEntry => e !== null)
      : [],
  };
  const combos = listMenuCombinations(draft);
  draft.menuByCombo = normalizeMenuByCombo(o.menuByCombo, combos);
  return draft;
}

export function readFohCategorySettingsState(): FohCategorySettingsState {
  return normalizeState(readModuleSettingJson(STORAGE_ID, null));
}

export function writeFohCategorySettingsState(state: FohCategorySettingsState): void {
  const combos = listMenuCombinations(state);
  state.menuByCombo = normalizeMenuByCombo(state.menuByCombo, combos);
  writeModuleSettingJson(STORAGE_ID, state);
}

export function isFohCategorySettingsPath(path: string): boolean {
  return path === FOH_CATEGORY_SETTINGS_BASE || path.startsWith(`${FOH_CATEGORY_SETTINGS_BASE}/`);
}

export function resolveFohCategorySettingsTab(path: string): FohCategorySettingsTabId {
  const match = FOH_CATEGORY_SETTINGS_TABS.find((tab) => path === tab.path || path.startsWith(`${tab.path}/`));
  return match?.id ?? "age-category";
}

export function getFohCategorySettingsTabPath(tabId: FohCategorySettingsTabId): string {
  return FOH_CATEGORY_SETTINGS_TABS.find((t) => t.id === tabId)?.path ?? FOH_CATEGORY_SETTINGS_TABS[0].path;
}

function renderSidebarNav(activePath: string): string {
  const items = FOH_CATEGORY_SETTINGS_TABS.map((tab) => {
    const active = activePath === tab.path || activePath.startsWith(`${tab.path}/`);
    return `
      <a
        href="#${tab.path}"
        class="block border-b border-border px-4 py-3 text-sm transition-colors ${
          active
            ? "bg-primary/10 font-medium text-primary"
            : "text-foreground hover:bg-muted/60"
        }"
        data-foh-category-settings-tab="${tab.id}"
        ${active ? 'aria-current="page"' : ""}
      >${escapeHtml(tab.title)}</a>`;
  }).join("");

  return `
    <nav
      class="w-full shrink-0 self-start overflow-hidden rounded-xl border border-border bg-card sm:sticky sm:top-0 sm:w-44"
      aria-label="品类设置"
      data-foh-category-settings-nav
    >
      ${items}
    </nav>`;
}

function renderAgeCategoryPanel(state: FohCategorySettingsState): string {
  const ageRows = state.ages
    .map((age) => {
      const tagOptions = AGE_TAG_OPTIONS.map(
        (tag) =>
          `<option value="${escapeHtml(tag)}" ${age.tag === tag ? "selected" : ""}>${escapeHtml(tag)}</option>`,
      ).join("");
      return `
        <tr class="border-b border-border last:border-0" data-foh-category-age-row="${escapeHtml(age.id)}">
          <td class="px-3 py-2.5 text-sm">${escapeHtml(age.name)}</td>
          <td class="px-3 py-2.5 text-right whitespace-nowrap">
            <button type="button" class="text-xs text-primary hover:underline" data-foh-category-age-edit="${escapeHtml(age.id)}">修改</button>
            <span class="mx-1 text-muted-foreground">|</span>
            <button type="button" class="text-xs text-destructive hover:underline" data-foh-category-age-delete="${escapeHtml(age.id)}">删除</button>
            <select
              class="ml-2 h-8 rounded-md border border-input bg-background px-2 text-xs"
              data-foh-category-age-tag="${escapeHtml(age.id)}"
              aria-label="${escapeHtml(age.name)} 标记"
            >${tagOptions}</select>
          </td>
        </tr>`;
    })
    .join("");

  const categoryRows = state.categories
    .map(
      (cat) => `
        <tr class="border-b border-border last:border-0" data-foh-category-cat-row="${escapeHtml(cat.id)}">
          <td class="px-3 py-2.5 text-sm">${escapeHtml(cat.name)}</td>
          <td class="px-3 py-2.5 text-right whitespace-nowrap">
            <button type="button" class="text-xs text-primary hover:underline" data-foh-category-cat-edit="${escapeHtml(cat.id)}">修改</button>
            <span class="mx-1 text-muted-foreground">|</span>
            <button type="button" class="text-xs text-destructive hover:underline" data-foh-category-cat-delete="${escapeHtml(cat.id)}">删除</button>
          </td>
        </tr>`,
    )
    .join("");

  const comboCount = listMenuCombinations(state).length;

  return `
    <div class="grid min-h-[360px] gap-4 md:grid-cols-2" data-foh-category-settings-panel="age-category">
      <section class="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <header class="border-b border-border bg-muted/40 px-4 py-2.5 text-center text-sm font-medium">年龄</header>
        <div class="min-h-0 flex-1 overflow-auto">
          <table class="w-full">
            <tbody>${ageRows}</tbody>
          </table>
        </div>
        <div class="border-t border-border p-3">
          <button type="button" class="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90" data-foh-category-age-add>增加</button>
        </div>
      </section>
      <section class="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <header class="border-b border-border bg-muted/40 px-4 py-2.5 text-center text-sm font-medium">类别</header>
        <div class="min-h-0 flex-1 overflow-auto">
          <table class="w-full">
            <tbody>${categoryRows}</tbody>
          </table>
        </div>
        <div class="border-t border-border p-3">
          <button type="button" class="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90" data-foh-category-cat-add>增加</button>
        </div>
      </section>
    </div>
    <p class="mt-3 text-xs text-muted-foreground">
      菜单设置将按「年龄 × 类别」自动生成 ${comboCount} 组配置（标题格式：年龄名-类别名）。修改本页后请前往「菜单设置」查看。
    </p>`;
}

function renderViewOnlyCategoryPicker(
  combo: ComboDefinition,
  allCombos: ComboDefinition[],
  cfg: MenuComboConfig,
): string {
  const others = allCombos.filter((c) => c.key !== combo.key);
  if (others.length === 0) {
    return `<p class="m-0 text-xs text-muted-foreground">暂无其他组合可选；请先在类别设置中增加年龄或类别。</p>`;
  }
  const selected = new Set(cfg.viewOnlyCategoryKeys);
  const chips = others
    .map((other) => {
      const checked = selected.has(other.key);
      return `
        <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
          checked
            ? "border-primary/40 bg-primary/10 text-foreground"
            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
        }">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
            value="${escapeHtml(other.key)}"
            data-foh-menu-view-category-key="${escapeHtml(combo.key)}"
            ${checked ? "checked" : ""}
          />
          <span>${escapeHtml(other.title)}</span>
        </label>`;
    })
    .join("");

  return `<div class="flex flex-wrap gap-2" data-foh-menu-view-category-picker="${escapeHtml(combo.key)}">${chips}</div>`;
}

function renderMenuComboBlock(
  combo: ComboDefinition,
  allCombos: ComboDefinition[],
  cfg: MenuComboConfig,
): string {
  const dishMode = cfg.viewOnlyMode === "dish";
  const categoryMode = cfg.viewOnlyMode === "category";
  const orderablePicker = renderStandaloneDishPickerHtml(
    FOH_MENU_PARENT_SEQ,
    `orderable-${combo.key}`,
    orderableStorageId(combo.key),
    "select",
  );
  const viewDishPicker = renderStandaloneDishPickerHtml(
    FOH_MENU_PARENT_SEQ,
    `view-dish-${combo.key}`,
    viewDishStorageId(combo.key),
    "select",
  );

  return `
    <section
      class="relative rounded-xl border border-border bg-card p-4 shadow-sm"
      data-foh-menu-combo-block="${escapeHtml(combo.key)}"
    >
      <p class="absolute right-4 top-3 m-0 text-sm font-semibold text-primary">${escapeHtml(combo.title)}</p>
      <div class="mb-4 max-w-md pr-28">
        <input
          type="text"
          class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value="${escapeHtml(cfg.displayName)}"
          data-foh-menu-display-name="${escapeHtml(combo.key)}"
          aria-label="${escapeHtml(combo.title)} 套餐名称"
        />
      </div>
      <div class="space-y-4">
        <div>
          <p class="m-0 mb-2 text-sm font-medium text-foreground">可看可下单的菜</p>
          ${orderablePicker}
        </div>
        <div>
          <p class="m-0 mb-2 text-sm font-medium text-foreground">仅可查看类别的菜</p>
          <div class="mb-3 flex flex-wrap items-center gap-4 text-sm">
            <label class="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="foh-menu-view-mode-${escapeHtml(combo.key)}"
                value="dish"
                class="${MODULE_SETTING_CONTROL_CLASS}"
                data-foh-menu-view-mode="${escapeHtml(combo.key)}"
                ${dishMode ? "checked" : ""}
              />
              <span>按照菜配置</span>
            </label>
            <label class="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="foh-menu-view-mode-${escapeHtml(combo.key)}"
                value="category"
                class="${MODULE_SETTING_CONTROL_CLASS}"
                data-foh-menu-view-mode="${escapeHtml(combo.key)}"
                ${categoryMode ? "checked" : ""}
              />
              <span>按照类别配置</span>
            </label>
          </div>
          <div class="${dishMode ? "" : "hidden"}" data-foh-menu-view-dish-panel="${escapeHtml(combo.key)}">
            ${viewDishPicker}
          </div>
          <div class="${categoryMode ? "" : "hidden"}" data-foh-menu-view-category-panel="${escapeHtml(combo.key)}">
            <p class="m-0 mb-2 text-xs text-muted-foreground">勾选其他「年龄-类别」组合，食客在本套餐下仅可查看对应类别菜单（不可下单）。</p>
            ${renderViewOnlyCategoryPicker(combo, allCombos, cfg)}
          </div>
        </div>
      </div>
    </section>`;
}

function renderMenuPanel(state: FohCategorySettingsState): string {
  const combos = listMenuCombinations(state);
  if (combos.length === 0) {
    return `
      <div class="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground" data-foh-category-settings-panel="menu">
        请先在「类别设置」中配置至少一个年龄与一个类别，系统将自动生成菜单配置块。
      </div>`;
  }

  const blocks = combos
    .map((combo) => renderMenuComboBlock(combo, combos, state.menuByCombo[combo.key]))
    .join("");

  return `
    <div class="space-y-4" data-foh-category-settings-panel="menu">
      <p class="m-0 text-sm text-muted-foreground">
        以下 ${combos.length} 组配置由「类别设置」中的年龄与类别组合生成；右上角标题为 <strong>年龄-类别</strong> 条件组合。
      </p>
      <div class="space-y-6">${blocks}</div>
    </div>`;
}

function renderScheduleDayBadges(schedule: StoreBusinessHourSchedule): string {
  const active = expandScheduleActiveDays(schedule.fromDay, schedule.toDay);
  return STORE_BUSINESS_HOUR_DAY_BADGES.map(({ day, badge }) => {
    const on = active.has(day);
    return `<span
      class="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-sm px-0.5 text-[10px] font-semibold tracking-wide ${
        on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }"
      aria-hidden="true"
    >${badge}</span>`;
  }).join("");
}

function renderHoursPickerScheduleRow(
  schedule: StoreBusinessHourSchedule,
  checked: boolean,
): string {
  return `
    <label
      class="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-transparent px-1 py-2 transition-colors hover:bg-muted/40"
      data-foh-hours-picker-row
    >
      <input
        type="checkbox"
        class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
        data-foh-hours-picker-schedule="${escapeHtml(schedule.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="w-16 shrink-0 text-sm font-medium text-foreground">${escapeHtml(schedule.name)}</span>
      <span class="shrink-0 text-sm tabular-nums text-muted-foreground">${escapeHtml(formatScheduleTimeRange(schedule))}</span>
      <span class="flex flex-wrap gap-0.5">${renderScheduleDayBadges(schedule)}</span>
    </label>`;
}

function renderHoursPickerDialogBody(scheduleIds: string[]): string {
  const schedules = readBusinessHourSchedules();
  const selected = new Set(scheduleIds);
  if (schedules.length === 0) {
    return `
      <p class="m-0 text-sm text-muted-foreground">请先在门店设置中维护营业时段。</p>
      <a href="#${STORE_BUSINESS_HOURS_PATH}" class="mt-3 inline-flex text-sm font-medium text-primary hover:underline">前往门店 · 营业时间</a>`;
  }
  return `<div class="space-y-1" data-foh-hours-picker-list>${schedules
    .map((s) => renderHoursPickerScheduleRow(s, selected.has(s.id)))
    .join("")}</div>`;
}

function renderHoursPickerDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-foh-hours-picker
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-hours-picker-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        data-foh-hours-picker-backdrop
        aria-label="关闭"
      ></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="border-b border-border px-6 py-4">
          <h3 id="foh-hours-picker-title" class="text-lg font-semibold text-card-foreground">营业时间</h3>
          <p class="m-0 mt-1 text-xs text-muted-foreground">选项来自门店设置 · 营业时段，可多选。</p>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4" data-foh-hours-picker-body></div>
        <div class="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-muted"
            data-foh-hours-picker-cancel
          >取消</button>
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            data-foh-hours-picker-confirm
          >确定</button>
        </div>
      </div>
    </div>`;
}

function renderHoursPanel(state: FohCategorySettingsState): string {
  const schedules = readBusinessHourSchedules();
  const rows = state.categories
    .map((cat) => {
      const label = formatCategoryHoursLabel(cat.scheduleIds, schedules);
      const italic = label === "All Day" || /^[A-Za-z]/.test(label);
      return `
        <tr class="border-b border-border last:border-0" data-foh-category-hours-row="${escapeHtml(cat.id)}">
          <td class="px-4 py-3 text-sm text-foreground">${escapeHtml(cat.name)}</td>
          <td class="px-4 py-3 text-sm text-foreground ${italic ? "italic" : ""}">${escapeHtml(label)}</td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button type="button" class="text-sm text-primary hover:underline" data-foh-category-hours-edit="${escapeHtml(cat.id)}">编辑</button>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <section class="overflow-hidden rounded-xl border border-border bg-card" data-foh-category-settings-panel="hours">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[320px] text-left">
          <thead>
            <tr class="border-b border-border bg-muted/40 text-sm font-medium text-foreground">
              <th class="px-4 py-2.5 font-medium">品牌/品类名称</th>
              <th class="px-4 py-2.5 font-medium">营业时间</th>
              <th class="px-4 py-2.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        按品类绑定门店营业时段；点击「编辑」可多选时段。
        <a href="#${STORE_BUSINESS_HOURS_PATH}" class="text-primary hover:underline">维护门店营业时段</a>
      </p>
    </section>`;
}

function renderSpecialMenuToggle(enabled: boolean): string {
  const knobClass = enabled ? "translate-x-5" : "translate-x-0.5";
  const trackClass = enabled ? FOH_SPECIAL_MENU_TOGGLE_TRACK_ON : FOH_SPECIAL_MENU_TOGGLE_TRACK_OFF;
  return `
    <button
      type="button"
      role="switch"
      aria-checked="${enabled ? "true" : "false"}"
      aria-label="开启特殊菜单"
      data-foh-category-special-enabled
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass}"
    >
      <span
        class="pointer-events-none block size-5 ${knobClass} ${FOH_SPECIAL_MENU_TOGGLE_KNOB} rounded-full transition-transform duration-200"
        aria-hidden="true"
      ></span>
    </button>`;
}

function renderSpecialMenuEntry(entry: FohSpecialMenuEntry): string {
  const storageId = `foh-special-menu-${entry.id}`;
  return `
    <article
      class="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
      data-foh-special-menu-entry="${escapeHtml(entry.id)}"
    >
      <div class="flex items-center gap-3">
        <label class="shrink-0 text-sm text-foreground" for="foh-special-menu-name-${escapeHtml(entry.id)}">名称</label>
        <input
          id="foh-special-menu-name-${escapeHtml(entry.id)}"
          type="text"
          class="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value="${escapeHtml(entry.name)}"
          data-foh-special-menu-name="${escapeHtml(entry.id)}"
          placeholder=""
        />
        <button
          type="button"
          class="shrink-0 text-sm text-primary hover:underline"
          data-foh-special-menu-delete="${escapeHtml(entry.id)}"
        >删除</button>
      </div>
      <div data-foh-special-menu-menus="${escapeHtml(entry.id)}">
        ${renderMenuGroupDropdownHtml(storageId, entry.menus, "brand")}
      </div>
    </article>`;
}

function renderSpecialMenuPanel(state: FohCategorySettingsState): string {
  const entries =
    state.specialMenus.length > 0
      ? state.specialMenus.map(renderSpecialMenuEntry).join("")
      : `<p class="m-0 rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">暂无特殊菜单，点击右上角「增加」添加。</p>`;
  const listHidden = state.specialMenuEnabled ? "" : "hidden";

  return `
    <div class="space-y-6" data-foh-category-settings-panel="special-menu">
      <section class="rounded-xl border border-border bg-card px-4 py-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="m-0 text-sm font-medium text-foreground">开启特殊菜单</p>
            <p class="m-0 mt-1 text-xs text-muted-foreground">开启后，可在品类模式中选择特殊菜单</p>
          </div>
          ${renderSpecialMenuToggle(state.specialMenuEnabled)}
        </div>
      </section>
      <section class="rounded-xl border border-border bg-card p-4 ${listHidden}" data-foh-special-menu-list-section>
        <div class="mb-4 flex items-center justify-between gap-3">
          <h4 class="m-0 text-sm font-semibold text-foreground">特殊菜单设置</h4>
          <button type="button" class="text-sm font-medium text-primary hover:underline" data-foh-special-menu-add>增加</button>
        </div>
        <div class="space-y-4" data-foh-special-menu-list>${entries}</div>
      </section>
    </div>`;
}

function renderTabContent(tabId: FohCategorySettingsTabId, state: FohCategorySettingsState): string {
  switch (tabId) {
    case "menu":
      return renderMenuPanel(state);
    case "hours":
      return renderHoursPanel(state);
    case "special-menu":
      return renderSpecialMenuPanel(state);
    default:
      return renderAgeCategoryPanel(state);
  }
}

export function renderFohCategorySettingsPage(path: string): string {
  const tabId = resolveFohCategorySettingsTab(path);
  const state = readFohCategorySettingsState();
  const tabPath = getFohCategorySettingsTabPath(tabId);

  return `
    <div
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden sm:flex-row sm:items-stretch"
      data-foh-category-settings-root
    >
      ${renderSidebarNav(tabPath)}
      <div
        class="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
        data-foh-category-settings-main
        data-active-tab="${tabId}"
      >
        ${renderTabContent(tabId, state)}
      </div>
      ${renderHoursPickerDialogShell()}
    </div>`;
}

let fohHoursPickerCategoryId: string | null = null;

function showFohHoursPicker(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-hours-picker]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideFohHoursPicker(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-hours-picker]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  fohHoursPickerCategoryId = null;
}

function refreshFohHoursPickerBody(root: HTMLElement, scheduleIds: string[]): void {
  const body = root.querySelector<HTMLElement>("[data-foh-hours-picker-body]");
  if (!body) return;
  body.innerHTML = renderHoursPickerDialogBody(scheduleIds);
  const confirm = root.querySelector<HTMLButtonElement>("[data-foh-hours-picker-confirm]");
  if (confirm) confirm.disabled = readBusinessHourSchedules().length === 0;
}

function openFohCategoryHoursPicker(root: HTMLElement, categoryId: string): void {
  const state = readFohCategorySettingsState();
  const row = state.categories.find((c) => c.id === categoryId);
  if (!row) return;
  fohHoursPickerCategoryId = categoryId;
  refreshFohHoursPickerBody(root, row.scheduleIds);
  showFohHoursPicker(root);
}

function bindFohCategoryHoursPicker(root: HTMLElement, remount: () => void): void {
  if (root.getAttribute("data-foh-hours-picker-bound") === "1") return;
  root.setAttribute("data-foh-hours-picker-bound", "1");

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const editBtn = target.closest<HTMLButtonElement>("[data-foh-category-hours-edit]");
    if (editBtn) {
      const id = editBtn.getAttribute("data-foh-category-hours-edit");
      if (id) openFohCategoryHoursPicker(root, id);
      return;
    }
    if (
      target.closest("[data-foh-hours-picker-cancel]") ||
      target.closest("[data-foh-hours-picker-backdrop]")
    ) {
      hideFohHoursPicker(root);
      return;
    }
    if (target.closest("[data-foh-hours-picker-confirm]")) {
      if (!fohHoursPickerCategoryId) {
        hideFohHoursPicker(root);
        return;
      }
      const schedules = readBusinessHourSchedules();
      if (schedules.length === 0) {
        hideFohHoursPicker(root);
        return;
      }
      const ids: string[] = [];
      root
        .querySelectorAll<HTMLInputElement>("[data-foh-hours-picker-schedule]:checked")
        .forEach((input) => {
          const sid = input.getAttribute("data-foh-hours-picker-schedule");
          if (sid) ids.push(sid);
        });
      if (ids.length === 0) {
        window.alert("请至少选择一个营业时段。");
        return;
      }
      const state = readFohCategorySettingsState();
      const row = state.categories.find((c) => c.id === fohHoursPickerCategoryId);
      if (row) {
        row.scheduleIds = ids;
        writeFohCategorySettingsState(state);
        remountFohCategorySettings(remount);
      }
      hideFohHoursPicker(root);
    }
  });
}

function promptName(label: string, current = ""): string | null {
  const v = window.prompt(label, current);
  if (v === null) return null;
  const trimmed = v.trim();
  return trimmed || null;
}

function remountFohCategorySettings(remount: () => void): void {
  remount();
}

function updateMenuComboConfig(
  comboKeyValue: MenuComboKey,
  patch: Partial<MenuComboConfig>,
): void {
  const state = readFohCategorySettingsState();
  const cfg = state.menuByCombo[comboKeyValue];
  if (!cfg) return;
  Object.assign(cfg, patch);
  writeFohCategorySettingsState(state);
}

function syncViewOnlyPanels(block: HTMLElement, mode: "dish" | "category"): void {
  const key = block.getAttribute("data-foh-menu-combo-block");
  if (!key) return;
  block.querySelector(`[data-foh-menu-view-dish-panel="${key}"]`)?.classList.toggle("hidden", mode !== "dish");
  block.querySelector(`[data-foh-menu-view-category-panel="${key}"]`)?.classList.toggle("hidden", mode !== "category");
}

function collectViewOnlyCategoryKeys(comboKeyValue: MenuComboKey, picker: HTMLElement): string[] {
  const keys: string[] = [];
  picker.querySelectorAll<HTMLInputElement>(`[data-foh-menu-view-category-key="${comboKeyValue}"]:checked`).forEach((input) => {
    const v = input.value;
    if (v && v !== comboKeyValue) keys.push(v);
  });
  return keys;
}

export function bindFohCategorySettingsUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-foh-category-settings-root]");
  if (!root || root.getAttribute("data-foh-category-bound") === "1") return;
  root.setAttribute("data-foh-category-bound", "1");

  root.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches("[data-foh-menu-display-name]")) return;
    const key = input.getAttribute("data-foh-menu-display-name");
    if (!key) return;
    updateMenuComboConfig(key, { displayName: input.value.trim() });
  });

  root.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;

    const modeRadio = target.closest<HTMLInputElement>("[data-foh-menu-view-mode]");
    if (modeRadio?.checked) {
      const key = modeRadio.getAttribute("data-foh-menu-view-mode");
      const mode = modeRadio.value === "dish" ? "dish" : "category";
      if (key) {
        updateMenuComboConfig(key, { viewOnlyMode: mode });
        const block = root.querySelector<HTMLElement>(`[data-foh-menu-combo-block="${key}"]`);
        if (block) syncViewOnlyPanels(block, mode);
      }
      return;
    }

    if (target.matches("[data-foh-menu-view-category-key]")) {
      const key = (target as HTMLInputElement).getAttribute("data-foh-menu-view-category-key");
      const picker = target.closest<HTMLElement>("[data-foh-menu-view-category-picker]");
      if (key && picker) {
        updateMenuComboConfig(key, {
          viewOnlyCategoryKeys: collectViewOnlyCategoryKeys(key, picker),
        });
      }
    }
  });

  root.querySelector("[data-foh-category-age-add]")?.addEventListener("click", () => {
    const name = promptName("请输入年龄阶段名称");
    if (!name) return;
    const state = readFohCategorySettingsState();
    state.ages.push({ id: newId("age"), name, tag: "未标记" });
    writeFohCategorySettingsState(state);
    remountFohCategorySettings(remount);
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-category-age-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-category-age-edit");
      if (!id) return;
      const state = readFohCategorySettingsState();
      const row = state.ages.find((a) => a.id === id);
      if (!row) return;
      const name = promptName("修改年龄阶段名称", row.name);
      if (!name) return;
      row.name = name;
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-category-age-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-category-age-delete");
      if (!id) return;
      const state = readFohCategorySettingsState();
      if (state.ages.length <= 1) {
        window.alert("至少保留一个年龄阶段。");
        return;
      }
      if (!window.confirm("确定删除该年龄阶段？相关菜单组合将一并移除。")) return;
      state.ages = state.ages.filter((a) => a.id !== id);
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
    });
  });

  root.querySelectorAll<HTMLSelectElement>("[data-foh-category-age-tag]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const id = sel.getAttribute("data-foh-category-age-tag");
      if (!id) return;
      const state = readFohCategorySettingsState();
      const row = state.ages.find((a) => a.id === id);
      if (!row) return;
      row.tag = sel.value;
      writeFohCategorySettingsState(state);
    });
  });

  root.querySelector("[data-foh-category-cat-add]")?.addEventListener("click", () => {
    const name = promptName("请输入类别名称");
    if (!name) return;
    const state = readFohCategorySettingsState();
    state.categories.push({
      id: newId("cat"),
      name,
      scheduleIds: defaultAllDayScheduleIds(readBusinessHourSchedules()),
    });
    writeFohCategorySettingsState(state);
    remountFohCategorySettings(remount);
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-category-cat-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-category-cat-edit");
      if (!id) return;
      const state = readFohCategorySettingsState();
      const row = state.categories.find((c) => c.id === id);
      if (!row) return;
      const name = promptName("修改类别名称", row.name);
      if (!name) return;
      row.name = name;
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-category-cat-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-category-cat-delete");
      if (!id) return;
      const state = readFohCategorySettingsState();
      if (state.categories.length <= 1) {
        window.alert("至少保留一个类别。");
        return;
      }
      if (!window.confirm("确定删除该类别？相关菜单组合将一并移除。")) return;
      state.categories = state.categories.filter((c) => c.id !== id);
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
    });
  });

  bindFohCategoryHoursPicker(root, remount);
  bindFohCategorySpecialMenuUi(root, remount);
}

function persistSpecialMenusFromDom(root: HTMLElement): FohSpecialMenuEntry[] {
  const entries: FohSpecialMenuEntry[] = [];
  root.querySelectorAll<HTMLElement>("[data-foh-special-menu-entry]").forEach((article) => {
    const id = article.getAttribute("data-foh-special-menu-entry");
    if (!id) return;
    const name =
      article.querySelector<HTMLInputElement>(`[data-foh-special-menu-name="${id}"]`)?.value.trim() ?? "";
    const dropdown = article.querySelector<HTMLElement>("[data-menu-group-dropdown]");
    const menus = dropdown ? collectMenuGroupsFromDropdownWithCatalog(dropdown) : [];
    entries.push({ id, name, menus });
  });
  return entries;
}

function bindFohCategorySpecialMenuUi(root: HTMLElement, remount: () => void): void {
  if (root.getAttribute("data-foh-special-menu-bound") === "1") return;
  root.setAttribute("data-foh-special-menu-bound", "1");
  ensureMenuGroupDropdownDocumentCloseListener();
  bindMenuGroupDropdownPickers(root);

  const persistAndRemount = (): void => {
    const state = readFohCategorySettingsState();
    state.specialMenus = persistSpecialMenusFromDom(root);
    writeFohCategorySettingsState(state);
    remountFohCategorySettings(remount);
  };

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const toggle = target.closest<HTMLButtonElement>("[data-foh-category-special-enabled]");
    if (toggle) {
      const state = readFohCategorySettingsState();
      const next = toggle.getAttribute("aria-checked") !== "true";
      state.specialMenuEnabled = next;
      if (next && state.specialMenus.length === 0) {
        state.specialMenus = [defaultSpecialMenuDemoEntry()];
      }
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
      return;
    }
    if (target.closest("[data-foh-special-menu-add]")) {
      const state = readFohCategorySettingsState();
      state.specialMenuEnabled = true;
      state.specialMenus = [...persistSpecialMenusFromDom(root), { id: newSpecialMenuId(), name: "", menus: [] }];
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
      return;
    }
    const deleteBtn = target.closest<HTMLButtonElement>("[data-foh-special-menu-delete]");
    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-foh-special-menu-delete");
      if (!id) return;
      if (!window.confirm("确定删除该特殊菜单？")) return;
      const state = readFohCategorySettingsState();
      state.specialMenus = persistSpecialMenusFromDom(root).filter((entry) => entry.id !== id);
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
    }
  });

  root.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-menu-group-dropdown-choice]") && target.closest("[data-foh-special-menu-entry]")) {
      persistAndRemount();
    }
  });

  root.addEventListener(
    "input",
    (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches("[data-foh-special-menu-name]")) return;
      const state = readFohCategorySettingsState();
      state.specialMenus = persistSpecialMenusFromDom(root);
      writeFohCategorySettingsState(state);
    },
    { passive: true },
  );
}

/** 解析某组合下已选可看可下单菜品（供调试或后续 API 对接） */
export function readMenuComboOrderableDishes(comboKeyValue: MenuComboKey): DishTag[] {
  return readDishTags(orderableStorageId(comboKeyValue));
}
