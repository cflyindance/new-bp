import { getScopedFilterOptions, readScopeFilters, writeScopeFilters, type ScopeFilterState } from "../../auth/session-scope";

export interface TipsScopeSnapshot {
  storeId: string;
  storeLabel: string;
  storeLabelEn: string;
  isAllStores: boolean;
  usesInPageStorePicker: boolean;
  stores: Array<{ id: string; labelZh: string; labelEn: string }>;
}

export interface TipsNavigationState {
  parentHref: string;
  parentScrollTop: number;
  payload?: unknown;
}

export interface TipsPageContext {
  getScope(): TipsScopeSnapshot;
  setStoreScope(storeId: string): void;
  subscribeScopeChange(listener: (scope: TipsScopeSnapshot) => void): () => void;
  navigate(href: string, state?: TipsNavigationState): void;
  getNavigationState(): TipsNavigationState | null;
  getScrollOwner(): HTMLElement | null;
}

interface TipsContextDependencies {
  readScope(): ScopeFilterState;
  writeScope(state: ScopeFilterState): void;
  listScopeOptions(): { stores: Array<{ value: string; labelZh: string; labelEn: string }> };
  events: Pick<EventTarget, "addEventListener" | "removeEventListener">;
}

function browserDependencies(): TipsContextDependencies {
  return { readScope: readScopeFilters, writeScope: writeScopeFilters, listScopeOptions: getScopedFilterOptions, events: window };
}

export function createTipsPageContext(dependencies: TipsContextDependencies = browserDependencies()): TipsPageContext {
  const getScope = (): TipsScopeSnapshot => {
    const current = dependencies.readScope();
    const stores = dependencies.listScopeOptions().stores;
    const selected = stores.find((item) => item.value === current.store);
    return {
      storeId: current.store,
      storeLabel: selected?.labelZh ?? "",
      storeLabelEn: selected?.labelEn ?? "",
      isAllStores: !current.store,
      usesInPageStorePicker: true,
      stores: stores.map((item) => ({ id: item.value, labelZh: item.labelZh, labelEn: item.labelEn })),
    };
  };
  return {
    getScope,
    setStoreScope(storeId) { dependencies.writeScope({ ...dependencies.readScope(), store: storeId }); },
    subscribeScopeChange(listener) {
      const handler = () => listener(getScope());
      dependencies.events.addEventListener("menusifu:scope-filter-change", handler);
      return () => dependencies.events.removeEventListener("menusifu:scope-filter-change", handler);
    },
    navigate(href, state) {
      if (state) history.replaceState({ ...history.state, menusifuTeamTips: state }, "");
      location.hash = href.startsWith("#") ? href : `#${href}`;
    },
    getNavigationState() { return (history.state?.menusifuTeamTips as TipsNavigationState | undefined) ?? null; },
    getScrollOwner() { return document.querySelector<HTMLElement>("[data-team-tips-scroll]"); },
  };
}
