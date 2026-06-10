/**
 * 硬件管理中心 → 硬件 → CDS（客显屏）设备列表与编辑。
 */

import {
  bindCdsDisplaySettingsToggles,
  collectCdsDisplaySettingsFromForm,
  migrateCdsDisplaySettingsFromFoh,
  normalizeCdsDisplaySettings,
  renderCdsDisplaySettingsSectionHtml,
  type CdsDisplaySettings,
} from "./module-settings-cds-display-ui";
import { readPaymentHardwareDevices } from "./device-management-payment-hardware-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const CDS_DEVICES_FIELD_ID = "dm-cds-devices";

const CDS_LIST_PATH = "/device-management/hardware/cds";
const CDS_EDIT_PREFIX = "/device-management/hardware/cds/edit/";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

export type CdsHardwareModel = "cds-7" | "cds-10" | "pole-vfd" | "hdmi-secondary";

export type CdsHardwareDevice = {
  id: string;
  deviceName: string;
  deviceId: string;
  license: string;
  model: CdsHardwareModel;
  /** 配对收银台 / 支付终端 */
  paymentTerminalId: string;
  area: string;
  webviewVersion: string;
  shellVersion: string;
  systemVersion: string;
  lastSeenAt?: string;
  online?: boolean;
  /** 原前厅「客显屏」：加入会员 / 封面 / Logo / Pickup·Delivery 启用 */
  displaySettings: CdsDisplaySettings;
};

const MODEL_OPTIONS: { value: CdsHardwareModel; label: string }[] = [
  { value: "cds-7", label: "CDS-7 客显" },
  { value: "cds-10", label: "CDS-10 客显" },
  { value: "pole-vfd", label: "杆式 VFD" },
  { value: "hdmi-secondary", label: "HDMI 副屏" },
];

const AREA_OPTIONS = [
  { value: "", label: "未指定" },
  { value: "front", label: "前厅" },
  { value: "bar", label: "吧台" },
  { value: "pickup", label: "取餐区" },
  { value: "outdoor", label: "外摆" },
];

