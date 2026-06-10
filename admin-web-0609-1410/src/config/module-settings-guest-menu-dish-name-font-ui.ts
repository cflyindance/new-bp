/**
 * 前厅 · 食客端·首页与版式：seq 645 菜品名称字体大小
 * （主开关 → 先选产线 Kiosk/eMenu/SDI → 再按产线配置字号 px，默认 16）。
 */

import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";
import { isFohLineConfigRowVisible } from "./foh-settings-by-line-filter";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_DISH_NAME_FONT_SEQ = 645;

const LINES_STORAGE_ID = "645-dish-name-font-lines";
const LEGACY_FONT_FIELD_ID = "645-dish-name-font-px";

const FONT_MIN = 8;
const FONT_MAX = 72;
const FONT_DEFAULT = 16;

export const GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestMenuDishNameFontProductLineId =
  (typeof GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuDishNameFontProductLineId[] =
  GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES.map((l) => l.id);

const LINE_CHECKBOX_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 rounded-sm";

const NUMBER_INPUT_CLASS =
  "h-9 w-16 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;
let legacyMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fontPxFieldId(lineId: GuestMenuDishNameFontProductLineId): string {
  return `645-${lineId}-dish-name-font-px`;
}

function clampFontPx(n: number): number {
  if (!Number.isFinite(n)) return FONT_DEFAULT;
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)));
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_DISH_NAME_FONT_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestMenuDishNameFontToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_DISH_NAME_FONT_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_MENU_DISH_NAME_FONT_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function migrateLegacyGlobalToLines(): void {
  if (legacyMigrated) return;
  legacyMigrated = true;

  const hasPerLine = ALL_LINE_IDS.some((lineId) => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(fontPxFieldId(lineId))) !== null;
    } catch {
      return false;
    }
  });
  if (hasPerLine) return;

  const legacyPx = clampFontPx(readModuleSettingNumber(LEGACY_FONT_FIELD_ID, FONT_DEFAULT));
  for (const lineId of ALL_LINE_IDS) {
    writeModuleSettingNumber(fontPxFieldId(lineId), legacyPx);
  }
}

function normalizeLineIds(raw: unknown): GuestMenuDishNameFontProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuDishNameFontProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readGuestMenuDishNameFontLines(): GuestMenuDishNameFontProductLineId[] {
  ensureGuestMenuDishNameFontToggleMigrated();
  migrateLegacyGlobalToLines();

  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestMenuDishNameFontLines(all);
    return all;
  }
  return [];
}

