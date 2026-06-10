/**
 * 前厅 · 食客端·购物车展示：
 * seq 616 展示菜单送厨状态、617 购物车展示订单价格、618 菜品售罄自动隐藏
 * （主开关 + eMenu / SDI 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const GUEST_MENU_CART_KITCHEN_STATUS_SEQ = 616;
export const GUEST_MENU_CART_ORDER_PRICE_SEQ = 617;
export const GUEST_MENU_CART_SOLDOUT_HIDE_SEQ = 618;

export const GUEST_MENU_CART_SEQS: readonly number[] = [
  GUEST_MENU_CART_KITCHEN_STATUS_SEQ,
  GUEST_MENU_CART_ORDER_PRICE_SEQ,
  GUEST_MENU_CART_SOLDOUT_HIDE_SEQ,
];

export const GUEST_MENU_CART_PRODUCT_LINES = [
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
] as const;

export type GuestMenuCartProductLineId = (typeof GUEST_MENU_CART_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: GuestMenuCartProductLineId[] = GUEST_MENU_CART_PRODUCT_LINES.map((l) => l.id);

const LINES_ARIA_LABEL_BY_SEQ: Record<number, string> = {
  [GUEST_MENU_CART_KITCHEN_STATUS_SEQ]: "展示菜单送厨状态适用产线",
  [GUEST_MENU_CART_ORDER_PRICE_SEQ]: "购物车展示订单价格适用产线",
  [GUEST_MENU_CART_SOLDOUT_HIDE_SEQ]: "菜品售罄自动隐藏适用产线",
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
  return `${seq}-guest-menu-cart-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureGuestMenuCartToggleMigrated(seq: number): void {
  if (migratedSeqs.has(seq)) return;
  migratedSeqs.add(seq);
  if (!isGuestMenuCartSeq(seq)) return;
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

function ensureAllGuestMenuCartTogglesMigrated(): void {
  for (const seq of GUEST_MENU_CART_SEQS) {
    ensureGuestMenuCartToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): GuestMenuCartProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is GuestMenuCartProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readGuestMenuCartLines(seq: number): GuestMenuCartProductLineId[] {
  if (!isGuestMenuCartSeq(seq)) return [];
  ensureGuestMenuCartToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writeGuestMenuCartLines(seq, all);
    return all;
  }
  return [];
}

export function writeGuestMenuCartLines(seq: number, lines: GuestMenuCartProductLineId[]): void {
  if (!isGuestMenuCartSeq(seq)) return;
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(linesStorageId(seq), unique);
}

export function isGuestMenuCartSeq(seq: number): boolean {
  return (GUEST_MENU_CART_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readGuestMenuCartLines(seq));
  const cells = GUEST_MENU_CART_PRODUCT_LINES.map((line, index) => {
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
          data-guest-menu-cart-line="${escapeHtml(line.id)}"
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
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-guest-menu-cart-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(ariaLabel)}"
    >
      ${cells}
    </div>`;
}

export function renderGuestMenuCartPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-guest-menu-cart-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setGuestMenuCartPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-guest-menu-cart-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-guest-menu-cart-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): GuestMenuCartProductLineId[] {
  const seq = Number(group.getAttribute("data-guest-menu-cart-lines"));
  if (!seq || !isGuestMenuCartSeq(seq)) return [];

  const lines: GuestMenuCartProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-guest-menu-cart-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-guest-menu-cart-line");
    if (id && ALL_LINE_IDS.includes(id as GuestMenuCartProductLineId)) {
      lines.push(id as GuestMenuCartProductLineId);
    }
  });
  writeGuestMenuCartLines(seq, lines);
  return lines;
}

export function bindGuestMenuCartUi(root: ParentNode = document): void {
  ensureAllGuestMenuCartTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-guest-menu-cart-lines]").forEach((group) => {
    if (group.dataset.guestMenuCartBound === "1") return;
    group.dataset.guestMenuCartBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-guest-menu-cart-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
