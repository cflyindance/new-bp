/**
 * 业务层统一数据范围 API（演示环境对接后端 query 的契约）
 */
import type { ChainDataPerspective } from "./merchant-scope-context";
import {
  resolveEffectiveScope,
  bindEffectiveScopeChangeListener,
  type EffectiveScope,
  type ScopeFilterState,
} from "./session-scope";
import { migrateLegacyBrandId, migrateLegacyStoreId } from "../permissions/m-platform-store-scope";

export type { EffectiveScope, ScopeFilterState };

export {
  resolveEffectiveScope,
  bindEffectiveScopeChangeListener,
  filterChainBrandSnapshotByEffectiveScope,
} from "./session-scope";
export {
  isGroupHqDataPerspective,
  isBrandDataPerspective,
  isStoreDataPerspective,
} from "./merchant-scope-context";

/** 业务 API / 报表查询使用的范围参数 */
export interface EffectiveScopeQuery {
  groupId: string | null;
  perspective: ChainDataPerspective;
  brandIds: string[];
  storeIds: string[];
  regionName: string;
  isAggregated: boolean;
  filters: ScopeFilterState;
}

export function toEffectiveScopeQuery(scope: EffectiveScope = resolveEffectiveScope()): EffectiveScopeQuery {
  return {
    groupId: scope.groupId,
    perspective: scope.perspective,
    brandIds: [...scope.brandIds],
    storeIds: [...scope.storeIds],
    regionName: scope.regionName,
    isAggregated: scope.isAggregated,
    filters: { ...scope.filters },
  };
}

/** 演示：拼成 query string（对接 REST 时可直接映射） */
export function buildEffectiveScopeSearchParams(
  scope: EffectiveScope = resolveEffectiveScope(),
): URLSearchParams {
  const q = toEffectiveScopeQuery(scope);
  const params = new URLSearchParams();
  if (q.groupId) params.set("groupId", q.groupId);
  params.set("perspective", q.perspective);
  if (q.brandIds.length) params.set("brandIds", q.brandIds.join(","));
  if (q.storeIds.length) params.set("storeIds", q.storeIds.join(","));
  if (q.regionName) params.set("regionName", q.regionName);
  if (q.isAggregated) params.set("aggregated", "1");
  if (q.filters.brand) params.set("filterBrand", q.filters.brand);
  if (q.filters.region) params.set("filterRegion", q.filters.region);
  if (q.filters.store) params.set("filterStore", q.filters.store);
  return params;
}

export function isStoreIdInEffectiveScope(
  storeId: string,
  scope: EffectiveScope = resolveEffectiveScope(),
): boolean {
  if (!storeId || scope.storeIds.length === 0) return false;
  return scope.storeIds.includes(migrateLegacyStoreId(storeId));
}

export function isBrandIdInEffectiveScope(
  brandId: string,
  scope: EffectiveScope = resolveEffectiveScope(),
): boolean {
  if (!brandId || scope.brandIds.length === 0) return false;
  return scope.brandIds.includes(migrateLegacyBrandId(brandId));
}

/** 按有效门店范围过滤业务记录（记录须能解析出 storeId） */
export function filterRecordsByEffectiveScope<T>(
  records: readonly T[],
  resolveStoreId: (record: T) => string | null | undefined,
  scope: EffectiveScope = resolveEffectiveScope(),
): T[] {
  const allowed = new Set(scope.storeIds.map(migrateLegacyStoreId));
  if (allowed.size === 0) return [];
  return records.filter((record) => {
    const storeId = resolveStoreId(record);
    return storeId != null && allowed.has(migrateLegacyStoreId(storeId));
  });
}

const PERSPECTIVE_LABEL_ZH: Record<ChainDataPerspective, string> = {
  "group-hq": "集团总部",
  brand: "品牌多门店",
  store: "门店",
};

export function describeEffectiveScope(
  scope: EffectiveScope = resolveEffectiveScope(),
  locale: "zh" | "en" = "zh",
): string {
  if (locale === "en") {
    const perspective = scope.perspective;
    const stores = scope.storeIds.length;
    const brands = scope.brandIds.length;
    return `${perspective} · ${brands} brand(s) · ${stores} store(s)`;
  }
  const perspective = PERSPECTIVE_LABEL_ZH[scope.perspective] ?? scope.perspective;
  const storePart =
    scope.storeIds.length > 1
      ? `${scope.storeIds.length} 家门店`
      : scope.storeIds.length === 1
        ? "1 家门店"
        : "无门店";
  const brandPart =
    scope.brandIds.length > 1
      ? `${scope.brandIds.length} 个品牌`
      : scope.brandIds.length === 1
        ? "1 个品牌"
        : "";
  const regionPart = scope.regionName ? ` · ${scope.regionName}` : "";
  return [perspective, brandPart, storePart].filter(Boolean).join(" · ") + regionPart;
}
