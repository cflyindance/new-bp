import {
  getScopedFilterOptions,
  readScopeFilters,
  usesInPageStorePicker,
  writeScopeFilters,
  type ScopeFilterState,
} from "../../auth/session-scope";
import { getUiLocale } from "../../i18n";
import type { PayrollScopeSnapshot } from "./payroll-types";

export interface PayrollPageContext {
  getScope(): PayrollScopeSnapshot;
  setStoreScope(storeId: string): void;
  subscribeScopeChange(listener: (scope: PayrollScopeSnapshot) => void): () => void;
  getLocale(): "zh" | "en";
  subscribeLocaleChange(listener: (locale: "zh" | "en") => void): () => void;
}

interface PayrollContextDependencies {
  readScope(): ScopeFilterState;
  writeScope(state: ScopeFilterState): void;
  listScopeOptions(): { stores: Array<{ value: string; labelZh: string; labelEn: string }> };
  events: Pick<EventTarget, "addEventListener" | "removeEventListener">;
  getLocale(): "zh" | "en";
  usesInPageStorePicker?: () => boolean;
}

function browserDependencies(): PayrollContextDependencies {
  return {
    readScope: readScopeFilters,
    writeScope: writeScopeFilters,
    listScopeOptions: getScopedFilterOptions,
    events: window,
    getLocale: getUiLocale,
    usesInPageStorePicker,
  };
}

export function createPayrollPageContext(
  dependencies: PayrollContextDependencies = browserDependencies(),
): PayrollPageContext {
  const getScope = (): PayrollScopeSnapshot => {
    const current = dependencies.readScope();
    const stores = dependencies.listScopeOptions().stores;
    const selected = stores.find((option) => option.value === current.store);
    return {
      brandId: current.brand,
      regionId: current.region,
      storeId: current.store,
      storeLabel: selected?.labelZh ?? "",
      storeLabelEn: selected?.labelEn ?? "",
      isAllStores: !current.store,
      usesInPageStorePicker: dependencies.usesInPageStorePicker?.() ?? true,
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
    getLocale: dependencies.getLocale,
    subscribeLocaleChange(listener) {
      const handler = () => listener(dependencies.getLocale());
      dependencies.events.addEventListener("menusifu:ui-locale-change", handler);
      return () => dependencies.events.removeEventListener("menusifu:ui-locale-change", handler);
    },
  };
}

