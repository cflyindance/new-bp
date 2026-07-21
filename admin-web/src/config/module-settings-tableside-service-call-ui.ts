/**
 * 前厅 · 桌边服务（方案 A：333 服务类型 SSOT；630–636 / 629 已迁并废弃）。
 * — 641 未开单可呼叫服务员：主开关 + 产线多选（仅 eMenu、SDI），结构对齐选桌页面/跳过选桌 107
 * — 333 用餐者请求服务的类型：产线 | 类型多选（含呼叫服务员），结构对齐点单显示座位 132
 * — 640 呼叫服务员时间间隔：产线 | 启用 | 秒数，结构对齐每单最多客人数量 111
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import { newRuleId } from "./module-settings-dish-rules-ui";
import {
  moduleSettingStorageKey,
  readModuleSettingCheckbox,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";

/** 与 module-settings-toggle-ui 一致；本地定义以避免与 toggle-ui 循环引用 */
function moduleSettingToggleStorageKey(seq: number): string {
  return `bplant-module-setting-toggle:${seq}`;
}

/** @deprecated 已并入 333「用餐者请求服务的类型」· 呼叫服务员；仅迁移旧数据 */
export const TABLESIDE_SERVICE_CALL_MASTER_SEQ = 629;
export const TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ = 641;
export const TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ = 640;
export const TABLESIDE_SERVICE_REQUEST_TYPES_SEQ = 333;

/** 原 seq 630–636 / 629 对应能力，迁并至 333 */
export const TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS = [
  { code: "call-waiter", label: "呼叫服务员", legacySeq: 629 },
  { code: "checkout", label: "结账", legacySeq: 630 },
  { code: "water", label: "加水", legacySeq: 631 },
  { code: "utensils", label: "加餐具", legacySeq: 632 },
  { code: "tissue", label: "送纸巾", legacySeq: 633 },
  { code: "soup", label: "加汤", legacySeq: 634 },
  { code: "grill-plate", label: "换烤盘", legacySeq: 635 },
  { code: "order-drinks", label: "点酒水", legacySeq: 636 },
] as const;

export type TablesideServiceRequestTypeCode =
  (typeof TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS)[number]["code"];

export const TABLESIDE_SERVICE_CALL_TOGGLE_SEQS: readonly number[] = [
  TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ,
];

/** 640 / 641 / 333 适用产线（仅 eMenu、SDI） */
export const SERVICE_CALL_COOLDOWN_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type ServiceCallCooldownProductLineId =
  (typeof SERVICE_CALL_COOLDOWN_PRODUCT_LINES)[number]["id"];

export const TABLESIDE_SERVICE_CALL_PRODUCT_LINES = SERVICE_CALL_COOLDOWN_PRODUCT_LINES;

export type TablesideServiceCallProductLineId = ServiceCallCooldownProductLineId;

/** @deprecated 已并入 333；仅迁移旧产线数据（勿命名为 *_LINES_STORAGE_ID，避免写入产线 registry） */
const LEGACY_MASTER_SERVICE_CALL_LINES = "629-tableside-service-call-lines";

const TABLESIDE_SERVICE_CALL_LINES_STORAGE_IDS: Record<
  typeof TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ,
  string
> = {
  [TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ]: "641-tableside-service-call-before-order-lines",
};

const ALL_LINE_IDS: TablesideServiceCallProductLineId[] =
  TABLESIDE_SERVICE_CALL_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const BTN_PRIMARY =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_GHOST =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

const BTN_DIALOG_PRIMARY =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";

const TEXT_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const toggleMigratedSeqs = new Set<number>();

export const TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID = "640-service-call-cooldown-seconds";
export const SERVICE_CALL_COOLDOWN_BY_LINE_FIELD_ID = "640-service-call-cooldown-by-line";
const COOLDOWN_LINES_STORAGE_ID = "640-service-call-cooldown-lines";

const COOLDOWN_DEFAULT = 60;
const COOLDOWN_MIN = 0;
const COOLDOWN_MAX = 600;

export type ServiceCallCooldownLineConfig = {
  enabled: boolean;
  seconds: number;
};

const COOLDOWN_LINE_IDS: ServiceCallCooldownProductLineId[] =
  SERVICE_CALL_COOLDOWN_PRODUCT_LINES.map((l) => l.id);

let cooldownByLineMigrated = false;

const CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const COOLDOWN_NUMBER_INPUT_CLASS =
  "h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SERVICE_REQUEST_TYPES_STORAGE_ID = "333-service-request-types-config";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export type ServiceRequestTypeEntry = {
  id: string;
  label: string;
  builtin?: boolean;
  lines: TablesideServiceCallProductLineId[];
};

