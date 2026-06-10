/**
 * 前厅 · 桌台与餐位：seq 642 展示清桌按钮（主开关 + eMenu 产线）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const CLEAR_TABLE_BUTTON_SEQ = 642;

const LINES_STORAGE_ID = "642-clear-table-button-lines";

export const CLEAR_TABLE_BUTTON_PRODUCT_LINES = [{ id: "emenu", label: "eMenu" }] as const;

export type ClearTableButtonProductLineId =
  (typeof CLEAR_TABLE_BUTTON_PRODUCT_LINES)[number]["id"];

const EMENU_LINE_ID: ClearTableButtonProductLineId = "emenu";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureClearTableButtonToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(CLEAR_TABLE_BUTTON_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(CLEAR_TABLE_BUTTON_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(CLEAR_TABLE_BUTTON_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): ClearTableButtonProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(EMENU_LINE_ID) ? [EMENU_LINE_ID] : [];
}

export function readClearTableButtonLines(): ClearTableButtonProductLineId[] {
  ensureClearTableButtonToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(CLEAR_TABLE_BUTTON_SEQ)) {
    writeClearTableButtonLines([EMENU_LINE_ID]);
    return [EMENU_LINE_ID];
  }
  return [];
}

export function writeClearTableButtonLines(lines: ClearTableButtonProductLineId[]): void {
  const enabled = lines.includes(EMENU_LINE_ID);
  writeModuleSettingJson(LINES_STORAGE_ID, enabled ? [EMENU_LINE_ID] : []);
}

export function ensureClearTableButtonLinesDefault(): void {
  if (readClearTableButtonLines().length === 0) {
    writeClearTableButtonLines([EMENU_LINE_ID]);
  }
}

export function syncClearTableButtonLinesWithMaster(on: boolean): void {
  writeClearTableButtonLines(on ? [EMENU_LINE_ID] : []);
}

export function isClearTableButtonSeq(seq: number): boolean {
  return seq === CLEAR_TABLE_BUTTON_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readClearTableButtonLines());
  const cells = CLEAR_TABLE_BUTTON_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-clear-table-button-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted/40"
      data-clear-table-button-lines="${CLEAR_TABLE_BUTTON_SEQ}"
      role="group"
      aria-label="清桌按钮适用产线"
    >
      ${cells}
    </div>`;
}

export function renderClearTableButtonPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-clear-table-button-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">目前仅 eMenu 产线支持展示清桌按钮。</p>
    </div>`;
}

export function setClearTableButtonPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-clear-table-button-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-clear-table-button-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): ClearTableButtonProductLineId[] {
  const lines: ClearTableButtonProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-clear-table-button-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-clear-table-button-line");
    if (id === EMENU_LINE_ID) {
      lines.push(EMENU_LINE_ID);
    }
  });
  writeClearTableButtonLines(lines);
  return lines;
}

export function bindClearTableButtonUi(root: ParentNode = document): void {
  ensureClearTableButtonToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-clear-table-button-lines]").forEach((group) => {
    if (group.dataset.clearTableButtonBound === "1") return;
    group.dataset.clearTableButtonBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-clear-table-button-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
