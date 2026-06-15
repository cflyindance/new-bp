/**
 * 平台预设目录运行时 — 系统种子 + 运营新增业态/变体
 */
import { BUSINESS_TYPE_PRESETS, type BusinessTypePreset } from "./feature-presets";
import { PRODUCT_LINE_KEY_IDS, PRODUCT_LINE_KEYS } from "./feature-presets-line-templates";
import { computeRecommendedVariantFeatures } from "./feature-presets-recommendations";
import { computeDefaultSubtreeIncludes } from "./feature-presets-subtree-includes";
import {
  BUSINESS_PRODUCT_LINE_VARIANTS,
  buildVariantId,
  type BusinessProductLineVariant,
} from "./feature-presets-variants";

const STATIC_BT_IDS = new Set(BUSINESS_TYPE_PRESETS.map((b) => b.id));
const STATIC_VARIANT_IDS = new Set(BUSINESS_PRODUCT_LINE_VARIANTS.map((v) => v.id));

let customBusinessTypes: BusinessTypePreset[] = [];
let customVariants: BusinessProductLineVariant[] = [];

function cloneSeedVariantForCustomBusinessType(
  bt: BusinessTypePreset,
  lineKey: string,
): BusinessProductLineVariant | undefined {
  const source = BUSINESS_PRODUCT_LINE_VARIANTS.find((v) => v.id === buildVariantId("general", lineKey));
  if (!source) return undefined;
  const pl = PRODUCT_LINE_KEYS.find((p) => p.id === lineKey);
  const titleSuffix = pl?.title ?? lineKey;
  const titleEnSuffix = pl?.titleEn ?? lineKey;
  const features = computeRecommendedVariantFeatures(bt.id, lineKey, bt);
  const subtree = computeDefaultSubtreeIncludes(features.map((f) => f.featureId));
  return {
    ...source,
    id: buildVariantId(bt.id, lineKey),
    businessType: bt.id,
    productLinePresetId: lineKey,
    title: `${bt.title} · ${titleSuffix}`,
    titleEn: `${bt.titleEn} · ${titleEnSuffix}`,
    version: 1,
    features,
    excludes: [],
    includes: undefined,
    l2Includes: subtree.l2Includes,
    l3Includes: subtree.l3Includes,
    l2Excludes: [],
    l3Excludes: [],
    settingConfigs: source.settingConfigs ? { ...source.settingConfigs } : undefined,
    productLines: [...source.productLines],
  };
}

/** 为历史自定义业态补全缺失的产线组合变体（含 sdi-only / pos-go-only） */
export function backfillCustomBusinessTypeVariants(
  businessTypes: BusinessTypePreset[],
  variants: BusinessProductLineVariant[],
): BusinessProductLineVariant[] {
  const variantIds = new Set(variants.map((v) => v.id));
  const result: BusinessProductLineVariant[] = [...variants];

  for (const bt of businessTypes) {
    if (STATIC_BT_IDS.has(bt.id)) continue;
    for (const lineKey of PRODUCT_LINE_KEY_IDS) {
      const variantId = buildVariantId(bt.id, lineKey);
      if (variantIds.has(variantId)) continue;
      const created = cloneSeedVariantForCustomBusinessType(bt, lineKey);
      if (!created) continue;
      result.push(created);
      variantIds.add(variantId);
    }
  }

  return result;
}

export function setPlatformPresetsCatalogExtensions(
  businessTypes: Array<BusinessTypePreset & { titleEn?: string }>,
  variants: BusinessProductLineVariant[],
): void {
  customBusinessTypes = businessTypes
    .filter((b) => b.id && !STATIC_BT_IDS.has(b.id))
    .map((b) => ({
      id: b.id,
      title: b.title,
      titleEn: b.titleEn ?? b.title,
      version: b.version ?? 1,
      features: (b.features ?? []).map((f) => ({ ...f })),
      taxonomy: b.taxonomy,
    }));
  customVariants = backfillCustomBusinessTypeVariants(
    customBusinessTypes,
    variants
      .filter((v) => v.id && !STATIC_VARIANT_IDS.has(v.id))
      .map((v) => ({
        ...v,
        features: v.features.map((f) => ({ ...f })),
        excludes: [...v.excludes],
        l2Includes: v.l2Includes ? [...v.l2Includes] : undefined,
        l3Includes: v.l3Includes ? [...v.l3Includes] : undefined,
        l2Excludes: v.l2Excludes ? [...v.l2Excludes] : undefined,
        l3Excludes: v.l3Excludes ? [...v.l3Excludes] : undefined,
        productLines: [...v.productLines],
      })),
  );
}

export function getCustomBusinessTypes(): BusinessTypePreset[] {
  return customBusinessTypes.map((b) => ({
    ...b,
    features: b.features.map((f) => ({ ...f })),
  }));
}

export function getCustomVariants(): BusinessProductLineVariant[] {
  return customVariants.map((v) => ({
    ...v,
    features: v.features.map((f) => ({ ...f })),
    excludes: [...v.excludes],
    productLines: [...v.productLines],
  }));
}

