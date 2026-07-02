/**
 * 支付中心 · 税务计算：445 基础税率、143 税基（折前/折后）；142/144/160 为开关项。290 已迁打印中心。
 */

import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingNumber,
  readModuleSettingRadio,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";

export const PAYMENT_BASE_TAX_RATE_SEQ = 445;
export const PAYMENT_TAX_DISCOUNT_BASE_SEQ = 143;

export const PAYMENT_TAX_POLICY_TOGGLE_SEQS = [142, 144, 160] as const;

export const PAYMENT_BASE_TAX_RATE_FIELD_ID = "445-base-tax-rate-percent";

export const PAYMENT_TAX_DISCOUNT_BASE_FIELD_ID = "143-tax-base-mode";

const TAX_DISCOUNT_BASE_GROUP = "module-setting-radio-143-tax-base";

const DEFAULT_TAX_RATE_PERCENT = 0;
const MIN_TAX_RATE = 0;
const MAX_TAX_RATE = 100;

export const PAYMENT_TAX_DISCOUNT_BASE_OPTIONS = [
  { value: "before-discount", label: "按折扣前金额计税" },
  { value: "after-discount", label: "按折扣后金额计税" },
] as const;

export type PaymentTaxDiscountBaseMode =
  (typeof PAYMENT_TAX_DISCOUNT_BASE_OPTIONS)[number]["value"];

function isValidTaxDiscountBaseMode(value: string): value is PaymentTaxDiscountBaseMode {
  return PAYMENT_TAX_DISCOUNT_BASE_OPTIONS.some((o) => o.value === value);
}

export function readBaseTaxRatePercent(): number {
  const n = readModuleSettingNumber(PAYMENT_BASE_TAX_RATE_FIELD_ID, DEFAULT_TAX_RATE_PERCENT);
  if (!Number.isFinite(n)) return DEFAULT_TAX_RATE_PERCENT;
  return Math.min(MAX_TAX_RATE, Math.max(MIN_TAX_RATE, n));
}

export function readPaymentTaxDiscountBaseMode(): PaymentTaxDiscountBaseMode {
  const stored = readModuleSettingRadio(PAYMENT_TAX_DISCOUNT_BASE_FIELD_ID, "after-discount");
  return isValidTaxDiscountBaseMode(stored) ? stored : "after-discount";
}

export function isPaymentBaseTaxRateSeq(seq: number): boolean {
  return seq === PAYMENT_BASE_TAX_RATE_SEQ;
}

export function isPaymentTaxDiscountBaseSeq(seq: number): boolean {
  return seq === PAYMENT_TAX_DISCOUNT_BASE_SEQ;
}

export function isPaymentTaxPolicyToggleSeq(seq: number): boolean {
  return (PAYMENT_TAX_POLICY_TOGGLE_SEQS as readonly number[]).includes(seq);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPaymentBaseTaxRateInputHtml(): string {
  const value = readBaseTaxRatePercent();
  const display = Number.isInteger(value) ? String(value) : String(value);
  return `
    <div class="flex flex-wrap items-center gap-2" data-payment-base-tax-rate>
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${escapeHtml(display)}"
        min="${MIN_TAX_RATE}"
        max="${MAX_TAX_RATE}"
        step="0.001"
        data-module-setting-number="${escapeHtml(PAYMENT_BASE_TAX_RATE_FIELD_ID)}"
        aria-label="基础税率百分比"
      />
      <span class="text-sm text-muted-foreground">%</span>
      <span class="text-xs text-muted-foreground">结账销售税主税率（组内 SSOT）</span>
    </div>`;
}

export function renderPaymentTaxDiscountBaseChoiceHtml(): string {
  return renderModuleSettingSingleChoiceHtml({
    options: PAYMENT_TAX_DISCOUNT_BASE_OPTIONS,
    fieldId: PAYMENT_TAX_DISCOUNT_BASE_FIELD_ID,
    groupName: TAX_DISCOUNT_BASE_GROUP,
    currentValue: readPaymentTaxDiscountBaseMode(),
    layout: "vertical",
    ariaLabel: "折扣与税基",
  });
}
