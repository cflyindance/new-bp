/**
 * 前厅 · 桌台与餐位：seq 107 选桌页面（合并原 107 跳过选桌 + 533 选择桌子页面）。
 * 主开关：开启后在所选产线展示选桌页；关闭则跳过。按产线多选存储。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

/** 合并后 SSOT（展示选桌页） */
export const TABLE_SELECTION_PAGE_SEQ = 107;

/** 已并入 107，设置滑层不再单独展示 */
export const TABLE_SELECTION_PAGE_LEGACY_SKIP_SEQ = 533;

const LINES_STORAGE_ID = "107-table-selection-page-lines";

export const TABLE_SELECTION_PAGE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type TableSelectionPageProductLineId =
  (typeof TABLE_SELECTION_PAGE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: TableSelectionPageProductLineId[] =
  TABLE_SELECTION_PAGE_PRODUCT_LINES.map((l) => l.id);

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

function writeMasterToggleOn(on: boolean): void {
  try {
    localStorage.setItem(moduleSettingToggleStorageKey(TABLE_SELECTION_PAGE_SEQ), on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** 旧 533=展示、107=跳过；迁移为 107 ON=展示 */
export function ensureTableSelectionPageToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(TABLE_SELECTION_PAGE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  const showLegacy = readLegacyToggleOn(TABLE_SELECTION_PAGE_LEGACY_SKIP_SEQ);
  const skipLegacy = readLegacyToggleOn(TABLE_SELECTION_PAGE_SEQ);
  if (showLegacy) {
    writeMasterToggleOn(true);
    return;
  }
  if (skipLegacy) {
    writeMasterToggleOn(false);
  }
}

export function readTableSelectionPageMasterOn(): boolean {
  ensureTableSelectionPageToggleMigrated();
  return readLegacyToggleOn(TABLE_SELECTION_PAGE_SEQ);
}

function normalizeLineIds(raw: unknown): TableSelectionPageProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is TableSelectionPageProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readTableSelectionPageLines(): TableSelectionPageProductLineId[] {
  ensureTableSelectionPageToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readTableSelectionPageMasterOn()) {
    const all = [...ALL_LINE_IDS];
    writeTableSelectionPageLines(all);
    return all;
  }
  return [];
}

export function writeTableSelectionPageLines(lines: TableSelectionPageProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isTableSelectionPageSeq(seq: number): boolean {
  return seq === TABLE_SELECTION_PAGE_SEQ;
}

export function shouldSkipTableSelectionPageMergedSeq(seq: number): boolean {
  return seq === TABLE_SELECTION_PAGE_LEGACY_SKIP_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readTableSelectionPageLines());
  const cells = TABLE_SELECTION_PAGE_PRODUCT_LINES.map((line, index) => {
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
          data-table-selection-page-line="${escapeHtml(line.id)}"
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
      data-table-selection-page-lines="${TABLE_SELECTION_PAGE_SEQ}"
      role="group"
      aria-label="选桌页面适用产线"
    >
      ${cells}
    </div>`;
}

export function renderTableSelectionPagePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-table-selection-page-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setTableSelectionPagePanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-table-selection-page-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-table-selection-page-line]")
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

function collectLinesFromGroup(group: HTMLElement): TableSelectionPageProductLineId[] {
  const lines: TableSelectionPageProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-table-selection-page-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-table-selection-page-line");
      if (id && ALL_LINE_IDS.includes(id as TableSelectionPageProductLineId)) {
        lines.push(id as TableSelectionPageProductLineId);
      }
    });
  writeTableSelectionPageLines(lines);
  return lines;
}

export function bindTableSelectionPageUi(root: ParentNode = document): void {
  ensureTableSelectionPageToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-table-selection-page-lines]").forEach((group) => {
    if (group.dataset.tableSelectionPageBound === "1") return;
    group.dataset.tableSelectionPageBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-table-selection-page-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
