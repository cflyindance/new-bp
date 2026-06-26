/**
 * 前厅管理中心 · 分类设置（场景菜单：类别名、菜单关联、营业时间）
 * 路径：/operations/queue-call/classification-settings/*
 * 参照「品类设置」，不含年龄与特殊菜单。
 */

import {
  readDishTags,
  renderStandaloneDishPickerHtml,
  type DishTag,
} from "./module-settings-dish-rules-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  expandScheduleActiveDays,
  formatScheduleTimeRange,
  readBusinessHourSchedules,
  STORE_BUSINESS_HOUR_DAY_BADGES,
  type StoreBusinessHourSchedule,
} from "./module-settings-store-business-hours-ui";
import {
  bindFohSettingsNameDialog,
  openFohSettingsNameDialog,
  renderFohSettingsNameDialogShell,
} from "./foh-settings-name-dialog-ui";

export const FOH_CLASSIFICATION_SETTINGS_BASE = "/operations/queue-call/classification-settings";

/** 与设置目录 seq 659 对齐，供菜品选择器原型使用 */
const FOH_CLASSIFICATION_MENU_PARENT_SEQ = 659;

export const FOH_CLASSIFICATION_SETTINGS_TABS = [
  {
    id: "category",
    title: "类别设置",
    titleEn: "Category settings",
    path: `${FOH_CLASSIFICATION_SETTINGS_BASE}/category`,
  },
  {
    id: "menu",
    title: "菜单设置",
    titleEn: "Menu settings",
    path: `${FOH_CLASSIFICATION_SETTINGS_BASE}/menu`,
  },
  {
    id: "hours",
    title: "营业时间",
    titleEn: "Business hours",
    path: `${FOH_CLASSIFICATION_SETTINGS_BASE}/hours`,
  },
] as const;

export type FohClassificationSettingsTabId = (typeof FOH_CLASSIFICATION_SETTINGS_TABS)[number]["id"];

const STORAGE_ID = "foh-classification-settings:v1";

const STORE_BUSINESS_HOURS_PATH = "/store/business-hours";

type MealCategory = {
  id: string;
  name: string;
  scheduleIds: string[];
};

export type CategoryMenuConfig = {
  displayName: string;
  viewOnlyMode: "dish" | "category";
  viewOnlyCategoryIds: string[];
};

type FohClassificationSettingsState = {
  categories: MealCategory[];
  menuByCategory: Record<string, CategoryMenuConfig>;
  hoursNote: string;
};

const DEFAULT_STATE: FohClassificationSettingsState = {
  categories: [],
  menuByCategory: {},
  hoursNote: "",
};

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

function orderableStorageId(categoryId: string): string {
  return `foh-classification-menu-${categoryId}-orderable`;
}

function viewDishStorageId(categoryId: string): string {
  return `foh-classification-menu-${categoryId}-view-dishes`;
}

function defaultMenuConfig(category: MealCategory): CategoryMenuConfig {
  return {
    displayName: category.name,
    viewOnlyMode: "category",
    viewOnlyCategoryIds: [],
  };
}

function normalizeMenuByCategory(
  raw: unknown,
  categories: MealCategory[],
): Record<string, CategoryMenuConfig> {
  const src = raw && typeof raw === "object" ? (raw as Record<string, Partial<CategoryMenuConfig>>) : {};
  const validIds = new Set(categories.map((c) => c.id));
  const out: Record<string, CategoryMenuConfig> = {};
  for (const category of categories) {
    const prev = src[category.id];
    const mode = prev?.viewOnlyMode === "dish" ? "dish" : "category";
    const ids = Array.isArray(prev?.viewOnlyCategoryIds)
      ? prev.viewOnlyCategoryIds.filter((id): id is string => typeof id === "string")
      : [];
    out[category.id] = {
      displayName:
        typeof prev?.displayName === "string" && prev.displayName.trim()
          ? prev.displayName.trim()
          : defaultMenuConfig(category).displayName,
      viewOnlyMode: mode,
      viewOnlyCategoryIds: ids.filter((id) => id !== category.id && validIds.has(id)),
    };
  }
  return out;
}

