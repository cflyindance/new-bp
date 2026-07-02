/**
 * 订单 · 折扣与加收：seq 147 总价四舍五入设置（单选，选项默认展开）。
 */

import {
  readModuleSettingRadio,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";
import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";

export const ORDER_TOTAL_ROUNDING_SEQ = 147;

export const ORDER_TOTAL_ROUNDING_FIELD_ID = "147-order-total-rounding-mode";

const GROUP_NAME = "module-setting-radio-147-order-total-rounding";

/** 与 POS/旧系统枚举对齐的舍入策略 */
export const ORDER_TOTAL_ROUNDING_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "none", label: "No Rounding" },
  { value: "down-5c", label: "Rounding down to nearest 5 cents" },
  { value: "down-10c", label: "Rounding down to nearest 10 cents" },
  {
    value: "nearest-5-10c",
    label: "Round down or Round up to nearest 5 or 10cents",
  },
] as const;

export type OrderTotalRoundingMode = (typeof ORDER_TOTAL_ROUNDING_OPTIONS)[number]["value"];

function isValidRoundingMode(value: string): value is OrderTotalRoundingMode {
  return ORDER_TOTAL_ROUNDING_OPTIONS.some((opt) => opt.value === value);
}

export function readOrderTotalRoundingMode(): OrderTotalRoundingMode {
  const stored = readModuleSettingRadio(
    ORDER_TOTAL_ROUNDING_FIELD_ID,
    "down-10c",
  );
  return isValidRoundingMode(stored) ? stored : "down-10c";
}

export function writeOrderTotalRoundingMode(mode: OrderTotalRoundingMode): void {
  writeModuleSettingRadio(ORDER_TOTAL_ROUNDING_FIELD_ID, mode);
}

export function isOrderTotalRoundingSeq(seq: number): boolean {
  return seq === ORDER_TOTAL_ROUNDING_SEQ;
}

export function renderOrderTotalRoundingSelectHtml(): string {
  return renderModuleSettingSingleChoiceHtml({
    options: ORDER_TOTAL_ROUNDING_OPTIONS,
    fieldId: ORDER_TOTAL_ROUNDING_FIELD_ID,
    groupName: GROUP_NAME,
    currentValue: readOrderTotalRoundingMode(),
    layout: "vertical",
    ariaLabel: "总价四舍五入方式",
  });
}
