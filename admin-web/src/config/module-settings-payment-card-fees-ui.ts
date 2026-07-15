/**
 * 支付中心 · 卡付规则与加价（454 双重定价只读、543 卡加价策略、82/242 最低消费、172 未付价展示、243 签名门槛、180 留存）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  formatDualPricingSyncSceneLabel,
  getDualPricingSyncedRate,
  getDualPricingUpstreamSnapshot,
  isDualPricingActiveFromUpstream,
  simulateDualPricingSyncFailed,
  simulateDualPricingSyncSuccess,
  simulateDualPricingUpstreamNotConfigured,
} from "./dual-pricing-upstream";
import {
  DP_TASK_STATUS_LABEL_ZH,
  DP_TASK_TYPE_LABEL_ZH,
  isDpTaskRetryable,
  listDualPricingTasks,
  retryDualPricingTask,
  type DpTaskListItem,
  type DpTaskListStatus,
} from "./dual-pricing-tasks";
import {
  PAYMENT_PRODUCT_LINES,
  type PaymentProductLineId,
} from "./module-settings-payment-methods-ui";
import {
  readModuleSettingJson,
  readModuleSettingNumber,
  readModuleSettingText,
  writeModuleSettingJson,
  writeModuleSettingNumber,
  writeModuleSettingText,
} from "./module-settings-form-ui";


export const MEMBER_CARD_MIN_SPEND_SEQ = 82;
export const CARD_MIN_SPEND_SEQ = 242;
export const CARD_SIGNATURE_THRESHOLD_SEQ = 243;
export const MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_SEQ = 180;
export const RECEIPT_UNPAID_PRICE_DISPLAY_SEQ = 172;
/** 双重定价比例（上游同步，设置页只读） */
export const DUAL_PRICING_RATE_SEQ = 454;
/** 卡加价策略：不加价 / 整单加收（双重定价生效时隐藏） */
export const CARD_PRICING_STRATEGY_SEQ = 543;
/** @deprecated 使用 DUAL_PRICING_RATE_SEQ；保留别名避免旧引用断裂 */
export const CARD_PRICING_STRATEGY_LEGACY_SEQ = 454;

const MEMBER_CARD_MIN_SPEND_STORAGE_ID = "82-member-card-min-spend-by-line";
const CARD_MIN_SPEND_STORAGE_ID = "242-card-min-spend-by-line";
const CARD_SIGNATURE_MIN_STORAGE_ID = "243-card-signature-min-by-line";
export const MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_FIELD_ID =
  "180-merchantcopy-signature-retention-days";
const RECEIPT_UNPAID_PRICE_DISPLAY_STORAGE_ID = "172-receipt-unpaid-price-display";
/** 历史字段名保留，避免已有 localStorage 丢失；语义改为 none|surcharge */
const CARD_PRICING_STORAGE_ID = "454-card-pricing-strategy";

const MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_DEFAULT = 90;
const MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_MAX = 365;
const RECEIPT_UNPAID_PRICE_CUSTOM_LABEL_MAX = 64;

const LEGACY_MEMBER_MIN_SPEND_FIELD_IDS = ["82-member-card-min-spend", "82-card-min-spend"] as const;
const LEGACY_MIN_SPEND_FIELD_IDS = ["242-card-min-payment", "512-card-min-spend"] as const;
const LEGACY_SIGNATURE_MIN_FIELD_IDS = ["243-card-signature-min-amount"] as const;

/** 设置页可编辑的策略；双重定价不在此枚举 */
export type CardPricingMode = "none" | "surcharge";

export type ReceiptUnpaidPriceType = "cash" | "card" | "custom";

export type ReceiptUnpaidPriceDisplay = {
  priceType: ReceiptUnpaidPriceType;
  customLabel: string;
};

export type CardPricingStrategy = {
  mode: CardPricingMode;
  percent: number;
};

export type CardMinSpendByLine = Record<PaymentProductLineId, number>;

/** @alias CardMinSpendByLine */
export type CardSignatureMinByLine = CardMinSpendByLine;

const INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TEXT_INPUT_CLASS =
  "h-9 w-full min-w-[12rem] max-w-md rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const CARD_PRICING_MODE_OPTIONS = [
  { value: "none", label: "不加价（现金与卡付同价）" },
  { value: "surcharge", label: "整单加收" },
] as const;

const RECEIPT_UNPAID_PRICE_TYPE_OPTIONS = [
  { value: "cash", label: "现金价" },
  { value: "card", label: "信用卡价" },
  { value: "custom", label: "自定义" },
] as const;

