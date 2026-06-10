/**
 * 前厅 · 食客端·下单与规则：Kiosk 履约展示页（主开关 + Kiosk 产线）
 * — 488 展示订单类型选择页面、489 送餐取餐服务方式、490 展示取餐方式、491 打包展示输入号码牌。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const ORDER_TYPE_SELECTION_PAGE_SEQ = 488;
export const DELIVERY_SERVICE_MODE_PAGE_SEQ = 489;
export const PICKUP_METHOD_PAGE_SEQ = 490;
export const PACK_NUMBER_SLIP_PAGE_SEQ = 491;

export const GUEST_KIOSK_FLOW_PAGE_SEQS: readonly number[] = [
  ORDER_TYPE_SELECTION_PAGE_SEQ,
  DELIVERY_SERVICE_MODE_PAGE_SEQ,
  PICKUP_METHOD_PAGE_SEQ,
  PACK_NUMBER_SLIP_PAGE_SEQ,
];

const KIOSK_FLOW_PAGE_PRODUCT_LINES = [{ id: "kiosk", label: "Kiosk" }] as const;

export type GuestKioskFlowPageProductLineId =
  (typeof KIOSK_FLOW_PAGE_PRODUCT_LINES)[number]["id"];

const KIOSK_LINE_ID: GuestKioskFlowPageProductLineId = "kiosk";

const LINES_ARIA_LABEL_BY_SEQ: Record<number, string> = {
  [ORDER_TYPE_SELECTION_PAGE_SEQ]: "展示订单类型选择页面适用产线",
  [DELIVERY_SERVICE_MODE_PAGE_SEQ]: "送餐取餐服务方式适用产线",
  [PICKUP_METHOD_PAGE_SEQ]: "展示取餐方式适用产线",
  [PACK_NUMBER_SLIP_PAGE_SEQ]: "打包展示输入号码牌适用产线",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedSeqs = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linesStorageId(seq: number): string {
  return `${seq}-guest-kiosk-flow-page-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestKioskFlowPageToggleMigrated(seq: number): void {
  if (migratedSeqs.has(seq)) return;
  migratedSeqs.add(seq);
  if (!isGuestKioskFlowPageSeq(seq)) return;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(seq)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(seq)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(seq), "1");
    } catch {
      /* ignore */
    }
  }
}

function ensureAllGuestKioskFlowPageTogglesMigrated(): void {
  for (const seq of GUEST_KIOSK_FLOW_PAGE_SEQS) {
    ensureGuestKioskFlowPageToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): GuestKioskFlowPageProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(KIOSK_LINE_ID) ? [KIOSK_LINE_ID] : [];
}

function readLegacyLinesStorage(seq: number): unknown {
  if (seq !== ORDER_TYPE_SELECTION_PAGE_SEQ) return null;
  return readModuleSettingJson<unknown>("488-order-type-selection-page-lines", null);
}

export function readGuestKioskFlowPageLines(seq: number): GuestKioskFlowPageProductLineId[] {
  if (!isGuestKioskFlowPageSeq(seq)) return [];
  ensureGuestKioskFlowPageToggleMigrated(seq);
  let stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  if (!stored) {
    stored = readLegacyLinesStorage(seq);
  }
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    writeGuestKioskFlowPageLines(seq, [KIOSK_LINE_ID]);
    return [KIOSK_LINE_ID];
  }
  return [];
}

export function writeGuestKioskFlowPageLines(
  seq: number,
  lines: GuestKioskFlowPageProductLineId[],
): void {
  if (!isGuestKioskFlowPageSeq(seq)) return;
  const enabled = lines.includes(KIOSK_LINE_ID);
  writeModuleSettingJson(linesStorageId(seq), enabled ? [KIOSK_LINE_ID] : []);
}

export function isGuestKioskFlowPageSeq(seq: number): boolean {
  return (GUEST_KIOSK_FLOW_PAGE_SEQS as readonly number[]).includes(seq);
}

/** @deprecated 使用 isGuestKioskFlowPageSeq */
export function isOrderTypeSelectionPageSeq(seq: number): boolean {
  return seq === ORDER_TYPE_SELECTION_PAGE_SEQ;
}

/** @deprecated 使用 ensureGuestKioskFlowPageToggleMigrated */
export function ensureOrderTypeSelectionPageToggleMigrated(): void {
  ensureGuestKioskFlowPageToggleMigrated(ORDER_TYPE_SELECTION_PAGE_SEQ);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readGuestKioskFlowPageLines(seq));
  const cells = KIOSK_FLOW_PAGE_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-guest-kiosk-flow-page-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  const ariaLabel = LINES_ARIA_LABEL_BY_SEQ[seq] ?? "适用产线";

  return `
    <div
      class="flex w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-kiosk-flow-page-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      ${cells}
    </div>`;
}

export function renderGuestKioskFlowPagePanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-kiosk-flow-page-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

/** @deprecated 使用 renderGuestKioskFlowPagePanelHtml */
export function renderOrderTypeSelectionPagePanelHtml(seq: number, on: boolean): string {
  return renderGuestKioskFlowPagePanelHtml(seq, on);
}

export function setGuestKioskFlowPagePanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-guest-kiosk-flow-page-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-kiosk-flow-page-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

/** @deprecated 使用 setGuestKioskFlowPagePanelVisible */
export function setOrderTypeSelectionPagePanelVisible(seq: number, visible: boolean): void {
  setGuestKioskFlowPagePanelVisible(seq, visible);
}

function collectLinesFromGroup(group: HTMLElement): GuestKioskFlowPageProductLineId[] {
  const seq = Number(group.getAttribute("data-guest-kiosk-flow-page-lines"));
  if (!seq || !isGuestKioskFlowPageSeq(seq)) return [];

  const lines: GuestKioskFlowPageProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-kiosk-flow-page-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-kiosk-flow-page-line");
    if (id === KIOSK_LINE_ID) {
      lines.push(KIOSK_LINE_ID);
    }
  });
  writeGuestKioskFlowPageLines(seq, lines);
  return lines;
}

export function bindGuestKioskFlowPageUi(root: ParentNode = document): void {
  ensureAllGuestKioskFlowPageTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-kiosk-flow-page-lines]").forEach((group) => {
    if (group.dataset.guestKioskFlowPageBound === "1") return;
    group.dataset.guestKioskFlowPageBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-kiosk-flow-page-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}

/** @deprecated 使用 bindGuestKioskFlowPageUi */
export function bindOrderTypeSelectionPageUi(root: ParentNode = document): void {
  bindGuestKioskFlowPageUi(root);
}
