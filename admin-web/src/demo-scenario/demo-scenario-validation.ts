import { calculateOrderMoney } from "./demo-scenario-orders";
import type { DemoScenario } from "./demo-scenario-types";

export type DemoScenarioValidationCode =
  | "UNKNOWN_STORE" | "UNKNOWN_EMPLOYEE" | "UNKNOWN_PRODUCT" | "CROSS_BRAND_PRODUCT"
  | "INVALID_CAMPAIGN" | "ORDER_MONEY_IMBALANCE" | "ORDER_PAYMENT_IMBALANCE"
  | "UNKNOWN_SHIFT" | "PAYROLL_EMPLOYEE_MISMATCH";

export interface DemoScenarioValidationIssue { code: DemoScenarioValidationCode; entityId: string; message: string }

export function validateDemoScenario(scenario: DemoScenario): DemoScenarioValidationIssue[] {
  const issues: DemoScenarioValidationIssue[] = [];
  const add = (code: DemoScenarioValidationCode, entityId: string, message: string) => issues.push({ code, entityId, message });
  for (const order of Object.values(scenario.orders)) {
    const store = scenario.storeProfiles[order.storeId];
    if (!store) add("UNKNOWN_STORE", order.orderId, `Unknown store ${order.storeId}`);
    const employee = scenario.employees[order.employeeId];
    if (!employee) add("UNKNOWN_EMPLOYEE", order.orderId, `Unknown employee ${order.employeeId}`);
    for (const item of order.items) {
      const product = scenario.products[item.productId];
      if (!product) add("UNKNOWN_PRODUCT", order.orderId, `Unknown product ${item.productId}`);
      else if (product.brandId !== order.brandId) add("CROSS_BRAND_PRODUCT", order.orderId, `Product ${item.productId} belongs to ${product.brandId}`);
    }
    if (order.campaignId) {
      const campaign = scenario.campaigns[order.campaignId];
      if (!campaign || campaign.brandId !== order.brandId || !campaign.storeIds.includes(order.storeId) || order.businessDate < campaign.startsOn || order.businessDate > campaign.endsOn) add("INVALID_CAMPAIGN", order.orderId, `Invalid campaign ${order.campaignId}`);
    }
    const expected = calculateOrderMoney(order);
    if (expected !== order.payableMinor) add("ORDER_MONEY_IMBALANCE", order.orderId, `${expected} !== ${order.payableMinor}`);
    const paid = Object.values(scenario.payments).filter((payment) => payment.orderId === order.orderId).reduce((sum, payment) => sum + payment.amountMinor, 0);
    if (paid !== order.payableMinor) add("ORDER_PAYMENT_IMBALANCE", order.orderId, `${paid} !== ${order.payableMinor}`);
  }
  for (const row of Object.values(scenario.attendance)) {
    if (!scenario.shifts[row.shiftId]) add("UNKNOWN_SHIFT", row.attendanceId, `Unknown shift ${row.shiftId}`);
  }
  for (const row of Object.values(scenario.payrollEntries)) {
    const employee = scenario.employees[row.employeeId];
    if (!employee || employee.storeId !== row.storeId) add("PAYROLL_EMPLOYEE_MISMATCH", row.payrollEntryId, `Invalid employee ${row.employeeId}`);
  }
  return issues.sort((a, b) => `${a.code}:${a.entityId}`.localeCompare(`${b.code}:${b.entityId}`));
}

export function assertValidDemoScenario(scenario: DemoScenario): void {
  const issues = validateDemoScenario(scenario);
  if (issues.length) throw new Error(issues.map((issue) => `${issue.code}[${issue.entityId}]: ${issue.message}`).join("\n"));
}
