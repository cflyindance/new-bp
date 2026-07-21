/**
 * 前厅管理中心 · 品类管理（自助餐场景：年龄/类别、菜单、特殊品类、设置）
 * 路径：/operations/queue-call/category-settings/*
 */

import {
  bindBrandMenuStructurePicker,
  BRAND_MENU_LINE_OPTIONS,
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
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  ensureGuestCategoryModeToggleMigrated,
  GUEST_MENU_CATEGORY_MODE_SEQ,
  renderGuestCategoryModePanelHtml,
} from "./module-settings-guest-category-mode-ui";
import { writeModuleSettingToggleOn } from "./module-settings-toggle-ui";
import {
  formatScheduleSummary,
  readBusinessHourSchedules,
  type StoreBusinessHourSchedule,
} from "./module-settings-store-business-hours-ui";
import {
  bindFohSettingsNameDialog,
  openFohSettingsNameDialog,
  renderFohSettingsNameDialogShell,
} from "./foh-settings-name-dialog-ui";

export const FOH_CATEGORY_SETTINGS_BASE = "/operations/queue-call/category-settings";

export const FOH_CATEGORY_SETTINGS_TABS = [
  {
    id: "age-category",
    title: "品类类别",
    titleEn: "Category types",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/age-category`,
  },
  {
    id: "menu",
    title: "品类菜单",
    titleEn: "Category menus",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/menu`,
  },
  {
    id: "special-menu",
    title: "特殊品类",
    titleEn: "Special category",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/special-menu`,
  },
  {
    id: "settings",
    title: "品类设置",
    titleEn: "Category settings",
    path: `${FOH_CATEGORY_SETTINGS_BASE}/settings`,
  },
] as const;

export type FohCategorySettingsTabId = (typeof FOH_CATEGORY_SETTINGS_TABS)[number]["id"];

const STORAGE_ID = "foh-category-settings:v1";

const AGE_TAG_OPTIONS = ["成人", "儿童", "长者", "未标记"] as const;

type AgeBand = {
  id: string;
  name: string;
  tag: string;
  /** 在哪些渠道展示该年龄（Kiosk / eMenu / SDI） */
  displayChannels: BrandMenuLineId[];
};
type MealCategory = {
  id: string;
  name: string;
  imageDataUrl?: string;
  /** 引用的门店营业时段 id（seq 418） */
  scheduleIds: string[];
  /** 在哪些渠道展示该类别（Kiosk / eMenu / SDI） */
  displayChannels: BrandMenuLineId[];
};

const ALL_DISPLAY_CHANNELS: BrandMenuLineId[] = BRAND_MENU_LINE_OPTIONS.map((l) => l.id);

export type MenuComboKey = string;

export type MenuComboConfig = {
  displayName: string;
  viewOnlyMode: "dish" | "category";
  /** 其他年龄×类别组合的 key（仅 viewOnlyMode=category 时） */
  viewOnlyCategoryKeys: MenuComboKey[];
  /** 可看可下单：按产线组/类/菜结构 */
  orderableStructureByLine: BrandMenuStructureByLine;
  /** 仅可查看 · 按菜配置：按产线组/类/菜结构 */
  viewOnlyStructureByLine: BrandMenuStructureByLine;
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
  imageDataUrl?: string;
  /** 在哪些渠道展示该特殊品类（Kiosk / eMenu / SDI） */
  displayChannels: BrandMenuLineId[];
  /** 按产线组/类/菜结构（对齐品牌菜单） */
  structureByLine: BrandMenuStructureByLine;
};

type SpecialMenuLineId = "emenu" | "sdi";

const SPECIAL_MENU_PRODUCT_LINES = [
  { id: "emenu" as const, label: "eMenu" },
  { id: "sdi" as const, label: "SDI" },
];

type FohCategorySettingsState = {
  ages: AgeBand[];
  categories: MealCategory[];
  menuByCombo: Record<MenuComboKey, MenuComboConfig>;
  hoursNote: string;
  /** 特殊品类适用产线；有勾选即视为已开启 */
  specialMenuLines: SpecialMenuLineId[];
  specialMenus: FohSpecialMenuEntry[];
};

const DEFAULT_STATE: FohCategorySettingsState = {
  ages: [
    { id: "age-adult", name: "成人", tag: "成人", displayChannels: [...ALL_DISPLAY_CHANNELS] },
    { id: "age-child", name: "儿童", tag: "儿童", displayChannels: [...ALL_DISPLAY_CHANNELS] },
  ],
  categories: [],
  menuByCombo: {},
  hoursNote: "",
  specialMenuLines: [],
  specialMenus: [],
};

function newSpecialMenuId(): string {
  return `sm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeSpecialMenuEntry(
  raw: Partial<FohSpecialMenuEntry> & { menus?: unknown; structureKeys?: unknown },
): FohSpecialMenuEntry | null {
  if (!raw?.id) return null;
  return {
    id: raw.id,
    name: typeof raw.name === "string" ? raw.name : "",
    imageDataUrl:
      typeof raw.imageDataUrl === "string" && raw.imageDataUrl.trim()
        ? raw.imageDataUrl.trim()
        : undefined,
    displayChannels: normalizeDisplayChannels(raw.displayChannels),
    structureByLine: coerceBrandMenuStructureByLine(raw.structureByLine, raw.structureKeys),
  };
}

function normalizeSpecialMenuLines(raw: unknown, legacyEnabled?: boolean): SpecialMenuLineId[] {
  const valid = new Set<SpecialMenuLineId>(["emenu", "sdi"]);
  if (Array.isArray(raw)) {
    const lines = raw.filter(
      (id): id is SpecialMenuLineId => typeof id === "string" && valid.has(id as SpecialMenuLineId),
    );
    return uniqueStrings(lines) as SpecialMenuLineId[];
  }
  if (legacyEnabled) return ["emenu", "sdi"];
  return [];
}

function isSpecialMenuEnabled(state: FohCategorySettingsState): boolean {
  return state.specialMenuLines.length > 0;
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

function renderDisplayChannelPickerHtml(
  selectedChannels: BrandMenuLineId[],
  dataAttr: string,
): string {
  const options = BRAND_MENU_LINE_OPTIONS.map((line) => {
    const checked = selectedChannels.includes(line.id);
    return `
    <label
      class="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
    >
      <input
        type="checkbox"
        class="size-4 shrink-0 accent-primary"
        ${dataAttr}
        value="${escapeHtml(line.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="text-sm font-medium text-foreground">${escapeHtml(line.label)}</span>
    </label>`;
  }).join("");
  return `
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3" data-foh-display-channel-picker>
      ${options}
    </div>`;
}

function collectDisplayChannelsFromRoot(root: ParentNode, selector: string): BrandMenuLineId[] {
  const checked = [...root.querySelectorAll<HTMLInputElement>(`${selector}:checked`)]
    .map((input) => input.value)
    .filter(isBrandMenuLineId);
  return ALL_DISPLAY_CHANNELS.filter((id) => checked.includes(id));
}

function normalizeAgeBand(raw: Partial<AgeBand>): AgeBand | null {
  if (!raw?.id || typeof raw.name !== "string") return null;
  return {
    id: raw.id,
    name: raw.name,
    tag: typeof raw.tag === "string" && raw.tag ? raw.tag : "未标记",
    displayChannels: normalizeDisplayChannels(raw.displayChannels),
  };
}

function normalizeCategory(raw: Partial<MealCategory> & { hours?: string }): MealCategory | null {
  if (!raw?.id || !raw?.name) return null;
  const schedules = readBusinessHourSchedules();
  return {
    id: raw.id,
    name: raw.name,
    imageDataUrl:
      typeof raw.imageDataUrl === "string" && raw.imageDataUrl.trim()
        ? raw.imageDataUrl.trim()
        : undefined,
    scheduleIds: normalizeCategoryScheduleIds(raw, schedules),
    displayChannels: normalizeDisplayChannels(raw.displayChannels),
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
  return names.map((name, i) => ({
    id: ids[i]!,
    name,
    scheduleIds: [...defaultIds],
    displayChannels: [...ALL_DISPLAY_CHANNELS],
  }));
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

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DESTRUCTIVE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

function defaultMenuConfig(age: AgeBand, category: MealCategory): MenuComboConfig {
  return {
    displayName: `${age.name}${category.name}-1`,
    viewOnlyMode: "category",
    viewOnlyCategoryKeys: [],
    orderableStructureByLine: emptyBrandMenuStructureByLine(),
    viewOnlyStructureByLine: emptyBrandMenuStructureByLine(),
  };
}

function normalizeMenuByCombo(
  raw: unknown,
  combos: ComboDefinition[],
): Record<MenuComboKey, MenuComboConfig> {
  const src =
    raw && typeof raw === "object"
      ? (raw as Record<
          string,
          Partial<MenuComboConfig> & {
            orderableStructureKeys?: unknown;
            viewOnlyStructureKeys?: unknown;
          }
        >)
      : {};
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
  const o = raw as Partial<FohCategorySettingsState> & {
    menuNote?: string;
    specialMenuEnabled?: boolean;
  };
  const ages = Array.isArray(o.ages)
    ? o.ages
        .map((a) => normalizeAgeBand(a as Partial<AgeBand>))
        .filter((a): a is AgeBand => a !== null)
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
    specialMenuLines: normalizeSpecialMenuLines(o.specialMenuLines, o.specialMenuEnabled === true),
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

function renderTabBar(activePath: string): string {
  const items = FOH_CATEGORY_SETTINGS_TABS.map((tab) => {
    const selected = activePath === tab.path || activePath.startsWith(`${tab.path}/`);
    return `
      <a
        href="#${tab.path}"
        role="tab"
        data-foh-category-settings-tab="${tab.id}"
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
      aria-label="品类管理"
      data-foh-category-settings-nav
    >
      ${items}
    </div>`;
}

function renderAgeCategoryDeleteDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-foh-age-cat-delete-dialog
      data-mode=""
      data-kind=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-age-cat-delete-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-foh-age-cat-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="foh-age-cat-delete-dialog-title" class="text-base font-semibold text-card-foreground" data-foh-age-cat-delete-title>确认删除</h3>
        </div>
        <div class="px-5 py-4">
          <input type="hidden" data-foh-age-cat-delete-target-id value="" />
          <p class="m-0 text-sm text-foreground" data-foh-age-cat-delete-message>确定删除？</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-foh-age-cat-delete-cancel>取消</button>
          <button type="button" class="${BTN_DESTRUCTIVE}" data-foh-age-cat-delete-confirm>删除</button>
        </div>
      </div>
    </div>`;
}

function showAgeCategoryDeleteDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-age-cat-delete-dialog]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideAgeCategoryDeleteDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-age-cat-delete-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-mode", "");
  dialog.setAttribute("data-kind", "");
  const idInput = dialog.querySelector<HTMLInputElement>("[data-foh-age-cat-delete-target-id]");
  if (idInput) idInput.value = "";
}

function openAgeCategoryDeleteConfirm(
  root: HTMLElement,
  kind: "age" | "category",
  targetId: string,
  name: string,
): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-age-cat-delete-dialog]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-foh-age-cat-delete-title]");
  const messageEl = dialog?.querySelector<HTMLElement>("[data-foh-age-cat-delete-message]");
  const idInput = dialog?.querySelector<HTMLInputElement>("[data-foh-age-cat-delete-target-id]");
  const cancelBtn = dialog?.querySelector<HTMLElement>("[data-foh-age-cat-delete-cancel]");
  const confirmBtn = dialog?.querySelector<HTMLButtonElement>("[data-foh-age-cat-delete-confirm]");
  if (!dialog || !messageEl || !idInput || !confirmBtn) return;
  dialog.setAttribute("data-mode", "confirm");
  dialog.setAttribute("data-kind", kind);
  idInput.value = targetId;
  if (titleEl) titleEl.textContent = "确认删除";
  const label = name ? `「${name}」` : kind === "age" ? "该年龄阶段" : "该类别";
  messageEl.textContent = `确定删除${label}？相关菜单组合将一并移除。`;
  cancelBtn?.classList.remove("hidden");
  confirmBtn.textContent = "删除";
  confirmBtn.className = BTN_DESTRUCTIVE;
  showAgeCategoryDeleteDialog(root);
}

function openAgeCategoryNotice(root: HTMLElement, message: string): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-age-cat-delete-dialog]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-foh-age-cat-delete-title]");
  const messageEl = dialog?.querySelector<HTMLElement>("[data-foh-age-cat-delete-message]");
  const idInput = dialog?.querySelector<HTMLInputElement>("[data-foh-age-cat-delete-target-id]");
  const cancelBtn = dialog?.querySelector<HTMLElement>("[data-foh-age-cat-delete-cancel]");
  const confirmBtn = dialog?.querySelector<HTMLButtonElement>("[data-foh-age-cat-delete-confirm]");
  if (!dialog || !messageEl || !idInput || !confirmBtn) return;
  dialog.setAttribute("data-mode", "notice");
  dialog.setAttribute("data-kind", "");
  idInput.value = "";
  if (titleEl) titleEl.textContent = "提示";
  messageEl.textContent = message;
  cancelBtn?.classList.add("hidden");
  confirmBtn.textContent = "确定";
  confirmBtn.className = BTN_PRIMARY;
  showAgeCategoryDeleteDialog(root);
}

function confirmAgeCategoryDelete(root: HTMLElement, remount: () => void): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-age-cat-delete-dialog]");
  if (!dialog) return;
  const mode = dialog.getAttribute("data-mode") || "";
  if (mode === "notice") {
    hideAgeCategoryDeleteDialog(root);
    return;
  }
  const kind = dialog.getAttribute("data-kind") || "";
  const targetId =
    dialog.querySelector<HTMLInputElement>("[data-foh-age-cat-delete-target-id]")?.value.trim() ||
    "";
  if (!targetId || (kind !== "age" && kind !== "category")) {
    hideAgeCategoryDeleteDialog(root);
    return;
  }
  const state = readFohCategorySettingsState();
  if (kind === "age") {
    if (state.ages.length <= 1) {
      hideAgeCategoryDeleteDialog(root);
      openAgeCategoryNotice(root, "至少保留一个年龄阶段。");
      return;
    }
    state.ages = state.ages.filter((a) => a.id !== targetId);
  } else {
    if (state.categories.length <= 1) {
      hideAgeCategoryDeleteDialog(root);
      openAgeCategoryNotice(root, "至少保留一个类别。");
      return;
    }
    state.categories = state.categories.filter((c) => c.id !== targetId);
  }
  writeFohCategorySettingsState(state);
  hideAgeCategoryDeleteDialog(root);
  remountFohCategorySettings(remount);
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
          <td class="px-3 py-2.5 text-xs text-muted-foreground">${escapeHtml(formatDisplayChannelsSummary(age.displayChannels))}</td>
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

  const schedules = readBusinessHourSchedules();
  const categoryRows = state.categories
    .map((cat) => {
      const hoursLabel = formatCategoryHoursLabel(cat.scheduleIds, schedules);
      const imageCell = cat.imageDataUrl
        ? `<img src="${escapeHtml(cat.imageDataUrl)}" alt="" class="size-10 rounded border border-border object-cover" />`
        : `<div class="flex size-10 items-center justify-center rounded border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">NO IMAGE</div>`;
      return `
        <tr class="border-b border-border last:border-0" data-foh-category-cat-row="${escapeHtml(cat.id)}">
          <td class="px-3 py-2.5 text-sm">${escapeHtml(cat.name)}</td>
          <td class="px-3 py-2.5">${imageCell}</td>
          <td class="px-3 py-2.5 text-xs text-muted-foreground">${escapeHtml(formatDisplayChannelsSummary(cat.displayChannels))}</td>
          <td class="px-3 py-2.5 text-xs text-muted-foreground">${escapeHtml(hoursLabel)}</td>
          <td class="px-3 py-2.5 text-right whitespace-nowrap">
            <button type="button" class="text-xs text-primary hover:underline" data-foh-category-cat-edit="${escapeHtml(cat.id)}">编辑</button>
            <span class="mx-1 text-muted-foreground">|</span>
            <button type="button" class="text-xs text-destructive hover:underline" data-foh-category-cat-delete="${escapeHtml(cat.id)}">删除</button>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <div class="flex flex-col gap-4" data-foh-category-settings-panel="age-category">
      <section class="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <header class="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          <span class="text-sm font-medium text-foreground">年龄</span>
          <button type="button" class="${BTN_PRIMARY}" data-foh-category-age-add>增加</button>
        </header>
        <div class="min-h-0 flex-1 overflow-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border text-left text-xs text-muted-foreground">
                <th class="px-3 py-2 font-medium">名称</th>
                <th class="px-3 py-2 font-medium">展示渠道</th>
                <th class="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>${ageRows}</tbody>
          </table>
        </div>
      </section>
      <section class="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <header class="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          <span class="text-sm font-medium text-foreground">类别</span>
          <button type="button" class="${BTN_PRIMARY}" data-foh-category-cat-add>增加</button>
        </header>
        <div class="min-h-0 flex-1 overflow-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border text-left text-xs text-muted-foreground">
                <th class="px-3 py-2 font-medium">名称</th>
                <th class="px-3 py-2 font-medium">图片</th>
                <th class="px-3 py-2 font-medium">展示渠道</th>
                <th class="px-3 py-2 font-medium">营业时间</th>
                <th class="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>${categoryRows || `<tr><td colspan="5" class="px-3 py-8 text-center text-sm text-muted-foreground">暂无类别</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>`;
}

function renderCategoryScheduleOption(schedule: StoreBusinessHourSchedule, selectedIds: string[]): string {
  const checked = selectedIds.includes(schedule.id);
  return `
    <label
      class="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
    >
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 accent-primary"
        data-foh-cat-dialog-schedule
        value="${escapeHtml(schedule.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-foreground">${escapeHtml(schedule.name)}</span>
        <span class="block text-xs tabular-nums text-muted-foreground">${escapeHtml(formatScheduleSummary(schedule))}</span>
      </span>
    </label>`;
}

function renderCategorySchedulePicker(selectedIds: string[]): string {
  const schedules = readBusinessHourSchedules();
  if (schedules.length === 0) {
    return `
      <div class="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
        暂无可用营业时间，请先在「营业与运营 → 营业时段」中新建营业时间规则。
      </div>`;
  }
  return `
    <div class="space-y-2" data-foh-cat-dialog-schedule-picker>
      ${schedules.map((s) => renderCategoryScheduleOption(s, selectedIds)).join("")}
    </div>`;
}

function renderCategoryFormDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-foh-cat-form-dialog
      data-editing-id=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-cat-form-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-foh-cat-form-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="foh-cat-form-dialog-title" class="text-base font-semibold text-card-foreground" data-foh-cat-form-title>编辑类别</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-foh-cat-form-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground" for="foh-cat-form-name">类别名称</label>
            <input id="foh-cat-form-name" type="text" maxlength="50" class="${INPUT_CLASS}" data-foh-cat-form-name value="" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground">类别图片</label>
            <p class="text-xs text-muted-foreground">支持 PNG、JPG、JPEG；1MB 以内</p>
            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div
                class="mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground"
                data-foh-cat-image-preview
              >NO IMAGES</div>
              <button type="button" class="${BTN_GHOST}" data-foh-cat-image-pick>选择图片</button>
            </div>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">展示渠道</p>
            <p class="text-xs text-muted-foreground">勾选后，该类别仅在对应渠道展示</p>
            <div data-foh-cat-form-channels-host></div>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">营业时间</p>
            <div data-foh-cat-form-schedule-host></div>
          </div>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-foh-cat-form-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-foh-cat-form-save>确定</button>
        </div>
      </div>
    </div>`;
}

type MenuEditScope = "orderable" | "viewOnly";

function parseMenuEditScope(raw: string | null | undefined): MenuEditScope {
  return raw === "viewOnly" ? "viewOnly" : "orderable";
}

function renderViewOnlyCategoryPicker(
  combo: ComboDefinition,
  allCombos: ComboDefinition[],
  cfg: MenuComboConfig,
): string {
  const others = allCombos.filter((c) => c.key !== combo.key);
  if (others.length === 0) {
    return `<p class="m-0 text-xs text-muted-foreground">暂无其他组合可选；请先在品类类别中增加年龄或类别。</p>`;
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
            data-foh-menu-view-category-key
            ${checked ? "checked" : ""}
          />
          <span>${escapeHtml(other.title)}</span>
        </label>`;
    })
    .join("");

  return `<div class="flex flex-wrap gap-2" data-foh-menu-view-category-picker>${chips}</div>`;
}

function renderMenuEditDialogBody(
  combo: ComboDefinition,
  allCombos: ComboDefinition[],
  cfg: MenuComboConfig,
  scope: MenuEditScope,
): string {
  const dishMode = cfg.viewOnlyMode === "dish";
  const categoryMode = cfg.viewOnlyMode === "category";
  if (scope === "orderable") {
    return `
      <div class="space-y-4" data-foh-menu-edit-config="${escapeHtml(combo.key)}" data-edit-scope="orderable">
        <div>
          <p class="m-0 mb-2 text-sm font-medium text-foreground">可下单的菜</p>
          <p class="m-0 mb-2 text-xs text-muted-foreground">先选产线，再勾选该产线对应的组 / 类 / 菜</p>
          <div data-foh-menu-orderable-structure>
            ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
              enableLines: true,
              selectionByLine: cfg.orderableStructureByLine,
            })}
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="space-y-4" data-foh-menu-edit-config="${escapeHtml(combo.key)}" data-edit-scope="viewOnly">
      <div>
        <p class="m-0 mb-2 text-sm font-medium text-foreground">不可下单的菜</p>
        <div class="mb-3 flex flex-wrap items-center gap-4 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="foh-menu-view-mode-${escapeHtml(combo.key)}"
              value="dish"
              class="${MODULE_SETTING_CONTROL_CLASS}"
              data-foh-menu-view-mode
              ${dishMode ? "checked" : ""}
            />
            <span>按菜配置</span>
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="foh-menu-view-mode-${escapeHtml(combo.key)}"
              value="category"
              class="${MODULE_SETTING_CONTROL_CLASS}"
              data-foh-menu-view-mode
              ${categoryMode ? "checked" : ""}
            />
            <span>按类别配置</span>
          </label>
        </div>
        <div class="${dishMode ? "" : "hidden"}" data-foh-menu-view-dish-panel>
          <p class="m-0 mb-2 text-xs text-muted-foreground">先选产线，再勾选该产线对应的组 / 类 / 菜</p>
          <div data-foh-menu-view-structure>
            ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
              enableLines: true,
              selectionByLine: cfg.viewOnlyStructureByLine,
            })}
          </div>
        </div>
        <div class="${categoryMode ? "" : "hidden"}" data-foh-menu-view-category-panel>
          <p class="m-0 mb-2 text-xs text-muted-foreground">勾选其他「年龄-类别」组合，食客在本套餐下仅可查看对应类别菜单（不可下单）。</p>
          ${renderViewOnlyCategoryPicker(combo, allCombos, cfg)}
        </div>
      </div>
    </div>`;
}

function renderMenuEditDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-foh-menu-edit-dialog
      data-combo-key=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-menu-edit-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-foh-menu-edit-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="foh-menu-edit-dialog-title" class="text-base font-semibold text-card-foreground" data-foh-menu-edit-title>编辑菜单</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-foh-menu-edit-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" data-foh-menu-edit-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-foh-menu-edit-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-foh-menu-edit-save>确定</button>
        </div>
      </div>
    </div>`;
}

function formatMenuDetailButtonLabel(count: number): string {
  return `详情（${count}）`;
}

function countViewOnlyConfigured(cfg: MenuComboConfig): number {
  if (cfg.viewOnlyMode === "category") return cfg.viewOnlyCategoryKeys.length;
  return countBrandMenuStructureDishesByLine(cfg.viewOnlyStructureByLine);
}

function renderMenuComboRow(
  combo: ComboDefinition,
  schedules: StoreBusinessHourSchedule[],
  cfg: MenuComboConfig,
): string {
  const hoursLabel = formatCategoryHoursLabel(combo.category.scheduleIds, schedules);
  const orderableCount = countBrandMenuStructureDishesByLine(cfg.orderableStructureByLine);
  const viewOnlyCount = countViewOnlyConfigured(cfg);
  return `
    <tr class="border-t border-border" data-foh-menu-combo-row="${escapeHtml(combo.key)}">
      <td class="py-3 pr-3 text-sm font-medium text-foreground">${escapeHtml(combo.title)}</td>
      <td class="py-3 pr-3 text-xs text-muted-foreground">${escapeHtml(hoursLabel)}</td>
      <td class="py-3 pr-3 text-sm">
        <button type="button" class="${BTN_LINK}" data-foh-menu-detail="orderable" data-foh-menu-combo-key="${escapeHtml(combo.key)}">${formatMenuDetailButtonLabel(orderableCount)}</button>
      </td>
      <td class="py-3 pr-3 text-sm">
        <button type="button" class="${BTN_LINK}" data-foh-menu-detail="viewOnly" data-foh-menu-combo-key="${escapeHtml(combo.key)}">${formatMenuDetailButtonLabel(viewOnlyCount)}</button>
      </td>
    </tr>`;
}

function renderMenuPanel(state: FohCategorySettingsState): string {
  const combos = listMenuCombinations(state);
  if (combos.length === 0) {
    return `
      <div class="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground" data-foh-category-settings-panel="menu">
        请先在「品类类别」中配置至少一个年龄与一个类别，系统将自动生成菜单配置。
      </div>`;
  }

  const schedules = readBusinessHourSchedules();
  const rows = combos
    .map((combo) =>
      renderMenuComboRow(
        combo,
        schedules,
        state.menuByCombo[combo.key] ?? defaultMenuConfig(combo.age, combo.category),
      ),
    )
    .join("");

  return `
    <div class="space-y-3" data-foh-category-settings-panel="menu">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium">菜单组合</th>
              <th class="px-3 py-2 font-medium">营业时间</th>
              <th class="px-3 py-2 font-medium">可下单</th>
              <th class="px-3 py-2 font-medium">不可下单</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderSpecialMenuLinesHtml(selectedLines: SpecialMenuLineId[]): string {
  const selected = new Set(selectedLines);
  const cells = SPECIAL_MENU_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground cursor-pointer sm:px-4 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-foh-special-menu-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="mt-3 flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-foh-special-menu-lines
      role="group"
      aria-label="特殊品类适用产线"
    >
      ${cells}
    </div>`;
}

function renderSpecialMenuImageCell(entry: FohSpecialMenuEntry): string {
  if (entry.imageDataUrl) {
    return `<img src="${escapeHtml(entry.imageDataUrl)}" alt="" class="size-12 rounded border border-border object-cover" />`;
  }
  return `<div class="flex size-12 items-center justify-center rounded border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">NO IMAGE</div>`;
}

function renderSpecialMenuTable(entries: FohSpecialMenuEntry[]): string {
  if (entries.length === 0) {
    return `<p class="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">暂无特殊品类，请点击「新增特殊品类」</p>`;
  }
  const rows = entries
    .map((entry) => {
      const dishCount = countBrandMenuStructureDishesByLine(entry.structureByLine);
      return `
      <tr class="border-t border-border" data-foh-special-menu-row data-foh-special-menu-id="${escapeHtml(entry.id)}">
        <td class="py-3 pr-3 text-sm text-foreground">${escapeHtml(entry.name || "未命名")}</td>
        <td class="py-3 pr-3">${renderSpecialMenuImageCell(entry)}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatDisplayChannelsSummary(entry.displayChannels))}</td>
        <td class="py-3 pr-3 text-sm">
          <button type="button" class="${BTN_LINK}" data-foh-special-menu-detail="${escapeHtml(entry.id)}">${formatMenuDetailButtonLabel(dishCount)}</button>
        </td>
        <td class="py-3 text-right text-sm whitespace-nowrap">
          <button type="button" class="${BTN_LINK} mr-3" data-foh-special-menu-edit="${escapeHtml(entry.id)}">编辑</button>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-foh-special-menu-delete="${escapeHtml(entry.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");
  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">名称</th>
            <th class="px-3 py-2 font-medium">图片</th>
            <th class="px-3 py-2 font-medium">展示渠道</th>
            <th class="px-3 py-2 font-medium">菜单</th>
            <th class="px-3 py-2 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderSpecialMenuDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-foh-special-menu-dialog
      data-editing-id=""
      data-entry-id=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-special-menu-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-foh-special-menu-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="foh-special-menu-dialog-title" class="text-base font-semibold text-card-foreground" data-foh-special-menu-dialog-title>新增特殊品类</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-foh-special-menu-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4" data-foh-special-menu-dialog-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-foh-special-menu-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-foh-special-menu-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderSpecialMenuViewDialogShell(): string {
  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-foh-special-menu-view-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="foh-special-menu-view-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-foh-special-menu-view-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="foh-special-menu-view-dialog-title" class="text-base font-semibold text-card-foreground" data-foh-special-menu-view-title>菜单</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-foh-special-menu-view-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-foh-special-menu-view-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_PRIMARY}" data-foh-special-menu-view-close>关闭</button>
        </div>
      </div>
    </div>`;
}

function renderSpecialMenuDialogBody(
  entryId: string,
  name: string,
  structureByLine: BrandMenuStructureByLine,
  displayChannels: BrandMenuLineId[],
  imageDataUrl?: string,
): string {
  const imagePreview = imageDataUrl
    ? `<img src="${escapeHtml(imageDataUrl)}" alt="" class="mx-auto max-h-24 rounded border border-border object-contain" data-foh-special-menu-image-preview />`
    : `<div class="mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground" data-foh-special-menu-image-preview>NO IMAGES</div>`;
  return `
    <div class="space-y-4" data-foh-special-menu-entry="${escapeHtml(entryId)}">
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-foreground" for="foh-special-menu-name-input">名称</label>
        <input
          id="foh-special-menu-name-input"
          type="text"
          maxlength="50"
          class="${INPUT_CLASS}"
          data-foh-special-menu-name
          value="${escapeHtml(name)}"
        />
      </div>
      <div class="space-y-1.5">
        <label class="block text-sm font-medium text-foreground">图片</label>
        <p class="text-xs text-muted-foreground">支持 PNG、JPG、JPEG；1MB 以内</p>
        <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          ${imagePreview}
          <button type="button" class="${BTN_GHOST}" data-foh-special-menu-image-pick>选择图片</button>
        </div>
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium text-foreground">展示渠道</p>
        <p class="text-xs text-muted-foreground">勾选后，该特殊品类仅在对应渠道展示</p>
        ${renderDisplayChannelPickerHtml(displayChannels, "data-foh-special-menu-display-channel")}
      </div>
      <div class="space-y-1.5">
        <p class="m-0 mb-2 text-sm font-medium text-foreground">菜单</p>
        <p class="m-0 mb-2 text-xs text-muted-foreground">先选产线，再勾选该产线对应的组 / 类 / 菜</p>
        <div data-foh-special-menu-structure>
          ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
            enableLines: true,
            selectionByLine: structureByLine,
          })}
        </div>
      </div>
    </div>`;
}

function renderSpecialMenuPanel(state: FohCategorySettingsState): string {
  if (!isSpecialMenuEnabled(state)) {
    return `
      <div class="space-y-6" data-foh-category-settings-panel="special-menu">
        <div class="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          特殊品类未展示。请前往「品类设置」勾选适用产线后，再在此配置特殊品类。
        </div>
      </div>`;
  }

  return `
    <div class="mt-1 space-y-3" data-foh-category-settings-panel="special-menu">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="${BTN_PRIMARY}" data-foh-special-menu-add>新增特殊品类</button>
      </div>
      <div data-foh-special-menu-table-wrap>${renderSpecialMenuTable(state.specialMenus)}</div>
    </div>`;
}

function renderSettingsPanel(state: FohCategorySettingsState): string {
  ensureGuestCategoryModeToggleMigrated(GUEST_MENU_CATEGORY_MODE_SEQ);
  writeModuleSettingToggleOn(GUEST_MENU_CATEGORY_MODE_SEQ, true);
  return `
    <div class="space-y-6" data-foh-category-settings-panel="settings">
      <section class="rounded-xl border border-border bg-card px-4 py-4">
        <div class="min-w-0">
          <h3 class="m-0 text-sm font-semibold text-card-foreground">展示特殊品类</h3>
          <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">根据选定产线展示特殊品类，可在「特殊品类」中配置，并在对应产线的品类模式中选择。</p>
        </div>
        ${renderSpecialMenuLinesHtml(state.specialMenuLines)}
      </section>
      <section class="rounded-xl border border-border bg-card px-4 py-4">
        <div class="min-w-0">
          <h3 class="m-0 text-sm font-semibold text-card-foreground">品类模式</h3>
          <p class="m-0 mt-1 text-xs leading-relaxed text-muted-foreground">根据选定产线，使用品类先分类再选菜的点单形式（非普通扁平菜单）。</p>
        </div>
        ${renderGuestCategoryModePanelHtml(GUEST_MENU_CATEGORY_MODE_SEQ, true)}
      </section>
    </div>`;
}

function renderTabContent(tabId: FohCategorySettingsTabId, state: FohCategorySettingsState): string {
  switch (tabId) {
    case "menu":
      return renderMenuPanel(state);
    case "special-menu":
      return renderSpecialMenuPanel(state);
    case "settings":
      return renderSettingsPanel(state);
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
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      data-foh-category-settings-root
    >
      ${renderTabBar(tabPath)}
      <div
        class="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
        data-foh-category-settings-main
        data-active-tab="${tabId}"
        role="tabpanel"
      >
        ${renderTabContent(tabId, state)}
      </div>
      ${renderMenuEditDialogShell()}
      ${renderCategoryFormDialogShell()}
      ${renderSpecialMenuDialogShell()}
      ${renderSpecialMenuViewDialogShell()}
      ${renderAgeCategoryDeleteDialog()}
      ${renderFohSettingsNameDialogShell()}
      ${renderImageSourcePickerModalsHtml()}
    </div>`;
}

function showCategoryFormDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-cat-form-dialog]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideCategoryFormDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-cat-form-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-editing-id", "");
}

function setCategoryFormImagePreview(dialog: HTMLElement, imageDataUrl?: string): void {
  const previewHost = dialog.querySelector<HTMLElement>("[data-foh-cat-image-preview]");
  if (!previewHost) return;
  if (imageDataUrl) {
    const img = document.createElement("img");
    img.src = imageDataUrl;
    img.alt = "";
    img.className = "mx-auto max-h-24 rounded border border-border object-contain";
    img.dataset.fohCatImagePreview = "";
    previewHost.replaceWith(img);
    return;
  }
  if (previewHost.tagName === "IMG") {
    const placeholder = document.createElement("div");
    placeholder.className =
      "mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground";
    placeholder.dataset.fohCatImagePreview = "";
    placeholder.textContent = "NO IMAGES";
    previewHost.replaceWith(placeholder);
  }
}

function applyFohCatImagePreview(root: HTMLElement, dataUrl: string): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-cat-form-dialog]");
  if (!dialog) return;
  setCategoryFormImagePreview(dialog, dataUrl);
}

function setFohCatImagePickError(root: HTMLElement, message: string): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-cat-form-dialog]");
  if (!dialog) return;
  let tip = dialog.querySelector<HTMLElement>("[data-foh-cat-image-error]");
  if (!tip) {
    tip = document.createElement("p");
    tip.className = "m-0 text-xs text-destructive";
    tip.dataset.fohCatImageError = "";
    const pickBtn = dialog.querySelector("[data-foh-cat-image-pick]");
    pickBtn?.parentElement?.insertAdjacentElement("afterend", tip);
  }
  tip.textContent = message;
}

