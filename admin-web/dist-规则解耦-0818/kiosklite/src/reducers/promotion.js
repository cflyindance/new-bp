import { combineReducers } from 'redux';
import {
  SET_BUY_DISCOUNT_RULES,
  SET_BUY_GIFTS,
  SET_BUY_GIFTS_RULES,
  SET_EXCHANGE_PURCHASE_RULES,
  SET_ORDER_DISCOUNT,
  SET_PROMOTION,
  SET_SATISFY_RULES,
  SET_CLOUD_PROMOTION,
  RESET_PROMOTION,
  CHANGE_SKIP_PROMOTION_CALCULATION_STATUS,
  SET_PROMO_CODE,
  SET_CLOUD_PROMOTION_LIST,
  SET_CLOUD_PROMOTION_METAS,
  CHANGE_CLOUD_PROMOTION_STATUS,
  SET_ITEM_MATCH_CLOUD_PROMOTION,
  SET_ITEM_VALID_PROMOTION,
  RECORD_KIOSK_DISCOUNT_PROMOTION,
} from '@/constants/actionTypes';

const initState = {
  // 所有promotion 信息
  promotionList: [],
  // 赠菜规则
  buyGiftRule: [],
  // 赠送菜信息
  buyGifts: [],
  // 满足赠送菜的规则
  satisfyRules: [],
  // 买赠规则
  buyDiscountRule: [],
  // 加价换购规则
  exchangePurchaseRule: [],
  // 订单买折规则
  orderDiscount: [],
  // 云Promotion
  cloudPromotion: [],
  // 是否跳过promotion计算, 用于CRM活动互斥
  isSkipPromotionCalculation: false,
  // 参与活动的促销码
  promotionCode: '',
  // 促销中台列表
  promotionCenterList: null,
  // 促销中台metas
  promotionCenterMetas: null,
  // 是否开通促销中台
  isOpenCloudPromotion: false,
  // 菜品是否有促销
  itemMatchCloudPromotion: null,
  // 订单下可用促销
  itemValidPromotion: null,
  // KIOSK本地折扣促销生效信息
  kioskLocalDiscountPromotion: null,
};

function promotionList(state = initState.promotionList, action) {
  switch (action.type) {
    case SET_PROMOTION:
      return action.data;
    case RESET_PROMOTION:
      return initState.promotionList;
    default:
      return state;
  }
}

function buyGifts(state = initState.buyGifts, action) {
  switch (action.type) {
    case SET_BUY_GIFTS:
      return action.data;
    case RESET_PROMOTION:
      return initState.buyGifts;
    default:
      return state;
  }
}

function satisfyRules(state = initState.satisfyRules, action) {
  switch (action.type) {
    case SET_SATISFY_RULES:
      return action.data;
    case RESET_PROMOTION:
      return initState.satisfyRules;
    default:
      return state;
  }
}

function buyGiftRule(state = initState.buyGiftRule, action) {
  switch (action.type) {
    case SET_BUY_GIFTS_RULES:
      return action.data;
    case RESET_PROMOTION:
      return initState.buyGiftRule;
    default:
      return state;
  }
}

function buyDiscountRule(state = initState.buyDiscountRule, action) {
  switch (action.type) {
    case SET_BUY_DISCOUNT_RULES:
      return action.data;
    case RESET_PROMOTION:
      return initState.buyDiscountRule;
    default:
      return state;
  }
}

function exchangePurchaseRule(state = initState.exchangePurchaseRule, action) {
  switch (action.type) {
    case SET_EXCHANGE_PURCHASE_RULES:
      return action.data;
    case RESET_PROMOTION:
      return initState.exchangePurchaseRule;
    default:
      return state;
  }
}

function orderDiscount(state = initState.orderDiscount, action) {
  switch (action.type) {
    case SET_ORDER_DISCOUNT:
      return action.data;
    case RESET_PROMOTION:
      return initState.orderDiscount;
    default:
      return state;
  }
}

function cloudPromotion(state = initState.cloudPromotion, action) {
  switch (action.type) {
    case SET_CLOUD_PROMOTION:
      return action.data;
    case RESET_PROMOTION:
      return initState.cloudPromotion;
    default:
      return state;
  }
}

function isSkipPromotionCalculation(
  state = initState.isSkipPromotionCalculation,
  action
) {
  switch (action.type) {
    case CHANGE_SKIP_PROMOTION_CALCULATION_STATUS:
      return action.data;
    default:
      return state;
  }
}

function promotionCode(state = initState.promotionCode, action) {
  switch (action.type) {
    case SET_PROMO_CODE:
      return action.data;
    default:
      return state;
  }
}

function promotionCenterList(state = initState.promotionCenterList, action) {
  switch (action.type) {
    case SET_CLOUD_PROMOTION_LIST:
      return action.data;
    default:
      return state;
  }
}

function promotionCenterMetas(state = initState.promotionCenterMetas, action) {
  switch (action.type) {
    case SET_CLOUD_PROMOTION_METAS:
      return action.data;
    default:
      return state;
  }
}

function isOpenCloudPromotion(state = initState.isOpenCloudPromotion, action) {
  switch (action.type) {
    case CHANGE_CLOUD_PROMOTION_STATUS:
      return action.data;
    default:
      return state;
  }
}

function itemMatchCloudPromotion(
  state = initState.itemMatchCloudPromotion,
  action
) {
  switch (action.type) {
    case SET_ITEM_MATCH_CLOUD_PROMOTION:
      return action.data;
    default:
      return state;
  }
}

function itemValidPromotion(state = initState.itemValidPromotion, action) {
  switch (action.type) {
    case SET_ITEM_VALID_PROMOTION:
      return action.data;
    default:
      return state;
  }
}

function kioskLocalDiscountPromotion(
  state = initState.kioskLocalDiscountPromotion,
  action
) {
  switch (action.type) {
    case RECORD_KIOSK_DISCOUNT_PROMOTION:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  promotionList,
  buyGifts,
  satisfyRules,
  buyGiftRule,
  buyDiscountRule,
  exchangePurchaseRule,
  orderDiscount,
  cloudPromotion,
  isSkipPromotionCalculation,
  promotionCode,
  promotionCenterList,
  promotionCenterMetas,
  isOpenCloudPromotion,
  itemMatchCloudPromotion,
  itemValidPromotion,
  kioskLocalDiscountPromotion,
});
