/**
 * 打印中心 · 支付签购单（246 支付方式矩阵；261 付款前触发）。
 * 263/268 已并入 246；260 已并入支付中心 465「结账小票」。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { BUILTIN_PAYMENT_METHODS } from "./module-settings-payment-methods-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const RECEIPT_PRINT_BY_METHOD_SEQ = 246;
export const PRINT_CARDHOLDER_NAME_SEQ = 247;
export const RECEIPT_PRINT_BEFORE_PAYMENT_SEQ = 261;
export const PAYMENT_RECEIPT_SHOW_CHECKBOX_SEQ = 272;
export const DELETE_CARD_RECEIPT_PRINT_SEQ = 250;

/** 支付收据流程 · 单项开关（261 付款前；247/272 签购单票面） */
export const PAYMENT_RECEIPT_FLOW_TOGGLE_SEQS: readonly number[] = [
  RECEIPT_PRINT_BEFORE_PAYMENT_SEQ,
  PRINT_CARDHOLDER_NAME_SEQ,
  PAYMENT_RECEIPT_SHOW_CHECKBOX_SEQ,
];

/** seq 250 主开关（删卡后打印签购单；开启后展示联次多选） */
export const DELETE_CARD_RECEIPT_PRINT_TOGGLE_SEQS: readonly number[] = [DELETE_CARD_RECEIPT_PRINT_SEQ];

const PRINT_BY_METHOD_STORAGE_ID = "246-receipt-print-by-method";
const DELETE_CARD_RECEIPT_COPIES_STORAGE_ID = "250-delete-card-receipt-copies";

export const DELETE_CARD_RECEIPT_COPY_OPTIONS = [
  { key: "customerCopy", label: "Customer copy" },
  { key: "merchantCopy", label: "Merchant copy" },
] as const;

export type DeleteCardReceiptCopyKey = (typeof DELETE_CARD_RECEIPT_COPY_OPTIONS)[number]["key"];

