export const CRM_INTEGRATION_REWARD_KIND = {
  FIXED_DISCOUNT: 'fixedDiscount',
  PERCENTAGE_DISCOUNT: 'percentageDiscount',
  FREE_ITEM: 'freeItem',
  SPECIAL_ITEM: 'specialItem',
  QUANTITY_ITEM_DISCOUNT: 'quantityItemDiscount',
  UNKNOWN: 'unknown',
}

export const CRM_INTEGRATION_REWARD_SOURCE = {
  REWARD: 'reward',
  VOUCHER: 'voucher',
}

export function getDishItemRedeemPoints(options = {}) {
  const { rewardRule, crmIntegrationPointItem, crmIntegrationPoints } = options
  if (rewardRule) {
    return Number(rewardRule?.redeemRule?.parameters?.points || 0)
  }
  if (crmIntegrationPointItem) {
    return Number(crmIntegrationPoints || 0)
  }
  return null
}

export function shouldGrayCrmIntegrationPointItemAddButton(options = {}) {
  return (
    options.crmIntegrationPointItem === true &&
    (options.isLoggedIn !== true ||
      options.crmIntegrationPointItemGlobalLocked === true)
  )
}

export function resolveCrmIntegrationPointItemAction(options = {}) {
  const {
    crmIntegrationPointItem,
    outOfStock,
    displayMode,
    pending,
    disabled,
    isShowDetail,
    count,
    itemMax,
  } = options
  if (!crmIntegrationPointItem) return null
  if (outOfStock || displayMode || pending || disabled) return 'blocked'
  if (isShowDetail) return 'detail'
  if (itemMax && count >= itemMax) return 'blocked'
  return 'increment'
}

export function resolveCrmIntegrationPointItemEntryAction(options = {}) {
  if (!options.crmIntegrationPointItem) return null
  if (options.precheckPassed !== true) return 'blocked'
  return resolveCrmIntegrationPointItemAction(options)
}

export function shouldHideDishDialogPrice(options = {}) {
  return !!(options.rewardRule || options.crmIntegrationHideDetailPrice)
}

export function isCrmIntegrationOrderDiscountBenefit(benefit) {
  return [
    CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT,
    CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT,
  ].includes(benefit?.crmIntegrationRewardKind)
}

export function isCrmIntegrationFreeItemBenefit(benefit) {
  return (
    benefit?.crmIntegrationRewardKind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  )
}

export function isCrmIntegrationSpecialItemBenefit(benefit) {
  return (
    benefit?.crmIntegrationRewardKind ===
    CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
  )
}

export function isCrmIntegrationQuantityItemDiscountBenefit(benefit) {
  return (
    benefit?.crmIntegrationRewardKind ===
    CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
  )
}

export function isCrmIntegrationSdkValidatedBenefit(benefit) {
  return (
    isCrmIntegrationOrderDiscountBenefit(benefit) ||
    isCrmIntegrationFreeItemBenefit(benefit) ||
    isCrmIntegrationSpecialItemBenefit(benefit) ||
    isCrmIntegrationQuantityItemDiscountBenefit(benefit)
  )
}

export function getCrmIntegrationBenefitRuleId(benefit) {
  return (
    benefit?.rawReward?.ruleId || benefit?.rawVoucher?.rewardRule?.ruleId || ''
  )
}

export function getCrmIntegrationBenefitName(benefit) {
  return (
    benefit?.rawReward?.couponTemplate?.templateName ||
    benefit?.rawVoucher?.rewardRule?.couponTemplate?.templateName ||
    benefit?.name ||
    ''
  )
}

export function hasCrmIntegrationDiscountId(item, discountId) {
  if (!discountId || !Array.isArray(item?.discountList)) return false
  return item.discountList.some((discount) => discount?.id === discountId)
}

export function hasCrmIntegrationBenefitItemMarker(item, rewardRuleId) {
  return (
    !!rewardRuleId &&
    String(item?.crmIntegrationBenefitRuleId || '') === String(rewardRuleId)
  )
}

export function buildCrmIntegrationManualGiftItemDiscount(benefit) {
  return [
    {
      id: getCrmIntegrationBenefitRuleId(benefit),
      name: getCrmIntegrationBenefitName(benefit),
      amount: 0,
      type: benefit?.crmIntegrationRewardSource,
      isReward: true,
    },
  ]
}

