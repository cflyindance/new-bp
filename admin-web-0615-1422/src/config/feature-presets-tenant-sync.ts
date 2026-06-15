/**
 * 租户功能画像与平台预设变体同步（平台预设为 SSOT）
 */
import { getEffectiveBusinessTypePresets } from "./feature-presets-catalog-runtime";
import { listEffectiveVariantsForTenant } from "./feature-presets-variant-runtime";
import { invalidateVisibilityContextCache, mergePresets, profileToInput } from "./feature-visibility";
import type { TenantProfile } from "./tenant-profile-storage";

function buildPresetVersionsSnapshot(profile: TenantProfile): TenantProfile["presetVersions"] {
  const productLine: Record<string, number> = {};
  for (const presetId of profile.productLinePresetIds) {
    const variant = listEffectiveVariantsForTenant(profile.primaryBusinessType, [presetId])[0];
    productLine[presetId] = variant?.version ?? profile.presetVersions?.productLine?.[presetId] ?? 1;
  }
  const businessPreset = getEffectiveBusinessTypePresets().find((p) => p.id === profile.primaryBusinessType);
  return {
    business: businessPreset?.version ?? profile.presetVersions?.business ?? 1,
    productLine,
  };
}

/** 平台变体 version 升级后，清除租户功能覆盖层并以平台预设为准 */
export function reconcileTenantProfileWithPlatformPresets(profile: TenantProfile): TenantProfile {
  if (!profile.onboardingCompleted && !profile.implementationPreConfigured) {
    return profile;
  }

  const variants = listEffectiveVariantsForTenant(profile.primaryBusinessType, profile.productLinePresetIds);
  const presetVersionBumped = variants.some((variant) => {
    const prev = profile.presetVersions?.productLine?.[variant.productLinePresetId] ?? 0;
    return (variant.version ?? 1) > prev;
  });

  if (!presetVersionBumped) {
    return profile;
  }

  const next: TenantProfile = {
    ...profile,
    removedFeatures: [],
    addedFeatures: [],
    presetVersions: buildPresetVersionsSnapshot(profile),
  };
  const input = profileToInput(next);
  next.enabledFeatures = [...mergePresets(input)];
  invalidateVisibilityContextCache();
  return next;
}
