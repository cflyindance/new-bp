const isOrderCrmDiscount = (order) => {
  if (!order.orderRewards?.length) return false
  return (
    order.orderRewards?.filter((info) =>
      ['byPercentageOff', 'byFixedAmount'].includes(info.strategy)
    )?.length > 0
  )
  // if (order.rewardDiscount) {
  //   return order.rewardDiscount > 0
  // }
}

export default isOrderCrmDiscount
