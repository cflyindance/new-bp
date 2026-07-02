/**
 * 后厨 · 打包单：需要打包单的订单类型（seq 39）— To Go / Pick Up / Delivery 多选。
 */

import { readModuleSettingCheckbox } from "./module-settings-form-ui";

export const PACKING_SLIP_ORDER_TYPE_OPTIONS = [
  { code: "to-go", label: "To Go" },
  { code: "pick-up", label: "Pick Up" },
  { code: "delivery", label: "Delivery" },
] as const;

export const PACKING_SLIP_ORDER_TYPE_SEQ = 39;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPackingSlipOrderTypeMultiselectSeq(seq: number): boolean {
  return seq === PACKING_SLIP_ORDER_TYPE_SEQ;
}

export function packingSlipOrderTypeCheckboxFieldId(seq: number, code: string): string {
  return `${seq}-order-type-${code}`;
}

export function renderPackingSlipOrderTypeMultiselectHtml(seq: number): string {
  const cells = PACKING_SLIP_ORDER_TYPE_OPTIONS.map((ot, index) => {
    const fieldId = packingSlipOrderTypeCheckboxFieldId(seq, ot.code);
    const checked = readModuleSettingCheckbox(fieldId, false);
    const divider = index > 0 ? "border-l border-border" : "";
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
      data-packing-slip-order-type-multiselect="${seq}"
      role="group"
      aria-label="需要打包单的订单类型"
    >
      ${cells}
    </div>`;
}