const CRM_INTEGRATION_MENU_VOUCHER_TEMPLATE_TYPES = [
  'discountCoupon',
  'giftItemCoupon',
  'orderItemFixedPriceCoupon',
  'quantityItemDiscountCoupon',
  'voucher',
]

function getLastItem(list) {
  return Array.isArray(list) && list.length > 0 ? list[list.length - 1] : null
}

export function getCrmIntegrationRewardAction(reward) {
  const benefits = reward?.couponTemplate?.ruleExpression?.benefits
  return getLastItem(getLastItem(benefits)?.actions)
}

export function getCrmIntegrationRewardKind(reward) {
  const templateType = reward?.couponTemplate?.type
  const actionType = getCrmIntegrationRewardAction(reward)?.type

  if (templateType === 'giftItemCoupon') {
    return CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  }
  if (
    templateType === 'orderItemFixedPriceCoupon' ||
    actionType === 'setPrice'
  ) {
    return CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
  }
  if (templateType === 'quantityItemDiscountCoupon') {
    return CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
  }
  if (actionType === 'minus') {
    return CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT
  }
  if (actionType === 'percentage') {
    return CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT
  }
  return CRM_INTEGRATION_REWARD_KIND.UNKNOWN
}

export function getCrmIntegrationRewardMinSpend(reward) {
  return Number(
    reward?.couponTemplate?.ruleExpression?.condition?.totalAmount || 0
  )
}

export function getCrmIntegrationRewardExpireInfo(reward) {
  const validity = reward?.couponTemplate?.validity
  if (validity?.type === 'permanent') {
    return {
      expireAt: null,
      isPermanent: true,
    }
  }

  return {
    expireAt:
      validity?.fixed?.endDate ||
      validity?.fixed?.dateRange?.[1] ||
      reward?.useEndTime ||
      null,
    isPermanent: false,
  }
}

function getCrmIntegrationMenuCampaignExpireInfo(reward, source) {
  if (source === CRM_INTEGRATION_REWARD_SOURCE.REWARD) {
    return {
      expireAt: null,
      isPermanent: true,
    }
  }
  return getCrmIntegrationRewardExpireInfo(reward)
}

function getFilterItemIds(itemFilter, merchantId) {
  return getCrmIntegrationFilterValues(itemFilter, merchantId).map((item) =>
    Number(item.itemId)
  )
}

function getCrmIntegrationFilterValues(itemFilter, merchantId) {
  const values = Array.isArray(itemFilter?.value) ? itemFilter.value : []
  return values.filter((item) => {
    if (item?.productLine && item.productLine !== 'EMENU') return false
    if (merchantId && item?.merchantId && item.merchantId !== merchantId) {
      return false
    }
    return item?.itemId !== undefined
  })
}

function filterItemPricesByCrmSizeList(itemPrices, sizeList) {
  if (
    !Array.isArray(itemPrices) ||
    !Array.isArray(sizeList) ||
    !sizeList.length
  ) {
    return itemPrices
  }
  const sizeIds = sizeList.map((size) => Number(size.sizeId))
  return itemPrices.filter((price) => sizeIds.includes(Number(price.sizeId)))
}

function resolveCrmIntegrationFilteredItems(itemFilter, saleItems, merchantId) {
  const scope = itemFilter?.type || 'all'
  const visibleItems = Array.isArray(saleItems)
    ? saleItems.filter((item) => !item.hidden)
    : []
  const filterValues = getCrmIntegrationFilterValues(itemFilter, merchantId)

  if (scope === 'all') return visibleItems

  if (scope === 'include') {
    return visibleItems.reduce((result, item) => {
      const filterItem = filterValues.find(
        (value) => Number(value.itemId) === Number(item.id)
      )
      if (!filterItem) return result

      const itemPrices = filterItemPricesByCrmSizeList(
        item.itemPrices,
        filterItem.sizeList
      )
      if (
        Array.isArray(item.itemPrices) &&
        item.itemPrices.length &&
        !itemPrices.length
      ) {
        return result
      }

      return result.concat({
        ...item,
        itemPrices,
      })
    }, [])
  }

  if (scope === 'exclude') {
    return visibleItems.reduce((result, item) => {
      const filterItem = filterValues.find(
        (value) => Number(value.itemId) === Number(item.id)
      )
      if (!filterItem) return result.concat(item)
      if (!Array.isArray(filterItem.sizeList) || !filterItem.sizeList.length) {
        return result
      }
      if (!Array.isArray(item.itemPrices) || !item.itemPrices.length) {
        return result
      }

      const excludedSizeIds = new Set(
        (filterItem.sizeList || []).map((size) => Number(size.sizeId))
      )
      const remainingPrices = item.itemPrices.filter(
        (price) => !excludedSizeIds.has(Number(price.sizeId))
      )
      if (!remainingPrices.length) return result

      return result.concat({
        ...item,
        itemPrices: remainingPrices,
      })
    }, [])
  }

  return visibleItems
}