function clearFohCatImagePickError(root: HTMLElement): void {
  root.querySelector("[data-foh-cat-image-error]")?.remove();
}

function setSpecialMenuImagePreview(dialog: HTMLElement, imageDataUrl?: string): void {
  const previewHost = dialog.querySelector<HTMLElement>("[data-foh-special-menu-image-preview]");
  if (!previewHost) return;
  if (imageDataUrl) {
    const img = document.createElement("img");
    img.src = imageDataUrl;
    img.alt = "";
    img.className = "mx-auto max-h-24 rounded border border-border object-contain";
    img.dataset.fohSpecialMenuImagePreview = "";
    previewHost.replaceWith(img);
    return;
  }
  if (previewHost.tagName === "IMG") {
    const placeholder = document.createElement("div");
    placeholder.className =
      "mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground";
    placeholder.dataset.fohSpecialMenuImagePreview = "";
    placeholder.textContent = "NO IMAGES";
    previewHost.replaceWith(placeholder);
  }
}

function applySpecialMenuImagePreview(root: HTMLElement, dataUrl: string): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  if (!dialog || dialog.classList.contains("hidden")) return;
  setSpecialMenuImagePreview(dialog, dataUrl);
}

function setSpecialMenuImagePickError(root: HTMLElement, message: string): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  if (!dialog) return;
  let tip = dialog.querySelector<HTMLElement>("[data-foh-special-menu-image-error]");
  if (!tip) {
    tip = document.createElement("p");
    tip.className = "m-0 text-xs text-destructive";
    tip.dataset.fohSpecialMenuImageError = "";
    const pickBtn = dialog.querySelector("[data-foh-special-menu-image-pick]");
    pickBtn?.parentElement?.insertAdjacentElement("afterend", tip);
  }
  tip.textContent = message;
}