export type DeleteCardReceiptCopies = Record<DeleteCardReceiptCopyKey, boolean>;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type ReceiptPrintByMethod = Record<string, boolean>;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function defaultPrintByMethod(): ReceiptPrintByMethod {
  const out: ReceiptPrintByMethod = {};
  for (const m of BUILTIN_PAYMENT_METHODS) out[m.code] = false;
  return out;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizePrintByMethod(raw: unknown): ReceiptPrintByMethod {
  const base = defaultPrintByMethod();
  if (!raw || typeof raw !== "object") return base;
  for (const m of BUILTIN_PAYMENT_METHODS) {
    const v = (raw as Record<string, unknown>)[m.code];
    if (typeof v === "boolean") base[m.code] = v;
  }
  return base;
}

export function readReceiptPrintByMethod(): ReceiptPrintByMethod {
  const stored = readModuleSettingJson<unknown>(PRINT_BY_METHOD_STORAGE_ID, null);
  const normalized = normalizePrintByMethod(stored);
  const hasAny = Object.values(normalized).some(Boolean);
  if (hasAny || (stored && typeof stored === "object" && Object.keys(stored).length > 0)) {
    return normalized;
  }

  const migrated = defaultPrintByMethod();
  if (readLegacyToggleOn(263)) migrated["credit-card"] = true;
  if (readLegacyToggleOn(268)) {
    migrated.wechat = true;
    migrated.alipay = true;
  }
  return migrated;
}

export function writeReceiptPrintByMethod(values: ReceiptPrintByMethod): void {
  writeModuleSettingJson(PRINT_BY_METHOD_STORAGE_ID, normalizePrintByMethod(values));
}

export function isReceiptPrintByMethodSeq(seq: number): boolean {
  return seq === RECEIPT_PRINT_BY_METHOD_SEQ;
}

export function isPaymentReceiptFlowToggleSeq(seq: number): boolean {
  return (PAYMENT_RECEIPT_FLOW_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function isDeleteCardReceiptPrintSeq(seq: number): boolean {
  return seq === DELETE_CARD_RECEIPT_PRINT_SEQ;
}

function defaultDeleteCardReceiptCopies(): DeleteCardReceiptCopies {
  return { customerCopy: false, merchantCopy: false };
}

function normalizeDeleteCardReceiptCopies(raw: unknown): DeleteCardReceiptCopies {
  const base = defaultDeleteCardReceiptCopies();
  if (!raw || typeof raw !== "object") return base;
  for (const opt of DELETE_CARD_RECEIPT_COPY_OPTIONS) {
    const v = (raw as Record<string, unknown>)[opt.key];
    if (typeof v === "boolean") base[opt.key] = v;
  }
  return base;
}

export function readDeleteCardReceiptCopies(): DeleteCardReceiptCopies {
  const stored = readModuleSettingJson<unknown>(DELETE_CARD_RECEIPT_COPIES_STORAGE_ID, null);
  if (stored && typeof stored === "object" && Object.keys(stored).length > 0) {
    return normalizeDeleteCardReceiptCopies(stored);
  }
  if (readLegacyToggleOn(DELETE_CARD_RECEIPT_PRINT_SEQ)) {
    return { customerCopy: true, merchantCopy: true };
  }
  return defaultDeleteCardReceiptCopies();
}

export function writeDeleteCardReceiptCopies(values: DeleteCardReceiptCopies): void {
  writeModuleSettingJson(
    DELETE_CARD_RECEIPT_COPIES_STORAGE_ID,
    normalizeDeleteCardReceiptCopies(values),
  );
}

export function renderDeleteCardReceiptCopiesPanelHtml(seq: number, on: boolean): string {
  const copies = readDeleteCardReceiptCopies();
  const hidden = on ? "" : "hidden";
  const checkboxes = DELETE_CARD_RECEIPT_COPY_OPTIONS.map((opt) => {
    const checked = copies[opt.key];
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
          data-delete-card-receipt-copy="${escapeHtml(opt.key)}"
          ${checked ? "checked" : ""}
          ${on ? "" : "disabled"}
          aria-label="${escapeHtml(opt.label)}"
        />
        <span>${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="mt-3 rounded-lg bg-muted/50 p-3 ${hidden}"
      data-delete-card-receipt-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="删除信用卡支付时打印的签购单联次"
        data-delete-card-receipt-copies-editor="${DELETE_CARD_RECEIPT_PRINT_SEQ}"
      >
        ${checkboxes}
      </div>
    </div>`;
}

export function setDeleteCardReceiptCopiesPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-delete-card-receipt-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel.querySelectorAll<HTMLInputElement>("[data-delete-card-receipt-copy]").forEach((input) => {
      input.disabled = !visible;
      input.closest("label")?.classList.toggle("cursor-not-allowed", !visible);
      input.closest("label")?.classList.toggle("opacity-50", !visible);
      input.closest("label")?.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectDeleteCardReceiptCopies(root: ParentNode): DeleteCardReceiptCopies {
  const copies = defaultDeleteCardReceiptCopies();
  root
    .querySelectorAll<HTMLInputElement>(
      `[data-delete-card-receipt-copies-editor="${DELETE_CARD_RECEIPT_PRINT_SEQ}"] [data-delete-card-receipt-copy]`,
    )
    .forEach((input) => {
      const key = input.getAttribute("data-delete-card-receipt-copy") as DeleteCardReceiptCopyKey | null;
      if (key && key in copies) copies[key] = input.checked;
    });
  return copies;
}

export function renderReceiptPrintByMethodHtml(): string {
  const config = readReceiptPrintByMethod();
  const rows = BUILTIN_PAYMENT_METHODS.map((m) => {
    const checked = config[m.code];
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          data-receipt-print-by-method="${escapeHtml(m.code)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(m.label)}"
        />
        <span>${escapeHtml(m.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex max-w-xl flex-col items-end gap-2"
      data-receipt-print-by-method-editor="${RECEIPT_PRINT_BY_METHOD_SEQ}"
    >
      <div class="flex flex-wrap justify-end gap-2" role="group" aria-label="按支付方式打印收据：使用以下支付方式时打印收据小票">
        ${rows}
      </div>
      <p class="text-right text-xs text-muted-foreground">
        原「一键付款/信用卡」「微信/阿里」打印已并入本项（seq 263/268）。
      </p>
    </div>`;
}

function collectPrintByMethod(root: ParentNode): ReceiptPrintByMethod {
  const config = defaultPrintByMethod();
  root
    .querySelectorAll<HTMLInputElement>(
      `[data-receipt-print-by-method-editor="${RECEIPT_PRINT_BY_METHOD_SEQ}"] [data-receipt-print-by-method]`,
    )
    .forEach((input) => {
      const code = input.getAttribute("data-receipt-print-by-method");
      if (code && code in config) config[code] = input.checked;
    });
  return config;
}

export function bindPaymentReceiptFlowUi(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>(`[data-receipt-print-by-method-editor="${RECEIPT_PRINT_BY_METHOD_SEQ}"]`)
    .forEach((editor) => {
      if (editor.dataset.receiptPrintByMethodBound === "1") return;
      editor.dataset.receiptPrintByMethodBound = "1";
      editor.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-receipt-print-by-method]")) return;
        writeReceiptPrintByMethod(collectPrintByMethod(root));
      });
    });

  root
    .querySelectorAll<HTMLElement>(
      `[data-delete-card-receipt-copies-editor="${DELETE_CARD_RECEIPT_PRINT_SEQ}"]`,
    )
    .forEach((editor) => {
      if (editor.dataset.deleteCardReceiptCopiesBound === "1") return;
      editor.dataset.deleteCardReceiptCopiesBound = "1";
      editor.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-delete-card-receipt-copy]")) return;
        writeDeleteCardReceiptCopies(collectDeleteCardReceiptCopies(root));
      });
    });
}
