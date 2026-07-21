/**
 * 前厅 · 排队与等待展示样式（537–540）：
 * 产线 | 功能设置（无启用列；产线范围由 FOH 产线视图开关同步）
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  moduleSettingStorageKey,
  readModuleSettingCheckbox,
  readModuleSettingColor,
  readModuleSettingJson,
  readModuleSettingNumber,
  readModuleSettingRadio,
  writeModuleSettingCheckbox,
  writeModuleSettingColor,
  writeModuleSettingJson,
  writeModuleSettingNumber,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const WAIT_TIME_DISPLAY_TYPE_SEQ = 537;
export const WAIT_TIME_DISPLAY_FONT_SIZE_SEQ = 538;
export const WAIT_TIME_DISPLAY_FONT_BG_SEQ = 539;
export const WAIT_TIME_DISPLAY_FONT_COLOR_SEQ = 540;

/** 供产线 scope 抽取：须为数字字面量数组 */
export const WAIT_TIME_DISPLAY_STYLE_SEQS = [537, 538, 539, 540] as const;

export type WaitTimeDisplayStyleSeq = (typeof WAIT_TIME_DISPLAY_STYLE_SEQS)[number];

export const WAIT_TIME_STYLE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
] as const;

export type WaitTimeStyleProductLineId = (typeof WAIT_TIME_STYLE_PRODUCT_LINES)[number]["id"];

type DisplayTypeLineConfig = {
  enabled: boolean;
  showQueueCount: boolean;
  showWaitTime: boolean;
};

type FontSizeLineConfig = {
  enabled: boolean;
  mode: "system" | "multiplier";
  multiplier: number;
};

type FontColorLineConfig = {
  enabled: boolean;
  mode: "system" | "custom";
  color: string;
};

const ALL_LINE_IDS: WaitTimeStyleProductLineId[] = WAIT_TIME_STYLE_PRODUCT_LINES.map((l) => l.id);

const BY_LINE_FIELD: Record<WaitTimeDisplayStyleSeq, string> = {
  537: "537-wait-time-display-by-line",
  538: "538-wait-time-display-by-line",
  539: "539-wait-time-display-by-line",
  540: "540-wait-time-display-by-line",
};

const LINES_STORAGE_ID_BY_SEQ: Record<WaitTimeDisplayStyleSeq, string> = {
  537: "537-wait-time-display-lines",
  538: "538-wait-time-display-lines",
  539: "539-wait-time-display-lines",
  540: "540-wait-time-display-lines",
};

const CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-16 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const COLOR_INPUT_CLASS =
  "size-9 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5 disabled:cursor-not-allowed disabled:opacity-50";

const migrated = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hasStorageKey(fieldId: string): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(fieldId)) !== null;
  } catch {
    return false;
  }
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): WaitTimeStyleProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return ALL_LINE_IDS.filter((id) => raw.includes(id) && valid.has(id));
}

