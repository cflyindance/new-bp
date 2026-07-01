/**
 * 前厅 · 主界面与导航：seq 346 主页密码权限（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const HOME_PASSWORD_AUTH_SEQ = 346;

const LINES_STORAGE_ID = "346-home-password-auth-lines";

export const HOME_PASSWORD_AUTH_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type HomePasswordAuthProductLineId =
  (typeof HOME_PASSWORD_AUTH_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: HomePasswordAuthProductLineId[] =
  HOME_PASSWORD_AUTH_PRODUCT_LINES.map((l) => l.id);

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

export function ensureHomePasswordAuthToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(HOME_PASSWORD_AUTH_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(HOME_PASSWORD_AUTH_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(HOME_PASSWORD_AUTH_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): HomePasswordAuthProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is HomePasswordAuthProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readHomePasswordAuthLines(): HomePasswordAuthProductLineId[] {
  ensureHomePasswordAuthToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(HOME_PASSWORD_AUTH_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeHomePasswordAuthLines(all);
    return all;
  }
  return [];
}

export function writeHomePasswordAuthLines(lines: HomePasswordAuthProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isHomePasswordAuthSeq(seq: number): boolean {
  return seq === HOME_PASSWORD_AUTH_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readHomePasswordAuthLines());
  const cells = HOME_PASSWORD_AUTH_PRODUCT_LINES.map((line, index) => {
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
          data-home-password-auth-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-home-password-auth-lines="${HOME_PASSWORD_AUTH_SEQ}"
      role="group"
      aria-label="主页密码权限适用产线"
    >
      ${cells}
    </div>`;
}

export function renderHomePasswordAuthPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-home-password-auth-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setHomePasswordAuthPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-home-password-auth-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-home-password-auth-line]")
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

function collectLinesFromGroup(group: HTMLElement): HomePasswordAuthProductLineId[] {
  const lines: HomePasswordAuthProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-home-password-auth-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-home-password-auth-line");
      if (id && ALL_LINE_IDS.includes(id as HomePasswordAuthProductLineId)) {
        lines.push(id as HomePasswordAuthProductLineId);
      }
    });
  writeHomePasswordAuthLines(lines);
  return lines;
}

export function bindHomePasswordAuthUi(root: ParentNode = document): void {
  ensureHomePasswordAuthToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-home-password-auth-lines]").forEach((group) => {
    if (group.dataset.homePasswordAuthBound === "1") return;
    group.dataset.homePasswordAuthBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-home-password-auth-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