function clearSpecialMenuImagePickError(root: HTMLElement): void {
  root.querySelector("[data-foh-special-menu-image-error]")?.remove();
}

function isDialogVisible(dialog: HTMLElement | null): boolean {
  return !!dialog && !dialog.classList.contains("hidden");
}

function applyImagePickerResult(root: HTMLElement, dataUrl: string): void {
  const specialDialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  if (isDialogVisible(specialDialog)) {
    clearSpecialMenuImagePickError(root);
    applySpecialMenuImagePreview(root, dataUrl);
    return;
  }
  clearFohCatImagePickError(root);
  applyFohCatImagePreview(root, dataUrl);
}

function setImagePickerError(root: HTMLElement, message: string): void {
  const specialDialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  if (isDialogVisible(specialDialog)) {
    setSpecialMenuImagePickError(root, message);
    return;
  }
  setFohCatImagePickError(root, message);
}

function openCategoryFormDialog(root: HTMLElement, editingId: string | null): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-cat-form-dialog]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-foh-cat-form-title]");
  const nameInput = dialog?.querySelector<HTMLInputElement>("[data-foh-cat-form-name]");
  const scheduleHost = dialog?.querySelector<HTMLElement>("[data-foh-cat-form-schedule-host]");
  const channelsHost = dialog?.querySelector<HTMLElement>("[data-foh-cat-form-channels-host]");
  if (!dialog || !nameInput || !scheduleHost || !channelsHost) return;

  const state = readFohCategorySettingsState();
  const editing = editingId ? state.categories.find((c) => c.id === editingId) : null;
  const schedules = readBusinessHourSchedules();
  const validIds = new Set(schedules.map((s) => s.id));
  dialog.setAttribute("data-editing-id", editingId ?? "");
  if (titleEl) titleEl.textContent = editing ? "编辑类别" : "增加类别";
  nameInput.value = editing?.name ?? "";
  clearFohCatImagePickError(root);
  setCategoryFormImagePreview(dialog, editing?.imageDataUrl);
  let selectedIds = (editing?.scheduleIds ?? []).filter((id) => validIds.has(id));
  if (selectedIds.length === 0) selectedIds = defaultAllDayScheduleIds(schedules);
  scheduleHost.innerHTML = renderCategorySchedulePicker(selectedIds);
  channelsHost.innerHTML = renderDisplayChannelPickerHtml(
    editing?.displayChannels ?? [...ALL_DISPLAY_CHANNELS],
    "data-foh-cat-display-channel",
  );
  showCategoryFormDialog(root);
  nameInput.focus();
}

