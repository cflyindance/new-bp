/**
 * 支付中心 · 卡交易 Batch 结算：日切调度、Batch 规则与后置打印（241 已归团队考勤）。
 */

import { renderModuleSettingCheckboxChoiceHtml } from "./module-settings-choice-ui";
import {
  moduleSettingStorageKey,
  readModuleSettingNumber,
  readModuleSettingText,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const BATCH_AUTO_CLOSE_TIME_SEQ = 238;
export const BATCH_SETTLEMENT_DAYS_SEQ = 230;
export const BATCH_UNBATCHED_LIMIT_SEQ = 236;
export const BATCH_POST_PRINT_SEQ = 235;
export const BATCH_ALLOW_PARTIAL_PAY_SEQ = 239;
export const BATCH_HANDLE_TIMEOUT_SEQ = 240;

export const PAYMENT_BATCH_TOGGLE_SEQS = [
  BATCH_ALLOW_PARTIAL_PAY_SEQ,
  BATCH_HANDLE_TIMEOUT_SEQ,
] as const;

export const BATCH_AUTO_CLOSE_HHMM_FIELD_ID = "238-auto-close-hhmm";
export const BATCH_SETTLEMENT_DAYS_FIELD_ID = "230-settlement-days";
export const BATCH_UNBATCHED_LIMIT_FIELD_ID = "236-unbatched-order-limit";
export const BATCH_POST_PRINT_FIELD_ID = "235-batch-post-print-report";

const BATCH_POST_PRINT_DEFAULT: BatchPostPrintReport[] = ["settlement-report"];

export const BATCH_POST_PRINT_OPTIONS = [
  { value: "credit-card-report", label: "信用卡报告单" },
  { value: "settlement-report", label: "结算单" },
] as const;

export type BatchPostPrintReport = (typeof BATCH_POST_PRINT_OPTIONS)[number]["value"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeHhmm(value: string, fallback: string): string {
  return /^\d{1,2}:\d{2}$/.test(value) ? value : fallback;
}

export function readBatchAutoCloseHhmm(): string {
  const stored = readModuleSettingText(BATCH_AUTO_CLOSE_HHMM_FIELD_ID, "23:00");
  return normalizeHhmm(stored, "23:00");
}

export function readBatchSettlementDays(): number {
  const n = readModuleSettingNumber(BATCH_SETTLEMENT_DAYS_FIELD_ID, 1);
  if (!Number.isFinite(n)) return 1;
  return Math.min(30, Math.max(0, Math.round(n)));
}

export function readBatchUnbatchedOrderLimit(): number {
  const n = readModuleSettingNumber(BATCH_UNBATCHED_LIMIT_FIELD_ID, 500);
  if (!Number.isFinite(n)) return 500;
  return Math.min(100000, Math.max(1, Math.round(n)));
}

function isBatchPostPrintReport(value: string): value is BatchPostPrintReport {
  return BATCH_POST_PRINT_OPTIONS.some((o) => o.value === value);
}

function normalizeBatchPostPrintReports(values: string[]): BatchPostPrintReport[] {
  const seen = new Set<BatchPostPrintReport>();
  const out: BatchPostPrintReport[] = [];
  for (const v of values) {
    if (!isBatchPostPrintReport(v) || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/** 从 localStorage 读取；兼容旧版单选字符串。 */
export function readBatchPostPrintReports(): BatchPostPrintReport[] {
  try {
    const raw = localStorage.getItem(moduleSettingStorageKey(BATCH_POST_PRINT_FIELD_ID));
    if (raw === null || raw === "") return [...BATCH_POST_PRINT_DEFAULT];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = normalizeBatchPostPrintReports(
          parsed.filter((v): v is string => typeof v === "string"),
        );
        return normalized.length > 0 ? normalized : [...BATCH_POST_PRINT_DEFAULT];
      }
    } catch {
      /* 非 JSON：按旧版单选迁移 */
    }
    if (isBatchPostPrintReport(raw)) return [raw];
  } catch {
    /* ignore */
  }
  return [...BATCH_POST_PRINT_DEFAULT];
}

export function writeBatchPostPrintReports(reports: BatchPostPrintReport[]): void {
  writeModuleSettingJson(BATCH_POST_PRINT_FIELD_ID, normalizeBatchPostPrintReports(reports));
}

export function isBatchAutoCloseTimeSeq(seq: number): boolean {
  return seq === BATCH_AUTO_CLOSE_TIME_SEQ;
}

export function isBatchSettlementDaysSeq(seq: number): boolean {
  return seq === BATCH_SETTLEMENT_DAYS_SEQ;
}

export function isBatchUnbatchedLimitSeq(seq: number): boolean {
  return seq === BATCH_UNBATCHED_LIMIT_SEQ;
}

export function isBatchPostPrintSeq(seq: number): boolean {
  return seq === BATCH_POST_PRINT_SEQ;
}

export function isPaymentBatchToggleSeq(seq: number): boolean {
  return (PAYMENT_BATCH_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function renderBatchSettlementGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组为<strong>卡交易 Batch</strong>与日切关账（238 每日关账时刻、230 向收单行结算周期等），<strong>不是</strong>现金班结。
      门店现金日结/班结见财务中心「现金日结与班结」（171、65、330）；员工下班卡 Batch 门禁见团队管理「考勤与工时」（241）。
    </p>`;
}

export function renderBatchAutoCloseTimeInputHtml(): string {
  const value = readBatchAutoCloseHhmm();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="time"
        class="h-9 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${escapeHtml(value)}"
        data-module-setting-text="${escapeHtml(BATCH_AUTO_CLOSE_HHMM_FIELD_ID)}"
        aria-label="自动关账时间"
      />
      <span class="text-xs text-muted-foreground">每日营业日结束自动关账/Batch 触发时刻（非收单结算天数）</span>
    </div>`;
}

export function renderBatchSettlementDaysInputHtml(): string {
  const value = readBatchSettlementDays();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${escapeHtml(String(value))}"
        min="0"
        max="30"
        data-module-setting-number="${escapeHtml(BATCH_SETTLEMENT_DAYS_FIELD_ID)}"
        aria-label="收单结算周期天数"
      />
      <span class="text-sm text-muted-foreground">天</span>
      <span class="text-xs text-muted-foreground">交易 Batch 后多少天向收单方自动结算（与 238 关账时刻不同）</span>
    </div>`;
}

export function renderBatchUnbatchedLimitInputHtml(): string {
  const value = readBatchUnbatchedOrderLimit();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${escapeHtml(String(value))}"
        min="1"
        max="100000"
        data-module-setting-number="${escapeHtml(BATCH_UNBATCHED_LIMIT_FIELD_ID)}"
        aria-label="未 Batch 订单数量上限"
      />
      <span class="text-xs text-muted-foreground">单</span>
    </div>`;
}

export function renderBatchPostPrintChoiceHtml(): string {
  const selected = new Set(readBatchPostPrintReports());
  const choices = renderModuleSettingCheckboxChoiceHtml({
    options: BATCH_POST_PRINT_OPTIONS,
    selectedValues: selected,
    checkboxDataAttr: "data-batch-post-print-choice",
    layout: "wrap",
  });
  return `
    <div data-batch-post-print-picker aria-label="Batch 后打印报告类型">
      <p class="mb-2 text-xs text-muted-foreground">可多选；Batch 完成后将按勾选类型分别打印。</p>
      ${choices}
    </div>`;
}

export function bindBatchPostPrintChoices(): void {
  document.querySelectorAll<HTMLElement>("[data-batch-post-print-picker]").forEach((picker) => {
    if (picker.dataset.batchPostPrintBound === "1") return;
    picker.dataset.batchPostPrintBound = "1";
    picker.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-batch-post-print-choice]")) return;
      const selected = [
        ...picker.querySelectorAll<HTMLInputElement>("[data-batch-post-print-choice]:checked"),
      ]
        .map((el) => el.value)
        .filter(isBatchPostPrintReport);
      writeBatchPostPrintReports(selected);
    });
  });
}
