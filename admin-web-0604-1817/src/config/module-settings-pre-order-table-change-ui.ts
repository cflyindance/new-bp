/**
 * 前厅 · 桌台与餐位：开单前换桌（643）、开单前必须换桌（644）。
 * 主开关 + 适用产线多选（Kiosk / eMenu / POS / POS GO / PayPad / SDI）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const PRE_ORDER_CHANGE_TABLE_SEQ = 643;
export const PRE_ORDER_MUST_CHANGE_TABLE_SEQ = 644;

export const PRE_ORDER_TABLE_CHANGE_SEQS = [
  PRE_ORDER_CHANGE_TABLE_SEQ,
  PRE_ORDER_MUST_CHANGE_TABLE_SEQ,
] as const;

export type PreOrderTableChangeSeq = (typeof PRE_ORDER_TABLE_CHANGE_SEQS)[number];

export const PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES = [
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "sdi", label: "SDI" },
] as const;

export type PreOrderTableChangeProductLineId =
  (typeof PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PreOrderTableChangeProductLineId[] =
  PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES.map((l) => l.id);

const LINES_STORAGE_ID_BY_SEQ: Record<PreOrderTableChangeSeq, string> = {
  [PRE_ORDER_CHANGE_TABLE_SEQ]: "643-pre-order-change-table-lines",
  [PRE_ORDER_MUST_CHANGE_TABLE_SEQ]: "644-pre-order-must-change-table-lines",
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

function readMasterToggleOn(seq: PreOrderTableChangeSeq): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): PreOrderTableChangeProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PreOrderTableChangeProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPreOrderTableChangeLines(seq: PreOrderTableChangeSeq): PreOrderTableChangeProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readMasterToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePreOrderTableChangeLines(seq, all);
    return all;
  }
  return [];
}

export function writePreOrderTableChangeLines(
  seq: PreOrderTableChangeSeq,
  lines: PreOrderTableChangeProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function isPreOrderTableChangeSeq(seq: number): seq is PreOrderTableChangeSeq {
  return (PRE_ORDER_TABLE_CHANGE_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: PreOrderTableChangeSeq, enabled: boolean): string {
  const selected = new Set(readPreOrderTableChangeLines(seq));
  const cells = PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES.map((line, index) => {
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
          data-pre-order-table-change-line="${escapeHtml(line.id)}"
          data-pre-order-table-change-seq="${seq}"
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
      data-pre-order-table-change-lines="${seq}"
      role="group"
      aria-label="开单前换桌适用产线"
    >
      ${cells}
    </div>`;
}

export function renderPreOrderTableChangePanelHtml(seq: PreOrderTableChangeSeq, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pre-order-table-change-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setPreOrderTableChangePanelVisible(seq: PreOrderTableChangeSeq, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-pre-order-table-change-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-pre-order-table-change-line]")
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

function collectLinesFromGroup(
  group: HTMLElement,
  seq: PreOrderTableChangeSeq,
): PreOrderTableChangeProductLineId[] {
  const lines: PreOrderTableChangeProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(`[data-pre-order-table-change-line][data-pre-order-table-change-seq="${seq}"]:checked`)
    .forEach((input) => {
      const id = input.getAttribute("data-pre-order-table-change-line");
      if (id && ALL_LINE_IDS.includes(id as PreOrderTableChangeProductLineId)) {
        lines.push(id as PreOrderTableChangeProductLineId);
      }
    });
  writePreOrderTableChangeLines(seq, lines);
  return lines;
}

export function bindPreOrderTableChangeUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-pre-order-table-change-lines]").forEach((group) => {
    if (group.dataset.preOrderTableChangeBound === "1") return;
    group.dataset.preOrderTableChangeBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pre-order-table-change-line]")) return;
      const seqRaw = el.getAttribute("data-pre-order-table-change-seq");
      const seq = Number(seqRaw);
      if (!isPreOrderTableChangeSeq(seq)) return;
      collectLinesFromGroup(group, seq);
    });
  });
}
