/**
 * 门店管理 · 品牌与菜单展示（/stores/brand-menu）· 品牌管理（seq 547）。
 * 本店品牌列表、新增/编辑品牌；品牌营业时间引用 seq 418，品牌菜单引用 seq 548 菜单库。
 */

import {
  formatBrandMenuSummary,
  readBrandMenus,
  type StoreBrandMenu,
} from "./module-settings-store-brand-menu-ui";
import {
  formatScheduleSummary,
  readBusinessHourSchedules,
  type StoreBusinessHourSchedule,
} from "./module-settings-store-business-hours-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const STORE_BRAND_MANAGEMENT_SEQ = 547;

export const STORE_BRANDS_FIELD_ID = "547-store-brands";

export type StoreBrandRecord = {
  id: string;
  name: string;
  imageDataUrl?: string;
  /** 引用的 seq 418 营业时间规则 id 列表 */
  scheduleIds: string[];
  /** 引用的 seq 548 品牌菜单 id 列表 */
  menuIds: string[];
};

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

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

function normalizeMenuIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return uniqueStrings(raw.filter((id): id is string => typeof id === "string" && id.length > 0));
}

function normalizeBrand(raw: Partial<StoreBrandRecord> & { businessHours?: unknown }): StoreBrandRecord {
  const scheduleIds = normalizeScheduleIds(raw.scheduleIds);
  const menuIds = normalizeMenuIds(raw.menuIds);
  return {
    id: raw.id ?? newBrandId(),
    name: raw.name ?? "",
    imageDataUrl: raw.imageDataUrl,
    scheduleIds,
    menuIds,
  };
}

function defaultBrands(): StoreBrandRecord[] {
  const schedules = readBusinessHourSchedules();
  const menus = readBrandMenus();
  const firstScheduleId = schedules[0]?.id;
  const secondScheduleIds = schedules.slice(0, 2).map((s) => s.id);
  const firstMenuId = menus[0]?.id;
  const secondMenuIds = menus.slice(0, 2).map((m) => m.id);
  return [
    normalizeBrand({
      id: newBrandId(),
      name: "杨国富麻辣烫",
      scheduleIds: firstScheduleId ? [firstScheduleId] : [],
      menuIds: firstMenuId ? [firstMenuId] : [],
    }),
    normalizeBrand({
      id: newBrandId(),
      name: "张亮麻辣烫",
      scheduleIds: secondScheduleIds.length > 0 ? secondScheduleIds : firstScheduleId ? [firstScheduleId] : [],
      menuIds: secondMenuIds.length > 0 ? secondMenuIds : firstMenuId ? [firstMenuId] : [],
    }),
  ];
}

