import { getCloudPromotion } from '@/api/kioskConfigApi';
import { getMarginappFetchConfig } from '@/api';
import filterItemByTime from '@/utils/filterItemByTime';
import filterCloudPromotionByTime from '@/utils/filterCloudPromotionByTime';
import { updatePromotionDealsInMenuGroup } from '@/actions';
import store from '@/reducers/store';

const getPromotionProcedure = async (props) => {
  const {
    setCloudPromotion,
    setPromotion,
    setBuyGiftRule,
    setBuyDiscountRule,
    setExchangePurchaseRule,
    setOrderDiscount,
    setPromotionCode,
  } = props;

  // 每次获取之前都先清空
  setPromotion([]);
  setBuyGiftRule([]);
  setBuyDiscountRule([]);
  setExchangePurchaseRule([]);
  setOrderDiscount([]);
  setCloudPromotion([]);
  setPromotionCode('');

  // 从 store 中获取最新的 promotionCenterList 值
  const state = store.getState();
  const isOpenCloudPromotion = state?.promotion?.promotionCenterList;
  const localPromotionConfig = state.selfConfig?.configMap?.id_52;

  // 如果已开通促销中心，或没开本地促销时直接返回
  if (isOpenCloudPromotion?.length > 0 || !localPromotionConfig) {
    return;
  }

  // 旧云促销
  const handleGetCloudPromotion = async () => {
    const res = await getCloudPromotion();
    if (res?.data?.data?.length > 0) {
      return res.data.data.filter((rule) => rule.deleted !== 'true');
    }
    return [];
  };

  // 本地促销数据处理
  const handleResolvePromotion = (promotion = [], promotionEnableType) => {
    if (!promotion?.length) return;
    // promotionEnableType 用于同时只有一种促销生效
    const enabledPromotion = promotion.filter(
      (each) =>
        each.enable &&
        filterItemByTime(each.timeInfo) &&
        each.activityType === promotionEnableType
    );
    if (enabledPromotion?.length > 0) {
      const enabledBuyGift = enabledPromotion.filter(
        (each) => each.activityType === 'buyGifts'
      );
      const enabledBuyDiscount = enabledPromotion.filter(
        (each) => each.activityType === 'buyDiscount'
      );
      const enabledOrderDiscount = enabledPromotion
        .filter((each) => each.activityType === 'orderDiscount')
        .sort(
          (a, b) =>
            Number(a.activityRule.satisfyPrice) -
            Number(b.activityRule.satisfyPrice)
        );
      const enabledExchangePurchase = enabledPromotion.filter(
        (each) => each.activityType === 'exchangePurchase'
      );
      setPromotion(enabledPromotion);
      setBuyGiftRule(enabledBuyGift);
      setBuyDiscountRule(enabledBuyDiscount);
      setOrderDiscount(enabledOrderDiscount);
      setExchangePurchaseRule(enabledExchangePurchase);
      store.dispatch(updatePromotionDealsInMenuGroup());
    }
  };

  // 获取本地促销
  const handleGetLocalPromotion = async () => {
    const res = await getMarginappFetchConfig();
    if (res.data.result.successful) {
      const list = res.data.marginAppConfigTypes;
      const obj = list.find((l) => l.product === 'KIOSKLITE');
      const arr = JSON.parse(obj.data);
      if (arr.promotion?.length && arr.promotionEnableType) {
        handleResolvePromotion(arr.promotion, arr.promotionEnableType);
      }
    }
  };

  const getPromotionProcedure = async () => {
    let cloudPromotion = null;
    try {
      cloudPromotion = await handleGetCloudPromotion();
      if (cloudPromotion.length) {
        // 过滤出在活动时间内以及激活状态的促销活动
        const validPromotion = cloudPromotion.filter(
          (rule) =>
            (rule.active === 'true' || rule.active === true) &&
            rule?.benefits?.length > 0 &&
            filterCloudPromotionByTime(rule.conditions)
        );
        setCloudPromotion(validPromotion);
      }
    } catch (e) {
      console.log(e);
    } finally {
      if (!cloudPromotion?.length) {
        await handleGetLocalPromotion();
      }
    }
  };

  await getPromotionProcedure();
};

export default getPromotionProcedure;