function syncToggleAndLines(
  seq: WaitTimeDisplayStyleSeq,
  enabledLines: WaitTimeStyleProductLineId[],
): void {
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], enabledLines);
  try {
    localStorage.setItem(
      moduleSettingToggleStorageKey(seq),
      enabledLines.length > 0 ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

function clampMultiplier(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(10, Math.max(0.1, Math.round(n * 10) / 10));
}

function normalizeHexColor(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function isWaitTimeDisplayStyleSeq(seq: number): seq is WaitTimeDisplayStyleSeq {
  return (WAIT_TIME_DISPLAY_STYLE_SEQS as readonly number[]).includes(seq);
}

function defaultDisplayType(enabled: boolean): DisplayTypeLineConfig {
  return { enabled, showQueueCount: true, showWaitTime: true };
}

function defaultDisplayTypeByLine(): Record<WaitTimeStyleProductLineId, DisplayTypeLineConfig> {
  return Object.fromEntries(
    WAIT_TIME_STYLE_PRODUCT_LINES.map((l) => [l.id, defaultDisplayType(true)]),
  ) as Record<WaitTimeStyleProductLineId, DisplayTypeLineConfig>;
}

function normalizeDisplayTypeByLine(
  raw: Partial<Record<string, Partial<DisplayTypeLineConfig>>>,
): Record<WaitTimeStyleProductLineId, DisplayTypeLineConfig> {
  const base = defaultDisplayTypeByLine();
  for (const line of WAIT_TIME_STYLE_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      showQueueCount: item.showQueueCount !== false,
      showWaitTime: item.showWaitTime !== false,
    };
  }
  return base;
}

function syncDisplayTypeLegacy(
  config: Record<WaitTimeStyleProductLineId, DisplayTypeLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  syncToggleAndLines(537, enabledLines);
  const first = WAIT_TIME_STYLE_PRODUCT_LINES.find((l) => config[l.id].enabled);
  if (first) {
    writeModuleSettingCheckbox("537-queue-count", config[first.id].showQueueCount);
    writeModuleSettingCheckbox("537-wait-time", config[first.id].showWaitTime);
  }
}

export function ensureWaitTimeDisplayTypeMigrated(): void {
  if (migrated.has(537)) return;
  migrated.add(537);
  const raw = readModuleSettingJson<Partial<Record<string, Partial<DisplayTypeLineConfig>>>>(
    BY_LINE_FIELD[537],
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeDisplayTypeByLine(normalizeDisplayTypeByLine(raw));
    return;
  }

  const toggleOn = readLegacyToggleOn(537);
  const hasLegacy =
    hasStorageKey("537-queue-count") ||
    hasStorageKey("537-wait-time") ||
    hasStorageKey(LINES_STORAGE_ID_BY_SEQ[537]) ||
    toggleOn;
  if (!hasLegacy) {
    writeDisplayTypeByLine(defaultDisplayTypeByLine());
    return;
  }

  const showQueueCount = readModuleSettingCheckbox("537-queue-count", true);
  const showWaitTime = readModuleSettingCheckbox("537-wait-time", true);
  const lines = normalizeLineIds(readModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[537], null));
  const selected = new Set(lines.length > 0 ? lines : toggleOn ? ALL_LINE_IDS : []);
  const config = defaultDisplayTypeByLine();
  for (const line of WAIT_TIME_STYLE_PRODUCT_LINES) {
    config[line.id] = {
      enabled: selected.has(line.id),
      showQueueCount,
      showWaitTime,
    };
  }
  writeDisplayTypeByLine(config);
}

export function readDisplayTypeByLine(): Record<
  WaitTimeStyleProductLineId,
  DisplayTypeLineConfig
> {
  ensureWaitTimeDisplayTypeMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<DisplayTypeLineConfig>>>>(
    BY_LINE_FIELD[537],
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeDisplayTypeByLine(raw);
  }
  return defaultDisplayTypeByLine();
}

export function writeDisplayTypeByLine(
  config: Record<WaitTimeStyleProductLineId, DisplayTypeLineConfig>,
): void {
  const normalized = normalizeDisplayTypeByLine(config);
  writeModuleSettingJson(BY_LINE_FIELD[537], normalized);
  syncDisplayTypeLegacy(normalized);
}

export function syncDisplayTypeEnabledFromLines(lines: readonly string[]): void {
  ensureWaitTimeDisplayTypeMigrated();
  const config = readDisplayTypeByLine();
  const selected = new Set(
    lines.filter((id): id is WaitTimeStyleProductLineId =>
      ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeDisplayTypeByLine(config);
}

function defaultFontSize(enabled: boolean): FontSizeLineConfig {
  return { enabled, mode: "system", multiplier: 1 };
}

function defaultFontSizeByLine(): Record<WaitTimeStyleProductLineId, FontSizeLineConfig> {
  return Object.fromEntries(
    WAIT_TIME_STYLE_PRODUCT_LINES.map((l) => [l.id, defaultFontSize(true)]),
  ) as Record<WaitTimeStyleProductLineId, FontSizeLineConfig>;
}

function normalizeFontSizeByLine(
  raw: Partial<Record<string, Partial<FontSizeLineConfig>>>,
): Record<WaitTimeStyleProductLineId, FontSizeLineConfig> {
  const base = defaultFontSizeByLine();
  for (const line of WAIT_TIME_STYLE_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      mode: item.mode === "multiplier" ? "multiplier" : "system",
      multiplier: clampMultiplier(item.multiplier ?? 1),
    };
  }
  return base;
}

function syncFontSizeLegacy(
  config: Record<WaitTimeStyleProductLineId, FontSizeLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  syncToggleAndLines(538, enabledLines);
  const first = WAIT_TIME_STYLE_PRODUCT_LINES.find((l) => config[l.id].enabled);
  if (first) {
    writeModuleSettingRadio("538-font-size-mode", config[first.id].mode);
    writeModuleSettingNumber("538-font-size-multiplier", config[first.id].multiplier);
  }
}

export function ensureWaitTimeFontSizeMigrated(): void {
  if (migrated.has(538)) return;
  migrated.add(538);
  const raw = readModuleSettingJson<Partial<Record<string, Partial<FontSizeLineConfig>>>>(
    BY_LINE_FIELD[538],
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeFontSizeByLine(normalizeFontSizeByLine(raw));
    return;
  }

  const toggleOn = readLegacyToggleOn(538);
  const hasLegacy =
    hasStorageKey("538-font-size-mode") ||
    hasStorageKey("538-font-size-multiplier") ||
    hasStorageKey(LINES_STORAGE_ID_BY_SEQ[538]) ||
    toggleOn;
  if (!hasLegacy) {
    writeFontSizeByLine(defaultFontSizeByLine());
    return;
  }

  const modeRaw = readModuleSettingRadio("538-font-size-mode", "system");
  const mode = modeRaw === "multiplier" ? "multiplier" : "system";
  const multiplier = clampMultiplier(readModuleSettingNumber("538-font-size-multiplier", 1));
  const lines = normalizeLineIds(readModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[538], null));
  const selected = new Set(lines.length > 0 ? lines : toggleOn ? ALL_LINE_IDS : []);
  const config = defaultFontSizeByLine();
  for (const line of WAIT_TIME_STYLE_PRODUCT_LINES) {
    config[line.id] = { enabled: selected.has(line.id), mode, multiplier };
  }
  writeFontSizeByLine(config);
}

export function readFontSizeByLine(): Record<WaitTimeStyleProductLineId, FontSizeLineConfig> {
  ensureWaitTimeFontSizeMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<FontSizeLineConfig>>>>(
    BY_LINE_FIELD[538],
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeFontSizeByLine(raw);
  }
  return defaultFontSizeByLine();
}

export function writeFontSizeByLine(
  config: Record<WaitTimeStyleProductLineId, FontSizeLineConfig>,
): void {
  const normalized = normalizeFontSizeByLine(config);
  writeModuleSettingJson(BY_LINE_FIELD[538], normalized);
  syncFontSizeLegacy(normalized);
}

export function syncFontSizeEnabledFromLines(lines: readonly string[]): void {
  ensureWaitTimeFontSizeMigrated();
  const config = readFontSizeByLine();
  const selected = new Set(
    lines.filter((id): id is WaitTimeStyleProductLineId =>
      ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeFontSizeByLine(config);
}

function defaultFontColor(enabled: boolean, colorDefault: string): FontColorLineConfig {
  return { enabled, mode: "system", color: colorDefault };
}

function defaultFontColorByLine(
  colorDefault: string,
): Record<WaitTimeStyleProductLineId, FontColorLineConfig> {
  return Object.fromEntries(
    WAIT_TIME_STYLE_PRODUCT_LINES.map((l) => [l.id, defaultFontColor(true, colorDefault)]),
  ) as Record<WaitTimeStyleProductLineId, FontColorLineConfig>;
}

function normalizeFontColorByLine(
  raw: Partial<Record<string, Partial<FontColorLineConfig>>>,
  colorDefault: string,
): Record<WaitTimeStyleProductLineId, FontColorLineConfig> {
  const base = defaultFontColorByLine(colorDefault);
  for (const line of WAIT_TIME_STYLE_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      mode: item.mode === "custom" ? "custom" : "system",
      color: normalizeHexColor(item.color ?? colorDefault, colorDefault),
    };
  }
  return base;
}

function syncFontColorLegacy(
  seq: 539 | 540,
  modeField: string,
  colorField: string,
  config: Record<WaitTimeStyleProductLineId, FontColorLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  syncToggleAndLines(seq, enabledLines);
  const first = WAIT_TIME_STYLE_PRODUCT_LINES.find((l) => config[l.id].enabled);
  if (first) {
    writeModuleSettingRadio(modeField, config[first.id].mode);
    writeModuleSettingColor(colorField, config[first.id].color);
  }
}

function ensureFontColorMigrated(
  seq: 539 | 540,
  modeField: string,
  colorField: string,
  colorDefault: string,
  writeFn: (c: Record<WaitTimeStyleProductLineId, FontColorLineConfig>) => void,
): void {
  if (migrated.has(seq)) return;
  migrated.add(seq);
  const raw = readModuleSettingJson<Partial<Record<string, Partial<FontColorLineConfig>>>>(
    BY_LINE_FIELD[seq],
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeFn(normalizeFontColorByLine(raw, colorDefault));
    return;
  }

  const toggleOn = readLegacyToggleOn(seq);
  const hasLegacy =
    hasStorageKey(modeField) ||
    hasStorageKey(colorField) ||
    hasStorageKey(LINES_STORAGE_ID_BY_SEQ[seq]) ||
    toggleOn;
  if (!hasLegacy) {
    writeFn(defaultFontColorByLine(colorDefault));
    return;
  }

  const modeRaw = readModuleSettingRadio(modeField, "system");
  const mode = modeRaw === "custom" ? "custom" : "system";
  const color = normalizeHexColor(readModuleSettingColor(colorField, colorDefault), colorDefault);
  const lines = normalizeLineIds(readModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], null));
  const selected = new Set(lines.length > 0 ? lines : toggleOn ? ALL_LINE_IDS : []);
  const config = defaultFontColorByLine(colorDefault);
  for (const line of WAIT_TIME_STYLE_PRODUCT_LINES) {
    config[line.id] = { enabled: selected.has(line.id), mode, color };
  }
  writeFn(config);
}

