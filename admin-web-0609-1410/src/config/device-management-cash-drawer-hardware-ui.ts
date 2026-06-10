/**
 * 硬件管理中心 → 硬件 → 钱箱：钱箱台账（seq 364–369）+ 门店策略（seq 1 / 254 / 255）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  getDefaultModuleSettingToggleOn,
  moduleSettingToggleStorageKey,
} from "./module-settings-toggle-ui";

export const CASH_DRAWER_DEVICES_FIELD_ID = "dm-cash-drawer-devices";

/** 门店级：钱箱能力总闸（seq 1） */
export const CASH_DRAWER_STORE_ENABLE_SEQ = 1;
/** 刷卡支付成功后自动开钱箱（seq 254） */
export const CASH_DRAWER_AUTO_OPEN_CARD_SEQ = 254;
/** 现金支付成功后自动开钱箱（seq 255） */
export const CASH_DRAWER_AUTO_OPEN_CASH_SEQ = 255;

const LIST_PATH = "/device-management/hardware/cash-drawer";
const EDIT_PREFIX = "/device-management/hardware/cash-drawer/edit/";
const NEW_PATH = "/device-management/hardware/cash-drawer/new";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const CHECKBOX_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

const TOGGLE_TRACK_ON = "border-primary bg-primary";
const TOGGLE_TRACK_OFF = "border-input bg-muted";
const TOGGLE_KNOB =
  "bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";

export type CashDrawerDeviceType = "printer-rj11" | "usb-direct" | "network";

export type CashDrawerHardwareDevice = {
  id: string;
  /** 名称（门店识别用） */
  name: string;
  /** 设备名称（硬件上报/系统名） */
  deviceName: string;
  deviceType: CashDrawerDeviceType;
  connectedPrinterId: string;
  allowedEmployeeIds: string[];
};

type StaffOption = { id: string; name: string };
type PrinterOption = { id: string; name: string };

const DEVICE_TYPE_OPTIONS: { value: CashDrawerDeviceType; label: string }[] = [
  { value: "printer-rj11", label: "打印机 RJ11" },
  { value: "usb-direct", label: "USB 直连" },
  { value: "network", label: "网络钱箱" },
];

const PRINTER_OPTIONS: PrinterOption[] = [
  { id: "pr-receipt-1", name: "前台收据打印机" },
  { id: "pr-receipt-2", name: "吧台收据打印机" },
  { id: "pr-kitchen-1", name: "厨房热敏打印机" },
  { id: "pr-pack-1", name: "打包单打印机" },
];

const STAFF_OPTIONS: StaffOption[] = [
  { id: "emp-001", name: "张明" },
  { id: "emp-002", name: "李芳" },
  { id: "emp-003", name: "王磊" },
  { id: "emp-004", name: "陈静" },
  { id: "emp-005", name: "店长 Admin" },
];

