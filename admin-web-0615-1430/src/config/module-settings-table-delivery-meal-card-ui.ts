/**
 * 前厅 · 食客端·下单与规则：seq 503 送餐到桌餐牌号获取方式（主开关 + Kiosk 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const TABLE_DELIVERY_MEAL_CARD_SEQ = 503;

const LINES_STORAGE_ID = "503-table-delivery-meal-card-lines";

export const TABLE_DELIVERY_MEAL_CARD_PRODUCT_LINES = [{ id: "kiosk", label: "Kiosk" }] as const;

export type TableDeliveryMealCardProductLineId =
  (typeof TABLE_DELIVERY_MEAL_CARD_PRODUCT_LINES)[number]["id"];

const KIOSK_LINE_ID: TableDeliveryMealCardProductLineId = "kiosk";

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
    return localStorage.getItem(moduleSettingToggleStorageKey(TABLE_DELIVERY_MEAL_CARD_SEQ)) === "1";
  } catch {
    return false;
  }
}

function normalizeLineIds(raw: unknown): TableDeliveryMealCardProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(KIOSK_LINE_ID) ? [KIOSK_LINE_ID] : [];
}

export function readTableDeliveryMealCardLines(): TableDeliveryMealCardProductLineId[] {
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    writeTableDeliveryMealCardLines([KIOSK_LINE_ID]);
    return [KIOSK_LINE_ID];
  }
  return [];
}

export function writeTableDeliveryMealCardLines(lines: TableDeliveryMealCardProductLineId[]): void {
  const enabled = lines.includes(KIOSK_LINE_ID);
  writeModuleSettingJson(LINES_STORAGE_ID, enabled ? [KIOSK_LINE_ID] : []);
}

export function isTableDeliveryMealCardSeq(seq: number): boolean {
  return seq === TABLE_DELIVERY_MEAL_CARD_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readTableDeliveryMealCardLines());
  const cells = TABLE_DELIVERY_MEAL_CARD_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-table-delivery-meal-card-line="${escapeHtml(line.id)}"
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
      data-table-delivery-meal-card-lines="${TABLE_DELIVERY_MEAL_CARD_SEQ}"
      role="group"
      aria-label="送餐到桌餐牌号获取方式适用产线"
    >
      ${cells}
    </div>`;
}

export function renderTableDeliveryMealCardPanelHtml(seq: number, on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-table-delivery-meal-card-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        开启后，在勾选产线的送餐到桌流程中配置餐牌号获取方式（实体号码牌或虚拟订单号）。
      </p>
    </div>`;
}

export function setTableDeliveryMealCardPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-table-delivery-meal-card-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");

    panel.querySelectorAll<HTMLInputElement>("[data-table-delivery-meal-card-line]").forEach((input) => {
      input.disabled = !visible;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !visible);
      label.classList.toggle("opacity-50", !visible);
      label.classList.toggle("cursor-pointer", visible);
    });
  });
}

function collectLinesFromGroup(group: HTMLElement): TableDeliveryMealCardProductLineId[] {
  const lines: TableDeliveryMealCardProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-table-delivery-meal-card-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-table-delivery-meal-card-line");
    if (id === KIOSK_LINE_ID) {
      lines.push(KIOSK_LINE_ID);
    }
  });
  writeTableDeliveryMealCardLines(lines);
  return lines;
}

export function bindTableDeliveryMealCardUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-table-delivery-meal-card-lines]").forEach((group) => {
    if (group.dataset.tableDeliveryMealCardBound === "1") return;
    group.dataset.tableDeliveryMealCardBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-table-delivery-meal-card-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
