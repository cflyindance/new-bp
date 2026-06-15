/**
 * 业态 × 产线预设（唯一产线层）— 每个 (业态, 产线组合键) 一条完整记录
 */
import type { BusinessTypeTag, ProductLineTag } from "./feature-registry";
import { PLATFORM_PRESET_DEFAULT_L1 } from "./feature-registry";
import { BUSINESS_TYPE_PRESETS, type PresetFeatureEntry } from "./feature-presets";
import {
  getProductLineKeyTemplate,
  PRODUCT_LINE_KEY_TEMPLATES,
} from "./feature-presets-line-templates";
import { computeRecommendedVariantFeatures } from "./feature-presets-recommendations";
import { computeDefaultSubtreeIncludes } from "./feature-presets-subtree-includes";
import type { PresetSettingConfig } from "./feature-presets-setting-config";

export interface BusinessProductLineVariant {
  id: string;
  businessType: BusinessTypeTag;
  /** 产线组合键，如 emenu-only */
  productLinePresetId: string;
  title: string;
  titleEn: string;
  productLines: ProductLineTag[];
  features: PresetFeatureEntry[];
  /** L1 moduleId 硬排除（产线优先） */
  excludes: string[];
  /** L1 moduleId 强制包含（模块下 L2/L3 全部可见，优先于 excludes） */
  includes?: string[];
  /** L2 白名单：仅列出的二级入口可见 */
  l2Includes?: string[];
  /** L3/L4 白名单：仅列出的三级/设置项可见 */
  l3Includes?: string[];
  l2Excludes?: string[];
  l3Excludes?: string[];
  settingConfigs?: Record<string, PresetSettingConfig>;
  version: number;
}

export function buildVariantId(businessType: BusinessTypeTag, productLinePresetId: string): string {
  return `${businessType}:${productLinePresetId}`;
}

export function parseVariantId(id: string): { businessType: BusinessTypeTag; productLinePresetId: string } | null {
  const idx = id.indexOf(":");
  if (idx <= 0) return null;
  return {
    businessType: id.slice(0, idx) as BusinessTypeTag,
    productLinePresetId: id.slice(idx + 1),
  };
}

const ALL_BUSINESS_TYPES: BusinessTypeTag[] = BUSINESS_TYPE_PRESETS.map((b) => b.id);

const BUSINESS_TYPE_LABELS = Object.fromEntries(
  BUSINESS_TYPE_PRESETS.map((b) => [b.id, { title: b.title, titleEn: b.titleEn }]),
) as Record<BusinessTypeTag, { title: string; titleEn: string }>;

type VariantDelta = Pick<
  Partial<BusinessProductLineVariant>,
  "l2Excludes" | "l3Excludes" | "settingConfigs"
>;

/** 相对模板的业态差异化（默认全开，无硬排除） */
const VARIANT_DELTAS: Record<string, VariantDelta> = {};

function unionUnique(...lists: (string[] | undefined)[]): string[] | undefined {
  const out = new Set<string>();
  for (const list of lists) {
    if (!list) continue;
    for (const id of list) out.add(id);
  }
  return out.size > 0 ? [...out] : undefined;
}

function materializeVariant(businessType: BusinessTypeTag, lineKey: string): BusinessProductLineVariant {
  const template = getProductLineKeyTemplate(lineKey);
  if (!template) {
    throw new Error(`Unknown product line key: ${lineKey}`);
  }
  const delta = VARIANT_DELTAS[buildVariantId(businessType, lineKey)] ?? {};
  const bt = BUSINESS_TYPE_LABELS[businessType];
  const features = computeRecommendedVariantFeatures(businessType, lineKey);
  const l1Ids = new Set(features.map((f) => f.featureId));
  for (const id of PLATFORM_PRESET_DEFAULT_L1) {
    if (!l1Ids.has(id)) features.push({ featureId: id, tier: "core" });
  }
  features.sort((a, b) => a.featureId.localeCompare(b.featureId));
  const subtree = computeDefaultSubtreeIncludes(features.map((f) => f.featureId));
  const l2Block = new Set([...(template.l2Excludes ?? []), ...(delta.l2Excludes ?? [])]);
  const l3Block = new Set([...(template.l3Excludes ?? []), ...(delta.l3Excludes ?? [])]);
  const l2Includes = subtree.l2Includes.filter((id) => !l2Block.has(id));
  const l3Includes = subtree.l3Includes.filter((id) => !l3Block.has(id));
  return {
    id: buildVariantId(businessType, lineKey),
    businessType,
    productLinePresetId: lineKey,
    title: `${bt.title} · ${template.title}`,
    titleEn: `${bt.titleEn} · ${template.titleEn}`,
    productLines: [...template.productLines],
    features,
    excludes: [],
    l2Includes,
    l3Includes,
    l2Excludes: [],
    l3Excludes: [],
    settingConfigs: delta.settingConfigs,
    version: 1,
  };
}

export const BUSINESS_PRODUCT_LINE_VARIANTS: BusinessProductLineVariant[] = ALL_BUSINESS_TYPES.flatMap(
  (businessType) => PRODUCT_LINE_KEY_TEMPLATES.map((tpl) => materializeVariant(businessType, tpl.id)),
);

export function getBusinessProductLineVariant(id: string): BusinessProductLineVariant | undefined {
  return BUSINESS_PRODUCT_LINE_VARIANTS.find((v) => v.id === id);
}

export function listVariantsForProductLinePreset(productLinePresetId: string): BusinessProductLineVariant[] {
  return BUSINESS_PRODUCT_LINE_VARIANTS.filter((v) => v.productLinePresetId === productLinePresetId);
}

export function resolveVariantForTenant(
  businessType: BusinessTypeTag,
  productLinePresetId: string,
): BusinessProductLineVariant | undefined {
  return getBusinessProductLineVariant(buildVariantId(businessType, productLinePresetId));
}
