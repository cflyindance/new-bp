/**
 * 后厨 · 厨房单·版式格式：打印边距（seq 43）+ 打印边距范围（seq 44）合并为一行。
 */

import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingNumber,
  readModuleSettingRadio,
} from "./module-settings-form-ui";
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";

export const KITCHEN_TICKET_MARGIN_HOST_SEQ = 43;
export const KITCHEN_TICKET_MARGIN_SKIP_SEQ = 44;

export const KITCHEN_TICKET_MARGIN_SIZE_FIELD_ID = "43-print-margin-size";
export const KITCHEN_TICKET_MARGIN_RANGE_FIELD_ID = "44-print-margin-range";

export const KITCHEN_TICKET_MARGIN_RANGE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "top-bottom", label: "Top & Bottom" },
  { value: "top-only", label: "Top margin only" },
  { value: "bottom-only", label: "Bottom margin only" },
] as const;

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isKitchenTicketMarginHostSeq(seq: number): boolean {
  return seq === KITCHEN_TICKET_MARGIN_HOST_SEQ;
}

export function shouldSkipKitchenTicketMarginRangeRow(seq: number): boolean {
  return seq === KITCHEN_TICKET_MARGIN_SKIP_SEQ;
}

function readKitchenTicketMarginRange(): string {
  const stored = readModuleSettingRadio(KITCHEN_TICKET_MARGIN_RANGE_FIELD_ID, "top-bottom");
  return KITCHEN_TICKET_MARGIN_RANGE_OPTIONS.some((o) => o.value === stored)
    ? stored
    : "top-bottom";
}

export function renderKitchenTicketMarginRowHtml(_item: ModuleSettingCatalogItem): string {
  const margin = readModuleSettingNumber(KITCHEN_TICKET_MARGIN_SIZE_FIELD_ID, 0);
  const rangeChoice = renderModuleSettingSingleChoiceHtml({
    options: KITCHEN_TICKET_MARGIN_RANGE_OPTIONS,
    fieldId: KITCHEN_TICKET_MARGIN_RANGE_FIELD_ID,
    groupName: "module-setting-radio-44-print-margin-range",
    currentValue: readKitchenTicketMarginRange(),
    layout: "vertical",
    ariaLabel: "打印边距范围",
  });

  return `
    <div class="mt-3 space-y-3" data-kitchen-ticket-margin-controls>
      <input
        type="number"
        inputmode="decimal"
        step="1"
        min="0"
        class="${INPUT_CLASS} tabular-nums"
        value="${escapeHtml(String(margin))}"
        data-module-setting-field="${escapeHtml(KITCHEN_TICKET_MARGIN_SIZE_FIELD_ID)}"
        data-default-value="0"
        aria-label="打印边距"
      />
      <div class="space-y-2">
        <span class="block text-sm font-medium text-foreground">打印边距范围</span>
        ${rangeChoice}
      </div>
    </div>`;
}

/** 边距范围由 bindModuleSettingsFormControls 绑定；保留导出供 main 调用 */
export function bindKitchenTicketMarginControls(): void {
  /* radio + number 已由通用 form 绑定 */
}