function resolveCrmIntegrationEligibleItems(itemFilter, saleItems, merchantId) {
  const scope = itemFilter?.type || 'all'
  const visibleItems = Array.isArray(saleItems)
    ? saleItems.filter((item) => !item.hidden)
    : []
  const filterItemIds = getFilterItemIds(itemFilter, merchantId)

  if (scope === 'include') {
    return {
      eligibleItemScope: scope,
      eligibleItemCount: visibleItems.filter((item) =>
        filterItemIds.includes(Number(item.id))
      ).length,
    }
  }

  if (scope === 'exclude') {
    return {
      eligibleItemScope: scope,
      eligibleItemCount: visibleItems.filter(
        (item) => !filterItemIds.includes(Number(item.id))
      ).length,
    }
  }

  return {
    eligibleItemScope: 'all',
    eligibleItemCount: visibleItems.length,
  }
}

function getCrmIntegrationEligibleItemFilter(reward, kind, action) {
  if (kind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM) {
    return action?.itemFilter
  }
  return reward?.couponTemplate?.ruleExpression?.condition?.itemFilter
}

function normalizeCrmIntegrationQuantityLimit(quantityLimit) {
  const actualQuantityLimit = Number(quantityLimit)
  return Number.isFinite(actualQuantityLimit) && actualQuantityLimit > 0
    ? actualQuantityLimit
    : null
}

function resolveCrmIntegrationSpecialItems({
  benefits,
  saleItems,
  merchantId,
  quantityLimit,
}) {
  if (!Array.isArray(benefits) || !Array.isArray(saleItems)) return []

  const mergedItems = benefits.reduce((result, benefit) => {
    const action = getLastItem(benefit?.actions)
    const filterItem = benefit?.condition?.itemFilter?.value?.[0]

    if (!filterItem) return result
    if (filterItem.productLine !== 'EMENU') return result
    if (merchantId && filterItem.merchantId !== merchantId) return result

    const itemId = Number(filterItem.itemId)
    const sizeList = Array.isArray(filterItem.sizeList)
      ? filterItem.sizeList
      : []
    const specialPrice = Number(action?.params?.price ?? action?.params?.value)
    const existingItem = result.find((item) => item.itemId === itemId)

    if (existingItem) {
      existingItem.sizeList = existingItem.sizeList.concat(sizeList)
      existingItem.specialPrice = Math.min(
        existingItem.specialPrice,
        specialPrice
      )
      return result
    }

    return result.concat({
      itemId,
      benefitId: benefit?._id,
      specialPrice,
      displayPrice: Number(filterItem.price || 0),
      sizeList: [...sizeList],
      quantityLimit,
    })
  }, [])

  return mergedItems.reduce((result, item) => {
    const saleItem = saleItems.find(
      (saleItem) => Number(saleItem.id) === item.itemId && !saleItem.hidden
    )
    if (!saleItem) return result

    const sizeIds = item.sizeList.map((size) => Number(size.sizeId))
    const itemPrices = Array.isArray(saleItem.itemPrices)
      ? saleItem.itemPrices.filter((price) =>
          sizeIds.includes(Number(price.sizeId))
        )
      : []

    return result.concat({
      ...saleItem,
      specialPrice: item.specialPrice,
      displayPrice: item.displayPrice || saleItem.price,
      quantityLimit: item.quantityLimit,
      itemPrices: itemPrices.length ? itemPrices : saleItem.itemPrices,
      crmIntegrationSpecialItem: true,
    })
  }, [])
}