export type ServiceRequestTypesConfig = {
  types: ServiceRequestTypeEntry[];
};

let serviceRequestTypesMigrated = false;
let callWaiterFrom629Migrated = false;

/** @deprecated 仅用于迁移旧版 checkbox 存储 */
export function serviceRequestTypeCheckboxFieldId(code: string): string {
  return `333-service-request-type-${code}`;
}

function readLegacy629Lines(): TablesideServiceCallProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LEGACY_MASTER_SERVICE_CALL_LINES, null);
  return normalizeLines(stored);
}

function readLegacyServiceRequestTypeEnabled(code: string): boolean {
  const opt = TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS.find((o) => o.code === code);
  if (!opt) return false;
  return readLegacyToggleOn(opt.legacySeq);
}

function readLegacyCheckboxEnabledMap(): Record<TablesideServiceRequestTypeCode, boolean> {
  const out = {} as Record<TablesideServiceRequestTypeCode, boolean>;
  for (const opt of TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS) {
    const fieldId = serviceRequestTypeCheckboxFieldId(opt.code);
    let on = readModuleSettingCheckbox(fieldId, false);
    if (!on) on = readLegacyServiceRequestTypeEnabled(opt.code);
    out[opt.code] = on;
  }
  return out;
}

function defaultBuiltinTypeEntries(): ServiceRequestTypeEntry[] {
  return TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS.map((opt) => ({
    id: opt.code,
    label: opt.label,
    builtin: true,
    lines: [],
  }));
}

function normalizeLines(raw: unknown): TablesideServiceCallProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is TablesideServiceCallProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

function normalizeConfig(raw: unknown): ServiceRequestTypesConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const typesRaw = (raw as { types?: unknown }).types;
  if (!Array.isArray(typesRaw)) return null;

  const types: ServiceRequestTypeEntry[] = [];
  for (const row of typesRaw) {
    if (!row || typeof row !== "object") continue;
    const r = row as ServiceRequestTypeEntry;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const label = typeof r.label === "string" ? r.label.trim() : "";
    if (!id) continue;
    types.push({
      id,
      label,
      builtin: Boolean(r.builtin),
      lines: normalizeLines(r.lines),
    });
  }
  if (types.length === 0) return null;
  return { types };
}

function mergeBuiltinTypes(types: ServiceRequestTypeEntry[]): ServiceRequestTypeEntry[] {
  const byId = new Map(types.map((t) => [t.id, t]));
  const merged: ServiceRequestTypeEntry[] = [];
  for (const opt of TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS) {
    const existing = byId.get(opt.code);
    merged.push(
      existing
        ? { ...existing, builtin: true, label: existing.label || opt.label }
        : { id: opt.code, label: opt.label, builtin: true, lines: [] },
    );
    byId.delete(opt.code);
  }
  for (const custom of byId.values()) {
    merged.push({ ...custom, builtin: false });
  }
  return merged;
}

export function ensureServiceRequestTypesMigrated(): void {
  if (serviceRequestTypesMigrated) return;
  serviceRequestTypesMigrated = true;

  const stored = readModuleSettingJson<unknown>(SERVICE_REQUEST_TYPES_STORAGE_ID, null);
  if (normalizeConfig(stored)) {
    ensureCallWaiterTypeMigratedFrom629();
    return;
  }

  const legacy = readLegacyCheckboxEnabledMap();
  const types = defaultBuiltinTypeEntries().map((entry) => {
    const code = entry.id as TablesideServiceRequestTypeCode;
    let lines: TablesideServiceCallProductLineId[] = legacy[code]
      ? ([...ALL_LINE_IDS] as TablesideServiceCallProductLineId[])
      : [];
    if (code === "call-waiter" && lines.length === 0 && readLegacyToggleOn(629)) {
      const from629 = readLegacy629Lines();
      lines = from629.length > 0 ? from629 : [...ALL_LINE_IDS];
    }
    return { ...entry, lines };
  });
  writeServiceRequestTypesConfig({ types });
  callWaiterFrom629Migrated = true;
}

