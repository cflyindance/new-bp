/**
 * 硬件管理中心 → 硬件 → eMenu：设备列表、编辑、删除及 per-device 菜单/限制配置。
 */

import {
  type MenuGroupTag,
  bindMenuGroupDropdownPickers,
  collectMenuGroupsFromDropdown,
  renderMenuGroupDropdownHtml,
  writeMenuGroupTags,
} from "./module-settings-menu-group-ui";
import {
  DEFAULT_TERMINAL_CLIENT_BINDING,
  bindTerminalClientBindingForm,
  collectTerminalClientBindingFromForm,
  normalizeTerminalClientBinding,
  renderTerminalClientBindingSection,
  type TerminalClientBinding,
} from "./device-management-terminal-client-binding-ui";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const EMENU_DEVICES_FIELD_ID = "dm-emenu-devices";

const EMENU_LIST_PATH = "/device-management/hardware/emenu";
const EMENU_EDIT_PREFIX = "/device-management/hardware/emenu/edit/";

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

export type EmenuDeviceOrderLimits = {
  mealDurationLimit: boolean;
  orderCountLimit: boolean;
  dishesPerGuestPerRoundLimit: boolean;
};

export type EmenuDeviceDisplayConfig = {
  menuGroups: MenuGroupTag[];
  pureDisplayMode: boolean;
  emenuProMode: boolean;
};

export type EmenuHardwareDevice = {
  id: string;
  deviceName: string;
  deviceId: string;
  tableNo: string;
  license: string;
  webviewVersion: string;
  shellVersion: string;
  systemVersion: string;
  screenResolution: string;
  timezone: string;
  lastSeenAt?: string;
  online?: boolean;
  display: EmenuDeviceDisplayConfig;
  orderLimits: EmenuDeviceOrderLimits;
  clientBinding: TerminalClientBinding;
};

const DEFAULT_DISPLAY: EmenuDeviceDisplayConfig = {
  menuGroups: [
    { id: "mg-hotpot-base", name: "火锅底" },
    { id: "mg-japanese", name: "日料" },
    { id: "mg-chinese", name: "中餐" },
    { id: "mg-lunch", name: "午餐" },
  ],
  pureDisplayMode: false,
  emenuProMode: false,
};

const DEFAULT_ORDER_LIMITS: EmenuDeviceOrderLimits = {
  mealDurationLimit: false,
  orderCountLimit: false,
  dishesPerGuestPerRoundLimit: false,
};

