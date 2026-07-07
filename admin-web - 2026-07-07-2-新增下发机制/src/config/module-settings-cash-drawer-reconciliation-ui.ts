/**
 * 财务中心 · 钱箱备款与平账（seq 63、76、181）。
 * 63 开班备款 + 可选硬币卷（原 64）；76 容差金额；181 超差提醒开关。
 */

import {
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";

export const CASH_DRAWER_FLOAT_SEQ = 63;
export const CASH_DRAWER_TOLERANCE_SEQ = 76;
export const CASH_DRAWER_VARIANCE_ALERT_SEQ = 181;

/** 181 超差提醒 */
export const CASH_DRAWER_RECONCILIATION_TOGGLE_SEQS: readonly number[] = [
  CASH_DRAWER_VARIANCE_ALERT_SEQ,
];

const FLOAT_AMOUNT_FIELD_ID = "63-cash-drawer-float-amount";
const COIN_ROLL_COUNTS_FIELD_ID = "64-coin-roll-counts";

const TOLERANCE_AMOUNT_FIELD_ID = "76-cash-reconciliation-tolerance";

const FLOAT_DEFAULT = 200;
const FLOAT_MIN = 0;
const FLOAT_MAX = 10000;

const TOLERANCE_DEFAULT = 5;
const TOLERANCE_MIN = 0;
const TOLERANCE_MAX = 500;

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const COIN_INPUT_CLASS =
  "h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** 美式硬币卷面额（每卷标准金额） */
export const COIN_ROLL_DENOMINATIONS = [
  { id: "quarter", label: "25¢ 卷", valuePerRoll: 10 },
  { id: "dime", label: "10¢ 卷", valuePerRoll: 5 },
  { id: "nickel", label: "5¢ 卷", valuePerRoll: 2 },
  { id: "penny", label: "1¢ 卷", valuePerRoll: 0.5 },
] as const;

export type CoinRollId = (typeof COIN_ROLL_DENOMINATIONS)[number]["id"];

export type CoinRollCounts = Record<CoinRollId, number>;

const COIN_ROLL_IDS: CoinRollId[] = COIN_ROLL_DENOMINATIONS.map((d) => d.id);

const EMPTY_COIN_COUNTS: CoinRollCounts = {
  quarter: 0,
  dime: 0,
  nickel: 0,
  penny: 0,
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clampMoney(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

function normalizeCoinCounts(raw: unknown): CoinRollCounts {
  const out = { ...EMPTY_COIN_COUNTS };
  if (!raw || typeof raw !== "object") return out;
  for (const id of COIN_ROLL_IDS) {
    const n = Number((raw as Record<string, unknown>)[id]);
    out[id] = Number.isFinite(n) ? Math.min(99, Math.max(0, Math.round(n))) : 0;
  }
  return out;
}

export function readCashDrawerFloatAmount(): number {
  return clampMoney(
    readModuleSettingNumber(FLOAT_AMOUNT_FIELD_ID, FLOAT_DEFAULT),
    FLOAT_MIN,
    FLOAT_MAX,
    FLOAT_DEFAULT,
  );
}

export function readCoinRollCounts(): CoinRollCounts {
  return normalizeCoinCounts(readModuleSettingJson(COIN_ROLL_COUNTS_FIELD_ID, EMPTY_COIN_COUNTS));
}

export function writeCoinRollCounts(counts: CoinRollCounts): void {
  writeModuleSettingJson(COIN_ROLL_COUNTS_FIELD_ID, normalizeCoinCounts(counts));
}

export function computeCoinRollsTotal(counts: CoinRollCounts): number {
  let sum = 0;
  for (const denom of COIN_ROLL_DENOMINATIONS) {
    sum += (counts[denom.id] ?? 0) * denom.valuePerRoll;
  }
  return Math.round(sum * 100) / 100;
}

export function readCashReconciliationTolerance(): number {
  return clampMoney(
    readModuleSettingNumber(TOLERANCE_AMOUNT_FIELD_ID, TOLERANCE_DEFAULT),
    TOLERANCE_MIN,
    TOLERANCE_MAX,
    TOLERANCE_DEFAULT,
  );
}

export function isCashDrawerFloatSeq(seq: number): boolean {
  return seq === CASH_DRAWER_FLOAT_SEQ;
}

export function isCashDrawerToleranceSeq(seq: number): boolean {
  return seq === CASH_DRAWER_TOLERANCE_SEQ;
}

export function isCashDrawerVarianceAlertSeq(seq: number): boolean {
  return seq === CASH_DRAWER_VARIANCE_ALERT_SEQ;
}

export function renderCashDrawerReconciliationIntroHtml(): string {
  return `
    <p class="m-0 mb-3 text-xs leading-relaxed text-muted-foreground">
      本组为<strong>现金内控策略</strong>：开班备款、班结长短款容差与超差提醒。
      现金日结流程见「现金日结与班结」（171、65、330）；开钱箱硬件见硬件管理中心。
    </p>`;
}

export function renderCashDrawerFloatAmountInputHtml(): string {
  const value = readCashDrawerFloatAmount();
  return `
    <div class="flex flex-wrap items-center justify-end gap-2">
      <span class="text-sm text-muted-foreground">$</span>
      <input
        type="number"
        inputmode="decimal"
        class="${NUMBER_INPUT_CLASS} w-28"
        value="${escapeHtml(String(value))}"
        min="${FLOAT_MIN}"
        max="${FLOAT_MAX}"
        step="0.01"
        data-cash-drawer-money-number="${escapeHtml(FLOAT_AMOUNT_FIELD_ID)}"
        aria-label="开班备款金额"
      />
    </div>`;
}

function renderCoinRollRow(denom: (typeof COIN_ROLL_DENOMINATIONS)[number], count: number): string {
  return `
    <label class="flex items-center justify-between gap-3 text-sm text-foreground">
      <span class="text-muted-foreground">${escapeHtml(denom.label)}<span class="ml-1 text-xs">($${denom.valuePerRoll}/卷)</span></span>
      <input
        type="number"
        inputmode="numeric"
        class="${COIN_INPUT_CLASS}"
        value="${count}"
        min="0"
        max="99"
        step="1"
        data-cash-drawer-coin-roll="${escapeHtml(denom.id)}"
        aria-label="${escapeHtml(denom.label)} 卷数"
      />
    </label>`;
}

export function renderCashDrawerCoinRollsPanelHtml(): string {
  const counts = readCoinRollCounts();
  const total = computeCoinRollsTotal(counts);
  const rows = COIN_ROLL_DENOMINATIONS.map((d) => renderCoinRollRow(d, counts[d.id])).join("");
  return `
    <details class="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2" data-cash-drawer-coin-rolls-panel>
      <summary class="cursor-pointer select-none py-1 text-xs font-medium text-muted-foreground">
        硬币卷明细（可选，原 seq 64）
      </summary>
      <div class="mt-2 space-y-2 border-t border-border pt-3">
        ${rows}
        <p class="m-0 text-xs text-muted-foreground" data-cash-drawer-coin-rolls-total>
          硬币卷合计约 <strong>$${escapeHtml(total.toFixed(2))}</strong>（辅助核对，不自动覆盖底金金额）
        </p>
      </div>
    </details>`;
}

export function renderCashDrawerFloatRowControlsHtml(): string {
  return `
    <div class="mt-3 space-y-0">
      ${renderCashDrawerCoinRollsPanelHtml()}
    </div>`;
}

export function renderCashReconciliationToleranceInputHtml(): string {
  const value = readCashReconciliationTolerance();
  return `
    <div class="flex flex-wrap items-center justify-end gap-2">
      <span class="text-sm text-muted-foreground">± $</span>
      <input
        type="number"
        inputmode="decimal"
        class="${NUMBER_INPUT_CLASS} w-28"
        value="${escapeHtml(String(value))}"
        min="${TOLERANCE_MIN}"
        max="${TOLERANCE_MAX}"
        step="0.01"
        data-cash-drawer-money-number="${escapeHtml(TOLERANCE_AMOUNT_FIELD_ID)}"
        data-cash-drawer-tolerance-input
        aria-label="现金平账允许误差值"
      />
    </div>`;
}

export function renderCashDrawerVarianceAlertHintPanelHtml(seq: number, on: boolean): string {
  const tolerance = readCashReconciliationTolerance();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 rounded-lg bg-muted/50 px-3 py-3 ${hidden}"
      data-cash-drawer-variance-alert-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        实点与系统应有现金之差超过 <strong data-cash-drawer-variance-alert-threshold>$${escapeHtml(tolerance.toFixed(2))}</strong> 时在 POS 提醒。
        容差金额在上方「现金平账允许误差值」修改。
      </p>
    </div>`;
}

export function setCashDrawerVarianceAlertPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-cash-drawer-variance-alert-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
  });
}

export function refreshCashDrawerVarianceAlertThresholdLabels(): void {
  const tolerance = readCashReconciliationTolerance();
  const text = `$${tolerance.toFixed(2)}`;
  document.querySelectorAll("[data-cash-drawer-variance-alert-threshold]").forEach((el) => {
    el.textContent = text;
  });
}

function collectCoinRollsFromPanel(panel: HTMLElement): CoinRollCounts {
  const counts = { ...EMPTY_COIN_COUNTS };
  panel.querySelectorAll<HTMLInputElement>("[data-cash-drawer-coin-roll]").forEach((input) => {
    const id = input.getAttribute("data-cash-drawer-coin-roll") as CoinRollId | null;
    if (!id || !COIN_ROLL_IDS.includes(id)) return;
    const n = Math.round(Number(input.value));
    counts[id] = Number.isFinite(n) ? Math.min(99, Math.max(0, n)) : 0;
  });
  return counts;
}

function updateCoinRollsTotalLabel(panel: HTMLElement): void {
  const total = computeCoinRollsTotal(collectCoinRollsFromPanel(panel));
  const el = panel.querySelector("[data-cash-drawer-coin-rolls-total]");
  if (el) {
    el.innerHTML = `硬币卷合计约 <strong>$${total.toFixed(2)}</strong>（辅助核对，不自动覆盖底金金额）`;
  }
}

function persistMoneyInput(input: HTMLInputElement, min: number, max: number, fallback: number): void {
  const fieldId = input.getAttribute("data-cash-drawer-money-number");
  if (!fieldId) return;
  const value = clampMoney(Number(input.value), min, max, fallback);
  input.value = String(value);
  writeModuleSettingNumber(fieldId, value);
}

export function bindCashDrawerReconciliationUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>("[data-cash-drawer-money-number]").forEach((input) => {
    if (input.dataset.cashDrawerMoneyBound === "1") return;
    input.dataset.cashDrawerMoneyBound = "1";
    const fieldId = input.getAttribute("data-cash-drawer-money-number");
    const min = Number(input.getAttribute("min") ?? "0");
    const max = Number(input.getAttribute("max") ?? "999999");
    const fallback =
      fieldId === TOLERANCE_AMOUNT_FIELD_ID ? TOLERANCE_DEFAULT : FLOAT_DEFAULT;
    const persist = () => {
      persistMoneyInput(input, min, max, fallback);
      if (input.hasAttribute("data-cash-drawer-tolerance-input")) {
        refreshCashDrawerVarianceAlertThresholdLabels();
      }
    };
    input.addEventListener("change", persist);
    input.addEventListener("blur", persist);
  });

  root.querySelectorAll<HTMLElement>("[data-cash-drawer-coin-rolls-panel]").forEach((panel) => {
    if (panel.dataset.cashDrawerCoinRollsBound === "1") return;
    panel.dataset.cashDrawerCoinRollsBound = "1";
    panel.addEventListener("input", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-cash-drawer-coin-roll]")) return;
      writeCoinRollCounts(collectCoinRollsFromPanel(panel));
      updateCoinRollsTotalLabel(panel);
    });
  });
}
