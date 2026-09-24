import type { EnterpriseMerchantSnapshot } from "../config/enterprise-merchant-types";
import { buildDemoScenarioCatalog } from "./demo-scenario-catalog";
import { buildBusinessDateWindow } from "./demo-scenario-date";
import { generateFinanceEntries } from "./demo-scenario-finance";
import { generateCampaigns } from "./demo-scenario-marketing";
import { generateOrders } from "./demo-scenario-orders";
import { resolveStoreCatalog } from "./demo-scenario-products";
import { generatePayrollEntries, generateTeamBase } from "./demo-scenario-team";
import type { DemoScenario, DemoStoreProduct, LocalBusinessDate } from "./demo-scenario-types";

export interface GenerateDemoScenarioInput {
  snapshot: EnterpriseMerchantSnapshot;
  scenarioId: string;
  scenarioVersion: number;
  anchorDate: LocalBusinessDate;
}

export function generateDemoScenario(input: GenerateDemoScenarioInput): DemoScenario {
  const catalog = buildDemoScenarioCatalog(input.snapshot);
  const dates = buildBusinessDateWindow(input.anchorDate, 30);
  const storeProducts: Record<string, DemoStoreProduct> = {};
  for (const profile of Object.values(catalog.storeProfiles)) {
    for (const item of resolveStoreCatalog(catalog.brandTemplates[profile.brandId], profile)) {
      storeProducts[item.storeProductId] = item;
    }
  }
  const team = generateTeamBase(Object.values(catalog.storeProfiles), dates, input.scenarioVersion);
  const campaigns = generateCampaigns(catalog.brandTemplates, catalog.storeProfiles, dates);
  const commerce = generateOrders({ scenarioVersion: input.scenarioVersion, dates, stores: catalog.storeProfiles, products: catalog.products, storeProducts, employees: team.employees, campaigns });
  const payrollEntries = generatePayrollEntries(team.employees, team.attendance, commerce.orders);
  const financeEntries = generateFinanceEntries(commerce.orders, payrollEntries);
  return {
    metadata: { scenarioId: input.scenarioId, scenarioVersion: input.scenarioVersion, anchorDate: input.anchorDate, generatedAt: `${input.anchorDate}T00:00:00.000Z` },
    scopeIndex: {
      groupIds: [...new Set(Object.values(catalog.storeProfiles).map((store) => store.groupId))].sort(),
      brandIds: Object.keys(catalog.brandTemplates).sort(),
      storeIds: Object.keys(catalog.storeProfiles).sort(),
    },
    brandTemplates: catalog.brandTemplates, storeProfiles: catalog.storeProfiles, products: catalog.products, storeProducts,
    employees: team.employees, shifts: team.shifts, attendance: team.attendance, campaigns,
    orders: commerce.orders, payments: commerce.payments, refunds: commerce.refunds, payrollEntries, financeEntries,
  };
}
