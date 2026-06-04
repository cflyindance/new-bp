/**
 * 设置项：默认展开的单选 / 多选（radio / checkbox），替代原生下拉。
 */

export const MODULE_SETTING_CHOICE_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

export type ModuleSettingChoiceOption = { value: string; label: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type RenderSingleChoiceParams = {
  options: readonly ModuleSettingChoiceOption[];
  fieldId: string;
  groupName: string;
  currentValue: string;
  layout?: "vertical" | "wrap";
  ariaLabel?: string;
};

/** 单选：选项始终可见，使用 radio + localStorage（data-module-setting-radio） */
export function renderModuleSettingSingleChoiceHtml(params: RenderSingleChoiceParams): string {
  const layout = params.layout ?? "vertical";
  const containerClass =
    layout === "vertical"
      ? "flex flex-col gap-2"
      : "flex flex-wrap items-center gap-x-4 gap-y-2";
  const radios = params.options
    .map((opt) => {
      const checked = params.currentValue === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(params.groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            data-module-setting-radio="${escapeHtml(params.fieldId)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    })
    .join("");

  const aria = params.ariaLabel ? ` aria-label="${escapeHtml(params.ariaLabel)}"` : "";
  return `<div class="${containerClass}" role="radiogroup"${aria}>${radios}</div>`;
}

export type RenderInlineSingleChoiceParams = {
  options: readonly ModuleSettingChoiceOption[];
  groupName: string;
  currentValue: string;
  radioDataAttr: string;
  layout?: "vertical" | "wrap";
};

/** 单选：不写入 module-settings storage，由调用方自行持久化（如对话框表单） */
export function renderModuleSettingInlineSingleChoiceHtml(
  params: RenderInlineSingleChoiceParams,
): string {
  const layout = params.layout ?? "wrap";
  const containerClass =
    layout === "vertical"
      ? "flex flex-col gap-2"
      : "flex flex-wrap items-center gap-x-3 gap-y-2";
  const radios = params.options
    .map((opt) => {
      const checked = params.currentValue === opt.value;
      return `
        <label class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
          <input
            type="radio"
            name="${escapeHtml(params.groupName)}"
            value="${escapeHtml(opt.value)}"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS}"
            ${checked ? "checked" : ""}
            ${params.radioDataAttr}="${escapeHtml(opt.value)}"
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    })
    .join("");
  return `<div class="${containerClass}" role="radiogroup">${radios}</div>`;
}

export type RenderCheckboxChoiceParams = {
  options: readonly ModuleSettingChoiceOption[];
  selectedValues: ReadonlySet<string>;
  checkboxDataAttr: string;
  getItemAttrs?: (value: string, label: string) => Record<string, string>;
  layout?: "wrap" | "grid";
};

/** 多选：选项始终可见，使用 checkbox */
export function renderModuleSettingCheckboxChoiceHtml(params: RenderCheckboxChoiceParams): string {
  const layout = params.layout ?? "wrap";
  const containerClass =
    layout === "grid"
      ? "grid grid-cols-2 gap-2 sm:grid-cols-3"
      : "flex flex-wrap gap-x-4 gap-y-2";
  const cells = params.options
    .map((opt) => {
      const checked = params.selectedValues.has(opt.value);
      const extraAttrs = params.getItemAttrs?.(opt.value, opt.label) ?? {};
      const attrStr = Object.entries(extraAttrs)
        .map(([k, v]) => ` ${k}="${escapeHtml(v)}"`)
        .join("");
      return `
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
            value="${escapeHtml(opt.value)}"
            ${checked ? "checked" : ""}
            ${params.checkboxDataAttr}="1"${attrStr}
          />
          <span>${escapeHtml(opt.label)}</span>
        </label>`;
    })
    .join("");
  return `<div class="${containerClass}" role="group">${cells}</div>`;
}
