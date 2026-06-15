/** 租户画像默认种子数据（P6 多租户键） */
import { profileKey } from "./tenant-scope.mjs";

/** 平台预设默认全开：全产线组合 + 全 L1 能力（与 PRODUCT_LINE_KEY_IDS 对齐） */
const FULL_PRODUCT_LINE_PRESET_IDS = [
  "emenu-only",
  "sdi-only",
  "kiosk-only",
  "pos-suite",
  "pos-go-only",
  "online-order",
  "kds",
  "paypad",
];
const FULL_PRODUCT_LINES = ["pos", "pos-go", "paypad", "kiosk", "emenu", "sdi", "online-order", "kds", "cds"];
const FULL_PRODUCT_LINE_VERSIONS = Object.fromEntries(
  FULL_PRODUCT_LINE_PRESET_IDS.map((id) => [id, 1]),
);

function fullPlatformTenantProfile(tenantId) {
  return {
    tenantId,
    scope: "tenant",
    primaryBusinessType: "general",
    productLinePresetIds: [...FULL_PRODUCT_LINE_PRESET_IDS],
    productLines: [...FULL_PRODUCT_LINES],
    enabledFeatures: [],
    addedFeatures: [],
    removedFeatures: [],
    onboardingCompleted: true,
    implementationPreConfigured: true,
    presetVersions: { business: 1, productLine: { ...FULL_PRODUCT_LINE_VERSIONS } },
  };
}

export function defaultPartnerTenantProfiles() {
  const tid = "partner-hq";
  return {
    [profileKey(tid, "tenant")]: fullPlatformTenantProfile(tid),
    [profileKey(tid, "brand", "chuanchuan")]: {
      tenantId: tid,
      scope: "brand",
      brandId: "chuanchuan",
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["pos-suite", "kds"],
      productLines: ["pos", "kds"],
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: [],
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: { "pos-suite": 1, kds: 1 } },
    },
    [profileKey(tid, "brand", "buffet-emenu")]: {
      tenantId: tid,
      scope: "brand",
      brandId: "buffet-emenu",
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["emenu-only"],
      productLines: ["emenu"],
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: [],
      onboardingCompleted: true,
      implementationPreConfigured: true,
      onboardingCompletedAt: "2026-06-01T00:00:00.000Z",
      presetVersions: { business: 1, productLine: { "emenu-only": 1 } },
    },
    [profileKey(tid, "store", "chengdu-td")]: {
      tenantId: tid,
      scope: "store",
      brandId: "chuanchuan",
      storeId: "chengdu-td",
      removedFeatures: [],
      onboardingCompleted: true,
      presetVersions: { business: 1, productLine: {} },
    },
    [profileKey(tid, "store", "buffet-flagship")]: {
      tenantId: tid,
      scope: "store",
      brandId: "buffet-emenu",
      storeId: "buffet-flagship",
      onboardingCompleted: true,
      presetVersions: { business: 1, productLine: { "emenu-only": 1 } },
    },
  };
}

export function defaultTenantProfileDb() {
  const tid = "demo-tenant";
  return {
    version: 2,
    updatedAt: null,
    presetOverrides: {},
    variantOverrides: {},
    customBusinessTypes: [],
    customVariants: [],
    auditLog: [],
    profiles: {
      [profileKey(tid, "tenant")]: fullPlatformTenantProfile(tid),
      [profileKey(tid, "brand", "miju")]: {
        tenantId: tid,
        scope: "brand",
        brandId: "miju",
        primaryBusinessType: "tea-drink",
        productLinePresetIds: ["emenu-only"],
        productLines: ["emenu"],
        enabledFeatures: [],
        addedFeatures: [],
        removedFeatures: [],
        onboardingCompleted: true,
        implementationPreConfigured: true,
        onboardingCompletedAt: "2026-06-01T00:00:00.000Z",
        presetVersions: { business: 1, productLine: { "emenu-only": 1 } },
      },
      [profileKey(tid, "brand", "fullservice-emenu")]: {
        tenantId: tid,
        scope: "brand",
        brandId: "fullservice-emenu",
        primaryBusinessType: "full-service",
        productLinePresetIds: ["emenu-only"],
        productLines: ["emenu"],
        enabledFeatures: [],
        addedFeatures: [],
        removedFeatures: [],
        onboardingCompleted: true,
        implementationPreConfigured: true,
        onboardingCompletedAt: "2026-06-01T00:00:00.000Z",
        presetVersions: { business: 1, productLine: { "emenu-only": 1 } },
      },
      [profileKey(tid, "brand", "menusifu-na")]: {
        tenantId: tid,
        scope: "brand",
        brandId: "menusifu-na",
        primaryBusinessType: "fast-food",
        productLinePresetIds: ["pos-suite", "kds"],
        productLines: ["pos", "pos-go", "paypad", "kds"],
        enabledFeatures: [],
        addedFeatures: [],
        removedFeatures: [],
        onboardingCompleted: true,
        implementationPreConfigured: true,
        presetVersions: { business: 1, productLine: { "pos-suite": 1, kds: 1 } },
      },
      [profileKey(tid, "store", "shanghai-ljz")]: {
        tenantId: tid,
        scope: "store",
        brandId: "miju",
        storeId: "shanghai-ljz",
        removedFeatures: [],
        onboardingCompleted: true,
        presetVersions: { business: 1, productLine: {} },
      },
      [profileKey(tid, "store", "flagship-nyc")]: {
        tenantId: tid,
        scope: "store",
        brandId: "menusifu-na",
        storeId: "flagship-nyc",
        removedFeatures: [],
        onboardingCompleted: true,
        presetVersions: { business: 1, productLine: {} },
      },
      ...defaultPartnerTenantProfiles(),
    },
  };
}

/** @param {Record<string, unknown>} base @param {Record<string, unknown>} layer */
export function mergeProfileLayers(base, layer) {
  if (!layer) return { ...base };
  const merged = { ...base, ...layer };
  if (Array.isArray(layer.productLinePresetIds) && layer.productLinePresetIds.length > 0) {
    merged.productLinePresetIds = layer.productLinePresetIds;
  } else {
    merged.productLinePresetIds = base.productLinePresetIds ?? [];
  }
  if (Array.isArray(layer.productLines) && layer.productLines.length > 0) {
    merged.productLines = layer.productLines;
  } else {
    merged.productLines = base.productLines ?? [];
  }
  merged.addedFeatures = [...new Set([...(base.addedFeatures ?? []), ...(layer.addedFeatures ?? [])])];
  merged.removedFeatures = [...new Set([...(base.removedFeatures ?? []), ...(layer.removedFeatures ?? [])])];
  if (layer.primaryBusinessType) merged.primaryBusinessType = layer.primaryBusinessType;
  if (layer.secondaryBusinessType !== undefined) merged.secondaryBusinessType = layer.secondaryBusinessType;
  if (layer.onboardingCompleted !== undefined) merged.onboardingCompleted = layer.onboardingCompleted;
  if (layer.implementationPreConfigured !== undefined) {
    merged.implementationPreConfigured = layer.implementationPreConfigured;
  }
  return merged;
}

export { profileKey };
