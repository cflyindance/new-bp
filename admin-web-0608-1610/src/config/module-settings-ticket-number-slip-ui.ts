/**
 * 打印中心 · 取餐号小票（291 触发场景多选；292 打印份数输入）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingCheckbox, readModuleSettingNumber } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const TICKET_NUMBER_SLIP_TRIGGER_SEQ = 291;
export const TICKET_NUMBER_SLIP_COPIES_SEQ = 292;

export const TICKET_NUMBER_SLIP_COPIES_FIELD_ID = "292-ticket-number-slip-copies";

const COPIES_DEFAULT = 1;
const COPIES_MIN = 1;
const COPIES_MAX = 9;

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const TICKET_NUMBER_SLIP_TRIGGER_OPTIONS = [
  { code: "paid", label: "付款完成" },
  { code: "receipt-printed", label: "收据已打印" },
  { code: "sent-to-kitchen", label: "送厨后" },
  { code: "create-new-order", label: "新建订单" },
] as const;

export type TicketNumberSlipTriggerCode =
  (typeof TICKET_NUMBER_SLIP_TRIGGER_OPTIONS)[number]["code"];

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

export function isTicketNumberSlipTriggerMultiselectSeq(seq: number): boolean {
  return seq === TICKET_NUMBER_SLIP_TRIGGER_SEQ;
}

export function isTicketNumberSlipCopiesSeq(seq: number): boolean {
  return seq === TICKET_NUMBER_SLIP_COPIES_SEQ;
}

export function readTicketNumberSlipCopies(): number {
  let stored = readModuleSettingNumber(TICKET_NUMBER_SLIP_COPIES_FIELD_ID, COPIES_DEFAULT);
  if (!Number.isFinite(stored) && readLegacyToggleOn(TICKET_NUMBER_SLIP_COPIES_SEQ)) {
    stored = 1;
  }
  if (!Number.isFinite(stored)) return COPIES_DEFAULT;
  return Math.min(COPIES_MAX, Math.max(COPIES_MIN, Math.round(stored)));
}

export function renderTicketNumberSlipCopiesControl(): string {
  const value = readTicketNumberSlipCopies();
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
          data-module-setting-number="${escapeHtml(TICKET_NUMBER_SLIP_COPIES_FIELD_ID)}"
          aria-label="单号小票打印份数"
        />
        <span class="text-sm text-muted-foreground">份</span>
      </div>
      <span class="text-xs text-muted-foreground">${COPIES_MIN}–${COPIES_MAX} 份</span>
    </div>`;
}

export function ticketNumberSlipTriggerCheckboxFieldId(seq: number, code: string): string {
  return `${seq}-ticket-number-slip-trigger-${code}`;
}

export function renderTicketNumberSlipTriggerMultiselectHtml(seq: number): string {
  const cells = TICKET_NUMBER_SLIP_TRIGGER_OPTIONS.map((opt) => {
    const fieldId = ticketNumberSlipTriggerCheckboxFieldId(seq, opt.code);
    const checked = readModuleSettingCheckbox(fieldId, false);
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-module-setting-checkbox="${escapeHtml(fieldId)}"
          aria-label="${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex max-w-xl flex-wrap gap-2"
      data-ticket-number-slip-trigger-multiselect="${seq}"
      role="group"
      aria-label="以下情况打印单号小票"
    >
      ${cells}
    </div>`;
}
