/**
 * 前厅 · 点单页展示：seq 132 点单显示座位（主开关 + 按产线配置订单类型，无需先选产线）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const ORDER_DISPLAY_SEAT_SEQ = 132;

export const ORDER_DISPLAY_SEAT_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type OrderDisplaySeatProductLineId =
  (typeof ORDER_DISPLAY_SEAT_PRODUCT_LINES)[number]["id"];

export const ORDER_DISPLAY_SEAT_ORDER_TYPES = [
  { id: "dine-in", label: "Dinein" },
  { id: "delivery", label: "Delivery" },
  { id: "pick-up", label: "Pick Up" },
  { id: "to-go", label: "ToGo" },
] as const;

export type OrderDisplaySeatOrderTypeId =
  (typeof ORDER_DISPLAY_SEAT_ORDER_TYPES)[number]["id"];

const ALL_LINE_IDS: OrderDisplaySeatProductLineId[] =
  ORDER_DISPLAY_SEAT_PRODUCT_LINES.map((l) => l.id);

const ALL_ORDER_TYPE_IDS: OrderDisplaySeatOrderTypeId[] =
  ORDER_DISPLAY_SEAT_ORDER_TYPES.map((t) => t.id);

const ORDER_TYPES_BY_LINE_STORAGE_ID = `${ORDER_DISPLAY_SEAT_SEQ}-order-display-seat-order-types-by-line`;

/** @deprecated 仅用于读取旧版「先选产线」数据并合并到 orderTypesByLine */
const LEGACY_LINES_STORAGE_ID = `${ORDER_DISPLAY_SEAT_SEQ}-order-display-seat-lines`;

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
    return localStorage.getItem(moduleSettingToggleStorageKey(ORDER_DISPLAY_SEAT_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureOrderDisplaySeatToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(ORDER_DISPLAY_SEAT_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(ORDER_DISPLAY_SEAT_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeOrderTypeIds(raw: unknown): OrderDisplaySeatOrderTypeId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_ORDER_TYPE_IDS);
  return raw.filter(
    (id): id is OrderDisplaySeatOrderTypeId =>
      typeof id === "string" && valid.has(id),
  );
}

function emptyOrderTypesByLine(): Record<OrderDisplaySeatProductLineId, OrderDisplaySeatOrderTypeId[]> {
  return {
    pos: [],
    "pos-go": [],
    paypad: [],
  };
}

function normalizeOrderTypesByLine(
  raw: unknown,
): Record<OrderDisplaySeatProductLineId, OrderDisplaySeatOrderTypeId[]> {
  const base = emptyOrderTypesByLine();
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Record<string, unknown>;
  for (const lineId of ALL_LINE_IDS) {
    base[lineId] = normalizeOrderTypeIds(record[lineId]);
  }
  return base;
}

function readLegacyLineIds(): OrderDisplaySeatProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LEGACY_LINES_STORAGE_ID, null);
  if (!Array.isArray(stored)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return stored.filter(
    (id): id is OrderDisplaySeatProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

/** 已配置显示座位的产线（该产线下至少勾选一种订单类型） */
export function readOrderDisplaySeatActiveLines(): OrderDisplaySeatProductLineId[] {
  const byLine = readOrderDisplaySeatOrderTypesByLine();
  return ALL_LINE_IDS.filter((id) => byLine[id].length > 0);
}

export function readOrderDisplaySeatOrderTypesByLine(): Record<
  OrderDisplaySeatProductLineId,
  OrderDisplaySeatOrderTypeId[]
> {
  ensureOrderDisplaySeatToggleMigrated();
  const stored = readModuleSettingJson<unknown>(ORDER_TYPES_BY_LINE_STORAGE_ID, null);
  const normalized = normalizeOrderTypesByLine(stored);
  const hasAny = ALL_LINE_IDS.some((id) => normalized[id].length > 0);
  if (hasAny) return normalized;

  const legacyLines = readLegacyLineIds();
  if (legacyLines.length > 0) {
    const fromLegacy = emptyOrderTypesByLine();
    const allTypes = [...ALL_ORDER_TYPE_IDS];
    for (const lineId of legacyLines) {
      fromLegacy[lineId] = [...allTypes];
    }
    writeOrderDisplaySeatOrderTypesByLine(fromLegacy);
    return fromLegacy;
  }

  if (readLegacyToggleOn()) {
    const full = emptyOrderTypesByLine();
    const allTypes = [...ALL_ORDER_TYPE_IDS];
    for (const lineId of ALL_LINE_IDS) {
      full[lineId] = [...allTypes];
    }
    writeOrderDisplaySeatOrderTypesByLine(full);
    return full;
  }
  return normalized;
}

export function writeOrderDisplaySeatOrderTypesByLine(
  values: Record<OrderDisplaySeatProductLineId, OrderDisplaySeatOrderTypeId[]>,
): void {
  const payload: Record<OrderDisplaySeatProductLineId, OrderDisplaySeatOrderTypeId[]> =
    emptyOrderTypesByLine();
  for (const lineId of ALL_LINE_IDS) {
    payload[lineId] = ALL_ORDER_TYPE_IDS.filter((id) => values[lineId]?.includes(id));
  }
  writeModuleSettingJson(ORDER_TYPES_BY_LINE_STORAGE_ID, payload);
}

export function isOrderDisplaySeatSeq(seq: number): boolean {
  return seq === ORDER_DISPLAY_SEAT_SEQ;
}

function renderOrderTypeCheckboxesForLine(
  lineId: OrderDisplaySeatProductLineId,
  lineLabel: string,
  panelEnabled: boolean,
): string {
  const selected = new Set(readOrderDisplaySeatOrderTypesByLine()[lineId]);
  const inputs = ORDER_DISPLAY_SEAT_ORDER_TYPES.map((type) => {
    const checked = selected.has(type.id);
    return `
      <label class="inline-flex items-center gap-1.5 text-sm text-foreground ${panelEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(type.id)}"
          data-order-display-seat-order-type-line="${escapeHtml(lineId)}"
          data-order-display-seat-order-type="${escapeHtml(type.id)}"
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
  const rows = ORDER_DISPLAY_SEAT_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderOrderTypeCheckboxesForLine(line.id, line.label, panelEnabled)}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-order-display-seat-order-types-editor class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">显示座位的订单类型（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function renderOrderDisplaySeatPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl ${hidden}"
      data-order-display-seat-panel
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs leading-relaxed text-muted-foreground">
        为各产线分别选择需显示座位的订单类型（Dinein、Delivery、Pick Up、ToGo）；未勾选任何类型的产线不生效。
      </p>
      ${renderOrderTypesByLineTableHtml(on)}
    </div>`;
}

export function setOrderDisplaySeatPanelVisible(visible: boolean): void {
  document.querySelectorAll<HTMLElement>("[data-order-display-seat-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel
      .querySelectorAll<HTMLInputElement>("[data-order-display-seat-order-type]")
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
): Record<OrderDisplaySeatProductLineId, OrderDisplaySeatOrderTypeId[]> {
  const values = emptyOrderTypesByLine();

  for (const lineId of ALL_LINE_IDS) {
    const checked = new Set<OrderDisplaySeatOrderTypeId>();
    editor
      .querySelectorAll<HTMLInputElement>(
        `[data-order-display-seat-order-type-line="${lineId}"][data-order-display-seat-order-type]:checked`,
      )
      .forEach((input) => {
        const typeId = input.getAttribute(
          "data-order-display-seat-order-type",
        ) as OrderDisplaySeatOrderTypeId | null;
        if (typeId && ALL_ORDER_TYPE_IDS.includes(typeId)) {
          checked.add(typeId);
        }
      });
    values[lineId] = ALL_ORDER_TYPE_IDS.filter((id) => checked.has(id));
  }

  writeOrderDisplaySeatOrderTypesByLine(values);
  return values;
}

export function bindOrderDisplaySeatUi(root: ParentNode = document): void {
  ensureOrderDisplaySeatToggleMigrated();

  root
    .querySelectorAll<HTMLElement>("[data-order-display-seat-order-types-editor]")
    .forEach((editor) => {
      if (editor.dataset.orderDisplaySeatOrderTypesBound === "1") return;
      editor.dataset.orderDisplaySeatOrderTypesBound = "1";
      editor.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-order-display-seat-order-type]")) return;
        collectOrderTypesByLineFromEditor(editor);
      });
    });
}