export function readFontBgByLine(): Record<WaitTimeStyleProductLineId, FontColorLineConfig> {
  ensureWaitTimeFontBgMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<FontColorLineConfig>>>>(
    BY_LINE_FIELD[539],
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeFontColorByLine(raw, "#9ca3af");
  }
  return defaultFontColorByLine("#9ca3af");
}

export function writeFontBgByLine(
  config: Record<WaitTimeStyleProductLineId, FontColorLineConfig>,
): void {
  const normalized = normalizeFontColorByLine(config, "#9ca3af");
  writeModuleSettingJson(BY_LINE_FIELD[539], normalized);
  syncFontColorLegacy(539, "539-font-bg-mode", "539-font-bg-color", normalized);
}

export function ensureWaitTimeFontBgMigrated(): void {
  ensureFontColorMigrated(539, "539-font-bg-mode", "539-font-bg-color", "#9ca3af", writeFontBgByLine);
}

export function syncFontBgEnabledFromLines(lines: readonly string[]): void {
  ensureWaitTimeFontBgMigrated();
  const config = readFontBgByLine();
  const selected = new Set(
    lines.filter((id): id is WaitTimeStyleProductLineId =>
      ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeFontBgByLine(config);
}

export function readFontColorByLine(): Record<WaitTimeStyleProductLineId, FontColorLineConfig> {
  ensureWaitTimeFontColorMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<FontColorLineConfig>>>>(
    BY_LINE_FIELD[540],
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeFontColorByLine(raw, "#ffffff");
  }
  return defaultFontColorByLine("#ffffff");
}

export function writeFontColorByLine(
  config: Record<WaitTimeStyleProductLineId, FontColorLineConfig>,
): void {
  const normalized = normalizeFontColorByLine(config, "#ffffff");
  writeModuleSettingJson(BY_LINE_FIELD[540], normalized);
  syncFontColorLegacy(540, "540-font-color-mode", "540-font-color", normalized);
}

export function ensureWaitTimeFontColorMigrated(): void {
  ensureFontColorMigrated(
    540,
    "540-font-color-mode",
    "540-font-color",
    "#ffffff",
    writeFontColorByLine,
  );
}

export function syncFontColorEnabledFromLines(lines: readonly string[]): void {
  ensureWaitTimeFontColorMigrated();
  const config = readFontColorByLine();
  const selected = new Set(
    lines.filter((id): id is WaitTimeStyleProductLineId =>
      ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = { ...config[id], enabled: selected.has(id) };
  }
  writeFontColorByLine(config);
}

export function syncWaitTimeStyleEnabledFromLines(
  seq: number,
  lines: readonly string[],
): void {
  if (seq === 537) syncDisplayTypeEnabledFromLines(lines);
  else if (seq === 538) syncFontSizeEnabledFromLines(lines);
  else if (seq === 539) syncFontBgEnabledFromLines(lines);
  else if (seq === 540) syncFontColorEnabledFromLines(lines);
}

export function readWaitTimeStyleEnabledLines(seq: number): WaitTimeStyleProductLineId[] {
  if (seq === 537) return ALL_LINE_IDS.filter((id) => readDisplayTypeByLine()[id].enabled);
  if (seq === 538) return ALL_LINE_IDS.filter((id) => readFontSizeByLine()[id].enabled);
  if (seq === 539) return ALL_LINE_IDS.filter((id) => readFontBgByLine()[id].enabled);
  if (seq === 540) return ALL_LINE_IDS.filter((id) => readFontColorByLine()[id].enabled);
  return [];
}

export function ensureWaitTimeStyleMigrated(seq: number): void {
  if (seq === 537) ensureWaitTimeDisplayTypeMigrated();
  else if (seq === 538) ensureWaitTimeFontSizeMigrated();
  else if (seq === 539) ensureWaitTimeFontBgMigrated();
  else if (seq === 540) ensureWaitTimeFontColorMigrated();
}

function renderTableShell(seq: number, settingHeader: string, rows: string): string {
  return `
    <div data-wait-time-style-by-line-editor="${seq}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">${escapeHtml(settingHeader)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderDisplayTypeEditor(): string {
  const config = readDisplayTypeByLine();
  const rows = WAIT_TIME_STYLE_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" class="${CONTROL_CLASS} rounded-sm" ${item.showQueueCount ? "checked" : ""} data-wait-time-537-queue="${escapeHtml(line.id)}" />
            <span>展示排队数量</span>
          </label>
          <label class="inline-flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" class="${CONTROL_CLASS} rounded-sm" ${item.showWaitTime ? "checked" : ""} data-wait-time-537-wait="${escapeHtml(line.id)}" />
            <span>展示等待时间</span>
          </label>
        </div>
      </td>
    </tr>`;
  }).join("");
  return renderTableShell(537, "功能设置", rows);
}

function renderFontSizeEditor(): string {
  const config = readFontSizeByLine();
  const rows = WAIT_TIME_STYLE_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    const group = `wait-time-538-mode-${line.id}`;
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="${escapeHtml(group)}" value="system" class="${CONTROL_CLASS}" ${item.mode === "system" ? "checked" : ""} data-wait-time-538-mode="${escapeHtml(line.id)}" />
            <span>系统默认大小</span>
          </label>
          <label class="inline-flex flex-wrap cursor-pointer items-center gap-1.5">
            <input type="radio" name="${escapeHtml(group)}" value="multiplier" class="${CONTROL_CLASS}" ${item.mode === "multiplier" ? "checked" : ""} data-wait-time-538-mode="${escapeHtml(line.id)}" />
            <span>系统默认大小的</span>
            <input type="number" step="0.1" min="0.1" max="10" class="${NUMBER_INPUT_CLASS}" value="${escapeHtml(String(item.multiplier))}" data-wait-time-538-multiplier="${escapeHtml(line.id)}" ${item.mode === "multiplier" ? "" : "disabled"} />
            <span>倍</span>
          </label>
        </div>
      </td>
    </tr>`;
  }).join("");
  return renderTableShell(538, "功能设置", rows);
}

function renderFontColorEditor(
  seq: 539 | 540,
  systemLabel: string,
  customLabel: string,
  config: Record<WaitTimeStyleProductLineId, FontColorLineConfig>,
  modeAttr: string,
  colorAttr: string,
): string {
  const rows = WAIT_TIME_STYLE_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    const group = `wait-time-${seq}-mode-${line.id}`;
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-4 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="${escapeHtml(group)}" value="system" class="${CONTROL_CLASS}" ${item.mode === "system" ? "checked" : ""} ${modeAttr}="${escapeHtml(line.id)}" />
            <span>${escapeHtml(systemLabel)}</span>
          </label>
          <label class="inline-flex cursor-pointer items-center gap-1.5">
            <input type="radio" name="${escapeHtml(group)}" value="custom" class="${CONTROL_CLASS}" ${item.mode === "custom" ? "checked" : ""} ${modeAttr}="${escapeHtml(line.id)}" />
            <span>${escapeHtml(customLabel)}</span>
            <input type="color" class="${COLOR_INPUT_CLASS}" value="${escapeHtml(item.color)}" ${colorAttr}="${escapeHtml(line.id)}" ${item.mode === "custom" ? "" : "disabled"} />
          </label>
        </div>
      </td>
    </tr>`;
  }).join("");
  return renderTableShell(seq, "功能设置", rows);
}

