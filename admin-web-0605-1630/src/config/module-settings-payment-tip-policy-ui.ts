/**
 * 支付中心 · 小费政策与计算（方案 A）：组内排序 + 专用控件。
 */

import {
  MODULE_SETTING_CHOICE_CONTROL_CLASS,
  renderModuleSettingSingleChoiceHtml,
} from "./module-settings-choice-ui";
import {
  CHECKOUT_UX_LINES,
  type CheckoutUxLineId,
} from "./module-settings-payment-checkout-ux-lines";
import {
  readModuleSettingJson,
  readModuleSettingNumber,
  readModuleSettingRadio,
  writeModuleSettingJson,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";

export const TIP_COLLECTION_MODE_SEQ = 231;
export const TIP_ALERT_RATIO_SEQ = 232;
export const TIP_CHECKOUT_PRESET_SEQ = 237;
export const TIP_HIDE_CASH_SEQ = 244;
export const TIP_SPLIT_PAY_WHOLE_ORDER_SEQ = 253;
export const TIP_PRE_TAX_SEQ = 293;
export const TIP_PRE_DISCOUNT_SEQ = 294;
export const TIP_RECEIPT_DEFAULT_SEQ = 295;
export const TIP_RECEIPT_AFTER_PAID_SEQ = 296;
/** 收据打印建议小费主开关（开启后多选 295/296 场景并维护预设） */
export const TIP_RECEIPT_SUGGESTION_SEQ = 266;

export const TIP_RECEIPT_SUGGESTION_TOGGLE_SEQS = [TIP_RECEIPT_SUGGESTION_SEQ] as const;
/** Kiosk 自助端小费页选项类型（覆盖 237 在 Kiosk 上的展示维度） */
export const KIOSK_TIP_COLLECTION_MODE_SEQ = 493;

export const TIP_PERCENT_PRESET_SEQS = [
  TIP_CHECKOUT_PRESET_SEQ,
  TIP_RECEIPT_DEFAULT_SEQ,
  TIP_RECEIPT_AFTER_PAID_SEQ,
] as const;

export const PAYMENT_TIP_POLICY_TOGGLE_SEQS = [
  TIP_PRE_TAX_SEQ,
  TIP_PRE_DISCOUNT_SEQ,
  TIP_SPLIT_PAY_WHOLE_ORDER_SEQ,
  TIP_HIDE_CASH_SEQ,
] as const;

export const TIP_COLLECTION_MODE_FIELD_ID = "231-tip-collection-mode";
export const TIP_ALERT_RATIO_FIELD_ID = "232-tip-alert-ratio-percent";
/** @deprecated 单字段已迁移至 493-tip-collection-mode-by-line */
export const KIOSK_TIP_COLLECTION_MODE_FIELD_ID = "493-kiosk-tip-collection-mode";
const TIP_COLLECTION_MODE_BY_LINE_STORAGE_ID = "493-tip-collection-mode-by-line";

const TIP_MODE_GROUP = "module-setting-radio-231-tip-collection-mode";

const DEFAULT_ALERT_RATIO = 50;
const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

export const TIP_COLLECTION_MODE_OPTIONS = [
  { value: "manual", label: "仅手输小费" },
  { value: "presets", label: "预设选项 + 可手输" },
  { value: "disabled", label: "不允许选择小费" },
] as const;

export const CHECKOUT_TIP_COLLECTION_MODE_OPTIONS = [
  { value: "fixed", label: "固定金额" },
  { value: "percent", label: "百分比" },
] as const;

/** @deprecated 使用 CheckoutTipCollectionMode */
export const KIOSK_TIP_COLLECTION_MODE_OPTIONS = CHECKOUT_TIP_COLLECTION_MODE_OPTIONS;

export type CheckoutTipCollectionMode = (typeof CHECKOUT_TIP_COLLECTION_MODE_OPTIONS)[number]["value"];

/** @deprecated 使用 CheckoutTipCollectionMode */
export type KioskTipCollectionMode = CheckoutTipCollectionMode;

export type TipCollectionModeByLine = Record<CheckoutUxLineId, CheckoutTipCollectionMode>;

export type TipCollectionMode = (typeof TIP_COLLECTION_MODE_OPTIONS)[number]["value"];

export type TipPresetValueKind = "percent" | "fixed";

export type TipPreset = {
  id: string;
  value: number;
};

/** @deprecated 使用 TipPreset */
export type TipPercentPreset = TipPreset & { percent?: number };

const TIP_PRESET_VALUE_KIND_OPTIONS = [
  { value: "percent", label: "百分比" },
  { value: "fixed", label: "固定金额" },
] as const;

type TipPresetEditorConfig = {
  storageId: string;
  percentColumnLabel: string;
  fixedColumnLabel: string;
  percentAddLabel: string;
  fixedAddLabel: string;
  defaultPercentValues: number[];
  defaultFixedValues: number[];
  legacyPercentFieldId?: string;
};

const PRESET_CONFIG_BY_SEQ: Record<number, TipPresetEditorConfig> = {
  [TIP_CHECKOUT_PRESET_SEQ]: {
    storageId: "237-tip-percent-presets",
    percentColumnLabel: "结账页预设比例",
    fixedColumnLabel: "结账页预设金额",
    percentAddLabel: "新增预设比例",
    fixedAddLabel: "新增预设金额",
    defaultPercentValues: [15, 18, 20, 25],
    defaultFixedValues: [3, 5, 7, 10],
  },
  [TIP_RECEIPT_DEFAULT_SEQ]: {
    storageId: "295-receipt-tip-default-presets",
    percentColumnLabel: "收据建议比例（未付）",
    fixedColumnLabel: "收据建议金额（未付）",
    percentAddLabel: "新增预设比例",
    fixedAddLabel: "新增预设金额",
    defaultPercentValues: [15, 18, 20],
    defaultFixedValues: [3, 5, 7],
    legacyPercentFieldId: "295-receipt-tip-default-percent",
  },
  [TIP_RECEIPT_AFTER_PAID_SEQ]: {
    storageId: "296-receipt-tip-after-paid-presets",
    percentColumnLabel: "收据建议比例（已付后）",
    fixedColumnLabel: "收据建议金额（已付后）",
    percentAddLabel: "新增预设比例",
    fixedAddLabel: "新增预设金额",
    defaultPercentValues: [15, 18, 20],
    defaultFixedValues: [3, 5, 7],
    legacyPercentFieldId: "296-receipt-tip-after-paid-percent",
  },
};

const INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newPresetId(): string {
  return `tip-preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function isValidCheckoutTipCollectionMode(value: string): value is CheckoutTipCollectionMode {
  return CHECKOUT_TIP_COLLECTION_MODE_OPTIONS.some((o) => o.value === value);
}

function defaultTipCollectionModeForLine(): CheckoutTipCollectionMode {
  return readTipPresetValueKind(TIP_CHECKOUT_PRESET_SEQ);
}

function defaultTipCollectionModeByLine(): TipCollectionModeByLine {
  const fallback = defaultTipCollectionModeForLine();
  return { cds: fallback, kiosk: fallback, paypad: fallback };
}

function readLegacy493Radio(): CheckoutTipCollectionMode | null {
  const raw = readModuleSettingRadio("493-tip-collection-mode", "").trim().toLowerCase();
  if (raw === "fixed" || raw === "percent") return raw;
  if (raw === "fixed-amount" || raw === "amount") return "fixed";
  return null;
}

function readLegacySingleLine493(): Partial<TipCollectionModeByLine> | null {
  const stored = readModuleSettingRadio(KIOSK_TIP_COLLECTION_MODE_FIELD_ID, "");
  if (isValidCheckoutTipCollectionMode(stored)) {
    return { kiosk: stored };
  }
  const legacy = readLegacy493Radio();
  if (legacy) return { kiosk: legacy };
  return null;
}

export function readTipCollectionModeByLine(): TipCollectionModeByLine {
  const raw = readModuleSettingJson<Partial<TipCollectionModeByLine>>(
    TIP_COLLECTION_MODE_BY_LINE_STORAGE_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    const base = defaultTipCollectionModeByLine();
    for (const line of CHECKOUT_UX_LINES) {
      const v = raw[line.id];
      if (isValidCheckoutTipCollectionMode(String(v ?? ""))) {
        base[line.id] = v as CheckoutTipCollectionMode;
      }
    }
    return base;
  }
  const legacySingle = readLegacySingleLine493();
  if (legacySingle) {
    const migrated = { ...defaultTipCollectionModeByLine(), ...legacySingle };
    writeModuleSettingJson(TIP_COLLECTION_MODE_BY_LINE_STORAGE_ID, migrated);
    return migrated;
  }
  return defaultTipCollectionModeByLine();
}

export function writeTipCollectionModeByLine(values: TipCollectionModeByLine): void {
  const base = defaultTipCollectionModeByLine();
  for (const line of CHECKOUT_UX_LINES) {
    base[line.id] = isValidCheckoutTipCollectionMode(values[line.id])
      ? values[line.id]
      : defaultTipCollectionModeForLine();
  }
  writeModuleSettingJson(TIP_COLLECTION_MODE_BY_LINE_STORAGE_ID, base);
}

/** @deprecated 使用 readTipCollectionModeByLine().kiosk */
export function readKioskTipCollectionMode(): CheckoutTipCollectionMode {
  return readTipCollectionModeByLine().kiosk;
}

/** @deprecated 使用 writeTipCollectionModeByLine */
export function writeKioskTipCollectionMode(mode: CheckoutTipCollectionMode): void {
  const values = readTipCollectionModeByLine();
  values.kiosk = mode;
  writeTipCollectionModeByLine(values);
}

function isValidTipCollectionMode(value: string): value is TipCollectionMode {
  return TIP_COLLECTION_MODE_OPTIONS.some((o) => o.value === value);
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, n));
}

function readLegacySinglePercent(fieldId: string): number | null {
  const n = readModuleSettingNumber(fieldId, NaN);
  if (!Number.isFinite(n)) return null;
  return clampPercent(n);
}

function tipPresetValueKindFieldId(seq: number): string {
  return `${seq}-tip-preset-value-kind`;
}

function tipPresetDefaultIdFieldId(seq: number): string {
  return `${seq}-tip-preset-default-id`;
}

function isValidTipPresetValueKind(value: string): value is TipPresetValueKind {
  return value === "percent" || value === "fixed";
}

function valueSuffix(kind: TipPresetValueKind): string {
  return kind === "fixed" ? "元" : "%";
}

function columnLabelForKind(cfg: TipPresetEditorConfig, kind: TipPresetValueKind): string {
  return kind === "fixed" ? cfg.fixedColumnLabel : cfg.percentColumnLabel;
}

function addLabelForKind(cfg: TipPresetEditorConfig, kind: TipPresetValueKind): string {
  return kind === "fixed" ? cfg.fixedAddLabel : cfg.percentAddLabel;
}

function defaultValueForKind(kind: TipPresetValueKind): number {
  return kind === "fixed" ? 5 : 20;
}

function normalizePreset(
  raw: Partial<TipPreset & { percent?: number }>,
  kind: TipPresetValueKind,
): TipPreset {
  const rawValue = raw.value ?? raw.percent ?? 0;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newPresetId(),
    value: clampPresetValue(Number(rawValue), kind),
  };
}

function clampPresetValue(n: number, kind: TipPresetValueKind): number {
  if (!Number.isFinite(n)) return 0;
  const safe = Math.max(0, n);
  return kind === "percent" ? Math.min(MAX_PERCENT, safe) : safe;
}

function presetConfig(seq: number): TipPresetEditorConfig | undefined {
  return PRESET_CONFIG_BY_SEQ[seq];
}

function defaultPresets(seq: number, kind: TipPresetValueKind): TipPreset[] {
  const cfg = presetConfig(seq);
  if (!cfg) return [];
  const values = kind === "fixed" ? cfg.defaultFixedValues : cfg.defaultPercentValues;
  return values.map((value) => normalizePreset({ value }, kind));
}

export function readTipPresetValueKind(seq: number): TipPresetValueKind {
  const stored = readModuleSettingRadio(tipPresetValueKindFieldId(seq), "percent");
  return isValidTipPresetValueKind(stored) ? stored : "percent";
}

export function writeTipPresetValueKind(seq: number, kind: TipPresetValueKind): void {
  writeModuleSettingRadio(tipPresetValueKindFieldId(seq), kind);
}

export function readTipPresetDefaultId(seq: number): string | null {
  const id = readModuleSettingRadio(tipPresetDefaultIdFieldId(seq), "").trim();
  return id ? id : null;
}

export function writeTipPresetDefaultId(seq: number, id: string | null): void {
  writeModuleSettingRadio(tipPresetDefaultIdFieldId(seq), (id ?? "").trim());
}

function resolveTipPresetDefaultId(seq: number, items: readonly TipPreset[]): string | null {
  if (items.length === 0) return null;
  const stored = readTipPresetDefaultId(seq);
  if (stored && items.some((item) => item.id === stored)) return stored;
  return items[0]?.id ?? null;
}

function syncTipPresetDefaultId(seq: number, items: readonly TipPreset[]): string | null {
  const resolved = resolveTipPresetDefaultId(seq, items);
  writeTipPresetDefaultId(seq, resolved);
  return resolved;
}

export function readTipPercentPresets(seq: number): TipPreset[] {
  return readTipPresets(seq);
}

export function readTipPresets(seq: number): TipPreset[] {
  const cfg = presetConfig(seq);
  if (!cfg) return [];

  const kind = readTipPresetValueKind(seq);
  const raw = readModuleSettingJson<Partial<TipPreset & { percent?: number }>[]>(cfg.storageId, []);
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item) => normalizePreset(item, kind));
  }

  if (cfg.legacyPercentFieldId) {
    const legacy = readLegacySinglePercent(cfg.legacyPercentFieldId);
    if (legacy !== null) {
      return [normalizePreset({ value: legacy }, kind)];
    }
  }

  return defaultPresets(seq, kind);
}

export function writeTipPercentPresets(seq: number, items: TipPreset[]): void {
  writeTipPresets(seq, items);
}

export function writeTipPresets(seq: number, items: TipPreset[]): void {
  const cfg = presetConfig(seq);
  if (!cfg) return;
  const kind = readTipPresetValueKind(seq);
  const normalized = items.map((item) => normalizePreset(item, kind));
  writeModuleSettingJson(
    cfg.storageId,
    normalized,
  );
  syncTipPresetDefaultId(seq, normalized);
}

export function readTipDefaultPreset(seq: number): TipPreset | null {
  const items = readTipPresets(seq);
  const defaultId = resolveTipPresetDefaultId(seq, items);
  return defaultId ? items.find((item) => item.id === defaultId) ?? null : null;
}

export function readCheckoutTipDefaultPreset(): TipPreset | null {
  return readTipDefaultPreset(TIP_CHECKOUT_PRESET_SEQ);
}

export function readTipCollectionMode(): TipCollectionMode {
  const stored = readModuleSettingRadio(TIP_COLLECTION_MODE_FIELD_ID, "presets");
  return isValidTipCollectionMode(stored) ? stored : "presets";
}

export function readTipAlertRatioPercent(): number {
  return clampPercent(readModuleSettingNumber(TIP_ALERT_RATIO_FIELD_ID, DEFAULT_ALERT_RATIO));
}

/** @deprecated 使用 readTipPresets(237) */
export function readTipCheckoutPresets(): TipPreset[] {
  return readTipPresets(TIP_CHECKOUT_PRESET_SEQ);
}

/** @deprecated 使用 writeTipPresets(237, items) */
export function writeTipCheckoutPresets(items: TipPreset[]): void {
  writeTipPresets(TIP_CHECKOUT_PRESET_SEQ, items);
}

export function isCheckoutTipCollectionModeSeq(seq: number): boolean {
  return seq === KIOSK_TIP_COLLECTION_MODE_SEQ;
}

/** @deprecated 使用 isCheckoutTipCollectionModeSeq */
export function isKioskTipCollectionModeSeq(seq: number): boolean {
  return isCheckoutTipCollectionModeSeq(seq);
}

export function isTipCollectionModeSeq(seq: number): boolean {
  return seq === TIP_COLLECTION_MODE_SEQ;
}

export function isTipPercentPresetSeq(seq: number): boolean {
  return (TIP_PERCENT_PRESET_SEQS as readonly number[]).includes(seq);
}

export function isTipCheckoutPresetSeq(seq: number): boolean {
  return seq === TIP_CHECKOUT_PRESET_SEQ;
}

export function isTipAlertRatioSeq(seq: number): boolean {
  return seq === TIP_ALERT_RATIO_SEQ;
}

export function isTipReceiptDefaultSeq(seq: number): boolean {
  return seq === TIP_RECEIPT_DEFAULT_SEQ;
}

export function isTipReceiptAfterPaidSeq(seq: number): boolean {
  return seq === TIP_RECEIPT_AFTER_PAID_SEQ;
}

export function isTipReceiptSuggestionSeq(seq: number): boolean {
  return seq === TIP_RECEIPT_SUGGESTION_SEQ;
}

/** 295/296 预设表并入 266 面板，不再单独成行 */
export function shouldSkipTipReceiptPresetMemberRow(seq: number): boolean {
  return seq === TIP_RECEIPT_DEFAULT_SEQ || seq === TIP_RECEIPT_AFTER_PAID_SEQ;
}

export function isPaymentTipPolicyToggleSeq(seq: number): boolean {
  return (PAYMENT_TIP_POLICY_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function renderTipPolicyGroupIntroHtml(): string {
  return `
    <p class="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      本组为结账小费规则（含 POS 服务员录入方式、计算基数与收据建议）。
      自助端小费页<strong>收取方式</strong>（固定/百分比）见 <strong>493</strong>（CDS / Kiosk / PayPad 分产线）；页内展示细节见「结账与交互」<strong>463</strong>。
    </p>`;
}

export function renderTipCollectionModeChoiceHtml(): string {
  return renderModuleSettingSingleChoiceHtml({
    options: TIP_COLLECTION_MODE_OPTIONS,
    fieldId: TIP_COLLECTION_MODE_FIELD_ID,
    groupName: TIP_MODE_GROUP,
    currentValue: readTipCollectionMode(),
    layout: "vertical",
    ariaLabel: "小费收取模式",
  });
}

function renderTipCollectionModeRadiosForLine(options: {
  lineId: CheckoutUxLineId;
  lineLabel: string;
  mode: CheckoutTipCollectionMode;
}): string {
  const groupName = `tip-collection-mode-${options.lineId}`;
  const radios = CHECKOUT_TIP_COLLECTION_MODE_OPTIONS.map((opt) => {
    const checked = options.mode === opt.value;
    return `
        <label class="inline-flex items-center gap-1.5 text-sm cursor-pointer text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-tip-collection-mode-line="${escapeHtml(options.lineId)}"
            aria-label="${escapeHtml(options.lineLabel)} ${escapeHtml(opt.label)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
  }).join("");
  return `
    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-3" role="radiogroup" aria-label="${escapeHtml(options.lineLabel)} 小费收取方式">${radios}</div>`;
}