/** 已有 333 配置时，将原 629 总开关产线并入「呼叫服务员」类型（一次性） */
function ensureCallWaiterTypeMigratedFrom629(): void {
  if (callWaiterFrom629Migrated) return;
  callWaiterFrom629Migrated = true;

  const markerKey = "bplant-module-setting:333-call-waiter-from-629-migrated";
  try {
    if (localStorage.getItem(markerKey) === "1") return;
  } catch {
    return;
  }

  const stored = readModuleSettingJson<unknown>(SERVICE_REQUEST_TYPES_STORAGE_ID, null);
  const normalized = normalizeConfig(stored);
  if (!normalized) return;

  const merged = mergeBuiltinTypes(normalized.types);
  const entry = merged.find((t) => t.id === "call-waiter");
  if (entry && entry.lines.length > 0) {
    try {
      localStorage.setItem(markerKey, "1");
    } catch {
      /* ignore */
    }
    return;
  }

  if (!readLegacyToggleOn(629)) {
    try {
      localStorage.setItem(markerKey, "1");
    } catch {
      /* ignore */
    }
    return;
  }

  const from629 = readLegacy629Lines();
  const lines = from629.length > 0 ? from629 : [...ALL_LINE_IDS];
  writeServiceRequestTypesConfig({
    types: merged.map((t) => (t.id === "call-waiter" ? { ...t, lines } : t)),
  });
  try {
    localStorage.setItem(markerKey, "1");
  } catch {
    /* ignore */
  }
}

export function readServiceRequestTypesConfig(): ServiceRequestTypesConfig {
  ensureServiceRequestTypesMigrated();
  ensureCallWaiterTypeMigratedFrom629();
  const stored = readModuleSettingJson<unknown>(SERVICE_REQUEST_TYPES_STORAGE_ID, null);
  const normalized = normalizeConfig(stored);
  if (normalized) {
    return { types: mergeBuiltinTypes(normalized.types) };
  }
  return { types: defaultBuiltinTypeEntries() };
}

export function writeServiceRequestTypesConfig(config: ServiceRequestTypesConfig): void {
  const types = mergeBuiltinTypes(config.types).map((entry) => ({
    id: entry.id,
    label: entry.label.trim(),
    builtin: entry.builtin ?? false,
    lines: ALL_LINE_IDS.filter((id) => entry.lines.includes(id)),
  }));
  writeModuleSettingJson(SERVICE_REQUEST_TYPES_STORAGE_ID, { types });
}

export function readServiceRequestTypesEnabled(): Record<TablesideServiceRequestTypeCode, boolean> {
  const config = readServiceRequestTypesConfig();
  const out = {} as Record<TablesideServiceRequestTypeCode, boolean>;
  for (const opt of TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS) {
    const entry = config.types.find((t) => t.id === opt.code);
    out[opt.code] = (entry?.lines.length ?? 0) > 0;
  }
  return out;
}

function isBuiltinServiceRequestTypeId(typeId: string): boolean {
  return TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS.some((opt) => opt.code === typeId);
}

function newCustomServiceRequestTypeId(): string {
  return `custom-${newRuleId()}`;
}

function typesSelectedForLine(
  config: ServiceRequestTypesConfig,
  lineId: TablesideServiceCallProductLineId,
): Set<string> {
  const selected = new Set<string>();
  for (const entry of config.types) {
    if (entry.lines.includes(lineId)) selected.add(entry.id);
  }
  return selected;
}

