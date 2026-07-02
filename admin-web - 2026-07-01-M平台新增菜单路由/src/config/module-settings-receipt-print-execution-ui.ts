/**
 * 打印中心 · 收据打印执行（262 首打份数、273 重打仅新菜）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const FIRST_RECEIPT_COPIES_SEQ = 262;
export const RECEIPT_ONLY_NEW_ITEMS_SEQ = 273;

/** 273 重打仅印新菜 */
export const RECEIPT_PRINT_EXECUTION_TOGGLE_SEQS: readonly number[] = [RECEIPT_ONLY_NEW_ITEMS_SEQ];

const FIRST_RECEIPT_COPIES_FIELD_ID = "262-first-receipt-copies";
const COPIES_DEFAULT = 1;
const COPIES_MIN = 1;
const COPIES_MAX = 9;

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

export function isFirstReceiptCopiesSeq(seq: number): boolean {
  return seq === FIRST_RECEIPT_COPIES_SEQ;
}

export function isReceiptOnlyNewItemsSeq(seq: number): boolean {
  return seq === RECEIPT_ONLY_NEW_ITEMS_SEQ;
}

export function isReceiptPrintExecutionToggleSeq(seq: number): boolean {
  return (RECEIPT_PRINT_EXECUTION_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function readFirstReceiptCopies(): number {
  let stored = readModuleSettingNumber(FIRST_RECEIPT_COPIES_FIELD_ID, COPIES_DEFAULT);
  if (!Number.isFinite(stored) && readLegacyToggleOn(FIRST_RECEIPT_COPIES_SEQ)) {
    stored = 1;
  }
  if (!Number.isFinite(stored)) return COPIES_DEFAULT;
  return Math.min(COPIES_MAX, Math.max(COPIES_MIN, Math.round(stored)));
}

export function renderFirstReceiptCopiesControl(): string {
  const value = readFirstReceiptCopies();
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
          data-module-setting-number="${escapeHtml(FIRST_RECEIPT_COPIES_FIELD_ID)}"
          aria-label="第一份收据打印份数"
        />
        <span class="text-sm text-muted-foreground">份</span>
      </div>
      <span class="text-xs text-muted-foreground">${COPIES_MIN}–${COPIES_MAX} 份</span>
    </div>`;
}
