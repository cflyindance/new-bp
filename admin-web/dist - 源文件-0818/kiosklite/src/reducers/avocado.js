import { combineReducers } from 'redux';
import {
  SET_AD_OUTLET_INFO,
  SET_COMMIT_ID,
  SET_CRM_INTEGRATION_REWARD,
  SET_DOLLAR_PERCENTAGE_VOUCHERS,
  SET_DOLLAR_VALUE_VOUCHERS,
  SET_ITEM_VOUCHERS,
  SET_LOYALTY,
  SET_MEMBERSHIP,
  SET_MERCHANT_CAMPAIGN_LIST,
  SET_ORDER_REWARD_ID,
  SET_THIRD_PARTY_COMMIT_ID,
  SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS,
  SET_SDK_META_DATA,
  SET_CRM_CUSTOMER_INFO,
  SET_NEED_COMMIT,
  CHANGE_REWARD_MODAL_VISIBLE,
  SET_AESERT_LIST_STATUS,
} from '@/constants/actionTypes';

const initState = {
  outletInfo: null,
  merchantCampaignList: [],
  memberShip: null,
  loyalty: null,
  itemVouchers: [],
  dollarValueVouchers: [],
  dollarPercentageVouchers: [],
  transactionCommitId: null,
  orderRewardId: null,
  thirdPartyCrmCommitId: null,

  // crm-integration
  rewards: null,
  vouchers: null,
  metaData: null,
  crmCustomerInfo: null,
  needCommit: false,
  rewardModalVisible: false,
  hasAssertList: false,
};

function outletInfo(state = initState.outletInfo, action) {
  switch (action.type) {
    case SET_AD_OUTLET_INFO:
      return action.data;
    default:
      return state;
  }
}

function merchantCampaignList(state = initState.merchantCampaignList, action) {
  switch (action.type) {
    case SET_MERCHANT_CAMPAIGN_LIST:
      return action.data;
    default:
      return state;
  }
}

function memberShip(state = initState.memberShip, action) {
  switch (action.type) {
    case SET_MEMBERSHIP:
      return action.data;
    default:
      return state;
  }
}

function loyalty(state = initState.loyalty, action) {
  switch (action.type) {
    case SET_LOYALTY:
      return action.data;
    default:
      return state;
  }
}

function itemVouchers(state = initState.itemVouchers, action) {
  switch (action.type) {
    case SET_ITEM_VOUCHERS:
      return action.data;
    default:
      return state;
  }
}

function dollarValueVouchers(state = initState.dollarValueVouchers, action) {
  switch (action.type) {
    case SET_DOLLAR_VALUE_VOUCHERS:
      return action.data;
    default:
      return state;
  }
}

function dollarPercentageVouchers(
  state = initState.dollarPercentageVouchers,
  action
) {
  switch (action.type) {
    case SET_DOLLAR_PERCENTAGE_VOUCHERS:
      return action.data;
    default:
      return state;
  }
}

function transactionCommitId(state = initState.transactionCommitId, action) {
  switch (action.type) {
    case SET_COMMIT_ID:
      return action.data;
    default:
      return state;
  }
}

function orderRewardId(state = initState.orderRewardId, action) {
  switch (action.type) {
    case SET_ORDER_REWARD_ID:
      return action.data;
    default:
      return state;
  }
}

function thirdPartyCrmCommitId(
  state = initState.thirdPartyCrmCommitId,
  action
) {
  switch (action.type) {
    case SET_THIRD_PARTY_COMMIT_ID:
      return action.data;
    default:
      return state;
  }
}

// crm integration rewards
function rewards(state = initState.rewards, action) {
  switch (action.type) {
    case SET_CRM_INTEGRATION_REWARD:
      return action.data;
    default:
      return state;
  }
}

function vouchers(state = initState.vouchers, action) {
  switch (action.type) {
    case SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS:
      return action.data;
    default:
      return state;
  }
}

function metaData(state = initState.metaData, action) {
  switch (action.type) {
    case SET_SDK_META_DATA:
      return action.data;
    default:
      return state;
  }
}

function crmCustomerInfo(state = initState.crmCustomerInfo, action) {
  switch (action.type) {
    case SET_CRM_CUSTOMER_INFO:
      return action.data;
    default:
      return state;
  }
}

function needCommit(state = initState.needCommit, action) {
  switch (action.type) {
    case SET_NEED_COMMIT:
      return action.data;
    default:
      return state;
  }
}

function rewardModalVisible(state = initState.rewardModalVisible, action) {
  switch (action.type) {
    case CHANGE_REWARD_MODAL_VISIBLE:
      return action.data;
    default:
      return state;
  }
}

function hasAssertList(state = initState.hasAssertList, action) {
  switch (action.type) {
    case SET_AESERT_LIST_STATUS:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  outletInfo,
  merchantCampaignList,
  memberShip,
  loyalty,
  itemVouchers,
  dollarValueVouchers,
  dollarPercentageVouchers,
  transactionCommitId,
  orderRewardId,
  thirdPartyCrmCommitId,
  rewards,
  vouchers,
  metaData,
  crmCustomerInfo,
  needCommit,
  rewardModalVisible,
  hasAssertList,
});
