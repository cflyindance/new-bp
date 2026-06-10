/**
 * 硬件管理中心 → 硬件 → 支付设备：支付设备台账。
 * - Tripos：终端上报的运行环境（对齐 Kiosk / eMenu 列；可改设备名称）。
 * - PAX：门店手动维护的联网终端（名称、品牌、型号、IP、端口、通讯方式、支付超时）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const PAYMENT_DEVICES_FIELD_ID = "dm-payment-devices";

const PAYMENTS_LIST_PATH = "/device-management/hardware/payments";
const TRIPOS_EDIT_PREFIX = "/device-management/hardware/payments/edit/";
const PAX_EDIT_PREFIX = "/device-management/hardware/payments/pax/edit/";
const PAX_NEW_PATH = "/device-management/hardware/payments/pax/new";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

export type PaymentHardwareKind = "tripos" | "pax";

export type PaxCommunicationMethod = "tcp" | "https" | "serial" | "usb";

/** Tripos：终端上报卡机台账 */
export type PaymentTriposDevice = {
  hardwareType: "tripos";
  id: string;
  deviceName: string;
  deviceId: string;
  license: string;
  webviewVersion: string;
  shellVersion: string;
  systemVersion: string;
  lastSeenAt?: string;
  online?: boolean;
  sn: string;
  clientCode: string;
  wdlAccount: string;
  licenseType: string;
  appVersion: string;
};

/** PAX：门店配置的联网支付终端 */
export type PaymentPaxDevice = {
  hardwareType: "pax";
  id: string;
  name: string;
  terminalBrand: string;
  terminalModel: string;
  ipAddress: string;
  port: number;
  communicationMethod: PaxCommunicationMethod;
  paymentTimeoutMs: number;
};

export type PaymentHardwareDevice = PaymentTriposDevice | PaymentPaxDevice;

const PAX_COMM_OPTIONS: { value: PaxCommunicationMethod; label: string }[] = [
  { value: "tcp", label: "TCP/IP" },
  { value: "https", label: "HTTPS" },
  { value: "serial", label: "串口" },
  { value: "usb", label: "USB" },
];

const TRIPOS_DEFAULT: PaymentTriposDevice[] = [
  {
    hardwareType: "tripos",
    id: "pay-001",
    deviceName: "前台主卡机",
    deviceId: "AID-pay-06ee8d2b0cfc",
    sn: "08212345678901",
    license: "Tripos-商用",
    webviewVersion: "148.0.7778.120",
    shellVersion: "2.4.15 - 26051401",
    systemVersion: "Android 11",
    appVersion: "3.2.15.240601",
    lastSeenAt: "2026-06-03 14:22",
    online: true,
    clientCode: "STORE-001-POS1",
    wdlAccount: "wdl_demo_store_01",
    licenseType: "商用",
  },
  {
    hardwareType: "tripos",
    id: "pay-002",
    deviceName: "吧台备用",
    deviceId: "AID-pay-91ac44e1b203",
    sn: "08298765432109",
    license: "Tripos-试用",
    webviewVersion: "148.0.7778.120",
    shellVersion: "2.4.14 - 26040102",
    systemVersion: "Android 9",
    appVersion: "2.8.4.231205",
    lastSeenAt: "2026-06-02 18:30",
    online: false,
    clientCode: "STORE-001-BAR",
    wdlAccount: "wdl_demo_store_02",
    licenseType: "试用",
  },
  {
    hardwareType: "tripos",
    id: "pay-003",
    deviceName: "外卖窗口",
    deviceId: "AID-pay-pending-0093",
    sn: "BT-44A1-9F2C-88",
    license: "—",
    webviewVersion: "—",
    shellVersion: "—",
    systemVersion: "—",
    appVersion: "—",
    lastSeenAt: "2026-06-01 09:15",
    online: false,
    clientCode: "STORE-001-PICKUP",
    wdlAccount: "—",
    licenseType: "—",
  },
];

const PAX_DEFAULT: PaymentPaxDevice[] = [
  {
    hardwareType: "pax",
    id: "pax-001",
    name: "吧台 PAX A920",
    terminalBrand: "PAX",
    terminalModel: "A920",
    ipAddress: "192.168.1.88",
    port: 10009,
    communicationMethod: "tcp",
    paymentTimeoutMs: 60000,
  },
];

