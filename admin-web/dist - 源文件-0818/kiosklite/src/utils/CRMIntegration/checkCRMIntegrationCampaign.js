import i18n from '@/assets/i18n/i18n';
import crmIntegrationSDK from './marketSDK';
import Toast from '@/component/toast';
import { getActualDiscount } from './resolveDiscountCampaign';

export const checkIsCampaignValid = async ({
  coupons,
  metaData,
  extraItems,
  allItems,
}) => {
  const couponPlugin = await crmIntegrationSDK.getCouponPlugin({
    coupons,
    metas: metaData,
    extraItems,
    allItems,
  });
  const res = await couponPlugin.MarketGetOrderCoupons();
  return res?.data?.map((each) => {
    const { coupon } = each;
    return {
      ...coupon,
      crmIntegrationRule: each,
      actualDiscount: each.result?.[0]?.calculatedOrder?.discounts?.[0]?.amount,
      formattedOrder: res.formattedOrder,
    };
  });
};

export const getInvalidReason = (rule) => {
  const language = i18n.language;
  const isCN = language.includes('zh'); // 中文不区分简体繁体，同时把i18n的zh_cn转换为sdk给的zh-cn
  const actualLang = isCN ? 'zh-cn' : language;
  return rule.crmIntegrationRule.invalidReason?.map(
    (each) => each[actualLang || 'en']
  ); // 默认取英文
};

export const handleCheckInvalid = ({ rule, onCheckFailed }) => {
  const reasons = getInvalidReason(rule);
  const info = reasons.reduce((pre, cur, idx) => {
    return `${pre}${reasons?.length > 1 ? `${idx + 1}:` : ''} ${cur} `;
  }, '');
  Toast.info(`${info}`, 2000);
  onCheckFailed?.({ failureReason: info });
};

export const handleCheckDiscount = ({
  rule,
  onCheckSuccess,
  onCheckFailed,
}) => {
  if (!rule.crmIntegrationRule.isValid) {
    handleCheckInvalid({ rule, onCheckFailed });
    return false;
  }
  const actualDiscount = getActualDiscount(rule);
  onCheckSuccess?.({ ...rule, actualDiscount });
  return true;
};

export const handleCheckFreeItem = ({
  rule,
  onCheckSuccess,
  onCheckFailed,
}) => {
  if (!rule.crmIntegrationRule.isValid) {
    handleCheckInvalid({ rule, onCheckFailed });
    return false;
  }
  onCheckSuccess?.({ ...rule });
  return true;
};

export const handleCheckSpecialItem = ({
  rule,
  onCheckSuccess,
  onCheckFailed,
}) => {
  if (!rule.crmIntegrationRule.isValid) {
    handleCheckInvalid({ rule, onCheckFailed });
    return false;
  }
  onCheckSuccess?.({ ...rule });
  return true;
};

export const handleCheckBundleDiscount = ({
  rule,
  onCheckSuccess,
  onCheckFailed,
}) => {
  if (!rule.crmIntegrationRule.isValid) {
    handleCheckInvalid({ rule, onCheckFailed });
    return false;
  }
  onCheckSuccess?.({ ...rule });
  return true;
};