const MAX_SURCHARGE_PERCENT = 4;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function defaultAmountByLine(): CardMinSpendByLine {
  return { pos: 0, kiosk: 0, emenu: 0, paypad: 0 };
}

function normalizeAmountByLine(raw: Partial<CardMinSpendByLine>): CardMinSpendByLine {
  const base = defaultAmountByLine();
  for (const line of PAYMENT_PRODUCT_LINES) {
    const v = Number(raw[line.id]);
    base[line.id] = clampMoney(v);
  }
  return base;
}

function readLegacySingleAmount(fieldIds: readonly string[]): number | null {
  for (const fieldId of fieldIds) {
    const n = readModuleSettingNumber(fieldId, NaN);
    if (Number.isFinite(n) && n > 0) return clampMoney(n);
  }
  return null;
}

function readAmountByLine(
  storageId: string,
  legacyFieldIds: readonly string[],
): CardMinSpendByLine {
  const raw = readModuleSettingJson<Partial<CardMinSpendByLine>>(storageId, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeAmountByLine(raw);
  }
  const legacy = readLegacySingleAmount(legacyFieldIds);
  if (legacy !== null) {
    const all = defaultAmountByLine();
    for (const line of PAYMENT_PRODUCT_LINES) all[line.id] = legacy;
    return all;
  }
  return defaultAmountByLine();
}

function writeAmountByLine(storageId: string, values: CardMinSpendByLine): void {
  writeModuleSettingJson(storageId, normalizeAmountByLine(values));
}

export function readCardMinSpendByLine(): CardMinSpendByLine {
  return readAmountByLine(CARD_MIN_SPEND_STORAGE_ID, LEGACY_MIN_SPEND_FIELD_IDS);
}

export function writeCardMinSpendByLine(values: CardMinSpendByLine): void {
  writeAmountByLine(CARD_MIN_SPEND_STORAGE_ID, values);
}

export function readMemberCardMinSpendByLine(): CardMinSpendByLine {
  return readAmountByLine(MEMBER_CARD_MIN_SPEND_STORAGE_ID, LEGACY_MEMBER_MIN_SPEND_FIELD_IDS);
}

export function writeMemberCardMinSpendByLine(values: CardMinSpendByLine): void {
  writeAmountByLine(MEMBER_CARD_MIN_SPEND_STORAGE_ID, values);
}

export function readCardSignatureMinByLine(): CardSignatureMinByLine {
  return readAmountByLine(CARD_SIGNATURE_MIN_STORAGE_ID, LEGACY_SIGNATURE_MIN_FIELD_IDS);
}

export function writeCardSignatureMinByLine(values: CardSignatureMinByLine): void {
  writeAmountByLine(CARD_SIGNATURE_MIN_STORAGE_ID, values);
}

function clampMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_SURCHARGE_PERCENT, Math.max(0, Math.round(n * 100) / 100));
}

function clampRetentionDays(n: number): number {
  if (!Number.isFinite(n)) return MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_DEFAULT;
  return Math.min(
    MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_MAX,
    Math.max(0, Math.round(n)),
  );
}

export function readMerchantcopySignatureRetentionDays(): number {
  return clampRetentionDays(
    readModuleSettingNumber(
      MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_FIELD_ID,
      MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_DEFAULT,
    ),
  );
}

export function writeMerchantcopySignatureRetentionDays(days: number): void {
  writeModuleSettingNumber(
    MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_FIELD_ID,
    clampRetentionDays(days),
  );
}

function isValidPricingMode(value: string): value is CardPricingMode {
  return value === "none" || value === "surcharge";
}

function readLegacy543SurchargeEnabled(): boolean {
  return readModuleSettingNumber("543-card-surcharge-enabled", 0) > 0;
}

function normalizeCardPricingStrategy(raw: Partial<CardPricingStrategy> & { mode?: string }): CardPricingStrategy {
  const rawMode = String(raw.mode ?? "");
  // 遗留 dual-pricing：设置页不再可编辑；无上游开通时回落不加价
  const mode: CardPricingMode =
    rawMode === "surcharge" || isValidPricingMode(rawMode)
      ? (rawMode === "surcharge" ? "surcharge" : "none")
      : "none";
  return { mode, percent: clampPercent(Number(raw.percent)) };
}

export function readCardPricingStrategy(): CardPricingStrategy {
  const raw = readModuleSettingJson<Partial<CardPricingStrategy> & { mode?: string }>(
    CARD_PRICING_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && raw.mode) {
    if (String(raw.mode) === "dual-pricing") {
      return { mode: "none", percent: 0 };
    }
    return normalizeCardPricingStrategy(raw);
  }
  // 旧 454 百分比仅作历史遗留；费率改由上游 Snapshot 展示，不再推导 dual 模式
  const legacy543 = readModuleSettingNumber("543-surcharge-percent", NaN);
  if (readLegacy543SurchargeEnabled() || (Number.isFinite(legacy543) && legacy543 > 0)) {
    return {
      mode: "surcharge",
      percent: clampPercent(Number.isFinite(legacy543) ? legacy543 : 3),
    };
  }
  return { mode: "none", percent: 0 };
}

