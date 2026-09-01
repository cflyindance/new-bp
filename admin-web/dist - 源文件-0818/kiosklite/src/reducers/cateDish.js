import { combineReducers } from 'redux';
import { STANDARD_CATE_DISH, SET_ALL_MENU } from '@/constants/actionTypes';

const initState = {
  standardCateDish: [],
  allMenu: [],
};

function standardCateDish(state = initState.standardCateDish, action) {
  switch (action.type) {
    case STANDARD_CATE_DISH:
      return action.data;
    default:
      return state;
  }
}

function allMenu(state = initState.allMenu, action) {
  switch (action.type) {
    case SET_ALL_MENU:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({ standardCateDish, allMenu });
