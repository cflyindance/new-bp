import { clearKioskLocalSessionCache } from "./kiosk-local-session-bridge";

/** eMenu / Kiosk 嵌入页的 POS 主机地址（经 Vite /kpos、/img 动态代理；cookie 两端共用）。 */

export const DEFAULT_EMENU_KPOS_HOST = "http://localhost:22080";
export const EMENU_KPOS_HOST_STORAGE_KEY = "menusifu:emenu-local:kpos-host";
export const EMENU_KPOS_HOST_COOKIE = "menusifu-emenu-kpos-target";

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

export function writeEmenuKposHost(host: string): string | null {
  const normalized = normalizeEmenuKposHost(host);
  if (!normalized) return null;
  try {
    localStorage.setItem(EMENU_KPOS_HOST_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
  syncEmenuKposHostCookie(normalized);
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

/** 应用主机后刷新 eMenu / Kiosk 嵌入 iframe，使后续 /kpos 走新 cookie 目标。 */
export function reloadKposHostEmbedFrames(): void {
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
        const url = new URL(frame.src, window.location.href);
        url.searchParams.set("v", String(Date.now()));
        frame.src = `${url.pathname}${url.search}${url.hash}`;
      } catch {
        frame.src = frame.src;
      }
    });
}

/** @deprecated 使用 reloadKposHostEmbedFrames */
export function reloadEmenuEmbedFrames(): void {
  reloadKposHostEmbedFrames();
}
