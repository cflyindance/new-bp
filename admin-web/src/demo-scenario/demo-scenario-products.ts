import type { DemoBrandTemplate, DemoStoreProduct, DemoStoreProfile } from "./demo-scenario-types";

export function resolveStoreCatalog(
  template: DemoBrandTemplate,
  profile: DemoStoreProfile,
): DemoStoreProduct[] {
  if (template.brandId !== profile.brandId) {
    throw new Error(`Store ${profile.storeId} does not belong to brand ${template.brandId}`);
  }
  return template.productIds.map((productId) => {
    const override = profile.productOverrides[productId];
    return {
      storeProductId: `${profile.storeId}:${productId}`,
      storeId: profile.storeId,
      productId,
      priceMinor: override?.priceMinor ?? template.basePrices[productId],
      enabled: override?.enabled ?? true,
      inventory: override?.inventory ?? null,
    };
  });
}
