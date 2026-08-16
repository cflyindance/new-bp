import fs from "node:fs";
import { mapKposMenusToSeasoningView } from "./emenu-local-seasoning-menu-map.mjs";
import { readMenuCache, writeMenuCache } from "./emenu-local-seasoning-menu-cache.mjs";

export const EMENU_KPOS_HOST_COOKIE = "menusifu-emenu-kpos-target";
export const EMENU_MENU_AUTHORIZATION = "UvDU853J9L351BThAC";

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
    async resolve() {
      return { ...view, fromCache: false, source: "fixture" };
    },
  };
}

export function createSnapshotMenuProvider(snapshotPath) {
  return {
    async resolve() {
      const view = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
      return { ...view, fromCache: false, source: "snapshot" };
    },
  };
}

export function createLiveMenuProvider({ fetchImpl = fetch } = {}) {
  return {
    async resolve({ req, cacheDir }) {
      const host = parseKposHostFromCookieHeader(req?.headers?.cookie || req?.headers?.Cookie || "");
      if (!host) {
        throw menuUnavailable("missing_kpos_host_cookie");
      }
      const url = `${host}/kpos/api/menu/menu?product=EMENU&showInactive=false&showDeleted=false`;
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
        writeMenuCache(cacheDir, host, mapped);
        return { ...mapped, fromCache: false, source: "live" };
      } catch (error) {
        const cached = readMenuCache(cacheDir, host);
        if (cached) return { ...cached, fromCache: true, source: "cache" };
        throw menuUnavailable(error?.message || "menu_fetch_failed");
      }
    },
  };
}
