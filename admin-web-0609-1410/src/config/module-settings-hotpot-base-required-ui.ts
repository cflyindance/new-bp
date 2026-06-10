/**
 * 前厅 · 食客端·下单与规则：seq 572 火锅锅底必选（主开关 + eMenu / SDI 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const HOTPOT_BASE_REQUIRED_SEQ = 572;

export const HOTPOT_BASE_REQUIRED_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type HotpotBaseRequiredProductLineId =
  (typeof HOTPOT_BASE_REQUIRED_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: HotpotBaseRequiredProductLineId[] =
  HOTPOT_BASE_REQUIRED_PRODUCT_LINES.map((l) => l.id);

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

const LINES_STORAGE_ID = `${HOTPOT_BASE_REQUIRED_SEQ}-hotpot-base-required-lines`;

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_BASE_REQUIRED_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureHotpotBaseRequiredToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(HOTPOT_BASE_REQUIRED_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(HOTPOT_BASE_REQUIRED_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): HotpotBaseRequiredProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is HotpotBaseRequiredProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readHotpotBaseRequiredLines(): HotpotBaseRequiredProductLineId[] {
  ensureHotpotBaseRequiredToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeHotpotBaseRequiredLines(all);
    return all;
  }
  return [];
}

export function writeHotpotBaseRequiredLines(lines: HotpotBaseRequiredProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isHotpotBaseRequiredSeq(seq: number): boolean {
  return seq === HOTPOT_BASE_REQUIRED_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readHotpotBaseRequiredLines());
  const cells = HOTPOT_BASE_REQUIRED_PRODUCT_LINES.map((line, index) => {
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
          data-hotpot-base-required-line="${escapeHtml(line.id)}"
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
      data-hotpot-base-required-lines="${HOTPOT_BASE_REQUIRED_SEQ}"
      role="group"
      aria-label="火锅锅底必选适用产线"
    >
      ${cells}
    </div>`;
}

export function renderHotpotBaseRequiredPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-hotpot-base-required-panel="${HOTPOT_BASE_REQUIRED_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setHotpotBaseRequiredPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-hotpot-base-required-panel="${HOTPOT_BASE_REQUIRED_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-hotpot-base-required-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): HotpotBaseRequiredProductLineId[] {
  const lines: HotpotBaseRequiredProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-hotpot-base-required-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-hotpot-base-required-line");
    if (id && ALL_LINE_IDS.includes(id as HotpotBaseRequiredProductLineId)) {
      lines.push(id as HotpotBaseRequiredProductLineId);
    }
  });
  writeHotpotBaseRequiredLines(lines);
  return lines;
}

export function bindHotpotBaseRequiredUi(root: ParentNode = document): void {
  ensureHotpotBaseRequiredToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-hotpot-base-required-lines]").forEach((group) => {
    if (group.dataset.hotpotBaseRequiredBound === "1") return;
    group.dataset.hotpotBaseRequiredBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-hotpot-base-required-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
