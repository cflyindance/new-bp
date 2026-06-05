/**
 * 前厅 · 桌边·呼叫服务员（方案 A：333 服务类型 SSOT；630–636 已迁并废弃）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  moduleSettingStorageKey,
  readModuleSettingCheckbox,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { newRuleId } from "./module-settings-dish-rules-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const TABLESIDE_SERVICE_CALL_MASTER_SEQ = 629;
export const TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ = 641;
export const TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ = 640;
export const TABLESIDE_SERVICE_REQUEST_TYPES_SEQ = 333;

/** 原 seq 630–636 对应能力，迁并至 333 */
export const TABLESIDE_SERVICE_REQUEST_TYPE_OPTIONS = [
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
  TABLESIDE_SERVICE_CALL_MASTER_SEQ,
  TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ,
  TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ,
];

export const TABLESIDE_SERVICE_CALL_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type TablesideServiceCallProductLineId =
  (typeof TABLESIDE_SERVICE_CALL_PRODUCT_LINES)[number]["id"];

const TABLESIDE_SERVICE_CALL_LINES_STORAGE_IDS: Record<
  typeof TABLESIDE_SERVICE_CALL_MASTER_SEQ | typeof TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ,
  string
> = {
  [TABLESIDE_SERVICE_CALL_MASTER_SEQ]: "629-tableside-service-call-lines",
  [TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ]: "641-tableside-service-call-before-order-lines",
};

const ALL_LINE_IDS: TablesideServiceCallProductLineId[] =
  TABLESIDE_SERVICE_CALL_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const toggleMigratedSeqs = new Set<number>();

export const TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID = "640-service-call-cooldown-seconds";

const COOLDOWN_DEFAULT = 60;
const COOLDOWN_MIN = 0;
const COOLDOWN_MAX = 600;

const SERVICE_REQUEST_TYPES_STORAGE_ID = "333-service-request-types-config";

const TEXT_INPUT_CLASS =
  "h-8 w-full min-w-[6rem] rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

/** @deprecated 仅用于迁移旧版 checkbox 存储 */
export function serviceRequestTypeCheckboxFieldId(code: string): string {
  return `333-service-request-type-${code}`;
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
  if (normalizeConfig(stored)) return;

  const legacy = readLegacyCheckboxEnabledMap();
  const types = defaultBuiltinTypeEntries().map((entry) => ({
    ...entry,
    lines: legacy[entry.id as TablesideServiceRequestTypeCode]
      ? ([...ALL_LINE_IDS] as TablesideServiceCallProductLineId[])
      : [],
  }));
  writeServiceRequestTypesConfig({ types });
}

