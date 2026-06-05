/**
 * 前厅 · 食客端·首页与版式：seq 602 菜单分类模式（主开关 + eMenu / SDI 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_CLASSIFICATION_MODE_SEQ = 602;

const LINES_STORAGE_ID = "602-menu-classification-mode-lines";

export const GUEST_MENU_CLASSIFICATION_MODE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestMenuClassificationModeProductLineId =
  (typeof GUEST_MENU_CLASSIFICATION_MODE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuClassificationModeProductLineId[] =
  GUEST_MENU_CLASSIFICATION_MODE_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_CLASSIFICATION_MODE_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestMenuClassificationModeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_CLASSIFICATION_MODE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_MENU_CLASSIFICATION_MODE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): GuestMenuClassificationModeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuClassificationModeProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readGuestMenuClassificationModeLines(): GuestMenuClassificationModeProductLineId[] {
  ensureGuestMenuClassificationModeToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestMenuClassificationModeLines(all);
    return all;
  }
  return [];
}

export function writeGuestMenuClassificationModeLines(
  lines: GuestMenuClassificationModeProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isGuestMenuClassificationModeSeq(seq: number): boolean {
  return seq === GUEST_MENU_CLASSIFICATION_MODE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestMenuClassificationModeLines());
  const cells = GUEST_MENU_CLASSIFICATION_MODE_PRODUCT_LINES.map((line, index) => {
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
          data-guest-menu-classification-mode-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-menu-classification-mode-lines="${GUEST_MENU_CLASSIFICATION_MODE_SEQ}"
      role="group"
      aria-label="菜单分类模式适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestMenuClassificationModePanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-menu-classification-mode-panel="${GUEST_MENU_CLASSIFICATION_MODE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        开启后，食客先按菜单分类浏览再选菜（非普通扁平菜单）；与「品类模式」不同，本项按菜单树分类层级展示。
      </p>
    </div>`;
}

export function setGuestMenuClassificationModePanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(
      `[data-guest-menu-classification-mode-panel="${GUEST_MENU_CLASSIFICATION_MODE_SEQ}"]`,
    )
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-guest-menu-classification-mode-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): GuestMenuClassificationModeProductLineId[] {
  const lines: GuestMenuClassificationModeProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-menu-classification-mode-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-menu-classification-mode-line");
    if (id && ALL_LINE_IDS.includes(id as GuestMenuClassificationModeProductLineId)) {
      lines.push(id as GuestMenuClassificationModeProductLineId);
    }
  });
  writeGuestMenuClassificationModeLines(lines);
  return lines;
}

export function bindGuestMenuClassificationModeUi(root: ParentNode = document): void {
  ensureGuestMenuClassificationModeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-menu-classification-mode-lines]").forEach((group) => {
    if (group.dataset.guestMenuClassificationModeBound === "1") return;
    group.dataset.guestMenuClassificationModeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-menu-classification-mode-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
