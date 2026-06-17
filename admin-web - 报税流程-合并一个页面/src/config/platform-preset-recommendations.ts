/**
 * 平台预设 · 业态 × 产线默认推荐画像
 *
 * 默认启用规则（见 resolveDefaultModuleEnabled / defaultEnabledFromRecommendations）：
 * - 「全功能/不确定」→ 编辑树内全部节点默认勾选
 * - 其他业态 → 一级 core/recommended 模块及其整棵子树默认勾选（产线 excluded 除外）
 * - 产线 core/recommended → 可抬升业态 optional 模块
 */
import type { ProductLineId } from "./platform-preset-catalog";

export type PresetModuleTier = "core" | "recommended" | "optional" | "excluded";

const T = {
  core: "core",
  rec: "recommended",
  opt: "optional",
  off: "excluded",
} as const satisfies Record<string, PresetModuleTier>;

/** 与 permission-registry 一级模块对齐（不含 permission-mgmt） */
const ALL_PRESET_L1_MODULE_IDS = [
  "brand-mgmt",
  "store-mgmt",
  "dashboard",
  "team",
  "product-center-main",
  "orders",
  "transactions",
  "waitlist",
  "marketing",
  "promotions",
  "members",
  "gift-cards",
  "reviews",
  "queue-call",
  "kitchen-kds",
  "reservations",
  "reports-finance",
  "finance-center",
  "print-templates",
  "notifications",
  "inventory-ordering",
  "device-management",
  "capital-turnover",
  "asset-center",
  "log-management",
  "settings",
] as const;

const CHAIN_PLATFORM_OPT: Partial<Record<string, PresetModuleTier>> = {
  "brand-mgmt": T.opt,
  "store-mgmt": T.opt,
  "capital-turnover": T.opt,
  "log-management": T.opt,
  "asset-center": T.opt,
};

function tierAllModules(tier: PresetModuleTier): Partial<Record<string, PresetModuleTier>> {
  return Object.fromEntries(ALL_PRESET_L1_MODULE_IDS.map((id) => [id, tier]));
}

/** 正餐/火锅等堂食业态共用底座，可通过 overrides 微调 */
function dineInModuleTiers(
  overrides: Partial<Record<string, PresetModuleTier>> = {},
): Partial<Record<string, PresetModuleTier>> {
  return {
    "queue-call": T.core,
    "kitchen-kds": T.core,
    reservations: T.core,
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    team: T.core,
    dashboard: T.rec,
    members: T.rec,
    marketing: T.rec,
    promotions: T.rec,
    reviews: T.rec,
    "reports-finance": T.rec,
    "print-templates": T.rec,
    "device-management": T.rec,
    waitlist: T.rec,
    "gift-cards": T.rec,
    "finance-center": T.rec,
    "inventory-ordering": T.rec,
    notifications: T.rec,
    ...CHAIN_PLATFORM_OPT,
    ...overrides,
  };
}

/** 「全功能/不确定」业态 id（默认勾选编辑树全部节点） */
export const FULL_SELECTION_BUSINESS_TYPE_ID = "full-service";

export function isFullSelectionBusinessType(businessTypeId: string): boolean {
  return businessTypeId === FULL_SELECTION_BUSINESS_TYPE_ID;
}

