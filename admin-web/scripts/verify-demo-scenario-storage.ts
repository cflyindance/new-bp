import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { createDemoScenarioRepository } from "../src/demo-scenario/demo-scenario-repository";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

const snapshot = { merchants: [{ merchantId: "brand-a", groupId: "group-a", name: "测试品牌", timezone: "Asia/Shanghai" }], stores: [{ storeId: "store-a", merchantId: "brand-a", name: "测试门店", status: "open" }] } as unknown as EnterpriseMerchantSnapshot;
const storage = new MemoryStorage();
storage.setItem("tipout-payroll-state-v4", "old");
storage.setItem("menusifu-admin-auth:v1", "1");
let now = new Date(2026, 8, 24, 12);
const repoV1 = createDemoScenarioRepository({ storage, getSnapshot: () => snapshot, now: () => now, scenarioId: "test", scenarioVersion: 1 });
repoV1.ensureDemoScenario();
if (storage.getItem("tipout-payroll-state-v4") !== null || storage.getItem("menusifu-admin-auth:v1") !== "1") throw new Error("reset boundary is unsafe");
repoV1.applyRuntimeOverride({ overrideId: "stable", kind: "product", entityId: "p1", patch: { enabled: false } });
repoV1.applyRuntimeOverride({ overrideId: "expired", kind: "order", entityId: "o1", businessDate: "2026-08-26", patch: { note: "old" } });
repoV1.applyRuntimeOverride({ overrideId: "active", kind: "order", entityId: "o2", businessDate: "2026-09-01", patch: { note: "keep" } });
now = new Date(2026, 8, 25, 12);
repoV1.ensureDemoScenario();
const ids = repoV1.readRuntimeOverrides().map((item) => item.overrideId).sort();
if (ids.join() !== "active,stable") throw new Error(`unexpected rolling overrides: ${ids.join()}`);
const repoV2 = createDemoScenarioRepository({ storage, getSnapshot: () => snapshot, now: () => now, scenarioId: "test", scenarioVersion: 2 });
repoV2.ensureDemoScenario();
if (repoV2.readRuntimeOverrides().length || storage.getItem("menusifu-admin-auth:v1") !== "1") throw new Error("version reset failed");
console.log("demo scenario storage: ok");
