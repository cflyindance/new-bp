/**
 * 前厅 · 排队与等待展示（673 全局计算 + 535–540）：
 * — 535 展示当前订单预计等待时长：产线 | 启用 | 功能时间设置
 * — 536 预计等待时长区间设置：产线 | 启用 | 功能时间设置（对齐 535）
 * — 537–540 样式：产线 | 功能设置（无启用列，见 wait-time-style-ui）
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";
import {
  ensureWaitTimeStyleMigrated,
  isWaitTimeDisplayStyleSeq,
  readWaitTimeStyleEnabledLines,
  syncWaitTimeStyleEnabledFromLines,
} from "./module-settings-wait-time-style-ui";

export const WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ = 535;
export const WAIT_TIME_DISPLAY_RANGE_SEQ = 536;

/** @deprecated 请用 isWaitTimeDisplayStyleSeq；保留别名供旧调用 */
export {
  WAIT_TIME_DISPLAY_STYLE_SEQS as WAIT_TIME_DISPLAY_FORM_SEQS,
  type WaitTimeDisplayStyleSeq as WaitTimeDisplayFormSeq,
} from "./module-settings-wait-time-style-ui";

/** @deprecated 535/536 已改为按产线表格，不再使用总开关 */
export const WAIT_TIME_DISPLAY_TOGGLE_SEQS = [] as const;

export const WAIT_TIME_DISPLAY_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
] as const;

export type WaitTimeDisplayProductLineId =
  (typeof WAIT_TIME_DISPLAY_PRODUCT_LINES)[number]["id"];

export type WaitTimeDisplayCurrentOrderLineConfig = {
  enabled: boolean;
  autoCloseMinutes: number;
  menuPopupMinutes: number;
};

export type WaitTimeDisplayRangeLineConfig = {
  enabled: boolean;
  cupsThreshold: number;
  minutesThreshold: number;
  rangeStartMinus: number;
  rangeEndPlus: number;
};

const ALL_LINE_IDS: WaitTimeDisplayProductLineId[] =
  WAIT_TIME_DISPLAY_PRODUCT_LINES.map((l) => l.id);

const CURRENT_ORDER_BY_LINE_FIELD_ID = "535-wait-time-display-by-line";
const CURRENT_ORDER_LINES_STORAGE_ID = "535-wait-time-display-lines";
const LEGACY_AUTO_CLOSE_FIELD_ID = "535-auto-close-minutes";
const LEGACY_MENU_POPUP_FIELD_ID = "535-menu-popup-minutes";

const RANGE_BY_LINE_FIELD_ID = "536-wait-time-display-by-line";
const RANGE_LINES_STORAGE_ID = "536-wait-time-display-lines";
const LEGACY_CUPS_THRESHOLD_FIELD_ID = "536-cups-threshold";
const LEGACY_MINUTES_THRESHOLD_FIELD_ID = "536-minutes-threshold";
const LEGACY_RANGE_START_MINUS_FIELD_ID = "536-range-start-minus";
const LEGACY_RANGE_END_PLUS_FIELD_ID = "536-range-end-plus";

const AUTO_CLOSE_DEFAULT = 30;
const MENU_POPUP_DEFAULT = 10;
const CUPS_THRESHOLD_DEFAULT = 10;
const MINUTES_THRESHOLD_DEFAULT = 10;
const RANGE_START_MINUS_DEFAULT = 2;
const RANGE_END_PLUS_DEFAULT = 2;
const NUMBER_MIN = 0;
const NUMBER_MAX = 999;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NUMBER_INPUT_CLASS =
  "h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let currentOrderByLineMigrated = false;
let rangeByLineMigrated = false;

function linesStorageId(seq: number): string {
  return `${seq}-wait-time-display-lines`;
}

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

function clampNumber(raw: unknown, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(NUMBER_MAX, Math.max(NUMBER_MIN, Math.round(n)));
}

function normalizeLineIds(raw: unknown): WaitTimeDisplayProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return ALL_LINE_IDS.filter((id) => raw.includes(id) && valid.has(id));
}

function hasStorageKey(fieldId: string): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(fieldId)) !== null;
  } catch {
    return false;
  }
}

