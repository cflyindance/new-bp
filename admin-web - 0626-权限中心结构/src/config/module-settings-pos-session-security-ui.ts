/**
 * 前厅 · 登录与主界面：seq 75 自动登出时间、166 每次操作后登出、175 登录忽略特殊符号。
 * 75：分钟数 + 产线多选；166/175：主开关 + 产线多选（POS / POS GO / PayPad）。
 */

import {
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

const ALL_LINE_IDS: PosSessionSecurityProductLineId[] =
  POS_SESSION_SECURITY_PRODUCT_LINES.map((l) => l.id);

const LINES_STORAGE_ID_BY_SEQ = {
  75: "75-auto-logout-minutes-lines",
  166: "166-auto-logout-after-operation-lines",
  175: "175-login-ignore-special-chars-lines",
} as const;

const AUTO_LOGOUT_MINUTES_FIELD_ID = "75-auto-logout-minutes";
const MINUTES_DEFAULT = 15;
const MINUTES_MIN = 0;
const MINUTES_MAX = 999;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const NUMBER_INPUT_CLASS =
  "h-8 w-24 rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const toggleMigrated = new Set<number>();

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

export function readPosSessionSecurityLines(seq: number): PosSessionSecurityProductLineId[] {
  const storageId = linesStorageId(seq);
  if (!storageId) return [];

  if (POS_SESSION_SECURITY_TOGGLE_SEQS.includes(seq as (typeof POS_SESSION_SECURITY_TOGGLE_SEQS)[number])) {
    ensurePosSessionSecurityToggleMigrated(seq);
  }

  const stored = readModuleSettingJson<unknown>(storageId, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (seq === AUTO_LOGOUT_MINUTES_SEQ) {
    const all = [...ALL_LINE_IDS];
    writePosSessionSecurityLines(seq, all);
    return all;
  }

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
  writeModuleSettingJson(storageId, unique);
}

export function readAutoLogoutMinutes(): number {
  const stored = readModuleSettingNumber(AUTO_LOGOUT_MINUTES_FIELD_ID, MINUTES_DEFAULT);
  if (!Number.isFinite(stored)) return MINUTES_DEFAULT;
  return Math.min(MINUTES_MAX, Math.max(MINUTES_MIN, Math.round(stored)));
}

export function writeAutoLogoutMinutes(minutes: number): void {
  const value = Math.min(MINUTES_MAX, Math.max(MINUTES_MIN, Math.round(minutes)));
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
  if (seq === AUTO_LOGOUT_MINUTES_SEQ) return "自动登出时间适用产线";
  if (seq === AUTO_LOGOUT_AFTER_OPERATION_SEQ) return "每次操作后自动登出适用产线";
  return "登录忽略特殊符号适用产线";
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

function renderMinutesInputHtml(): string {
  const value = readAutoLogoutMinutes();
  return `
    <div class="flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputmode="numeric"
        class="${NUMBER_INPUT_CLASS}"
        value="${escapeHtml(String(value))}"
        min="${MINUTES_MIN}"
        max="${MINUTES_MAX}"
        step="1"
        data-auto-logout-minutes="${AUTO_LOGOUT_MINUTES_SEQ}"
        aria-label="自动登出时间"
      />
      <span class="text-sm text-muted-foreground">分钟</span>
      <span class="text-xs text-muted-foreground">（${MINUTES_MIN} 表示不自动登出，${MINUTES_MIN + 1}–${MINUTES_MAX}）</span>
    </div>`;
}

export function renderAutoLogoutMinutesPanelHtml(): string {
  return `
    <div class="mt-3 space-y-4" data-pos-session-security-panel="${AUTO_LOGOUT_MINUTES_SEQ}">
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">无操作超时</p>
        ${renderMinutesInputHtml()}
      </div>
      <div>
        <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
        ${renderLinesMultiselectHtml(AUTO_LOGOUT_MINUTES_SEQ, true)}
      </div>
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
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
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

export function bindPosSessionSecurityUi(root: ParentNode = document): void {
  for (const seq of POS_SESSION_SECURITY_TOGGLE_SEQS) {
    ensurePosSessionSecurityToggleMigrated(seq);
  }

  root.querySelectorAll<HTMLInputElement>("[data-auto-logout-minutes]").forEach((input) => {
    if (input.dataset.autoLogoutMinutesBound === "1") return;
    input.dataset.autoLogoutMinutesBound = "1";
    const persist = () => {
      const n = Number(input.value);
      if (Number.isFinite(n)) writeAutoLogoutMinutes(n);
    };
    input.addEventListener("change", persist);
    input.addEventListener("blur", persist);
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
