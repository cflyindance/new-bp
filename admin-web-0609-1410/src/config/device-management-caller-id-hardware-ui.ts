/**
 * 硬件管理中心 → 硬件 → 来电显示（原设置 seq 15 / 184 / 185）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  getDefaultModuleSettingToggleOn,
  moduleSettingToggleStorageKey,
} from "./module-settings-toggle-ui";

export const CALLER_ID_DEVICES_FIELD_ID = "dm-caller-id-devices";

/** 门店级：POS 启用来电点单显示（seq 184） */
export const CALLER_ID_STORE_ENABLE_SEQ = 184;

const LIST_PATH = "/device-management/hardware/caller-id";
const EDIT_PREFIX = "/device-management/hardware/caller-id/edit/";
const NEW_PATH = "/device-management/hardware/caller-id/new";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

const TOGGLE_TRACK_ON = "border-primary bg-primary";
const TOGGLE_TRACK_OFF = "border-input bg-muted";
const TOGGLE_KNOB =
  "bg-white shadow-md ring-1 ring-black/10 dark:bg-neutral-100 dark:ring-white/15";

export type CallerIdDeviceType = "serial-modem" | "usb-caller-id" | "network" | "software";

export type CallerIdParity = "none" | "even" | "odd";

export type CallerIdHardwareDevice = {
  id: string;
  name: string;
  deviceName: string;
  deviceType: CallerIdDeviceType;
  /** 本设备启用来电显示 */
  enabled: boolean;
  serialPort: string;
  baudRate: string;
  dataBits: string;
  parity: CallerIdParity;
  stopBits: string;
};

const DEVICE_TYPE_OPTIONS: { value: CallerIdDeviceType; label: string }[] = [
  { value: "serial-modem", label: "串口来电调制解调器" },
  { value: "usb-caller-id", label: "USB 来电显示盒" },
  { value: "network", label: "网络来电接口" },
  { value: "software", label: "软件 / API" },
];

const BAUD_RATE_OPTIONS = ["9600", "19200", "38400", "57600", "115200"];

const PARITY_OPTIONS: { value: CallerIdParity; label: string }[] = [
  { value: "none", label: "无" },
  { value: "even", label: "偶校验" },
  { value: "odd", label: "奇校验" },
];

