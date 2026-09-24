import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { generateDemoScenario } from "../src/demo-scenario/demo-scenario-generator";
import { validateDemoScenario } from "../src/demo-scenario/demo-scenario-validation";
import { listDemoStoreProducts } from "../src/demo-scenario/adapters/product-demo-adapter";
import { listDemoOrders } from "../src/demo-scenario/adapters/order-demo-adapter";
import { listDemoEmployees, listDemoPayroll } from "../src/demo-scenario/adapters/team-demo-adapter";
import { listDemoCampaignPerformance } from "../src/demo-scenario/adapters/marketing-demo-adapter";
import { summarizeDemoFinance } from "../src/demo-scenario/adapters/finance-demo-adapter";

const snapshot = { merchants: [{ merchantId: "brand-a", groupId: "group", name: "火锅品牌", timezone: "Asia/Shanghai" }, { merchantId: "brand-b", groupId: "group", name: "串串品牌", timezone: "Asia/Shanghai" }], stores: [{ storeId: "a1", merchantId: "brand-a", name: "A一店", status: "open" }, { storeId: "a2", merchantId: "brand-a", name: "A二店", status: "open" }, { storeId: "b1", merchantId: "brand-b", name: "B一店", status: "open" }, { storeId: "b2", merchantId: "brand-b", name: "B二店", status: "open" }] } as unknown as EnterpriseMerchantSnapshot;
const input = { snapshot, scenarioId: "acceptance", scenarioVersion: 1, anchorDate: "2026-09-24" as const };
const scenario = generateDemoScenario(input);
if (JSON.stringify(scenario) !== JSON.stringify(generateDemoScenario(input))) throw new Error("deterministic regeneration failed");
if (validateDemoScenario(scenario).length) throw new Error("integrity validation failed");
for (const storeId of scenario.scopeIndex.storeIds) {
  const store = scenario.storeProfiles[storeId];
  const scope = { groupId: store.groupId, brandIds: [store.brandId], storeIds: [storeId] };
  if (!listDemoStoreProducts(scenario, scope).length || !listDemoOrders(scenario, scope).length || !listDemoEmployees(scenario, scope).length || !listDemoPayroll(scenario, scope).length) throw new Error(`empty domain for ${storeId}`);
  listDemoCampaignPerformance(scenario, scope);
  summarizeDemoFinance(scenario, scope);
}
for (const brandId of scenario.scopeIndex.brandIds) {
  const storeIds = Object.values(scenario.storeProfiles).filter((store) => store.brandId === brandId).map((store) => store.storeId);
  const brandNet = summarizeDemoFinance(scenario, { brandIds: [brandId], storeIds }).netMinor;
  const storeNet = storeIds.reduce((sum, storeId) => sum + summarizeDemoFinance(scenario, { brandIds: [brandId], storeIds: [storeId] }).netMinor, 0);
  if (brandNet !== storeNet) throw new Error(`brand rollup failed for ${brandId}`);
}
console.log("unified demo scenario acceptance: ok");
