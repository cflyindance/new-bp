import { getScopedFilterOptions, readScopeFilters, writeScopeFilters, type ScopeFilterState } from "../../auth/session-scope";
import { isTipsSummaryReturnTransition, isTrustedTipsHistoryState, parseTipsRoute, type TipsHistoryEntryState } from "./tips-navigation";

export interface TipsScopeSnapshot {
  storeId: string;
  storeLabel: string;
  storeLabelEn: string;
  isAllStores: boolean;
  usesInPageStorePicker: boolean;
  stores: Array<{ id: string; labelZh: string; labelEn: string }>;
}

export type TipsNavigationState = TipsHistoryEntryState;

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
  const commitHash = (href: string, mode: "push" | "replace", state: TipsHistoryEntryState): void => {
    const hash = href.startsWith("#") ? href : `#${href}`;
    const url = `${location.origin}/${hash}`;
    history[mode === "push" ? "pushState" : "replaceState"]({ ...history.state, menusifuTeamTips: state }, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
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
      const current = parseTipsRoute(location.hash);
      const target = parseTipsRoute(href);
      const scrollTop = document.querySelector<HTMLElement>("[data-team-tips-scroll]")?.scrollTop ?? 0;
      const existing = history.state?.menusifuTeamTips;
      const trusted = isTrustedTipsHistoryState(existing, current.href) ? existing : null;
      const flowId = trusted?.flowId ?? `tips-${Date.now().toString(36)}`;
      const summaryScrollTop = current.view === "distribution" ? scrollTop : trusted?.summaryScrollTop ?? 0;
      const next: TipsHistoryEntryState = state ?? { flowId, viewHref: target.href, scrollTop: 0, parentHref: current.href, summaryHref: "/team/tips/distribution", summaryScrollTop };
      if (trusted) history.replaceState({ ...history.state, menusifuTeamTips: { ...trusted, scrollTop } }, "");
      if ((current.view === "rule-editor" && target.view === "rules") || (current.view === "rules" && target.view === "distribution") || isTipsSummaryReturnTransition(current, target)) {
        commitHash(target.href, "replace", { ...next, parentHref: target.view === "rules" ? "/team/tips/distribution" : target.href });
        return;
      }
      commitHash(target.href, "push", next);
    },
    getNavigationState() {
      const route = parseTipsRoute(location.hash);
      const value = history.state?.menusifuTeamTips;
      return isTrustedTipsHistoryState(value, route.href) ? value : null;
    },
    getScrollOwner() { return document.querySelector<HTMLElement>("[data-team-tips-scroll]"); },
  };
}
