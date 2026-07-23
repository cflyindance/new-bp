/**
 * 前厅 · 食客端·下单与规则：seq 646 命中任意规则后,弹出密码授权
 * （主开关 + 按产线启用与授权模式，结构对齐 591 间隔内允许加购·菜品）。
 */

import { FOH_LINE_CONFIG_ROW_ATTR } from "./foh-settings-by-line-filter";
import {
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES,
  normalizeMenuOrderLimitOtherProductLineIds,
  type MenuOrderLimitOtherProductLineId,
} from "./menu-order-limit-product-lines";
import {
  moduleSettingStorageKey,
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import { moduleSettingToggleStorageKey } from "./module-settings-toggle-ui";

export const RULE_HIT_PASSWORD_AUTH_SEQ = 646;

/** @deprecated 旧版全局产线多选；迁移后由按产线配置同步 */
const LINES_STORAGE_ID = "646-rule-hit-password-auth-lines";
/** @deprecated 旧版全局授权模式；迁移后由按产线配置同步 */
const MODE_STORAGE_ID = "646-rule-hit-password-auth-mode";
export const RULE_HIT_PASSWORD_AUTH_BY_LINE_FIELD_ID = "646-rule-hit-password-auth-by-line";

export const RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES = MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES;

export type RuleHitPasswordAuthProductLineId = MenuOrderLimitOtherProductLineId;

/** A：每次命中均需授权；B：本单授权一次后放行 */
export type RuleHitPasswordAuthMode = "auth-every" | "auth-once";

export type RuleHitPasswordAuthLineConfig = {
  enabled: boolean;
  mode: RuleHitPasswordAuthMode;
};

export type RuleHitPasswordAuthByLine = Record<
  RuleHitPasswordAuthProductLineId,
  RuleHitPasswordAuthLineConfig
>;

const ALL_LINE_IDS: RuleHitPasswordAuthProductLineId[] = [
  ...MENU_ORDER_LIMIT_OTHER_PRODUCT_LINE_IDS,
];

const MODE_OPTIONS: ReadonlyArray<{
  value: RuleHitPasswordAuthMode;
  label: string;
}> = [
  {
    value: "auth-every",
    label: "每次命中均需授权",
  },
  {
    value: "auth-once",
    label: "授权一次后本单放行",
  },
];

const MODE_DEFAULT: RuleHitPasswordAuthMode = "auth-every";

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const MODULE_SETTING_CHOICE_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

let byLineMigrated = false;
let toggleMigrated = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidMode(value: string): value is RuleHitPasswordAuthMode {
  return MODE_OPTIONS.some((o) => o.value === value);
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

function defaultLineConfig(enabled = true): RuleHitPasswordAuthLineConfig {
  return { enabled, mode: MODE_DEFAULT };
}

function defaultByLineConfig(enabled = true): RuleHitPasswordAuthByLine {
  return Object.fromEntries(
    RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(enabled)]),
  ) as RuleHitPasswordAuthByLine;
}

function normalizeByLineConfig(
  raw: Partial<Record<string, Partial<RuleHitPasswordAuthLineConfig>>>,
): RuleHitPasswordAuthByLine {
  const base = defaultByLineConfig(false);
  for (const line of RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    const mode = typeof item.mode === "string" && isValidMode(item.mode) ? item.mode : MODE_DEFAULT;
    base[line.id] = {
      enabled: item.enabled === true,
      mode,
    };
  }
  return base;
}

function hasStoredKey(storageId: string): boolean {
  try {
    return localStorage.getItem(moduleSettingStorageKey(storageId)) !== null;
  } catch {
    return false;
  }
}

function syncLegacyFields(config: RuleHitPasswordAuthByLine): void {
  const enabledLines = RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.filter((line) => config[line.id].enabled).map(
    (line) => line.id,
  );
  writeModuleSettingJson(LINES_STORAGE_ID, enabledLines);
  const firstEnabled = RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.find((line) => config[line.id].enabled);
  if (firstEnabled) {
    writeModuleSettingJson(MODE_STORAGE_ID, config[firstEnabled.id].mode);
  }
}

