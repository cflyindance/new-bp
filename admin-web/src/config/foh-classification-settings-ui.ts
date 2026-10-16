/**
 * 前厅管理中心 · 分类管理
 * 路径：/operations/queue-call/classification-settings
 * 分类与菜单 / 分类设置使用公共子导航；基本资料抽屉与菜单宽抽屉分离，保留原菜单能力：
 * 可下单、仅可查看（按菜 / 按分类）、展示渠道、供应时段；菜品选用产线 + 组/类/菜结构。
 */

import {
  bindBrandMenuStructurePicker,
  BRAND_MENU_LINE_OPTIONS,
  BRAND_MENU_STRUCTURE_BY_LINE,
  coerceBrandMenuStructureByLine,
  countBrandMenuStructureDishesByLine,
  emptyBrandMenuStructureByLine,
  flattenBrandMenuStructureByLine,
  isBrandMenuLineId,
  readBrandMenuStructureByLineFromPicker,
  renderBrandMenuStructurePickerHtml,
  type BrandMenuLineId,
  type BrandMenuStructureByLine,
} from "./brand-menu-structure-picker-ui";
import {
  bindImageSourcePicker,
  openImageSourcePicker,
  renderImageSourcePickerModalsHtml,
} from "./image-source-picker-ui";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import {
  ensureGuestMenuClassificationModeToggleMigrated,
  GUEST_MENU_CLASSIFICATION_MODE_SEQ,
  renderGuestMenuClassificationModePanelHtml,
} from "./module-settings-guest-menu-classification-mode-ui";
import { writeModuleSettingToggleOn } from "./module-settings-toggle-ui";
import {
  formatScheduleSummary,
  readBusinessHourSchedules,
  type StoreBusinessHourSchedule,
} from "./module-settings-store-business-hours-ui";
import { readPageDraftFieldForCurrentPath } from "./page-settings-draft";

export const FOH_CLASSIFICATION_SETTINGS_BASE = "/operations/queue-call/classification-settings";

export const FOH_CLASSIFICATION_SETTINGS_TABS = [
  {
    id: "category",
    title: "分类与菜单",
    titleEn: "Classification & menu",
    path: `${FOH_CLASSIFICATION_SETTINGS_BASE}/categories`,
  },
  {
    id: "settings",
    title: "分类设置",
    titleEn: "Classification settings",
    path: `${FOH_CLASSIFICATION_SETTINGS_BASE}/settings`,
  },
] as const;

export type FohClassificationSettingsTabId = (typeof FOH_CLASSIFICATION_SETTINGS_TABS)[number]["id"];

const STORAGE_ID = "foh-classification-settings:v1";
const CATEGORIES_FIELD_ID = "foh-classification-categories";

export type CategoryMenuConfig = {
  displayName: string;
  viewOnlyMode: "dish" | "category";
  viewOnlyCategoryIds: string[];
  /** 可看可下单：按产线组/类/菜结构 */
  orderableStructureByLine: BrandMenuStructureByLine;
  /** 仅可查看 · 按菜配置：按产线组/类/菜结构 */
  viewOnlyStructureByLine: BrandMenuStructureByLine;
};

export type ClassificationCategoryRecord = {
  id: string;
  name: string;
  imageDataUrl?: string;
  scheduleIds: string[];
  /** 在哪些渠道展示该分类（Kiosk / eMenu / SDI） */
  displayChannels: BrandMenuLineId[];
};

const ALL_DISPLAY_CHANNELS: BrandMenuLineId[] = BRAND_MENU_LINE_OPTIONS.map((l) => l.id);

