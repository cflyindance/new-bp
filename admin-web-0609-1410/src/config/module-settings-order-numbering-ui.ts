/**
 * 订单 · 单号规则：127/128 数字输入；129 模式、130 分类单号、131 重置。
 */

import { renderModuleSettingSingleChoiceHtml } from "./module-settings-choice-ui";
import {
  readModuleSettingNumber,
  readModuleSettingRadio,
  readModuleSettingText,
  writeModuleSettingRadio,
  writeModuleSettingText,
} from "./module-settings-form-ui";

export const ORDER_NUMBER_MAX_SEQ = 127;
export const ORDER_NUMBER_START_SEQ = 128;
export const ORDER_NUMBER_MODE_SEQ = 129;
export const ORDER_NUMBER_CLASSIFICATION_SEQ = 130;
export const ORDER_NUMBER_RESET_SEQ = 131;

export const ORDER_NUMBER_CLASSIFICATION_FIELD_ID = "130-classification-order-numbers";

/** 分类单号预设（英文逗号分隔，可编辑） */
export const ORDER_NUMBER_CLASSIFICATION_DEFAULT =
  "10,20,30,40,50,60,70,80,90,110,120,130,140,150";

export const ORDER_NUMBER_MODE_FIELD_ID = "129-order-number-mode";
export const ORDER_NUMBER_RESET_FIELD_ID = "131-order-number-reset-mode";
const LEGACY_DEFAULT_VALUE = "default";
const ORDER_NUMBER_MODE_FALLBACK = "timestamp";
const ORDER_NUMBER_RESET_FALLBACK = "daily";

/** 与旧系统/POS 枚举对齐 */
export const ORDER_NUMBER_MODE_OPTIONS = [
  { value: "timestamp", label: "TIMESTAMP" },
  { value: "classification", label: "CLASSIFICATION" },
] as const;

export type OrderNumberMode = (typeof ORDER_NUMBER_MODE_OPTIONS)[number]["value"];

/** 与旧系统/POS 枚举对齐 */
export const ORDER_NUMBER_RESET_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "never", label: "Never" },
] as const;

export type OrderNumberResetMode = (typeof ORDER_NUMBER_RESET_OPTIONS)[number]["value"];

export type OrderNumberingInputConfig = {
  fieldId: string;
  defaultValue: number;
  min: number;
  max: number;
};

const INPUT_CONFIG: Record<number, OrderNumberingInputConfig> = {
  [ORDER_NUMBER_MAX_SEQ]: {
    fieldId: "127-order-number-max",
    defaultValue: 999,
    min: 1,
    max: 99999,
  },
  [ORDER_NUMBER_START_SEQ]: {
    fieldId: "128-order-number-start",
    defaultValue: 1,
    min: 1,
    max: 99999,
  },
};

const NUMBER_INPUT_CLASS =
  "h-8 w-28 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const TEXT_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isOrderNumberingNumberInputSeq(seq: number): boolean {
  return INPUT_CONFIG[seq] !== undefined;
}

export function getOrderNumberingInputConfig(seq: number): OrderNumberingInputConfig | undefined {
  return INPUT_CONFIG[seq];
}

export function renderOrderNumberingNumberControl(seq: number): string {
  const config = INPUT_CONFIG[seq];
  if (!config) return "";
  const stored = readModuleSettingNumber(config.fieldId, config.defaultValue);
  const value = Math.min(config.max, Math.max(config.min, Math.round(stored)));
  return `
    <input
      type="number"
      inputmode="numeric"
      class="${NUMBER_INPUT_CLASS}"
      value="${escapeHtml(String(value))}"
      min="${config.min}"
      max="${config.max}"
      step="1"
      data-module-setting-number="${escapeHtml(config.fieldId)}"
      aria-label="${seq === ORDER_NUMBER_MAX_SEQ ? "最大单号" : "起始单号"}"
    />`;
}

type OrderNumberSelectConfig = {
  fieldId: string;
  groupName: string;
  options: readonly { value: string; label: string }[];
  defaultValue: string;
  ariaLabel: string;
};

