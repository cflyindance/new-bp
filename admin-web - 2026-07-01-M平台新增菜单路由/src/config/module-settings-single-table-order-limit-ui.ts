/**
 * 前厅 · 桌台与餐位：seq 592 不允许一桌多单（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const SINGLE_TABLE_NO_MULTI_ORDER_SEQ = 592;

const LINES_STORAGE_ID = "592-single-table-no-multi-order-lines";

export const SINGLE_TABLE_NO_MULTI_ORDER_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type SingleTableNoMultiOrderProductLineId =
  (typeof SINGLE_TABLE_NO_MULTI_ORDER_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: SingleTableNoMultiOrderProductLineId[] =
  SINGLE_TABLE_NO_MULTI_ORDER_PRODUCT_LINES.map((l) => l.id);

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

export function ensureSingleTableNoMultiOrderToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(SINGLE_TABLE_NO_MULTI_ORDER_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(SINGLE_TABLE_NO_MULTI_ORDER_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(SINGLE_TABLE_NO_MULTI_ORDER_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

export function readSingleTableNoMultiOrderMasterOn(): boolean {
  ensureSingleTableNoMultiOrderToggleMigrated();
  return readLegacyToggleOn(SINGLE_TABLE_NO_MULTI_ORDER_SEQ);
}

function normalizeLineIds(raw: unknown): SingleTableNoMultiOrderProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is SingleTableNoMultiOrderProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readSingleTableNoMultiOrderLines(): SingleTableNoMultiOrderProductLineId[] {
  ensureSingleTableNoMultiOrderToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readSingleTableNoMultiOrderMasterOn()) {
    const all = [...ALL_LINE_IDS];
    writeSingleTableNoMultiOrderLines(all);
    return all;
  }
  return [];
}

export function writeSingleTableNoMultiOrderLines(
  lines: SingleTableNoMultiOrderProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isSingleTableNoMultiOrderSeq(seq: number): boolean {
  return seq === SINGLE_TABLE_NO_MULTI_ORDER_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readSingleTableNoMultiOrderLines());
  const cells = SINGLE_TABLE_NO_MULTI_ORDER_PRODUCT_LINES.map((line, index) => {
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
          data-single-table-no-multi-order-line="${escapeHtml(line.id)}"
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
      data-single-table-no-multi-order-lines="${SINGLE_TABLE_NO_MULTI_ORDER_SEQ}"
      role="group"
      aria-label="不允许一桌多单适用产线"
    >
      ${cells}
    </div>`;
}

export function renderSingleTableNoMultiOrderPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-single-table-no-multi-order-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setSingleTableNoMultiOrderPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-single-table-no-multi-order-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-single-table-no-multi-order-line]")
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

function collectLinesFromGroup(group: HTMLElement): SingleTableNoMultiOrderProductLineId[] {
  const lines: SingleTableNoMultiOrderProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-single-table-no-multi-order-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-single-table-no-multi-order-line");
      if (id && ALL_LINE_IDS.includes(id as SingleTableNoMultiOrderProductLineId)) {
        lines.push(id as SingleTableNoMultiOrderProductLineId);
      }
    });
  writeSingleTableNoMultiOrderLines(lines);
  return lines;
}

export function bindSingleTableNoMultiOrderUi(root: ParentNode = document): void {
  ensureSingleTableNoMultiOrderToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-single-table-no-multi-order-lines]").forEach((group) => {
    if (group.dataset.singleTableNoMultiOrderBound === "1") return;
    group.dataset.singleTableNoMultiOrderBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-single-table-no-multi-order-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