function normalizeState(raw: unknown): FohClassificationSettingsState {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_STATE, categories: [], menuByCategory: {} };
  }
  const o = raw as Partial<FohClassificationSettingsState>;
  const categories = Array.isArray(o.categories)
    ? o.categories
        .map((c) => normalizeCategory(c as Partial<MealCategory> & { hours?: string }))
        .filter((c): c is MealCategory => c !== null)
    : [];
  const draft: FohClassificationSettingsState = {
    categories,
    menuByCategory: {},
    hoursNote: typeof o.hoursNote === "string" ? o.hoursNote : "",
  };
  draft.menuByCategory = normalizeMenuByCategory(o.menuByCategory, categories);
  return draft;
}

export function readFohClassificationSettingsState(): FohClassificationSettingsState {
  return normalizeState(readModuleSettingJson(STORAGE_ID, null));
}

export function writeFohClassificationSettingsState(state: FohClassificationSettingsState): void {
  state.menuByCategory = normalizeMenuByCategory(state.menuByCategory, state.categories);
  writeModuleSettingJson(STORAGE_ID, state);
}

export function isFohClassificationSettingsPath(path: string): boolean {
  return (
    path === FOH_CLASSIFICATION_SETTINGS_BASE ||
    path.startsWith(`${FOH_CLASSIFICATION_SETTINGS_BASE}/`)
  );
}

export function resolveFohClassificationSettingsTab(path: string): FohClassificationSettingsTabId {
  const match = FOH_CLASSIFICATION_SETTINGS_TABS.find(
    (tab) => path === tab.path || path.startsWith(`${tab.path}/`),
  );
  return match?.id ?? "category";
}

export function getFohClassificationSettingsTabPath(
  tabId: FohClassificationSettingsTabId,
): string {
  return (
    FOH_CLASSIFICATION_SETTINGS_TABS.find((t) => t.id === tabId)?.path ??
    FOH_CLASSIFICATION_SETTINGS_TABS[0].path
  );
}

function renderSidebarNav(activePath: string): string {
  const items = FOH_CLASSIFICATION_SETTINGS_TABS.map((tab) => {
    const active = activePath === tab.path || activePath.startsWith(`${tab.path}/`);
    return `
      <a
        href="#${tab.path}"
        class="block border-b border-border px-4 py-3 text-sm transition-colors ${
          active
            ? "bg-primary/10 font-medium text-primary"
            : "text-foreground hover:bg-muted/60"
        }"
        data-foh-classification-settings-tab="${tab.id}"
        ${active ? 'aria-current="page"' : ""}
      >${escapeHtml(tab.title)}</a>`;
  }).join("");

  return `
    <nav
      class="w-full shrink-0 self-start overflow-hidden rounded-xl border border-border bg-card sm:sticky sm:top-0 sm:w-44"
      aria-label="分类设置"
      data-foh-classification-settings-nav
    >
      ${items}
    </nav>`;
}

function renderCategoryPanel(state: FohClassificationSettingsState): string {
  const categoryRows = state.categories
    .map(
      (cat) => `
        <tr class="border-b border-border last:border-0" data-foh-classification-cat-row="${escapeHtml(cat.id)}">
          <td class="px-4 py-3 text-sm text-foreground">${escapeHtml(cat.name)}</td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button type="button" class="text-sm text-primary hover:underline" data-foh-classification-cat-edit="${escapeHtml(cat.id)}">修改</button>
            <span class="mx-1 text-muted-foreground">|</span>
            <button type="button" class="text-sm text-destructive hover:underline" data-foh-classification-cat-delete="${escapeHtml(cat.id)}">删除</button>
          </td>
        </tr>`,
    )
    .join("");

  const emptyRow =
    state.categories.length === 0
      ? `<tr><td colspan="2" class="px-4 py-8 text-center text-sm text-muted-foreground">暂无分类，请点击下方「增加」添加菜单分类名称。</td></tr>`
      : "";

  return `
    <section class="flex min-h-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card" data-foh-classification-settings-panel="category">
      <header class="border-b border-border bg-muted/40 px-4 py-2.5 text-center text-sm font-medium">菜单分类名称</header>
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full min-w-[280px]">
          <tbody>${categoryRows}${emptyRow}</tbody>
        </table>
      </div>
      <div class="border-t border-border p-3">
        <button type="button" class="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90" data-foh-classification-cat-add>增加</button>
      </div>
    </section>
    <p class="mt-3 text-xs text-muted-foreground">
      创建分类后，请前往「菜单设置」为每个分类配置可看可下单菜品与仅可查看类别；在「营业时间」中绑定营业时段。
    </p>`;
}

