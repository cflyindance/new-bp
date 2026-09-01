import { CRM_INTEGRATION_REWARD_KIND } from '@/utils/crmIntegrationRewards'

export function getCrmIntegrationCalculatedOrder(validationResult) {
  return (
    validationResult?.calculatedOrder ||
    validationResult?.rule?.result?.[0]?.calculatedOrder ||
    null
  )
}

export function buildCrmIntegrationBenefitValidation(validationResult) {
  const calculatedOrder = getCrmIntegrationCalculatedOrder(validationResult)
  const orderDiscountInfo = Array.isArray(calculatedOrder?.discounts)
    ? calculatedOrder.discounts
    : []
  const orderItems = Array.isArray(calculatedOrder?.orderItems)
    ? calculatedOrder.orderItems
    : []

  const discountedItemInfoByKey = orderItems.reduce((result, orderItem) => {
    const discounts = Array.isArray(orderItem?.discounts)
      ? orderItem.discounts
      : []
    if (!orderItem?.id || !discounts.length) return result

    result[String(orderItem.id)] = {
      orderItem,
      discounts,
    }
    return result
  }, {})

  return {
    result: validationResult,
    orderDiscountInfo,
    discountedItemInfoByKey,
  }
}

export function getApplicableCrmIntegrationDiscountOrderReward({
  discountOrderReward,
  cart,
}) {
  if (
    !discountOrderReward?.crmIntegrationBenefit ||
    discountOrderReward.crmIntegrationRewardKind !==
      CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  ) {
    return discountOrderReward
  }

  const discountedItemKeys = Object.keys(
    discountOrderReward.discountedItemInfoByKey || {}
  )
  if (!discountedItemKeys.length || !Array.isArray(cart)) return null

  const cartItemKeys = new Set(
    cart.filter((item) => item?.key != null).map((item) => String(item.key))
  )

  return discountedItemKeys.some((key) => cartItemKeys.has(String(key)))
    ? discountOrderReward
    : null
}
