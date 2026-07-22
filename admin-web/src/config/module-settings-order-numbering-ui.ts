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
import { renderSettingTitleWithHelpHtml } from "./module-settings-scene-desc-help-ui";

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

/** 单号模式切换后：仅 CLASSIFICATION 时展示分类单号面板 */
export function syncOrderNumberClassificationPanels(root: ParentNode = document): void {
  const active = isOrderNumberClassificationModeActive();
  root.querySelectorAll<HTMLElement>("[data-order-classification-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", !active);
    if (active) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
  });
}

function parseClassificationNumbers(csv: string): string[] {
  return csv
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function joinClassificationNumbers(values: string[]): string {
  return values
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(",");
}

function renderClassificationNumberChip(value: string): string {
  return `
    <span
      class="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums text-foreground"
      data-classification-number-chip
      data-classification-number-value="${escapeHtml(value)}"
    >
      <span class="truncate">${escapeHtml(value)}</span>
      <button
        type="button"
        class="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        data-classification-number-remove
        aria-label="删除 ${escapeHtml(value)}"
      >×</button>
    </span>`;
}

function renderClassificationNumberChips(values: string[]): string {
  return values.map((value) => renderClassificationNumberChip(value)).join("");
}

/** 嵌在「单号模式」下方的分类单号编辑面板（仅 CLASSIFICATION 可见） */
export function renderOrderNumberingClassificationPanelHtml(
  title: string,
  sceneDesc: string,
): string {
  const active = isOrderNumberClassificationModeActive();
  const csv = readOrderNumberClassificationCsv();
  const values = parseClassificationNumbers(csv);
  const hidden = active ? "" : "hidden";
  return `
    <div
      class="mt-3 space-y-3 rounded-lg bg-muted/50 p-3 ${hidden}"
      data-order-classification-panel
      data-classification-numbers-editor
      ${active ? "" : 'aria-hidden="true"'}
    >
      <div class="min-w-0">
        ${renderSettingTitleWithHelpHtml({
          id: ORDER_NUMBER_CLASSIFICATION_SEQ,
          title,
          sceneDesc,
        })}
      </div>
      <input
        type="hidden"
        value="${escapeHtml(csv)}"
        data-module-setting-text="${escapeHtml(ORDER_NUMBER_CLASSIFICATION_FIELD_ID)}"
        data-classification-numbers-storage
      />
      <div
        class="flex min-h-8 flex-wrap gap-1.5"
        data-classification-number-list
        ${values.length === 0 ? 'data-empty="1"' : ""}
      >
        ${
          values.length > 0
            ? renderClassificationNumberChips(values)
            : `<span class="text-xs text-muted-foreground" data-classification-number-empty>暂无分类单号，请在下方添加</span>`
        }
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          placeholder="输入单号"
          data-classification-number-draft
          aria-label="新增分类单号"
          autocomplete="off"
          spellcheck="false"
        />
        <button
          type="button"
          class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          data-classification-number-add
        >添加</button>
      </div>
    </div>`;
}

/** @deprecated 分类单号已并入单号模式行；保留空实现避免旧调用报错 */
export function renderOrderNumberingClassificationSettingHtml(
  _seq: number,
  _title: string,
  _sceneDesc: string,
): string {
  return "";
}

export function renderOrderNumberingModeWithClassificationHtml(
  modeItem: { seq: number; title: string; sceneDesc: string },
  classification: { title: string; sceneDesc: string },
  titleBlockHtml: string,
): string {
  return `
    <li class="list-none" data-order-number-mode-setting data-module-setting-row-seq="${modeItem.seq}">
      <div class="border-b border-border px-4 py-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">${titleBlockHtml}</div>
          <div class="w-full shrink-0 sm:max-w-md sm:pt-0.5">${renderOrderNumberingModeSelectHtml()}</div>
        </div>
        ${renderOrderNumberingClassificationPanelHtml(classification.title, classification.sceneDesc)}
      </div>
    </li>`;
}

function collectClassificationNumbersFromEditor(editor: HTMLElement): string[] {
  const values: string[] = [];
  editor.querySelectorAll<HTMLElement>("[data-classification-number-chip]").forEach((chip) => {
    const value = chip.getAttribute("data-classification-number-value")?.trim() ?? "";
    if (value) values.push(value);
  });
  return values;
}

function persistClassificationNumbersEditor(editor: HTMLElement): void {
  const csv = joinClassificationNumbers(collectClassificationNumbersFromEditor(editor));
  const storage = editor.querySelector<HTMLInputElement>("[data-classification-numbers-storage]");
  if (storage) storage.value = csv;
  writeOrderNumberClassificationCsv(csv);
}

function syncClassificationNumberEmptyState(editor: HTMLElement): void {
  const list = editor.querySelector<HTMLElement>("[data-classification-number-list]");
  if (!list) return;
  const chips = list.querySelectorAll("[data-classification-number-chip]");
  const emptyHint = list.querySelector("[data-classification-number-empty]");
  if (chips.length === 0) {
    if (!emptyHint) {
      list.insertAdjacentHTML(
        "afterbegin",
        `<span class="text-xs text-muted-foreground" data-classification-number-empty>暂无分类单号，请在下方添加</span>`,
      );
    }
    list.setAttribute("data-empty", "1");
  } else {
    emptyHint?.remove();
    list.removeAttribute("data-empty");
  }
}

function addClassificationNumberFromDraft(editor: HTMLElement): void {
  const draft = editor.querySelector<HTMLInputElement>("[data-classification-number-draft]");
  const list = editor.querySelector("[data-classification-number-list]");
  if (!draft || !list) return;
  const value = draft.value.trim();
  if (!value) {
    draft.focus();
    return;
  }
  const existing = collectClassificationNumbersFromEditor(editor);
  if (existing.includes(value)) {
    alert("该分类单号已存在");
    draft.select();
    return;
  }
  list.insertAdjacentHTML("beforeend", renderClassificationNumberChip(value));
  draft.value = "";
  syncClassificationNumberEmptyState(editor);
  persistClassificationNumbersEditor(editor);
  draft.focus();
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
        if (!input.checked) return;
        const active = input.value === "classification";
        root.querySelectorAll<HTMLElement>("[data-order-classification-panel]").forEach((panel) => {
          panel.classList.toggle("hidden", !active);
          if (active) panel.removeAttribute("aria-hidden");
          else panel.setAttribute("aria-hidden", "true");
        });
      });
    });
}

export function bindOrderNumberingClassificationControls(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-classification-numbers-editor]").forEach((editor) => {
    if (editor.dataset.classificationNumbersBound === "1") return;
    editor.dataset.classificationNumbersBound = "1";

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-classification-number-add]")) {
        addClassificationNumberFromDraft(editor);
        return;
      }
      const removeBtn = target.closest("[data-classification-number-remove]");
      if (removeBtn) {
        const chip = removeBtn.closest("[data-classification-number-chip]");
        chip?.remove();
        syncClassificationNumberEmptyState(editor);
        persistClassificationNumbersEditor(editor);
      }
    });

    editor.addEventListener("keydown", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-classification-number-draft]")) return;
      if (e.key === "Enter") {
        e.preventDefault();
        addClassificationNumberFromDraft(editor);
      }
    });
  });
}

/** @deprecated 使用 bindOrderNumberingSelects */
export const bindOrderNumberingResetSelect = bindOrderNumberingSelects;
