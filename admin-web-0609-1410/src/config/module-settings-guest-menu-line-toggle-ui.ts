/**
 * 前厅 · 食客端·首页与版式：主开关 + 适用产线多选
 * — 611 展示开始按钮（eMenu）
 * — 509 展示账户积分（eMenu / Kiosk / SDI / Online Order / CDS）
 * — 600 纯展示模式（eMenu / SDI）
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_START_BUTTON_SEQ = 611;
export const GUEST_MENU_ACCOUNT_POINTS_SEQ = 509;
export const GUEST_MENU_PURE_DISPLAY_SEQ = 600;

export const GUEST_MENU_LINE_TOGGLE_SEQS: readonly number[] = [
  GUEST_MENU_START_BUTTON_SEQ,
  GUEST_MENU_ACCOUNT_POINTS_SEQ,
  GUEST_MENU_PURE_DISPLAY_SEQ,
];

type GuestMenuLineToggleSeq = (typeof GUEST_MENU_LINE_TOGGLE_SEQS)[number];

type ProductLineDef = { readonly id: string; readonly label: string };

const EMENU_SDI_LINES: ProductLineDef[] = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
];

const ACCOUNT_POINTS_LINES: ProductLineDef[] = [
  { id: "emenu", label: "eMenu" },
  { id: "kiosk", label: "Kiosk" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
  { id: "cds", label: "CDS" },
];

const CONFIG_BY_SEQ: Record<
  GuestMenuLineToggleSeq,
  { lines: ProductLineDef[]; linesStorageId: string; linesAriaLabel: string; panelHint: string }
> = {
  [GUEST_MENU_START_BUTTON_SEQ]: {
    lines: [{ id: "emenu", label: "eMenu" }],
    linesStorageId: "611-guest-menu-start-button-lines",
    linesAriaLabel: "展示开始按钮适用产线",
    panelHint: "勾选产线后，在首页展示「开始点单」入口。",
  },
  [GUEST_MENU_ACCOUNT_POINTS_SEQ]: {
    lines: ACCOUNT_POINTS_LINES,
    linesStorageId: "509-show-account-points-lines",
    linesAriaLabel: "展示账户积分适用产线",
    panelHint: "勾选产线在食客端展示会员账户积分余额。",
  },
  [GUEST_MENU_PURE_DISPLAY_SEQ]: {
    lines: EMENU_SDI_LINES,
    linesStorageId: "600-guest-menu-pure-display-lines",
    linesAriaLabel: "纯展示模式适用产线",
    panelHint: "勾选产线后，菜单为纯展示（不可加购）。",
  },
};

/** 509 旧版 MEMBER_LOGIN 产线键迁移 */
const LEGACY_ACCOUNT_POINTS_LINE_ALIASES: Record<string, string> = {
  pos: "kiosk",
  paypad: "emenu",
  payPad: "emenu",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedToggleSeqs = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSeqInGuestMenuLineToggleGroup(seq: number): seq is GuestMenuLineToggleSeq {
  return (GUEST_MENU_LINE_TOGGLE_SEQS as readonly number[]).includes(seq);
}

function getConfig(seq: GuestMenuLineToggleSeq) {
  return CONFIG_BY_SEQ[seq];
}

function allLineIds(seq: GuestMenuLineToggleSeq): string[] {
  return getConfig(seq).lines.map((l) => l.id);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestMenuLineToggleMigrated(seq: number): void {
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  if (!isSeqInGuestMenuLineToggleGroup(seq)) return;
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

function normalizeLineIds(seq: GuestMenuLineToggleSeq, raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set(allLineIds(seq));
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    let id = item;
    if (seq === GUEST_MENU_ACCOUNT_POINTS_SEQ && !valid.has(id)) {
      id = LEGACY_ACCOUNT_POINTS_LINE_ALIASES[item] ?? id;
    }
    if (valid.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function readGuestMenuLineToggleLines(seq: number): string[] {
  if (!isSeqInGuestMenuLineToggleGroup(seq)) return [];
  ensureGuestMenuLineToggleMigrated(seq);
  const { linesStorageId } = getConfig(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId, null);
  const normalized = normalizeLineIds(seq, stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = allLineIds(seq);
    writeGuestMenuLineToggleLines(seq, all);
    return all;
  }
  return [];
}

export function writeGuestMenuLineToggleLines(seq: number, lines: string[]): void {
  if (!isSeqInGuestMenuLineToggleGroup(seq)) return;
  const valid = new Set(allLineIds(seq));
  const unique = allLineIds(seq).filter((id) => lines.includes(id) && valid.has(id));
  writeModuleSettingJson(getConfig(seq).linesStorageId, unique);
}

export function isGuestMenuLineToggleSeq(seq: number): boolean {
  return isSeqInGuestMenuLineToggleGroup(seq);
}

export function ensureGuestMenuLineToggleLinesDefault(seq: number): void {
  if (!isSeqInGuestMenuLineToggleGroup(seq)) return;
  if (readGuestMenuLineToggleLines(seq).length === 0) {
    writeGuestMenuLineToggleLines(seq, allLineIds(seq));
  }
}

function renderLinesMultiselectHtml(seq: GuestMenuLineToggleSeq, enabled: boolean): string {
  const cfg = getConfig(seq);
  const selected = new Set(readGuestMenuLineToggleLines(seq));
  const cells = cfg.lines.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    const widthClass = cfg.lines.length <= 2 ? "sm:px-8" : "sm:px-2";
    return `
      <label
        class="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 px-1.5 py-3 text-sm text-foreground ${widthClass} ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-menu-line-toggle-line="${seq}"
          data-line-id="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const maxW = cfg.lines.length > 3 ? "max-w-2xl" : "max-w-md";

  return `
    <div
      class="flex w-full ${maxW} overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-menu-line-toggle-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(cfg.linesAriaLabel)}"
    >
      ${cells}
    </div>`;
}

export function renderGuestMenuLineTogglePanelHtml(seq: number, on: boolean): string {
  if (!isSeqInGuestMenuLineToggleGroup(seq)) return "";
  const cfg = getConfig(seq);
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-menu-line-toggle-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(cfg.panelHint)}</p>
    </div>`;
}

export function setGuestMenuLineTogglePanelVisible(seq: number, visible: boolean): void {
  if (!isSeqInGuestMenuLineToggleGroup(seq)) return;
  document.querySelectorAll<HTMLElement>(`[data-guest-menu-line-toggle-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-menu-line-toggle-line]").forEach((input) => {
      if (Number(input.getAttribute("data-guest-menu-line-toggle-line")) !== seq) return;
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): string[] {
  const seq = Number(group.getAttribute("data-guest-menu-line-toggle-lines"));
  if (!isGuestMenuLineToggleSeq(seq)) return [];

  const lines: string[] = [];
  group.querySelectorAll<HTMLInputElement>(`[data-guest-menu-line-toggle-line="${seq}"]:checked`).forEach((input) => {
    const id = input.getAttribute("data-line-id");
    if (id && allLineIds(seq).includes(id)) lines.push(id);
  });
  writeGuestMenuLineToggleLines(seq, lines);
  return lines;
}

export function bindGuestMenuLineToggleUi(root: ParentNode = document): void {
  for (const seq of GUEST_MENU_LINE_TOGGLE_SEQS) {
    ensureGuestMenuLineToggleMigrated(seq);
  }
  root.querySelectorAll<HTMLElement>("[data-guest-menu-line-toggle-lines]").forEach((group) => {
    if (group.dataset.guestMenuLineToggleBound === "1") return;
    group.dataset.guestMenuLineToggleBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-menu-line-toggle-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
