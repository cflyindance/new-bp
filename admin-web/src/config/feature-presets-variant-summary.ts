/**
 * 业态×产线变体 — 租户侧摘要展示
 */
import type { BusinessProductLineVariant } from "./feature-presets-variants";
import { resolveSeqFromLeafId, type PresetSettingConfig } from "./feature-presets-setting-config";
import { MODULE_SETTINGS_BY_PATH, getModuleSettingsItemHref } from "./module-settings-catalog";

export interface VariantDiffCounts {
  l1Enabled: number;
  l2Excludes: number;
  l3Excludes: number;
  settingConfigs: number;
}

export function countVariantDiffs(variant: BusinessProductLineVariant): VariantDiffCounts {
  return {
    l1Enabled: variant.features?.length ?? 0,
    l2Excludes: variant.l2Excludes?.length ?? 0,
    l3Excludes: variant.l3Excludes?.length ?? 0,
    settingConfigs: Object.keys(variant.settingConfigs ?? {}).length,
  };
}

function resolveSettingLabel(leafId: string): string {
  if (leafId.startsWith("set:")) {
    const seq = Number(leafId.slice(4));
    if (Number.isFinite(seq)) {
      for (const hub of Object.values(MODULE_SETTINGS_BY_PATH)) {
        const item = hub.items.find((i) => i.seq === seq);
        if (item) return item.title;
      }
      return `seq ${seq}`;
    }
  }
  if (leafId.startsWith("l4:")) {
    const href = leafId.slice(3);
    for (const hub of Object.values(MODULE_SETTINGS_BY_PATH)) {
      for (const item of hub.items) {
        if (getModuleSettingsItemHref(hub.settingsPath, item) === href) return item.title;
      }
    }
  }
  if (leafId.startsWith("set-grp:")) return leafId.split(":").slice(2).join(" · ");
  return leafId;
}

/** 单条设置预设的可读值 */
export function formatVariantSettingBrief(config: PresetSettingConfig): string {
  if (config.toggleOn !== undefined) {
    return config.toggleOn ? "开启" : "关闭";
  }
  const numField = Object.entries(config.fields ?? {}).find(([, v]) => typeof v === "number");
  if (numField) return String(numField[1]);
  return "已预设";
}

/** 变体 settingConfigs 的可读摘要（最多 limit 条） */
export function listVariantSettingHighlights(
  variant: BusinessProductLineVariant,
  limit = 4,
): string[] {
  const out: string[] = [];
  for (const [leafId, config] of Object.entries(variant.settingConfigs ?? {})) {
    if (out.length >= limit) break;
    const label = resolveSettingLabel(leafId);
    if (config.toggleOn !== undefined) {
      out.push(`${label}：${config.toggleOn ? "开启" : "关闭"}`);
      continue;
    }
    const numField = Object.entries(config.fields ?? {}).find(([, v]) => typeof v === "number");
    if (numField) {
      out.push(`${label}：${numField[1]}`);
      continue;
    }
    if (resolveSeqFromLeafId(leafId)) out.push(label);
  }
  const total = Object.keys(variant.settingConfigs ?? {}).length;
  if (total > limit) out.push(`… 共 ${total} 项设置预设`);
  return out;
}
