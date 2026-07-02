/**
 * 前厅 · 菜单查找与时段：主开关 + POS / POS GO / PayPad 产线多选
 * — 118 搜索菜单
 * — 148 比价功能模式
 * — 176 按时段显示菜单:堂吃菜单
 * — 177 按时段显示菜单:外食菜单
 * — 348 按照时段显示菜单
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const MENU_SEARCH_SEQ = 118;
export const PRICE_COMPARE_MODE_SEQ = 148;
export const TIMED_MENU_DINEIN_SEQ = 176;
export const TIMED_MENU_TAKEOUT_SEQ = 177;
export const TIMED_MENU_DISPLAY_SEQ = 348;

export const POS_MENU_SCOPE_LINES_SEQS = [
  MENU_SEARCH_SEQ,
  PRICE_COMPARE_MODE_SEQ,
  TIMED_MENU_DINEIN_SEQ,
  TIMED_MENU_TAKEOUT_SEQ,
  TIMED_MENU_DISPLAY_SEQ,
] as const;

export type PosMenuScopeLinesSeq = (typeof POS_MENU_SCOPE_LINES_SEQS)[number];

export const POS_MENU_SCOPE_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosMenuScopeProductLineId = (typeof POS_MENU_SCOPE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosMenuScopeProductLineId[] = POS_MENU_SCOPE_PRODUCT_LINES.map((l) => l.id);

const LINES_STORAGE_ID_BY_SEQ: Record<PosMenuScopeLinesSeq, string> = {
  [MENU_SEARCH_SEQ]: "118-menu-search-lines",
  [PRICE_COMPARE_MODE_SEQ]: "148-price-compare-mode-lines",
  [TIMED_MENU_DINEIN_SEQ]: "176-timed-menu-dinein-lines",
  [TIMED_MENU_TAKEOUT_SEQ]: "177-timed-menu-takeout-lines",
  [TIMED_MENU_DISPLAY_SEQ]: "348-timed-menu-display-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosMenuScopeLinesSeq, string> = {
  [MENU_SEARCH_SEQ]: "搜索菜单适用产线",
  [PRICE_COMPARE_MODE_SEQ]: "比价功能模式适用产线",
  [TIMED_MENU_DINEIN_SEQ]: "按时段显示堂吃菜单适用产线",
  [TIMED_MENU_TAKEOUT_SEQ]: "按时段显示外食菜单适用产线",
  [TIMED_MENU_DISPLAY_SEQ]: "按照时段显示菜单适用产线",
};

const PANEL_HINT_BY_SEQ: Record<PosMenuScopeLinesSeq, string> = {
  [MENU_SEARCH_SEQ]: "勾选产线后，点单页支持菜单搜索。",
  [PRICE_COMPARE_MODE_SEQ]: "勾选产线后，点单页启用比价功能模式。",
  [TIMED_MENU_DINEIN_SEQ]: "勾选产线后，堂吃订单按时段切换菜单。",
  [TIMED_MENU_TAKEOUT_SEQ]: "勾选产线后，外食订单按时段切换菜单。",
  [TIMED_MENU_DISPLAY_SEQ]: "勾选产线后，按配置时段展示对应菜单。",
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

function normalizeLineIds(raw: unknown): PosMenuScopeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosMenuScopeProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosMenuScopeLines(seq: PosMenuScopeLinesSeq): PosMenuScopeProductLineId[] {
  ensurePosMenuScopeToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosMenuScopeLines(seq, all);
    return all;
  }
  return [];
}

export function writePosMenuScopeLines(
  seq: PosMenuScopeLinesSeq,
  lines: PosMenuScopeProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function ensurePosMenuScopeLinesDefault(seq: PosMenuScopeLinesSeq): void {
  if (readPosMenuScopeLines(seq).length === 0) {
    writePosMenuScopeLines(seq, [...ALL_LINE_IDS]);
  }
}

export function isPosMenuScopeLinesSeq(seq: number): seq is PosMenuScopeLinesSeq {
  return isSeqInGroup(seq);
}

function renderLinesMultiselectHtml(seq: PosMenuScopeLinesSeq, enabled: boolean): string {
  const selected = new Set(readPosMenuScopeLines(seq));
  const cells = POS_MENU_SCOPE_PRODUCT_LINES.map((line, index) => {
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
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
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
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(PANEL_HINT_BY_SEQ[seq])}</p>
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
  const lines: PosMenuScopeProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-menu-scope-line][data-pos-menu-scope-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-menu-scope-line");
      if (id && ALL_LINE_IDS.includes(id as PosMenuScopeProductLineId)) {
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
