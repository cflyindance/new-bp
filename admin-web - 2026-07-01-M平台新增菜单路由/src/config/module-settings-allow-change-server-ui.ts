/**
 * 前厅 · 桌台与餐位：seq 347 允许更换企台（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const ALLOW_CHANGE_SERVER_SEQ = 347;

const LINES_STORAGE_ID = "347-allow-change-server-lines";

export const ALLOW_CHANGE_SERVER_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type AllowChangeServerProductLineId =
  (typeof ALLOW_CHANGE_SERVER_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: AllowChangeServerProductLineId[] =
  ALLOW_CHANGE_SERVER_PRODUCT_LINES.map((l) => l.id);

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

export function ensureAllowChangeServerToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(ALLOW_CHANGE_SERVER_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(ALLOW_CHANGE_SERVER_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(ALLOW_CHANGE_SERVER_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): AllowChangeServerProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is AllowChangeServerProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readAllowChangeServerLines(): AllowChangeServerProductLineId[] {
  ensureAllowChangeServerToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(ALLOW_CHANGE_SERVER_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeAllowChangeServerLines(all);
    return all;
  }
  return [];
}

export function writeAllowChangeServerLines(lines: AllowChangeServerProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isAllowChangeServerSeq(seq: number): boolean {
  return seq === ALLOW_CHANGE_SERVER_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readAllowChangeServerLines());
  const cells = ALLOW_CHANGE_SERVER_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-3 text-sm text-foreground sm:px-6 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-allow-change-server-line="${escapeHtml(line.id)}"
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
      data-allow-change-server-lines="${ALLOW_CHANGE_SERVER_SEQ}"
      role="group"
      aria-label="允许更换企台适用产线"
    >
      ${cells}
    </div>`;
}

export function renderAllowChangeServerPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-allow-change-server-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setAllowChangeServerPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-allow-change-server-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-allow-change-server-line]")
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

function collectLinesFromGroup(group: HTMLElement): AllowChangeServerProductLineId[] {
  const lines: AllowChangeServerProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-allow-change-server-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-allow-change-server-line");
      if (id && ALL_LINE_IDS.includes(id as AllowChangeServerProductLineId)) {
        lines.push(id as AllowChangeServerProductLineId);
      }
    });
  writeAllowChangeServerLines(lines);
  return lines;
}

export function bindAllowChangeServerUi(root: ParentNode = document): void {
  ensureAllowChangeServerToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-allow-change-server-lines]").forEach((group) => {
    if (group.dataset.allowChangeServerBound === "1") return;
    group.dataset.allowChangeServerBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-allow-change-server-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
