import floatNumberRounding from '@/utils/formatNumberRounding';
import { getItemPrice } from '@/utils/priceCalculator';
import Big from 'big.js';
import i18n from '@/assets/i18n/i18n';

const getRewardDiscountByRules = ({ itemList, rules }) => {
  const t = i18n.t;
  const discountRuleSet = ['byPercentageOff', 'byFixedAmount'];
  const itemListWithPrice = itemList.map((item) => {
    return {
      ...item,
      itemTotalPrice: Number(
        floatNumberRounding(
          Big(getItemPrice(item))
            //.minus(item.discount || 0) crm和promotion不再同时享有 第X件Y折时，会有discount
            .toFixed(2)
        )
      ),
    };
  });
  let actualDiscount = 0;
  const discountRules = rules
    .filter((each) => discountRuleSet.includes(each.redeemRule.strategy))
    .map((rule) => {
      const { redeemRule } = rule;
      const { strategy, eligibility, parameters } = redeemRule;
      const { items } = eligibility.object;
      const inValidItemIds = items.map((item) => item.itemId);
      const validOrderItems = itemListWithPrice.filter(
        (orderItem) => !inValidItemIds.includes(orderItem.id)
      );
      const totalDiscountPrice = validOrderItems.reduce((pre, cur) => {
        return Big(pre).plus(
          Big(cur.itemTotalPrice || 0)
            .times(Big(cur.quantity || 0))
            .toFixed(2)
        );
      }, 0);
      if (strategy === 'byPercentageOff') {
        const { discount, maxDiscount } = parameters;
        const discountRate = Number(Big(discount).div(100).toFixed(2));
        const discountNum = Number(
          Big(totalDiscountPrice).times(discountRate).toFixed(2)
        );
        if (maxDiscount) {
          actualDiscount =
            discountNum > maxDiscount ? maxDiscount : discountNum;
        } else {
          actualDiscount = discountNum;
        }
      }
      if (strategy === 'byFixedAmount') {
        const { discount } = parameters;
        actualDiscount =
          Number(totalDiscountPrice) > discount
            ? discount
            : Number(totalDiscountPrice);
      }
      const points = parameters.points;
      const value =
        strategy === 'byFixedAmount'
          ? `$${parameters.discount}`
          : `${parameters.discount}% OFF`;
      return {
        ...rule,
        actualDiscount,
        rewardRule: rule,
        itemPoints: points,
        // 自研活动默认可参与
        crmIntegrationRule: {
          isValid: true,
        },
        // 覆盖原有name
        name: t('crm_discount_name', { points, value }),
      };
    })
    // .sort((a, b) => b.actualDiscount - a.actualDiscount);
    .sort(
      (a, b) => a.redeemRule.parameters.points - b.redeemRule.parameters.points
    );
  return discountRules;
};

export default getRewardDiscountByRules;
