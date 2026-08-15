import { roundToPrecision } from '@/utils/resolveAvocadoSku';

const typeMap = {
  dollarValue: 'byFixedAmount',
  dollarPercentage: 'byPercentageOff',
};

export const resolveAvocadoDiscount = (props) => {
  const { rules, subtotal } = props;
  return rules
    .map((rule) => {
      let actualDiscount = 0;
      const {
        // voucher 字段
        voucherType,
        voucherValue,
        voucherRules = {},
        // loyalty 字段
        type,
        value,
        redeemPoint,
        campaignId,
      } = rule;
      const { amountCapped, minSpend } = voucherRules;
      const fullRuleInfo = {
        ...rule,
        _id: rule.id,
        campaignId: campaignId || rule.id,
        rewardType: rule.hasOwnProperty('voucherType') ? 'voucher' : 'loyalty',
        redeemRule: {
          parameters: {
            points: redeemPoint,
            discount: voucherValue || Number(value),
            maxDiscount: amountCapped,
          },
          strategy: typeMap[voucherType] || typeMap[type],
        },
      };
      if (minSpend && subtotal < minSpend) {
        return {
          ...fullRuleInfo,
          actualDiscount,
          isSatisfyMinSpend: false,
        };
      }
      const { strategy, parameters } = fullRuleInfo.redeemRule;
      const { discount, maxDiscount } = parameters;
      if (strategy === 'byPercentageOff') {
        const discountRate = roundToPrecision(discount / 100);
        const discountNum = roundToPrecision(subtotal * discountRate);
        if (maxDiscount) {
          actualDiscount = discountNum > maxDiscount ? maxDiscount : discountNum;
        } else {
          actualDiscount = discountNum;
        }
      }
      if (strategy === 'byFixedAmount') {
        actualDiscount = Number(subtotal) > discount ? discount : Number(subtotal);
      }
      return {
        ...fullRuleInfo,
        actualDiscount,
        isSatisfyMinSpend: true,
      };
    })
    .sort((a, b) => b.actualDiscount - a.actualDiscount);
};
