/**
 * 功能注册表 L2 — 对齐 NAV_MODULES[].children[].id
 */
import { NAV_MODULES } from "./navigation";
import type { BusinessTypeTag, FeatureTier, ProductLineScope, ProductLineTag } from "./feature-registry";

export interface FeatureMetaL2 {
  featureId: string;
  moduleId: string;
  level: 2;
  parentFeatureId: string;
  businessTypes: BusinessTypeTag[];
  productLines: ProductLineTag[];
  productLineScope: ProductLineScope;
  tier: FeatureTier;
}

/** 需按产线/业态细分的 L2 覆盖；未列出的子入口继承父模块可见性 */
export const L2_VISIBILITY_OVERRIDES: Partial<
  Record<
    string,
    Partial<Pick<FeatureMetaL2, "productLines" | "productLineScope" | "businessTypes" | "tier">>
  >
> = {
  "qc-floor-plan": { productLines: ["pos", "paypad"], productLineScope: "any", tier: "optional" },
  "qc-emenu-pro": { productLines: ["emenu"], productLineScope: "any", tier: "recommended" },
  "qc-menu-order-limits": { productLines: ["emenu", "kiosk", "sdi"], productLineScope: "any", tier: "optional" },
  "qc-category-settings": { productLines: ["emenu", "kiosk"], productLineScope: "any", tier: "optional" },
  "qc-classification-settings": { productLines: ["emenu", "kiosk"], productLineScope: "any", tier: "optional" },
  "kds-display": { productLines: ["kds", "pos"], productLineScope: "any", tier: "recommended" },
  "kds-workflow": { productLines: ["kds", "pos"], productLineScope: "any", tier: "recommended" },
  "fin-register-audit": { productLines: ["pos"], productLineScope: "all", tier: "recommended" },
  "wl-main": { productLines: ["online-order"], productLineScope: "all", tier: "core" },
  "res-waitlist": { productLines: ["pos"], productLineScope: "any", tier: "optional" },
  "res-rsv": {
    productLines: ["pos"],
    productLineScope: "any",
    tier: "optional",
    businessTypes: ["hotpot", "bbq", "buffet", "full-service", "bar"],
  },
  "dm-hardware": { productLines: ["pos", "kiosk", "kds", "emenu", "paypad"], productLineScope: "any", tier: "recommended" },
  "orders-settings": { productLines: ["pos", "pos-go", "paypad"], productLineScope: "any", tier: "recommended" },
  "team-tax-payroll": { productLines: [], productLineScope: "agnostic", tier: "advanced" },
};

function buildL2Registry(): FeatureMetaL2[] {
  const rows: FeatureMetaL2[] = [];
  for (const mod of NAV_MODULES) {
    for (const child of mod.children) {
      const override = L2_VISIBILITY_OVERRIDES[child.id];
      rows.push({
        featureId: child.id,
        moduleId: mod.id,
        level: 2,
        parentFeatureId: mod.id,
        businessTypes: override?.businessTypes ?? [],
        productLines: override?.productLines ?? [],
        productLineScope: override?.productLineScope ?? "agnostic",
        tier: override?.tier ?? "recommended",
      });
    }
  }
  return rows;
}

export const FEATURE_REGISTRY_L2: FeatureMetaL2[] = buildL2Registry();

const L2_BY_ID = new Map(FEATURE_REGISTRY_L2.map((m) => [m.featureId, m]));

export function getFeatureMetaL2(featureId: string): FeatureMetaL2 | undefined {
  return L2_BY_ID.get(featureId);
}

export function getL2FeaturesForModule(moduleId: string): FeatureMetaL2[] {
  return FEATURE_REGISTRY_L2.filter((m) => m.moduleId === moduleId);
}
