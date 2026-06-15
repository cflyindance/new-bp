/**
 * 产线预设 — 设置项值配置（非仅排除）
 */
import { MODULE_SETTINGS_BY_PATH, getModuleSettingsItemHref } from "./module-settings-catalog";

/** 单字段值：开关 / 数字 / 单选 / 产线多选等 */
export type PresetSettingFieldValue = boolean | number | string | string[];

/** 某设置叶子（catalog 项）的预设值 */
export interface PresetSettingConfig {
  /** 主开关类设置（seq 107/619 及通用 toggle） */
  toggleOn?: boolean;
  /** fieldId → 值（数字、子选项 checkbox、产线多选 JSON 等） */
  fields?: Record<string, PresetSettingFieldValue>;
}

export function resolveSeqFromLeafId(leafId: string): number | null {
  if (leafId.startsWith("set:")) {
    const n = Number(leafId.slice(4));
    return Number.isFinite(n) ? n : null;
  }
  if (leafId.startsWith("l4:")) {
    const href = leafId.slice(3);
    for (const hub of Object.values(MODULE_SETTINGS_BY_PATH)) {
      for (const item of hub.items) {
        if (getModuleSettingsItemHref(hub.settingsPath, item) === href) return item.seq;
      }
    }
  }
  return null;
}

export function serializeSettingConfigs(
  map: Map<string, PresetSettingConfig>,
): Record<string, PresetSettingConfig> | undefined {
  if (map.size === 0) return undefined;
  const out: Record<string, PresetSettingConfig> = {};
  for (const [k, v] of map) {
    if (v.toggleOn !== undefined || (v.fields && Object.keys(v.fields).length > 0)) {
      out[k] = v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function deserializeSettingConfigs(
  raw?: Record<string, PresetSettingConfig> | null,
): Map<string, PresetSettingConfig> {
  const map = new Map<string, PresetSettingConfig>();
  if (!raw) return map;
  for (const [k, v] of Object.entries(raw)) {
    if (v && (v.toggleOn !== undefined || (v.fields && Object.keys(v.fields).length > 0))) {
      map.set(k, { ...v, fields: v.fields ? { ...v.fields } : undefined });
    }
  }
  return map;
}
