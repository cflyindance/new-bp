/**
 * 前厅 · 食客端·下单与规则：用餐时长相关设置（577–580，主开关 + eMenu 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_SHOW_DINING_DURATION_SEQ = 577;
export const GUEST_DINING_DURATION_COUNTDOWN_SEQ = 578;
export const GUEST_DINING_REMAINING_ALERT_SEQ = 579;
export const GUEST_DINING_BLOCK_ORDER_AFTER_ALERT_SEQ = 580;

export const GUEST_DINING_DURATION_SEQS = [
  GUEST_SHOW_DINING_DURATION_SEQ,
  GUEST_DINING_DURATION_COUNTDOWN_SEQ,
  GUEST_DINING_REMAINING_ALERT_SEQ,
  GUEST_DINING_BLOCK_ORDER_AFTER_ALERT_SEQ,
] as const;

export type GuestDiningDurationSeq = (typeof GUEST_DINING_DURATION_SEQS)[number];

export const GUEST_DINING_DURATION_PRODUCT_LINES = [{ id: "emenu", label: "eMenu" }] as const;

export type GuestDiningDurationProductLineId =
  (typeof GUEST_DINING_DURATION_PRODUCT_LINES)[number]["id"];

const EMENU_LINE_ID: GuestDiningDurationProductLineId = "emenu";

const ALL_LINE_IDS: GuestDiningDurationProductLineId[] =
  GUEST_DINING_DURATION_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const SEQ_PANEL_HINT: Record<GuestDiningDurationSeq, string> = {
  [GUEST_SHOW_DINING_DURATION_SEQ]: "勾选产线在订单下单后展示用餐时长。",
  [GUEST_DINING_DURATION_COUNTDOWN_SEQ]: "勾选产线将用餐时长以倒计时方式展示（未勾选产线为正计时）。",
  [GUEST_DINING_REMAINING_ALERT_SEQ]: "勾选产线在剩余用餐时长达到阈值时弹出提示（阈值配置见业务规则）。",
  [GUEST_DINING_BLOCK_ORDER_AFTER_ALERT_SEQ]: "勾选产线在用餐剩余时长提示后禁止食客自助下单。",
};

const migratedToggleSeqs = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isDiningDurationSeq(seq: number): seq is GuestDiningDurationSeq {
  return (GUEST_DINING_DURATION_SEQS as readonly number[]).includes(seq);
}

function linesStorageId(seq: GuestDiningDurationSeq): string {
  return `${seq}-guest-dining-duration-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestDiningDurationToggleMigrated(seq: number): void {
  if (!isDiningDurationSeq(seq)) return;
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) {
      return;
    }
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

function ensureAllGuestDiningDurationTogglesMigrated(): void {
  for (const seq of GUEST_DINING_DURATION_SEQS) {
    ensureGuestDiningDurationToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): GuestDiningDurationProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(EMENU_LINE_ID) ? [EMENU_LINE_ID] : [];
}

export function readGuestDiningDurationLines(seq: GuestDiningDurationSeq): GuestDiningDurationProductLineId[] {
  ensureGuestDiningDurationToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    writeGuestDiningDurationLines(seq, [EMENU_LINE_ID]);
    return [EMENU_LINE_ID];
  }
  return [];
}

export function writeGuestDiningDurationLines(
  seq: GuestDiningDurationSeq,
  lines: GuestDiningDurationProductLineId[],
): void {
  const enabled = lines.includes(EMENU_LINE_ID);
  writeModuleSettingJson(linesStorageId(seq), enabled ? [EMENU_LINE_ID] : []);
}

export function isGuestDiningDurationSeq(seq: number): boolean {
  return isDiningDurationSeq(seq);
}

function renderLinesMultiselectHtml(seq: GuestDiningDurationSeq, enabled: boolean): string {
  const selected = new Set(readGuestDiningDurationLines(seq));
  const cells = GUEST_DINING_DURATION_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-dining-duration-line="${escapeHtml(line.id)}"
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
      data-guest-dining-duration-lines="${seq}"
      role="group"
      aria-label="用餐时长设置适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestDiningDurationPanelHtml(seq: GuestDiningDurationSeq, on: boolean): string {
  const hidden = on ? "" : "hidden";
  const hint = SEQ_PANEL_HINT[seq];
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-dining-duration-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(hint)}</p>
    </div>`;
}

export function setGuestDiningDurationPanelVisible(seq: number, visible: boolean): void {
  if (!isDiningDurationSeq(seq)) return;
  document.querySelectorAll<HTMLElement>(`[data-guest-dining-duration-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-dining-duration-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(
  group: HTMLElement,
  seq: GuestDiningDurationSeq,
): GuestDiningDurationProductLineId[] {
  const lines: GuestDiningDurationProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-dining-duration-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-dining-duration-line");
    if (id === EMENU_LINE_ID) {
      lines.push(EMENU_LINE_ID);
    }
  });
  writeGuestDiningDurationLines(seq, lines);
  return lines;
}

export function bindGuestDiningDurationUi(root: ParentNode = document): void {
  ensureAllGuestDiningDurationTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-dining-duration-lines]").forEach((group) => {
    if (group.dataset.guestDiningDurationBound === "1") return;
    const seq = Number(group.getAttribute("data-guest-dining-duration-lines"));
    if (!isDiningDurationSeq(seq)) return;
    group.dataset.guestDiningDurationBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-dining-duration-line]")) return;
      collectLinesFromGroup(group, seq);
    });
  });
}
