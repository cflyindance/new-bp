/**
 * 硬件管理中心 → 硬件 → 打印机：打印机台账（seq 352–363）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const PRINTER_DEVICES_FIELD_ID = "dm-printer-devices";

const LIST_PATH = "/device-management/hardware/printers";
const EDIT_PREFIX = "/device-management/hardware/printers/edit/";
const NEW_PATH = "/device-management/hardware/printers/new";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const BTN_GHOST =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_LINK = "text-sm font-medium text-primary hover:underline";

export type PrinterHardwareType = "receipt" | "kitchen" | "label" | "pack" | "report";

/** 切纸打印模式（seq 362） */
export type CutPaperPrintMode =
  | "none"
  | "per-dish-combo"
  | "per-dish-sub"
  | "per-dish-combo-split"
  | "per-dish-sub-split";

const CUT_PAPER_OPTIONS: { value: CutPaperPrintMode; label: string }[] = [
  { value: "none", label: "不切纸" },
  { value: "per-dish-combo", label: "每单打印一个菜/套餐" },
  { value: "per-dish-sub", label: "每单打印一个菜/子菜" },
  { value: "per-dish-combo-split", label: "每单打印一个菜/套餐(分开)" },
  { value: "per-dish-sub-split", label: "每单打印一个菜/子菜(分开)" },
];

export type PrinterHardwareDevice = {
  id: string;
  name: string;
  primaryLanguage: string;
  secondLanguage: string;
  printerType: PrinterHardwareType;
  ipAddress: string;
  kitchenName: string;
  /** 打印机型号/驱动（seq 359） */
  printerModel: string;
  nameSecondLanguage: string;
  thirdLanguage: string;
  cutPaperMode: CutPaperPrintMode;
  backupPrinterId: string;
};

const LANGUAGE_OPTIONS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "none", label: "—" },
];

const PRINTER_TYPE_OPTIONS: { value: PrinterHardwareType; label: string }[] = [
  { value: "receipt", label: "收据打印机" },
  { value: "kitchen", label: "厨房打印机" },
  { value: "label", label: "标签打印机" },
  { value: "pack", label: "打包单打印机" },
  { value: "report", label: "报表打印机" },
];

/** 编辑页「打印机」下拉：系统已安装/可选打印驱动（seq 359） */
const PRINTER_DRIVER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "请选择" },
  { value: "display", label: "Display" },
  { value: "wps-pdf", label: "导出为WPSPDF" },
  { value: "npidabdf4-hp-laserjet", label: "NPIDABDF4 (HP LaserJet Pro M148fdw)" },
  { value: "microsoft-xps-writer", label: "Microsoft XPS Document Writer" },
  { value: "microsoft-print-to-pdf", label: "Microsoft Print to PDF" },
  { value: "fax", label: "Fax" },
  { value: "network", label: "Network" },
];

const LEGACY_PRINTER_MODEL_MAP: Record<string, string> = {
  "epson-tm88": "network",
  "star-tsp100": "network",
  "sunmi-inner": "display",
  "custom-other": "",
};

const STORAGE_DEFAULT: PrinterHardwareDevice[] = [
  {
    id: "pr-receipt-1",
    name: "前台收据打印机",
    primaryLanguage: "zh",
    secondLanguage: "en",
    printerType: "receipt",
    ipAddress: "192.168.1.101",
    kitchenName: "—",
    printerModel: "npidabdf4-hp-laserjet",
    nameSecondLanguage: "Front Receipt",
    thirdLanguage: "none",
    cutPaperMode: "per-dish-combo",
    backupPrinterId: "pr-receipt-2",
  },
  {
    id: "pr-receipt-2",
    name: "吧台收据打印机",
    primaryLanguage: "zh",
    secondLanguage: "en",
    printerType: "receipt",
    ipAddress: "192.168.1.102",
    kitchenName: "—",
    printerModel: "network",
    nameSecondLanguage: "Bar Receipt",
    thirdLanguage: "none",
    cutPaperMode: "per-dish-sub",
    backupPrinterId: "",
  },
  {
    id: "pr-kitchen-1",
    name: "厨房热敏打印机",
    primaryLanguage: "zh",
    secondLanguage: "none",
    printerType: "kitchen",
    ipAddress: "192.168.1.201",
    kitchenName: "热厨",
    printerModel: "network",
    nameSecondLanguage: "",
    thirdLanguage: "none",
    cutPaperMode: "none",
    backupPrinterId: "",
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function languageLabel(code: string): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === code)?.label ?? (code || "—");
}

