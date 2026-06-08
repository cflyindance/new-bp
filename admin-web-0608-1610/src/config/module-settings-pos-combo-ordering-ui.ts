/**
 * 前厅 · 套餐点单与展示：主开关 + 产线多选
 * — 139 自动点完套餐
 * — 145 当套餐价钱规则是可调时，显示套餐子菜价格
 * 产线：POS / POS GO / PayPad / Kiosk / eMenu / SDI / Online Order
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const POS_COMBO_AUTO_FINISH_SEQ = 139;
export const POS_COMBO_SHOW_SUBITEM_PRICE_SEQ = 145;

export const POS_COMBO_ORDERING_SEQS = [POS_COMBO_AUTO_FINISH_SEQ, POS_COMBO_SHOW_SUBITEM_PRICE_SEQ] as const;

export type PosComboOrderingSeq = (typeof POS_COMBO_ORDERING_SEQS)[number];

export const POS_COMBO_ORDERING_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
] as const;

export type PosComboOrderingProductLineId =
  (typeof POS_COMBO_ORDERING_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosComboOrderingProductLineId[] = POS_COMBO_ORDERING_PRODUCT_LINES.map(
  (l) => l.id,
);

const LINES_STORAGE_ID_BY_SEQ: Record<PosComboOrderingSeq, string> = {
  [POS_COMBO_AUTO_FINISH_SEQ]: "139-pos-combo-auto-finish-lines",
  [POS_COMBO_SHOW_SUBITEM_PRICE_SEQ]: "145-pos-combo-show-subitem-price-lines",
};

const LINES_GROUP_ARIA_BY_SEQ: Record<PosComboOrderingSeq, string> = {
  [POS_COMBO_AUTO_FINISH_SEQ]: "自动点完套餐适用产线",
  [POS_COMBO_SHOW_SUBITEM_PRICE_SEQ]: "可调套餐显示子菜价格适用产线",
};

const PANEL_HINT_BY_SEQ: Record<PosComboOrderingSeq, string> = {
  [POS_COMBO_AUTO_FINISH_SEQ]: "勾选产线后，点选套餐时自动完成套餐内必选子项的点单流程。",
  [POS_COMBO_SHOW_SUBITEM_PRICE_SEQ]: "勾选产线后，当套餐价格为可调整规则时，在套餐点单界面展示子菜价格。",
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

function isSeqInGroup(seq: number): seq is PosComboOrderingSeq {
  return (POS_COMBO_ORDERING_SEQS as readonly number[]).includes(seq);
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensurePosComboOrderingToggleMigrated(seq: number): void {
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

function normalizeLineIds(raw: unknown): PosComboOrderingProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosComboOrderingProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosComboOrderingLines(seq: PosComboOrderingSeq): PosComboOrderingProductLineId[] {
  ensurePosComboOrderingToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID_BY_SEQ[seq], null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosComboOrderingLines(seq, all);
    return all;
  }
  return [];
}

export function writePosComboOrderingLines(
  seq: PosComboOrderingSeq,
  lines: PosComboOrderingProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID_BY_SEQ[seq], unique);
}

export function ensurePosComboOrderingLinesDefault(seq: PosComboOrderingSeq): void {
  if (readPosComboOrderingLines(seq).length === 0) {
    writePosComboOrderingLines(seq, [...ALL_LINE_IDS]);
  }
}

export function isPosComboOrderingSeq(seq: number): seq is PosComboOrderingSeq {
  return isSeqInGroup(seq);
}

function renderLinesMultiselectHtml(seq: PosComboOrderingSeq, enabled: boolean): string {
  const selected = new Set(readPosComboOrderingLines(seq));
  const cells = POS_COMBO_ORDERING_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-1 py-2.5 text-xs text-foreground sm:gap-2 sm:px-2 sm:py-3 sm:text-sm ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-pos-combo-ordering-line="${escapeHtml(line.id)}"
          data-pos-combo-ordering-lines-seq="${seq}"
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
      data-pos-combo-ordering-lines="${seq}"
      role="group"
      aria-label="${escapeHtml(LINES_GROUP_ARIA_BY_SEQ[seq])}"
    >
      ${cells}
    </div>`;
}

export function renderPosComboOrderingPanelHtml(seq: PosComboOrderingSeq, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-combo-ordering-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">${escapeHtml(PANEL_HINT_BY_SEQ[seq])}</p>
    </div>`;
}

export function setPosComboOrderingPanelVisible(seq: PosComboOrderingSeq, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-pos-combo-ordering-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-pos-combo-ordering-line]").forEach((input) => {
      if (Number(input.getAttribute("data-pos-combo-ordering-lines-seq")) !== seq) return;
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
  seq: PosComboOrderingSeq,
): PosComboOrderingProductLineId[] {
  const lines: PosComboOrderingProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>(
      `[data-pos-combo-ordering-line][data-pos-combo-ordering-lines-seq="${seq}"]:checked`,
    )
    .forEach((input) => {
      const id = input.getAttribute("data-pos-combo-ordering-line");
      if (id && ALL_LINE_IDS.includes(id as PosComboOrderingProductLineId)) {
        lines.push(id as PosComboOrderingProductLineId);
      }
    });
  writePosComboOrderingLines(seq, lines);
  return lines;
}

export function bindPosComboOrderingUi(root: ParentNode = document): void {
  for (const seq of POS_COMBO_ORDERING_SEQS) {
    ensurePosComboOrderingToggleMigrated(seq);
  }
  root.querySelectorAll<HTMLElement>("[data-pos-combo-ordering-lines]").forEach((group) => {
    if (group.dataset.posComboOrderingLinesBound === "1") return;
    group.dataset.posComboOrderingLinesBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-combo-ordering-line]")) return;
      const seqRaw = el.getAttribute("data-pos-combo-ordering-lines-seq");
      const seq = Number(seqRaw);
      if (!isPosComboOrderingSeq(seq)) return;
      collectLinesFromGroup(group, seq);
    });
  });
}
