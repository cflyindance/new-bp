import commonCode from "./legacy/common.js.txt?raw";
import globalScopeCode from "./legacy/global-scope-filter.js.txt?raw";
import ruleDataCode from "./legacy/ruleData.js.txt?raw";
import fieldHelpCode from "./legacy/employees-field-help.js.txt?raw";
import employeesCode from "./legacy/employees.js.txt?raw";
import type { EmployeesPageContext, EmployeesScopeSnapshot } from "./employees-context";

export interface EmployeesRuntimeHandle {
  destroy(): void;
}

export class EmployeesRuntimeInitializationError extends Error {
  constructor(cause: unknown) {
    super("Native employees runtime failed to initialize.", { cause });
    this.name = "EmployeesRuntimeInitializationError";
  }
}

type LegacyGlobal = Record<PropertyKey, unknown>;

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function createScopeAdapter(context: EmployeesPageContext, cleanups: Set<() => void>) {
  const matches = (store: unknown, scope: EmployeesScopeSnapshot): boolean => {
    if (scope.isAllStores) return true;
    const employeeStore = normalize(store);
    return [scope.storeId, scope.storeLabel, scope.storeLabelEn]
      .map(normalize)
      .filter(Boolean)
      .some((candidate) => employeeStore === candidate || employeeStore.includes(candidate) || candidate.includes(employeeStore));
  };

  return {
    readGlobalScopeFilter: () => context.getScope(),
    readScopeMeta: () => context.getScope(),
    usesInPageStorePicker: () => context.getScope().usesInPageStorePicker,
    listScopedStoreOptions: () => context.getScope().stores.map((store) => ({ value: store.id, labelZh: store.labelZh, labelEn: store.labelEn })),
    writeGlobalStoreFilter: (storeId: unknown) => context.setStoreScope(String(storeId ?? "")),
    rosterStoreMatchesGlobalScope: (store: unknown, scope = context.getScope()) => matches(store, scope),
    filterRosterByGlobalScope: (list: unknown[], scope = context.getScope()) =>
      Array.isArray(list) ? list.filter((employee) => matches((employee as { store?: unknown })?.store, scope)) : [],
    scopeFromStoreSelection: (storeId: unknown, storeLabel: unknown) => ({
      ...context.getScope(),
      storeId: String(storeId ?? ""),
      storeLabel: String(storeLabel ?? ""),
      storeLabelEn: String(storeLabel ?? ""),
      isAllStores: !String(storeId ?? "").trim(),
    }),
    bindGlobalScopeFilterListener: (callback: (scope: EmployeesScopeSnapshot) => void) => {
      const cleanup = context.subscribeScopeChange(callback);
      cleanups.add(cleanup);
      return context.getScope();
    },
  };
}

function buildRuntimeSource(): string {
  return [
    commonCode,
    globalScopeCode,
    "window.TipOutGlobalScopeFilter = Object.assign(window.TipOutGlobalScopeFilter || {}, __scopeAdapter);",
    "const TipOutGlobalScopeFilter = window.TipOutGlobalScopeFilter;",
    ruleDataCode,
    "const ruleData = window.ruleData;",
    fieldHelpCode,
    employeesCode,
    "return { closeModal: typeof closeModal === 'function' ? closeModal : null };",
    "//# sourceURL=team-employees-native-runtime.js",
  ].join("\n\n");
}

export function mountLegacyEmployeesRuntime(
  shadowRoot: ShadowRoot,
  pageRoot: HTMLElement,
  context: EmployeesPageContext,
): EmployeesRuntimeHandle {
  const controller = new AbortController();
  const cleanups = new Set<() => void>();
  const timers = new Set<number>();
  const intervals = new Set<number>();
  const animationFrames = new Set<number>();
  const realWindow = window;
  const realDocument = document;

  const addScopedListener = (target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
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
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => addScopedListener(pageRoot, type, listener, options),
    removeEventListener: pageRoot.removeEventListener.bind(pageRoot),
  };
  const scopedDocument = new Proxy(documentTarget, {
    get(target, property) {
      if (property === "activeElement") return shadowRoot.activeElement ?? realDocument.activeElement;
      if (property in target) return target[property];
      const value = Reflect.get(realDocument as unknown as object, property, realDocument);
      return typeof value === "function" ? value.bind(realDocument) : value;
    },
    set(target, property, value) { target[property] = value; return true; },
  });

  const globalTarget: LegacyGlobal = {
    document: scopedDocument,
    parent: null,
    top: null,
    self: null,
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => addScopedListener(realWindow, type, listener, options),
    removeEventListener: realWindow.removeEventListener.bind(realWindow),
    dispatchEvent: realWindow.dispatchEvent.bind(realWindow),
    setTimeout: (handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = realWindow.setTimeout(() => { timers.delete(id); if (typeof handler === "function") handler(...args); else realWindow.eval(handler); }, timeout);
      timers.add(id);
      return id;
    },
    clearTimeout: (id: number) => { timers.delete(id); realWindow.clearTimeout(id); },
    setInterval: (handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = realWindow.setInterval(handler, timeout, ...args);
      intervals.add(id);
      return id;
    },
    clearInterval: (id: number) => { intervals.delete(id); realWindow.clearInterval(id); },
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = realWindow.requestAnimationFrame((time) => { animationFrames.delete(id); callback(time); });
      animationFrames.add(id);
      return id;
    },
    cancelAnimationFrame: (id: number) => { animationFrames.delete(id); realWindow.cancelAnimationFrame(id); },
  };
  const scopedWindow = new Proxy(globalTarget, {
    get(target, property) {
      if (property in target) return target[property];
      const value = Reflect.get(realWindow as unknown as object, property, realWindow);
      return typeof value === "function" ? value.bind(realWindow) : value;
    },
    set(target, property, value) { target[property] = value; return true; },
  });
  globalTarget.parent = scopedWindow;
  globalTarget.top = scopedWindow;
  globalTarget.self = scopedWindow;

  let closeEmployeeModal: (() => void) | null = null;
  try {
    const execute = new Function("window", "document", "global", "globalThis", "self", "__scopeAdapter", buildRuntimeSource());
    const api = execute(scopedWindow, scopedDocument, scopedWindow, scopedWindow, scopedWindow, createScopeAdapter(context, cleanups)) as { closeModal?: (id: string) => void };
    closeEmployeeModal = () => api.closeModal?.("addEmployeeModal");
    shadowRoot.querySelectorAll<HTMLElement>('[data-action="close-employee-modal"]').forEach((element) => {
      const handler = () => closeEmployeeModal?.();
      element.addEventListener("click", handler, { signal: controller.signal });
    });
  } catch (cause) {
    controller.abort();
    cleanups.forEach((cleanup) => cleanup());
    timers.forEach((id) => realWindow.clearTimeout(id));
    intervals.forEach((id) => realWindow.clearInterval(id));
    animationFrames.forEach((id) => realWindow.cancelAnimationFrame(id));
    throw new EmployeesRuntimeInitializationError(cause);
  }

  return {
    destroy() {
      closeEmployeeModal = null;
      controller.abort();
      cleanups.forEach((cleanup) => cleanup());
      cleanups.clear();
      timers.forEach((id) => realWindow.clearTimeout(id));
      timers.clear();
      intervals.forEach((id) => realWindow.clearInterval(id));
      intervals.clear();
      animationFrames.forEach((id) => realWindow.cancelAnimationFrame(id));
      animationFrames.clear();
      pageRoot.querySelectorAll(".show").forEach((element) => element.classList.remove("show"));
      pageRoot.style.overflow = "";
    },
  };
}