function renderServiceTypeCheckboxesForLine(
  lineId: TablesideServiceCallProductLineId,
  lineLabel: string,
  config: ServiceRequestTypesConfig,
): string {
  const selected = typesSelectedForLine(config, lineId);
  const inputs = config.types
    .map((entry) => {
      const checked = selected.has(entry.id);
      const label = entry.label.trim() || "未命名类型";
      return `
      <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(entry.id)}"
          data-service-request-type-line="${escapeHtml(lineId)}"
          data-service-request-type-id="${escapeHtml(entry.id)}"
          ${entry.builtin === false || !isBuiltinServiceRequestTypeId(entry.id) ? "data-service-request-type-custom" : ""}
          ${checked ? "checked" : ""}
          aria-label="${escapeHtml(lineLabel)} ${escapeHtml(label)}"
        />
        <span>${escapeHtml(label)}</span>
      </label>`;
    })
    .join("");

  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>`;
}

function renderCustomTypesManageStrip(config: ServiceRequestTypesConfig): string {
  const customs = config.types.filter(
    (t) => t.builtin === false || !isBuiltinServiceRequestTypeId(t.id),
  );

  if (customs.length === 0) {
    return `<div class="hidden" data-service-request-custom-types></div>`;
  }

  const chips = customs
    .map((entry) => {
      const label = entry.label.trim() || "未命名类型";
      return `
      <span class="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs text-foreground">
        <span>${escapeHtml(label)}</span>
        <button
          type="button"
          class="rounded px-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          data-service-request-type-remove="${escapeHtml(entry.id)}"
          aria-label="删除自定义类型 ${escapeHtml(label)}"
        >删除</button>
      </span>`;
    })
    .join("");

  return `
    <div class="flex flex-wrap items-center gap-2" data-service-request-custom-types>
      ${chips}
    </div>`;
}

function renderAddServiceRequestTypeDialog(): string {
  return `
    <div
      class="fixed inset-0 z-[110] hidden items-center justify-center p-4"
      data-service-request-type-add-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-request-type-add-dialog-title"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-service-request-type-add-dialog-backdrop aria-label="关闭"></button>
      <div class="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h3 id="service-request-type-add-dialog-title" class="text-base font-semibold text-card-foreground">新增服务类型</h3>
          <button type="button" class="text-muted-foreground hover:text-foreground" data-service-request-type-add-dialog-close aria-label="关闭">×</button>
        </div>
        <div class="space-y-1.5 px-5 py-4">
          <label class="block text-sm font-medium text-foreground" for="service-request-type-add-name">类型名称</label>
          <input
            id="service-request-type-add-name"
            type="text"
            class="${TEXT_INPUT_CLASS}"
            maxlength="40"
            placeholder="请输入服务类型名称"
            data-service-request-type-add-name
            autocomplete="off"
          />
          <p class="m-0 text-xs text-muted-foreground">新增后可在各产线中勾选是否启用；默认对全部产线开启。</p>
        </div>
        <div class="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
          <button type="button" class="${BTN_GHOST}" data-service-request-type-add-dialog-cancel>取消</button>
          <button type="button" class="${BTN_DIALOG_PRIMARY}" data-service-request-type-add-dialog-save>确定</button>
        </div>
      </div>
    </div>`;
}

function renderServiceRequestTypesByLineTable(config: ServiceRequestTypesConfig): string {
  const rows = TABLESIDE_SERVICE_CALL_PRODUCT_LINES.map(
    (line) => `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        ${renderServiceTypeCheckboxesForLine(line.id, line.label, config)}
      </td>
    </tr>`,
  ).join("");

  return `
    <div data-service-request-types-editor-table class="overflow-x-auto rounded-md border border-border">
      <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">请求服务类型（多选）</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function collectServiceRequestTypesFromEditor(editor: HTMLElement): ServiceRequestTypesConfig {
  const existing = readServiceRequestTypesConfig();
  const byId = new Map(
    existing.types.map((t) => [
      t.id,
      {
        ...t,
        lines: [] as TablesideServiceCallProductLineId[],
      },
    ]),
  );

  for (const opt of TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS) {
    if (!byId.has(opt.code)) {
      byId.set(opt.code, {
        id: opt.code,
        label: opt.label,
        builtin: true,
        lines: [],
      });
    }
  }

  editor
    .querySelectorAll<HTMLInputElement>(
      "[data-service-request-type-line][data-service-request-type-id]:checked",
    )
    .forEach((input) => {
      const typeId = input.getAttribute("data-service-request-type-id");
      const lineId = input.getAttribute(
        "data-service-request-type-line",
      ) as TablesideServiceCallProductLineId | null;
      if (!typeId || !lineId || !ALL_LINE_IDS.includes(lineId)) return;
      const entry = byId.get(typeId);
      if (!entry) return;
      if (!entry.lines.includes(lineId)) entry.lines.push(lineId);
    });

  return { types: mergeBuiltinTypes([...byId.values()]) };
}

function persistServiceRequestTypesEditor(editor: HTMLElement): void {
  writeServiceRequestTypesConfig(collectServiceRequestTypesFromEditor(editor));
}

function showAddTypeDialog(dialog: HTMLElement): void {
  dialog.classList.remove("hidden");
  dialog.classList.add("flex");
  const input = dialog.querySelector<HTMLInputElement>("[data-service-request-type-add-name]");
  if (input) {
    input.value = "";
    queueMicrotask(() => input.focus());
  }
}

function hideAddTypeDialog(dialog: HTMLElement): void {
  dialog.classList.add("hidden");
  dialog.classList.remove("flex");
  const input = dialog.querySelector<HTMLInputElement>("[data-service-request-type-add-name]");
  if (input) input.value = "";
}

function closeAddTypeDialog(host: HTMLElement): void {
  const dialog = host.querySelector<HTMLElement>("[data-service-request-type-add-dialog]");
  if (dialog) hideAddTypeDialog(dialog);
}

