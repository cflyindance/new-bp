/**
 * 前厅 · 备注与附加服务：seq 523 套餐子项备注（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const COMBO_SUBITEM_REMARK_SEQ = 523;

const LINES_STORAGE_ID = "523-combo-subitem-remark-lines";

export const COMBO_SUBITEM_REMARK_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type ComboSubitemRemarkProductLineId =
  (typeof COMBO_SUBITEM_REMARK_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: ComboSubitemRemarkProductLineId[] =
  COMBO_SUBITEM_REMARK_PRODUCT_LINES.map((l) => l.id);

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

export function ensureComboSubitemRemarkToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(COMBO_SUBITEM_REMARK_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(COMBO_SUBITEM_REMARK_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(COMBO_SUBITEM_REMARK_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): ComboSubitemRemarkProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is ComboSubitemRemarkProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readComboSubitemRemarkLines(): ComboSubitemRemarkProductLineId[] {
  ensureComboSubitemRemarkToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(COMBO_SUBITEM_REMARK_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeComboSubitemRemarkLines(all);
    return all;
  }
  return [];
}

export function writeComboSubitemRemarkLines(lines: ComboSubitemRemarkProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isComboSubitemRemarkSeq(seq: number): boolean {
  return seq === COMBO_SUBITEM_REMARK_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readComboSubitemRemarkLines());
  const cells = COMBO_SUBITEM_REMARK_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-combo-subitem-remark-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-combo-subitem-remark-lines="${COMBO_SUBITEM_REMARK_SEQ}"
      role="group"
      aria-label="套餐子项备注适用产线"
    >
      ${cells}
    </div>`;
}

export function renderComboSubitemRemarkPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-combo-subitem-remark-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setComboSubitemRemarkPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-combo-subitem-remark-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-combo-subitem-remark-line]")
        .forEach((input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !visible);
          label.classList.toggle("opacity-50", !visible);
          label.classList.toggle("cursor-pointer", visible);
        });
    });
}

function collectLinesFromGroup(group: HTMLElement): ComboSubitemRemarkProductLineId[] {
  const lines: ComboSubitemRemarkProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-combo-subitem-remark-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-combo-subitem-remark-line");
      if (id && ALL_LINE_IDS.includes(id as ComboSubitemRemarkProductLineId)) {
        lines.push(id as ComboSubitemRemarkProductLineId);
      }
    });
  writeComboSubitemRemarkLines(lines);
  return lines;
}

export function bindComboSubitemRemarkLinesUi(root: ParentNode = document): void {
  ensureComboSubitemRemarkToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-combo-subitem-remark-lines]").forEach((group) => {
    if (group.dataset.comboSubitemRemarkLinesBound === "1") return;
    group.dataset.comboSubitemRemarkLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-combo-subitem-remark-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
