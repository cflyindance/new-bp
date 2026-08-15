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

function normalizeKposBase(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

/**
 * 优先：?kposBase= / localStorage 主机（GitHub Pages 等无 Vite 代理时直连 POS）。
 * 其次：同源 /kpos/（本地 Vite 动态代理）。
 */
function resolveEmbedKposBase() {
  if (typeof window === 'undefined') return '';
  try {
    const params = new URLSearchParams(window.location.search || '');
    const fromQuery = normalizeKposBase(params.get('kposBase'));
    if (fromQuery) return fromQuery;

    const stored = localStorage.getItem('menusifu:emenu-local:kpos-host');
    const href = window.location.href || '';
    const host = window.location.hostname.toLowerCase();
    const onPages = host.endsWith('.github.io');
    const embedded = params.get('embedded') === '1' || href.includes('/kpos/kiosklite');
    if (stored && embedded && onPages) {
      return normalizeKposBase(`${String(stored).replace(/\/$/, '')}/kpos`);
    }
    if (embedded) {
      return `${window.location.origin}/kpos/`;
    }
  } catch {
    /* ignore */
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
