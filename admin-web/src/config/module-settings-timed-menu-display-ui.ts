/**
 * 前厅 · 菜单查找与时段：seq 348 按照时段显示菜单
 * （主开关 + 按产线配置订单类型，结构对齐点单显示座位 132；合并原 176/177/348）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const TIMED_MENU_DISPLAY_SEQ = 348;

/** 已合并进 348，设置页不再展示 */
export const TIMED_MENU_RETIRED_SEQS = [176, 177] as const;

export const TIMED_MENU_DISPLAY_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type TimedMenuDisplayProductLineId =
  (typeof TIMED_MENU_DISPLAY_PRODUCT_LINES)[number]["id"];

export const TIMED_MENU_DISPLAY_ORDER_TYPES = [
  { id: "dine-in", label: "Dinein" },
  { id: "delivery", label: "Delivery" },
  { id: "pick-up", label: "Pick Up" },
  { id: "to-go", label: "ToGo" },
] as const;

export type TimedMenuDisplayOrderTypeId =
  (typeof TIMED_MENU_DISPLAY_ORDER_TYPES)[number]["id"];

const ALL_LINE_IDS: TimedMenuDisplayProductLineId[] =
  TIMED_MENU_DISPLAY_PRODUCT_LINES.map((l) => l.id);

const ALL_ORDER_TYPE_IDS: TimedMenuDisplayOrderTypeId[] =
  TIMED_MENU_DISPLAY_ORDER_TYPES.map((t) => t.id);

const ORDER_TYPES_BY_LINE_STORAGE_ID = `${TIMED_MENU_DISPLAY_SEQ}-timed-menu-order-types-by-line`;

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

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(TIMED_MENU_DISPLAY_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureTimedMenuDisplayToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(TIMED_MENU_DISPLAY_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(TIMED_MENU_DISPLAY_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeOrderTypeIds(raw: unknown): TimedMenuDisplayOrderTypeId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_ORDER_TYPE_IDS);
  return raw.filter(
    (id): id is TimedMenuDisplayOrderTypeId =>
      typeof id === "string" && valid.has(id),
  );
}

function emptyOrderTypesByLine(): Record<
  TimedMenuDisplayProductLineId,
  TimedMenuDisplayOrderTypeId[]
> {
  return {
    pos: [],
    "pos-go": [],
    paypad: [],
  };
}

function normalizeOrderTypesByLine(
  raw: unknown,
): Record<TimedMenuDisplayProductLineId, TimedMenuDisplayOrderTypeId[]> {
  const base = emptyOrderTypesByLine();
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Record<string, unknown>;
  for (const lineId of ALL_LINE_IDS) {
    base[lineId] = normalizeOrderTypeIds(record[lineId]);
  }
  return base;
}

export function readTimedMenuDisplayActiveLines(): TimedMenuDisplayProductLineId[] {
  const byLine = readTimedMenuDisplayOrderTypesByLine();
  return ALL_LINE_IDS.filter((id) => byLine[id].length > 0);
}

export function readTimedMenuDisplayOrderTypesByLine(): Record<
  TimedMenuDisplayProductLineId,
  TimedMenuDisplayOrderTypeId[]
> {
  ensureTimedMenuDisplayToggleMigrated();
  const stored = readModuleSettingJson<unknown>(ORDER_TYPES_BY_LINE_STORAGE_ID, null);
  return normalizeOrderTypesByLine(stored);
}

export function writeTimedMenuDisplayOrderTypesByLine(
  values: Record<TimedMenuDisplayProductLineId, TimedMenuDisplayOrderTypeId[]>,
): void {
  const payload: Record<TimedMenuDisplayProductLineId, TimedMenuDisplayOrderTypeId[]> =
    emptyOrderTypesByLine();
  for (const lineId of ALL_LINE_IDS) {
    payload[lineId] = ALL_ORDER_TYPE_IDS.filter((id) => values[lineId]?.includes(id));
  }
  writeModuleSettingJson(ORDER_TYPES_BY_LINE_STORAGE_ID, payload);
}

export function isTimedMenuDisplaySeq(seq: number): boolean {
  return seq === TIMED_MENU_DISPLAY_SEQ;
}

export function isTimedMenuRetiredSeq(seq: number): boolean {
  return (TIMED_MENU_RETIRED_SEQS as readonly number[]).includes(seq);
}

function renderOrderTypeCheckboxesForLine(
  lineId: TimedMenuDisplayProductLineId,
  lineLabel: string,
  panelEnabled: boolean,
): string {
  const selected = new Set(readTimedMenuDisplayOrderTypesByLine()[lineId]);
  const inputs = TIMED_MENU_DISPLAY_ORDER_TYPES.map((type) => {
    const checked = selected.has(type.id);
    return `
      <label class="inline-flex items-center gap-1.5 text-sm text-foreground ${panelEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(type.id)}"
          data-timed-menu-display-order-type-line="${escapeHtml(lineId)}"
          data-timed-menu-display-order-type="${escapeHtml(type.id)}"
          ${checked ? "checked" : ""}
          ${panelEnabled ? "" : "disabled"}
          aria-label="${escapeHtml(lineLabel)} ${escapeHtml(type.label)}"
        />
        <span>${escapeHtml(type.label)}</span>
      </label>`;
  }).join("");

  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>`;
}

function renderOrderTypesByLineTableHtml(panelEnabled: boolean): string {
  const rows = TIMED_MENU_DISPLAY_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderOrderTypeCheckboxesForLine(line.id, line.label, panelEnabled)}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-timed-menu-display-order-types-editor class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">按时段显示菜单的订单类型（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function renderTimedMenuDisplayPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl ${hidden}"
      data-timed-menu-display-panel
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderOrderTypesByLineTableHtml(on)}
    </div>`;
}

export function setTimedMenuDisplayPanelVisible(visible: boolean): void {
  document.querySelectorAll<HTMLElement>("[data-timed-menu-display-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel
      .querySelectorAll<HTMLInputElement>("[data-timed-menu-display-order-type]")
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

function collectOrderTypesByLineFromEditor(
  editor: HTMLElement,
): Record<TimedMenuDisplayProductLineId, TimedMenuDisplayOrderTypeId[]> {
  const values = emptyOrderTypesByLine();

  for (const lineId of ALL_LINE_IDS) {
    const checked = new Set<TimedMenuDisplayOrderTypeId>();
    editor
      .querySelectorAll<HTMLInputElement>(
        `[data-timed-menu-display-order-type-line="${lineId}"][data-timed-menu-display-order-type]:checked`,
      )
      .forEach((input) => {
        const typeId = input.getAttribute(
          "data-timed-menu-display-order-type",
        ) as TimedMenuDisplayOrderTypeId | null;
        if (typeId && ALL_ORDER_TYPE_IDS.includes(typeId)) {
          checked.add(typeId);
        }
      });
    values[lineId] = ALL_ORDER_TYPE_IDS.filter((id) => checked.has(id));
  }

  writeTimedMenuDisplayOrderTypesByLine(values);
  return values;
}

export function bindTimedMenuDisplayUi(root: ParentNode = document): void {
  ensureTimedMenuDisplayToggleMigrated();

  root
    .querySelectorAll<HTMLElement>("[data-timed-menu-display-order-types-editor]")
    .forEach((editor) => {
      if (editor.dataset.timedMenuDisplayOrderTypesBound === "1") return;
      editor.dataset.timedMenuDisplayOrderTypesBound = "1";
      editor.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-timed-menu-display-order-type]")) return;
        collectOrderTypesByLineFromEditor(editor);
      });
    });
}
