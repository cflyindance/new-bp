/**
 * 前厅 · 送厨流程：seq 120 结账后自动送厨（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const SEND_KITCHEN_AFTER_CHECKOUT_SEQ = 120;

const LINES_STORAGE_ID = "120-send-kitchen-after-checkout-lines";

export const SEND_KITCHEN_AFTER_CHECKOUT_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type SendKitchenAfterCheckoutProductLineId =
  (typeof SEND_KITCHEN_AFTER_CHECKOUT_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: SendKitchenAfterCheckoutProductLineId[] =
  SEND_KITCHEN_AFTER_CHECKOUT_PRODUCT_LINES.map((l) => l.id);

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

export function ensureSendKitchenAfterCheckoutToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (
      localStorage.getItem(moduleSettingToggleStorageKey(SEND_KITCHEN_AFTER_CHECKOUT_SEQ)) !== null
    ) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(SEND_KITCHEN_AFTER_CHECKOUT_SEQ)) {
    try {
      localStorage.setItem(
        moduleSettingToggleStorageKey(SEND_KITCHEN_AFTER_CHECKOUT_SEQ),
        "1",
      );
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): SendKitchenAfterCheckoutProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is SendKitchenAfterCheckoutProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readSendKitchenAfterCheckoutLines(): SendKitchenAfterCheckoutProductLineId[] {
  ensureSendKitchenAfterCheckoutToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(SEND_KITCHEN_AFTER_CHECKOUT_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeSendKitchenAfterCheckoutLines(all);
    return all;
  }
  return [];
}

export function writeSendKitchenAfterCheckoutLines(
  lines: SendKitchenAfterCheckoutProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isSendKitchenAfterCheckoutSeq(seq: number): boolean {
  return seq === SEND_KITCHEN_AFTER_CHECKOUT_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readSendKitchenAfterCheckoutLines());
  const cells = SEND_KITCHEN_AFTER_CHECKOUT_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-3 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-send-kitchen-after-checkout-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-3xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-send-kitchen-after-checkout-lines="${SEND_KITCHEN_AFTER_CHECKOUT_SEQ}"
      role="group"
      aria-label="结账后自动送厨适用产线"
    >
      ${cells}
    </div>`;
}

export function renderSendKitchenAfterCheckoutPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-send-kitchen-after-checkout-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setSendKitchenAfterCheckoutPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-send-kitchen-after-checkout-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-send-kitchen-after-checkout-line]")
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

function collectLinesFromGroup(group: HTMLElement): SendKitchenAfterCheckoutProductLineId[] {
  const lines: SendKitchenAfterCheckoutProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-send-kitchen-after-checkout-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-send-kitchen-after-checkout-line");
      if (id && ALL_LINE_IDS.includes(id as SendKitchenAfterCheckoutProductLineId)) {
        lines.push(id as SendKitchenAfterCheckoutProductLineId);
      }
    });
  writeSendKitchenAfterCheckoutLines(lines);
  return lines;
}

export function bindSendKitchenAfterCheckoutUi(root: ParentNode = document): void {
  ensureSendKitchenAfterCheckoutToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-send-kitchen-after-checkout-lines]").forEach((group) => {
    if (group.dataset.sendKitchenAfterCheckoutBound === "1") return;
    group.dataset.sendKitchenAfterCheckoutBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-send-kitchen-after-checkout-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
