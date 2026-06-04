/**
 * 前厅 · 食客端·下单与规则：seq 504 展示输入手机号（主开关 + Kiosk 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_PHONE_DISPLAY_PAGE_SEQ = 504;

const LINES_STORAGE_ID = "504-guest-phone-display-page-lines";

export const GUEST_PHONE_DISPLAY_PAGE_PRODUCT_LINES = [{ id: "kiosk", label: "Kiosk" }] as const;

export type GuestPhoneDisplayPageProductLineId =
  (typeof GUEST_PHONE_DISPLAY_PAGE_PRODUCT_LINES)[number]["id"];

const KIOSK_LINE_ID: GuestPhoneDisplayPageProductLineId = "kiosk";

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
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_PHONE_DISPLAY_PAGE_SEQ)) === "1") {
      return true;
    }
    return localStorage.getItem(moduleSettingToggleStorageKey(30)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestPhoneDisplayPageToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_PHONE_DISPLAY_PAGE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_PHONE_DISPLAY_PAGE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): GuestPhoneDisplayPageProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(KIOSK_LINE_ID) ? [KIOSK_LINE_ID] : [];
}

export function readGuestPhoneDisplayPageLines(): GuestPhoneDisplayPageProductLineId[] {
  ensureGuestPhoneDisplayPageToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    writeGuestPhoneDisplayPageLines([KIOSK_LINE_ID]);
    return [KIOSK_LINE_ID];
  }
  return [];
}

export function writeGuestPhoneDisplayPageLines(lines: GuestPhoneDisplayPageProductLineId[]): void {
  const enabled = lines.includes(KIOSK_LINE_ID);
  writeModuleSettingJson(LINES_STORAGE_ID, enabled ? [KIOSK_LINE_ID] : []);
}

export function isGuestPhoneDisplayPageSeq(seq: number): boolean {
  return seq === GUEST_PHONE_DISPLAY_PAGE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestPhoneDisplayPageLines());
  const cells = GUEST_PHONE_DISPLAY_PAGE_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-phone-display-page-line="${escapeHtml(line.id)}"
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
      data-guest-phone-display-page-lines="${GUEST_PHONE_DISPLAY_PAGE_SEQ}"
      role="group"
      aria-label="展示输入手机号适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestPhoneDisplayPagePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-phone-display-page-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setGuestPhoneDisplayPagePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-guest-phone-display-page-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-phone-display-page-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): GuestPhoneDisplayPageProductLineId[] {
  const lines: GuestPhoneDisplayPageProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-phone-display-page-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-phone-display-page-line");
    if (id === KIOSK_LINE_ID) {
      lines.push(KIOSK_LINE_ID);
    }
  });
  writeGuestPhoneDisplayPageLines(lines);
  return lines;
}

export function bindGuestPhoneDisplayPageUi(root: ParentNode = document): void {
  ensureGuestPhoneDisplayPageToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-phone-display-page-lines]").forEach((group) => {
    if (group.dataset.guestPhoneDisplayPageBound === "1") return;
    group.dataset.guestPhoneDisplayPageBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-phone-display-page-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