export function ensureRuleHitPasswordAuthByLineMigrated(): void {
  if (byLineMigrated) return;
  byLineMigrated = true;
  ensureRuleHitPasswordAuthToggleMigrated();

  const raw = readModuleSettingJson<Partial<Record<string, Partial<RuleHitPasswordAuthLineConfig>>>>(
    RULE_HIT_PASSWORD_AUTH_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    writeRuleHitPasswordAuthByLine(normalizeByLineConfig(raw));
    return;
  }

  const hasLegacyLines = hasStoredKey(LINES_STORAGE_ID);
  const hasLegacyMode = hasStoredKey(MODE_STORAGE_ID);

  if (!hasLegacyLines && !hasLegacyMode) {
    // 旧开关曾开启且无产线数据时，默认全产线启用
    writeRuleHitPasswordAuthByLine(defaultByLineConfig(readLegacyToggleOn()));
    return;
  }

  const legacyLines = normalizeMenuOrderLimitOtherProductLineIds(
    readModuleSettingJson<unknown>(LINES_STORAGE_ID, null),
  );
  const modeRaw = readModuleSettingJson<unknown>(MODE_STORAGE_ID, null);
  const mode = typeof modeRaw === "string" && isValidMode(modeRaw) ? modeRaw : MODE_DEFAULT;

  const config = defaultByLineConfig(false);
  const enabledSet = new Set(
    legacyLines.length > 0 ? legacyLines : readLegacyToggleOn() ? ALL_LINE_IDS : [],
  );
  for (const line of RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES) {
    config[line.id] = {
      enabled: enabledSet.has(line.id),
      mode,
    };
  }
  writeRuleHitPasswordAuthByLine(config);
}

export function readRuleHitPasswordAuthByLine(): RuleHitPasswordAuthByLine {
  ensureRuleHitPasswordAuthByLineMigrated();
  const raw = readModuleSettingJson<Partial<Record<string, Partial<RuleHitPasswordAuthLineConfig>>>>(
    RULE_HIT_PASSWORD_AUTH_BY_LINE_FIELD_ID,
    {},
  );
  if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
    return normalizeByLineConfig(raw);
  }
  return defaultByLineConfig(false);
}

export function writeRuleHitPasswordAuthByLine(config: RuleHitPasswordAuthByLine): void {
  const normalized = normalizeByLineConfig(config);
  writeModuleSettingJson(RULE_HIT_PASSWORD_AUTH_BY_LINE_FIELD_ID, normalized);
  syncLegacyFields(normalized);
}

/** @deprecated 返回已启用产线 id 列表 */
export function readRuleHitPasswordAuthLines(): RuleHitPasswordAuthProductLineId[] {
  const config = readRuleHitPasswordAuthByLine();
  return RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.filter((line) => config[line.id].enabled).map(
    (line) => line.id,
  );
}

/** @deprecated */
export function writeRuleHitPasswordAuthLines(lines: RuleHitPasswordAuthProductLineId[]): void {
  const config = readRuleHitPasswordAuthByLine();
  const set = new Set(lines);
  for (const line of RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES) {
    config[line.id].enabled = set.has(line.id);
  }
  writeRuleHitPasswordAuthByLine(config);
}

/** @deprecated 返回首个启用产线的授权模式 */
export function readRuleHitPasswordAuthMode(): RuleHitPasswordAuthMode {
  const config = readRuleHitPasswordAuthByLine();
  const firstEnabled = RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.find((line) => config[line.id].enabled);
  return firstEnabled ? config[firstEnabled.id].mode : MODE_DEFAULT;
}

/** @deprecated */
export function writeRuleHitPasswordAuthMode(mode: RuleHitPasswordAuthMode): void {
  const next = isValidMode(mode) ? mode : MODE_DEFAULT;
  const config = readRuleHitPasswordAuthByLine();
  for (const line of RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES) {
    if (config[line.id].enabled) config[line.id].mode = next;
  }
  writeRuleHitPasswordAuthByLine(config);
}

export function isRuleHitPasswordAuthSeq(seq: number): boolean {
  return seq === RULE_HIT_PASSWORD_AUTH_SEQ;
}

function syncRowControls(editor: HTMLElement, panelEnabled: boolean): void {
  editor.querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-line-enabled]").forEach((cb) => {
    const lineId = cb.getAttribute("data-rule-hit-password-auth-line-enabled");
    if (!lineId) return;
    const lineEnabled = panelEnabled && cb.checked;
    const modeRadios = editor.querySelectorAll<HTMLInputElement>(
      `[data-rule-hit-password-auth-line-mode="${CSS.escape(lineId)}"]`,
    );
    modeRadios.forEach((radio) => {
      radio.disabled = !lineEnabled;
      const label = radio.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !lineEnabled);
      label.classList.toggle("opacity-50", !lineEnabled);
      label.classList.toggle("cursor-pointer", lineEnabled);
    });
  });
}