const STORAGE_DEFAULT: PaymentHardwareDevice[] = [...TRIPOS_DEFAULT, ...PAX_DEFAULT];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paxCommLabel(method: PaxCommunicationMethod): string {
  return PAX_COMM_OPTIONS.find((o) => o.value === method)?.label ?? method;
}

function normalizePaxComm(raw: unknown): PaxCommunicationMethod {
  if (raw === "tcp" || raw === "https" || raw === "serial" || raw === "usb") return raw;
  return "tcp";
}

function parsePort(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isInteger(n) || n < 1 || n > 65535) return null;
  return n;
}

function parseTimeoutMs(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n < 1000 || n > 600000) return null;
  return Math.round(n);
}

type LegacyPaymentRow = {
  id?: string;
  hardwareType?: PaymentHardwareKind;
  deviceName?: string;
  deviceId?: string;
  license?: string;
  webviewVersion?: string;
  shellVersion?: string;
  systemVersion?: string;
  lastSeenAt?: string;
  online?: boolean;
  sn?: string;
  clientCode?: string;
  wdlAccount?: string;
  licenseType?: string;
  appVersion?: string;
  name?: string;
  terminalBrand?: string;
  terminalModel?: string;
  ipAddress?: string;
  port?: number;
  communicationMethod?: PaxCommunicationMethod;
  paymentTimeoutMs?: number;
  alias?: string;
  licenseName?: string;
  osVersion?: string;
  connectionStatus?: "connected" | "disconnected" | "unknown";
};

function legacyOnline(raw: LegacyPaymentRow): boolean | undefined {
  if (typeof raw.online === "boolean") return raw.online;
  if (raw.connectionStatus === "connected") return true;
  if (raw.connectionStatus === "disconnected") return false;
  return undefined;
}

function isLegacyPaxRow(raw: LegacyPaymentRow): boolean {
  if (raw.hardwareType === "pax") return true;
  if (raw.hardwareType === "tripos") return false;
  return !!(raw.ipAddress?.trim() || raw.terminalBrand?.trim() || raw.terminalModel?.trim());
}

function normalizeTripos(raw: LegacyPaymentRow): PaymentTriposDevice | null {
  const id = raw.id;
  const sn = raw.sn?.trim();
  if (!id || !sn) return null;

  const deviceId = raw.deviceId?.trim() || sn;
  return {
    hardwareType: "tripos",
    id,
    deviceName: raw.deviceName?.trim() || raw.alias?.trim() || deviceId,
    deviceId,
    sn,
    license: raw.license?.trim() || raw.licenseName?.trim() || "—",
    webviewVersion: raw.webviewVersion?.trim() || "—",
    shellVersion: raw.shellVersion?.trim() || "—",
    systemVersion: raw.systemVersion?.trim() || raw.osVersion?.trim() || "—",
    appVersion: raw.appVersion?.trim() || "—",
    lastSeenAt: raw.lastSeenAt,
    online: legacyOnline(raw),
    clientCode: raw.clientCode?.trim() || "—",
    wdlAccount: raw.wdlAccount?.trim() || "—",
    licenseType: raw.licenseType?.trim() || "—",
  };
}

function normalizePax(raw: LegacyPaymentRow): PaymentPaxDevice | null {
  const id = raw.id;
  const name = raw.name?.trim();
  const terminalBrand = raw.terminalBrand?.trim();
  const terminalModel = raw.terminalModel?.trim();
  const ipAddress = raw.ipAddress?.trim();
  const port = parsePort(raw.port);
  const paymentTimeoutMs = parseTimeoutMs(raw.paymentTimeoutMs);
  if (!id || !name || !terminalBrand || !terminalModel || !ipAddress || port === null || paymentTimeoutMs === null) {
    return null;
  }
  return {
    hardwareType: "pax",
    id,
    name,
    terminalBrand,
    terminalModel,
    ipAddress,
    port,
    communicationMethod: normalizePaxComm(raw.communicationMethod),
    paymentTimeoutMs,
  };
}

