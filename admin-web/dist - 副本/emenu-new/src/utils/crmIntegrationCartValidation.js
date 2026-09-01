import { nanoid } from 'nanoid'
import { isEqual } from 'lodash-es'
import {
  buildCrmIntegrationManualGiftItemDiscount,
  CRM_INTEGRATION_REWARD_KIND,
  getCrmIntegrationBenefitRuleId,
  hasCrmIntegrationBenefitItemMarker,
  hasCrmIntegrationDiscountId,
  isCrmIntegrationFreeItemBenefit,
} from '@/utils/crmIntegrationRewards'

export function isCrmIntegrationPointItemCartItem(item) {
  return !!item?.crmIntegrationPointItemKey
}

export function isCrmIntegrationRedemptionItemCartItem(item) {
  return (
    !!item?.crmIntegrationPointItemKey || !!item?.crmIntegrationVoucherItemKey
  )
}

export function isCrmIntegrationPointBenefitCartItem(item, benefit) {
  const ruleId = getCrmIntegrationBenefitRuleId(benefit)
  if (!ruleId) return false

  if (
    benefit?.crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  ) {
    return hasCrmIntegrationDiscountId(item, ruleId)
  }

  return hasCrmIntegrationBenefitItemMarker(item, ruleId)
}

export function getCrmIntegrationPointBenefitCartItems(items, benefit) {
  if (!Array.isArray(items)) return []
  return items.filter((item) =>
    isCrmIntegrationPointBenefitCartItem(item, benefit)
  )
}

export function getCrmIntegrationPointBenefitSubmittedItems(items, benefit) {
  if (!Array.isArray(items)) return []
  const ruleId = getCrmIntegrationBenefitRuleId(benefit)
  if (!ruleId) return []
  return items.filter((item) => hasCrmIntegrationDiscountId(item, ruleId))
}

export function getCrmIntegrationPointItemCount(items, pointItemKey) {
  if (!Array.isArray(items) || !pointItemKey) return 0
  return items
    .filter((item) => item?.crmIntegrationPointItemKey === pointItemKey)
    .reduce((total, item) => total + Number(item?.count || 0), 0)
}

export function createCrmIntegrationPointItemCandidate(item, detailData = {}) {
  const cartItem = { ...(item || {}) }
  delete cartItem.crmIntegrationBenefit
  delete cartItem.crmIntegrationMaxSelectable
  delete cartItem.crmIntegrationHideDetailPrice
  delete cartItem.crmIntegrationPointItemDisabled
  delete cartItem.crmIntegrationPointItemPending
  delete cartItem.crmIntegrationPointItemGlobalLocked
  delete cartItem.onCrmIntegrationPointItemChange
  delete cartItem.checkDish
  delete cartItem.rewardRule
  delete cartItem.discountList

  const priceItem =
    detailData.priceItem ??
    (Array.isArray(item?.itemPrices) && item.itemPrices.length === 1
      ? item.itemPrices[0]
      : undefined)
  const price = Number(
    detailData.realPrice ??
      priceItem?.price ??
      item?.price ??
      item?.displayPrice ??
      0
  )
  const crmIntegrationPointItemBasePrice = Number(
    item?.crmIntegrationPointItemBasePrice ??
      (Array.isArray(item?.itemPrices) && item.itemPrices.length > 0
        ? Math.min(...item.itemPrices.map((price) => Number(price.price || 0)))
        : (item?.price ?? item?.displayPrice ?? 0))
  )
  const crmIntegrationPointItemBaseBenefitPrice = Number(
    item?.crmIntegrationPointItemBaseBenefitPrice ??
      (Array.isArray(item?.itemPrices) && item.itemPrices.length > 0
        ? Math.min(
            ...item.itemPrices.map((price) =>
              Number(price.benefitPrice ?? price.price ?? 0)
            )
          )
        : (item?.benefitPrice ?? crmIntegrationPointItemBasePrice))
  )

  return {
    ...cartItem,
    ...detailData,
    key: nanoid(),
    count: Number(detailData.count || 1),
    options: detailData.options || [],
    priceItem,
    crmIntegrationPointItemBasePrice,
    crmIntegrationPointItemBaseBenefitPrice,
    benefitPrice: detailData.benefitPrice ?? item?.benefitPrice ?? price,
    realPrice: price,
    realBenefitPrice: Number(
      detailData.realBenefitPrice ?? item?.benefitPrice ?? price
    ),
  }
}

function isSameCrmIntegrationPointItem(left, right) {
  return (
    String(left?.id) === String(right?.id) &&
    isEqual(left?.priceItem, right?.priceItem) &&
    isEqual(left?.options, right?.options) &&
    left?.instructions === right?.instructions
  )
}

