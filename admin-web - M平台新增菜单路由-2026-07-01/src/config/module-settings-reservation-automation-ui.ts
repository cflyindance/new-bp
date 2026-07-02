/**
 * 预约等位 · 预约提醒与自动化（seq 341–342）。
 * 342 开关；341 预约消息提前提醒（小时）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";

export const RESERVATION_REMINDER_HOURS_SEQ = 341;
export const RESERVATION_AUTO_FILL_SEQ = 342;

/** 342 自动填充 */
export const RESERVATION_AUTOMATION_TOGGLE_SEQS: readonly number[] = [RESERVATION_AUTO_FILL_SEQ];

const REMINDER_HOURS_FIELD_ID = "341-reservation-reminder-hours";
const REMINDER_HOURS_DEFAULT = 24;
const REMINDER_HOURS_MIN = 1;
const REMINDER_HOURS_MAX = 168;

const NUMBER_INPUT_CLASS =
  "h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isReservationAutomationToggleSeq(seq: number): boolean {
  return (RESERVATION_AUTOMATION_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function isReservationReminderHoursSeq(seq: number): boolean {
  return seq === RESERVATION_REMINDER_HOURS_SEQ;
}

export function readReservationReminderHours(): number {
  const stored = readModuleSettingNumber(REMINDER_HOURS_FIELD_ID, REMINDER_HOURS_DEFAULT);
  return Math.min(REMINDER_HOURS_MAX, Math.max(REMINDER_HOURS_MIN, Math.round(stored)));
}

export function renderReservationReminderHoursControl(): string {
  const value = readReservationReminderHours();
  return `
    <div class="flex flex-wrap items-center justify-end gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="${NUMBER_INPUT_CLASS}"
        value="${escapeHtml(String(value))}"
        min="${REMINDER_HOURS_MIN}"
        max="${REMINDER_HOURS_MAX}"
        step="1"
        data-module-setting-number="${escapeHtml(REMINDER_HOURS_FIELD_ID)}"
        aria-label="预约消息提前提醒（小时）"
      />
      <span class="text-sm text-muted-foreground">小时</span>
    </div>`;
}
