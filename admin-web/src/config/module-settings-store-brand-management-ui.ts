/**
 * 前厅管理中心 · 店中店管理（/operations/queue-call/brand-menu）· 品牌管理（seq 547）。
 * 本店品牌列表、新增/编辑品牌；品牌营业时间引用 seq 418；展示渠道控制品牌可见产线；品牌菜单为产线 + 组/类/菜选择。
 */

import {
  bindBrandMenuStructurePicker,
  BRAND_MENU_LINE_OPTIONS,
  countBrandMenuStructureDishesByLine,
  dishKey,
  emptyBrandMenuStructureByLine,
  formatBrandMenuStructureByLineSummary,
  isBrandMenuLineId,
  normalizeBrandMenuStructureByLine,
  readBrandMenuStructureByLineFromPicker,
  renderBrandMenuStructurePickerHtml,
  type BrandMenuLineId,
  type BrandMenuStructureByLine,
} from "./brand-menu-structure-picker-ui";
import {
  formatScheduleSummary,
  readBusinessHourSchedules,
  type StoreBusinessHourSchedule,
} from "./module-settings-store-business-hours-ui";
import { writeModuleSettingJson, moduleSettingStorageKey } from "./module-settings-form-ui";
import { readPageDraftFieldForCurrentPath } from "./page-settings-draft";
import {
  bindImageSourcePicker,
  openImageSourcePicker,
  renderImageSourcePickerModalsHtml,
} from "./image-source-picker-ui";

export const STORE_BRAND_MANAGEMENT_SEQ = 547;

export const STORE_BRANDS_FIELD_ID = "547-store-brands";

export type StoreBrandRecord = {
  id: string;
  name: string;
  imageDataUrl?: string;
  /** 引用的 seq 418 营业时间规则 id 列表 */
  scheduleIds: string[];
  /** 在哪些渠道展示本品牌（Kiosk / eMenu / SDI） */
  displayChannels: BrandMenuLineId[];
  /** 按产线（Kiosk / eMenu / SDI）的组/类/菜选中节点 key（g: / c: / d:） */
  menuStructureByLine: BrandMenuStructureByLine;
};

const ALL_DISPLAY_CHANNELS: BrandMenuLineId[] = BRAND_MENU_LINE_OPTIONS.map((l) => l.id);

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DESTRUCTIVE =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90";