function renderViewOnlyCategoryPicker(
  category: MealCategory,
  allCategories: MealCategory[],
  cfg: CategoryMenuConfig,
): string {
  const others = allCategories.filter((c) => c.id !== category.id);
  if (others.length === 0) {
    return `<p class="m-0 text-xs text-muted-foreground">暂无其他分类可选；请先在类别设置中增加分类。</p>`;
  }
  const selected = new Set(cfg.viewOnlyCategoryIds);
  const chips = others
    .map((other) => {
      const checked = selected.has(other.id);
      return `
        <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
          checked
            ? "border-primary/40 bg-primary/10 text-foreground"
            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
        }">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
            value="${escapeHtml(other.id)}"
            data-foh-classification-menu-view-category-id="${escapeHtml(category.id)}"
            ${checked ? "checked" : ""}
          />
          <span>${escapeHtml(other.name)}</span>
        </label>`;
    })
    .join("");

  return `<div class="flex flex-wrap gap-2" data-foh-classification-menu-view-category-picker="${escapeHtml(category.id)}">${chips}</div>`;
}

function renderMenuCategoryBlock(
  category: MealCategory,
  allCategories: MealCategory[],
  cfg: CategoryMenuConfig,
): string {
  const dishMode = cfg.viewOnlyMode === "dish";
  const categoryMode = cfg.viewOnlyMode === "category";
  const orderablePicker = renderStandaloneDishPickerHtml(
    FOH_CLASSIFICATION_MENU_PARENT_SEQ,
    `orderable-${category.id}`,
    orderableStorageId(category.id),
    "select",
  );
  const viewDishPicker = renderStandaloneDishPickerHtml(
    FOH_CLASSIFICATION_MENU_PARENT_SEQ,
    `view-dish-${category.id}`,
    viewDishStorageId(category.id),
    "select",
  );

  return `
    <section
      class="relative rounded-xl border border-border bg-card p-4 shadow-sm"
      data-foh-classification-menu-block="${escapeHtml(category.id)}"
    >
      <p class="absolute right-4 top-3 m-0 text-sm font-semibold text-primary">${escapeHtml(category.name)}</p>
      <div class="mb-4 max-w-md pr-28">
        <input
          type="text"
          class="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value="${escapeHtml(cfg.displayName)}"
          data-foh-classification-menu-display-name="${escapeHtml(category.id)}"
          aria-label="${escapeHtml(category.name)} 展示名称"
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
                name="foh-classification-menu-view-mode-${escapeHtml(category.id)}"
                value="dish"
                class="${MODULE_SETTING_CONTROL_CLASS}"
                data-foh-classification-menu-view-mode="${escapeHtml(category.id)}"
                ${dishMode ? "checked" : ""}
              />
              <span>按菜单配置</span>
            </label>
            <label class="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="foh-classification-menu-view-mode-${escapeHtml(category.id)}"
                value="category"
                class="${MODULE_SETTING_CONTROL_CLASS}"
                data-foh-classification-menu-view-mode="${escapeHtml(category.id)}"
                ${categoryMode ? "checked" : ""}
              />
              <span>按类别配置</span>
            </label>
          </div>
          <div class="${dishMode ? "" : "hidden"}" data-foh-classification-menu-view-dish-panel="${escapeHtml(category.id)}">
            ${viewDishPicker}
          </div>
          <div class="${categoryMode ? "" : "hidden"}" data-foh-classification-menu-view-category-panel="${escapeHtml(category.id)}">
            <p class="m-0 mb-2 text-xs text-muted-foreground">勾选其他分类，食客在本分类下仅可查看对应分类菜单（不可下单）。</p>
            ${renderViewOnlyCategoryPicker(category, allCategories, cfg)}
          </div>
        </div>
      </div>
    </section>`;
}