export function renderTipCollectionModeByLineTableHtml(): string {
  const values = readTipCollectionModeByLine();
  const rows = CHECKOUT_UX_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm text-foreground">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderTipCollectionModeRadiosForLine({
          lineId: line.id,
          lineLabel: line.label,
          mode: values[line.id],
        })}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-tip-collection-mode-by-line-editor class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[8.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">小费收取方式</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderCheckoutTipCollectionModePanelHtml(): string {
  return `
    <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
      <strong>CDS、Kiosk、PayPad</strong> 各产线小费页按<strong>固定金额</strong>或<strong>百分比</strong>展示（须先在「展示小费页 463」开启对应产线）。
      预设按钮内容仍维护于「结账页预设小费 <strong>237</strong>」中<strong>对应类型</strong>的列。
    </p>
    <div class="mt-3 max-w-2xl">
      ${renderTipCollectionModeByLineTableHtml()}
    </div>`;
}

/** @deprecated 使用 renderCheckoutTipCollectionModePanelHtml */
export function renderKioskTipCollectionModePanelHtml(): string {
  return renderCheckoutTipCollectionModePanelHtml();
}

function collectTipCollectionModeByLineFromRoot(root: ParentNode): TipCollectionModeByLine {
  const values = readTipCollectionModeByLine();
  root.querySelectorAll<HTMLInputElement>("[data-tip-collection-mode-line]").forEach((input) => {
    if (!input.checked) return;
    const lineId = input.getAttribute("data-tip-collection-mode-line") as CheckoutUxLineId | null;
    const value = input.value;
    if (!lineId || !isValidCheckoutTipCollectionMode(value)) return;
    values[lineId] = value;
  });
  return values;
}

export function bindCheckoutTipCollectionModeEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-tip-collection-mode-by-line-editor]").forEach((editor) => {
    if (editor.dataset.tipCollectionModeByLineBound === "1") return;
    editor.dataset.tipCollectionModeByLineBound = "1";
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-tip-collection-mode-line]")) {
        writeTipCollectionModeByLine(collectTipCollectionModeByLineFromRoot(editor));
      }
    });
  });
}

function renderPercentInput(fieldId: string, value: number, ariaLabel: string): string {
  const display = Number.isInteger(value) ? String(value) : String(value);
  return `
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="decimal"
        class="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value="${escapeHtml(display)}"
        min="${MIN_PERCENT}"
        max="${MAX_PERCENT}"
        step="0.1"
        data-module-setting-number="${escapeHtml(fieldId)}"
        aria-label="${escapeHtml(ariaLabel)}"
      />
      <span class="text-sm text-muted-foreground">%</span>
    </div>`;
}

export function renderTipAlertRatioInputHtml(): string {
  return renderPercentInput(
    TIP_ALERT_RATIO_FIELD_ID,
    readTipAlertRatioPercent(),
    "小费异常提醒比例",
  );
}

export function renderTipAlertRatioPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${hidden}"
      data-tip-alert-ratio-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs text-muted-foreground">小费金额超过订单金额的以下比例时，向操作员提示。</p>
      ${renderTipAlertRatioInputHtml()}
    </div>`;
}

export function setTipAlertRatioPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-tip-alert-ratio-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
  });
}

function renderTipPresetValueKindChoiceHtml(seq: number, kind: TipPresetValueKind): string {
  const groupName = `tip-preset-value-kind-${seq}`;
  const radios = TIP_PRESET_VALUE_KIND_OPTIONS.map((opt) => {
    const checked = kind === opt.value;
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="radio"
          name="${escapeHtml(groupName)}"
          value="${escapeHtml(opt.value)}"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
          ${checked ? "checked" : ""}
          data-tip-preset-value-kind
          aria-label="${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2" role="radiogroup" aria-label="预设小费类型">
      <span class="text-xs font-medium text-muted-foreground">预设类型</span>
      ${radios}
    </div>`;
}

