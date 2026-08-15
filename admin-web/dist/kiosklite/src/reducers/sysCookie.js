import { combineReducers } from 'redux';
import {
  SETKIOSKCONFIGUSERID,
  SYSTEM_LICENSE,
  SET_NETWORKTATUS,
  MOBY_DEVICE_LINK_STATUS,
  MOBY_DEVICE_INFO,
  TRIPOS_PAY_READY,
  TRIPOS_PAY_FINISH,
} from '@/constants/actionTypes';

const initState = {
  kioskConfigUserId: '',
  systemLicense: [],
  networkStatus: { rtt: 0 },
  mobyDeviceLinkStatus: null,
  mobyDeviceInfo: {},
  triposPayReady: false,
  triposPayFinish: false,
};

function kioskConfigUserId(state = initState.kioskConfigUserId, action) {
  switch (action.type) {
    case SETKIOSKCONFIGUSERID:
      return action.data;
    default:
      return state;
  }
}

function systemLicense(state = initState.systemLicense, action) {
  switch (action.type) {
    case SYSTEM_LICENSE:
      return action.data;
    default:
      return state;
  }
}

function networkStatus(state = initState.networkStatus, action) {
  switch (action.type) {
    case SET_NETWORKTATUS:
      return action.data;
    default:
      return state;
  }
}

function mobyDeviceLinkStatus(state = initState.mobyDeviceLinkStatus, action) {
  switch (action.type) {
    case MOBY_DEVICE_LINK_STATUS:
      return action.data;
    default:
      return state;
  }
}

function mobyDeviceInfo(state = initState.mobyDeviceInfo, action) {
  switch (action.type) {
    case MOBY_DEVICE_INFO:
      return action.data;
    default:
      return state;
  }
}

function triposPayReady(state = initState.triposPayReady, action) {
  switch (action.type) {
    case TRIPOS_PAY_READY:
      return action.data;
    default:
      return state;
  }
}

function triposPayFinish(state = initState.triposPayFinish, action) {
  switch (action.type) {
    case TRIPOS_PAY_FINISH:
      return action.data;
    default:
      return state;
  }
}

export default combineReducers({
  kioskConfigUserId,
  systemLicense,
  networkStatus,
  mobyDeviceLinkStatus,
  mobyDeviceInfo,
  triposPayReady,
  triposPayFinish,
});
