import type { DemoScenario, DemoScenarioScope } from "../demo-scenario-types";

export function listDemoCampaignPerformance(scenario: DemoScenario, scope: DemoScenarioScope) {
  const stores = new Set(scope.storeIds);
  return Object.values(scenario.campaigns).filter((campaign) => campaign.storeIds.some((id) => stores.has(id))).map((campaign) => {
    const orders = Object.values(scenario.orders).filter((order) => order.campaignId === campaign.campaignId && stores.has(order.storeId));
    return { ...campaign, redeemedOrderCount: orders.length, discountCostMinor: orders.reduce((sum, order) => sum + order.discountMinor, 0), attributedRevenueMinor: orders.reduce((sum, order) => sum + order.payableMinor, 0) };
  });
}
