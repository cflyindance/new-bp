export const resolveDiscountCampaign = (rules) => {
  return rules.map((rule) => {
    const redeemPoint = rule?.redeemRule?.parameters?.point;
    const { ruleId } = rule;
    const template = rule.couponTemplate;
    const benefits =
      template.ruleExpression && template.ruleExpression.benefits;
    const action =
      benefits &&
      benefits[benefits.length - 1] &&
      benefits[benefits.length - 1].actions &&
      benefits[benefits.length - 1].actions[
        benefits[benefits.length - 1].actions.length - 1
      ];
    const rewardType = rule.type === 'reward' ? 'loyalty' : 'voucher';
    const strategy =
      action.type === 'minus' ? 'byFixedAmount' : 'byPercentageOff';
    const maxAmount = template.ruleExpression.options?.maxAmount;
    const actualDiscount = getActualDiscount(rule);
    const newRedeemRule = {
      parameters: {
        discount: action.params.value,
        maxDiscount: maxAmount,
        points: redeemPoint,
      },
      strategy,
    };
    return {
      ...rule,
      _id: ruleId,
      campaignId: ruleId,
      rewardType,
      rewardRule: {
        redeemRule: newRedeemRule,
        rewardType,
      },
      redeemRule: newRedeemRule,
      itemPoints: redeemPoint,
      isSatisfyMinSpend: true,
      actualDiscount,
    };
  });
};

export const getActualDiscount = (rule) => {
  return rule.crmIntegrationRule?.result?.[0]?.calculatedOrder?.discounts?.[0]
    ?.amount;
};
