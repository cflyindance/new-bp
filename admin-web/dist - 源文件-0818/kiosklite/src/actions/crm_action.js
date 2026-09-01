import * as types from '../constants/actionTypes';

/**
 * CRM 相关
 * */
export const changeBarVisible = (data) => ({
  type: types.IS_SHOW_LOGIN_BAR,
  data,
});
export const setCRMMemberInfo = (data) => ({
  type: types.CRM_MEMBER_INFO,
  data,
});
export const setEarnRule = (data) => ({ type: types.CRM_EARN_RULE, data });
export const setMemberStatus = (data) => ({ type: types.IS_NEW_MEMBER, data });
export const changeLoginType = (data) => ({ type: types.LOGIN_TYPE, data });
export const setCRMAuthCodeVerified = (data) => ({
  type: types.SET_CRM_AUTH_CODE_VERIFIED,
  data,
});
export const setCRMAuthCodeVerifiedPhone = (data) => ({
  type: types.SET_CRM_AUTH_CODE_VERIFIED_PHONE,
  data,
});
export const changeFreeItem = (data) => ({
  type: types.CHANGE_FREE_ITEM,
  data,
});
export const setTempFreeItem = (data) => ({
  type: types.SET_TEMP_FREE_ITEM,
  data,
});
export const changeSelectedDiscount = (data) => ({
  type: types.SET_DISCOUNT,
  data,
});
export const changeIgnoreReward = (data) => ({
  type: types.IGNORE_REWARD,
  data,
});
export const setRewardRule = (rewardRule) => {
  return (dispatch) => {
    dispatch({
      type: types.CRM_REWARD_RULE,
      data: rewardRule,
    });
  };
};
export const setOnboardGiftRule = (data) => ({
  type: types.ONBOARD_GIFT_RULE,
  data,
});
export const setFreeItemMenuPosition = (data) => ({
  type: types.FREE_ITEM_MENU_POSITION,
  data,
});
export const setIsMemberOrderedBefore = (data) => ({
  type: types.IS_MEMBER_ORDERED_BEFORE,
  data,
});
export const setTempCampaign = (data) => ({
  type: types.SET_TEMP_CAMPAIGN,
  data,
});
