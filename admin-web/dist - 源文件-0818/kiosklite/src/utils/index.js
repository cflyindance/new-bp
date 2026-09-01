import Cookie from 'js-cookie';
import { posFrontLog, fetchSessionKey } from '../api';
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from '@/constants/posterPro';
import copyCode from './copyCode';
import { notifyPosConnectionAfterSessionRenewal } from './notifyPosConnectionAfterSessionRenewal';
import { RUNTIME_ENV, getRuntimeEnv } from './runtimeEnv';

// 读取cookie
export const getCookie = (name) => {
  return Cookie.get(name) || '';
};

// 储存cookie
export const setCookie = (name, value) => {
  Cookie.set(name, value, {
    expires: 30 * 365,
  });
};

// 删除cookie
export const deleteCookie = (name) => {
  Cookie.remove(name);
};

// 判断 sessionKey 剩余有效期；可通过 minimumRemainingTime 提前续期
export const judgeSskeyIsActiveTime = async ({
  minimumRemainingTime = 0,
  notifyAfterRenewal = true,
} = {}) => {
  const now = +new Date();
  const clientInstanceLoginTime = +getCookie('kioskclientInstanceTime');
  const sessionKeyRemainingActiveTime = +getCookie('kioskSskeyActiveTime');
  const remainingActiveTime =
    sessionKeyRemainingActiveTime - (now - clientInstanceLoginTime);
  // 剩余有效期充足
  if (remainingActiveTime > 0 && remainingActiveTime >= minimumRemainingTime) {
    return false;
  }

  // 已过期或剩余有效期不足
  const res = await fetchSessionKey();
  if (!res?.data?.result?.successful) {
    throw new Error(
      res?.data?.result?.failureReason || 'Session key refresh failed'
    );
  }

  setCookie('kioskclientInstanceTime', +new Date());
  setCookie(
    'kioskSskeyActiveTime',
    res.data.sessionKeyRemainingActiveTime || 23 * 3600 * 1000
  );
  if (
    (window.isAndroidShell && window.isAndroidShell()) ||
    (window.isIosShell && window.isIosShell())
  ) {
    setCookie('AndroidSecret', res.data.secretKey);
  } else {
    setCookie('secretKey', res.data.secretKey);
  }
  // sskey过期保存日志
  posFrontLog(
    `clientInstanceLogin_expire_sessionKey=${getCookie('sessionKey')}`
  );
  setCookie('sessionKey', res.data.sessionKey);
  posFrontLog(`clientInstanceLogin_new_sessionKey=${res.data.sessionKey}`);
  // 立即尝试同步 App 断连状态，避免仅靠 5s 轮询才关闭 LostConnection 遮罩
  if (notifyAfterRenewal) {
    notifyPosConnectionAfterSessionRenewal();
  }
  return true;
};

export function getUrlParams() {
  let url = window.location.href;
  if (url.indexOf('?') != -1) {
    let obj = {};
    let arr = url.slice(url.indexOf('?') + 1).split('&');
    arr.forEach((item) => {
      let param = item.split('=');
      obj[param[0]] = param[1];
    });

    return obj;
  } else {
    return null;
  }
}

// 判断文件是否为图片类型
export const isImage = (ext) => {
  if (
    ext === 'image/png' ||
    ext === 'image/jpg' ||
    ext === 'image/jpeg' ||
    ext === 'image/gif' ||
    ext === 'image/bmp'
  ) {
    return true;
  }
};

// 绑定事件 on(element, event, handler)
export const on = (function () {
  if (document.addEventListener) {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false);
      }
    };
  } else {
    return function (element, event, handler) {
      if (element && event && handler) {
        element.attachEvent('on' + event, handler);
      }
    };
  }
})();

// 解绑事件 off(element, event, handler)
export const off = (function () {
  if (document.removeEventListener) {
    return function (element, event, handler) {
      if (element && event) {
        element.removeEventListener(event, handler, false);
      }
    };
  } else {
    return function (element, event, handler) {
      if (element && event) {
        element.detachEvent('on' + event, handler);
      }
    };
  }
})();

/**
 * 配置页在 iframe 内时常无法直接读到父页的 sessionKey cookie，需与 generalSetting 等子页相同：向 parent postMessage 获取。
 * @returns {Promise<string>}
 */
export const requestKioskConfigSessionKey = () =>
  new Promise((resolve, reject) => {
    const cookieKey = getCookie('sessionKey');
    if (window.parent === window) {
      if (cookieKey) resolve(cookieKey);
      else reject(new Error('Session key not found'));
      return;
    }

    let timer;
    const cleanup = () => {
      off(window, 'message', handler);
      if (timer) clearTimeout(timer);
    };

    const handler = (event) => {
      if (event?.data?.type === 'sessionKey' && event.data.data) {
        cleanup();
        resolve(event.data.data);
      }
    };

    on(window, 'message', handler);
    window.parent.postMessage({ type: 'getSessionKey' }, '*');

    if (process.env.NODE_ENV === 'development' && cookieKey) {
      cleanup();
      resolve(cookieKey);
      return;
    }

    timer = setTimeout(() => {
      cleanup();
      if (cookieKey) resolve(cookieKey);
      else reject(new Error('Session key not found'));
    }, 5000);
  });

