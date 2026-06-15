/**
 * 连锁功能画像合并 — tenant → brand → store（P3）
 */
import { mergePresets } from "./feature-visibility";
import type { TenantProfile } from "./tenant-profile-storage";
import { resolveProductLinesFromPresetIds } from "./tenant-profile-storage";

export interface ProfileLayers {
  tenant: TenantProfile;
  brand?: TenantProfile | null;
  store?: TenantProfile | null;
}

export function mergeProfileLayer(base: TenantProfile, layer: Partial<TenantProfile> | null | undefined): TenantProfile {
  if (!layer) return { ...base };

  const productLinePresetIds =
    layer.productLinePresetIds && layer.productLinePresetIds.length > 0
      ? [...layer.productLinePresetIds]
      : [...base.productLinePresetIds];

  const productLines =
    layer.productLines && layer.productLines.length > 0
      ? [...layer.productLines]
      : productLinePresetIds.length > 0
        ? resolveProductLinesFromPresetIds(productLinePresetIds)
        : [...base.productLines];

  const merged: TenantProfile = {
    ...base,
    ...layer,
    productLinePresetIds,
    productLines,
    addedFeatures: [...new Set([...base.addedFeatures, ...(layer.addedFeatures ?? [])])],
    removedFeatures: [...new Set([...base.removedFeatures, ...(layer.removedFeatures ?? [])])],
    primaryBusinessType: layer.primaryBusinessType ?? base.primaryBusinessType,
    secondaryBusinessType: layer.secondaryBusinessType ?? base.secondaryBusinessType,
    onboardingCompleted: layer.onboardingCompleted ?? base.onboardingCompleted,
    implementationPreConfigured: layer.implementationPreConfigured ?? base.implementationPreConfigured,
  };

  merged.enabledFeatures = [
    ...mergePresets({
      primaryBusinessType: merged.primaryBusinessType,
      secondaryBusinessType: merged.secondaryBusinessType,
      productLinePresetIds: merged.productLinePresetIds,
      productLines: merged.productLines,
      addedFeatures: merged.addedFeatures,
      removedFeatures: merged.removedFeatures,
    }),
  ];

  return merged;
}

export function resolveProfileFromLayers(layers: ProfileLayers): TenantProfile {
  let merged: TenantProfile = { ...layers.tenant };
  if (layers.brand) merged = mergeProfileLayer(merged, layers.brand);
  if (layers.store) merged = mergeProfileLayer(merged, layers.store);
  return merged;
}
