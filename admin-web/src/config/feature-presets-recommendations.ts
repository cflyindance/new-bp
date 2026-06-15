/**
 * 业态 × 产线 — 推荐默认 L1 功能（平台预设种子 / 引导 / 编辑页「恢复推荐」）
 */
import {
  FEATURE_REGISTRY_L1,
  PLATFORM_PRESET_DEFAULT_L1,
  type BusinessTypeTag,
  type FeatureTier,
  type ProductLineTag,
} from "./feature-registry";
import { BUSINESS_TYPE_PRESETS, type BusinessTypePreset, type PresetFeatureEntry } from "./feature-presets";
import { getProductLineKeyTemplate } from "./feature-presets-line-templates";

function resolveBusinessPreset(
  businessType: BusinessTypeTag,
  override?: BusinessTypePreset,
): BusinessTypePreset | undefined {
  return override ?? BUSINESS_TYPE_PRESETS.find((p) => p.id === businessType);
}

/** L1 是否被当前产线组合支持（与 feature-visibility 产线 scope 一致） */
export function isModuleSupportedByProductLines(moduleId: string, productLines: ProductLineTag[]): boolean {
  const meta = FEATURE_REGISTRY_L1.find((m) => m.moduleId === moduleId);
  if (!meta) return false;
  if (meta.productLineScope === "agnostic") return true;
  if (meta.productLines.length === 0) return true;
  const selected = new Set(productLines);
  return meta.productLineScope === "all"
    ? meta.productLines.every((line) => selected.has(line))
    : meta.productLines.some((line) => selected.has(line));
}

function pickTier(
  businessTier: FeatureTier | undefined,
  lineTier: FeatureTier | undefined,
  metaTier: FeatureTier | undefined,
): FeatureTier {
  return businessTier ?? lineTier ?? metaTier ?? "recommended";
}

/** 「全功能 / 不确定」业态：默认启用注册表全部 L1（不受产线 scope 约束） */
export const FULL_FEATURE_BUSINESS_TYPE = "general" as const;

/**
 * 指定业态×产线变体：平台预设默认全选 L1/L2/L3（与全功能业态相同策略）
 * 快餐 + eMenu / 快餐 + SDI
 */
export const FULL_FEATURE_VARIANT_KEYS = ["fast-food:emenu-only", "fast-food:sdi-only"] as const;

export type FullFeatureVariantKey = (typeof FULL_FEATURE_VARIANT_KEYS)[number];

export function buildFullFeatureVariantKey(
  businessType: BusinessTypeTag,
  productLinePresetId: string,
): string {
  return `${businessType}:${productLinePresetId}`;
}

export function isFullFeatureBusinessType(businessType: BusinessTypeTag): boolean {
  return businessType === FULL_FEATURE_BUSINESS_TYPE;
}

export function isFullFeatureVariant(businessType: BusinessTypeTag, productLinePresetId: string): boolean {
  return (FULL_FEATURE_VARIANT_KEYS as readonly string[]).includes(
    buildFullFeatureVariantKey(businessType, productLinePresetId),
  );
}

/** 租户画像是否应按「全量预设」跳过产线 scope 过滤（general 或含全量变体） */
export function shouldUseFullFeaturePresetScope(input: {
  primaryBusinessType: BusinessTypeTag;
  productLinePresetIds: string[];
}): boolean {
  if (isFullFeatureBusinessType(input.primaryBusinessType)) return true;
  return input.productLinePresetIds.some((id) => isFullFeatureVariant(input.primaryBusinessType, id));
}

/** 合并平台级默认开通 L1（不受业态/产线模板 excludes 影响） */
function applyPlatformPresetDefaultL1(enabled: Map<string, FeatureTier>): void {
  for (const id of PLATFORM_PRESET_DEFAULT_L1) {
    if (enabled.has(id)) continue;
    const meta = FEATURE_REGISTRY_L1.find((m) => m.moduleId === id);
    enabled.set(id, meta?.tier ?? "core");
  }
}

function mapToSortedPresetFeatures(enabled: Map<string, FeatureTier>): PresetFeatureEntry[] {
  applyPlatformPresetDefaultL1(enabled);
  return [...enabled.entries()]
    .map(([featureId, tier]) => ({ featureId, tier }))
    .sort((a, b) => a.featureId.localeCompare(b.featureId));
}

/**
 * 计算业态×产线变体默认应勾选的 L1：
 * - 全功能 / 不确定，或快餐+eMenu / 快餐+SDI：注册表全部 L1 默认开通
 * - 其他业态：agnostic core + 业态/产线 core·recommended 交集
 */
export function computeRecommendedVariantFeatures(
  businessType: BusinessTypeTag,
  productLinePresetId: string,
  businessPresetOverride?: BusinessTypePreset,
): PresetFeatureEntry[] {
  const bt = resolveBusinessPreset(businessType, businessPresetOverride);
  const lineTpl = getProductLineKeyTemplate(productLinePresetId);
  if (!lineTpl) return [];

  if (isFullFeatureBusinessType(businessType) || isFullFeatureVariant(businessType, productLinePresetId)) {
    const btTier = new Map((bt?.features ?? []).map((f) => [f.featureId, f.tier]));
    const enabled = new Map<string, FeatureTier>();
    for (const meta of FEATURE_REGISTRY_L1) {
      enabled.set(meta.moduleId, btTier.get(meta.moduleId) ?? meta.tier ?? "recommended");
    }
    return mapToSortedPresetFeatures(enabled);
  }

  const productLines = lineTpl.productLines;
  const btTier = new Map((bt?.features ?? []).map((f) => [f.featureId, f.tier]));
  const lineTier = new Map(lineTpl.features.map((f) => [f.featureId, f.tier]));

  const candidateIds = new Set<string>([
    ...lineTier.keys(),
    ...btTier.keys(),
    ...FEATURE_REGISTRY_L1.filter((m) => m.productLineScope === "agnostic" && m.tier === "core").map(
      (m) => m.moduleId,
    ),
  ]);

  const enabled = new Map<string, FeatureTier>();

  for (const id of candidateIds) {
    if (!isModuleSupportedByProductLines(id, productLines)) continue;

    const meta = FEATURE_REGISTRY_L1.find((m) => m.moduleId === id);
    const b = btTier.get(id);
    const l = lineTier.get(id);
    const m = meta?.tier;

    let on = false;

    if (meta?.productLineScope === "agnostic" && m === "core") {
      on = true;
    } else if (b === "core" || l === "core") {
      on = true;
    } else if (b === "recommended" && l !== undefined) {
      on = true;
    } else if (l === "recommended" && b !== "optional" && b !== "advanced") {
      on = true;
    }

    if (on) enabled.set(id, pickTier(b, l, m));
  }

  return mapToSortedPresetFeatures(enabled);
}

export function getRecommendedL1Ids(
  businessType: BusinessTypeTag,
  productLinePresetId: string,
  businessPresetOverride?: BusinessTypePreset,
): Set<string> {
  return new Set(
    computeRecommendedVariantFeatures(businessType, productLinePresetId, businessPresetOverride).map(
      (f) => f.featureId,
    ),
  );
}

export function getBusinessTypeFeatureTierMap(
  businessType: BusinessTypeTag,
  businessPresetOverride?: BusinessTypePreset,
): Map<string, FeatureTier> {
  const bt = resolveBusinessPreset(businessType, businessPresetOverride);
  return new Map((bt?.features ?? []).map((f) => [f.featureId, f.tier]));
}
