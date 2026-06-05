/**
 * 前厅 · 桌台与餐位：seq 534 自动清桌（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const AUTO_CLEAR_TABLE_SEQ = 534;

const LINES_STORAGE_ID = "534-auto-clear-table-lines";

export const AUTO_CLEAR_TABLE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "kiosk", label: "Kiosk" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type AutoClearTableProductLineId = (typeof AUTO_CLEAR_TABLE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: AutoClearTableProductLineId[] = AUTO_CLEAR_TABLE_PRODUCT_LINES.map((l) => l.id);

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

export function ensureAutoClearTableToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(AUTO_CLEAR_TABLE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(AUTO_CLEAR_TABLE_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(AUTO_CLEAR_TABLE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

export function readAutoClearTableMasterOn(): boolean {
  ensureAutoClearTableToggleMigrated();
  return readLegacyToggleOn(AUTO_CLEAR_TABLE_SEQ);
}

function normalizeLineIds(raw: unknown): AutoClearTableProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is AutoClearTableProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readAutoClearTableLines(): AutoClearTableProductLineId[] {
  ensureAutoClearTableToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readAutoClearTableMasterOn()) {
    const all = [...ALL_LINE_IDS];
    writeAutoClearTableLines(all);
    return all;
  }
  return [];
}

export function writeAutoClearTableLines(lines: AutoClearTableProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isAutoClearTableSeq(seq: number): boolean {
  return seq === AUTO_CLEAR_TABLE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readAutoClearTableLines());
  const cells = AUTO_CLEAR_TABLE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-auto-clear-table-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-3xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-auto-clear-table-lines="${AUTO_CLEAR_TABLE_SEQ}"
      role="group"
      aria-label="自动清桌适用产线"
    >
      ${cells}
    </div>`;
}

export function renderAutoClearTablePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-auto-clear-table-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setAutoClearTablePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-auto-clear-table-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-auto-clear-table-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): AutoClearTableProductLineId[] {
  const lines: AutoClearTableProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-auto-clear-table-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-auto-clear-table-line");
    if (id && ALL_LINE_IDS.includes(id as AutoClearTableProductLineId)) {
      lines.push(id as AutoClearTableProductLineId);
    }
  });
  writeAutoClearTableLines(lines);
  return lines;
}

export function bindAutoClearTableUi(root: ParentNode = document): void {
  ensureAutoClearTableToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-auto-clear-table-lines]").forEach((group) => {
    if (group.dataset.autoClearTableBound === "1") return;
    group.dataset.autoClearTableBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-auto-clear-table-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