function saveCategoryFormDialog(root: HTMLElement, remount: () => void): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-cat-form-dialog]");
  if (!dialog) return;
  const name = dialog.querySelector<HTMLInputElement>("[data-foh-cat-form-name]")?.value.trim() ?? "";
  if (!name) {
    dialog.querySelector<HTMLInputElement>("[data-foh-cat-form-name]")?.focus();
    return;
  }
  const scheduleIds = [
    ...dialog.querySelectorAll<HTMLInputElement>("[data-foh-cat-dialog-schedule]:checked"),
  ].map((input) => input.value);
  const schedules = readBusinessHourSchedules();
  if (scheduleIds.length === 0 && schedules.length > 0) {
    window.alert("请至少选择一个营业时段。");
    return;
  }
  const preview = dialog.querySelector<HTMLImageElement>("[data-foh-cat-image-preview]");
  const imageDataUrl = preview?.tagName === "IMG" ? preview.src : undefined;
  const displayChannels = collectDisplayChannelsFromRoot(dialog, "[data-foh-cat-display-channel]");
  const editingId = dialog.getAttribute("data-editing-id") || "";
  const state = readFohCategorySettingsState();
  const nextScheduleIds =
    scheduleIds.length > 0 ? [...scheduleIds] : defaultAllDayScheduleIds(schedules);

  if (editingId) {
    const idx = state.categories.findIndex((c) => c.id === editingId);
    if (idx >= 0) {
      state.categories[idx] = {
        ...state.categories[idx]!,
        name,
        imageDataUrl,
        scheduleIds: nextScheduleIds,
        displayChannels,
      };
    } else {
      state.categories.push({
        id: editingId,
        name,
        imageDataUrl,
        scheduleIds: nextScheduleIds,
        displayChannels,
      });
    }
  } else {
    state.categories.push({
      id: newId("cat"),
      name,
      imageDataUrl,
      scheduleIds: nextScheduleIds,
      displayChannels,
    });
  }
  writeFohCategorySettingsState({
    ...state,
    categories: state.categories.map((c) => ({
      ...c,
      scheduleIds: [...c.scheduleIds],
      displayChannels: [...c.displayChannels],
    })),
  });
  hideCategoryFormDialog(root);
  remountFohCategorySettings(remount);
}