const BTN_LINK =
  "text-sm font-medium text-primary hover:underline";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newBrandId(): string {
  return `brand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

function normalizeMenuStructureKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return uniqueStrings(raw.filter((id): id is string => typeof id === "string" && id.length > 0));
}

function normalizeMenuStructureByLine(
  raw: unknown,
  legacyKeys?: unknown,
): BrandMenuStructureByLine {
  const byLine = normalizeBrandMenuStructureByLine(raw);
  const hasAny = Object.values(byLine).some((keys) => keys.length > 0);
  if (hasAny) return byLine;
  const legacy = normalizeMenuStructureKeys(legacyKeys);
  if (legacy.length === 0) return emptyBrandMenuStructureByLine();
  // 旧版全局 menuStructureKeys → 复制到三产线，避免丢勾选
  return { kiosk: [...legacy], emenu: [...legacy], pos: [...legacy], sdi: [...legacy] };
}

function normalizeDisplayChannels(raw: unknown): BrandMenuLineId[] {
  if (!Array.isArray(raw)) {
    // 旧数据无字段：默认全渠道展示，避免品牌「消失」
    return [...ALL_DISPLAY_CHANNELS];
  }
  const ids = uniqueStrings(
    raw.filter((id): id is string => typeof id === "string" && isBrandMenuLineId(id)),
  ) as BrandMenuLineId[];
  // 按固定顺序输出
  return ALL_DISPLAY_CHANNELS.filter((id) => ids.includes(id));
}

function normalizeBrand(
  raw: Partial<StoreBrandRecord> & {
    businessHours?: unknown;
    menuIds?: unknown;
    menuStructureKeys?: unknown;
  },
): StoreBrandRecord {
  const scheduleIds = normalizeScheduleIds(raw.scheduleIds);
  const displayChannels = normalizeDisplayChannels(raw.displayChannels);
  // 兼容旧数据 menuIds：忽略；menuStructureKeys 迁入按产线结构
  const menuStructureByLine = normalizeMenuStructureByLine(
    raw.menuStructureByLine,
    raw.menuStructureKeys,
  );
  return {
    id: raw.id ?? newBrandId(),
    name: raw.name ?? "",
    imageDataUrl: raw.imageDataUrl,
    scheduleIds,
    displayChannels,
    menuStructureByLine,
  };
}

function defaultBrands(): StoreBrandRecord[] {
  const schedules = readBusinessHourSchedules();
  const firstScheduleId = schedules[0]?.id;
  const secondScheduleIds = schedules.slice(0, 2).map((s) => s.id);
  return [
    normalizeBrand({
      id: "brand-preset-yangguofu",
      name: "杨国富麻辣烫",
      scheduleIds: firstScheduleId ? [firstScheduleId] : [],
      displayChannels: ["kiosk", "emenu", "sdi"],
      menuStructureByLine: {
        kiosk: [
          dishKey("g-hotpot", "c-hotpot-meat", "d-beef-premium"),
          dishKey("g-hotpot", "c-hotpot-base", "d-pot-yinyang"),
        ],
        emenu: [dishKey("g-chinese", "c-chinese-hot", "d-kungpao")],
        pos: [],
        sdi: [dishKey("g-drink", "c-drink-cold", "d-cola")],
      },
    }),
    normalizeBrand({
      id: "brand-preset-zhangliang",
      name: "张亮麻辣烫",
      scheduleIds: secondScheduleIds.length > 0 ? secondScheduleIds : firstScheduleId ? [firstScheduleId] : [],
      displayChannels: ["kiosk", "emenu"],
      menuStructureByLine: {
        kiosk: [dishKey("g-drink", "c-drink-hot", "d-tea")],
        emenu: [dishKey("g-chinese", "c-chinese-hot", "d-kungpao")],
        pos: [],
        sdi: [],
      },
    }),
  ];
}

/** 无持久化数据时返回系统预设（稳定 id）；显式存过空数组则返回空列表 */
export function readStoreBrands(): StoreBrandRecord[] {
  const draft = readPageDraftFieldForCurrentPath(STORE_BRANDS_FIELD_ID);
  let storedRaw: string | null = null;
  try {
    storedRaw = localStorage.getItem(moduleSettingStorageKey(STORE_BRANDS_FIELD_ID));
  } catch {
    storedRaw = null;
  }

  const source = draft !== undefined ? draft : storedRaw;
  if (source === null || source === undefined || source === "") {
    return defaultBrands();
  }
  try {
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) return defaultBrands();
    if (parsed.length === 0) return [];
    return parsed.map((b) => normalizeBrand(b as Partial<StoreBrandRecord>));
  } catch {
    return defaultBrands();
  }
}

export function writeStoreBrands(brands: StoreBrandRecord[]): void {
  writeModuleSettingJson(STORE_BRANDS_FIELD_ID, brands);
}

export function formatBrandBusinessHoursSummary(brand: StoreBrandRecord): string {
  const schedules = readBusinessHourSchedules();
  const names = brand.scheduleIds
    .map((id) => schedules.find((s) => s.id === id)?.name)
    .filter((name): name is string => !!name);
  return names.length > 0 ? uniqueStrings(names).join(" / ") : "—";
}

export function formatBrandMenusSummary(brand: StoreBrandRecord): string {
  return formatBrandMenuStructureByLineSummary(brand.menuStructureByLine);
}

export function formatBrandDisplayChannelsSummary(brand: StoreBrandRecord): string {
  if (brand.displayChannels.length === 0) return "—";
  const labels = BRAND_MENU_LINE_OPTIONS.filter((l) => brand.displayChannels.includes(l.id)).map(
    (l) => l.label,
  );
  return labels.length > 0 ? labels.join("、") : "—";
}

function formatBrandMenuDetailButtonLabel(count: number): string {
  return `详情（${count}）`;
}

function renderBrandImageCell(brand: StoreBrandRecord): string {
  if (brand.imageDataUrl) {
    return `<img src="${escapeHtml(brand.imageDataUrl)}" alt="" class="size-12 rounded border border-border object-cover" />`;
  }
  return `<div class="flex size-12 items-center justify-center rounded border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">NO IMAGE</div>`;
}

function renderBrandTable(brands: StoreBrandRecord[]): string {
  if (brands.length === 0) {
    return `<p class="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">暂无品牌，请点击「新增品牌」</p>`;
  }
  const rows = brands
    .map((brand) => {
      const menuCount = countBrandMenuStructureDishesByLine(brand.menuStructureByLine);
      return `
      <tr class="border-t border-border" data-brand-row data-brand-id="${escapeHtml(brand.id)}">
        <td class="py-3 pr-3 text-sm text-foreground">${escapeHtml(brand.name)}</td>
        <td class="py-3 pr-3">${renderBrandImageCell(brand)}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatBrandBusinessHoursSummary(brand))}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatBrandDisplayChannelsSummary(brand))}</td>
        <td class="py-3 pr-3 text-sm">
          <button type="button" class="${BTN_LINK}" data-brand-menu-detail data-brand-id="${escapeHtml(brand.id)}">${formatBrandMenuDetailButtonLabel(menuCount)}</button>
        </td>
        <td class="py-3 text-right text-sm whitespace-nowrap">
          <button type="button" class="${BTN_LINK} mr-3" data-brand-edit data-brand-id="${escapeHtml(brand.id)}">编辑</button>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-brand-delete data-brand-id="${escapeHtml(brand.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");
  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">品牌名称</th>
            <th class="px-3 py-2 font-medium">品牌图片</th>
            <th class="px-3 py-2 font-medium">品牌营业时间</th>
            <th class="px-3 py-2 font-medium">展示渠道</th>
            <th class="px-3 py-2 font-medium">品牌菜单</th>
            <th class="px-3 py-2 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderScheduleOption(schedule: StoreBusinessHourSchedule, selectedIds: string[]): string {
  const checked = selectedIds.includes(schedule.id);
  return `
    <label
      class="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
      data-brand-schedule-option
    >
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 accent-primary"
        data-brand-schedule-id
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
    <div class="space-y-2" data-brand-schedule-picker>
      ${schedules.map((s) => renderScheduleOption(s, selectedIds)).join("")}
    </div>`;
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
        data-brand-display-channel
        value="${escapeHtml(line.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="text-sm font-medium text-foreground">${escapeHtml(line.label)}</span>
    </label>`;
  }).join("");
  return `
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-4" data-brand-display-channel-picker>
      ${options}
    </div>`;
}

function renderBrandDialog(brands: StoreBrandRecord[], editingId: string | null): string {
  const editing = editingId ? brands.find((b) => b.id === editingId) : null;
  const title = editing ? "编辑品牌" : "新增品牌";
  const name = editing?.name ?? "";
  const imagePreview = editing?.imageDataUrl
    ? `<img src="${escapeHtml(editing.imageDataUrl)}" alt="" class="mx-auto max-h-24 rounded border border-border object-contain" data-brand-image-preview />`
    : `<div class="mx-auto flex h-24 w-24 items-center justify-center rounded border border-dashed border-border bg-muted/30 text-xs text-muted-foreground" data-brand-image-preview>NO IMAGES</div>`;
  const selectedScheduleIds = editing?.scheduleIds ?? [];
  const selectedChannels = editing?.displayChannels ?? [...ALL_DISPLAY_CHANNELS];
  const selectedByLine = editing?.menuStructureByLine ?? emptyBrandMenuStructureByLine();

  return `
    <div
      class="fixed inset-0 z-[100] hidden items-center justify-center p-4"
      data-brand-dialog
      data-editing-id="${escapeHtml(editingId ?? "")}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-brand-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="brand-dialog-title" class="text-base font-semibold text-card-foreground">${title}</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-brand-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground" for="brand-create-name">品牌名称</label>
            <input id="brand-create-name" type="text" maxlength="50" class="${INPUT_CLASS}" data-brand-name value="${escapeHtml(name)}" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground">品牌图片</label>
            <p class="text-xs text-muted-foreground">支持 PNG、JPG、JPEG；1MB 以内</p>
            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              ${imagePreview}
              <button type="button" class="${BTN_GHOST}" data-brand-image-pick>选择图片</button>
            </div>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">品牌营业时间</p>
            ${renderSchedulePicker(selectedScheduleIds)}
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">展示渠道</p>
            <p class="text-xs text-muted-foreground">勾选后，本品牌仅在对应渠道展示</p>
            ${renderDisplayChannelPicker(selectedChannels)}
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">品牌菜单</p>
            <p class="text-xs text-muted-foreground">先选产线，再勾选该产线对应的组 / 类 / 菜</p>
            ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
              enableLines: true,
              selectionByLine: selectedByLine,
            })}
          </div>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-brand-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-brand-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderDeleteConfirmDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-brand-delete-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-delete-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" data-brand-delete-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div class="border-b border-border px-5 py-4">
          <h3 id="brand-delete-dialog-title" class="text-base font-semibold text-card-foreground">确认删除</h3>
        </div>
        <div class="px-5 py-4">
          <input type="hidden" data-brand-delete-target-id value="" />
          <p class="m-0 text-sm text-foreground" data-brand-delete-message>确定删除该品牌？删除后无法恢复。</p>
        </div>
        <div class="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-brand-delete-cancel>取消</button>
          <button type="button" class="${BTN_DESTRUCTIVE}" data-brand-delete-confirm>删除</button>
        </div>
      </div>
    </div>`;
}

function renderBrandMenuViewDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-brand-menu-view-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-menu-view-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-brand-menu-view-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="brand-menu-view-dialog-title" class="text-base font-semibold text-card-foreground" data-brand-menu-view-title>品牌菜单</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-brand-menu-view-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-brand-menu-view-body></div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_PRIMARY}" data-brand-menu-view-close>关闭</button>
        </div>
      </div>
    </div>`;
}

