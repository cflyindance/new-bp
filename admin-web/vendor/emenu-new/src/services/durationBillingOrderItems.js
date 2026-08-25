export function flattenDurationBillingOrderItems(order) {
  const nested = (order?.subOrders ?? []).flatMap(
    (subOrder) => subOrder?.orderItems ?? []
  )
  const topLevel = Array.isArray(order?.orderItems) ? order.orderItems : []
  return [...nested, ...topLevel]
}

function isActiveOrderItem(item) {
  return Boolean(item) && !item.voided && !item.deleted && Number(item.quantity ?? 1) > 0
}

export function resolveDurationBillingProductId(session) {
  return (
    session?.productSnapshot?.productId ??
    session?.productSnapshot?.id ??
    session?.ruleSnapshot?.productBinding?.productId ??
    null
  )
}

export function resolveDurationBillingOrderItem({
  order,
  orderItemId,
  productId,
}) {
  const items = flattenDurationBillingOrderItems(order)
  const exact = items.find(
    (item) => isActiveOrderItem(item) && String(item?.id) === String(orderItemId)
  )
  if (exact) return exact
  if (productId === null || productId === undefined || productId === '') return null
  const productMatches = items.filter(
    (item) =>
      isActiveOrderItem(item) &&
      String(item?.saleItemId) === String(productId)
  )
  return productMatches.length === 1 ? productMatches[0] : null
}
