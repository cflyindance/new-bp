import * as types from '../constants/actionTypes';

/**
 * AD 相关
 * */
export const setADOutletInfo = (data) => ({
  type: types.SET_AD_OUTLET_INFO,
  data,
});
export const setCommitId = (data) => ({ type: types.SET_COMMIT_ID, data });
export const setOrderRewardId = (data) => ({
  type: types.SET_ORDER_REWARD_ID,
  data,
});
export const setThirdPartyCommitId = (data) => ({
  type: types.SET_THIRD_PARTY_COMMIT_ID,
  data,
});

/**
 * CRM integration
 * */
export const setCRMIntegrationRewards = (data) => ({
  type: types.SET_CRM_INTEGRATION_REWARD,
  data,
});

export const setCustomerVouchers = (data) => ({
  type: types.SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS,
  data,
});

export const setSDKMeta = (data) => ({
  type: types.SET_SDK_META_DATA,
  data,
});

export const setCRMCustomerInfo = (data) => ({
  type: types.SET_CRM_CUSTOMER_INFO,
  data,
});

export const setNeedCommit = (data) => ({
  type: types.SET_NEED_COMMIT,
  data,
});

export const changeRewardModalVisible = (data) => ({
  type: types.CHANGE_REWARD_MODAL_VISIBLE,
  data,
});

export const setAssertListStatus = (data) => ({
  type: types.SET_AESERT_LIST_STATUS,
  data,
});
