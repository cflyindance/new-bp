import type { DemoScenario, DemoScenarioScope, DemoStoreProduct } from "../demo-scenario-types";

export interface DemoStoreProductView extends DemoStoreProduct {
  name: string;
  categoryId: string;
  brandId: string;
}

export function listDemoStoreProducts(scenario: DemoScenario, scope: DemoScenarioScope): DemoStoreProductView[] {
  const stores = new Set(scope.storeIds);
  return Object.values(scenario.storeProducts)
    .filter((item) => stores.has(item.storeId))
    .map((item) => {
      const product = scenario.products[item.productId];
      return { ...item, name: product.name, categoryId: product.categoryId, brandId: product.brandId };
    })
    .sort((a, b) => `${a.storeId}:${a.name}`.localeCompare(`${b.storeId}:${b.name}`, "zh-CN"));
}

export function readDemoStoreMenu(scenario: DemoScenario, scope: DemoScenarioScope): DemoStoreProductView[] {
  return listDemoStoreProducts(scenario, scope).filter((item) => item.enabled);
}
