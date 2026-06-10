/**
 * 前厅 · 品类模式相关设置（主开关 + 产线多选）：
 * — 601 食客端·首页与版式 · 品类模式（eMenu、SDI）；
 * — 571 品类先下单（eMenu、SDI）、627 下单前允许食客切换品类（eMenu）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_CATEGORY_MODE_SEQ = 601;
export const GUEST_CATEGORY_ORDER_FIRST_SEQ = 571;
export const GUEST_CATEGORY_SWITCH_BEFORE_ORDER_SEQ = 627;

export const GUEST_CATEGORY_MODE_SEQS: readonly number[] = [
  GUEST_MENU_CATEGORY_MODE_SEQ,
  GUEST_CATEGORY_ORDER_FIRST_SEQ,
  GUEST_CATEGORY_SWITCH_BEFORE_ORDER_SEQ,
];

const EMENU_SDI_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

const EMENU_ONLY_PRODUCT_LINES = [{ id: "emenu", label: "eMenu" }] as const;

const PRODUCT_LINES_BY_SEQ: Record<
  number,
  readonly { id: string; label: string }[]
> = {
  [GUEST_MENU_CATEGORY_MODE_SEQ]: EMENU_SDI_PRODUCT_LINES,
  [GUEST_CATEGORY_ORDER_FIRST_SEQ]: EMENU_SDI_PRODUCT_LINES,
  [GUEST_CATEGORY_SWITCH_BEFORE_ORDER_SEQ]: EMENU_ONLY_PRODUCT_LINES,
};

export type GuestCategoryModeProductLineId = "emenu" | "sdi";

function productLinesForSeq(seq: number): readonly { id: string; label: string }[] {
  return PRODUCT_LINES_BY_SEQ[seq] ?? EMENU_ONLY_PRODUCT_LINES;
}

function allLineIdsForSeq(seq: number): GuestCategoryModeProductLineId[] {
  return productLinesForSeq(seq)
    .map((l) => l.id)
    .filter((id): id is GuestCategoryModeProductLineId => id === "emenu" || id === "sdi");
}

const LINES_ARIA_LABEL_BY_SEQ: Record<number, string> = {
  [GUEST_MENU_CATEGORY_MODE_SEQ]: "品类模式适用产线",
  [GUEST_CATEGORY_ORDER_FIRST_SEQ]: "品类先下单适用产线",
  [GUEST_CATEGORY_SWITCH_BEFORE_ORDER_SEQ]: "下单前允许食客切换品类适用产线",
};

const PANEL_HINT_BY_SEQ: Partial<Record<number, string>> = {
  [GUEST_MENU_CATEGORY_MODE_SEQ]:
    "开启后，食客先按品类分类浏览再选菜（非普通扁平菜单）；仅对勾选产线生效。",
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
  return `${seq}-guest-category-mode-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestCategoryModeToggleMigrated(seq: number): void {
  if (migratedSeqs.has(seq)) return;
  migratedSeqs.add(seq);
  if (!isGuestCategoryModeSeq(seq)) return;
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

function ensureAllGuestCategoryModeTogglesMigrated(): void {
  for (const seq of GUEST_CATEGORY_MODE_SEQS) {
    ensureGuestCategoryModeToggleMigrated(seq);
  }
}

function normalizeLineIds(seq: number, raw: unknown): GuestCategoryModeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set(allLineIdsForSeq(seq));
  return raw.filter(
    (id): id is GuestCategoryModeProductLineId =>
      typeof id === "string" && valid.has(id as GuestCategoryModeProductLineId),
  );
}

export function readGuestCategoryModeLines(seq: number): GuestCategoryModeProductLineId[] {
  if (!isGuestCategoryModeSeq(seq)) return [];
  ensureGuestCategoryModeToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(seq, stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const defaults: GuestCategoryModeProductLineId[] =
      seq === GUEST_MENU_CATEGORY_MODE_SEQ ? ["emenu", "sdi"] : ["emenu"];
    writeGuestCategoryModeLines(seq, defaults);
    return defaults;
  }
  return [];
}

export function writeGuestCategoryModeLines(
  seq: number,
  lines: GuestCategoryModeProductLineId[],
): void {
  if (!isGuestCategoryModeSeq(seq)) return;
  const valid = new Set(allLineIdsForSeq(seq));
  const unique = allLineIdsForSeq(seq).filter((id) => lines.includes(id) && valid.has(id));
  writeModuleSettingJson(linesStorageId(seq), unique);
}

export function isGuestCategoryModeSeq(seq: number): boolean {
  return (GUEST_CATEGORY_MODE_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readGuestCategoryModeLines(seq));
  const lines = productLinesForSeq(seq);
  const cells = lines.map((line, index) => {
    const checked = selected.has(line.id as GuestCategoryModeProductLineId);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-category-mode-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const ariaLabel = LINES_ARIA_LABEL_BY_SEQ[seq] ?? "适用产线";
  const widthClass = lines.length > 1 ? "max-w-md" : "max-w-xs";

  return `
    <div
      class="flex w-full ${widthClass} overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-category-mode-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      ${cells}
    </div>`;
}

export function renderGuestCategoryModePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  const hint = PANEL_HINT_BY_SEQ[seq];
  const hintHtml = hint
    ? `<p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(hint)}</p>`
    : "";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-category-mode-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      ${hintHtml}
    </div>`;
}

export function setGuestCategoryModePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-guest-category-mode-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-category-mode-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): GuestCategoryModeProductLineId[] {
  const seq = Number(group.getAttribute("data-guest-category-mode-lines"));
  if (!seq || !isGuestCategoryModeSeq(seq)) return [];

  const valid = new Set(allLineIdsForSeq(seq));
  const lines: GuestCategoryModeProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-category-mode-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-category-mode-line");
    if (id && valid.has(id as GuestCategoryModeProductLineId)) {
      lines.push(id as GuestCategoryModeProductLineId);
    }
  });
  writeGuestCategoryModeLines(seq, lines);
  return lines;
}

export function bindGuestCategoryModeUi(root: ParentNode = document): void {
  ensureAllGuestCategoryModeTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-category-mode-lines]").forEach((group) => {
    if (group.dataset.guestCategoryModeBound === "1") return;
    group.dataset.guestCategoryModeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-category-mode-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
