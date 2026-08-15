import store from '../reducers/store';
import {
  setNetWorkStatus,
  setTriposPayReady,
  setTriposPayFinish,
  setMobyDeviceInfo,
  setMobyDeviceLinkStatus,
} from '@/actions';
import { getCookie } from '@/utils';
import { setTerminal, posFrontLog } from '@/api';
import { isRuaPaymentActive } from '@/utils/ruaPaymentProgress';
import {
  isOnPaymentFlowPage,
  navigateToConnectionError,
} from '@/utils/navigateToConnectionError';
import {
  hasMoreCardInputCapabilities,
  isTriposCardInputMode,
} from '@/constants/triposCardInputMode';

let prevNetworkStatusSnapshot = '';
let previousTriposCardInputMode = '';
let hasTriposCardInputModeBaseline = false;

// 网络状态
// {rtt: 25, up: '496.00 B/s', down: '4.01 KB/s'}
export const getNetworkStatus = (info) => {
  const nextNetworkStatusSnapshot = JSON.stringify(info ?? {});
  const hasNetworkStatusChanged =
    prevNetworkStatusSnapshot !== nextNetworkStatusSnapshot;
  const isBadNetworkStatus = info?.rtt < 0 || info?.rtt > 400 || !info?.rtt;

  if (isBadNetworkStatus && hasNetworkStatusChanged) {
    posFrontLog(`getNetworkStatus:[网络状态] ${JSON.stringify(info)}`);
  }

  prevNetworkStatusSnapshot = nextNetworkStatusSnapshot;
  store.dispatch(setNetWorkStatus(info));
};

// moby卡机连接状态-用来记录pos蓝牙支付设备状态[安卓]
// {"connected":false,"serialNumber":"24363RPK0371518","modelName":"T01","name":"tb8788p1_64_bsp_k419","version":"13","directExpress":boolean }
export const getDeviceStatus = async (info) => {
  const data = JSON.parse(info);
  const prevLinkStatus = store.getState().sysCookie.mobyDeviceLinkStatus;
  const nextLinkStatus = data?.connected ? 1 : 0;
  if (prevLinkStatus === nextLinkStatus && !data.connected) return;

  posFrontLog(`getDeviceStatus:[moby设备信息] ${info}`);
  // 断连或重新连接时，更新电量信息
  store.dispatch(setMobyDeviceInfo(data));
  // 断连或重新连接时，更新连接状态
  store.dispatch(setMobyDeviceLinkStatus(nextLinkStatus));

  // 卡机由已连接变为断联时，仅在支付流程页直接跳转报错页
  if (prevLinkStatus === 1 && !data.connected && isOnPaymentFlowPage()) {
    navigateToConnectionError({ code: '003', pay: 0 });
    return;
  }

  if (!data.serialNumber) return;

  const deviceData = {
    serialNumber: data.serialNumber,
    licenseName: getCookie('kioskLicense'),
    tabletName: data.name,
    productLine: 'KIOSKLITE',
    licenseType: 'KIOSKLITE',
    connected: data.connected,
    tabletVersion: data.version,
    directExpress: data?.directExpress, //false或无此字段则仍走tripos
  };
  try {
    getDeviceInfo().then((res) => {
      deviceData.appVersion = res.body.appVersion;
      setTerminal(deviceData);
    });
  } catch (e) {
    setTerminal(deviceData);
  }
};

