/**
 * 业态×产线预设运行时：静态种子 + API 运营覆盖
 */
import type { BusinessTypeTag } from "./feature-registry";
import type { PresetFeatureEntry } from "./feature-presets";
import type { PresetSettingConfig } from "./feature-presets-setting-config";
import { getBaseVariantsCatalog } from "./feature-presets-catalog-runtime";
import { reconcileVariantSubtreeIncludes } from "./feature-presets-subtree-includes";
import { invalidateVisibilityContextCache } from "./feature-visibility";
import { buildVariantId, type BusinessProductLineVariant } from "./feature-presets-variants";

export interface BusinessProductLineVariantOverride {
  features?: PresetFeatureEntry[];
  excludes?: string[];
  includes?: string[];
  l2Includes?: string[];
  l3Includes?: string[];
  l2Excludes?: string[];
  l3Excludes?: string[];
  settingConfigs?: Record<string, PresetSettingConfig>;
  version?: number;
  updatedAt?: string;
  note?: string;
}

let variantOverrides: Record<string, BusinessProductLineVariantOverride> = {};
const mergedVariantCache = new Map<string, BusinessProductLineVariant>();

function overrideCacheKey(id: string, o: BusinessProductLineVariantOverride): string {
  return `${id}:${JSON.stringify(o)}`;
}

export function setBusinessProductLineVariantOverrides(
  overrides: Record<string, BusinessProductLineVariantOverride> | null | undefined,
): void {
  variantOverrides = overrides ? { ...overrides } : {};
  mergedVariantCache.clear();
  invalidateVisibilityContextCache();
}

export function getBusinessProductLineVariantOverrides(): Record<string, BusinessProductLineVariantOverride> {
  return { ...variantOverrides };
}

function mergeVariant(base: BusinessProductLineVariant): BusinessProductLineVariant {
  const o = variantOverrides[base.id];
  const cacheKey = o ? overrideCacheKey(base.id, o) : base.id;
  const cached = mergedVariantCache.get(cacheKey);
  if (cached) return cached;

  const merged: BusinessProductLineVariant = o
    ? {
        ...base,
        features: Array.isArray(o.features) ? o.features : base.features,
        excludes: o.excludes !== undefined ? o.excludes : base.excludes,
        includes: o.includes !== undefined ? o.includes : base.includes,
        l2Includes: o.l2Includes !== undefined ? o.l2Includes : base.l2Includes,
        l3Includes: o.l3Includes !== undefined ? o.l3Includes : base.l3Includes,
        l2Excludes: o.l2Excludes !== undefined ? o.l2Excludes : base.l2Excludes,
        l3Excludes: o.l3Excludes !== undefined ? o.l3Excludes : base.l3Excludes,
        settingConfigs: o.settingConfigs !== undefined ? o.settingConfigs : base.settingConfigs,
        version: o.version !== undefined ? o.version : base.version,
      }
    : base;
  const reconciled = reconcileVariantSubtreeIncludes(merged);
  mergedVariantCache.set(cacheKey, reconciled);
  return reconciled;
}

function findBaseVariant(id: string): BusinessProductLineVariant | undefined {
  return getBaseVariantsCatalog().find((v) => v.id === id);
}

export function getEffectiveBusinessProductLineVariants(): BusinessProductLineVariant[] {
  return getBaseVariantsCatalog().map(mergeVariant);
}

export function getEffectiveBusinessProductLineVariant(id: string): BusinessProductLineVariant | undefined {
  const base = findBaseVariant(id);
  if (!base) return undefined;
  return mergeVariant(base);
}

export function getEffectiveVariantForPair(
  businessType: BusinessTypeTag,
  productLinePresetId: string,
): BusinessProductLineVariant | undefined {
  return getEffectiveBusinessProductLineVariant(buildVariantId(businessType, productLinePresetId));
}

export interface ResolvedVariantDeltas {
  l2Includes: Set<string>;
  l3Includes: Set<string>;
  l2Excludes: Set<string>;
  l3Excludes: Set<string>;
  settingConfigs: Record<string, PresetSettingConfig>;
}

/** 按主业态 + 产线组合键列表聚合预设（次业态不参与） */
export function resolveVariantDeltasForTenant(
  primaryBusinessType: BusinessTypeTag,
  productLinePresetIds: string[],
): ResolvedVariantDeltas {
  const l2Includes = new Set<string>();
  const l3Includes = new Set<string>();
  const l2Excludes = new Set<string>();
  const l3Excludes = new Set<string>();
  const settingConfigs: Record<string, PresetSettingConfig> = {};

  for (const presetId of productLinePresetIds) {
    const variant = getEffectiveVariantForPair(primaryBusinessType, presetId);
    if (!variant) continue;
    for (const id of variant.l2Includes ?? []) l2Includes.add(id);
    for (const id of variant.l3Includes ?? []) l3Includes.add(id);
    for (const id of variant.l2Excludes ?? []) l2Excludes.add(id);
    for (const id of variant.l3Excludes ?? []) l3Excludes.add(id);
    if (variant.settingConfigs) Object.assign(settingConfigs, variant.settingConfigs);
  }

  return { l2Includes, l3Includes, l2Excludes, l3Excludes, settingConfigs };
}

/** 引导/确认页：列出当前主业态 + 产线组合键命中的有效预设 */
export function listEffectiveVariantsForTenant(
  primaryBusinessType: BusinessTypeTag,
  productLinePresetIds: string[],
): BusinessProductLineVariant[] {
  const out: BusinessProductLineVariant[] = [];
  for (const presetId of productLinePresetIds) {
    const v = getEffectiveVariantForPair(primaryBusinessType, presetId);
    if (v) out.push(v);
  }
  return out;
}
