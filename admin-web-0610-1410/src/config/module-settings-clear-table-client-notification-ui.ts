/**
 * 前厅 · 桌台与餐位：seq 351 启用向客户端发送清桌通知（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const CLEAR_TABLE_CLIENT_NOTIFICATION_SEQ = 351;

const LINES_STORAGE_ID = "351-clear-table-client-notification-lines";

export const CLEAR_TABLE_CLIENT_NOTIFICATION_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type ClearTableClientNotificationProductLineId =
  (typeof CLEAR_TABLE_CLIENT_NOTIFICATION_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: ClearTableClientNotificationProductLineId[] =
  CLEAR_TABLE_CLIENT_NOTIFICATION_PRODUCT_LINES.map((l) => l.id);

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

export function ensureClearTableClientNotificationToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (
      localStorage.getItem(moduleSettingToggleStorageKey(CLEAR_TABLE_CLIENT_NOTIFICATION_SEQ)) !== null
    ) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(CLEAR_TABLE_CLIENT_NOTIFICATION_SEQ)) {
    try {
      localStorage.setItem(
        moduleSettingToggleStorageKey(CLEAR_TABLE_CLIENT_NOTIFICATION_SEQ),
        "1",
      );
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): ClearTableClientNotificationProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is ClearTableClientNotificationProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readClearTableClientNotificationLines(): ClearTableClientNotificationProductLineId[] {
  ensureClearTableClientNotificationToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(CLEAR_TABLE_CLIENT_NOTIFICATION_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeClearTableClientNotificationLines(all);
    return all;
  }
  return [];
}

export function writeClearTableClientNotificationLines(
  lines: ClearTableClientNotificationProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isClearTableClientNotificationSeq(seq: number): boolean {
  return seq === CLEAR_TABLE_CLIENT_NOTIFICATION_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readClearTableClientNotificationLines());
  const cells = CLEAR_TABLE_CLIENT_NOTIFICATION_PRODUCT_LINES.map((line, index) => {
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
          data-clear-table-client-notification-line="${escapeHtml(line.id)}"
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
      data-clear-table-client-notification-lines="${CLEAR_TABLE_CLIENT_NOTIFICATION_SEQ}"
      role="group"
      aria-label="向客户端发送清桌通知适用产线"
    >
      ${cells}
    </div>`;
}

export function renderClearTableClientNotificationPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-clear-table-client-notification-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setClearTableClientNotificationPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-clear-table-client-notification-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-clear-table-client-notification-line]")
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

function collectLinesFromGroup(group: HTMLElement): ClearTableClientNotificationProductLineId[] {
  const lines: ClearTableClientNotificationProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-clear-table-client-notification-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-clear-table-client-notification-line");
      if (id && ALL_LINE_IDS.includes(id as ClearTableClientNotificationProductLineId)) {
        lines.push(id as ClearTableClientNotificationProductLineId);
      }
    });
  writeClearTableClientNotificationLines(lines);
  return lines;
}

export function bindClearTableClientNotificationUi(root: ParentNode = document): void {
  ensureClearTableClientNotificationToggleMigrated();
  root
    .querySelectorAll<HTMLElement>("[data-clear-table-client-notification-lines]")
    .forEach((group) => {
      if (group.dataset.clearTableClientNotificationBound === "1") return;
      group.dataset.clearTableClientNotificationBound = "1";
      group.addEventListener("change", (e) => {
        const el = e.target as HTMLElement;
        if (!el.matches("[data-clear-table-client-notification-line]")) return;
        collectLinesFromGroup(group);
      });
    });
}
