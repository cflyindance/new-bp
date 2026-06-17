/**
 * 预约等位 · 叫号屏与显示策略（seq 2–7）。
 * 2/6 开关；3/4/5 数值输入；7 显示模式单选。
 */

import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingNumber,
  readModuleSettingRadio,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";

export const CALLER_SCREEN_ENABLE_SEQ = 2;
export const CALLER_SCREEN_TICKET_DURATION_SEQ = 3;
export const CALLER_SCREEN_TICKET_COUNT_LIMIT_SEQ = 4;
export const CALLER_SCREEN_DATA_RETENTION_SEQ = 5;
export const CALLER_SCREEN_REMOVE_ON_PAYMENT_SEQ = 6;
export const CALLER_SCREEN_DISPLAY_MODE_SEQ = 7;

/** 叫号屏总开关、付款后自动下屏 */
export const CALLER_SCREEN_TOGGLE_SEQS: readonly number[] = [
  CALLER_SCREEN_ENABLE_SEQ,
  CALLER_SCREEN_REMOVE_ON_PAYMENT_SEQ,
];

export type CallerScreenNumberConfig = {
  fieldId: string;
  defaultValue: number;
  min: number;
  max: number;
  unit: string;
  inputAriaLabel: string;
};

const NUMBER_INPUT_CLASS =
  "h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NUMBER_CONFIG: Record<number, CallerScreenNumberConfig> = {
  [CALLER_SCREEN_TICKET_DURATION_SEQ]: {
    fieldId: "3-caller-ticket-display-minutes",
    defaultValue: 5,
    min: 1,
    max: 480,
    unit: "分钟",
    inputAriaLabel: "单号展示时长（分钟）",
  },
  [CALLER_SCREEN_TICKET_COUNT_LIMIT_SEQ]: {
    fieldId: "4-caller-ticket-slot-limit",
    defaultValue: 10,
    min: 1,
    max: 50,
    unit: "个",
    inputAriaLabel: "同屏单号数量上限",
  },
  [CALLER_SCREEN_DATA_RETENTION_SEQ]: {
    fieldId: "5-caller-data-retention-days",
    defaultValue: 30,
    min: 1,
    max: 365,
    unit: "天",
    inputAriaLabel: "历史数据保留天数",
  },
};

export const CALLER_SCREEN_DISPLAY_MODE_FIELD_ID = "7-caller-display-mode";
export const CALLER_SCREEN_DISPLAY_MODE_GROUP = "module-setting-radio-7-caller-display-mode";

export const CALLER_SCREEN_DISPLAY_MODE_OPTIONS = [
  { value: "ad_and_tickets", label: "广告图 + 订单号" },
  { value: "tickets_only", label: "仅订单号（不展示广告图）" },
  { value: "multiple_kitchens", label: "多厨房（Multiple kitchens）" },
  { value: "prep_status", label: "备餐状态展示（Show kitchen preparation status）" },
] as const;

export type CallerScreenDisplayMode =
  (typeof CALLER_SCREEN_DISPLAY_MODE_OPTIONS)[number]["value"];

const DISPLAY_MODE_FALLBACK: CallerScreenDisplayMode = "ad_and_tickets";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isCallerScreenToggleSeq(seq: number): boolean {
  return (CALLER_SCREEN_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function isCallerScreenNumberInputSeq(seq: number): boolean {
  return NUMBER_CONFIG[seq] !== undefined;
}

export function getCallerScreenNumberConfig(seq: number): CallerScreenNumberConfig | undefined {
  return NUMBER_CONFIG[seq];
}

export function isCallerScreenDisplayModeSeq(seq: number): boolean {
  return seq === CALLER_SCREEN_DISPLAY_MODE_SEQ;
}

function isValidDisplayMode(value: string): value is CallerScreenDisplayMode {
  return CALLER_SCREEN_DISPLAY_MODE_OPTIONS.some((opt) => opt.value === value);
}

export function readCallerScreenDisplayMode(): CallerScreenDisplayMode {
  const stored = readModuleSettingRadio(
    CALLER_SCREEN_DISPLAY_MODE_FIELD_ID,
    DISPLAY_MODE_FALLBACK,
  );
  return isValidDisplayMode(stored) ? stored : DISPLAY_MODE_FALLBACK;
}

export function writeCallerScreenDisplayMode(mode: CallerScreenDisplayMode): void {
  writeModuleSettingRadio(CALLER_SCREEN_DISPLAY_MODE_FIELD_ID, mode);
}

export function renderCallerScreenNumberControl(seq: number): string {
  const config = NUMBER_CONFIG[seq];
  if (!config) return "";
  const stored = readModuleSettingNumber(config.fieldId, config.defaultValue);
  const value = Math.min(config.max, Math.max(config.min, Math.round(stored)));
  return `
    <div class="flex flex-wrap items-center justify-end gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="${NUMBER_INPUT_CLASS}"
        value="${escapeHtml(String(value))}"
        min="${config.min}"
        max="${config.max}"
        step="1"
        data-module-setting-number="${escapeHtml(config.fieldId)}"
        aria-label="${escapeHtml(config.inputAriaLabel)}"
      />
      <span class="text-sm text-muted-foreground">${escapeHtml(config.unit)}</span>
    </div>`;
}

export function renderCallerScreenDisplayModeChoiceHtml(): string {
  return renderModuleSettingSingleChoiceHtml({
    options: CALLER_SCREEN_DISPLAY_MODE_OPTIONS,
    fieldId: CALLER_SCREEN_DISPLAY_MODE_FIELD_ID,
    groupName: CALLER_SCREEN_DISPLAY_MODE_GROUP,
    currentValue: readCallerScreenDisplayMode(),
    layout: "vertical",
    ariaLabel: "叫号屏显示模式",
  });
}