function rerenderServiceRequestTypesEditor(editor: HTMLElement): void {
  const parent = editor.parentElement;
  if (!parent) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = renderServiceRequestTypesEditorHtml().trim();
  const next = wrap.firstElementChild as HTMLElement | null;
  if (!next) return;
  editor.replaceWith(next);
  bindServiceRequestTypesEditor(next);
}

function saveAddTypeDialog(editor: HTMLElement): void {
  const dialog = editor.querySelector<HTMLElement>("[data-service-request-type-add-dialog]");
  const input = dialog?.querySelector<HTMLInputElement>("[data-service-request-type-add-name]");
  if (!dialog || !input) return;

  const label = input.value.trim();
  if (!label) {
    input.focus();
    input.classList.add("ring-2", "ring-destructive");
    return;
  }
  input.classList.remove("ring-2", "ring-destructive");

  const config = collectServiceRequestTypesFromEditor(editor);
  const duplicate = config.types.some(
    (t) => t.label.trim().toLowerCase() === label.toLowerCase(),
  );
  if (duplicate) {
    input.focus();
    input.classList.add("ring-2", "ring-destructive");
    return;
  }

  config.types.push({
    id: newCustomServiceRequestTypeId(),
    label,
    builtin: false,
    lines: [...ALL_LINE_IDS],
  });
  writeServiceRequestTypesConfig(config);
  hideAddTypeDialog(dialog);
  rerenderServiceRequestTypesEditor(editor);
}

export function isTablesideServiceCallMasterSeq(seq: number): boolean {
  return seq === TABLESIDE_SERVICE_CALL_MASTER_SEQ;
}

export function isTablesideServiceCallBeforeOrderSeq(seq: number): boolean {
  return seq === TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ;
}

export function isTablesideServiceCallCooldownSeq(seq: number): boolean {
  return seq === TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ;
}

export function isTablesideServiceRequestTypesSeq(seq: number): boolean {
  return seq === TABLESIDE_SERVICE_REQUEST_TYPES_SEQ;
}

export function isTablesideServiceCallToggleSeq(seq: number): boolean {
  return (TABLESIDE_SERVICE_CALL_TOGGLE_SEQS as readonly number[]).includes(seq);
}

function isTablesideServiceCallLinesSeq(
  seq: number,
): seq is typeof TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ {
  return seq === TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ;
}

function linesStorageId(seq: number): string | null {
  if (!isTablesideServiceCallLinesSeq(seq)) return null;
  return TABLESIDE_SERVICE_CALL_LINES_STORAGE_IDS[seq];
}

export function ensureTablesideServiceCallToggleMigrated(seq: number): void {
  if (toggleMigratedSeqs.has(seq)) return;
  toggleMigratedSeqs.add(seq);

  if (!isTablesideServiceCallLinesSeq(seq)) return;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) return;
  } catch {
    return;
  }
  if (readLegacyToggleOn(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), "1");
    } catch {
      /* ignore */
    }
  }
}

