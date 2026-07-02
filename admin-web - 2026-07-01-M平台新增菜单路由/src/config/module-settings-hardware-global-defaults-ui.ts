/**
 * 硬件管理中心 · 设置 · 全局设置：默认设备绑定（seq 386–395）。
 */

import { readCashDrawerHardwareDevices } from "./device-management-cash-drawer-hardware-ui";
import { readPaymentHardwareDevices } from "./device-management-payment-hardware-ui";
import { readPrinterHardwareDevices } from "./device-management-printer-hardware-ui";
import { readModuleSettingText, writeModuleSettingText } from "./module-settings-form-ui";

export const HARDWARE_GLOBAL_RECEIPT_PRINTER_SEQ = 386;
export const HARDWARE_GLOBAL_PACK_PRINTER_SEQ = 387;
export const HARDWARE_GLOBAL_PACK_PRINTER_2_SEQ = 388;
export const HARDWARE_GLOBAL_SERVING_PRINTER_SEQ = 389;
export const HARDWARE_GLOBAL_CASH_DRAWER_SEQ = 390;
export const HARDWARE_GLOBAL_REPORT_PRINTER_SEQ = 391;
export const HARDWARE_GLOBAL_PAYMENT_TERMINAL_SEQ = 392;
export const HARDWARE_GLOBAL_WAITLIST_PRINTER_SEQ = 393;
export const HARDWARE_GLOBAL_CUSTOM_DISH_PRINTER_SEQ = 394;
export const HARDWARE_GLOBAL_ROBOT_NOTIFY_PRINTER_SEQ = 395;

export const HARDWARE_GLOBAL_DEFAULT_DEVICE_SEQS: readonly number[] = [
  HARDWARE_GLOBAL_RECEIPT_PRINTER_SEQ,
  HARDWARE_GLOBAL_PACK_PRINTER_SEQ,
  HARDWARE_GLOBAL_PACK_PRINTER_2_SEQ,
  HARDWARE_GLOBAL_SERVING_PRINTER_SEQ,
  HARDWARE_GLOBAL_CASH_DRAWER_SEQ,
  HARDWARE_GLOBAL_REPORT_PRINTER_SEQ,
  HARDWARE_GLOBAL_PAYMENT_TERMINAL_SEQ,
  HARDWARE_GLOBAL_WAITLIST_PRINTER_SEQ,
  HARDWARE_GLOBAL_CUSTOM_DISH_PRINTER_SEQ,
  HARDWARE_GLOBAL_ROBOT_NOTIFY_PRINTER_SEQ,
];

type DeviceKind = "printer" | "cashDrawer" | "paymentTerminal";

type GlobalDefaultField = {
  fieldId: string;
  kind: DeviceKind;
};

const FIELD_BY_SEQ: Record<number, GlobalDefaultField> = {
  [HARDWARE_GLOBAL_RECEIPT_PRINTER_SEQ]: {
    fieldId: "386-global-receipt-printer",
    kind: "printer",
  },
  [HARDWARE_GLOBAL_PACK_PRINTER_SEQ]: {
    fieldId: "387-global-pack-printer",
    kind: "printer",
  },
  [HARDWARE_GLOBAL_PACK_PRINTER_2_SEQ]: {
    fieldId: "388-global-pack-printer-2",
    kind: "printer",
  },
  [HARDWARE_GLOBAL_SERVING_PRINTER_SEQ]: {
    fieldId: "389-global-serving-printer",
    kind: "printer",
  },
  [HARDWARE_GLOBAL_CASH_DRAWER_SEQ]: {
    fieldId: "390-global-cash-drawer",
    kind: "cashDrawer",
  },
  [HARDWARE_GLOBAL_REPORT_PRINTER_SEQ]: {
    fieldId: "391-global-report-printer",
    kind: "printer",
  },
  [HARDWARE_GLOBAL_PAYMENT_TERMINAL_SEQ]: {
    fieldId: "392-global-payment-terminal",
    kind: "paymentTerminal",
  },
  [HARDWARE_GLOBAL_WAITLIST_PRINTER_SEQ]: {
    fieldId: "393-global-waitlist-printer",
    kind: "printer",
  },
  [HARDWARE_GLOBAL_CUSTOM_DISH_PRINTER_SEQ]: {
    fieldId: "394-global-custom-dish-printer",
    kind: "printer",
  },
  [HARDWARE_GLOBAL_ROBOT_NOTIFY_PRINTER_SEQ]: {
    fieldId: "395-global-robot-notify-printer",
    kind: "printer",
  },
};

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-center text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printerOptions(): { value: string; label: string }[] {
  return readPrinterHardwareDevices().map((p) => ({ value: p.id, label: p.name }));
}

function cashDrawerOptions(): { value: string; label: string }[] {
  return readCashDrawerHardwareDevices().map((d) => ({
    value: d.id,
    label: d.deviceName || d.name,
  }));
}

function paymentTerminalOptions(): { value: string; label: string }[] {
  return readPaymentHardwareDevices().map((d) => ({
    value: d.id,
    label: d.hardwareType === "pax" ? d.name : d.deviceName || d.deviceId,
  }));
}

function optionsForKind(kind: DeviceKind): { value: string; label: string }[] {
  if (kind === "cashDrawer") return cashDrawerOptions();
  if (kind === "paymentTerminal") return paymentTerminalOptions();
  return printerOptions();
}

export function isHardwareGlobalDefaultDeviceSeq(seq: number): boolean {
  return FIELD_BY_SEQ[seq] !== undefined;
}

export function renderHardwareGlobalDefaultDeviceSelect(seq: number): string {
  const field = FIELD_BY_SEQ[seq];
  if (!field) return "";
  const selected = readModuleSettingText(field.fieldId, "");
  const options = optionsForKind(field.kind);
  const opts = [
    `<option value="" ${selected === "" ? "selected" : ""}>请选择</option>`,
    ...options.map(
      (o) =>
        `<option value="${escapeHtml(o.value)}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
    ),
  ].join("");
  return `
    <select
      class="${SELECT_CLASS}"
      data-hardware-global-default-select="${escapeHtml(field.fieldId)}"
      aria-label="${escapeHtml(String(seq))}"
    >${opts}</select>`;
}

export function bindHardwareGlobalDefaultDevicePickers(root: ParentNode = document): void {
  root.querySelectorAll<HTMLSelectElement>("[data-hardware-global-default-select]").forEach((select) => {
    if (select.dataset.hardwareGlobalDefaultBound === "1") return;
    select.dataset.hardwareGlobalDefaultBound = "1";
    const fieldId = select.getAttribute("data-hardware-global-default-select");
    if (!fieldId) return;
    select.addEventListener("change", () => {
      writeModuleSettingText(fieldId, select.value);
    });
  });
}
