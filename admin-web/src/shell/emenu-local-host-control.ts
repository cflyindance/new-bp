import { clearKioskLocalSessionCache } from "./kiosk-local-session-bridge";

/** eMenu / Kiosk 嵌入页的 POS 主机地址（Vite 下经 /kpos 代理；静态托管下直连主机）。 */

export const DEFAULT_EMENU_KPOS_HOST = "http://localhost:22080";
export const EMENU_KPOS_HOST_STORAGE_KEY = "menusifu:emenu-local:kpos-host";
export const EMENU_KPOS_HOST_COOKIE = "menusifu-emenu-kpos-target";
export const KIOSK_SERVER_IP_COOKIE = "kioskServerIP";

declare global {
  interface Window {
    __MENUSIFU_KPOS_BASE__?: string;
  }
}

export function normalizeEmenuKposHost(input: string): string | null {
  let raw = input.trim();
  if (!raw) return null;

  raw = raw.replace(/\/+$/, "").replace(/\/kpos\/?$/i, "");

  if (!/^https?:\/\//i.test(raw)) {
    if (/^[\w.-]+$/.test(raw)) {
      raw = `http://${raw}:22080`;
    } else if (/^[\w.-]+:\d+$/.test(raw)) {
      raw = `http://${raw}`;
    } else {
      return null;
    }
  }

  try {
    const url = new URL(raw);
    if (!url.hostname) return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function readEmenuKposHost(): string {
  try {
    const stored = localStorage.getItem(EMENU_KPOS_HOST_STORAGE_KEY)?.trim();
    const normalized = stored ? normalizeEmenuKposHost(stored) : null;
    if (normalized) return normalized;
  } catch {
    /* ignore */
  }
  return DEFAULT_EMENU_KPOS_HOST;
}

/** Vite dev / preview 带有 /kpos 动态代理；GitHub Pages 等纯静态托管没有。 */
export function canUseSameOriginKposProxy(
  loc: Pick<Location, "hostname" | "port" | "protocol"> = window.location,
): boolean {
  if (import.meta.env.DEV) return true;
  const host = loc.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    const port = loc.port || (loc.protocol === "https:" ? "443" : "80");
    return port === "5173" || port === "4173";
  }
  return false;
}

export function isGitHubPagesHost(hostname: string = window.location.hostname): boolean {
  return hostname.toLowerCase().endsWith(".github.io");
}

/** HTTPS 页面访问 HTTP POS 会被浏览器混合内容策略拦截（GitHub Pages 典型场景）。 */
export function isKposMixedContentBlocked(host: string = readEmenuKposHost()): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.protocol !== "https:") return false;
  try {
    return new URL(host).protocol === "http:";
  } catch {
    return true;
  }
}

/** 嵌入页实际应请求的 /kpos API 基址（末尾带 /）。 */
export function resolveKposApiBase(host: string = readEmenuKposHost()): string {
  if (canUseSameOriginKposProxy()) {
    return `${window.location.origin}/kpos/`;
  }
  const normalized = normalizeEmenuKposHost(host) || DEFAULT_EMENU_KPOS_HOST;
  return `${normalized}/kpos/`;
}

export function syncEmbedKposRouting(host: string = readEmenuKposHost()): string {
  const apiBase = resolveKposApiBase(host);
  try {
    window.__MENUSIFU_KPOS_BASE__ = apiBase;
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 365;
  try {
    document.cookie = `${KIOSK_SERVER_IP_COOKIE}=${apiBase}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  return apiBase;
}

export function writeEmenuKposHost(host: string): string | null {
  const normalized = normalizeEmenuKposHost(host);
  if (!normalized) return null;
  try {
    localStorage.setItem(EMENU_KPOS_HOST_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
  syncEmenuKposHostCookie(normalized);
  syncEmbedKposRouting(normalized);
  clearKioskLocalSessionCache();
  return normalized;
}

export function syncEmenuKposHostCookie(host: string = readEmenuKposHost()): void {
  const normalized = normalizeEmenuKposHost(host) || DEFAULT_EMENU_KPOS_HOST;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${EMENU_KPOS_HOST_COOKIE}=${encodeURIComponent(normalized)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function displayEmenuKposHost(host: string = readEmenuKposHost()): string {
  try {
    const url = new URL(host);
    return url.host;
  } catch {
    return host;
  }
}

function withKposBaseQuery(frameSrc: string, apiBase: string): string {
  try {
    const url = new URL(frameSrc, window.location.href);
    url.searchParams.set("v", String(Date.now()));
    url.searchParams.set("kposBase", apiBase);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return frameSrc;
  }
}

/** 应用主机后刷新 eMenu / Kiosk 嵌入 iframe，并注入当前 /kpos 基址。 */
export function reloadKposHostEmbedFrames(): void {
  const apiBase = syncEmbedKposRouting();
  document
    .querySelectorAll<HTMLIFrameElement>(
      [
        "[data-emenu-local-emenu-frame] iframe",
        "[data-emenu-local-emenu-settings-frame] iframe",
        "[data-kiosk-local-kiosk-frame] iframe",
        "[data-kiosk-local-kiosk-settings-frame] iframe",
      ].join(", "),
    )
    .forEach((frame) => {
      try {
        frame.src = withKposBaseQuery(frame.src, apiBase);
      } catch {
        frame.src = frame.src;
      }
    });
}

/** @deprecated 使用 reloadKposHostEmbedFrames */
export function reloadEmenuEmbedFrames(): void {
  reloadKposHostEmbedFrames();
}