export function resolveCrmIntegrationDiscountRewards(rewards) {
  if (!Array.isArray(rewards)) return []

  return rewards
    .map((reward) => {
      const kind = getCrmIntegrationRewardKind(reward)
      const action = getCrmIntegrationRewardAction(reward)

      if (
        kind !== CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT &&
        kind !== CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT
      ) {
        return null
      }

      const points = Number(reward?.redeemRule?.parameters?.point || 0)
      const discount = Number(action?.params?.value || 0)
      const maxDiscount =
        reward?.couponTemplate?.ruleExpression?.options?.maxAmount
      const strategy =
        kind === CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT
          ? 'byFixedAmount'
          : 'byPercentageOff'

      return {
        ...reward,
        _id: reward.ruleId,
        campaignId: reward.ruleId,
        itemPoints: points,
        rewardType: reward.type === 'reward' ? 'loyalty' : reward.type,
        crmIntegrationRewardKind: kind,
        redeemRule: {
          strategy,
          parameters: {
            points,
            discount,
            maxDiscount,
          },
        },
        rewardRule: {
          rewardType: reward.type === 'reward' ? 'loyalty' : reward.type,
          redeemRule: {
            strategy,
            parameters: {
              points,
              discount,
              maxDiscount,
            },
          },
        },
      }
    })
    .filter(Boolean)
}

export function resolveCrmIntegrationDiscountWithAmount(rules, subtotal) {
  const orderSubtotal = Number(subtotal || 0)

  return rules
    .map((rule) => {
      const { strategy, parameters } = rule.redeemRule
      const discount = Number(parameters.discount || 0)
      let actualDiscount = 0

      if (strategy === 'byFixedAmount') {
        actualDiscount = Math.min(orderSubtotal, discount)
      }
      if (strategy === 'byPercentageOff') {
        const rawDiscount = (orderSubtotal * discount) / 100
        actualDiscount = parameters.maxDiscount
          ? Math.min(rawDiscount, Number(parameters.maxDiscount))
          : rawDiscount
      }

      return {
        ...rule,
        actualDiscount,
      }
    })
    .sort((a, b) => b.actualDiscount - a.actualDiscount)
}

export function getCrmIntegrationOwnedVoucherRules(vouchers) {
  if (!Array.isArray(vouchers)) return []

  return vouchers.reduce((result, voucher) => {
    const voucherCount = Number(voucher?.count || 0)
    const rewardRule = voucher?.rewardRule
    const couponTemplateId = rewardRule?.couponTemplateId

    if (
      voucherCount <= 0 ||
      !rewardRule ||
      !couponTemplateId ||
      !rewardRule?.couponTemplate
    ) {
      return result
    }

    result.push({
      ...rewardRule,
      type: CRM_INTEGRATION_REWARD_SOURCE.VOUCHER,
      rawVoucher: voucher,
      voucherCount,
    })

    return result
  }, [])
}

export function groupCrmIntegrationVoucherBenefitsForDisplay(voucherBenefits) {
  if (!Array.isArray(voucherBenefits)) return []

  const displayVoucherByTemplateId = new Map()

  voucherBenefits.forEach((benefit) => {
    const couponTemplateId = benefit?.rawVoucher?.rewardRule?.couponTemplateId
    if (!couponTemplateId) return

    const voucherCount = Number(benefit?.voucherCount || 0)
    const existingDisplayVoucher =
      displayVoucherByTemplateId.get(couponTemplateId)
    if (existingDisplayVoucher) {
      existingDisplayVoucher.voucherCount += voucherCount
      return
    }

    displayVoucherByTemplateId.set(couponTemplateId, {
      ...benefit,
      voucherCount,
    })
  })

  return Array.from(displayVoucherByTemplateId.values())
}

