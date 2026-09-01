import { combineReducers } from 'redux';
import { PP_WS, ISMENUUPDATED, MAKINGCUPNUM } from '../constants/actionTypes';

const initState = {
  isConnectWs: false,
  isMenuUpdated: false,
  makingCupNum: null,
};

function isConnectWs(state = initState.isConnectWs, action) {
  switch (action.type) {
    case PP_WS:
      return action.data;
    default:
      return state;
  }
}

function isMenuUpdated(state = initState.isMenuUpdated, action) {
  switch (action.type) {
    case ISMENUUPDATED:
      return action.data;
    default:
      return state;
  }
}

function makingCupNum(state = initState.makingCupNum, action) {
  switch (action.type) {
    case MAKINGCUPNUM:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  isConnectWs,
  isMenuUpdated,
  makingCupNum,
});
