/**
 * 订单列表金额口径（设计方案 v1.1 §3）
 * Total Due 不含小费；未结账实收固定 0；已结账实收 = 应收 + 卡小费 + 现金小费。
 */

export type OrderAmountInput = {
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  cardTip: number;
  cashTip: number;
  /** true = 已结账/已收款；false = 未结账 */
  settled: boolean;
};

export function calcTotalDue(
  input: Pick<OrderAmountInput, "subtotal" | "discount" | "tax" | "serviceCharge">,
): number {
  return input.subtotal - input.discount + input.tax + input.serviceCharge;
}

export function calcTotalCollected(
  input: Pick<
    OrderAmountInput,
    "subtotal" | "discount" | "tax" | "serviceCharge" | "cardTip" | "cashTip" | "settled"
  >,
): number {
  if (!input.settled) return 0;
  return calcTotalDue(input) + input.cardTip + input.cashTip;
}

export function formatUsd(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `$${n.toFixed(2)}`;
}