function resolveCrmIntegrationMenuCampaigns(campaigns, options = {}) {
  if (!Array.isArray(campaigns)) return []

  const {
    saleItems = [],
    merchantId = '',
    source = CRM_INTEGRATION_REWARD_SOURCE.REWARD,
  } = options
  const isVoucherSource = source === CRM_INTEGRATION_REWARD_SOURCE.VOUCHER

  return campaigns
    .filter((reward) =>
      reward?.couponTemplate?.productLine?.some((line) => line === 'EMENU')
    )
    .filter((reward) => {
      if (!isVoucherSource) return true
      return CRM_INTEGRATION_MENU_VOUCHER_TEMPLATE_TYPES.includes(
        reward?.couponTemplate?.type
      )
    })
    .map((reward) => {
      const kind = getCrmIntegrationRewardKind(reward)
      const action = getCrmIntegrationRewardAction(reward)
      const points = isVoucherSource
        ? 0
        : Number(reward?.redeemRule?.parameters?.point || 0)
      const benefits = reward?.couponTemplate?.ruleExpression?.benefits
      const firstBenefit = Array.isArray(benefits) ? benefits[0] : null
      const quantityDiscountAction = getLastItem(firstBenefit?.actions)
      const isFreeItem = kind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
      const isQuantityItemDiscount =
        kind === CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
      const conditionItemList = resolveCrmIntegrationFilteredItems(
        reward?.couponTemplate?.ruleExpression?.condition?.itemFilter,
        saleItems,
        merchantId
      )
      const discountValue = Number(
        isQuantityItemDiscount
          ? quantityDiscountAction?.params?.value || 0
          : action?.params?.value || 0
      )
      const quantityLimit = normalizeCrmIntegrationQuantityLimit(
        reward?.couponTemplate?.ruleExpression?.options?.quantityLimit
      )
      const specialItemList =
        kind === CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
          ? resolveCrmIntegrationSpecialItems({
              benefits,
              saleItems,
              merchantId,
              quantityLimit,
            })
          : []
      const quantityDiscountItems = isQuantityItemDiscount
        ? conditionItemList
        : []
      const freeItemList = isFreeItem
        ? resolveCrmIntegrationFilteredItems(
            action?.itemFilter,
            saleItems,
            merchantId
          )
        : []
      const couponItemList = isQuantityItemDiscount
        ? quantityDiscountItems
        : isFreeItem
          ? freeItemList
          : kind === CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
            ? specialItemList
            : conditionItemList
      const quantityDiscountRule = isQuantityItemDiscount
        ? {
            orderQuantity: Number(firstBenefit?.condition?.quantity || 0),
            discountValue,
            discountNum: Number(quantityDiscountAction?.params?.quantity || 0),
            discountType: quantityDiscountAction?.type,
          }
        : null
      const buyQuantity = quantityDiscountRule
        ? Math.max(
            quantityDiscountRule.orderQuantity -
              quantityDiscountRule.discountNum,
            0
          )
        : 0
      const specialPrice = specialItemList.length
        ? Math.min(
            ...specialItemList.map((item) => Number(item.specialPrice || 0))
          )
        : 0
      const expireInfo = getCrmIntegrationMenuCampaignExpireInfo(reward, source)
      const eligibleItemInfo =
        kind === CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
          ? {
              eligibleItemScope: 'include',
              eligibleItemCount: couponItemList.length,
            }
          : resolveCrmIntegrationEligibleItems(
              getCrmIntegrationEligibleItemFilter(reward, kind, action),
              saleItems,
              merchantId
            )
      const hasCouponItemDialog =
        [
          CRM_INTEGRATION_REWARD_KIND.FREE_ITEM,
          CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM,
          CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT,
        ].includes(kind) &&
        (kind === CRM_INTEGRATION_REWARD_KIND.FREE_ITEM ||
          eligibleItemInfo.eligibleItemScope !== 'all') &&
        couponItemList.length > 0
      const couponTemplateDescription = reward?.couponTemplate?.description
      const description =
        typeof couponTemplateDescription === 'string'
          ? couponTemplateDescription
          : ''

      return {
        id: isVoucherSource
          ? `crm-integration-voucher-${reward.ruleId}`
          : `crm-integration-reward-${reward.ruleId}`,
        name: reward.displayName || reward.name,
        description,
        minSpend: getCrmIntegrationRewardMinSpend(reward),
        ...expireInfo,
        hidden: false,
        showLarge: false,
        crmIntegrationReward: true,
        crmIntegrationRewardSource: source,
        crmIntegrationVoucher: isVoucherSource,
        crmIntegrationRewardKind: kind,
        points,
        voucherCount: isVoucherSource ? Number(reward.voucherCount || 0) : 0,
        discountValue,
        giftQuantity: Number(action?.params?.quantity || 0),
        discountQuantity: Number(
          quantityDiscountAction?.params?.quantity ||
            action?.params?.quantity ||
            0
        ),
        quantityLimit,
        sameItem: !!reward?.couponTemplate?.ruleExpression?.options?.sameItem,
        includeSpecItems:
          reward?.couponTemplate?.ruleExpression?.options?.includeSpecItems ===
          true,
        bundleDiscountRule: quantityDiscountRule,
        buyQuantity,
        couponItemList,
        hasCouponItemDialog,
        specialPrice,
        ...eligibleItemInfo,
        couponTemplateType: reward?.couponTemplate?.type,
        rawReward: reward,
        rawVoucher: reward.rawVoucher,
      }
    })
    .filter((reward) => {
      const supportedKinds = isVoucherSource
        ? [
            CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT,
            CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT,
            CRM_INTEGRATION_REWARD_KIND.FREE_ITEM,
            CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM,
            CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT,
          ]
        : [
            CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT,
            CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT,
            CRM_INTEGRATION_REWARD_KIND.FREE_ITEM,
            CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM,
            CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT,
          ]

      return (
        reward.name &&
        supportedKinds.includes(reward.crmIntegrationRewardKind) &&
        (reward.crmIntegrationRewardKind !==
          CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM ||
          reward.couponItemList.length > 0) &&
        (reward.crmIntegrationRewardKind !==
          CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT ||
          reward.couponItemList.length > 0)
      )
    })
}

