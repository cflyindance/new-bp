import type { EnterpriseMerchantSnapshot } from "../config/enterprise-merchant-types";
import type { DemoBrandTemplate, DemoProduct, DemoStoreProfile } from "./demo-scenario-types";

export interface DemoScenarioCatalog {
  brandTemplates: Record<string, DemoBrandTemplate>;
  storeProfiles: Record<string, DemoStoreProfile>;
  products: Record<string, DemoProduct>;
}

interface ProductSeed {
  key: string;
  name: string;
  categoryId: string;
  priceMinor: number;
  taxRateBasisPoints: number;
}

function productSeedsForBrand(name: string): ProductSeed[] {
  if (name.includes("火锅")) {
    return [
      { key: "signature-broth", name: "招牌锅底", categoryId: "hotpot-base", priceMinor: 6800, taxRateBasisPoints: 600 },
      { key: "beef-platter", name: "精选肥牛", categoryId: "meat", priceMinor: 4200, taxRateBasisPoints: 600 },
      { key: "vegetable-basket", name: "时蔬拼盘", categoryId: "vegetable", priceMinor: 2600, taxRateBasisPoints: 600 },
    ];
  }
  if (name.includes("串串")) {
    return [
      { key: "beef-skewers", name: "香辣牛肉串", categoryId: "skewers", priceMinor: 1800, taxRateBasisPoints: 600 },
      { key: "vegetable-skewers", name: "时蔬串串", categoryId: "skewers", priceMinor: 1200, taxRateBasisPoints: 600 },
      { key: "brown-sugar-rice-cake", name: "红糖糍粑", categoryId: "snack", priceMinor: 2200, taxRateBasisPoints: 600 },
    ];
  }
  return [
    { key: "signature-main", name: `${name}招牌主食`, categoryId: "main", priceMinor: 3200, taxRateBasisPoints: 825 },
    { key: "signature-side", name: `${name}精选小食`, categoryId: "side", priceMinor: 1600, taxRateBasisPoints: 825 },
    { key: "signature-drink", name: `${name}特饮`, categoryId: "drink", priceMinor: 900, taxRateBasisPoints: 825 },
  ];
}

function safeId(value: string): string {
  return value.replace(/^merchant-/, "").replace(/[^A-Za-z0-9_-]/g, "-");
}

export function buildDemoScenarioCatalog(snapshot: EnterpriseMerchantSnapshot): DemoScenarioCatalog {
  const brandTemplates: Record<string, DemoBrandTemplate> = {};
  const storeProfiles: Record<string, DemoStoreProfile> = {};
  const products: Record<string, DemoProduct> = {};
  const activeStores = snapshot.stores.filter((store) => store.status !== "archived");

  for (const merchant of snapshot.merchants) {
    const merchantStores = activeStores.filter((store) => store.merchantId === merchant.merchantId);
    if (!merchantStores.length || !merchant.groupId) continue;
    const productSeeds = productSeedsForBrand(merchant.name);
    const productIds = productSeeds.map((seed) => `demo-product-${safeId(merchant.merchantId)}-${seed.key}`);
    const basePrices: Record<string, number> = {};
    productSeeds.forEach((seed, index) => {
      const productId = productIds[index];
      basePrices[productId] = seed.priceMinor;
      products[productId] = {
        productId,
        brandId: merchant.merchantId,
        name: seed.name,
        categoryId: `${merchant.merchantId}:${seed.categoryId}`,
        taxRateBasisPoints: seed.taxRateBasisPoints,
      };
    });
    brandTemplates[merchant.merchantId] = {
      brandId: merchant.merchantId,
      groupId: merchant.groupId,
      name: merchant.name,
      productIds,
      campaignIds: [`demo-campaign-${safeId(merchant.merchantId)}-welcome`],
      basePrices,
    };

    merchantStores.forEach((store, index) => {
      const firstProductId = productIds[0];
      const secondProductId = productIds[1];
      const productOverrides: DemoStoreProfile["productOverrides"] = {};
      if (index % 2 === 1) {
        productOverrides[firstProductId] = { priceMinor: basePrices[firstProductId] + 300 };
        productOverrides[secondProductId] = { enabled: false, inventory: 0 };
      }
      storeProfiles[store.storeId] = {
        storeId: store.storeId,
        brandId: merchant.merchantId,
        groupId: merchant.groupId,
        name: store.name,
        timezone: merchant.timezone || "Asia/Shanghai",
        volumeFactor: 0.85 + index * 0.35,
        averageTicketFactor: 0.95 + index * 0.08,
        productOverrides,
      };
    });
  }

  return { brandTemplates, storeProfiles, products };
}
