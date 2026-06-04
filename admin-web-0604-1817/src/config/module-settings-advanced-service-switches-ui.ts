/**
 * 系统设置 · 基础设置 · 高级服务与运行模式（seq 187–191、344）。
 * 主开关 + 配置输入（187、188、189 仅开关；190 为 Order / Waitlist 多选）。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingJson,
  readModuleSettingNumber,
  readModuleSettingText,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const ADVANCED_SERVICE_SWITCH_SEQS = [187, 188, 189, 190, 191, 344] as const;

export type AdvancedServiceSwitchSeq = (typeof ADVANCED_SERVICE_SWITCH_SEQS)[number];

export const AVIATO_SERVICE_SEQ = 190;

export const MEV_MODE_SEQ = 187;

export const PRINT_TEST_MODE_SEQ = 188;

export const FRONTEND_AUDIT_MODE_SEQ = 189;

/** 仅主开关、无展开配置（187 MEV 模式、188 打印测试模式、189 前端操作记录模式） */
export const ADVANCED_SERVICE_TOGGLE_ONLY_SEQS: readonly number[] = [
  MEV_MODE_SEQ,
  PRINT_TEST_MODE_SEQ,
  FRONTEND_AUDIT_MODE_SEQ,
];

export const AVIATO_SERVICE_SCOPES_FIELD_ID = "190-aviato-scopes";

export const AVIATO_SERVICE_SCOPE_OPTIONS = [
  { id: "order", label: "Order" },
  { id: "waitlist", label: "Waitlist" },
] as const;

export type AviatoServiceScopeId = (typeof AVIATO_SERVICE_SCOPE_OPTIONS)[number]["id"];

type TextFieldConfig = {
  kind: "text";
  fieldId: string;
  label: string;
  placeholder?: string;
};

type NumberFieldConfig = {
  kind: "number";
  fieldId: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  unit?: string;
  placeholder?: string;
};

type CheckboxGroupFieldConfig = {
  kind: "checkbox-group";
  fieldId: string;
  label: string;
  options: readonly { id: string; label: string }[];
};

type AdvancedServiceFieldConfig = TextFieldConfig | NumberFieldConfig | CheckboxGroupFieldConfig;

const ADVANCED_SERVICE_FIELDS: Partial<Record<AdvancedServiceSwitchSeq, AdvancedServiceFieldConfig>> = {
  190: {
    kind: "checkbox-group",
    fieldId: AVIATO_SERVICE_SCOPES_FIELD_ID,
    label: "适用场景（多选）",
    options: AVIATO_SERVICE_SCOPE_OPTIONS,
  },
  191: {
    kind: "text",
    fieldId: "191-public-api-service-url",
    label: "公开接口服务地址",
    placeholder: "https://",
  },
  344: {
    kind: "number",
    fieldId: "344-pos-heartbeat-interval",
    label: "心跳上传间隔",
    defaultValue: 60,
    min: 1,
    max: 86400,
    unit: "秒",
    placeholder: "60",
  },
};

const TEXT_INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NUMBER_INPUT_CLASS =
  "h-9 w-28 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LABEL_CLASS = "block text-sm font-medium text-foreground";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeAviatoScopes(raw: unknown): AviatoServiceScopeId[] {
  if (!Array.isArray(raw)) return [];
  const valid = new Set<string>(AVIATO_SERVICE_SCOPE_OPTIONS.map((o) => o.id));
  return raw.filter((id): id is AviatoServiceScopeId => typeof id === "string" && valid.has(id));
}

export function readAviatoServiceScopes(): AviatoServiceScopeId[] {
  return normalizeAviatoScopes(readModuleSettingJson<unknown>(AVIATO_SERVICE_SCOPES_FIELD_ID, []));
}

export function writeAviatoServiceScopes(scopes: AviatoServiceScopeId[]): void {
  const valid = new Set<string>(AVIATO_SERVICE_SCOPE_OPTIONS.map((o) => o.id));
  const unique = AVIATO_SERVICE_SCOPE_OPTIONS.map((o) => o.id).filter((id) => scopes.includes(id) && valid.has(id));
  writeModuleSettingJson(AVIATO_SERVICE_SCOPES_FIELD_ID, unique);
}

export function isAdvancedServiceSwitchSeq(seq: number): seq is AdvancedServiceSwitchSeq {
  return (ADVANCED_SERVICE_SWITCH_SEQS as readonly number[]).includes(seq);
}

export function isAdvancedServiceToggleOnlySeq(seq: number): boolean {
  return ADVANCED_SERVICE_TOGGLE_ONLY_SEQS.includes(seq);
}

