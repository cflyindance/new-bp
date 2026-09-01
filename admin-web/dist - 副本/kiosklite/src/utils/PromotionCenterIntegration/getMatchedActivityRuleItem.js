/**
 * 获取匹配的活动规则项
 * @param {Object} PromoCenterHitActivity - 促销中心命中的活动对象
 * @returns {Object} 匹配的活动规则项，如果没有匹配则返回空对象或默认规则项
 */
export const getMatchedActivityRuleItem = (PromoCenterHitActivity) => {
  if (!PromoCenterHitActivity) {
    return {};
  }

  const {
    promotion: { activityRule, type },
    validateInfo,
  } = PromoCenterHitActivity;

  if (type === 'totalAmountQuantityDiscount') {
    // 满金额匹配
    const orderSubtotal = validateInfo?.result?.rule?.condition?.totalAmount;
    if (orderSubtotal != undefined) {
      const matchedByAmount = activityRule.find(
        (item) =>
          item?.satisfyPrice != undefined && orderSubtotal === item.satisfyPrice
      );
      if (matchedByAmount) return matchedByAmount;
    }

    // 满件数匹配
    const validateQuantity = validateInfo?.result?.rule?.condition?.quantity;
    if (validateQuantity != undefined) {
      const matchedByQuantity = activityRule.find(
        (item) =>
          item?.buyNumber != undefined && validateQuantity === item.buyNumber
      );
      if (matchedByQuantity) return matchedByQuantity;
    }
  }

  return activityRule[0];
};
