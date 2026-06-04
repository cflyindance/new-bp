/**
 * 订单 · 开单场景：seq 126 默认新订单类型（单选，选项默认展开）。
 */

import {
  readModuleSettingRadio,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";
import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";

export const DEFAULT_NEW_ORDER_TYPE_SEQ = 126;

export const DEFAULT_NEW_ORDER_TYPE_FIELD_ID = "126-default-new-order-type";

const GROUP_NAME = "module-setting-radio-126-default-order-type";

/** 与 POS / 后厨订单类型 code 对齐 */
export const DEFAULT_NEW_ORDER_TYPE_OPTIONS = [
  { value: "dine-in", label: "Dine In" },
  { value: "to-go", label: "To Go" },
  { value: "pick-up", label: "Pick Up" },
  { value: "delivery", label: "Delivery" },
] as const;

export type DefaultNewOrderType = (typeof DEFAULT_NEW_ORDER_TYPE_OPTIONS)[number]["value"];

function isValidDefaultNewOrderType(value: string): value is DefaultNewOrderType {
  return DEFAULT_NEW_ORDER_TYPE_OPTIONS.some((opt) => opt.value === value);
}

function normalizeDefaultNewOrderType(stored: string): DefaultNewOrderType {
  const trimmed = stored.trim();
  if (isValidDefaultNewOrderType(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  if (isValidDefaultNewOrderType(lower)) return lower;
  const slug = lower.replace(/\s+/g, "-");
  if (isValidDefaultNewOrderType(slug)) return slug;
  const byLabel = DEFAULT_NEW_ORDER_TYPE_OPTIONS.find(
    (opt) => opt.label.toLowerCase() === lower,
  );
  if (byLabel) return byLabel.value;
  return "dine-in";
}

export function readDefaultNewOrderType(): DefaultNewOrderType {
  return normalizeDefaultNewOrderType(
    readModuleSettingRadio(DEFAULT_NEW_ORDER_TYPE_FIELD_ID, "dine-in"),
  );
}

export function writeDefaultNewOrderType(type: DefaultNewOrderType): void {
  writeModuleSettingRadio(DEFAULT_NEW_ORDER_TYPE_FIELD_ID, type);
}

export function isDefaultNewOrderTypeSeq(seq: number): boolean {
  return seq === DEFAULT_NEW_ORDER_TYPE_SEQ;
}

export function renderDefaultNewOrderTypeSelectHtml(): string {
  return renderModuleSettingSingleChoiceHtml({
    options: DEFAULT_NEW_ORDER_TYPE_OPTIONS,
    fieldId: DEFAULT_NEW_ORDER_TYPE_FIELD_ID,
    groupName: GROUP_NAME,
    currentValue: readDefaultNewOrderType(),
    layout: "wrap",
    ariaLabel: "默认新订单类型",
  });
}
