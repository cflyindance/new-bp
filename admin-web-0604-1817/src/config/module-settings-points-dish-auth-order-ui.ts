/**
 * 前厅 · 食客端·下单与规则：seq 594 需要权限下单的积分菜（主开关 + eMenu 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const POINTS_DISH_AUTH_ORDER_SEQ = 594;

const LINES_STORAGE_ID = "594-points-dish-auth-order-lines";

export const POINTS_DISH_AUTH_ORDER_PRODUCT_LINES = [{ id: "emenu", label: "eMenu" }] as const;

export type PointsDishAuthOrderProductLineId =
  (typeof POINTS_DISH_AUTH_ORDER_PRODUCT_LINES)[number]["id"];

const EMENU_LINE_ID: PointsDishAuthOrderProductLineId = "emenu";

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
  if (!Array.isArray(raw)) return [];
  return raw.includes(EMENU_LINE_ID) ? [EMENU_LINE_ID] : [];
}

export function readPointsDishAuthOrderLines(): PointsDishAuthOrderProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    writePointsDishAuthOrderLines([EMENU_LINE_ID]);
    return [EMENU_LINE_ID];
  }
  return [];
}

export function writePointsDishAuthOrderLines(lines: PointsDishAuthOrderProductLineId[]): void {
  const enabled = lines.includes(EMENU_LINE_ID);
  writeModuleSettingJson(LINES_STORAGE_ID, enabled ? [EMENU_LINE_ID] : []);
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
      class="flex w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted/40"
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
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        勾选产线后，食客兑换积分菜须服务员输入密码授权。
      </p>
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
    if (id === EMENU_LINE_ID) {
      lines.push(EMENU_LINE_ID);
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