export function readServiceRequestTypesConfig(): ServiceRequestTypesConfig {
  ensureServiceRequestTypesMigrated();
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

function newCustomServiceRequestTypeId(): string {
  return `custom-${newRuleId()}`;
}

function isTypeOnLine(
  config: ServiceRequestTypesConfig,
  typeId: string,
  lineId: TablesideServiceCallProductLineId,
): boolean {
  const entry = config.types.find((t) => t.id === typeId);
  return Boolean(entry?.lines.includes(lineId));
}

function renderTypeLineCheckboxes(typeId: string, config: ServiceRequestTypesConfig): string {
  return TABLESIDE_SERVICE_CALL_PRODUCT_LINES.map((line) => {
    const checked = isTypeOnLine(config, typeId, line.id);
    return `
      <td class="border-t border-border px-2 py-2 text-center align-middle">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-service-request-type-id="${escapeHtml(typeId)}"
          data-service-request-type-line="${escapeHtml(line.id)}"
          aria-label="${escapeHtml(line.label)}"
        />
      </td>`;
  }).join("");
}

function renderServiceRequestTypesTable(config: ServiceRequestTypesConfig): string {
  const headerCells = TABLESIDE_SERVICE_CALL_PRODUCT_LINES.map(
    (line) =>
      `<th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">${escapeHtml(line.label)}</th>`,
  ).join("");

  const rows = config.types
    .map((entry) => {
      const nameCell = entry.builtin
        ? `<span class="text-sm font-medium text-foreground">${escapeHtml(entry.label)}</span>`
        : `<input
            type="text"
            class="${TEXT_INPUT_CLASS}"
            value="${escapeHtml(entry.label)}"
            placeholder="服务类型名称"
            data-service-request-type-name
            data-service-request-type-id="${escapeHtml(entry.id)}"
          />`;
      const actionCell = entry.builtin
        ? `<td class="border-t border-border px-2 py-2 text-center text-muted-foreground">—</td>`
        : `<td class="border-t border-border px-2 py-2 text-right align-middle">
            <button type="button" class="text-sm text-destructive hover:underline" data-service-request-type-remove>删除</button>
          </td>`;

      return `
      <tr
        data-service-request-type-row
        data-service-request-type-id="${escapeHtml(entry.id)}"
        ${entry.builtin ? "" : "data-service-request-type-custom"}
      >
        <th scope="row" class="border-t border-border px-3 py-2.5 text-left align-middle font-normal">${nameCell}</th>
        ${renderTypeLineCheckboxes(entry.id, config)}
        ${actionCell}
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-md border border-border" data-service-request-types-matrix>
      <table class="w-full min-w-[20rem] border-collapse text-sm">
        <thead>
          <tr class="bg-muted/50">
            <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">服务类型</th>
            ${headerCells}
            <th scope="col" class="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-14">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function collectServiceRequestTypesFromEditor(editor: HTMLElement): ServiceRequestTypesConfig {
  const config = readServiceRequestTypesConfig();
  const byId = new Map(config.types.map((t) => [t.id, { ...t, lines: [] as TablesideServiceCallProductLineId[] }]));

  editor
    .querySelectorAll<HTMLInputElement>(
      "[data-service-request-type-line][data-service-request-type-id]:checked",
    )
    .forEach((input) => {
      const typeId = input.getAttribute("data-service-request-type-id");
      const lineId = input.getAttribute("data-service-request-type-line");
      if (!typeId || !lineId || !ALL_LINE_IDS.includes(lineId as TablesideServiceCallProductLineId)) {
        return;
      }
      const entry = byId.get(typeId);
      if (!entry) return;
      if (!entry.lines.includes(lineId as TablesideServiceCallProductLineId)) {
        entry.lines.push(lineId as TablesideServiceCallProductLineId);
      }
    });

  editor.querySelectorAll<HTMLElement>("[data-service-request-type-custom]").forEach((row) => {
    const typeId = row.getAttribute("data-service-request-type-id");
    if (!typeId) return;
    const entry = byId.get(typeId);
    if (!entry) return;
    const name = row.querySelector<HTMLInputElement>("[data-service-request-type-name]")?.value.trim();
    if (name) entry.label = name;
  });

  return { types: mergeBuiltinTypes([...byId.values()]) };
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

function persistServiceRequestTypesEditor(editor: HTMLElement): void {
  writeServiceRequestTypesConfig(collectServiceRequestTypesFromEditor(editor));
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
): seq is typeof TABLESIDE_SERVICE_CALL_MASTER_SEQ | typeof TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ {
  return seq === TABLESIDE_SERVICE_CALL_MASTER_SEQ || seq === TABLESIDE_SERVICE_CALL_BEFORE_ORDER_SEQ;
}

function linesStorageId(seq: number): string | null {
  if (!isTablesideServiceCallLinesSeq(seq)) return null;
  return TABLESIDE_SERVICE_CALL_LINES_STORAGE_IDS[seq];
}

function hasStoredServiceCallCooldownSeconds(): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID)) !== null;
  } catch {
    return false;
  }
}

export function ensureTablesideServiceCallToggleMigrated(seq: number): void {
  if (toggleMigratedSeqs.has(seq)) return;
  toggleMigratedSeqs.add(seq);

  if (seq === TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ) {
    try {
      if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) return;
    } catch {
      return;
    }
    const shouldOn = hasStoredServiceCallCooldownSeconds() || readLegacyToggleOn(seq);
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), shouldOn ? "1" : "0");
    } catch {
      /* ignore */
    }
    return;
  }

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

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readTablesideServiceCallLines(seq));
  const cells = TABLESIDE_SERVICE_CALL_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
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
      aria-label="呼叫服务员适用产线"
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
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setTablesideServiceCallPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-tableside-service-call-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

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
    <div class="space-y-3" data-service-request-types-editor>
      ${renderServiceRequestTypesTable(config)}
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
        data-service-request-type-add
      >新增类型</button>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        每种类型可独立勾选适用产线（eMenu、SDI）；未勾选任何产线的类型对客人不可见。员工端提醒请在消息中心勾选主题「Service Request」；原 seq 630–636 已合并至本项。
      </p>
    </div>`;
}

/** @deprecated 使用 renderServiceRequestTypesEditorHtml */
export function renderServiceRequestTypesMultiselectHtml(): string {
  return renderServiceRequestTypesEditorHtml();
}

export function bindServiceRequestTypesEditor(root: ParentNode = document): void {
  ensureServiceRequestTypesMigrated();
  root.querySelectorAll<HTMLElement>("[data-service-request-types-editor]").forEach((editor) => {
    if (editor.dataset.serviceRequestTypesEditorBound === "1") return;
    editor.dataset.serviceRequestTypesEditorBound = "1";

    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-service-request-type-line]")) {
        persistServiceRequestTypesEditor(editor);
      }
    });

    editor.addEventListener("input", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-service-request-type-name]")) {
        persistServiceRequestTypesEditor(editor);
      }
    });

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-service-request-type-add]")) {
        const config = collectServiceRequestTypesFromEditor(editor);
        const id = newCustomServiceRequestTypeId();
        config.types.push({
          id,
          label: "",
          builtin: false,
          lines: [...ALL_LINE_IDS],
        });
        writeServiceRequestTypesConfig(config);
        rerenderServiceRequestTypesEditor(editor);
        return;
      }
      const removeBtn = target.closest("[data-service-request-type-remove]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-service-request-type-custom]");
        const typeId = row?.getAttribute("data-service-request-type-id");
        if (!typeId) return;
        const config = collectServiceRequestTypesFromEditor(editor);
        config.types = config.types.filter((t) => t.id !== typeId);
        writeServiceRequestTypesConfig(config);
        rerenderServiceRequestTypesEditor(editor);
      }
    });
  });
}

