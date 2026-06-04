/**
 * 财务中心 · 现金付费折扣（seq 305，%）。
 */

import { readModuleSettingNumber } from "./module-settings-form-ui";

export const FINANCE_CASH_PAY_DISCOUNT_SEQ = 305;
export const FINANCE_CASH_PAY_DISCOUNT_FIELD_ID = "305-cash-pay-discount-percent";

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

export function readFinanceCashPayDiscountPercent(): number {
  return clampPercent(readModuleSettingNumber(FINANCE_CASH_PAY_DISCOUNT_FIELD_ID, 0));
}

export function isFinanceCashPayDiscountSeq(seq: number): boolean {
  return seq === FINANCE_CASH_PAY_DISCOUNT_SEQ;
}

export function renderFinanceCashPayDiscountInputHtml(): string {
  const value = readFinanceCashPayDiscountPercent();
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
        data-module-setting-number="${escapeHtml(FINANCE_CASH_PAY_DISCOUNT_FIELD_ID)}"
        data-module-setting-number-precision="2"
        aria-label="现金付费折扣"
      />
      <span class="text-sm text-muted-foreground">%</span>
      <span class="text-xs text-muted-foreground">使用现金支付时享受的折扣比率；0 表示不折扣。</span>
    </div>`;
}
