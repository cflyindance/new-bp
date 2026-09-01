import { roundToPrecision } from '@/utils/number'

const getRewardDiscountByRules = (itemList, rules, orders) => {
  let actualDiscount = 0
  const discountRules = rules
    .map((rule) => {
      const { redeemRule } = rule
      const { strategy, eligibility, parameters } = redeemRule
      const { items } = eligibility.object
      const inValidItemIds = items.map((item) => item.itemId)
      const validOrderItems = itemList.filter(
        (orderItem) => !inValidItemIds.includes(orderItem.id)
      )
      const totalDiscountPrice = validOrderItems.reduce((pre, cur) => {
        return roundToPrecision(pre + cur.realPrice * cur.count)
      }, 0)
      if (strategy === 'byPercentageOff') {
        const { discount, maxDiscount } = parameters
        const discountRate = roundToPrecision(discount / 100)
        const discountNum = roundToPrecision(
          (orders.isHasBenefit ? totalDiscountPrice : orders.totalPrice) *
            discountRate
        )
        if (maxDiscount) {
          actualDiscount = discountNum > maxDiscount ? maxDiscount : discountNum
        } else {
          actualDiscount = discountNum
        }
      }
      if (strategy === 'byFixedAmount') {
        const { discount } = parameters
        actualDiscount =
          Number(totalDiscountPrice) > discount
            ? discount
            : Number(totalDiscountPrice)
      }
      return {
        ...rule,
        actualDiscount,
      }
    })
    .sort((a, b) => b.actualDiscount - a.actualDiscount)
  return discountRules
}

export default getRewardDiscountByRules