// 判断是否打开VtKeyboard
export const isOpenVtkeyboadrd = () => {
  let openFlag = true;
  if (!window.isAndroidShell) {
    openFlag = true;
  } else if (window.isAndroidShell) {
    let u = window.navigator.userAgent;
    let isAndroid = u.indexOf('Android') > -1;
    let isIos = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
    if (!window.isAndroidShell()) {
      if (isAndroid) {
        // android浏览器
        openFlag = false;
      } else if (isIos) {
        // ipad壳，ipad浏览器，iphone浏览器
        openFlag = false;
      } else {
        // window浏览器
        openFlag = true;
      }
    } else {
      // 'android壳'
      openFlag = false;
    }
  }

  return openFlag;
};

// 判断是否是ipad环境
export const isIpadEnv = () => {
  let u = window.navigator.userAgent;
  let isIos = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
  return isIos;
};

// 数组对象的排序 arr.sort(compare('age'))
export const compare = (property) => {
  return function (a, b) {
    var value1 = a[property];
    var value2 = b[property];
    if (value1 && value2) {
      return value1 - value2;
    }
  };
};

// 解决ios滚动穿透
export const solveScrollElem = (flag) => {
  if (isIpadEnv()) {
    const hash = window.location.hash;
    if (hash.indexOf('orderPage') > -1) {
      const itemListDom = document.getElementById('itemListContainerId');
      if (itemListDom) {
        itemListDom.style.overflowY = flag ? 'hidden' : 'auto';
      }
      const categoryListDom = document.getElementById('categoryListId');
      if (categoryListDom) {
        categoryListDom.style.overflowY = flag ? 'hidden' : 'scroll';
      }
    } else if (hash.indexOf('orderReview') > -1) {
      const orderReviewDom = document.getElementById('orderReviewId');
      if (orderReviewDom) {
        orderReviewDom.style.overflowY = flag ? 'hidden' : 'auto';
      }
    } else if (hash.indexOf('comboPanel') > -1) {
      const sideNavDom = document.getElementById('sideNavId');
      if (sideNavDom) {
        sideNavDom.style.overflowY = flag ? 'hidden' : 'auto';
      }
      const fullComboPanelDom = document.getElementById('fullComboPanelId');
      if (fullComboPanelDom) {
        fullComboPanelDom.style.overflowY = flag ? 'hidden' : 'auto';
      }
    }
  }
};

const getOrientationFromType = () => {
  const type = window.screen?.orientation?.type;
  if (!type) {
    return null;
  }
  if (type.includes('landscape')) {
    return 'horizontal';
  }
  if (type.includes('portrait')) {
    return 'vertical';
  }
  return null;
};

const getOrientationFromViewport = () => {
  const width = window.innerWidth || document.documentElement?.clientWidth || 0;
  const height =
    window.innerHeight || document.documentElement?.clientHeight || 0;

  if (width && height) {
    return width >= height ? 'horizontal' : 'vertical';
  }

  return window.screen.width >= window.screen.height
    ? 'horizontal'
    : 'vertical';
};

// 判断设备方向
export const getDeviceOrientation = () => {
  const fromType = getOrientationFromType();
  if (fromType) {
    return fromType;
  }

  return getOrientationFromViewport();
};

export const subscribeDeviceOrientation = (callback) => {
  let frameId = null;

  const handler = () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    frameId = requestAnimationFrame(() => {
      frameId = null;
      callback(getDeviceOrientation());
    });
  };

  window.addEventListener('orientationchange', handler);
  window.addEventListener('resize', handler);

  return () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
    }
    window.removeEventListener('orientationchange', handler);
    window.removeEventListener('resize', handler);
  };
};

export const getCssValue = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  return Number(value.replace(/\D+/g, ' '));
};

export const checkPositionLeft = (block, left) => {
  const { width } = block.style;
  const cssWidth = getCssValue(width);
  const minLeft = 0;
  const maxLeft = VIEWPORT_WIDTH - cssWidth;
  return left >= maxLeft ? maxLeft : left <= minLeft ? minLeft : left;
};

export const checkPositionTop = (block, top) => {
  const { height } = block.style;
  const cssHeight = getCssValue(height);
  const minTop = 0;
  const maxTop = VIEWPORT_HEIGHT - cssHeight;
  return top >= maxTop ? maxTop : top <= minTop ? minTop : top;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/^\+1/, '');
  if (cleaned.length !== 10) return phone; // 长度不对就返回原始值

  // 按照 (XXX)-XXX-XXXX 格式化
  const areaCode = cleaned.slice(0, 3);
  const firstPart = cleaned.slice(3, 6);
  const secondPart = cleaned.slice(6, 10);
  return `(${areaCode})${firstPart} -${secondPart}`;
};

// copyCode 函数
export { copyCode };

// 判断是否是 development 环境
export const isDevelopment = () => {
  return getRuntimeEnv() === RUNTIME_ENV.DEV;
};

// 判断是否是 integration 环境
export const isIntegration = () => {
  return getRuntimeEnv() === RUNTIME_ENV.QA;
};
