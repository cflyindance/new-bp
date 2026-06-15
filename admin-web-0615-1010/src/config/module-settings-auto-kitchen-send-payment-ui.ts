/**
 * 前厅 · 食客端·下单与规则：seq 502 可自动送厨的订单支付状态
 *（主开关 + 各产线多选：订单部分支付 / 订单全额支付 / 订单未支付）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const AUTO_KITCHEN_SEND_PAYMENT_SEQ = 502;

const BY_LINE_STORAGE_ID = "502-auto-kitchen-send-payment-by-line";

export const AUTO_KITCHEN_SEND_PAYMENT_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export const AUTO_KITCHEN_SEND_PAYMENT_TYPES = [
  { id: "partial", label: "订单部分支付" },
  { id: "full", label: "订单全额支付" },
  { id: "unpaid", label: "订单未支付" },
] as const;

export type AutoKitchenSendPaymentProductLineId =
  (typeof AUTO_KITCHEN_SEND_PAYMENT_PRODUCT_LINES)[number]["id"];

export type AutoKitchenSendPaymentTypeId =
  (typeof AUTO_KITCHEN_SEND_PAYMENT_TYPES)[number]["id"];

type AutoKitchenSendPaymentByLine = Record<
  AutoKitchenSendPaymentProductLineId,
  AutoKitchenSendPaymentTypeId[]
>;

const ALL_LINE_IDS = AUTO_KITCHEN_SEND_PAYMENT_PRODUCT_LINES.map((l) => l.id);
const ALL_PAYMENT_TYPE_IDS = AUTO_KITCHEN_SEND_PAYMENT_TYPES.map((p) => p.id);

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(AUTO_KITCHEN_SEND_PAYMENT_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureAutoKitchenSendPaymentToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (
      localStorage.getItem(moduleSettingToggleStorageKey(AUTO_KITCHEN_SEND_PAYMENT_SEQ)) !== null
    ) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(AUTO_KITCHEN_SEND_PAYMENT_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function defaultByLine(): AutoKitchenSendPaymentByLine {
  return {
    pos: [],
    "pos-go": [],
    paypad: [],
    kiosk: [],
    sdi: [],
    "online-order": [],
  };
}

function normalizePaymentTypeIds(values: unknown): AutoKitchenSendPaymentTypeId[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<AutoKitchenSendPaymentTypeId>();
  const out: AutoKitchenSendPaymentTypeId[] = [];
  for (const v of values) {
    if (typeof v !== "string") continue;
    if (!ALL_PAYMENT_TYPE_IDS.includes(v as AutoKitchenSendPaymentTypeId)) continue;
    const id = v as AutoKitchenSendPaymentTypeId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function normalizeByLine(raw: unknown): AutoKitchenSendPaymentByLine {
  const base = defaultByLine();
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Record<string, unknown>;
  for (const lineId of ALL_LINE_IDS) {
    base[lineId] = normalizePaymentTypeIds(record[lineId]);
  }
  return base;
}

function legacyKioskDefaultByLine(): AutoKitchenSendPaymentByLine {
  const base = defaultByLine();
  base.kiosk = [...ALL_PAYMENT_TYPE_IDS];
  return base;
}

function hasAnyPaymentTypeSelected(byLine: AutoKitchenSendPaymentByLine): boolean {
  return ALL_LINE_IDS.some((lineId) => (byLine[lineId] ?? []).length > 0);
}

export function readAutoKitchenSendPaymentByLine(): AutoKitchenSendPaymentByLine {
  ensureAutoKitchenSendPaymentToggleMigrated();
  const stored = readModuleSettingJson<unknown>(BY_LINE_STORAGE_ID, null);
  const normalized = normalizeByLine(stored);
  if (hasAnyPaymentTypeSelected(normalized)) return normalized;

  if (readLegacyToggleOn()) {
    const legacy = legacyKioskDefaultByLine();
    writeAutoKitchenSendPaymentByLine(legacy);
    return legacy;
  }
  return normalized;
}

export function writeAutoKitchenSendPaymentByLine(byLine: AutoKitchenSendPaymentByLine): void {
  writeModuleSettingJson(BY_LINE_STORAGE_ID, normalizeByLine(byLine));
}

export function isAutoKitchenSendPaymentSeq(seq: number): boolean {
  return seq === AUTO_KITCHEN_SEND_PAYMENT_SEQ;
}

function isPaymentTypeChecked(
  byLine: AutoKitchenSendPaymentByLine,
  lineId: AutoKitchenSendPaymentProductLineId,
  paymentTypeId: AutoKitchenSendPaymentTypeId,
): boolean {
  return (byLine[lineId] ?? []).includes(paymentTypeId);
}

function renderMatrixHtml(enabled: boolean): string {
  const byLine = readAutoKitchenSendPaymentByLine();
  const headCells = AUTO_KITCHEN_SEND_PAYMENT_TYPES.map(
    (payment) =>
      `<th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">${escapeHtml(payment.label)}</th>`,
  ).join("");

  const rows = AUTO_KITCHEN_SEND_PAYMENT_PRODUCT_LINES.map((line) => {
    const cells = AUTO_KITCHEN_SEND_PAYMENT_TYPES.map((payment) => {
      const checked = isPaymentTypeChecked(byLine, line.id, payment.id);
      return `
        <td class="border-t border-border px-2 py-2 text-center align-middle">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
            ${checked ? "checked" : ""}
            ${enabled ? "" : "disabled"}
            data-auto-kitchen-send-payment-line="${escapeHtml(line.id)}"
            data-auto-kitchen-send-payment-type="${escapeHtml(payment.id)}"
            aria-label="${escapeHtml(line.label)} ${escapeHtml(payment.label)}"
          />
        </td>`;
    }).join("");
    return `
      <tr data-auto-kitchen-send-payment-row="${escapeHtml(line.id)}">
        <th scope="row" class="border-t border-border px-3 py-2 text-left text-sm font-medium text-foreground whitespace-nowrap">${escapeHtml(line.label)}</th>
        ${cells}
      </tr>`;
  }).join("");

  return `
    <div
      class="space-y-2 ${enabled ? "" : "opacity-50 pointer-events-none"}"
      data-auto-kitchen-send-payment-editor="${AUTO_KITCHEN_SEND_PAYMENT_SEQ}"
    >
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">产线 \\ 支付状态</th>
              ${headCells}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        勾选后，该产线在对应支付状态下提交订单时将<strong>自动送厨</strong>。
      </p>
    </div>`;
}

export function renderAutoKitchenSendPaymentPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-3xl ${hidden}"
      data-auto-kitchen-send-payment-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderMatrixHtml(on)}
    </div>`;
}

export function setAutoKitchenSendPaymentPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-auto-kitchen-send-payment-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      const editor = panel.querySelector<HTMLElement>(
        `[data-auto-kitchen-send-payment-editor="${seq}"]`,
      );
      if (!editor) return;
      editor.classList.toggle("opacity-50", !visible);
      editor.classList.toggle("pointer-events-none", !visible);
      editor.querySelectorAll<HTMLInputElement>("[data-auto-kitchen-send-payment-line]").forEach(
        (input) => {
          input.disabled = !visible;
        },
      );
    });
}

function persistFromEditor(editor: HTMLElement): void {
  const byLine = defaultByLine();
  editor
    .querySelectorAll<HTMLInputElement>(
      "[data-auto-kitchen-send-payment-line][data-auto-kitchen-send-payment-type]:checked",
    )
    .forEach((input) => {
      const line = input.getAttribute(
        "data-auto-kitchen-send-payment-line",
      ) as AutoKitchenSendPaymentProductLineId | null;
      const paymentType = input.getAttribute(
        "data-auto-kitchen-send-payment-type",
      ) as AutoKitchenSendPaymentTypeId | null;
      if (!line || !paymentType) return;
      if (!ALL_LINE_IDS.includes(line) || !ALL_PAYMENT_TYPE_IDS.includes(paymentType)) return;
      byLine[line].push(paymentType);
    });

  for (const lineId of ALL_LINE_IDS) {
    byLine[lineId] = normalizePaymentTypeIds(byLine[lineId]);
  }
  writeAutoKitchenSendPaymentByLine(byLine);
}

export function bindAutoKitchenSendPaymentUi(root: ParentNode = document): void {
  ensureAutoKitchenSendPaymentToggleMigrated();
  root
    .querySelectorAll<HTMLElement>(`[data-auto-kitchen-send-payment-editor="${AUTO_KITCHEN_SEND_PAYMENT_SEQ}"]`)
    .forEach((editor) => {
      if (editor.dataset.autoKitchenSendPaymentBound === "1") return;
      editor.dataset.autoKitchenSendPaymentBound = "1";
      editor.addEventListener("change", (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-auto-kitchen-send-payment-line][data-auto-kitchen-send-payment-type]")) {
          return;
        }
        persistFromEditor(editor);
      });
    });
}
