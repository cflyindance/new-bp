import { stableDemoId } from "./demo-scenario-random";
import type { DemoFinanceEntry, DemoOrder, DemoPayrollEntry } from "./demo-scenario-types";

export function generateFinanceEntries(
  orders: Record<string, DemoOrder>,
  payroll: Record<string, DemoPayrollEntry>,
): Record<string, DemoFinanceEntry> {
  const entries: Record<string, DemoFinanceEntry> = {};
  for (const order of Object.values(orders)) {
    const values: Array<[DemoFinanceEntry["kind"], number]> = [
      ["sale", order.subtotalMinor], ["discount", -order.discountMinor], ["tax", order.taxMinor], ["tip", order.tipMinor], ["refund", -order.refundMinor],
    ];
    values.forEach(([kind, amountMinor], index) => {
      const financeEntryId = stableDemoId("finance", order.orderId, index + 1);
      entries[financeEntryId] = { financeEntryId, storeId: order.storeId, brandId: order.brandId, businessDate: order.businessDate, kind, sourceId: order.orderId, amountMinor };
    });
  }
  for (const item of Object.values(payroll)) {
    const order = Object.values(orders).find((candidate) => candidate.storeId === item.storeId);
    if (!order) continue;
    const financeEntryId = stableDemoId("finance", item.payrollEntryId, 1);
    entries[financeEntryId] = { financeEntryId, storeId: item.storeId, brandId: order.brandId, businessDate: item.businessDate, kind: "payroll", sourceId: item.payrollEntryId, amountMinor: -item.grossPayMinor };
  }
  return entries;
}
