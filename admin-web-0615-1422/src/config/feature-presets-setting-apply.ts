/**

 * 将产线预设 + 业态×产线变体的 settingConfigs 写入模块设置存储（localStorage 原型）

 */

import type { PresetSettingConfig } from "./feature-presets-setting-config";

import { resolveSeqFromLeafId } from "./feature-presets-setting-config";

import { getPresetSettingSchema } from "./feature-presets-setting-schema";

import {

  writeModuleSettingCheckbox,

  writeModuleSettingJson,

  writeModuleSettingNumber,

  writeModuleSettingRadio,

} from "./module-settings-form-ui";

import { writeModuleSettingToggleOn } from "./module-settings-toggle-ui";

import { getEffectiveVariantForPair } from "./feature-presets-variant-runtime";

import { collectSubtreeWhitelists, isProfileFilteringActive, profileToInput, type TenantProfileInput } from "./feature-visibility";

import { loadTenantProfile } from "./tenant-profile-storage";



function applyOneConfig(
  leafId: string,
  config: PresetSettingConfig,
  gate: { l3Includes: Set<string>; l3Excludes: Set<string>; whitelistMode: boolean },
): void {
  if (gate.whitelistMode) {
    if (!gate.l3Includes.has(leafId)) return;
  } else if (gate.l3Excludes.has(leafId)) {
    return;
  }

  const seq = resolveSeqFromLeafId(leafId);

  if (!seq) return;

  const schema = getPresetSettingSchema(seq);

  if (!schema) return;



  if (config.toggleOn !== undefined) {

    writeModuleSettingToggleOn(seq, config.toggleOn);

  }



  for (const [fieldId, value] of Object.entries(config.fields ?? {})) {

    if (typeof value === "boolean") {

      writeModuleSettingCheckbox(fieldId, value);

    } else if (typeof value === "number") {

      writeModuleSettingNumber(fieldId, value);

    } else if (typeof value === "string") {

      writeModuleSettingRadio(fieldId, value);

    } else if (Array.isArray(value)) {

      writeModuleSettingJson(fieldId, value);

    }

  }

}



export function applyPresetSettingConfigs(
  configs: Record<string, PresetSettingConfig> | undefined,
  gate: { l3Includes?: Iterable<string>; l3Excludes?: Iterable<string>; whitelistMode?: boolean } = {},
): void {
  if (!configs) return;
  const l3Includes = new Set(gate.l3Includes ?? []);
  const l3Excludes = new Set(gate.l3Excludes ?? []);
  const whitelistMode = gate.whitelistMode ?? false;
  for (const [leafId, config] of Object.entries(configs)) {
    applyOneConfig(leafId, config, { l3Includes, l3Excludes, whitelistMode });
  }
}

function collectPresetLayer(input: TenantProfileInput): {
  l3Includes: Set<string>;
  l3Excludes: Set<string>;
  whitelistMode: boolean;
  settingConfigs: Record<string, PresetSettingConfig>;
} {
  const { l3Includes, whitelistMode } = collectSubtreeWhitelists(input);
  const l3Excludes = new Set<string>();
  const settingConfigs: Record<string, PresetSettingConfig> = {};

  for (const presetId of input.productLinePresetIds) {
    const preset = getEffectiveVariantForPair(input.primaryBusinessType, presetId);
    if (!preset) continue;
    for (const x of preset.l3Excludes ?? []) l3Excludes.add(x);
    if (preset.settingConfigs) Object.assign(settingConfigs, preset.settingConfigs);
  }

  return { l3Includes, l3Excludes, whitelistMode, settingConfigs };
}



/** 租户画像生效后，将关联产线预设 + 变体的设置值写入 localStorage */

export function applyActiveTenantPresetSettings(profile = loadTenantProfile()): void {

  if (!profile || !isProfileFilteringActive(profile)) return;

  if ((profile.productLinePresetIds ?? []).length === 0) return;



  const input: TenantProfileInput = {

    primaryBusinessType: profile.primaryBusinessType,

    secondaryBusinessType: profile.secondaryBusinessType,

    productLinePresetIds: profile.productLinePresetIds,

    productLines: profile.productLines,

    addedFeatures: profile.addedFeatures,

    removedFeatures: profile.removedFeatures,

  };

  const { l3Includes, l3Excludes, whitelistMode, settingConfigs } = collectPresetLayer(input);

  applyPresetSettingConfigs(settingConfigs, { l3Includes, l3Excludes, whitelistMode });
}

export function applyPresetSettingsForInput(input: TenantProfileInput): void {
  const { l3Includes, l3Excludes, whitelistMode, settingConfigs } = collectPresetLayer(input);

  applyPresetSettingConfigs(settingConfigs, { l3Includes, l3Excludes, whitelistMode });
}