export function resolveCrmIntegrationMenuRewards(rewards, options = {}) {
  return resolveCrmIntegrationMenuCampaigns(rewards, {
    ...options,
    source: CRM_INTEGRATION_REWARD_SOURCE.REWARD,
  })
}

const CRM_INTEGRATION_POINT_ITEM_MAX_SELECTABLE = 1

export function shouldSetCrmIntegrationPointItemPending({
  currentCount,
  nextCount,
  isDetailSubmit = false,
}) {
  return isDetailSubmit || Number(nextCount) > Number(currentCount)
}

export async function runCrmIntegrationPointItemPendingChange({
  shouldSetPending,
  onPendingChange,
  onChange,
}) {
  if (!shouldSetPending) return onChange()

  onPendingChange(true)
  try {
    return await onChange()
  } finally {
    onPendingChange(false)
  }
}

export function flattenCrmIntegrationPointItems(benefits) {
  if (!Array.isArray(benefits)) return []

  return benefits.flatMap((benefit) => {
    const itemList = Array.isArray(benefit?.couponItemList)
      ? benefit.couponItemList
      : []
    const benefitId = String(benefit?.id || '')
    if (!benefitId) return []

    const itemIdSet = new Set()
    return itemList.reduce((result, item) => {
      const itemId = String(item?.id ?? '')
      if (!itemId || itemIdSet.has(itemId)) return result
      itemIdSet.add(itemId)

      result.push({
        ...item,
        showLarge: false,
        crmIntegrationPointItem: true,
        crmIntegrationPointItemKey: `${benefitId}:${itemId}`,
        crmIntegrationPoints: Number(benefit?.points || 0),
        crmIntegrationBenefit: benefit,
        crmIntegrationMaxSelectable: CRM_INTEGRATION_POINT_ITEM_MAX_SELECTABLE,
        crmIntegrationHideDetailPrice:
          isCrmIntegrationFreeItemBenefit(benefit) ||
          (isCrmIntegrationSpecialItemBenefit(benefit) &&
            benefit?.includeSpecItems === true),
      })
      return result
    }, [])
  })
}

export function buildCrmIntegrationRedeemMenu(options = {}) {
  const pointItems = flattenCrmIntegrationPointItems(options.rewardItems)
  const categoryList = []

  if (pointItems.length) {
    categoryList.push({
      id: 'crm-point-item',
      hidden: false,
      list: pointItems,
    })
  }
  if (!categoryList.length) return {}

  return {
    id: 'avocado-item-campaign',
    expand: true,
    hidden: false,
    list: categoryList,
  }
}

export function resolveCrmIntegrationMenuVouchers(vouchers, options = {}) {
  return resolveCrmIntegrationMenuCampaigns(
    getCrmIntegrationOwnedVoucherRules(vouchers),
    {
      ...options,
      source: CRM_INTEGRATION_REWARD_SOURCE.VOUCHER,
    }
  )
}
