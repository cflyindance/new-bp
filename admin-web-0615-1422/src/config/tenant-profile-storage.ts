/**
 * 租户功能画像 — localStorage 缓存 + API 同步（P3）
 */
import type { BusinessTypeTag, ProductLineTag } from "./feature-registry";
import {
  PRODUCT_LINE_KEY_IDS,
  resolveProductLinesFromLineKeys,
} from "./feature-presets-line-templates";
const STORAGE_KEY = "bplant-tenant-profile-v1";

/** 连锁覆盖层级 */
export type TenantProfileScope = "tenant" | "brand" | "store";

export interface TenantProfile {
  tenantId: string;
  scope?: TenantProfileScope;
  brandId?: string;
  storeId?: string;
  primaryBusinessType: BusinessTypeTag;
  secondaryBusinessType?: BusinessTypeTag;
  productLinePresetIds: string[];
  productLines: ProductLineTag[];
  enabledFeatures: string[];
  addedFeatures: string[];
  removedFeatures: string[];
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  implementationPreConfigured: boolean;
  presetVersions: { business: number; productLine: Record<string, number> };
}

export function createDefaultProfile(): TenantProfile {
  const productLinePresetIds = [...PRODUCT_LINE_KEY_IDS];
  const productLines = resolveProductLinesFromLineKeys(productLinePresetIds);
  const productLineVersions = Object.fromEntries(productLinePresetIds.map((id) => [id, 1]));
  return {
    tenantId: "demo-tenant",
    scope: "tenant",
    primaryBusinessType: "general",
    productLinePresetIds,
    productLines,
    enabledFeatures: [],
    addedFeatures: [],
    removedFeatures: [],
    onboardingCompleted: true,
    implementationPreConfigured: true,
    presetVersions: { business: 1, productLine: productLineVersions },
  };
}

export function loadTenantProfileFromCache(): TenantProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TenantProfile;
  } catch {
    return null;
  }
}

export function saveTenantProfileToCache(profile: TenantProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  memoryCachedProfile = profile;
}

let memoryCachedProfile: TenantProfile | null | undefined;

/** 读取当前生效画像（由 API hydrate 写入 localStorage） */
export function loadTenantProfile(): TenantProfile | null {
  if (memoryCachedProfile !== undefined) return memoryCachedProfile;
  memoryCachedProfile = loadTenantProfileFromCache();
  return memoryCachedProfile;
}

/** 写入缓存；调用方应同时 invoke saveTenantProfileToApi */
export function saveTenantProfile(profile: TenantProfile): void {
  saveTenantProfileToCache(profile);
}

export function clearTenantProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
  memoryCachedProfile = null;
}

export function shouldShowOnboarding(profile: TenantProfile | null): boolean {
  if (!profile) return true;
  return !profile.onboardingCompleted;
}

export function resolveProductLinesFromPresetIds(presetIds: string[]): ProductLineTag[] {
  return resolveProductLinesFromLineKeys(presetIds);
}
