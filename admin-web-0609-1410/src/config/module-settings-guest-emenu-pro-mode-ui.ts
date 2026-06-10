/**
 * 前厅 · 食客端·首页与版式：seq 604 eMenu Pro 模式
 * （主开关 + eMenu 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_EMENU_PRO_MODE_SEQ = 604;

const LINES_STORAGE_ID = "604-emenu-pro-mode-lines";

export const GUEST_EMENU_PRO_MODE_PRODUCT_LINES = [{ id: "emenu", label: "eMenu" }] as const;

export type GuestEmenuProModeProductLineId =
  (typeof GUEST_EMENU_PRO_MODE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestEmenuProModeProductLineId[] =
  GUEST_EMENU_PRO_MODE_PRODUCT_LINES.map((l) => l.id);

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
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_EMENU_PRO_MODE_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestEmenuProModeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_EMENU_PRO_MODE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_EMENU_PRO_MODE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): GuestEmenuProModeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestEmenuProModeProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readGuestEmenuProModeLines(): GuestEmenuProModeProductLineId[] {
  ensureGuestEmenuProModeToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) {
    if (Array.isArray(stored) && normalized.length !== stored.length) {
      writeGuestEmenuProModeLines(normalized);
    }
    return normalized;
  }

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeGuestEmenuProModeLines(all);
    return all;
  }
  return [];
}

export function writeGuestEmenuProModeLines(lines: GuestEmenuProModeProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function ensureGuestEmenuProModeLinesDefault(): void {
  if (readGuestEmenuProModeLines().length === 0) {
    writeGuestEmenuProModeLines([...ALL_LINE_IDS]);
  }
}

export function isGuestEmenuProModeSeq(seq: number): boolean {
  return seq === GUEST_EMENU_PRO_MODE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestEmenuProModeLines());
  const cells = GUEST_EMENU_PRO_MODE_PRODUCT_LINES.map((line, index) => {
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
          data-guest-emenu-pro-mode-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-emenu-pro-mode-lines="${GUEST_EMENU_PRO_MODE_SEQ}"
      role="group"
      aria-label="eMenu Pro 模式适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestEmenuProModePanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl ${hidden}"
      data-guest-emenu-pro-mode-panel="${GUEST_EMENU_PRO_MODE_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        勾选 eMenu 产线后，菜单页以 eMenu Pro 高级设计稿形式展示（未勾选时使用普通菜单）。
      </p>
    </div>`;
}

export function setGuestEmenuProModePanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-guest-emenu-pro-mode-panel="${GUEST_EMENU_PRO_MODE_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-guest-emenu-pro-mode-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): GuestEmenuProModeProductLineId[] {
  const lines: GuestEmenuProModeProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-emenu-pro-mode-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-emenu-pro-mode-line");
    if (id && ALL_LINE_IDS.includes(id as GuestEmenuProModeProductLineId)) {
      lines.push(id as GuestEmenuProModeProductLineId);
    }
  });
  writeGuestEmenuProModeLines(lines);
  return lines;
}

export function bindGuestEmenuProModeUi(root: ParentNode = document): void {
  ensureGuestEmenuProModeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-emenu-pro-mode-lines]").forEach((group) => {
    if (group.dataset.guestEmenuProModeBound === "1") return;
    group.dataset.guestEmenuProModeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-emenu-pro-mode-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