function syncToggleFromEnabledLines(seq: number, enabledLines: readonly string[]): void {
  try {
    localStorage.setItem(
      moduleSettingToggleStorageKey(seq),
      enabledLines.length > 0 ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

/* ───────── 535 当前订单预计等待时长 ───────── */

function defaultCurrentOrderLineConfig(enabled: boolean): WaitTimeDisplayCurrentOrderLineConfig {
  return {
    enabled,
    autoCloseMinutes: AUTO_CLOSE_DEFAULT,
    menuPopupMinutes: MENU_POPUP_DEFAULT,
  };
}

function defaultCurrentOrderByLineConfig(): Record<
  WaitTimeDisplayProductLineId,
  WaitTimeDisplayCurrentOrderLineConfig
> {
  return Object.fromEntries(
    WAIT_TIME_DISPLAY_PRODUCT_LINES.map((line) => [line.id, defaultCurrentOrderLineConfig(true)]),
  ) as Record<WaitTimeDisplayProductLineId, WaitTimeDisplayCurrentOrderLineConfig>;
}

function normalizeCurrentOrderByLineConfig(
  raw: Partial<Record<string, Partial<WaitTimeDisplayCurrentOrderLineConfig>>>,
): Record<WaitTimeDisplayProductLineId, WaitTimeDisplayCurrentOrderLineConfig> {
  const base = defaultCurrentOrderByLineConfig();
  for (const line of WAIT_TIME_DISPLAY_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      autoCloseMinutes: clampNumber(
        item.autoCloseMinutes ?? base[line.id].autoCloseMinutes,
        AUTO_CLOSE_DEFAULT,
      ),
      menuPopupMinutes: clampNumber(
        item.menuPopupMinutes ?? base[line.id].menuPopupMinutes,
        MENU_POPUP_DEFAULT,
      ),
    };
  }
  return base;
}

function syncCurrentOrderLegacyFields(
  config: Record<WaitTimeDisplayProductLineId, WaitTimeDisplayCurrentOrderLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(CURRENT_ORDER_LINES_STORAGE_ID, enabledLines);
  const firstEnabled = WAIT_TIME_DISPLAY_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(
      LEGACY_AUTO_CLOSE_FIELD_ID,
      config[firstEnabled.id].autoCloseMinutes,
    );
    writeModuleSettingNumber(
      LEGACY_MENU_POPUP_FIELD_ID,
      config[firstEnabled.id].menuPopupMinutes,
    );
  }
  syncToggleFromEnabledLines(WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ, enabledLines);
}

export function ensureWaitTimeDisplayCurrentOrderMigrated(): void {
  if (currentOrderByLineMigrated) return;
  currentOrderByLineMigrated = true;

  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<WaitTimeDisplayCurrentOrderLineConfig>>>
  >(CURRENT_ORDER_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeWaitTimeDisplayCurrentOrderByLine(normalizeCurrentOrderByLineConfig(raw));
    return;
  }

  const toggleOn = readLegacyToggleOn(WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ);
  const hasLegacy =
    hasStorageKey(LEGACY_AUTO_CLOSE_FIELD_ID) ||
    hasStorageKey(LEGACY_MENU_POPUP_FIELD_ID) ||
    hasStorageKey(CURRENT_ORDER_LINES_STORAGE_ID) ||
    toggleOn;

  if (!hasLegacy) {
    writeWaitTimeDisplayCurrentOrderByLine(defaultCurrentOrderByLineConfig());
    return;
  }

  const autoClose = clampNumber(
    readModuleSettingNumber(LEGACY_AUTO_CLOSE_FIELD_ID, AUTO_CLOSE_DEFAULT),
    AUTO_CLOSE_DEFAULT,
  );
  const menuPopup = clampNumber(
    readModuleSettingNumber(LEGACY_MENU_POPUP_FIELD_ID, MENU_POPUP_DEFAULT),
    MENU_POPUP_DEFAULT,
  );
  const normalizedLines = normalizeLineIds(
    readModuleSettingJson<unknown>(CURRENT_ORDER_LINES_STORAGE_ID, null),
  );
  const linesLegacy =
    normalizedLines.length > 0
      ? normalizedLines
      : toggleOn
        ? ([...ALL_LINE_IDS] as WaitTimeDisplayProductLineId[])
        : [];
  const selected = new Set(linesLegacy);

  const config = defaultCurrentOrderByLineConfig();
  for (const line of WAIT_TIME_DISPLAY_PRODUCT_LINES) {
    config[line.id] = {
      enabled: selected.has(line.id),
      autoCloseMinutes: autoClose,
      menuPopupMinutes: menuPopup,
    };
  }
  writeWaitTimeDisplayCurrentOrderByLine(config);
}

export function readWaitTimeDisplayCurrentOrderByLine(): Record<
  WaitTimeDisplayProductLineId,
  WaitTimeDisplayCurrentOrderLineConfig
> {
  ensureWaitTimeDisplayCurrentOrderMigrated();
  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<WaitTimeDisplayCurrentOrderLineConfig>>>
  >(CURRENT_ORDER_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeCurrentOrderByLineConfig(raw);
  }
  return defaultCurrentOrderByLineConfig();
}

export function writeWaitTimeDisplayCurrentOrderByLine(
  config: Record<WaitTimeDisplayProductLineId, WaitTimeDisplayCurrentOrderLineConfig>,
): void {
  const normalized = normalizeCurrentOrderByLineConfig(config);
  writeModuleSettingJson(CURRENT_ORDER_BY_LINE_FIELD_ID, normalized);
  syncCurrentOrderLegacyFields(normalized);
}

export function syncWaitTimeDisplayCurrentOrderEnabledFromLines(
  lines: readonly string[],
): void {
  ensureWaitTimeDisplayCurrentOrderMigrated();
  const config = readWaitTimeDisplayCurrentOrderByLine();
  const selected = new Set(
    lines.filter((id): id is WaitTimeDisplayProductLineId =>
      ALL_LINE_IDS.includes(id as WaitTimeDisplayProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeWaitTimeDisplayCurrentOrderByLine(config);
}

/* ───────── 536 预计等待时长区间设置 ───────── */

function defaultRangeLineConfig(enabled: boolean): WaitTimeDisplayRangeLineConfig {
  return {
    enabled,
    cupsThreshold: CUPS_THRESHOLD_DEFAULT,
    minutesThreshold: MINUTES_THRESHOLD_DEFAULT,
    rangeStartMinus: RANGE_START_MINUS_DEFAULT,
    rangeEndPlus: RANGE_END_PLUS_DEFAULT,
  };
}

function defaultRangeByLineConfig(): Record<
  WaitTimeDisplayProductLineId,
  WaitTimeDisplayRangeLineConfig
> {
  return Object.fromEntries(
    WAIT_TIME_DISPLAY_PRODUCT_LINES.map((line) => [line.id, defaultRangeLineConfig(true)]),
  ) as Record<WaitTimeDisplayProductLineId, WaitTimeDisplayRangeLineConfig>;
}

function normalizeRangeByLineConfig(
  raw: Partial<Record<string, Partial<WaitTimeDisplayRangeLineConfig>>>,
): Record<WaitTimeDisplayProductLineId, WaitTimeDisplayRangeLineConfig> {
  const base = defaultRangeByLineConfig();
  for (const line of WAIT_TIME_DISPLAY_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      cupsThreshold: clampNumber(
        item.cupsThreshold ?? base[line.id].cupsThreshold,
        CUPS_THRESHOLD_DEFAULT,
      ),
      minutesThreshold: clampNumber(
        item.minutesThreshold ?? base[line.id].minutesThreshold,
        MINUTES_THRESHOLD_DEFAULT,
      ),
      rangeStartMinus: clampNumber(
        item.rangeStartMinus ?? base[line.id].rangeStartMinus,
        RANGE_START_MINUS_DEFAULT,
      ),
      rangeEndPlus: clampNumber(
        item.rangeEndPlus ?? base[line.id].rangeEndPlus,
        RANGE_END_PLUS_DEFAULT,
      ),
    };
  }
  return base;
}

function syncRangeLegacyFields(
  config: Record<WaitTimeDisplayProductLineId, WaitTimeDisplayRangeLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(RANGE_LINES_STORAGE_ID, enabledLines);
  const firstEnabled = WAIT_TIME_DISPLAY_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    const item = config[firstEnabled.id];
    writeModuleSettingNumber(LEGACY_CUPS_THRESHOLD_FIELD_ID, item.cupsThreshold);
    writeModuleSettingNumber(LEGACY_MINUTES_THRESHOLD_FIELD_ID, item.minutesThreshold);
    writeModuleSettingNumber(LEGACY_RANGE_START_MINUS_FIELD_ID, item.rangeStartMinus);
    writeModuleSettingNumber(LEGACY_RANGE_END_PLUS_FIELD_ID, item.rangeEndPlus);
  }
  syncToggleFromEnabledLines(WAIT_TIME_DISPLAY_RANGE_SEQ, enabledLines);
}

export function ensureWaitTimeDisplayRangeMigrated(): void {
  if (rangeByLineMigrated) return;
  rangeByLineMigrated = true;

  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<WaitTimeDisplayRangeLineConfig>>>
  >(RANGE_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeWaitTimeDisplayRangeByLine(normalizeRangeByLineConfig(raw));
    return;
  }

  const toggleOn = readLegacyToggleOn(WAIT_TIME_DISPLAY_RANGE_SEQ);
  const hasLegacy =
    hasStorageKey(LEGACY_CUPS_THRESHOLD_FIELD_ID) ||
    hasStorageKey(LEGACY_MINUTES_THRESHOLD_FIELD_ID) ||
    hasStorageKey(LEGACY_RANGE_START_MINUS_FIELD_ID) ||
    hasStorageKey(LEGACY_RANGE_END_PLUS_FIELD_ID) ||
    hasStorageKey(RANGE_LINES_STORAGE_ID) ||
    toggleOn;

  if (!hasLegacy) {
    writeWaitTimeDisplayRangeByLine(defaultRangeByLineConfig());
    return;
  }

  const cupsThreshold = clampNumber(
    readModuleSettingNumber(LEGACY_CUPS_THRESHOLD_FIELD_ID, CUPS_THRESHOLD_DEFAULT),
    CUPS_THRESHOLD_DEFAULT,
  );
  const minutesThreshold = clampNumber(
    readModuleSettingNumber(LEGACY_MINUTES_THRESHOLD_FIELD_ID, MINUTES_THRESHOLD_DEFAULT),
    MINUTES_THRESHOLD_DEFAULT,
  );
  const rangeStartMinus = clampNumber(
    readModuleSettingNumber(LEGACY_RANGE_START_MINUS_FIELD_ID, RANGE_START_MINUS_DEFAULT),
    RANGE_START_MINUS_DEFAULT,
  );
  const rangeEndPlus = clampNumber(
    readModuleSettingNumber(LEGACY_RANGE_END_PLUS_FIELD_ID, RANGE_END_PLUS_DEFAULT),
    RANGE_END_PLUS_DEFAULT,
  );
  const normalizedLines = normalizeLineIds(
    readModuleSettingJson<unknown>(RANGE_LINES_STORAGE_ID, null),
  );
  const linesLegacy =
    normalizedLines.length > 0
      ? normalizedLines
      : toggleOn
        ? ([...ALL_LINE_IDS] as WaitTimeDisplayProductLineId[])
        : [];
  const selected = new Set(linesLegacy);

  const config = defaultRangeByLineConfig();
  for (const line of WAIT_TIME_DISPLAY_PRODUCT_LINES) {
    config[line.id] = {
      enabled: selected.has(line.id),
      cupsThreshold,
      minutesThreshold,
      rangeStartMinus,
      rangeEndPlus,
    };
  }
  writeWaitTimeDisplayRangeByLine(config);
}

export function readWaitTimeDisplayRangeByLine(): Record<
  WaitTimeDisplayProductLineId,
  WaitTimeDisplayRangeLineConfig
> {
  ensureWaitTimeDisplayRangeMigrated();
  const raw = readModuleSettingJson<
    Partial<Record<string, Partial<WaitTimeDisplayRangeLineConfig>>>
  >(RANGE_BY_LINE_FIELD_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeRangeByLineConfig(raw);
  }
  return defaultRangeByLineConfig();
}

export function writeWaitTimeDisplayRangeByLine(
  config: Record<WaitTimeDisplayProductLineId, WaitTimeDisplayRangeLineConfig>,
): void {
  const normalized = normalizeRangeByLineConfig(config);
  writeModuleSettingJson(RANGE_BY_LINE_FIELD_ID, normalized);
  syncRangeLegacyFields(normalized);
}

export function syncWaitTimeDisplayRangeEnabledFromLines(lines: readonly string[]): void {
  ensureWaitTimeDisplayRangeMigrated();
  const config = readWaitTimeDisplayRangeByLine();
  const selected = new Set(
    lines.filter((id): id is WaitTimeDisplayProductLineId =>
      ALL_LINE_IDS.includes(id as WaitTimeDisplayProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeWaitTimeDisplayRangeByLine(config);
}

/* ───────── 共用 lines 读写 / 判定 ───────── */

export function readWaitTimeDisplayLines(seq: number): WaitTimeDisplayProductLineId[] {
  if (seq === WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ) {
    const config = readWaitTimeDisplayCurrentOrderByLine();
    return ALL_LINE_IDS.filter((id) => config[id].enabled);
  }
  if (seq === WAIT_TIME_DISPLAY_RANGE_SEQ) {
    const config = readWaitTimeDisplayRangeByLine();
    return ALL_LINE_IDS.filter((id) => config[id].enabled);
  }
  if (isWaitTimeDisplayStyleSeq(seq)) {
    ensureWaitTimeStyleMigrated(seq);
    return readWaitTimeStyleEnabledLines(seq);
  }
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writeWaitTimeDisplayLines(seq, all);
    return all;
  }
  return [];
}

export function writeWaitTimeDisplayLines(
  seq: number,
  lines: WaitTimeDisplayProductLineId[],
): void {
  if (seq === WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ) {
    syncWaitTimeDisplayCurrentOrderEnabledFromLines(lines);
    return;
  }
  if (seq === WAIT_TIME_DISPLAY_RANGE_SEQ) {
    syncWaitTimeDisplayRangeEnabledFromLines(lines);
    return;
  }
  if (isWaitTimeDisplayStyleSeq(seq)) {
    syncWaitTimeStyleEnabledFromLines(seq, lines);
    return;
  }
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(linesStorageId(seq), unique);
}

export function ensureWaitTimeDisplayToggleMigrated(seq: number): void {
  if (seq === WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ) {
    ensureWaitTimeDisplayCurrentOrderMigrated();
    return;
  }
  if (seq === WAIT_TIME_DISPLAY_RANGE_SEQ) {
    ensureWaitTimeDisplayRangeMigrated();
    return;
  }
  if (isWaitTimeDisplayStyleSeq(seq)) {
    ensureWaitTimeStyleMigrated(seq);
    return;
  }
  readWaitTimeDisplayLines(seq);
}

export function isWaitTimeDisplayCurrentOrderSeq(seq: number): boolean {
  return seq === WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ;
}

export function isWaitTimeDisplayRangeSeq(seq: number): boolean {
  return seq === WAIT_TIME_DISPLAY_RANGE_SEQ;
}

/** @deprecated 535/536 已无总开关 */
export function isWaitTimeDisplayToggleSeq(seq: number): boolean {
  return false;
}

export function isWaitTimeDisplayFormSeq(seq: number): seq is import("./module-settings-wait-time-style-ui").WaitTimeDisplayStyleSeq {
  return isWaitTimeDisplayStyleSeq(seq);
}

export function isWaitTimeDisplaySeq(seq: number): boolean {
  return (
    isWaitTimeDisplayCurrentOrderSeq(seq) ||
    isWaitTimeDisplayRangeSeq(seq) ||
    isWaitTimeDisplayStyleSeq(seq)
  );
}

/* ───────── 535 UI ───────── */

function syncCurrentOrderInputsDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-535-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-wait-time-535-line-enabled");
    if (!lineId) return;
    editor
      .querySelectorAll<HTMLInputElement>(
        `[data-wait-time-535-auto-close="${lineId}"], [data-wait-time-535-menu-popup="${lineId}"]`,
      )
      .forEach((input) => {
        input.disabled = !checkbox.checked;
      });
  });
}

function collectCurrentOrderFromEditor(editor: HTMLElement): void {
  const config = readWaitTimeDisplayCurrentOrderByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-535-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-wait-time-535-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-535-auto-close]").forEach((input) => {
    const lineId = input.getAttribute("data-wait-time-535-auto-close");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].autoCloseMinutes = clampNumber(
      input.value,
      AUTO_CLOSE_DEFAULT,
    );
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-535-menu-popup]").forEach((input) => {
    const lineId = input.getAttribute("data-wait-time-535-menu-popup");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].menuPopupMinutes = clampNumber(
      input.value,
      MENU_POPUP_DEFAULT,
    );
  });
  writeWaitTimeDisplayCurrentOrderByLine(config);
  syncCurrentOrderInputsDisabled(editor);
}

