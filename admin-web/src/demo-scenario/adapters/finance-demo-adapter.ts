import type { DemoScenario, DemoScenarioScope } from "../demo-scenario-types";

export function listDemoFinanceEntries(scenario: DemoScenario, scope: DemoScenarioScope) {
  const stores = new Set(scope.storeIds);
  return Object.values(scenario.financeEntries).filter((item) => stores.has(item.storeId) && (!scope.fromDate || item.businessDate >= scope.fromDate) && (!scope.toDate || item.businessDate <= scope.toDate));
}

export function summarizeDemoFinance(scenario: DemoScenario, scope: DemoScenarioScope) {
  const values = { salesMinor: 0, discountsMinor: 0, taxMinor: 0, tipsMinor: 0, refundsMinor: 0, payrollMinor: 0, netMinor: 0 };
  for (const entry of listDemoFinanceEntries(scenario, scope)) {
    if (entry.kind === "sale") values.salesMinor += entry.amountMinor;
    if (entry.kind === "discount") values.discountsMinor += entry.amountMinor;
    if (entry.kind === "tax") values.taxMinor += entry.amountMinor;
    if (entry.kind === "tip") values.tipsMinor += entry.amountMinor;
    if (entry.kind === "refund") values.refundsMinor += entry.amountMinor;
    if (entry.kind === "payroll") values.payrollMinor += entry.amountMinor;
    values.netMinor += entry.amountMinor;
  }
  return values;
}
