/**
 * 平台预设 API 客户端（P4）
 */
import { apiFetch } from "./api-client";
import {
  getCustomBusinessTypes,
  getCustomVariants,
  getEffectiveBusinessTypePresets,
  getBaseVariantsCatalog,
  removeLocalCustomBusinessType,
  setPlatformPresetsCatalogExtensions,
  updateLocalCustomBusinessType,
} from "./feature-presets-catalog-runtime";
import { BUSINESS_TYPE_PRESETS, type BusinessTypePreset } from "./feature-presets";
import { BUSINESS_PRODUCT_LINE_VARIANTS, type BusinessProductLineVariant } from "./feature-presets-variants";
import {
  getEffectiveBusinessProductLineVariants,
  getBusinessProductLineVariantOverrides,
  setBusinessProductLineVariantOverrides,
  type BusinessProductLineVariantOverride,
} from "./feature-presets-variant-runtime";
import { appendLocalPresetAudit } from "./feature-presets-audit";
import {
  diffPresetOverrideSnapshot,
  mergeVariantEffectiveState,
} from "./feature-presets-audit-diff";
import { reconcileTenantProfileWithPlatformPresets } from "./feature-presets-tenant-sync";
import { invalidateVisibilityContextCache } from "./feature-visibility";
import { loadTenantProfile } from "./tenant-profile-storage";
import { saveTenantProfileToApi } from "./tenant-profile-api";

const API_BASE = "/api/v1/tenant-profile";
const LOCAL_CUSTOM_KEY = "bplant-platform-custom-presets-v1";
const LOCAL_VARIANT_OVERRIDES_KEY = "bplant-platform-variant-overrides-v1";

export interface PresetsApiPayload {
  businessTypes: Array<{
    id: string;
    title: string;
    titleEn?: string;
    version: number;
    features: BusinessTypePreset["features"];
  }>;
  variants: Array<{
    id: string;
    businessType: string;
    productLinePresetId: string;
    title: string;
    titleEn?: string;
    productLines: string[];
    features: BusinessProductLineVariant["features"];
    excludes: string[];
    includes?: string[];
    l2Includes?: string[];
    l3Includes?: string[];
    l2Excludes?: string[];
    l3Excludes?: string[];
    settingConfigs?: Record<string, import("./feature-presets-setting-config").PresetSettingConfig>;
    version: number;
  }>;
  variantOverrides?: Record<string, BusinessProductLineVariantOverride>;
  updatedAt?: string | null;
}

let cachedPayload: PresetsApiPayload | null = null;

export function getCachedPresetsPayload(): PresetsApiPayload | null {
  return cachedPayload;
}

const STATIC_BT_IDS = new Set(BUSINESS_TYPE_PRESETS.map((b) => b.id));

function loadLocalCustomCatalog(): {
  businessTypes: BusinessTypePreset[];
  variants: BusinessProductLineVariant[];
} {
  try {
    const raw = sessionStorage.getItem(LOCAL_CUSTOM_KEY);
    if (!raw) return { businessTypes: [], variants: [] };
    const parsed = JSON.parse(raw) as {
      businessTypes?: BusinessTypePreset[];
      variants?: BusinessProductLineVariant[];
    };
    return {
      businessTypes: parsed.businessTypes ?? [],
      variants: parsed.variants ?? [],
    };
  } catch {
    return { businessTypes: [], variants: [] };
  }
}

function saveLocalCustomCatalog(): void {
  try {
    sessionStorage.setItem(
      LOCAL_CUSTOM_KEY,
      JSON.stringify({
        businessTypes: getCustomBusinessTypes(),
        variants: getCustomVariants(),
      }),
    );
  } catch {
    /* ignore quota */
  }
}

