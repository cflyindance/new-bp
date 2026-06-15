/**
 * 硬件管理中心 → 硬件 → Kiosk：设备列表（仅硬件信息）+ 编辑页（支付方式、菜单展示等，seq 550）。
 * 交互对齐 eMenu：列表只读展示终端元数据，关联功能在编辑页配置。
 */

import {
  bindTerminalClientBindingForm,
  collectTerminalClientBindingFromForm,
  normalizeTerminalClientBinding,
  renderTerminalClientBindingSection,
  type TerminalClientBinding,
} from "./device-management-terminal-client-binding-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const KIOSK_DEVICES_FIELD_ID = "dm-kiosk-devices";

const KIOSK_LIST_PATH = "/device-management/hardware/kiosk";
const KIOSK_EDIT_PREFIX = "/device-management/hardware/kiosk/edit/";

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

export type KioskMenuDisplayColumns = 2 | 3 | 4 | 5;

export type KioskDevicePaymentConfig = {
  counterPayment: boolean;
  creditCard: boolean;
  giftCard: boolean;
};

export type KioskHardwareDevice = {
  id: string;
  deviceName: string;
  deviceId: string;
  license: string;
  webviewVersion: string;
  shellVersion: string;
  systemVersion: string;
  lastSeenAt?: string;
  online?: boolean;
  payment: KioskDevicePaymentConfig;
  menuDisplayColumns: KioskMenuDisplayColumns | null;
  clientBinding: TerminalClientBinding;
};

const DEFAULT_PAYMENT: KioskDevicePaymentConfig = {
  counterPayment: true,
  creditCard: true,
  giftCard: false,
};

const MENU_COLUMN_OPTIONS: { value: KioskMenuDisplayColumns; label: string }[] = [
  { value: 2, label: "1行2列" },
  { value: 3, label: "1行3列" },
  { value: 4, label: "1行4列" },
  { value: 5, label: "1行5列" },
];

