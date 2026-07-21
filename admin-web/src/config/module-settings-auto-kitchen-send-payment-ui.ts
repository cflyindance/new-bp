/**
 * 前厅 · 食客端·下单与规则：seq 502 可自动送厨的订单支付状态
 * （主开关 + 按产线多选支付状态，结构对齐点单显示座位 132）。
 */

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

const ALL_LINE_IDS: AutoKitchenSendPaymentProductLineId[] =
  AUTO_KITCHEN_SEND_PAYMENT_PRODUCT_LINES.map((l) => l.id);

const ALL_PAYMENT_TYPE_IDS: AutoKitchenSendPaymentTypeId[] =
  AUTO_KITCHEN_SEND_PAYMENT_TYPES.map((p) => p.id);

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
  const valid = new Set<string>(ALL_PAYMENT_TYPE_IDS);
  const out: AutoKitchenSendPaymentTypeId[] = [];
  for (const v of values) {
    if (typeof v !== "string" || !valid.has(v)) continue;
    const id = v as AutoKitchenSendPaymentTypeId;
    if (!out.includes(id)) out.push(id);
  }
  return ALL_PAYMENT_TYPE_IDS.filter((id) => out.includes(id));
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
  const payload = defaultByLine();
  for (const lineId of ALL_LINE_IDS) {
    payload[lineId] = normalizePaymentTypeIds(byLine[lineId]);
  }
  writeModuleSettingJson(BY_LINE_STORAGE_ID, payload);
}

export function isAutoKitchenSendPaymentSeq(seq: number): boolean {
  return seq === AUTO_KITCHEN_SEND_PAYMENT_SEQ;
}

function renderPaymentTypeCheckboxesForLine(
  lineId: AutoKitchenSendPaymentProductLineId,
  lineLabel: string,
  panelEnabled: boolean,
): string {
  const selected = new Set(readAutoKitchenSendPaymentByLine()[lineId]);
  const inputs = AUTO_KITCHEN_SEND_PAYMENT_TYPES.map((payment) => {
    const checked = selected.has(payment.id);
    return `
      <label class="inline-flex items-center gap-1.5 text-sm text-foreground ${panelEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(payment.id)}"
          data-auto-kitchen-send-payment-line="${escapeHtml(lineId)}"
          data-auto-kitchen-send-payment-type="${escapeHtml(payment.id)}"
          ${checked ? "checked" : ""}
          ${panelEnabled ? "" : "disabled"}
          aria-label="${escapeHtml(lineLabel)} ${escapeHtml(payment.label)}"
        />
        <span>${escapeHtml(payment.label)}</span>
      </label>`;
  }).join("");

  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>`;
}

function renderPaymentTypesByLineTableHtml(panelEnabled: boolean): string {
  const rows = AUTO_KITCHEN_SEND_PAYMENT_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderPaymentTypeCheckboxesForLine(line.id, line.label, panelEnabled)}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-auto-kitchen-send-payment-editor="${AUTO_KITCHEN_SEND_PAYMENT_SEQ}" class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">可自动送厨的支付状态（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function renderAutoKitchenSendPaymentPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl ${hidden}"
      data-auto-kitchen-send-payment-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderPaymentTypesByLineTableHtml(on)}
    </div>`;
}

export function setAutoKitchenSendPaymentPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-auto-kitchen-send-payment-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-auto-kitchen-send-payment-type]")
        .forEach((input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !visible);
          label.classList.toggle("opacity-50", !visible);
          label.classList.toggle("cursor-pointer", visible);
        });
    });
}

function collectPaymentTypesByLineFromEditor(
  editor: HTMLElement,
): AutoKitchenSendPaymentByLine {
  const values = defaultByLine();

  for (const lineId of ALL_LINE_IDS) {
    const checked = new Set<AutoKitchenSendPaymentTypeId>();
    editor
      .querySelectorAll<HTMLInputElement>(
        `[data-auto-kitchen-send-payment-line="${lineId}"][data-auto-kitchen-send-payment-type]:checked`,
      )
      .forEach((input) => {
        const typeId = input.getAttribute(
          "data-auto-kitchen-send-payment-type",
        ) as AutoKitchenSendPaymentTypeId | null;
        if (typeId && ALL_PAYMENT_TYPE_IDS.includes(typeId)) {
          checked.add(typeId);
        }
      });
    values[lineId] = ALL_PAYMENT_TYPE_IDS.filter((id) => checked.has(id));
  }

  writeAutoKitchenSendPaymentByLine(values);
  return values;
}

export function bindAutoKitchenSendPaymentUi(root: ParentNode = document): void {
  ensureAutoKitchenSendPaymentToggleMigrated();
  root
    .querySelectorAll<HTMLElement>(
      `[data-auto-kitchen-send-payment-editor="${AUTO_KITCHEN_SEND_PAYMENT_SEQ}"]`,
    )
    .forEach((editor) => {
      if (editor.dataset.autoKitchenSendPaymentBound === "1") return;
      editor.dataset.autoKitchenSendPaymentBound = "1";
      editor.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-auto-kitchen-send-payment-type]")) return;
        collectPaymentTypesByLineFromEditor(editor);
      });
    });
}
