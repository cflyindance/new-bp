/**
 * 前厅 · 食客端·首页与版式：seq 606 展示菜单类名称（主开关 + Kiosk / eMenu / SDI / Online Order 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_CLASS_NAME_DISPLAY_SEQ = 606;

const LINES_STORAGE_ID = "606-menu-class-name-display-lines";

export const GUEST_MENU_CLASS_NAME_DISPLAY_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type GuestMenuClassNameDisplayProductLineId =
  (typeof GUEST_MENU_CLASS_NAME_DISPLAY_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuClassNameDisplayProductLineId[] =
  GUEST_MENU_CLASS_NAME_DISPLAY_PRODUCT_LINES.map((l) => l.id);

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
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_CLASS_NAME_DISPLAY_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestMenuClassNameDisplayToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_MENU_CLASS_NAME_DISPLAY_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_MENU_CLASS_NAME_DISPLAY_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): GuestMenuClassNameDisplayProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuClassNameDisplayProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readGuestMenuClassNameDisplayLines(): GuestMenuClassNameDisplayProductLineId[] {
  ensureGuestMenuClassNameDisplayToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestMenuClassNameDisplayLines(all);
    return all;
  }
  return [];
}

export function writeGuestMenuClassNameDisplayLines(
  lines: GuestMenuClassNameDisplayProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isGuestMenuClassNameDisplaySeq(seq: number): boolean {
  return seq === GUEST_MENU_CLASS_NAME_DISPLAY_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestMenuClassNameDisplayLines());
  const cells = GUEST_MENU_CLASS_NAME_DISPLAY_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 px-1.5 py-3 text-sm text-foreground sm:px-2 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-menu-class-name-display-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-menu-class-name-display-lines="${GUEST_MENU_CLASS_NAME_DISPLAY_SEQ}"
      role="group"
      aria-label="展示菜单类名称适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestMenuClassNameDisplayPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-menu-class-name-display-panel="${GUEST_MENU_CLASS_NAME_DISPLAY_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setGuestMenuClassNameDisplayPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(
      `[data-guest-menu-class-name-display-panel="${GUEST_MENU_CLASS_NAME_DISPLAY_SEQ}"]`,
    )
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-guest-menu-class-name-display-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): GuestMenuClassNameDisplayProductLineId[] {
  const lines: GuestMenuClassNameDisplayProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-menu-class-name-display-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-menu-class-name-display-line");
    if (id && ALL_LINE_IDS.includes(id as GuestMenuClassNameDisplayProductLineId)) {
      lines.push(id as GuestMenuClassNameDisplayProductLineId);
    }
  });
  writeGuestMenuClassNameDisplayLines(lines);
  return lines;
}

export function bindGuestMenuClassNameDisplayUi(root: ParentNode = document): void {
  ensureGuestMenuClassNameDisplayToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-menu-class-name-display-lines]").forEach((group) => {
    if (group.dataset.guestMenuClassNameDisplayBound === "1") return;
    group.dataset.guestMenuClassNameDisplayBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-menu-class-name-display-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
