/**
 * 前厅 · 点单页展示：seq 178 显示单菜序号（主开关 + 按产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const DISH_SEQUENCE_ID_DISPLAY_SEQ = 178;

const LINES_STORAGE_ID = "178-dish-sequence-id-display-lines";

export const DISH_SEQUENCE_ID_DISPLAY_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
  { id: "kiosk", label: "Kiosk" },
  { id: "sdi", label: "SDI" },
  { id: "online-order", label: "Online Order" },
  { id: "emenu", label: "eMenu" },
] as const;

export type DishSequenceIdDisplayProductLineId =
  (typeof DISH_SEQUENCE_ID_DISPLAY_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: DishSequenceIdDisplayProductLineId[] =
  DISH_SEQUENCE_ID_DISPLAY_PRODUCT_LINES.map((l) => l.id);

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(seq: number): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(seq)) === "1";
  } catch {
    return false;
  }
}

export function ensureDishSequenceIdDisplayToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(DISH_SEQUENCE_ID_DISPLAY_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(DISH_SEQUENCE_ID_DISPLAY_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(DISH_SEQUENCE_ID_DISPLAY_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): DishSequenceIdDisplayProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is DishSequenceIdDisplayProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readDishSequenceIdDisplayLines(): DishSequenceIdDisplayProductLineId[] {
  ensureDishSequenceIdDisplayToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(DISH_SEQUENCE_ID_DISPLAY_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeDishSequenceIdDisplayLines(all);
    return all;
  }
  return [];
}

export function writeDishSequenceIdDisplayLines(lines: DishSequenceIdDisplayProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isDishSequenceIdDisplaySeq(seq: number): boolean {
  return seq === DISH_SEQUENCE_ID_DISPLAY_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readDishSequenceIdDisplayLines());
  const cells = DISH_SEQUENCE_ID_DISPLAY_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 px-1.5 py-3 text-sm text-foreground sm:px-2 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-dish-sequence-id-display-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center text-xs leading-tight sm:text-sm">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-4xl overflow-hidden rounded-md border border-border bg-muted/40"
      data-dish-sequence-id-display-lines="${DISH_SEQUENCE_ID_DISPLAY_SEQ}"
      role="group"
      aria-label="显示单菜序号适用产线"
    >
      ${cells}
    </div>`;
}

export function renderDishSequenceIdDisplayPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-dish-sequence-id-display-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setDishSequenceIdDisplayPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-dish-sequence-id-display-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-dish-sequence-id-display-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): DishSequenceIdDisplayProductLineId[] {
  const lines: DishSequenceIdDisplayProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-dish-sequence-id-display-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-dish-sequence-id-display-line");
    if (id && ALL_LINE_IDS.includes(id as DishSequenceIdDisplayProductLineId)) {
      lines.push(id as DishSequenceIdDisplayProductLineId);
    }
  });
  writeDishSequenceIdDisplayLines(lines);
  return lines;
}

export function bindDishSequenceIdDisplayUi(root: ParentNode = document): void {
  ensureDishSequenceIdDisplayToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-dish-sequence-id-display-lines]").forEach((group) => {
    if (group.dataset.dishSequenceIdDisplayBound === "1") return;
    group.dataset.dishSequenceIdDisplayBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-dish-sequence-id-display-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
