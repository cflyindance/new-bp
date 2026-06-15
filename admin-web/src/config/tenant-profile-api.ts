/**
 * 租户功能画像 API 客户端（P3）
 */
import { apiFetch, getApiTenantId } from "./api-client";
import { clearDashboardKpiCache } from "./dashboard-kpi-api";
import { invalidateVisibilityContextCache } from "./feature-visibility";
import { resolveProfileFromLayers } from "./tenant-profile-chain";
import {
  createDefaultProfile,
  loadTenantProfileFromCache,
  saveTenantProfileToCache,
  type TenantProfile,
} from "./tenant-profile-storage";

const API_BASE = "/api/v1/tenant-profile";
const SCOPE_KEYS = {
  brand: "header-scope-filter-brand",
  store: "header-scope-filter-store",
} as const;

let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let resolvedProfile: TenantProfile | null = null;

export function getHeaderScopeContext(): { brandId: string; storeId: string } {
  try {
    return {
      brandId: sessionStorage.getItem(SCOPE_KEYS.brand) ?? "",
      storeId: sessionStorage.getItem(SCOPE_KEYS.store) ?? "",
    };
  } catch {
    return { brandId: "", storeId: "" };
  }
}

export function isTenantProfileHydrated(): boolean {
  return hydrated;
}

export function getCachedResolvedProfile(): TenantProfile | null {
  return resolvedProfile ?? loadTenantProfileFromCache();
}

async function fetchResolvedProfile(brandId: string, storeId: string): Promise<TenantProfile> {
  const qs = new URLSearchParams();
  qs.set("tenantId", getApiTenantId());
  if (brandId) qs.set("brandId", brandId);
  if (storeId) qs.set("storeId", storeId);
  const url = `${API_BASE}/resolved${qs.toString() ? `?${qs}` : ""}`;

  try {
    const res = await apiFetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { profile: TenantProfile };
    return data.profile;
  } catch {
    const local = loadTenantProfileFromCache();
    if (local) return local;
    return createDefaultProfile();
  }
}

export async function hydrateTenantProfile(force = false): Promise<TenantProfile> {
  if (!force && hydrated && resolvedProfile) return resolvedProfile;

  if (!force && hydratePromise) {
    await hydratePromise;
    return resolvedProfile ?? createDefaultProfile();
  }

  hydratePromise = (async () => {
    const { brandId, storeId } = getHeaderScopeContext();
    resolvedProfile = await fetchResolvedProfile(brandId, storeId);
    saveTenantProfileToCache(resolvedProfile);
    invalidateVisibilityContextCache();
    hydrated = true;
  })();

  await hydratePromise;
  hydratePromise = null;
  return resolvedProfile ?? createDefaultProfile();
}

export async function saveTenantProfileToApi(profile: TenantProfile): Promise<void> {
  const scope = profile.scope ?? "tenant";
  try {
    const res = await apiFetch(`${API_BASE}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope,
        brandId: profile.brandId,
        storeId: profile.storeId,
        profile,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    /* 离线回退 localStorage */
  }
  resolvedProfile = profile;
  saveTenantProfileToCache(profile);
  invalidateVisibilityContextCache();
  hydrated = true;
}

export async function refreshTenantProfileForScope(): Promise<TenantProfile> {
  hydrated = false;
  clearDashboardKpiCache();
  return hydrateTenantProfile(true);
}

/** 本地合并演示（无 API 时） */
export function resolveProfileLocally(
  tenant: TenantProfile,
  brand?: TenantProfile | null,
  store?: TenantProfile | null,
): TenantProfile {
  return resolveProfileFromLayers({ tenant, brand, store });
}