const STORAGE_DEFAULT: EmenuHardwareDevice[] = [
  {
    id: "emenu-001",
    deviceName: "大厅 A12",
    deviceId: "EMENU-7F3A-12C4-9B01",
    tableNo: "A12",
    license: "LIC-EMENU-2026-8841",
    webviewVersion: "2.14.6",
    shellVersion: "4.2.1",
    systemVersion: "Android 11 (API 30)",
    screenResolution: "1920 × 1080",
    timezone: "America/New_York (UTC-5)",
    lastSeenAt: "2026-06-03 14:22",
    online: true,
    display: { ...DEFAULT_DISPLAY },
    orderLimits: { ...DEFAULT_ORDER_LIMITS },
    clientBinding: normalizeTerminalClientBinding(
      {
        name: "大厅 A12",
        receiptPrinterId: "pr-receipt-1",
        paymentPrinterId: "pr-receipt-1",
        cashDrawerId: "drawer-001",
        area: "front",
      },
      "大厅 A12",
    ),
  },
  {
    id: "emenu-002",
    deviceName: "包间 08",
    deviceId: "EMENU-2D91-88FE-41AC",
    tableNo: "R08",
    license: "LIC-EMENU-2026-7720",
    webviewVersion: "2.14.6",
    shellVersion: "4.2.0",
    systemVersion: "Android 10 (API 29)",
    screenResolution: "1280 × 800",
    timezone: "America/New_York (UTC-5)",
    lastSeenAt: "2026-06-03 13:58",
    online: true,
    display: {
      menuGroups: [
        { id: "mg-breakfast", name: "Breakfast" },
        { id: "mg-bar", name: "Bar" },
      ],
      pureDisplayMode: false,
      emenuProMode: true,
    },
    orderLimits: {
      mealDurationLimit: true,
      orderCountLimit: false,
      dishesPerGuestPerRoundLimit: false,
    },
    clientBinding: normalizeTerminalClientBinding(
      { name: "包间 08", receiptPrinterId: "pr-receipt-2", area: "bar" },
      "包间 08",
    ),
  },
  {
    id: "emenu-003",
    deviceName: "待绑定平板",
    deviceId: "EMENU-PENDING-0093",
    tableNo: "",
    license: "—",
    webviewVersion: "2.13.2",
    shellVersion: "4.1.9",
    systemVersion: "Android 11 (API 30)",
    screenResolution: "1920 × 1200",
    timezone: "America/Chicago (UTC-6)",
    lastSeenAt: "2026-06-02 09:15",
    online: false,
    display: { menuGroups: [], pureDisplayMode: false, emenuProMode: false },
    orderLimits: { ...DEFAULT_ORDER_LIMITS },
    clientBinding: { ...DEFAULT_TERMINAL_CLIENT_BINDING },
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function menuGroupsFieldId(deviceId: string): string {
  return `emenu-device-${deviceId}-menu-groups`;
}

function normalizeMenuGroups(raw: unknown): MenuGroupTag[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is MenuGroupTag => !!t && typeof t.id === "string" && typeof t.name === "string")
    .map((t) => ({ id: t.id, name: t.name }));
}

function normalizeDisplay(raw: Partial<EmenuDeviceDisplayConfig> | undefined): EmenuDeviceDisplayConfig {
  return {
    menuGroups: normalizeMenuGroups(raw?.menuGroups),
    pureDisplayMode: !!raw?.pureDisplayMode,
    emenuProMode: !!raw?.emenuProMode,
  };
}

function normalizeOrderLimits(raw: Partial<EmenuDeviceOrderLimits> | undefined): EmenuDeviceOrderLimits {
  return {
    mealDurationLimit: !!raw?.mealDurationLimit,
    orderCountLimit: !!raw?.orderCountLimit,
    dishesPerGuestPerRoundLimit: !!raw?.dishesPerGuestPerRoundLimit,
  };
}

function normalizeDevice(raw: Partial<EmenuHardwareDevice>): EmenuHardwareDevice | null {
  if (!raw.id || !raw.deviceId) return null;
  return {
    id: raw.id,
    deviceName: raw.deviceName?.trim() || raw.deviceId,
    deviceId: raw.deviceId,
    tableNo: raw.tableNo?.trim() ?? "",
    license: raw.license?.trim() || "—",
    webviewVersion: raw.webviewVersion?.trim() || "—",
    shellVersion: raw.shellVersion?.trim() || "—",
    systemVersion: raw.systemVersion?.trim() || "—",
    screenResolution: raw.screenResolution?.trim() || "—",
    timezone: raw.timezone?.trim() || "—",
    lastSeenAt: raw.lastSeenAt,
    online: raw.online,
    display: normalizeDisplay(raw.display),
    orderLimits: normalizeOrderLimits(raw.orderLimits),
    clientBinding: normalizeTerminalClientBinding(
      raw.clientBinding,
      raw.deviceName?.trim() || raw.deviceId,
    ),
  };
}

export function readEmenuHardwareDevices(): EmenuHardwareDevice[] {
  const raw = readModuleSettingJson<Partial<EmenuHardwareDevice>[]>(EMENU_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: EmenuHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writeEmenuHardwareDevices(devices: EmenuHardwareDevice[]): void {
  writeModuleSettingJson(EMENU_DEVICES_FIELD_ID, devices);
}

export function findEmenuHardwareDevice(id: string): EmenuHardwareDevice | undefined {
  return readEmenuHardwareDevices().find((d) => d.id === id);
}

function navigateEmenuPath(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  location.hash = nextHash;
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
      data-emenu-device-toggle="${escapeHtml(field)}"
      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${trackClass}"
    >
      <span
        class="pointer-events-none block size-5 ${knobClass} ${TOGGLE_KNOB} rounded-full transition-transform duration-200"
        aria-hidden="true"
      ></span>
    </button>`;
}

function renderLimitCard(
  field: keyof EmenuDeviceOrderLimits,
  title: string,
  description: string,
  on: boolean,
): string {
  return `
    <div class="rounded-lg border border-border bg-card px-4 py-3.5 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-card-foreground">${escapeHtml(title)}</p>
          <p class="mt-1 text-xs leading-relaxed text-muted-foreground">${escapeHtml(description)}</p>
        </div>
        ${renderToggleSwitch(field, on, title)}
      </div>
    </div>`;
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

function renderDeviceTable(devices: EmenuHardwareDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">暂无 eMenu 设备。终端上线后将自动出现在此列表。</p>`;
  }
  const rows = devices
    .map((d) => {
      const statusCls = d.online
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        : "bg-muted text-muted-foreground";
      const statusLabel = d.online ? "在线" : "离线";
      const editPath = `${EMENU_EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      const lastSeen = d.lastSeenAt ?? "—";
      return `
      <tr class="border-t border-border" data-emenu-device-row data-device-id="${escapeHtml(d.id)}">
        ${renderTableCell(d.deviceName, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(d.deviceId, { mono: true, maxWidth: "max-w-[12rem]" })}
        ${renderTableCell(d.tableNo || "—")}
        ${renderTableCell(d.license, { mono: true, maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(d.webviewVersion)}
        ${renderTableCell(d.shellVersion)}
        ${renderTableCell(d.systemVersion, { maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(d.screenResolution)}
        ${renderTableCell(d.timezone, { maxWidth: "max-w-[12rem]" })}
        <td class="px-3 py-3 align-top text-xs text-muted-foreground whitespace-nowrap">${escapeHtml(lastSeen)}</td>
        <td class="px-3 py-3 align-top">
          <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}">${statusLabel}</span>
        </td>
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-emenu-device-edit data-device-id="${escapeHtml(d.id)}">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-emenu-device-delete data-device-id="${escapeHtml(d.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[72rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">设备ID</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">桌号</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">License</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">Webview版本</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">壳子版本</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">系统版本</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">屏幕分辨率</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">时区</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">最近上报</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">状态</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderListPage(): string {
  const devices = readEmenuHardwareDevices();
  return `
    <div class="device-management-emenu-hardware space-y-6" data-emenu-hardware-page data-emenu-view="list">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 class="text-base font-semibold text-card-foreground">eMenu 设备</h2>
        <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          管理本店 eMenu 终端：查看运行环境信息，配置菜单组、展示模式与下单限制。
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="emenu-hardware-search">搜索设备</label>
          <input
            id="emenu-hardware-search"
            type="search"
            placeholder="按名称、设备 ID、桌号、License、版本、时区等搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-emenu-hardware-search
          />
          <span class="text-sm text-muted-foreground" data-emenu-hardware-count>共 ${devices.length} 台</span>
        </div>
      </div>
      <div data-emenu-hardware-list>
        ${renderDeviceTable(devices)}
      </div>
    </div>`;
}

function renderEditPage(device: EmenuHardwareDevice): string {
  writeMenuGroupTags(menuGroupsFieldId(device.id), device.display.menuGroups);

  const infoReadonly = [
    ["设备ID", device.deviceId, true],
    ["License", device.license, true],
    ["Webview版本", device.webviewVersion, false],
    ["壳子版本", device.shellVersion, false],
    ["系统版本", device.systemVersion, false],
    ["屏幕分辨率", device.screenResolution, false],
    ["时区", device.timezone, false],
  ] as const;

  const infoRows = infoReadonly.map(([l, v, m]) => renderDisplayRow(l, v, m)).join("");

  return `
    <div class="device-management-emenu-hardware space-y-6" data-emenu-hardware-page data-emenu-view="edit" data-device-id="${escapeHtml(device.id)}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${EMENU_LIST_PATH}" class="${BTN_GHOST}" data-emenu-edit-back>← 返回设备列表</a>
      </div>

      <form class="space-y-6" data-emenu-device-edit-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">设备信息</h2>
          <p class="mt-1 text-sm text-muted-foreground">以下由终端上报，只读展示。</p>
          <div class="mt-4 max-w-md">
            <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="emenu-edit-table">桌号</label>
            <input id="emenu-edit-table" type="text" class="${INPUT_CLASS}" data-emenu-edit-field="tableNo" value="${escapeHtml(device.tableNo)}" placeholder="未绑定留空" />
          </div>
          <dl class="mt-4 rounded-lg border border-border bg-muted/20 px-4">${infoRows}</dl>
        </section>

        ${renderTerminalClientBindingSection(device.clientBinding, {
          inputClass: INPUT_CLASS,
          selectClass: SELECT_CLASS,
        })}

        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">菜单显示</h2>
          <p class="mt-1 text-sm text-muted-foreground">选择您想展示的菜单组</p>
          <div class="mt-3">
            ${renderMenuGroupDropdownHtml(menuGroupsFieldId(device.id), device.display.menuGroups)}
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-base font-semibold text-card-foreground">菜单展示</h2>
          <div class="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <span class="text-sm font-medium text-card-foreground">纯展示模式</span>
            ${renderToggleSwitch("pureDisplayMode", device.display.pureDisplayMode, "纯展示模式")}
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-base font-semibold text-card-foreground">eMenu Pro 模式</h2>
          <div class="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
            <span class="text-sm font-medium text-card-foreground">eMenu Pro 模式</span>
            ${renderToggleSwitch("emenuProMode", device.display.emenuProMode, "eMenu Pro 模式")}
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-base font-semibold text-card-foreground">下单限制</h2>
          ${renderLimitCard(
            "mealDurationLimit",
            "用餐时长限制",
            "当用餐超出限定时间，将限制点餐，食客需呼叫服务员打开权限",
            device.orderLimits.mealDurationLimit,
          )}
          ${renderLimitCard(
            "orderCountLimit",
            "下单次数限制",
            "当提交订单超出限定次数，将限制点餐，食客需呼叫服务员打开权限",
            device.orderLimits.orderCountLimit,
          )}
          ${renderLimitCard(
            "dishesPerGuestPerRoundLimit",
            "每位食客每轮下单菜品数量限制",
            "当每次提交菜品数量超过设置的数量后，将限制下单，食客需要呼叫服务员打开权限",
            device.orderLimits.dishesPerGuestPerRoundLimit,
          )}
        </section>

        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${EMENU_LIST_PATH}" class="${BTN_GHOST}" data-emenu-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

export function getEmenuHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(EMENU_EDIT_PREFIX)) return null;
  const raw = path.slice(EMENU_EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementEmenuHardwarePath(path: string): boolean {
  return path === EMENU_LIST_PATH || path.startsWith(`${EMENU_LIST_PATH}/`);
}

export function renderDeviceManagementEmenuHardwarePage(path: string): string {
  const editId = getEmenuHardwareEditDeviceId(path);
  if (editId) {
    const device = findEmenuHardwareDevice(editId);
    if (!device) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-emenu-hardware-page>
          <p class="text-sm text-muted-foreground">未找到该设备。</p>
          <a href="#${EMENU_LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回设备列表</a>
        </div>`;
    }
    return renderEditPage(device);
  }
  return renderListPage();
}

function filterDevices(devices: EmenuHardwareDevice[], keyword: string): EmenuHardwareDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.deviceName,
      d.deviceId,
      d.tableNo,
      d.license,
      d.webviewVersion,
      d.shellVersion,
      d.systemVersion,
      d.screenResolution,
      d.timezone,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const list = root.querySelector("[data-emenu-hardware-list]");
  const countEl = root.querySelector("[data-emenu-hardware-count]");
  if (!list) return;
  const devices = filterDevices(readEmenuHardwareDevices(), keyword);
  list.innerHTML = renderDeviceTable(devices);
  if (countEl) {
    const total = readEmenuHardwareDevices().length;
    countEl.textContent =
      keyword.trim() && devices.length !== total
        ? `显示 ${devices.length} / ${total} 台`
        : `共 ${total} 台`;
  }
}

function readToggleState(btn: HTMLButtonElement): boolean {
  return btn.getAttribute("aria-checked") === "true";
}

function setToggleState(btn: HTMLButtonElement, on: boolean): void {
  btn.setAttribute("aria-checked", on ? "true" : "false");
  const knob = btn.querySelector("span");
  if (knob) {
    knob.classList.toggle("translate-x-5", on);
    knob.classList.toggle("translate-x-0.5", !on);
  }
  for (const cls of TOGGLE_TRACK_ON.split(/\s+/)) {
    btn.classList.toggle(cls, on);
  }
  for (const cls of TOGGLE_TRACK_OFF.split(/\s+/)) {
    btn.classList.toggle(cls, !on);
  }
}

let emenuDeviceToggleClickBound = false;

/** 编辑页开关：委托点击，避免 mount 后按钮未绑定或 role=switch 与样式不同步 */
function ensureEmenuDeviceToggleClickListener(): void {
  if (emenuDeviceToggleClickBound) return;
  emenuDeviceToggleClickBound = true;
  document.addEventListener(
    "click",
    (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-emenu-device-toggle]");
      if (!btn?.closest("[data-emenu-device-edit-form]")) return;
      e.preventDefault();
      setToggleState(btn, !readToggleState(btn));
    },
    true,
  );
}

function collectMenuGroupsFromForm(form: HTMLElement, deviceId: string): MenuGroupTag[] {
  const fieldId = menuGroupsFieldId(deviceId);
  const dropdown = form.querySelector<HTMLElement>(
    `[data-menu-group-dropdown][data-storage-id="${fieldId}"]`,
  );
  if (!dropdown) return [];
  return collectMenuGroupsFromDropdown(dropdown);
}

function collectEditFormState(form: HTMLElement, deviceId: string): Partial<EmenuHardwareDevice> {
  const clientBinding = collectTerminalClientBindingFromForm(form);
  const deviceName = clientBinding.name;
  const tableNo =
    form.querySelector<HTMLInputElement>('[data-emenu-edit-field="tableNo"]')?.value.trim() ?? "";

  const display: EmenuDeviceDisplayConfig = {
    menuGroups: collectMenuGroupsFromForm(form, deviceId),
    pureDisplayMode: false,
    emenuProMode: false,
  };
  const orderLimits: EmenuDeviceOrderLimits = { ...DEFAULT_ORDER_LIMITS };

  form.querySelectorAll<HTMLButtonElement>("[data-emenu-device-toggle]").forEach((btn) => {
    const field = btn.getAttribute("data-emenu-device-toggle");
    if (!field) return;
    const on = readToggleState(btn);
    if (field === "pureDisplayMode" || field === "emenuProMode") {
      display[field] = on;
    } else if (field in orderLimits) {
      orderLimits[field as keyof EmenuDeviceOrderLimits] = on;
    }
  });

  return { deviceName, tableNo, display, orderLimits, clientBinding };
}

function saveEditedDevice(deviceId: string, form: HTMLElement): boolean {
  const devices = readEmenuHardwareDevices();
  const idx = devices.findIndex((d) => d.id === deviceId);
  if (idx < 0) return false;
  const patch = collectEditFormState(form, deviceId);
  if (!patch.deviceName || !patch.clientBinding?.name) {
    window.alert("请填写名称");
    return false;
  }
  const next = [...devices];
  next[idx] = normalizeDevice({ ...next[idx], ...patch })!;
  writeEmenuHardwareDevices(next);
  writeMenuGroupTags(menuGroupsFieldId(deviceId), next[idx].display.menuGroups);
  return true;
}

function deleteDevice(deviceId: string): void {
  const devices = readEmenuHardwareDevices().filter((d) => d.id !== deviceId);
  writeEmenuHardwareDevices(devices);
}

export function bindDeviceManagementEmenuHardware(root: ParentNode = document): void {
  ensureEmenuDeviceToggleClickListener();

  const page = root.querySelector("[data-emenu-hardware-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-emenu-view");

  if (view === "list") {
    if (page.dataset.emenuListBound === "1") return;
    page.dataset.emenuListBound = "1";

    const search = page.querySelector<HTMLInputElement>("[data-emenu-hardware-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-emenu-device-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        if (id) navigateEmenuPath(`${EMENU_EDIT_PREFIX}${encodeURIComponent(id)}`);
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-emenu-device-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      if (!id) return;
      const device = findEmenuHardwareDevice(id);
      const label = device?.deviceName ?? id;
      if (!window.confirm(`确定删除设备「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "edit") {
    if (page.dataset.emenuEditBound === "1") return;
    page.dataset.emenuEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const form = page.querySelector<HTMLElement>("[data-emenu-device-edit-form]");
    if (!form) return;

    bindMenuGroupDropdownPickers(page);
    bindTerminalClientBindingForm(form);

    form.querySelectorAll<HTMLButtonElement>("[data-emenu-device-toggle]").forEach((btn) => {
      setToggleState(btn, readToggleState(btn));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveEditedDevice(deviceId, form)) return;
      navigateEmenuPath(EMENU_LIST_PATH);
    });

    page.querySelector("[data-emenu-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateEmenuPath(EMENU_LIST_PATH);
    });
    page.querySelector("[data-emenu-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateEmenuPath(EMENU_LIST_PATH);
    });
  }
}