type FohClassificationSettingsState = {
  categories: ClassificationCategoryRecord[];
  menuByCategory: Record<string, CategoryMenuConfig>;
  hoursNote: string;
};

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DESTRUCTIVE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newCategoryId(): string {
  return `cls-cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function normalizeScheduleIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return uniqueStrings(raw.filter((id): id is string => typeof id === "string" && id.length > 0));
}

function defaultAllDayScheduleIds(schedules: StoreBusinessHourSchedule[]): string[] {
  const allDay = schedules.find((s) => s.name === "All Day");
  if (allDay) return [allDay.id];
  return schedules.length > 0 ? [schedules[0]!.id] : [];
}

function normalizeDisplayChannels(raw: unknown): BrandMenuLineId[] {
  if (!Array.isArray(raw)) return [...ALL_DISPLAY_CHANNELS];
  const ids = uniqueStrings(
    raw.filter((id): id is string => typeof id === "string" && isBrandMenuLineId(id)),
  ) as BrandMenuLineId[];
  return ALL_DISPLAY_CHANNELS.filter((id) => ids.includes(id));
}

function formatDisplayChannelsSummary(channels: BrandMenuLineId[]): string {
  if (channels.length === 0) return "—";
  const labels = BRAND_MENU_LINE_OPTIONS.filter((l) => channels.includes(l.id)).map((l) => l.label);
  return labels.length > 0 ? labels.join("、") : "—";
}

function renderDisplayChannelPicker(selectedChannels: BrandMenuLineId[]): string {
  const options = BRAND_MENU_LINE_OPTIONS.map((line) => {
    const checked = selectedChannels.includes(line.id);
    return `
    <label
      class="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
    >
      <input
        type="checkbox"
        class="size-4 shrink-0 accent-primary"
        data-cls-display-channel
        value="${escapeHtml(line.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="text-sm font-medium text-foreground">${escapeHtml(line.label)}</span>
    </label>`;
  }).join("");
  return `
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3" data-cls-display-channel-picker>
      ${options}
    </div>`;
}

function normalizeCategory(
  raw: Partial<ClassificationCategoryRecord> & { hours?: string; menuStructureKeys?: unknown },
): ClassificationCategoryRecord | null {
  if (!raw?.id || typeof raw.name !== "string" || !raw.name.trim()) return null;
  const schedules = readBusinessHourSchedules();
  const validIds = new Set(schedules.map((s) => s.id));
  let scheduleIds = normalizeScheduleIds(raw.scheduleIds).filter((id) => validIds.has(id));
  if (scheduleIds.length === 0 && typeof raw.hours === "string" && raw.hours.trim()) {
    const label = raw.hours.trim();
    scheduleIds = schedules
      .filter((s) => s.name === label || s.name.toLowerCase() === label.toLowerCase())
      .map((s) => s.id);
  }
  if (scheduleIds.length === 0) scheduleIds = defaultAllDayScheduleIds(schedules);
  return {
    id: raw.id,
    name: raw.name.trim(),
    imageDataUrl:
      typeof raw.imageDataUrl === "string" && raw.imageDataUrl.trim()
        ? raw.imageDataUrl.trim()
        : undefined,
    scheduleIds,
    displayChannels: normalizeDisplayChannels(raw.displayChannels),
  };
}

function defaultMenuConfig(category: ClassificationCategoryRecord): CategoryMenuConfig {
  return {
    displayName: category.name,
    viewOnlyMode: "category",
    viewOnlyCategoryIds: [],
    orderableStructureByLine: emptyBrandMenuStructureByLine(),
    viewOnlyStructureByLine: emptyBrandMenuStructureByLine(),
  };
}

function normalizeMenuByCategory(
  raw: unknown,
  categories: ClassificationCategoryRecord[],
): Record<string, CategoryMenuConfig> {
  const src =
    raw && typeof raw === "object"
      ? (raw as Record<
          string,
          Partial<CategoryMenuConfig> & {
            orderableStructureKeys?: unknown;
            viewOnlyStructureKeys?: unknown;
          }
        >)
      : {};
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
      orderableStructureByLine: coerceBrandMenuStructureByLine(
        prev?.orderableStructureByLine,
        prev?.orderableStructureKeys,
      ),
      viewOnlyStructureByLine: coerceBrandMenuStructureByLine(
        prev?.viewOnlyStructureByLine,
        prev?.viewOnlyStructureKeys,
      ),
    };
  }
  return out;
}

function defaultCategories(): ClassificationCategoryRecord[] {
  const schedules = readBusinessHourSchedules();
  const defaultIds = defaultAllDayScheduleIds(schedules);
  return [
    {
      id: "cls-preset-lunch-hotpot",
      name: "午餐火锅",
      scheduleIds: [...defaultIds],
      displayChannels: [...ALL_DISPLAY_CHANNELS],
    },
    {
      id: "cls-preset-dinner-bbq",
      name: "晚餐烧烤",
      scheduleIds: [...defaultIds],
      displayChannels: [...ALL_DISPLAY_CHANNELS],
    },
  ];
}

function readStoredCategoriesRaw(): string | null | undefined {
  const draft = readPageDraftFieldForCurrentPath(CATEGORIES_FIELD_ID);
  if (draft !== undefined) return draft;
  try {
    return localStorage.getItem(moduleSettingStorageKey(CATEGORIES_FIELD_ID));
  } catch {
    return null;
  }
}

function parseCategoriesList(raw: unknown): ClassificationCategoryRecord[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return [];
  return raw
    .map((c) => normalizeCategory(c as Partial<ClassificationCategoryRecord>))
    .filter((c): c is ClassificationCategoryRecord => c !== null);
}

export function readClassificationCategories(): ClassificationCategoryRecord[] {
  const fieldRaw = readStoredCategoriesRaw();
  if (fieldRaw !== null && fieldRaw !== undefined && fieldRaw !== "") {
    try {
      const list = parseCategoriesList(JSON.parse(fieldRaw) as unknown);
      if (list) return list;
    } catch {
      /* fall through */
    }
  }

  const legacy = readModuleSettingJson(STORAGE_ID, null) as Partial<FohClassificationSettingsState> | null;
  if (legacy && Array.isArray(legacy.categories)) {
    const list = parseCategoriesList(legacy.categories);
    if (list) return list;
  }

  return defaultCategories();
}

function readMenuByCategoryMap(categories: ClassificationCategoryRecord[]): Record<string, CategoryMenuConfig> {
  const legacy = readModuleSettingJson(STORAGE_ID, null) as Partial<FohClassificationSettingsState> | null;
  return normalizeMenuByCategory(legacy?.menuByCategory, categories);
}

export function writeClassificationState(
  categories: ClassificationCategoryRecord[],
  menuByCategory: Record<string, CategoryMenuConfig>,
): void {
  const normalizedMenu = normalizeMenuByCategory(menuByCategory, categories);
  writeModuleSettingJson(CATEGORIES_FIELD_ID, categories);
  writeModuleSettingJson(STORAGE_ID, {
    categories,
    menuByCategory: normalizedMenu,
    hoursNote: "",
  } satisfies FohClassificationSettingsState);
}

export function readFohClassificationSettingsState(): FohClassificationSettingsState {
  const categories = readClassificationCategories();
  return {
    categories,
    menuByCategory: readMenuByCategoryMap(categories),
    hoursNote: "",
  };
}

export function writeFohClassificationSettingsState(state: FohClassificationSettingsState): void {
  writeClassificationState(state.categories, state.menuByCategory);
}

export function isFohClassificationSettingsPath(path: string): boolean {
  return (
    path === FOH_CLASSIFICATION_SETTINGS_BASE ||
    path.startsWith(`${FOH_CLASSIFICATION_SETTINGS_BASE}/`)
  );
}

export function resolveFohClassificationSettingsTab(
  path: string,
): FohClassificationSettingsTabId {
  if (
    path === `${FOH_CLASSIFICATION_SETTINGS_BASE}/settings` ||
    path.startsWith(`${FOH_CLASSIFICATION_SETTINGS_BASE}/settings/`)
  ) {
    return "settings";
  }
  return "category";
}

export function getFohClassificationSettingsTabPath(
  tabId: FohClassificationSettingsTabId,
): string {
  return (
    FOH_CLASSIFICATION_SETTINGS_TABS.find((t) => t.id === tabId)?.path ??
    FOH_CLASSIFICATION_SETTINGS_BASE
  );
}

function renderClassificationSettingsPanel(): string {
  ensureGuestMenuClassificationModeToggleMigrated();
  writeModuleSettingToggleOn(GUEST_MENU_CLASSIFICATION_MODE_SEQ, true);
  return `
    <div class="space-y-6" data-foh-classification-settings-panel="settings">
      <section class="rounded-xl border border-border bg-card px-4 py-4">
        <div class="min-w-0">
          <h3 class="m-0 text-sm font-semibold text-card-foreground">分类模式</h3>
          <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">选择采用分类浏览模式的终端，食客先浏览分类再选菜。此设置作用于整个分类管理模块。</p>
        </div>
        <p class="mt-3 text-sm font-medium text-foreground">分类模式适用终端</p>
        ${renderGuestMenuClassificationModePanelHtml(true)}
        <p class="mt-3 text-xs leading-relaxed text-muted-foreground">单个分类的展示渠道与供应时段，请在「分类与菜单」中编辑。此处不修改分类自身的渠道配置。</p>
      </section>
    </div>`;
}

function formatCategoryHoursSummary(category: ClassificationCategoryRecord): string {
  const schedules = readBusinessHourSchedules();
  const names = category.scheduleIds
    .map((id) => schedules.find((s) => s.id === id)?.name)
    .filter((name): name is string => !!name);
  return names.length > 0 ? uniqueStrings(names).join(" / ") : "—";
}

type MenuEditScope = "orderable" | "viewOnly";

function parseMenuEditScope(raw: string | null | undefined): MenuEditScope {
  return raw === "viewOnly" ? "viewOnly" : "orderable";
}

function renderScheduleOption(schedule: StoreBusinessHourSchedule, selectedIds: string[]): string {
  const checked = selectedIds.includes(schedule.id);
  return `
    <label
      class="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
      data-cls-schedule-option
    >
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 accent-primary"
        data-cls-schedule-id
        value="${escapeHtml(schedule.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-foreground">${escapeHtml(schedule.name)}</span>
        <span class="block text-xs tabular-nums text-muted-foreground">${escapeHtml(formatScheduleSummary(schedule))}</span>
      </span>
    </label>`;
}

function renderSchedulePicker(selectedIds: string[]): string {
  const schedules = readBusinessHourSchedules();
  if (schedules.length === 0) {
    return `
      <div class="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
        暂无可用营业时间，请先在「门店信息 → 营业时间」中新建营业时间规则。
      </div>`;
  }
  return `
    <div class="space-y-2" data-cls-schedule-picker>
      ${schedules.map((s) => renderScheduleOption(s, selectedIds)).join("")}
    </div>`;
}

function renderViewOnlyCategoryPicker(
  categoryId: string,
  allCategories: ClassificationCategoryRecord[],
  cfg: CategoryMenuConfig,
): string {
  const others = allCategories.filter((c) => c.id !== categoryId);
  if (others.length === 0) {
    return `<p class="m-0 text-xs text-muted-foreground">暂无其他分类可选；请先新增其他分类后再配置。</p>`;
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
            data-cls-view-category-id
            ${checked ? "checked" : ""}
          />
          <span>${escapeHtml(other.name)}</span>
        </label>`;
    })
    .join("");
  return `<div class="flex flex-wrap gap-2" data-cls-view-category-picker>${chips}</div>`;
}

