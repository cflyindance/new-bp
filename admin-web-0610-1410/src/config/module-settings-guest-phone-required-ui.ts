/**
 * 前厅 · 食客端·下单与规则：seq 505 手机号必填（主开关 + Kiosk 产线多选；与 504 展示页配套）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_PHONE_REQUIRED_SEQ = 505;

const LINES_STORAGE_ID = "505-phone-required-lines";

export const GUEST_PHONE_REQUIRED_PRODUCT_LINES = [{ id: "kiosk", label: "Kiosk" }] as const;

export type GuestPhoneRequiredProductLineId =
  (typeof GUEST_PHONE_REQUIRED_PRODUCT_LINES)[number]["id"];

const KIOSK_LINE_ID: GuestPhoneRequiredProductLineId = "kiosk";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(GUEST_PHONE_REQUIRED_SEQ)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): GuestPhoneRequiredProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(KIOSK_LINE_ID) ? [KIOSK_LINE_ID] : [];
}

export function readGuestPhoneRequiredLines(): GuestPhoneRequiredProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    writeGuestPhoneRequiredLines([KIOSK_LINE_ID]);
    return [KIOSK_LINE_ID];
  }
  return [];
}

export function writeGuestPhoneRequiredLines(lines: GuestPhoneRequiredProductLineId[]): void {
  const enabled = lines.includes(KIOSK_LINE_ID);
  writeModuleSettingJson(LINES_STORAGE_ID, enabled ? [KIOSK_LINE_ID] : []);
}

export function isGuestPhoneRequiredSeq(seq: number): boolean {
  return seq === GUEST_PHONE_REQUIRED_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestPhoneRequiredLines());
  const cells = GUEST_PHONE_REQUIRED_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-phone-required-line="${escapeHtml(line.id)}"
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
      data-guest-phone-required-lines="${GUEST_PHONE_REQUIRED_SEQ}"
      role="group"
      aria-label="手机号必填适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestPhoneRequiredPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-phone-required-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        勾选产线在输入手机号页面要求手机号必填（取餐联络等；须与 seq 504 展示页同轨）。
      </p>
    </div>`;
}

export function setGuestPhoneRequiredPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-guest-phone-required-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-phone-required-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): GuestPhoneRequiredProductLineId[] {
  const lines: GuestPhoneRequiredProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-phone-required-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-phone-required-line");
    if (id === KIOSK_LINE_ID) {
      lines.push(KIOSK_LINE_ID);
    }
  });
  writeGuestPhoneRequiredLines(lines);
  return lines;
}

export function bindGuestPhoneRequiredUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-guest-phone-required-lines]").forEach((group) => {
    if (group.dataset.guestPhoneRequiredBound === "1") return;
    group.dataset.guestPhoneRequiredBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-phone-required-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