function renderPresetTableInner(
  seq: number,
  cfg: TipPresetEditorConfig,
  kind: TipPresetValueKind,
  items: TipPreset[],
): string {
  const defaultId = resolveTipPresetDefaultId(seq, items);
  const columnLabel = columnLabelForKind(cfg, kind);
  const suffix = valueSuffix(kind);
  const maxAttr = kind === "percent" ? ` max="${MAX_PERCENT}"` : "";
  const valueAria = kind === "fixed" ? "预设小费金额" : "预设小费百分比";
  const defaultGroup = `tip-preset-default-${seq}`;

  const rows = items
    .map(
      (item) => `
    <tr class="border-t border-border" data-tip-preset-row data-preset-id="${escapeHtml(item.id)}">
      <td class="px-3 py-2.5">
        <div class="flex items-center gap-1.5">
          <input
            type="number"
            inputmode="decimal"
            class="${INPUT_CLASS} max-w-[8rem] tabular-nums"
            value="${escapeHtml(String(item.value))}"
            min="0"
            step="${kind === "fixed" ? "0.01" : "0.1"}"${maxAttr}
            data-tip-preset-value
            aria-label="${escapeHtml(valueAria)}"
          />
          <span class="shrink-0 text-sm text-muted-foreground">${escapeHtml(suffix)}</span>
        </div>
      </td>
      <td class="px-3 py-2.5 text-center">
        <label class="inline-flex cursor-pointer items-center justify-center">
          <input
            type="radio"
            name="${escapeHtml(defaultGroup)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            data-tip-preset-default
            ${item.id === defaultId ? "checked" : ""}
            aria-label="设为默认预设"
          />
        </label>
      </td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap">
        <button type="button" class="text-sm font-medium text-destructive hover:underline" data-tip-preset-remove>删除</button>
      </td>
    </tr>`,
    )
    .join("");

  return `
    <div class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[12rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">${escapeHtml(columnLabel)}</th>
            <th class="px-3 py-2 text-center font-medium w-[5rem]">默认</th>
            <th class="px-3 py-2 text-right font-medium w-[4.5rem]">操作</th>
          </tr>
        </thead>
        <tbody data-tip-preset-list>${rows}</tbody>
      </table>
    </div>`;
}

