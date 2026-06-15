/**
 * 功能注册表 L1（SSOT）— 对齐 NAV_MODULES[].id
 * 方案：docs/项目文档/业态产线-功能预设与首次引导方案.md
 */
/** 系统设置 / 权限管理 — 不受业态×产线预设限制，租户侧栏默认始终展示 */
export const ALWAYS_VISIBLE_NAV_L1 = ["permission-mgmt", "settings"] as const;

export type AlwaysVisibleNavL1 = (typeof ALWAYS_VISIBLE_NAV_L1)[number];

/**
 * 平台预设 SSOT：任意业态×产线变体默认开通的一级模块（引导 Step 3 / 恢复推荐 / 变体种子）
 * 门店管理、商品中心、支付中心、前厅/后厨、报表、财务、打印、硬件、权限、信贷、素材、日志、系统设置
 */
export const PLATFORM_PRESET_DEFAULT_L1 = [
  "store-mgmt",
  "product-center-main",
  "transactions",
  "queue-call",
  "kitchen-kds",
  "reports-finance",
  "finance-center",
  "print-templates",
  "device-management",
  "permission-mgmt",
  "capital-turnover",
  "asset-center",
  "log-management",
  "settings",
] as const;

export type PlatformPresetDefaultL1 = (typeof PLATFORM_PRESET_DEFAULT_L1)[number];

export type KnownBusinessTypeTag =
  | "tea-drink"
  | "coffee"
  | "fast-food"
  | "casual-dining"
  | "delivery-first"
  | "bakery"
  | "hotpot"
  | "bbq"
  | "buffet"
  | "chinese-cuisine"
  | "western-cuisine"
  | "japanese-korean"
  | "full-service"
  | "bar"
  | "general";

/** 系统种子业态 + 平台运营新增（kebab-case 字符串） */
export type BusinessTypeTag = KnownBusinessTypeTag | (string & {});

export type ProductLineTag =
  | "pos"
  | "pos-go"
  | "paypad"
  | "kiosk"
  | "emenu"
  | "sdi"
  | "online-order"
  | "kds"
  | "cds";

export type FeatureTier = "core" | "recommended" | "optional" | "advanced";
export type ProductLineScope = "any" | "all" | "agnostic";

export interface FeatureMeta {
  featureId: string;
  moduleId: string;
  level: 1;
  businessTypes: BusinessTypeTag[];
  productLines: ProductLineTag[];
  productLineScope: ProductLineScope;
  tier: FeatureTier;
  onboardingGroup?: string;
  chainOnly?: boolean;
  licenseSku?: string[];
}

