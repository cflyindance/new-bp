/**
 * 前厅 · 食客端·下单与规则：seq 443 按照时长收费 — 适用场景多选。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingCheckbox } from "./module-settings-form-ui";

export const DURATION_BILLING_SEQ = 443;

export const DURATION_BILLING_SCENE_OPTIONS = [
  { code: "ktv", label: "KTV" },
  { code: "vip-room", label: "VIP包间" },
] as const;

export type DurationBillingSceneCode =
  (typeof DURATION_BILLING_SCENE_OPTIONS)[number]["code"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isDurationBillingScenesMultiselectSeq(seq: number): boolean {
  return seq === DURATION_BILLING_SEQ;
}

export function durationBillingSceneCheckboxFieldId(seq: number, code: string): string {
  return `${seq}-duration-billing-scene-${code}`;
}

export function renderDurationBillingScenesMultiselectHtml(seq: number): string {
  const cells = DURATION_BILLING_SCENE_OPTIONS.map((opt) => {
    const fieldId = durationBillingSceneCheckboxFieldId(seq, opt.code);
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
      data-duration-billing-scenes-multiselect="${seq}"
      role="group"
      aria-label="按照时长收费适用场景"
    >
      ${cells}
    </div>`;
}
