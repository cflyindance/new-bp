/**
 * eMenu / Kiosk 等设备编辑页 · 客户端绑定字段（seq 370–385）。
 */

import { readCashDrawerHardwareDevices } from "./device-management-cash-drawer-hardware-ui";
import { readPaymentHardwareDevices } from "./device-management-payment-hardware-ui";
import { readPrinterHardwareDevices } from "./device-management-printer-hardware-ui";

export type TerminalClientBinding = {
  /** 名称（终端客户端名称，seq 371） */
  name: string;
  receiptPrinterId: string;
  paymentPrinterId: string;
  queuePrinterId: string;
  servingPrinterId: string;
  packPrinterId: string;
  cashDrawerId: string;
  callerIdEnabled: boolean;
  scaleEnabled: boolean;
  customerDisplayEnabled: boolean;
  customerDisplayModel: string;
  deviceManagerPort: string;
  paymentTerminalId: string;
  area: string;
  waitlistPrinterId: string;
};

export const DEFAULT_TERMINAL_CLIENT_BINDING: TerminalClientBinding = {
  name: "",
  receiptPrinterId: "",
  paymentPrinterId: "",
  queuePrinterId: "",
  servingPrinterId: "",
  packPrinterId: "",
  cashDrawerId: "",
  callerIdEnabled: false,
  scaleEnabled: false,
  customerDisplayEnabled: false,
  customerDisplayModel: "",
  deviceManagerPort: "",
  paymentTerminalId: "",
  area: "",
  waitlistPrinterId: "",
};

const AREA_OPTIONS = [
  { value: "", label: "未指定" },
  { value: "front", label: "前厅" },
  { value: "bar", label: "吧台" },
  { value: "pickup", label: "取餐区" },
  { value: "outdoor", label: "外摆" },
];

const CUSTOMER_DISPLAY_MODEL_OPTIONS = [
  { value: "", label: "请选择" },
  { value: "cds-7", label: "CDS-7 客显" },
  { value: "cds-10", label: "CDS-10 客显" },
  { value: "pole-vfd", label: "杆式 VFD" },
  { value: "hdmi-secondary", label: "HDMI 副屏" },
];

const TOGGLE_TRACK_ON = "border-primary bg-primary";
const TOGGLE_TRACK_OFF = "border-input bg-muted";
const TOGGLE_KNOB =
  "bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printerOptions(): { id: string; name: string }[] {
  return readPrinterHardwareDevices().map((p) => ({ id: p.id, name: p.name }));
}

function cashDrawerOptions(): { id: string; name: string }[] {
  return readCashDrawerHardwareDevices().map((d) => ({ id: d.id, name: d.name }));
}

function paymentTerminalOptions(): { id: string; name: string }[] {
  return readPaymentHardwareDevices().map((d) => {
    const label =
      d.hardwareType === "pax" ? d.name : d.deviceName || d.deviceId;
    return { id: d.id, name: label };
  });
}

