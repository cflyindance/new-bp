import { stableDemoId } from "./demo-scenario-random";
import type { DemoBrandTemplate, DemoCampaign, DemoStoreProfile, LocalBusinessDate } from "./demo-scenario-types";

export function generateCampaigns(
  templates: Record<string, DemoBrandTemplate>,
  stores: Record<string, DemoStoreProfile>,
  dates: LocalBusinessDate[],
): Record<string, DemoCampaign> {
  const campaigns: Record<string, DemoCampaign> = {};
  for (const template of Object.values(templates)) {
    const campaignId = template.campaignIds[0] ?? stableDemoId("campaign", template.brandId, "welcome");
    campaigns[campaignId] = {
      campaignId,
      brandId: template.brandId,
      storeIds: Object.values(stores).filter((store) => store.brandId === template.brandId).map((store) => store.storeId),
      name: `${template.name}会员日`,
      startsOn: dates[0],
      endsOn: dates[dates.length - 1],
      discountBasisPoints: 1000,
    };
  }
  return campaigns;
}
