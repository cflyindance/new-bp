import {
  checkIsItemPromotionValid,
  checkItemPromotionStatus,
} from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import { getMatchedActivityRuleItem } from '@/utils/PromotionCenterIntegration/getMatchedActivityRuleItem';
export {
  isPromotionCenterActivityNameFromPlatform,
  getActivityRuleItemI18nText,
  getPromotionCenterActivityRuleText,
  getPromotionCenterTextFromTextObject,
} from '@/utils/PromotionCenterIntegration/getPromotionCenterDisplayText';
export {
  isChinesePromotionLanguage,
  normalizePromotionDisplaySource,
  resolvePromotionDisplayName,
} from '@/utils/PromotionCenterIntegration/resolvePromotionDisplayName';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import countBy from 'lodash/countBy';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';
import { useCallback } from 'react';

export const handleValidateItemPromotion = async ({
  rules,
  promotionCenterMetas,
  promotionCenterList,
  allItems,
}) => {
  const rulesInfo = promotionCenterList?.filter(
    (each) =>
      rules.find((rule) => rule.promotionId === each.id) ||
      GIFT_PROMOTION_TYPE.includes(each.type) // 因为满赠，买赠只会给赠菜打标签，所以默认加入到校验流程中
  );
  return await checkIsItemPromotionValid({
    rules: rulesInfo,
    promotionCenterMetas,
    allItems,
  });
};

export const handleCheckOrderPromotion = async ({
  promotionCenterList,
  promotionCenterMetas,
  onCheckFailed,
  onCheckSuccess,
  allItems,
  merchantId,
}) => {
  try {
    const res = await checkItemPromotionStatus({
      promotionList: promotionCenterList,
      allItems,
      merchantId,
    });
    if (res) {
      const allItemRules = [];
      res.forEach((v) => {
        allItemRules.push(...v);
      });
      const uniqueRules = allItemRules.reduce((pre, cur) => {
        if (!pre.length) return pre.concat(cur);
        const isExist = pre.find(
          (each) => each.promotionId === cur.promotionId
        );
        return isExist ? pre : pre.concat(cur);
      }, []);
      const validateRes = await handleValidateItemPromotion({
        rules: uniqueRules,
        promotionCenterMetas,
        promotionCenterList,
        allItems,
      });
      if (!validateRes?.length) return onCheckFailed?.();
      onCheckSuccess?.(validateRes);
      return;
    }
    onCheckFailed?.();
  } catch (e) {
    onCheckFailed?.(e);
  }
};

export const compareItemDiscount = ({ originItemList, newItemList }) => {
  if (originItemList.length !== newItemList.length) {
    return false;
  }
  for (let i = 0; i < originItemList.length; i++) {
    const itemA = originItemList[i];
    const itemB = newItemList[i];
    if (originItemList.uniqueItemTempId !== newItemList.uniqueItemTempId) {
      return false;
    }
    const discountA = get(itemA, 'actualDiscount', undefined);
    const discountB = get(itemB, 'actualDiscount', undefined);
    // 判断实际折扣值是否相等
    if (!isEqual(discountA, discountB)) {
      return false;
    }
  }
  return true;
};

export const compareSelectedPromotion = ({
  originSelectedPromotion,
  newSelectedPromotion,
}) => {
  const fieldsToCompare = [
    'recommendType',
    'discountRate',
    'targetCount',
    'benefitAmount',
    'selectQuantity',
    'selectDiscountRate',
  ];
  for (let field of fieldsToCompare) {
    const value1 = get(originSelectedPromotion, field, undefined);
    const value2 = get(newSelectedPromotion, field, undefined);
    if (!isEqual(value1, value2)) {
      return false;
    }
  }
  return true;
};

export const getRewardInfo = ({ orderDiscountInfo, rewardItem }) => ({
  orderDiscountInfo,
  actualDiscount: rewardItem.discounts?.[0]?.amount,
  itemDiscountInfo: rewardItem.discounts,
  promotionRewardItem: true,
});

export const INIT_PROMOTION_REWARD_INFO = {
  orderDiscountInfo: undefined,
  actualDiscount: undefined,
  itemDiscountInfo: undefined,
  promotionRewardItem: undefined,
  manualSelectRewardDiscount: undefined,
};

export const getOrderItemWithRewardInfo = ({
  items,
  orderItems,
  orderDiscountInfo,
}) => {
  return items.reduce((pre, cur) => {
    const isRewardItem = orderItems.find(
      (i) => i.id === cur.uniqueItemTempId && i.discounts?.length > 0
    );
    const nonRewardInfo = {
      ...cur,
      ...INIT_PROMOTION_REWARD_INFO,
    };
    // 非促销奖励菜品
    if (!isRewardItem) return pre.concat(nonRewardInfo);
    const { quantity } = isRewardItem;
    const promotionRewardInfo = getRewardInfo({
      orderDiscountInfo,
      rewardItem: isRewardItem,
    });
    const rewardItemInfo = {
      ...cur,
      ...promotionRewardInfo,
      // crm互斥时 会被删除上面的内容 这里要多记录一份
      promotionRewardInfo: {
        ...promotionRewardInfo,
        uniqueItemTempId: cur.uniqueItemTempId,
      },
    };
    // 奖励数量和菜品数量一致不用处理
    if (cur.quantity === 1 || cur.quantity === quantity) {
      return pre.concat(rewardItemInfo);
    }
    // 不一致, 奖励菜品和普通菜品要区分
    const nonRewardItem = {
      ...nonRewardInfo,
      quantity: cur.quantity - quantity,
    };
    const hasRewardItem = { ...rewardItemInfo, quantity };
    return pre.concat(nonRewardItem, hasRewardItem);
  }, []);
};

export const isSameItems = (a = [], b = []) => {
  if (a.length !== b.length) return false;

  const countA = countBy(a, 'id');
  const countB = countBy(b, 'id');

  return isEqual(countA, countB);
};

export const makeUpItemValidPromotion = ({
  currentRuleInfo,
  itemValidPromotion,
  isCurrentSelected = true,
}) => {
  let newItemValidPromotion = [];
  const { promotion } = currentRuleInfo;
  if (itemValidPromotion?.length > 0) {
    const isPromotionInPool = itemValidPromotion.findIndex(
      (e) => e.promotion.id === promotion.id
    );
    newItemValidPromotion = itemValidPromotion.map((each, i) => {
      return i === isPromotionInPool
        ? { ...currentRuleInfo, isSelected: isCurrentSelected }
        : { ...each, isSelected: false };
    });
    if (isPromotionInPool === -1) {
      newItemValidPromotion.push({
        ...currentRuleInfo,
        isSelected: isCurrentSelected,
      });
    }
  } else {
    newItemValidPromotion = [
      { ...currentRuleInfo, isSelected: isCurrentSelected },
    ];
  }
  return newItemValidPromotion;
};

export { getMatchedActivityRuleItem };