function renderMenuPanel(state: FohClassificationSettingsState): string {
  if (state.categories.length === 0) {
    return `
      <div class="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground" data-foh-classification-settings-panel="menu">
        请先在「类别设置」中新增至少一个菜单分类名称，再配置各分类的菜品关联。
      </div>`;
  }

  const blocks = state.categories
    .map((cat) =>
      renderMenuCategoryBlock(cat, state.categories, state.menuByCategory[cat.id] ?? defaultMenuConfig(cat)),
    )
    .join("");

  return `
    <div class="space-y-4" data-foh-classification-settings-panel="menu">
      <p class="m-0 text-sm text-muted-foreground">
        以下 ${state.categories.length} 组配置由「类别设置」中的分类生成；右上角标题为分类名称。
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
      data-foh-classification-hours-picker-row
    >
      <input
        type="checkbox"
        class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
        data-foh-classification-hours-picker-schedule="${escapeHtml(schedule.id)}"
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
  return `<div class="space-y-1" data-foh-classification-hours-picker-list>${schedules
    .map((s) => renderHoursPickerScheduleRow(s, selected.has(s.id)))
    .join("")}</div>`;
}

function renderHoursPickerDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-foh-classification-hours-picker
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-classification-hours-picker-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/40"
        data-foh-classification-hours-picker-backdrop
        aria-label="关闭"
      ></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="border-b border-border px-6 py-4">
          <h3 id="foh-classification-hours-picker-title" class="text-lg font-semibold text-card-foreground">营业时间</h3>
          <p class="m-0 mt-1 text-xs text-muted-foreground">选项来自门店设置 · 营业时段，可多选。</p>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4" data-foh-classification-hours-picker-body></div>
        <div class="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-muted"
            data-foh-classification-hours-picker-cancel
          >取消</button>
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            data-foh-classification-hours-picker-confirm
          >确定</button>
        </div>
      </div>
    </div>`;
}

