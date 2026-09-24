import type { DemoOrder, DemoPayment, DemoRefund, DemoScenario, DemoScenarioScope } from "../demo-scenario-types";

export interface DemoOrderView extends DemoOrder { payments: DemoPayment[]; refunds: DemoRefund[]; storeName: string; employeeName: string }

function toView(scenario: DemoScenario, order: DemoOrder): DemoOrderView {
  return { ...order, storeName: scenario.storeProfiles[order.storeId].name, employeeName: scenario.employees[order.employeeId].name, payments: Object.values(scenario.payments).filter((item) => item.orderId === order.orderId), refunds: Object.values(scenario.refunds).filter((item) => item.orderId === order.orderId) };
}

export function listDemoOrders(scenario: DemoScenario, scope: DemoScenarioScope): DemoOrderView[] {
  const stores = new Set(scope.storeIds);
  return Object.values(scenario.orders).filter((order) => stores.has(order.storeId) && (!scope.fromDate || order.businessDate >= scope.fromDate) && (!scope.toDate || order.businessDate <= scope.toDate)).map((order) => toView(scenario, order)).sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export function readDemoOrder(scenario: DemoScenario, orderId: string, scope: DemoScenarioScope): DemoOrderView | null {
  const order = scenario.orders[orderId];
  return order && scope.storeIds.includes(order.storeId) ? toView(scenario, order) : null;
}
