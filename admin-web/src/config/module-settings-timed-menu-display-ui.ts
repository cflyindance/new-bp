/**
 * 前厅 · POS 菜单与界面：seq 348 按照时段显示菜单。
 * 无独立开关；每条产线未选择任何订单类型即表示该产线不启用。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  bindProductLineOptionMatrix,
  normalizeProductLineOptionMatrix,
  renderProductLineOptionMatrixHtml,
  type ProductLineOptionMatrixConfig,
  type ProductLineOptionMatrixValue,
} from "./module-settings-product-line-option-matrix-ui";

export const TIMED_MENU_DISPLAY_SEQ = 348;

/** 已合并进 348，设置页中不再展示 */
export const TIMED_MENU_RETIRED_SEQS = [176, 177] as const;

export const TIMED_MENU_DISPLAY_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "kiosk", label: "Kiosk" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
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

type TimedMenuDisplayMatrix = ProductLineOptionMatrixValue<
  TimedMenuDisplayProductLineId,
  TimedMenuDisplayOrderTypeId
>;

const MATRIX_CONFIG: ProductLineOptionMatrixConfig<
  TimedMenuDisplayProductLineId,
  TimedMenuDisplayOrderTypeId
> = {
  id: "timed-menu-display",
  lines: TIMED_MENU_DISPLAY_PRODUCT_LINES,
  options: TIMED_MENU_DISPLAY_ORDER_TYPES,
  optionColumnLabel: "按时段显示菜单的订单类型（多选）",
};

const ALL_LINE_IDS = TIMED_MENU_DISPLAY_PRODUCT_LINES.map((line) => line.id);
const ORDER_TYPES_BY_LINE_STORAGE_ID = `${TIMED_MENU_DISPLAY_SEQ}-timed-menu-order-types-by-line`;

function normalizeOrderTypesByLine(raw: unknown): TimedMenuDisplayMatrix {
  return normalizeProductLineOptionMatrix(
    raw,
    TIMED_MENU_DISPLAY_PRODUCT_LINES,
    TIMED_MENU_DISPLAY_ORDER_TYPES,
  );
}

export function readTimedMenuDisplayActiveLines(): TimedMenuDisplayProductLineId[] {
  const byLine = readTimedMenuDisplayOrderTypesByLine();
  return ALL_LINE_IDS.filter((id) => byLine[id].length > 0);
}

export function readTimedMenuDisplayOrderTypesByLine(): TimedMenuDisplayMatrix {
  const stored = readModuleSettingJson<unknown>(ORDER_TYPES_BY_LINE_STORAGE_ID, null);
  return normalizeOrderTypesByLine(stored);
}

export function writeTimedMenuDisplayOrderTypesByLine(values: TimedMenuDisplayMatrix): void {
  writeModuleSettingJson(ORDER_TYPES_BY_LINE_STORAGE_ID, normalizeOrderTypesByLine(values));
}

export function isTimedMenuDisplaySeq(seq: number): boolean {
  return seq === TIMED_MENU_DISPLAY_SEQ;
}

export function isTimedMenuRetiredSeq(seq: number): boolean {
  return (TIMED_MENU_RETIRED_SEQS as readonly number[]).includes(seq);
}

export function renderTimedMenuDisplayPanelHtml(): string {
  return `
    <div class="mt-3 max-w-2xl" data-timed-menu-display-panel>
      ${renderProductLineOptionMatrixHtml(
        MATRIX_CONFIG,
        readTimedMenuDisplayOrderTypesByLine(),
      )}
    </div>`;
}

export function bindTimedMenuDisplayUi(root: ParentNode = document): void {
  bindProductLineOptionMatrix(MATRIX_CONFIG, writeTimedMenuDisplayOrderTypesByLine, root);
}
