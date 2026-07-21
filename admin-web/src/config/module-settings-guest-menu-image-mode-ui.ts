/**
 * 前厅 · 食客端·首页与版式：seq 607 菜单图片大小展示模式
 * （主开关 → 产线表格：产线 + 模式 + 菜单设置；菜单设置以对话框选择组/类/菜，对齐品牌管理）。
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
  moduleSettingStorageKey,
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { readModuleSettingRadio, writeModuleSettingRadio } from "./module-settings-nested-ui";
import {
  FOH_LINE_CONFIG_ROW_ATTR,
  getFohActiveLineFilterId,
} from "./foh-settings-by-line-filter";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_IMAGE_MODE_SEQ = 607;

const LINES_STORAGE_ID = "607-menu-image-mode-lines";

const LEGACY_MODE_FIELD_ID = "607-image-mode";

export const GUEST_MENU_IMAGE_MODE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestMenuImageModeProductLineId =
  (typeof GUEST_MENU_IMAGE_MODE_PRODUCT_LINES)[number]["id"];

export type GuestMenuImageMode = "original" | "small" | "large";

const ALL_LINE_IDS: GuestMenuImageModeProductLineId[] =
  GUEST_MENU_IMAGE_MODE_PRODUCT_LINES.map((l) => l.id);

const MODE_OPTIONS: ReadonlyArray<{ value: GuestMenuImageMode; label: string }> = [
  { value: "original", label: "原始模式" },
  { value: "small", label: "小图模式" },
  { value: "large", label: "大图模式" },
];

const DEFAULT_MODE: GuestMenuImageMode = "small";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const BTN_PRIMARY =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DIALOG_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

let toggleMigrated = false;
let legacyMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imageModeFieldId(lineId: GuestMenuImageModeProductLineId): string {
  return `607-${lineId}-image-mode`;
}

function smallDishesFieldId(lineId: GuestMenuImageModeProductLineId): string {
  return `607-${lineId}-small-dishes`;
}

function largeDishesFieldId(lineId: GuestMenuImageModeProductLineId): string {
  return `607-${lineId}-large-dishes`;
}

function isValidMode(value: string): value is GuestMenuImageMode {
  return MODE_OPTIONS.some((o) => o.value === value);
}

function structureTreeForLine(lineId: GuestMenuImageModeProductLineId): BrandMenuGroupNode[] {
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

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_IMAGE_MODE_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestMenuImageModeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_IMAGE_MODE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_MENU_IMAGE_MODE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function migrateLegacyGlobalToLines(): void {
  if (legacyMigrated) return;
  legacyMigrated = true;

  const legacyMode = readModuleSettingRadio(LEGACY_MODE_FIELD_ID, DEFAULT_MODE);

  const hasPerLine = ALL_LINE_IDS.some((lineId) => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(imageModeFieldId(lineId))) !== null;
    } catch {
      return false;
    }
  });

  if (hasPerLine) return;

  const mode = isValidMode(legacyMode) ? legacyMode : DEFAULT_MODE;
  for (const lineId of ALL_LINE_IDS) {
    writeModuleSettingRadio(imageModeFieldId(lineId), mode);
  }
}

function normalizeLineIds(raw: unknown): GuestMenuImageModeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuImageModeProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function writeGuestMenuImageModeLines(lines: GuestMenuImageModeProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

/** 表格展示全部产线；开启后默认全部生效 */
export function ensureGuestMenuImageModeLinesDefault(): void {
  writeGuestMenuImageModeLines([...ALL_LINE_IDS]);
}

export function readGuestMenuImageModeLines(): GuestMenuImageModeProductLineId[] {
  ensureGuestMenuImageModeToggleMigrated();
  migrateLegacyGlobalToLines();

  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestMenuImageModeLines(all);
    return all;
  }
  return [];
}

export function readGuestMenuImageModeForLine(lineId: GuestMenuImageModeProductLineId): GuestMenuImageMode {
  migrateLegacyGlobalToLines();
  const mode = readModuleSettingRadio(imageModeFieldId(lineId), DEFAULT_MODE);
  return isValidMode(mode) ? mode : DEFAULT_MODE;
}

export function isGuestMenuImageModeSeq(seq: number): boolean {
  return seq === GUEST_MENU_IMAGE_MODE_SEQ;
}