export function getEffectiveBusinessTypePresets(): BusinessTypePreset[] {
  return [...BUSINESS_TYPE_PRESETS, ...customBusinessTypes];
}

export function getBusinessTypePreset(id: string): BusinessTypePreset | undefined {
  return getEffectiveBusinessTypePresets().find((p) => p.id === id);
}

export function getBaseVariantsCatalog(): BusinessProductLineVariant[] {
  return [...BUSINESS_PRODUCT_LINE_VARIANTS, ...customVariants];
}

export function isCustomBusinessTypeId(id: string): boolean {
  return customBusinessTypes.some((b) => b.id === id);
}

export function isKnownBusinessTypeId(id: string): boolean {
  return getEffectiveBusinessTypePresets().some((b) => b.id === id);
}

export function validateNewBusinessTypeId(id: string): "invalid_id" | "duplicate" | null {
  const normalized = id.trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(normalized)) return "invalid_id";
  if (getEffectiveBusinessTypePresets().some((b) => b.id === normalized)) return "duplicate";
  return null;
}

export function suggestBusinessTypeIdFromTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) return "";
  const first = slug.charAt(0);
  const id = /^[a-z]/.test(first) ? slug : `bt-${slug}`.slice(0, 32);
  return id.replace(/-$/, "");
}

function findVariantInCatalog(variantId: string): BusinessProductLineVariant | undefined {
  return getBaseVariantsCatalog().find((v) => v.id === variantId);
}

/** 从已有业态克隆新业态 + 全产线组合变体（客户端 / 离线兜底） */
export function buildNewBusinessTypeCatalog(
  id: string,
  title: string,
  titleEn: string,
  cloneFrom: string,
): { businessType: BusinessTypePreset; variants: BusinessProductLineVariant[] } {
  const sourceBt =
    getEffectiveBusinessTypePresets().find((b) => b.id === cloneFrom) ??
    BUSINESS_TYPE_PRESETS.find((b) => b.id === "general")!;

  const businessType: BusinessTypePreset = {
    id,
    title,
    titleEn,
    version: 1,
    features: sourceBt.features.map((f) => ({ ...f })),
  };

  const variants: BusinessProductLineVariant[] = [];
  for (const lineKey of PRODUCT_LINE_KEY_IDS) {
    const pl = PRODUCT_LINE_KEYS.find((p) => p.id === lineKey);
    if (!pl) continue;
    const sourceId = buildVariantId(cloneFrom, lineKey);
    const source =
      findVariantInCatalog(sourceId) ??
      BUSINESS_PRODUCT_LINE_VARIANTS.find((v) => v.id === buildVariantId("general", lineKey));
    if (!source) continue;
    variants.push({
      ...source,
      id: buildVariantId(id, lineKey),
      businessType: id,
      productLinePresetId: lineKey,
      title: `${title} · ${pl.title}`,
      titleEn: `${titleEn} · ${pl.titleEn}`,
      version: 1,
      features: source.features.map((f) => ({ ...f })),
      excludes: [...source.excludes],
      l2Includes: source.l2Includes ? [...source.l2Includes] : undefined,
      l3Includes: source.l3Includes ? [...source.l3Includes] : undefined,
      l2Excludes: source.l2Excludes ? [...source.l2Excludes] : undefined,
      l3Excludes: source.l3Excludes ? [...source.l3Excludes] : undefined,
      settingConfigs: source.settingConfigs ? { ...source.settingConfigs } : undefined,
      productLines: [...source.productLines],
    });
  }

  return { businessType, variants };
}

export function appendLocalBusinessTypeCatalog(
  businessType: BusinessTypePreset,
  variants: BusinessProductLineVariant[],
): void {
  setPlatformPresetsCatalogExtensions(
    [...getCustomBusinessTypes(), businessType],
    [...customVariants, ...variants],
  );
}

function variantTitleSuffix(title: string, fallback: string): string {
  const idx = title.indexOf(" · ");
  return idx >= 0 ? title.slice(idx + 3) : fallback;
}

export function updateLocalCustomBusinessType(id: string, title: string, titleEn: string): void {
  const idx = customBusinessTypes.findIndex((b) => b.id === id);
  if (idx < 0) return;
  const prev = customBusinessTypes[idx];
  customBusinessTypes[idx] = {
    ...prev,
    title,
    titleEn,
    version: (prev.version ?? 1) + 1,
  };
  customVariants = customVariants.map((v) => {
    if (v.businessType !== id) return v;
    const suffix = variantTitleSuffix(v.title, v.productLinePresetId);
    const suffixEn = variantTitleSuffix(v.titleEn ?? v.title, suffix);
    return {
      ...v,
      title: `${title} · ${suffix}`,
      titleEn: `${titleEn} · ${suffixEn}`,
    };
  });
}

export function removeLocalCustomBusinessType(id: string): void {
  customBusinessTypes = customBusinessTypes.filter((b) => b.id !== id);
  customVariants = customVariants.filter((v) => v.businessType !== id);
}
