import { getStorageValue } from './storage'

const getRewardItemByRules = (rules, allItems) => {
  const freeItemRule = rules.filter(
    (each) => each.redeemRule.strategy === 'byFreeItem'
  )
  const merchantId = getStorageValue('emenu_company')?.merchantId
  const rewardItems = freeItemRule.map((each) => {
    const itemPoints = each.redeemRule.parameters.points
    const rewardType = each.redeemRule.parameters.freeItemPool.type
    const ruleItems =
      each.redeemRule.parameters.freeItemPool.objects.items.filter(
        (ruleItem) =>
          ruleItem.orderType === 'EMENU' && ruleItem.merchantId === merchantId
      )
    const ruleItemsIds = ruleItems.map((item) => item.itemId)
    const ruleItemSizeIds = ruleItems.map((item) => item.sizeId)
    const itemWithPoint = allItems.map((item) => ({
      ...item,
      itemPoints,
      rewardRule: each,
    }))
    if (rewardType === 'ALL') {
      return {
        ...each,
        items: itemWithPoint,
      }
    }
    if (rewardType === 'SELECTED') {
      const currentRuleItem = itemWithPoint.filter((each) =>
        ruleItemsIds.includes(each.id)
      )
      return {
        ...each,
        items: currentRuleItem.map((dish) => {
          return {
            ...dish,
            itemPrices: dish.itemPrices?.filter((size) =>
              ruleItemSizeIds.includes(size.id)
            ),
          }
        }),
      }
    }
    // 排除商品
    if (rewardType === 'NOTSELECTED') {
      return {
        ...each,
        items: itemWithPoint.filter((each) => {
          if (each.itemPrices?.length > 0) {
            each.itemPrices = each.itemPrices?.filter(
              (size) => !ruleItemSizeIds.includes(size.id)
            )
            return each.itemPrices.length > 0
          }
          return !ruleItemsIds.includes(each.id)
        }),
      }
    }
  })
  return rewardItems
}

export default getRewardItemByRules
