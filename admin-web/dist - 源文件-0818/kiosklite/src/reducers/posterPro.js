import { combineReducers } from 'redux';
import {
  CHANGE_POSTER_STATUS,
  SET_CURRENT_BLOCK,
  SET_CURRENT_PAGE,
  SET_KIOSK_MENU_TREE,
  SET_POSTER_DATA,
} from '@/constants/actionTypes';
import { ASPECT_RATIO } from '@/constants/posterPro';

const initState = {
  status: 'enabled', //disabled 停用启用标识
  // 全量数据
  posterData: [], //  {direction: 'horizontal'}, 方向
  // 单个组件数据
  currentBlock: null,
  // 单页数据
  currentPageData: null,
  version: '0.0.1',
  aspectRatio: ASPECT_RATIO,
  kioskMenuTree: [],
};

function posterData(state = initState.posterData, action) {
  switch (action.type) {
    case SET_POSTER_DATA:
      return action.data;
    default:
      return state;
  }
}

function currentBlock(state = initState.currentBlock, action) {
  switch (action.type) {
    case SET_CURRENT_BLOCK:
      return action.data;
    default:
      return state;
  }
}

function currentPageData(state = initState.currentPageData, action) {
  switch (action.type) {
    case SET_CURRENT_PAGE:
      return action.data;
    default:
      return state;
  }
}

function status(state = initState.status, action) {
  switch (action.type) {
    case CHANGE_POSTER_STATUS:
      return action.data;
    default:
      return state;
  }
}

function kioskMenuTree(state = initState.kioskMenuTree, action) {
  switch (action.type) {
    case SET_KIOSK_MENU_TREE:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  posterData,
  currentBlock,
  currentPageData,
  status,
  kioskMenuTree,
});
