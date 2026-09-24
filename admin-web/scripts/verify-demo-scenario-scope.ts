import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { generateDemoScenario } from "../src/demo-scenario/demo-scenario-generator";
import { resolveDemoScenarioScope } from "../src/demo-scenario/demo-scenario-scope";

const snapshot = { merchants: [{ merchantId: "brand-a", groupId: "g", name: "A", timezone: "Asia/Shanghai" }, { merchantId: "brand-b", groupId: "g", name: "B", timezone: "Asia/Shanghai" }], stores: [{ storeId: "a1", merchantId: "brand-a", name: "A1", status: "open" }, { storeId: "a2", merchantId: "brand-a", name: "A2", status: "open" }, { storeId: "b1", merchantId: "brand-b", name: "B1", status: "open" }] } as unknown as EnterpriseMerchantSnapshot;
const scenario = generateDemoScenario({ snapshot, scenarioId: "scope", scenarioVersion: 1, anchorDate: "2026-09-24" });
const access = { mode: "brands" as const, ids: ["brand-a"] };
const leaked = resolveDemoScenarioScope({ scenario, access, brandIds: ["brand-b"], storeIds: ["b1"] });
if (leaked.storeIds.length || leaked.brandIds.length) throw new Error("cross-brand data leaked");
const brand = resolveDemoScenarioScope({ scenario, access, brandIds: ["brand-a"] });
if (brand.storeIds.join() !== "a1,a2") throw new Error(`brand scope mismatch: ${brand.storeIds}`);
const single = resolveDemoScenarioScope({ scenario, access, brandIds: ["brand-a"], storeIds: ["a2"] });
if (single.storeIds.join() !== "a2") throw new Error("store scope mismatch");
console.log("demo scenario scope: ok");