export function renderTipPercentPresetEditorHtml(seq: number): string {
  const cfg = presetConfig(seq);
  if (!cfg) return "";
  const kind = readTipPresetValueKind(seq);
  const items = readTipPresets(seq);
  return `
    <div
      class="space-y-3"
      data-tip-preset-editor
      data-preset-seq="${seq}"
      data-storage-id="${escapeHtml(cfg.storageId)}"
      data-preset-value-kind="${kind}"
    >
      ${renderTipPresetValueKindChoiceHtml(seq, kind)}
      ${renderPresetTableInner(seq, cfg, kind, items)}
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
        data-tip-preset-add
      >${escapeHtml(addLabelForKind(cfg, kind))}</button>
    </div>`;
}

/** @deprecated 使用 renderTipPercentPresetEditorHtml(237) */
export function renderTipCheckoutPresetEditorHtml(): string {
  return renderTipPercentPresetEditorHtml(TIP_CHECKOUT_PRESET_SEQ);
}

function readEditorValueKind(editor: HTMLElement): TipPresetValueKind {
  const checked = editor.querySelector<HTMLInputElement>("[data-tip-preset-value-kind]:checked");
  return checked?.value === "fixed" ? "fixed" : "percent";
}

function collectPresetsFromEditor(editor: HTMLElement): TipPreset[] {
  const kind = readEditorValueKind(editor);
  const items: TipPreset[] = [];
  editor.querySelectorAll<HTMLElement>("[data-tip-preset-row]").forEach((row) => {
    const id = row.getAttribute("data-preset-id") ?? newPresetId();
    const value = Number(row.querySelector<HTMLInputElement>("[data-tip-preset-value]")?.value);
    items.push(normalizePreset({ id, value }, kind));
  });
  return items;
}

