/**
 * 门店管理 · 营业与运营：餐厅模式单选（seq 170）。
 */

import { readModuleSettingRadio } from "./module-settings-form-ui";

export const STORE_RESTAURANT_MODE_SEQ = 170;

export const STORE_RESTAURANT_MODE_FIELD_ID = "170-restaurant-mode";

export const STORE_RESTAURANT_MODE_OPTIONS = [
  { code: "dining", label: "Dining" },
  { code: "fast-food", label: "Fast Food" },
] as const;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isStoreRestaurantModeRadioSeq(seq: number): boolean {
  return seq === STORE_RESTAURANT_MODE_SEQ;
}

export function renderStoreRestaurantModeRadioHtml(seq: number): string {
  const current = readModuleSettingRadio(STORE_RESTAURANT_MODE_FIELD_ID, "dining");
  const groupName = `module-setting-radio-${seq}`;
  const cells = STORE_RESTAURANT_MODE_OPTIONS.map((opt, index) => {
    const checked = current === opt.code;
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-6 ${divider}"
      >
        <input
          type="radio"
          name="${escapeHtml(groupName)}"
          value="${escapeHtml(opt.code)}"
          class="${MODULE_SETTING_CONTROL_CLASS}"
          ${checked ? "checked" : ""}
          data-module-setting-radio="${escapeHtml(STORE_RESTAURANT_MODE_FIELD_ID)}"
          aria-label="${escapeHtml(opt.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-store-restaurant-mode-radio="${seq}"
      role="radiogroup"
      aria-label="餐厅模式选择"
    >
      ${cells}
    </div>`;
}
