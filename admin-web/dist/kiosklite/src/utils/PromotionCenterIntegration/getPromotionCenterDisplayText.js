import { getMatchedActivityRuleItem } from '@/utils/PromotionCenterIntegration/getMatchedActivityRuleItem';

/**
 * 是否使用促销平台活动名称（promotionName）作为展示文案
 */
export const isPromotionCenterActivityNameFromPlatform = (selfConfig) => {
  return selfConfig?.configMap?.id_64 === 1;
};

/**
 * 从 activityRule 单条规则获取 i18n 文案
 */
export const getActivityRuleItemI18nText = (t, activityRuleItem) => {
  if (!activityRuleItem?.text?.i18nKey) return '';
  return t(activityRuleItem.text.i18nKey, activityRuleItem.text.params);
};

/**
 * 促销中心活动展示文案（根据 id_64 配置）
 * @param {Object} [params.promoCenterHitActivity] 命中活动对象，系统预设文案时用于匹配阶梯规则
 * @returns {string|string[]} 单条为 string，满减/满赠阶梯为 string[]
 */
export const getPromotionCenterActivityRuleText = ({
  t,
  activityRule,
  type,
  promotionName,
  selfConfig,
  promoCenterHitActivity,
}) => {
  if (isPromotionCenterActivityNameFromPlatform(selfConfig) && promotionName) {
    return promotionName;
  }

  if (promoCenterHitActivity) {
    const matchedActivityRuleItem =
      getMatchedActivityRuleItem(promoCenterHitActivity);
    if (matchedActivityRuleItem?.text?.i18nKey) {
      return getActivityRuleItemI18nText(t, matchedActivityRuleItem);
    }
  }

  if (!activityRule?.length) return '';

  const ruleTextList = activityRule.map((item) =>
    getActivityRuleItemI18nText(t, item)
  );

  if (
    type === 'totalAmountQuantityDiscount' ||
    type === 'amountGiftItem'
  ) {
    return ruleTextList;
  }

  return ruleTextList[0] ?? '';
};

/**
 * 从 text 对象（含 i18nKey）获取展示文案
 */
export const getPromotionCenterTextFromTextObject = ({
  t,
  text,
  promotionName,
  selfConfig,
}) => {
  if (isPromotionCenterActivityNameFromPlatform(selfConfig) && promotionName) {
    return promotionName;
  }
  if (!text?.i18nKey) return '';
  return t(text.i18nKey, text.params ?? {});
};