function renderMenuConfigSection(
  categoryId: string,
  allCategories: ClassificationCategoryRecord[],
  cfg: CategoryMenuConfig,
  scope: MenuEditScope,
): string {
  const dishMode = cfg.viewOnlyMode === "dish";
  const categoryMode = cfg.viewOnlyMode === "category";
  if (scope === "orderable") {
    return `
      <div class="space-y-4" data-cls-menu-config="${escapeHtml(categoryId)}" data-edit-scope="orderable">
        <div>
          <p class="m-0 mb-2 text-sm font-medium text-foreground">可下单菜单</p>
          <p class="m-0 mb-2 text-xs text-muted-foreground">先选产线，再勾选该产线对应的组 / 类 / 菜</p>
          <div data-cls-orderable-structure>
            ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
              enableLines: true,
              selectionByLine: cfg.orderableStructureByLine,
            })}
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="space-y-4" data-cls-menu-config="${escapeHtml(categoryId)}" data-edit-scope="viewOnly">
      <div>
        <p class="m-0 mb-2 text-sm font-medium text-foreground">仅可查看菜单</p>
        <div class="mb-3 flex flex-wrap items-center gap-4 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="cls-view-mode-${escapeHtml(categoryId)}"
              value="dish"
              class="${MODULE_SETTING_CONTROL_CLASS}"
              data-cls-view-mode
              ${dishMode ? "checked" : ""}
            />
            <span>按菜配置</span>
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="cls-view-mode-${escapeHtml(categoryId)}"
              value="category"
              class="${MODULE_SETTING_CONTROL_CLASS}"
              data-cls-view-mode
              ${categoryMode ? "checked" : ""}
            />
            <span>按类别配置</span>
          </label>
        </div>
        <div class="${dishMode ? "" : "hidden"}" data-cls-view-dish-panel>
          <p class="m-0 mb-2 text-xs text-muted-foreground">先选产线，再勾选该产线对应的组 / 类 / 菜</p>
          <div data-cls-view-structure>
            ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
              enableLines: true,
              selectionByLine: cfg.viewOnlyStructureByLine,
            })}
          </div>
        </div>
        <div class="${categoryMode ? "" : "hidden"}" data-cls-view-category-panel>
          <p class="m-0 mb-2 text-xs text-muted-foreground">勾选其他分类，食客在本分类下仅可查看对应分类菜单，不能在当前分类下单。</p>
          ${renderViewOnlyCategoryPicker(categoryId, allCategories, cfg)}
        </div>
      </div>
    </div>`;
}

function formatMenuDetailButtonLabel(count: number, unit: string): string {
  return count === 0 ? "未配置 · 去配置" : `${count} ${unit} · 配置`;
}

/** 保留内置组/类展开计数，同时补计主机菜单中已保存的菜品叶子；同菜跨产线分别累计。 */
export function countClassificationConfiguredDishes(byLine: BrandMenuStructureByLine): number {
  const externalLeaves = BRAND_MENU_LINE_OPTIONS.reduce((sum, line) => {
    const builtIn = new Set(BRAND_MENU_STRUCTURE_BY_LINE[line.id].flatMap(group =>
      group.categories.flatMap(category => category.dishes.map(dish => `d:${group.id}:${category.id}:${dish.id}`)),
    ));
    return sum + new Set((byLine[line.id] ?? []).filter(key => key.startsWith("d:") && !builtIn.has(key))).size;
  }, 0);
  return countBrandMenuStructureDishesByLine(byLine) + externalLeaves;
}

function countViewOnlyConfigured(cfg: CategoryMenuConfig): number {
  if (cfg.viewOnlyMode === "category") return cfg.viewOnlyCategoryIds.length;
  return countClassificationConfiguredDishes(cfg.viewOnlyStructureByLine);
}

function renderCategoryImageCell(category: ClassificationCategoryRecord): string {
  if (category.imageDataUrl) {
    return `<img src="${escapeHtml(category.imageDataUrl)}" alt="" class="size-12 rounded border border-border object-cover" />`;
  }
  return `<div class="flex size-12 items-center justify-center rounded border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground" aria-label="未设置分类图片">暂无图片</div>`;
}

function renderCategoryTable(
  categories: ClassificationCategoryRecord[],
  menuByCategory: Record<string, CategoryMenuConfig> = {},
): string {
  if (categories.length === 0) {
    return `<p class="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">暂无分类，请点击「新增分类」</p>`;
  }
  const rows = categories
    .map((cat) => {
      const cfg = menuByCategory[cat.id] ?? defaultMenuConfig(cat);
      const orderableCount = countClassificationConfiguredDishes(cfg.orderableStructureByLine);
      const viewOnlyCount = countViewOnlyConfigured(cfg);
      return `
      <tr class="border-t border-border" data-cls-row data-cls-id="${escapeHtml(cat.id)}">
        <td class="px-3 py-3"><div class="flex items-center gap-3">${renderCategoryImageCell(cat)}<span class="font-medium text-foreground">${escapeHtml(cat.name)}</span></div></td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatDisplayChannelsSummary(cat.displayChannels))}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatCategoryHoursSummary(cat))}</td>
        <td class="py-3 pr-3 text-sm">
          <button type="button" class="${BTN_LINK} min-h-9 px-2 text-left" data-cls-menu-detail="orderable" data-cls-id="${escapeHtml(cat.id)}">${formatMenuDetailButtonLabel(orderableCount, "道菜")}</button>
        </td>
        <td class="py-3 pr-3 text-sm">
          <button type="button" class="${BTN_LINK} min-h-9 px-2 text-left" data-cls-menu-detail="viewOnly" data-cls-id="${escapeHtml(cat.id)}">${cfg.viewOnlyMode === "category" ? "按分类" : "按菜"} · ${formatMenuDetailButtonLabel(viewOnlyCount, cfg.viewOnlyMode === "category" ? "个分类" : "道菜")}</button>
        </td>
        <td class="py-3 text-right text-sm whitespace-nowrap">
          <button type="button" class="${BTN_LINK} mr-3" data-cls-edit data-cls-id="${escapeHtml(cat.id)}">编辑</button>
          <details class="relative inline-block text-left" data-cls-more><summary class="inline-flex min-h-9 cursor-pointer list-none items-center rounded-md border border-border px-3 hover:bg-muted" aria-label="${escapeHtml(cat.name)}的更多操作">更多</summary><div class="mt-1 min-w-28 rounded-md border border-border bg-card p-1 shadow-md"><button type="button" class="min-h-9 w-full rounded px-3 text-left text-sm text-destructive hover:bg-muted" data-cls-delete data-cls-id="${escapeHtml(cat.id)}">删除分类</button></div></details>
        </td>
      </tr>`;
    })
    .join("");
  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">分类</th>
            <th class="px-3 py-2 font-medium">展示渠道</th>
            <th class="px-3 py-2 font-medium">供应时段</th>
            <th class="px-3 py-2 font-medium">可下单菜单</th>
            <th class="px-3 py-2 font-medium">仅可查看菜单</th>
            <th class="px-3 py-2 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderCategoryDialog(
  categories: ClassificationCategoryRecord[],
  editingId: string | null,
  isCreate: boolean,
): string {
  const editing = editingId && !isCreate ? categories.find((c) => c.id === editingId) : null;
  const title = editing ? "编辑分类" : "新增分类";
  const categoryId = editingId || newCategoryId();
  const name = editing?.name ?? "";
  const imagePreview = editing?.imageDataUrl
    ? `<img src="${escapeHtml(editing.imageDataUrl)}" alt="" class="mx-auto max-h-24 rounded border border-border object-contain" data-cls-image-preview />`
    : `<div class="mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground" data-cls-image-preview>暂无图片</div>`;
  const selectedScheduleIds = editing?.scheduleIds ?? defaultAllDayScheduleIds(readBusinessHourSchedules());
  const selectedChannels = editing?.displayChannels ?? [...ALL_DISPLAY_CHANNELS];

  return `
    <div
      class="fixed inset-0 z-[100] hidden items-stretch justify-end"
      data-cls-dialog
      data-editing-id="${escapeHtml(isCreate ? "" : categoryId)}"
      data-category-id="${escapeHtml(categoryId)}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cls-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-cls-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border bg-card shadow-xl">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="cls-dialog-title" class="text-base font-semibold text-card-foreground">${title}</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-cls-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <h4 class="text-sm font-semibold text-foreground">基本信息</h4>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground" for="cls-create-name">分类名称</label>
            <input id="cls-create-name" type="text" maxlength="50" class="${INPUT_CLASS}" data-cls-name value="${escapeHtml(name)}" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground">分类图片</label>
            <p class="text-xs text-muted-foreground">支持 PNG、JPG、JPEG；1MB 以内</p>
            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              ${imagePreview}
              <button type="button" class="${BTN_GHOST}" data-cls-image-pick>选择图片</button>
            </div>
          </div>
          <h4 class="border-t border-border pt-4 text-sm font-semibold text-foreground">展示与供应</h4>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">展示渠道</p>
            <p class="text-xs text-muted-foreground">勾选后，该分类仅在对应渠道展示</p>
            ${renderDisplayChannelPicker(selectedChannels)}
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">供应时段</p>
            <p class="text-xs text-muted-foreground">引用「门店信息 → 营业时间」中的规则。</p>
            ${renderSchedulePicker(selectedScheduleIds)}
          </div>
          <p class="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">分类保存到页面草稿后，可从列表配置可下单与仅可查看菜单。</p>
          <p class="hidden text-sm text-destructive" role="alert" data-cls-name-error>请输入分类名称。</p>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-cls-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-cls-dialog-save>保存到页面草稿</button>
        </div>
      </div>
    </div>`;
}

function renderMenuEditDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-stretch justify-end"
      data-cls-menu-edit-dialog
      data-category-id=""
      data-edit-scope=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="cls-menu-edit-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-cls-menu-edit-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex h-full w-full max-w-6xl flex-col overflow-hidden border-l border-border bg-card shadow-xl">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="cls-menu-edit-dialog-title" class="text-base font-semibold text-card-foreground" data-cls-menu-edit-title>编辑菜单</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-cls-menu-edit-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" data-cls-menu-edit-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-cls-menu-edit-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-cls-menu-edit-save>保存到页面草稿</button>
        </div>
      </div>
    </div>`;
}

function renderDeleteConfirmDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-cls-delete-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="cls-delete-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-cls-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="cls-delete-dialog-title" class="text-base font-semibold text-card-foreground">确认删除</h3>
        </div>
        <div class="px-5 py-4">
          <input type="hidden" data-cls-delete-target-id value="" />
          <p class="m-0 text-sm text-foreground" data-cls-delete-message>确定删除该分类？删除后无法恢复。</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-cls-delete-cancel>取消</button>
          <button type="button" class="${BTN_DESTRUCTIVE}" data-cls-delete-confirm>删除</button>
        </div>
      </div>
    </div>`;
}

