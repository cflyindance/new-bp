/**
 * 前厅 · POS 点单页工具栏：seq 110 点单超时提醒（分钟输入）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";

export const ORDER_TIMEOUT_REMINDER_SEQ = 110;

export const ORDER_TIMEOUT_REMINDER_FIELD_ID = "110-order-timeout-reminder-minutes";

const MINUTES_DEFAULT = 30;
const MINUTES_MIN = 1;
const MINUTES_MAX = 999;

const NUMBER_INPUT_CLASS =
  "h-9 w-24 rounded-md border border-input bg-background px-3 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isOrderTimeoutReminderSeq(seq: number): boolean {
  return seq === ORDER_TIMEOUT_REMINDER_SEQ;
}

export function readOrderTimeoutReminderMinutes(): number {
  const stored = readModuleSettingNumber(ORDER_TIMEOUT_REMINDER_FIELD_ID, MINUTES_DEFAULT);
  if (!Number.isFinite(stored)) return MINUTES_DEFAULT;
  return Math.min(MINUTES_MAX, Math.max(MINUTES_MIN, Math.round(stored)));
}

export function renderOrderTimeoutReminderControl(): string {
  const value = readOrderTimeoutReminderMinutes();
  return `
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          value="${escapeHtml(String(value))}"
          min="${MINUTES_MIN}"
          max="${MINUTES_MAX}"
          step="1"
          data-module-setting-number="${escapeHtml(ORDER_TIMEOUT_REMINDER_FIELD_ID)}"
          aria-label="点单超时提醒分钟数"
        />
        <span class="text-sm text-muted-foreground">分钟</span>
      </div>
      <span class="text-xs text-muted-foreground">${MINUTES_MIN}–${MINUTES_MAX} 分钟</span>
    </div>`;
}
