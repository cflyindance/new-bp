/**
 * 前厅 · 送厨时机：seq 141 支持为已送厨的菜修改调味（主开关 + POS / POS GO / PayPad 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const KITCHEN_LINE_EDIT_SEQ = 141;

const LINES_STORAGE_ID = "141-kitchen-line-edit-lines";

export const KITCHEN_LINE_EDIT_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type KitchenLineEditProductLineId =
  (typeof KITCHEN_LINE_EDIT_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: KitchenLineEditProductLineId[] = KITCHEN_LINE_EDIT_PRODUCT_LINES.map(
  (l) => l.id,
);

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

export function ensureKitchenLineEditToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(KITCHEN_LINE_EDIT_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn(KITCHEN_LINE_EDIT_SEQ)) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(KITCHEN_LINE_EDIT_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): KitchenLineEditProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is KitchenLineEditProductLineId => typeof id === "string" && valid.has(id),
  );
}

export function readKitchenLineEditLines(): KitchenLineEditProductLineId[] {
  ensureKitchenLineEditToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn(KITCHEN_LINE_EDIT_SEQ)) {
    const all = [...ALL_LINE_IDS];
    writeKitchenLineEditLines(all);
    return all;
  }
  return [];
}

export function writeKitchenLineEditLines(lines: KitchenLineEditProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function ensureKitchenLineEditLinesDefault(): void {
  if (readKitchenLineEditLines().length === 0) {
    writeKitchenLineEditLines([...ALL_LINE_IDS]);
  }
}

export function isKitchenLineEditSeq(seq: number): boolean {
  return seq === KITCHEN_LINE_EDIT_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readKitchenLineEditLines());
  const cells = KITCHEN_LINE_EDIT_PRODUCT_LINES.map((line, index) => {
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
          data-kitchen-line-edit-line="${escapeHtml(line.id)}"
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
      data-kitchen-line-edit-lines="${KITCHEN_LINE_EDIT_SEQ}"
      role="group"
      aria-label="送厨后改调味适用产线"
    >
      ${cells}
    </div>`;
}

export function renderKitchenLineEditPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-kitchen-line-edit-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">勾选产线后，已送厨菜品行仍允许修改调味/加料。</p>
    </div>`;
}

export function setKitchenLineEditPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-kitchen-line-edit-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-kitchen-line-edit-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): KitchenLineEditProductLineId[] {
  const lines: KitchenLineEditProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-kitchen-line-edit-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-kitchen-line-edit-line");
    if (id && ALL_LINE_IDS.includes(id as KitchenLineEditProductLineId)) {
      lines.push(id as KitchenLineEditProductLineId);
    }
  });
  writeKitchenLineEditLines(lines);
  return lines;
}

export function bindKitchenLineEditUi(root: ParentNode = document): void {
  ensureKitchenLineEditToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-kitchen-line-edit-lines]").forEach((group) => {
    if (group.dataset.kitchenLineEditBound === "1") return;
    group.dataset.kitchenLineEditBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-kitchen-line-edit-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