export function readStoreBrands(): StoreBrandRecord[] {
  const raw = readModuleSettingJson<(Partial<StoreBrandRecord> & { businessHours?: unknown })[]>(
    STORE_BRANDS_FIELD_ID,
    [],
  );
  if (!Array.isArray(raw) || raw.length === 0) return defaultBrands();
  return raw.map((b) => normalizeBrand(b));
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
  const menus = readBrandMenus();
  const names = brand.menuIds
    .map((id) => menus.find((m) => m.id === id)?.name)
    .filter((name): name is string => !!name);
  return names.length > 0 ? uniqueStrings(names).join(" / ") : "—";
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
    .map(
      (brand) => `
      <tr class="border-t border-border" data-brand-row data-brand-id="${escapeHtml(brand.id)}">
        <td class="py-3 pr-3 text-sm text-foreground">${escapeHtml(brand.name)}</td>
        <td class="py-3 pr-3">${renderBrandImageCell(brand)}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatBrandBusinessHoursSummary(brand))}</td>
        <td class="py-3 pr-3 text-sm text-muted-foreground">${escapeHtml(formatBrandMenusSummary(brand))}</td>
        <td class="py-3 text-right text-sm whitespace-nowrap">
          <button type="button" class="${BTN_LINK} mr-3" data-brand-edit data-brand-id="${escapeHtml(brand.id)}">编辑</button>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-brand-delete data-brand-id="${escapeHtml(brand.id)}">删除</button>
        </td>
      </tr>`,
    )
    .join("");
  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">品牌名称</th>
            <th class="px-3 py-2 font-medium">品牌图片</th>
            <th class="px-3 py-2 font-medium">品牌营业时间</th>
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

function renderMenuOption(menu: StoreBrandMenu, selectedIds: string[]): string {
  const checked = selectedIds.includes(menu.id);
  return `
    <label
      class="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5 hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
      data-brand-menu-option
    >
      <input
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 accent-primary"
        data-brand-menu-id
        value="${escapeHtml(menu.id)}"
        ${checked ? "checked" : ""}
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-foreground">${escapeHtml(menu.name)}</span>
        <span class="block text-xs text-muted-foreground">${escapeHtml(formatBrandMenuSummary(menu))}</span>
      </span>
    </label>`;
}

function renderMenuPicker(selectedIds: string[]): string {
  const menus = readBrandMenus();
  if (menus.length === 0) {
    return `
      <div class="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
        暂无可用品牌菜单，请先在「商品中心 → 品牌菜单」中创建菜单。
      </div>`;
  }
  return `
    <div class="space-y-2" data-brand-menu-picker>
      ${menus.map((m) => renderMenuOption(m, selectedIds)).join("")}
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
  const selectedMenuIds = editing?.menuIds ?? [];

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
      <div class="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-lg">
        <div class="flex items-start justify-between gap-3">
          <h3 id="brand-dialog-title" class="text-base font-semibold text-card-foreground">${title}</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-brand-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="mt-4 space-y-4">
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground" for="brand-create-name">品牌名称</label>
            <input id="brand-create-name" type="text" maxlength="50" class="${INPUT_CLASS}" data-brand-name value="${escapeHtml(name)}" />
          </div>
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-foreground">品牌图片</label>
            <p class="text-xs text-muted-foreground">支持 PNG、JPG、JPEG；比例 1:1，建议 500×500，1MB 以内</p>
            <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              ${imagePreview}
              <input type="file" accept="image/png,image/jpeg,image/jpg" class="text-sm text-foreground" data-brand-image-input />
            </div>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">品牌营业时间</p>
            <p class="text-xs text-muted-foreground">从已创建的营业时间规则中选择（可多选）</p>
            ${renderSchedulePicker(selectedScheduleIds)}
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">品牌菜单</p>
            <p class="text-xs text-muted-foreground">从已创建的品牌菜单中选择（可多选）</p>
            ${renderMenuPicker(selectedMenuIds)}
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="${BTN_GHOST}" data-brand-dialog-cancel>取消</button>
          <button type="button" class="${BTN_PRIMARY}" data-brand-dialog-save>确定</button>
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
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted-foreground">配置本店启用的品牌；品牌主数据见「品牌管理」hub，此处为 Location 级启用、营业时间与菜单绑定。</p>
        <button type="button" class="${BTN_PRIMARY}" data-brand-create>新增品牌</button>
      </div>
      <div data-brand-table-wrap>${renderBrandTable(brands)}</div>
      ${renderBrandDialog(brands, null)}
    </div>`;
}

function refreshBrandPanel(panel: HTMLElement, editingId: string | null = null): void {
  const brands = readStoreBrands();
  const tableWrap = panel.querySelector<HTMLElement>("[data-brand-table-wrap]");
  if (tableWrap) tableWrap.innerHTML = renderBrandTable(brands);
  const oldDialog = panel.querySelector("[data-brand-dialog]");
  oldDialog?.remove();
  panel.insertAdjacentHTML("beforeend", renderBrandDialog(brands, editingId));
}

function showBrandDialog(panel: HTMLElement, editingId: string | null): void {
  refreshBrandPanel(panel, editingId);
  const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
  dialog?.classList.remove("hidden");
  dialog?.classList.add("flex");
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

function collectMenuIdsFromDialog(dialog: HTMLElement): string[] {
  return [...dialog.querySelectorAll<HTMLInputElement>("[data-brand-menu-id]:checked")].map(
    (input) => input.value,
  );
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
  const menuIds = collectMenuIdsFromDialog(dialog);
  const brands = readStoreBrands();
  if (editingId) {
    const idx = brands.findIndex((b) => b.id === editingId);
    if (idx >= 0) {
      brands[idx] = { ...brands[idx], name, imageDataUrl, scheduleIds, menuIds };
    }
  } else {
    brands.push({ id: newBrandId(), name, imageDataUrl, scheduleIds, menuIds });
  }
  writeStoreBrands(brands);
  hideBrandDialog(panel);
  refreshBrandPanel(panel, null);
}

function deleteBrand(panel: HTMLElement, brandId: string): void {
  writeStoreBrands(readStoreBrands().filter((b) => b.id !== brandId));
  refreshBrandPanel(panel, null);
}

export function bindStoreBrandManagementControls(): void {
  document.querySelectorAll<HTMLElement>("[data-store-brand-management]").forEach((panel) => {
    if (panel.dataset.storeBrandBound === "1") return;
    panel.dataset.storeBrandBound = "1";

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
      const deleteBtn = target.closest<HTMLElement>("[data-brand-delete]");
      if (deleteBtn) {
        const id = deleteBtn.getAttribute("data-brand-id");
        if (id) deleteBrand(panel, id);
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

    panel.addEventListener("change", (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches("[data-brand-image-input]")) return;
      const file = input.files?.[0];
      const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
      const previewHost = dialog?.querySelector<HTMLElement>("[data-brand-image-preview]");
      if (!file || !previewHost) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement("img");
        img.src = String(reader.result);
        img.alt = "";
        img.className = "mx-auto max-h-24 rounded border border-border object-contain";
        img.dataset.brandImagePreview = "";
        previewHost.replaceWith(img);
      };
      reader.readAsDataURL(file);
    });

    panel.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const dialog = panel.querySelector<HTMLElement>("[data-brand-dialog]");
      if (dialog && !dialog.classList.contains("hidden")) {
        e.preventDefault();
        hideBrandDialog(panel);
      }
    });
  });
}
