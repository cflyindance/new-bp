import { useCallback } from 'react';
import getRewardItemByRules from '@/utils/getRewardItemByRules';
import getRewardDiscountByRules from '@/utils/getRewardDiscountByRules';
import { getItemPrice } from '@/utils/priceCalculator';

const useCRM = () => {
  const getCRMRewardFreeItem = useCallback(({ rules, itemResources }) => {
    if (rules?.length > 0) {
      // free item
      const ruleWithItem = getRewardItemByRules({
        rules,
        allItems: itemResources,
      });
      return ruleWithItem
        .map((each) => each.items)
        ?.flat()
        ?.map((item) => {
          return {
            ...item,
            totalPrice: getItemPrice(item),
            originalPrice: item.price || item.itemPrices?.[0]?.price || 0,
          };
        });
    }
    return [];
  }, []);

  const getCRMRewardDiscount = useCallback(({ rules, itemResources }) => {
    return getRewardDiscountByRules({
      itemList: itemResources,
      rules,
    });
  }, []);

  return {
    getCRMRewardFreeItem,
    getCRMRewardDiscount,
  };
};

export default useCRM;