export function writeCardPricingStrategy(strategy: CardPricingStrategy): void {
  writeModuleSettingJson(CARD_PRICING_STORAGE_ID, normalizeCardPricingStrategy(strategy));
}

function isValidReceiptUnpaidPriceType(value: string): value is ReceiptUnpaidPriceType {
  return value === "cash" || value === "card" || value === "custom";
}

function normalizeCustomLabel(value: string): string {
  return value.trim().slice(0, RECEIPT_UNPAID_PRICE_CUSTOM_LABEL_MAX);
}

function normalizeReceiptUnpaidPriceDisplay(
  raw: Partial<ReceiptUnpaidPriceDisplay>,
): ReceiptUnpaidPriceDisplay {
  const priceType = isValidReceiptUnpaidPriceType(String(raw.priceType ?? ""))
    ? raw.priceType!
    : "cash";
  return {
    priceType,
    customLabel: normalizeCustomLabel(String(raw.customLabel ?? "")),
  };
}

export function readReceiptUnpaidPriceDisplay(): ReceiptUnpaidPriceDisplay {
  const raw = readModuleSettingJson<Partial<ReceiptUnpaidPriceDisplay>>(
    RECEIPT_UNPAID_PRICE_DISPLAY_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && raw.priceType) {
    return normalizeReceiptUnpaidPriceDisplay(raw);
  }
  const legacyType = readModuleSettingText("172-unpaid-price-type", "").trim();
  const legacyLabel = readModuleSettingText("172-unpaid-price-custom-label", "").trim();
  if (isValidReceiptUnpaidPriceType(legacyType)) {
    return normalizeReceiptUnpaidPriceDisplay({
      priceType: legacyType,
      customLabel: legacyLabel,
    });
  }
  return { priceType: "cash", customLabel: "" };
}

export function writeReceiptUnpaidPriceDisplay(display: ReceiptUnpaidPriceDisplay): void {
  const normalized = normalizeReceiptUnpaidPriceDisplay(display);
  writeModuleSettingJson(RECEIPT_UNPAID_PRICE_DISPLAY_STORAGE_ID, normalized);
}

/** @deprecated 使用 readCardSignatureMinByLine() */
export function readCardSignatureMinAmount(): number {
  return readCardSignatureMinByLine().pos;
}