function collectByLineFromEditor(editor: HTMLElement): RuleHitPasswordAuthByLine {
  const config = defaultByLineConfig(false);
  editor.querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-line-enabled]").forEach((cb) => {
    const lineId = cb.getAttribute(
      "data-rule-hit-password-auth-line-enabled",
    ) as RuleHitPasswordAuthProductLineId | null;
    if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
    config[lineId].enabled = cb.checked;
  });
  editor
    .querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-line-mode]:checked")
    .forEach((radio) => {
      const lineId = radio.getAttribute(
        "data-rule-hit-password-auth-line-mode",
      ) as RuleHitPasswordAuthProductLineId | null;
      if (!lineId || !ALL_LINE_IDS.includes(lineId)) return;
      if (isValidMode(radio.value)) config[lineId].mode = radio.value;
    });
  writeRuleHitPasswordAuthByLine(config);
  syncRowControls(editor, true);
  return config;
}

function renderByLineEditorHtml(enabled: boolean): string {
  const config = readRuleHitPasswordAuthByLine();
  const rows = RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    const lineControlsOn = enabled && item.enabled;
    const radios = MODE_OPTIONS.map((opt) => {
      const checked = item.mode === opt.value;
      return `
        <label class="inline-flex items-start gap-2 text-sm text-foreground ${lineControlsOn ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
          <input
            type="radio"
            name="rule-hit-password-auth-mode-${escapeHtml(line.id)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} mt-0.5"
            data-rule-hit-password-auth-line-mode="${escapeHtml(line.id)}"
            ${checked ? "checked" : ""}
            ${lineControlsOn ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} ${escapeHtml(opt.label)}"
          />
          <span class="leading-snug">${escapeHtml(opt.label)}</span>
        </label>`;
    }).join("");

    return `
    <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
      <td class="px-3 py-2.5 text-sm font-medium text-foreground align-top whitespace-nowrap">${escapeHtml(line.label)}</td>
      <td class="px-3 py-2.5 align-top">
        <label class="inline-flex ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"} items-center gap-2">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
            ${item.enabled ? "checked" : ""}
            ${enabled ? "" : "disabled"}
            data-rule-hit-password-auth-line-enabled="${escapeHtml(line.id)}"
            aria-label="${escapeHtml(line.label)} 启用命中规则密码授权"
          />
        </label>
      </td>
      <td class="px-3 py-2.5 align-top">
        <div
          class="flex flex-col gap-2.5"
          role="radiogroup"
          aria-label="${escapeHtml(line.label)} 授权模式"
        >
          ${radios}
        </div>
      </td>
    </tr>`;
  }).join("");

  return `
    <div
      data-rule-hit-password-auth-by-line-editor="${RULE_HIT_PASSWORD_AUTH_SEQ}"
      class="space-y-2"
    >
      <div class="overflow-x-auto rounded-md border border-border">
        <table class="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead class="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th class="px-3 py-2 font-medium w-[5.5rem]">产线</th>
              <th class="px-3 py-2 font-medium w-[4.5rem]">启用</th>
              <th class="px-3 py-2 font-medium">授权模式</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export function renderRuleHitPasswordAuthPanelHtml(on: boolean): string {
  ensureRuleHitPasswordAuthByLineMigrated();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 ${hidden}"
      data-rule-hit-password-auth-panel="${RULE_HIT_PASSWORD_AUTH_SEQ}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${renderByLineEditorHtml(on)}
    </div>`;
}

export function setRuleHitPasswordAuthPanelVisible(visible: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-rule-hit-password-auth-panel="${RULE_HIT_PASSWORD_AUTH_SEQ}"]`)
    .forEach((panel) => {
      panel.classList.toggle("hidden", !visible);
      if (visible) panel.removeAttribute("aria-hidden");
      else panel.setAttribute("aria-hidden", "true");

      panel.querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-line-enabled]").forEach((input) => {
        input.disabled = !visible;
        const label = input.closest("label");
        if (!label) return;
        label.classList.toggle("cursor-not-allowed", !visible);
        label.classList.toggle("opacity-50", !visible);
        label.classList.toggle("cursor-pointer", visible);
      });

      const editor = panel.querySelector<HTMLElement>("[data-rule-hit-password-auth-by-line-editor]");
      if (editor) syncRowControls(editor, visible);
    });
}

export function bindRuleHitPasswordAuthUi(root: ParentNode = document): void {
  ensureRuleHitPasswordAuthByLineMigrated();

  root.querySelectorAll<HTMLElement>("[data-rule-hit-password-auth-by-line-editor]").forEach((editor) => {
    if (editor.dataset.ruleHitPasswordAuthByLineBound === "1") return;
    editor.dataset.ruleHitPasswordAuthByLineBound = "1";

    syncRowControls(editor, true);

    const persist = () => collectByLineFromEditor(editor);
    editor.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      if (
        !target.matches(
          "[data-rule-hit-password-auth-line-enabled], [data-rule-hit-password-auth-line-mode]",
        )
      ) {
        return;
      }
      persist();
    });
  });
}
