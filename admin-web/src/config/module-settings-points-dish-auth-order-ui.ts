/**
 * 前厅 · 食客端·下单与规则：seq 594 需要权限下单的积分菜（主开关 + 多产线多选）。
 */

import {
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES,
  normalizeMenuOrderLimitOtherProductLineIds,
  type MenuOrderLimitOtherProductLineId,
} from "./menu-order-limit-product-lines";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const POINTS_DISH_AUTH_ORDER_SEQ = 594;

const LINES_STORAGE_ID = "594-points-dish-auth-order-lines";

export const POINTS_DISH_AUTH_ORDER_PRODUCT_LINES = MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES;

export type PointsDishAuthOrderProductLineId = MenuOrderLimitOtherProductLineId;

const ALL_LINE_IDS: PointsDishAuthOrderProductLineId[] = [
  ...MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
];

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readLegacyToggleOn(): boolean {
  try {
    return localStorage.getItem(moduleSettingToggleStorageKey(POINTS_DISH_AUTH_ORDER_SEQ)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): PointsDishAuthOrderProductLineId[] {
  return normalizeMenuOrderLimitOtherProductLineIds(raw);
}

export function readPointsDishAuthOrderLines(): PointsDishAuthOrderProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    const all = [...ALL_LINE_IDS];
    writePointsDishAuthOrderLines(all);
    return all;
  }
  return [];
}

export function writePointsDishAuthOrderLines(lines: PointsDishAuthOrderProductLineId[]): void {
  const unique = ALL_LINE_IDS.filter((id) => lines.includes(id));
  writeModuleSettingJson(LINES_STORAGE_ID, unique);
}

export function isPointsDishAuthOrderSeq(seq: number): boolean {
  return seq === POINTS_DISH_AUTH_ORDER_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readPointsDishAuthOrderLines());
  const cells = POINTS_DISH_AUTH_ORDER_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-points-dish-auth-order-line="${escapeHtml(line.id)}"
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
      data-points-dish-auth-order-lines="${POINTS_DISH_AUTH_ORDER_SEQ}"
      role="group"
      aria-label="需要权限下单的积分菜适用产线"
    >
      ${cells}
    </div>`;
}

export function renderPointsDishAuthOrderPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-points-dish-auth-order-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderLinesMultiselectHtml(on)}
    </div>`;
}

export function setPointsDishAuthOrderPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-points-dish-auth-order-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-points-dish-auth-order-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): PointsDishAuthOrderProductLineId[] {
  const lines: PointsDishAuthOrderProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-points-dish-auth-order-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-points-dish-auth-order-line");
    if (id && ALL_LINE_IDS.includes(id as PointsDishAuthOrderProductLineId)) {
      lines.push(id as PointsDishAuthOrderProductLineId);
    }
  });
  writePointsDishAuthOrderLines(lines);
  return lines;
}

export function bindPointsDishAuthOrderUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-points-dish-auth-order-lines]").forEach((group) => {
    if (group.dataset.pointsDishAuthOrderBound === "1") return;
    group.dataset.pointsDishAuthOrderBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-points-dish-auth-order-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
