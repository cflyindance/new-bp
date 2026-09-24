import type { StaffStoreAccess } from "../permissions/store-access";
import type { DemoScenario, DemoScenarioScope, LocalBusinessDate } from "./demo-scenario-types";

export interface ResolveDemoScenarioScopeInput {
  scenario: DemoScenario;
  access: StaffStoreAccess;
  groupId?: string;
  brandIds?: string[];
  storeIds?: string[];
  fromDate?: LocalBusinessDate;
  toDate?: LocalBusinessDate;
}

export function resolveDemoScenarioScope(input: ResolveDemoScenarioScopeInput): DemoScenarioScope {
  const profiles = Object.values(input.scenario.storeProfiles);
  const accessIds = new Set(input.access.ids);
  const authorized = profiles.filter((store) => {
    if (input.access.mode === "all") return true;
    if (input.access.mode === "brands") return accessIds.has(store.brandId);
    if (input.access.mode === "stores") return accessIds.has(store.storeId);
    return false;
  });
  const requestedBrands = new Set(input.brandIds ?? []);
  const requestedStores = new Set(input.storeIds ?? []);
  const selected = authorized.filter((store) => {
    if (input.groupId && store.groupId !== input.groupId) return false;
    if (requestedBrands.size && !requestedBrands.has(store.brandId)) return false;
    if (requestedStores.size && !requestedStores.has(store.storeId)) return false;
    return true;
  });
  const result: DemoScenarioScope = {
    groupId: input.groupId,
    brandIds: [...new Set(selected.map((store) => store.brandId))].sort(),
    storeIds: selected.map((store) => store.storeId).sort(),
  };
  if (input.fromDate) result.fromDate = input.fromDate;
  if (input.toDate) result.toDate = input.toDate;
  return result;
}

export function queryScenarioStores(scenario: DemoScenario, scope: DemoScenarioScope) {
  const allowed = new Set(scope.storeIds);
  return Object.values(scenario.storeProfiles).filter((store) => allowed.has(store.storeId));
}
