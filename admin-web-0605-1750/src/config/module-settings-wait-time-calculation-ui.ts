/**
 * 前厅 · 排队与等待展示：seq 673 预计等待时长计算设置（全店全局；各产线展示均依据本规则换算）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";

export const WAIT_TIME_CALCULATION_SEQ = 673;

export type WaitTimeCalculationFieldKey =
  | "baseCupThreshold"
  | "baseProductionSeconds"
  | "overflowCupStep"
  | "overflowProductionSeconds"
  | "additionalSeconds";

export type WaitTimeCalculationConfig = Record<WaitTimeCalculationFieldKey, number>;

const NUMBER_INPUT_CLASS =
  "h-9 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type FieldDef = {
  key: WaitTimeCalculationFieldKey;
  fieldId: string;
  label: string;
  unit: string;
  defaultValue: number;
  min: number;
  max: number;
  hint?: string;
};

export const WAIT_TIME_CALCULATION_FIELDS: readonly FieldDef[] = [
  {
    key: "baseCupThreshold",
    fieldId: "673-wait-calc-base-cup-threshold",
    label: "当前未满多少杯",
    unit: "杯",
    defaultValue: 20,
    min: 1,
    max: 999,
    hint: "排队杯数低于该值时，按下方基础制作时长计算",
  },
  {
    key: "baseProductionSeconds",
    fieldId: "673-wait-calc-base-production-seconds",
    label: "制作时长",
    unit: "秒",
    defaultValue: 300,
    min: 0,
    max: 86400,
  },
  {
    key: "overflowCupStep",
    fieldId: "673-wait-calc-overflow-cup-step",
    label: "超出后，每多少杯",
    unit: "杯",
    defaultValue: 4,
    min: 1,
    max: 999,
    hint: "达到或超过上方杯数阈值后，按此步长递增制作时长",
  },
  {
    key: "overflowProductionSeconds",
    fieldId: "673-wait-calc-overflow-production-seconds",
    label: "制作时长",
    unit: "秒",
    defaultValue: 60,
    min: 0,
    max: 86400,
  },
  {
    key: "additionalSeconds",
    fieldId: "673-wait-calc-additional-seconds",
    label: "附加时间",
    unit: "秒",
    defaultValue: 60,
    min: 0,
    max: 86400,
    hint: "在计算出的制作时长上统一叠加",
  },
] as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readFieldNumber(field: FieldDef): number {
  const stored = readModuleSettingNumber(field.fieldId, field.defaultValue);
  if (!Number.isFinite(stored)) return field.defaultValue;
  return Math.min(field.max, Math.max(field.min, Math.round(stored)));
}

export function readWaitTimeCalculationConfig(): WaitTimeCalculationConfig {
  const out = {} as WaitTimeCalculationConfig;
  for (const field of WAIT_TIME_CALCULATION_FIELDS) {
    out[field.key] = readFieldNumber(field);
  }
  return out;
}

/** 按全局规则将排队杯数换算为预计等待秒数（各产线展示共用） */
export function calculateEstimatedWaitSeconds(
  queueCups: number,
  config: WaitTimeCalculationConfig = readWaitTimeCalculationConfig(),
): number {
  const cups = Math.max(0, Math.round(queueCups));
  let production = config.baseProductionSeconds;
  if (cups >= config.baseCupThreshold && config.overflowCupStep > 0) {
    const overflow = cups - config.baseCupThreshold;
    const steps = Math.ceil(overflow / config.overflowCupStep);
    production += steps * config.overflowProductionSeconds;
  }
  return production + config.additionalSeconds;
}

function renderFieldRow(field: FieldDef): string {
  const value = readFieldNumber(field);
  const hint = field.hint
    ? `<p class="m-0 text-xs text-muted-foreground">${escapeHtml(field.hint)}</p>`
    : "";
  return `
    <div class="space-y-1 border-b border-border/60 py-3 last:border-b-0">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="text-sm text-foreground">${escapeHtml(field.label)}</span>
        <div class="inline-flex items-center gap-2">
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(value))}"
            min="${field.min}"
            max="${field.max}"
            step="1"
            data-module-setting-number="${escapeHtml(field.fieldId)}"
            aria-label="${escapeHtml(field.label)}"
          />
          <span class="text-sm text-muted-foreground">${escapeHtml(field.unit)}</span>
        </div>
      </div>
      ${hint}
    </div>`;
}

export function isWaitTimeCalculationSeq(seq: number): boolean {
  return seq === WAIT_TIME_CALCULATION_SEQ;
}

export function renderWaitTimeCalculationEditorHtml(): string {
  const rows = WAIT_TIME_CALCULATION_FIELDS.map((field) => renderFieldRow(field)).join("");
  return `
    <div class="rounded-lg border border-border bg-muted/30 px-4" data-wait-time-calculation-editor>
      ${rows}
      <p class="m-0 border-t border-border/60 py-3 text-xs leading-relaxed text-muted-foreground">
        各产线（如 Kiosk）的预计等待时长展示、区间规则与弹框阈值均依据以上全局换算；产线项仅控制是否展示及样式。
      </p>
    </div>`;
}
