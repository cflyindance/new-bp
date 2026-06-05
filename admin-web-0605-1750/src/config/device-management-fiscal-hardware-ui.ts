/**
 * 硬件管理中心 → 硬件 → 税控机（seq 406–415）。
 */

import { readPrinterHardwareDevices } from "./device-management-printer-hardware-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const FISCAL_DEVICES_FIELD_ID = "dm-fiscal-devices";

const LIST_PATH = "/device-management/hardware/fiscal";
const EDIT_PREFIX = "/device-management/hardware/fiscal/edit/";
const NEW_PATH = "/device-management/hardware/fiscal/new";

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

export type FiscalConnectionType = "serial" | "network" | "usb";

export type FiscalRunMode = "normal" | "training" | "maintenance";

export type FiscalHardwareDevice = {
  id: string;
  name: string;
  deviceName: string;
  connectionType: FiscalConnectionType;
  /** TP S */
  tps: string;
  enabled: boolean;
  connectedPrinterId: string;
  tvq: boolean;
  fastFoodMode: boolean;
  runMode: FiscalRunMode;
  printReceiptOnClose: boolean;
};

const CONNECTION_TYPE_OPTIONS: { value: FiscalConnectionType; label: string }[] = [
  { value: "serial", label: "串口" },
  { value: "network", label: "网络" },
  { value: "usb", label: "USB" },
];

const RUN_MODE_OPTIONS: { value: FiscalRunMode; label: string }[] = [
  { value: "normal", label: "正常" },
  { value: "training", label: "培训" },
  { value: "maintenance", label: "维护" },
];