function bindFohCategoryFormDialog(root: HTMLElement, remount: () => void): void {
  if (root.getAttribute("data-foh-cat-form-bound") === "1") return;
  root.setAttribute("data-foh-cat-form-bound", "1");

  bindImageSourcePicker(root, {
    onSelect: (result) => applyImagePickerResult(root, result.dataUrl),
    onError: (message) => setImagePickerError(root, message),
  });

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-foh-category-cat-add]")) {
      openCategoryFormDialog(root, null);
      return;
    }
    const editBtn = target.closest<HTMLButtonElement>("[data-foh-category-cat-edit]");
    if (editBtn) {
      const id = editBtn.getAttribute("data-foh-category-cat-edit");
      if (id) openCategoryFormDialog(root, id);
      return;
    }
    if (target.closest("[data-foh-cat-image-pick]")) {
      clearFohCatImagePickError(root);
      openImageSourcePicker(root);
      return;
    }
    if (
      target.closest("[data-foh-cat-form-cancel]") ||
      target.closest("[data-foh-cat-form-close]") ||
      target.closest("[data-foh-cat-form-backdrop]")
    ) {
      hideCategoryFormDialog(root);
      return;
    }
    if (target.closest("[data-foh-cat-form-save]")) {
      saveCategoryFormDialog(root, remount);
    }
  });

  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const uploadModal = root.querySelector<HTMLElement>("[data-image-source-upload-modal]");
    const libraryModal = root.querySelector<HTMLElement>("[data-image-source-library-modal]");
    if (
      (uploadModal && !uploadModal.classList.contains("hidden")) ||
      (libraryModal && !libraryModal.classList.contains("hidden"))
    ) {
      return;
    }
    const dialog = root.querySelector<HTMLElement>("[data-foh-cat-form-dialog]");
    if (dialog && !dialog.classList.contains("hidden")) {
      e.preventDefault();
      hideCategoryFormDialog(root);
    }
  });
}

function remountFohCategorySettings(remount: () => void): void {
  remount();
}

function syncMenuEditViewOnlyPanels(dialog: HTMLElement, mode: "dish" | "category"): void {
  dialog.querySelector("[data-foh-menu-view-dish-panel]")?.classList.toggle("hidden", mode !== "dish");
  dialog
    .querySelector("[data-foh-menu-view-category-panel]")
    ?.classList.toggle("hidden", mode !== "category");
}

function showMenuEditDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-menu-edit-dialog]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideMenuEditDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-menu-edit-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-combo-key", "");
  dialog.setAttribute("data-edit-scope", "");
  const body = dialog.querySelector<HTMLElement>("[data-foh-menu-edit-body]");
  if (body) body.innerHTML = "";
}

function openMenuEditDialog(root: HTMLElement, comboKeyValue: MenuComboKey, scope: MenuEditScope): void {
  const state = readFohCategorySettingsState();
  const combos = listMenuCombinations(state);
  const combo = combos.find((c) => c.key === comboKeyValue);
  if (!combo) return;
  const cfg = state.menuByCombo[comboKeyValue] ?? defaultMenuConfig(combo.age, combo.category);
  const dialog = root.querySelector<HTMLElement>("[data-foh-menu-edit-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-foh-menu-edit-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-foh-menu-edit-title]");
  if (!dialog || !body) return;
  dialog.setAttribute("data-combo-key", comboKeyValue);
  dialog.setAttribute("data-edit-scope", scope);
  if (titleEl) {
    titleEl.textContent =
      scope === "orderable" ? `可下单 · ${combo.title}` : `不可下单 · ${combo.title}`;
  }
  body.innerHTML = renderMenuEditDialogBody(combo, combos, cfg, scope);
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showMenuEditDialog(root);
}

