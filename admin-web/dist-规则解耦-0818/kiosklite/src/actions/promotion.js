import * as types from '../constants/actionTypes';
import { isHasCRMCampaignFn } from '@/utils/CRMIntegration/crmPromotionContrary';

/**
 * 促销相关
 * */
export const setPromotion = (data) => ({ type: types.SET_PROMOTION, data });
export const setBuyGifts = (data) => ({ type: types.SET_BUY_GIFTS, data });
export const setSatisfyRules = (data) => ({
  type: types.SET_SATISFY_RULES,
  data,
});
export const setBuyGiftRule = (data) => ({
  type: types.SET_BUY_GIFTS_RULES,
  data,
});
export const setBuyDiscountRule = (data) => ({
  type: types.SET_BUY_DISCOUNT_RULES,
  data,
});
export const setExchangePurchaseRule = (data) => ({
  type: types.SET_EXCHANGE_PURCHASE_RULES,
  data,
});
export const setOrderDiscount = (data) => ({
  type: types.SET_ORDER_DISCOUNT,
  data,
});
export const setPromotionCode = (data) => ({
  type: types.SET_PROMO_CODE,
  data,
});

/**
 * 云 Promotion
 * */
export const setCloudPromotion = (data) => ({
  type: types.SET_CLOUD_PROMOTION,
  data,
});

/**
 * 促销中台
 * */
export const setCloudPromotionList = (data) => ({
  type: types.SET_CLOUD_PROMOTION_LIST,
  data,
});
export const setCloudPromotionMetas = (data) => ({
  type: types.SET_CLOUD_PROMOTION_METAS,
  data,
});
export const changeCloudPromotionStatus = (data) => ({
  type: types.CHANGE_CLOUD_PROMOTION_STATUS,
  data,
});
export const setItemMatchCloudPromotion = (data) => ({
  type: types.SET_ITEM_MATCH_CLOUD_PROMOTION,
  data,
});
export const setItemValidPromotion = (data) => ({
  type: types.SET_ITEM_VALID_PROMOTION,
  data,
});
export const changeCrmPromotionContraryInfo = (data) => ({
  type: types.CHANGE_CRM_PROMOTION_CONTRARY_INFO,
  data,
});
export const setIsPauseAutoValidatePromotion = (data) => ({
  type: types.SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION,
  data,
});

export const changePromotionStatusAfterCheck = (item) => {
  return (dispatch, getState) => {
    if (item.isFreeItem || item.isCRMFreeItem || item.isCRMIntegrationFreeItem)
      return;
    const { selectedDiscount, selectedFreeItem } = getState().crm;
    const { itemList } = getState().currentOrder;
    const isCurrentOrderHasCrmCampaign = isHasCRMCampaignFn({
      itemList,
      selectedFreeItem,
      selectedDiscount,
    });
    if (!isCurrentOrderHasCrmCampaign) {
      dispatch({
        type: types.CHANGE_SKIP_PROMOTION_CALCULATION_STATUS,
        data: false,
      });
    }
  };
};