function renderSelect(
  field: keyof TerminalClientBinding,
  label: string,
  selected: string,
  options: { value: string; label: string }[],
  selectClass: string,
  required = false,
): string {
  const opts = options
    .map(
      (o) =>
        `<option value="${escapeHtml(o.value)}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
    )
    .join("");
  return `
    <div>
      <label class="mb-1.5 block text-xs font-medium text-muted-foreground">${escapeHtml(label)}</label>
      <select class="${selectClass}" data-terminal-binding-field="${field}" ${required ? "required" : ""}>${opts}</select>
    </div>`;
}

function renderPrinterSelect(
  field: keyof TerminalClientBinding,
  label: string,
  selected: string,
  selectClass: string,
): string {
  const printers = printerOptions();
  return renderSelect(
    field,
    label,
    selected,
    [{ value: "", label: "未绑定" }, ...printers.map((p) => ({ value: p.id, label: p.name }))],
    selectClass,
  );
}

function renderBindingToggle(field: keyof TerminalClientBinding, label: string, on: boolean): string {
  const trackClass = on ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF;
  const knobClass = on ? "translate-x-5" : "translate-x-0.5";
  return `
    <div class="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <span class="text-sm font-medium text-card-foreground">${escapeHtml(label)}</span>
      <button
        type="button"
        role="switch"
        aria-checked="${on ? "true" : "false"}"
        aria-label="${escapeHtml(label)}"
        data-terminal-binding-toggle="${field}"
        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass}"
      >
        <span class="pointer-events-none block size-5 ${knobClass} ${TOGGLE_KNOB} rounded-full transition-transform duration-200" aria-hidden="true"></span>
      </button>
    </div>`;
}

export function normalizeTerminalClientBinding(
  raw: Partial<TerminalClientBinding> | undefined,
  fallbackName?: string,
): TerminalClientBinding {
  const b = raw ?? {};
  return {
    name: b.name?.trim() || fallbackName?.trim() || "",
    receiptPrinterId: b.receiptPrinterId?.trim() ?? "",
    paymentPrinterId: b.paymentPrinterId?.trim() ?? "",
    queuePrinterId: b.queuePrinterId?.trim() ?? "",
    servingPrinterId: b.servingPrinterId?.trim() ?? "",
    packPrinterId: b.packPrinterId?.trim() ?? "",
    cashDrawerId: b.cashDrawerId?.trim() ?? "",
    callerIdEnabled: !!b.callerIdEnabled,
    scaleEnabled: !!b.scaleEnabled,
    customerDisplayEnabled: !!b.customerDisplayEnabled,
    customerDisplayModel: b.customerDisplayModel?.trim() ?? "",
    deviceManagerPort: b.deviceManagerPort?.trim() ?? "",
    paymentTerminalId: b.paymentTerminalId?.trim() ?? "",
    area: b.area?.trim() ?? "",
    waitlistPrinterId: b.waitlistPrinterId?.trim() ?? "",
  };
}

export function renderTerminalClientBindingSection(
  binding: TerminalClientBinding,
  opts: { inputClass: string; selectClass: string },
): string {
  const cash = cashDrawerOptions();
  const pay = paymentTerminalOptions();

  return `
    <section class="rounded-xl border border-border bg-card p-5 shadow-sm" data-terminal-client-binding-section>
      <h2 class="text-base font-semibold text-card-foreground">客户端绑定</h2>
      <p class="mt-1 text-sm text-muted-foreground">按终端配置打印机、钱箱、支付终端与外设（seq 370–385）。</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="terminal-binding-name">名称</label>
          <input
            id="terminal-binding-name"
            type="text"
            class="${opts.inputClass} sm:max-w-md"
            data-terminal-binding-field="name"
            value="${escapeHtml(binding.name)}"
            required
            placeholder="终端在门店内的识别名称"
          />
        </div>
        ${renderPrinterSelect("receiptPrinterId", "收据打印机", binding.receiptPrinterId, opts.selectClass)}
        ${renderPrinterSelect("paymentPrinterId", "支付打印机", binding.paymentPrinterId, opts.selectClass)}
        ${renderPrinterSelect("queuePrinterId", "叫号打印机", binding.queuePrinterId, opts.selectClass)}
        ${renderPrinterSelect("servingPrinterId", "上菜打印机", binding.servingPrinterId, opts.selectClass)}
        ${renderPrinterSelect("packPrinterId", "打包打印机", binding.packPrinterId, opts.selectClass)}
        ${renderSelect(
          "cashDrawerId",
          "钱箱",
          binding.cashDrawerId,
          [{ value: "", label: "未绑定" }, ...cash.map((c) => ({ value: c.id, label: c.name }))],
          opts.selectClass,
        )}
        ${renderSelect(
          "paymentTerminalId",
          "支付终端",
          binding.paymentTerminalId,
          [{ value: "", label: "未绑定" }, ...pay.map((p) => ({ value: p.id, label: p.name }))],
          opts.selectClass,
        )}
        ${renderSelect("area", "区域", binding.area, AREA_OPTIONS, opts.selectClass)}
        ${renderPrinterSelect("waitlistPrinterId", "等位打印机", binding.waitlistPrinterId, opts.selectClass)}
        <div>
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="terminal-binding-port">设备管理器端口</label>
          <input
            id="terminal-binding-port"
            type="text"
            inputmode="numeric"
            class="${opts.inputClass} font-mono text-xs"
            data-terminal-binding-field="deviceManagerPort"
            value="${escapeHtml(binding.deviceManagerPort)}"
            placeholder="如：9100"
          />
        </div>
      </div>
      <div class="mt-4 space-y-3">
        ${renderBindingToggle("callerIdEnabled", "启用来电显示", binding.callerIdEnabled)}
        ${renderBindingToggle("scaleEnabled", "启用磅秤", binding.scaleEnabled)}
        ${renderBindingToggle("customerDisplayEnabled", "启用顾客显示屏", binding.customerDisplayEnabled)}
        <div data-terminal-cds-model-wrap class="pl-1 ${binding.customerDisplayEnabled ? "" : "hidden"}">
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground">顾客显示屏型号</label>
          <div class="max-w-md">
            ${renderSelect(
              "customerDisplayModel",
              "",
              binding.customerDisplayModel,
              CUSTOMER_DISPLAY_MODEL_OPTIONS,
              opts.selectClass,
            )}
          </div>
        </div>
      </div>
    </section>`;
}

function readBindingToggle(btn: HTMLButtonElement): boolean {
  return btn.getAttribute("aria-checked") === "true";
}

function setBindingToggle(btn: HTMLButtonElement, on: boolean): void {
  btn.setAttribute("aria-checked", on ? "true" : "false");
  btn.classList.remove(...TOGGLE_TRACK_ON.split(/\s+/), ...TOGGLE_TRACK_OFF.split(/\s+/));
  btn.classList.add(...(on ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF).split(/\s+/));
  const knob = btn.querySelector("span");
  if (knob) {
    knob.classList.toggle("translate-x-5", on);
    knob.classList.toggle("translate-x-0.5", !on);
  }
}

function syncCustomerDisplayModelWrap(form: HTMLElement): void {
  const enabled = form.querySelector<HTMLButtonElement>(
    '[data-terminal-binding-toggle="customerDisplayEnabled"]',
  );
  const wrap = form.querySelector<HTMLElement>("[data-terminal-cds-model-wrap]");
  if (!enabled || !wrap) return;
  wrap.classList.toggle("hidden", !readBindingToggle(enabled));
}

export function collectTerminalClientBindingFromForm(form: HTMLElement): TerminalClientBinding {
  const getField = (field: keyof TerminalClientBinding): string => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-terminal-binding-field="${field}"]`,
    );
    return el?.value.trim() ?? "";
  };

  const toggles: Partial<TerminalClientBinding> = {};
  form.querySelectorAll<HTMLButtonElement>("[data-terminal-binding-toggle]").forEach((btn) => {
    const field = btn.getAttribute("data-terminal-binding-toggle");
    if (
      field === "callerIdEnabled" ||
      field === "scaleEnabled" ||
      field === "customerDisplayEnabled"
    ) {
      toggles[field] = readBindingToggle(btn);
    }
  });

  return normalizeTerminalClientBinding({
    name: getField("name"),
    receiptPrinterId: getField("receiptPrinterId"),
    paymentPrinterId: getField("paymentPrinterId"),
    queuePrinterId: getField("queuePrinterId"),
    servingPrinterId: getField("servingPrinterId"),
    packPrinterId: getField("packPrinterId"),
    cashDrawerId: getField("cashDrawerId"),
    paymentTerminalId: getField("paymentTerminalId"),
    area: getField("area"),
    waitlistPrinterId: getField("waitlistPrinterId"),
    deviceManagerPort: getField("deviceManagerPort"),
    customerDisplayModel: getField("customerDisplayModel"),
    ...toggles,
  });
}

let terminalBindingToggleClickBound = false;

export function bindTerminalClientBindingForm(form: HTMLElement): void {
  syncCustomerDisplayModelWrap(form);

  if (!terminalBindingToggleClickBound) {
    terminalBindingToggleClickBound = true;
    document.addEventListener(
      "click",
      (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
          "[data-terminal-binding-toggle]",
        );
        if (!btn?.closest("[data-terminal-client-binding-section]")) return;
        e.preventDefault();
        setBindingToggle(btn, !readBindingToggle(btn));
        const rootForm = btn.closest("form");
        if (rootForm instanceof HTMLElement) syncCustomerDisplayModelWrap(rootForm);
      },
      true,
    );
  }

  form.querySelectorAll<HTMLButtonElement>("[data-terminal-binding-toggle]").forEach((btn) => {
    setBindingToggle(btn, readBindingToggle(btn));
  });
}