function showDialog(dialog: HTMLElement | null): void {
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideDialog(dialog: HTMLElement | null): void {
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
}

function syncViewOnlyPanels(dialog: HTMLElement, mode: "dish" | "category"): void {
  dialog.querySelector("[data-cls-view-dish-panel]")?.classList.toggle("hidden", mode !== "dish");
  dialog.querySelector("[data-cls-view-category-panel]")?.classList.toggle("hidden", mode !== "category");
}

function refreshClassificationPanel(
  panel: HTMLElement,
  editingId: string | null = null,
  isCreate = false,
): void {
  const state = readFohClassificationSettingsState();
  const tableWrap = panel.querySelector<HTMLElement>("[data-cls-table-wrap]");
  if (tableWrap) tableWrap.innerHTML = renderCategoryTable(state.categories, state.menuByCategory);
  filterClassificationRows(panel);
  panel.querySelector("[data-cls-dialog]")?.remove();
  panel.insertAdjacentHTML(
    "beforeend",
    renderCategoryDialog(state.categories, editingId, isCreate),
  );
  if (!panel.querySelector("[data-cls-delete-dialog]")) {
    panel.insertAdjacentHTML("beforeend", renderDeleteConfirmDialog());
  }
  if (!panel.querySelector("[data-cls-menu-edit-dialog]")) {
    panel.insertAdjacentHTML("beforeend", renderMenuEditDialogShell());
  }
}

function showCategoryDialog(panel: HTMLElement, editingId: string | null): void {
  const state = readFohClassificationSettingsState();
  const isCreate = !editingId;
  const resolvedId = editingId || newCategoryId();
  if (editingId && !state.categories.find((c) => c.id === editingId)) {
    refreshClassificationPanel(panel, null, false);
  } else {
    refreshClassificationPanel(panel, resolvedId, isCreate);
  }
  const dialog = panel.querySelector<HTMLElement>("[data-cls-dialog]");
  dialog?.classList.remove("hidden");
  dialog?.classList.add("flex");
  dialog?.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  dialog?.querySelector<HTMLInputElement>("[data-cls-name]")?.focus();
}

function hideCategoryDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-editing-id", "");
}