const STORAGE_DEFAULT: FiscalHardwareDevice[] = [
  {
    id: "fiscal-001",
    name: "主税控机",
    deviceName: "Fiscal-QUE-01",
    connectionType: "serial",
    tps: "TPS-001",
    enabled: true,
    connectedPrinterId: "pr-receipt-1",
    tvq: true,
    fastFoodMode: false,
    runMode: "normal",
    printReceiptOnClose: true,
  },
  {
    id: "fiscal-002",
    name: "外卖税控",
    deviceName: "Fiscal-Pickup",
    connectionType: "network",
    tps: "TPS-002",
    enabled: false,
    connectedPrinterId: "",
    tvq: false,
    fastFoodMode: true,
    runMode: "normal",
    printReceiptOnClose: false,
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function connectionTypeLabel(type: FiscalConnectionType): string {
  return CONNECTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function runModeLabel(mode: FiscalRunMode): string {
  return RUN_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

function printerLabel(printerId: string): string {
  if (!printerId) return "—";
  return readPrinterHardwareDevices().find((p) => p.id === printerId)?.name ?? "—";
}

function normalizeConnectionType(raw: unknown): FiscalConnectionType {
  if (raw === "serial" || raw === "network" || raw === "usb") return raw;
  return "serial";
}

function normalizeRunMode(raw: unknown): FiscalRunMode {
  if (raw === "normal" || raw === "training" || raw === "maintenance") return raw;
  return "normal";
}

function normalizeDevice(raw: Partial<FiscalHardwareDevice>): FiscalHardwareDevice | null {
  if (!raw.id) return null;
  const name = raw.name?.trim();
  const deviceName = raw.deviceName?.trim();
  if (!name || !deviceName) return null;
  return {
    id: raw.id,
    name,
    deviceName,
    connectionType: normalizeConnectionType(raw.connectionType),
    tps: raw.tps?.trim() || "—",
    enabled: !!raw.enabled,
    connectedPrinterId: raw.connectedPrinterId?.trim() ?? "",
    tvq: !!raw.tvq,
    fastFoodMode: !!raw.fastFoodMode,
    runMode: normalizeRunMode(raw.runMode),
    printReceiptOnClose: !!raw.printReceiptOnClose,
  };
}

export function readFiscalHardwareDevices(): FiscalHardwareDevice[] {
  const raw = readModuleSettingJson<Partial<FiscalHardwareDevice>[]>(FISCAL_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: FiscalHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writeFiscalHardwareDevices(devices: FiscalHardwareDevice[]): void {
  writeModuleSettingJson(FISCAL_DEVICES_FIELD_ID, devices);
}

export function findFiscalHardwareDevice(id: string): FiscalHardwareDevice | undefined {
  return readFiscalHardwareDevices().find((d) => d.id === id);
}

function navigateFiscalPath(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  location.hash = nextHash;
}

function newDeviceId(): string {
  return `fiscal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function renderTableCell(value: string, opts?: { maxWidth?: string }): string {
  const max = opts?.maxWidth ?? "max-w-[10rem]";
  return `
    <td class="px-3 py-3 align-top text-foreground">
      <span class="block truncate text-sm ${max}" title="${escapeHtml(value)}">${escapeHtml(value)}</span>
    </td>`;
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
      data-fiscal-toggle="${escapeHtml(field)}"
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

function renderDeviceTable(devices: FiscalHardwareDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">暂无税控机。请点击「新增税控机」添加。</p>`;
  }

  const rows = devices
    .map((d) => {
      const editPath = `${EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      const enabledCls = d.enabled
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        : "bg-muted text-muted-foreground";
      return `
      <tr class="border-t border-border" data-fiscal-row data-device-id="${escapeHtml(d.id)}">
        ${renderTableCell(d.name, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(d.deviceName, { maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(connectionTypeLabel(d.connectionType))}
        ${renderTableCell(d.tps, { maxWidth: "max-w-[8rem]" })}
        <td class="px-3 py-3 align-top">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${enabledCls}">${d.enabled ? "已启用" : "未启用"}</span>
        </td>
        ${renderTableCell(printerLabel(d.connectedPrinterId), { maxWidth: "max-w-[11rem]" })}
        ${renderTableCell(d.tvq ? "是" : "否")}
        ${renderTableCell(d.fastFoodMode ? "是" : "否")}
        ${renderTableCell(runModeLabel(d.runMode))}
        ${renderTableCell(d.printReceiptOnClose ? "是" : "否")}
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-fiscal-edit data-device-id="${escapeHtml(d.id)}">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-fiscal-delete data-device-id="${escapeHtml(d.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[72rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">连接类型</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">TP S</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">启用</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">连接的打印机</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">TVQ</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">快餐模式</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">运行模式</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">关闭交易时打印收据</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPrinterSelect(selectedId: string): string {
  const printers = readPrinterHardwareDevices();
  const options = [
    `<option value="">未绑定</option>`,
    ...printers.map(
      (p) =>
        `<option value="${escapeHtml(p.id)}" ${p.id === selectedId ? "selected" : ""}>${escapeHtml(p.name)}</option>`,
    ),
  ].join("");
  return `<select class="${SELECT_CLASS} sm:max-w-md" data-fiscal-field="connectedPrinterId">${options}</select>`;
}

function renderFormPage(device: FiscalHardwareDevice, opts: { isNew: boolean }): string {
  const title = opts.isNew ? "新增税控机" : "编辑税控机";
  const connOptions = CONNECTION_TYPE_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === device.connectionType ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");
  const runOptions = RUN_MODE_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === device.runMode ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");

  return `
    <div class="device-management-fiscal-hardware space-y-6" data-fiscal-page data-fiscal-view="edit" data-device-id="${escapeHtml(device.id)}" data-is-new="${opts.isNew ? "1" : "0"}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-fiscal-edit-back>← 返回税控机列表</a>
      </div>
      <form class="space-y-6" data-fiscal-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="fiscal-edit-name">名称</label>
              <input id="fiscal-edit-name" type="text" class="${INPUT_CLASS}" data-fiscal-field="name" value="${escapeHtml(device.name)}" required />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="fiscal-edit-device-name">设备名称</label>
              <input id="fiscal-edit-device-name" type="text" class="${INPUT_CLASS}" data-fiscal-field="deviceName" value="${escapeHtml(device.deviceName)}" required />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">连接类型</label>
              <select class="${SELECT_CLASS}" data-fiscal-field="connectionType" required>${connOptions}</select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="fiscal-edit-tps">TP S</label>
              <input id="fiscal-edit-tps" type="text" class="${INPUT_CLASS}" data-fiscal-field="tps" value="${escapeHtml(device.tps === "—" ? "" : device.tps)}" placeholder="TPS 编号" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">连接的打印机</label>
              ${renderPrinterSelect(device.connectedPrinterId)}
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">运行模式</label>
              <select class="${SELECT_CLASS}" data-fiscal-field="runMode" required>${runOptions}</select>
            </div>
          </div>
        </section>
        <section class="space-y-3">
          <h2 class="text-base font-semibold text-card-foreground">开关与模式</h2>
          ${renderToggleRow("enabled", "启用", device.enabled, "关闭后该税控机不参与交易上报")}
          ${renderToggleRow("tvq", "TVQ", device.tvq)}
          ${renderToggleRow("fastFoodMode", "快餐模式", device.fastFoodMode)}
          ${renderToggleRow("printReceiptOnClose", "关闭交易时打印收据", device.printReceiptOnClose)}
        </section>
        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-fiscal-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

function renderListPage(): string {
  const devices = readFiscalHardwareDevices();
  return `
    <div class="device-management-fiscal-hardware space-y-6" data-fiscal-page data-fiscal-view="list">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-card-foreground">税控机</h2>
            <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              管理门店税控机台账：连接类型、TPS、关联打印机及运行模式等（seq 406–415）。
            </p>
          </div>
          <a href="#${NEW_PATH}" class="${BTN_PRIMARY}" data-fiscal-add>新增税控机</a>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="fiscal-search">搜索税控机</label>
          <input
            id="fiscal-search"
            type="search"
            placeholder="按名称、设备名称、TPS、打印机搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-fiscal-search
          />
          <span class="text-sm text-muted-foreground" data-fiscal-count>共 ${devices.length} 台</span>
        </div>
      </div>
      <div data-fiscal-list>${renderDeviceTable(devices)}</div>
    </div>`;
}

export function getFiscalHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(EDIT_PREFIX)) return null;
  const raw = path.slice(EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementFiscalHardwarePath(path: string): boolean {
  return path === LIST_PATH || path.startsWith(`${LIST_PATH}/`);
}

export function renderDeviceManagementFiscalHardwarePage(path: string): string {
  if (path === NEW_PATH) {
    return renderFormPage(
      {
        id: newDeviceId(),
        name: "",
        deviceName: "",
        connectionType: "serial",
        tps: "",
        enabled: true,
        connectedPrinterId: "",
        tvq: false,
        fastFoodMode: false,
        runMode: "normal",
        printReceiptOnClose: true,
      },
      { isNew: true },
    );
  }

  const editId = getFiscalHardwareEditDeviceId(path);
  if (editId) {
    const device = findFiscalHardwareDevice(editId);
    if (!device) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-fiscal-page>
          <p class="text-sm text-muted-foreground">未找到该税控机。</p>
          <a href="#${LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回税控机列表</a>
        </div>`;
    }
    return renderFormPage(device, { isNew: false });
  }

  return renderListPage();
}

function filterDevices(devices: FiscalHardwareDevice[], keyword: string): FiscalHardwareDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.name,
      d.deviceName,
      connectionTypeLabel(d.connectionType),
      d.tps,
      printerLabel(d.connectedPrinterId),
      runModeLabel(d.runMode),
      d.enabled ? "已启用" : "未启用",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const list = root.querySelector("[data-fiscal-list]");
  const countEl = root.querySelector("[data-fiscal-count]");
  if (!list) return;
  const devices = filterDevices(readFiscalHardwareDevices(), keyword);
  list.innerHTML = renderDeviceTable(devices);
  if (countEl) {
    const total = readFiscalHardwareDevices().length;
    countEl.textContent =
      keyword.trim() && devices.length !== total
        ? `显示 ${devices.length} / ${total} 台`
        : `共 ${total} 台`;
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

function collectFormState(form: HTMLElement): Partial<FiscalHardwareDevice> | null {
  const getField = (field: string): string => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-fiscal-field="${field}"]`,
    );
    return el?.value.trim() ?? "";
  };

  const name = getField("name");
  const deviceName = getField("deviceName");
  if (!name || !deviceName) return null;

  const toggles: Partial<FiscalHardwareDevice> = {};
  form.querySelectorAll<HTMLButtonElement>("[data-fiscal-toggle]").forEach((btn) => {
    const field = btn.getAttribute("data-fiscal-toggle");
    if (
      field === "enabled" ||
      field === "tvq" ||
      field === "fastFoodMode" ||
      field === "printReceiptOnClose"
    ) {
      toggles[field] = readToggle(btn);
    }
  });

  return {
    name,
    deviceName,
    connectionType: normalizeConnectionType(getField("connectionType")),
    tps: getField("tps"),
    connectedPrinterId: getField("connectedPrinterId"),
    runMode: normalizeRunMode(getField("runMode")),
    ...toggles,
  };
}

function saveDevice(deviceId: string, isNew: boolean, form: HTMLElement): boolean {
  const patch = collectFormState(form);
  if (!patch) {
    window.alert("请填写名称与设备名称。");
    return false;
  }

  const devices = readFiscalHardwareDevices();
  if (isNew) {
    const created = normalizeDevice({ id: deviceId, ...patch });
    if (!created) return false;
    writeFiscalHardwareDevices([...devices, created]);
    return true;
  }

  const idx = devices.findIndex((d) => d.id === deviceId);
  if (idx < 0) return false;
  const next = [...devices];
  next[idx] = normalizeDevice({ ...next[idx], ...patch })!;
  writeFiscalHardwareDevices(next);
  return true;
}

function deleteDevice(deviceId: string): void {
  writeFiscalHardwareDevices(readFiscalHardwareDevices().filter((d) => d.id !== deviceId));
}

let fiscalToggleClickBound = false;

function ensureFiscalToggleClickListener(): void {
  if (fiscalToggleClickBound) return;
  fiscalToggleClickBound = true;
  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-fiscal-toggle]");
      if (!btn?.closest("[data-fiscal-form]")) return;
      e.preventDefault();
      setToggle(btn, !readToggle(btn));
    },
    true,
  );
}

export function bindDeviceManagementFiscalHardware(root: ParentNode = document): void {
  ensureFiscalToggleClickListener();

  const page = root.querySelector("[data-fiscal-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-fiscal-view");

  if (view === "list") {
    if (page.dataset.fiscalListBound === "1") return;
    page.dataset.fiscalListBound = "1";

    const search = page.querySelector<HTMLInputElement>("[data-fiscal-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const add = (e.target as HTMLElement).closest<HTMLElement>("[data-fiscal-add]");
      if (add) {
        e.preventDefault();
        navigateFiscalPath(NEW_PATH);
        return;
      }

      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-fiscal-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        if (id) navigateFiscalPath(`${EDIT_PREFIX}${encodeURIComponent(id)}`);
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-fiscal-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      if (!id) return;
      const device = findFiscalHardwareDevice(id);
      const label = device?.name ?? id;
      if (!window.confirm(`确定删除税控机「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "edit") {
    if (page.dataset.fiscalEditBound === "1") return;
    page.dataset.fiscalEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const isNew = page.getAttribute("data-is-new") === "1";
    const form = page.querySelector<HTMLElement>("[data-fiscal-form]");
    if (!form) return;

    form.querySelectorAll<HTMLButtonElement>("[data-fiscal-toggle]").forEach((btn) => {
      setToggle(btn, readToggle(btn));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveDevice(deviceId, isNew, form)) return;
      navigateFiscalPath(LIST_PATH);
    });

    page.querySelector("[data-fiscal-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateFiscalPath(LIST_PATH);
    });
    page.querySelector("[data-fiscal-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateFiscalPath(LIST_PATH);
    });
  }
}
