/**
 * 前厅 · 点单页展示：主开关 + 产线多选。
 * seq 121 订单数量支持小数、137 显示 ASAP 订单时间、
 * 122 减菜后自动重定向、222 客户姓名必填、223 客户电话必填、138 自定义点单。
 * — 137 额外支持 Kiosk / eMenu / SDI / Online Order
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const ORDER_QTY_DECIMAL_SEQ = 121;
export const SHOW_ASAP_ORDER_TIME_SEQ = 137;
export const REDUCE_DISH_AUTO_REDIRECT_SEQ = 122;
export const CUSTOMER_NAME_REQUIRED_SEQ = 222;
export const CUSTOMER_PHONE_REQUIRED_SEQ = 223;
export const CUSTOM_ORDER_SEQ = 138;

export const POS_ORDER_CART_POS_LINES_SEQS = [
  ORDER_QTY_DECIMAL_SEQ,
  SHOW_ASAP_ORDER_TIME_SEQ,
  REDUCE_DISH_AUTO_REDIRECT_SEQ,
  CUSTOMER_NAME_REQUIRED_SEQ,
  CUSTOMER_PHONE_REQUIRED_SEQ,
  CUSTOM_ORDER_SEQ,
] as const;

export type PosOrderCartPosLinesSeq = (typeof POS_ORDER_CART_POS_LINES_SEQS)[number];

/** 本组默认产线（除显示 ASAP 外） */
export const POS_ORDER_CART_POS_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

const SHOW_ASAP_EXTRA_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export const SHOW_ASAP_ORDER_TIME_PRODUCT_LINES = [
  ...POS_ORDER_CART_POS_PRODUCT_LINES,
  ...SHOW_ASAP_EXTRA_PRODUCT_LINES,
] as const;

export type PosOrderCartPosProductLineId =
  | (typeof POS_ORDER_CART_POS_PRODUCT_LINES)[number]["id"]
  | (typeof SHOW_ASAP_EXTRA_PRODUCT_LINES)[number]["id"];

type PosOrderCartPosProductLine = { id: PosOrderCartPosProductLineId; label: string };

function productLinesForSeq(seq: PosOrderCartPosLinesSeq): readonly PosOrderCartPosProductLine[] {
  return seq === SHOW_ASAP_ORDER_TIME_SEQ
    ? SHOW_ASAP_ORDER_TIME_PRODUCT_LINES
    : POS_ORDER_CART_POS_PRODUCT_LINES;
}

function allLineIdsForSeq(seq: PosOrderCartPosLinesSeq): PosOrderCartPosProductLineId[] {
  return productLinesForSeq(seq).map((l) => l.id);
}

