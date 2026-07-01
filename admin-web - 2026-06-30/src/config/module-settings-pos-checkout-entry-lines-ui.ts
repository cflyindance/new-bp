/**
 * 前厅 · POS 结账入口：主开关 + POS / POS GO / PayPad 产线多选
 * — 248 当用条形码找单时打开单子付款界面
 * — 221 支付前确认客户信息
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const BARCODE_FIND_OPEN_PAYMENT_SEQ = 248;
export const PRE_PAYMENT_CONFIRM_CUSTOMER_SEQ = 221;

export const POS_CHECKOUT_ENTRY_LINES_SEQS = [
  BARCODE_FIND_OPEN_PAYMENT_SEQ,
  PRE_PAYMENT_CONFIRM_CUSTOMER_SEQ,
] as const;

export type PosCheckoutEntryLinesSeq = (typeof POS_CHECKOUT_ENTRY_LINES_SEQS)[number];

export const POS_CHECKOUT_ENTRY_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosCheckoutEntryProductLineId =
  (typeof POS_CHECKOUT_ENTRY_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosCheckoutEntryProductLineId[] = POS_CHECKOUT_ENTRY_PRODUCT_LINES.map(
  (l) => l.id,
);

const LINES_STORAGE_ID_BY_SEQ: Record<PosCheckoutEntryLinesSeq, string> = {
  [BARCODE_FIND_OPEN_PAYMENT_SEQ]: "248-barcode-find-open-payment-lines",
  [PRE_PAYMENT_CONFIRM_CUSTOMER_SEQ]: "221-pre-payment-confirm-customer-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosCheckoutEntryLinesSeq, string> = {
  [BARCODE_FIND_OPEN_PAYMENT_SEQ]: "条形码找单打开付款界面适用产线",
  [PRE_PAYMENT_CONFIRM_CUSTOMER_SEQ]: "支付前确认客户信息适用产线",
};

const PANEL_HINT_BY_SEQ: Record<PosCheckoutEntryLinesSeq, string> = {
  [BARCODE_FIND_OPEN_PAYMENT_SEQ]: "勾选产线后，扫描条形码找单时直接进入该单付款界面。",
  [PRE_PAYMENT_CONFIRM_CUSTOMER_SEQ]: "勾选产线后，支付前需服务员二次确认客户信息。",
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

function isSeqInGroup(seq: number): seq is PosCheckoutEntryLinesSeq {
  return (POS_CHECKOUT_ENTRY_LINES_SEQS as readonly number[]).includes(seq);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensurePosCheckoutEntryToggleMigrated(seq: number): void {
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

function normalizeLineIds(raw: unknown): PosCheckoutEntryProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosCheckoutEntryProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosCheckoutEntryLines(seq: PosCheckoutEntryLinesSeq): PosCheckoutEntryProductLineId[] {
  ensurePosCheckoutEntryToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosCheckoutEntryLines(seq, all);
    return all;
  }
  return [];
}

export function writePosCheckoutEntryLines(
  seq: PosCheckoutEntryLinesSeq,
  lines: PosCheckoutEntryProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function ensurePosCheckoutEntryLinesDefault(seq: PosCheckoutEntryLinesSeq): void {
  if (readPosCheckoutEntryLines(seq).length === 0) {
    writePosCheckoutEntryLines(seq, [...ALL_LINE_IDS]);
  }
}

export function isPosCheckoutEntryLinesSeq(seq: number): seq is PosCheckoutEntryLinesSeq {
  return isSeqInGroup(seq);
}

function renderLinesMultiselectHtml(seq: PosCheckoutEntryLinesSeq, enabled: boolean): string {
  const selected = new Set(readPosCheckoutEntryLines(seq));
  const cells = POS_CHECKOUT_ENTRY_PRODUCT_LINES.map((line, index) => {
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
          data-pos-checkout-entry-line="${escapeHtml(line.id)}"
          data-pos-checkout-entry-lines-seq="${seq}"
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
      data-pos-checkout-entry-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(LINES_GROUP_ARIA_BY_SEQ[seq])}"
    >
      ${cells}
    </div>`;
}

export function renderPosCheckoutEntryLinesPanelHtml(seq: PosCheckoutEntryLinesSeq, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-checkout-entry-lines-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(PANEL_HINT_BY_SEQ[seq])}</p>
    </div>`;
}

export function setPosCheckoutEntryLinesPanelVisible(seq: PosCheckoutEntryLinesSeq, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-pos-checkout-entry-lines-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-pos-checkout-entry-line]").forEach((input) => {
      if (Number(input.getAttribute("data-pos-checkout-entry-lines-seq")) !== seq) return;
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
  seq: PosCheckoutEntryLinesSeq,
): PosCheckoutEntryProductLineId[] {
  const lines: PosCheckoutEntryProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-checkout-entry-line][data-pos-checkout-entry-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-checkout-entry-line");
      if (id && ALL_LINE_IDS.includes(id as PosCheckoutEntryProductLineId)) {
        lines.push(id as PosCheckoutEntryProductLineId);
      }
    });
  writePosCheckoutEntryLines(seq, lines);
  return lines;
}

export function bindPosCheckoutEntryLinesUi(root: ParentNode = document): void {
  for (const seq of POS_CHECKOUT_ENTRY_LINES_SEQS) {
    ensurePosCheckoutEntryToggleMigrated(seq);
  }
  root.querySelectorAll<HTMLElement>("[data-pos-checkout-entry-lines]").forEach((group) => {
    if (group.dataset.posCheckoutEntryLinesBound === "1") return;
    group.dataset.posCheckoutEntryLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-checkout-entry-line]")) return;
      const seqRaw = el.getAttribute("data-pos-checkout-entry-lines-seq");
      const seq = Number(seqRaw);
      if (!isPosCheckoutEntryLinesSeq(seq)) return;
      collectLinesFromGroup(group, seq);
    });
  });
}
