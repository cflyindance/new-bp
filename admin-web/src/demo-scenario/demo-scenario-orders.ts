import { createSeededRandom, seedFromParts, stableDemoId } from "./demo-scenario-random";
import type { DemoCampaign, DemoEmployee, DemoOrder, DemoPayment, DemoProduct, DemoRefund, DemoStoreProduct, DemoStoreProfile, LocalBusinessDate } from "./demo-scenario-types";

export function calculateOrderMoney(input: { subtotalMinor: number; discountMinor: number; taxMinor: number; tipMinor: number; refundMinor: number }): number {
  return input.subtotalMinor - input.discountMinor + input.taxMinor + input.tipMinor - input.refundMinor;
}

export function generateOrders(input: {
  scenarioVersion: number; dates: LocalBusinessDate[]; stores: Record<string, DemoStoreProfile>; products: Record<string, DemoProduct>;
  storeProducts: Record<string, DemoStoreProduct>; employees: Record<string, DemoEmployee>; campaigns: Record<string, DemoCampaign>;
}): { orders: Record<string, DemoOrder>; payments: Record<string, DemoPayment>; refunds: Record<string, DemoRefund> } {
  const orders: Record<string, DemoOrder> = {};
  const payments: Record<string, DemoPayment> = {};
  const refunds: Record<string, DemoRefund> = {};
  for (const store of Object.values(input.stores)) {
    const sellable = Object.values(input.storeProducts).filter((item) => item.storeId === store.storeId && item.enabled);
    const staff = Object.values(input.employees).filter((employee) => employee.authorizedStoreIds.includes(store.storeId));
    const campaign = Object.values(input.campaigns).find((item) => item.brandId === store.brandId && item.storeIds.includes(store.storeId));
    for (const date of input.dates) {
      const count = Math.max(1, Math.round(3 * store.volumeFactor));
      for (let index = 0; index < count; index += 1) {
        const random = createSeededRandom(seedFromParts(input.scenarioVersion, date, store.storeId, "orders", index));
        const selected = sellable[Math.floor(random() * sellable.length)];
        const product = input.products[selected.productId];
        const quantity = 1 + Math.floor(random() * 3);
        const subtotalMinor = Math.round(selected.priceMinor * quantity * store.averageTicketFactor);
        const useCampaign = Boolean(campaign && random() < 0.35);
        const discountMinor = useCampaign ? Math.round(subtotalMinor * campaign!.discountBasisPoints / 10000) : 0;
        const taxMinor = Math.round((subtotalMinor - discountMinor) * product.taxRateBasisPoints / 10000);
        const tipMinor = Math.round((subtotalMinor - discountMinor) * (random() < 0.65 ? 0.12 : 0));
        const refundMinor = random() < 0.04 ? Math.round(subtotalMinor * 0.5) : 0;
        const orderId = stableDemoId("order", store.storeId, date, index + 1);
        const employee = staff[index % staff.length];
        const payableMinor = calculateOrderMoney({ subtotalMinor, discountMinor, taxMinor, tipMinor, refundMinor });
        orders[orderId] = { orderId, businessDate: date, placedAt: `${date}T${String(11 + index * 3).padStart(2, "0")}:15:00`, groupId: store.groupId, brandId: store.brandId, storeId: store.storeId, employeeId: employee.employeeId, campaignId: useCampaign ? campaign?.campaignId : undefined, items: [{ orderItemId: `${orderId}-item-1`, productId: product.productId, productName: product.name, quantity, unitPriceMinor: selected.priceMinor, lineTotalMinor: subtotalMinor }], subtotalMinor, discountMinor, taxMinor, tipMinor, refundMinor, payableMinor };
        const paymentId = stableDemoId("payment", orderId, 1);
        payments[paymentId] = { paymentId, orderId, storeId: store.storeId, businessDate: date, method: random() < 0.25 ? "cash" : "card", amountMinor: payableMinor, status: refundMinor ? "refunded" : "captured" };
        if (refundMinor) {
          const refundId = stableDemoId("refund", orderId, 1);
          refunds[refundId] = { refundId, orderId, paymentId, storeId: store.storeId, businessDate: date, amountMinor: refundMinor };
        }
      }
    }
  }
  return { orders, payments, refunds };
}