function persistTipPresetEditor(editor: HTMLElement): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  if (!presetConfig(seq)) return;
  writeTipPresets(seq, collectPresetsFromEditor(editor));
}

function rerenderTipPresetEditor(editor: HTMLElement): void {
  const seq = Number(editor.getAttribute("data-preset-seq"));
  const parent = editor.parentElement;
  if (!parent || !presetConfig(seq)) return;
  editor.outerHTML = renderTipPercentPresetEditorHtml(seq);
  bindTipPercentPresetEditors(parent);
}

export function bindTipPercentPresetEditors(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-tip-preset-editor]").forEach((editor) => {
    if (editor.dataset.tipPresetEditorBound === "1") return;
    editor.dataset.tipPresetEditorBound = "1";

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-tip-preset-add]")) {
        const seq = Number(editor.getAttribute("data-preset-seq"));
        const kind = readEditorValueKind(editor);
        const items = collectPresetsFromEditor(editor);
        items.push(normalizePreset({ value: defaultValueForKind(kind) }, kind));
        writeTipPresets(seq, items);
        rerenderTipPresetEditor(editor);
        return;
      }
      const removeBtn = target.closest("[data-tip-preset-remove]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-tip-preset-row]");
        const presetId = row?.getAttribute("data-preset-id");
        if (!presetId) return;
        const seq = Number(editor.getAttribute("data-preset-seq"));
        writeTipPresets(
          seq,
          collectPresetsFromEditor(editor).filter((item) => item.id !== presetId),
        );
        rerenderTipPresetEditor(editor);
      }
    });

    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-tip-preset-value-kind]")) {
        const input = el as HTMLInputElement;
        if (!input.checked) return;
        const seq = Number(editor.getAttribute("data-preset-seq"));
        const nextKind: TipPresetValueKind = input.value === "fixed" ? "fixed" : "percent";
        writeTipPresetValueKind(seq, nextKind);
        writeTipPresets(seq, collectPresetsFromEditor(editor));
        rerenderTipPresetEditor(editor);
        return;
      }
      if (el.matches("[data-tip-preset-default]")) {
        const input = el as HTMLInputElement;
        if (!input.checked) return;
        const seq = Number(editor.getAttribute("data-preset-seq"));
        const row = input.closest<HTMLElement>("[data-tip-preset-row]");
        const presetId = row?.getAttribute("data-preset-id") ?? null;
        writeTipPresetDefaultId(seq, presetId);
        return;
      }
      if (el.matches("[data-tip-preset-value]")) persistTipPresetEditor(editor);
    });

    editor.addEventListener("input", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-tip-preset-value]")) persistTipPresetEditor(editor);
    });
  });
}

