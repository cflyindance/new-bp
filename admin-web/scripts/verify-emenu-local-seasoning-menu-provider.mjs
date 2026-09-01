import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createFixtureMenuProvider,
  createLiveMenuProvider,
  createSnapshotMenuProvider,
  parseKposHostFromCookieHeader,
  EMENU_KPOS_HOST_COOKIE,
  EMENU_MENU_AUTHORIZATION,
} from "./lib/emenu-local-seasoning-menu-provider.mjs";
import { writeMenuCache } from "./lib/emenu-local-seasoning-menu-cache.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  parseKposHostFromCookieHeader(`${EMENU_KPOS_HOST_COOKIE}=http%3A%2F%2F127.0.0.1%3A22080`) === "http://127.0.0.1:22080",
  "cookie parse",
);
assert(parseKposHostFromCookieHeader("") === null, "missing cookie");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(root, "scripts", "fixtures", "emenu-seasoning-menu-snapshot.json");
const snapProvider = createSnapshotMenuProvider(snapshotPath);
const snap = await snapProvider.resolve({ req: { headers: {} }, cacheDir: os.tmpdir() });
assert(snap.products.length >= 1 && snap.fromCache === false && snap.source === "snapshot", "snapshot resolve");

const fixtureView = { ...snap, fingerprint: "fixture-fp", sourceMenuVersion: "fix" };
const fixture = createFixtureMenuProvider(fixtureView);
const fixed = await fixture.resolve({ req: { headers: {} }, cacheDir: os.tmpdir() });
assert(fixed.fingerprint === "fixture-fp", "fixture");

const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "seasoning-live-"));
const staticView = { ...fixtureView, fingerprint: "static-fp" };
let fetchCalls = 0;
const live = createLiveMenuProvider({
  staticView,
  fetchImpl: async (url, init) => {
    fetchCalls += 1;
    assert(String(url).includes("/kpos/api/menu/menu"), "url path");
    assert(String(url).includes("product=EMENU"), "product param");
    assert(init.headers.Authorization === EMENU_MENU_AUTHORIZATION, "auth");
    throw new Error("network_down");
  },
});

const missingHost = await live.resolve({ req: { headers: {} }, cacheDir });
assert(missingHost.source === "static" && missingHost.fingerprint === "static-fp", "missing host uses static");

const noCache = await live.resolve({
  req: { headers: { cookie: `${EMENU_KPOS_HOST_COOKIE}=${encodeURIComponent("http://127.0.0.1:22080")}` } },
  cacheDir,
});
assert(noCache.source === "static" && noCache.fingerprint === "static-fp", "no cache falls back to static");

writeMenuCache(cacheDir, "http://127.0.0.1:22080", { ...fixtureView, fingerprint: "cached-fp" }, "EMENU");
const cached = await live.resolve({
  req: { headers: { cookie: `${EMENU_KPOS_HOST_COOKIE}=${encodeURIComponent("http://127.0.0.1:22080")}` } },
  cacheDir,
});
assert(cached.fingerprint === "cached-fp" && cached.fromCache === true, "cache fallback");

writeMenuCache(cacheDir, "http://127.0.0.1:22080", { ...fixtureView, fingerprint: "kiosk-cached" }, "KIOSK");
const kioskLive = createLiveMenuProvider({
  staticView,
  fetchImpl: async (url) => {
    assert(String(url).includes("product=KIOSK"), "kiosk product param");
    throw new Error("network_down");
  },
});
const kioskCached = await kioskLive.resolve({
  req: { headers: { cookie: `${EMENU_KPOS_HOST_COOKIE}=${encodeURIComponent("http://127.0.0.1:22080")}` } },
  cacheDir,
  product: "KIOSK",
});
assert(kioskCached.fingerprint === "kiosk-cached" && kioskCached.product === "KIOSK", "kiosk cache isolated");

const okLive = createLiveMenuProvider({
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        menuVersion: "live-1",
        menus: [
          {
            menuGroups: [
              {
                id: "g",
                name: "G",
                menuCategories: [
                  {
                    id: "c",
                    name: "C",
                    saleItems: [{ id: "77", name: "菜", itemNumber: "X", price: 1 }],
                  },
                ],
              },
            ],
          },
        ],
      };
    },
  }),
});
const liveView = await okLive.resolve({
  req: { headers: { cookie: `${EMENU_KPOS_HOST_COOKIE}=${encodeURIComponent("http://127.0.0.1:22080")}` } },
  cacheDir,
});
assert(liveView.products[0].id === "77" && liveView.fromCache === false, "live map+write");
assert(fetchCalls >= 1, "fetch used");

console.log("verify-emenu-local-seasoning-menu-provider: ok");
