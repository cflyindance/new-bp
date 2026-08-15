import { getStorageValue } from '@/utils/storage'

export const CRM_INTEGRATION_PRODUCT_LINE = 'EMENU'
export const CRM_INTEGRATION_MEMBER_SCOPE = 'ALL'

function toNumber(value, defaultValue = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : defaultValue
}

export function getCrmIntegrationOrderItemSizeId(item) {
  return item?.priceItem?.sizeId ?? item?.sizeId ?? null
}

export function getCrmIntegrationOrderItemUnitPrice(item) {
  return toNumber(item?.realPrice ?? item?.price)
}

export function getCrmIntegrationOrderItemQuantity(item) {
  return toNumber(item?.count ?? item?.quantity)
}

export function buildCrmIntegrationSdkDiscountList(selectedBenefit) {
  if (!selectedBenefit?.actualDiscount) return []

  return [
    {
      name: selectedBenefit.name,
      id:
        selectedBenefit.rawReward?.ruleId ||
        selectedBenefit.rawVoucher?.rewardRule?.ruleId,
      amount: selectedBenefit.actualDiscount,
      type: selectedBenefit.crmIntegrationRewardSource,
      extraInfo: {
        enableBenefit: true,
      },
    },
  ]
}

export function formatCrmIntegrationOrderStructure({
  allItems = [],
  selectedBenefit = null,
  memberInfo = null,
  orderType,
  paymentType,
  merchantId = getStorageValue('emenu_company')?.merchantId,
  orderContext = {},
} = {}) {
  const actualOrderType = orderType || orderContext.orderType || 'DINE_IN'
  const actualPaymentType = paymentType || orderContext.paymentType
  const actualMerchantId = merchantId || orderContext.merchantId
  const discounts = buildCrmIntegrationSdkDiscountList(selectedBenefit)

  const orderItems = (Array.isArray(allItems) ? allItems : [])
    .filter((item) => getCrmIntegrationOrderItemQuantity(item) > 0)
    .map((item) => {
      const quantity = getCrmIntegrationOrderItemQuantity(item)
      const unitPrice = getCrmIntegrationOrderItemUnitPrice(item)
      const itemDiscounts =
        Array.isArray(item.manualSelectRewardDiscount) &&
        item.manualSelectRewardDiscount.length
          ? item.manualSelectRewardDiscount
          : Array.isArray(item.discountList) && item.discountList.length
            ? item.discountList
            : discounts

      return {
        itemName: item.name || item.displayName || '',
        id: String(item.key),
        itemId: toNumber(item.id ?? item.saleItemId),
        merchantId: actualMerchantId,
        productLine: CRM_INTEGRATION_PRODUCT_LINE,
        categoryId:
          item.categoryId === undefined || item.categoryId === null
            ? null
            : String(item.categoryId),
        quantity,
        sizeId: getCrmIntegrationOrderItemSizeId(item),
        itemPrice: toNumber(item.price ?? unitPrice),
        itemTotalPrice: unitPrice,
        discounts: itemDiscounts,
      }
    })

  return {
    orderType: actualOrderType,
    paymentType: actualPaymentType,
    discounts,
    merchantId: actualMerchantId,
    orderItems,
    orderTime: new Date().toISOString(),
    channel: null,
    charges: Array.isArray(orderContext.charges) ? orderContext.charges : [],
    productLine: CRM_INTEGRATION_PRODUCT_LINE,
    member: {
      memberId: memberInfo?.id || memberInfo?.userId,
    },
    memberScope: CRM_INTEGRATION_MEMBER_SCOPE,
  }
}