const STORAGE_DEFAULT: CallerIdHardwareDevice[] = [
  {
    id: "caller-id-001",
    name: "前台来电显示",
    deviceName: "CallerID-Front-COM3",
    deviceType: "serial-modem",
    enabled: true,
    serialPort: "COM3",
    baudRate: "9600",
    dataBits: "8",
    parity: "none",
    stopBits: "1",
  },
  {
    id: "caller-id-002",
    name: "吧台 USB 来电盒",
    deviceName: "CallerID-Bar-USB",
    deviceType: "usb-caller-id",
    enabled: true,
    serialPort: "",
    baudRate: "9600",
    dataBits: "8",
    parity: "none",
    stopBits: "1",
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function deviceTypeLabel(type: CallerIdDeviceType): string {
  return DEVICE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function normalizeDeviceType(raw: unknown): CallerIdDeviceType {
  if (raw === "serial-modem" || raw === "usb-caller-id" || raw === "network" || raw === "software") {
    return raw;
  }
  return "serial-modem";
}

function normalizeParity(raw: unknown): CallerIdParity {
  if (raw === "even" || raw === "odd" || raw === "none") return raw;
  return "none";
}

function normalizeDevice(raw: Partial<CallerIdHardwareDevice>): CallerIdHardwareDevice | null {
  if (!raw.id) return null;
  const name = raw.name?.trim();
  const deviceName = raw.deviceName?.trim();
  if (!name || !deviceName) return null;
  return {
    id: raw.id,
    name,
    deviceName,
    deviceType: normalizeDeviceType(raw.deviceType),
    enabled: !!raw.enabled,
    serialPort: raw.serialPort?.trim() ?? "",
    baudRate: raw.baudRate?.trim() || "9600",
    dataBits: raw.dataBits?.trim() || "8",
    parity: normalizeParity(raw.parity),
    stopBits: raw.stopBits?.trim() || "1",
  };
}

export function readStoreCallerIdEnabled(): boolean {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(CALLER_ID_STORE_ENABLE_SEQ));
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    /* ignore */
  }
  return getDefaultModuleSettingToggleOn(CALLER_ID_STORE_ENABLE_SEQ);
}

export function writeStoreCallerIdEnabled(on: boolean): void {
  try {
    localStorage.setItem(moduleSettingToggleStorageKey(CALLER_ID_STORE_ENABLE_SEQ), on ? "true" : "false");
  } catch {
    /* ignore */
  }
}

export function readCallerIdHardwareDevices(): CallerIdHardwareDevice[] {
  const raw = readModuleSettingJson<Partial<CallerIdHardwareDevice>[]>(CALLER_ID_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: CallerIdHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writeCallerIdHardwareDevices(devices: CallerIdHardwareDevice[]): void {
  writeModuleSettingJson(CALLER_ID_DEVICES_FIELD_ID, devices);
}

export function findCallerIdHardwareDevice(id: string): CallerIdHardwareDevice | undefined {
  return readCallerIdHardwareDevices().find((d) => d.id === id);
}

function navigateCallerIdPath(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  location.hash = nextHash;
}

function newDeviceId(): string {
  return `caller-id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function renderTableCell(value: string, opts?: { maxWidth?: string }): string {
  const max = opts?.maxWidth ?? "max-w-[10rem]";
  return `
    <td class="px-3 py-3 align-top text-foreground">
      <span class="block truncate text-sm ${max}" title="${escapeHtml(value)}">${escapeHtml(value)}</span>
    </td>`;
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

function renderToggleSwitch(field: string, on: boolean, ariaLabel: string): string {
  const trackClass = on ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF;
  const knobClass = on ? "translate-x-5" : "translate-x-0.5";
  return `
    <button
      type="button"
      role="switch"
      aria-checked="${on ? "true" : "false"}"
      aria-label="${escapeHtml(ariaLabel)}"
      data-caller-id-toggle="${escapeHtml(field)}"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass}"
    >
      <span class="pointer-events-none block size-5 ${knobClass} ${TOGGLE_KNOB} rounded-full transition-transform duration-200" aria-hidden="true"></span>
    </button>`;
}

function renderToggleRow(field: string, label: string, on: boolean, description?: string): string {
  return `
    <div class="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div class="min-w-0">
        <p class="text-sm font-medium text-card-foreground">${escapeHtml(label)}</p>
        ${description ? `<p class="mt-0.5 text-xs text-muted-foreground">${escapeHtml(description)}</p>` : ""}
      </div>
      ${renderToggleSwitch(field, on, label)}
    </div>`;
}

function renderDeviceTable(devices: CallerIdHardwareDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">暂无来电显示设备。请点击「新增来电显示」添加。</p>`;
  }

  const rows = devices
    .map((d) => {
      const editPath = `${EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      const enabledCls = d.enabled
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        : "bg-muted text-muted-foreground";
      const serialSummary =
        d.deviceType === "serial-modem"
          ? `${d.serialPort || "—"} @ ${d.baudRate}`
          : "—";
      return `
      <tr class="border-t border-border" data-caller-id-row data-device-id="${escapeHtml(d.id)}">
        ${renderTableCell(d.name, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(d.deviceName, { maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(deviceTypeLabel(d.deviceType))}
        <td class="px-3 py-3 align-top">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${enabledCls}">${d.enabled ? "已启用" : "未启用"}</span>
        </td>
        ${renderTableCell(serialSummary, { maxWidth: "max-w-[9rem]" })}
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-caller-id-edit data-device-id="${escapeHtml(d.id)}">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-caller-id-delete data-device-id="${escapeHtml(d.id)}">删除</button>
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
            <th class="px-3 py-2 font-medium whitespace-nowrap">启用</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">串口 / 波特率</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderSerialModemSection(device: CallerIdHardwareDevice): string {
  const baudOptions = BAUD_RATE_OPTIONS.map(
    (b) =>
      `<option value="${escapeHtml(b)}" ${b === device.baudRate ? "selected" : ""}>${escapeHtml(b)}</option>`,
  ).join("");
  const parityOptions = PARITY_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === device.parity ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");

  return `
    <section class="rounded-xl border border-border bg-card p-5 shadow-sm" data-caller-id-serial-section>
      <h2 class="text-base font-semibold text-card-foreground">Serial Caller ID Modem Settings</h2>
      <p class="mt-1 text-sm text-muted-foreground">串口通信参数：用于通过电话线接收来电信号（波特率、端口等）。</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground">串口</label>
          <input type="text" class="${INPUT_CLASS}" data-caller-id-field="serialPort" value="${escapeHtml(device.serialPort)}" placeholder="COM3" />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground">波特率</label>
          <select class="${SELECT_CLASS}" data-caller-id-field="baudRate">${baudOptions}</select>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground">数据位</label>
          <select class="${SELECT_CLASS}" data-caller-id-field="dataBits">
            <option value="7" ${device.dataBits === "7" ? "selected" : ""}>7</option>
            <option value="8" ${device.dataBits === "8" ? "selected" : ""}>8</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground">校验位</label>
          <select class="${SELECT_CLASS}" data-caller-id-field="parity">${parityOptions}</select>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-muted-foreground">停止位</label>
          <select class="${SELECT_CLASS}" data-caller-id-field="stopBits">
            <option value="1" ${device.stopBits === "1" ? "selected" : ""}>1</option>
            <option value="2" ${device.stopBits === "2" ? "selected" : ""}>2</option>
          </select>
        </div>
      </div>
    </section>`;
}

function renderFormPage(device: CallerIdHardwareDevice, opts: { isNew: boolean }): string {
  const title = opts.isNew ? "新增来电显示" : "编辑来电显示";
  const typeOptions = DEVICE_TYPE_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === device.deviceType ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");
  const showSerial = device.deviceType === "serial-modem";

  return `
    <div class="device-management-caller-id-hardware space-y-6" data-caller-id-page data-caller-id-view="edit" data-device-id="${escapeHtml(device.id)}" data-is-new="${opts.isNew ? "1" : "0"}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-caller-id-edit-back>← 返回来电显示列表</a>
      </div>
      <form class="space-y-6" data-caller-id-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="caller-id-edit-name">名称</label>
              <input id="caller-id-edit-name" type="text" class="${INPUT_CLASS}" data-caller-id-field="name" value="${escapeHtml(device.name)}" required />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="caller-id-edit-device-name">设备名称</label>
              <input id="caller-id-edit-device-name" type="text" class="${INPUT_CLASS}" data-caller-id-field="deviceName" value="${escapeHtml(device.deviceName)}" required />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">来电显示设备类型</label>
              <select class="${SELECT_CLASS} sm:max-w-md" data-caller-id-field="deviceType" required>${typeOptions}</select>
            </div>
          </div>
          <div class="mt-4">${renderToggleRow("enabled", "启用来电显示", device.enabled, "本设备是否参与来电点单显示")}</div>
        </section>
        <div data-caller-id-serial-wrap class="${showSerial ? "" : "hidden"}">${renderSerialModemSection(device)}</div>
        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-caller-id-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

function renderStorePolicyCard(): string {
  const on = readStoreCallerIdEnabled();
  return `
    <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 class="text-base font-semibold text-card-foreground">门店来电显示策略</h2>
      <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        控制 POS 是否启用来电点单显示能力（原设置「来电显示功能」）。
      </p>
      <div class="mt-4">${renderToggleRow("storeEnabled", "来电显示功能", on, "关闭后，门店 POS 不展示来电点单弹屏")}</div>
    </section>`;
}

function renderListPage(): string {
  const devices = readCallerIdHardwareDevices();
  return `
    <div class="device-management-caller-id-hardware space-y-6" data-caller-id-page data-caller-id-view="list">
      ${renderStorePolicyCard()}
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-card-foreground">来电显示设备</h2>
            <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              管理来电显示硬件台账：设备类型、串口调制解调器参数等（原设置 seq 15 / 185）。
            </p>
          </div>
          <a href="#${NEW_PATH}" class="${BTN_PRIMARY}" data-caller-id-add>新增来电显示</a>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="caller-id-search">搜索来电显示</label>
          <input
            id="caller-id-search"
            type="search"
            placeholder="按名称、设备名称、串口搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-caller-id-search
          />
          <span class="text-sm text-muted-foreground" data-caller-id-count>共 ${devices.length} 台</span>
        </div>
      </div>
      <div data-caller-id-list>${renderDeviceTable(devices)}</div>
    </div>`;
}

export function getCallerIdHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(EDIT_PREFIX)) return null;
  const raw = path.slice(EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementCallerIdHardwarePath(path: string): boolean {
  return path === LIST_PATH || path.startsWith(`${LIST_PATH}/`);
}

export function renderDeviceManagementCallerIdHardwarePage(path: string): string {
  if (path === NEW_PATH) {
    return renderFormPage(
      {
        id: newDeviceId(),
        name: "",
        deviceName: "",
        deviceType: "serial-modem",
        enabled: true,
        serialPort: "COM1",
        baudRate: "9600",
        dataBits: "8",
        parity: "none",
        stopBits: "1",
      },
      { isNew: true },
    );
  }

  const editId = getCallerIdHardwareEditDeviceId(path);
  if (editId) {
    const device = findCallerIdHardwareDevice(editId);
    if (!device) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-caller-id-page>
          <p class="text-sm text-muted-foreground">未找到该来电显示设备。</p>
          <a href="#${LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回列表</a>
        </div>`;
    }
    return renderFormPage(device, { isNew: false });
  }

  return renderListPage();
}

function filterDevices(devices: CallerIdHardwareDevice[], keyword: string): CallerIdHardwareDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.name,
      d.deviceName,
      deviceTypeLabel(d.deviceType),
      d.serialPort,
      d.baudRate,
      d.enabled ? "已启用" : "未启用",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const list = root.querySelector("[data-caller-id-list]");
  const countEl = root.querySelector("[data-caller-id-count]");
  if (!list) return;
  const devices = filterDevices(readCallerIdHardwareDevices(), keyword);
  list.innerHTML = renderDeviceTable(devices);
  if (countEl) {
    const total = readCallerIdHardwareDevices().length;
    countEl.textContent =
      keyword.trim() && devices.length !== total
        ? `显示 ${devices.length} / ${total} 台`
        : `共 ${total} 台`;
  }
}

function syncSerialSectionVisibility(form: HTMLElement): void {
  const typeEl = form.querySelector<HTMLSelectElement>('[data-caller-id-field="deviceType"]');
  const wrap = form.querySelector<HTMLElement>("[data-caller-id-serial-wrap]");
  if (!typeEl || !wrap) return;
  const show = typeEl.value === "serial-modem";
  wrap.classList.toggle("hidden", !show);
}

function collectFormState(form: HTMLElement): Partial<CallerIdHardwareDevice> | null {
  const getField = (field: string): string => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-caller-id-field="${field}"]`,
    );
    return el?.value.trim() ?? "";
  };

  const name = getField("name");
  const deviceName = getField("deviceName");
  if (!name || !deviceName) return null;

  let enabled = false;
  form.querySelectorAll<HTMLButtonElement>("[data-caller-id-toggle]").forEach((btn) => {
    if (btn.getAttribute("data-caller-id-toggle") === "enabled") {
      enabled = readToggle(btn);
    }
  });

  return {
    name,
    deviceName,
    deviceType: normalizeDeviceType(getField("deviceType")),
    enabled,
    serialPort: getField("serialPort"),
    baudRate: getField("baudRate"),
    dataBits: getField("dataBits"),
    parity: normalizeParity(getField("parity")),
    stopBits: getField("stopBits"),
  };
}

function saveDevice(deviceId: string, isNew: boolean, form: HTMLElement): boolean {
  const patch = collectFormState(form);
  if (!patch) {
    window.alert("请填写名称与设备名称。");
    return false;
  }

  const devices = readCallerIdHardwareDevices();
  if (isNew) {
    const created = normalizeDevice({ id: deviceId, ...patch });
    if (!created) return false;
    writeCallerIdHardwareDevices([...devices, created]);
    return true;
  }

  const idx = devices.findIndex((d) => d.id === deviceId);
  if (idx < 0) return false;
  const next = [...devices];
  next[idx] = normalizeDevice({ ...next[idx], ...patch })!;
  writeCallerIdHardwareDevices(next);
  return true;
}

function deleteDevice(deviceId: string): void {
  writeCallerIdHardwareDevices(readCallerIdHardwareDevices().filter((d) => d.id !== deviceId));
}

let callerIdToggleClickBound = false;

function ensureCallerIdToggleClickListener(): void {
  if (callerIdToggleClickBound) return;
  callerIdToggleClickBound = true;
  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-caller-id-toggle]");
      if (!btn) return;

      const listPage = btn.closest('[data-caller-id-view="list"]');
      if (listPage && btn.getAttribute("data-caller-id-toggle") === "storeEnabled") {
        e.preventDefault();
        const next = !readToggle(btn);
        setToggle(btn, next);
        writeStoreCallerIdEnabled(next);
        return;
      }

      if (!btn.closest("[data-caller-id-form]")) return;
      e.preventDefault();
      setToggle(btn, !readToggle(btn));
    },
    true,
  );
}

export function bindDeviceManagementCallerIdHardware(root: ParentNode = document): void {
  ensureCallerIdToggleClickListener();

  const page = root.querySelector("[data-caller-id-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-caller-id-view");

  if (view === "list") {
    if (page.dataset.callerIdListBound === "1") return;
    page.dataset.callerIdListBound = "1";

    page.querySelectorAll<HTMLButtonElement>('[data-caller-id-toggle="storeEnabled"]').forEach((btn) => {
      setToggle(btn, readStoreCallerIdEnabled());
    });

    const search = page.querySelector<HTMLInputElement>("[data-caller-id-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const add = (e.target as HTMLElement).closest<HTMLElement>("[data-caller-id-add]");
      if (add) {
        e.preventDefault();
        navigateCallerIdPath(NEW_PATH);
        return;
      }

      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-caller-id-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        if (id) navigateCallerIdPath(`${EDIT_PREFIX}${encodeURIComponent(id)}`);
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-caller-id-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      if (!id) return;
      const device = findCallerIdHardwareDevice(id);
      const label = device?.name ?? id;
      if (!window.confirm(`确定删除来电显示设备「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "edit") {
    if (page.dataset.callerIdEditBound === "1") return;
    page.dataset.callerIdEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const isNew = page.getAttribute("data-is-new") === "1";
    const form = page.querySelector<HTMLElement>("[data-caller-id-form]");
    if (!form) return;

    form.querySelectorAll<HTMLButtonElement>("[data-caller-id-toggle]").forEach((btn) => {
      if (btn.getAttribute("data-caller-id-toggle") === "enabled") {
        setToggle(btn, readToggle(btn));
      }
    });

    const typeSelect = form.querySelector<HTMLSelectElement>('[data-caller-id-field="deviceType"]');
    typeSelect?.addEventListener("change", () => syncSerialSectionVisibility(form));
    syncSerialSectionVisibility(form);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveDevice(deviceId, isNew, form)) return;
      navigateCallerIdPath(LIST_PATH);
    });

    page.querySelector("[data-caller-id-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateCallerIdPath(LIST_PATH);
    });
    page.querySelector("[data-caller-id-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateCallerIdPath(LIST_PATH);
    });
  }
}