export const FEATURE_REGISTRY_L1: FeatureMeta[] = [
  {
    featureId: "brand-mgmt",
    moduleId: "brand-mgmt",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "core",
    onboardingGroup: "store",
    chainOnly: true,
  },
  {
    featureId: "store-mgmt",
    moduleId: "store-mgmt",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "core",
    onboardingGroup: "store",
  },
  {
    featureId: "dashboard",
    moduleId: "dashboard",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "core",
    onboardingGroup: "store",
  },
  {
    featureId: "team",
    moduleId: "team",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "recommended",
    onboardingGroup: "store",
  },
  {
    featureId: "product-center-main",
    moduleId: "product-center-main",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "core",
    onboardingGroup: "store",
  },
  {
    featureId: "orders",
    moduleId: "orders",
    level: 1,
    businessTypes: [
      "fast-food",
      "casual-dining",
      "delivery-first",
      "hotpot",
      "bbq",
      "buffet",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
    ],
    productLines: ["pos", "pos-go", "paypad"],
    productLineScope: "any",
    tier: "recommended",
    onboardingGroup: "foh",
  },
  {
    featureId: "transactions",
    moduleId: "transactions",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "any",
    tier: "core",
    onboardingGroup: "payment",
  },
  {
    featureId: "waitlist",
    moduleId: "waitlist",
    level: 1,
    businessTypes: ["tea-drink", "coffee", "fast-food", "bakery", "full-service"],
    productLines: ["online-order"],
    productLineScope: "all",
    tier: "recommended",
    onboardingGroup: "foh",
  },
  {
    featureId: "marketing",
    moduleId: "marketing",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "optional",
    onboardingGroup: "growth",
  },
  {
    featureId: "promotions",
    moduleId: "promotions",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "any",
    tier: "optional",
    onboardingGroup: "growth",
  },
  {
    featureId: "members",
    moduleId: "members",
    level: 1,
    businessTypes: [
      "tea-drink",
      "coffee",
      "fast-food",
      "casual-dining",
      "delivery-first",
      "buffet",
      "bbq",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
    ],
    productLines: [],
    productLineScope: "any",
    tier: "recommended",
    onboardingGroup: "growth",
  },
  {
    featureId: "gift-cards",
    moduleId: "gift-cards",
    level: 1,
    businessTypes: [
      "fast-food",
      "casual-dining",
      "buffet",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
    ],
    productLines: ["pos"],
    productLineScope: "any",
    tier: "optional",
    onboardingGroup: "growth",
  },
  {
    featureId: "reviews",
    moduleId: "reviews",
    level: 1,
    businessTypes: [],
    productLines: ["online-order", "emenu"],
    productLineScope: "any",
    tier: "optional",
    onboardingGroup: "growth",
  },
  {
    featureId: "queue-call",
    moduleId: "queue-call",
    level: 1,
    businessTypes: [
      "fast-food",
      "casual-dining",
      "hotpot",
      "bbq",
      "buffet",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
      "tea-drink",
      "coffee",
    ],
    productLines: ["pos", "emenu", "kiosk", "sdi", "paypad"],
    productLineScope: "any",
    tier: "recommended",
    onboardingGroup: "foh",
  },
  {
    featureId: "kitchen-kds",
    moduleId: "kitchen-kds",
    level: 1,
    businessTypes: [
      "fast-food",
      "casual-dining",
      "delivery-first",
      "hotpot",
      "bbq",
      "buffet",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
    ],
    productLines: ["pos", "kds"],
    productLineScope: "any",
    tier: "recommended",
    onboardingGroup: "boh",
  },
  {
    featureId: "reservations",
    moduleId: "reservations",
    level: 1,
    businessTypes: [
      "hotpot",
      "bbq",
      "buffet",
      "casual-dining",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
    ],
    productLines: ["pos"],
    productLineScope: "any",
    tier: "optional",
    onboardingGroup: "foh",
  },
  {
    featureId: "reports-finance",
    moduleId: "reports-finance",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "recommended",
    onboardingGroup: "report",
  },
  {
    featureId: "finance-center",
    moduleId: "finance-center",
    level: 1,
    businessTypes: [
      "fast-food",
      "casual-dining",
      "delivery-first",
      "hotpot",
      "bbq",
      "buffet",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
    ],
    productLines: ["pos"],
    productLineScope: "all",
    tier: "recommended",
    onboardingGroup: "payment",
  },
  {
    featureId: "print-templates",
    moduleId: "print-templates",
    level: 1,
    businessTypes: [
      "fast-food",
      "casual-dining",
      "delivery-first",
      "hotpot",
      "bbq",
      "buffet",
      "chinese-cuisine",
      "western-cuisine",
      "japanese-korean",
      "full-service",
      "bar",
    ],
    productLines: ["pos", "kds"],
    productLineScope: "any",
    tier: "recommended",
    onboardingGroup: "boh",
  },
  {
    featureId: "notifications",
    moduleId: "notifications",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "any",
    tier: "optional",
    onboardingGroup: "growth",
  },
  {
    featureId: "inventory-ordering",
    moduleId: "inventory-ordering",
    level: 1,
    businessTypes: ["bakery", "fast-food", "delivery-first"],
    productLines: [],
    productLineScope: "agnostic",
    tier: "advanced",
    onboardingGroup: "store",
  },
  {
    featureId: "device-management",
    moduleId: "device-management",
    level: 1,
    businessTypes: [],
    productLines: ["pos", "kiosk", "kds", "emenu", "paypad"],
    productLineScope: "any",
    tier: "recommended",
    onboardingGroup: "store",
  },
  {
    featureId: "permission-mgmt",
    moduleId: "permission-mgmt",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "core",
    onboardingGroup: "store",
  },
  {
    featureId: "capital-turnover",
    moduleId: "capital-turnover",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "optional",
    onboardingGroup: "payment",
  },
  {
    featureId: "asset-center",
    moduleId: "asset-center",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "optional",
    onboardingGroup: "growth",
  },
  {
    featureId: "log-management",
    moduleId: "log-management",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "optional",
    onboardingGroup: "store",
  },
  {
    featureId: "settings",
    moduleId: "settings",
    level: 1,
    businessTypes: [],
    productLines: [],
    productLineScope: "agnostic",
    tier: "core",
    onboardingGroup: "store",
  },
];

const REGISTRY_BY_MODULE = new Map(FEATURE_REGISTRY_L1.map((m) => [m.moduleId, m]));

export function getFeatureMeta(moduleId: string): FeatureMeta | undefined {
  return REGISTRY_BY_MODULE.get(moduleId);
}

export function getAllL1ModuleIds(): string[] {
  return FEATURE_REGISTRY_L1.map((m) => m.moduleId);
}

export const ONBOARDING_GROUP_LABELS: Record<string, { title: string; titleEn: string }> = {
  store: { title: "门店与组织", titleEn: "Store & organization" },
  foh: { title: "前台点单", titleEn: "Front of house" },
  boh: { title: "后厨出品", titleEn: "Back of house" },
  payment: { title: "支付与财务", titleEn: "Payment & finance" },
  growth: { title: "增长营销", titleEn: "Growth & marketing" },
  report: { title: "数据报表", titleEn: "Reports" },
};