const ORDER_NUMBER_SELECT_BY_SEQ: Record<number, OrderNumberSelectConfig> = {
  [ORDER_NUMBER_MODE_SEQ]: {
    fieldId: ORDER_NUMBER_MODE_FIELD_ID,
    groupName: "module-setting-radio-129-order-number-mode",
    options: ORDER_NUMBER_MODE_OPTIONS,
    defaultValue: ORDER_NUMBER_MODE_FALLBACK,
    ariaLabel: "单号模式",
  },
  [ORDER_NUMBER_RESET_SEQ]: {
    fieldId: ORDER_NUMBER_RESET_FIELD_ID,
    groupName: "module-setting-radio-131-order-number-reset",
    options: ORDER_NUMBER_RESET_OPTIONS,
    defaultValue: ORDER_NUMBER_RESET_FALLBACK,
    ariaLabel: "单号重置",
  },
};

function isValidSelectValue(
  value: string,
  options: readonly { value: string }[],
): boolean {
  return options.some((opt) => opt.value === value);
}

function isValidOrderNumberResetMode(value: string): value is OrderNumberResetMode {
  return isValidSelectValue(value, ORDER_NUMBER_RESET_OPTIONS);
}

function isValidOrderNumberMode(value: string): value is OrderNumberMode {
  return isValidSelectValue(value, ORDER_NUMBER_MODE_OPTIONS);
}

