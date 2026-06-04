/**
 * 前厅 · 食客端·下单与规则：seq 646 命中任意规则后,弹出密码授权（主开关 + eMenu 产线多选）。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const RULE_HIT_PASSWORD_AUTH_SEQ = 646;

const LINES_STORAGE_ID = "646-rule-hit-password-auth-lines";

export const RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES = [{ id: "emenu", label: "eMenu" }] as const;

export type RuleHitPasswordAuthProductLineId =
  (typeof RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES)[number]["id"];

const EMENU_LINE_ID: RuleHitPasswordAuthProductLineId = "emenu";

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
    return localStorage.getItem(moduleSettingToggleStorageKey(RULE_HIT_PASSWORD_AUTH_SEQ)) === "1";
  } catch {
    return false;
  }
}

export function ensureRuleHitPasswordAuthToggleMigrated(): void {
  if (toggleMigrated) return;
  toggleMigrated = true;
  try {
    if (localStorage.getItem(moduleSettingToggleStorageKey(RULE_HIT_PASSWORD_AUTH_SEQ)) !== null) {
      return;
    }
  } catch {
    return;
  }
  if (readLegacyToggleOn()) {
    try {
      localStorage.setItem(moduleSettingToggleStorageKey(RULE_HIT_PASSWORD_AUTH_SEQ), "1");
    } catch {
      /* ignore */
    }
  }
}

function normalizeLineIds(raw: unknown): RuleHitPasswordAuthProductLineId[] {
  if (!Array.isArray(raw)) return [];
  return raw.includes(EMENU_LINE_ID) ? [EMENU_LINE_ID] : [];
}

export function readRuleHitPasswordAuthLines(): RuleHitPasswordAuthProductLineId[] {
  ensureRuleHitPasswordAuthToggleMigrated();
  const stored = readModuleSettingJson<unknown>(LINES_STORAGE_ID, null);
  const normalized = normalizeLineIds(stored);
  if (normalized.length > 0) return normalized;

  if (readLegacyToggleOn()) {
    writeRuleHitPasswordAuthLines([EMENU_LINE_ID]);
    return [EMENU_LINE_ID];
  }
  return [];
}

export function writeRuleHitPasswordAuthLines(lines: RuleHitPasswordAuthProductLineId[]): void {
  const enabled = lines.includes(EMENU_LINE_ID);
  writeModuleSettingJson(LINES_STORAGE_ID, enabled ? [EMENU_LINE_ID] : []);
}

export function isRuleHitPasswordAuthSeq(seq: number): boolean {
  return seq === RULE_HIT_PASSWORD_AUTH_SEQ;
}

function renderLinesMultiselectHtml(enabled: boolean): string {
  const selected = new Set(readRuleHitPasswordAuthLines());
  const cells = RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.map((line) => {
    const checked = selected.has(line.id);
    return `
      <label
        class="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-3 text-sm text-foreground sm:px-8 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}"
      >
        <input
          type="checkbox"
          class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
          value="${escapeHtml(line.id)}"
          data-rule-hit-password-auth-line="${escapeHtml(line.id)}"
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
      data-rule-hit-password-auth-lines="${RULE_HIT_PASSWORD_AUTH_SEQ}"
      role="group"
      aria-label="命中任意规则后弹出密码授权适用产线"
    >
      ${cells}
    </div>`;
}

export function renderRuleHitPasswordAuthPanelHtml(on: boolean): string {
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-rule-hit-password-auth-panel="${RULE_HIT_PASSWORD_AUTH_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <p class="m-0 mb-2 text-xs font-medium text-muted-foreground">适用产线（多选）</p>
      ${renderLinesMultiselectHtml(on)}
      <p class="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
        勾选产线后，食客下单命中任意限制规则时须服务员输入密码授权。
      </p>
    </div>`;
}

export function setRuleHitPasswordAuthPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-rule-hit-password-auth-panel="${RULE_HIT_PASSWORD_AUTH_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-line]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });
    });
}

function collectLinesFromGroup(group: HTMLElement): RuleHitPasswordAuthProductLineId[] {
  const lines: RuleHitPasswordAuthProductLineId[] = [];
  group.querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-line]:checked").forEach((input) => {
    const id = input.getAttribute("data-rule-hit-password-auth-line");
    if (id === EMENU_LINE_ID) {
      lines.push(EMENU_LINE_ID);
    }
  });
  writeRuleHitPasswordAuthLines(lines);
  return lines;
}

export function bindRuleHitPasswordAuthUi(root: ParentNode = document): void {
  ensureRuleHitPasswordAuthToggleMigrated();
  root.querySelectorAll<HTMLElement>("[data-rule-hit-password-auth-lines]").forEach((group) => {
    if (group.dataset.ruleHitPasswordAuthBound === "1") return;
    group.dataset.ruleHitPasswordAuthBound = "1";
    group.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-rule-hit-password-auth-line]")) return;
      collectLinesFromGroup(group);
    });
  });
}
