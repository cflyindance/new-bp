/**
 * 打印中心 · 订单收据 · 自动打印触发（654 下单后、500 部分付款后）。
 * 各产线在对应节点是否在门店收据打印机自动打印纸质订单收据。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const ORDER_RECEIPT_AFTER_SUBMIT_SEQ = 654;
export const ORDER_RECEIPT_PARTIAL_PAYMENT_SEQ = 500;

const AFTER_SUBMIT_LINES_STORAGE_ID = "654-order-receipt-trigger-lines";
const PARTIAL_PAYMENT_LINES_STORAGE_ID = "500-partial-payment-order-receipt-lines";

export const ORDER_RECEIPT_TRIGGER_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "paypad", label: "PayPad" },
] as const;

export type OrderReceiptTriggerProductLineId =
  (typeof ORDER_RECEIPT_TRIGGER_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: OrderReceiptTriggerProductLineId[] =
  ORDER_RECEIPT_TRIGGER_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function storageIdForSeq(seq: number): string {
  if (seq === ORDER_RECEIPT_AFTER_SUBMIT_SEQ) return AFTER_SUBMIT_LINES_STORAGE_ID;
  if (seq === ORDER_RECEIPT_PARTIAL_PAYMENT_SEQ) return PARTIAL_PAYMENT_LINES_STORAGE_ID;
  return `${seq}-order-receipt-trigger-lines`;
}

function normalizeLineIds(raw: unknown): OrderReceiptTriggerProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is OrderReceiptTriggerProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function readOrderReceiptTriggerLines(
  seq: number,
): OrderReceiptTriggerProductLineId[] {
  const stored = readModuleSettingJson<unknown>(storageIdForSeq(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (seq === ORDER_RECEIPT_PARTIAL_PAYMENT_SEQ && readLegacyToggleOn(seq)) {
    writeOrderReceiptTriggerLines(seq, [...ALL_LINE_IDS]);
    return [...ALL_LINE_IDS];
  }
  return [];
}

export function writeOrderReceiptTriggerLines(
  seq: number,
  lines: OrderReceiptTriggerProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(storageIdForSeq(seq), unique);
}

export function isOrderReceiptAfterSubmitSeq(seq: number): boolean {
  return seq === ORDER_RECEIPT_AFTER_SUBMIT_SEQ;
}

export function isOrderReceiptPartialPaymentSeq(seq: number): boolean {
  return seq === ORDER_RECEIPT_PARTIAL_PAYMENT_SEQ;
}

function renderTriggerByLineHtml(
  seq: number,
  ariaLabel: string,
  hint: string,
): string {
  const selected = new Set(readOrderReceiptTriggerLines(seq));
  const cells = ORDER_RECEIPT_TRIGGER_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-order-receipt-trigger-line="${escapeHtml(line.id)}"
          data-order-receipt-trigger-seq="${seq}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div class="flex flex-col items-end gap-2">
      <div
        class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
        data-order-receipt-trigger-by-line="${seq}"
        role="group"
        aria-label="${escapeHtml(ariaLabel)}"
      >
        ${cells}
      </div>
      <p class="max-w-xl text-right text-xs text-muted-foreground">${escapeHtml(hint)}</p>
    </div>`;
}

export function renderOrderReceiptAfterSubmitByLineHtml(): string {
  return renderTriggerByLineHtml(
    ORDER_RECEIPT_AFTER_SUBMIT_SEQ,
    "下单后自动打印纸质订单收据适用产线",
    "订单提交成功后，在门店绑定的收据打印机出纸；eMenu 等为渠道下单，非平板本地打印。",
  );
}

export function renderOrderReceiptPartialPaymentByLineHtml(): string {
  return renderTriggerByLineHtml(
    ORDER_RECEIPT_PARTIAL_PAYMENT_SEQ,
    "部分付款后自动打印纸质订单收据适用产线",
    "订单发生部分付款后出纸；输出为订单收据（非支付签购单）。与支付收据流程中的「支付后打印」不同。",
  );
}

function collectLinesFromGroup(group: HTMLElement): OrderReceiptTriggerProductLineId[] {
  const seq = Number(group.getAttribute("data-order-receipt-trigger-by-line"));
  const lines: OrderReceiptTriggerProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-order-receipt-trigger-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-order-receipt-trigger-line");
    if (id && ALL_LINE_IDS.includes(id as OrderReceiptTriggerProductLineId)) {
      lines.push(id as OrderReceiptTriggerProductLineId);
    }
  });
  if (seq) writeOrderReceiptTriggerLines(seq, lines);
  return lines;
}

export function bindOrderReceiptTriggerUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-order-receipt-trigger-by-line]").forEach((group) => {
    if (group.dataset.orderReceiptTriggerBound === "1") return;
    group.dataset.orderReceiptTriggerBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-order-receipt-trigger-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