function collectMenuConfigFromEditDialog(
  dialog: HTMLElement,
  comboKeyValue: MenuComboKey,
  prev: MenuComboConfig,
  scope: MenuEditScope,
): MenuComboConfig {
  if (scope === "orderable") {
    const orderablePicker = dialog.querySelector<HTMLElement>(
      "[data-foh-menu-orderable-structure] [data-brand-menu-structure-picker]",
    );
    return {
      ...prev,
      orderableStructureByLine: orderablePicker
        ? readBrandMenuStructureByLineFromPicker(orderablePicker)
        : emptyBrandMenuStructureByLine(),
    };
  }
  const modeRadio = dialog.querySelector<HTMLInputElement>("[data-foh-menu-view-mode]:checked");
  const viewOnlyMode = modeRadio?.value === "dish" ? "dish" : "category";
  const viewOnlyCategoryKeys = [
    ...dialog.querySelectorAll<HTMLInputElement>("[data-foh-menu-view-category-key]:checked"),
  ]
    .map((input) => input.value)
    .filter((k) => k && k !== comboKeyValue);
  const viewPicker = dialog.querySelector<HTMLElement>(
    "[data-foh-menu-view-structure] [data-brand-menu-structure-picker]",
  );
  return {
    ...prev,
    viewOnlyMode,
    viewOnlyCategoryKeys,
    viewOnlyStructureByLine: viewPicker
      ? readBrandMenuStructureByLineFromPicker(viewPicker)
      : prev.viewOnlyStructureByLine,
  };
}

function saveMenuEditDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-menu-edit-dialog]");
  if (!dialog) return;
  const comboKeyValue = dialog.getAttribute("data-combo-key") || "";
  if (!comboKeyValue) return;
  const scope = parseMenuEditScope(dialog.getAttribute("data-edit-scope"));
  const state = readFohCategorySettingsState();
  const prev = state.menuByCombo[comboKeyValue];
  if (!prev) return;
  state.menuByCombo[comboKeyValue] = collectMenuConfigFromEditDialog(
    dialog,
    comboKeyValue,
    prev,
    scope,
  );
  writeFohCategorySettingsState(state);
  hideMenuEditDialog(root);
}

function bindFohCategoryMenuEditDialog(root: HTMLElement, remount: () => void): void {
  if (root.getAttribute("data-foh-menu-edit-bound") === "1") return;
  root.setAttribute("data-foh-menu-edit-bound", "1");

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const detailBtn = target.closest<HTMLButtonElement>("[data-foh-menu-detail]");
    if (detailBtn) {
      const key = detailBtn.getAttribute("data-foh-menu-combo-key");
      const scope = parseMenuEditScope(detailBtn.getAttribute("data-foh-menu-detail"));
      if (key) openMenuEditDialog(root, key, scope);
      return;
    }
    if (
      target.closest("[data-foh-menu-edit-cancel]") ||
      target.closest("[data-foh-menu-edit-close]") ||
      target.closest("[data-foh-menu-edit-backdrop]")
    ) {
      hideMenuEditDialog(root);
      return;
    }
    if (target.closest("[data-foh-menu-edit-save]")) {
      saveMenuEditDialog(root);
      remountFohCategorySettings(remount);
    }
  });

  root.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    const dialog = target.closest<HTMLElement>("[data-foh-menu-edit-dialog]");
    if (!dialog || dialog.classList.contains("hidden")) return;
    const modeRadio = target.closest<HTMLInputElement>("[data-foh-menu-view-mode]");
    if (modeRadio?.checked) {
      syncMenuEditViewOnlyPanels(dialog, modeRadio.value === "dish" ? "dish" : "category");
    }
  });

  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const dialog = root.querySelector<HTMLElement>("[data-foh-menu-edit-dialog]");
    if (dialog && !dialog.classList.contains("hidden")) {
      e.preventDefault();
      hideMenuEditDialog(root);
    }
  });
}

export function bindFohCategorySettingsUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-foh-category-settings-root]");
  if (!root || root.getAttribute("data-foh-category-bound") === "1") return;
  root.setAttribute("data-foh-category-bound", "1");
  bindFohSettingsNameDialog(root);
  bindFohCategoryMenuEditDialog(root, remount);
  bindFohCategoryFormDialog(root, remount);

  root.querySelector("[data-foh-category-age-add]")?.addEventListener("click", () => {
    openFohSettingsNameDialog(root, {
      title: "增加年龄",
      label: "年龄阶段名称",
      placeholder: "请输入年龄阶段名称",
      enableDisplayChannels: true,
      onConfirm: (name, extras) => {
        const state = readFohCategorySettingsState();
        state.ages.push({
          id: newId("age"),
          name,
          tag: "未标记",
          displayChannels: extras?.displayChannels ?? [...ALL_DISPLAY_CHANNELS],
        });
        writeFohCategorySettingsState(state);
        remountFohCategorySettings(remount);
      },
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-category-age-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-category-age-edit");
      if (!id) return;
      const state = readFohCategorySettingsState();
      const row = state.ages.find((a) => a.id === id);
      if (!row) return;
      openFohSettingsNameDialog(root, {
        title: "修改年龄",
        label: "年龄阶段名称",
        initialValue: row.name,
        confirmLabel: "保存",
        enableDisplayChannels: true,
        initialDisplayChannels: row.displayChannels,
        onConfirm: (name, extras) => {
          const latest = readFohCategorySettingsState();
          const target = latest.ages.find((a) => a.id === id);
          if (!target) return;
          target.name = name;
          target.displayChannels = extras?.displayChannels ?? [...ALL_DISPLAY_CHANNELS];
          writeFohCategorySettingsState(latest);
          remountFohCategorySettings(remount);
        },
      });
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-foh-category-age-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-category-age-delete");
      if (!id) return;
      const state = readFohCategorySettingsState();
      if (state.ages.length <= 1) {
        openAgeCategoryNotice(root, "至少保留一个年龄阶段。");
        return;
      }
      const row = state.ages.find((a) => a.id === id);
      openAgeCategoryDeleteConfirm(root, "age", id, row?.name ?? "");
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

  root.querySelectorAll<HTMLButtonElement>("[data-foh-category-cat-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-foh-category-cat-delete");
      if (!id) return;
      const state = readFohCategorySettingsState();
      if (state.categories.length <= 1) {
        openAgeCategoryNotice(root, "至少保留一个类别。");
        return;
      }
      const row = state.categories.find((c) => c.id === id);
      openAgeCategoryDeleteConfirm(root, "category", id, row?.name ?? "");
    });
  });

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-foh-age-cat-delete-cancel]") ||
      target.closest("[data-foh-age-cat-delete-backdrop]")
    ) {
      hideAgeCategoryDeleteDialog(root);
      return;
    }
    if (target.closest("[data-foh-age-cat-delete-confirm]")) {
      confirmAgeCategoryDelete(root, remount);
    }
  });

  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const dialog = root.querySelector<HTMLElement>("[data-foh-age-cat-delete-dialog]");
    if (dialog && !dialog.classList.contains("hidden")) {
      e.preventDefault();
      hideAgeCategoryDeleteDialog(root);
    }
  });

  bindFohCategorySpecialMenuUi(root, remount);
}

function showSpecialMenuDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideSpecialMenuDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-editing-id", "");
  dialog.setAttribute("data-entry-id", "");
  clearSpecialMenuImagePickError(root);
  const body = dialog.querySelector<HTMLElement>("[data-foh-special-menu-dialog-body]");
  if (body) body.innerHTML = "";
}

function showSpecialMenuViewDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-view-dialog]");
  if (!dialog) return;
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideSpecialMenuViewDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-view-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  const body = dialog.querySelector<HTMLElement>("[data-foh-special-menu-view-body]");
  if (body) body.innerHTML = "";
}

function openSpecialMenuViewDialog(root: HTMLElement, entryId: string): void {
  const state = readFohCategorySettingsState();
  const entry = state.specialMenus.find((e) => e.id === entryId);
  if (!entry) return;
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-view-dialog]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-foh-special-menu-view-title]");
  const body = dialog?.querySelector<HTMLElement>("[data-foh-special-menu-view-body]");
  if (!dialog || !body) return;
  if (titleEl) titleEl.textContent = `菜单 · ${entry.name || "未命名"}`;
  body.innerHTML = `
    <p class="m-0 text-xs text-muted-foreground">按产线查看已配置的组 / 类 / 菜（只读）</p>
    ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
      enableLines: true,
      selectionByLine: entry.structureByLine,
      readOnly: true,
    })}`;
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showSpecialMenuViewDialog(root);
}

