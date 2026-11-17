/**
 * 前厅 · 下单规则：seq 646，按产线设置授权范围和有效范围。
 * 本模块维护后台配置，不执行点餐端的规则授权。
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

/** @deprecated 旧版时效枚举；不能表达多规则授权范围。 */
export type RuleHitPasswordAuthMode = "auth-every" | "auth-once";

export type RuleHitAuthorizationScope = "per-rule" | "combined";
export type RuleHitAuthorizationValidity = "operation" | "order";

export type RuleHitPasswordAuthLineConfig = {
  enabled: boolean;
  /** @deprecated compatibility mirror of validity; never sufficient for multi-rule execution. */
  mode: RuleHitPasswordAuthMode;
  authorizationScope: RuleHitAuthorizationScope;
  validity: RuleHitAuthorizationValidity;
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
    label: "仅本次操作",
  },
  {
    value: "auth-once",
    label: "已授权规则本单内有效",
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
  return { enabled, mode: MODE_DEFAULT, authorizationScope: "per-rule", validity: "operation" };
}

function defaultByLineConfig(enabled = true): RuleHitPasswordAuthByLine {
  return Object.fromEntries(
    RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.map((line) => [line.id, defaultLineConfig(enabled)]),
  ) as RuleHitPasswordAuthByLine;
}

export function normalizeRuleHitPasswordAuthByLine(
  raw: Partial<Record<string, Partial<RuleHitPasswordAuthLineConfig>>>,
): RuleHitPasswordAuthByLine {
  const base = defaultByLineConfig(false);
  for (const line of RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES) {
    const item = raw[line.id];
    if (!item || typeof item !== "object") continue;
    const validity = item.validity === undefined ? (item.mode === "auth-once" ? "order" : "operation") : item.validity === "order" ? "order" : "operation";
    base[line.id] = {
      enabled: item.enabled === true,
      authorizationScope: item.authorizationScope === "combined" ? "combined" : "per-rule",
      validity,
      mode: validity === "order" ? "auth-once" : "auth-every",
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
    writeRuleHitPasswordAuthByLine(normalizeRuleHitPasswordAuthByLine(raw));
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
      ...defaultLineConfig(enabledSet.has(line.id)),
      validity: mode === "auth-once" ? "order" : "operation",
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
    return normalizeRuleHitPasswordAuthByLine(raw);
  }
  return defaultByLineConfig(false);
}

export function writeRuleHitPasswordAuthByLine(config: RuleHitPasswordAuthByLine): void {
  const normalized = normalizeRuleHitPasswordAuthByLine(config);
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
    if (config[line.id].enabled) {
      config[line.id].mode = next;
      config[line.id].validity = next === "auth-once" ? "order" : "operation";
    }
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
      `[data-rule-hit-password-auth-field][data-line="${CSS.escape(lineId)}"]`,
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
  const config = readRuleHitPasswordAuthByLine();
  editor.querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-line-enabled]").forEach(cb => {
    const line = cb.dataset.ruleHitPasswordAuthLineEnabled as RuleHitPasswordAuthProductLineId;
    if (ALL_LINE_IDS.includes(line)) config[line].enabled = cb.checked;
  });
  editor.querySelectorAll<HTMLInputElement>("[data-rule-hit-password-auth-field]:checked").forEach(radio => {
    const line = radio.dataset.line as RuleHitPasswordAuthProductLineId;
    if (!ALL_LINE_IDS.includes(line)) return;
    if (radio.dataset.ruleHitPasswordAuthField === "authorizationScope" && (radio.value === "per-rule" || radio.value === "combined")) config[line].authorizationScope = radio.value;
    if (radio.dataset.ruleHitPasswordAuthField === "validity" && (radio.value === "operation" || radio.value === "order")) config[line].validity = radio.value;
  });
  writeRuleHitPasswordAuthByLine(config);
  syncRowControls(editor, true);
  editor.querySelectorAll<HTMLElement>("[data-rule-hit-password-auth-note]").forEach(note => {
    note.textContent = ruleHitPasswordAuthExplanation(config[note.dataset.line as RuleHitPasswordAuthProductLineId]);
  });
  return config;
}

export function ruleHitPasswordAuthExplanation(config: RuleHitPasswordAuthLineConfig): string {
  const scope = config.authorizationScope === "combined" ? "一次授权覆盖本次命中的全部待授权规则。" : "同一次操作命中的不同规则分别授权。";
  return scope + (config.validity === "order"
    ? "仅已授权的具体规则在本单内免重复授权；新命中或配置变化的规则仍需授权。"
    : "授权仅对本次操作有效；后续操作再次命中时需重新授权。");
}

export function renderRuleHitPasswordAuthFields(line: RuleHitPasswordAuthProductLineId, config: RuleHitPasswordAuthLineConfig, disabled = false): string {
  const lineLabel = RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.find(item => item.id === line)?.label ?? line;
  const fields = [
    { key: "authorizationScope", label: "授权范围", value: config.authorizationScope, options: [["per-rule", "逐条规则授权"], ["combined", "合并授权"]] },
    { key: "validity", label: "有效范围", value: config.validity, options: [["operation", "仅本次操作"], ["order", "本单内有效"]] },
  ];
  return fields.map(field => `<div class="order-card-field"><span>${field.label}</span><div class="order-card-choices" role="radiogroup" aria-label="${escapeHtml(lineLabel)} ${field.label}">${field.options.map(([value, label]) => `<label class="inline-flex items-center gap-2 text-sm"><input type="radio" name="rule-auth-${field.key}-${line}" data-rule-hit-password-auth-field="${field.key}" data-line="${line}" value="${value}" class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}" ${field.value === value ? "checked" : ""} ${disabled ? "disabled" : ""}><span>${label}</span></label>`).join("")}</div></div>`).join("") + `<p class="mt-4 text-xs leading-5 text-muted-foreground" data-rule-hit-password-auth-note data-line="${line}">${ruleHitPasswordAuthExplanation(config)}</p>`;
}

function renderByLineEditorHtml(enabled: boolean): string {
  const config = readRuleHitPasswordAuthByLine();
  const rows = RULE_HIT_PASSWORD_AUTH_PRODUCT_LINES.map((line) => {
    const item = config[line.id];
    const lineControlsOn = enabled && item.enabled;
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
        ${renderRuleHitPasswordAuthFields(line.id, item, !lineControlsOn)}
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
              <th class="px-3 py-2 font-medium">授权方式</th>
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
          "[data-rule-hit-password-auth-line-enabled], [data-rule-hit-password-auth-field]",
        )
      ) {
        return;
      }
      persist();
    });
  });
}