// moby读卡器连接状态，RUA或ios来记录pos蓝牙支付设备状态
// 返回info：appVersion: "2.9.3",battery: 100,directExpress: false,modelName: "iPad mini 6",sn: "25340RPK0571643",tabletName: "iPad",tabletSerialNumber: "2544B889-F485-44B6-B4E060C4D8F72",tabletVersion: "26.5",terminalName: "M0B55-K0571643"
export const handleReaderConnected = async (info) => {
  const data = typeof info === 'string' ? JSON.parse(info) : info || {};
  const deviceInfo = {
    ...data,
    connected: true,
    serialNumber: data.sn,
    name: data.tabletSerialNumber,
    version: data.tabletVersion,
    batteryLevel: data.battery,
  };

  posFrontLog(
    `CR_onReaderConnected:[moby设备信息] ${JSON.stringify(deviceInfo)}`
  );
  store.dispatch(setMobyDeviceInfo(deviceInfo));
  store.dispatch(setMobyDeviceLinkStatus(1));

  if (!deviceInfo.serialNumber) return;

  setTerminal({
    serialNumber: deviceInfo.serialNumber,
    licenseName: getCookie('kioskLicense'),
    tabletName: deviceInfo.name,
    productLine: 'KIOSKLITE',
    licenseType: 'KIOSKLITE',
    connected: true,
    tabletVersion: deviceInfo.version,
    directExpress: deviceInfo.directExpress,
    appVersion: deviceInfo.appVersion,
  });
};

export const handleReaderDisconnected = () => {
  const state = store.getState().sysCookie;
  const prevLinkStatus = state.mobyDeviceLinkStatus;
  if (prevLinkStatus === 0) return;

  const deviceInfo = {
    ...state.mobyDeviceInfo,
    connected: false,
  };
  posFrontLog(
    `CR_onReaderDisconnected:[moby设备断联] ${JSON.stringify(deviceInfo)}`
  );
  store.dispatch(setMobyDeviceInfo(deviceInfo));
  store.dispatch(setMobyDeviceLinkStatus(0));

  if (deviceInfo.serialNumber) {
    setTerminal({
      serialNumber: deviceInfo.serialNumber,
      licenseName: getCookie('kioskLicense'),
      tabletName: deviceInfo.name,
      productLine: 'KIOSKLITE',
      licenseType: 'KIOSKLITE',
      connected: false,
      tabletVersion: deviceInfo.version,
      directExpress: deviceInfo.directExpress,
      appVersion: deviceInfo.appVersion,
    });
  }

  if (prevLinkStatus === 1 && isOnPaymentFlowPage()) {
    navigateToConnectionError({ code: '003', pay: 0 });
  }
};

export const handleBatteryChanged = (info) => {
  const data = typeof info === 'string' ? JSON.parse(info) : info || {};
  if (data.battery === undefined || data.battery === null) return;

  const deviceInfo = {
    ...store.getState().sysCookie.mobyDeviceInfo,
    battery: data.battery,
    batteryLevel: data.battery,
  };
  store.dispatch(setMobyDeviceInfo(deviceInfo));
};

// tripos 准备就绪 可以开始刷卡
export const getTriposPayReady = (signalStr) => {
  if (isRuaPaymentActive()) return;
  posFrontLog(`getTriposPayReady 准备就绪 可以开始刷卡 ${signalStr}`);

  const { triposPayReady } = store.getState().sysCookie;
  if (!isTriposCardInputMode(signalStr)) {
    if (!triposPayReady) {
      hasTriposCardInputModeBaseline = false;
    }
    store.dispatch(setTriposPayReady(true));
    return;
  }

  if (!triposPayReady || !hasTriposCardInputModeBaseline) {
    previousTriposCardInputMode = signalStr;
    hasTriposCardInputModeBaseline = true;
    store.dispatch(setTriposPayReady(true));
    return;
  }

  if (
    signalStr === previousTriposCardInputMode ||
    hasMoreCardInputCapabilities(previousTriposCardInputMode, signalStr)
  ) {
    previousTriposCardInputMode = signalStr;
    return;
  }

  previousTriposCardInputMode = signalStr;
  navigateToConnectionError({
    code: '005',
    pay: 0,
    triposCardInputMode: signalStr,
  });
};

// tripos 刷卡动作完成 [只给信号，无具体值]
export const getTriposPayFinish = () => {
  if (isRuaPaymentActive()) return;
  posFrontLog(`getTriposPayFinish 刷卡动作完成`);
  store.dispatch(setTriposPayFinish(true));
};
