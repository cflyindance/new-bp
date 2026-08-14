/**
 * 前厅 · 清桌与换企台：seq 534 付款后自动清桌（主开关 + 各产线付款后等待分钟数）。
 * 原 seq 169「付款后清桌模式」已合并，并在首次读取时迁移。
 */

import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  readModuleSettingJsonRaw,
  readModuleSettingNumber,
  writeModuleSettingJson,
  writeModuleSettingNumber,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";
import { getLayoutContextStoreId } from "../auth/session-scope";

export const AUTO_CLEAR_TABLE_SEQ = 534;

const LINES_STORAGE_ID = "534-auto-clear-table-lines";
const MINUTES_BY_LINE_STORAGE_ID = "534-auto-clear-table-minutes-by-line";
const LEGACY_POST_PAYMENT_CLEAR_TABLE_SEQ = 169;
const LEGACY_LINES_STORAGE_ID = "169-post-payment-clear-table-lines";
const MIGRATION_MARKER_PREFIX = "534-post-payment-auto-clear-169-migrated-v1";

export const AUTO_CLEAR_TABLE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "kiosk", label: "Kiosk" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type AutoClearTableProductLineId = (typeof AUTO_CLEAR_TABLE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: AutoClearTableProductLineId[] = AUTO_CLEAR_TABLE_PRODUCT_LINES.map((l) => l.id);
const LEGACY_LINE_IDS = new Set<AutoClearTableProductLineId>([
  "emenu",
  "pos",
  "pos-go",
  "paypad",
  "sdi",
]);

const MINUTES_MIN = 0;
const MINUTES_MAX = 999;
const MINUTES_DEFAULT = 60;

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

let minutesMigrated = false;
const migratedScopes = new Set<string>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function minutesFieldId(lineId: AutoClearTableProductLineId): string {
  return `534-${lineId}-auto-clear-minutes`;
}

function clampMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return MINUTES_MIN;
  return Math.min(MINUTES_MAX, Math.max(MINUTES_MIN, Math.round(n)));
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureAutoClearTableToggleMigrated(): void {
  ensurePostPaymentAutoClearMigration();
}

export function readAutoClearTableMasterOn(): boolean {
  ensureAutoClearTableToggleMigrated();
  return readLegacyToggleOn(AUTO_CLEAR_TABLE_SEQ);
}

function normalizeLineIds(raw: unknown): AutoClearTableProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is AutoClearTableProductLineId => typeof id === "string" && valid.has(id),
  );
}

function defaultMinutesByLine(): Record<AutoClearTableProductLineId, number> {
  return Object.fromEntries(ALL_LINE_IDS.map((id) => [id, MINUTES_MIN])) as Record<
    AutoClearTableProductLineId,
    number
  >;
}

function normalizeMinutesByLine(
  raw: Partial<Record<string, unknown>>,
): Record<AutoClearTableProductLineId, number> {
  const base = defaultMinutesByLine();
  for (const line of AUTO_CLEAR_TABLE_PRODUCT_LINES) {
    const v = raw[line.id];
    base[line.id] = clampMinutes(v ?? base[line.id]);
  }
  return base;
}

export function mergePostPaymentAutoClearMigrationState(input: {
  targetToggleOn: boolean;
  targetMinutes: Partial<Record<string, unknown>>;
  legacyToggleOn: boolean;
  legacyLines: readonly string[];
}): {
  toggleOn: boolean;
  minutes: Record<AutoClearTableProductLineId, number>;
} {
  const hasConfiguredTargetMinutes = ALL_LINE_IDS.some((id) =>
    Object.prototype.hasOwnProperty.call(input.targetMinutes, id),
  );
  const minutes = normalizeMinutesByLine(input.targetMinutes);

  if (input.targetToggleOn && !hasConfiguredTargetMinutes) {
    for (const id of ALL_LINE_IDS) minutes[id] = MINUTES_DEFAULT;
  }

  for (const rawLineId of input.legacyLines) {
    const lineId = rawLineId as AutoClearTableProductLineId;
    if (!LEGACY_LINE_IDS.has(lineId) || minutes[lineId] > 0) continue;
    minutes[lineId] = MINUTES_DEFAULT;
  }

  return {
    toggleOn: input.targetToggleOn || input.legacyToggleOn,
    minutes,
  };
}

