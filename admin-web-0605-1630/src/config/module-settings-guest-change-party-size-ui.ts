/**
 * 前厅 · 开单流程：seq 621 允许食客更改人数（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_CHANGE_PARTY_SIZE_SEQ = 621;

const LINES_STORAGE_ID = "621-guest-change-party-size-lines";

export const GUEST_CHANGE_PARTY_SIZE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestChangePartySizeProductLineId =
  (typeof GUEST_CHANGE_PARTY_SIZE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestChangePartySizeProductLineId[] =
  GUEST_CHANGE_PARTY_SIZE_PRODUCT_LINES.map((l) => l.id);

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

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestChangePartySizeToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(GUEST_CHANGE_PARTY_SIZE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(GUEST_CHANGE_PARTY_SIZE_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(GUEST_CHANGE_PARTY_SIZE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): GuestChangePartySizeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestChangePartySizeProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readGuestChangePartySizeLines(): GuestChangePartySizeProductLineId[] {
  ensureGuestChangePartySizeToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(GUEST_CHANGE_PARTY_SIZE_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeGuestChangePartySizeLines(all);
    return all;
  }
  return [];
}

export function writeGuestChangePartySizeLines(lines: GuestChangePartySizeProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isGuestChangePartySizeSeq(seq: number): boolean {
  return seq === GUEST_CHANGE_PARTY_SIZE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readGuestChangePartySizeLines());
  const cells = GUEST_CHANGE_PARTY_SIZE_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-change-party-size-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-sm overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-change-party-size-lines="${GUEST_CHANGE_PARTY_SIZE_SEQ}"
      role="group"
      aria-label="允许食客更改人数适用产线"
    >
      ${cells}
    </div>`;
}

export function renderGuestChangePartySizePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-change-party-size-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setGuestChangePartySizePanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-guest-change-party-size-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-guest-change-party-size-line]")
        .forEach((input) => {
          input.disabled = !visible;
          const label = input.closest("label");
          if (!label) return;
          label.classList.toggle("cursor-not-allowed", !visible);
          label.classList.toggle("opacity-50", !visible);
          label.classList.toggle("cursor-pointer", visible);
        });
    });
}

function collectLinesFromGroup(group: HTMLElement): GuestChangePartySizeProductLineId[] {
  const lines: GuestChangePartySizeProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-guest-change-party-size-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-guest-change-party-size-line");
      if (id && ALL_LINE_IDS.includes(id as GuestChangePartySizeProductLineId)) {
        lines.push(id as GuestChangePartySizeProductLineId);
      }
    });
  writeGuestChangePartySizeLines(lines);
  return lines;
}

export function bindGuestChangePartySizeUi(root: ParentNode = document): void {
  ensureGuestChangePartySizeToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-change-party-size-lines]").forEach((group) => {
    if (group.dataset.guestChangePartySizeBound === "1") return;
    group.dataset.guestChangePartySizeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-change-party-size-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