function collectScheduleIdsFromDialog(dialog: HTMLElement): string[] {
  return [...dialog.querySelectorAll<HTMLInputElement>("[data-cls-schedule-id]:checked")].map(
    (input) => input.value,
  );
}

function collectMenuConfigFromMenuDialog(
  dialog: HTMLElement,
  categoryId: string,
  prev: CategoryMenuConfig,
  scope: MenuEditScope,
): CategoryMenuConfig {
  if (scope === "orderable") {
    const orderablePicker = dialog.querySelector<HTMLElement>(
      "[data-cls-orderable-structure] [data-brand-menu-structure-picker]",
    );
    return {
      ...prev,
      orderableStructureByLine: orderablePicker
        ? readBrandMenuStructureByLineFromPicker(orderablePicker)
        : emptyBrandMenuStructureByLine(),
    };
  }
  const modeRadio = dialog.querySelector<HTMLInputElement>("[data-cls-view-mode]:checked");
  const viewOnlyMode = modeRadio?.value === "dish" ? "dish" : "category";
  const viewOnlyCategoryIds = [
    ...dialog.querySelectorAll<HTMLInputElement>("[data-cls-view-category-id]:checked"),
  ]
    .map((input) => input.value)
    .filter((id) => id && id !== categoryId);
  const viewPicker = dialog.querySelector<HTMLElement>(
    "[data-cls-view-structure] [data-brand-menu-structure-picker]",
  );
  return {
    ...prev,
    viewOnlyMode,
    viewOnlyCategoryIds,
    viewOnlyStructureByLine: viewPicker
      ? readBrandMenuStructureByLineFromPicker(viewPicker)
      : prev.viewOnlyStructureByLine,
  };
}

function showMenuEditDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-menu-edit-dialog]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideMenuEditDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-menu-edit-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-category-id", "");
  dialog.setAttribute("data-edit-scope", "");
  const body = dialog.querySelector<HTMLElement>("[data-cls-menu-edit-body]");
  if (body) body.innerHTML = "";
}

function openMenuEditDialog(panel: HTMLElement, categoryId: string, scope: MenuEditScope): void {
  const state = readFohClassificationSettingsState();
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) return;
  const cfg = state.menuByCategory[categoryId] ?? defaultMenuConfig(category);
  const dialog = panel.querySelector<HTMLElement>("[data-cls-menu-edit-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-cls-menu-edit-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-cls-menu-edit-title]");
  if (!dialog || !body) return;
  dialog.setAttribute("data-category-id", categoryId);
  dialog.setAttribute("data-edit-scope", scope);
  if (titleEl) {
    titleEl.textContent =
      `配置菜单 · ${category.name}`;
  }
  body.innerHTML = `<div class="flex gap-2 border-b border-border pb-3" role="tablist" aria-label="菜单类型">${(["orderable", "viewOnly"] as const).map(key => `<button type="button" role="tab" aria-selected="${key === scope}" class="min-h-9 rounded-md px-4 aria-selected:bg-primary aria-selected:text-primary-foreground" data-cls-menu-tab="${key}">${key === "orderable" ? "可下单菜单" : "仅可查看菜单"}</button>`).join("")}</div>${(["orderable", "viewOnly"] as const).map(key => `<section role="tabpanel" aria-label="${key === "orderable" ? "可下单菜单" : "仅可查看菜单"}" data-cls-menu-pane="${key}" class="${key === scope ? "" : "hidden"}">${renderMenuConfigSection(categoryId, state.categories, cfg, key)}</section>`).join("")}`;
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showMenuEditDialog(panel);
  dialog.querySelector<HTMLButtonElement>(`[data-cls-menu-tab="${scope}"]`)?.focus();
}

function saveMenuEditDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-menu-edit-dialog]");
  if (!dialog) return;
  const categoryId = dialog.getAttribute("data-category-id") || "";
  if (!categoryId) return;
  const state = readFohClassificationSettingsState();
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) return;
  const prev = state.menuByCategory[categoryId] ?? defaultMenuConfig(category);
  const orderable = collectMenuConfigFromMenuDialog(dialog, categoryId, prev, "orderable");
  state.menuByCategory[categoryId] = collectMenuConfigFromMenuDialog(dialog, categoryId, orderable, "viewOnly");
  writeClassificationState(state.categories, state.menuByCategory);
  hideMenuEditDialog(panel);
  refreshClassificationPanel(panel, null, false);
}

function collectDisplayChannelsFromDialog(dialog: HTMLElement): BrandMenuLineId[] {
  const checked = [...dialog.querySelectorAll<HTMLInputElement>("[data-cls-display-channel]:checked")]
    .map((input) => input.value)
    .filter(isBrandMenuLineId);
  return ALL_DISPLAY_CHANNELS.filter((id) => checked.includes(id));
}

function saveCategoryFromDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-dialog]");
  if (!dialog) return;
  const name = dialog.querySelector<HTMLInputElement>("[data-cls-name]")?.value.trim() ?? "";
  if (!name) {
    dialog.querySelector("[data-cls-name-error]")?.classList.remove("hidden");
    dialog.querySelector<HTMLInputElement>("[data-cls-name]")?.focus();
    return;
  }
  const editingId = dialog.getAttribute("data-editing-id") || "";
  const categoryId = dialog.getAttribute("data-category-id") || editingId || newCategoryId();
  const scheduleIds = collectScheduleIdsFromDialog(dialog);
  const displayChannels = collectDisplayChannelsFromDialog(dialog);
  const preview = dialog.querySelector<HTMLImageElement>("[data-cls-image-preview]");
  const imageDataUrl = preview?.tagName === "IMG" ? preview.src : undefined;
  const state = readFohClassificationSettingsState();
  const nextRecord: ClassificationCategoryRecord = {
    id: categoryId,
    name,
    imageDataUrl,
    scheduleIds,
    displayChannels,
  };
  const prevMenu =
    (editingId ? state.menuByCategory[editingId] : state.menuByCategory[categoryId]) ??
    defaultMenuConfig(nextRecord);
  const nextMenu: CategoryMenuConfig = {
    ...prevMenu,
    displayName: name,
  };
  if (editingId) {
    const idx = state.categories.findIndex((c) => c.id === editingId);
    if (idx >= 0) {
      state.categories[idx] = { ...state.categories[idx], ...nextRecord, id: editingId };
      state.menuByCategory[editingId] = nextMenu;
    } else {
      state.categories.push(nextRecord);
      state.menuByCategory[categoryId] = nextMenu;
    }
  } else {
    state.categories.push(nextRecord);
    state.menuByCategory[categoryId] = nextMenu;
  }
  writeClassificationState(state.categories, state.menuByCategory);
  hideCategoryDialog(panel);
  refreshClassificationPanel(panel, null, false);
}

function deleteCategory(panel: HTMLElement, categoryId: string): void {
  const state = readFohClassificationSettingsState();
  state.categories = state.categories.filter((c) => c.id !== categoryId);
  delete state.menuByCategory[categoryId];
  // 清理其它分类中对该类别的仅查看引用
  for (const key of Object.keys(state.menuByCategory)) {
    const cfg = state.menuByCategory[key];
    if (!cfg) continue;
    cfg.viewOnlyCategoryIds = cfg.viewOnlyCategoryIds.filter((id) => id !== categoryId);
  }
  writeClassificationState(state.categories, state.menuByCategory);
  refreshClassificationPanel(panel, null, false);
}

function openDeleteCategoryDialog(panel: HTMLElement, categoryId: string, categoryName: string): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-delete-dialog]");
  const idInput = panel.querySelector<HTMLInputElement>("[data-cls-delete-target-id]");
  const messageEl = panel.querySelector<HTMLElement>("[data-cls-delete-message]");
  if (!dialog || !idInput || !messageEl) return;
  idInput.value = categoryId;
  const label = categoryName ? `「${categoryName}」` : "该分类";
  messageEl.textContent = `确定删除${label}？该分类的菜单配置及其他分类对它的仅查看引用将一并移除，商品资料不受影响。`;
  showDialog(dialog);
}

function hideDeleteCategoryDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-delete-dialog]");
  const idInput = panel.querySelector<HTMLInputElement>("[data-cls-delete-target-id]");
  if (idInput) idInput.value = "";
  hideDialog(dialog);
}

function confirmDeleteCategory(panel: HTMLElement): void {
  const categoryId = panel.querySelector<HTMLInputElement>("[data-cls-delete-target-id]")?.value.trim();
  if (!categoryId) return;
  deleteCategory(panel, categoryId);
  hideDeleteCategoryDialog(panel);
}

function applyCategoryImagePreview(panel: HTMLElement, dataUrl: string): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-dialog]");
  const previewHost = dialog?.querySelector<HTMLElement>("[data-cls-image-preview]");
  if (!previewHost) return;
  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = "";
  img.className = "mx-auto max-h-24 rounded border border-border object-contain";
  img.dataset.clsImagePreview = "";
  previewHost.replaceWith(img);
}

function setCategoryImagePickError(panel: HTMLElement, message: string): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-dialog]");
  if (!dialog) return;
  let tip = dialog.querySelector<HTMLElement>("[data-cls-image-error]");
  if (!tip) {
    tip = document.createElement("p");
    tip.className = "m-0 text-xs text-destructive";
    tip.dataset.clsImageError = "";
    const pickBtn = dialog.querySelector("[data-cls-image-pick]");
    pickBtn?.parentElement?.insertAdjacentElement("afterend", tip);
  }
  tip.textContent = message;
}

function clearCategoryImagePickError(panel: HTMLElement): void {
  panel.querySelector("[data-cls-image-error]")?.remove();
}

function filterClassificationRows(panel: HTMLElement): void {
  const query = panel.querySelector<HTMLInputElement>("[data-cls-search]")?.value.trim().toLocaleLowerCase() ?? "";
  const channel = panel.querySelector<HTMLSelectElement>("[data-cls-channel-filter]")?.value ?? "";
  const state = readFohClassificationSettingsState();
  let count = 0;
  panel.querySelectorAll<HTMLElement>("[data-cls-row]").forEach(row => {
    const category = state.categories.find(c => c.id === row.dataset.clsId);
    const visible = !!category && category.name.toLocaleLowerCase().includes(query) && (!channel || category.displayChannels.some(id => id === channel));
    row.hidden = !visible;
    if (visible) count++;
  });
  const summary = panel.querySelector<HTMLElement>("[data-cls-count]");
  if (summary) summary.textContent = `显示 ${count} / ${state.categories.length} 个分类`;
  panel.querySelector<HTMLElement>("[data-cls-filter-empty]")?.classList.toggle("hidden", count > 0 || state.categories.length === 0);
}

export function renderFohClassificationSettingsPage(path: string): string {
  const tabId = resolveFohClassificationSettingsTab(path);
  const state = readFohClassificationSettingsState();

  const mainHtml =
    tabId === "settings"
      ? renderClassificationSettingsPanel()
      : `
      <div class="min-h-0 flex-1 overflow-auto" data-foh-classification-management>
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3">
            <label class="flex items-center gap-2 whitespace-nowrap text-sm">分类名称<input type="search" class="${INPUT_CLASS}" placeholder="搜索分类名称" data-cls-search /></label>
            <label class="flex items-center gap-2 whitespace-nowrap text-sm">展示渠道<select class="${INPUT_CLASS}" data-cls-channel-filter><option value="">全部渠道</option>${BRAND_MENU_LINE_OPTIONS.map(line => `<option value="${line.id}">${line.label}</option>`).join("")}</select></label>
            <span class="text-xs text-muted-foreground" data-cls-count>显示 ${state.categories.length} / ${state.categories.length} 个分类</span>
          </div>
          <div data-cls-table-wrap>${renderCategoryTable(state.categories, state.menuByCategory)}</div>
          <p class="hidden py-6 text-center text-sm text-muted-foreground" role="status" data-cls-filter-empty>没有符合条件的分类，请调整名称或渠道筛选。</p>
        </div>
        ${renderCategoryDialog(state.categories, null, true)}
        ${renderMenuEditDialogShell()}
        ${renderDeleteConfirmDialog()}
        ${renderImageSourcePickerModalsHtml()}
      </div>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-foh-classification-settings-root>
      <header class="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div><h2 class="text-lg font-semibold text-foreground">${tabId === "settings" ? "分类设置" : "分类与菜单"}</h2><p class="mt-1 text-sm text-muted-foreground">${tabId === "settings" ? "配置分类浏览模式的适用终端。" : "配置食客端展示的菜单分类，以及各分类可下单和仅供浏览的菜单内容。"}</p></div>
        ${tabId === "category" ? `<button type="button" class="${BTN_PRIMARY}" data-cls-create-header>新增分类</button>` : ""}
      </header>
      <div
        class="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
        data-foh-classification-settings-main
        data-active-tab="${tabId}"
      >
        ${mainHtml}
      </div>
    </div>`;
}