function renderHoursPanel(state: FohClassificationSettingsState): string {
  const schedules = readBusinessHourSchedules();
  if (state.categories.length === 0) {
    return `
      <div class="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground" data-foh-classification-settings-panel="hours">
        请先在「类别设置」中新增分类，再为各分类绑定营业时段。
      </div>`;
  }

  const rows = state.categories
    .map((cat) => {
      const label = formatCategoryHoursLabel(cat.scheduleIds, schedules);
      const italic = label === "All Day" || /^[A-Za-z]/.test(label);
      return `
        <tr class="border-b border-border last:border-0" data-foh-classification-hours-row="${escapeHtml(cat.id)}">
          <td class="px-4 py-3 text-sm text-foreground">${escapeHtml(cat.name)}</td>
          <td class="px-4 py-3 text-sm text-foreground ${italic ? "italic" : ""}">${escapeHtml(label)}</td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button type="button" class="text-sm text-primary hover:underline" data-foh-classification-hours-edit="${escapeHtml(cat.id)}">修改</button>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <section class="overflow-hidden rounded-xl border border-border bg-card" data-foh-classification-settings-panel="hours">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[320px] text-left">
          <thead>
            <tr class="border-b border-border bg-muted/40 text-sm font-medium text-foreground">
              <th class="px-4 py-2.5 font-medium">菜单分类名称</th>
              <th class="px-4 py-2.5 font-medium">营业时间</th>
              <th class="px-4 py-2.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        按分类绑定门店营业时段；点击「修改」可多选时段。
        <a href="#${STORE_BUSINESS_HOURS_PATH}" class="text-primary hover:underline">维护门店营业时段</a>
      </p>
    </section>`;
}

function renderTabContent(
  tabId: FohClassificationSettingsTabId,
  state: FohClassificationSettingsState,
): string {
  switch (tabId) {
    case "menu":
      return renderMenuPanel(state);
    case "hours":
      return renderHoursPanel(state);
    default:
      return renderCategoryPanel(state);
  }
}

export function renderFohClassificationSettingsPage(path: string): string {
  const tabId = resolveFohClassificationSettingsTab(path);
  const state = readFohClassificationSettingsState();
  const tabPath = getFohClassificationSettingsTabPath(tabId);

  return `
    <div
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden sm:flex-row sm:items-stretch"
      data-foh-classification-settings-root
    >
      ${renderSidebarNav(tabPath)}
      <div
        class="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
        data-foh-classification-settings-main
        data-active-tab="${tabId}"
      >
        ${renderTabContent(tabId, state)}
      </div>
      ${renderHoursPickerDialogShell()}
      ${renderFohSettingsNameDialogShell()}
    </div>`;
}

let fohClassificationHoursPickerCategoryId: string | null = null;

function showFohClassificationHoursPicker(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-classification-hours-picker]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideFohClassificationHoursPicker(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-classification-hours-picker]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  fohClassificationHoursPickerCategoryId = null;
}

function refreshFohClassificationHoursPickerBody(root: HTMLElement, scheduleIds: string[]): void {
  const body = root.querySelector<HTMLElement>("[data-foh-classification-hours-picker-body]");
  if (!body) return;
  body.innerHTML = renderHoursPickerDialogBody(scheduleIds);
  const confirm = root.querySelector<HTMLButtonElement>("[data-foh-classification-hours-picker-confirm]");
  if (confirm) confirm.disabled = readBusinessHourSchedules().length === 0;
}

function openFohClassificationHoursPicker(root: HTMLElement, categoryId: string): void {
  const state = readFohClassificationSettingsState();
  const row = state.categories.find((c) => c.id === categoryId);
  if (!row) return;
  fohClassificationHoursPickerCategoryId = categoryId;
  refreshFohClassificationHoursPickerBody(root, row.scheduleIds);
  showFohClassificationHoursPicker(root);
}

function bindFohClassificationHoursPicker(root: HTMLElement, remount: () => void): void {
  if (root.getAttribute("data-foh-classification-hours-picker-bound") === "1") return;
  root.setAttribute("data-foh-classification-hours-picker-bound", "1");

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const editBtn = target.closest<HTMLButtonElement>("[data-foh-classification-hours-edit]");
    if (editBtn) {
      const id = editBtn.getAttribute("data-foh-classification-hours-edit");
      if (id) openFohClassificationHoursPicker(root, id);
      return;
    }
    if (
      target.closest("[data-foh-classification-hours-picker-cancel]") ||
      target.closest("[data-foh-classification-hours-picker-backdrop]")
    ) {
      hideFohClassificationHoursPicker(root);
      return;
    }
    if (target.closest("[data-foh-classification-hours-picker-confirm]")) {
      if (!fohClassificationHoursPickerCategoryId) {
        hideFohClassificationHoursPicker(root);
        return;
      }
      const schedules = readBusinessHourSchedules();
      if (schedules.length === 0) {
        hideFohClassificationHoursPicker(root);
        return;
      }
      const ids: string[] = [];
      root
        .querySelectorAll<HTMLInputElement>("[data-foh-classification-hours-picker-schedule]:checked")
        .forEach((input) => {
          const sid = input.getAttribute("data-foh-classification-hours-picker-schedule");
          if (sid) ids.push(sid);
        });
      if (ids.length === 0) {
        window.alert("请至少选择一个营业时段。");
        return;
      }
      const state = readFohClassificationSettingsState();
      const row = state.categories.find((c) => c.id === fohClassificationHoursPickerCategoryId);
      if (row) {
        row.scheduleIds = ids;
        writeFohClassificationSettingsState(state);
        remount();
      }
      hideFohClassificationHoursPicker(root);
    }
  });
}

function updateCategoryMenuConfig(categoryId: string, patch: Partial<CategoryMenuConfig>): void {
  const state = readFohClassificationSettingsState();
  const cfg = state.menuByCategory[categoryId];
  if (!cfg) return;
  Object.assign(cfg, patch);
  writeFohClassificationSettingsState(state);
}