function loadVariantOverridesFromSession(): Record<string, BusinessProductLineVariantOverride> {
  try {
    const raw = sessionStorage.getItem(LOCAL_VARIANT_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, BusinessProductLineVariantOverride>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveVariantOverridesToSession(overrides: Record<string, BusinessProductLineVariantOverride>): void {
  try {
    sessionStorage.setItem(LOCAL_VARIANT_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore quota */
  }
}

/** 合并变体覆盖层：同 id 取 version 更高者（避免 GET 回旧数据覆盖刚保存的 session） */
function mergeVariantOverrideRecords(
  primary: Record<string, BusinessProductLineVariantOverride>,
  secondary: Record<string, BusinessProductLineVariantOverride>,
): Record<string, BusinessProductLineVariantOverride> {
  const out = { ...primary };
  for (const [id, patch] of Object.entries(secondary)) {
    const existing = out[id];
    const patchVersion = patch.version ?? 0;
    const existingVersion = existing?.version ?? 0;
    if (!existing || patchVersion >= existingVersion) {
      out[id] = patch;
    }
  }
  return out;
}

function syncTenantProfileAfterPresetChange(): void {
  const profile = loadTenantProfile();
  if (!profile) return;
  const synced = reconcileTenantProfileWithPlatformPresets(profile);
  if (synced === profile) return;
  void saveTenantProfileToApi(synced);
}

function applyPresetsPayload(data: PresetsApiPayload): void {
  const staticVarIds = new Set(BUSINESS_PRODUCT_LINE_VARIANTS.map((v) => v.id));
  const customBt = (data.businessTypes ?? [])
    .filter((b) => !STATIC_BT_IDS.has(b.id))
    .map(
      (b): BusinessTypePreset => ({
        id: b.id,
        title: b.title,
        titleEn: b.titleEn ?? b.title,
        version: b.version ?? 1,
        features: b.features ?? [],
      }),
    );
  const customVar = (data.variants ?? [])
    .filter((v) => !staticVarIds.has(v.id))
    .map((v) => ({ ...v })) as BusinessProductLineVariant[];

  const local = loadLocalCustomCatalog();
  const mergedBt = [...customBt];
  for (const b of local.businessTypes) {
    if (!STATIC_BT_IDS.has(b.id) && !mergedBt.some((x) => x.id === b.id)) mergedBt.push(b);
  }
  const mergedVar = [...customVar];
  for (const v of local.variants) {
    if (!mergedVar.some((x) => x.id === v.id)) mergedVar.push(v);
  }

  setPlatformPresetsCatalogExtensions(mergedBt, mergedVar);
  const apiOverrides = data.variantOverrides ?? {};
  const sessionOverrides = loadVariantOverridesFromSession();
  const overrides = mergeVariantOverrideRecords(apiOverrides, sessionOverrides);
  setBusinessProductLineVariantOverrides(overrides);
  saveVariantOverridesToSession(overrides);
  saveLocalCustomCatalog();
  invalidateVisibilityContextCache();
  syncTenantProfileAfterPresetChange();
}

function buildLocalFallback(): PresetsApiPayload {
  const local = loadLocalCustomCatalog();
  const storedOverrides = loadVariantOverridesFromSession();
  setPlatformPresetsCatalogExtensions(local.businessTypes, local.variants);
  if (Object.keys(storedOverrides).length > 0) {
    setBusinessProductLineVariantOverrides(storedOverrides);
    invalidateVisibilityContextCache();
  }
  return {
    businessTypes: getEffectiveBusinessTypePresets().map((b) => ({
      id: b.id,
      title: b.title,
      titleEn: b.titleEn,
      version: b.version,
      features: b.features,
    })),
    variants: getBaseVariantsCatalog().map((v) => ({
      id: v.id,
      businessType: v.businessType,
      productLinePresetId: v.productLinePresetId,
      title: v.title,
      titleEn: v.titleEn,
      productLines: v.productLines,
      features: v.features,
      excludes: v.excludes,
      includes: v.includes,
      l2Includes: v.l2Includes,
      l3Includes: v.l3Includes,
      l2Excludes: v.l2Excludes,
      l3Excludes: v.l3Excludes,
      settingConfigs: v.settingConfigs,
      version: v.version,
    })),
    variantOverrides: storedOverrides,
    updatedAt: null,
  };
}

export async function fetchPlatformPresets(): Promise<PresetsApiPayload> {
  try {
    const res = await apiFetch(`${API_BASE}/presets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as PresetsApiPayload;
    cachedPayload = data;
    applyPresetsPayload(data);
    return data;
  } catch {
    const fallback = buildLocalFallback();
    cachedPayload = fallback;
    return fallback;
  }
}

/** 启动 / 引导完成时拉取平台预设并写入运行时覆盖层 */
export async function initFeaturePresetsFromApi(): Promise<void> {
  await fetchPlatformPresets();
}

/** 引导 / 首次进入系统前确保预设已加载（避免 Step 3 与侧栏 L2/L3 与种子不一致） */
export async function ensureFeaturePresetsLoaded(): Promise<void> {
  if (cachedPayload) return;
  await initFeaturePresetsFromApi();
}

export function areFeaturePresetsLoaded(): boolean {
  return cachedPayload !== null;
}

export interface CreateBusinessTypeInput {
  id: string;
  title: string;
  titleEn: string;
  cloneFrom: string;
}

export async function createPlatformBusinessType(input: CreateBusinessTypeInput): Promise<PresetsApiPayload> {
  const res = await apiFetch(`${API_BASE}/presets/business-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as PresetsApiPayload;
  cachedPayload = data;
  applyPresetsPayload(data);
  saveLocalCustomCatalog();
  return data;
}

export async function saveBusinessProductLineVariantOverride(
  variantId: string,
  patch: BusinessProductLineVariantOverride,
): Promise<PresetsApiPayload> {
  try {
    const res = await apiFetch(`${API_BASE}/presets/variant/${encodeURIComponent(variantId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as PresetsApiPayload;
    const mergedOverrides = mergeVariantOverrideRecords(data.variantOverrides ?? {}, {
      ...(data.variantOverrides ?? {}),
      [variantId]: data.variantOverrides?.[variantId] ?? patch,
    });
    const payload: PresetsApiPayload = { ...data, variantOverrides: mergedOverrides };
    cachedPayload = payload;
    applyPresetsPayload(payload);
    invalidateVisibilityContextCache();
    syncTenantProfileAfterPresetChange();
    return payload;
  } catch {
    const current = cachedPayload ?? buildLocalFallback();
    const prevOverride = current.variantOverrides?.[variantId] ?? getBusinessProductLineVariantOverrides()[variantId];
    const seedVariant = getBaseVariantsCatalog().find((v) => v.id === variantId);
    const beforeState = mergeVariantEffectiveState(seedVariant, prevOverride ?? {});
    const afterState = mergeVariantEffectiveState(seedVariant, patch);
    const changes = diffPresetOverrideSnapshot(beforeState, afterState);
    const variantOverrides = { ...(current.variantOverrides ?? {}), [variantId]: patch };
    setBusinessProductLineVariantOverrides(variantOverrides);
    saveVariantOverridesToSession(variantOverrides);
    invalidateVisibilityContextCache();
    syncTenantProfileAfterPresetChange();
    cachedPayload = { ...current, variantOverrides };
    appendLocalPresetAudit({
      actor: "local",
      action: "preset.variant.override",
      variantId,
      businessTypeId: variantId.includes(":") ? variantId.split(":")[0] : undefined,
      version: patch.version,
      changes,
    });
    saveLocalCustomCatalog();
    return cachedPayload;
  }
}

/** 同步自定义业态目录到 sessionStorage */
export function persistLocalCustomCatalog(): void {
  saveLocalCustomCatalog();
}

/** @deprecated 使用 persistLocalCustomCatalog */
export function persistLocalCustomCatalogAfterAppend(): void {
  persistLocalCustomCatalog();
}

export interface UpdateBusinessTypeInput {
  title: string;
  titleEn: string;
}

export async function updatePlatformBusinessType(
  id: string,
  input: UpdateBusinessTypeInput,
): Promise<PresetsApiPayload> {
  const res = await apiFetch(`${API_BASE}/presets/business-types/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as PresetsApiPayload;
  cachedPayload = data;
  applyPresetsPayload(data);
  persistLocalCustomCatalog();
  return data;
}

export async function deletePlatformBusinessType(id: string): Promise<PresetsApiPayload> {
  const res = await apiFetch(`${API_BASE}/presets/business-types/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as PresetsApiPayload;
  cachedPayload = data;
  applyPresetsPayload(data);
  persistLocalCustomCatalog();
  return data;
}

export function applyLocalBusinessTypeUpdate(id: string, title: string, titleEn: string): void {
  updateLocalCustomBusinessType(id, title, titleEn);
  persistLocalCustomCatalog();
}

export function applyLocalBusinessTypeDelete(id: string): void {
  removeLocalCustomBusinessType(id);
  if (cachedPayload?.variantOverrides) {
    const next = { ...cachedPayload.variantOverrides };
    for (const key of Object.keys(next)) {
      if (key.startsWith(`${id}:`)) delete next[key];
    }
    setBusinessProductLineVariantOverrides(next);
    invalidateVisibilityContextCache();
    cachedPayload = { ...cachedPayload, variantOverrides: next };
  }
  persistLocalCustomCatalog();
}
