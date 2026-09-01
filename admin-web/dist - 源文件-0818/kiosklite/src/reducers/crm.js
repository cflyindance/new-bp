import {
  CHANGE_FREE_ITEM,
  CRM_EARN_RULE,
  CRM_MEMBER_INFO,
  IGNORE_REWARD,
  IS_NEW_MEMBER,
  IS_SHOW_LOGIN_BAR,
  LOGIN_TYPE,
  SET_CRM_AUTH_CODE_VERIFIED,
  SET_CRM_AUTH_CODE_VERIFIED_PHONE,
  SET_DISCOUNT,
  SET_TEMP_FREE_ITEM,
  CRM_REWARD_RULE,
  ONBOARD_GIFT_RULE,
  FREE_ITEM_MENU_POSITION,
  IS_MEMBER_ORDERED_BEFORE,
  SET_TEMP_CAMPAIGN,
  SET_SELECTED_SPECIAL_ITEM,
} from '@/constants/actionTypes';
import { combineReducers } from 'redux';

const initState = {
  isShowLoginBar: false,
  memberCRMInfo: {},
  earningRule: {},
  isNewMember: true,
  loginType: null,
  isCRMAuthCodeVerified: false,
  crmAuthCodeVerifiedPhone: '',
  selectedFreeItem: [],
  tempFreeItem: {},
  selectedDiscount: {},
  isIgnoreReward: false,
  rewardRule: [],
  onboardGiftRule: {},
  freeItemMenuPosition: 0,
  isMemberOrderedBefore: true, // 默认下过单，避免没有接口的pos版本导致可以持续享受首单折扣
  // 用于活动弹窗暂存活动
  tempCampaign: null,
};

function isShowLoginBar(state = initState.isShowLoginBar, action) {
  switch (action.type) {
    case IS_SHOW_LOGIN_BAR:
      return action.data;
    default:
      return state;
  }
}

function memberCRMInfo(state = initState.memberCRMInfo, action) {
  switch (action.type) {
    case CRM_MEMBER_INFO:
      return action.data;
    default:
      return state;
  }
}

function earningRule(state = initState.earningRule, action) {
  switch (action.type) {
    case CRM_EARN_RULE:
      return action.data;
    default:
      return state;
  }
}

function isNewMember(state = initState.isNewMember, action) {
  switch (action.type) {
    case IS_NEW_MEMBER:
      return action.data;
    default:
      return state;
  }
}

function loginType(state = initState.loginType, action) {
  switch (action.type) {
    case LOGIN_TYPE:
      return action.data;
    default:
      return state;
  }
}

function isCRMAuthCodeVerified(
  state = initState.isCRMAuthCodeVerified,
  action
) {
  switch (action.type) {
    case SET_CRM_AUTH_CODE_VERIFIED:
      return action.data;
    default:
      return state;
  }
}

function crmAuthCodeVerifiedPhone(
  state = initState.crmAuthCodeVerifiedPhone,
  action
) {
  switch (action.type) {
    case SET_CRM_AUTH_CODE_VERIFIED_PHONE:
      return action.data;
    case SET_CRM_AUTH_CODE_VERIFIED:
      return action.data ? state : initState.crmAuthCodeVerifiedPhone;
    default:
      return state;
  }
}

function selectedFreeItem(state = initState.selectedFreeItem, action) {
  switch (action.type) {
    case CHANGE_FREE_ITEM:
      return action.data;
    default:
      return state;
  }
}

function tempFreeItem(state = initState.tempFreeItem, action) {
  switch (action.type) {
    case SET_TEMP_FREE_ITEM:
      return action.data;
    default:
      return state;
  }
}

function selectedDiscount(state = initState.selectedDiscount, action) {
  switch (action.type) {
    case SET_DISCOUNT:
      return action.data;
    default:
      return state;
  }
}

function isIgnoreReward(state = initState.isIgnoreReward, action) {
  switch (action.type) {
    case IGNORE_REWARD:
      return action.data;
    default:
      return state;
  }
}

function rewardRule(state = initState.rewardRule, action) {
  switch (action.type) {
    case CRM_REWARD_RULE:
      return action.data;
    default:
      return state;
  }
}

function onboardGiftRule(state = initState.onboardGiftRule, action) {
  switch (action.type) {
    case ONBOARD_GIFT_RULE:
      return action.data;
    default:
      return state;
  }
}

function freeItemMenuPosition(state = initState.freeItemMenuPosition, action) {
  switch (action.type) {
    case FREE_ITEM_MENU_POSITION:
      return action.data;
    default:
      return state;
  }
}

function isMemberOrderedBefore(
  state = initState.isMemberOrderedBefore,
  action
) {
  switch (action.type) {
    case IS_MEMBER_ORDERED_BEFORE:
      return action.data;
    default:
      return state;
  }
}

function tempCampaign(state = initState.tempCampaign, action) {
  switch (action.type) {
    case SET_TEMP_CAMPAIGN:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  isShowLoginBar,
  memberCRMInfo,
  earningRule,
  isNewMember,
  loginType,
  isCRMAuthCodeVerified,
  crmAuthCodeVerifiedPhone,
  selectedFreeItem,
  tempFreeItem,
  selectedDiscount,
  isIgnoreReward,
  rewardRule,
  onboardGiftRule,
  freeItemMenuPosition,
  isMemberOrderedBefore,
  tempCampaign,
});
