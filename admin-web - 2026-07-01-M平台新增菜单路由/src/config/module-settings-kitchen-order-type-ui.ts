/**
 * 后厨设置：订单类型多选（横向分栏 + 复选框），原型 localStorage。
 * seq 36「不需要厨房单的单类」。
 */

import { readModuleSettingCheckbox } from "./module-settings-form-ui";

export const KITCHEN_STANDARD_ORDER_TYPES = [
  { code: "dine-in", label: "Dine In" },
  { code: "to-go", label: "To Go" },
  { code: "pick-up", label: "Pick Up" },
  { code: "delivery", label: "Delivery" },
] as const;

const KITCHEN_ORDER_TYPE_MULTISELECT_SEQS = new Set([36]);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isKitchenOrderTypeMultiselectSeq(seq: number): boolean {
  return KITCHEN_ORDER_TYPE_MULTISELECT_SEQS.has(seq);
}

export function kitchenOrderTypeCheckboxFieldId(seq: number, code: string): string {
  return `${seq}-order-type-${code}`;
}

export function renderKitchenOrderTypeMultiselectHtml(seq: number): string {
  const cells = KITCHEN_STANDARD_ORDER_TYPES.map((ot, index) => {
    const fieldId = kitchenOrderTypeCheckboxFieldId(seq, ot.code);
    const checked = readModuleSettingCheckbox(fieldId, false);
    const divider =
      index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-module-setting-checkbox="${escapeHtml(fieldId)}"
          aria-label="${escapeHtml(ot.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(ot.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-kitchen-order-type-multiselect="${seq}"
      role="group"
      aria-label="订单类型多选"
    >
      ${cells}
    </div>`;
}
