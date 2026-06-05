/**
 * 财务中心 · 收单通道成本率（seq 307，对内口径，不影响顾客应付）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";

export const FINANCE_PROCESSOR_FEE_RATE_SEQ = 307;
export const FINANCE_PROCESSOR_FEE_FIELD_ID = "307-processor-fee-percent";

const MAX_PERCENT = 100;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_PERCENT, Math.max(0, Math.round(n * 100) / 100));
}

export function readFinanceProcessorFeePercent(): number {
  return clampPercent(readModuleSettingNumber(FINANCE_PROCESSOR_FEE_FIELD_ID, 2.5));
}

export function isFinanceProcessorFeeRateSeq(seq: number): boolean {
  return seq === FINANCE_PROCESSOR_FEE_RATE_SEQ;
}

export function renderFinanceProcessorCostBasisIntroHtml(): string {
  return `
    <p class="m-0 mb-3 text-xs leading-relaxed text-muted-foreground">
      本组为<strong>对内核算口径</strong>：录入收单通道成本率，供报表与毛利分析使用，<strong>不会</strong>改变顾客结账应付。
      对客现金折扣与卡付加价见支付中心「卡付规则与加价」（305、454）。
    </p>`;
}

export function renderFinanceProcessorFeeInputHtml(): string {
  const value = readFinanceProcessorFeePercent();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${escapeHtml(String(value))}"
        min="0"
        max="${MAX_PERCENT}"
        step="0.01"
        data-module-setting-number="${escapeHtml(FINANCE_PROCESSOR_FEE_FIELD_ID)}"
        data-module-setting-number-precision="2"
        aria-label="收单通道成本率"
      />
      <span class="text-sm text-muted-foreground">%</span>
      <span class="text-xs text-muted-foreground">仅用于报表与成本核算，不改变顾客应付；对客加价见支付中心「卡付加价策略」（454）。</span>
    </div>`;
}