function normalizeOrderNumberMode(stored: string): OrderNumberMode {
  const trimmed = stored.trim();
  if (isValidOrderNumberMode(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  if (isValidOrderNumberMode(lower)) return lower;
  if (lower === LEGACY_DEFAULT_VALUE) return ORDER_NUMBER_MODE_FALLBACK;
  return ORDER_NUMBER_MODE_FALLBACK;
}

export function readOrderNumberMode(): OrderNumberMode {
  return normalizeOrderNumberMode(
    readModuleSettingRadio(ORDER_NUMBER_MODE_FIELD_ID, ORDER_NUMBER_MODE_FALLBACK),
  );
}

export function writeOrderNumberMode(mode: OrderNumberMode): void {
  writeModuleSettingRadio(ORDER_NUMBER_MODE_FIELD_ID, mode);
}

export function isOrderNumberingModeSeq(seq: number): boolean {
  return seq === ORDER_NUMBER_MODE_SEQ;
}

export function readOrderNumberResetMode(): OrderNumberResetMode {
  const stored = readModuleSettingRadio(ORDER_NUMBER_RESET_FIELD_ID, ORDER_NUMBER_RESET_FALLBACK);
  const normalized = stored.trim().toLowerCase();
  if (isValidOrderNumberResetMode(normalized)) return normalized;
  if (normalized === LEGACY_DEFAULT_VALUE) return ORDER_NUMBER_RESET_FALLBACK;
  return ORDER_NUMBER_RESET_FALLBACK;
}

export function writeOrderNumberResetMode(mode: OrderNumberResetMode): void {
  writeModuleSettingRadio(ORDER_NUMBER_RESET_FIELD_ID, mode);
}

export function isOrderNumberingResetSeq(seq: number): boolean {
  return seq === ORDER_NUMBER_RESET_SEQ;
}

function readSelectValue(config: OrderNumberSelectConfig): string {
  const stored = readModuleSettingRadio(config.fieldId, config.defaultValue);
  return isValidSelectValue(stored, config.options) ? stored : config.defaultValue;
}

function renderOrderNumberingChoiceHtml(config: OrderNumberSelectConfig): string {
  return renderModuleSettingSingleChoiceHtml({
    options: config.options,
    fieldId: config.fieldId,
    groupName: config.groupName,
    currentValue: readSelectValue(config),
    layout: "vertical",
    ariaLabel: config.ariaLabel,
  });
}

export function renderOrderNumberingModeSelectHtml(): string {
  return renderOrderNumberingChoiceHtml(ORDER_NUMBER_SELECT_BY_SEQ[ORDER_NUMBER_MODE_SEQ]);
}

export function renderOrderNumberingResetSelectHtml(): string {
  return renderOrderNumberingChoiceHtml(ORDER_NUMBER_SELECT_BY_SEQ[ORDER_NUMBER_RESET_SEQ]);
}

export function readOrderNumberClassificationCsv(): string {
  const stored = readModuleSettingText(
    ORDER_NUMBER_CLASSIFICATION_FIELD_ID,
    ORDER_NUMBER_CLASSIFICATION_DEFAULT,
  );
  return stored.trim() || ORDER_NUMBER_CLASSIFICATION_DEFAULT;
}

export function writeOrderNumberClassificationCsv(value: string): void {
  writeModuleSettingText(ORDER_NUMBER_CLASSIFICATION_FIELD_ID, value.trim());
}

export function isOrderNumberingClassificationSeq(seq: number): boolean {
  return seq === ORDER_NUMBER_CLASSIFICATION_SEQ;
}

export function isOrderNumberClassificationModeActive(): boolean {
  return readOrderNumberMode() === "classification";
}

/** 单号模式切换后刷新提示文案（分类单号行始终展示） */
export function syncOrderNumberClassificationPanels(root: ParentNode = document): void {
  const active = isOrderNumberClassificationModeActive();
  root.querySelectorAll<HTMLElement>("[data-classification-mode-hint]").forEach((hint) => {
    hint.classList.toggle("hidden", active);
  });
}

export function renderOrderNumberingClassificationSettingHtml(
  title: string,
  sceneDesc: string,
): string {
  const active = isOrderNumberClassificationModeActive();
  const value = readOrderNumberClassificationCsv();
  return `
    <li class="list-none" data-order-classification-setting>
      <div class="border-b border-border px-4 py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1 space-y-1">
            <p class="text-sm font-medium text-card-foreground">${escapeHtml(title)}</p>
            ${
              sceneDesc
                ? `<p class="text-xs leading-relaxed text-muted-foreground">${escapeHtml(sceneDesc)}</p>`
                : ""
            }
          </div>
          <button
            type="button"
            class="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted"
            data-classification-collapse-toggle
            aria-expanded="true"
            aria-label="展开或收起分类单号输入"
            title="收起"
          >
            <svg class="size-4 transition-transform" data-classification-chevron viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>
        <div class="mt-3" data-classification-input-panel>
          <input
            type="text"
            class="${TEXT_INPUT_CLASS}"
            value="${escapeHtml(value)}"
            placeholder="${escapeHtml(ORDER_NUMBER_CLASSIFICATION_DEFAULT)}"
            data-module-setting-text="${escapeHtml(ORDER_NUMBER_CLASSIFICATION_FIELD_ID)}"
            aria-label="分类单号列表"
            autocomplete="off"
            spellcheck="false"
          />
          <p class="mt-1.5 text-xs text-muted-foreground">多个分类单号请用英文逗号分隔，例如 10,20,30</p>
          <p
            class="mt-1 text-xs text-muted-foreground ${active ? "hidden" : ""}"
            data-classification-mode-hint
          >生效需将上方「单号模式」设为 CLASSIFICATION</p>
        </div>
      </div>
    </li>`;
}

function setClassificationPanelCollapsed(panel: HTMLElement, collapsed: boolean): void {
  panel.classList.toggle("hidden", collapsed);
  const btn = panel
    .closest("[data-order-classification-setting]")
    ?.querySelector<HTMLButtonElement>("[data-classification-collapse-toggle]");
  const chevron = btn?.querySelector("[data-classification-chevron]");
  if (btn) {
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    btn.title = collapsed ? "展开" : "收起";
  }
  if (chevron) chevron.classList.toggle("rotate-180", collapsed);
}

export function bindOrderNumberingSelects(root: ParentNode = document): void {
  syncOrderNumberClassificationPanels(root);
  root
    .querySelectorAll<HTMLInputElement>(
      `[data-module-setting-radio="${ORDER_NUMBER_MODE_FIELD_ID}"]`,
    )
    .forEach((input) => {
      if (input.dataset.orderNumberModeSyncBound === "1") return;
      input.dataset.orderNumberModeSyncBound = "1";
      input.addEventListener("change", () => {
        if (input.checked) syncOrderNumberClassificationPanels(root);
      });
    });
}

export function bindOrderNumberingClassificationControls(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>("[data-classification-collapse-toggle]").forEach((btn) => {
    if (btn.dataset.classificationCollapseBound === "1") return;
    btn.dataset.classificationCollapseBound = "1";
    btn.addEventListener("click", () => {
      const wrap = btn.closest("[data-order-classification-setting]");
      const panel = wrap?.querySelector<HTMLElement>("[data-classification-input-panel]");
      if (!panel) return;
      const collapsed = panel.classList.contains("hidden");
      setClassificationPanelCollapsed(panel, !collapsed);
    });
  });
}

/** @deprecated 使用 bindOrderNumberingSelects */
export const bindOrderNumberingResetSelect = bindOrderNumberingSelects;