function renderAmountByLineTableHtml(options: {
  editorAttr: string;
  lineDataAttr: string;
  values: CardMinSpendByLine;
  valueHeader: string;
  valueAriaSuffix: string;
  hint: string;
}): string {
  const rows = PAYMENT_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex items-center gap-1.5">
          <input
            type="number"
            inputmode="decimal"
            class="${INPUT_CLASS} max-w-[8rem]"
            value="${escapeHtml(String(options.values[line.id]))}"
            min="0"
            step="0.01"
            ${options.lineDataAttr}="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(options.valueAriaSuffix)}"
          />
          <span class="shrink-0 text-sm text-muted-foreground">元</span>
        </div>
      </td>
    </tr>`,
  ).join("");

  return `
    <div ${options.editorAttr} class="space-y-2">
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[16rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">产线</th>
            <th class="px-3 py-2 font-medium">${escapeHtml(options.valueHeader)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="mt-2 text-xs text-muted-foreground">${escapeHtml(options.hint)}</p>
    </div>`;
}

export function isMemberCardMinSpendSeq(seq: number): boolean {
  return seq === MEMBER_CARD_MIN_SPEND_SEQ;
}

export function isCardMinSpendSeq(seq: number): boolean {
  return seq === CARD_MIN_SPEND_SEQ;
}

export function isDualPricingRateSeq(seq: number): boolean {
  return seq === DUAL_PRICING_RATE_SEQ;
}

export function isCardPricingStrategySeq(seq: number): boolean {
  return seq === CARD_PRICING_STRATEGY_SEQ;
}

/** 上游已开通双重定价时，从设置列表中隐藏「卡加价策略」行 */
export function filterCardFeesCatalogItemsForDualPricing<T extends { seq: number }>(
  items: readonly T[],
): T[] {
  if (!isDualPricingActiveFromUpstream()) return items.slice();
  return items.filter((item) => item.seq !== CARD_PRICING_STRATEGY_SEQ);
}

export function isCardSignatureThresholdSeq(seq: number): boolean {
  return seq === CARD_SIGNATURE_THRESHOLD_SEQ;
}

export function isMerchantcopySignatureRetentionDaysSeq(seq: number): boolean {
  return seq === MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_SEQ;
}

export function isReceiptUnpaidPriceDisplaySeq(seq: number): boolean {
  return seq === RECEIPT_UNPAID_PRICE_DISPLAY_SEQ;
}

export function renderCardFeesGroupIntroHtml(): string {
  return "";
}

export function renderMemberCardMinSpendByLineTableHtml(): string {
  return renderAmountByLineTableHtml({
    editorAttr: "data-member-card-min-spend-editor",
    lineDataAttr: "data-member-card-min-spend-line",
    values: readMemberCardMinSpendByLine(),
    valueHeader: "会员卡最低消费",
    valueAriaSuffix: "最低消费",
    hint: "订单金额低于该值时，对应产线不可使用会员卡支付。0 表示不限制。",
  });
}

export function renderCardMinSpendByLineTableHtml(): string {
  return renderAmountByLineTableHtml({
    editorAttr: "data-card-min-spend-editor",
    lineDataAttr: "data-card-min-spend-line",
    values: readCardMinSpendByLine(),
    valueHeader: "信用卡最低消费",
    valueAriaSuffix: "最低消费",
    hint: "订单金额低于该值时，对应产线不可选择信用卡支付。0 表示不限制。",
  });
}

function renderCardPricingPercentInput(strategy: CardPricingStrategy): string {
  const disabled = strategy.mode === "none";
  return `
    <div class="flex flex-wrap items-center gap-2 ${disabled ? "opacity-50" : ""}">
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
        value="${escapeHtml(String(strategy.percent))}"
        min="0"
        max="${MAX_SURCHARGE_PERCENT}"
        step="0.01"
        data-card-pricing-percent
        ${disabled ? "disabled" : ""}
        aria-label="整单加收比例"
      />
      <span class="text-sm text-muted-foreground">%</span>
    </div>`;
}

function statusBadgeClassForTask(status: DpTaskListStatus): string {
  if (status === "dispatch_ok") return "text-emerald-700 dark:text-emerald-400";
  if (status === "config_failed" || status === "dispatch_failed") return "text-destructive";
  return "text-muted-foreground";
}

function formatTaskUpdatedAtCell(updatedAt: string): string {
  const parts = updatedAt.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `<span class="inline-block leading-tight">${escapeHtml(parts[0]!)}<br />${escapeHtml(parts.slice(1).join(" "))}</span>`;
  }
  return escapeHtml(updatedAt);
}

function renderDpTaskTableRows(rows: DpTaskListItem[]): string {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="7" class="px-4 py-12 text-center text-sm text-muted-foreground">暂无 Dual Pricing 任务</td>
      </tr>`;
  }
  return rows
    .map((t) => {
      const retryable = isDpTaskRetryable(t);
      const op = retryable
        ? `<button type="button" class="font-medium text-primary underline-offset-2 hover:underline" data-dp-task-retry="${escapeHtml(t.taskId)}">更新</button>`
        : `<span class="text-muted-foreground">/</span>`;
      return `
      <tr class="border-b border-border/60 hover:bg-muted/30">
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(t.taskId)}</td>
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(t.caseNumber)}</td>
        <td class="px-4 py-2.5 text-center text-sm">${escapeHtml(DP_TASK_TYPE_LABEL_ZH[t.type])}</td>
        <td class="px-4 py-2.5 text-center text-sm tabular-nums">${escapeHtml(`${t.rate}%`)}</td>
        <td class="px-4 py-2.5 text-center text-sm ${statusBadgeClassForTask(t.status)}">${escapeHtml(DP_TASK_STATUS_LABEL_ZH[t.status])}</td>
        <td class="px-4 py-2.5 text-center text-sm">${formatTaskUpdatedAtCell(t.updatedAt)}</td>
        <td class="px-4 py-2.5 text-center text-sm">${op}</td>
      </tr>`;
    })
    .join("");
}

function renderDualPricingTaskListDialogHtml(): string {
  const rows = listDualPricingTasks();
  return `
    <div class="fixed inset-0 z-[80] flex items-center justify-center p-4" data-dp-task-list-overlay>
      <button type="button" class="absolute inset-0 bg-black/40" data-dp-task-list-close aria-label="关闭"></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-task-list-title"
        class="relative z-[1] flex max-h-[min(85vh,40rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        data-dp-task-list-dialog
      >
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="dp-task-list-title" class="text-base font-semibold text-foreground">任务列表</h2>
          <button type="button" class="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" data-dp-task-list-close>关闭</button>
        </div>
        <div class="min-h-0 flex-1 overflow-auto p-4">
          <div class="overflow-auto rounded-lg border border-border">
            <table class="w-full min-w-[800px] border-collapse">
              <thead class="sticky top-0 z-[1]">
                <tr class="bg-muted text-foreground">
                  <th class="px-4 py-2.5 text-center text-sm font-medium">任务ID</th>
                  <th class="px-4 py-2.5 text-center text-sm font-medium">case number</th>
                  <th class="px-4 py-2.5 text-center text-sm font-medium">类型</th>
                  <th class="px-4 py-2.5 text-center text-sm font-medium">rate</th>
                  <th class="px-4 py-2.5 text-center text-sm font-medium">状态</th>
                  <th class="px-4 py-2.5 text-center text-sm font-medium">更新时间</th>
                  <th class="px-4 py-2.5 text-center text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody data-dp-task-list-tbody>${renderDpTaskTableRows(rows)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
}

function refreshDualPricingTaskListTable(): void {
  const tbody = document.querySelector("[data-dp-task-list-tbody]");
  if (tbody) tbody.innerHTML = renderDpTaskTableRows(listDualPricingTasks());
}

function closeDualPricingTaskListDialog(): void {
  document.querySelector("[data-dp-task-list-overlay]")?.remove();
  if (dpTaskListEscHandler) {
    document.removeEventListener("keydown", dpTaskListEscHandler);
    dpTaskListEscHandler = null;
  }
}

let dpTaskListEscHandler: ((e: KeyboardEvent) => void) | null = null;

export function openDualPricingTaskListDialog(): void {
  closeDualPricingTaskListDialog();
  document.body.insertAdjacentHTML("beforeend", renderDualPricingTaskListDialogHtml());
  const overlay = document.querySelector("[data-dp-task-list-overlay]");
  if (!overlay) return;

  dpTaskListEscHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeDualPricingTaskListDialog();
  };
  document.addEventListener("keydown", dpTaskListEscHandler);

  overlay.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-dp-task-list-close]")) {
      closeDualPricingTaskListDialog();
      return;
    }
    const retryBtn = t.closest<HTMLElement>("[data-dp-task-retry]");
    if (retryBtn) {
      const id = retryBtn.getAttribute("data-dp-task-retry");
      if (id) retryDualPricingTask(id);
      refreshDualPricingTaskListTable();
    }
  });
}

export function renderDualPricingRateReadonlyHtml(): string {
  const snap = getDualPricingUpstreamSnapshot();
  const scene = snap?.scene ?? "upstream_not_configured";
  const rate = getDualPricingSyncedRate();
  const display = rate == null || Number.isNaN(rate) ? "/" : `${rate}%`;
  const sceneLabel = formatDualPricingSyncSceneLabel(scene);
  const statusOnly = scene === "upstream_not_configured" || scene === "sync_failed";
  const showTaskListLink = scene === "sync_failed";

  const btnClass =
    "inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const taskListLink = showTaskListLink
    ? `<button type="button" class="text-sm font-medium text-primary underline-offset-2 hover:underline" data-dp-open-task-list>任务列表</button>`
    : "";

  const statusRow = statusOnly
    ? `<span
          class="inline-flex h-9 min-w-[6rem] items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground"
          aria-label="双重定价状态"
          data-dual-pricing-scene
        >${escapeHtml(sceneLabel)}</span>
        ${taskListLink}`
    : `<span
          class="inline-flex h-9 min-w-[6rem] items-center rounded-md border border-input bg-muted/40 px-3 text-sm tabular-nums text-foreground"
          aria-label="双重定价比例（只读）"
          data-dual-pricing-scene
        >${escapeHtml(display)}</span>`;

  const receiptBlock =
    scene === "synced"
      ? `
      <div class="space-y-3 border-t border-border pt-4" data-dp-receipt-unpaid-synced>
        <div class="min-w-0 flex flex-col gap-1">
          <span class="text-sm font-medium text-card-foreground">Receipt (Unpaid) Display</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex h-9 min-w-[6rem] items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground"
            aria-label="Receipt Unpaid Display（只读）"
          >Card Price</span>
        </div>
      </div>`
      : "";

  return `
    <div class="space-y-3" data-dual-pricing-rate-readonly>
      <div class="flex flex-wrap items-center gap-2">
        ${statusRow}
      </div>
      ${receiptBlock}
      <div class="flex flex-wrap gap-2 pt-1" role="group" aria-label="双重定价同步演示">
        <button type="button" class="${btnClass}" data-dp-sim="upstream-not-configured">模拟：上游未配置</button>
        <button type="button" class="${btnClass}" data-dp-sim="sync-failed">模拟：上游同步失败</button>
        <button type="button" class="${btnClass}" data-dp-sim="sync-success">模拟：同步成功并下发</button>
      </div>
    </div>`;
}

export function renderCardPricingStrategyHtml(): string {
  const strategy = readCardPricingStrategy();
  const groupName = "card-pricing-strategy-mode";
  const radios = CARD_PRICING_MODE_OPTIONS.map((opt) => {
    const checked = strategy.mode === opt.value;
    return `
      <label class="flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${groupName}"
          value="${escapeHtml(opt.value)}"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} mt-0.5"
          ${checked ? "checked" : ""}
          data-card-pricing-mode
          aria-label="${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  const modeHint =
    strategy.mode === "surcharge"
      ? "仅在选择信用卡支付时，在订单总额上加收该比例；与订单中心「加收」预设（447）不同。"
      : "现金与信用卡支付使用同一应付金额。双重定价由上游同步，见同组「双重定价」。";

  return `
    <div class="space-y-3" data-card-pricing-editor>
      <div class="flex flex-col gap-2" role="radiogroup" aria-label="卡加价策略">${radios}</div>
      ${renderCardPricingPercentInput(strategy)}
      <p class="text-xs text-muted-foreground" data-card-pricing-hint>${escapeHtml(modeHint)}</p>
    </div>`;
}

