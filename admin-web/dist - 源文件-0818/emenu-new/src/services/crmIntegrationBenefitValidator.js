import crmIntegrationMarketSDK from '@/services/crmIntegrationMarketSDK'
import {
  isCrmIntegrationOrderDiscountBenefit,
  isCrmIntegrationSdkValidatedBenefit,
} from '@/utils/crmIntegrationRewards'

function getCalculatedOrder(rule) {
  return rule?.result?.[0]?.calculatedOrder || null
}

function normalizeSdkNumber(value) {
  if (value === undefined || value === null) return value
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const number = Number(value)
    return Number.isFinite(number) ? number : value
  }
  if (typeof value.toNumber === 'function') {
    const number = value.toNumber()
    return Number.isFinite(number) ? number : value
  }
  if (typeof value.toString === 'function') {
    const number = Number(value.toString())
    return Number.isFinite(number) ? number : value
  }
  return value
}

function normalizeCalculatedOrderSalePrice(calculatedOrder) {
  const orderItems = calculatedOrder?.orderItems
  if (!Array.isArray(orderItems)) return calculatedOrder

  let hasChanged = false
  const normalizedOrderItems = orderItems.map((orderItem) => {
    if (!orderItem?.extra || !('salePrice' in orderItem.extra)) {
      return orderItem
    }

    const salePrice = normalizeSdkNumber(orderItem.extra.salePrice)
    if (salePrice === orderItem.extra.salePrice) return orderItem

    hasChanged = true
    return {
      ...orderItem,
      extra: {
        ...orderItem.extra,
        salePrice,
      },
    }
  })

  if (!hasChanged) return calculatedOrder

  return {
    ...calculatedOrder,
    orderItems: normalizedOrderItems,
  }
}

function normalizeCrmIntegrationRule(rule) {
  if (!Array.isArray(rule?.result)) return rule

  let hasChanged = false
  const result = rule.result.map((item) => {
    const calculatedOrder = normalizeCalculatedOrderSalePrice(
      item?.calculatedOrder
    )
    if (calculatedOrder === item?.calculatedOrder) return item

    hasChanged = true
    return {
      ...item,
      calculatedOrder,
    }
  })

  return hasChanged ? { ...rule, result } : rule
}

function getActualDiscountFromRule(rule) {
  return Number(getCalculatedOrder(rule)?.discounts?.[0]?.amount || 0)
}

function hasCalculatedOrderDiscounts(rule) {
  const discounts = getCalculatedOrder(rule)?.discounts
  return Array.isArray(discounts) && discounts.length > 0
}

function getOrderDiscountInfoFromRule(rule) {
  const discounts = getCalculatedOrder(rule)?.discounts
  return Array.isArray(discounts) ? discounts : []
}

function normalizeLanguage(language) {
  return language?.includes?.('zh') ? 'zh-cn' : language || 'en'
}

export function getCrmIntegrationSelectedBenefitCoupon(selectedBenefit) {
  if (selectedBenefit?.crmIntegrationVoucher) {
    const voucherCoupon = selectedBenefit?.rawVoucher?.rewardRule
    if (!voucherCoupon) {
      throw new Error('Missing CRM integration selected benefit coupon')
    }
    return voucherCoupon
  }

  const rewardCoupon = selectedBenefit?.rawReward
  if (!rewardCoupon) {
    throw new Error('Missing CRM integration selected benefit coupon')
  }
  return rewardCoupon
}

export async function validateCrmIntegrationSelectedBenefit({
  selectedBenefit,
  metaData,
  allItems,
  memberInfo,
  includeSelectedDiscount = false,
}) {
  const isSupported = isCrmIntegrationSdkValidatedBenefit(selectedBenefit)
  if (!isSupported) {
    return {
      isSupported,
      isValid: false,
      rule: null,
      formattedOrder: null,
      calculatedOrder: null,
      orderDiscountInfo: [],
      invalidReason: [],
      actualDiscount: 0,
    }
  }

  const coupon = getCrmIntegrationSelectedBenefitCoupon(selectedBenefit)
  const couponPlugin = await crmIntegrationMarketSDK.getCouponPlugin({
    coupons: [coupon],
    metas: metaData,
    allItems,
    selectedBenefit: includeSelectedDiscount ? selectedBenefit : null,
    memberInfo,
  })
  const response = await couponPlugin.MarketGetOrderCoupons()

  const rule = normalizeCrmIntegrationRule(response?.data?.[0] || null)
  const calculatedOrder = getCalculatedOrder(rule)
  const hasCalculatedDiscounts = isCrmIntegrationOrderDiscountBenefit(
    selectedBenefit
  )
    ? hasCalculatedOrderDiscounts(rule)
    : calculatedOrder?.orderItems?.some(
        (orderItem) =>
          Array.isArray(orderItem?.discounts) && orderItem.discounts.length > 0
      )

  return {
    isSupported,
    isValid: !!rule?.isValid && hasCalculatedDiscounts,
    rule,
    formattedOrder: response?.formattedOrder,
    calculatedOrder,
    orderDiscountInfo: getOrderDiscountInfoFromRule(rule),
    invalidReason: rule?.invalidReason || [],
    actualDiscount: getActualDiscountFromRule(rule),
  }
}

export function mergeCrmIntegrationValidationResultToBenefit(
  selectedBenefit,
  validationResult
) {
  return {
    ...selectedBenefit,
    isValid: validationResult.isValid,
    actualDiscount: validationResult.actualDiscount,
  }
}

export function formatCrmIntegrationInvalidReason(invalidReason, language) {
  if (!Array.isArray(invalidReason) || !invalidReason.length) return ''

  const actualLanguage = normalizeLanguage(language)
  return invalidReason
    .map((reason, index) => {
      const message = reason?.[actualLanguage] || reason?.en || ''
      if (!message) return ''
      return invalidReason.length > 1 ? `${index + 1}: ${message}` : message
    })
    .filter(Boolean)
    .join(' ')
}
