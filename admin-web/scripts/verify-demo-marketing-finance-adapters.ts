import type { EnterpriseMerchantSnapshot } from "../src/config/enterprise-merchant-types";
import { generateDemoScenario } from "../src/demo-scenario/demo-scenario-generator";
import { listDemoCampaignPerformance } from "../src/demo-scenario/adapters/marketing-demo-adapter";
import { summarizeDemoFinance } from "../src/demo-scenario/adapters/finance-demo-adapter";

const snapshot = { merchants: [{ merchantId: "b", groupId: "g", name: "品牌", timezone: "Asia/Shanghai" }], stores: [{ storeId: "s", merchantId: "b", name: "门店", status: "open" }] } as unknown as EnterpriseMerchantSnapshot;
const scenario = generateDemoScenario({ snapshot, scenarioId: "money", scenarioVersion: 1, anchorDate: "2026-09-24" });
const scope = { groupId: "g", brandIds: ["b"], storeIds: ["s"] };
for (const campaign of listDemoCampaignPerformance(scenario, scope)) {
  const orders = Object.values(scenario.orders).filter((order) => order.campaignId === campaign.campaignId);
  if (campaign.redeemedOrderCount !== orders.length || campaign.discountCostMinor !== orders.reduce((sum, order) => sum + order.discountMinor, 0)) throw new Error("campaign reconciliation failed");
}
const summary = summarizeDemoFinance(scenario, scope);
const entries = Object.values(scenario.financeEntries);
if (summary.netMinor !== entries.reduce((sum, entry) => sum + entry.amountMinor, 0)) throw new Error("finance reconciliation failed");
console.log("demo marketing/finance adapters: ok");
