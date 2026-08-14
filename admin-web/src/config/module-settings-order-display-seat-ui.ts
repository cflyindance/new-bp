/**
 * 前厅 · 点单页展示：seq 132 点单显示座位（主开关 + 按产线配置订单类型，无需先选产线）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  bindProductLineOptionMatrix,
  createEmptyProductLineOptionMatrix,
  normalizeProductLineOptionMatrix,
  renderProductLineOptionMatrixHtml,
  setProductLineOptionMatrixEnabled,
  type ProductLineOptionMatrixConfig,
  type ProductLineOptionMatrixValue,
} from "./module-settings-product-line-option-matrix-ui";
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

type OrderDisplaySeatMatrix = ProductLineOptionMatrixValue<
  OrderDisplaySeatProductLineId,
  OrderDisplaySeatOrderTypeId
>;

const MATRIX_CONFIG: ProductLineOptionMatrixConfig<
  OrderDisplaySeatProductLineId,
  OrderDisplaySeatOrderTypeId
> = {
  id: "order-display-seat",
  lines: ORDER_DISPLAY_SEAT_PRODUCT_LINES,
  options: ORDER_DISPLAY_SEAT_ORDER_TYPES,
  optionColumnLabel: "显示座位的订单类型（多选）",
};

const ALL_LINE_IDS = ORDER_DISPLAY_SEAT_PRODUCT_LINES.map((line) => line.id);
const ALL_ORDER_TYPE_IDS = ORDER_DISPLAY_SEAT_ORDER_TYPES.map((type) => type.id);
const ORDER_TYPES_BY_LINE_STORAGE_ID = `${ORDER_DISPLAY_SEAT_SEQ}-order-display-seat-order-types-by-line`;

/** @deprecated 仅用于读取旧版「先选产线」数据并合并到 orderTypesByLine */
const LEGACY_LINES_STORAGE_ID = `${ORDER_DISPLAY_SEAT_SEQ}-order-display-seat-lines`;

let toggleMigrated = false;

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

function emptyOrderTypesByLine(): OrderDisplaySeatMatrix {
  return createEmptyProductLineOptionMatrix<
    OrderDisplaySeatProductLineId,
    OrderDisplaySeatOrderTypeId
  >(ORDER_DISPLAY_SEAT_PRODUCT_LINES);
}

function normalizeOrderTypesByLine(raw: unknown): OrderDisplaySeatMatrix {
  return normalizeProductLineOptionMatrix(
    raw,
    ORDER_DISPLAY_SEAT_PRODUCT_LINES,
    ORDER_DISPLAY_SEAT_ORDER_TYPES,
  );
}

function readLegacyLineIds(): OrderDisplaySeatProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LEGACY_LINES_STORAGE_ID, null);
  if (!Array.isArray(stored)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return stored.filter(
    (id): id is OrderDisplaySeatProductLineId => typeof id === "string" && valid.has(id),
  );
}

/** 已配置显示座位的产线（该产线下至少勾选一种订单类型） */
export function readOrderDisplaySeatActiveLines(): OrderDisplaySeatProductLineId[] {
  const byLine = readOrderDisplaySeatOrderTypesByLine();
  return ALL_LINE_IDS.filter((id) => byLine[id].length > 0);
}

export function readOrderDisplaySeatOrderTypesByLine(): OrderDisplaySeatMatrix {
  ensureOrderDisplaySeatToggleMigrated();
  const stored = readModuleSettingJson<unknown>(ORDER_TYPES_BY_LINE_STORAGE_ID, null);
  const normalized = normalizeOrderTypesByLine(stored);
  const hasAny = ALL_LINE_IDS.some((id) => normalized[id].length > 0);
  if (hasAny) return normalized;

  const legacyLines = readLegacyLineIds();
  if (legacyLines.length > 0) {
    const fromLegacy = emptyOrderTypesByLine();
    const allTypes = [...ALL_ORDER_TYPE_IDS];
    for (const lineId of legacyLines) fromLegacy[lineId] = [...allTypes];
    writeOrderDisplaySeatOrderTypesByLine(fromLegacy);
    return fromLegacy;
  }

  if (readLegacyToggleOn()) {
    const full = emptyOrderTypesByLine();
    const allTypes = [...ALL_ORDER_TYPE_IDS];
    for (const lineId of ALL_LINE_IDS) full[lineId] = [...allTypes];
    writeOrderDisplaySeatOrderTypesByLine(full);
    return full;
  }
  return normalized;
}

export function writeOrderDisplaySeatOrderTypesByLine(values: OrderDisplaySeatMatrix): void {
  writeModuleSettingJson(ORDER_TYPES_BY_LINE_STORAGE_ID, normalizeOrderTypesByLine(values));
}

export function isOrderDisplaySeatSeq(seq: number): boolean {
  return seq === ORDER_DISPLAY_SEAT_SEQ;
}

export function renderOrderDisplaySeatPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl ${hidden}"
      data-order-display-seat-panel
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderProductLineOptionMatrixHtml(
        MATRIX_CONFIG,
        readOrderDisplaySeatOrderTypesByLine(),
        on,
      )}
    </div>`;
}

export function setOrderDisplaySeatPanelVisible(visible: boolean): void {
  document.querySelectorAll<HTMLElement>("[data-order-display-seat-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    setProductLineOptionMatrixEnabled(MATRIX_CONFIG.id, visible, panel);
  });
}

export function bindOrderDisplaySeatUi(root: ParentNode = document): void {
  ensureOrderDisplaySeatToggleMigrated();
  bindProductLineOptionMatrix(MATRIX_CONFIG, writeOrderDisplaySeatOrderTypesByLine, root);
}