export function renderWaitTimeDisplayStylePanelHtml(seq: number): string {
  ensureWaitTimeStyleMigrated(seq);
  let editor = "";
  if (seq === 537) editor = renderDisplayTypeEditor();
  else if (seq === 538) editor = renderFontSizeEditor();
  else if (seq === 539) {
    editor = renderFontColorEditor(
      539,
      "系统默认背景色",
      "自定义背景色",
      readFontBgByLine(),
      "data-wait-time-539-mode",
      "data-wait-time-539-color",
    );
  } else if (seq === 540) {
    editor = renderFontColorEditor(
      540,
      "系统默认颜色",
      "自定义颜色",
      readFontColorByLine(),
      "data-wait-time-540-mode",
      "data-wait-time-540-color",
    );
  } else {
    return "";
  }
  return `<div class="mt-3 space-y-4" data-wait-time-style-panel="${seq}">${editor}</div>`;
}

function syncStyleInputsDisabled(editor: HTMLElement, seq: number): void {
  if (seq === 538) {
    WAIT_TIME_STYLE_PRODUCT_LINES.forEach((line) => {
      const mode = editor.querySelector<HTMLInputElement>(
        `[data-wait-time-538-mode="${line.id}"]:checked`,
      )?.value;
      const mult = editor.querySelector<HTMLInputElement>(
        `[data-wait-time-538-multiplier="${line.id}"]`,
      );
      if (mult) mult.disabled = mode !== "multiplier";
    });
    return;
  }
  if (seq === 539 || seq === 540) {
    const modeAttr = `data-wait-time-${seq}-mode`;
    const colorAttr = `data-wait-time-${seq}-color`;
    WAIT_TIME_STYLE_PRODUCT_LINES.forEach((line) => {
      const mode = editor.querySelector<HTMLInputElement>(
        `[${modeAttr}="${line.id}"]:checked`,
      )?.value;
      const color = editor.querySelector<HTMLInputElement>(`[${colorAttr}="${line.id}"]`);
      if (color) color.disabled = mode !== "custom";
    });
  }
}