export function resolveCrmIntegrationPointItemCandidates(options = {}) {
  const {
    currentBenefitItems = [],
    item,
    count,
    detailData,
    maxPending = Infinity,
  } = options
  const currentItems = Array.isArray(currentBenefitItems)
    ? currentBenefitItems
    : []
  if (!item?.crmIntegrationPointItemKey) return currentItems

  const normalizedMaxPending = Number.isFinite(maxPending)
    ? Math.max(Number(maxPending), 0)
    : Infinity

  if (detailData !== undefined) {
    const nextCandidate = createCrmIntegrationPointItemCandidate(
      item,
      detailData
    )
    const currentTotal = currentItems.reduce(
      (total, candidate) => total + Number(candidate?.count || 0),
      0
    )
    const allowedCount = Number.isFinite(normalizedMaxPending)
      ? Math.min(
          Number(nextCandidate.count || 0),
          Math.max(normalizedMaxPending - currentTotal, 0)
        )
      : Number(nextCandidate.count || 0)
    if (allowedCount <= 0) return currentItems

    nextCandidate.count = allowedCount
    const sameIndex = currentItems.findIndex((candidate) =>
      isSameCrmIntegrationPointItem(candidate, nextCandidate)
    )
    if (sameIndex < 0) return [...currentItems, nextCandidate]

    return currentItems.map((candidate, index) =>
      index === sameIndex
        ? {
            ...candidate,
            count:
              Number(candidate.count || 0) + Number(nextCandidate.count || 0),
          }
        : candidate
    )
  }

  const otherCandidates = currentItems.filter(
    (candidate) =>
      candidate.crmIntegrationPointItemKey !== item.crmIntegrationPointItemKey
  )
  const otherTotal = otherCandidates.reduce(
    (total, candidate) => total + Number(candidate?.count || 0),
    0
  )
  const nextCount = Number.isFinite(normalizedMaxPending)
    ? Math.min(
        Number(count || 0),
        Math.max(normalizedMaxPending - otherTotal, 0)
      )
    : Number(count || 0)

  if (nextCount <= 0) return otherCandidates
  return [
    ...otherCandidates,
    createCrmIntegrationPointItemCandidate(item, { count: nextCount }),
  ]
}

export function buildCrmIntegrationPointItemCart(options = {}) {
  const { cart = [], benefit, candidates = [] } = options
  const cartWithoutCurrentBenefit = (Array.isArray(cart) ? cart : []).filter(
    (item) => !isCrmIntegrationPointBenefitCartItem(item, benefit)
  )
  const ruleId = getCrmIntegrationBenefitRuleId(benefit)
  const nextCandidates = (Array.isArray(candidates) ? candidates : []).map(
    (candidate) => {
      const cartItem = { ...candidate }
      delete cartItem.discountList
      delete cartItem.crmIntegrationBenefitRuleId
      delete cartItem.rewardRule
      if (isCrmIntegrationFreeItemBenefit(benefit)) {
        const originalPrice = Number(
          cartItem.crmIntegrationPointItemBasePrice ??
            cartItem.displayPrice ??
            cartItem.price ??
            cartItem.priceItem?.price ??
            0
        )
        const originalBenefitPrice = Number(
          cartItem.crmIntegrationPointItemBaseBenefitPrice ??
            cartItem.benefitPrice ??
            originalPrice
        )
        const originalMainPrice = Number(
          cartItem.realMainPrice ?? cartItem.priceItem?.price ?? originalPrice
        )
        const originalMainBenefitPrice = Number(
          cartItem.realMainBenefitPrice ??
            cartItem.priceItem?.benefitPrice ??
            originalMainPrice
        )
        const realMainPrice = Math.max(originalMainPrice - originalPrice, 0)
        const realMainBenefitPrice = Math.max(
          originalMainBenefitPrice - originalBenefitPrice,
          0
        )
        const realSubPrice = Number(
          cartItem.realSubPrice ??
            Math.max(
              Number(cartItem.realPrice ?? originalMainPrice) -
                originalMainPrice,
              0
            )
        )
        const realSubBenefitPrice = Number(
          cartItem.realSubBenefitPrice ??
            Math.max(
              Number(
                cartItem.realBenefitPrice ?? cartItem.realPrice ?? originalPrice
              ) - originalMainBenefitPrice,
              0
            )
        )

        return {
          ...cartItem,
          price: 0,
          benefitPrice: undefined,
          realMainPrice,
          realMainBenefitPrice,
          realSubPrice,
          realSubBenefitPrice,
          realPrice: realMainPrice + realSubPrice,
          realBenefitPrice: realMainBenefitPrice + realSubBenefitPrice,
          priceItem: cartItem.priceItem
            ? {
                ...cartItem.priceItem,
                price: realMainPrice,
                benefitPrice: undefined,
              }
            : cartItem.priceItem,
          freeItemOriginalPrice: originalPrice,
          freeItemDiscount: originalPrice,
          discountList: buildCrmIntegrationManualGiftItemDiscount(benefit),
        }
      }

      return {
        ...cartItem,
        crmIntegrationBenefitRuleId: ruleId,
      }
    }
  )

  return [...cartWithoutCurrentBenefit, ...nextCandidates]
}