const LINES_STORAGE_ID_BY_SEQ: Record<PosOrderCartPosLinesSeq, string> = {
  [ORDER_QTY_DECIMAL_SEQ]: "121-order-qty-decimal-lines",
  [SHOW_ASAP_ORDER_TIME_SEQ]: "137-show-asap-order-time-lines",
  [REDUCE_DISH_AUTO_REDIRECT_SEQ]: "122-reduce-dish-auto-redirect-lines",
  [CUSTOMER_NAME_REQUIRED_SEQ]: "222-customer-name-required-lines",
  [CUSTOMER_PHONE_REQUIRED_SEQ]: "223-customer-phone-required-lines",
  [CUSTOM_ORDER_SEQ]: "138-custom-order-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosOrderCartPosLinesSeq, string> = {
  [ORDER_QTY_DECIMAL_SEQ]: "订单数量支持小数适用产线",
  [SHOW_ASAP_ORDER_TIME_SEQ]: "显示 ASAP 订单时间适用产线",
  [REDUCE_DISH_AUTO_REDIRECT_SEQ]: "减菜后自动重定向适用产线",
  [CUSTOMER_NAME_REQUIRED_SEQ]: "客户姓名必填适用产线",
  [CUSTOMER_PHONE_REQUIRED_SEQ]: "客户电话必填适用产线",
  [CUSTOM_ORDER_SEQ]: "自定义点单适用产线",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readMasterToggleOn(seq: PosOrderCartPosLinesSeq): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(
  seq: PosOrderCartPosLinesSeq,
  raw: unknown,
): PosOrderCartPosProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(allLineIdsForSeq(seq));
  return raw.filter(
    (id): id is PosOrderCartPosProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosOrderCartPosLines(seq: PosOrderCartPosLinesSeq): PosOrderCartPosProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(seq, stored);
  if (normalized.length > 0) {
    if (Array.isArray(stored) && normalized.length !== stored.length) {
      writePosOrderCartPosLines(seq, normalized);
    }
    return normalized;
  }

  if (readMasterToggleOn(seq)) {
    const all = allLineIdsForSeq(seq);
    writePosOrderCartPosLines(seq, all);
    return all;
  }
  return [];
}

export function writePosOrderCartPosLines(
  seq: PosOrderCartPosLinesSeq,
  lines: PosOrderCartPosProductLineId[],
): void {
  const allowed = allLineIdsForSeq(seq);
  const unique = allowed.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function ensurePosOrderCartPosLinesDefault(seq: PosOrderCartPosLinesSeq): void {
  if (readPosOrderCartPosLines(seq).length === 0) {
    writePosOrderCartPosLines(seq, allLineIdsForSeq(seq));
  }
}

export function isPosOrderCartPosLinesSeq(seq: number): seq is PosOrderCartPosLinesSeq {
  return (POS_ORDER_CART_POS_LINES_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: PosOrderCartPosLinesSeq, enabled: boolean): string {
  const selected = new Set(readPosOrderCartPosLines(seq));
  const lines = productLinesForSeq(seq);
  const cells = lines
    .map((line, index) => {
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
          data-pos-order-cart-pos-line="${escapeHtml(line.id)}"
          data-pos-order-cart-pos-lines-seq="${seq}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
    })
    .join("");

  const maxWidth = seq === SHOW_ASAP_ORDER_TIME_SEQ ? "max-w-3xl" : "max-w-xl";
  return `
    <div
      class="flex w-full ${maxWidth} overflow-hidden rounded-md border border-border bg-muted/40"
      data-pos-order-cart-pos-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(LINES_GROUP_ARIA_BY_SEQ[seq])}"
    >
      ${cells}
    </div>`;
}

export function renderPosOrderCartPosLinesPanelHtml(seq: PosOrderCartPosLinesSeq, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-order-cart-pos-lines-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setPosOrderCartPosLinesPanelVisible(
  seq: PosOrderCartPosLinesSeq,
  visible: boolean,
): void {
  document.querySelectorAll<HTMLElement>(`[data-pos-order-cart-pos-lines-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-pos-order-cart-pos-line]").forEach((input) => {
      if (Number(input.getAttribute("data-pos-order-cart-pos-lines-seq")) !== seq) return;
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(
  group: HTMLElement,
  seq: PosOrderCartPosLinesSeq,
): PosOrderCartPosProductLineId[] {
  const allowed = new Set(allLineIdsForSeq(seq));
  const lines: PosOrderCartPosProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-order-cart-pos-line][data-pos-order-cart-pos-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-order-cart-pos-line");
      if (id && allowed.has(id as PosOrderCartPosProductLineId)) {
        lines.push(id as PosOrderCartPosProductLineId);
      }
    });
  writePosOrderCartPosLines(seq, lines);
  return lines;
}

export function bindPosOrderCartPosLinesUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-pos-order-cart-pos-lines]").forEach((group) => {
    if (group.dataset.posOrderCartPosLinesBound === "1") return;
    group.dataset.posOrderCartPosLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-order-cart-pos-line]")) return;
      const seqRaw = el.getAttribute("data-pos-order-cart-pos-lines-seq");
      const seq = Number(seqRaw);
      if (!isPosOrderCartPosLinesSeq(seq)) return;
      collectLinesFromGroup(group, seq);
    });
  });
}
