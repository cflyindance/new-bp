/**
 * 前厅 · 食客端·首页与版式：seq 607 菜单图片展示模式
 * （主开关 → 先选产线 Kiosk/eMenu/SDI → 再按产线配置原始/小图/大图及例外菜品）。
 */

import { readDishTags, writeDishTags } from "./module-settings-dish-rules-ui";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { readModuleSettingRadio, writeModuleSettingRadio } from "./module-settings-nested-ui";
import { renderStandaloneDishPickerHtml } from "./module-settings-dish-rules-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_IMAGE_MODE_SEQ = 607;

const LINES_STORAGE_ID = "607-menu-image-mode-lines";

const LEGACY_MODE_FIELD_ID = "607-image-mode";
const LEGACY_SMALL_DISHES_ID = "607-small-dishes";
const LEGACY_LARGE_DISHES_ID = "607-large-dishes";

export const GUEST_MENU_IMAGE_MODE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "kiosk", label: "Kiosk" },
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

const LINE_CHECKBOX_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 rounded-sm";

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
  const legacySmall = readDishTags(LEGACY_SMALL_DISHES_ID);
  const legacyLarge = readDishTags(LEGACY_LARGE_DISHES_ID);

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
    if (legacySmall.length > 0) writeDishTags(smallDishesFieldId(lineId), legacySmall);
    if (legacyLarge.length > 0) writeDishTags(largeDishesFieldId(lineId), legacyLarge);
  }
}

function normalizeLineIds(raw: unknown): GuestMenuImageModeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuImageModeProductLineId => typeof id === "string" && valid.has(id),
  );
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

export function writeGuestMenuImageModeLines(lines: GuestMenuImageModeProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function readGuestMenuImageModeForLine(lineId: GuestMenuImageModeProductLineId): GuestMenuImageMode {
  migrateLegacyGlobalToLines();
  const mode = readModuleSettingRadio(imageModeFieldId(lineId), DEFAULT_MODE);
  return isValidMode(mode) ? mode : DEFAULT_MODE;
}

export function isGuestMenuImageModeSeq(seq: number): boolean {
  return seq === GUEST_MENU_IMAGE_MODE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestMenuImageModeLines());
  const cells = GUEST_MENU_IMAGE_MODE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${LINE_CHECKBOX_CLASS}"
          value="${escapeHtml(line.id)}"
          data-menu-image-mode-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-menu-image-mode-lines="${GUEST_MENU_IMAGE_MODE_SEQ}"
      role="group"
      aria-label="菜单图片展示模式适用产线"
    >
      ${cells}
    </div>`;
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

  return `<div class="flex flex-wrap items-center gap-4">${options}</div>`;
}

function renderConditionalDishPicker(
  lineId: GuestMenuImageModeProductLineId,
  mode: GuestMenuImageMode,
  whenMode: GuestMenuImageMode,
  pickerLabel: string,
  storageId: string,
  fieldKey: string,
  enabled: boolean,
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
      <p class="m-0 text-xs text-muted-foreground">${escapeHtml(pickerLabel)}</p>
      ${renderStandaloneDishPickerHtml(GUEST_MENU_IMAGE_MODE_SEQ, fieldKey, storageId)}
    </div>`;
}

function renderLineConfigBlock(
  line: (typeof GUEST_MENU_IMAGE_MODE_PRODUCT_LINES)[number],
  lineEnabled: boolean,
  panelEnabled: boolean,
): string {
  const enabled = panelEnabled && lineEnabled;
  const hidden = lineEnabled ? "" : "hidden";
  const mode = readGuestMenuImageModeForLine(line.id);

  return `
    <div
      class="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3 ${hidden}"
      data-menu-image-mode-line-config="${escapeHtml(line.id)}"
      ${lineEnabled ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 text-sm font-medium text-foreground">${escapeHtml(line.label)}</p>
      ${renderModeRadiosHtml(line.id, enabled)}
      ${renderConditionalDishPicker(
        line.id,
        mode,
        "small",
        "请选择大图菜",
        smallDishesFieldId(line.id),
        `small-dishes-${line.id}`,
        enabled,
      )}
      ${renderConditionalDishPicker(
        line.id,
        mode,
        "large",
        "请选择小图菜",
        largeDishesFieldId(line.id),
        `large-dishes-${line.id}`,
        enabled,
      )}
    </div>`;
}

