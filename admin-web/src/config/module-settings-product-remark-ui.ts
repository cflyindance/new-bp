/**
 * 前厅 · 备注与附加服务：seq 522 产品备注
 * （主开关 → 产线表格：产线 + 菜单设置；菜单设置以对话框选择组/类/菜，结构对齐展示菜详情 608）。
 */

import {
  bindBrandMenuStructurePicker,
  BRAND_MENU_STRUCTURE_BY_LINE,
  BRAND_MENU_STRUCTURE_TREE,
  dishKey,
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

export const PRODUCT_REMARK_SEQ = 522;

const LINES_STORAGE_ID = "522-product-remark-lines";
const LEGACY_DISHES_STORAGE_ID = "522-remark-dishes";

export const PRODUCT_REMARK_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type ProductRemarkProductLineId =
  (typeof PRODUCT_REMARK_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: ProductRemarkProductLineId[] =
  PRODUCT_REMARK_PRODUCT_LINES.map((l) => l.id);

const BTN_PRIMARY =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DIALOG_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

let toggleMigrated = false;
let dishesMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function productRemarkDishesStorageId(lineId: ProductRemarkProductLineId): string {
  return `${PRODUCT_REMARK_SEQ}-remark-dishes-${lineId}`;
}

function structureTreeForLine(lineId: ProductRemarkProductLineId): BrandMenuGroupNode[] {
  return isBrandMenuLineId(lineId)
    ? BRAND_MENU_STRUCTURE_BY_LINE[lineId as BrandMenuLineId]
    : BRAND_MENU_STRUCTURE_TREE;
}

function dishTagsToStructureKeys(
  tags: Array<{ id?: unknown }>,
  tree: BrandMenuGroupNode[],
): string[] {
  const dishIds = new Set(
    tags
      .map((t) => (typeof t?.id === "string" ? t.id : ""))
      .filter(Boolean),
  );
  if (dishIds.size === 0) return [];

  const keys: string[] = [];
  for (const group of tree) {
    for (const category of group.categories) {
      for (const dish of category.dishes) {
        if (dishIds.has(dish.id)) {
          keys.push(dishKey(group.id, category.id, dish.id));
        }
      }
    }
  }
  return keys;
}

function normalizeStructureKeys(raw: unknown, tree: BrandMenuGroupNode[]): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (raw.every((k) => typeof k === "string")) {
    return raw.filter((k): k is string => typeof k === "string");
  }
  return dishTagsToStructureKeys(raw as Array<{ id?: unknown }>, tree);
}

function readStructureKeys(
  storageId: string,
  lineId: ProductRemarkProductLineId,
): string[] {
  const raw = readModuleSettingJson<unknown>(storageId, []);
  return normalizeStructureKeys(raw, structureTreeForLine(lineId));
}

function writeStructureKeys(storageId: string, keys: string[]): void {
  writeModuleSettingJson(storageId, keys);
}

function normalizeLineIds(raw: unknown): ProductRemarkProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is ProductRemarkProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(PRODUCT_REMARK_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureProductRemarkToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(PRODUCT_REMARK_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(PRODUCT_REMARK_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

export function writeProductRemarkLines(lines: ProductRemarkProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

/** 表格展示全部产线；开启后默认全部生效 */
export function ensureProductRemarkLinesDefault(): void {
  writeProductRemarkLines([...ALL_LINE_IDS]);
}

export function readProductRemarkLines(): ProductRemarkProductLineId[] {
  ensureProductRemarkToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeProductRemarkLines(all);
    return all;
  }
  return [];
}

/** 迁移旧版 DishTag[] / 全局商品列表到按产线结构 key */
export function ensureProductRemarkDishesMigrated(): void {
  if (dishesMigrated) return;
  dishesMigrated = true;

  const legacy = readModuleSettingJson<unknown>(LEGACY_DISHES_STORAGE_ID, []);
  const legacyKeys =
    Array.isArray(legacy) && legacy.length > 0
      ? normalizeStructureKeys(legacy, BRAND_MENU_STRUCTURE_TREE)
      : [];

  for (const lineId of ALL_LINE_IDS) {
    const storageId = productRemarkDishesStorageId(lineId);
    const raw = readModuleSettingJson<unknown>(storageId, null);
    if (raw == null) {
      if (legacyKeys.length > 0) writeStructureKeys(storageId, legacyKeys);
      continue;
    }
    const keys = normalizeStructureKeys(raw, structureTreeForLine(lineId));
    const needsRewrite =
      Array.isArray(raw) &&
      raw.length > 0 &&
      !raw.every((k) => typeof k === "string");
    if (needsRewrite || (Array.isArray(raw) && raw.length === 0 && legacyKeys.length > 0)) {
      writeStructureKeys(storageId, keys.length > 0 ? keys : legacyKeys);
    }
  }
}

export function readProductRemarkStructureKeysForLine(
  lineId: ProductRemarkProductLineId,
): string[] {
  ensureProductRemarkDishesMigrated();
  return readStructureKeys(productRemarkDishesStorageId(lineId), lineId);
}

export function isProductRemarkSeq(seq: number): boolean {
  return seq === PRODUCT_REMARK_SEQ;
}

function visibleProductLines(): (typeof PRODUCT_REMARK_PRODUCT_LINES)[number][] {
  const activeLine = getFohActiveLineFilterId();
  if (!activeLine) return [...PRODUCT_REMARK_PRODUCT_LINES];
  return PRODUCT_REMARK_PRODUCT_LINES.filter((line) => line.id === activeLine);
}

function renderMenuSettingsCell(lineId: ProductRemarkProductLineId): string {
  const storageId = productRemarkDishesStorageId(lineId);
  const keys = readStructureKeys(storageId, lineId);
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";

  return `
    <div class="min-w-[14rem] space-y-1.5" data-product-remark-menu-settings="${escapeHtml(lineId)}">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="${BTN_PRIMARY}"
          data-product-remark-pick-dishes
          data-line-id="${escapeHtml(lineId)}"
          data-storage-id="${escapeHtml(storageId)}"
        >选择商品</button>
        <span class="text-xs text-muted-foreground" data-product-remark-pick-count="${escapeHtml(storageId)}">${escapeHtml(countLabel)}</span>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground" data-product-remark-pick-summary="${escapeHtml(storageId)}">${escapeHtml(summary)}</p>
    </div>`;
}

function renderLineRow(
  line: (typeof PRODUCT_REMARK_PRODUCT_LINES)[number],
  enabled: boolean,
): string {
  return `
    <tr
      class="border-t border-border"
      ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}"
      data-product-remark-line-row="${escapeHtml(line.id)}"
    >
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top ${enabled ? "" : "opacity-50"}">${renderMenuSettingsCell(line.id)}</td>
    </tr>`;
}

function renderDishPickDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-product-remark-dish-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-remark-dish-dialog-title"
      data-line-id=""
      data-storage-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-product-remark-dish-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="product-remark-dish-dialog-title" class="text-base font-semibold text-card-foreground">选择商品</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-product-remark-dish-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-product-remark-dish-dialog-body>
          <p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐品牌管理）</p>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-product-remark-dish-dialog-cancel>取消</button>
          <button type="button" class="${BTN_DIALOG_PRIMARY}" data-product-remark-dish-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderEditorInnerHtml(panelEnabled: boolean): string {
  ensureProductRemarkLinesDefault();
  const rows = visibleProductLines()
    .map((line) => renderLineRow(line, panelEnabled))
    .join("");

  return `
    <div
      class="overflow-x-auto rounded-md border border-border"
      data-product-remark-editor="${PRODUCT_REMARK_SEQ}"
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

export function renderProductRemarkPanelHtml(on: boolean): string {
  ensureProductRemarkDishesMigrated();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-4xl ${hidden}"
      data-product-remark-panel="${PRODUCT_REMARK_SEQ}"
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

export function setProductRemarkPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-product-remark-panel="${PRODUCT_REMARK_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      if (visible) ensureProductRemarkLinesDefault();

      const editor = panel.querySelector<HTMLElement>(`[data-product-remark-editor]`);
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
  const body = dialog.querySelector<HTMLElement>("[data-product-remark-dish-dialog-body]");
  if (body) {
    body.innerHTML =
      `<p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选（结构对齐品牌管理）</p>`;
  }
}

function closeDishPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-product-remark-dish-dialog]");
  if (dialog) hideDishPickDialog(dialog);
}

function refreshPickSummary(
  host: HTMLElement,
  lineId: ProductRemarkProductLineId,
  storageId: string,
): void {
  const keys = readStructureKeys(storageId, lineId);
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";

  host
    .querySelectorAll<HTMLElement>(`[data-product-remark-pick-summary="${storageId}"]`)
    .forEach((el) => {
      el.textContent = summary;
    });
  host
    .querySelectorAll<HTMLElement>(`[data-product-remark-pick-count="${storageId}"]`)
    .forEach((el) => {
      el.textContent = countLabel;
    });
}

function openDishPickDialog(
  host: HTMLElement,
  lineId: ProductRemarkProductLineId,
  storageId: string,
): void {
  const dialog = host.querySelector<HTMLElement>("[data-product-remark-dish-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-product-remark-dish-dialog-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#product-remark-dish-dialog-title");
  if (!dialog || !body) return;

  dialog.setAttribute("data-line-id", lineId);
  dialog.setAttribute("data-storage-id", storageId);
  if (titleEl) titleEl.textContent = "选择商品";

  const keys = readStructureKeys(storageId, lineId);
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
  const dialog = host.querySelector<HTMLElement>("[data-product-remark-dish-dialog]");
  if (!dialog) return;
  const lineId = dialog.getAttribute("data-line-id") as ProductRemarkProductLineId | null;
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

function bindProductRemarkPanel(panel: HTMLElement): void {
  if (panel.dataset.productRemarkPanelBound === "1") return;
  panel.dataset.productRemarkPanelBound = "1";

  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    const pickBtn = target.closest<HTMLElement>("[data-product-remark-pick-dishes]");
    if (pickBtn) {
      const lineId = pickBtn.getAttribute("data-line-id") as ProductRemarkProductLineId | null;
      const storageId = pickBtn.getAttribute("data-storage-id") ?? "";
      if (lineId && storageId && ALL_LINE_IDS.includes(lineId)) {
        openDishPickDialog(panel, lineId, storageId);
      }
      return;
    }

    if (
      target.closest("[data-product-remark-dish-dialog-close]") ||
      target.closest("[data-product-remark-dish-dialog-cancel]") ||
      target.closest("[data-product-remark-dish-dialog-backdrop]")
    ) {
      closeDishPickDialog(panel);
      return;
    }

    if (target.closest("[data-product-remark-dish-dialog-save]")) {
      saveDishPickDialog(panel);
    }
  });
}

export function bindProductRemarkUi(root: ParentNode = document): void {
  ensureProductRemarkToggleMigrated();
  ensureProductRemarkDishesMigrated();

  root
    .querySelectorAll<HTMLElement>(`[data-product-remark-panel="${PRODUCT_REMARK_SEQ}"]`)
    .forEach((panel) => {
      bindProductRemarkPanel(panel);
    });
}