const STORAGE_DEFAULT: CashDrawerHardwareDevice[] = [
  {
    id: "drawer-001",
    name: "1号钱箱",
    deviceName: "CashDrawer-Front",
    deviceType: "printer-rj11",
    connectedPrinterId: "pr-receipt-1",
    allowedEmployeeIds: ["emp-001", "emp-002", "emp-005"],
  },
  {
    id: "drawer-002",
    name: "吧台钱箱",
    deviceName: "CashDrawer-Bar",
    deviceType: "printer-rj11",
    connectedPrinterId: "pr-receipt-2",
    allowedEmployeeIds: ["emp-003", "emp-005"],
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function deviceTypeLabel(type: CashDrawerDeviceType): string {
  return DEVICE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function printerLabel(printerId: string): string {
  return PRINTER_OPTIONS.find((p) => p.id === printerId)?.name ?? "—";
}

function staffLabels(employeeIds: string[]): string {
  if (employeeIds.length === 0) return "—";
  const names = employeeIds
    .map((id) => STAFF_OPTIONS.find((s) => s.id === id)?.name)
    .filter((n): n is string => !!n);
  return names.length > 0 ? names.join("、") : "—";
}

function readCashDrawerPolicyToggle(seq: number): boolean {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === null) return getDefaultModuleSettingToggleOn(seq);
    return raw === "1" || raw === "true";
  } catch {
    return getDefaultModuleSettingToggleOn(seq);
  }
}

function writeCashDrawerPolicyToggle(seq: number, on: boolean): void {
  try {
    localStorage.setItem(moduleSettingToggleStorageKey(seq), on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function readToggle(btn: HTMLButtonElement): boolean {
  return btn.getAttribute("aria-checked") === "true";
}

function setToggle(btn: HTMLButtonElement, on: boolean): void {
  btn.setAttribute("aria-checked", on ? "true" : "false");
  btn.classList.remove(...TOGGLE_TRACK_ON.split(/\s+/), ...TOGGLE_TRACK_OFF.split(/\s+/));
  btn.classList.add(...(on ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF).split(/\s+/));
  const knob = btn.querySelector("span");
  if (knob) {
    knob.classList.toggle("translate-x-5", on);
    knob.classList.toggle("translate-x-0.5", !on);
  }
}

function renderToggleSwitch(
  field: string,
  on: boolean,
  ariaLabel: string,
  opts?: { disabled?: boolean },
): string {
  const trackClass = on ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF;
  const knobClass = on ? "translate-x-5" : "translate-x-0.5";
  const disabled = opts?.disabled ?? false;
  return `
    <button
      type="button"
      role="switch"
      aria-checked="${on ? "true" : "false"}"
      aria-label="${escapeHtml(ariaLabel)}"
      ${disabled ? 'aria-disabled="true" disabled' : ""}
      data-cash-drawer-policy-toggle="${escapeHtml(field)}"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}"
    >
      <span class="pointer-events-none block size-5 ${knobClass} ${TOGGLE_KNOB} rounded-full transition-transform duration-200" aria-hidden="true"></span>
    </button>`;
}

function renderPolicyToggleRow(
  field: string,
  label: string,
  on: boolean,
  description: string,
  opts?: { disabled?: boolean },
): string {
  return `
    <div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm ${opts?.disabled ? "opacity-60" : ""}" data-cash-drawer-policy-row="${escapeHtml(field)}">
      <div class="min-w-0">
        <p class="text-sm font-medium text-card-foreground">${escapeHtml(label)}</p>
        <p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(description)}</p>
      </div>
      ${renderToggleSwitch(field, on, label, opts)}
    </div>`;
}

function syncAutoOpenPolicyDisabled(root: HTMLElement): void {
  const storeOn = readCashDrawerPolicyToggle(CASH_DRAWER_STORE_ENABLE_SEQ);
  for (const field of ["autoOpenCard", "autoOpenCash"] as const) {
    const row = root.querySelector<HTMLElement>(`[data-cash-drawer-policy-row="${field}"]`);
    const btn = row?.querySelector<HTMLButtonElement>(`[data-cash-drawer-policy-toggle="${field}"]`);
    if (!btn) continue;
    btn.disabled = !storeOn;
    btn.setAttribute("aria-disabled", storeOn ? "false" : "true");
    btn.classList.toggle("cursor-not-allowed", !storeOn);
    btn.classList.toggle("opacity-50", !storeOn);
    btn.classList.toggle("cursor-pointer", storeOn);
    row?.classList.toggle("opacity-60", !storeOn);
  }
}

function renderStorePolicyCard(): string {
  const storeOn = readCashDrawerPolicyToggle(CASH_DRAWER_STORE_ENABLE_SEQ);
  const autoCard = readCashDrawerPolicyToggle(CASH_DRAWER_AUTO_OPEN_CARD_SEQ);
  const autoCash = readCashDrawerPolicyToggle(CASH_DRAWER_AUTO_OPEN_CASH_SEQ);
  const autoDisabled = !storeOn;

  return `
    <section class="rounded-xl border border-border bg-card p-5 shadow-sm" data-cash-drawer-store-policy>
      <h2 class="text-base font-semibold text-card-foreground">门店钱箱策略</h2>
      <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        门店级钱箱能力与支付触发规则（原设置 seq 1 / 254 / 255）。手动开钱箱仍受各钱箱「允许开钱箱的员工」约束。
      </p>
      <div class="mt-4 space-y-3">
        ${renderPolicyToggleRow(
          "storeEnabled",
          "钱箱开关",
          storeOn,
          "控制钱箱的开启还是关闭；开启后，使用钱箱需要权限才能打开",
        )}
        ${renderPolicyToggleRow(
          "autoOpenCard",
          "以下操作时自动开钱箱(刷卡)",
          autoCard,
          "设置使用信用卡支付时是否自动打开钱箱",
          { disabled: autoDisabled },
        )}
        ${renderPolicyToggleRow(
          "autoOpenCash",
          "当用现金付款时自动打开钱箱",
          autoCash,
          "设置使用现金支付时是否自动打开钱箱",
          { disabled: autoDisabled },
        )}
      </div>
    </section>`;
}

function normalizeEmployeeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set(STAFF_OPTIONS.map((s) => s.id));
  return raw.filter((id): id is string => typeof id === "string" && valid.has(id));
}

function normalizeDeviceType(raw: unknown): CashDrawerDeviceType {
  if (raw === "printer-rj11" || raw === "usb-direct" || raw === "network") return raw;
  return "printer-rj11";
}

function normalizeDevice(raw: Partial<CashDrawerHardwareDevice>): CashDrawerHardwareDevice | null {
  if (!raw.id) return null;
  const name = raw.name?.trim();
  const deviceName = raw.deviceName?.trim();
  if (!name || !deviceName) return null;
  return {
    id: raw.id,
    name,
    deviceName,
    deviceType: normalizeDeviceType(raw.deviceType),
    connectedPrinterId: raw.connectedPrinterId?.trim() || "",
    allowedEmployeeIds: normalizeEmployeeIds(raw.allowedEmployeeIds),
  };
}

export function readCashDrawerHardwareDevices(): CashDrawerHardwareDevice[] {
  const raw = readModuleSettingJson<Partial<CashDrawerHardwareDevice>[]>(CASH_DRAWER_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: CashDrawerHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writeCashDrawerHardwareDevices(devices: CashDrawerHardwareDevice[]): void {
  writeModuleSettingJson(CASH_DRAWER_DEVICES_FIELD_ID, devices);
}

export function findCashDrawerHardwareDevice(id: string): CashDrawerHardwareDevice | undefined {
  return readCashDrawerHardwareDevices().find((d) => d.id === id);
}

function navigateCashDrawerPath(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  location.hash = nextHash;
}

function newDeviceId(): string {
  return `drawer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function renderTableCell(value: string, opts?: { maxWidth?: string }): string {
  const max = opts?.maxWidth ?? "max-w-[12rem]";
  return `
    <td class="px-3 py-3 align-top text-foreground">
      <span class="block truncate text-sm ${max}" title="${escapeHtml(value)}">${escapeHtml(value)}</span>
    </td>`;
}

function renderDeviceTable(devices: CashDrawerHardwareDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">暂无钱箱。请点击「新增钱箱」添加。</p>`;
  }

  const rows = devices
    .map((d) => {
      const editPath = `${EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      const employeesSummary = staffLabels(d.allowedEmployeeIds);
      const printer = printerLabel(d.connectedPrinterId);
      return `
      <tr class="border-t border-border" data-cash-drawer-row data-device-id="${escapeHtml(d.id)}">
        ${renderTableCell(d.name, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(d.deviceName, { maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(deviceTypeLabel(d.deviceType))}
        ${renderTableCell(printer, { maxWidth: "max-w-[11rem]" })}
        ${renderTableCell(employeesSummary, { maxWidth: "max-w-[14rem]" })}
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-cash-drawer-edit data-device-id="${escapeHtml(d.id)}">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-cash-drawer-delete data-device-id="${escapeHtml(d.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[48rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备类型</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">连接的打印机</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">允许开钱箱的员工</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPrinterSelect(selectedId: string, required: boolean): string {
  const options = [
    `<option value="">请选择打印机</option>`,
    ...PRINTER_OPTIONS.map(
      (p) =>
        `<option value="${escapeHtml(p.id)}" ${p.id === selectedId ? "selected" : ""}>${escapeHtml(p.name)}</option>`,
    ),
  ].join("");
  return `
    <select class="${SELECT_CLASS} sm:max-w-md" data-cash-drawer-field="connectedPrinterId" ${required ? "required" : ""}>
      ${options}
    </select>`;
}

function renderDeviceTypeSelect(selected: CashDrawerDeviceType): string {
  const options = DEVICE_TYPE_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");
  return `
    <select class="${SELECT_CLASS} sm:max-w-md" data-cash-drawer-field="deviceType" required>
      ${options}
    </select>`;
}

function renderEmployeeCheckboxes(selectedIds: string[]): string {
  const items = STAFF_OPTIONS.map((s) => {
    const checked = selectedIds.includes(s.id) ? "checked" : "";
    return `
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/50">
        <input type="checkbox" class="${CHECKBOX_CLASS}" value="${escapeHtml(s.id)}" data-cash-drawer-employee ${checked} />
        ${escapeHtml(s.name)}
      </label>`;
  }).join("");
  return `<div class="flex flex-wrap gap-2" data-cash-drawer-employees>${items}</div>`;
}

function renderFormPage(device: CashDrawerHardwareDevice, opts: { isNew: boolean }): string {
  const title = opts.isNew ? "新增钱箱" : "编辑钱箱";
  const showPrinter = device.deviceType === "printer-rj11";

  return `
    <div class="device-management-cash-drawer-hardware space-y-6" data-cash-drawer-page data-cash-drawer-view="edit" data-device-id="${escapeHtml(device.id)}" data-is-new="${opts.isNew ? "1" : "0"}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-cash-drawer-edit-back>← 返回钱箱列表</a>
      </div>
      <form class="space-y-6" data-cash-drawer-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="cd-edit-name">名称</label>
              <input id="cd-edit-name" type="text" class="${INPUT_CLASS}" data-cash-drawer-field="name" value="${escapeHtml(device.name)}" required placeholder="如：1号钱箱" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="cd-edit-device-name">设备名称</label>
              <input id="cd-edit-device-name" type="text" class="${INPUT_CLASS}" data-cash-drawer-field="deviceName" value="${escapeHtml(device.deviceName)}" required placeholder="硬件/系统设备名" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="cd-edit-type">设备类型</label>
              <div id="cd-edit-type">${renderDeviceTypeSelect(device.deviceType)}</div>
            </div>
            <div data-cash-drawer-printer-wrap class="${showPrinter ? "" : "hidden"}">
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="cd-edit-printer">连接的打印机</label>
              <div id="cd-edit-printer">${renderPrinterSelect(device.connectedPrinterId, showPrinter)}</div>
              <p class="mt-1 text-xs text-muted-foreground">设备类型为「打印机 RJ11」时需绑定驱动开钱箱的打印机。</p>
            </div>
          </div>
        </section>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">允许开钱箱的员工</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            勾选有权限手动开钱箱的员工；须先在
            <a href="#${LIST_PATH}" class="font-medium text-primary hover:underline">钱箱列表</a>
            开启「门店钱箱策略 → 钱箱开关」，并与角色权限配合生效。
          </p>
          <div class="mt-3">${renderEmployeeCheckboxes(device.allowedEmployeeIds)}</div>
        </section>
        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-cash-drawer-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

function renderListPage(): string {
  const devices = readCashDrawerHardwareDevices();
  return `
    <div class="device-management-cash-drawer-hardware space-y-6" data-cash-drawer-page data-cash-drawer-view="list">
      ${renderStorePolicyCard()}
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-card-foreground">钱箱</h2>
            <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              管理门店钱箱台账：名称、设备类型、连接的打印机及允许开钱箱的员工（seq 364–369）。
            </p>
          </div>
          <a href="#${NEW_PATH}" class="${BTN_PRIMARY}" data-cash-drawer-add>新增钱箱</a>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="cash-drawer-search">搜索钱箱</label>
          <input
            id="cash-drawer-search"
            type="search"
            placeholder="按名称、设备名称、打印机、员工搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-cash-drawer-search
          />
          <span class="text-sm text-muted-foreground" data-cash-drawer-count>共 ${devices.length} 个</span>
        </div>
      </div>
      <div data-cash-drawer-list>${renderDeviceTable(devices)}</div>
    </div>`;
}

export function getCashDrawerHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(EDIT_PREFIX)) return null;
  const raw = path.slice(EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementCashDrawerHardwarePath(path: string): boolean {
  return path === LIST_PATH || path.startsWith(`${LIST_PATH}/`);
}

export function renderDeviceManagementCashDrawerHardwarePage(path: string): string {
  if (path === NEW_PATH) {
    return renderFormPage(
      {
        id: newDeviceId(),
        name: "",
        deviceName: "",
        deviceType: "printer-rj11",
        connectedPrinterId: "",
        allowedEmployeeIds: [],
      },
      { isNew: true },
    );
  }

  const editId = getCashDrawerHardwareEditDeviceId(path);
  if (editId) {
    const device = findCashDrawerHardwareDevice(editId);
    if (!device) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-cash-drawer-page>
          <p class="text-sm text-muted-foreground">未找到该钱箱。</p>
          <a href="#${LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回钱箱列表</a>
        </div>`;
    }
    return renderFormPage(device, { isNew: false });
  }

  return renderListPage();
}

function filterDevices(devices: CashDrawerHardwareDevice[], keyword: string): CashDrawerHardwareDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.name,
      d.deviceName,
      deviceTypeLabel(d.deviceType),
      printerLabel(d.connectedPrinterId),
      staffLabels(d.allowedEmployeeIds),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const list = root.querySelector("[data-cash-drawer-list]");
  const countEl = root.querySelector("[data-cash-drawer-count]");
  if (!list) return;
  const devices = filterDevices(readCashDrawerHardwareDevices(), keyword);
  list.innerHTML = renderDeviceTable(devices);
  if (countEl) {
    const total = readCashDrawerHardwareDevices().length;
    countEl.textContent =
      keyword.trim() && devices.length !== total
        ? `显示 ${devices.length} / ${total} 个`
        : `共 ${total} 个`;
  }
}

function collectFormState(form: HTMLElement): Partial<CashDrawerHardwareDevice> | null {
  const getField = (field: string): string => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-cash-drawer-field="${field}"]`,
    );
    return el?.value.trim() ?? "";
  };

  const name = getField("name");
  const deviceName = getField("deviceName");
  const deviceType = normalizeDeviceType(getField("deviceType"));
  const connectedPrinterId = getField("connectedPrinterId");

  if (!name || !deviceName) return null;
  if (deviceType === "printer-rj11" && !connectedPrinterId) return null;

  const allowedEmployeeIds: string[] = [];
  form.querySelectorAll<HTMLInputElement>("[data-cash-drawer-employee]:checked").forEach((cb) => {
    if (cb.value) allowedEmployeeIds.push(cb.value);
  });

  return {
    name,
    deviceName,
    deviceType,
    connectedPrinterId: deviceType === "printer-rj11" ? connectedPrinterId : "",
    allowedEmployeeIds,
  };
}

function syncPrinterFieldVisibility(form: HTMLElement): void {
  const typeEl = form.querySelector<HTMLSelectElement>('[data-cash-drawer-field="deviceType"]');
  const wrap = form.querySelector<HTMLElement>("[data-cash-drawer-printer-wrap]");
  const select = form.querySelector<HTMLSelectElement>('[data-cash-drawer-field="connectedPrinterId"]');
  if (!typeEl || !wrap || !select) return;
  const show = typeEl.value === "printer-rj11";
  wrap.classList.toggle("hidden", !show);
  select.required = show;
  if (!show) select.value = "";
}

function saveDevice(deviceId: string, isNew: boolean, form: HTMLElement): boolean {
  const patch = collectFormState(form);
  if (!patch) {
    window.alert("请填写名称、设备名称；RJ11 类型须选择连接的打印机。");
    return false;
  }

  const devices = readCashDrawerHardwareDevices();
  if (isNew) {
    const created = normalizeDevice({ id: deviceId, ...patch });
    if (!created) return false;
    writeCashDrawerHardwareDevices([...devices, created]);
    return true;
  }

  const idx = devices.findIndex((d) => d.id === deviceId);
  if (idx < 0) return false;
  const next = [...devices];
  next[idx] = normalizeDevice({ ...next[idx], ...patch })!;
  writeCashDrawerHardwareDevices(next);
  return true;
}

function deleteDevice(deviceId: string): void {
  writeCashDrawerHardwareDevices(readCashDrawerHardwareDevices().filter((d) => d.id !== deviceId));
}

const POLICY_TOGGLE_TO_SEQ: Record<string, number> = {
  storeEnabled: CASH_DRAWER_STORE_ENABLE_SEQ,
  autoOpenCard: CASH_DRAWER_AUTO_OPEN_CARD_SEQ,
  autoOpenCash: CASH_DRAWER_AUTO_OPEN_CASH_SEQ,
};

let cashDrawerPolicyToggleBound = false;

function ensureCashDrawerPolicyToggleListener(): void {
  if (cashDrawerPolicyToggleBound) return;
  cashDrawerPolicyToggleBound = true;
  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-cash-drawer-policy-toggle]");
      if (!btn?.closest("[data-cash-drawer-store-policy]")) return;
      if (btn.disabled) return;
      e.preventDefault();
      const field = btn.getAttribute("data-cash-drawer-policy-toggle");
      if (!field) return;
      const seq = POLICY_TOGGLE_TO_SEQ[field];
      if (!seq) return;
      const next = !readToggle(btn);
      setToggle(btn, next);
      writeCashDrawerPolicyToggle(seq, next);
      const page = btn.closest<HTMLElement>("[data-cash-drawer-page]");
      if (page) syncAutoOpenPolicyDisabled(page);
    },
    true,
  );
}

export function bindDeviceManagementCashDrawerHardware(root: ParentNode = document): void {
  ensureCashDrawerPolicyToggleListener();

  const page = root.querySelector("[data-cash-drawer-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-cash-drawer-view");

  if (view === "list") {
    if (page.dataset.cashDrawerListBound === "1") return;
    page.dataset.cashDrawerListBound = "1";

    page.querySelectorAll<HTMLButtonElement>("[data-cash-drawer-policy-toggle]").forEach((btn) => {
      const field = btn.getAttribute("data-cash-drawer-policy-toggle");
      const seq = field ? POLICY_TOGGLE_TO_SEQ[field] : undefined;
      if (seq) setToggle(btn, readCashDrawerPolicyToggle(seq));
    });
    syncAutoOpenPolicyDisabled(page);

    const search = page.querySelector<HTMLInputElement>("[data-cash-drawer-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const add = (e.target as HTMLElement).closest<HTMLElement>("[data-cash-drawer-add]");
      if (add) {
        e.preventDefault();
        navigateCashDrawerPath(NEW_PATH);
        return;
      }

      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-cash-drawer-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        if (id) navigateCashDrawerPath(`${EDIT_PREFIX}${encodeURIComponent(id)}`);
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-cash-drawer-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      if (!id) return;
      const device = findCashDrawerHardwareDevice(id);
      const label = device?.name ?? id;
      if (!window.confirm(`确定删除钱箱「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "edit") {
    if (page.dataset.cashDrawerEditBound === "1") return;
    page.dataset.cashDrawerEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const isNew = page.getAttribute("data-is-new") === "1";
    const form = page.querySelector<HTMLElement>("[data-cash-drawer-form]");
    if (!form) return;

    syncPrinterFieldVisibility(form);
    form.querySelector('[data-cash-drawer-field="deviceType"]')?.addEventListener("change", () => {
      syncPrinterFieldVisibility(form);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveDevice(deviceId, isNew, form)) return;
      navigateCashDrawerPath(LIST_PATH);
    });

    page.querySelector("[data-cash-drawer-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateCashDrawerPath(LIST_PATH);
    });
    page.querySelector("[data-cash-drawer-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateCashDrawerPath(LIST_PATH);
    });
  }
}
