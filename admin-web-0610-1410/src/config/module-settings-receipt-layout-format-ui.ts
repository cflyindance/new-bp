/**
 * 打印中心 · 订单收据 · 票面版式（282 菜间距、280 加收文案输入；其余为开关）。
 */

import { readModuleSettingNumber, readModuleSettingText } from "./module-settings-form-ui";

export const RECEIPT_DISH_SPACING_SEQ = 282;
export const RECEIPT_SHOW_DIVIDER_SEQ = 286;
export const RECEIPT_PRINT_ORDER_BARCODE_SEQ = 277;
export const RECEIPT_PRINT_AUTO_SURCHARGE_HINT_SEQ = 279;
export const RECEIPT_AUTO_SURCHARGE_HINT_TEXT_SEQ = 280;
export const REPRINT_RECEIPT_SHOW_DATE_SEQ = 264;
export const RECEIPT_TAX_DISCOUNT_SURCHARGE_POSITION_SEQ = 290;

export const RECEIPT_DISH_SPACING_FIELD_ID = "282-receipt-dish-spacing";
export const RECEIPT_AUTO_SURCHARGE_HINT_TEXT_FIELD_ID = "280-receipt-auto-surcharge-hint";

const DISH_SPACING_DEFAULT = 0;
const DISH_SPACING_MIN = 0;
const DISH_SPACING_MAX = 9;

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TEXT_INPUT_CLASS =
  "h-9 w-full min-w-[12rem] max-w-md rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** 组内顺序与 settings-intra-group-sort 一致 */
export const RECEIPT_LAYOUT_FORMAT_TOGGLE_SEQS: readonly number[] = [
  RECEIPT_SHOW_DIVIDER_SEQ,
  RECEIPT_PRINT_ORDER_BARCODE_SEQ,
  RECEIPT_PRINT_AUTO_SURCHARGE_HINT_SEQ,
  REPRINT_RECEIPT_SHOW_DATE_SEQ,
  RECEIPT_TAX_DISCOUNT_SURCHARGE_POSITION_SEQ,
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isReceiptDishSpacingSeq(seq: number): boolean {
  return seq === RECEIPT_DISH_SPACING_SEQ;
}

export function isReceiptAutoSurchargeHintTextSeq(seq: number): boolean {
  return seq === RECEIPT_AUTO_SURCHARGE_HINT_TEXT_SEQ;
}

export function isReceiptLayoutFormatToggleSeq(seq: number): boolean {
  return (RECEIPT_LAYOUT_FORMAT_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function readReceiptDishSpacing(): number {
  const stored = readModuleSettingNumber(RECEIPT_DISH_SPACING_FIELD_ID, DISH_SPACING_DEFAULT);
  if (!Number.isFinite(stored)) return DISH_SPACING_DEFAULT;
  return Math.min(DISH_SPACING_MAX, Math.max(DISH_SPACING_MIN, Math.round(stored)));
}

export function renderReceiptDishSpacingControl(): string {
  const value = readReceiptDishSpacing();
  return `
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          value="${escapeHtml(String(value))}"
          min="${DISH_SPACING_MIN}"
          max="${DISH_SPACING_MAX}"
          step="1"
          data-module-setting-number="${escapeHtml(RECEIPT_DISH_SPACING_FIELD_ID)}"
          aria-label="收据菜品行间距"
        />
        <span class="text-sm text-muted-foreground">空行</span>
      </div>
      <span class="text-xs text-muted-foreground">${DISH_SPACING_MIN}–${DISH_SPACING_MAX}，0 为默认间距</span>
    </div>`;
}

export function readReceiptAutoSurchargeHintText(): string {
  return readModuleSettingText(RECEIPT_AUTO_SURCHARGE_HINT_TEXT_FIELD_ID, "");
}

export function renderReceiptAutoSurchargeHintTextControl(): string {
  const value = readReceiptAutoSurchargeHintText();
  return `
    <input
      type="text"
      class="${TEXT_INPUT_CLASS}"
      value="${escapeHtml(value)}"
      placeholder="请输入自动加收提示文案"
      data-module-setting-text="${escapeHtml(RECEIPT_AUTO_SURCHARGE_HINT_TEXT_FIELD_ID)}"
      autocomplete="off"
      aria-label="收据自动加收提示默认文案"
    />`;
}
