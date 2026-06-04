/**
 * 支付中心 · 卡支付规则与对客加价（242 产线门槛、454 互斥策略、243 签名门槛）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  PAYMENT_PRODUCT_LINES,
  type PaymentProductLineId,
} from "./module-settings-payment-methods-ui";
import {
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const CARD_MIN_SPEND_SEQ = 242;
export const CARD_SIGNATURE_THRESHOLD_SEQ = 243;
export const CARD_PRICING_STRATEGY_SEQ = 454;

const CARD_MIN_SPEND_STORAGE_ID = "242-card-min-spend-by-line";
const CARD_SIGNATURE_MIN_STORAGE_ID = "243-card-signature-min-by-line";
const CARD_PRICING_STORAGE_ID = "454-card-pricing-strategy";

const LEGACY_MIN_SPEND_FIELD_IDS = ["242-card-min-payment", "512-card-min-spend"] as const;
const LEGACY_SIGNATURE_MIN_FIELD_IDS = ["243-card-signature-min-amount"] as const;

export type CardPricingMode = "none" | "dual-pricing" | "surcharge";

export type CardPricingStrategy = {
  mode: CardPricingMode;
  percent: number;
};

export type CardMinSpendByLine = Record<PaymentProductLineId, number>;

/** @alias CardMinSpendByLine */
export type CardSignatureMinByLine = CardMinSpendByLine;

const INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const CARD_PRICING_MODE_OPTIONS = [
  { value: "none", label: "不加价（现金与卡付同价）" },
  { value: "dual-pricing", label: "双重定价" },
  { value: "surcharge", label: "整单加收" },
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

function isValidPricingMode(value: string): value is CardPricingMode {
  return value === "none" || value === "dual-pricing" || value === "surcharge";
}

function readLegacy543SurchargeEnabled(): boolean {
  return readModuleSettingNumber("543-card-surcharge-enabled", 0) > 0;
}

function normalizeCardPricingStrategy(raw: Partial<CardPricingStrategy>): CardPricingStrategy {
  const mode = isValidPricingMode(String(raw.mode ?? "")) ? raw.mode! : "none";
  return { mode, percent: clampPercent(Number(raw.percent)) };
}

export function readCardPricingStrategy(): CardPricingStrategy {
  const raw = readModuleSettingJson<Partial<CardPricingStrategy>>(CARD_PRICING_STORAGE_ID, {});
  if (raw && typeof raw === "object" && raw.mode) {
    return normalizeCardPricingStrategy(raw);
  }
  const legacy454 = readModuleSettingNumber("454-dual-pricing-percent", NaN);
  if (Number.isFinite(legacy454) && legacy454 > 0) {
    return { mode: "dual-pricing", percent: clampPercent(legacy454) };
  }
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

export function isCardMinSpendSeq(seq: number): boolean {
  return seq === CARD_MIN_SPEND_SEQ;
}

export function isCardPricingStrategySeq(seq: number): boolean {
  return seq === CARD_PRICING_STRATEGY_SEQ;
}

export function isCardSignatureThresholdSeq(seq: number): boolean {
  return seq === CARD_SIGNATURE_THRESHOLD_SEQ;
}

export function renderCardFeesGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组配置<strong>能否刷卡</strong>（242 产线最低消费）、<strong>签名金额门槛</strong>（243）与<strong>刷卡是否对顾客加价</strong>（454）。
      各终端小费页 / 签名页开关见「结账与交互」463/464；收单通道成本见财务中心。
    </p>`;
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
        aria-label="卡付加价比例"
      />
      <span class="text-sm text-muted-foreground">%</span>
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
    strategy.mode === "dual-pricing"
      ? "卡付价 = 现金价 × (1 + 比例)；菜单/小票需合规披露现金价与卡价。"
      : strategy.mode === "surcharge"
        ? "仅在选择信用卡支付时，在订单总额上加收该比例；与订单中心「加收」预设（447）不同。"
        : "现金与信用卡支付使用同一应付金额。";

  return `
    <div class="space-y-3" data-card-pricing-editor>
      <div class="flex flex-col gap-2" role="radiogroup" aria-label="卡付加价策略">${radios}</div>
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

function collectMinSpendFromRoot(root: ParentNode): CardMinSpendByLine {
  const values = readCardMinSpendByLine();
  root.querySelectorAll<HTMLInputElement>("[data-card-min-spend-line]").forEach((input) => {
    const lineId = input.getAttribute("data-card-min-spend-line") as PaymentProductLineId | null;
    if (!lineId) return;
    values[lineId] = clampMoney(Number(input.value));
  });
  return values;
}

function collectSignatureMinFromRoot(root: ParentNode): CardSignatureMinByLine {
  const values = readCardSignatureMinByLine();
  root.querySelectorAll<HTMLInputElement>("[data-card-signature-min-line]").forEach((input) => {
    const lineId = input.getAttribute("data-card-signature-min-line") as PaymentProductLineId | null;
    if (!lineId) return;
    values[lineId] = clampMoney(Number(input.value));
  });
  return values;
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
      mode === "dual-pricing"
        ? "卡付价 = 现金价 × (1 + 比例)；菜单/小票需合规披露现金价与卡价。"
        : mode === "surcharge"
          ? "仅在选择信用卡支付时，在订单总额上加收该比例；与订单中心「加收」预设（447）不同。"
          : "现金与信用卡支付使用同一应付金额。";
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

export function bindCardMinSpendEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-card-min-spend-editor]").forEach((editor) => {
    if (editor.dataset.cardMinSpendEditorBound === "1") return;
    editor.dataset.cardMinSpendEditorBound = "1";
    const persist = () => writeCardMinSpendByLine(collectMinSpendFromRoot(editor));
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-card-min-spend-line]")) persist();
    });
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-card-min-spend-line]")) persist();
    });
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
  root.querySelectorAll<HTMLElement>("[data-card-signature-min-editor]").forEach((editor) => {
    if (editor.dataset.cardSignatureMinEditorBound === "1") return;
    editor.dataset.cardSignatureMinEditorBound = "1";
    const persist = () => writeCardSignatureMinByLine(collectSignatureMinFromRoot(editor));
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-card-signature-min-line]")) persist();
    });
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-card-signature-min-line]")) persist();
    });
  });
}

export function bindCardFeesEditors(root: ParentNode = document): void {
  bindCardMinSpendEditors(root);
  bindCardPricingStrategyEditors(root);
  bindCardSignatureMinEditors(root);
}
