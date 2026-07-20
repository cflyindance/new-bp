/**
 * 前厅 · 登录与主界面：seq 75 自动登出时间（按产线启用+分钟）、166 每次操作后登出、175 企台登录忽略特殊符号。
 * 75：对齐 seq 582 表格（产线 | 启用 | 分钟）；166/175：主开关 + 产线多选（POS / POS GO / PayPad）。
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

export const AUTO_LOGOUT_MINUTES_SEQ = 75;
export const AUTO_LOGOUT_AFTER_OPERATION_SEQ = 166;
export const LOGIN_IGNORE_SPECIAL_CHARS_SEQ = 175;

export const POS_SESSION_SECURITY_TOGGLE_SEQS = [
  AUTO_LOGOUT_AFTER_OPERATION_SEQ,
  LOGIN_IGNORE_SPECIAL_CHARS_SEQ,
] as const;

export const POS_SESSION_SECURITY_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosSessionSecurityProductLineId =
  (typeof POS_SESSION_SECURITY_PRODUCT_LINES)[number]["id"];

export type AutoLogoutLineConfig = {
  enabled: boolean;
  minutes: number;
};

const ALL_LINE_IDS: PosSessionSecurityProductLineId[] =
  POS_SESSION_SECURITY_PRODUCT_LINES.map((l) => l.id);

const LINES_STORAGE_ID_BY_SEQ = {
  75: "75-auto-logout-minutes-lines",
  166: "166-auto-logout-after-operation-lines",
  175: "175-login-ignore-special-chars-lines",
} as const;

export const AUTO_LOGOUT_BY_LINE_FIELD_ID = "75-auto-logout-by-line";
const AUTO_LOGOUT_MINUTES_FIELD_ID = "75-auto-logout-minutes";
const AUTO_LOGOUT_LINES_STORAGE_ID = LINES_STORAGE_ID_BY_SEQ[75];

const MINUTES_DEFAULT = 15;
const MINUTES_MIN = 1;
const MINUTES_MAX = 999;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const CHECKBOX_CLASS =
  "size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NUMBER_INPUT_CLASS =
  "h-8 w-20 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const toggleMigrated = new Set<number>();
let autoLogoutMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linesStorageId(seq: number): string | null {
  return LINES_STORAGE_ID_BY_SEQ[seq as keyof typeof LINES_STORAGE_ID_BY_SEQ] ?? null;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensurePosSessionSecurityToggleMigrated(seq: number): void {
  if (!POS_SESSION_SECURITY_TOGGLE_SEQS.includes(seq as (typeof POS_SESSION_SECURITY_TOGGLE_SEQS)[number])) {
    return;
  }
  if (toggleMigrated.has(seq)) return;
  toggleMigrated.add(seq);
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

function normalizeLineIds(raw: unknown): PosSessionSecurityProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosSessionSecurityProductLineId => typeof id === "string" && valid.has(id),
  );
}

function clampAutoLogoutMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return MINUTES_DEFAULT;
  return Math.min(MINUTES_MAX, Math.max(MINUTES_MIN, Math.round(n)));
}

function defaultLineConfig(enabled: boolean): AutoLogoutLineConfig {
  return { enabled, minutes: MINUTES_DEFAULT };
}

function defaultAutoLogoutByLine(): Record<PosSessionSecurityProductLineId, AutoLogoutLineConfig> {
  return Object.fromEntries(
    POS_SESSION_SECURITY_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(true)]),
  ) as Record<PosSessionSecurityProductLineId, AutoLogoutLineConfig>;
}

function normalizeAutoLogoutByLine(
  raw: Partial<Record<string, Partial<AutoLogoutLineConfig>>>,
): Record<PosSessionSecurityProductLineId, AutoLogoutLineConfig> {
  const base = defaultAutoLogoutByLine();
  for (const line of POS_SESSION_SECURITY_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    base[line.id] = {
      enabled: item.enabled === true,
      minutes: clampAutoLogoutMinutes(item.minutes ?? base[line.id].minutes),
    };
  }
  return base;
}

function syncAutoLogoutLegacyFields(
  config: Record<PosSessionSecurityProductLineId, AutoLogoutLineConfig>,
): void {
  const enabledLines = ALL_LINE_IDS.filter((id) => config[id].enabled);
  writeModuleSettingJson(AUTO_LOGOUT_LINES_STORAGE_ID, enabledLines);
  const firstEnabled = POS_SESSION_SECURITY_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingNumber(AUTO_LOGOUT_MINUTES_FIELD_ID, config[firstEnabled.id].minutes);
  }
}

function readLegacyMinutesRaw(): number {
  const stored = readModuleSettingNumber(AUTO_LOGOUT_MINUTES_FIELD_ID, MINUTES_DEFAULT);
  if (!Number.isFinite(stored)) return MINUTES_DEFAULT;
  return Math.round(stored);
}

function ensureAutoLogoutByLineMigrated(): void {
  if (autoLogoutMigrated) return;
  autoLogoutMigrated = true;

  const raw = readModuleSettingJson<Partial<Record<string, Partial<AutoLogoutLineConfig>>>>(
    AUTO_LOGOUT_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeAutoLogoutByLine(normalizeAutoLogoutByLine(raw));
    return;
  }

  const hasLegacyMinutes = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(AUTO_LOGOUT_MINUTES_FIELD_ID)) !== null;
    } catch {
      return false;
    }
  })();
  const hasLegacyLines = (() => {
    try {
      return localStorage.getItem(moduleSettingStorageKey(AUTO_LOGOUT_LINES_STORAGE_ID)) !== null;
    } catch {
      return false;
    }
  })();

  if (!hasLegacyMinutes && !hasLegacyLines) {
    writeAutoLogoutByLine(defaultAutoLogoutByLine());
    return;
  }

  const minutesLegacy = readLegacyMinutesRaw();
  const linesRaw = readModuleSettingJson<unknown>(AUTO_LOGOUT_LINES_STORAGE_ID, null);
  const normalizedLines = normalizeLineIds(linesRaw);
  const linesLegacy =
    normalizedLines.length > 0 ? normalizedLines : ([...ALL_LINE_IDS] as PosSessionSecurityProductLineId[]);
  const selected = new Set(linesLegacy);

  const config = defaultAutoLogoutByLine();
  for (const line of POS_SESSION_SECURITY_PRODUCT_LINES) {
    if (!selected.has(line.id)) {
      config[line.id] = { enabled: false, minutes: MINUTES_DEFAULT };
      continue;
    }
    if (minutesLegacy > 0) {
      config[line.id] = {
        enabled: true,
        minutes: clampAutoLogoutMinutes(minutesLegacy),
      };
    } else {
      config[line.id] = { enabled: false, minutes: MINUTES_DEFAULT };
    }
  }
  writeAutoLogoutByLine(config);
}

export function readAutoLogoutByLine(): Record<
  PosSessionSecurityProductLineId,
  AutoLogoutLineConfig
> {
  ensureAutoLogoutByLineMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<AutoLogoutLineConfig>>>>(
    AUTO_LOGOUT_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeAutoLogoutByLine(raw);
  }
  return defaultAutoLogoutByLine();
}

export function writeAutoLogoutByLine(
  config: Record<PosSessionSecurityProductLineId, AutoLogoutLineConfig>,
): void {
  const normalized = normalizeAutoLogoutByLine(config);
  writeModuleSettingJson(AUTO_LOGOUT_BY_LINE_FIELD_ID, normalized);
  syncAutoLogoutLegacyFields(normalized);
}

/** FOH 写 lines 后回写 by-line.enabled，避免开关与表格漂移 */
export function syncAutoLogoutEnabledFromLines(lines: readonly string[]): void {
  ensureAutoLogoutByLineMigrated();
  const config = readAutoLogoutByLine();
  const selected = new Set(
    lines.filter((id): id is PosSessionSecurityProductLineId =>
      ALL_LINE_IDS.includes(id as PosSessionSecurityProductLineId),
    ),
  );
  for (const id of ALL_LINE_IDS) {
    config[id] = {
      ...config[id],
      enabled: selected.has(id),
    };
  }
  writeAutoLogoutByLine(config);
}

