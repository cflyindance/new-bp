/**
 * 前厅 · 点单页展示：主开关 + POS / POS GO / PayPad 产线多选。
 * seq 122 减菜后自动重定向、222 客户姓名必填、223 客户电话必填、138 自定义点单。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const REDUCE_DISH_AUTO_REDIRECT_SEQ = 122;
export const CUSTOMER_NAME_REQUIRED_SEQ = 222;
export const CUSTOMER_PHONE_REQUIRED_SEQ = 223;
export const CUSTOM_ORDER_SEQ = 138;

export const POS_ORDER_CART_POS_LINES_SEQS = [
  REDUCE_DISH_AUTO_REDIRECT_SEQ,
  CUSTOMER_NAME_REQUIRED_SEQ,
  CUSTOMER_PHONE_REQUIRED_SEQ,
  CUSTOM_ORDER_SEQ,
] as const;

export type PosOrderCartPosLinesSeq = (typeof POS_ORDER_CART_POS_LINES_SEQS)[number];

export const POS_ORDER_CART_POS_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosOrderCartPosProductLineId =
  (typeof POS_ORDER_CART_POS_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosOrderCartPosProductLineId[] = POS_ORDER_CART_POS_PRODUCT_LINES.map(
  (l) => l.id,
);

const LINES_STORAGE_ID_BY_SEQ: Record<PosOrderCartPosLinesSeq, string> = {
  [REDUCE_DISH_AUTO_REDIRECT_SEQ]: "122-reduce-dish-auto-redirect-lines",
  [CUSTOMER_NAME_REQUIRED_SEQ]: "222-customer-name-required-lines",
  [CUSTOMER_PHONE_REQUIRED_SEQ]: "223-customer-phone-required-lines",
  [CUSTOM_ORDER_SEQ]: "138-custom-order-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosOrderCartPosLinesSeq, string> = {
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

function normalizeLineIds(raw: unknown): PosOrderCartPosProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosOrderCartPosProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosOrderCartPosLines(seq: PosOrderCartPosLinesSeq): PosOrderCartPosProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readMasterToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosOrderCartPosLines(seq, all);
    return all;
  }
  return [];
}

export function writePosOrderCartPosLines(
  seq: PosOrderCartPosLinesSeq,
  lines: PosOrderCartPosProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function isPosOrderCartPosLinesSeq(seq: number): seq is PosOrderCartPosLinesSeq {
  return (POS_ORDER_CART_POS_LINES_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: PosOrderCartPosLinesSeq, enabled: boolean): string {
  const selected = new Set(readPosOrderCartPosLines(seq));
  const cells = POS_ORDER_CART_POS_PRODUCT_LINES.map((line, index) => {
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
  }).join("");

  return `
    <div
      class="flex w-full max-w-xl overflow-hidden rounded-md border border-border bg-muted/40"
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
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
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
  const lines: PosOrderCartPosProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-order-cart-pos-line][data-pos-order-cart-pos-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-order-cart-pos-line");
      if (id && ALL_LINE_IDS.includes(id as PosOrderCartPosProductLineId)) {
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