export function bindTablesideServiceCallUi(root: ParentNode = document): void {
  ensureTablesideServiceCallTogglesMigrated();
  bindServiceRequestTypesEditor(root);
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
  let stored = readModuleSettingNumber(TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID, COOLDOWN_DEFAULT);
  if (!Number.isFinite(stored) && readLegacyToggleOn(TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ)) {
    stored = COOLDOWN_DEFAULT;
  }
  if (!Number.isFinite(stored)) return COOLDOWN_DEFAULT;
  return Math.min(COOLDOWN_MAX, Math.max(COOLDOWN_MIN, Math.round(stored)));
}

export function renderServiceCallCooldownControl(enabled = true): string {
  const value = readServiceCallCooldownSeconds();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted-foreground">最小间隔</span>
      <input
        type="number"
        inputmode="numeric"
        class="${NUMBER_INPUT_CLASS}"
        value="${escapeHtml(String(value))}"
        min="${COOLDOWN_MIN}"
        max="${COOLDOWN_MAX}"
        step="1"
        data-module-setting-number="${escapeHtml(TABLESIDE_SERVICE_CALL_COOLDOWN_FIELD_ID)}"
        ${enabled ? "" : "disabled"}
        aria-label="呼叫服务员重复间隔"
      />
      <span class="text-sm text-muted-foreground">秒</span>
      <span class="text-xs text-muted-foreground">（${COOLDOWN_MIN}–${COOLDOWN_MAX}，0 表示不限制）</span>
    </div>`;
}

export function renderServiceCallCooldownPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-service-call-cooldown-panel="${TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">时间间隔</p>
      ${renderServiceCallCooldownControl(on)}
    </div>`;
}

export function setServiceCallCooldownPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(
      `[data-service-call-cooldown-panel="${TABLESIDE_SERVICE_CALL_COOLDOWN_SEQ}"]`,
    )
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-module-setting-number]").forEach((input) => {
        input.disabled = !visible;
      });
    });
}

