/**
 * 系统设置 · 界面与操作偏好 · 菜单模式（seq 174）。
 * 点单引用的菜单数据源：POS 菜单 / eMenu 菜单（二选一）。
 */

import { readModuleSettingRadio } from "./module-settings-form-ui";

export const MENU_SOURCE_MODE_SEQ = 174;

export const MENU_SOURCE_MODE_FIELD_ID = "174-menu-source-mode";

export const MENU_SOURCE_MODE_OPTIONS = [
  { code: "pos", label: "POS" },
  { code: "emenu", label: "eMenu" },
] as const;

export type MenuSourceMode = (typeof MENU_SOURCE_MODE_OPTIONS)[number]["code"];

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isMenuSourceModeRadioSeq(seq: number): boolean {
  return seq === MENU_SOURCE_MODE_SEQ;
}

export function renderMenuSourceModeRadioHtml(seq: number): string {
  const current = readModuleSettingRadio(MENU_SOURCE_MODE_FIELD_ID, "pos");
  const groupName = `module-setting-radio-${seq}`;
  const cells = MENU_SOURCE_MODE_OPTIONS.map((opt, index) => {
    const checked = current === opt.code;
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-6 ${divider}"
      >
        <input
          type="radio"
          name="${escapeHtml(groupName)}"
          value="${escapeHtml(opt.code)}"
          class="${MODULE_SETTING_CONTROL_CLASS}"
          ${checked ? "checked" : ""}
          data-module-setting-radio="${escapeHtml(MENU_SOURCE_MODE_FIELD_ID)}"
          aria-label="${escapeHtml(opt.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-menu-source-mode-radio="${seq}"
      role="radiogroup"
      aria-label="菜单模式"
    >
      ${cells}
    </div>`;
}
