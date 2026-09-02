import assert from "node:assert/strict";
import { createPayrollRepository } from "../src/team/payroll/payroll-api";
import { createPayrollPageContext } from "../src/team/payroll/payroll-context";
import type { PayrollSnapshot } from "../src/team/payroll/payroll-types";

const snapshot: PayrollSnapshot = {
  view: "workspace",
  periodId: "p1",
  employeeId: "e1",
  employeeStoreFilter: "Golden Dragon",
  data: {
    periods: [{ id: "p1" }],
    employees: { p1: [{ id: "e1", name: "Bowen one", store: "Golden Dragon", segments: [], adjustments: {} }] },
    auditLog: [],
  },
};

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

const apiRequests: Array<{ url: string; method: string }> = [];
const apiFetch: typeof fetch = async (input, init) => {
  apiRequests.push({ url: String(input), method: init?.method ?? "GET" });
  return new Response(JSON.stringify(snapshot), { status: 200, headers: { "Content-Type": "application/json" } });
};
const apiRepository = createPayrollRepository({ fetch: apiFetch, storage: memoryStorage(), defaultSnapshot: snapshot });
assert.equal((await apiRepository.load()).source, "api");
await apiRepository.save(snapshot);
assert.equal(apiRequests.at(-1)?.method, "PUT");

const localRepository = createPayrollRepository({
  fetch: async () => {
    throw new Error("offline");
  },
  storage: memoryStorage({ "tipout-payroll-state-v4": JSON.stringify(snapshot) }),
  defaultSnapshot: snapshot,
});
assert.equal((await localRepository.load()).source, "local");

const defaultRepository = createPayrollRepository({
  fetch: async () => {
    throw new Error("offline");
  },
  storage: memoryStorage(),
  defaultSnapshot: snapshot,
});
assert.equal((await defaultRepository.load()).source, "default");

const events = new EventTarget();
let currentScope = { brand: "brand-1", region: "region-1", store: "" };
let locale: "zh" | "en" = "zh";
const context = createPayrollPageContext({
  readScope: () => currentScope,
  writeScope: (next) => {
    currentScope = next;
  },
  listScopeOptions: () => ({
    stores: [{ value: "store-1", labelZh: "金龙餐厅", labelEn: "Golden Dragon" }],
  }),
  events,
  getLocale: () => locale,
});

let scopeNotifications = 0;
const unsubscribeScope = context.subscribeScopeChange(() => {
  scopeNotifications += 1;
});
events.dispatchEvent(new Event("menusifu:scope-filter-change"));
assert.equal(scopeNotifications, 1);
unsubscribeScope();
events.dispatchEvent(new Event("menusifu:scope-filter-change"));
assert.equal(scopeNotifications, 1);

context.setStoreScope("store-1");
assert.deepEqual(currentScope, { brand: "brand-1", region: "region-1", store: "store-1" });
assert.equal(context.getScope().storeLabel, "金龙餐厅");

let localeNotifications = 0;
const unsubscribeLocale = context.subscribeLocaleChange(() => {
  localeNotifications += 1;
});
locale = "en";
events.dispatchEvent(new Event("menusifu:ui-locale-change"));
assert.equal(localeNotifications, 1);
unsubscribeLocale();

console.log("Team Payroll adapter verification passed.");
