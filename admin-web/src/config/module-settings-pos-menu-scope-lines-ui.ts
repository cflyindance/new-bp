/**
 * 前厅 · 菜单查找与时段：主开关 + 产线多选
 * — 118 搜索菜单（POS / POS GO / PayPad / Kiosk / eMenu / SDI）
 * — 148 比价功能模式（POS / POS GO / PayPad）
 * （348 按照时段显示菜单见 module-settings-timed-menu-display-ui；原 176/177 已合并退役）
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const MENU_SEARCH_SEQ = 118;
export const PRICE_COMPARE_MODE_SEQ = 148;

export const POS_MENU_SCOPE_LINES_SEQS = [
  MENU_SEARCH_SEQ,
  PRICE_COMPARE_MODE_SEQ,
] as const;

export type PosMenuScopeLinesSeq = (typeof POS_MENU_SCOPE_LINES_SEQS)[number];

/** 本组默认产线（除搜索菜单外） */
export const POS_MENU_SCOPE_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

/** 搜索菜单额外产线 */
const MENU_SEARCH_EXTRA_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export const MENU_SEARCH_PRODUCT_LINES = [
  ...POS_MENU_SCOPE_PRODUCT_LINES,
  ...MENU_SEARCH_EXTRA_PRODUCT_LINES,
] as const;

export type PosMenuScopeProductLineId =
  | (typeof POS_MENU_SCOPE_PRODUCT_LINES)[number]["id"]
  | (typeof MENU_SEARCH_EXTRA_PRODUCT_LINES)[number]["id"];

type PosMenuScopeProductLine = { id: PosMenuScopeProductLineId; label: string };

function productLinesForSeq(seq: PosMenuScopeLinesSeq): readonly PosMenuScopeProductLine[] {
  return seq === MENU_SEARCH_SEQ ? MENU_SEARCH_PRODUCT_LINES : POS_MENU_SCOPE_PRODUCT_LINES;
}

function allLineIdsForSeq(seq: PosMenuScopeLinesSeq): PosMenuScopeProductLineId[] {
  return productLinesForSeq(seq).map((l) => l.id);
}

const LINES_STORAGE_ID_BY_SEQ: Record<PosMenuScopeLinesSeq, string> = {
  [MENU_SEARCH_SEQ]: "118-menu-search-lines",
  [PRICE_COMPARE_MODE_SEQ]: "148-price-compare-mode-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosMenuScopeLinesSeq, string> = {
  [MENU_SEARCH_SEQ]: "搜索菜单适用产线",
  [PRICE_COMPARE_MODE_SEQ]: "比价功能模式适用产线",
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

function isSeqInGroup(seq: number): seq is PosMenuScopeLinesSeq {
  return (POS_MENU_SCOPE_LINES_SEQS as readonly number[]).includes(seq);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensurePosMenuScopeToggleMigrated(seq: number): void {
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  if (!isSeqInGroup(seq)) return;
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

function normalizeLineIds(
  seq: PosMenuScopeLinesSeq,
  raw: unknown,
): PosMenuScopeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(allLineIdsForSeq(seq));
  return raw.filter(
    (id): id is PosMenuScopeProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosMenuScopeLines(seq: PosMenuScopeLinesSeq): PosMenuScopeProductLineId[] {
  ensurePosMenuScopeToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(seq, stored);
  if (normalized.length > 0) {
    if (Array.isArray(stored) && normalized.length !== stored.length) {
      writePosMenuScopeLines(seq, normalized);
    }
    return normalized;
  }

  if (readLegacyToggleOn(seq)) {
    const all = allLineIdsForSeq(seq);
    writePosMenuScopeLines(seq, all);
    return all;
  }
  return [];
}

export function writePosMenuScopeLines(
  seq: PosMenuScopeLinesSeq,
  lines: PosMenuScopeProductLineId[],
): void {
  const allowed = allLineIdsForSeq(seq);
  const unique = allowed.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function ensurePosMenuScopeLinesDefault(seq: PosMenuScopeLinesSeq): void {
  if (readPosMenuScopeLines(seq).length === 0) {
    writePosMenuScopeLines(seq, allLineIdsForSeq(seq));
  }
}

export function isPosMenuScopeLinesSeq(seq: number): seq is PosMenuScopeLinesSeq {
  return isSeqInGroup(seq);
}

function renderLinesMultiselectHtml(seq: PosMenuScopeLinesSeq, enabled: boolean): string {
  const selected = new Set(readPosMenuScopeLines(seq));
  const lines = productLinesForSeq(seq);
  const cells = lines
    .map((line, index) => {
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
          data-pos-menu-scope-line="${escapeHtml(line.id)}"
          data-pos-menu-scope-lines-seq="${seq}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
    })
    .join("");

  const maxWidth = seq === MENU_SEARCH_SEQ ? "max-w-3xl" : "max-w-xl";
  return `
    <div
      class="flex w-full ${maxWidth} overflow-hidden rounded-md border border-border bg-muted/40"
      data-pos-menu-scope-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(LINES_GROUP_ARIA_BY_SEQ[seq])}"
    >
      ${cells}
    </div>`;
}

export function renderPosMenuScopeLinesPanelHtml(seq: PosMenuScopeLinesSeq, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-menu-scope-lines-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setPosMenuScopeLinesPanelVisible(seq: PosMenuScopeLinesSeq, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-pos-menu-scope-lines-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-pos-menu-scope-line]").forEach((input) => {
      if (Number(input.getAttribute("data-pos-menu-scope-lines-seq")) !== seq) return;
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
  seq: PosMenuScopeLinesSeq,
): PosMenuScopeProductLineId[] {
  const allowed = new Set(allLineIdsForSeq(seq));
  const lines: PosMenuScopeProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-menu-scope-line][data-pos-menu-scope-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-menu-scope-line");
      if (id && allowed.has(id as PosMenuScopeProductLineId)) {
        lines.push(id as PosMenuScopeProductLineId);
      }
    });
  writePosMenuScopeLines(seq, lines);
  return lines;
}

export function bindPosMenuScopeLinesUi(root: ParentNode = document): void {
  for (const seq of POS_MENU_SCOPE_LINES_SEQS) {
    ensurePosMenuScopeToggleMigrated(seq);
  }
  root.querySelectorAll<HTMLElement>("[data-pos-menu-scope-lines]").forEach((group) => {
    if (group.dataset.posMenuScopeLinesBound === "1") return;
    group.dataset.posMenuScopeLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-menu-scope-line]")) return;
      const seqRaw = el.getAttribute("data-pos-menu-scope-lines-seq");
      const seq = Number(seqRaw);
      if (!isPosMenuScopeLinesSeq(seq)) return;
      collectLinesFromGroup(group, seq);
    });
  });
}