/** 内置经营业态 · 一级模块推荐等级 */
export const BUILTIN_BUSINESS_TYPE_MODULE_TIERS: Record<string, Partial<Record<string, PresetModuleTier>>> = {
  "full-service": tierAllModules(T.core),
  "fast-food": {
    dashboard: T.core,
    "queue-call": T.core,
    "kitchen-kds": T.core,
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    "print-templates": T.core,
    marketing: T.rec,
    promotions: T.rec,
    waitlist: T.rec,
    "device-management": T.rec,
    members: T.rec,
    "reports-finance": T.rec,
    reviews: T.rec,
    team: T.rec,
    notifications: T.rec,
    "gift-cards": T.opt,
    reservations: T.opt,
    "finance-center": T.opt,
    "inventory-ordering": T.opt,
    ...CHAIN_PLATFORM_OPT,
  },
  "casual-dining": {
    "queue-call": T.core,
    "kitchen-kds": T.core,
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    dashboard: T.rec,
    reservations: T.rec,
    marketing: T.rec,
    promotions: T.rec,
    members: T.rec,
    team: T.rec,
    "print-templates": T.rec,
    "device-management": T.rec,
    "reports-finance": T.rec,
    reviews: T.rec,
    waitlist: T.rec,
    "gift-cards": T.rec,
    "finance-center": T.rec,
    notifications: T.rec,
    "inventory-ordering": T.opt,
    ...CHAIN_PLATFORM_OPT,
  },
  "delivery-only": {
    waitlist: T.core,
    orders: T.core,
    transactions: T.core,
    "kitchen-kds": T.core,
    "product-center-main": T.core,
    promotions: T.core,
    dashboard: T.rec,
    marketing: T.rec,
    "reports-finance": T.rec,
    "device-management": T.rec,
    "queue-call": T.rec,
    members: T.rec,
    team: T.rec,
    notifications: T.rec,
    reviews: T.rec,
    reservations: T.opt,
    "print-templates": T.opt,
    "gift-cards": T.opt,
    "finance-center": T.opt,
    "inventory-ordering": T.opt,
    ...CHAIN_PLATFORM_OPT,
  },
  "tea-drinks": {
    "queue-call": T.core,
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    "kitchen-kds": T.core,
    dashboard: T.rec,
    marketing: T.rec,
    promotions: T.rec,
    members: T.rec,
    "device-management": T.rec,
    waitlist: T.rec,
    "print-templates": T.rec,
    team: T.rec,
    notifications: T.rec,
    "reports-finance": T.rec,
    reviews: T.rec,
    reservations: T.opt,
    "gift-cards": T.opt,
    "finance-center": T.opt,
    "inventory-ordering": T.opt,
    ...CHAIN_PLATFORM_OPT,
  },
  coffee: {
    "queue-call": T.core,
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    "kitchen-kds": T.core,
    dashboard: T.rec,
    marketing: T.rec,
    promotions: T.rec,
    members: T.rec,
    "device-management": T.rec,
    waitlist: T.rec,
    "print-templates": T.rec,
    team: T.rec,
    notifications: T.rec,
    "reports-finance": T.rec,
    reviews: T.rec,
    reservations: T.opt,
    "gift-cards": T.opt,
    "finance-center": T.opt,
    "inventory-ordering": T.opt,
    ...CHAIN_PLATFORM_OPT,
  },
  bakery: {
    "queue-call": T.core,
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    "kitchen-kds": T.core,
    dashboard: T.rec,
    marketing: T.rec,
    promotions: T.rec,
    members: T.rec,
    "device-management": T.rec,
    "inventory-ordering": T.rec,
    waitlist: T.rec,
    "print-templates": T.rec,
    team: T.rec,
    notifications: T.rec,
    "reports-finance": T.rec,
    reviews: T.rec,
    reservations: T.opt,
    "gift-cards": T.opt,
    "finance-center": T.opt,
    ...CHAIN_PLATFORM_OPT,
  },
  hotpot: dineInModuleTiers(),
  bbq: dineInModuleTiers(),
  buffet: dineInModuleTiers({ "inventory-ordering": T.core }),
  bar: {
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    team: T.core,
    dashboard: T.rec,
    "queue-call": T.rec,
    members: T.rec,
    reservations: T.rec,
    "reports-finance": T.rec,
    marketing: T.rec,
    promotions: T.rec,
    "device-management": T.rec,
    waitlist: T.rec,
    notifications: T.rec,
    reviews: T.rec,
    "kitchen-kds": T.opt,
    "gift-cards": T.opt,
    "finance-center": T.opt,
    "print-templates": T.opt,
    "inventory-ordering": T.opt,
    ...CHAIN_PLATFORM_OPT,
  },
  chinese: dineInModuleTiers(),
  western: dineInModuleTiers(),
  "japanese-korean": dineInModuleTiers(),
  "full-meal": dineInModuleTiers(),
};

/** 自定义业态无画像时的回退 */
export const CUSTOM_BUSINESS_TYPE_FALLBACK_ID = "casual-dining";

const POS_TERMINAL_LINES = new Set<ProductLineId>(["pos", "pos-go", "paypad"]);
const SELF_SERVICE_LINES = new Set<ProductLineId>(["kiosk", "emenu", "sdi"]);

const TERMINAL_OPS_EXCLUDED: Partial<Record<string, PresetModuleTier>> = {
  "queue-call": T.off,
  "kitchen-kds": T.off,
  orders: T.off,
  transactions: T.off,
  waitlist: T.off,
  reservations: T.off,
  team: T.off,
  members: T.off,
  promotions: T.off,
  "gift-cards": T.off,
  reviews: T.off,
  "reports-finance": T.off,
  "finance-center": T.off,
  "print-templates": T.off,
  notifications: T.off,
  "inventory-ordering": T.off,
  dashboard: T.off,
  "capital-turnover": T.off,
  "log-management": T.off,
};