const STORAGE_DEFAULT: CdsHardwareDevice[] = [
  {
    id: "cds-001",
    deviceName: "前台客显 1",
    deviceId: "CDS-A1F2-9C88-01",
    license: "CDS-LIC-2026-1001",
    model: "cds-10",
    paymentTerminalId: "pay-001",
    area: "front",
    webviewVersion: "148.0.7778.120",
    shellVersion: "3.2.1 - 26060101",
    systemVersion: "Android-11",
    lastSeenAt: "2026-06-03 16:20:11",
    online: true,
    displaySettings: migrateCdsDisplaySettingsFromFoh({
      joinMember: true,
      showCover: true,
      showLogo: true,
      pickupDeliveryEnabled: true,
    }),
  },
  {
    id: "cds-002",
    deviceName: "吧台客显",
    deviceId: "CDS-B7E4-2D11-02",
    license: "CDS-LIC-2026-1002",
    model: "cds-7",
    paymentTerminalId: "",
    area: "bar",
    webviewVersion: "148.0.7778.118",
    shellVersion: "3.2.0 - 26051202",
    systemVersion: "Android-10",
    lastSeenAt: "2026-06-02 11:05:33",
    online: false,
    displaySettings: migrateCdsDisplaySettingsFromFoh({
      joinMember: false,
      showCover: true,
      showLogo: false,
      pickupDeliveryEnabled: false,
    }),
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function modelLabel(model: CdsHardwareModel): string {
  return MODEL_OPTIONS.find((o) => o.value === model)?.label ?? model;
}

function areaLabel(area: string): string {
  return AREA_OPTIONS.find((o) => o.value === area)?.label ?? (area || "—");
}

function normalizeModel(raw: unknown): CdsHardwareModel {
  if (raw === "cds-7" || raw === "cds-10" || raw === "pole-vfd" || raw === "hdmi-secondary") {
    return raw;
  }
  return "cds-10";
}

function normalizeDevice(raw: Partial<CdsHardwareDevice>): CdsHardwareDevice | null {
  if (!raw.id || !raw.deviceId) return null;
  const deviceName = raw.deviceName?.trim() || raw.deviceId;
  return {
    id: raw.id,
    deviceName,
    deviceId: raw.deviceId,
    license: raw.license?.trim() || "—",
    model: normalizeModel(raw.model),
    paymentTerminalId: raw.paymentTerminalId?.trim() ?? "",
    area: raw.area?.trim() ?? "",
    webviewVersion: raw.webviewVersion?.trim() || "—",
    shellVersion: raw.shellVersion?.trim() || "—",
    systemVersion: raw.systemVersion?.trim() || "—",
    lastSeenAt: raw.lastSeenAt,
    online: raw.online,
    displaySettings: normalizeCdsDisplaySettings(raw.displaySettings),
  };
}

export function readCdsHardwareDevices(): CdsHardwareDevice[] {
  const raw = readModuleSettingJson<Partial<CdsHardwareDevice>[]>(CDS_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: CdsHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writeCdsHardwareDevices(devices: CdsHardwareDevice[]): void {
  writeModuleSettingJson(CDS_DEVICES_FIELD_ID, devices);
}

export function findCdsHardwareDevice(id: string): CdsHardwareDevice | undefined {
  return readCdsHardwareDevices().find((d) => d.id === id);
}

function paymentTerminalLabel(id: string): string {
  if (!id) return "—";
  const pay = readPaymentHardwareDevices().find((p) => p.id === id);
  if (!pay) return id;
  return pay.hardwareType === "pax" ? pay.name : pay.deviceName || pay.deviceId;
}

function navigateCdsPath(path: string): void {
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

function renderDeviceTable(devices: CdsHardwareDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">暂无 CDS 设备。终端上线后将自动出现在此列表。</p>`;
  }

  const rows = devices
    .map((d) => {
      const statusCls = d.online
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        : "bg-muted text-muted-foreground";
      const statusLabel = d.online ? "在线" : "离线";
      const editPath = `${CDS_EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      return `
      <tr class="border-t border-border" data-cds-device-row data-device-id="${escapeHtml(d.id)}">
        ${renderTableCell(d.deviceName, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(modelLabel(d.model))}
        ${renderTableCell(paymentTerminalLabel(d.paymentTerminalId), { maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(areaLabel(d.area))}
        ${renderTableCell(d.deviceId, { mono: true, maxWidth: "max-w-[12rem]" })}
        ${renderTableCell(d.license, { mono: true, maxWidth: "max-w-[10rem]" })}
        <td class="px-3 py-3 align-top text-xs text-muted-foreground whitespace-nowrap">${escapeHtml(d.lastSeenAt ?? "—")}</td>
        <td class="px-3 py-3 align-top">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}">${statusLabel}</span>
        </td>
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-cds-device-edit data-device-id="${escapeHtml(d.id)}">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-cds-device-delete data-device-id="${escapeHtml(d.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[56rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">型号</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">配对收银台</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">区域</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备ID</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">License</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">最近上报</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">状态</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPaymentTerminalSelect(selectedId: string): string {
  const payments = readPaymentHardwareDevices();
  const options = [
    `<option value="">未配对</option>`,
    ...payments.map((p) => {
      const label = p.hardwareType === "pax" ? p.name : p.deviceName || p.deviceId;
      const sel = p.id === selectedId ? " selected" : "";
      return `<option value="${escapeHtml(p.id)}"${sel}>${escapeHtml(label)}</option>`;
    }),
  ].join("");
  return `
    <select class="${SELECT_CLASS}" name="cds-payment-terminal" data-cds-field="paymentTerminalId" aria-label="配对收银台">
      ${options}
    </select>`;
}

function renderListPage(): string {
  const devices = readCdsHardwareDevices();
  return `
    <div class="device-management-cds-hardware space-y-6" data-cds-hardware-page data-cds-view="list">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 class="text-base font-semibold text-card-foreground">CDS 设备</h2>
        <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          管理本店客显屏（Customer Display System）终端：查看运行状态；在设备「编辑」页配置型号、配对收银台、展示项（封面/Logo/加入会员等）。结账小费、签名、小票见支付中心。
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="cds-hardware-search">搜索设备</label>
          <input
            id="cds-hardware-search"
            type="search"
            placeholder="按名称、型号、设备 ID、License 等搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-cds-hardware-search
          />
          <span class="text-sm text-muted-foreground" data-cds-hardware-count>共 ${devices.length} 台</span>
        </div>
      </div>
      <div data-cds-hardware-list>${renderDeviceTable(devices)}</div>
    </div>`;
}

function renderEditPage(device: CdsHardwareDevice): string {
  const infoReadonly = [
    ["设备ID", device.deviceId, true],
    ["License", device.license, true],
    ["Webview版本", device.webviewVersion, false],
    ["壳子版本", device.shellVersion, false],
    ["系统版本", device.systemVersion, false],
    ["最近上报", device.lastSeenAt ?? "—", false],
  ] as const;

  const modelOptions = MODEL_OPTIONS.map(
    ({ value, label }) =>
      `<option value="${value}"${device.model === value ? " selected" : ""}>${escapeHtml(label)}</option>`,
  ).join("");

  const areaOptions = AREA_OPTIONS.map(
    ({ value, label }) =>
      `<option value="${escapeHtml(value)}"${device.area === value ? " selected" : ""}>${escapeHtml(label)}</option>`,
  ).join("");

  const infoRows = infoReadonly.map(([l, v, m]) => renderDisplayRow(l, v, m)).join("");

  return `
    <div class="device-management-cds-hardware space-y-6" data-cds-hardware-page data-cds-view="edit" data-device-id="${escapeHtml(device.id)}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${CDS_LIST_PATH}" class="${BTN_GHOST}" data-cds-edit-back>← 返回设备列表</a>
      </div>

      <form class="space-y-6" data-cds-device-edit-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">设备信息</h2>
          <p class="mt-1 text-sm text-muted-foreground">以下由终端上报，只读展示。</p>
          <dl class="mt-4 rounded-lg border border-border bg-muted/20 px-4">${infoRows}</dl>
        </section>

        <section class="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 class="text-base font-semibold text-card-foreground">客显配置</h2>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="cds-edit-name">设备名称</label>
            <input
              id="cds-edit-name"
              type="text"
              class="${INPUT_CLASS}"
              value="${escapeHtml(device.deviceName)}"
              data-cds-field="deviceName"
              required
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="cds-edit-model">客显型号</label>
            <select id="cds-edit-model" class="${SELECT_CLASS}" data-cds-field="model" aria-label="客显型号">
              ${modelOptions}
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-muted-foreground">配对收银台</label>
            ${renderPaymentTerminalSelect(device.paymentTerminalId)}
            <p class="mt-1 text-xs text-muted-foreground">与支付中心「支付设备」主档关联，用于结账时客显与 POS 协同。</p>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="cds-edit-area">所属区域</label>
            <select id="cds-edit-area" class="${SELECT_CLASS}" data-cds-field="area" aria-label="所属区域">
              ${areaOptions}
            </select>
          </div>
        </section>

        ${renderCdsDisplaySettingsSectionHtml(device.id, device.displaySettings)}

        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${CDS_LIST_PATH}" class="${BTN_GHOST}" data-cds-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

export function getCdsHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(CDS_EDIT_PREFIX)) return null;
  const raw = path.slice(CDS_EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementCdsHardwarePath(path: string): boolean {
  return path === CDS_LIST_PATH || path.startsWith(`${CDS_LIST_PATH}/`);
}

export function renderDeviceManagementCdsHardwarePage(path: string): string {
  const editId = getCdsHardwareEditDeviceId(path);
  if (editId) {
    const device = findCdsHardwareDevice(editId);
    if (!device) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-cds-hardware-page>
          <p class="text-sm text-muted-foreground">未找到该设备。</p>
          <a href="#${CDS_LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回设备列表</a>
        </div>`;
    }
    return renderEditPage(device);
  }
  return renderListPage();
}

function filterDevices(devices: CdsHardwareDevice[], keyword: string): CdsHardwareDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.deviceName,
      modelLabel(d.model),
      paymentTerminalLabel(d.paymentTerminalId),
      areaLabel(d.area),
      d.deviceId,
      d.license,
      d.lastSeenAt ?? "",
      d.online ? "在线" : "离线",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const list = root.querySelector("[data-cds-hardware-list]");
  const countEl = root.querySelector("[data-cds-hardware-count]");
  if (!list) return;
  const devices = filterDevices(readCdsHardwareDevices(), keyword);
  list.innerHTML = renderDeviceTable(devices);
  if (countEl) {
    const total = readCdsHardwareDevices().length;
    countEl.textContent =
      keyword.trim() && devices.length !== total
        ? `显示 ${devices.length} / ${total} 台`
        : `共 ${total} 台`;
  }
}

function collectEditFormState(form: HTMLElement): Partial<CdsHardwareDevice> {
  const deviceName = form.querySelector<HTMLInputElement>('[data-cds-field="deviceName"]')?.value.trim();
  const modelRaw = form.querySelector<HTMLSelectElement>('[data-cds-field="model"]')?.value;
  const paymentTerminalId =
    form.querySelector<HTMLSelectElement>('[data-cds-field="paymentTerminalId"]')?.value.trim() ?? "";
  const area = form.querySelector<HTMLSelectElement>('[data-cds-field="area"]')?.value ?? "";
  return {
    deviceName,
    model: normalizeModel(modelRaw),
    paymentTerminalId,
    area,
    displaySettings: collectCdsDisplaySettingsFromForm(form),
  };
}

function saveEditedDevice(deviceId: string, form: HTMLElement): boolean {
  const devices = readCdsHardwareDevices();
  const idx = devices.findIndex((d) => d.id === deviceId);
  if (idx < 0) return false;
  const patch = collectEditFormState(form);
  if (!patch.deviceName) {
    window.alert("请填写设备名称");
    return false;
  }
  const next = [...devices];
  next[idx] = normalizeDevice({ ...next[idx], ...patch })!;
  writeCdsHardwareDevices(next);
  return true;
}

function deleteDevice(deviceId: string): void {
  writeCdsHardwareDevices(readCdsHardwareDevices().filter((d) => d.id !== deviceId));
}

export function bindDeviceManagementCdsHardware(root: ParentNode = document): void {
  const page = root.querySelector("[data-cds-hardware-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-cds-view");

  if (view === "list") {
    if (page.dataset.cdsListBound === "1") return;
    page.dataset.cdsListBound = "1";

    const search = page.querySelector<HTMLInputElement>("[data-cds-hardware-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-cds-device-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        if (id) navigateCdsPath(`${CDS_EDIT_PREFIX}${encodeURIComponent(id)}`);
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-cds-device-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      if (!id) return;
      const device = findCdsHardwareDevice(id);
      const label = device?.deviceName ?? id;
      if (!window.confirm(`确定删除设备「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "edit") {
    if (page.dataset.cdsEditBound === "1") return;
    page.dataset.cdsEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const form = page.querySelector<HTMLElement>("[data-cds-device-edit-form]");
    if (!form) return;

    bindCdsDisplaySettingsToggles(form);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveEditedDevice(deviceId, form)) return;
      navigateCdsPath(CDS_LIST_PATH);
    });

    page.querySelector("[data-cds-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateCdsPath(CDS_LIST_PATH);
    });
    page.querySelector("[data-cds-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateCdsPath(CDS_LIST_PATH);
    });
  }
}