export function ensureTablesideServiceCallTogglesMigrated(): void {
  for (const seq of TABLESIDE_SERVICE_CALL_TOGGLE_SEQS) {
    ensureTablesideServiceCallToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): TablesideServiceCallProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is TablesideServiceCallProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readTablesideServiceCallLines(seq: number): TablesideServiceCallProductLineId[] {
  const storageId = linesStorageId(seq);
  if (!storageId) return [];
  ensureTablesideServiceCallToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(storageId, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writeTablesideServiceCallLines(seq, all);
    return all;
  }
  return [];
}

export function writeTablesideServiceCallLines(
  seq: number,
  lines: TablesideServiceCallProductLineId[],
): void {
  const storageId = linesStorageId(seq);
  if (!storageId) return;
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(storageId, unique);
}

/** 开启后默认全选适用产线（对齐选桌页面 107） */
export function ensureTablesideServiceCallLinesDefault(seq: number): void {
  if (!isTablesideServiceCallLinesSeq(seq)) return;
  if (readTablesideServiceCallLines(seq).length === 0) {
    writeTablesideServiceCallLines(seq, [...ALL_LINE_IDS]);
  }
}

function linesAriaLabel(_seq: number): string {
  return "未开单可呼叫服务员适用产线";
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readTablesideServiceCallLines(seq));
  const cells = TABLESIDE_SERVICE_CALL_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-tableside-service-call-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-sm overflow-hidden rounded-md border border-border bg-muted/40"
      data-tableside-service-call-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(linesAriaLabel(seq))}"
    >
      ${cells}
    </div>`;
}

export function renderTablesideServiceCallPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-tableside-service-call-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setTablesideServiceCallPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-tableside-service-call-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) {
        panel.removeAttribute("aria-hidden");
        ensureTablesideServiceCallLinesDefault(seq);
      } else {
        panel.setAttribute("aria-hidden", "true");
      }

      panel
        .querySelectorAll<HTMLInputElement>("[data-tableside-service-call-line]")
        .forEach((input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !visible);
          label.classList.toggle("opacity-50", !visible);
          label.classList.toggle("cursor-pointer", visible);
        });
    });
}

function collectLinesFromGroup(group: HTMLElement, seq: number): TablesideServiceCallProductLineId[] {
  const lines: TablesideServiceCallProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-tableside-service-call-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-tableside-service-call-line");
      if (id && ALL_LINE_IDS.includes(id as TablesideServiceCallProductLineId)) {
        lines.push(id as TablesideServiceCallProductLineId);
      }
    });
  writeTablesideServiceCallLines(seq, lines);
  return lines;
}

export function renderServiceRequestTypesEditorHtml(): string {
  ensureServiceRequestTypesMigrated();
  const config = readServiceRequestTypesConfig();
  return `
    <div class="mt-3 max-w-2xl space-y-3" data-service-request-types-editor>
      ${renderServiceRequestTypesByLineTable(config)}
      ${renderCustomTypesManageStrip(config)}
      <button
        type="button"
        class="${BTN_PRIMARY}"
        data-service-request-type-add
      >新增类型</button>
      ${renderAddServiceRequestTypeDialog()}
    </div>`;
}

/** @deprecated 使用 renderServiceRequestTypesEditorHtml */
export function renderServiceRequestTypesMultiselectHtml(): string {
  return renderServiceRequestTypesEditorHtml();
}

function bindOneServiceRequestTypesEditor(editor: HTMLElement): void {
  if (editor.dataset.serviceRequestTypesEditorBound === "1") return;
  editor.dataset.serviceRequestTypesEditorBound = "1";

  editor.addEventListener("change", (e) => {
    const el = e.target as HTMLElement;
    if (!el.matches("[data-service-request-type-id]")) return;
    persistServiceRequestTypesEditor(editor);
  });

  editor.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (!target.matches("[data-service-request-type-add-name]")) return;
    e.preventDefault();
    saveAddTypeDialog(editor);
  });

  editor.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("[data-service-request-type-add]")) {
      const dialog = editor.querySelector<HTMLElement>("[data-service-request-type-add-dialog]");
      if (dialog) showAddTypeDialog(dialog);
      return;
    }

    if (
      target.closest("[data-service-request-type-add-dialog-close]") ||
      target.closest("[data-service-request-type-add-dialog-cancel]") ||
      target.closest("[data-service-request-type-add-dialog-backdrop]")
    ) {
      closeAddTypeDialog(editor);
      return;
    }

    if (target.closest("[data-service-request-type-add-dialog-save]")) {
      saveAddTypeDialog(editor);
      return;
    }

    const removeBtn = target.closest<HTMLElement>("[data-service-request-type-remove]");
    if (removeBtn) {
      const typeId = removeBtn.getAttribute("data-service-request-type-remove");
      if (!typeId || isBuiltinServiceRequestTypeId(typeId)) return;
      const config = collectServiceRequestTypesFromEditor(editor);
      const entry = config.types.find((t) => t.id === typeId);
      const label = entry?.label.trim() || "该自定义类型";
      if (!window.confirm(`确定删除「${label}」？删除后各产线将不再展示该类型。`)) return;
      config.types = config.types.filter((t) => t.id !== typeId);
      writeServiceRequestTypesConfig(config);
      rerenderServiceRequestTypesEditor(editor);
    }
  });
}

export function bindServiceRequestTypesEditor(root: ParentNode = document): void {
  ensureServiceRequestTypesMigrated();
  if (root instanceof HTMLElement && root.matches("[data-service-request-types-editor]")) {
    bindOneServiceRequestTypesEditor(root);
  }
  root.querySelectorAll<HTMLElement>("[data-service-request-types-editor]").forEach((editor) => {
    bindOneServiceRequestTypesEditor(editor);
  });
}

export function bindTablesideServiceCallUi(root: ParentNode = document): void {
  ensureTablesideServiceCallTogglesMigrated();
  bindServiceRequestTypesEditor(root);
  bindServiceCallCooldownUi(root);
  root.querySelectorAll<HTMLElement>("[data-tableside-service-call-lines]").forEach((group) => {
    if (group.dataset.tablesideServiceCallBound === "1") return;
    group.dataset.tablesideServiceCallBound = "1";
    const seqRaw = group.getAttribute("data-tableside-service-call-lines");
    const seq = seqRaw ? Number(seqRaw) : NaN;
    if (!Number.isFinite(seq) || !isTablesideServiceCallLinesSeq(seq)) return;
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-tableside-service-call-line]")) return;
      collectLinesFromGroup(group, seq);
    });
  });
}

export function readServiceCallCooldownSeconds(): number {
  const config = readServiceCallCooldownByLine();
  const firstEnabled = SERVICE_CALL_COOLDOWN_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) return config[firstEnabled.id].seconds;
  return clampCooldownSeconds(
    readModuleSettingNumber(TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID, COOLDOWN_DEFAULT),
  );
}

function clampCooldownSeconds(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return COOLDOWN_DEFAULT;
  return Math.min(COOLDOWN_MAX, Math.max(COOLDOWN_MIN, Math.round(n)));
}

function defaultCooldownLineConfig(enabled: boolean): ServiceCallCooldownLineConfig {
  return { enabled, seconds: COOLDOWN_DEFAULT };
}

function defaultCooldownByLineConfig(): Record<
  ServiceCallCooldownProductLineId,
  ServiceCallCooldownLineConfig
> {
  return Object.fromEntries(
    SERVICE_CALL_COOLDOWN_PRODUCT_LINES.map((line) => [line.id, defaultCooldownLineConfig(true)]),
  ) as Record<ServiceCallCooldownProductLineId, ServiceCallCooldownLineConfig>;
}

function normalizeCooldownByLineConfig(
  raw: Partial<Record<string, Partial<ServiceCallCooldownLineConfig>>>,
): Record<ServiceCallCooldownProductLineId, ServiceCallCooldownLineConfig> {
  const base = defaultCooldownByLineConfig();
  for (const line of SERVICE_CALL_COOLDOWN_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      seconds: clampCooldownSeconds(item.seconds ?? base[line.id].seconds),
    };
  }
  return base;
}

function syncCooldownLegacyFields(
  config: Record<ServiceCallCooldownProductLineId, ServiceCallCooldownLineConfig>,
): void {
  const enabledLines = COOLDOWN_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(COOLDOWN_LINES_STORAGE_ID, enabledLines);
  const firstEnabled = SERVICE_CALL_COOLDOWN_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID, config[firstEnabled.id].seconds);
  }
  try {
    localStorage.setItem(
      moduleSettingToggleStorageKey(TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ),
      enabledLines.length > 0 ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

function ensureServiceCallCooldownByLineMigrated(): void {
  if (cooldownByLineMigrated) return;
  cooldownByLineMigrated = true;

  const raw = readModuleSettingJson<Partial<Record<string, Partial<ServiceCallCooldownLineConfig>>>>(
    SERVICE_CALL_COOLDOWN_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeServiceCallCooldownByLine(normalizeCooldownByLineConfig(raw));
    return;
  }

  const hasLegacySeconds = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID)) !== null;
    } catch {
      return false;
    }
  })();
  const hasLegacyLines = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(COOLDOWN_LINES_STORAGE_ID)) !== null;
    } catch {
      return false;
    }
  })();
  const toggleOn = readLegacyToggleOn(TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ);

  if (!hasLegacySeconds && !hasLegacyLines && !toggleOn) {
    writeServiceCallCooldownByLine(defaultCooldownByLineConfig());
    return;
  }

  const secondsLegacy = clampCooldownSeconds(
    readModuleSettingNumber(TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID, COOLDOWN_DEFAULT),
  );
  const linesRaw = readModuleSettingJson<unknown>(COOLDOWN_LINES_STORAGE_ID, null);
  const normalizedLines = Array.isArray(linesRaw)
    ? linesRaw.filter(
        (id): id is ServiceCallCooldownProductLineId =>
          typeof id === "string" && COOLDOWN_LINE_IDS.includes(id as ServiceCallCooldownProductLineId),
      )
    : [];
  const linesLegacy =
    normalizedLines.length > 0
      ? normalizedLines
      : toggleOn || hasLegacySeconds
        ? ([...COOLDOWN_LINE_IDS] as ServiceCallCooldownProductLineId[])
        : [];
  const selected = new Set(linesLegacy);

  const config = defaultCooldownByLineConfig();
  for (const line of SERVICE_CALL_COOLDOWN_PRODUCT_LINES) {
    config[line.id] = selected.has(line.id)
      ? { enabled: true, seconds: secondsLegacy }
      : { enabled: false, seconds: COOLDOWN_DEFAULT };
  }
  writeServiceCallCooldownByLine(config);
}

export function readServiceCallCooldownByLine(): Record<
  ServiceCallCooldownProductLineId,
  ServiceCallCooldownLineConfig
> {
  ensureServiceCallCooldownByLineMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<ServiceCallCooldownLineConfig>>>>(
    SERVICE_CALL_COOLDOWN_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeCooldownByLineConfig(raw);
  }
  return defaultCooldownByLineConfig();
}

export function writeServiceCallCooldownByLine(
  config: Record<ServiceCallCooldownProductLineId, ServiceCallCooldownLineConfig>,
): void {
  const normalized = normalizeCooldownByLineConfig(config);
  writeModuleSettingJson(SERVICE_CALL_COOLDOWN_BY_LINE_FIELD_ID, normalized);
  syncCooldownLegacyFields(normalized);
}

/** FOH 写 lines 后回写 by-line.enabled */
export function syncServiceCallCooldownEnabledFromLines(lines: readonly string[]): void {
  ensureServiceCallCooldownByLineMigrated();
  const config = readServiceCallCooldownByLine();
  const selected = new Set(
    lines.filter((id): id is ServiceCallCooldownProductLineId =>
      COOLDOWN_LINE_IDS.includes(id as ServiceCallCooldownProductLineId),
    ),
  );
  for (const id of COOLDOWN_LINE_IDS) {
    config[id] = {
      ...config[id],
      enabled: selected.has(id),
    };
  }
  writeServiceCallCooldownByLine(config);
}

function syncCooldownInputDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-service-call-cooldown-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-service-call-cooldown-line-enabled");
    if (!lineId) return;
    const input = editor.querySelector<HTMLInputElement>(
      `[data-service-call-cooldown-line-seconds="${lineId}"]`,
    );
    if (!input) return;
    input.disabled = !checkbox.checked;
  });
}

function collectCooldownFromEditor(editor: HTMLElement): void {
  const config = readServiceCallCooldownByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-service-call-cooldown-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-service-call-cooldown-line-enabled");
    if (!lineId || !COOLDOWN_LINE_IDS.includes(lineId as ServiceCallCooldownProductLineId)) return;
    config[lineId as ServiceCallCooldownProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-service-call-cooldown-line-seconds]").forEach((input) => {
    const lineId = input.getAttribute("data-service-call-cooldown-line-seconds");
    if (!lineId || !COOLDOWN_LINE_IDS.includes(lineId as ServiceCallCooldownProductLineId)) return;
    config[lineId as ServiceCallCooldownProductLineId].seconds = clampCooldownSeconds(input.value);
  });
  writeServiceCallCooldownByLine(config);
  syncCooldownInputDisabled(editor);
}

function renderCooldownByLineEditorHtml(): string {
  const config = readServiceCallCooldownByLine();
  const rows = SERVICE_CALL_COOLDOWN_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-middle">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-service-call-cooldown-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用呼叫服务员时间间隔"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputmode="numeric"
            class="${COOLDOWN_NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.seconds))}"
            min="${COOLDOWN_MIN}"
            max="${COOLDOWN_MAX}"
            step="1"
            data-service-call-cooldown-line-seconds="${escapeHtml(line.id)}"
            ${item.enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 呼叫服务员时间间隔"
          />
          <span class="text-xs text-muted-foreground">秒（${COOLDOWN_MIN}–${COOLDOWN_MAX}，0 不限制）</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-service-call-cooldown-by-line-editor="${TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">时间间隔</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderServiceCallCooldownPanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-service-call-cooldown-panel="${TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ}">
      ${renderCooldownByLineEditorHtml()}
    </div>`;
}

export function bindServiceCallCooldownUi(root: ParentNode = document): void {
  ensureServiceCallCooldownByLineMigrated();
  root.querySelectorAll<HTMLElement>("[data-service-call-cooldown-by-line-editor]").forEach((editor) => {
    if (editor.dataset.serviceCallCooldownByLineEditorBound === "1") return;
    editor.dataset.serviceCallCooldownByLineEditorBound = "1";

    syncCooldownInputDisabled(editor);

    const persist = () => collectCooldownFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-service-call-cooldown-line-enabled]") ||
        target.matches("[data-service-call-cooldown-line-seconds]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-service-call-cooldown-line-seconds]")) persist();
    });
  });
}

/** @deprecated 已改为按产线表格；保留空实现避免旧调用报错 */
export function renderServiceCallCooldownControl(_enabled = true): string {
  return renderCooldownByLineEditorHtml();
}

/** @deprecated 无总开关后不再需要 */
export function setServiceCallCooldownPanelVisible(_visible: boolean): void {
  /* no-op */
}

