import './bootstrap/nativeBridgeGlobals';
import './bootstrap/viewport';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import 'array-flat-polyfill';
import { Provider } from 'react-redux';
import AntdWrapper from './component/AntdWrapper';
import App from './container/app';
import store from './reducers/store';
import { setKioskConfigUserId } from './actions';
import { getCookie, getUrlParams } from './utils';
import i18n from './assets/i18n/i18n';
import 'core-js/es/array/flat-map';
import {
  getNetworkStatus,
  getDeviceStatus,
  getTriposPayReady,
  getTriposPayFinish,
  handleReaderConnected,
  handleReaderDisconnected,
  handleBatteryChanged,
} from '@/utils/getAndroidWebkitStatus';
import { handleGetCreditCardInfoByIngenicoProgress } from '@/utils/ruaPaymentProgress';
import 'core-js/proposals/string-replace-all';
import 'core-js/proposals/array-find-from-last';
import 'core-js/full/global-this';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorBoundaryCom from '@/component/ErrorBoundary';
import { posFrontLog } from '@/api';
import { ThemeProvider } from '@/context/ThemeContext';

// 配置页面（configApp）
const urlMap = getUrlParams();
if (urlMap?.hasOwnProperty('language')) {
  let lang = 'en';
  if (urlMap.language === 'zh-cn') {
    lang = 'zh_cn';
  }
  i18n.changeLanguage(lang);
}
if (urlMap?.hasOwnProperty('userId')) {
  store.dispatch(setKioskConfigUserId(urlMap.userId));
}

// 渲染 React 应用的函数
const renderApp = () => {
  // 防止重复渲染
  if (window.__KIOSK_APP_RENDERED__) {
    return;
  }
  window.__KIOSK_APP_RENDERED__ = true;

  const handleError = async (error) => {
    let deviceName = localStorage.getItem('deviceName') || '未获取到设备名称';
    posFrontLog(
      `Kiosk App Error: ${error.name} - 设备名称(开发环境无设备名称): ${deviceName} - ${error.message}`
    );

    //错误情况下也隐藏 loading screen
    window.loadingState = true;
    if (window.hideInitialLoading) {
      window.hideInitialLoading();
    }
  };

  // 资源加载完成
  ReactDOM.render(
    <ErrorBoundary
      fallbackRender={(props) => <ErrorBoundaryCom {...props} />}
      onError={handleError}
    >
      <Provider store={store}>
        <ThemeProvider>
          <AntdWrapper>
            <HashRouter>
              <App />
            </HashRouter>
          </AntdWrapper>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>,
    document.querySelector('#root'),
    () => {
      // React 渲染完成回调
      setTimeout(() => {
        window.loadingState = true;
        if (window.hideInitialLoading) {
          window.hideInitialLoading();
        }
      }, 1000);
    }
  );
};

// 确保在文档完全加载后渲染，使用多种方式保证可靠性
if (
  document.readyState === 'complete' ||
  document.readyState === 'interactive'
) {
  // 如果文档已经加载完成或可交互，直接渲染
  renderApp();
} else {
  // 使用多种事件监听确保触发
  document.addEventListener('DOMContentLoaded', renderApp);
  window.addEventListener('load', renderApp);
}

window.androidWebkit = {
  handleCheckNetworkSpeed: getNetworkStatus,
};

window.jsBridgeManager = {
  dealStateChange: getDeviceStatus,
  onPromptUserForCard: getTriposPayReady,
  CardSwipeCompleted: getTriposPayFinish,
};

// rua 读卡进度通知（壳子主动回调）
window.CR_onGetCreditCardInfoByIngenicoProgress =
  handleGetCreditCardInfoByIngenicoProgress;

window.CR_onReaderConnected = handleReaderConnected;
window.CR_onReaderDisconnected = handleReaderDisconnected;
window.CR_onBatteryChanged = handleBatteryChanged;