/** 产线 · 一级模块推荐/排除（未列出的模块随业态） */
export const PRODUCT_LINE_MODULE_TIERS: Record<ProductLineId, Partial<Record<string, PresetModuleTier>>> = {
  pos: {},
  "pos-go": {},
  paypad: {},
  kiosk: {
    dashboard: T.off,
    reservations: T.off,
    "brand-mgmt": T.off,
    "store-mgmt": T.off,
    "capital-turnover": T.off,
    "log-management": T.off,
    "finance-center": T.off,
    "inventory-ordering": T.off,
    team: T.off,
    "gift-cards": T.off,
    waitlist: T.off,
    "print-templates": T.off,
    "queue-call": T.core,
    "kitchen-kds": T.core,
    "product-center-main": T.core,
    marketing: T.rec,
    orders: T.rec,
    transactions: T.rec,
    "device-management": T.rec,
  },
  emenu: {
    dashboard: T.off,
    reservations: T.off,
    "brand-mgmt": T.off,
    "store-mgmt": T.off,
    "capital-turnover": T.off,
    "log-management": T.off,
    "finance-center": T.off,
    "inventory-ordering": T.off,
    team: T.off,
    "gift-cards": T.off,
    waitlist: T.off,
    "print-templates": T.off,
    "queue-call": T.core,
    "kitchen-kds": T.core,
    "product-center-main": T.core,
    marketing: T.rec,
    orders: T.rec,
    transactions: T.rec,
    "device-management": T.rec,
  },
  sdi: {
    dashboard: T.off,
    reservations: T.off,
    "brand-mgmt": T.off,
    "store-mgmt": T.off,
    "capital-turnover": T.off,
    "log-management": T.off,
    "finance-center": T.off,
    "inventory-ordering": T.off,
    team: T.off,
    "gift-cards": T.off,
    waitlist: T.off,
    "print-templates": T.off,
    "queue-call": T.core,
    "kitchen-kds": T.core,
    "product-center-main": T.core,
    marketing: T.rec,
    orders: T.rec,
    transactions: T.rec,
    "device-management": T.rec,
  },
  "online-order": {
    reservations: T.off,
    "print-templates": T.off,
    "capital-turnover": T.off,
    "log-management": T.off,
    "brand-mgmt": T.off,
    "store-mgmt": T.off,
    waitlist: T.core,
    orders: T.core,
    transactions: T.core,
    "product-center-main": T.core,
    "kitchen-kds": T.core,
    "queue-call": T.rec,
    marketing: T.rec,
    promotions: T.rec,
    members: T.rec,
    dashboard: T.rec,
    "device-management": T.rec,
  },
  cds: {
    ...TERMINAL_OPS_EXCLUDED,
    marketing: T.core,
    "product-center-main": T.core,
    "device-management": T.core,
    "asset-center": T.rec,
  },
  "store-wide": {
    "queue-call": T.off,
    "kitchen-kds": T.off,
    orders: T.off,
    transactions: T.off,
    waitlist: T.off,
    reservations: T.off,
    "print-templates": T.off,
    "brand-mgmt": T.core,
    "store-mgmt": T.core,
    "product-center-main": T.core,
    team: T.core,
    "reports-finance": T.core,
    notifications: T.rec,
    dashboard: T.rec,
    "inventory-ordering": T.rec,
    "asset-center": T.rec,
    marketing: T.rec,
    "device-management": T.rec,
    members: T.rec,
    promotions: T.rec,
  },
};

export function getBusinessModuleTiers(
  businessTypeId: string,
  customTiers?: Partial<Record<string, PresetModuleTier>>,
): Partial<Record<string, PresetModuleTier>> {
  if (customTiers) return customTiers;
  return (
    BUILTIN_BUSINESS_TYPE_MODULE_TIERS[businessTypeId] ??
    BUILTIN_BUSINESS_TYPE_MODULE_TIERS[CUSTOM_BUSINESS_TYPE_FALLBACK_ID] ??
    {}
  );
}

export function getProductLineModuleTier(
  productLineId: ProductLineId,
  moduleId: string,
): PresetModuleTier | undefined {
  return PRODUCT_LINE_MODULE_TIERS[productLineId]?.[moduleId];
}

/** 默认是否启用该一级模块（业态 × 产线） */
export function resolveDefaultModuleEnabled(
  moduleId: string,
  businessTypeId: string,
  productLineId: ProductLineId,
  customBusinessTiers?: Partial<Record<string, PresetModuleTier>>,
): boolean {
  if (isFullSelectionBusinessType(businessTypeId)) return true;

  const businessTier = getBusinessModuleTiers(businessTypeId, customBusinessTiers)[moduleId];
  const lineTier = getProductLineModuleTier(productLineId, moduleId);

  if (lineTier === T.off) return false;
  if (lineTier === T.core || lineTier === T.rec) return true;
  return businessTier === T.core || businessTier === T.rec;
}

/** 编辑页标签：展示合并后的有效等级 */
export function getEffectivePresetModuleTier(
  moduleId: string,
  businessTypeId: string,
  productLineId: ProductLineId,
  customBusinessTiers?: Partial<Record<string, PresetModuleTier>>,
): PresetModuleTier | undefined {
  if (isFullSelectionBusinessType(businessTypeId)) return T.core;

  const businessTier = getBusinessModuleTiers(businessTypeId, customBusinessTiers)[moduleId];
  const lineTier = getProductLineModuleTier(productLineId, moduleId);

  if (lineTier === T.off) return T.off;
  if (lineTier === T.core || lineTier === T.rec) return lineTier;
  if (businessTier === T.core || businessTier === T.rec) return businessTier;
  if (businessTier === T.opt || lineTier === T.opt) return T.opt;
  return undefined;
}

export function isPosTerminalLine(productLineId: ProductLineId): boolean {
  return POS_TERMINAL_LINES.has(productLineId);
}

export function isSelfServiceLine(productLineId: ProductLineId): boolean {
  return SELF_SERVICE_LINES.has(productLineId);
}