function openSpecialMenuDialog(root: HTMLElement, editingId: string | null): void {
  const state = readFohCategorySettingsState();
  const editing = editingId ? state.specialMenus.find((e) => e.id === editingId) : null;
  const entryId = editing?.id ?? newSpecialMenuId();
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-foh-special-menu-dialog-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-foh-special-menu-dialog-title]");
  if (!dialog || !body) return;
  dialog.setAttribute("data-editing-id", editing ? entryId : "");
  dialog.setAttribute("data-entry-id", entryId);
  if (titleEl) titleEl.textContent = editing ? "编辑特殊品类" : "新增特殊品类";
  clearSpecialMenuImagePickError(root);
  body.innerHTML = renderSpecialMenuDialogBody(
    entryId,
    editing?.name ?? "",
    editing?.structureByLine ?? emptyBrandMenuStructureByLine(),
    editing?.displayChannels ?? [...ALL_DISPLAY_CHANNELS],
    editing?.imageDataUrl,
  );
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showSpecialMenuDialog(root);
  body.querySelector<HTMLInputElement>("[data-foh-special-menu-name]")?.focus();
}

function saveSpecialMenuDialog(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
  if (!dialog) return;
  const entryId = dialog.getAttribute("data-entry-id") || "";
  const editingId = dialog.getAttribute("data-editing-id") || "";
  if (!entryId) return;
  const name =
    dialog.querySelector<HTMLInputElement>("[data-foh-special-menu-name]")?.value.trim() ?? "";
  if (!name) {
    dialog.querySelector<HTMLInputElement>("[data-foh-special-menu-name]")?.focus();
    return;
  }
  const preview = dialog.querySelector<HTMLImageElement>("[data-foh-special-menu-image-preview]");
  const imageDataUrl = preview?.tagName === "IMG" ? preview.src : undefined;
  const picker = dialog.querySelector<HTMLElement>(
    "[data-foh-special-menu-structure] [data-brand-menu-structure-picker]",
  );
  const structureByLine = picker
    ? readBrandMenuStructureByLineFromPicker(picker)
    : emptyBrandMenuStructureByLine();
  const displayChannels = collectDisplayChannelsFromRoot(
    dialog,
    "[data-foh-special-menu-display-channel]",
  );
  const nextEntry: FohSpecialMenuEntry = {
    id: entryId,
    name,
    imageDataUrl,
    displayChannels,
    structureByLine,
  };
  const state = readFohCategorySettingsState();
  if (editingId) {
    const idx = state.specialMenus.findIndex((e) => e.id === editingId);
    if (idx >= 0) state.specialMenus[idx] = nextEntry;
    else state.specialMenus.push(nextEntry);
  } else {
    state.specialMenus.push(nextEntry);
  }
  writeFohCategorySettingsState(state);
  hideSpecialMenuDialog(root);
}

function bindFohCategorySpecialMenuUi(root: HTMLElement, remount: () => void): void {
  if (root.getAttribute("data-foh-special-menu-bound") === "1") return;
  root.setAttribute("data-foh-special-menu-bound", "1");

  root.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    const lineInput = target.closest<HTMLInputElement>("[data-foh-special-menu-line]");
    if (!lineInput) return;
    const group = lineInput.closest<HTMLElement>("[data-foh-special-menu-lines]");
    if (!group) return;
    const valid = new Set<SpecialMenuLineId>(["emenu", "sdi"]);
    const lines: SpecialMenuLineId[] = [];
    group.querySelectorAll<HTMLInputElement>("[data-foh-special-menu-line]").forEach((input) => {
      if (!input.checked) return;
      const id = input.getAttribute("data-foh-special-menu-line");
      if (id && valid.has(id as SpecialMenuLineId)) {
        lines.push(id as SpecialMenuLineId);
      }
    });
    const state = readFohCategorySettingsState();
    state.specialMenuLines = uniqueStrings(lines) as SpecialMenuLineId[];
    writeFohCategorySettingsState(state);
    remountFohCategorySettings(remount);
  });

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-foh-special-menu-add]")) {
      openSpecialMenuDialog(root, null);
      return;
    }
    const editBtn = target.closest<HTMLButtonElement>("[data-foh-special-menu-edit]");
    if (editBtn) {
      const id = editBtn.getAttribute("data-foh-special-menu-edit");
      if (id) openSpecialMenuDialog(root, id);
      return;
    }
    const detailBtn = target.closest<HTMLButtonElement>("[data-foh-special-menu-detail]");
    if (detailBtn) {
      const id = detailBtn.getAttribute("data-foh-special-menu-detail");
      if (id) openSpecialMenuViewDialog(root, id);
      return;
    }
    if (
      target.closest("[data-foh-special-menu-view-close]") ||
      target.closest("[data-foh-special-menu-view-backdrop]")
    ) {
      hideSpecialMenuViewDialog(root);
      return;
    }
    const deleteBtn = target.closest<HTMLButtonElement>("[data-foh-special-menu-delete]");
    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-foh-special-menu-delete");
      if (!id) return;
      if (!window.confirm("确定删除该特殊品类？")) return;
      const state = readFohCategorySettingsState();
      state.specialMenus = state.specialMenus.filter((entry) => entry.id !== id);
      writeFohCategorySettingsState(state);
      remountFohCategorySettings(remount);
      return;
    }
    if (target.closest("[data-foh-special-menu-image-pick]")) {
      clearSpecialMenuImagePickError(root);
      openImageSourcePicker(root);
      return;
    }
    if (
      target.closest("[data-foh-special-menu-dialog-cancel]") ||
      target.closest("[data-foh-special-menu-dialog-close]") ||
      target.closest("[data-foh-special-menu-dialog-backdrop]")
    ) {
      hideSpecialMenuDialog(root);
      return;
    }
    if (target.closest("[data-foh-special-menu-dialog-save]")) {
      saveSpecialMenuDialog(root);
      remountFohCategorySettings(remount);
    }
  });

  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const uploadModal = root.querySelector<HTMLElement>("[data-image-source-upload-modal]");
    const libraryModal = root.querySelector<HTMLElement>("[data-image-source-library-modal]");
    if (
      (uploadModal && !uploadModal.classList.contains("hidden")) ||
      (libraryModal && !libraryModal.classList.contains("hidden"))
    ) {
      return;
    }
    const dialog = root.querySelector<HTMLElement>("[data-foh-special-menu-dialog]");
    if (dialog && !dialog.classList.contains("hidden")) {
      e.preventDefault();
      hideSpecialMenuDialog(root);
      return;
    }
    const viewDialog = root.querySelector<HTMLElement>("[data-foh-special-menu-view-dialog]");
    if (viewDialog && !viewDialog.classList.contains("hidden")) {
      e.preventDefault();
      hideSpecialMenuViewDialog(root);
    }
  });
}

/** 解析某组合下已选可看可下单菜单结构（按产线；供调试或后续 API 对接） */
export function readMenuComboOrderableStructureByLine(
  comboKeyValue: MenuComboKey,
): BrandMenuStructureByLine {
  const state = readFohCategorySettingsState();
  return (
    state.menuByCombo[comboKeyValue]?.orderableStructureByLine ?? emptyBrandMenuStructureByLine()
  );
}

/** @deprecated 返回三产线扁平合并；优先用 readMenuComboOrderableStructureByLine */
export function readMenuComboOrderableStructureKeys(comboKeyValue: MenuComboKey): string[] {
  return flattenBrandMenuStructureByLine(readMenuComboOrderableStructureByLine(comboKeyValue));
}