function printerTypeLabel(type: PrinterHardwareType): string {
  return PRINTER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function normalizePrinterDriver(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const legacy = LEGACY_PRINTER_MODEL_MAP[trimmed];
  if (legacy !== undefined) return legacy;
  if (PRINTER_DRIVER_OPTIONS.some((o) => o.value === trimmed)) return trimmed;
  return trimmed;
}

function printerModelLabel(model: string): string {
  const normalized = normalizePrinterDriver(model);
  if (!normalized) return "—";
  return PRINTER_DRIVER_OPTIONS.find((o) => o.value === normalized)?.label ?? normalized;
}

function backupPrinterLabel(id: string, devices: PrinterHardwareDevice[]): string {
  if (!id) return "—";
  return devices.find((d) => d.id === id)?.name ?? "—";
}

function normalizePrinterType(raw: unknown): PrinterHardwareType {
  if (raw === "receipt" || raw === "kitchen" || raw === "label" || raw === "pack" || raw === "report") {
    return raw;
  }
  return "receipt";
}

function normalizeLanguage(raw: unknown): string {
  if (typeof raw !== "string") return "zh";
  return LANGUAGE_OPTIONS.some((o) => o.value === raw) ? raw : "zh";
}

function isCutPaperPrintMode(raw: unknown): raw is CutPaperPrintMode {
  return typeof raw === "string" && CUT_PAPER_OPTIONS.some((o) => o.value === raw);
}

function cutPaperModeLabel(mode: CutPaperPrintMode): string {
  return CUT_PAPER_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

/** 兼容旧版 cutPaper 布尔开关 */
function normalizeCutPaperMode(raw: Partial<PrinterHardwareDevice> & { cutPaper?: boolean }): CutPaperPrintMode {
  if (isCutPaperPrintMode(raw.cutPaperMode)) return raw.cutPaperMode;
  if (typeof raw.cutPaper === "boolean") return raw.cutPaper ? "per-dish-combo" : "none";
  return "none";
}

function normalizeDevice(raw: Partial<PrinterHardwareDevice> & { cutPaper?: boolean }): PrinterHardwareDevice | null {
  if (!raw.id) return null;
  const name = raw.name?.trim();
  if (!name) return null;
  return {
    id: raw.id,
    name,
    primaryLanguage: normalizeLanguage(raw.primaryLanguage),
    secondLanguage: normalizeLanguage(raw.secondLanguage ?? "none"),
    printerType: normalizePrinterType(raw.printerType),
    ipAddress: raw.ipAddress?.trim() || "—",
    kitchenName: raw.kitchenName?.trim() || "—",
    printerModel: normalizePrinterDriver(raw.printerModel),
    nameSecondLanguage: raw.nameSecondLanguage?.trim() ?? "",
    thirdLanguage: normalizeLanguage(raw.thirdLanguage ?? "none"),
    cutPaperMode: normalizeCutPaperMode(raw),
    backupPrinterId: raw.backupPrinterId?.trim() ?? "",
  };
}

export function readPrinterHardwareDevices(): PrinterHardwareDevice[] {
  const raw = readModuleSettingJson<Partial<PrinterHardwareDevice>[]>(PRINTER_DEVICES_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return [...STORAGE_DEFAULT];
  const out: PrinterHardwareDevice[] = [];
  for (const item of raw) {
    const n = normalizeDevice(item);
    if (n) out.push(n);
  }
  return out.length > 0 ? out : [...STORAGE_DEFAULT];
}

export function writePrinterHardwareDevices(devices: PrinterHardwareDevice[]): void {
  writeModuleSettingJson(PRINTER_DEVICES_FIELD_ID, devices);
}

export function findPrinterHardwareDevice(id: string): PrinterHardwareDevice | undefined {
  return readPrinterHardwareDevices().find((d) => d.id === id);
}

function navigatePrinterPath(path: string): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const nextHash = `#${normalized}`;
  if (location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  location.hash = nextHash;
}

function newDeviceId(): string {
  return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function renderTableCell(value: string, opts?: { mono?: boolean; maxWidth?: string }): string {
  const mono = opts?.mono ? "font-mono text-xs" : "text-sm";
  const max = opts?.maxWidth ?? "max-w-[9rem]";
  return `
    <td class="px-3 py-3 align-top text-foreground">
      <span class="block truncate ${max} ${mono}" title="${escapeHtml(value)}">${escapeHtml(value)}</span>
    </td>`;
}

function renderDeviceTable(devices: PrinterHardwareDevice[]): string {
  if (devices.length === 0) {
    return `<p class="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">暂无打印机。请点击「新增打印机」添加。</p>`;
  }

  const rows = devices
    .map((d) => {
      const editPath = `${EDIT_PREFIX}${encodeURIComponent(d.id)}`;
      return `
      <tr class="border-t border-border" data-printer-row data-device-id="${escapeHtml(d.id)}">
        ${renderTableCell(d.name, { maxWidth: "max-w-[8rem]" })}
        ${renderTableCell(languageLabel(d.primaryLanguage))}
        ${renderTableCell(languageLabel(d.secondLanguage))}
        ${renderTableCell(printerTypeLabel(d.printerType))}
        ${renderTableCell(d.ipAddress, { mono: true })}
        ${renderTableCell(d.kitchenName)}
        ${renderTableCell(printerModelLabel(d.printerModel), { maxWidth: "max-w-[10rem]" })}
        ${renderTableCell(d.nameSecondLanguage || "—")}
        ${renderTableCell(languageLabel(d.thirdLanguage))}
        ${renderTableCell(cutPaperModeLabel(d.cutPaperMode), { maxWidth: "max-w-[12rem]" })}
        ${renderTableCell(backupPrinterLabel(d.backupPrinterId, devices))}
        <td class="sticky right-0 bg-card px-3 py-3 text-right align-top whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
          <a href="#${editPath}" class="${BTN_LINK} mr-3" data-printer-edit data-device-id="${escapeHtml(d.id)}">编辑</a>
          <button type="button" class="text-sm font-medium text-destructive hover:underline" data-printer-delete data-device-id="${escapeHtml(d.id)}">删除</button>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full min-w-[96rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium whitespace-nowrap">名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">语言设置</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">第二语言</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">打印机类型</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">IP地址</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">厨房名称</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">打印机</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">打印机名称(第二语言)</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">第三语言</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">切纸打印</th>
            <th class="px-3 py-2 font-medium whitespace-nowrap">备用打印机</th>
            <th class="sticky right-0 bg-muted/40 px-3 py-2 text-right font-medium whitespace-nowrap shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderLanguageSelect(field: string, selected: string): string {
  const options = LANGUAGE_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");
  return `<select class="${SELECT_CLASS}" data-printer-field="${escapeHtml(field)}">${options}</select>`;
}

function renderCutPaperSelect(selected: CutPaperPrintMode): string {
  const options = CUT_PAPER_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");
  return `
    <select class="${SELECT_CLASS} sm:max-w-md" data-printer-field="cutPaperMode" required aria-label="切纸打印">
      ${options}
    </select>`;
}

function renderFormPage(device: PrinterHardwareDevice, opts: { isNew: boolean }): string {
  const title = opts.isNew ? "新增打印机" : "编辑打印机";
  const allPrinters = readPrinterHardwareDevices();
  const backupOptions = [
    `<option value="">无</option>`,
    ...allPrinters
      .filter((p) => p.id !== device.id)
      .map(
        (p) =>
          `<option value="${escapeHtml(p.id)}" ${p.id === device.backupPrinterId ? "selected" : ""}>${escapeHtml(p.name)}</option>`,
      ),
  ].join("");

  const typeOptions = PRINTER_TYPE_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === device.printerType ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");

  const modelOptions = PRINTER_DRIVER_OPTIONS.map(
    (o) =>
      `<option value="${escapeHtml(o.value)}" ${o.value === device.printerModel ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
  ).join("");

  const showKitchen = device.printerType === "kitchen";

  return `
    <div class="device-management-printer-hardware space-y-6" data-printer-page data-printer-view="edit" data-device-id="${escapeHtml(device.id)}" data-is-new="${opts.isNew ? "1" : "0"}">
      <div class="flex flex-wrap items-center gap-3">
        <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-printer-edit-back>← 返回打印机列表</a>
      </div>
      <form class="space-y-6" data-printer-form novalidate>
        <section class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 class="text-base font-semibold text-card-foreground">${escapeHtml(title)}</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pr-edit-name">名称</label>
              <input id="pr-edit-name" type="text" class="${INPUT_CLASS}" data-printer-field="name" value="${escapeHtml(device.name)}" required />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">语言设置</label>
              ${renderLanguageSelect("primaryLanguage", device.primaryLanguage)}
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">第二语言</label>
              ${renderLanguageSelect("secondLanguage", device.secondLanguage)}
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">第三语言</label>
              ${renderLanguageSelect("thirdLanguage", device.thirdLanguage)}
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">打印机类型</label>
              <select class="${SELECT_CLASS}" data-printer-field="printerType" required>${typeOptions}</select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pr-edit-ip">IP地址</label>
              <input id="pr-edit-ip" type="text" class="${INPUT_CLASS} font-mono text-xs" data-printer-field="ipAddress" value="${escapeHtml(device.ipAddress === "—" ? "" : device.ipAddress)}" placeholder="192.168.1.100" />
            </div>
            <div data-printer-kitchen-wrap class="${showKitchen ? "" : "hidden"}">
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pr-edit-kitchen">厨房名称</label>
              <input id="pr-edit-kitchen" type="text" class="${INPUT_CLASS}" data-printer-field="kitchenName" value="${escapeHtml(device.kitchenName === "—" ? "" : device.kitchenName)}" placeholder="如：热厨、冷厨" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">打印机</label>
              <select class="${SELECT_CLASS}" data-printer-field="printerModel">${modelOptions}</select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pr-edit-name2">打印机名称(第二语言)</label>
              <input id="pr-edit-name2" type="text" class="${INPUT_CLASS}" data-printer-field="nameSecondLanguage" value="${escapeHtml(device.nameSecondLanguage)}" placeholder="第二语言下的显示名称" />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground">备用打印机</label>
              <select class="${SELECT_CLASS}" data-printer-field="backupPrinterId">${backupOptions}</select>
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-xs font-medium text-muted-foreground" for="pr-edit-cut-paper">切纸打印</label>
              <div id="pr-edit-cut-paper">${renderCutPaperSelect(device.cutPaperMode)}</div>
              <p class="mt-1 text-xs text-muted-foreground">控制厨房单等票据的切纸与分单打印方式。</p>
            </div>
          </div>
        </section>
        <div class="flex flex-wrap items-center gap-3 border-t border-border pt-2">
          <button type="submit" class="${BTN_PRIMARY}">保存</button>
          <a href="#${LIST_PATH}" class="${BTN_GHOST}" data-printer-edit-cancel>取消</a>
        </div>
      </form>
    </div>`;
}

function renderListPage(): string {
  const devices = readPrinterHardwareDevices();
  return `
    <div class="device-management-printer-hardware space-y-6" data-printer-page data-printer-view="list">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-card-foreground">打印机</h2>
            <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              管理门店打印机台账：语言、类型、IP、厨房名称、切纸与备用打印机等（seq 352–363）。
            </p>
          </div>
          <a href="#${NEW_PATH}" class="${BTN_PRIMARY}" data-printer-add>新增打印机</a>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <label class="sr-only" for="printer-hardware-search">搜索打印机</label>
          <input
            id="printer-hardware-search"
            type="search"
            placeholder="按名称、IP、厨房、类型、语言搜索…"
            class="h-9 min-w-[14rem] flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-md"
            data-printer-search
          />
          <span class="text-sm text-muted-foreground" data-printer-count>共 ${devices.length} 台</span>
        </div>
      </div>
      <div data-printer-list>${renderDeviceTable(devices)}</div>
    </div>`;
}

export function getPrinterHardwareEditDeviceId(path: string): string | null {
  if (!path.startsWith(EDIT_PREFIX)) return null;
  const raw = path.slice(EDIT_PREFIX.length).split("/")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isDeviceManagementPrinterHardwarePath(path: string): boolean {
  return path === LIST_PATH || path.startsWith(`${LIST_PATH}/`);
}

export function renderDeviceManagementPrinterHardwarePage(path: string): string {
  if (path === NEW_PATH) {
    return renderFormPage(
      {
        id: newDeviceId(),
        name: "",
        primaryLanguage: "zh",
        secondLanguage: "en",
        printerType: "receipt",
        ipAddress: "",
        kitchenName: "",
        printerModel: "",
        nameSecondLanguage: "",
        thirdLanguage: "none",
        cutPaperMode: "none",
        backupPrinterId: "",
      },
      { isNew: true },
    );
  }

  const editId = getPrinterHardwareEditDeviceId(path);
  if (editId) {
    const device = findPrinterHardwareDevice(editId);
    if (!device) {
      return `
        <div class="rounded-xl border border-border bg-card p-6 shadow-sm" data-printer-page>
          <p class="text-sm text-muted-foreground">未找到该打印机。</p>
          <a href="#${LIST_PATH}" class="mt-4 inline-flex ${BTN_PRIMARY}">返回打印机列表</a>
        </div>`;
    }
    return renderFormPage(device, { isNew: false });
  }

  return renderListPage();
}

function filterDevices(devices: PrinterHardwareDevice[], keyword: string): PrinterHardwareDevice[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return devices;
  return devices.filter((d) => {
    const hay = [
      d.name,
      languageLabel(d.primaryLanguage),
      languageLabel(d.secondLanguage),
      printerTypeLabel(d.printerType),
      d.ipAddress,
      d.kitchenName,
      printerModelLabel(d.printerModel),
      d.nameSecondLanguage,
      languageLabel(d.thirdLanguage),
      cutPaperModeLabel(d.cutPaperMode),
      backupPrinterLabel(d.backupPrinterId, devices),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function rerenderList(root: HTMLElement, keyword: string): void {
  const list = root.querySelector("[data-printer-list]");
  const countEl = root.querySelector("[data-printer-count]");
  if (!list) return;
  const devices = filterDevices(readPrinterHardwareDevices(), keyword);
  list.innerHTML = renderDeviceTable(devices);
  if (countEl) {
    const total = readPrinterHardwareDevices().length;
    countEl.textContent =
      keyword.trim() && devices.length !== total
        ? `显示 ${devices.length} / ${total} 台`
        : `共 ${total} 台`;
  }
}

function syncKitchenFieldVisibility(form: HTMLElement): void {
  const typeEl = form.querySelector<HTMLSelectElement>('[data-printer-field="printerType"]');
  const wrap = form.querySelector<HTMLElement>("[data-printer-kitchen-wrap]");
  if (!typeEl || !wrap) return;
  wrap.classList.toggle("hidden", typeEl.value !== "kitchen");
}

function collectFormState(form: HTMLElement): Partial<PrinterHardwareDevice> | null {
  const getField = (field: string): string => {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-printer-field="${field}"]`,
    );
    return el?.value.trim() ?? "";
  };

  const name = getField("name");
  if (!name) return null;

  const cutPaperRaw = getField("cutPaperMode");
  const cutPaperMode = isCutPaperPrintMode(cutPaperRaw) ? cutPaperRaw : "none";

  return {
    name,
    primaryLanguage: getField("primaryLanguage"),
    secondLanguage: getField("secondLanguage"),
    thirdLanguage: getField("thirdLanguage"),
    printerType: normalizePrinterType(getField("printerType")),
    ipAddress: getField("ipAddress"),
    kitchenName: getField("kitchenName"),
    printerModel: getField("printerModel"),
    nameSecondLanguage: getField("nameSecondLanguage"),
    backupPrinterId: getField("backupPrinterId"),
    cutPaperMode,
  };
}

function saveDevice(deviceId: string, isNew: boolean, form: HTMLElement): boolean {
  const patch = collectFormState(form);
  if (!patch) {
    window.alert("请填写名称。");
    return false;
  }

  const devices = readPrinterHardwareDevices();
  if (isNew) {
    const created = normalizeDevice({ id: deviceId, ...patch });
    if (!created) return false;
    writePrinterHardwareDevices([...devices, created]);
    return true;
  }

  const idx = devices.findIndex((d) => d.id === deviceId);
  if (idx < 0) return false;
  const next = [...devices];
  next[idx] = normalizeDevice({ ...next[idx], ...patch })!;
  writePrinterHardwareDevices(next);
  return true;
}

function deleteDevice(deviceId: string): void {
  const next = readPrinterHardwareDevices()
    .filter((d) => d.id !== deviceId)
    .map((d) => (d.backupPrinterId === deviceId ? { ...d, backupPrinterId: "" } : d));
  writePrinterHardwareDevices(next);
}

export function bindDeviceManagementPrinterHardware(root: ParentNode = document): void {
  const page = root.querySelector("[data-printer-page]");
  if (!(page instanceof HTMLElement)) return;

  const view = page.getAttribute("data-printer-view");

  if (view === "list") {
    if (page.dataset.printerListBound === "1") return;
    page.dataset.printerListBound = "1";

    const search = page.querySelector<HTMLInputElement>("[data-printer-search]");
    search?.addEventListener("input", () => rerenderList(page, search.value));

    page.addEventListener("click", (e) => {
      const add = (e.target as HTMLElement).closest<HTMLElement>("[data-printer-add]");
      if (add) {
        e.preventDefault();
        navigatePrinterPath(NEW_PATH);
        return;
      }

      const edit = (e.target as HTMLElement).closest<HTMLElement>("[data-printer-edit]");
      if (edit) {
        e.preventDefault();
        const id = edit.getAttribute("data-device-id");
        if (id) navigatePrinterPath(`${EDIT_PREFIX}${encodeURIComponent(id)}`);
        return;
      }

      const del = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-printer-delete]");
      if (!del) return;
      const id = del.getAttribute("data-device-id");
      if (!id) return;
      const device = findPrinterHardwareDevice(id);
      const label = device?.name ?? id;
      if (!window.confirm(`确定删除打印机「${label}」？删除后不可恢复。`)) return;
      deleteDevice(id);
      rerenderList(page, search?.value ?? "");
    });
    return;
  }

  if (view === "edit") {
    if (page.dataset.printerEditBound === "1") return;
    page.dataset.printerEditBound = "1";

    const deviceId = page.getAttribute("data-device-id");
    if (!deviceId) return;

    const isNew = page.getAttribute("data-is-new") === "1";
    const form = page.querySelector<HTMLElement>("[data-printer-form]");
    if (!form) return;

    syncKitchenFieldVisibility(form);
    form.querySelector('[data-printer-field="printerType"]')?.addEventListener("change", () => {
      syncKitchenFieldVisibility(form);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!saveDevice(deviceId, isNew, form)) return;
      navigatePrinterPath(LIST_PATH);
    });

    page.querySelector("[data-printer-edit-back]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigatePrinterPath(LIST_PATH);
    });
    page.querySelector("[data-printer-edit-cancel]")?.addEventListener("click", (e) => {
      e.preventDefault();
      navigatePrinterPath(LIST_PATH);
    });
  }
}