const STORAGE_DEFAULT: KioskHardwareDevice[] = [
  {
    id: "kiosk-001",
    deviceName: "AP2718T",
    deviceId: "AID-06ee8d2b0cfc0432",
    license: "KIOSK-A",
    webviewVersion: "148.0.7778.120",
    shellVersion: "2.4.15 - 26051401",
    systemVersion: "Android-13",
    lastSeenAt: "2026-05-21 04:45:46",
    online: true,
    payment: { counterPayment: true, creditCard: true, giftCard: false },
    menuDisplayColumns: null,
    clientBinding: normalizeTerminalClientBinding(
      {
        name: "AP2718T",
        receiptPrinterId: "pr-receipt-1",
        paymentPrinterId: "pr-receipt-1",
        queuePrinterId: "pr-receipt-1",
        cashDrawerId: "drawer-001",
        paymentTerminalId: "pay-001",
        area: "front",
        callerIdEnabled: true,
      },
      "AP2718T",
    ),
  },
  {
    id: "kiosk-002",
    deviceName: "大厅 Kiosk 02",
    deviceId: "AID-91ac44e1b203f8a0",
    license: "KIOSK-B",
    webviewVersion: "148.0.7778.120",
    shellVersion: "2.4.14 - 26040102",
    systemVersion: "Android-12",
    lastSeenAt: "2026-06-02 18:30:12",
    online: false,
    payment: { counterPayment: true, creditCard: false, giftCard: true },
    menuDisplayColumns: 3,
    clientBinding: normalizeTerminalClientBinding(
      { name: "大厅 Kiosk 02", receiptPrinterId: "pr-receipt-2", area: "front" },
      "大厅 Kiosk 02",
    ),
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizePayment(raw: Partial<KioskDevicePaymentConfig> | undefined): KioskDevicePaymentConfig {
  return {
    counterPayment: raw?.counterPayment ?? DEFAULT_PAYMENT.counterPayment,
    creditCard: raw?.creditCard ?? DEFAULT_PAYMENT.creditCard,
    giftCard: raw?.giftCard ?? DEFAULT_PAYMENT.giftCard,
  };
}

function normalizeMenuColumns(raw: unknown): KioskMenuDisplayColumns | null {
  if (raw === 2 || raw === 3 || raw === 4 || raw === 5) return raw;
  return null;
}

function normalizeDevice(raw: Partial<KioskHardwareDevice>): KioskHardwareDevice | null {
  if (!raw.id || !raw.deviceId) return null;
  return {
    id: raw.id,
    deviceName: raw.deviceName?.trim() || raw.deviceId,
    deviceId: raw.deviceId,
    license: raw.license?.trim() || "—",
    webviewVersion: raw.webviewVersion?.trim() || "—",
    shellVersion: raw.shellVersion?.trim() || "—",
    systemVersion: raw.systemVersion?.trim() || "—",
    lastSeenAt: raw.lastSeenAt,
    online: raw.online,
    payment: normalizePayment(raw.payment),
    menuDisplayColumns: normalizeMenuColumns(raw.menuDisplayColumns),
    clientBinding: normalizeTerminalClientBinding(
      raw.clientBinding,
      raw.deviceName?.trim() || raw.deviceId,
    ),
  };
}

export function readKioskHardwareDevices(): KioskHardwareDevice[] {
  const raw = readModuleSettingJson<Partial<KioskHardwareDevice>[]>(KIOSK_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: KioskHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writeKioskHardwareDevices(devices: KioskHardwareDevice[]): void {
  writeModuleSettingJson(KIOSK_DEVICES_FIELD_ID, devices);
}

export function findKioskHardwareDevice(id: string): KioskHardwareDevice | undefined {
  return readKioskHardwareDevices().find((d) => d.id === id);
}

function navigateKioskPath(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  location.hash = nextHash;
}

function renderDisplayRow(label: string, value: string, mono = false): string {
  return `
    <div class="grid gap-1 border-b border-border py-2.5 last:border-b-0 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-x-4">
      <dt class="text-xs font-medium text-muted-foreground">${escapeHtml(label)}</dt>
      <dd class="text-sm text-foreground ${mono ? "font-mono text-xs break-all" : ""}">${escapeHtml(value)}</dd>
    </div>`;
}

function renderTableCell(value: string, opts?: { mono?: boolean; maxWidth?: string }): string {
  const mono = opts?.mono ? "font-mono text-xs" : "text-sm";
  const max = opts?.maxWidth ?? "max-w-[11rem]";
  return `
    <td class="px-3 py-3 align-top text-foreground">
      <span class="block truncate ${max} ${mono}" title="${escapeHtml(value)}">${escapeHtml(value)}</span>
    </td>`;
}

function renderDeviceTable(devices: KioskHardwareDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">暂无 Kiosk 设备。终端上线后将自动出现在此列表。</p>`;
  }

  const rows = devices
    .map((d) => {
      const statusCls = d.online
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        : "bg-muted text-muted-foreground";
      const statusLabel = d.online ? "在线" : "离线";
      const editPath = `${KIOSK_EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      const lastSeen = d.lastSeenAt ?? "—";
      return `
      <tr class="border-t border-border" data-kiosk-device-row data-device-id="${escapeHtml(d.id)}">
        ${renderTableCell(d.deviceName, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(d.deviceId, { mono: true, maxWidth: "max-w-[12rem]" })}
        ${renderTableCell(d.license, { mono: true, maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(d.webviewVersion)}
        ${renderTableCell(d.shellVersion)}
        ${renderTableCell(d.systemVersion, { maxWidth: "max-w-[10rem]" })}
        <td class="px-3 py-3 align-top text-xs text-muted-foreground whitespace-nowrap">${escapeHtml(lastSeen)}</td>
        <td class="px-3 py-3 align-top">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}">${statusLabel}</span>
        </td>
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-kiosk-device-edit data-device-id="${escapeHtml(d.id)}">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-kiosk-device-delete data-device-id="${escapeHtml(d.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[64rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备ID</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">License</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">Webview版本</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">壳子版本</th>
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

function renderYesNoField(
  deviceId: string,
  field: keyof KioskDevicePaymentConfig,
  label: string,
  value: boolean,
): string {
  const name = `kiosk-edit-${deviceId}-${field}`;
  return `
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <span class="text-sm font-medium text-card-foreground">${escapeHtml(label)}</span>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input type="radio" class="${CHECKBOX_CLASS}" name="${escapeHtml(name)}" value="yes" data-kiosk-payment-field="${field}" data-kiosk-yes-no="yes" ${value ? "checked" : ""} />
          Yes
        </label>
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input type="radio" class="${CHECKBOX_CLASS}" name="${escapeHtml(name)}" value="no" data-kiosk-payment-field="${field}" data-kiosk-yes-no="no" ${value ? "" : "checked"} />
          No
        </label>
      </div>
    </div>`;
}

function renderMenuDisplaySection(deviceId: string, selected: KioskMenuDisplayColumns | null): string {
  const name = `kiosk-edit-${deviceId}-menu-columns`;
  const options = MENU_COLUMN_OPTIONS.map(
    ({ value, label }) => `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="radio"
          class="${CHECKBOX_CLASS}"
          name="${escapeHtml(name)}"
          value="${value}"
          data-kiosk-menu-columns
          ${selected === value ? "checked" : ""}
        />
        ${escapeHtml(label)}
      </label>`,
  ).join("");

  return `
    <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 class="text-base font-semibold text-card-foreground">菜单展示</h2>
      <p class="mt-1 text-sm text-muted-foreground">设置该 Kiosk 终端菜单网格列数。</p>
      <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">${options}</div>
    </section>`;
}

function renderListPage(): string {
  const devices = readKioskHardwareDevices();
  return `
    <div class="device-management-kiosk-hardware space-y-6" data-kiosk-hardware-page data-kiosk-view="list">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 class="text-base font-semibold text-card-foreground">Kiosk 设备</h2>
        <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          查看本店 Kiosk 终端运行环境信息；支付方式、礼品卡与菜单展示等请在设备「编辑」页配置。
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="kiosk-hardware-search">搜索设备</label>
          <input
            id="kiosk-hardware-search"
            type="search"
            placeholder="按名称、设备 ID、License、版本等搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-kiosk-hardware-search
          />
          <span class="text-sm text-muted-foreground" data-kiosk-hardware-count>共 ${devices.length} 台</span>
        </div>
      </div>
      <div data-kiosk-hardware-list>${renderDeviceTable(devices)}</div>
    </div>`;
}

function renderEditPage(device: KioskHardwareDevice): string {
  const infoReadonly = [
    ["设备ID", device.deviceId, true],
    ["License", device.license, true],
    ["Webview版本", device.webviewVersion, false],
    ["壳子版本", device.shellVersion, false],
    ["系统版本", device.systemVersion, false],
    ["最近上报", device.lastSeenAt ?? "—", false],
  ] as const;

  const infoRows = infoReadonly.map(([l, v, m]) => renderDisplayRow(l, v, m)).join("");

  return `
    <div class="device-management-kiosk-hardware space-y-6" data-kiosk-hardware-page data-kiosk-view="edit" data-device-id="${escapeHtml(device.id)}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${KIOSK_LIST_PATH}" class="${BTN_GHOST}" data-kiosk-edit-back>← 返回设备列表</a>
      </div>

      <form class="space-y-6" data-kiosk-device-edit-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">设备信息</h2>
          <p class="mt-1 text-sm text-muted-foreground">以下由终端上报，只读展示。</p>
          <dl class="mt-4 rounded-lg border border-border bg-muted/20 px-4">${infoRows}</dl>
        </section>

        ${renderTerminalClientBindingSection(device.clientBinding, {
          inputClass: INPUT_CLASS,
          selectClass: SELECT_CLASS,
        })}

        <section class="space-y-3">
          <h2 class="text-base font-semibold text-card-foreground">支付能力</h2>
          <p class="text-sm text-muted-foreground">与支付中心「支付方式」全局配置叠加生效。</p>
          ${renderYesNoField(device.id, "counterPayment", "柜台支付", device.payment.counterPayment)}
          ${renderYesNoField(device.id, "creditCard", "信用卡/借记卡", device.payment.creditCard)}
          ${renderYesNoField(device.id, "giftCard", "礼品卡", device.payment.giftCard)}
        </section>

        ${renderMenuDisplaySection(device.id, device.menuDisplayColumns)}

        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${KIOSK_LIST_PATH}" class="${BTN_GHOST}" data-kiosk-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

export function getKioskHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(KIOSK_EDIT_PREFIX)) return null;
  const raw = path.slice(KIOSK_EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementKioskHardwarePath(path: string): boolean {
  return path === KIOSK_LIST_PATH || path.startsWith(`${KIOSK_LIST_PATH}/`);
}

export function renderDeviceManagementKioskHardwarePage(path: string): string {
  const editId = getKioskHardwareEditDeviceId(path);
  if (editId) {
    const device = findKioskHardwareDevice(editId);
    if (!device) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-kiosk-hardware-page>
          <p class="text-sm text-muted-foreground">未找到该设备。</p>
          <a href="#${KIOSK_LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回设备列表</a>
        </div>`;
    }
    return renderEditPage(device);
  }
  return renderListPage();
}

function filterDevices(devices: KioskHardwareDevice[], keyword: string): KioskHardwareDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.deviceName,
      d.deviceId,
      d.license,
      d.webviewVersion,
      d.shellVersion,
      d.systemVersion,
      d.lastSeenAt ?? "",
      d.online ? "在线" : "离线",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const list = root.querySelector("[data-kiosk-hardware-list]");
  const countEl = root.querySelector("[data-kiosk-hardware-count]");
  if (!list) return;
  const devices = filterDevices(readKioskHardwareDevices(), keyword);
  list.innerHTML = renderDeviceTable(devices);
  if (countEl) {
    const total = readKioskHardwareDevices().length;
    countEl.textContent =
      keyword.trim() && devices.length !== total
        ? `显示 ${devices.length} / ${total} 台`
        : `共 ${total} 台`;
  }
}

function collectEditFormState(form: HTMLElement): Partial<KioskHardwareDevice> {
  const clientBinding = collectTerminalClientBindingFromForm(form);
  const deviceName = clientBinding.name;

  const payment: KioskDevicePaymentConfig = { ...DEFAULT_PAYMENT };
  form.querySelectorAll<HTMLInputElement>("[data-kiosk-payment-field]").forEach((input) => {
    if (!input.checked) return;
    const field = input.getAttribute("data-kiosk-payment-field");
    const yesNo = input.getAttribute("data-kiosk-yes-no");
    if (!field || (field !== "counterPayment" && field !== "creditCard" && field !== "giftCard")) return;
    payment[field] = yesNo === "yes";
  });

  let menuDisplayColumns: KioskMenuDisplayColumns | null = null;
  const menuChecked = form.querySelector<HTMLInputElement>("[data-kiosk-menu-columns]:checked");
  if (menuChecked) {
    const n = Number(menuChecked.value);
    if (n === 2 || n === 3 || n === 4 || n === 5) menuDisplayColumns = n;
  }

  return { deviceName, payment, menuDisplayColumns, clientBinding };
}

function saveEditedDevice(deviceId: string, form: HTMLElement): boolean {
  const devices = readKioskHardwareDevices();
  const idx = devices.findIndex((d) => d.id === deviceId);
  if (idx < 0) return false;
  const patch = collectEditFormState(form);
  if (!patch.deviceName || !patch.clientBinding?.name) {
    window.alert("请填写名称");
    return false;
  }
  const next = [...devices];
  next[idx] = normalizeDevice({ ...next[idx], ...patch })!;
  writeKioskHardwareDevices(next);
  return true;
}

function deleteDevice(deviceId: string): void {
  writeKioskHardwareDevices(readKioskHardwareDevices().filter((d) => d.id !== deviceId));
}

export function bindDeviceManagementKioskHardware(root: ParentNode = document): void {
  const page = root.querySelector("[data-kiosk-hardware-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-kiosk-view");

  if (view === "list") {
    if (page.dataset.kioskListBound === "1") return;
    page.dataset.kioskListBound = "1";

    const search = page.querySelector<HTMLInputElement>("[data-kiosk-hardware-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-kiosk-device-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        if (id) navigateKioskPath(`${KIOSK_EDIT_PREFIX}${encodeURIComponent(id)}`);
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-kiosk-device-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      if (!id) return;
      const device = findKioskHardwareDevice(id);
      const label = device?.deviceName ?? id;
      if (!window.confirm(`确定删除设备「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "edit") {
    if (page.dataset.kioskEditBound === "1") return;
    page.dataset.kioskEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const form = page.querySelector<HTMLElement>("[data-kiosk-device-edit-form]");
    if (!form) return;

    bindTerminalClientBindingForm(form);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveEditedDevice(deviceId, form)) return;
      navigateKioskPath(KIOSK_LIST_PATH);
    });

    page.querySelector("[data-kiosk-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateKioskPath(KIOSK_LIST_PATH);
    });
    page.querySelector("[data-kiosk-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateKioskPath(KIOSK_LIST_PATH);
    });
  }
}
