/**
 * 前厅 · 送厨流程：seq 113 点击「送厨」整单送厨（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const SEND_KITCHEN_WHOLE_ORDER_SEQ = 113;

const LINES_STORAGE_ID = "113-send-kitchen-whole-order-lines";

export const SEND_KITCHEN_WHOLE_ORDER_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type SendKitchenWholeOrderProductLineId =
  (typeof SEND_KITCHEN_WHOLE_ORDER_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: SendKitchenWholeOrderProductLineId[] =
  SEND_KITCHEN_WHOLE_ORDER_PRODUCT_LINES.map((l) => l.id);

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

export function ensureSendKitchenWholeOrderToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(SEND_KITCHEN_WHOLE_ORDER_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(SEND_KITCHEN_WHOLE_ORDER_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(SEND_KITCHEN_WHOLE_ORDER_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): SendKitchenWholeOrderProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is SendKitchenWholeOrderProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readSendKitchenWholeOrderLines(): SendKitchenWholeOrderProductLineId[] {
  ensureSendKitchenWholeOrderToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(SEND_KITCHEN_WHOLE_ORDER_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeSendKitchenWholeOrderLines(all);
    return all;
  }
  return [];
}

export function writeSendKitchenWholeOrderLines(lines: SendKitchenWholeOrderProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isSendKitchenWholeOrderSeq(seq: number): boolean {
  return seq === SEND_KITCHEN_WHOLE_ORDER_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readSendKitchenWholeOrderLines());
  const cells = SEND_KITCHEN_WHOLE_ORDER_PRODUCT_LINES.map((line, index) => {
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
          data-send-kitchen-whole-order-line="${escapeHtml(line.id)}"
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
      data-send-kitchen-whole-order-lines="${SEND_KITCHEN_WHOLE_ORDER_SEQ}"
      role="group"
      aria-label="点击送厨整单送厨适用产线"
    >
      ${cells}
    </div>`;
}

export function renderSendKitchenWholeOrderPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-send-kitchen-whole-order-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setSendKitchenWholeOrderPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-send-kitchen-whole-order-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-send-kitchen-whole-order-line]")
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

function collectLinesFromGroup(group: HTMLElement): SendKitchenWholeOrderProductLineId[] {
  const lines: SendKitchenWholeOrderProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-send-kitchen-whole-order-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-send-kitchen-whole-order-line");
      if (id && ALL_LINE_IDS.includes(id as SendKitchenWholeOrderProductLineId)) {
        lines.push(id as SendKitchenWholeOrderProductLineId);
      }
    });
  writeSendKitchenWholeOrderLines(lines);
  return lines;
}

export function bindSendKitchenWholeOrderUi(root: ParentNode = document): void {
  ensureSendKitchenWholeOrderToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-send-kitchen-whole-order-lines]").forEach((group) => {
    if (group.dataset.sendKitchenWholeOrderBound === "1") return;
    group.dataset.sendKitchenWholeOrderBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-send-kitchen-whole-order-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
