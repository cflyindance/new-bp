import {
  getScopedFilterOptions,
  readScopeFilters,
  writeScopeFilters,
  type ScopeFilterState,
} from "../../auth/session-scope";

export interface EmployeesScopeSnapshot {
  storeId: string;
  storeLabel: string;
  storeLabelEn: string;
  isAllStores: boolean;
  usesInPageStorePicker: boolean;
  stores: Array<{ id: string; labelZh: string; labelEn: string }>;
}

export interface EmployeesPageContext {
  getScope(): EmployeesScopeSnapshot;
  setStoreScope(storeId: string): void;
  subscribeScopeChange(listener: (scope: EmployeesScopeSnapshot) => void): () => void;
}

interface EmployeesContextDependencies {
  readScope(): ScopeFilterState;
  writeScope(state: ScopeFilterState): void;
  listScopeOptions(): { stores: Array<{ value: string; labelZh: string; labelEn: string }> };
  events: Pick<EventTarget, "addEventListener" | "removeEventListener">;
}

function browserDependencies(): EmployeesContextDependencies {
  return {
    readScope: readScopeFilters,
    writeScope: writeScopeFilters,
    listScopeOptions: getScopedFilterOptions,
    events: window,
  };
}

export function createEmployeesPageContext(
  dependencies: EmployeesContextDependencies = browserDependencies(),
): EmployeesPageContext {
  const getScope = (): EmployeesScopeSnapshot => {
    const current = dependencies.readScope();
    const stores = dependencies.listScopeOptions().stores;
    const selected = stores.find((option) => option.value === current.store);
    return {
      storeId: current.store,
      storeLabel: selected?.labelZh ?? "",
      storeLabelEn: selected?.labelEn ?? "",
      isAllStores: !current.store,
      usesInPageStorePicker: true,
      stores: stores.map((option) => ({ id: option.value, labelZh: option.labelZh, labelEn: option.labelEn })),
    };
  };

  return {
    getScope,
    setStoreScope(storeId) {
      dependencies.writeScope({ ...dependencies.readScope(), store: storeId });
    },
    subscribeScopeChange(listener) {
      const handler = () => listener(getScope());
      dependencies.events.addEventListener("menusifu:scope-filter-change", handler);
      return () => dependencies.events.removeEventListener("menusifu:scope-filter-change", handler);
    },
  };
}