function migrationMarkerStorageKey(scopeId: string): string {
  return moduleSettingStorageKey(`${MIGRATION_MARKER_PREFIX}:${scopeId}`);
}

function ensurePostPaymentAutoClearMigration(): void {
  let scopeId: string;
  try {
    scopeId = getLayoutContextStoreId();
  } catch {
    scopeId = "current-store";
  }
  if (migratedScopes.has(scopeId)) return;

  const markerKey = migrationMarkerStorageKey(scopeId);
  try {
    if (localStorage.getItem(markerKey) === "1") {
      migratedScopes.add(scopeId);
      return;
    }

    const rawTargetMinutes = readModuleSettingJsonRaw(MINUTES_BY_LINE_STORAGE_ID);
    const targetMinutes =
      rawTargetMinutes && typeof rawTargetMinutes === "object" && !Array.isArray(rawTargetMinutes)
        ? (rawTargetMinutes as Partial<Record<string, unknown>>)
        : {};
    const legacyLinesRaw = readModuleSettingJson<unknown>(LEGACY_LINES_STORAGE_ID, null);
    const legacyLines = Array.isArray(legacyLinesRaw)
      ? legacyLinesRaw.filter((line): line is string => typeof line === "string")
      : [];
    const merged = mergePostPaymentAutoClearMigrationState({
      targetToggleOn: readLegacyToggleOn(AUTO_CLEAR_TABLE_SEQ),
      targetMinutes,
      legacyToggleOn: readLegacyToggleOn(LEGACY_POST_PAYMENT_CLEAR_TABLE_SEQ),
      legacyLines,
    });

    localStorage.setItem(
      moduleSettingStorageKey(MINUTES_BY_LINE_STORAGE_ID),
      JSON.stringify(merged.minutes),
    );
    for (const lineId of ALL_LINE_IDS) {
      localStorage.setItem(
        moduleSettingStorageKey(minutesFieldId(lineId)),
        String(merged.minutes[lineId]),
      );
    }
    localStorage.setItem(
      moduleSettingStorageKey(LINES_STORAGE_ID),
      JSON.stringify(ALL_LINE_IDS.filter((id) => merged.minutes[id] > 0)),
    );
    localStorage.setItem(
      moduleSettingToggleStorageKey(AUTO_CLEAR_TABLE_SEQ),
      merged.toggleOn ? "1" : "0",
    );
    localStorage.setItem(markerKey, "1");
    migratedScopes.add(scopeId);
  } catch {
    /* 存储失败时不写迁移标记，下次加载继续重试。 */
  }
}

function syncLinesFromMinutes(values: Record<AutoClearTableProductLineId, number>): void {
  const enabled = ALL_LINE_IDS.filter((id) => values[id] > 0);
  writeAutoClearTableLines(enabled);
}

function ensureAutoClearTableMinutesMigrated(): void {
  ensurePostPaymentAutoClearMigration();
  if (minutesMigrated) return;
  minutesMigrated = true;

  const raw = readModuleSettingJson<Partial<Record<string, unknown>>>(MINUTES_BY_LINE_STORAGE_ID, {});
  const hasPerLineField = ALL_LINE_IDS.some((lineId) => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(minutesFieldId(lineId))) !== null;
    } catch {
      return false;
    }
  });

  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    const normalized = normalizeMinutesByLine(raw);
    writeAutoClearTableMinutesByLine(normalized);
    return;
  }

  if (hasPerLineField) {
    const values = defaultMinutesByLine();
    for (const lineId of ALL_LINE_IDS) {
      values[lineId] = clampMinutes(readModuleSettingNumber(minutesFieldId(lineId), MINUTES_MIN));
    }
    writeAutoClearTableMinutesByLine(values);
    return;
  }

  const legacyLines = normalizeLineIds(readModuleSettingJson<unknown>(LINES_STORAGE_ID, null));
  if (legacyLines.length > 0 || readAutoClearTableMasterOn()) {
    const values = defaultMinutesByLine();
    const seedLines = legacyLines.length > 0 ? legacyLines : [...ALL_LINE_IDS];
    for (const lineId of seedLines) {
      values[lineId] = MINUTES_DEFAULT;
    }
    writeAutoClearTableMinutesByLine(values);
  }
}

