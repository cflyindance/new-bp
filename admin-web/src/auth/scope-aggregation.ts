/**
 * 数据范围聚合元数据（报表 / 工作台演示）
 */
import {
  isBrandDataPerspective,
  isGroupHqDataPerspective,
  isStoreDataPerspective,
  resolveDefaultAnchorBrandId,
} from "./merchant-scope-context";
import {
  getScopedFilterOptions,
  isChainScopeMode,
  resolveEffectiveScope,
  type EffectiveScope,
} from "./session-scope";
import { getMPlatformStoreScopeMeta } from "../permissions/m-platform-store-scope";
import { loadChainBrandOrgForContext } from "../config/merchant-chain-brand-sync";

export type ScopeAggregationMode = "store" | "brand" | "region" | "group";

export interface ScopeAggregationMeta {
  mode: ScopeAggregationMode;
  labelZh: string;
  labelEn: string;
  storeCount: number;
  brandCount: number;
  isAggregated: boolean;
}

function findStoreLabel(storeId: string, locale: "zh" | "en"): string {
  const opts = getScopedFilterOptions().stores;
  const hit = opts.find((o) => o.value === storeId);
  if (hit) return locale === "en" ? hit.labelEn : hit.labelZh;
  const meta = getMPlatformStoreScopeMeta(storeId);
  return meta?.name ?? storeId;
}

function findBrandLabel(brandId: string, locale: "zh" | "en"): string {
  const opts = getScopedFilterOptions().brands;
  const hit = opts.find((o) => o.value === brandId);
  if (hit) return locale === "en" ? hit.labelEn : hit.labelZh;
  const snap = loadChainBrandOrgForContext();
  const brand = snap?.brands.find((b) => b.merchantId === brandId);
  return brand?.name ?? brandId;
}

/** 解析当前范围的聚合方式与展示标签 */
export function resolveScopeAggregationMeta(
  scope: EffectiveScope = resolveEffectiveScope(),
): ScopeAggregationMeta {
  const storeCount = scope.storeIds.length;
  const brandCount = scope.brandIds.length;
  const isAggregated = scope.isAggregated;

  if (isStoreDataPerspective() || storeCount === 1) {
    const storeId = scope.storeIds[0] ?? scope.filters.store;
    return {
      mode: "store",
      labelZh: storeId ? findStoreLabel(storeId, "zh") : "当前门店",
      labelEn: storeId ? findStoreLabel(storeId, "en") : "Current store",
      storeCount: storeId ? 1 : 0,
      brandCount: Math.max(brandCount, 1),
      isAggregated: false,
    };
  }

  if (scope.regionName) {
    return {
      mode: "region",
      labelZh: `${scope.regionName} · ${storeCount} 家门店`,
      labelEn: `${scope.regionName} · ${storeCount} store(s)`,
      storeCount,
      brandCount,
      isAggregated: storeCount > 1,
    };
  }

  if (isBrandDataPerspective() || brandCount === 1) {
    const brandId = scope.brandIds[0] ?? resolveDefaultAnchorBrandId() ?? scope.filters.brand;
    const nameZh = brandId ? findBrandLabel(brandId, "zh") : "当前品牌";
    const nameEn = brandId ? findBrandLabel(brandId, "en") : "Current brand";
    return {
      mode: "brand",
      labelZh: storeCount > 0 ? `${nameZh} · ${storeCount} 家门店` : nameZh,
      labelEn: storeCount > 0 ? `${nameEn} · ${storeCount} store(s)` : nameEn,
      storeCount,
      brandCount: Math.max(brandCount, 1),
      isAggregated: storeCount > 1,
    };
  }

  if (isGroupHqDataPerspective() && isChainScopeMode()) {
    const snap = loadChainBrandOrgForContext();
    const groupName = snap?.groupName ?? "集团";
    return {
      mode: "group",
      labelZh: `${groupName} · ${brandCount || snap?.brands.length || 0} 品牌 · ${storeCount} 门店`,
      labelEn: `${groupName} · ${brandCount || snap?.brands.length || 0} brand(s) · ${storeCount} store(s)`,
      storeCount,
      brandCount: brandCount || snap?.brands.length || 0,
      isAggregated,
    };
  }

  return {
    mode: "group",
    labelZh: storeCount > 1 ? `多店汇总 · ${storeCount} 家` : "单店",
    labelEn: storeCount > 1 ? `Multi-store · ${storeCount}` : "Single store",
    storeCount,
    brandCount,
    isAggregated,
  };
}

export function formatScopeAggregationNote(locale: "zh" | "en" = "zh"): string {
  const meta = resolveScopeAggregationMeta();
  const label = locale === "en" ? meta.labelEn : meta.labelZh;
  if (locale === "en") {
    return meta.isAggregated
      ? `Aggregated across: ${label}`
      : `Scoped to: ${label}`;
  }
  return meta.isAggregated ? `多店汇总范围：${label}` : `当前数据范围：${label}`;
}