function collectDisplayType(editor: HTMLElement): void {
  const config = readDisplayTypeByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-537-queue]").forEach((el) => {
    const id = el.getAttribute("data-wait-time-537-queue");
    if (!id || !ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId)) return;
    config[id as WaitTimeStyleProductLineId].showQueueCount = el.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-537-wait]").forEach((el) => {
    const id = el.getAttribute("data-wait-time-537-wait");
    if (!id || !ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId)) return;
    config[id as WaitTimeStyleProductLineId].showWaitTime = el.checked;
  });
  writeDisplayTypeByLine(config);
}

function collectFontSize(editor: HTMLElement): void {
  const config = readFontSizeByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-538-mode]:checked").forEach((el) => {
    const id = el.getAttribute("data-wait-time-538-mode");
    if (!id || !ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId)) return;
    config[id as WaitTimeStyleProductLineId].mode =
      el.value === "multiplier" ? "multiplier" : "system";
  });
  editor.querySelectorAll<HTMLInputElement>("[data-wait-time-538-multiplier]").forEach((el) => {
    const id = el.getAttribute("data-wait-time-538-multiplier");
    if (!id || !ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId)) return;
    config[id as WaitTimeStyleProductLineId].multiplier = clampMultiplier(el.value);
  });
  writeFontSizeByLine(config);
  syncStyleInputsDisabled(editor, 538);
}