export function bindFohClassificationSettingsUi(_remount: () => void): void {
  document.querySelectorAll<HTMLElement>("[data-foh-classification-management]").forEach((panel) => {
    if (panel.dataset.fohClassificationBound === "1") return;
    panel.dataset.fohClassificationBound = "1";

    bindImageSourcePicker(panel, {
      onSelect: (result) => {
        clearCategoryImagePickError(panel);
        applyCategoryImagePreview(panel, result.dataUrl);
      },
      onError: (message) => setCategoryImagePickError(panel, message),
    });

    panel.closest("[data-foh-classification-settings-root]")?.querySelector("[data-cls-create-header]")?.addEventListener("click", () => showCategoryDialog(panel, null));
    panel.addEventListener("input", e => { if ((e.target as HTMLElement).matches("[data-cls-search]")) filterClassificationRows(panel); });
    panel.addEventListener("change", e => { if ((e.target as HTMLElement).matches("[data-cls-channel-filter]")) filterClassificationRows(panel); });
    panel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-cls-create]")) {
        showCategoryDialog(panel, null);
        return;
      }
      const menuTab = target.closest<HTMLElement>("[data-cls-menu-tab]");
      if (menuTab) {
        const scope = menuTab.dataset.clsMenuTab;
        const dialog = menuTab.closest<HTMLElement>("[data-cls-menu-edit-dialog]")!;
        dialog.dataset.editScope = scope;
        dialog.querySelectorAll<HTMLElement>("[data-cls-menu-tab]").forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.clsMenuTab === scope)));
        dialog.querySelectorAll<HTMLElement>("[data-cls-menu-pane]").forEach(pane => pane.classList.toggle("hidden", pane.dataset.clsMenuPane !== scope));
        return;
      }
      const menuDetailBtn = target.closest<HTMLElement>("[data-cls-menu-detail]");
      if (menuDetailBtn) {
        const id = menuDetailBtn.getAttribute("data-cls-id");
        const scope = parseMenuEditScope(menuDetailBtn.getAttribute("data-cls-menu-detail"));
        if (id) openMenuEditDialog(panel, id, scope);
        return;
      }
      const editBtn = target.closest<HTMLElement>("[data-cls-edit]");
      if (editBtn) {
        showCategoryDialog(panel, editBtn.getAttribute("data-cls-id"));
        return;
      }
      const deleteBtn = target.closest<HTMLElement>("[data-cls-delete]");
      if (deleteBtn) {
        const id = deleteBtn.getAttribute("data-cls-id");
        if (!id) return;
        const cat = readClassificationCategories().find((c) => c.id === id);
        deleteBtn.closest("details")?.removeAttribute("open");
        openDeleteCategoryDialog(panel, id, cat?.name ?? "");
        return;
      }
      if (
        target.closest("[data-cls-delete-cancel]") ||
        target.closest("[data-cls-delete-backdrop]")
      ) {
        hideDeleteCategoryDialog(panel);
        return;
      }
      if (target.closest("[data-cls-delete-confirm]")) {
        confirmDeleteCategory(panel);
        return;
      }
      if (target.closest("[data-cls-image-pick]")) {
        clearCategoryImagePickError(panel);
        openImageSourcePicker(panel);
        return;
      }
      if (
        target.closest("[data-cls-dialog-cancel]") ||
        target.closest("[data-cls-dialog-close]") ||
        target.closest("[data-cls-dialog-backdrop]")
      ) {
        hideCategoryDialog(panel);
        return;
      }
      if (target.closest("[data-cls-dialog-save]")) {
        saveCategoryFromDialog(panel);
        return;
      }
      if (
        target.closest("[data-cls-menu-edit-cancel]") ||
        target.closest("[data-cls-menu-edit-close]") ||
        target.closest("[data-cls-menu-edit-backdrop]")
      ) {
        hideMenuEditDialog(panel);
        return;
      }
      if (target.closest("[data-cls-menu-edit-save]")) {
        saveMenuEditDialog(panel);
      }
    });

    panel.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      const host =
        target.closest<HTMLElement>("[data-cls-menu-edit-dialog]") ||
        target.closest<HTMLElement>("[data-cls-dialog]");
      if (!host || host.classList.contains("hidden")) return;
      const modeRadio = target.closest<HTMLInputElement>("[data-cls-view-mode]");
      if (modeRadio?.checked) {
        syncViewOnlyPanels(host, modeRadio.value === "dish" ? "dish" : "category");
      }
    });

    panel.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const dialog = (e.target as HTMLElement).closest<HTMLElement>('[role="dialog"]');
        if (dialog) {
          const controls = [...dialog.querySelectorAll<HTMLElement>('button, input, select, summary, [tabindex="0"]')].filter(el => el.getClientRects().length && !el.hasAttribute("disabled") && !el.matches('[data-cls-dialog-backdrop], [data-cls-menu-edit-backdrop], [data-cls-delete-backdrop]'));
          const first = controls[0], last = controls[controls.length - 1];
          if (e.shiftKey && e.target === first && last) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && e.target === last && first) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key !== "Escape") return;
      const uploadModal = panel.querySelector<HTMLElement>("[data-image-source-upload-modal]");
      const libraryModal = panel.querySelector<HTMLElement>("[data-image-source-library-modal]");
      if (
        (uploadModal && !uploadModal.classList.contains("hidden")) ||
        (libraryModal && !libraryModal.classList.contains("hidden"))
      ) {
        return;
      }
      const deleteDialog = panel.querySelector<HTMLElement>("[data-cls-delete-dialog]");
      if (deleteDialog && !deleteDialog.classList.contains("hidden")) {
        e.preventDefault();
        hideDeleteCategoryDialog(panel);
        return;
      }
      const menuDialog = panel.querySelector<HTMLElement>("[data-cls-menu-edit-dialog]");
      if (menuDialog && !menuDialog.classList.contains("hidden")) {
        e.preventDefault();
        hideMenuEditDialog(panel);
        return;
      }
      const dialog = panel.querySelector<HTMLElement>("[data-cls-dialog]");
      if (dialog && !dialog.classList.contains("hidden")) {
        e.preventDefault();
        hideCategoryDialog(panel);
      }
    });
  });
}

/** 解析某分类下已选可看可下单菜单结构（按产线） */
export function readClassificationCategoryOrderableStructureByLine(
  categoryId: string,
): BrandMenuStructureByLine {
  const state = readFohClassificationSettingsState();
  return (
    state.menuByCategory[categoryId]?.orderableStructureByLine ?? emptyBrandMenuStructureByLine()
  );
}

/** @deprecated 返回三产线扁平合并；优先用 readClassificationCategoryOrderableStructureByLine */
export function readClassificationCategoryOrderableStructureKeys(categoryId: string): string[] {
  return flattenBrandMenuStructureByLine(
    readClassificationCategoryOrderableStructureByLine(categoryId),
  );
}
