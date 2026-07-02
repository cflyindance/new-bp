/**
 * 前厅 · 操作按钮显隐：seq 193–215（主开关 + 按产线多选，不含 196）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import {
  moduleSettingToggleStorageKey,
  POS_BUTTON_VISIBILITY_TOGGLE_SEQ,
} from "./module-settings-toggle-ui";

export const POS_BUTTON_VISIBILITY_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type PosButtonVisibilityProductLineId =
  (typeof POS_BUTTON_VISIBILITY_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: PosButtonVisibilityProductLineId[] =
  POS_BUTTON_VISIBILITY_PRODUCT_LINES.map((l) => l.id);

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
  return `${seq}-pos-button-visibility-lines`;
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensurePosButtonVisibilityToggleMigrated(seq: number): void {
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

function ensureAllPosButtonVisibilityTogglesMigrated(): void {
  for (const seq of POS_BUTTON_VISIBILITY_TOGGLE_SEQ) {
    ensurePosButtonVisibilityToggleMigrated(seq);
  }
}

function normalizeLineIds(raw: unknown): PosButtonVisibilityProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is PosButtonVisibilityProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readPosButtonVisibilityLines(seq: number): PosButtonVisibilityProductLineId[] {
  ensurePosButtonVisibilityToggleMigrated(seq);
  const stored = readModuleSettingJson<unknown>(linesStorageId(seq), null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(seq)) {
    const all = [...ALL_LINE_IDS];
    writePosButtonVisibilityLines(seq, all);
    return all;
  }
  return [];
}

export function writePosButtonVisibilityLines(
  seq: number,
  lines: PosButtonVisibilityProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(linesStorageId(seq), unique);
}

export function isPosButtonVisibilitySeq(seq: number): boolean {
  return (POS_BUTTON_VISIBILITY_TOGGLE_SEQ as readonly number[]).includes(seq);
}

function renderLinesMultiselectHtml(seq: number, enabled: boolean): string {
  const selected = new Set(readPosButtonVisibilityLines(seq));
  const cells = POS_BUTTON_VISIBILITY_PRODUCT_LINES.map((line, index) => {
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
          data-pos-button-visibility-line="${escapeHtml(line.id)}"
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
      data-pos-button-visibility-lines="${seq}"
      role="group"
      aria-label="操作按钮显隐适用产线"
    >
      ${cells}
    </div>`;
}

export function renderPosButtonVisibilityPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-pos-button-visibility-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(seq, on)}
    </div>`;
}

export function setPosButtonVisibilityPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-pos-button-visibility-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-pos-button-visibility-line]")
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

function collectLinesFromGroup(group: HTMLElement): PosButtonVisibilityProductLineId[] {
  const seq = Number(group.getAttribute("data-pos-button-visibility-lines"));
  if (!seq || !isPosButtonVisibilitySeq(seq)) return [];

  const lines: PosButtonVisibilityProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-pos-button-visibility-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-pos-button-visibility-line");
      if (id && ALL_LINE_IDS.includes(id as PosButtonVisibilityProductLineId)) {
        lines.push(id as PosButtonVisibilityProductLineId);
      }
    });
  writePosButtonVisibilityLines(seq, lines);
  return lines;
}

export function bindPosButtonVisibilityUi(root: ParentNode = document): void {
  ensureAllPosButtonVisibilityTogglesMigrated();
  root.querySelectorAll<HTMLElement>("[data-pos-button-visibility-lines]").forEach((group) => {
    if (group.dataset.posButtonVisibilityBound === "1") return;
    group.dataset.posButtonVisibilityBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-pos-button-visibility-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
