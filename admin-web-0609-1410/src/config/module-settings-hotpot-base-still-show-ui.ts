/**
 * 前厅 · 食客端·下单与规则：seq 573 火锅锅底下单后仍展示锅底（主开关 + eMenu / SDI 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const HOTPOT_BASE_STILL_SHOW_SEQ = 573;

const LINES_STORAGE_ID = "573-hotpot-base-still-show-lines";

export const HOTPOT_BASE_STILL_SHOW_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type HotpotBaseStillShowProductLineId =
  (typeof HOTPOT_BASE_STILL_SHOW_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: HotpotBaseStillShowProductLineId[] =
  HOTPOT_BASE_STILL_SHOW_PRODUCT_LINES.map((l) => l.id);

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
    return localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_BASE_STILL_SHOW_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureHotpotBaseStillShowToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_BASE_STILL_SHOW_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(HOTPOT_BASE_STILL_SHOW_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): HotpotBaseStillShowProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is HotpotBaseStillShowProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readHotpotBaseStillShowLines(): HotpotBaseStillShowProductLineId[] {
  ensureHotpotBaseStillShowToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeHotpotBaseStillShowLines(all);
    return all;
  }
  return [];
}

export function writeHotpotBaseStillShowLines(lines: HotpotBaseStillShowProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isHotpotBaseStillShowSeq(seq: number): boolean {
  return seq === HOTPOT_BASE_STILL_SHOW_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readHotpotBaseStillShowLines());
  const cells = HOTPOT_BASE_STILL_SHOW_PRODUCT_LINES.map((line, index) => {
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
          data-hotpot-base-still-show-line="${escapeHtml(line.id)}"
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
      data-hotpot-base-still-show-lines="${HOTPOT_BASE_STILL_SHOW_SEQ}"
      role="group"
      aria-label="火锅锅底下单后仍展示锅底适用产线"
    >
      ${cells}
    </div>`;
}

export function renderHotpotBaseStillShowPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-hotpot-base-still-show-panel="${HOTPOT_BASE_STILL_SHOW_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        勾选产线在锅底下单后，菜单中仍展示火锅锅底品类。
      </p>
    </div>`;
}

export function setHotpotBaseStillShowPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-hotpot-base-still-show-panel="${HOTPOT_BASE_STILL_SHOW_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-hotpot-base-still-show-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): HotpotBaseStillShowProductLineId[] {
  const lines: HotpotBaseStillShowProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-hotpot-base-still-show-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-hotpot-base-still-show-line");
    if (id && ALL_LINE_IDS.includes(id as HotpotBaseStillShowProductLineId)) {
      lines.push(id as HotpotBaseStillShowProductLineId);
    }
  });
  writeHotpotBaseStillShowLines(lines);
  return lines;
}

export function bindHotpotBaseStillShowUi(root: ParentNode = document): void {
  ensureHotpotBaseStillShowToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-hotpot-base-still-show-lines]").forEach((group) => {
    if (group.dataset.hotpotBaseStillShowBound === "1") return;
    group.dataset.hotpotBaseStillShowBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-hotpot-base-still-show-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
