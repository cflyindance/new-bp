/**
 * 主页 KPI API 客户端（P5）
 */
import { apiFetch, getApiTenantId } from "./api-client";
import { getHeaderScopeContext } from "./tenant-profile-api";

export interface DashboardKpiMetric {
  label: string;
  value: number;
  formatted: string;
}

export interface DashboardKpiPayload {
  currency: string;
  asOf: string;
  metrics: {
    salesToday: DashboardKpiMetric;
    orderCount: DashboardKpiMetric;
    staffOnDuty: DashboardKpiMetric;
  };
  source?: string;
  snapshotDate?: string;
  scope?: { tenantId?: string; brandId?: string | null; storeId?: string | null };
}

let cached: DashboardKpiPayload | null = null;

export function getCachedDashboardKpi(): DashboardKpiPayload | null {
  return cached;
}

export async function fetchDashboardKpi(force = false): Promise<DashboardKpiPayload | null> {
  if (!force && cached) return cached;

  const { brandId, storeId } = getHeaderScopeContext();
  const qs = new URLSearchParams();
  qs.set("tenantId", getApiTenantId());
  if (brandId) qs.set("brandId", brandId);
  if (storeId) qs.set("storeId", storeId);

  try {
    const res = await apiFetch(`/api/v1/dashboard/kpi${qs.toString() ? `?${qs}` : ""}`);
    if (!res.ok) return null;
    cached = (await res.json()) as DashboardKpiPayload;
    return cached;
  } catch {
    return null;
  }
}

export function clearDashboardKpiCache(): void {
  cached = null;
}
