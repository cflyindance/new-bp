/**
 * 打印中心 · 打包单打印（34 份数输入；281 堂食标识、297 显示价格开关）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const PACKING_SLIP_COPIES_SEQ = 34;
export const PACKING_SLIP_DINE_IN_LABEL_SEQ = 281;
export const PACKING_SLIP_SHOW_PRICE_SEQ = 297;

export const PACKING_SLIP_COPIES_FIELD_ID = "34-packing-slip-copies";

export const PACKING_SLIP_PRINT_TOGGLE_SEQS: readonly number[] = [
  PACKING_SLIP_DINE_IN_LABEL_SEQ,
  PACKING_SLIP_SHOW_PRICE_SEQ,
];

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

export function isPackingSlipCopiesSeq(seq: number): boolean {
  return seq === PACKING_SLIP_COPIES_SEQ;
}

export function isPackingSlipPrintToggleSeq(seq: number): boolean {
  return (PACKING_SLIP_PRINT_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function readPackingSlipCopies(): number {
  let stored = readModuleSettingNumber(PACKING_SLIP_COPIES_FIELD_ID, COPIES_DEFAULT);
  if (!Number.isFinite(stored) && readLegacyToggleOn(PACKING_SLIP_COPIES_SEQ)) {
    stored = 1;
  }
  if (!Number.isFinite(stored)) return COPIES_DEFAULT;
  return Math.min(COPIES_MAX, Math.max(COPIES_MIN, Math.round(stored)));
}

export function renderPackingSlipCopiesControl(): string {
  const value = readPackingSlipCopies();
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
          data-module-setting-number="${escapeHtml(PACKING_SLIP_COPIES_FIELD_ID)}"
          aria-label="打包单打印份数"
        />
        <span class="text-sm text-muted-foreground">份</span>
      </div>
      <span class="text-xs text-muted-foreground">${COPIES_MIN}–${COPIES_MAX} 份</span>
    </div>`;
}
