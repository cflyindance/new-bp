import { combineReducers } from 'redux';
import {
  SET_IMG,
  SET_LOGO,
  SET_BANNER,
  SET_SHOW_BANNER,
  SET_BANNERPRO,
  SET_SHOW_BANNERPRO,
  SET_SHOW_LOGINGUIDEDIALOG,
  SET_SHOW_WAITING_TIME_MODAL,
  SET_SCREENSAVER,
} from '@/constants/actionTypes';

const initState = {
  bgImg: '',
  logoImg: '',
  banner: '',
  // 展示 banner 广告
  isShowBanner: true,
  bannerPro: '',
  isShowBannerPro: true,
  isShowLoginGuideDialog: true,
  isShowWaitingTimeModal: true,
  isShowScreensaver: false,
};

function bgImg(state = initState.bgImg, action) {
  switch (action.type) {
    case SET_IMG:
      return action.data;
    default:
      return state;
  }
}

function logoImg(state = initState.logoImg, action) {
  switch (action.type) {
    case SET_LOGO:
      return action.data;
    default:
      return state;
  }
}

function banner(state = initState.banner, action) {
  switch (action.type) {
    case SET_BANNER:
      return action.data;
    default:
      return state;
  }
}

function isShowBanner(state = initState.isShowBanner, action) {
  switch (action.type) {
    case SET_SHOW_BANNER:
      return action.data;
    default:
      return state;
  }
}

function bannerPro(state = initState.bannerPro, action) {
  switch (action.type) {
    case SET_BANNERPRO:
      return action.data;
    default:
      return state;
  }
}

function isShowBannerPro(state = initState.isShowBannerPro, action) {
  switch (action.type) {
    case SET_SHOW_BANNERPRO:
      return action.data;
    default:
      return state;
  }
}

function isShowWaitingTimeModal(
  state = initState.isShowWaitingTimeModal,
  action
) {
  switch (action.type) {
    case SET_SHOW_WAITING_TIME_MODAL:
      return action.data;
    default:
      return state;
  }
}

function isShowLoginGuideDialog(
  state = initState.isShowLoginGuideDialog,
  action
) {
  switch (action.type) {
    case SET_SHOW_LOGINGUIDEDIALOG:
      return action.data;
    default:
      return state;
  }
}

function isShowScreensaver(state = initState.isShowScreensaver, action) {
  switch (action.type) {
    case SET_SCREENSAVER:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  bgImg,
  logoImg,
  banner,
  isShowBanner,
  bannerPro,
  isShowBannerPro,
  isShowLoginGuideDialog,
  isShowWaitingTimeModal,
  isShowScreensaver,
});
