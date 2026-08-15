import { SELECTEDBRAND, BRANDMENU } from '../constants/actionTypes';
import { combineReducers } from 'redux';

const initState = {
  selectedBrand: { id: null },
  brandMenu: [],
};

function selectedBrand(state = initState.selectedBrand, action) {
  switch (action.type) {
    case SELECTEDBRAND:
      return action.data;
    default:
      return state;
  }
}

function brandMenu(state = initState.brandMenu, action) {
  switch (action.type) {
    case BRANDMENU:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  selectedBrand,
  brandMenu,
});
