/**
 * 打印中心 · 支付收据流程：seq 94 收据小票上打印确认签名栏。
 * 默认开启、无主开关；产线多选结构对齐跳过选桌 / 订单收据触发项。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const RECEIPT_SIGNATURE_LINE_SEQ = 94;

const LINES_STORAGE_ID = "94-receipt-signature-line-lines";

export const RECEIPT_SIGNATURE_LINE_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "paypad", label: "PayPad" },
] as const;

export type ReceiptSignatureLineProductLineId =
  (typeof RECEIPT_SIGNATURE_LINE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: ReceiptSignatureLineProductLineId[] =
  RECEIPT_SIGNATURE_LINE_PRODUCT_LINES.map((l) => l.id);

const DEFAULT_LINES: ReceiptSignatureLineProductLineId[] = [...ALL_LINE_IDS];

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeMasterToggleOn(on: boolean): void {
  try {
    localStorage.setItem(moduleSettingToggleStorageKey(RECEIPT_SIGNATURE_LINE_SEQ), on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function normalizeLineIds(raw: unknown): ReceiptSignatureLineProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is ReceiptSignatureLineProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readReceiptSignatureLineLines(): ReceiptSignatureLineProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  if (stored == null) {
    writeReceiptSignatureLineLines(DEFAULT_LINES);
    return [...DEFAULT_LINES];
  }
  return normalizeLineIds(stored);
}

export function writeReceiptSignatureLineLines(lines: ReceiptSignatureLineProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
  writeMasterToggleOn(unique.length > 0);
}

/** 默认开启：首次无数据时勾选全部适用产线 */
export function ensureReceiptSignatureLineDefault(): void {
  void readReceiptSignatureLineLines();
}

export function isReceiptSignatureLineSeq(seq: number): boolean {
  return seq === RECEIPT_SIGNATURE_LINE_SEQ;
}

export function renderReceiptSignatureLineByLineHtml(): string {
  ensureReceiptSignatureLineDefault();
  const selected = new Set(readReceiptSignatureLineLines());
  const cells = RECEIPT_SIGNATURE_LINE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-receipt-signature-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-receipt-signature-line-lines="${RECEIPT_SIGNATURE_LINE_SEQ}"
      role="group"
      aria-label="收据确认签名栏适用产线"
    >
      ${cells}
    </div>`;
}

function collectLinesFromGroup(group: HTMLElement): ReceiptSignatureLineProductLineId[] {
  const lines: ReceiptSignatureLineProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-receipt-signature-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-receipt-signature-line");
    if (id && ALL_LINE_IDS.includes(id as ReceiptSignatureLineProductLineId)) {
      lines.push(id as ReceiptSignatureLineProductLineId);
    }
  });
  writeReceiptSignatureLineLines(lines);
  return lines;
}

export function bindReceiptSignatureLineUi(root: ParentNode = document): void {
  ensureReceiptSignatureLineDefault();
  root.querySelectorAll<HTMLElement>("[data-receipt-signature-line-lines]").forEach((group) => {
    if (group.dataset.receiptSignatureLineBound === "1") return;
    group.dataset.receiptSignatureLineBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-receipt-signature-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