/** @deprecated 使用 bindTipPercentPresetEditors */
export function bindTipCheckoutPresetEditor(root: ParentNode = document): void {
  bindTipPercentPresetEditors(root);
}

const RECEIPT_TIP_SCENARIOS_STORAGE_ID = "266-receipt-tip-scenarios";

export const RECEIPT_TIP_SCENARIO_OPTIONS = [
  {
    key: "not-paid",
    label: "未付过小费时的小费建议",
    presetSeq: TIP_RECEIPT_DEFAULT_SEQ,
  },
  {
    key: "after-paid",
    label: "已经付过小费时的小费建议",
    presetSeq: TIP_RECEIPT_AFTER_PAID_SEQ,
  },
] as const;

export type ReceiptTipScenarioKey = (typeof RECEIPT_TIP_SCENARIO_OPTIONS)[number]["key"];

export type ReceiptTipScenarios = Record<ReceiptTipScenarioKey, boolean>;

function defaultReceiptTipScenarios(): ReceiptTipScenarios {
  return { "not-paid": false, "after-paid": false };
}

function normalizeReceiptTipScenarios(raw: unknown): ReceiptTipScenarios {
  const base = defaultReceiptTipScenarios();
  if (!raw || typeof raw !== "object") return base;
  for (const opt of RECEIPT_TIP_SCENARIO_OPTIONS) {
    const v = (raw as Record<string, unknown>)[opt.key];
    if (typeof v === "boolean") base[opt.key] = v;
  }
  return base;
}

export function readReceiptTipScenarios(): ReceiptTipScenarios {
  const stored = readModuleSettingJson<unknown>(RECEIPT_TIP_SCENARIOS_STORAGE_ID, null);
  if (stored && typeof stored === "object" && Object.keys(stored).length > 0) {
    return normalizeReceiptTipScenarios(stored);
  }
  return { "not-paid": true, "after-paid": true };
}

