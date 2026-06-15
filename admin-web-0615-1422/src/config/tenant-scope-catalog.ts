/**
 * 租户范围选项（品牌 / 门店）— API 动态列表 + 本地回退
 */
import { apiFetch, getApiTenantId } from "./api-client";

export interface ScopeBrandOption {
  id: string;
  label: string;
}

export interface ScopeStoreOption {
  id: string;
  label: string;
  brandId?: string;
}

export interface TenantScopeCatalog {
  brands: ScopeBrandOption[];
  stores: ScopeStoreOption[];
}

const BRAND_LABELS: Record<string, string> = {
  miju: "米聚餐饮集团",
  "fullservice-emenu": "正餐 · eMenu 演示",
  "buffet-emenu": "火锅自助 · eMenu 演示",
  chuanchuan: "川味火锅（POS）",
  "menusifu-na": "MenuSifu 北美",
};

const STORE_LABELS: Record<string, string> = {
  "flagship-nyc": "旗舰店 · NYC",
  "branch-la": "分店 · LA",
  "shanghai-ljz": "上海陆家嘴店",
  "buffet-flagship": "自助火锅旗舰店",
  "chengdu-td": "成都太古里店",
  "guangzhou-tzh": "广州天河店",
};

const FALLBACK_CATALOGS: Record<string, TenantScopeCatalog> = {
  "demo-tenant": {
    brands: [
      { id: "miju", label: BRAND_LABELS.miju },
      { id: "fullservice-emenu", label: BRAND_LABELS["fullservice-emenu"] },
      { id: "menusifu-na", label: BRAND_LABELS["menusifu-na"] },
    ],
    stores: [
      { id: "shanghai-ljz", label: STORE_LABELS["shanghai-ljz"], brandId: "miju" },
      { id: "flagship-nyc", label: STORE_LABELS["flagship-nyc"], brandId: "menusifu-na" },
      { id: "branch-la", label: STORE_LABELS["branch-la"], brandId: "menusifu-na" },
      { id: "guangzhou-tzh", label: STORE_LABELS["guangzhou-tzh"], brandId: "miju" },
    ],
  },
  "partner-hq": {
    brands: [
      { id: "chuanchuan", label: BRAND_LABELS.chuanchuan },
      { id: "buffet-emenu", label: BRAND_LABELS["buffet-emenu"] },
    ],
    stores: [
      { id: "chengdu-td", label: STORE_LABELS["chengdu-td"], brandId: "chuanchuan" },
      { id: "buffet-flagship", label: STORE_LABELS["buffet-flagship"], brandId: "buffet-emenu" },
    ],
  },
};

const catalogByTenant = new Map<string, TenantScopeCatalog>();
let hydratePromise: Promise<void> | null = null;

function labelBrand(id: string): string {
  return BRAND_LABELS[id] ?? id;
}

function labelStore(id: string): string {
  return STORE_LABELS[id] ?? id;
}

function normalizeApiCatalog(raw: {
  brands?: Array<{ id: string; brandId?: string }>;
  stores?: Array<{ id: string; brandId?: string; storeId?: string }>;
}): TenantScopeCatalog {
  return {
    brands: (raw.brands ?? []).map((b) => ({
      id: b.id,
      label: labelBrand(b.brandId ?? b.id),
    })),
    stores: (raw.stores ?? []).map((s) => ({
      id: s.id,
      label: labelStore(s.storeId ?? s.id),
      brandId: s.brandId,
    })),
  };
}

export function getScopeCatalog(tenantId = getApiTenantId()): TenantScopeCatalog {
  return catalogByTenant.get(tenantId) ?? FALLBACK_CATALOGS[tenantId] ?? { brands: [], stores: [] };
}

export function isScopeCatalogHydrated(tenantId = getApiTenantId()): boolean {
  return catalogByTenant.has(tenantId);
}

export async function hydrateScopeCatalog(tenantId = getApiTenantId(), force = false): Promise<void> {
  if (!force && catalogByTenant.has(tenantId)) return;
  if (!force && hydratePromise) {
    await hydratePromise;
    return;
  }

  hydratePromise = (async () => {
    try {
      const qs = new URLSearchParams({ tenantId });
      const res = await apiFetch(`/api/v1/tenant-profile/scope-options?${qs}`);
      if (res.ok) {
        const data = (await res.json()) as {
          brands?: Array<{ id: string; brandId?: string }>;
          stores?: Array<{ id: string; brandId?: string; storeId?: string }>;
        };
        catalogByTenant.set(tenantId, normalizeApiCatalog(data));
        return;
      }
    } catch {
      /* 离线回退 */
    }
    catalogByTenant.set(tenantId, FALLBACK_CATALOGS[tenantId] ?? { brands: [], stores: [] });
  })();

  await hydratePromise;
  hydratePromise = null;
}

export function storesForBrand(catalog: TenantScopeCatalog, brandId: string): ScopeStoreOption[] {
  if (!brandId) return catalog.stores;
  const scoped = catalog.stores.filter((s) => !s.brandId || s.brandId === brandId);
  return scoped.length > 0 ? scoped : catalog.stores;
}
