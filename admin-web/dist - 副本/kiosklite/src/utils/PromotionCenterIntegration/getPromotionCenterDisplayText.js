import { getMatchedActivityRuleItem } from '@/utils/PromotionCenterIntegration/getMatchedActivityRuleItem';
import i18n from '@/assets/i18n/i18n';
import {
  normalizePromotionDisplaySource,
  resolvePromotionDisplayName,
} from '@/utils/PromotionCenterIntegration/resolvePromotionDisplayName';

/**
 * 是否使用促销平台活动名称（promotionName）作为展示文案
 */
export const isPromotionCenterActivityNameFromPlatform = (selfConfig) => {
  return normalizePromotionDisplaySource(selfConfig?.configMap?.id_64) > 0;
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
  let ruleText = '';

  if (promoCenterHitActivity) {
    const matchedActivityRuleItem = getMatchedActivityRuleItem(
      promoCenterHitActivity
    );
    if (matchedActivityRuleItem?.text?.i18nKey) {
      ruleText = getActivityRuleItemI18nText(t, matchedActivityRuleItem);
    }
  }

  if (!ruleText && activityRule?.length) {
    const ruleTextList = activityRule.map((item) =>
      getActivityRuleItemI18nText(t, item)
    );
    ruleText =
      type === 'totalAmountQuantityDiscount' || type === 'amountGiftItem'
        ? ruleTextList
        : (ruleTextList[0] ?? '');
  }

  return resolvePromotionDisplayName({
    source: selfConfig?.configMap?.id_64,
    language: i18n.language,
    origin: 'cloud',
    promotion: { promotionName },
    ruleText,
  });
};

/**
 * 从 text 对象（含 i18nKey）获取展示文案
 */
export const getPromotionCenterTextFromTextObject = ({ t, text }) => {
  if (!text?.i18nKey) return '';
  return t(text.i18nKey, text.params ?? {});
};
