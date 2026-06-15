/**
 * 打印中心 · 出纸与设备（seq 167、256、259、265、269）。
 * 167 页高；256 Logo；259 轮打重试；265 快速打印；269 打印前选机（含原 270）。
 */

import {
  readModuleSettingCheckbox,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const PRINT_PAGE_HEIGHT_SEQ = 167;
export const PRINT_LOGO_BY_TICKET_SEQ = 256;
export const PRINT_RETRY_POLLING_SEQ = 259;
export const PRINT_FAST_RECEIPT_MODE_SEQ = 265;
export const PRINT_PRINTER_PICK_BEFORE_PRINT_SEQ = 269;

const PRINTER_PICK_LINES_STORAGE_ID = "269-printer-pick-before-print-lines";
const LEGACY_DESKTOP_PRINTER_PICK_SEQ = 269;
const LEGACY_MOBILE_PRINTER_PICK_SEQ = 270;

export const PRINT_PRINTER_PICK_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "paypad", label: "PayPad" },
  { id: "posGo", label: "POS Go" },
] as const;

export type PrintPrinterPickProductLineId =
  (typeof PRINT_PRINTER_PICK_PRODUCT_LINES)[number]["id"];

const ALL_PRINTER_PICK_LINE_IDS: PrintPrinterPickProductLineId[] =
  PRINT_PRINTER_PICK_PRODUCT_LINES.map((l) => l.id);

/** 259 轮打重试、265 快速打印收据 */
export const PRINT_FOUNDATION_TOGGLE_SEQS: readonly number[] = [
  PRINT_RETRY_POLLING_SEQ,
  PRINT_FAST_RECEIPT_MODE_SEQ,
];

const PAGE_HEIGHT_FIELD_ID = "167-print-page-height-mm";
const PAGE_HEIGHT_DEFAULT = 0;
const PAGE_HEIGHT_MIN = 0;
const PAGE_HEIGHT_MAX = 2000;

/** 按票种是否打印 Logo（256） */
export const PRINT_LOGO_TICKET_OPTIONS = [
  { code: "order-receipt", label: "订单收据" },
  { code: "packing-slip", label: "打包单" },
  { code: "payment-signature", label: "支付签名收据" },
] as const;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPrintPageHeightSeq(seq: number): boolean {
  return seq === PRINT_PAGE_HEIGHT_SEQ;
}

export function isPrintLogoByTicketSeq(seq: number): boolean {
  return seq === PRINT_LOGO_BY_TICKET_SEQ;
}