export function isStoreBrandManagementSeq(seq: number): boolean {
  return seq === STORE_BRAND_MANAGEMENT_SEQ;
}

export function renderStoreBrandManagementHtml(): string {
  const brands = readStoreBrands();
  return `
    <div class="mt-3 space-y-3" data-store-brand-management>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="${BTN_PRIMARY}" data-brand-create>新增品牌</button>
      </div>
      <div data-brand-table-wrap>${renderBrandTable(brands)}</div>
      ${renderBrandDialog(brands, null)}
      ${renderDeleteConfirmDialog()}
      ${renderBrandMenuViewDialog()}
      ${renderImageSourcePickerModalsHtml()}
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

function refreshBrandPanel(panel: HTMLElement, editingId: string | null = null): void {
  const brands = readStoreBrands();
  const tableWrap = panel.querySelector<HTMLElement>("[data-brand-table-wrap]");
  if (tableWrap) tableWrap.innerHTML = renderBrandTable(brands);
  const oldDialog = panel.querySelector("[data-brand-dialog]");
  oldDialog?.remove();
  panel.insertAdjacentHTML("beforeend", renderBrandDialog(brands, editingId));
  if (!panel.querySelector("[data-brand-delete-dialog]")) {
    panel.insertAdjacentHTML("beforeend", renderDeleteConfirmDialog());
  }
  if (!panel.querySelector("[data-brand-menu-view-dialog]")) {
    panel.insertAdjacentHTML("beforeend", renderBrandMenuViewDialog());
  }
}

function showBrandDialog(panel: HTMLElement, editingId: string | null): void {
  // 先按当前列表数据打开，保证预设品牌 id 稳定且表单回填完整
  const brands = readStoreBrands();
  const editing = editingId ? brands.find((b) => b.id === editingId) : null;
  if (editingId && !editing) {
    // id 异常时仍打开空表单，避免白屏
    refreshBrandPanel(panel, null);
  } else {
    refreshBrandPanel(panel, editingId);
  }
  const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
  dialog?.classList.remove("hidden");
  dialog?.classList.add("flex");
  if (editingId && editing) {
    dialog?.setAttribute("data-editing-id", editingId);
  }
  dialog?.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  dialog?.querySelector<HTMLInputElement>("[data-brand-name]")?.focus();
}

function hideBrandDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
  if (!dialog) return;
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-editing-id", "");
}

function collectScheduleIdsFromDialog(dialog: HTMLElement): string[] {
  return [...dialog.querySelectorAll<HTMLInputElement>("[data-brand-schedule-id]:checked")].map(
    (input) => input.value,
  );
}

function collectDisplayChannelsFromDialog(dialog: HTMLElement): BrandMenuLineId[] {
  const checked = [...dialog.querySelectorAll<HTMLInputElement>("[data-brand-display-channel]:checked")]
    .map((input) => input.value)
    .filter(isBrandMenuLineId);
  return ALL_DISPLAY_CHANNELS.filter((id) => checked.includes(id));
}

function collectMenuStructureByLineFromDialog(dialog: HTMLElement): BrandMenuStructureByLine {
  const picker = dialog.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
  if (!picker) return emptyBrandMenuStructureByLine();
  return readBrandMenuStructureByLineFromPicker(picker);
}

function saveBrandFromDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
  if (!dialog) return;
  const name = dialog.querySelector<HTMLInputElement>("[data-brand-name]")?.value.trim() ?? "";
  if (!name) {
    dialog.querySelector<HTMLInputElement>("[data-brand-name]")?.focus();
    return;
  }
  const editingId = dialog.getAttribute("data-editing-id") || "";
  const preview = dialog.querySelector<HTMLImageElement>("[data-brand-image-preview]");
  const imageDataUrl = preview?.tagName === "IMG" ? preview.src : undefined;
  const scheduleIds = collectScheduleIdsFromDialog(dialog);
  const displayChannels = collectDisplayChannelsFromDialog(dialog);
  const menuStructureByLine = collectMenuStructureByLineFromDialog(dialog);
  const brands = readStoreBrands();
  const nextRecord: StoreBrandRecord = {
    id: editingId || newBrandId(),
    name,
    imageDataUrl,
    scheduleIds,
    displayChannels,
    menuStructureByLine,
  };
  if (editingId) {
    const idx = brands.findIndex((b) => b.id === editingId);
    if (idx >= 0) {
      brands[idx] = { ...brands[idx], ...nextRecord };
    } else {
      // 预设品牌首次落库：按编辑 id 写入，避免丢失更新
      brands.push(nextRecord);
    }
  } else {
    brands.push({ ...nextRecord, id: newBrandId() });
  }
  writeStoreBrands(brands);
  hideBrandDialog(panel);
  refreshBrandPanel(panel, null);
}

function deleteBrand(panel: HTMLElement, brandId: string): void {
  writeStoreBrands(readStoreBrands().filter((b) => b.id !== brandId));
  refreshBrandPanel(panel, null);
}

function openDeleteBrandDialog(panel: HTMLElement, brandId: string, brandName: string): void {
  const dialog = panel.querySelector<HTMLElement>("[data-brand-delete-dialog]");
  const idInput = panel.querySelector<HTMLInputElement>("[data-brand-delete-target-id]");
  const messageEl = panel.querySelector<HTMLElement>("[data-brand-delete-message]");
  if (!dialog || !idInput || !messageEl) return;
  idInput.value = brandId;
  const label = brandName ? `「${brandName}」` : "该品牌";
  messageEl.textContent = `确定删除${label}？删除后无法恢复。`;
  showDialog(dialog);
}

function hideDeleteBrandDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-brand-delete-dialog]");
  const idInput = panel.querySelector<HTMLInputElement>("[data-brand-delete-target-id]");
  if (idInput) idInput.value = "";
  hideDialog(dialog);
}

function openBrandMenuViewDialog(panel: HTMLElement, brandId: string): void {
  const brand = readStoreBrands().find((b) => b.id === brandId);
  if (!brand) return;
  const dialog = panel.querySelector<HTMLElement>("[data-brand-menu-view-dialog]");
  const titleEl = dialog?.querySelector<HTMLElement>("[data-brand-menu-view-title]");
  const body = dialog?.querySelector<HTMLElement>("[data-brand-menu-view-body]");
  if (!dialog || !body) return;
  if (titleEl) titleEl.textContent = `品牌菜单 · ${brand.name}`;
  body.innerHTML = `
    <p class="m-0 text-xs text-muted-foreground">按产线查看已配置的组 / 类 / 菜（只读）</p>
    ${renderBrandMenuStructurePickerHtml([], undefined, undefined, {
      enableLines: true,
      selectionByLine: brand.menuStructureByLine,
      readOnly: true,
    })}`;
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showDialog(dialog);
}

function hideBrandMenuViewDialog(panel: HTMLElement): void {
  const dialog = panel.querySelector<HTMLElement>("[data-brand-menu-view-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-brand-menu-view-body]");
  if (body) body.innerHTML = "";
  hideDialog(dialog);
}

function confirmDeleteBrand(panel: HTMLElement): void {
  const brandId = panel.querySelector<HTMLInputElement>("[data-brand-delete-target-id]")?.value.trim();
  if (!brandId) return;
  deleteBrand(panel, brandId);
  hideDeleteBrandDialog(panel);
}

function applyBrandImagePreview(panel: HTMLElement, dataUrl: string): void {
  const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
  const previewHost = dialog?.querySelector<HTMLElement>("[data-brand-image-preview]");
  if (!previewHost) return;
  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = "";
  img.className = "mx-auto max-h-24 rounded border border-border object-contain";
  img.dataset.brandImagePreview = "";
  previewHost.replaceWith(img);
}

function setBrandImagePickError(panel: HTMLElement, message: string): void {
  const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
  if (!dialog) return;
  let tip = dialog.querySelector<HTMLElement>("[data-brand-image-error]");
  if (!tip) {
    tip = document.createElement("p");
    tip.className = "m-0 text-xs text-destructive";
    tip.dataset.brandImageError = "";
    const pickBtn = dialog.querySelector("[data-brand-image-pick]");
    pickBtn?.parentElement?.insertAdjacentElement("afterend", tip);
  }
  tip.textContent = message;
}

function clearBrandImagePickError(panel: HTMLElement): void {
  panel.querySelector("[data-brand-image-error]")?.remove();
}

export function bindStoreBrandManagementControls(): void {
  document.querySelectorAll<HTMLElement>("[data-store-brand-management]").forEach((panel) => {
    if (panel.dataset.storeBrandBound === "1") return;
    panel.dataset.storeBrandBound = "1";

    bindImageSourcePicker(panel, {
      onSelect: (result) => {
        clearBrandImagePickError(panel);
        applyBrandImagePreview(panel, result.dataUrl);
      },
      onError: (message) => setBrandImagePickError(panel, message),
    });

    panel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-brand-create]")) {
        showBrandDialog(panel, null);
        return;
      }
      const editBtn = target.closest<HTMLElement>("[data-brand-edit]");
      if (editBtn) {
        showBrandDialog(panel, editBtn.getAttribute("data-brand-id"));
        return;
      }
      const menuDetailBtn = target.closest<HTMLElement>("[data-brand-menu-detail]");
      if (menuDetailBtn) {
        const id = menuDetailBtn.getAttribute("data-brand-id");
        if (id) openBrandMenuViewDialog(panel, id);
        return;
      }
      if (
        target.closest("[data-brand-menu-view-close]") ||
        target.closest("[data-brand-menu-view-backdrop]")
      ) {
        hideBrandMenuViewDialog(panel);
        return;
      }
      const deleteBtn = target.closest<HTMLElement>("[data-brand-delete]");
      if (deleteBtn) {
        const id = deleteBtn.getAttribute("data-brand-id");
        if (!id) return;
        const brand = readStoreBrands().find((b) => b.id === id);
        openDeleteBrandDialog(panel, id, brand?.name ?? "");
        return;
      }
      if (
        target.closest("[data-brand-delete-cancel]") ||
        target.closest("[data-brand-delete-backdrop]")
      ) {
        hideDeleteBrandDialog(panel);
        return;
      }
      if (target.closest("[data-brand-delete-confirm]")) {
        confirmDeleteBrand(panel);
        return;
      }
      if (target.closest("[data-brand-image-pick]")) {
        clearBrandImagePickError(panel);
        openImageSourcePicker(panel);
        return;
      }
      if (
        target.closest("[data-brand-dialog-cancel]") ||
        target.closest("[data-brand-dialog-close]") ||
        target.closest("[data-brand-dialog-backdrop]")
      ) {
        hideBrandDialog(panel);
        return;
      }
      if (target.closest("[data-brand-dialog-save]")) {
        saveBrandFromDialog(panel);
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
      const deleteDialog = panel.querySelector<HTMLElement>("[data-brand-delete-dialog]");
      if (deleteDialog && !deleteDialog.classList.contains("hidden")) {
        e.preventDefault();
        hideDeleteBrandDialog(panel);
        return;
      }
      const menuViewDialog = panel.querySelector<HTMLElement>("[data-brand-menu-view-dialog]");
      if (menuViewDialog && !menuViewDialog.classList.contains("hidden")) {
        e.preventDefault();
        hideBrandMenuViewDialog(panel);
        return;
      }
      const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
      if (dialog && !dialog.classList.contains("hidden")) {
        e.preventDefault();
        hideBrandDialog(panel);
      }
    });
  });
}
