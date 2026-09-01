export function getDiscountedUnitPrice(item, discounts = item?.discountList) {
  const discountList = Array.isArray(discounts) ? discounts : []
  if (!discountList.length || !item?.count) return null

  const hasFreeItemDiscount = discountList.some(
    (discount) => discount?.isReward && Number(discount?.amount || 0) === 0
  )
  if (hasFreeItemDiscount) {
    if (item.freeItemOriginalPrice !== undefined) {
      return Number(item.realPrice ?? item.price ?? 0)
    }
    return 0
  }

  const discountAmount = discountList.reduce((total, discount) => {
    return total + Number(discount?.amount || 0)
  }, 0)
  if (!discountAmount) return null

  const unitPrice = Number(item.realPrice ?? item.price ?? 0)
  const itemTotal = unitPrice * item.count
  const discountedUnitPrice = Math.max(
    0,
    (itemTotal - discountAmount) / item.count
  )

  return discountedUnitPrice < unitPrice ? discountedUnitPrice : null
}