function renderCurrentOrderByLineEditorHtml(): string {
  const config = readWaitTimeDisplayCurrentOrderByLine();
  const rows = WAIT_TIME_DISPLAY_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-wait-time-535-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用展示当前订单预计等待时长"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="space-y-2 text-sm text-foreground ${item.enabled ? "" : "opacity-50"}">
          <label class="flex flex-wrap items-center gap-1.5">
            <span class="text-muted-foreground">当前下单预计等待时间大于</span>
            <input
              type="number"
              inputmode="numeric"
              class="${NUMBER_INPUT_CLASS}"
              value="${escapeHtml(String(item.autoCloseMinutes))}"
              min="${NUMBER_MIN}"
              max="${NUMBER_MAX}"
              step="1"
              data-wait-time-535-auto-close="${escapeHtml(line.id)}"
              ${item.enabled ? "" : "disabled"}
              aria-label="${escapeHtml(line.label)} 自动关闭提示分钟"
            />
            <span class="text-muted-foreground">分钟后，自动关闭提示</span>
          </label>
          <label class="flex flex-wrap items-center gap-1.5">
            <span class="text-muted-foreground">当前下单预计等待时间大于</span>
            <input
              type="number"
              inputmode="numeric"
              class="${NUMBER_INPUT_CLASS}"
              value="${escapeHtml(String(item.menuPopupMinutes))}"
              min="${NUMBER_MIN}"
              max="${NUMBER_MAX}"
              step="1"
              data-wait-time-535-menu-popup="${escapeHtml(line.id)}"
              ${item.enabled ? "" : "disabled"}
              aria-label="${escapeHtml(line.label)} 菜单弹框提示分钟"
            />
            <span class="text-muted-foreground">分钟后，菜单页自动展示弹框提示</span>
          </label>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-wait-time-535-by-line-editor="${WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">功能时间设置</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderWaitTimeDisplayCurrentOrderPanelHtml(): string {
  ensureWaitTimeDisplayCurrentOrderMigrated();
  return `
    <div class="mt-3 space-y-4" data-wait-time-535-panel="${WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ}">
      ${renderCurrentOrderByLineEditorHtml()}
    </div>`;
}

export function bindWaitTimeDisplayCurrentOrderUi(root: ParentNode = document): void {
  ensureWaitTimeDisplayCurrentOrderMigrated();
  root
    .querySelectorAll<HTMLElement>(
      `[data-wait-time-535-by-line-editor="${WAIT_TIME_DISPLAY_CURRENT_ORDER_SEQ}"]`,
    )
    .forEach((editor) => {
      if (editor.dataset.waitTime535ByLineEditorBound === "1") return;
      editor.dataset.waitTime535ByLineEditorBound = "1";

      syncCurrentOrderInputsDisabled(editor);

      const persist = () => collectCurrentOrderFromEditor(editor);
      editor.addEventListener("change", (e) => {
        const target = e.target as HTMLElement;
        if (
          target.matches("[data-wait-time-535-line-enabled]") ||
          target.matches("[data-wait-time-535-auto-close]") ||
          target.matches("[data-wait-time-535-menu-popup]")
        ) {
          persist();
        }
      });
      editor.addEventListener("input", (e) => {
        const target = e.target as HTMLElement;
        if (
          target.matches("[data-wait-time-535-auto-close]") ||
          target.matches("[data-wait-time-535-menu-popup]")
        ) {
          persist();
        }
      });
    });
}

/* ───────── 536 UI ───────── */

function syncRangeInputsDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-536-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-wait-time-536-line-enabled");
    if (!lineId) return;
    editor
      .querySelectorAll<HTMLInputElement>(
        `[data-wait-time-536-cups="${lineId}"], [data-wait-time-536-minutes="${lineId}"], [data-wait-time-536-start-minus="${lineId}"], [data-wait-time-536-end-plus="${lineId}"]`,
      )
      .forEach((input) => {
        input.disabled = !checkbox.checked;
      });
  });
}