export function readPosSessionSecurityLines(seq: number): PosSessionSecurityProductLineId[] {
  const storageId = linesStorageId(seq);
  if (!storageId) return [];

  if (seq === AUTO_LOGOUT_MINUTES_SEQ) {
    const config = readAutoLogoutByLine();
    return ALL_LINE_IDS.filter((id) => config[id].enabled);
  }

  if (POS_SESSION_SECURITY_TOGGLE_SEQS.includes(seq as (typeof POS_SESSION_SECURITY_TOGGLE_SEQS)[number])) {
    ensurePosSessionSecurityToggleMigrated(seq);
  }

  const stored = readModuleSettingJson<unknown>(storageId, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosSessionSecurityLines(seq, all);
    return all;
  }
  return [];
}

export function writePosSessionSecurityLines(
  seq: number,
  lines: PosSessionSecurityProductLineId[],
): void {
  const storageId = linesStorageId(seq);
  if (!storageId) return;
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));

  if (seq === AUTO_LOGOUT_MINUTES_SEQ) {
    syncAutoLogoutEnabledFromLines(unique);
    return;
  }

  writeModuleSettingJson(storageId, unique);
}

export function readAutoLogoutMinutes(): number {
  const config = readAutoLogoutByLine();
  const firstEnabled = POS_SESSION_SECURITY_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) return config[firstEnabled.id].minutes;
  const stored = readModuleSettingNumber(AUTO_LOGOUT_MINUTES_FIELD_ID, MINUTES_DEFAULT);
  if (!Number.isFinite(stored)) return MINUTES_DEFAULT;
  return clampAutoLogoutMinutes(stored);
}