export function readAutoClearTableMinutesByLine(): Record<AutoClearTableProductLineId, number> {
  ensureAutoClearTableToggleMigrated();
  ensureAutoClearTableMinutesMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, unknown>>>(MINUTES_BY_LINE_STORAGE_ID, {});
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeMinutesByLine(raw);
  }
  return defaultMinutesByLine();
}

export function writeAutoClearTableMinutesByLine(
  values: Record<AutoClearTableProductLineId, number>,
): void {
  const normalized = normalizeMinutesByLine(values);
  writeModuleSettingJson(MINUTES_BY_LINE_STORAGE_ID, normalized);
  for (const lineId of ALL_LINE_IDS) {
    writeModuleSettingNumber(minutesFieldId(lineId), normalized[lineId]);
  }
  syncLinesFromMinutes(normalized);
}

export function readAutoClearTableLines(): AutoClearTableProductLineId[] {
  ensureAutoClearTableMinutesMigrated();
  const minutes = readAutoClearTableMinutesByLine();
  const fromMinutes = ALL_LINE_IDS.filter((id) => minutes[id] > 0);
  if (fromMinutes.length > 0) return fromMinutes;

  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readAutoClearTableMasterOn()) {
    const all = [...ALL_LINE_IDS];
    writeAutoClearTableLines(all);
    return all;
  }
  return [];
}

export function writeAutoClearTableLines(lines: AutoClearTableProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isAutoClearTableSeq(seq: number): boolean {
  return seq === AUTO_CLEAR_TABLE_SEQ;
}

function renderMinutesByLineEditorHtml(enabled: boolean): string {
  const values = readAutoClearTableMinutesByLine();
  const rows = AUTO_CLEAR_TABLE_PRODUCT_LINES.map((line) => {
    const minutes = values[line.id];
    return `
    <tr class="border-t border-border">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(minutes))}"
            min="${MINUTES_MIN}"
            max="${MINUTES_MAX}"
            step="1"
            data-auto-clear-table-minutes-line="${escapeHtml(line.id)}"
            ${enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 付款后自动清桌时间"
          />
          <span class="text-sm text-muted-foreground">分钟</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-auto-clear-table-minutes-editor="${AUTO_CLEAR_TABLE_SEQ}">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium">付款后等待时间</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderAutoClearTablePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-auto-clear-table-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderMinutesByLineEditorHtml(on)}
    </div>`;
}

export function setAutoClearTablePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-auto-clear-table-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-auto-clear-table-minutes-line]").forEach((input) => {
      input.disabled = !visible;
    });
  });
}

function collectMinutesFromEditor(editor: HTMLElement): void {
  const values = readAutoClearTableMinutesByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-auto-clear-table-minutes-line]").forEach((input) => {
    const lineId = input.getAttribute("data-auto-clear-table-minutes-line");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as AutoClearTableProductLineId)) return;
    values[lineId as AutoClearTableProductLineId] = clampMinutes(input.value);
  });
  writeAutoClearTableMinutesByLine(values);
}

export function bindAutoClearTableUi(root: ParentNode = document): void {
  ensureAutoClearTableToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-auto-clear-table-minutes-editor]").forEach((editor) => {
    if (editor.dataset.autoClearTableMinutesEditorBound === "1") return;
    editor.dataset.autoClearTableMinutesEditorBound = "1";

    const persist = () => collectMinutesFromEditor(editor);
    editor.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).matches("[data-auto-clear-table-minutes-line]")) persist();
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-auto-clear-table-minutes-line]")) persist();
    });
  });
}