function collectRangeFromEditor(editor: HTMLElement): void {
  const config = readWaitTimeDisplayRangeByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-536-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-wait-time-536-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-536-cups]").forEach((input) => {
    const lineId = input.getAttribute("data-wait-time-536-cups");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].cupsThreshold = clampNumber(
      input.value,
      CUPS_THRESHOLD_DEFAULT,
    );
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-536-minutes]").forEach((input) => {
    const lineId = input.getAttribute("data-wait-time-536-minutes");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].minutesThreshold = clampNumber(
      input.value,
      MINUTES_THRESHOLD_DEFAULT,
    );
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-536-start-minus]").forEach((input) => {
    const lineId = input.getAttribute("data-wait-time-536-start-minus");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].rangeStartMinus = clampNumber(
      input.value,
      RANGE_START_MINUS_DEFAULT,
    );
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-536-end-plus]").forEach((input) => {
    const lineId = input.getAttribute("data-wait-time-536-end-plus");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as WaitTimeDisplayProductLineId)) return;
    config[lineId as WaitTimeDisplayProductLineId].rangeEndPlus = clampNumber(
      input.value,
      RANGE_END_PLUS_DEFAULT,
    );
  });
  writeWaitTimeDisplayRangeByLine(config);
  syncRangeInputsDisabled(editor);
}

