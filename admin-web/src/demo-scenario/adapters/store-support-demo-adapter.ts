import type { DemoScenario, DemoScenarioScope } from "../demo-scenario-types";

export function listDemoStoreReferences(scenario: DemoScenario, scope: DemoScenarioScope) {
  const allowed = new Set(scope.storeIds);
  return Object.values(scenario.storeProfiles).filter((store) => allowed.has(store.storeId)).map((store) => ({ storeId: store.storeId, storeName: store.name, brandId: store.brandId, groupId: store.groupId }));
}
