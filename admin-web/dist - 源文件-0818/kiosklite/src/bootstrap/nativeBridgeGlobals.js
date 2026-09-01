'use strict';

// 通过 WebViewJSBridge 调用 getDeviceInfo
function getDeviceInfo() {
  'use strict';
  return new Promise((resolve, reject) => {
    // 检查 WebViewJavascriptBridge 是否存在
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        'getDeviceInfo',
        {},
        (responseData) => {
          resolve(responseData); // 成功返回数据
        }
      );
    } else {
      reject('WebViewJavascriptBridge 未找到');
    }
  });
}

function getIngenicoDeviceSNAndDeviceInfo() {
  'use strict';
  return new Promise((resolve, reject) => {
    // 获取刷卡机的SN号、壳子的基本信息
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        'getIngenicoDeviceSNAndDeviceInfo',
        {},
        (responseData) => {
          resolve(responseData); // 成功返回数据
        }
      );
    } else {
      reject('WebViewJavascriptBridge 未找到');
    }
  });
}

// 获取moby设备信息，兼容的方法
function bridgeCall(action, params) {
  if (!window.AppJSBridge || !window.AppJSBridge.call) {
    return Promise.reject(new Error('AppJSBridge 未初始化'));
  }

  if (typeof params === 'undefined') {
    return window.AppJSBridge.call(action);
  }

  return window.AppJSBridge.call(action, params);
}

/** AppJSBridge 获取支付设备信息；返回结构与 getIngenicoDeviceSNAndDeviceInfo 对齐（含 body） */
async function loadPaymentInfo() {
  const result = await bridgeCall('getPaymentDeviceInfo');
  console.log('loadPaymentInfo getPaymentDeviceInfo:', result);
  if (result == null || result === '') {
    throw new Error('getPaymentDeviceInfo returned empty');
  }
  if (
    typeof result === 'object' &&
    result !== null &&
    Object.prototype.hasOwnProperty.call(result, 'body')
  ) {
    return result;
  }
  return { body: result };
}

/** 获取mobyCardInfo，用于rua支付方式 */
async function loadCreditCardInfoByIngenico(amount) {
  let result;
  if (isIosShell()) {
    result = await new Promise((resolve, reject) => {
      if (
        !window.WebViewJavascriptBridge ||
        !window.WebViewJavascriptBridge.callHandler
      ) {
        reject(new Error('WebViewJavascriptBridge 未初始化'));
        return;
      }
      window.WebViewJavascriptBridge.callHandler(
        'getCreditCardInfoByIngenico',
        { amount },
        resolve
      );
    });
  } else {
    result = await bridgeCall('getCreditCardInfoByIngenico', { amount });
  }
  console.log(
    'loadCreditCardInfoByIngenico getCreditCardInfoByIngenico:',
    result
  );
  if (result == null || result === '') {
    throw new Error('getCreditCardInfoByIngenico returned empty');
  }
  if (
    typeof result === 'object' &&
    result !== null &&
    Object.prototype.hasOwnProperty.call(result, 'body')
  ) {
    return result;
  }
  return { body: result };
}

function saveLicenseName(param) {
  'use strict';
  window.CallJava.saveLicenseName(param);
}

function checkIngenicoReadyForTransaction() {
  'use strict';
  return new Promise((resolve, reject) => {
    // moby 设备连接状态
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        'checkIngenicoReadyForTransaction',
        {},
        (responseData) => {
          resolve(responseData); // 成功返回数据
        }
      );
    } else {
      reject('WebViewJavascriptBridge 未找到');
    }
  });
}

function abortIngenicoTransaction() {
  'use strict';
  return new Promise((resolve, reject) => {
    // moby 取消支付
    if (window.WebViewJavascriptBridge) {
      window.WebViewJavascriptBridge.callHandler(
        'abortIngenicoTransaction',
        {},
        (responseData) => {
          resolve(responseData); // 成功返回数据
        }
      );
    } else {
      reject('WebViewJavascriptBridge 未找到');
    }
  });
}

function changePayConnectType(appType, connectType) {
  'use strict';
  if (isIosShell()) {
    try {
      var payload = {
        vendor: 'TPOS',
        conn: 'BT',
      };
      if (
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.changePayConnectType
      ) {
        window.webkit.messageHandlers.changePayConnectType.postMessage(
          JSON.stringify(payload)
        );
      } else if (
        window.CallJava &&
        typeof window.CallJava.changePayConnectType === 'function'
      ) {
        window.CallJava.changePayConnectType(JSON.stringify(payload));
      }
    } catch (e) {}
    return;
  }
  var param = {
    appType: appType,
    connectType: connectType,
    statusCode: '3', //app左侧图标设置值。默认值为1：任何时候都展示；2：一直都不展示；3：只展示异常的
    isSupportRua: true, //支付rua支付，需要壳子配套版本
  };
  window.CallJava.changePayConnectType(JSON.stringify(param));
}

function cancelDeviceConnect() {
  'use strict';
  window.CallJava.cancelDeviceConnect();
}

function saveSecretKeyAndroid(obj) {
  'use strict';
  var param = {
    appType: obj.appType,
    merchantId: obj.merchantId,
    secret: obj.secretKey,
    callbackFuncName: obj.callbackFuncName,
  };
  window.CallJava.saveSecretKey(JSON.stringify(param));
}

function getSecretKeyAndroid(appType, merchantId, callbackFuncName) {
  'use strict';
  var param = {
    appType: appType,
    merchantId: merchantId,
    callbackFuncName: callbackFuncName,
  };
  window.CallJava.getSecretKey(JSON.stringify(param));
}

function afterGetSecretKeyFromAndroid(resObj) {
  'use strict';
  let data = {};
  try {
    data = JSON.parse(atob(resObj));
  } catch (error) {
    data = resObj;
  }
  if (data.successful) {
    var expdate = new Date();
    expdate.setTime(expdate.getTime() + 30 * 365 * 24 * 60 * 60 * 1000);
    document.cookie =
      'AndroidSecret=' +
      data.secret +
      ';expires=' +
      expdate.toGMTString() +
      ';path=/';
  }
  return resObj;
}

function isAndroidShell() {
  'use strict';
  return window.navigator.userAgent.indexOf('MenusifuAndroidShell') > -1;
}

function isIosShell() {
  'use strict';
  var navigator = window.navigator;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

Object.assign(window, {
  getDeviceInfo,
  getIngenicoDeviceSNAndDeviceInfo,
  bridgeCall,
  loadPaymentInfo,
  loadCreditCardInfoByIngenico,
  saveLicenseName,
  checkIngenicoReadyForTransaction,
  abortIngenicoTransaction,
  changePayConnectType,
  cancelDeviceConnect,
  saveSecretKeyAndroid,
  getSecretKeyAndroid,
  afterGetSecretKeyFromAndroid,
  isAndroidShell,
  isIosShell,
});

// 通知windows副机客户端 页面已加载
if (window.parent && !!window.parent[0]) {
  try {
    window.parent.postMessage(
      {
        type: 'loaded',
      },
      '*'
    );
  } catch (e) {}
}
