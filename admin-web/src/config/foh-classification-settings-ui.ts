/**
 * 前厅管理中心 · 分类管理
 * 路径：/operations/queue-call/classification-settings
 * 展示/交互对齐店中店「品牌与菜单」（单列表 + 弹窗），保留原菜单能力：
 * 可看可下单、仅可查看（按菜 / 按类别）、营业时间；菜品选用组/类/菜三级结构。
 */

import {
  bindBrandMenuStructurePicker,
  readBrandMenuStructureKeysFromPicker,
  renderBrandMenuStructurePickerHtml,
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
    path: FOH_CLASSIFICATION_SETTINGS_BASE,
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
  /** 可看可下单：组/类/菜结构 key */
  orderableStructureKeys: string[];
  /** 仅可查看 · 按菜配置：组/类/菜结构 key */
  viewOnlyStructureKeys: string[];
};

export type ClassificationCategoryRecord = {
  id: string;
  name: string;
  imageDataUrl?: string;
  scheduleIds: string[];
};

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
  };
}

function normalizeStructureKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return uniqueStrings(raw.filter((id): id is string => typeof id === "string" && id.length > 0));
}

function defaultMenuConfig(category: ClassificationCategoryRecord): CategoryMenuConfig {
  return {
    displayName: category.name,
    viewOnlyMode: "category",
    viewOnlyCategoryIds: [],
    orderableStructureKeys: [],
    viewOnlyStructureKeys: [],
  };
}

function normalizeMenuByCategory(
  raw: unknown,
  categories: ClassificationCategoryRecord[],
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
      orderableStructureKeys: normalizeStructureKeys(prev?.orderableStructureKeys),
      viewOnlyStructureKeys: normalizeStructureKeys(prev?.viewOnlyStructureKeys),
    };
  }
  return out;
}

