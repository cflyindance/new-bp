/**
 * 订单 · 点单界面：相同菜品展示（seq 133/134 合并为单选）。
 * 原型存储：radio fieldId；兼容旧版双开关 localStorage（toggle:133 / toggle:134）。
 */

import {
  readModuleSettingRadio,
  writeModuleSettingRadio,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const ORDER_SAME_DISH_DISPLAY_HOST_SEQ = 133;

export const ORDER_SAME_DISH_DISPLAY_MEMBER_SEQ = 134;

const RADIO_FIELD_ID = "order-same-dish-display-mode";

export type OrderSameDishDisplayMode = "split" | "merge";

const MODE_LABEL: Record<OrderSameDishDisplayMode, string> = {
  split: "拆分显示",
  merge: "合并显示",
};

function readLegacyToggle(seq: number): boolean | null {
  try {
    const raw = localStorage.getItem(moduleSettingToggleStorageKey(seq));
    if (raw === null) return null;
    return raw === "1";
  } catch {
    return null;
  }
}

export function readOrderSameDishDisplayMode(): OrderSameDishDisplayMode {
  const stored = readModuleSettingRadio(RADIO_FIELD_ID, "");
  if (stored === "split" || stored === "merge") return stored;

  const splitOn = readLegacyToggle(ORDER_SAME_DISH_DISPLAY_HOST_SEQ);
  const mergeOn = readLegacyToggle(ORDER_SAME_DISH_DISPLAY_MEMBER_SEQ);
  if (mergeOn === true && splitOn !== true) return "merge";
  if (splitOn === true && mergeOn !== true) return "split";
  return "merge";
}

export function writeOrderSameDishDisplayMode(mode: OrderSameDishDisplayMode): void {
  writeModuleSettingRadio(RADIO_FIELD_ID, mode);
  try {
    localStorage.setItem(
      moduleSettingToggleStorageKey(ORDER_SAME_DISH_DISPLAY_HOST_SEQ),
      mode === "split" ? "1" : "0",
    );
    localStorage.setItem(
      moduleSettingToggleStorageKey(ORDER_SAME_DISH_DISPLAY_MEMBER_SEQ),
      mode === "merge" ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

export function isOrderSameDishDisplayHostSeq(seq: number): boolean {
  return seq === ORDER_SAME_DISH_DISPLAY_HOST_SEQ;
}

export function shouldSkipOrderSameDishDisplayMemberRow(seq: number): boolean {
  return seq === ORDER_SAME_DISH_DISPLAY_MEMBER_SEQ;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** @param controlClass 与 main 中 MODULE_SETTING_CONTROL_CLASS 一致 */
export function renderOrderSameDishDisplayRowHtml(
  controlClass: string,
  sceneDesc: string,
): string {
  const current = readOrderSameDishDisplayMode();
  const groupName = "module-setting-radio-order-same-dish-display";
  const radios = (["split", "merge"] as const)
    .map((mode) => {
      const checked = current === mode;
      return `
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(groupName)}"
            value="${mode}"
            class="${escapeHtml(controlClass)}"
            ${checked ? "checked" : ""}
            data-order-same-dish-display-radio="1"
          />
          <span>${escapeHtml(MODE_LABEL[mode])}</span>
        </label>`;
    })
    .join("");

  const desc = sceneDesc?.trim() || "设置相同的菜在点单页分开展示，还是合并为一行展示。";

  return `
        <li class="list-none">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 flex-1 space-y-1">
              <p class="text-sm font-medium text-card-foreground">相同菜品展示</p>
              <p class="text-xs leading-relaxed text-muted-foreground">${escapeHtml(desc)}</p>
            </div>
            <div class="flex flex-wrap items-center gap-4 sm:pt-0.5">${radios}</div>
          </div>
        </li>`;
}

export function bindOrderSameDishDisplayRadios(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>("[data-order-same-dish-display-radio]").forEach((input) => {
    if (input.dataset.orderSameDishDisplayBound === "1") return;
    input.dataset.orderSameDishDisplayBound = "1";
    input.addEventListener("change", () => {
      if (!input.checked) return;
      const mode = input.value;
      if (mode !== "split" && mode !== "merge") return;
      writeOrderSameDishDisplayMode(mode);
    });
  });
}
