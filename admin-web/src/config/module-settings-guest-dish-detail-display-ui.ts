/**
 * 前厅 · 食客端·首页与版式：seq 608 展示菜详情
 * （主开关 → 产线表格：产线 + 菜单设置；菜单设置以对话框选择组/类/菜，对齐菜单图片大小展示模式 / 品牌管理）。
 */

import {
  bindBrandMenuStructurePicker,
  BRAND_MENU_STRUCTURE_BY_LINE,
  BRAND_MENU_STRUCTURE_TREE,
  formatBrandMenuStructureSummary,
  isBrandMenuLineId,
  readBrandMenuStructureKeysFromPicker,
  renderBrandMenuStructurePickerHtml,
  type BrandMenuGroupNode,
  type BrandMenuLineId,
} from "./brand-menu-structure-picker-ui";
import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getFohActiveLineFilterId,
} from "./foh-settings-by-line-filter";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_DISH_DETAIL_DISPLAY_SEQ = 608;

const LINES_STORAGE_ID = "608-guest-dish-detail-lines";

export const GUEST_DISH_DETAIL_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type GuestDishDetailProductLineId =
  (typeof GUEST_DISH_DETAIL_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestDishDetailProductLineId[] =
  GUEST_DISH_DETAIL_PRODUCT_LINES.map((l) => l.id);

const BTN_PRIMARY =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DIALOG_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function noAttrDishesStorageId(lineId: GuestDishDetailProductLineId): string {
  return `${GUEST_DISH_DETAIL_DISPLAY_SEQ}-no-attr-dishes-${lineId}`;
}

function structureTreeForLine(lineId: GuestDishDetailProductLineId): BrandMenuGroupNode[] {
  return isBrandMenuLineId(lineId)
    ? BRAND_MENU_STRUCTURE_BY_LINE[lineId as BrandMenuLineId]
    : BRAND_MENU_STRUCTURE_TREE;
}

function readStructureKeys(storageId: string): string[] {
  const raw = readModuleSettingJson<unknown>(storageId, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((k): k is string => typeof k === "string");
}

function writeStructureKeys(storageId: string, keys: string[]): void {
  writeModuleSettingJson(storageId, keys);
}

function normalizeLineIds(raw: unknown): GuestDishDetailProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestDishDetailProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_DISH_DETAIL_DISPLAY_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestDishDetailDisplayToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_DISH_DETAIL_DISPLAY_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_DISH_DETAIL_DISPLAY_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

export function writeGuestDishDetailLines(lines: GuestDishDetailProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

/** 表格展示全部产线；开启后默认全部生效 */
export function ensureGuestDishDetailLinesDefault(): void {
  writeGuestDishDetailLines([...ALL_LINE_IDS]);
}

export function readGuestDishDetailLines(): GuestDishDetailProductLineId[] {
  ensureGuestDishDetailDisplayToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestDishDetailLines(all);
    return all;
  }
  return [];
}

export function isGuestDishDetailDisplaySeq(seq: number): boolean {
  return seq === GUEST_DISH_DETAIL_DISPLAY_SEQ;
}

function visibleProductLines(): (typeof GUEST_DISH_DETAIL_PRODUCT_LINES)[number][] {
  const activeLine = getFohActiveLineFilterId();
  if (!activeLine) return [...GUEST_DISH_DETAIL_PRODUCT_LINES];
  return GUEST_DISH_DETAIL_PRODUCT_LINES.filter((line) => line.id === activeLine);
}

function renderMenuSettingsCell(lineId: GuestDishDetailProductLineId): string {
  const storageId = noAttrDishesStorageId(lineId);
  const keys = readStructureKeys(storageId);
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";

  return `
    <div class="min-w-[14rem] space-y-1.5" data-guest-dish-detail-menu-settings="${escapeHtml(lineId)}">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="${BTN_PRIMARY}"
          data-guest-dish-detail-pick-dishes
          data-line-id="${escapeHtml(lineId)}"
          data-storage-id="${escapeHtml(storageId)}"
        >选择商品</button>
        <span class="text-xs text-muted-foreground" data-guest-dish-detail-pick-count="${escapeHtml(storageId)}">${escapeHtml(countLabel)}</span>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground" data-guest-dish-detail-pick-summary="${escapeHtml(storageId)}">${escapeHtml(summary)}</p>
    </div>`;
}

function renderLineRow(
  line: (typeof GUEST_DISH_DETAIL_PRODUCT_LINES)[number],
  enabled: boolean,
): string {
  return `
    <tr
      class="border-t border-border"
      ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}"
      data-guest-dish-detail-line-row="${escapeHtml(line.id)}"
    >
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top ${enabled ? "" : "opacity-50"}">${renderMenuSettingsCell(line.id)}</td>
    </tr>`;
}

function renderDishPickDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-guest-dish-detail-dish-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-dish-detail-dish-dialog-title"
      data-line-id=""
      data-storage-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-guest-dish-detail-dish-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="guest-dish-detail-dish-dialog-title" class="text-base font-semibold text-card-foreground">选择商品</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-guest-dish-detail-dish-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-guest-dish-detail-dish-dialog-body>
          <p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐品牌管理）</p>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-guest-dish-detail-dish-dialog-cancel>取消</button>
          <button type="button" class="${BTN_DIALOG_PRIMARY}" data-guest-dish-detail-dish-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderEditorInnerHtml(panelEnabled: boolean): string {
  ensureGuestDishDetailLinesDefault();
  const rows = visibleProductLines()
    .map((line) => renderLineRow(line, panelEnabled))
    .join("");

  return `
    <div
      class="overflow-x-auto rounded-md border border-border"
      data-guest-dish-detail-editor="${GUEST_DISH_DETAIL_DISPLAY_SEQ}"
    >
      <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">菜单设置</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${renderDishPickDialog()}`;
}

export function renderGuestDishDetailPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-4xl ${hidden}"
      data-guest-dish-detail-panel="${GUEST_DISH_DETAIL_DISPLAY_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderEditorInnerHtml(on)}
    </div>`;
}

function setEditorInteractive(editor: HTMLElement, enabled: boolean): void {
  editor.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
    "input, select, button",
  ).forEach((el) => {
    el.disabled = !enabled;
  });
  editor.querySelectorAll("label").forEach((label) => {
    label.classList.toggle("cursor-not-allowed", !enabled);
    label.classList.toggle("opacity-50", !enabled);
    label.classList.toggle("cursor-pointer", enabled);
  });
}

export function setGuestDishDetailPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-guest-dish-detail-panel="${GUEST_DISH_DETAIL_DISPLAY_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      if (visible) ensureGuestDishDetailLinesDefault();

      const editor = panel.querySelector<HTMLElement>(`[data-guest-dish-detail-editor]`);
      if (editor) setEditorInteractive(editor, visible);
      if (!visible) closeDishPickDialog(panel);
    });
}

function showDishPickDialog(dialog: HTMLElement): void {
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
}

function hideDishPickDialog(dialog: HTMLElement): void {
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  dialog.setAttribute("data-line-id", "");
  dialog.setAttribute("data-storage-id", "");
  const body = dialog.querySelector<HTMLElement>("[data-guest-dish-detail-dish-dialog-body]");
  if (body) {
    body.innerHTML =
      `<p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐品牌管理）</p>`;
  }
}

function closeDishPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-guest-dish-detail-dish-dialog]");
  if (dialog) hideDishPickDialog(dialog);
}

function refreshPickSummary(
  host: HTMLElement,
  lineId: GuestDishDetailProductLineId,
  storageId: string,
): void {
  const keys = readStructureKeys(storageId);
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";

  host
    .querySelectorAll<HTMLElement>(`[data-guest-dish-detail-pick-summary="${storageId}"]`)
    .forEach((el) => {
      el.textContent = summary;
    });
  host
    .querySelectorAll<HTMLElement>(`[data-guest-dish-detail-pick-count="${storageId}"]`)
    .forEach((el) => {
      el.textContent = countLabel;
    });
}

function openDishPickDialog(
  host: HTMLElement,
  lineId: GuestDishDetailProductLineId,
  storageId: string,
): void {
  const dialog = host.querySelector<HTMLElement>("[data-guest-dish-detail-dish-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-guest-dish-detail-dish-dialog-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#guest-dish-detail-dish-dialog-title");
  if (!dialog || !body) return;

  dialog.setAttribute("data-line-id", lineId);
  dialog.setAttribute("data-storage-id", storageId);
  if (titleEl) titleEl.textContent = "选择商品";

  const keys = readStructureKeys(storageId);
  const treeLineId = isBrandMenuLineId(lineId) ? (lineId as BrandMenuLineId) : undefined;
  body.innerHTML = `
    <p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐品牌管理）</p>
    ${renderBrandMenuStructurePickerHtml(keys, undefined, undefined, {
      treeLineId,
    })}`;
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showDishPickDialog(dialog);
}

function saveDishPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-guest-dish-detail-dish-dialog]");
  if (!dialog) return;
  const lineId = dialog.getAttribute("data-line-id") as GuestDishDetailProductLineId | null;
  const storageId = dialog.getAttribute("data-storage-id") ?? "";
  const picker = dialog.querySelector<HTMLElement>("[data-brand-menu-structure-picker]");
  if (!lineId || !storageId || !ALL_LINE_IDS.includes(lineId)) {
    hideDishPickDialog(dialog);
    return;
  }
  const keys = picker ? readBrandMenuStructureKeysFromPicker(picker) : [];
  writeStructureKeys(storageId, keys);
  refreshPickSummary(host, lineId, storageId);
  hideDishPickDialog(dialog);
}

function bindGuestDishDetailPanel(panel: HTMLElement): void {
  if (panel.dataset.guestDishDetailPanelBound === "1") return;
  panel.dataset.guestDishDetailPanelBound = "1";

  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    const pickBtn = target.closest<HTMLElement>("[data-guest-dish-detail-pick-dishes]");
    if (pickBtn) {
      const lineId = pickBtn.getAttribute("data-line-id") as GuestDishDetailProductLineId | null;
      const storageId = pickBtn.getAttribute("data-storage-id") ?? "";
      if (lineId && storageId && ALL_LINE_IDS.includes(lineId)) {
        openDishPickDialog(panel, lineId, storageId);
      }
      return;
    }

    if (
      target.closest("[data-guest-dish-detail-dish-dialog-close]") ||
      target.closest("[data-guest-dish-detail-dish-dialog-cancel]") ||
      target.closest("[data-guest-dish-detail-dish-dialog-backdrop]")
    ) {
      closeDishPickDialog(panel);
      return;
    }

    if (target.closest("[data-guest-dish-detail-dish-dialog-save]")) {
      saveDishPickDialog(panel);
    }
  });
}

export function bindGuestDishDetailDisplayUi(root: ParentNode = document): void {
  ensureGuestDishDetailDisplayToggleMigrated();

  root.querySelectorAll<HTMLElement>(`[data-guest-dish-detail-panel="${GUEST_DISH_DETAIL_DISPLAY_SEQ}"]`).forEach((panel) => {
    bindGuestDishDetailPanel(panel);
  });
}