export function writeAutoLogoutMinutes(minutes: number): void {
  const value = clampAutoLogoutMinutes(minutes);
  const config = readAutoLogoutByLine();
  let changed = false;
  for (const id of ALL_LINE_IDS) {
    if (config[id].enabled) {
      config[id] = { ...config[id], minutes: value };
      changed = true;
    }
  }
  if (changed) {
    writeAutoLogoutByLine(config);
    return;
  }
  writeModuleSettingNumber(AUTO_LOGOUT_MINUTES_FIELD_ID, value);
}

export function isAutoLogoutMinutesSeq(seq: number): boolean {
  return seq === AUTO_LOGOUT_MINUTES_SEQ;
}

export function isPosSessionSecurityToggleSeq(seq: number): boolean {
  return POS_SESSION_SECURITY_TOGGLE_SEQS.includes(seq as (typeof POS_SESSION_SECURITY_TOGGLE_SEQS)[number]);
}

export function isPosSessionSecuritySeq(seq: number): boolean {
  return isAutoLogoutMinutesSeq(seq) || isPosSessionSecurityToggleSeq(seq);
}

function panelAriaLabel(seq: number): string {
  if (seq === AUTO_LOGOUT_AFTER_OPERATION_SEQ) return "企台完成每次操作后账号自动登出适用产线";
  return "企台登录忽略特殊符号适用产线";
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readPosSessionSecurityLines(seq));
  const cells = POS_SESSION_SECURITY_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-pos-session-security-line="${seq}"
          data-line-id="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-pos-session-security-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(panelAriaLabel(seq))}"
    >
      ${cells}
    </div>`;
}

function renderAutoLogoutByLineEditorHtml(): string {
  const config = readAutoLogoutByLine();
  const rows = POS_SESSION_SECURITY_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    const rowEnabled = item.enabled;
    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-middle whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-middle">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            class="${CHECKBOX_CLASS}"
            ${item.enabled ? "checked" : ""}
            data-auto-logout-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用自动登出"
          />
        </label>
      </td>
      <td class="px-3 py-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground">无操作</span>
          <input
            type="number"
            inputmode="numeric"
            class="${NUMBER_INPUT_CLASS}"
            value="${escapeHtml(String(item.minutes))}"
            min="${MINUTES_MIN}"
            max="${MINUTES_MAX}"
            step="1"
            data-auto-logout-line-minutes="${escapeHtml(line.id)}"
            ${rowEnabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} 自动登出分钟数"
          />
          <span class="text-xs text-muted-foreground">分钟</span>
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div data-auto-logout-by-line-editor="${AUTO_LOGOUT_MINUTES_SEQ}" class="space-y-2">
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[24rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">无操作超时</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderAutoLogoutMinutesPanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-pos-session-security-panel="${AUTO_LOGOUT_MINUTES_SEQ}">
      ${renderAutoLogoutByLineEditorHtml()}
    </div>`;
}

export function renderPosSessionSecurityTogglePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-session-security-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

function syncAutoLogoutMinutesInputDisabled(editor: HTMLElement): void {
  editor.querySelectorAll<HTMLInputElement>("[data-auto-logout-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-auto-logout-line-enabled");
    if (!lineId) return;
    const minutes = editor.querySelector<HTMLInputElement>(
      `[data-auto-logout-line-minutes="${lineId}"]`,
    );
    if (!minutes) return;
    minutes.disabled = !checkbox.checked;
  });
}

export function setPosSessionSecurityPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-pos-session-security-panel="${seq}"]`).forEach((panel) => {
    if (seq === AUTO_LOGOUT_MINUTES_SEQ) return;

    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-pos-session-security-line]").forEach((input) => {
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
  const seq = Number(group.getAttribute("data-pos-session-security-lines"));
  if (!seq) return;
  const lines: PosSessionSecurityProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-pos-session-security-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-line-id");
    if (id && ALL_LINE_IDS.includes(id as PosSessionSecurityProductLineId)) {
      lines.push(id as PosSessionSecurityProductLineId);
    }
  });
  writePosSessionSecurityLines(seq, lines);
}

function collectAutoLogoutFromEditor(editor: HTMLElement): void {
  const config = readAutoLogoutByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-auto-logout-line-enabled]").forEach((checkbox) => {
    const lineId = checkbox.getAttribute("data-auto-logout-line-enabled");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as PosSessionSecurityProductLineId)) return;
    config[lineId as PosSessionSecurityProductLineId].enabled = checkbox.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-auto-logout-line-minutes]").forEach((input) => {
    const lineId = input.getAttribute("data-auto-logout-line-minutes");
    if (!lineId || !ALL_LINE_IDS.includes(lineId as PosSessionSecurityProductLineId)) return;
    config[lineId as PosSessionSecurityProductLineId].minutes = clampAutoLogoutMinutes(input.value);
  });
  writeAutoLogoutByLine(config);
  syncAutoLogoutMinutesInputDisabled(editor);
}

export function bindPosSessionSecurityUi(root: ParentNode = document): void {
  for (const seq of POS_SESSION_SECURITY_TOGGLE_SEQS) {
    ensurePosSessionSecurityToggleMigrated(seq);
  }
  ensureAutoLogoutByLineMigrated();

  root.querySelectorAll<HTMLElement>("[data-auto-logout-by-line-editor]").forEach((editor) => {
    if (editor.dataset.autoLogoutByLineEditorBound === "1") return;
    editor.dataset.autoLogoutByLineEditorBound = "1";

    syncAutoLogoutMinutesInputDisabled(editor);

    const persist = () => collectAutoLogoutFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.matches("[data-auto-logout-line-enabled]") ||
        target.matches("[data-auto-logout-line-minutes]")
      ) {
        persist();
      }
    });
    editor.addEventListener("input", (e) => {
      if ((e.target as HTMLElement).matches("[data-auto-logout-line-minutes]")) persist();
    });
  });

  root.querySelectorAll<HTMLElement>("[data-pos-session-security-lines]").forEach((group) => {
    if (group.dataset.posSessionSecurityLinesBound === "1") return;
    group.dataset.posSessionSecurityLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-session-security-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
