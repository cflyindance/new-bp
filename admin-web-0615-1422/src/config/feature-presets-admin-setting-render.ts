/**
 * 产线预设编辑 — 设置项内联控件渲染与状态读写
 */
import { t } from "../i18n";
import type { PresetSettingConfig } from "./feature-presets-setting-config";
import { resolveSeqFromLeafId } from "./feature-presets-setting-config";
import {
  getPresetSettingSchema,
  type PresetSettingControl,
  type PresetSettingSchema,
} from "./feature-presets-setting-schema";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fieldValue(
  config: PresetSettingConfig | undefined,
  ctrl: PresetSettingControl,
): boolean | number | string | string[] {
  if (ctrl.kind === "toggle") {
    return config?.toggleOn ?? ctrl.defaultOn;
  }
  const fields = config?.fields ?? {};
  if (ctrl.kind === "lineMultiselect") {
    const v = fields[ctrl.fieldId];
    return Array.isArray(v) ? v : ctrl.default;
  }
  if (ctrl.kind === "number") {
    const v = fields[ctrl.fieldId];
    return typeof v === "number" ? v : ctrl.default;
  }
  if (ctrl.kind === "checkbox") {
    const v = fields[ctrl.fieldId];
    return typeof v === "boolean" ? v : ctrl.default;
  }
  if (ctrl.kind === "radio") {
    const v = fields[ctrl.fieldId];
    return typeof v === "string" ? v : ctrl.default;
  }
  return false;
}

function renderControlHtml(leafId: string, ctrl: PresetSettingControl, config: PresetSettingConfig | undefined): string {
  const val = fieldValue(config, ctrl);
  switch (ctrl.kind) {
    case "toggle": {
      const on = val === true;
      return `
        <div class="flex items-center justify-between gap-2 text-xs">
          <span class="text-muted-foreground">${escapeHtml(ctrl.label)}</span>
          <select class="h-7 rounded border border-input bg-background px-2 text-xs"
            data-preset-setting-toggle data-leaf-id="${escapeHtml(leafId)}">
            <option value="on" ${on ? "selected" : ""}>${escapeHtml(t("featurePresets.settingOn"))}</option>
            <option value="off" ${!on ? "selected" : ""}>${escapeHtml(t("featurePresets.settingOff"))}</option>
          </select>
        </div>`;
    }
    case "number":
      return `
        <label class="flex items-center justify-between gap-2 text-xs">
          <span class="text-muted-foreground">${escapeHtml(ctrl.label)}</span>
          <input type="number" class="h-7 w-20 rounded border border-input bg-background px-2 text-right text-xs tabular-nums"
            data-preset-setting-field="${escapeHtml(ctrl.fieldId)}" data-leaf-id="${escapeHtml(leafId)}"
            value="${escapeHtml(String(val))}"
            ${ctrl.min !== undefined ? `min="${ctrl.min}"` : ""}
            ${ctrl.max !== undefined ? `max="${ctrl.max}"` : ""} />
        </label>`;
    case "checkbox":
      return `
        <label class="flex items-center gap-2 text-xs">
          <input type="checkbox" class="rounded border-border"
            data-preset-setting-field="${escapeHtml(ctrl.fieldId)}" data-leaf-id="${escapeHtml(leafId)}"
            ${val ? "checked" : ""} />
          <span>${escapeHtml(ctrl.label)}</span>
        </label>`;
    case "radio":
      return `
        <div class="space-y-1 text-xs">
          <p class="text-muted-foreground">${escapeHtml(ctrl.label)}</p>
          ${ctrl.options
            .map(
              (o) => `
            <label class="flex items-center gap-2">
              <input type="radio" name="preset-radio-${escapeHtml(leafId)}-${escapeHtml(ctrl.fieldId)}"
                data-preset-setting-field="${escapeHtml(ctrl.fieldId)}" data-leaf-id="${escapeHtml(leafId)}"
                value="${escapeHtml(o.value)}" ${val === o.value ? "checked" : ""} />
              <span>${escapeHtml(o.label)}</span>
            </label>`,
            )
            .join("")}
        </div>`;
    case "lineMultiselect": {
      const selected = Array.isArray(val) ? val : ctrl.default;
      return `
        <div class="space-y-1 text-xs">
          <p class="text-muted-foreground">${escapeHtml(ctrl.label)}</p>
          <div class="flex flex-wrap gap-x-3 gap-y-1">
            ${ctrl.options
              .map(
                (o) => `
              <label class="flex items-center gap-1">
                <input type="checkbox" class="rounded border-border"
                  data-preset-setting-line="${escapeHtml(o.id)}" data-line-field="${escapeHtml(ctrl.fieldId)}"
                  data-leaf-id="${escapeHtml(leafId)}" ${selected.includes(o.id) ? "checked" : ""} />
                <span>${escapeHtml(o.label)}</span>
              </label>`,
              )
              .join("")}
          </div>
        </div>`;
    }
    default:
      return "";
  }
}

