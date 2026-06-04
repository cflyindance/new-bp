/**
 * 订单 · 删退与作废：seq 156 订单失效原因多选；155/157/158/159 为开关（见 toggle-ui）。
 */

import { readModuleSettingCheckbox } from "./module-settings-form-ui";

export const ORDER_VOID_INVALIDATION_REASON_SEQ = 156;

/** 删单时可选用的失效/删除原因（POS 删单归因枚举，原型默认全开） */
export const ORDER_VOID_INVALIDATION_REASONS = [
  { code: "food-allergy", label: "Food Allergy" },
  { code: "foreign-objects", label: "Foreign Objects in Food" },
  { code: "servers-mistake", label: "Servers Mistake" },
  { code: "waited-too-long", label: "Waited Too Long" },
  { code: "undercooked", label: "Food is Undercooked" },
  { code: "improperly-prepared", label: "Improperly Prepared" },
  { code: "not-as-described", label: "Orders Arriving Not as Described" },
] as const;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isOrderVoidInvalidationReasonSeq(seq: number): boolean {
  return seq === ORDER_VOID_INVALIDATION_REASON_SEQ;
}

export function orderVoidInvalidationReasonFieldId(seq: number, code: string): string {
  return `${seq}-void-reason-${code}`;
}

export function renderOrderVoidInvalidationReasonMultiselectHtml(seq: number): string {
  const cells = ORDER_VOID_INVALIDATION_REASONS.map((reason) => {
    const fieldId = orderVoidInvalidationReasonFieldId(seq, reason.code);
    const checked = readModuleSettingCheckbox(fieldId, true);
    return `
      <label
        class="flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-2 py-3 text-sm text-foreground"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-module-setting-checkbox="${escapeHtml(fieldId)}"
          aria-label="${escapeHtml(reason.label)}"
        />
        <span class="text-center text-xs leading-snug sm:text-sm">${escapeHtml(reason.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="grid grid-cols-2 gap-2 sm:grid-cols-4"
      data-order-void-invalidation-reasons="${seq}"
      role="group"
      aria-label="订单失效原因多选"
    >
      ${cells}
    </div>`;
}