function renderTextField(config: TextFieldConfig, enabled: boolean): string {
  const value = readModuleSettingText(config.fieldId, "");
  return `
    <div class="space-y-1.5">
      <label class="${LABEL_CLASS}">${escapeHtml(config.label)}</label>
      <input
        type="text"
        class="${TEXT_INPUT_CLASS}"
        value="${escapeHtml(value)}"
        data-module-setting-text="${escapeHtml(config.fieldId)}"
        aria-label="${escapeHtml(config.label)}"
        placeholder="${escapeHtml(config.placeholder ?? "")}"
        autocomplete="off"
        ${enabled ? "" : "disabled"}
      />
    </div>`;
}

function renderNumberField(config: NumberFieldConfig, enabled: boolean): string {
  const stored = readModuleSettingNumber(config.fieldId, config.defaultValue);
  const value = Math.min(config.max, Math.max(config.min, Math.round(stored)));
  const unit = config.unit
    ? `<span class="text-sm text-muted-foreground">${escapeHtml(config.unit)}</span>`
    : "";
  return `
    <div class="space-y-1.5">
      <label class="${LABEL_CLASS}">${escapeHtml(config.label)}</label>
      <div class="inline-flex items-center gap-2">
        <input
          type="number"
          inputmode="numeric"
          class="${NUMBER_INPUT_CLASS}"
          value="${escapeHtml(String(value))}"
          min="${config.min}"
          max="${config.max}"
          data-module-setting-number="${escapeHtml(config.fieldId)}"
          aria-label="${escapeHtml(config.label)}"
          placeholder="${escapeHtml(config.placeholder ?? "")}"
          ${enabled ? "" : "disabled"}
        />
        ${unit}
      </div>
    </div>`;
}

function renderCheckboxGroupField(config: CheckboxGroupFieldConfig, enabled: boolean): string {
  const selected = new Set(readAviatoServiceScopes());
  const checkboxes = config.options
    .map((option) => {
      const checked = selected.has(option.id as AviatoServiceScopeId);
      return `
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
          value="${escapeHtml(option.id)}"
          data-aviato-service-scope="${escapeHtml(option.id)}"
          ${checked ? "checked" : ""}
          ${enabled ? "" : "disabled"}
          aria-label="${escapeHtml(option.label)}"
        />
        <span>${escapeHtml(option.label)}</span>
      </label>`;
    })
    .join("");
  return `
    <div class="space-y-2">
      <p class="m-0 text-sm font-medium text-foreground">${escapeHtml(config.label)}</p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2" role="group" aria-label="${escapeHtml(config.label)}">
        ${checkboxes}
      </div>
    </div>`;
}

function renderField(config: AdvancedServiceFieldConfig, enabled: boolean): string {
  if (config.kind === "number") return renderNumberField(config, enabled);
  if (config.kind === "checkbox-group") return renderCheckboxGroupField(config, enabled);
  return renderTextField(config, enabled);
}

export function renderAdvancedServiceSwitchPanelHtml(seq: AdvancedServiceSwitchSeq, on: boolean): string {
  if (isAdvancedServiceToggleOnlySeq(seq)) return "";
  const config = ADVANCED_SERVICE_FIELDS[seq];
  if (!config) return "";
  const field = renderField(config, on);
  const hint =
    seq === AVIATO_SERVICE_SEQ
      ? "勾选 Aviato 服务适用的业务场景；关闭主开关后不生效。"
      : "开启后可编辑配置；关闭时保留已填内容但不生效。";
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 max-w-2xl rounded-lg border border-border bg-muted/40 px-3 py-3 ${hidden}"
      data-advanced-service-switch-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      ${field}
      <p class="m-0 mt-3 text-xs leading-relaxed text-muted-foreground">${escapeHtml(hint)}</p>
    </div>`;
}

export function setAdvancedServiceSwitchPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-advanced-service-switch-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
    panel
      .querySelectorAll<HTMLInputElement>(
        "[data-module-setting-text], [data-module-setting-number], [data-aviato-service-scope]",
      )
      .forEach((input) => {
        input.disabled = !visible;
      });
  });
}

function collectAviatoScopesFromPanel(panel: HTMLElement): AviatoServiceScopeId[] {
  const scopes: AviatoServiceScopeId[] = [];
  panel.querySelectorAll<HTMLInputElement>("[data-aviato-service-scope]:checked").forEach((input) => {
    const id = input.getAttribute("data-aviato-service-scope");
    if (id === "order" || id === "waitlist") scopes.push(id);
  });
  return scopes;
}

export function bindAdvancedServiceSwitchUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-advanced-service-switch-panel]").forEach((panel) => {
    if (panel.dataset.advancedServiceSwitchPanelBound === "1") return;
    panel.dataset.advancedServiceSwitchPanelBound = "1";

    panel.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (!el.matches("[data-aviato-service-scope]")) return;
      writeAviatoServiceScopes(collectAviatoScopesFromPanel(panel));
    });
  });
}