export function normalizeCrmIntegrationFreeItemSubmitReward(reward) {
  if (
    reward?.crmIntegrationRewardKind !== CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  ) {
    return reward
  }

  return {
    ...reward,
    orderDiscountInfo: Array.isArray(reward.orderDiscountInfo)
      ? reward.orderDiscountInfo.map((discount) => ({
          ...discount,
          amount: discount?.isReward ? 0 : discount?.amount,
        }))
      : reward.orderDiscountInfo,
    discountedItemInfoByKey: Object.fromEntries(
      Object.entries(reward.discountedItemInfoByKey || {}).map(
        ([key, itemInfo]) => [
          key,
          {
            ...itemInfo,
            discounts: Array.isArray(itemInfo?.discounts)
              ? itemInfo.discounts.map((discount) => ({
                  ...discount,
                  amount: discount?.isReward ? 0 : discount?.amount,
                }))
              : itemInfo?.discounts,
          },
        ]
      )
    ),
  }
}

export function getCartItemSizeId(item) {
  return item?.priceItem?.sizeId ?? item?.sizeId ?? null
}

export function getCrmIntegrationCurrentOrderItems(cart = [], orders = []) {
  const orderItems = Array.isArray(orders)
    ? orders.flatMap((order) => (Array.isArray(order?.cart) ? order.cart : []))
    : []
  const cartItems = Array.isArray(cart) ? cart : []
  return [...orderItems, ...cartItems]
}

export function hasCrmIntegrationPointItemRedemption(options = {}) {
  const { cart = [], orders = [], pointBenefits = [] } = options
  const cartItems = Array.isArray(cart) ? cart : []

  if (cartItems.some(isCrmIntegrationPointItemCartItem)) {
    return true
  }

  const submittedItems = (Array.isArray(orders) ? orders : []).flatMap(
    (order) => (Array.isArray(order?.cart) ? order.cart : [])
  )

  return (Array.isArray(pointBenefits) ? pointBenefits : []).some(
    (benefit) =>
      getCrmIntegrationPointBenefitSubmittedItems(submittedItems, benefit)
        .length > 0
  )
}

export function hasCrmIntegrationRedemptionItemInCart(cart = []) {
  return (Array.isArray(cart) ? cart : []).some(
    isCrmIntegrationRedemptionItemCartItem
  )
}

export function isCrmIntegrationBenefitItemMatched(benefit, orderItem) {
  if (!benefit || !orderItem) return false
  if (benefit.eligibleItemScope === 'all') return true

  const couponItemList = Array.isArray(benefit.couponItemList)
    ? benefit.couponItemList
    : []
  if (!couponItemList.length) return false

  const orderItemId = Number(orderItem.id)
  const orderItemSizeId = getCartItemSizeId(orderItem)

  return couponItemList.some((couponItem) => {
    if (Number(couponItem.id) !== orderItemId) return false

    const itemPrices = Array.isArray(couponItem.itemPrices)
      ? couponItem.itemPrices
      : []
    if (!itemPrices.length || !orderItemSizeId) return true

    return itemPrices.some(
      (price) => String(price.sizeId) === String(orderItemSizeId)
    )
  })
}

export function hasCrmIntegrationPointItemEligibleSpec(benefit, item) {
  if (!benefit || !item) return false

  const itemPrices = Array.isArray(item.itemPrices) ? item.itemPrices : []
  if (!itemPrices.length) {
    return isCrmIntegrationBenefitItemMatched(benefit, item)
  }

  return itemPrices.some((priceItem) =>
    isCrmIntegrationBenefitItemMatched(benefit, {
      ...item,
      priceItem,
    })
  )
}

export function hasCrmIntegrationBenefitEligibleOrderItem(
  benefit,
  orderItems = []
) {
  if (benefit?.eligibleItemScope === 'all') return true
  if (!Array.isArray(orderItems) || !orderItems.length) return false
  return orderItems.some((item) =>
    isCrmIntegrationBenefitItemMatched(benefit, item)
  )
}
