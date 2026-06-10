/**
 * 前厅 · 送厨流程：seq 114 点击「付款」直接送厨、123 打单后自动送厨（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const PAYMENT_DIRECT_KITCHEN_SEND_SEQ = 114;
export const PRINT_AUTO_KITCHEN_SEND_SEQ = 123;

export const POS_KITCHEN_SEND_TRIGGER_SEQS: readonly number[] = [
  PAYMENT_DIRECT_KITCHEN_SEND_SEQ,
  PRINT_AUTO_KITCHEN_SEND_SEQ,
];

export const POS_KITCHEN_SEND_TRIGGER_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosKitchenSendTriggerProductLineId =
  (typeof POS_KITCHEN_SEND_TRIGGER_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosKitchenSendTriggerProductLineId[] =
  POS_KITCHEN_SEND_TRIGGER_PRODUCT_LINES.map((l) => l.id);

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
  return `${seq}-pos-kitchen-send-trigger-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensurePosKitchenSendTriggerToggleMigrated(seq: number): void {
  if (migratedSeqs.has(seq)) return;
  migratedSeqs.add(seq);
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

function ensureAllPosKitchenSendTriggerTogglesMigrated(): void {
  for (const seq of POS_KITCHEN_SEND_TRIGGER_SEQS) {
    ensurePosKitchenSendTriggerToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): PosKitchenSendTriggerProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosKitchenSendTriggerProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readPosKitchenSendTriggerLines(seq: number): PosKitchenSendTriggerProductLineId[] {
  ensurePosKitchenSendTriggerToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosKitchenSendTriggerLines(seq, all);
    return all;
  }
  return [];
}

export function writePosKitchenSendTriggerLines(
  seq: number,
  lines: PosKitchenSendTriggerProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(linesStorageId(seq), unique);
}

export function isPosKitchenSendTriggerSeq(seq: number): boolean {
  return (POS_KITCHEN_SEND_TRIGGER_SEQS as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readPosKitchenSendTriggerLines(seq));
  const cells = POS_KITCHEN_SEND_TRIGGER_PRODUCT_LINES.map((line, index) => {
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
          data-pos-kitchen-send-trigger-line="${escapeHtml(line.id)}"
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
      data-pos-kitchen-send-trigger-lines="${seq}"
      role="group"
      aria-label="送厨触发适用产线"
    >
      ${cells}
    </div>`;
}

export function renderPosKitchenSendTriggerPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-kitchen-send-trigger-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setPosKitchenSendTriggerPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-pos-kitchen-send-trigger-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-pos-kitchen-send-trigger-line]")
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

function collectLinesFromGroup(group: HTMLElement): PosKitchenSendTriggerProductLineId[] {
  const seq = Number(group.getAttribute("data-pos-kitchen-send-trigger-lines"));
  if (!seq || !isPosKitchenSendTriggerSeq(seq)) return [];

  const lines: PosKitchenSendTriggerProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-pos-kitchen-send-trigger-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-pos-kitchen-send-trigger-line");
      if (id && ALL_LINE_IDS.includes(id as PosKitchenSendTriggerProductLineId)) {
        lines.push(id as PosKitchenSendTriggerProductLineId);
      }
    });
  writePosKitchenSendTriggerLines(seq, lines);
  return lines;
}

export function bindPosKitchenSendTriggerUi(root: ParentNode = document): void {
  ensureAllPosKitchenSendTriggerTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-pos-kitchen-send-trigger-lines]").forEach((group) => {
    if (group.dataset.posKitchenSendTriggerBound === "1") return;
    group.dataset.posKitchenSendTriggerBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-kitchen-send-trigger-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
