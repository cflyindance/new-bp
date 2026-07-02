/**
 * 外卖/来取 · 平台订单与小票（257 平台备注开关；267 外送小票份数）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";

export const DELIVERY_PLATFORM_PRINT_REMARKS_SEQ = 257;
export const DELIVERY_RECEIPT_COPIES_SEQ = 267;

export const DELIVERY_PLATFORM_SLIPS_TOGGLE_SEQS: readonly number[] = [
  DELIVERY_PLATFORM_PRINT_REMARKS_SEQ,
];

export const DELIVERY_RECEIPT_COPIES_FIELD_ID = "267-delivery-receipt-copies";

const COPIES_DEFAULT = 1;
const COPIES_MIN = 1;
const COPIES_MAX = 9;

const NUMBER_INPUT_CLASS =
  "h-9 w-24 rounded-md border border-input bg-background px-3 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isDeliveryPlatformPrintRemarksSeq(seq: number): boolean {
  return seq === DELIVERY_PLATFORM_PRINT_REMARKS_SEQ;
}

export function isDeliveryPlatformSlipsToggleSeq(seq: number): boolean {
  return (DELIVERY_PLATFORM_SLIPS_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function isDeliveryReceiptCopiesSeq(seq: number): boolean {
  return seq === DELIVERY_RECEIPT_COPIES_SEQ;
}

export function readDeliveryReceiptCopies(): number {
  const stored = readModuleSettingNumber(DELIVERY_RECEIPT_COPIES_FIELD_ID, COPIES_DEFAULT);
  if (!Number.isFinite(stored)) return COPIES_DEFAULT;
  return Math.min(COPIES_MAX, Math.max(COPIES_MIN, Math.round(stored)));
}

export function renderDeliveryReceiptCopiesControl(): string {
  const value = readDeliveryReceiptCopies();
  return `
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          value="${escapeHtml(String(value))}"
          min="${COPIES_MIN}"
          max="${COPIES_MAX}"
          step="1"
          data-module-setting-number="${escapeHtml(DELIVERY_RECEIPT_COPIES_FIELD_ID)}"
          aria-label="外送小票打印份数"
        />
        <span class="text-sm text-muted-foreground">份</span>
      </div>
      <span class="text-xs text-muted-foreground">${COPIES_MIN}–${COPIES_MAX} 份</span>
    </div>`;
}
