/**
 * 消息中心 · 员工端通知类型（seq 331）— 通知主题多选（按语义子分类展示）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingCheckbox } from "./module-settings-form-ui";

export const NOTIFICATION_CENTER_TOPICS_SEQ = 331;

export type NotificationCenterTopicCode =
  (typeof NOTIFICATION_CENTER_TOPIC_CATEGORIES)[number]["topics"][number]["code"];

export const NOTIFICATION_CENTER_TOPIC_CATEGORIES = [
  {
    id: "orders",
    label: "订单类",
    topics: [
      { code: "online-order", label: "线上订单", hint: "Online Order" },
      { code: "kiosk", label: "自助点餐机", hint: "Kiosk" },
      { code: "emenu", label: "扫码点餐", hint: "eMenu" },
      { code: "self-dine-in", label: "自助堂食", hint: "Self Dine In" },
      { code: "cravee-order", label: "Cravee 订单", hint: "Cravee Order" },
    ],
  },
  {
    id: "service",
    label: "服务类",
    topics: [
      { code: "service-request", label: "桌边服务请求", hint: "Service Request" },
      { code: "reservation", label: "预约", hint: "Reservation" },
    ],
  },
  {
    id: "ops",
    label: "运营类",
    topics: [
      { code: "printer", label: "打印机", hint: "Printer" },
      { code: "expiration-management", label: "效期管理", hint: "Expiration Management" },
      { code: "announcement", label: "公告", hint: "Announcement" },
    ],
  },
  {
    id: "payment",
    label: "交易类",
    topics: [{ code: "alipay-wechat-pay", label: "支付宝/微信支付", hint: "Alipay/Wechat Pay" }],
  },
  {
    id: "system",
    label: "系统类",
    topics: [{ code: "system", label: "系统", hint: "System" }],
  },
] as const;

/** @deprecated 兼容旧引用；新 UI 请用 NOTIFICATION_CENTER_TOPIC_CATEGORIES */
export const NOTIFICATION_CENTER_TOPIC_OPTIONS = NOTIFICATION_CENTER_TOPIC_CATEGORIES.flatMap(
  (cat) => cat.topics.map((t) => ({ code: t.code, label: t.label })),
);

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
  const sections = NOTIFICATION_CENTER_TOPIC_CATEGORIES.map((cat) => {
    const cells = cat.topics
      .map((opt) => {
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
        <span class="leading-tight">
          <span>${escapeHtml(opt.label)}</span>
          <span class="ml-1 text-xs text-muted-foreground">${escapeHtml(opt.hint)}</span>
        </span>
      </label>`;
      })
      .join("");

    return `
    <div class="space-y-2" data-notification-topic-category="${escapeHtml(cat.id)}">
      <p class="text-xs font-medium text-muted-foreground">${escapeHtml(cat.label)}</p>
      <div class="flex flex-wrap gap-2">${cells}</div>
    </div>`;
  }).join("");

  return `
    <div
      class="flex max-w-3xl flex-col gap-4"
      data-notification-center-topics-multiselect="${seq}"
      role="group"
      aria-label="员工端通知类型"
    >
      ${sections}
    </div>`;
}
