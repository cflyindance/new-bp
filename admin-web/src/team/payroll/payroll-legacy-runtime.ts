import commonCode from "./legacy/common.js.txt?raw";
import ruleDataCode from "./legacy/ruleData.js.txt?raw";
import adpMappingCode from "./legacy/payroll-adp-mapping.js.txt?raw";
import i18nCode from "./legacy/payroll-i18n.js.txt?raw";
import detailExportCode from "./legacy/payroll-detail-export.js.txt?raw";
import apiClientCode from "./legacy/payroll-api-client.js.txt?raw";
import payrollCode from "./legacy/payroll.js.txt?raw";
import type { PayrollPageContext } from "./payroll-context";
import type { PayrollScopeSnapshot } from "./payroll-types";

export interface PayrollRuntimeHandle {
  destroy(): void;
}

type LegacyGlobal = Record<PropertyKey, unknown>;

function normalizeStore(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function storeMatches(store: unknown, scope: PayrollScopeSnapshot): boolean {
  if (scope.isAllStores) return true;
  const employeeStore = normalizeStore(store);
  return [scope.storeId, scope.storeLabel, scope.storeLabelEn]
    .map(normalizeStore)
    .filter(Boolean)
    .some((candidate) =>
      employeeStore === candidate ||
      (candidate.length >= 4 && (employeeStore.includes(candidate) || candidate.includes(employeeStore))),
    );
}

function createScopeAdapter(context: PayrollPageContext, cleanups: Set<() => void>) {
  const scopeFromSelection = (storeId: unknown, storeLabel: unknown): PayrollScopeSnapshot => ({
    ...context.getScope(),
    storeId: String(storeId ?? "").trim(),
    storeLabel: String(storeLabel ?? "").trim(),
    storeLabelEn: String(storeLabel ?? "").trim(),
    isAllStores: !String(storeId ?? "").trim(),
  });

  return {
    readGlobalScopeFilter: () => context.getScope(),
    readScopeMeta: () => context.getScope(),
    usesInPageStorePicker: () => context.getScope().usesInPageStorePicker,
    listScopedStoreOptions: () =>
      context.getScope().stores.map((store) => ({
        value: store.id,
        labelZh: store.labelZh,
        labelEn: store.labelEn,
      })),
    writeGlobalStoreFilter: (storeId: unknown) => context.setStoreScope(String(storeId ?? "")),
    rosterStoreMatchesGlobalScope: (store: unknown, scope = context.getScope()) => storeMatches(store, scope),
    filterRosterByGlobalScope: (list: unknown[], scope = context.getScope()) =>
      Array.isArray(list) ? list.filter((employee) => storeMatches((employee as { store?: unknown })?.store, scope)) : [],
    scopeFromStoreSelection: scopeFromSelection,
    canonicalRosterStoreDisplayName: (store: unknown) => String(store ?? "").trim(),
    isSuppressedRosterStoreAlias: () => false,
    resolveDefaultRosterStore: (stores: unknown[], fallback: unknown) => {
      if (!Array.isArray(stores) || stores.length === 0) return String(fallback ?? "");
      const scope = context.getScope();
      return stores.find((store) => storeMatches(store, scope)) ?? stores[0] ?? fallback ?? "";
    },
    bindGlobalScopeFilterListener: (callback: (scope: PayrollScopeSnapshot) => void) => {
      cleanups.add(context.subscribeScopeChange(callback));
      return context.getScope();
    },
  };
}

function buildRuntimeSource(): string {
  return [
    commonCode,
    ruleDataCode,
    "const ruleData = window.ruleData;",
    adpMappingCode,
    i18nCode,
    "const payrollT = (...args) => window.payrollT(...args);",
    "const getPayrollLocale = (...args) => window.getPayrollLocale(...args);",
    "const isPayrollEn = (...args) => window.isPayrollEn(...args);",
    "const getPayrollFieldHelp = (...args) => window.getPayrollFieldHelp(...args);",
    "const applyPayrollPageI18n = (...args) => window.applyPayrollPageI18n(...args);",
    "const initPayrollI18n = (...args) => window.initPayrollI18n(...args);",
    "const PAYROLL_ADP_MAPPING = window.PAYROLL_ADP_MAPPING;",
    detailExportCode,
    apiClientCode,
    "const PayrollApiClient = window.PayrollApiClient;",
    "const TipOutGlobalScopeFilter = window.TipOutGlobalScopeFilter;",
    payrollCode,
    "//# sourceURL=team-payroll-native-runtime.js",
  ].join("\n\n");
}

export function mountLegacyPayrollRuntime(
  shadowRoot: ShadowRoot,
  pageRoot: HTMLElement,
  context: PayrollPageContext,
): PayrollRuntimeHandle {
  const controller = new AbortController();
  const timers = new Set<number>();
  const cleanups = new Set<() => void>();
  const realWindow = window;
  const realDocument = document;

  const addScopedListener = (
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    const normalized = typeof options === "boolean" ? { capture: options } : { ...options };
    target.addEventListener(type, listener, { ...normalized, signal: controller.signal });
  };

  const documentTarget: LegacyGlobal = {
    body: pageRoot,
    head: shadowRoot,
    documentElement: pageRoot,
    defaultView: realWindow,
    readyState: "complete",
    createElement: realDocument.createElement.bind(realDocument),
    createTextNode: realDocument.createTextNode.bind(realDocument),
    getElementById: (id: string) => shadowRoot.getElementById(id),
    querySelector: shadowRoot.querySelector.bind(shadowRoot),
    querySelectorAll: shadowRoot.querySelectorAll.bind(shadowRoot),
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) =>
      addScopedListener(pageRoot, type, listener, options),
    removeEventListener: pageRoot.removeEventListener.bind(pageRoot),
  };

  const scopedDocument = new Proxy(documentTarget, {
    get(target, property) {
      if (property === "activeElement") return shadowRoot.activeElement ?? realDocument.activeElement;
      if (property in target) return target[property];
      const value = Reflect.get(realDocument as unknown as object, property, realDocument);
      return typeof value === "function" ? value.bind(realDocument) : value;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });

  const locationFacade = new Proxy(realWindow.location, {
    set(target, property, value) {
      if (property === "href" && /(?:^|\/)employees\.html(?:$|[?#])/.test(String(value))) {
        history.pushState({}, "", "/team/employees");
        realWindow.dispatchEvent(new PopStateEvent("popstate"));
        return true;
      }
      return Reflect.set(target, property, value);
    },
  });

  const globalTarget: LegacyGlobal = {
    document: scopedDocument,
    location: locationFacade,
    parent: null,
    top: null,
    self: null,
    TipOutGlobalScopeFilter: createScopeAdapter(context, cleanups),
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) =>
      addScopedListener(realWindow, type, listener, options),
    removeEventListener: realWindow.removeEventListener.bind(realWindow),
    dispatchEvent: realWindow.dispatchEvent.bind(realWindow),
    setTimeout: (handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = realWindow.setTimeout(() => {
        timers.delete(id);
        if (typeof handler === "function") handler(...args);
        else realWindow.eval(handler);
      }, timeout);
      timers.add(id);
      return id;
    },
    clearTimeout: (id: number) => {
      timers.delete(id);
      realWindow.clearTimeout(id);
    },
  };

  const scopedWindow = new Proxy(globalTarget, {
    get(target, property) {
      if (property in target) return target[property];
      const value = Reflect.get(realWindow as unknown as object, property, realWindow);
      return typeof value === "function" ? value.bind(realWindow) : value;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
  globalTarget.parent = scopedWindow;
  globalTarget.top = scopedWindow;
  globalTarget.self = scopedWindow;

  const execute = new Function(
    "window",
    "document",
    "global",
    "globalThis",
    "self",
    buildRuntimeSource(),
  );
  execute(scopedWindow, scopedDocument, scopedWindow, scopedWindow, scopedWindow);

  return {
    destroy() {
      controller.abort();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
      timers.forEach((id) => realWindow.clearTimeout(id));
      timers.clear();
    },
  };
}
