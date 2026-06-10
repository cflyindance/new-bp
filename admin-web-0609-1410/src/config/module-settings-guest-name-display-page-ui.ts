/**
 * 前厅 · 食客端·下单与规则：食客端姓名输入页（主开关 + Kiosk 产线）
 * — 506 输入姓名（展示输入姓名页）、507 姓名必填。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_NAME_DISPLAY_PAGE_SEQ = 506;
export const GUEST_NAME_REQUIRED_SEQ = 507;

export const GUEST_NAME_PAGE_SEQS: readonly number[] = [
  GUEST_NAME_DISPLAY_PAGE_SEQ,
  GUEST_NAME_REQUIRED_SEQ,
];

const KIOSK_FLOW_PAGE_PRODUCT_LINES = [{ id: "kiosk", label: "Kiosk" }] as const;

export type GuestNamePageProductLineId = (typeof KIOSK_FLOW_PAGE_PRODUCT_LINES)[number]["id"];

const KIOSK_LINE_ID: GuestNamePageProductLineId = "kiosk";

const LINES_ARIA_LABEL_BY_SEQ: Record<number, string> = {
  [GUEST_NAME_DISPLAY_PAGE_SEQ]: "输入姓名页适用产线",
  [GUEST_NAME_REQUIRED_SEQ]: "姓名必填适用产线",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedSeqs = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linesStorageId(seq: number): string {
  return `${seq}-guest-name-page-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestNamePageToggleMigrated(seq: number): void {
  if (migratedSeqs.has(seq)) return;
  migratedSeqs.add(seq);
  if (!isGuestNamePageSeq(seq)) return;
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

function ensureAllGuestNamePageTogglesMigrated(): void {
  for (const seq of GUEST_NAME_PAGE_SEQS) {
    ensureGuestNamePageToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): GuestNamePageProductLineId[] {
  if (!Array.isArray(raw)) return [];
  if (raw.includes(KIOSK_LINE_ID)) return [KIOSK_LINE_ID];
  const legacyKioskAliases = new Set(["kiosk", "pos", "emenu", "paypad", "payPad"]);
  if (raw.some((id) => typeof id === "string" && legacyKioskAliases.has(id))) {
    return [KIOSK_LINE_ID];
  }
  return [];
}

export function readGuestNamePageLines(seq: number): GuestNamePageProductLineId[] {
  if (!isGuestNamePageSeq(seq)) return [];
  ensureGuestNamePageToggleMigrated(seq);

  let stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  if (!stored && seq === GUEST_NAME_REQUIRED_SEQ) {
    stored = readModuleSettingJson<unknown>("507-name-required-lines", null);
  }
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    writeGuestNamePageLines(seq, [KIOSK_LINE_ID]);
    return [KIOSK_LINE_ID];
  }
  return [];
}

export function writeGuestNamePageLines(seq: number, lines: GuestNamePageProductLineId[]): void {
  if (!isGuestNamePageSeq(seq)) return;
  const enabled = lines.includes(KIOSK_LINE_ID);
  writeModuleSettingJson(linesStorageId(seq), enabled ? [KIOSK_LINE_ID] : []);
}

export function isGuestNamePageSeq(seq: number): boolean {
  return (GUEST_NAME_PAGE_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readGuestNamePageLines(seq));
  const cells = KIOSK_FLOW_PAGE_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-name-page-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const ariaLabel = LINES_ARIA_LABEL_BY_SEQ[seq] ?? "适用产线";
  const hint =
    seq === GUEST_NAME_REQUIRED_SEQ
      ? "勾选产线在输入姓名页面要求姓名必填（叫号等）；须与「输入姓名」展示页配套。"
      : "勾选产线展示输入食客姓名页面。";

  return `
    <div
      class="flex w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-name-page-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      ${cells}
    </div>
    <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(hint)}</p>`;
}

export function renderGuestNamePagePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-name-page-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setGuestNamePagePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-guest-name-page-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-name-page-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): GuestNamePageProductLineId[] {
  const seq = Number(group.getAttribute("data-guest-name-page-lines"));
  if (!seq || !isGuestNamePageSeq(seq)) return [];

  const lines: GuestNamePageProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-name-page-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-name-page-line");
    if (id === KIOSK_LINE_ID) {
      lines.push(KIOSK_LINE_ID);
    }
  });
  writeGuestNamePageLines(seq, lines);
  return lines;
}

export function bindGuestNamePageUi(root: ParentNode = document): void {
  ensureAllGuestNamePageTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-name-page-lines]").forEach((group) => {
    if (group.dataset.guestNamePageBound === "1") return;
    group.dataset.guestNamePageBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-name-page-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