export function renderCardSignatureThresholdInputHtml(): string {
  return renderAmountByLineTableHtml({
    editorAttr: "data-card-signature-min-editor",
    lineDataAttr: "data-card-signature-min-line",
    values: readCardSignatureMinByLine(),
    valueHeader: "信用卡签名最低金额",
    valueAriaSuffix: "签名最低金额",
    hint: "卡交易金额达到该值时要求电子签名；低于该值且终端已开启签名页时可跳过。0 表示任意金额均需签名（若终端开启）。",
  });
}

export function renderMerchantcopySignatureRetentionDaysInputHtml(): string {
  const value = readMerchantcopySignatureRetentionDays();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${escapeHtml(String(value))}"
        min="0"
        max="${MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_MAX}"
        data-module-setting-number="${escapeHtml(MERCHANTCOPY_SIGNATURE_RETENTION_DAYS_FIELD_ID)}"
        aria-label="Merchantcopy 电子签名存储天数"
      />
      <span class="text-sm text-muted-foreground">天</span>
      <span class="text-xs text-muted-foreground">商互联 Merchantcopy 签购单电子签名影像在终端本地的保留时长；0 表示不保留</span>
    </div>`;
}

function renderReceiptUnpaidPriceCustomInput(display: ReceiptUnpaidPriceDisplay): string {
  const disabled = display.priceType !== "custom";
  return `
    <div class="space-y-1.5 ${disabled ? "opacity-50" : ""}" data-receipt-unpaid-price-custom-wrap>
      <label class="text-xs text-muted-foreground" for="receipt-unpaid-price-custom-label">自定义说明</label>
      <input
        id="receipt-unpaid-price-custom-label"
        type="text"
        class="${TEXT_INPUT_CLASS}"
        value="${escapeHtml(display.customLabel)}"
        placeholder="如：牌价、会员价、外卖专享价"
        data-receipt-unpaid-price-custom-label
        maxlength="${RECEIPT_UNPAID_PRICE_CUSTOM_LABEL_MAX}"
        ${disabled ? "disabled" : ""}
        autocomplete="off"
        aria-label="收据未付价格自定义说明"
      />
      <p class="text-xs text-muted-foreground" data-receipt-unpaid-price-hint>
        ${disabled ? "选择「自定义」后可输入票面上展示的价格口径说明。" : "该文案将用于收据未付金额旁的价格口径标识。"}
      </p>
    </div>`;
}

export function renderReceiptUnpaidPriceDisplayHtml(): string {
  const display = readReceiptUnpaidPriceDisplay();
  const groupName = "receipt-unpaid-price-type";
  const radios = RECEIPT_UNPAID_PRICE_TYPE_OPTIONS.map((opt) => {
    const checked = display.priceType === opt.value;
    return `
      <label class="flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${groupName}"
          value="${escapeHtml(opt.value)}"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} mt-0.5"
          ${checked ? "checked" : ""}
          data-receipt-unpaid-price-type
          aria-label="${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div class="space-y-3" data-receipt-unpaid-price-editor>
      <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4" role="radiogroup" aria-label="收据未付价格口径">${radios}</div>
      ${renderReceiptUnpaidPriceCustomInput(display)}
    </div>`;
}

function collectAmountByLineFromRoot(
  root: ParentNode,
  lineDataAttr: string,
  readValues: () => CardMinSpendByLine,
): CardMinSpendByLine {
  const values = readValues();
  root.querySelectorAll<HTMLInputElement>(`[${lineDataAttr}]`).forEach((input) => {
    const lineId = input.getAttribute(lineDataAttr) as PaymentProductLineId | null;
    if (!lineId) return;
    values[lineId] = clampMoney(Number(input.value));
  });
  return values;
}

function collectMinSpendFromRoot(root: ParentNode): CardMinSpendByLine {
  return collectAmountByLineFromRoot(
    root,
    "data-card-min-spend-line",
    readCardMinSpendByLine,
  );
}

function collectMemberMinSpendFromRoot(root: ParentNode): CardMinSpendByLine {
  return collectAmountByLineFromRoot(
    root,
    "data-member-card-min-spend-line",
    readMemberCardMinSpendByLine,
  );
}

function collectSignatureMinFromRoot(root: ParentNode): CardSignatureMinByLine {
  return collectAmountByLineFromRoot(
    root,
    "data-card-signature-min-line",
    readCardSignatureMinByLine,
  );
}

function readPricingModeFromEditor(editor: HTMLElement): CardPricingMode {
  const checked = editor.querySelector<HTMLInputElement>("[data-card-pricing-mode]:checked");
  const value = checked?.value ?? "";
  return isValidPricingMode(value) ? value : "none";
}

function syncCardPricingEditorUi(editor: HTMLElement): void {
  const mode = readPricingModeFromEditor(editor);
  const percentInput = editor.querySelector<HTMLInputElement>("[data-card-pricing-percent]");
  const hint = editor.querySelector("[data-card-pricing-hint]");
  if (percentInput) {
    const disabled = mode === "none";
    percentInput.disabled = disabled;
    percentInput.closest("div")?.classList.toggle("opacity-50", disabled);
  }
  if (hint) {
    hint.textContent =
      mode === "surcharge"
        ? "仅在选择信用卡支付时，在订单总额上加收该比例；与订单中心「加收」预设（447）不同。"
        : "现金与信用卡支付使用同一应付金额。双重定价由上游同步，见同组「双重定价」。";
  }
}

function persistCardPricingEditor(editor: HTMLElement): void {
  const mode = readPricingModeFromEditor(editor);
  const percent = Number(editor.querySelector<HTMLInputElement>("[data-card-pricing-percent]")?.value);
  writeCardPricingStrategy({
    mode,
    percent: mode === "none" ? 0 : clampPercent(percent),
  });
}

function readReceiptUnpaidPriceTypeFromEditor(editor: HTMLElement): ReceiptUnpaidPriceType {
  const checked = editor.querySelector<HTMLInputElement>("[data-receipt-unpaid-price-type]:checked");
  const value = checked?.value ?? "";
  return isValidReceiptUnpaidPriceType(value) ? value : "cash";
}

function syncReceiptUnpaidPriceEditorUi(editor: HTMLElement): void {
  const priceType = readReceiptUnpaidPriceTypeFromEditor(editor);
  const customWrap = editor.querySelector<HTMLElement>("[data-receipt-unpaid-price-custom-wrap]");
  const customInput = editor.querySelector<HTMLInputElement>("[data-receipt-unpaid-price-custom-label]");
  const hint = editor.querySelector("[data-receipt-unpaid-price-hint]");
  const disabled = priceType !== "custom";
  customWrap?.classList.toggle("opacity-50", disabled);
  if (customInput) customInput.disabled = disabled;
  if (hint) {
    hint.textContent = disabled
      ? "选择「自定义」后可输入票面上展示的价格口径说明。"
      : "该文案将用于收据未付金额旁的价格口径标识。";
  }
}

function persistReceiptUnpaidPriceEditor(editor: HTMLElement): void {
  const priceType = readReceiptUnpaidPriceTypeFromEditor(editor);
  const customLabel =
    editor.querySelector<HTMLInputElement>("[data-receipt-unpaid-price-custom-label]")?.value ?? "";
  writeReceiptUnpaidPriceDisplay({ priceType, customLabel });
}

function bindAmountByLineEditors(options: {
  root: ParentNode;
  editorSelector: string;
  lineSelector: string;
  boundKey: string;
  persist: (values: CardMinSpendByLine) => void;
  collect: (root: ParentNode) => CardMinSpendByLine;
}): void {
  options.root.querySelectorAll<HTMLElement>(options.editorSelector).forEach((editor) => {
    if (editor.dataset[options.boundKey] === "1") return;
    editor.dataset[options.boundKey] = "1";
    const save = () => options.persist(options.collect(editor));
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches(options.lineSelector)) save();
    });
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches(options.lineSelector)) save();
    });
  });
}

export function bindMemberCardMinSpendEditors(root: ParentNode = document): void {
  bindAmountByLineEditors({
    root,
    editorSelector: "[data-member-card-min-spend-editor]",
    lineSelector: "[data-member-card-min-spend-line]",
    boundKey: "memberCardMinSpendEditorBound",
    persist: writeMemberCardMinSpendByLine,
    collect: collectMemberMinSpendFromRoot,
  });
}

export function bindCardMinSpendEditors(root: ParentNode = document): void {
  bindAmountByLineEditors({
    root,
    editorSelector: "[data-card-min-spend-editor]",
    lineSelector: "[data-card-min-spend-line]",
    boundKey: "cardMinSpendEditorBound",
    persist: writeCardMinSpendByLine,
    collect: collectMinSpendFromRoot,
  });
}

export function bindCardPricingStrategyEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-card-pricing-editor]").forEach((editor) => {
    if (editor.dataset.cardPricingEditorBound === "1") return;
    editor.dataset.cardPricingEditorBound = "1";
    syncCardPricingEditorUi(editor);
    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-card-pricing-mode]")) {
        syncCardPricingEditorUi(editor);
        persistCardPricingEditor(editor);
        return;
      }
      if (el.matches("[data-card-pricing-percent]")) persistCardPricingEditor(editor);
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-card-pricing-percent]")) {
        persistCardPricingEditor(editor);
      }
    });
  });
}

export function bindCardSignatureMinEditors(root: ParentNode = document): void {
  bindAmountByLineEditors({
    root,
    editorSelector: "[data-card-signature-min-editor]",
    lineSelector: "[data-card-signature-min-line]",
    boundKey: "cardSignatureMinEditorBound",
    persist: writeCardSignatureMinByLine,
    collect: collectSignatureMinFromRoot,
  });
}

export function bindReceiptUnpaidPriceDisplayEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-receipt-unpaid-price-editor]").forEach((editor) => {
    if (editor.dataset.receiptUnpaidPriceEditorBound === "1") return;
    editor.dataset.receiptUnpaidPriceEditorBound = "1";
    syncReceiptUnpaidPriceEditorUi(editor);
    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-receipt-unpaid-price-type]")) {
        syncReceiptUnpaidPriceEditorUi(editor);
        persistReceiptUnpaidPriceEditor(editor);
        return;
      }
      if (el.matches("[data-receipt-unpaid-price-custom-label]")) {
        persistReceiptUnpaidPriceEditor(editor);
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-receipt-unpaid-price-custom-label]")) {
        persistReceiptUnpaidPriceEditor(editor);
      }
    });
    editor.addEventListener("blur", (e) => {
      if ((e.target as HTMLElement).matches("[data-receipt-unpaid-price-custom-label]")) {
        persistReceiptUnpaidPriceEditor(editor);
      }
    });
  });
}

export function bindDualPricingUpstreamSimButtons(
  root: ParentNode = document,
  remount?: () => void,
): void {
  root.querySelectorAll<HTMLElement>("[data-dual-pricing-rate-readonly]").forEach((wrap) => {
    if (wrap.dataset.dpSimBound === "1") return;
    wrap.dataset.dpSimBound = "1";
    wrap.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-dp-open-task-list]")) {
        e.preventDefault();
        openDualPricingTaskListDialog();
        return;
      }
      const btn = t.closest<HTMLElement>("[data-dp-sim]");
      if (!btn || !wrap.contains(btn)) return;
      e.preventDefault();
      const action = btn.getAttribute("data-dp-sim");
      if (action === "upstream-not-configured") {
        simulateDualPricingUpstreamNotConfigured();
      } else if (action === "sync-failed") {
        simulateDualPricingSyncFailed();
      } else if (action === "sync-success") {
        simulateDualPricingSyncSuccess();
        writeReceiptUnpaidPriceDisplay({ priceType: "card", customLabel: "" });
      } else {
        return;
      }
      remount?.();
    });
  });
}

export function bindCardFeesEditors(root: ParentNode = document, remount?: () => void): void {
  bindMemberCardMinSpendEditors(root);
  bindCardMinSpendEditors(root);
  bindCardPricingStrategyEditors(root);
  bindCardSignatureMinEditors(root);
  bindReceiptUnpaidPriceDisplayEditors(root);
  bindDualPricingUpstreamSimButtons(root, remount);
}
