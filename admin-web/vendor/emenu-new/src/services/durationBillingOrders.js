import { fetchOrder, generateOrder, saveOrder } from '@/services/orders'
import { parseEmenuKioskExtendedInfo } from '@/utils/durationBilling'

function flattenOrderItems(order) {
  return (order?.subOrders ?? []).flatMap((subOrder) => subOrder?.orderItems ?? [])
}

function createZeroPriceProduct(product) {
  return {
    ...product,
    count: 1,
    price: 0,
    realPrice: 0,
    realMenuItemPrice: 0,
    priceItem: product?.priceItem
      ? { ...product.priceItem, price: 0 }
      : undefined,
  }
}

export async function createDurationBillingOrderItem({
  ruleId,
  productId,
  productSnapshot,
  pricingSummary,
  sessionId,
  previousOrder,
  userId,
}) {
  if (!productSnapshot || String(productSnapshot.id) !== String(productId)) {
    return null
  }
  const existingItemIds = new Set(
    (previousOrder?.cart ?? []).map((item) => String(item?.key ?? item?.id))
  )
  const order = generateOrder({
    order: {
      cart: [createZeroPriceProduct(productSnapshot)],
      totalPrice: 0,
      taxes: [],
      durationBillingPending: { sessionId, ruleId, productId, pricingSummary },
    },
    prevOrder: previousOrder,
    userId,
  })
  const result = await saveOrder({ order })
  const matchingItems = flattenOrderItems(result?.order).filter(
    (item) => String(item?.saleItemId) === String(productId)
  )
  const orderItem =
    matchingItems.find((item) => !existingItemIds.has(String(item?.id))) ??
    matchingItems[matchingItems.length - 1]
  return orderItem ? { ...result, orderItem } : null
}

export async function updateDurationBillingOrderItemPrice({
  orderId,
  orderItemId,
  sessionId,
  finalAmount,
  authorizedBy,
}) {
  const fetched = await fetchOrder({ params: { orderId } })
  const order = fetched?.order
  const orderItem = flattenOrderItems(order).find(
    (item) => String(item?.id) === String(orderItemId)
  )
  if (!order || !orderItem || orderItem?.voided || orderItem?.deleted) return null

  const quantity = Number(orderItem.quantity) || 1
  const previousAmount = (Number(orderItem.price) || 0) * quantity
  const nextAmount = Number(finalAmount) * quantity
  orderItem.price = Number(finalAmount)
  orderItem.originalSalePrice = Number(finalAmount)
  orderItem.totalPrice = nextAmount
  order.totalPrice = Math.max(
    0,
    Number(order.totalPrice || 0) - previousAmount + nextAmount
  )

  const extra = parseEmenuKioskExtendedInfo(order.emenuKioskextendedInfo)
  order.emenuKioskextendedInfo = JSON.stringify({
    ...extra,
    durationBillingPending: null,
    durationBillingFinish: {
      sessionId,
      orderItemId,
      finalAmount: Number(finalAmount),
      authorizedBy: authorizedBy ?? null,
    },
  })
  return saveOrder({ order })
}
