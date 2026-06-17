/**
 * 前厅 · 开单流程：seq 111 每单最多客人数量（人数输入）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";

export const MAX_GUESTS_PER_ORDER_SEQ = 111;

export const MAX_GUESTS_PER_ORDER_FIELD_ID = "111-max-guests-per-order";

const GUESTS_DEFAULT = 20;
const GUESTS_MIN = 1;
const GUESTS_MAX = 99;

const NUMBER_INPUT_CLASS =
  "h-9 w-24 rounded-md border border-input bg-background px-3 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isMaxGuestsPerOrderSeq(seq: number): boolean {
  return seq === MAX_GUESTS_PER_ORDER_SEQ;
}

export function readMaxGuestsPerOrder(): number {
  const stored = readModuleSettingNumber(MAX_GUESTS_PER_ORDER_FIELD_ID, GUESTS_DEFAULT);
  if (!Number.isFinite(stored)) return GUESTS_DEFAULT;
  return Math.min(GUESTS_MAX, Math.max(GUESTS_MIN, Math.round(stored)));
}

export function renderMaxGuestsPerOrderControl(): string {
  const value = readMaxGuestsPerOrder();
  return `
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          value="${escapeHtml(String(value))}"
          min="${GUESTS_MIN}"
          max="${GUESTS_MAX}"
          step="1"
          data-module-setting-number="${escapeHtml(MAX_GUESTS_PER_ORDER_FIELD_ID)}"
          aria-label="每单最多客人数量"
        />
        <span class="text-sm text-muted-foreground">人</span>
      </div>
      <span class="text-xs text-muted-foreground">${GUESTS_MIN}–${GUESTS_MAX} 人</span>
    </div>`;
}
