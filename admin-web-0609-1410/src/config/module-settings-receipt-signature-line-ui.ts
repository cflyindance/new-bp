/**
 * 打印中心 · 支付收据流程：seq 94 收据小票上打印确认签名栏（主开关 + 按产线多选）。
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

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureReceiptSignatureLineToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(RECEIPT_SIGNATURE_LINE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(RECEIPT_SIGNATURE_LINE_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(RECEIPT_SIGNATURE_LINE_SEQ), "1");
    } catch {
      /* ignore */
    }
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
  ensureReceiptSignatureLineToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(RECEIPT_SIGNATURE_LINE_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeReceiptSignatureLineLines(all);
    return all;
  }
  return [];
}

export function writeReceiptSignatureLineLines(lines: ReceiptSignatureLineProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isReceiptSignatureLineSeq(seq: number): boolean {
  return seq === RECEIPT_SIGNATURE_LINE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readReceiptSignatureLineLines());
  const cells = RECEIPT_SIGNATURE_LINE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-receipt-signature-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
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

export function renderReceiptSignatureLinePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-receipt-signature-line-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setReceiptSignatureLinePanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-receipt-signature-line-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-receipt-signature-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
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
  ensureReceiptSignatureLineToggleMigrated();
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