export function renderPresetSettingLeafCard(
  leafId: string,
  label: string,
  enabled: boolean,
  config: PresetSettingConfig | undefined,
): string {
  const excluded = !enabled;
  const seq = resolveSeqFromLeafId(leafId);
  const schema = seq !== null ? getPresetSettingSchema(seq) : null;

  if (!schema) {
    return `
      <label class="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40">
        <input type="checkbox" class="mt-0.5 rounded border-border" data-l3-enable="${escapeHtml(leafId)}" ${enabled ? "checked" : ""} />
        <span>${escapeHtml(label)}</span>
      </label>`;
  }

  const panelDisabled = excluded ? "opacity-50 pointer-events-none" : "";
  const controlsHtml = schema.controls.map((c) => renderControlHtml(leafId, c, config)).join("");

  return `
    <div class="rounded-md border border-border/70 px-2 py-2 text-sm" data-preset-setting-card="${escapeHtml(leafId)}">
      <div class="flex items-start justify-between gap-2">
        <span class="font-medium leading-snug">${escapeHtml(label)}</span>
        <label class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <input type="checkbox" class="rounded border-border" data-l3-enable="${escapeHtml(leafId)}" ${enabled ? "checked" : ""} />
          <span>${escapeHtml(t("featurePresets.treeIncludeItem"))}</span>
        </label>
      </div>
      <div class="mt-2 space-y-2 border-t border-border/60 pt-2 ${panelDisabled}" data-preset-setting-panel="${escapeHtml(leafId)}">
        ${controlsHtml}
      </div>
    </div>`;
}

function readConfigFromCard(
  leafId: string,
  schema: PresetSettingSchema,
  card: HTMLElement,
): PresetSettingConfig | undefined {
  const config: PresetSettingConfig = { fields: {} };
  let hasValue = false;

  for (const ctrl of schema.controls) {
    if (ctrl.kind === "toggle") {
      const sel = card.querySelector<HTMLSelectElement>(
        `[data-preset-setting-toggle][data-leaf-id="${CSS.escape(leafId)}"]`,
      );
      if (sel) {
        config.toggleOn = sel.value === "on";
        hasValue = true;
      }
      continue;
    }

    if (ctrl.kind === "lineMultiselect") {
      const lines: string[] = [];
      card.querySelectorAll<HTMLInputElement>(
        `[data-preset-setting-line][data-leaf-id="${CSS.escape(leafId)}"]`,
      ).forEach((input) => {
        if (input.checked) lines.push(input.dataset.presetSettingLine!);
      });
      config.fields![ctrl.fieldId] = lines;
      hasValue = true;
      continue;
    }

    if (ctrl.kind === "radio") {
      const checked = card.querySelector<HTMLInputElement>(
        `[data-preset-setting-field="${CSS.escape(ctrl.fieldId)}"][data-leaf-id="${CSS.escape(leafId)}"]:checked`,
      );
      if (checked) {
        config.fields![ctrl.fieldId] = checked.value;
        hasValue = true;
      }
      continue;
    }

    const input = card.querySelector<HTMLInputElement>(
      `[data-preset-setting-field="${CSS.escape(ctrl.fieldId)}"][data-leaf-id="${CSS.escape(leafId)}"]`,
    );
    if (!input) continue;

    if (ctrl.kind === "number") {
      const n = Number(input.value);
      if (Number.isFinite(n)) {
        config.fields![ctrl.fieldId] = n;
        hasValue = true;
      }
    } else if (ctrl.kind === "checkbox") {
      config.fields![ctrl.fieldId] = input.checked;
      hasValue = true;
    }
  }

  if (!hasValue) return undefined;
  if (config.fields && Object.keys(config.fields).length === 0) delete config.fields;
  return config;
}

export function bindPresetSettingLeafEvents(
  container: ParentNode,
  leafId: string,
  onConfigChange: (leafId: string, config: PresetSettingConfig | undefined) => void,
): void {
  const seq = resolveSeqFromLeafId(leafId);
  const schema = seq !== null ? getPresetSettingSchema(seq) : null;
  if (!schema) return;

  const card = container.querySelector<HTMLElement>(`[data-preset-setting-card="${CSS.escape(leafId)}"]`);
  if (!card) return;

  const sync = () => {
    onConfigChange(leafId, readConfigFromCard(leafId, schema, card));
  };

  card.querySelectorAll<HTMLElement>(
    "[data-preset-setting-toggle], [data-preset-setting-field], [data-preset-setting-line]",
  ).forEach((el) => {
    el.addEventListener("change", sync);
    if (el instanceof HTMLInputElement && el.type === "number") {
      el.addEventListener("input", sync);
    }
  });
}