function renderLineConfigsHtml(panelEnabled: boolean): string {
  const selected = new Set(readGuestMenuImageModeLines());
  return GUEST_MENU_IMAGE_MODE_PRODUCT_LINES.map((line) =>
    renderLineConfigBlock(line, selected.has(line.id), panelEnabled),
  ).join("");
}

function renderEditorInnerHtml(panelEnabled: boolean): string {
  return `
    <div class="space-y-4" data-menu-image-mode-editor="${GUEST_MENU_IMAGE_MODE_SEQ}">
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
        ${renderLinesMultiselectHtml(panelEnabled)}
      </div>
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">按产线配置展示模式</p>
        <div class="space-y-3" data-menu-image-mode-line-configs>
          ${renderLineConfigsHtml(panelEnabled)}
        </div>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        先勾选要生效的产线，再分别为各产线选择默认图片展示方式；小图/大图模式下可指定例外菜品。
      </p>
    </div>`;
}

export function renderGuestMenuImageModePanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl ${hidden}"
      data-menu-image-mode-panel="${GUEST_MENU_IMAGE_MODE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderEditorInnerHtml(on)}
    </div>`;
}

function syncLineConfigVisibility(editor: HTMLElement): void {
  const selected = new Set(readGuestMenuImageModeLines());
  editor.querySelectorAll<HTMLElement>("[data-menu-image-mode-line-config]").forEach((block) => {
    const lineId = block.getAttribute("data-menu-image-mode-line-config");
    const show = lineId && selected.has(lineId as GuestMenuImageModeProductLineId);
    block.classList.toggle("hidden", !show);
    if (show) block.removeAttribute("aria-hidden");
    else block.setAttribute("aria-hidden", "true");
  });
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
}

function syncAllConditionalPanelsInEditor(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLElement>("[data-menu-image-mode-line-config]").forEach((block) => {
    const lineId = block.getAttribute("data-menu-image-mode-line-config");
    if (lineId && ALL_LINE_IDS.includes(lineId as GuestMenuImageModeProductLineId)) {
      syncConditionalPanelsForLine(lineId as GuestMenuImageModeProductLineId);
    }
  });
}

export function setGuestMenuImageModePanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-menu-image-mode-panel="${GUEST_MENU_IMAGE_MODE_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("input, select, button").forEach((el) => {
        el.disabled = !visible;
      });
      panel.querySelectorAll("label").forEach((label) => {
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });

      const editor = panel.querySelector<HTMLElement>(`[data-menu-image-mode-editor]`);
      if (editor && visible) {
        syncLineConfigVisibility(editor);
        syncAllConditionalPanelsInEditor(editor);
      }
    });
}

function collectLinesFromGroup(group: HTMLElement): GuestMenuImageModeProductLineId[] {
  const lines: GuestMenuImageModeProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-menu-image-mode-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-menu-image-mode-line");
    if (id && ALL_LINE_IDS.includes(id as GuestMenuImageModeProductLineId)) {
      lines.push(id as GuestMenuImageModeProductLineId);
    }
  });
  writeGuestMenuImageModeLines(lines);
  return lines;
}

function bindMenuImageModeEditor(editor: HTMLElement): void {
  if (editor.dataset.menuImageModeEditorBound === "1") return;
  editor.dataset.menuImageModeEditorBound = "1";

  const linesGroup = editor.querySelector<HTMLElement>("[data-menu-image-mode-lines]");
  if (linesGroup) {
    linesGroup.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-menu-image-mode-line]")) return;
      collectLinesFromGroup(linesGroup);
      syncLineConfigVisibility(editor);
    });
  }

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

export function bindGuestMenuImageModeUi(root: ParentNode = document): void {
  ensureGuestMenuImageModeToggleMigrated();
  migrateLegacyGlobalToLines();

  root.querySelectorAll<HTMLElement>(`[data-menu-image-mode-editor="${GUEST_MENU_IMAGE_MODE_SEQ}"]`).forEach((editor) => {
    bindMenuImageModeEditor(editor);
    syncLineConfigVisibility(editor);
    syncAllConditionalPanelsInEditor(editor);
  });
}