export function isPrintFoundationToggleSeq(seq: number): boolean {
  return (PRINT_FOUNDATION_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function isPrintPrinterPickBeforePrintSeq(seq: number): boolean {
  return seq === PRINT_PRINTER_PICK_BEFORE_PRINT_SEQ;
}

function readLegacyPrinterPickToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizePrinterPickLines(raw: unknown): PrintPrinterPickProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_PRINTER_PICK_LINE_IDS);
  return raw.filter(
    (id): id is PrintPrinterPickProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readPrintPrinterPickLines(): PrintPrinterPickProductLineId[] {
  const stored = readModuleSettingJson<unknown>(PRINTER_PICK_LINES_STORAGE_ID, null);
  const normalized = normalizePrinterPickLines(stored);
  if (normalized.length > 0) return normalized;

  const migrated: PrintPrinterPickProductLineId[] = [];
  if (readLegacyPrinterPickToggleOn(LEGACY_DESKTOP_PRINTER_PICK_SEQ)) migrated.push("pos");
  if (readLegacyPrinterPickToggleOn(LEGACY_MOBILE_PRINTER_PICK_SEQ)) migrated.push("posGo");
  if (migrated.length > 0) {
    writePrintPrinterPickLines(migrated);
    return migrated;
  }
  return [];
}

export function writePrintPrinterPickLines(lines: PrintPrinterPickProductLineId[]): void {
  const unique = ALL_PRINTER_PICK_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(PRINTER_PICK_LINES_STORAGE_ID, unique);
}

export function renderPrintPrinterPickBeforePrintHtml(): string {
  const selected = new Set(readPrintPrinterPickLines());
  const cells = PRINT_PRINTER_PICK_PRODUCT_LINES.map((line, index) => {
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
          data-printer-pick-line="${escapeHtml(line.id)}"
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
        data-printer-pick-before-print-editor="${PRINT_PRINTER_PICK_BEFORE_PRINT_SEQ}"
        role="group"
        aria-label="打印前选择打印机适用产线"
      >
        ${cells}
      </div>
      <p class="max-w-xl text-right text-xs text-muted-foreground">
        勾选产线在出纸前弹出打印机选择；原 seq <strong>269</strong>（桌面 POS）、<strong>270</strong>（手持移动 POS）已合并。
      </p>
    </div>`;
}

function collectPrinterPickLines(root: ParentNode): PrintPrinterPickProductLineId[] {
  const lines: PrintPrinterPickProductLineId[] = [];
  root
    .querySelectorAll<HTMLInputElement>(
      `[data-printer-pick-before-print-editor="${PRINT_PRINTER_PICK_BEFORE_PRINT_SEQ}"] [data-printer-pick-line]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-printer-pick-line");
      if (id && ALL_PRINTER_PICK_LINE_IDS.includes(id as PrintPrinterPickProductLineId)) {
        lines.push(id as PrintPrinterPickProductLineId);
      }
    });
  writePrintPrinterPickLines(lines);
  return lines;
}

export function bindPrintPrinterPickUi(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>(
      `[data-printer-pick-before-print-editor="${PRINT_PRINTER_PICK_BEFORE_PRINT_SEQ}"]`,
    )
    .forEach((editor) => {
      if (editor.dataset.printerPickBound === "1") return;
      editor.dataset.printerPickBound = "1";
      editor.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-printer-pick-line]")) return;
        collectPrinterPickLines(root);
      });
    });
}

export function printLogoTicketCheckboxFieldId(code: string): string {
  return `256-print-logo-${code}`;
}

export function readPrintPageHeightMm(): number {
  const stored = readModuleSettingNumber(PAGE_HEIGHT_FIELD_ID, PAGE_HEIGHT_DEFAULT);
  if (!Number.isFinite(stored)) return PAGE_HEIGHT_DEFAULT;
  return Math.min(PAGE_HEIGHT_MAX, Math.max(PAGE_HEIGHT_MIN, Math.round(stored)));
}

export function renderPrintPageHeightControl(): string {
  const value = readPrintPageHeightMm();
  return `
    <div class="flex flex-col items-end gap-1">
      <div class="flex flex-wrap items-center justify-end gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          value="${escapeHtml(String(value))}"
          min="${PAGE_HEIGHT_MIN}"
          max="${PAGE_HEIGHT_MAX}"
          step="1"
          data-module-setting-number="${escapeHtml(PAGE_HEIGHT_FIELD_ID)}"
          aria-label="单张小票最大页高（毫米）"
        />
        <span class="text-sm text-muted-foreground">mm</span>
      </div>
      <span class="text-xs text-muted-foreground">0 表示不限制长度</span>
    </div>`;
}

export function renderPrintLogoByTicketCheckboxHtml(): string {
  const cells = PRINT_LOGO_TICKET_OPTIONS.map((ticket, index) => {
    const fieldId = printLogoTicketCheckboxFieldId(ticket.code);
    const defaultChecked = ticket.code === "order-receipt";
    const checked = readModuleSettingCheckbox(fieldId, defaultChecked);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-4 ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-module-setting-checkbox="${escapeHtml(fieldId)}"
          aria-label="${escapeHtml(ticket.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(ticket.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-print-logo-by-ticket="${PRINT_LOGO_BY_TICKET_SEQ}"
      role="group"
      aria-label="按票种打印 Logo"
    >
      ${cells}
    </div>`;
}
