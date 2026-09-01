import fs from "node:fs";
import { mapKposMenusToSeasoningView } from "./emenu-local-seasoning-menu-map.mjs";
import { normalizeMenuProduct, readMenuCache, writeMenuCache } from "./emenu-local-seasoning-menu-cache.mjs";

export const EMENU_KPOS_HOST_COOKIE = "menusifu-emenu-kpos-target";
export const EMENU_MENU_AUTHORIZATION = "UvDU853J9L351BThAC";

const EMPTY_MENU_VIEW = {
  menuGroups: [],
  products: [],
  categories: [],
  fingerprint: "static",
  sourceMenuVersion: null,
};

export function parseKposHostFromCookieHeader(cookieHeader) {
  const raw = String(cookieHeader || "");
  const parts = raw.split(";").map((part) => part.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    if (name !== EMENU_KPOS_HOST_COOKIE) continue;
    const value = decodeURIComponent(part.slice(eq + 1).trim());
    const normalized = value.replace(/\/+$/, "").replace(/\/kpos\/?$/i, "");
    if (!/^https?:\/\//i.test(normalized)) return null;
    return normalized;
  }
  return null;
}

function menuUnavailable(message) {
  const error = new Error(message || "menu_unavailable");
  error.code = "menu_unavailable";
  error.statusCode = 503;
  error.payload = { error: "menu_unavailable", message: String(message || "menu_unavailable") };
  return error;
}

export function createFixtureMenuProvider(view) {
  return {
    async resolve({ product } = {}) {
      return { ...view, fromCache: false, source: "fixture", product: normalizeMenuProduct(product) };
    },
  };
}

export function createSnapshotMenuProvider(snapshotPath) {
  return {
    async resolve({ product } = {}) {
      const view = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
      return { ...view, fromCache: false, source: "snapshot", product: normalizeMenuProduct(product) };
    },
  };
}

export function createLiveMenuProvider({ fetchImpl = fetch, staticView } = {}) {
  const fallbackView = staticView || EMPTY_MENU_VIEW;
  return {
    async resolve({ req, cacheDir, product } = {}) {
      const prod = normalizeMenuProduct(product);
      const fallback = () => ({ ...fallbackView, fromCache: false, source: "static", product: prod });
      const host = parseKposHostFromCookieHeader(req?.headers?.cookie || req?.headers?.Cookie || "");
      if (!host) return fallback();
      const url = `${host}/kpos/api/menu/menu?product=${encodeURIComponent(prod)}&showInactive=false&showDeleted=false`;
      try {
        const response = await fetchImpl(url, {
          method: "GET",
          headers: {
            Authorization: EMENU_MENU_AUTHORIZATION,
            Accept: "application/json",
          },
        });
        if (!response.ok) throw new Error(`http_${response.status}`);
        const payload = await response.json();
        const mapped = mapKposMenusToSeasoningView(payload);
        writeMenuCache(cacheDir, host, mapped, prod);
        return { ...mapped, fromCache: false, source: "live", product: prod };
      } catch {
        const cached = readMenuCache(cacheDir, host, prod);
        if (cached) return { ...cached, fromCache: true, source: "cache", product: prod };
        return fallback();
      }
    },
  };
}

export { menuUnavailable };
