/**
 * 前厅 · 食客端·下单与规则：seq 349 允许企台在电子菜单上点只读菜（主开关 + PayPad、POS GO）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const EMENU_SERVER_READONLY_DISH_SEQ = 349;

const LINES_STORAGE_ID = "349-emenu-server-readonly-dish-lines";

export const EMENU_SERVER_READONLY_DISH_PRODUCT_LINES = [
  { id: "pos-go", label: "POS GO" },
  { id: "paypad", label: "PayPad" },
] as const;

export type EmenuServerReadonlyDishProductLineId =
  (typeof EMENU_SERVER_READONLY_DISH_PRODUCT_LINES)[number]["id"];

const ALL_LINE_IDS: EmenuServerReadonlyDishProductLineId[] =
  EMENU_SERVER_READONLY_DISH_PRODUCT_LINES.map((l) => l.id);

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

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(EMENU_SERVER_READONLY_DISH_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureEmenuServerReadonlyDishToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(EMENU_SERVER_READONLY_DISH_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(EMENU_SERVER_READONLY_DISH_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): EmenuServerReadonlyDishProductLineId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(ALL_LINE_IDS);
  return raw.filter(
    (id): id is EmenuServerReadonlyDishProductLineId =>
      typeof id === "string" && valid.has(id),
  );
}

export function readEmenuServerReadonlyDishLines(): EmenuServerReadonlyDishProductLineId[] {
  ensureEmenuServerReadonlyDishToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writeEmenuServerReadonlyDishLines(all);
    return all;
  }
  return [];
}

export function writeEmenuServerReadonlyDishLines(
  lines: EmenuServerReadonlyDishProductLineId[],
): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isEmenuServerReadonlyDishSeq(seq: number): boolean {
  return seq === EMENU_SERVER_READONLY_DISH_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readEmenuServerReadonlyDishLines());
  const cells = EMENU_SERVER_READONLY_DISH_PRODUCT_LINES.map((line, index) => {
    const checked = selected.has(line.id);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-emenu-server-readonly-dish-line="${escapeHtml(line.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(line.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(line.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-sm overflow-hidden rounded-md border border-border bg-muted/40"
      data-emenu-server-readonly-dish-lines="${EMENU_SERVER_READONLY_DISH_SEQ}"
      role="group"
      aria-label="允许企台点只读菜适用产线"
    >
      ${cells}
    </div>`;
}

export function renderEmenuServerReadonlyDishPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-emenu-server-readonly-dish-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setEmenuServerReadonlyDishPanelVisible(seq: number, visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-emenu-server-readonly-dish-panel="${seq}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-emenu-server-readonly-dish-line]")
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

function collectLinesFromGroup(group: HTMLElement): EmenuServerReadonlyDishProductLineId[] {
  const lines: EmenuServerReadonlyDishProductLineId[] = [];
  group
    .querySelectorAll<HTMLInputElement>("[data-emenu-server-readonly-dish-line]:checked")
    .forEach((input) => {
      const id = input.getAttribute("data-emenu-server-readonly-dish-line");
      if (id && ALL_LINE_IDS.includes(id as EmenuServerReadonlyDishProductLineId)) {
        lines.push(id as EmenuServerReadonlyDishProductLineId);
      }
    });
  writeEmenuServerReadonlyDishLines(lines);
  return lines;
}

export function bindEmenuServerReadonlyDishUi(root: ParentNode = document): void {
  ensureEmenuServerReadonlyDishToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-emenu-server-readonly-dish-lines]").forEach((group) => {
    if (group.dataset.emenuServerReadonlyDishBound === "1") return;
    group.dataset.emenuServerReadonlyDishBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-emenu-server-readonly-dish-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
