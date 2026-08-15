import { serverURL as serverIP } from '../constants/serverURL';
import Cookie from 'js-cookie';
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

function captureServerIP(url) {
  const i = url.indexOf('kiosklite');
  if (i > -1) {
    return url.substring(0, i);
  } else {
    const hashIndex = url.indexOf('#/');
    return hashIndex > -1 ? url.substring(0, hashIndex) : url;
  }
}

/**
 * admin-web 嵌入：页面在 /kpos/kiosklite，API 基址收成同源 /kpos/，
 * 由 Vite 按 menusifu-emenu-kpos-target cookie 转发到目标 POS。
 */
function resolveEmbedKposBase() {
  if (typeof window === 'undefined') return '';
  const href = window.location.href || '';
  if (href.includes('embedded=1') || href.includes('/kpos/kiosklite')) {
    return `${window.location.origin}/kpos/`;
  }
  return '';
}

const embedBase = resolveEmbedKposBase();
const captured = captureServerIP(document.location.href);
const kioskServerIP = embedBase || captured;
setCookie('kioskServerIP', kioskServerIP);

let serverip = serverIP;

if (embedBase) {
  serverip = embedBase;
} else if (window.location.href.indexOf('kpos') > -1) {
  if (getCookie('kioskServerIP')) {
    serverip = getCookie('kioskServerIP');
  } else {
    const i = window.location.href.indexOf('kiosk');
    serverip = window.location.href.substring(0, i);
  }
}

export const serverURL = serverip;