function syncViewOnlyPanels(block: HTMLElement, mode: "dish" | "category"): void {
  const id = block.getAttribute("data-foh-classification-menu-block");
  if (!id) return;
  block
    .querySelector(`[data-foh-classification-menu-view-dish-panel="${id}"]`)
    ?.classList.toggle("hidden", mode !== "dish");
  block
    .querySelector(`[data-foh-classification-menu-view-category-panel="${id}"]`)
    ?.classList.toggle("hidden", mode !== "category");
}

function collectViewOnlyCategoryIds(categoryId: string, picker: HTMLElement): string[] {
  const ids: string[] = [];
  picker
    .querySelectorAll<HTMLInputElement>(
      `[data-foh-classification-menu-view-category-id="${categoryId}"]:checked`,
    )
    .forEach((input) => {
      const v = input.value;
      if (v && v !== categoryId) ids.push(v);
    });
  return ids;
}

export function bindFohClassificationSettingsUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-foh-classification-settings-root]");
  if (!root || root.getAttribute("data-foh-classification-bound") === "1") return;
  root.setAttribute("data-foh-classification-bound", "1");
  bindFohSettingsNameDialog(root);

  root.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches("[data-foh-classification-menu-display-name]")) return;
    const id = input.getAttribute("data-foh-classification-menu-display-name");
    if (!id) return;
    updateCategoryMenuConfig(id, { displayName: input.value.trim() });
  });

  root.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;

    const modeRadio = target.closest<HTMLInputElement>("[data-foh-classification-menu-view-mode]");
    if (modeRadio?.checked) {
      const id = modeRadio.getAttribute("data-foh-classification-menu-view-mode");
      const mode = modeRadio.value === "dish" ? "dish" : "category";
      if (id) {
        updateCategoryMenuConfig(id, { viewOnlyMode: mode });
        const block = root.querySelector<HTMLElement>(`[data-foh-classification-menu-block="${id}"]`);
        if (block) syncViewOnlyPanels(block, mode);
      }
      return;
    }

    if (target.matches("[data-foh-classification-menu-view-category-id]")) {
      const id = (target as HTMLInputElement).getAttribute(
        "data-foh-classification-menu-view-category-id",
      );
      const picker = target.closest<HTMLElement>("[data-foh-classification-menu-view-category-picker]");
      if (id && picker) {
        updateCategoryMenuConfig(id, {
          viewOnlyCategoryIds: collectViewOnlyCategoryIds(id, picker),
        });
      }
    }
  });

  root.querySelector("[data-foh-classification-cat-add]")?.addEventListener("click", () => {
    openFohSettingsNameDialog(root, {
      title: "增加分类",
      label: "菜单分类名称",
      placeholder: "请输入菜单分类名称",
      onConfirm: (name) => {
        const state = readFohClassificationSettingsState();
        state.categories.push({
          id: newId("cls-cat"),
          name,
          scheduleIds: defaultAllDayScheduleIds(readBusinessHourSchedules()),
        });
        writeFohClassificationSettingsState(state);
        remount();
      },
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-classification-cat-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-classification-cat-edit");
      if (!id) return;
      const state = readFohClassificationSettingsState();
      const row = state.categories.find((c) => c.id === id);
      if (!row) return;
      openFohSettingsNameDialog(root, {
        title: "修改分类",
        label: "菜单分类名称",
        initialValue: row.name,
        confirmLabel: "保存",
        onConfirm: (name) => {
          const latest = readFohClassificationSettingsState();
          const target = latest.categories.find((c) => c.id === id);
          if (!target) return;
          target.name = name;
          writeFohClassificationSettingsState(latest);
          remount();
        },
      });
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-classification-cat-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-classification-cat-delete");
      if (!id) return;
      const state = readFohClassificationSettingsState();
      if (!window.confirm("确定删除该分类？相关菜单配置将一并移除。")) return;
      state.categories = state.categories.filter((c) => c.id !== id);
      writeFohClassificationSettingsState(state);
      remount();
    });
  });

  bindFohClassificationHoursPicker(root, remount);
}

/** 解析某分类下已选可看可下单菜品（供调试或后续 API 对接） */
export function readClassificationCategoryOrderableDishes(categoryId: string): DishTag[] {
  return readDishTags(orderableStorageId(categoryId));
}
