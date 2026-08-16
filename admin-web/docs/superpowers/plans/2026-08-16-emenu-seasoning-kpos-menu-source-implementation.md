# eMenu 调味菜单数据源对齐 KPOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让调味模块所有组/类/菜商品读数与嵌入 eMenu 同源，经 Node Menu Provider 拉取 `${host}/kpos/api/menu/menu`，失败用主机隔离缓存，演示恒读静态快照。

**Architecture:** 新增纯映射 + 文件缓存 + 可注入 Menu Provider；`handleEmenuSeasoningApi` 在菜单相关路由上将 Provider 视图覆盖到 `products`/`menuGroups`/`categories`，Option 路由不依赖菜单。Vite live 用 cookie 主机直连 KPOS；browser 模式只用快照；校验脚本注入 fixture Provider 保持现有用例，并新增映射/缓存/失败路径测试。

**Tech Stack:** Node ESM (`.mjs`)、现有 seasoning HTTP handler、Vite middleware、浏览器生成 handler、`node` assert 校验脚本。

**Spec:** `admin-web/docs/superpowers/specs/2026-08-16-emenu-seasoning-kpos-menu-source-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| `admin-web/scripts/lib/emenu-local-seasoning-menu-map.mjs` | KPOS `menus` JSON → `{ menuGroups, products, categories, fingerprint }` |
| `admin-web/scripts/lib/emenu-local-seasoning-menu-cache.mjs` | 按主机归一化键读写 `.cache` 菜单缓存文件 |
| `admin-web/scripts/lib/emenu-local-seasoning-menu-provider.mjs` | live / snapshot / fixture Provider；cookie 解析与上游 fetch |
| `admin-web/scripts/fixtures/emenu-seasoning-menu-snapshot.json` | 演示近真菜单视图（已映射形状） |
| `admin-web/scripts/lib/emenu-local-seasoning-api-handler.mjs` | 注入 Provider；菜单路由用视图；snapshot 排除孤儿 |
| `admin-web/scripts/generate-emenu-local-seasoning-browser-handler.mjs` | 必要时改写 import 替换（若 provider 需进 browser） |
| `admin-web/src/emenu-local/seasoning/generated/seasoning-browser-handler.ts` | 重新生成 |
| `admin-web/src/emenu-local/seasoning/seasoning-browser-runtime.ts` | browser 模式绑定 snapshot Provider |
| `admin-web/src/emenu-local/seasoning/seasoning-api-error.ts` / UI | 识别 `menu_unavailable` 与缓存提示 |
| `admin-web/scripts/verify-emenu-local-seasoning-menu-map.mjs` | 映射单测 |
| `admin-web/scripts/verify-emenu-local-seasoning-menu-provider.mjs` | 缓存 / 失败 / live mock |
| `admin-web/scripts/verify-emenu-local-seasoning-api.mjs` | 注入 fixture；孤儿导出断言 |
| `admin-web/package.json` | 把新 verify 挂进 `verify:emenu-local-seasoning` |

---

### Task 1: KPOS → 调味视图纯映射

**Files:**
- Create: `admin-web/scripts/lib/emenu-local-seasoning-menu-map.mjs`
- Create: `admin-web/scripts/verify-emenu-local-seasoning-menu-map.mjs`

- [ ] **Step 1: Write the failing verify script**

```js
// admin-web/scripts/verify-emenu-local-seasoning-menu-map.mjs
import { mapKposMenusToSeasoningView } from "./lib/emenu-local-seasoning-menu-map.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const raw = {
  menuVersion: "mv-1",
  menus: [
    {
      menuGroups: [
        {
          id: "g1",
          name: "常规",
          menuCategories: [
            {
              id: "c1",
              name: "热菜",
              saleItems: [
                {
                  id: "1001",
                  name: "宫保鸡丁",
                  itemNumber: "D1001",
                  price: 12,
                  hiddenItem: false,
                },
                {
                  id: "1002",
                  name: "隐藏菜",
                  itemNumber: "D1002",
                  price: 10,
                  hiddenItem: true,
                },
                {
                  id: "1003",
                  name: "无价格菜",
                  itemNumber: "D1003",
                  hiddenItem: false,
                },
              ],
            },
          ],
        },
        {
          id: "g2",
          name: "推荐",
          menuCategories: [
            {
              id: "c2",
              name: "招牌",
              saleItems: [
                {
                  id: "1001",
                  name: "宫保鸡丁",
                  itemNumber: "D1001",
                  price: 12,
                  hiddenItem: false,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const view = mapKposMenusToSeasoningView(raw);
assert(view.products.length === 1 && view.products[0].id === "1001", "only visible priced items");
assert(view.products[0].code === "D1001", "itemNumber maps to code");
assert(view.products[0].emenuSellable === true && view.products[0].status === "active", "sellable flags");
assert(view.menuGroups.length === 2, "both groups kept");
assert(view.menuGroups[0].categories[0].productIds.includes("1001"), "placement in first group");
assert(view.menuGroups[1].categories[0].productIds.includes("1001"), "same product multi-path");
assert(view.categories.some((c) => c.id === "c1"), "flat categories derived");
assert(view.sourceMenuVersion === "mv-1", "preserve menuVersion");
assert(typeof view.fingerprint === "string" && view.fingerprint.length > 10, "fingerprint required");

const empty = mapKposMenusToSeasoningView({ menus: [{ menuGroups: [] }] });
assert(empty.products.length === 0 && empty.menuGroups.length === 0, "empty menu");

console.log("verify-emenu-local-seasoning-menu-map: ok");
```

- [ ] **Step 2: Run verify to confirm it fails**

Run: `node scripts/verify-emenu-local-seasoning-menu-map.mjs`  
Working directory: `admin-web`  
Expected: FAIL — module not found / export missing

- [ ] **Step 3: Implement mapper**

```js
// admin-web/scripts/lib/emenu-local-seasoning-menu-map.mjs
import crypto from "node:crypto";

function htmlDecode(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isNil(value) {
  return value === null || value === undefined;
}

function isHiddenSaleItem(item) {
  if (!item || item.hiddenItem) return true;
  const defaultPrice = item.addPrice ?? item.price;
  const itemPrices = Array.isArray(item.itemPrices) ? item.itemPrices : [];
  if (!item.marketPriceItem && isNil(defaultPrice) && itemPrices.length === 0) return true;
  return false;
}

/**
 * @param {any} payload KPOS /menu/menu JSON body (or { menus, menuVersion })
 * @returns {{ menuGroups: any[], products: any[], categories: any[], sourceMenuVersion: string|null, fingerprint: string }}
 */
export function mapKposMenusToSeasoningView(payload) {
  const menus = payload?.menus ?? payload?.data?.menus ?? [];
  const sourceMenuVersion = payload?.menuVersion ?? payload?.data?.menuVersion ?? null;
  const groupsIn = menus?.[0]?.menuGroups ?? [];
  const productsById = new Map();
  const categoriesById = new Map();
  const menuGroups = [];

  groupsIn.forEach((group, groupIndex) => {
    const categories = [];
    (group?.menuCategories ?? []).forEach((category, categoryIndex) => {
      const productIds = [];
      (category?.saleItems ?? []).forEach((item, itemIndex) => {
        if (isHiddenSaleItem(item)) return;
        const id = String(item.id);
        productIds.push(id);
        if (!productsById.has(id)) {
          productsById.set(id, {
            id,
            code: String(item.itemNumber ?? item.code ?? id),
            name: htmlDecode(item.name),
            categoryId: String(category.id),
            categoryName: htmlDecode(category.name),
            status: "active",
            emenuSellable: true,
            sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : (itemIndex + 1) * 10,
          });
        }
        if (!categoriesById.has(String(category.id))) {
          categoriesById.set(String(category.id), {
            id: String(category.id),
            name: htmlDecode(category.name),
            sortOrder: Number.isFinite(category.sortOrder) ? category.sortOrder : (categoryIndex + 1) * 10,
          });
        }
      });
      if (!productIds.length) return;
      categories.push({
        id: String(category.id),
        name: htmlDecode(category.name),
        sortOrder: Number.isFinite(category.sortOrder) ? category.sortOrder : (categoryIndex + 1) * 10,
        productIds,
      });
    });
    if (!categories.length) return;
    menuGroups.push({
      id: String(group.id),
      name: htmlDecode(group.name),
      sortOrder: Number.isFinite(group.sortOrder) ? group.sortOrder : (groupIndex + 1) * 10,
      categories,
    });
  });

  const products = [...productsById.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const categories = [...categoriesById.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const fingerprintBasis = {
    sourceMenuVersion,
    menu: menuGroups.map((group) => ({
      id: group.id,
      name: group.name,
      categories: group.categories.map((category) => ({
        id: category.id,
        name: category.name,
        productIds: [...category.productIds],
      })),
    })),
    products: products.map((product) => ({
      id: product.id,
      code: product.code,
      name: product.name,
      status: product.status,
      emenuSellable: product.emenuSellable,
    })),
  };
  const fingerprint = sourceMenuVersion
    ? `kpos:${sourceMenuVersion}`
    : crypto.createHash("sha256").update(JSON.stringify(fingerprintBasis)).digest("hex");

  return { menuGroups, products, categories, sourceMenuVersion, fingerprint };
}
```

- [ ] **Step 4: Re-run verify**

Run: `node scripts/verify-emenu-local-seasoning-menu-map.mjs`  
Expected: `verify-emenu-local-seasoning-menu-map: ok`

- [ ] **Step 5: Commit**

```bash
git add admin-web/scripts/lib/emenu-local-seasoning-menu-map.mjs admin-web/scripts/verify-emenu-local-seasoning-menu-map.mjs
git commit -m "feat: map KPOS menus to seasoning menu view"
```

---

### Task 2: 主机隔离菜单缓存

**Files:**
- Create: `admin-web/scripts/lib/emenu-local-seasoning-menu-cache.mjs`
- Create: `admin-web/scripts/verify-emenu-local-seasoning-menu-cache.mjs`

- [ ] **Step 1: Write failing verify**

```js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  menuCacheKeyForHost,
  readMenuCache,
  writeMenuCache,
} from "./lib/emenu-local-seasoning-menu-cache.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seasoning-menu-cache-"));
const hostA = "http://192.168.1.10:22080";
const hostB = "http://192.168.1.11:22080";
assert(menuCacheKeyForHost(hostA) !== menuCacheKeyForHost(hostB), "hosts must isolate");
assert(readMenuCache(dir, hostA) === null, "missing cache is null");

const view = {
  menuGroups: [{ id: "g1", name: "G", sortOrder: 10, categories: [] }],
  products: [{ id: "1", code: "A", name: "菜", categoryId: "c", categoryName: "C", status: "active", emenuSellable: true, sortOrder: 10 }],
  categories: [],
  sourceMenuVersion: "v1",
  fingerprint: "fp1",
};
writeMenuCache(dir, hostA, view);
const loaded = readMenuCache(dir, hostA);
assert(loaded?.fingerprint === "fp1" && loaded.products[0].id === "1", "roundtrip");
assert(readMenuCache(dir, hostB) === null, "other host empty");

console.log("verify-emenu-local-seasoning-menu-cache: ok");
```

- [ ] **Step 2: Run — expect fail**

Run: `node scripts/verify-emenu-local-seasoning-menu-cache.mjs`

- [ ] **Step 3: Implement cache**

```js
// admin-web/scripts/lib/emenu-local-seasoning-menu-cache.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function menuCacheKeyForHost(host) {
  const normalized = String(host || "").trim().replace(/\/+$/, "").toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

function cachePath(cacheDir, host) {
  return path.join(cacheDir, `emenu-local-seasoning-menu-${menuCacheKeyForHost(host)}.json`);
}

export function readMenuCache(cacheDir, host) {
  const filePath = cachePath(cacheDir, host);
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!parsed?.view?.products || !parsed?.view?.menuGroups) return null;
    return parsed.view;
  } catch {
    return null;
  }
}

export function writeMenuCache(cacheDir, host, view) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = cachePath(cacheDir, host);
  const tempPath = `${filePath}.${process.pid}.tmp`;
  const payload = {
    host: String(host || "").trim().replace(/\/+$/, ""),
    savedAt: new Date().toISOString(),
    view,
  };
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
  return view;
}
```

- [ ] **Step 4: Re-run — expect ok**

- [ ] **Step 5: Commit**

```bash
git add admin-web/scripts/lib/emenu-local-seasoning-menu-cache.mjs admin-web/scripts/verify-emenu-local-seasoning-menu-cache.mjs
git commit -m "feat: add host-scoped seasoning menu cache"
```

---

### Task 3: Menu Provider（live / snapshot / fixture）

**Files:**
- Create: `admin-web/scripts/lib/emenu-local-seasoning-menu-provider.mjs`
- Create: `admin-web/scripts/fixtures/emenu-seasoning-menu-snapshot.json`
- Create: `admin-web/scripts/verify-emenu-local-seasoning-menu-provider.mjs`

**Constants（与契约对齐）:**
- Cookie: `menusifu-emenu-kpos-target`
- Auth: `Authorization: UvDU853J9L351BThAC`
- URL: `${host}/kpos/api/menu/menu?product=EMENU&showInactive=false&showDeleted=false`

- [ ] **Step 1: Write fixture snapshot JSON**（已映射形状，含至少 1 组 1 类 2 菜，ID 用字符串数字）

```json
{
  "menuGroups": [
    {
      "id": "group-main",
      "name": "常规菜单",
      "sortOrder": 10,
      "categories": [
        {
          "id": "cat-hot",
          "name": "热菜",
          "sortOrder": 10,
          "productIds": ["9001", "9002"]
        }
      ]
    }
  ],
  "products": [
    {
      "id": "9001",
      "code": "D9001",
      "name": "宫保鸡丁",
      "categoryId": "cat-hot",
      "categoryName": "热菜",
      "status": "active",
      "emenuSellable": true,
      "sortOrder": 10
    },
    {
      "id": "9002",
      "code": "D9002",
      "name": "鱼香肉丝",
      "categoryId": "cat-hot",
      "categoryName": "热菜",
      "status": "active",
      "emenuSellable": true,
      "sortOrder": 20
    }
  ],
  "categories": [
    { "id": "cat-hot", "name": "热菜", "sortOrder": 10 }
  ],
  "sourceMenuVersion": "snapshot-v1",
  "fingerprint": "kpos:snapshot-v1"
}
```

- [ ] **Step 2: Write failing provider verify**

```js
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(parseKposHostFromCookieHeader(`${EMENU_KPOS_HOST_COOKIE}=http%3A%2F%2F127.0.0.1%3A22080`) === "http://127.0.0.1:22080", "cookie parse");
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
let fetchCalls = 0;
const live = createLiveMenuProvider({
  fetchImpl: async (url, init) => {
    fetchCalls += 1;
    assert(String(url).includes("/kpos/api/menu/menu"), "url path");
    assert(String(url).includes("product=EMENU"), "product param");
    assert(init.headers.Authorization === EMENU_MENU_AUTHORIZATION, "auth");
    throw new Error("network_down");
  },
});

let failed = null;
try {
  await live.resolve({
    req: { headers: { cookie: `${EMENU_KPOS_HOST_COOKIE}=${encodeURIComponent("http://127.0.0.1:22080")}` } },
    cacheDir,
  });
} catch (error) {
  failed = error;
}
assert(failed?.code === "menu_unavailable", "no cache hard fail");

// seed cache then fail fetch → cache hit
const { writeMenuCache } = await import("./lib/emenu-local-seasoning-menu-cache.mjs");
writeMenuCache(cacheDir, "http://127.0.0.1:22080", { ...fixtureView, fingerprint: "cached-fp" });
const cached = await live.resolve({
  req: { headers: { cookie: `${EMENU_KPOS_HOST_COOKIE}=${encodeURIComponent("http://127.0.0.1:22080")}` } },
  cacheDir,
});
assert(cached.fingerprint === "cached-fp" && cached.fromCache === true, "cache fallback");

const okLive = createLiveMenuProvider({
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return {
        menuVersion: "live-1",
        menus: [{
          menuGroups: [{
            id: "g",
            name: "G",
            menuCategories: [{
              id: "c",
              name: "C",
              saleItems: [{ id: "77", name: "菜", itemNumber: "X", price: 1 }],
            }],
          }],
        }],
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
```

- [ ] **Step 3: Run — expect fail**

- [ ] **Step 4: Implement provider**

```js
// admin-web/scripts/lib/emenu-local-seasoning-menu-provider.mjs
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
```

- [ ] **Step 5: Re-run provider verify — expect ok**

- [ ] **Step 6: Commit**

```bash
git add admin-web/scripts/lib/emenu-local-seasoning-menu-provider.mjs admin-web/scripts/fixtures/emenu-seasoning-menu-snapshot.json admin-web/scripts/verify-emenu-local-seasoning-menu-provider.mjs
git commit -m "feat: add seasoning menu providers for live cache and snapshot"
```

---

### Task 4: Handler 接入 Menu Provider

**Files:**
- Modify: `admin-web/scripts/lib/emenu-local-seasoning-api-handler.mjs`
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-api.mjs`
- Modify: `admin-web/package.json`（挂新 verify）

**设计要点:**
1. `handleEmenuSeasoningApi(req, res, dbPath, options = {})` 增加 `options.menuProvider`；默认 `createLiveMenuProvider()`。
2. `attachEmenuSeasoningApi` 传入 `cacheDir = path.join(projectRoot, ".cache")`。
3. 仅菜单相关子路径 resolve 菜单；Option CRUD 不 resolve。
4. `applyMenuView(db, view)` → `{ ...db, products: view.products, menuGroups: view.menuGroups, categories: view.categories }`。
5. `menuSelectionFingerprint` 优先用 `view.fingerprint`。
6. `/snapshot` 的 products/relations 基于菜单视图过滤（排除孤儿）。
7. 校验脚本用 `createFixtureMenuProvider(map from seed)` 或直接用当前 seed 的 `menuGroups/products` 作为 fixture，保证旧断言仍绿。
8. 新增断言：fixture 外 `productId` 关系仍可在 product-groups 出现（孤儿总览），但 `/snapshot` 不含该关系。

- [ ] **Step 1: 在 verify-api 顶部改为注入 fixture**

在 `http.createServer` 调用处改为：

```js
import { createFixtureMenuProvider } from "./lib/emenu-local-seasoning-menu-provider.mjs";
import { createEmenuSeasoningSeedDb } from "./lib/emenu-local-seasoning-seed.mjs";

const seed = createEmenuSeasoningSeedDb();
const menuProvider = createFixtureMenuProvider({
  menuGroups: seed.menuGroups,
  products: seed.products,
  categories: seed.categories,
  sourceMenuVersion: "seed-fixture",
  fingerprint: "seed-fixture",
});

const server = http.createServer((req, res) => {
  handleEmenuSeasoningApi(req, res, dbPath, { menuProvider, cacheDir: tempDir }).then((handled) => {
    if (!handled) {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
});
```

并在文件末尾附近增加孤儿导出用例（在已有 DB 写入后）：

```js
  // orphan relation: product not in menu fixture
  const orphanDb = readDb(dbPath);
  orphanDb.relations.push({
    id: "r-orphan",
    productId: "p-does-not-exist",
    action: "ADD",
    optionId: orphanDb.options[0].id,
    priceDelta: 0,
    sortOrder: 10,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  writeDb(dbPath, orphanDb);
  const snapshot = await fetch(`${base}/snapshot`).then((r) => r.json());
  assert(!snapshot.products.some((p) => p.id === "p-does-not-exist"), "snapshot excludes orphan products");
  assert(!snapshot.relations.some((r) => r.productId === "p-does-not-exist"), "snapshot excludes orphan relations");
```

- [ ] **Step 2: Run `node scripts/verify-emenu-local-seasoning-api.mjs` — expect fail**（尚无 options 参数 / 仍读 seed 内嵌但未排除孤儿也可先红在新断言）

- [ ] **Step 3: Wire handler**

在 handler 顶部增加 import 与辅助函数：

```js
import { createLiveMenuProvider } from "./emenu-local-seasoning-menu-provider.mjs";

function applyMenuView(db, view) {
  return {
    ...db,
    products: view.products,
    menuGroups: view.menuGroups,
    categories: view.categories?.length ? view.categories : db.categories,
    __menuFingerprint: view.fingerprint,
    __menuFromCache: Boolean(view.fromCache),
    __menuSource: view.source,
  };
}

function isMenuDependentPath(method, sub) {
  if (sub === "/bootstrap") return true;
  if (sub === "/menu-structure") return true;
  if (sub === "/products") return true;
  if (sub.startsWith("/products/")) return true;
  if (sub.startsWith("/product-selections")) return true;
  if (sub.startsWith("/relation-previews")) return true;
  if (sub.startsWith("/relations")) return true;
  if (sub === "/snapshot") return true;
  if (method === "POST" && sub === "/relations/batch") return true;
  return false;
}
```

改签名与主流程：

```js
export async function handleEmenuSeasoningApi(req, res, dbPath, options = {}) {
  const url = new URL(req.url || "/", "http://localhost");
  // ... existing prefix check ...
  const menuProvider = options.menuProvider ?? createLiveMenuProvider();
  const cacheDir = options.cacheDir ?? path.dirname(dbPath);
  try {
    let db = loadEmenuSeasoningDb(dbPath);
    const method = req.method || "GET";
    const sub = url.pathname.slice(API_PREFIX.length) || "/";
    if (isMenuDependentPath(method, sub)) {
      const view = await menuProvider.resolve({ req, cacheDir });
      db = applyMenuView(db, view);
      if (view.fromCache) res.setHeader("X-Seasoning-Menu-Cache", "1");
    }
    // ... rest unchanged, but menuSelectionFingerprint should use db.__menuFingerprint when present ...
```

改指纹：

```js
function menuSelectionFingerprint(db) {
  if (db.__menuFingerprint) return db.__menuFingerprint;
  // existing hash logic...
}
```

`/snapshot` 保持用当前 `db.products`（已是菜单视图）过滤 relations —— 孤儿自然排除。

`attachEmenuSeasoningApi`：

```js
export function attachEmenuSeasoningApi(middlewares, projectRoot) {
  const dbPath = path.join(projectRoot, ".cache", "emenu-local-seasoning-db.json");
  const cacheDir = path.join(projectRoot, ".cache");
  middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (!pathname.startsWith(API_PREFIX)) {
      next();
      return;
    }
    handleEmenuSeasoningApi(req, res, dbPath, { cacheDir }).then((handled) => {
      if (!handled) next();
    }).catch((error) => {
      const status = error.statusCode || 500;
      sendJson(res, status, error.payload ?? { error: "internal", message: String(error?.message || error) });
    });
  });
}
```

- [ ] **Step 4: Run API verify — expect pass**

Run: `node scripts/verify-emenu-local-seasoning-api.mjs`

- [ ] **Step 5: Hook package.json**

在 `verify:emenu-local-seasoning` 脚本中、`verify-emenu-local-seasoning-api.mjs` 之前插入：

`node scripts/verify-emenu-local-seasoning-menu-map.mjs && node scripts/verify-emenu-local-seasoning-menu-cache.mjs && node scripts/verify-emenu-local-seasoning-menu-provider.mjs &&`

- [ ] **Step 6: Commit**

```bash
git add admin-web/scripts/lib/emenu-local-seasoning-api-handler.mjs admin-web/scripts/verify-emenu-local-seasoning-api.mjs admin-web/package.json
git commit -m "feat: serve seasoning menu routes from injectable menu provider"
```

---

### Task 5: Browser 演示恒快照 + 重新生成 handler

**Files:**
- Modify: `admin-web/scripts/generate-emenu-local-seasoning-browser-handler.mjs`（若 browser 无法 `import` 新模块，改为在生成时内联或改写 import 路径）
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-browser-runtime.ts` / browser transport 调用处
- Regenerate: `admin-web/src/emenu-local/seasoning/generated/seasoning-browser-handler.ts`

**做法:**
1. 生成器增加对 `./emenu-local-seasoning-menu-*.mjs` import 的路径改写到 `scripts/lib/...`（与 seed 相同模式）。
2. Browser 适配层在调用 `handleEmenuSeasoningApi` 时传入 `createSnapshotMenuProvider(snapshotPath)`；snapshot 内容可打包进 runtime 常量（若 browserFs 读仓库 fixtures 不便，则在 `seasoning-browser-runtime.ts` `import snapshot from '../../../scripts/fixtures/emenu-seasoning-menu-snapshot.json'` 并 `createFixtureMenuProvider(snapshot)`）。
3. **禁止** browser 路径使用 `createLiveMenuProvider`。

- [ ] **Step 1: 找到 browser 调用 handle 的位置并改为传入 snapshot/fixture provider**

Search: `handleEmenuSeasoningApi` in `admin-web/src/emenu-local/seasoning/`

- [ ] **Step 2: Update generator import rewrites if needed**

```js
source = source
  .replace('from "./emenu-local-seasoning-seed.mjs";', 'from "../../../../scripts/lib/emenu-local-seasoning-seed.mjs";')
  .replace('from "./emenu-local-seasoning-menu-provider.mjs";', 'from "../../../../scripts/lib/emenu-local-seasoning-menu-provider.mjs";')
  .replace('from "./emenu-local-seasoning-menu-map.mjs";', 'from "../../../../scripts/lib/emenu-local-seasoning-menu-map.mjs";')
  .replace('from "./emenu-local-seasoning-menu-cache.mjs";', 'from "../../../../scripts/lib/emenu-local-seasoning-menu-cache.mjs";');
```

（仅当 handler 顶层 import 了这些模块时需要；live provider 的 `node:fs` 缓存不要在 browser 执行路径触发。）

- [ ] **Step 3: Regenerate + browser mode verify**

Run:

```bash
node scripts/generate-emenu-local-seasoning-browser-handler.mjs
npx tsx scripts/verify-emenu-local-seasoning-browser-mode.ts
```

Expected: pass；browser 路径不发起真实 `/menu/menu`。

- [ ] **Step 4: Commit**

```bash
git add admin-web/scripts/generate-emenu-local-seasoning-browser-handler.mjs admin-web/src/emenu-local/seasoning admin-web/scripts/fixtures
git commit -m "feat: bind browser seasoning demo to static menu snapshot"
```

---

### Task 6: UI 错误码与缓存提示

**Files:**
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-api-error.ts`（若有错误码集合）
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-store.ts` / `seasoning-batch-wizard-ui.ts` / `seasoning-page.ts`
- Modify: `admin-web/src/i18n.ts`（中英文案）
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-settings.mjs`（断言文案键或错误分支存在）

- [ ] **Step 1: 增加 i18n**

```ts
"seasoning.menuUnavailable": "无法加载门店菜单，请检查主机后重试",
"seasoning.menuUsingCache": "菜单服务暂不可用，正在使用缓存菜单",
// en:
"seasoning.menuUnavailable": "Couldn't load the store menu. Check the host and retry.",
"seasoning.menuUsingCache": "Menu service unavailable; using cached menu",
```

- [ ] **Step 2: Store/页面识别 `menu_unavailable`**

在 `SeasoningApiError` 处理中：若 `error.code === "menu_unavailable"`，展示 `t("seasoning.menuUnavailable")` + 重试，不展示 seed 假数据。

若响应头 / JSON 带 `fromCache` 或 `X-Seasoning-Menu-Cache: 1`，总览或批量第一步 toast `t("seasoning.menuUsingCache")`（轻量一次即可）。

实现建议：handler 在缓存命中时于 JSON 根级可选增加 `menuSource: "cache"`（仅 bootstrap 与 menu-structure），避免 CORS 暴露自定义头问题；若只设 header，确保前端 `client` 能读到。

最小足够：`menu-structure` 响应增加可选字段：

```js
{ ..., menuSource: db.__menuSource, menuFromCache: db.__menuFromCache }
```

前端读到 `menuFromCache` 则 toast。

- [ ] **Step 3: settings verify 断言新文案键存在**

- [ ] **Step 4: Commit**

```bash
git add admin-web/src/emenu-local/seasoning admin-web/src/i18n.ts admin-web/scripts/verify-emenu-local-seasoning-settings.mjs admin-web/scripts/lib/emenu-local-seasoning-api-handler.mjs
git commit -m "feat: surface seasoning menu unavailable and cache states in UI"
```

---

### Task 7: 全量校验与手工验收清单

- [ ] **Step 1: Run**

```bash
cd admin-web
npm run verify:emenu-local-seasoning
```

Expected: all green

- [ ] **Step 2: Manual checklist（本地 Vite）**

1. 设置与嵌入 eMenu 相同主机 IP，打开调味 → 批量建立关联：组/类/菜 ID/名称与嵌入 eMenu（未按时段过滤）可对上。
2. 停掉 POS / 填错主机：有缓存时可继续并提示缓存；清 `.cache/emenu-local-seasoning-menu-*.json` 后出现不可用空态，无宫保 seed 假菜单。
3. Option 库在菜单不可用时仍可打开维护（不依赖 `/menu-structure`）。
4. 换主机后菜单不串缓存。
5. GitHub Pages / browser 模式：网络无真实 `/kpos/api/menu/menu`。

- [ ] **Step 3: Sync 主工作区 `admin-web/` 同源文件（worktree 双写规则）**

- [ ] **Step 4: Final commit if leftover**

```bash
git status
# commit any remaining verify/docs sync
```

---

## Self-review (spec coverage)

| Spec requirement | Task |
| --- | --- |
| KPOS `/kpos/api/menu/menu` + EMENU params + no hour filter | Task 3 |
| Cookie host + static Authorization + no sessionKey | Task 3 |
| Map groups/categories/products + hide hidden/no-price | Task 1 |
| Host-scoped cache; fail soft then hard | Task 2–3 |
| All seasoning menu consumers via provider | Task 4 |
| Demo snapshot only | Task 5 |
| Orphans visible in overview, excluded from terminal snapshot | Task 4 |
| UI errors / cache hint | Task 6 |
| Verify automation | Task 1–4, 7 |

**Placeholder scan:** none intentional.  
**Type consistency:** `fingerprint` / `fromCache` / `source` / `menu_unavailable` used consistently across tasks.

---

## Execution handoff

Plan complete and saved to `admin-web/docs/superpowers/plans/2026-08-16-emenu-seasoning-kpos-menu-source-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — 每个 Task 派一个新子代理，Task 之间复查，迭代快  
2. **Inline Execution** — 本会话按 executing-plans 连续执行并设检查点  

Which approach?