function normalizeDevice(raw: LegacyPaymentRow): PaymentHardwareDevice | null {
  if (isLegacyPaxRow(raw)) return normalizePax(raw);
  return normalizeTripos(raw);
}

export function readPaymentHardwareDevices(): PaymentHardwareDevice[] {
  const raw = readModuleSettingJson<LegacyPaymentRow[]>(PAYMENT_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: PaymentHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writePaymentHardwareDevices(devices: PaymentHardwareDevice[]): void {
  writeModuleSettingJson(PAYMENT_DEVICES_FIELD_ID, devices);
}

export function findPaymentHardwareDevice(id: string): PaymentHardwareDevice | undefined {
  return readPaymentHardwareDevices().find((d) => d.id === id);
}

function readTriposDevices(): PaymentTriposDevice[] {
  return readPaymentHardwareDevices().filter((d): d is PaymentTriposDevice => d.hardwareType === "tripos");
}

function readPaxDevices(): PaymentPaxDevice[] {
  return readPaymentHardwareDevices().filter((d): d is PaymentPaxDevice => d.hardwareType === "pax");
}

function navigatePaymentsPath(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  location.hash = nextHash;
}

function newPaxDeviceId(): string {
  return `pax-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function renderTableCell(value: string, opts?: { mono?: boolean; maxWidth?: string }): string {
  const mono = opts?.mono ? "font-mono text-xs" : "text-sm";
  const max = opts?.maxWidth ?? "max-w-[11rem]";
  return `
    <td class="px-3 py-3 align-top text-foreground">
      <span class="block truncate ${max} ${mono}" title="${escapeHtml(value)}">${escapeHtml(value)}</span>
    </td>`;
}

function renderTriposTable(devices: PaymentTriposDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">暂无 Tripos 支付设备。卡机上线或绑定后将自动出现在此列表。</p>`;
  }

  const rows = devices
    .map((d) => {
      const editPath = `${TRIPOS_EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      const statusCls = d.online
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        : "bg-muted text-muted-foreground";
      const statusLabel = d.online ? "在线" : "离线";
      const lastSeen = d.lastSeenAt ?? "—";

      return `
      <tr class="border-t border-border" data-payment-device-row data-device-id="${escapeHtml(d.id)}" data-hardware-type="tripos">
        ${renderTableCell(d.deviceName, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(d.deviceId, { mono: true, maxWidth: "max-w-[12rem]" })}
        ${renderTableCell(d.sn, { mono: true, maxWidth: "max-w-[12rem]" })}
        ${renderTableCell(d.clientCode, { mono: true, maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(d.license, { mono: true, maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(d.wdlAccount, { maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(d.licenseType)}
        ${renderTableCell(d.webviewVersion)}
        ${renderTableCell(d.shellVersion)}
        ${renderTableCell(d.appVersion, { mono: true })}
        ${renderTableCell(d.systemVersion, { maxWidth: "max-w-[10rem]" })}
        <td class="px-3 py-3 align-top text-xs text-muted-foreground whitespace-nowrap">${escapeHtml(lastSeen)}</td>
        <td class="px-3 py-3 align-top">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}">${statusLabel}</span>
        </td>
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-payment-device-edit data-device-id="${escapeHtml(d.id)}" data-hardware-type="tripos">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-payment-device-delete data-device-id="${escapeHtml(d.id)}" data-hardware-type="tripos">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[88rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备ID</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">卡机SN</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">客户端编码</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">License</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">WDL账号</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">License类型</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">Webview版本</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">壳子版本</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">APP版本号</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">系统版本</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">最近上报</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">状态</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPaxTable(devices: PaymentPaxDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">暂无 PAX 支付终端。请点击「新增 PAX 终端」添加。</p>`;
  }

  const rows = devices
    .map((d) => {
      const editPath = `${PAX_EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      return `
      <tr class="border-t border-border" data-payment-device-row data-device-id="${escapeHtml(d.id)}" data-hardware-type="pax">
        ${renderTableCell(d.name, { maxWidth: "max-w-[9rem]" })}
        ${renderTableCell(d.terminalBrand)}
        ${renderTableCell(d.terminalModel)}
        ${renderTableCell(d.ipAddress, { mono: true })}
        ${renderTableCell(String(d.port), { mono: true })}
        ${renderTableCell(paxCommLabel(d.communicationMethod))}
        ${renderTableCell(String(d.paymentTimeoutMs), { mono: true })}
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-payment-device-edit data-device-id="${escapeHtml(d.id)}" data-hardware-type="pax">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-payment-device-delete data-device-id="${escapeHtml(d.id)}" data-hardware-type="pax">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[52rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">终端品牌</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">终端型号</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">IP地址</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">端口号</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">通讯方式</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">支付超时时间(ms)</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderDisplayRow(label: string, value: string, mono = false): string {
  return `
    <div class="grid gap-1 border-b border-border py-2.5 last:border-b-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-x-4">
      <dt class="text-xs font-medium text-muted-foreground">${escapeHtml(label)}</dt>
      <dd class="text-sm text-foreground ${mono ? "font-mono text-xs break-all" : ""}">${escapeHtml(value)}</dd>
    </div>`;
}

function renderPaxCommSelect(selected: PaxCommunicationMethod): string {
  const options = PAX_COMM_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");
  return `
    <select class="${SELECT_CLASS} sm:max-w-md" data-payment-pax-field="communicationMethod" required>
      ${options}
    </select>`;
}

function renderPaxFormPage(device: PaymentPaxDevice, opts: { isNew: boolean }): string {
  const title = opts.isNew ? "新增 PAX 终端" : "编辑 PAX 终端";
  return `
    <div class="device-management-payment-hardware space-y-6" data-payment-hardware-page data-payment-view="pax-edit" data-device-id="${escapeHtml(device.id)}" data-is-new="${opts.isNew ? "1" : "0"}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${PAYMENTS_LIST_PATH}" class="${BTN_GHOST}" data-payment-edit-back>← 返回支付设备</a>
      </div>
      <form class="space-y-6" data-payment-pax-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
            <span class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">PAX</span>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pax-edit-name">名称</label>
              <input id="pax-edit-name" type="text" class="${INPUT_CLASS}" data-payment-pax-field="name" value="${escapeHtml(device.name)}" required placeholder="如：前台 PAX" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pax-edit-brand">终端品牌</label>
              <input id="pax-edit-brand" type="text" class="${INPUT_CLASS}" data-payment-pax-field="terminalBrand" value="${escapeHtml(device.terminalBrand)}" required placeholder="如：PAX" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pax-edit-model">终端型号</label>
              <input id="pax-edit-model" type="text" class="${INPUT_CLASS}" data-payment-pax-field="terminalModel" value="${escapeHtml(device.terminalModel)}" required placeholder="如：A920" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pax-edit-ip">IP地址</label>
              <input id="pax-edit-ip" type="text" class="${INPUT_CLASS} font-mono text-sm" data-payment-pax-field="ipAddress" value="${escapeHtml(device.ipAddress)}" required placeholder="192.168.1.88" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pax-edit-port">端口号</label>
              <input id="pax-edit-port" type="number" min="1" max="65535" class="${INPUT_CLASS} font-mono text-sm" data-payment-pax-field="port" value="${device.port}" required />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pax-edit-comm">通讯方式</label>
              <div id="pax-edit-comm">${renderPaxCommSelect(device.communicationMethod)}</div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pax-edit-timeout">支付超时时间(ms)</label>
              <input id="pax-edit-timeout" type="number" min="1000" max="600000" step="1000" class="${INPUT_CLASS} font-mono text-sm" data-payment-pax-field="paymentTimeoutMs" value="${device.paymentTimeoutMs}" required />
              <p class="mt-1 text-xs text-muted-foreground">建议 30000–120000 ms；超时后 POS 将中止等待并提示重试。</p>
            </div>
          </div>
        </section>
        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${PAYMENTS_LIST_PATH}" class="${BTN_GHOST}" data-payment-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

function renderTriposEditPage(device: PaymentTriposDevice): string {
  const statusLabel = device.online ? "在线" : "离线";
  const readonlyRows = [
    ["设备ID", device.deviceId, true],
    ["卡机 SN", device.sn, true],
    ["客户端编码", device.clientCode, true],
    ["License", device.license, false],
    ["WDL账号", device.wdlAccount, false],
    ["License类型", device.licenseType, false],
    ["Webview版本", device.webviewVersion, false],
    ["壳子版本", device.shellVersion, false],
    ["APP版本号", device.appVersion, true],
    ["系统版本", device.systemVersion, false],
    ["最近上报", device.lastSeenAt ?? "—", false],
    ["状态", statusLabel, false],
  ] as const;

  return `
    <div class="device-management-payment-hardware space-y-6" data-payment-hardware-page data-payment-view="tripos-edit" data-device-id="${escapeHtml(device.id)}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${PAYMENTS_LIST_PATH}" class="${BTN_GHOST}" data-payment-edit-back>← 返回支付设备</a>
      </div>
      <form class="space-y-6" data-payment-tripos-edit-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-base font-semibold text-card-foreground">Tripos 设备信息</h2>
            <span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Tripos</span>
          </div>
          <div class="mt-4">
            <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="payment-edit-name">设备名称</label>
            <input id="payment-edit-name" type="text" class="${INPUT_CLASS} sm:max-w-md" data-payment-tripos-field="deviceName" value="${escapeHtml(device.deviceName)}" required />
          </div>
          <dl class="mt-4 rounded-lg border border-border bg-muted/20 px-4">
            ${readonlyRows.map(([l, v, m]) => renderDisplayRow(l, v, m)).join("")}
          </dl>
        </section>
        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${PAYMENTS_LIST_PATH}" class="${BTN_GHOST}" data-payment-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

function renderListPage(): string {
  const tripos = readTriposDevices();
  const pax = readPaxDevices();
  const total = tripos.length + pax.length;
  return `
    <div class="device-management-payment-hardware space-y-8" data-payment-hardware-page data-payment-view="list">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 class="text-base font-semibold text-card-foreground">支付设备</h2>
        <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          本页包含两类支付硬件：<strong class="font-medium text-foreground">Tripos</strong> 为终端上报的卡机台账（列对齐 Kiosk / eMenu）；<strong class="font-medium text-foreground">PAX</strong> 为门店手动维护的联网终端（IP、端口、通讯方式等）。
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="payment-hardware-search">搜索支付设备</label>
          <input
            id="payment-hardware-search"
            type="search"
            placeholder="按名称、SN、IP、品牌、型号、客户端编码等搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-payment-hardware-search
          />
          <span class="text-sm text-muted-foreground" data-payment-hardware-count>共 ${total} 台（Tripos ${tripos.length} / PAX ${pax.length}）</span>
        </div>
      </div>

      <section class="space-y-3" data-payment-tripos-section>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-card-foreground">Tripos 支付设备</h3>
          <span class="text-xs text-muted-foreground">终端上报 · 可编辑设备名称</span>
        </div>
        <div data-payment-tripos-list>${renderTriposTable(tripos)}</div>
      </section>

      <section class="space-y-3" data-payment-pax-section>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-semibold text-card-foreground">PAX 支付终端</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">名称、终端品牌/型号、IP、端口、通讯方式、支付超时时间</p>
          </div>
          <a href="#${PAX_NEW_PATH}" class="${BTN_PRIMARY}" data-payment-pax-add>新增 PAX 终端</a>
        </div>
        <div data-payment-pax-list>${renderPaxTable(pax)}</div>
      </section>
    </div>`;
}

export function getPaymentHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(TRIPOS_EDIT_PREFIX)) return null;
  const raw = path.slice(TRIPOS_EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function getPaxEditDeviceId(path: string): string | null {
  if (!path.startsWith(PAX_EDIT_PREFIX)) return null;
  const raw = path.slice(PAX_EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementPaymentHardwarePath(path: string): boolean {
  return path === PAYMENTS_LIST_PATH || path.startsWith(`${PAYMENTS_LIST_PATH}/`);
}

export function renderDeviceManagementPaymentHardwarePage(path: string): string {
  if (path === PAX_NEW_PATH) {
    return renderPaxFormPage(
      {
        hardwareType: "pax",
        id: newPaxDeviceId(),
        name: "",
        terminalBrand: "PAX",
        terminalModel: "",
        ipAddress: "",
        port: 10009,
        communicationMethod: "tcp",
        paymentTimeoutMs: 60000,
      },
      { isNew: true },
    );
  }

  const paxEditId = getPaxEditDeviceId(path);
  if (paxEditId) {
    const device = findPaymentHardwareDevice(paxEditId);
    if (!device || device.hardwareType !== "pax") {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-payment-hardware-page>
          <p class="text-sm text-muted-foreground">未找到该 PAX 支付终端。</p>
          <a href="#${PAYMENTS_LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回支付设备</a>
        </div>`;
    }
    return renderPaxFormPage(device, { isNew: false });
  }

  const triposEditId = getPaymentHardwareEditDeviceId(path);
  if (triposEditId) {
    const device = findPaymentHardwareDevice(triposEditId);
    if (!device || device.hardwareType !== "tripos") {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-payment-hardware-page>
          <p class="text-sm text-muted-foreground">未找到该 Tripos 支付设备。</p>
          <a href="#${PAYMENTS_LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回支付设备</a>
        </div>`;
    }
    return renderTriposEditPage(device);
  }

  return renderListPage();
}

function filterTripos(devices: PaymentTriposDevice[], keyword: string): PaymentTriposDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.deviceName,
      d.deviceId,
      d.sn,
      d.clientCode,
      d.license,
      d.wdlAccount,
      d.licenseType,
      d.webviewVersion,
      d.shellVersion,
      d.appVersion,
      d.systemVersion,
      d.lastSeenAt ?? "",
      d.online ? "在线" : "离线",
      "tripos",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function filterPax(devices: PaymentPaxDevice[], keyword: string): PaymentPaxDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.name,
      d.terminalBrand,
      d.terminalModel,
      d.ipAddress,
      String(d.port),
      paxCommLabel(d.communicationMethod),
      String(d.paymentTimeoutMs),
      "pax",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const triposList = root.querySelector("[data-payment-tripos-list]");
  const paxList = root.querySelector("[data-payment-pax-list]");
  const countEl = root.querySelector("[data-payment-hardware-count]");
  const allTripos = readTriposDevices();
  const allPax = readPaxDevices();
  const tripos = filterTripos(allTripos, keyword);
  const pax = filterPax(allPax, keyword);

  if (triposList) triposList.innerHTML = renderTriposTable(tripos);
  if (paxList) paxList.innerHTML = renderPaxTable(pax);

  if (countEl) {
    const total = allTripos.length + allPax.length;
    const shown = tripos.length + pax.length;
    const q = keyword.trim();
    countEl.textContent =
      q && shown !== total
        ? `显示 ${shown} / ${total} 台（Tripos ${tripos.length}/${allTripos.length} · PAX ${pax.length}/${allPax.length}）`
        : `共 ${total} 台（Tripos ${allTripos.length} / PAX ${allPax.length}）`;
  }
}

function deleteDevice(deviceId: string, kind: PaymentHardwareKind): void {
  writePaymentHardwareDevices(
    readPaymentHardwareDevices().filter((d) => !(d.id === deviceId && d.hardwareType === kind)),
  );
}

function saveTriposEditedDevice(deviceId: string, form: HTMLElement): boolean {
  const devices = readPaymentHardwareDevices();
  const idx = devices.findIndex((d) => d.id === deviceId && d.hardwareType === "tripos");
  if (idx < 0) return false;
  const deviceName =
    form.querySelector<HTMLInputElement>('[data-payment-tripos-field="deviceName"]')?.value.trim() ?? "";
  if (!deviceName) {
    window.alert("请填写设备名称");
    return false;
  }
  const current = devices[idx];
  if (current.hardwareType !== "tripos") return false;
  const next = [...devices];
  next[idx] = normalizeTripos({ ...current, deviceName })!;
  writePaymentHardwareDevices(next);
  return true;
}

function collectPaxFormState(form: HTMLElement): Partial<PaymentPaxDevice> | null {
  const getField = (field: string): string => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-payment-pax-field="${field}"]`,
    );
    return el?.value.trim() ?? "";
  };

  const name = getField("name");
  const terminalBrand = getField("terminalBrand");
  const terminalModel = getField("terminalModel");
  const ipAddress = getField("ipAddress");
  const port = parsePort(getField("port"));
  const paymentTimeoutMs = parseTimeoutMs(getField("paymentTimeoutMs"));
  const communicationMethod = normalizePaxComm(getField("communicationMethod"));

  if (!name || !terminalBrand || !terminalModel || !ipAddress || port === null || paymentTimeoutMs === null) {
    return null;
  }

  return {
    name,
    terminalBrand,
    terminalModel,
    ipAddress,
    port,
    communicationMethod,
    paymentTimeoutMs,
  };
}

function savePaxDevice(deviceId: string, isNew: boolean, form: HTMLElement): boolean {
  const patch = collectPaxFormState(form);
  if (!patch) {
    window.alert("请完整填写名称、终端品牌/型号、IP 地址、端口号（1–65535）与支付超时时间（1000–600000 ms）。");
    return false;
  }

  const devices = readPaymentHardwareDevices();
  if (isNew) {
    const created = normalizePax({ hardwareType: "pax", id: deviceId, ...patch });
    if (!created) return false;
    writePaymentHardwareDevices([...devices, created]);
    return true;
  }

  const idx = devices.findIndex((d) => d.id === deviceId && d.hardwareType === "pax");
  if (idx < 0) return false;
  const next = [...devices];
  next[idx] = normalizePax({ hardwareType: "pax", id: deviceId, ...patch })!;
  writePaymentHardwareDevices(next);
  return true;
}

export function bindDeviceManagementPaymentHardware(root: ParentNode = document): void {
  const page = root.querySelector("[data-payment-hardware-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-payment-view");

  if (view === "list") {
    if (page.dataset.paymentListBound === "1") return;
    page.dataset.paymentListBound = "1";

    const search = page.querySelector<HTMLInputElement>("[data-payment-hardware-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const addPax = (e.target as HTMLElement).closest<HTMLElement>("[data-payment-pax-add]");
      if (addPax) {
        e.preventDefault();
        navigatePaymentsPath(PAX_NEW_PATH);
        return;
      }

      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-payment-device-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        const kind = edit.getAttribute("data-hardware-type");
        if (!id) return;
        if (kind === "pax") {
          navigatePaymentsPath(`${PAX_EDIT_PREFIX}${encodeURIComponent(id)}`);
        } else {
          navigatePaymentsPath(`${TRIPOS_EDIT_PREFIX}${encodeURIComponent(id)}`);
        }
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-payment-device-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      const kind = del.getAttribute("data-hardware-type") as PaymentHardwareKind | null;
      if (!id || (kind !== "tripos" && kind !== "pax")) return;
      const device = findPaymentHardwareDevice(id);
      const label =
        device?.hardwareType === "pax"
          ? device.name
          : device?.hardwareType === "tripos"
            ? device.deviceName
            : id;
      if (!window.confirm(`确定删除${kind === "pax" ? " PAX 终端" : " Tripos 支付设备"}「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id, kind);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "tripos-edit") {
    if (page.dataset.paymentTriposEditBound === "1") return;
    page.dataset.paymentTriposEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const form = page.querySelector<HTMLElement>("[data-payment-tripos-edit-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveTriposEditedDevice(deviceId, form)) return;
      navigatePaymentsPath(PAYMENTS_LIST_PATH);
    });

    page.querySelector("[data-payment-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigatePaymentsPath(PAYMENTS_LIST_PATH);
    });
    page.querySelector("[data-payment-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigatePaymentsPath(PAYMENTS_LIST_PATH);
    });
    return;
  }

  if (view === "pax-edit") {
    if (page.dataset.paymentPaxEditBound === "1") return;
    page.dataset.paymentPaxEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const isNew = page.getAttribute("data-is-new") === "1";
    const form = page.querySelector<HTMLElement>("[data-payment-pax-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!savePaxDevice(deviceId, isNew, form)) return;
      navigatePaymentsPath(PAYMENTS_LIST_PATH);
    });

    page.querySelector("[data-payment-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigatePaymentsPath(PAYMENTS_LIST_PATH);
    });
    page.querySelector("[data-payment-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigatePaymentsPath(PAYMENTS_LIST_PATH);
    });
  }
}