function renderRangeByLineEditorHtml(): string {
  const config = readWaitTimeDisplayRangeByLine();
  const rows = WAIT_TIME_DISPLAY_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-wait-time-536-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用预计等待时长区间设置"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="space-y-2 text-sm text-foreground ${item.enabled ? "" : "opacity-50"}">
          <label class="flex flex-wrap items-center gap-1.5">
            <span class="text-muted-foreground">当杯数大于</span>
            <input
              type="number"
              inputmode="numeric"
              class="${NUMBER_INPUT_CLASS}"
              value="${escapeHtml(String(item.cupsThreshold))}"
              min="${NUMBER_MIN}"
              max="${NUMBER_MAX}"
              step="1"
              data-wait-time-536-cups="${escapeHtml(line.id)}"
              ${item.enabled ? "" : "disabled"}
              aria-label="${escapeHtml(line.label)} 杯数阈值"
            />
            <span class="text-muted-foreground">杯，或者当预计等待时长大于</span>
            <input
              type="number"
              inputmode="numeric"
              class="${NUMBER_INPUT_CLASS}"
              value="${escapeHtml(String(item.minutesThreshold))}"
              min="${NUMBER_MIN}"
              max="${NUMBER_MAX}"
              step="1"
              data-wait-time-536-minutes="${escapeHtml(line.id)}"
              ${item.enabled ? "" : "disabled"}
              aria-label="${escapeHtml(line.label)} 等待时长阈值分钟"
            />
            <span class="text-muted-foreground">分钟</span>
          </label>
          <label class="flex flex-wrap items-center gap-1.5">
            <span class="text-muted-foreground">区间开始：在原固定时长上减</span>
            <input
              type="number"
              inputmode="numeric"
              class="${NUMBER_INPUT_CLASS}"
              value="${escapeHtml(String(item.rangeStartMinus))}"
              min="${NUMBER_MIN}"
              max="${NUMBER_MAX}"
              step="1"
              data-wait-time-536-start-minus="${escapeHtml(line.id)}"
              ${item.enabled ? "" : "disabled"}
              aria-label="${escapeHtml(line.label)} 区间开始减分钟"
            />
            <span class="text-muted-foreground">分钟</span>
          </label>
          <label class="flex flex-wrap items-center gap-1.5">
            <span class="text-muted-foreground">区间结束：在原固定时长上加</span>
            <input
              type="number"
              inputmode="numeric"
              class="${NUMBER_INPUT_CLASS}"
              value="${escapeHtml(String(item.rangeEndPlus))}"
              min="${NUMBER_MIN}"
              max="${NUMBER_MAX}"
              step="1"
              data-wait-time-536-end-plus="${escapeHtml(line.id)}"
              ${item.enabled ? "" : "disabled"}
              aria-label="${escapeHtml(line.label)} 区间结束加分钟"
            />
            <span class="text-muted-foreground">分钟</span>
          </label>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-wait-time-536-by-line-editor="${WAIT_TIME_DISPLAY_RANGE_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">功能时间设置</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderWaitTimeDisplayRangePanelHtml(): string {
  ensureWaitTimeDisplayRangeMigrated();
  return `
    <div class="mt-3 space-y-4" data-wait-time-536-panel="${WAIT_TIME_DISPLAY_RANGE_SEQ}">
      ${renderRangeByLineEditorHtml()}
    </div>`;
}

export function bindWaitTimeDisplayRangeUi(root: ParentNode = document): void {
  ensureWaitTimeDisplayRangeMigrated();
  root
    .querySelectorAll<HTMLElement>(
      `[data-wait-time-536-by-line-editor="${WAIT_TIME_DISPLAY_RANGE_SEQ}"]`,
    )
    .forEach((editor) => {
      if (editor.dataset.waitTime536ByLineEditorBound === "1") return;
      editor.dataset.waitTime536ByLineEditorBound = "1";

      syncRangeInputsDisabled(editor);

      const persist = () => collectRangeFromEditor(editor);
      editor.addEventListener("change", (e) => {
        const target = e.target as HTMLElement;
        if (
          target.matches("[data-wait-time-536-line-enabled]") ||
          target.matches("[data-wait-time-536-cups]") ||
          target.matches("[data-wait-time-536-minutes]") ||
          target.matches("[data-wait-time-536-start-minus]") ||
          target.matches("[data-wait-time-536-end-plus]")
        ) {
          persist();
        }
      });
      editor.addEventListener("input", (e) => {
        const target = e.target as HTMLElement;
        if (
          target.matches("[data-wait-time-536-cups]") ||
          target.matches("[data-wait-time-536-minutes]") ||
          target.matches("[data-wait-time-536-start-minus]") ||
          target.matches("[data-wait-time-536-end-plus]")
        ) {
          persist();
        }
      });
    });
}

/* ───────── 537–540 产线多选（常显） ───────── */

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readWaitTimeDisplayLines(seq));
  const cells = WAIT_TIME_DISPLAY_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-6 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-wait-time-display-line="${escapeHtml(line.id)}"
          data-wait-time-display-seq="${seq}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-wait-time-display-lines="${seq}"
      role="group"
      aria-label="排队与等待展示适用产线"
    >
      ${cells}
    </div>`;
}

export function renderWaitTimeDisplayLinesPanelHtml(seq: number, enabled: boolean): string {
  const hidden = enabled ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-wait-time-display-panel="${seq}"
      ${enabled ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, enabled)}
    </div>`;
}

export function setWaitTimeDisplayLinesPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-wait-time-display-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-wait-time-display-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): void {
  const seq = Number(group.getAttribute("data-wait-time-display-lines"));
  if (!Number.isFinite(seq)) return;
  const lines: WaitTimeDisplayProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-wait-time-display-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-wait-time-display-line");
    if (id && ALL_LINE_IDS.includes(id as WaitTimeDisplayProductLineId)) {
      lines.push(id as WaitTimeDisplayProductLineId);
    }
  });
  writeWaitTimeDisplayLines(seq, lines);
}

export function bindWaitTimeDisplayUi(root: ParentNode = document): void {
  bindWaitTimeDisplayCurrentOrderUi(root);
  bindWaitTimeDisplayRangeUi(root);
}