export function writeGuestMenuDishNameFontLines(lines: GuestMenuDishNameFontProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function readGuestMenuDishNameFontPxForLine(
  lineId: GuestMenuDishNameFontProductLineId,
): number {
  migrateLegacyGlobalToLines();
  return clampFontPx(readModuleSettingNumber(fontPxFieldId(lineId), FONT_DEFAULT));
}

export function ensureGuestMenuDishNameFontLinesDefault(): void {
  if (readGuestMenuDishNameFontLines().length === 0) {
    writeGuestMenuDishNameFontLines([...ALL_LINE_IDS]);
  }
}

export function isGuestMenuDishNameFontSeq(seq: number): boolean {
  return seq === GUEST_MENU_DISH_NAME_FONT_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestMenuDishNameFontLines());
  const cells = GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES.map((line, index) => {
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
          data-dish-name-font-line="${escapeHtml(line.id)}"
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
      data-dish-name-font-lines="${GUEST_MENU_DISH_NAME_FONT_SEQ}"
      role="group"
      aria-label="菜品名称字体大小适用产线"
    >
      ${cells}
    </div>`;
}

function renderLineConfigBlock(
  line: (typeof GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES)[number],
  lineEnabled: boolean,
  panelEnabled: boolean,
): string {
  const enabled = panelEnabled && lineEnabled;
  const hidden = lineEnabled ? "" : "hidden";
  const px = readGuestMenuDishNameFontPxForLine(line.id);
  const fieldId = fontPxFieldId(line.id);

  return `
    <div
      class="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5 ${hidden}"
      data-dish-name-font-line-config="${escapeHtml(line.id)}"
      ${lineEnabled ? "" : 'aria-hidden="true"'}
    >
      <span class="min-w-[4.5rem] text-sm font-medium text-foreground">${escapeHtml(line.label)}</span>
      <input
        type="number"
        class="${NUMBER_INPUT_CLASS}"
        value="${px}"
        min="${FONT_MIN}"
        max="${FONT_MAX}"
        step="1"
        ${enabled ? "" : "disabled"}
        data-module-setting-number="${escapeHtml(fieldId)}"
        aria-label="${escapeHtml(line.label)} 菜品名称字号"
      />
      <span class="text-sm text-muted-foreground">px</span>
    </div>`;
}

function renderLineConfigsHtml(panelEnabled: boolean): string {
  const selected = new Set(readGuestMenuDishNameFontLines());
  return GUEST_MENU_DISH_NAME_FONT_PRODUCT_LINES.map((line) =>
    renderLineConfigBlock(line, isFohLineConfigRowVisible(line.id, selected.has(line.id)), panelEnabled),
  ).join("");
}

function renderEditorInnerHtml(panelEnabled: boolean): string {
  return `
    <div class="space-y-4" data-dish-name-font-editor="${GUEST_MENU_DISH_NAME_FONT_SEQ}">
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
        ${renderLinesMultiselectHtml(panelEnabled)}
      </div>
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">按产线配置字号</p>
        <div class="space-y-2" data-dish-name-font-line-configs>
          ${renderLineConfigsHtml(panelEnabled)}
        </div>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        先勾选要生效的产线，再分别为各产线设置菜单中菜品名称的字号（${FONT_MIN}–${FONT_MAX}px，默认 ${FONT_DEFAULT}）。
      </p>
    </div>`;
}

export function renderGuestMenuDishNameFontPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl ${hidden}"
      data-dish-name-font-panel="${GUEST_MENU_DISH_NAME_FONT_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderEditorInnerHtml(on)}
    </div>`;
}

function syncLineConfigVisibility(editor: HTMLElement): void {
  const selected = new Set(readGuestMenuDishNameFontLines());
  editor.querySelectorAll<HTMLElement>("[data-dish-name-font-line-config]").forEach((block) => {
    const lineId = block.getAttribute("data-dish-name-font-line-config");
    const show =
      lineId &&
      isFohLineConfigRowVisible(lineId, selected.has(lineId as GuestMenuDishNameFontProductLineId));
    block.classList.toggle("hidden", !show);
    if (show) block.removeAttribute("aria-hidden");
    else block.setAttribute("aria-hidden", "true");

    block.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      const panel = editor.closest<HTMLElement>(`[data-dish-name-font-panel]`);
      const panelOn = panel && !panel.classList.contains("hidden");
      input.disabled = !(panelOn && show);
    });
  });
}

export function setGuestMenuDishNameFontPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-dish-name-font-panel="${GUEST_MENU_DISH_NAME_FONT_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("input").forEach((el) => {
        if (el.matches("[data-dish-name-font-line]")) {
          el.disabled = !visible;
        }
      });
      panel.querySelectorAll("label").forEach((label) => {
        if (!label.querySelector("[data-dish-name-font-line]")) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });

      const editor = panel.querySelector<HTMLElement>(`[data-dish-name-font-editor]`);
      if (editor && visible) syncLineConfigVisibility(editor);
    });
}

function collectLinesFromGroup(group: HTMLElement): GuestMenuDishNameFontProductLineId[] {
  const lines: GuestMenuDishNameFontProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-dish-name-font-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-dish-name-font-line");
    if (id && ALL_LINE_IDS.includes(id as GuestMenuDishNameFontProductLineId)) {
      lines.push(id as GuestMenuDishNameFontProductLineId);
    }
  });
  writeGuestMenuDishNameFontLines(lines);
  return lines;
}

function bindDishNameFontEditor(editor: HTMLElement): void {
  if (editor.dataset.dishNameFontEditorBound === "1") return;
  editor.dataset.dishNameFontEditorBound = "1";

  const linesGroup = editor.querySelector<HTMLElement>("[data-dish-name-font-lines]");
  if (linesGroup) {
    linesGroup.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-dish-name-font-line]")) return;
      collectLinesFromGroup(linesGroup);
      syncLineConfigVisibility(editor);
    });
  }
}

export function bindGuestMenuDishNameFontUi(root: ParentNode = document): void {
  ensureGuestMenuDishNameFontToggleMigrated();
  migrateLegacyGlobalToLines();

  root.querySelectorAll<HTMLElement>(`[data-dish-name-font-editor="${GUEST_MENU_DISH_NAME_FONT_SEQ}"]`).forEach((editor) => {
    bindDishNameFontEditor(editor);
    syncLineConfigVisibility(editor);
  });
}
