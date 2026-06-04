/**
 * 前厅 · 桌台与餐位：seq 169 付款后清桌模式（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const POST_PAYMENT_CLEAR_TABLE_SEQ = 169;

const LINES_STORAGE_ID = "169-post-payment-clear-table-lines";

export const POST_PAYMENT_CLEAR_TABLE_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type PostPaymentClearTableProductLineId =
  (typeof POST_PAYMENT_CLEAR_TABLE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PostPaymentClearTableProductLineId[] =
  POST_PAYMENT_CLEAR_TABLE_PRODUCT_LINES.map((l) => l.id);

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

export function ensurePostPaymentClearTableToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(POST_PAYMENT_CLEAR_TABLE_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(POST_PAYMENT_CLEAR_TABLE_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(POST_PAYMENT_CLEAR_TABLE_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): PostPaymentClearTableProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PostPaymentClearTableProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPostPaymentClearTableLines(): PostPaymentClearTableProductLineId[] {
  ensurePostPaymentClearTableToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(POST_PAYMENT_CLEAR_TABLE_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writePostPaymentClearTableLines(all);
    return all;
  }
  return [];
}

export function writePostPaymentClearTableLines(lines: PostPaymentClearTableProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isPostPaymentClearTableSeq(seq: number): boolean {
  return seq === POST_PAYMENT_CLEAR_TABLE_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readPostPaymentClearTableLines());
  const cells = POST_PAYMENT_CLEAR_TABLE_PRODUCT_LINES.map((line, index) => {
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
          data-post-payment-clear-table-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-2xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-post-payment-clear-table-lines="${POST_PAYMENT_CLEAR_TABLE_SEQ}"
      role="group"
      aria-label="付款后清桌模式适用产线"
    >
      ${cells}
    </div>`;
}

export function renderPostPaymentClearTablePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-post-payment-clear-table-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setPostPaymentClearTablePanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-post-payment-clear-table-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-post-payment-clear-table-line]")
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

function collectLinesFromGroup(group: HTMLElement): PostPaymentClearTableProductLineId[] {
  const lines: PostPaymentClearTableProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-post-payment-clear-table-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-post-payment-clear-table-line");
      if (id && ALL_LINE_IDS.includes(id as PostPaymentClearTableProductLineId)) {
        lines.push(id as PostPaymentClearTableProductLineId);
      }
    });
  writePostPaymentClearTableLines(lines);
  return lines;
}

export function bindPostPaymentClearTableUi(root: ParentNode = document): void {
  ensurePostPaymentClearTableToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-post-payment-clear-table-lines]").forEach((group) => {
    if (group.dataset.postPaymentClearTableBound === "1") return;
    group.dataset.postPaymentClearTableBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-post-payment-clear-table-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