function visibleProductLines(): (typeof GUEST_MENU_IMAGE_MODE_PRODUCT_LINES)[number][] {
  const activeLine = getFohActiveLineFilterId();
  if (!activeLine) return [...GUEST_MENU_IMAGE_MODE_PRODUCT_LINES];
  return GUEST_MENU_IMAGE_MODE_PRODUCT_LINES.filter((line) => line.id === activeLine);
}

function renderModeRadiosHtml(lineId: GuestMenuImageModeProductLineId, enabled: boolean): string {
  const groupName = `menu-image-mode-radio-${lineId}`;
  const current = readGuestMenuImageModeForLine(lineId);
  const radioFieldId = imageModeFieldId(lineId);
  const disabled = enabled ? "" : "disabled";

  const options = MODE_OPTIONS.map((opt) => {
    const checked = current === opt.value;
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground ${enabled ? "" : "cursor-not-allowed opacity-50"}">
        <input
          type="radio"
          name="${escapeHtml(groupName)}"
          value="${escapeHtml(opt.value)}"
          class="${MODULE_SETTING_CONTROL_CLASS}"
          ${checked ? "checked" : ""}
          ${disabled}
          data-module-setting-radio="${escapeHtml(radioFieldId)}"
          data-menu-image-mode-line-radio="${escapeHtml(lineId)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `<div class="flex flex-wrap items-center gap-4" role="radiogroup" aria-label="图片展示模式">${options}</div>`;
}

function renderDishPickTrigger(
  lineId: GuestMenuImageModeProductLineId,
  whenMode: GuestMenuImageMode,
  pickerLabel: string,
  storageId: string,
): string {
  const keys = readStructureKeys(storageId);
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";

  return `
    <div class="space-y-1.5">
      <p class="m-0 text-xs text-muted-foreground">${escapeHtml(pickerLabel)}</p>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="${BTN_PRIMARY}"
          data-menu-image-mode-pick-dishes
          data-line-id="${escapeHtml(lineId)}"
          data-when-mode="${escapeHtml(whenMode)}"
          data-storage-id="${escapeHtml(storageId)}"
          data-picker-label="${escapeHtml(pickerLabel)}"
        >选择商品</button>
        <span class="text-xs text-muted-foreground" data-menu-image-mode-pick-count="${escapeHtml(storageId)}">${escapeHtml(countLabel)}</span>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground" data-menu-image-mode-pick-summary="${escapeHtml(storageId)}">${escapeHtml(summary)}</p>
    </div>`;
}

function renderConditionalDishPicker(
  lineId: GuestMenuImageModeProductLineId,
  mode: GuestMenuImageMode,
  whenMode: GuestMenuImageMode,
  pickerLabel: string,
  storageId: string,
): string {
  const hidden = mode !== whenMode ? "hidden" : "";
  const radioFieldId = imageModeFieldId(lineId);
  return `
    <div
      class="space-y-1.5 ${hidden}"
      data-conditional-panel
      data-when-radio-field="${escapeHtml(radioFieldId)}"
      data-when-radio-value="${escapeHtml(whenMode)}"
      data-menu-image-mode-line-panel="${escapeHtml(lineId)}"
      ${mode !== whenMode ? 'aria-hidden="true"' : ""}
    >
      ${renderDishPickTrigger(lineId, whenMode, pickerLabel, storageId)}
    </div>`;
}

function renderMenuSettingsCell(lineId: GuestMenuImageModeProductLineId, mode: GuestMenuImageMode): string {
  return `
    <div class="min-w-[14rem] space-y-2" data-menu-image-mode-menu-settings="${escapeHtml(lineId)}">
      <p class="m-0 text-sm text-muted-foreground ${mode === "original" ? "" : "hidden"}" data-menu-image-mode-original-hint="${escapeHtml(lineId)}">无需例外菜品</p>
      ${renderConditionalDishPicker(
        lineId,
        mode,
        "small",
        "请选择需要大图展示的菜",
        smallDishesFieldId(lineId),
      )}
      ${renderConditionalDishPicker(
        lineId,
        mode,
        "large",
        "请选择需要小图展示的菜",
        largeDishesFieldId(lineId),
      )}
    </div>`;
}

function renderLineRow(
  line: (typeof GUEST_MENU_IMAGE_MODE_PRODUCT_LINES)[number],
  enabled: boolean,
): string {
  const mode = readGuestMenuImageModeForLine(line.id);
  return `
    <tr
      class="border-t border-border"
      ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}"
      data-menu-image-mode-line-config="${escapeHtml(line.id)}"
    >
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top">${renderModeRadiosHtml(line.id, enabled)}</td>
      <td class="px-3 py-2.5 align-top">${renderMenuSettingsCell(line.id, mode)}</td>
    </tr>`;
}

function renderDishPickDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-menu-image-mode-dish-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-image-mode-dish-dialog-title"
      data-line-id=""
      data-storage-id=""
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-menu-image-mode-dish-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="menu-image-mode-dish-dialog-title" class="text-base font-semibold text-card-foreground">选择商品</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-menu-image-mode-dish-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4" data-menu-image-mode-dish-dialog-body>
          <p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选需要例外展示的商品（结构对齐品牌管理）</p>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-menu-image-mode-dish-dialog-cancel>取消</button>
          <button type="button" class="${BTN_DIALOG_PRIMARY}" data-menu-image-mode-dish-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderEditorInnerHtml(panelEnabled: boolean): string {
  ensureGuestMenuImageModeLinesDefault();
  const rows = visibleProductLines()
    .map((line) => renderLineRow(line, panelEnabled))
    .join("");

  return `
    <div
      class="overflow-x-auto rounded-md border border-border"
      data-menu-image-mode-editor="${GUEST_MENU_IMAGE_MODE_SEQ}"
    >
      <table class="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
            <th class="px-3 py-2 font-medium w-[16rem]">模式</th>
            <th class="px-3 py-2 font-medium">菜单设置</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${renderDishPickDialog()}`;
}

export function renderGuestMenuImageModePanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-4xl ${hidden}"
      data-menu-image-mode-panel="${GUEST_MENU_IMAGE_MODE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderEditorInnerHtml(on)}
    </div>`;
}

function syncConditionalPanelsForLine(lineId: GuestMenuImageModeProductLineId): void {
  const radioFieldId = imageModeFieldId(lineId);
  const checked = document.querySelector<HTMLInputElement>(
    `[data-module-setting-radio="${radioFieldId}"]:checked`,
  );
  const current = checked?.value ?? readGuestMenuImageModeForLine(lineId);

  document
    .querySelectorAll<HTMLElement>(
      `[data-conditional-panel][data-when-radio-field="${radioFieldId}"]`,
    )
    .forEach((panel) => {
      const want = panel.getAttribute("data-when-radio-value") ?? "";
      const show = current === want;
      panel.classList.toggle("hidden", !show);
      if (show) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");
    });

  document
    .querySelectorAll<HTMLElement>(`[data-menu-image-mode-original-hint="${lineId}"]`)
    .forEach((hint) => {
      hint.classList.toggle("hidden", current !== "original");
    });
}

function syncAllConditionalPanelsInEditor(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLElement>("[data-menu-image-mode-line-config]").forEach((block) => {
    const lineId = block.getAttribute("data-menu-image-mode-line-config");
    if (lineId && ALL_LINE_IDS.includes(lineId as GuestMenuImageModeProductLineId)) {
      syncConditionalPanelsForLine(lineId as GuestMenuImageModeProductLineId);
    }
  });
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

export function setGuestMenuImageModePanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-menu-image-mode-panel="${GUEST_MENU_IMAGE_MODE_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      if (visible) ensureGuestMenuImageModeLinesDefault();

      const editor = panel.querySelector<HTMLElement>(`[data-menu-image-mode-editor]`);
      if (editor) {
        setEditorInteractive(editor, visible);
        if (visible) syncAllConditionalPanelsInEditor(editor);
      }
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
  const body = dialog.querySelector<HTMLElement>("[data-menu-image-mode-dish-dialog-body]");
  if (body) {
    body.innerHTML =
      `<p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选需要例外展示的商品（结构对齐品牌管理）</p>`;
  }
}

function closeDishPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-menu-image-mode-dish-dialog]");
  if (dialog) hideDishPickDialog(dialog);
}

function refreshPickSummary(host: HTMLElement, lineId: GuestMenuImageModeProductLineId, storageId: string): void {
  const keys = readStructureKeys(storageId);
  const summary = formatBrandMenuStructureSummary(keys, structureTreeForLine(lineId));
  const dishCount = keys.filter((k) => k.startsWith("d:")).length;
  const countLabel = dishCount > 0 ? `已选 ${dishCount} 道菜` : "未选择商品";

  host
    .querySelectorAll<HTMLElement>(`[data-menu-image-mode-pick-summary="${storageId}"]`)
    .forEach((el) => {
      el.textContent = summary;
    });
  host
    .querySelectorAll<HTMLElement>(`[data-menu-image-mode-pick-count="${storageId}"]`)
    .forEach((el) => {
      el.textContent = countLabel;
    });
}

function openDishPickDialog(
  host: HTMLElement,
  lineId: GuestMenuImageModeProductLineId,
  storageId: string,
  pickerLabel: string,
): void {
  const dialog = host.querySelector<HTMLElement>("[data-menu-image-mode-dish-dialog]");
  const body = dialog?.querySelector<HTMLElement>("[data-menu-image-mode-dish-dialog-body]");
  const titleEl = dialog?.querySelector<HTMLElement>("#menu-image-mode-dish-dialog-title");
  if (!dialog || !body) return;

  dialog.setAttribute("data-line-id", lineId);
  dialog.setAttribute("data-storage-id", storageId);
  if (titleEl) titleEl.textContent = pickerLabel || "选择商品";

  const keys = readStructureKeys(storageId);
  const treeLineId = isBrandMenuLineId(lineId) ? (lineId as BrandMenuLineId) : undefined;
  body.innerHTML = `
    <p class="m-0 text-xs text-muted-foreground">按组 / 类 / 菜勾选需要例外展示的商品（结构对齐品牌管理）</p>
    ${renderBrandMenuStructurePickerHtml(keys, undefined, undefined, {
      treeLineId,
    })}`;
  body.querySelectorAll<HTMLElement>("[data-brand-menu-structure-picker]").forEach((picker) => {
    bindBrandMenuStructurePicker(picker);
  });
  showDishPickDialog(dialog);
}

function saveDishPickDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-menu-image-mode-dish-dialog]");
  if (!dialog) return;
  const lineId = dialog.getAttribute("data-line-id") as GuestMenuImageModeProductLineId | null;
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

function bindMenuImageModePanel(panel: HTMLElement): void {
  if (panel.dataset.menuImageModePanelBound === "1") return;
  panel.dataset.menuImageModePanelBound = "1";

  const editor = panel.querySelector<HTMLElement>(`[data-menu-image-mode-editor]`);
  if (editor) {
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      const lineRadio = target.closest<HTMLInputElement>("[data-menu-image-mode-line-radio]");
      if (lineRadio?.checked) {
        const lineId = lineRadio.getAttribute("data-menu-image-mode-line-radio");
        if (lineId && ALL_LINE_IDS.includes(lineId as GuestMenuImageModeProductLineId)) {
          syncConditionalPanelsForLine(lineId as GuestMenuImageModeProductLineId);
        }
      }
    });
  }

  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    const pickBtn = target.closest<HTMLElement>("[data-menu-image-mode-pick-dishes]");
    if (pickBtn) {
      const lineId = pickBtn.getAttribute("data-line-id") as GuestMenuImageModeProductLineId | null;
      const storageId = pickBtn.getAttribute("data-storage-id") ?? "";
      const pickerLabel = pickBtn.getAttribute("data-picker-label") ?? "选择商品";
      if (lineId && storageId && ALL_LINE_IDS.includes(lineId)) {
        openDishPickDialog(panel, lineId, storageId, pickerLabel);
      }
      return;
    }

    if (
      target.closest("[data-menu-image-mode-dish-dialog-close]") ||
      target.closest("[data-menu-image-mode-dish-dialog-cancel]") ||
      target.closest("[data-menu-image-mode-dish-dialog-backdrop]")
    ) {
      closeDishPickDialog(panel);
      return;
    }

    if (target.closest("[data-menu-image-mode-dish-dialog-save]")) {
      saveDishPickDialog(panel);
    }
  });
}

export function bindGuestMenuImageModeUi(root: ParentNode = document): void {
  ensureGuestMenuImageModeToggleMigrated();
  migrateLegacyGlobalToLines();

  root.querySelectorAll<HTMLElement>(`[data-menu-image-mode-panel="${GUEST_MENU_IMAGE_MODE_SEQ}"]`).forEach((panel) => {
    bindMenuImageModePanel(panel);
    const editor = panel.querySelector<HTMLElement>(`[data-menu-image-mode-editor]`);
    if (editor) syncAllConditionalPanelsInEditor(editor);
  });
}
