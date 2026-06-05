/**
 * 订单 · 折扣与加收：seq 163 折扣原因（开关 + 开启后输入默认值）。
 */

import { readModuleSettingText } from "./module-settings-form-ui";

export const ORDER_DISCOUNT_REASON_SEQ = 163;

export const ORDER_DISCOUNT_REASON_TEXT_FIELD_ID = "163-discount-reason-default";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isOrderDiscountReasonSeq(seq: number): boolean {
  return seq === ORDER_DISCOUNT_REASON_SEQ;
}

export function renderOrderDiscountReasonValuePanel(seq: number, on: boolean): string {
  const value = readModuleSettingText(ORDER_DISCOUNT_REASON_TEXT_FIELD_ID, "");
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${hidden}"
      data-order-discount-reason-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <label class="mb-1.5 block text-xs text-muted-foreground" for="order-discount-reason-default-${seq}">
        默认折扣原因
      </label>
      <input
        id="order-discount-reason-default-${seq}"
        type="text"
        class="${INPUT_CLASS}"
        value="${escapeHtml(value)}"
        placeholder="请输入默认折扣原因"
        data-module-setting-text="${escapeHtml(ORDER_DISCOUNT_REASON_TEXT_FIELD_ID)}"
        autocomplete="off"
      />
    </div>`;
}

export function setOrderDiscountReasonPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-order-discount-reason-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
  });
}