export function writeReceiptTipScenarios(values: ReceiptTipScenarios): void {
  writeModuleSettingJson(
    RECEIPT_TIP_SCENARIOS_STORAGE_ID,
    normalizeReceiptTipScenarios(values),
  );
}

function receiptTipScenarioBlockSelector(presetSeq: number): string {
  return `[data-receipt-tip-preset-block="${presetSeq}"]`;
}

function syncReceiptTipScenarioBlocks(root: ParentNode, masterOn: boolean): void {
  const scenarios = readReceiptTipScenarios();
  for (const opt of RECEIPT_TIP_SCENARIO_OPTIONS) {
    const visible = masterOn && scenarios[opt.key];
    root.querySelectorAll<HTMLElement>(receiptTipScenarioBlockSelector(opt.presetSeq)).forEach((block) => {
      block.classList.toggle("hidden", !visible);
      if (visible) block.removeAttribute("aria-hidden");
      else block.setAttribute("aria-hidden", "true");
      block.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button, select, textarea").forEach(
        (el) => {
          el.disabled = !visible;
        },
      );
    });
  }
}

export function renderReceiptTipSuggestionPanelHtml(seq: number, masterOn: boolean): string {
  const scenarios = readReceiptTipScenarios();
  const hidden = masterOn ? "" : "hidden";
  const checkboxes = RECEIPT_TIP_SCENARIO_OPTIONS.map((opt) => {
    const checked = scenarios[opt.key];
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
          data-receipt-tip-scenario="${escapeHtml(opt.key)}"
          ${checked ? "checked" : ""}
          ${masterOn ? "" : "disabled"}
          aria-label="${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  const presetBlocks = RECEIPT_TIP_SCENARIO_OPTIONS.map((opt) => {
    const blockVisible = masterOn && scenarios[opt.key];
    return `
      <div
        class="space-y-2 ${blockVisible ? "" : "hidden"}"
        data-receipt-tip-preset-block="${opt.presetSeq}"
        ${blockVisible ? "" : 'aria-hidden="true"'}
      >
        <p class="m-0 text-sm font-medium text-foreground">${escapeHtml(opt.label)}</p>
        <div class="max-w-md">
          ${renderTipPercentPresetEditorHtml(opt.presetSeq)}
        </div>
      </div>`;
  }).join("");

  return `
    <div
      class="mt-3 space-y-4 rounded-lg bg-muted/50 p-3 ${hidden}"
      data-receipt-tip-suggestion-panel="${seq}"
      ${masterOn ? "" : 'aria-hidden="true"'}
    >
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="收据建议小费展示场景"
        data-receipt-tip-scenarios-editor="${seq}"
      >
        ${checkboxes}
      </div>
      <div class="space-y-4" data-receipt-tip-preset-blocks>${presetBlocks}</div>
    </div>`;
}

export function setReceiptTipSuggestionPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-receipt-tip-suggestion-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("[data-receipt-tip-scenario]").forEach((input) => {
      input.disabled = !visible;
      input.closest("label")?.classList.toggle("cursor-not-allowed", !visible);
      input.closest("label")?.classList.toggle("opacity-50", !visible);
      input.closest("label")?.classList.toggle("cursor-pointer", visible);
    });
    syncReceiptTipScenarioBlocks(panel, visible);
  });
}

function collectReceiptTipScenarios(root: ParentNode): ReceiptTipScenarios {
  const scenarios = defaultReceiptTipScenarios();
  root
    .querySelectorAll<HTMLInputElement>(
      `[data-receipt-tip-scenarios-editor="${TIP_RECEIPT_SUGGESTION_SEQ}"] [data-receipt-tip-scenario]`,
    )
    .forEach((input) => {
      const key = input.getAttribute("data-receipt-tip-scenario") as ReceiptTipScenarioKey | null;
      if (key && key in scenarios) scenarios[key] = input.checked;
    });
  return scenarios;
}

export function bindReceiptTipSuggestionEditors(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>(`[data-receipt-tip-scenarios-editor="${TIP_RECEIPT_SUGGESTION_SEQ}"]`)
    .forEach((editor) => {
      if (editor.dataset.receiptTipScenariosBound === "1") return;
      editor.dataset.receiptTipScenariosBound = "1";
      editor.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-receipt-tip-scenario]")) return;
        const panel = editor.closest(`[data-receipt-tip-suggestion-panel="${TIP_RECEIPT_SUGGESTION_SEQ}"]`);
        writeReceiptTipScenarios(collectReceiptTipScenarios(root));
        if (panel) syncReceiptTipScenarioBlocks(panel, !panel.classList.contains("hidden"));
      });
    });
  bindTipPercentPresetEditors(root);
}
