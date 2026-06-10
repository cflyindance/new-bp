/**
 * 前厅 · 排队与等待展示（673 全局计算 + 535–540）：673 杯数→秒数 SSOT；
 * 535/536 主开关 + Kiosk 产线多选；537–540 为样式子项（产线区常显）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const WAIT_TIME_DISPLAY_TOGGLE_SEQS = [535, 536] as const;
export const WAIT_TIME_DISPLAY_FORM_SEQS = [537, 538, 539, 540] as const;

export type WaitTimeDisplayToggleSeq = (typeof WAIT_TIME_DISPLAY_TOGGLE_SEQS)[number];
export type WaitTimeDisplayFormSeq = (typeof WAIT_TIME_DISPLAY_FORM_SEQS)[number];

export const WAIT_TIME_DISPLAY_PRODUCT_LINES = [{ id: "kiosk", label: "Kiosk" }] as const;

export type WaitTimeDisplayProductLineId =
  (typeof WAIT_TIME_DISPLAY_PRODUCT_LINES)[number]["id"];

const KIOSK_LINE_ID: WaitTimeDisplayProductLineId = "kiosk";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedToggleSeqs = new Set<number>();

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

function normalizeLineIds(raw: unknown): WaitTimeDisplayProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(KIOSK_LINE_ID) ? [KIOSK_LINE_ID] : [];
}

export function readWaitTimeDisplayLines(seq: number): WaitTimeDisplayProductLineId[] {
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    writeWaitTimeDisplayLines(seq, [KIOSK_LINE_ID]);
    return [KIOSK_LINE_ID];
  }
  return [];
}

export function writeWaitTimeDisplayLines(
  seq: number,
  lines: WaitTimeDisplayProductLineId[],
): void {
  const enabled = lines.includes(KIOSK_LINE_ID);
  writeModuleSettingJson(linesStorageId(seq), enabled ? [KIOSK_LINE_ID] : []);
}

export function ensureWaitTimeDisplayToggleMigrated(seq: number): void {
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  readWaitTimeDisplayLines(seq);
}

export function isWaitTimeDisplayToggleSeq(seq: number): seq is WaitTimeDisplayToggleSeq {
  return (WAIT_TIME_DISPLAY_TOGGLE_SEQS as readonly number[]).includes(seq);
}

export function isWaitTimeDisplayFormSeq(seq: number): seq is WaitTimeDisplayFormSeq {
  return (WAIT_TIME_DISPLAY_FORM_SEQS as readonly number[]).includes(seq);
}

export function isWaitTimeDisplaySeq(seq: number): boolean {
  return isWaitTimeDisplayToggleSeq(seq) || isWaitTimeDisplayFormSeq(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readWaitTimeDisplayLines(seq));
  const cells = WAIT_TIME_DISPLAY_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
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
      class="flex w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted/40"
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
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
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
    if (id === KIOSK_LINE_ID) lines.push(KIOSK_LINE_ID);
  });
  writeWaitTimeDisplayLines(seq, lines);
}

export function bindWaitTimeDisplayUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-wait-time-display-lines]").forEach((group) => {
    if (group.dataset.waitTimeDisplayBound === "1") return;
    group.dataset.waitTimeDisplayBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-wait-time-display-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