function collectFontColor(
  editor: HTMLElement,
  seq: 539 | 540,
  readFn: () => Record<WaitTimeStyleProductLineId, FontColorLineConfig>,
  writeFn: (c: Record<WaitTimeStyleProductLineId, FontColorLineConfig>) => void,
  modeAttr: string,
  colorAttr: string,
): void {
  const config = readFn();
  editor.querySelectorAll<HTMLInputElement>(`[${modeAttr}]:checked`).forEach((el) => {
    const id = el.getAttribute(modeAttr);
    if (!id || !ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId)) return;
    config[id as WaitTimeStyleProductLineId].mode = el.value === "custom" ? "custom" : "system";
  });
  editor.querySelectorAll<HTMLInputElement>(`[${colorAttr}]`).forEach((el) => {
    const id = el.getAttribute(colorAttr);
    if (!id || !ALL_LINE_IDS.includes(id as WaitTimeStyleProductLineId)) return;
    config[id as WaitTimeStyleProductLineId].color = normalizeHexColor(
      el.value,
      seq === 539 ? "#9ca3af" : "#ffffff",
    );
  });
  writeFn(config);
  syncStyleInputsDisabled(editor, seq);
}

function bindStyleEditor(editor: HTMLElement, seq: number): void {
  if (editor.dataset.waitTimeStyleEditorBound === "1") return;
  editor.dataset.waitTimeStyleEditorBound = "1";
  syncStyleInputsDisabled(editor, seq);

  const persist = () => {
    if (seq === 537) collectDisplayType(editor);
    else if (seq === 538) collectFontSize(editor);
    else if (seq === 539) {
      collectFontColor(
        editor,
        539,
        readFontBgByLine,
        writeFontBgByLine,
        "data-wait-time-539-mode",
        "data-wait-time-539-color",
      );
    } else if (seq === 540) {
      collectFontColor(
        editor,
        540,
        readFontColorByLine,
        writeFontColorByLine,
        "data-wait-time-540-mode",
        "data-wait-time-540-color",
      );
    }
  };

  editor.addEventListener("change", persist);
  editor.addEventListener("input", (e) => {
    const t = e.target as HTMLElement;
    if (
      t.matches("[data-wait-time-538-multiplier]") ||
      t.matches("[data-wait-time-539-color]") ||
      t.matches("[data-wait-time-540-color]")
    ) {
      persist();
    }
  });
}

export function bindWaitTimeDisplayStyleUi(root: ParentNode = document): void {
  for (const seq of WAIT_TIME_DISPLAY_STYLE_SEQS) {
    ensureWaitTimeStyleMigrated(seq);
    root
      .querySelectorAll<HTMLElement>(`[data-wait-time-style-by-line-editor="${seq}"]`)
      .forEach((editor) => {
        bindStyleEditor(editor, seq);
      });
  }
}
