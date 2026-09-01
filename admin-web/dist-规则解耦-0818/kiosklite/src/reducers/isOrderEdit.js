import { combineReducers } from 'redux';
import {
  IS_ORDER_EDIT,
  SETEDITCOMBOQTY,
  SETISREORDERFLAG,
  SETCATEYPAGEDOMTOP,
  SETORDERPAGEDOMTOP,
  MENULOAD,
  SETVLISTSCROLLHEIGHT,
} from '../constants/actionTypes';

const initState = {
  isOrderEdit: false,
  editComboQty: 1,
  isReorderFlag: false,
  cateyPageDomTop: 0,
  orderPageDomTop: 0,
  isUpdateMenu: false,
  vListScrollHeight: 0,
};

function isOrderEdit(state = initState.isOrderEdit, action) {
  switch (action.type) {
    case IS_ORDER_EDIT:
      return action.isOrderEdit;
    default:
      return state;
  }
}

function editComboQty(state = initState.editComboQty, action) {
  switch (action.type) {
    case SETEDITCOMBOQTY:
      return action.data;
    default:
      return state;
  }
}

function isReorderFlag(state = initState.isReorderFlag, action) {
  switch (action.type) {
    case SETISREORDERFLAG:
      return action.data;
    default:
      return state;
  }
}

function cateyPageDomTop(state = initState.cateyPageDomTop, action) {
  switch (action.type) {
    case SETCATEYPAGEDOMTOP:
      return action.data;
    default:
      return state;
  }
}

function orderPageDomTop(state = initState.orderPageDomTop, action) {
  switch (action.type) {
    case SETORDERPAGEDOMTOP:
      return action.data;
    default:
      return state;
  }
}

function isUpdateMenu(state = initState.isUpdateMenu, action) {
  switch (action.type) {
    case MENULOAD:
      return action.data;
    default:
      return state;
  }
}

// 记录vList滚动高度
function vListScrollHeight(state = initState.vListScrollHeight, action) {
  switch (action.type) {
    case SETVLISTSCROLLHEIGHT:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  isOrderEdit,
  editComboQty,
  isReorderFlag,
  orderPageDomTop,
  cateyPageDomTop,
  isUpdateMenu,
  vListScrollHeight,
});
