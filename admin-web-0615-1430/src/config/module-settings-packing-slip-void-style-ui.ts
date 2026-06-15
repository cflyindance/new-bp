/**
 * 打印中心 · 打包单打印 · 删除菜品样式（303 主开关 + 开启后单选样式）。
 */

import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";
import { readModuleSettingRadio } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const PACKING_SLIP_VOID_ITEM_STYLE_SEQ = 303;

export const PACKING_SLIP_VOID_STYLE_TOGGLE_SEQS: readonly number[] = [
  PACKING_SLIP_VOID_ITEM_STYLE_SEQ,
];

export const PACKING_SLIP_VOID_ITEM_STYLE_FIELD_ID = "303-packing-slip-void-item-style";
export const PACKING_SLIP_VOID_ITEM_STYLE_RADIO_GROUP =
  "module-setting-radio-303-packing-slip-void-item-style";

export const PACKING_SLIP_VOID_ITEM_STYLE_OPTIONS = [
  { value: "crosses", label: "print crosses(X) on void items" },
  { value: "zero-amount", label: "print 0 amount on void items" },
] as const;

export type PackingSlipVoidItemStyle =
  (typeof PACKING_SLIP_VOID_ITEM_STYLE_OPTIONS)[number]["value"];

const STYLE_FALLBACK: PackingSlipVoidItemStyle = "crosses";

function isValidVoidStyle(value: string): value is PackingSlipVoidItemStyle {
  return PACKING_SLIP_VOID_ITEM_STYLE_OPTIONS.some((opt) => opt.value === value);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function isPackingSlipVoidItemStyleSeq(seq: number): boolean {
  return seq === PACKING_SLIP_VOID_ITEM_STYLE_SEQ;
}

export function readPackingSlipVoidItemStyle(): PackingSlipVoidItemStyle {
  const stored = readModuleSettingRadio(
    PACKING_SLIP_VOID_ITEM_STYLE_FIELD_ID,
    STYLE_FALLBACK,
  );
  if (isValidVoidStyle(stored)) return stored;
  if (readLegacyToggleOn(PACKING_SLIP_VOID_ITEM_STYLE_SEQ)) return STYLE_FALLBACK;
  return STYLE_FALLBACK;
}

export function renderPackingSlipVoidItemStylePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  const choiceHtml = renderModuleSettingSingleChoiceHtml({
    options: PACKING_SLIP_VOID_ITEM_STYLE_OPTIONS,
    fieldId: PACKING_SLIP_VOID_ITEM_STYLE_FIELD_ID,
    groupName: PACKING_SLIP_VOID_ITEM_STYLE_RADIO_GROUP,
    currentValue: readPackingSlipVoidItemStyle(),
    layout: "vertical",
    ariaLabel: "打包单删除菜品展示样式",
  });

  return `
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${hidden}"
      data-packing-slip-void-style-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">删菜展示样式</p>
      ${choiceHtml}
    </div>`;
}

export function setPackingSlipVoidStylePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-packing-slip-void-style-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("input[type='radio']").forEach((input) => {
      input.disabled = !visible;
      input.closest("label")?.classList.toggle("cursor-not-allowed", !visible);
      input.closest("label")?.classList.toggle("opacity-50", !visible);
      input.closest("label")?.classList.toggle("cursor-pointer", visible);
    });
  });
}