function defaultCategories(): ClassificationCategoryRecord[] {
  const schedules = readBusinessHourSchedules();
  const defaultIds = defaultAllDayScheduleIds(schedules);
  return [
    { id: "cls-preset-lunch-hotpot", name: "午餐火锅", scheduleIds: [...defaultIds] },
    { id: "cls-preset-dinner-bbq", name: "晚餐烧烤", scheduleIds: [...defaultIds] },
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

function renderClassificationTabBar(activeTabId: FohClassificationSettingsTabId): string {
  const items = FOH_CLASSIFICATION_SETTINGS_TABS.map((tab) => {
    const selected = tab.id === activeTabId;
    return `
      <a
        href="#${tab.path}"
        role="tab"
        data-foh-classification-settings-tab="${tab.id}"
        class="min-h-10 border-b-2 px-4 text-sm font-medium transition-colors ${
          selected
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
        }"
        ${selected ? 'aria-selected="true" aria-current="page"' : 'aria-selected="false"'}
      >${escapeHtml(tab.title)}</a>`;
  }).join("");

  return `
    <div
      class="flex shrink-0 gap-1 border-b border-border"
      role="tablist"
      aria-label="分类管理"
      data-foh-classification-settings-nav
    >
      ${items}
    </div>`;
}

function renderClassificationSettingsPanel(): string {
  ensureGuestMenuClassificationModeToggleMigrated();
  writeModuleSettingToggleOn(GUEST_MENU_CLASSIFICATION_MODE_SEQ, true);
  return `
    <div class="space-y-6" data-foh-classification-settings-panel="settings">
      <section class="rounded-xl border border-border bg-card px-4 py-4">
        <div class="min-w-0">
          <h3 class="m-0 text-sm font-semibold text-card-foreground">分类模式</h3>
          <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">根据选择的产线，按菜单分类层级先浏览分类再选菜（非普通扁平菜单）。</p>
        </div>
        ${renderGuestMenuClassificationModePanelHtml(true)}
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
        暂无可用营业时间，请先在「营业与运营 → 营业时段」中新建营业时间规则。
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
          <p class="m-0 mb-2 text-sm font-medium text-foreground">可下单的菜</p>
          <div data-cls-orderable-structure>
            ${renderBrandMenuStructurePickerHtml(cfg.orderableStructureKeys)}
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="space-y-4" data-cls-menu-config="${escapeHtml(categoryId)}" data-edit-scope="viewOnly">
      <div>
        <p class="m-0 mb-2 text-sm font-medium text-foreground">不可下单的菜</p>
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
          <div data-cls-view-structure>
            ${renderBrandMenuStructurePickerHtml(cfg.viewOnlyStructureKeys)}
          </div>
        </div>
        <div class="${categoryMode ? "" : "hidden"}" data-cls-view-category-panel>
          <p class="m-0 mb-2 text-xs text-muted-foreground">勾选其他分类，食客在本分类下仅可查看对应分类菜单（不可下单）。</p>
          ${renderViewOnlyCategoryPicker(categoryId, allCategories, cfg)}
        </div>
      </div>
    </div>`;
}

function renderCategoryImageCell(category: ClassificationCategoryRecord): string {
  if (category.imageDataUrl) {
    return `<img src="${escapeHtml(category.imageDataUrl)}" alt="" class="size-12 rounded border border-border object-cover" />`;
  }
  return `<div class="flex size-12 items-center justify-center rounded border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">NO IMAGE</div>`;
}

function renderCategoryTable(categories: ClassificationCategoryRecord[]): string {
  if (categories.length === 0) {
    return `<p class="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">暂无分类，请点击「新增分类」</p>`;
  }
  const rows = categories
    .map((cat) => {
      return `
      <tr class="border-t border-border" data-cls-row data-cls-id="${escapeHtml(cat.id)}">
        <td class="py-3 pr-3 text-sm text-foreground">${escapeHtml(cat.name)}</td>
        <td class="py-3 pr-3">${renderCategoryImageCell(cat)}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatCategoryHoursSummary(cat))}</td>
        <td class="py-3 pr-3 text-sm">
          <button type="button" class="${BTN_LINK}" data-cls-menu-detail="orderable" data-cls-id="${escapeHtml(cat.id)}">详情</button>
        </td>
        <td class="py-3 pr-3 text-sm">
          <button type="button" class="${BTN_LINK}" data-cls-menu-detail="viewOnly" data-cls-id="${escapeHtml(cat.id)}">详情</button>
        </td>
        <td class="py-3 text-right text-sm whitespace-nowrap">
          <button type="button" class="${BTN_LINK} mr-3" data-cls-edit data-cls-id="${escapeHtml(cat.id)}">编辑</button>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-cls-delete data-cls-id="${escapeHtml(cat.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");
  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">分类名称</th>
            <th class="px-3 py-2 font-medium">分类图片</th>
            <th class="px-3 py-2 font-medium">营业时间</th>
            <th class="px-3 py-2 font-medium">可下单</th>
            <th class="px-3 py-2 font-medium">不可下单</th>
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
    : `<div class="mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground" data-cls-image-preview>NO IMAGES</div>`;
  const selectedScheduleIds = editing?.scheduleIds ?? defaultAllDayScheduleIds(readBusinessHourSchedules());

  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-cls-dialog
      data-editing-id="${escapeHtml(isCreate ? "" : categoryId)}"
      data-category-id="${escapeHtml(categoryId)}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cls-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-cls-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="cls-dialog-title" class="text-base font-semibold text-card-foreground">${title}</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-cls-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">营业时间</p>
            ${renderSchedulePicker(selectedScheduleIds)}
          </div>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-cls-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-cls-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderMenuEditDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-cls-menu-edit-dialog
      data-category-id=""
      data-edit-scope=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="cls-menu-edit-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-cls-menu-edit-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="cls-menu-edit-dialog-title" class="text-base font-semibold text-card-foreground" data-cls-menu-edit-title>编辑菜单</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-cls-menu-edit-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" data-cls-menu-edit-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-cls-menu-edit-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-cls-menu-edit-save>确定</button>
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
  if (tableWrap) tableWrap.innerHTML = renderCategoryTable(state.categories);
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
      orderableStructureKeys: orderablePicker
        ? readBrandMenuStructureKeysFromPicker(orderablePicker)
        : [],
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
    viewOnlyStructureKeys: viewPicker
      ? readBrandMenuStructureKeysFromPicker(viewPicker)
      : prev.viewOnlyStructureKeys,
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
      scope === "orderable" ? `可下单 · ${category.name}` : `不可下单 · ${category.name}`;
  }
  body.innerHTML = renderMenuConfigSection(categoryId, state.categories, cfg, scope);
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showMenuEditDialog(panel);
}

function saveMenuEditDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-menu-edit-dialog]");
  if (!dialog) return;
  const categoryId = dialog.getAttribute("data-category-id") || "";
  if (!categoryId) return;
  const scope = parseMenuEditScope(dialog.getAttribute("data-edit-scope"));
  const state = readFohClassificationSettingsState();
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) return;
  const prev = state.menuByCategory[categoryId] ?? defaultMenuConfig(category);
  state.menuByCategory[categoryId] = collectMenuConfigFromMenuDialog(
    dialog,
    categoryId,
    prev,
    scope,
  );
  writeClassificationState(state.categories, state.menuByCategory);
  hideMenuEditDialog(panel);
  refreshClassificationPanel(panel, null, false);
}

function saveCategoryFromDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-cls-dialog]");
  if (!dialog) return;
  const name = dialog.querySelector<HTMLInputElement>("[data-cls-name]")?.value.trim() ?? "";
  if (!name) {
    dialog.querySelector<HTMLInputElement>("[data-cls-name]")?.focus();
    return;
  }
  const editingId = dialog.getAttribute("data-editing-id") || "";
  const categoryId = dialog.getAttribute("data-category-id") || editingId || newCategoryId();
  const scheduleIds = collectScheduleIdsFromDialog(dialog);
  const preview = dialog.querySelector<HTMLImageElement>("[data-cls-image-preview]");
  const imageDataUrl = preview?.tagName === "IMG" ? preview.src : undefined;
  const state = readFohClassificationSettingsState();
  const nextRecord: ClassificationCategoryRecord = {
    id: categoryId,
    name,
    imageDataUrl,
    scheduleIds,
  };
  if (editingId) {
    const idx = state.categories.findIndex((c) => c.id === editingId);
    if (idx >= 0) {
      state.categories[idx] = { ...state.categories[idx], ...nextRecord, id: editingId };
      const existingMenu = state.menuByCategory[editingId];
      state.menuByCategory[editingId] = existingMenu
        ? { ...existingMenu, displayName: name }
        : defaultMenuConfig({ ...nextRecord, id: editingId });
    } else {
      state.categories.push(nextRecord);
      state.menuByCategory[categoryId] = defaultMenuConfig(nextRecord);
    }
  } else {
    state.categories.push(nextRecord);
    state.menuByCategory[categoryId] = defaultMenuConfig(nextRecord);
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
  messageEl.textContent = `确定删除${label}？相关菜单配置将一并移除。`;
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

export function renderFohClassificationSettingsPage(path: string): string {
  const tabId = resolveFohClassificationSettingsTab(path);
  const state = readFohClassificationSettingsState();

  const mainHtml =
    tabId === "settings"
      ? renderClassificationSettingsPanel()
      : `
      <div class="min-h-0 flex-1 overflow-auto" data-foh-classification-management>
        <div class="mt-1 space-y-3">
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button type="button" class="${BTN_PRIMARY}" data-cls-create>新增分类</button>
          </div>
          <div data-cls-table-wrap>${renderCategoryTable(state.categories)}</div>
        </div>
        ${renderCategoryDialog(state.categories, null, true)}
        ${renderMenuEditDialogShell()}
        ${renderDeleteConfirmDialog()}
        ${renderImageSourcePickerModalsHtml()}
      </div>`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-foh-classification-settings-root>
      ${renderClassificationTabBar(tabId)}
      <div
        class="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
        data-foh-classification-settings-main
        data-active-tab="${tabId}"
        role="tabpanel"
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

    panel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-cls-create]")) {
        showCategoryDialog(panel, null);
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
      const menuDialog = target.closest<HTMLElement>("[data-cls-menu-edit-dialog]");
      if (!menuDialog || menuDialog.classList.contains("hidden")) return;
      const modeRadio = target.closest<HTMLInputElement>("[data-cls-view-mode]");
      if (modeRadio?.checked) {
        syncViewOnlyPanels(menuDialog, modeRadio.value === "dish" ? "dish" : "category");
      }
    });

    panel.addEventListener("keydown", (e) => {
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

/** 解析某分类下已选可看可下单菜单结构 key（供调试或后续 API 对接） */
export function readClassificationCategoryOrderableStructureKeys(categoryId: string): string[] {
  const state = readFohClassificationSettingsState();
  return state.menuByCategory[categoryId]?.orderableStructureKeys ?? [];
}
