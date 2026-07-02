/**
 * 前厅 · POS 找单列表：主开关 + POS / POS GO / PayPad 产线多选
 * — 151 显示所有单的总计价格
 * — 152 显示「关闭以下全部单子」按钮
 * — 153 默认显示未加小费订单
 * — 251 找单界面打印所选收据类型
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const POS_FIND_ORDER_SHOW_TOTAL_SEQ = 151;
export const POS_FIND_ORDER_CLOSE_ALL_BTN_SEQ = 152;
export const POS_FIND_ORDER_UNTIPPED_DEFAULT_SEQ = 153;
export const POS_FIND_ORDER_PRINT_RECEIPT_TYPE_SEQ = 251;

export const POS_FIND_ORDER_LIST_SEQS = [
  POS_FIND_ORDER_SHOW_TOTAL_SEQ,
  POS_FIND_ORDER_CLOSE_ALL_BTN_SEQ,
  POS_FIND_ORDER_UNTIPPED_DEFAULT_SEQ,
  POS_FIND_ORDER_PRINT_RECEIPT_TYPE_SEQ,
] as const;

export type PosFindOrderListSeq = (typeof POS_FIND_ORDER_LIST_SEQS)[number];

export const POS_FIND_ORDER_LIST_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosFindOrderListProductLineId =
  (typeof POS_FIND_ORDER_LIST_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosFindOrderListProductLineId[] = POS_FIND_ORDER_LIST_PRODUCT_LINES.map(
  (l) => l.id,
);

const LINES_STORAGE_ID_BY_SEQ: Record<PosFindOrderListSeq, string> = {
  [POS_FIND_ORDER_SHOW_TOTAL_SEQ]: "151-find-order-show-total-lines",
  [POS_FIND_ORDER_CLOSE_ALL_BTN_SEQ]: "152-find-order-close-all-btn-lines",
  [POS_FIND_ORDER_UNTIPPED_DEFAULT_SEQ]: "153-find-order-untipped-default-lines",
  [POS_FIND_ORDER_PRINT_RECEIPT_TYPE_SEQ]: "251-find-order-print-receipt-type-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosFindOrderListSeq, string> = {
  [POS_FIND_ORDER_SHOW_TOTAL_SEQ]: "显示所有单的总计价格适用产线",
  [POS_FIND_ORDER_CLOSE_ALL_BTN_SEQ]: "显示关闭以下全部单子按钮适用产线",
  [POS_FIND_ORDER_UNTIPPED_DEFAULT_SEQ]: "默认显示未加小费订单适用产线",
  [POS_FIND_ORDER_PRINT_RECEIPT_TYPE_SEQ]: "找单界面打印所选收据类型适用产线",
};

const PANEL_HINT_BY_SEQ: Record<PosFindOrderListSeq, string> = {
  [POS_FIND_ORDER_SHOW_TOTAL_SEQ]: "勾选产线后，找单列表页展示所有订单的总价合计。",
  [POS_FIND_ORDER_CLOSE_ALL_BTN_SEQ]: "勾选产线后，找单列表展示「关闭以下全部单子」操作按钮。",
  [POS_FIND_ORDER_UNTIPPED_DEFAULT_SEQ]: "勾选产线后，找单列表默认筛选展示未加小费的订单。",
  [POS_FIND_ORDER_PRINT_RECEIPT_TYPE_SEQ]: "勾选产线后，找单页打印时可选择收据类型。",
};

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const migratedToggleSeqs = new Set<number>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSeqInGroup(seq: number): seq is PosFindOrderListSeq {
  return (POS_FIND_ORDER_LIST_SEQS as readonly number[]).includes(seq);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensurePosFindOrderListToggleMigrated(seq: number): void {
  if (migratedToggleSeqs.has(seq)) return;
  migratedToggleSeqs.add(seq);
  if (!isSeqInGroup(seq)) return;
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

function normalizeLineIds(raw: unknown): PosFindOrderListProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosFindOrderListProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosFindOrderListLines(seq: PosFindOrderListSeq): PosFindOrderListProductLineId[] {
  ensurePosFindOrderListToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosFindOrderListLines(seq, all);
    return all;
  }
  return [];
}

export function writePosFindOrderListLines(
  seq: PosFindOrderListSeq,
  lines: PosFindOrderListProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function ensurePosFindOrderListLinesDefault(seq: PosFindOrderListSeq): void {
  if (readPosFindOrderListLines(seq).length === 0) {
    writePosFindOrderListLines(seq, [...ALL_LINE_IDS]);
  }
}

export function isPosFindOrderListSeq(seq: number): seq is PosFindOrderListSeq {
  return isSeqInGroup(seq);
}

function renderLinesMultiselectHtml(seq: PosFindOrderListSeq, enabled: boolean): string {
  const selected = new Set(readPosFindOrderListLines(seq));
  const cells = POS_FIND_ORDER_LIST_PRODUCT_LINES.map((line, index) => {
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
          data-pos-find-order-list-line="${escapeHtml(line.id)}"
          data-pos-find-order-list-lines-seq="${seq}"
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
      data-pos-find-order-list-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(LINES_GROUP_ARIA_BY_SEQ[seq])}"
    >
      ${cells}
    </div>`;
}

export function renderPosFindOrderListPanelHtml(seq: PosFindOrderListSeq, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-find-order-list-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(PANEL_HINT_BY_SEQ[seq])}</p>
    </div>`;
}

export function setPosFindOrderListPanelVisible(seq: PosFindOrderListSeq, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-pos-find-order-list-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-pos-find-order-list-line]").forEach((input) => {
      if (Number(input.getAttribute("data-pos-find-order-list-lines-seq")) !== seq) return;
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
  seq: PosFindOrderListSeq,
): PosFindOrderListProductLineId[] {
  const lines: PosFindOrderListProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-find-order-list-line][data-pos-find-order-list-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-find-order-list-line");
      if (id && ALL_LINE_IDS.includes(id as PosFindOrderListProductLineId)) {
        lines.push(id as PosFindOrderListProductLineId);
      }
    });
  writePosFindOrderListLines(seq, lines);
  return lines;
}

export function bindPosFindOrderListUi(root: ParentNode = document): void {
  for (const seq of POS_FIND_ORDER_LIST_SEQS) {
    ensurePosFindOrderListToggleMigrated(seq);
  }
  root.querySelectorAll<HTMLElement>("[data-pos-find-order-list-lines]").forEach((group) => {
    if (group.dataset.posFindOrderListLinesBound === "1") return;
    group.dataset.posFindOrderListLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-find-order-list-line]")) return;
      const seqRaw = el.getAttribute("data-pos-find-order-list-lines-seq");
      const seq = Number(seqRaw);
      if (!isPosFindOrderListSeq(seq)) return;
      collectLinesFromGroup(group, seq);
    });
  });
}
