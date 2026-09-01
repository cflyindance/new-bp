import Big from 'big.js';

// 根据折后比例计算参与 CRM 活动的商品价格
export function countActualPrice(price, rewardDiscountRate, isNeedDiscount) {
  const originPrice = Number(price ?? 0);
  if (!Number.isFinite(originPrice)) return 0;
  if (!isNeedDiscount) return originPrice;

  const discountRate = Number(rewardDiscountRate);
  if (!Number.isFinite(discountRate)) return originPrice;

  return Number(Big(originPrice).times(Big(discountRate)).toFixed(8)) || 0;
}

// 根据实际折扣金额和可参与金额重新计算折后比例
export function reCountDiscountRate(
  orderItems,
  notEligibleId,
  actualDiscount,
  onInvalid
) {
  const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
  const safeNotEligibleId = Array.isArray(notEligibleId) ? notEligibleId : [];
  const safeActualDiscount = Number(actualDiscount ?? 0);
  const eligiblePrice = safeOrderItems
    .filter(
      (orderItem) => orderItem && !safeNotEligibleId.includes(orderItem.id)
    )
    .reduce((pre, cur) => {
      const itemPrice = Number(cur.orderItemPrice ?? 0);
      const quantity = Number(cur.quantity ?? 0);
      if (!Number.isFinite(itemPrice) || !Number.isFinite(quantity)) {
        return pre;
      }
      return Big(pre).plus(Big(itemPrice).times(quantity).toFixed(2));
    }, 0);

  if (Big(eligiblePrice).eq(0)) {
    if (typeof onInvalid === 'function') onInvalid();
    return 1;
  }

  return Number(
    Big(1)
      .minus(
        Big(Number.isFinite(safeActualDiscount) ? safeActualDiscount : 0).div(
          Big(eligiblePrice)
        )
      )
      .toFixed(12)
  );
}
