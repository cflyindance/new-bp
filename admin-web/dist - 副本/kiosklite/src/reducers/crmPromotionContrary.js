import { combineReducers } from 'redux';
import {
  CHANGE_CRM_PROMOTION_CONTRARY_INFO,
  SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION,
} from '@/constants/actionTypes';

const initState = {
  // 促销crm互斥弹窗信息
  crmPromotionContraryInfo: {
    visible: false,
    content: undefined,
    type: undefined, // crm, promotion
  },
  // 是否暂时取消自动校验促销
  isPauseAutoValidatePromotion: false,
};

function crmPromotionContraryInfo(
  state = initState.crmPromotionContraryInfo,
  action
) {
  switch (action.type) {
    case CHANGE_CRM_PROMOTION_CONTRARY_INFO:
      return action.data;
    default:
      return state;
  }
}

function isPauseAutoValidatePromotion(
  state = initState.isPauseAutoValidatePromotion,
  action
) {
  switch (action.type) {
    case SET_IS_PAUSE_AUTO_VALIDATE_PROMOTION:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  crmPromotionContraryInfo,
  isPauseAutoValidatePromotion,
});
