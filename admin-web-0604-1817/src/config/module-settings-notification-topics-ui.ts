/**
 * 消息中心 · 消息中心的主题（seq 331）— 通知主题多选。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingCheckbox } from "./module-settings-form-ui";

export const NOTIFICATION_CENTER_TOPICS_SEQ = 331;

export const NOTIFICATION_CENTER_TOPIC_OPTIONS = [
  { code: "announcement", label: "Announcement" },
  { code: "online-order", label: "Online Order" },
  { code: "reservation", label: "Reservation" },
  { code: "alipay-wechat-pay", label: "Alipay/Wechat Pay" },
  { code: "service-request", label: "Service Request" },
  { code: "cravee-order", label: "Cravee Order" },
  { code: "kiosk", label: "Kiosk" },
  { code: "emenu", label: "Emenu" },
  { code: "self-dine-in", label: "Self Dine In" },
  { code: "printer", label: "Printer" },
  { code: "expiration-management", label: "Expiration Management" },
  { code: "system", label: "System" },
] as const;

export type NotificationCenterTopicCode =
  (typeof NOTIFICATION_CENTER_TOPIC_OPTIONS)[number]["code"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isNotificationCenterTopicsMultiselectSeq(seq: number): boolean {
  return seq === NOTIFICATION_CENTER_TOPICS_SEQ;
}

export function notificationCenterTopicCheckboxFieldId(seq: number, code: string): string {
  return `${seq}-notification-topic-${code}`;
}

export function renderNotificationCenterTopicsMultiselectHtml(seq: number): string {
  const cells = NOTIFICATION_CENTER_TOPIC_OPTIONS.map((opt) => {
    const fieldId = notificationCenterTopicCheckboxFieldId(seq, opt.code);
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
      class="flex max-w-3xl flex-wrap gap-2"
      data-notification-center-topics-multiselect="${seq}"
      role="group"
      aria-label="消息中心的主题"
    >
      ${cells}
    </div>`;
}
