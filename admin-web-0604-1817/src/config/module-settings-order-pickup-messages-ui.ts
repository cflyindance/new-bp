/**
 * 消息中心 · 订单与取餐通知（334/335 短信渠道产线多选；336–340 文案输入）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingCheckbox, readModuleSettingText } from "./module-settings-form-ui";

export const ORDER_PICKUP_ORDER_COMPLETE_SMS_CHANNEL_SEQ = 334;
export const ORDER_PICKUP_PICKUP_SMS_CHANNEL_SEQ = 335;

export const ORDER_PICKUP_SMS_CHANNEL_PRODUCT_LINES = [
  { code: "pos", label: "POS" },
  { code: "kiosk", label: "KIOSK" },
  { code: "online-order", label: "ONLINE_ORDER" },
  { code: "self-dine-in", label: "SELF_DINE_IN" },
] as const;

export type OrderPickupSmsChannelLineCode =
  (typeof ORDER_PICKUP_SMS_CHANNEL_PRODUCT_LINES)[number]["code"];

export const ORDER_PICKUP_SMS_CHANNEL_SEQS: readonly number[] = [
  ORDER_PICKUP_ORDER_COMPLETE_SMS_CHANNEL_SEQ,
  ORDER_PICKUP_PICKUP_SMS_CHANNEL_SEQ,
];

export const ORDER_PICKUP_SMS_ASAP_NON_DELIVERY_SEQ = 336;
export const ORDER_PICKUP_SMS_SCHEDULED_NON_DELIVERY_SEQ = 337;
export const ORDER_PICKUP_SMS_READY_SEQ = 338;
export const ORDER_PICKUP_SMS_ASAP_DELIVERY_SEQ = 339;
export const ORDER_PICKUP_SMS_SCHEDULED_DELIVERY_SEQ = 340;

/** 组内「设置…内容」的 seq */
export const ORDER_PICKUP_SMS_CONTENT_SEQS: readonly number[] = [
  ORDER_PICKUP_SMS_ASAP_NON_DELIVERY_SEQ,
  ORDER_PICKUP_SMS_SCHEDULED_NON_DELIVERY_SEQ,
  ORDER_PICKUP_SMS_READY_SEQ,
  ORDER_PICKUP_SMS_ASAP_DELIVERY_SEQ,
  ORDER_PICKUP_SMS_SCHEDULED_DELIVERY_SEQ,
];

const SMS_CONTENT_MAX_LENGTH = 500;

const TEXTAREA_CLASS =
  "w-full min-h-[5rem] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function orderPickupSmsChannelCheckboxFieldId(seq: number, code: string): string {
  return `${seq}-order-pickup-sms-channel-${code}`;
}

export function isOrderPickupSmsChannelSeq(seq: number): boolean {
  return (ORDER_PICKUP_SMS_CHANNEL_SEQS as readonly number[]).includes(seq);
}

export function renderOrderPickupSmsChannelMultiselectHtml(seq: number): string {
  const cells = ORDER_PICKUP_SMS_CHANNEL_PRODUCT_LINES.map((line, index) => {
    const fieldId = orderPickupSmsChannelCheckboxFieldId(seq, line.code);
    const checked = readModuleSettingCheckbox(fieldId, false);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-module-setting-checkbox="${escapeHtml(fieldId)}"
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center font-mono text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-order-pickup-sms-channel-multiselect="${seq}"
      role="group"
      aria-label="短信渠道适用产线"
    >
      ${cells}
    </div>`;
}

export function orderPickupSmsContentFieldId(seq: number): string {
  return `${seq}-order-pickup-sms-content`;
}

export function isOrderPickupSmsContentSeq(seq: number): boolean {
  return (ORDER_PICKUP_SMS_CONTENT_SEQS as readonly number[]).includes(seq);
}

export function readOrderPickupSmsContent(seq: number): string {
  return readModuleSettingText(orderPickupSmsContentFieldId(seq), "");
}

export function renderOrderPickupSmsContentInput(seq: number): string {
  const fieldId = orderPickupSmsContentFieldId(seq);
  const value = readOrderPickupSmsContent(seq);
  const len = value.length;
  return `
    <div class="w-full max-w-2xl">
      <textarea
        rows="4"
        class="${TEXTAREA_CLASS}"
        maxlength="${SMS_CONTENT_MAX_LENGTH}"
        placeholder="请输入短信/通知文案，可使用门店名、订单号等占位符（以实际引擎为准）"
        data-module-setting-text="${escapeHtml(fieldId)}"
        data-max-length="${SMS_CONTENT_MAX_LENGTH}"
        aria-label="短信通知内容"
      >${escapeHtml(value)}</textarea>
      <p class="mt-1.5 text-right text-xs tabular-nums text-muted-foreground">${len} / ${SMS_CONTENT_MAX_LENGTH}</p>
    </div>`;
}
