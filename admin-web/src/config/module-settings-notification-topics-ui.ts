/**
 * 消息中心 · 员工端通知类型（seq 331）— 通知主题多选（按语义子分类表格展示，对齐点单显示座位）。
 */

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

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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

function renderTopicCheckboxesForCategory(
  seq: number,
  categoryLabel: string,
  topics: ReadonlyArray<{ code: string; label: string; hint: string }>,
): string {
  const inputs = topics
    .map((opt) => {
      const fieldId = notificationCenterTopicCheckboxFieldId(seq, opt.code);
      const checked = readModuleSettingCheckbox(fieldId, false);
      return `
      <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground" title="${escapeHtml(opt.hint)}">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-module-setting-checkbox="${escapeHtml(fieldId)}"
          aria-label="${escapeHtml(categoryLabel)} ${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
    })
    .join("");

  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>`;
}

export function renderNotificationCenterTopicsMultiselectHtml(seq: number): string {
  const rows = NOTIFICATION_CENTER_TOPIC_CATEGORIES.map(
    (cat) => `
    <tr class="border-t border-border" data-notification-topic-category="${escapeHtml(cat.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(cat.label)}</td>
      <td class="px-3 py-2.5">
        ${renderTopicCheckboxesForCategory(seq, cat.label, cat.topics)}
      </td>
    </tr>`,
  ).join("");

  return `
    <div
      class="max-w-2xl overflow-x-auto rounded-md border border-border"
      data-notification-center-topics-multiselect="${seq}"
      role="group"
      aria-label="员工端通知类型"
    >
      <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">分类</th>
            <th class="px-3 py-2 font-medium">通知类型（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
