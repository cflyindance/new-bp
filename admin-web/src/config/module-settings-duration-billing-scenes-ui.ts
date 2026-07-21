/**
 * 前厅 · 食客端·下单与规则：seq 443 按照时长收费
 * 结构对齐品类先下单（571）：主开关 + 开启后适用场景多选。
 */

import {
  moduleSettingStorageKey,
  readModuleSettingCheckbox,
  writeModuleSettingCheckbox,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const DURATION_BILLING_SEQ = 443;

export const DURATION_BILLING_SCENE_OPTIONS = [
  { code: "ktv", label: "KTV" },
  { code: "vip-room", label: "VIP包间" },
] as const;

export type DurationBillingSceneCode =
  (typeof DURATION_BILLING_SCENE_OPTIONS)[number]["code"];

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let migrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isDurationBillingScenesMultiselectSeq(seq: number): boolean {
  return seq === DURATION_BILLING_SEQ;
}

export function durationBillingSceneCheckboxFieldId(seq: number, code: string): string {
  return `${seq}-duration-billing-scene-${code}`;
}

function hasStorageKey(fieldId: string): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(fieldId)) !== null;
  } catch {
    return false;
  }
}

function anySceneChecked(): boolean {
  return DURATION_BILLING_SCENE_OPTIONS.some((opt) =>
    readModuleSettingCheckbox(
      durationBillingSceneCheckboxFieldId(DURATION_BILLING_SEQ, opt.code),
      false,
    ),
  );
}

export function ensureDurationBillingToggleMigrated(): void {
  if (migrated) return;
  migrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(DURATION_BILLING_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }

  const hasLegacyScene = DURATION_BILLING_SCENE_OPTIONS.some((opt) =>
    hasStorageKey(durationBillingSceneCheckboxFieldId(DURATION_BILLING_SEQ, opt.code)),
  );
  if (!hasLegacyScene && !anySceneChecked()) return;

  try {
    localStorage.setItem(
      moduleSettingToggleStorageKey(DURATION_BILLING_SEQ),
      anySceneChecked() ? "1" : "0",
    );
  } catch {
    /* ignore */
  }
}

function renderScenesMultiselectHtml(enabled: boolean): string {
  const cells = DURATION_BILLING_SCENE_OPTIONS.map((opt, index) => {
    const fieldId = durationBillingSceneCheckboxFieldId(DURATION_BILLING_SEQ, opt.code);
    const checked = readModuleSettingCheckbox(fieldId, false);
    const divider = index > 0 ? "border-l border-border" : "";
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-sm text-foreground sm:px-4 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${divider}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(opt.code)}"
          data-module-setting-checkbox="${escapeHtml(fieldId)}"
          data-duration-billing-scene="${escapeHtml(opt.code)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(opt.label)}"
        />
        <span class="text-center leading-tight">${escapeHtml(opt.label)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="flex w-full max-w-md overflow-hidden rounded-md border border-border bg-muted/40"
      data-duration-billing-scenes="${DURATION_BILLING_SEQ}"
      role="group"
      aria-label="按照时长收费适用场景"
    >
      ${cells}
    </div>`;
}

export function renderDurationBillingPanelHtml(on: boolean): string {
  ensureDurationBillingToggleMigrated();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-duration-billing-panel="${DURATION_BILLING_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderScenesMultiselectHtml(on)}
    </div>`;
}

/** @deprecated 使用 renderDurationBillingPanelHtml */
export function renderDurationBillingScenesMultiselectHtml(seq: number): string {
  void seq;
  ensureDurationBillingToggleMigrated();
  return renderScenesMultiselectHtml(true);
}

export function setDurationBillingPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-duration-billing-panel="${DURATION_BILLING_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel
        .querySelectorAll<HTMLInputElement>("[data-duration-billing-scene]")
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

export function bindDurationBillingUi(root: ParentNode = document): void {
  ensureDurationBillingToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-duration-billing-scenes]").forEach((group) => {
    if (group.dataset.durationBillingBound === "1") return;
    group.dataset.durationBillingBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-duration-billing-scene]")) return;
      const input = el as HTMLInputElement;
      const fieldId = input.getAttribute("data-module-setting-checkbox");
      if (!fieldId) return;
      writeModuleSettingCheckbox(fieldId, input.checked);
    });
  });
}
