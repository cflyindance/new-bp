# 商家后台选商品对齐 KPOS 菜单数据源 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 商家后台组/类/菜选择器与调味选商品共用 Menu Catalog：有主机则按产线拉 KPOS `/menu/menu`，失败用「主机+产线」缓存，再失败回退静态；产线列增加 POS；调味不再 `menu_unavailable` 硬失败。

**Architecture:** 扩展一期 map/cache/provider 为按 `product` 隔离的 Catalog。Vite 增加只读目录 API 给品牌选择器注入树；调味 handler 在无主机/无缓存时保留 seed。选择器收集勾选时 union 当前树外旧 key。

**Tech Stack:** Node ESM、现有 seasoning handler / Vite middleware、品牌菜单选择器 TS、`node` assert 校验脚本。

**Spec:** `admin-web/docs/superpowers/specs/2026-08-17-merchant-product-picker-kpos-menu-source-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| `admin-web/scripts/lib/emenu-local-seasoning-menu-cache.mjs` | 缓存键 = 主机 + product；旧无 product 文件仅当 EMENU |
| `admin-web/scripts/lib/emenu-local-seasoning-menu-map.mjs` | 新增 `mapSeasoningViewToBrandMenuTree` |
| `admin-web/scripts/lib/emenu-local-seasoning-menu-provider.mjs` | `product` 入参；无主机/失败无缓存返回 staticView，不抛 |
| `admin-web/scripts/lib/emenu-local-menu-catalog.mjs` | Catalog：解析 product、调静态/live、输出树+source |
| `admin-web/scripts/lib/emenu-local-menu-catalog-api-handler.mjs` | Vite `GET /api/v1/emenu-local/menu-catalog?product=` |
| `admin-web/scripts/lib/emenu-local-seasoning-api-handler.mjs` | resolve 带 product=EMENU 与 seed staticView |
| `admin-web/vite.config.ts` | attach catalog API |
| `admin-web/src/config/brand-menu-structure-picker-ui.ts` | POS 列；注入树；收集勾选保留树外 key |
| `admin-web/src/config/brand-menu-catalog-client.ts` | 浏览器拉 catalog，失败用静态树 |
| `admin-web/src/config/module-settings-store-brand-management-ui.ts` | empty/coerce 含 pos |
| `admin-web/src/i18n.ts` | 静态回退提示 |
| `admin-web/src/emenu-local/seasoning/*` | 去掉硬失败空态；source=static/cache 提示 |
| `admin-web/scripts/verify-emenu-local-seasoning-menu-*.mjs` | 缓存隔离、static 回退、品牌树映射 |
| `admin-web/scripts/verify-brand-menu-structure-picker.mjs` | POS + 树外 key 保留（若已有则扩展） |

---

### Task 1: 缓存按主机+产线隔离

**Files:**
- Modify: `admin-web/scripts/lib/emenu-local-seasoning-menu-cache.mjs`
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-menu-cache.mjs`

- [ ] **Step 1: 扩展 verify**

在现有脚本末尾 `console.log` 前增加：

```js
import {
  menuCacheKeyForHost,
  normalizeMenuProduct,
  readMenuCache,
  writeMenuCache,
} from "./lib/emenu-local-seasoning-menu-cache.mjs";

assert(normalizeMenuProduct("kiosk") === "KIOSK", "normalize kiosk");
assert(normalizeMenuProduct("EMENU") === "EMENU", "normalize emenu");
assert(normalizeMenuProduct("nope") === "EMENU", "invalid product defaults EMENU");

writeMenuCache(dir, hostA, { ...view, fingerprint: "emenu-fp" }, "EMENU");
writeMenuCache(dir, hostA, { ...view, fingerprint: "kiosk-fp" }, "KIOSK");
assert(readMenuCache(dir, hostA, "EMENU")?.fingerprint === "emenu-fp", "emenu cache");
assert(readMenuCache(dir, hostA, "KIOSK")?.fingerprint === "kiosk-fp", "kiosk isolated");
assert(readMenuCache(dir, hostA, "POS") === null, "missing product null");

const legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), "seasoning-menu-legacy-"));
const legacyPath = path.join(legacyDir, `emenu-local-seasoning-menu-${menuCacheKeyForHost(hostA)}.json`);
fs.writeFileSync(legacyPath, JSON.stringify({ host: hostA, view: { ...view, fingerprint: "legacy-fp" } }), "utf8");
assert(readMenuCache(legacyDir, hostA, "EMENU")?.fingerprint === "legacy-fp", "legacy file is EMENU only");
assert(readMenuCache(legacyDir, hostA, "KIOSK") === null, "legacy not reused for KIOSK");
```

- [ ] **Step 2: 跑 verify，确认失败**

Run: `node scripts/verify-emenu-local-seasoning-menu-cache.mjs`  
Cwd: `admin-web`  
Expected: FAIL — `normalizeMenuProduct` missing / 签名不匹配

- [ ] **Step 3: 实现缓存**

```js
export const MENU_PRODUCTS = ["EMENU", "KIOSK", "POS", "SDI"];

export function normalizeMenuProduct(value) {
  const raw = String(value || "EMENU").trim().toUpperCase();
  return MENU_PRODUCTS.includes(raw) ? raw : "EMENU";
}

function cachePath(cacheDir, host, product) {
  const prod = normalizeMenuProduct(product);
  return path.join(cacheDir, `emenu-local-menu-${menuCacheKeyForHost(host)}-${prod}.json`);
}

function legacyCachePath(cacheDir, host) {
  return path.join(cacheDir, `emenu-local-seasoning-menu-${menuCacheKeyForHost(host)}.json`);
}

export function readMenuCache(cacheDir, host, product = "EMENU") {
  const prod = normalizeMenuProduct(product);
  const paths = [cachePath(cacheDir, host, prod)];
  if (prod === "EMENU") paths.push(legacyCachePath(cacheDir, host));
  for (const filePath of paths) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!parsed?.view?.products || !parsed?.view?.menuGroups) continue;
      if (parsed.product && normalizeMenuProduct(parsed.product) !== prod) continue;
      return parsed.view;
    } catch {
      continue;
    }
  }
  return null;
}

export function writeMenuCache(cacheDir, host, view, product = "EMENU") {
  const prod = normalizeMenuProduct(product);
  fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = cachePath(cacheDir, host, prod);
  const tempPath = `${filePath}.${process.pid}.tmp`;
  const payload = {
    host: String(host || "").trim().replace(/\/+$/, ""),
    product: prod,
    savedAt: new Date().toISOString(),
    view,
  };
  try {
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tempPath, filePath);
  } finally {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
  }
  return view;
}
```

保留 `menuCacheKeyForHost`。`writeMenuCache` 第四参默认 `EMENU`，现有 `writeMenuCache(dir, host, view)` 调用仍合法。

- [ ] **Step 4: 再跑 verify，须 PASS**

---

### Task 2: 调味视图 → 品牌树

**Files:**
- Modify: `admin-web/scripts/lib/emenu-local-seasoning-menu-map.mjs`
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-menu-map.mjs`

- [ ] **Step 1: verify 增加**

```js
import { mapKposMenusToSeasoningView, mapSeasoningViewToBrandMenuTree } from "./lib/emenu-local-seasoning-menu-map.mjs";

const tree = mapSeasoningViewToBrandMenuTree(view);
assert(tree[0].id === "g1" && tree[0].categories[0].id === "c1", "group/category ids");
assert(tree[0].categories[0].dishes[0].id === "1001", "dish id from saleItem");
assert(tree[0].categories[0].dishes[0].name === "宫保鸡丁", "dish name");
```

- [ ] **Step 2: 实现**

```js
export function mapSeasoningViewToBrandMenuTree(view) {
  const productsById = new Map((view?.products ?? []).map((p) => [String(p.id), p]));
  return (view?.menuGroups ?? []).map((group) => ({
    id: String(group.id),
    name: String(group.name ?? ""),
    categories: (group.categories ?? []).map((category) => ({
      id: String(category.id),
      name: String(category.name ?? ""),
      dishes: (category.productIds ?? [])
        .map((id) => productsById.get(String(id)))
        .filter(Boolean)
        .map((product) => ({ id: String(product.id), name: String(product.name ?? "") })),
    })).filter((category) => category.dishes.length > 0),
  })).filter((group) => group.categories.length > 0);
}
```

- [ ] **Step 3: verify PASS**

---

### Task 3: live provider 支持 product + static 回退

**Files:**
- Modify: `admin-web/scripts/lib/emenu-local-seasoning-menu-provider.mjs`
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-menu-provider.mjs`

- [ ] **Step 1: 改 verify**

- 无 cookie：不再断言 `menu_unavailable`，改为 `source === "static"` 且 `products` 来自传入 `staticView`。
- live URL 须含调用方传入的 `product=`（默认 EMENU）。
- 失败无缓存：`source === "static"`。
- 失败有缓存：仍 `source === "cache"`。
- 两次 fetch：`product=KIOSK` 与 `product=EMENU` 不得读到对方缓存。

`createLiveMenuProvider({ fetchImpl, staticView })`：

```js
async resolve({ req, cacheDir, product } = {}) {
  const prod = normalizeMenuProduct(product);
  const host = parseKposHostFromCookieHeader(req?.headers?.cookie || req?.headers?.Cookie || "");
  const fallback = () => ({ ...(staticView || emptyView), fromCache: false, source: "static", product: prod });
  if (!host) return fallback();
  const url = `${host}/kpos/api/menu/menu?product=${encodeURIComponent(prod)}&showInactive=false&showDeleted=false`;
  try {
    // 现有 fetch + map
    writeMenuCache(cacheDir, host, mapped, prod);
    return { ...mapped, fromCache: false, source: "live", product: prod };
  } catch {
    const cached = readMenuCache(cacheDir, host, prod);
    if (cached) return { ...cached, fromCache: true, source: "cache", product: prod };
    return fallback();
  }
}
```

`emptyView = { menuGroups: [], products: [], categories: [], fingerprint: "static", sourceMenuVersion: null }`。

保留 `menuUnavailable` 导出但 live 路径不再抛给选品。

- [ ] **Step 2: 实现并跑** `node scripts/verify-emenu-local-seasoning-menu-provider.mjs`

---

### Task 4: 调味 handler 注入 seed staticView

**Files:**
- Modify: `admin-web/scripts/lib/emenu-local-seasoning-api-handler.mjs`
- Modify: `admin-web/scripts/generate-emenu-local-seasoning-browser-handler.mjs`（若复制了 resolve 逻辑）
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-store.ts`
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts`
- Modify: `admin-web/src/i18n.ts`
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-settings.mjs`
- Modify: `admin-web/scripts/verify-emenu-local-seasoning-api.mjs`（若断言硬失败）

- [ ] **Step 1:** `isMenuDependentPath` 分支改为：

```js
const seedView = {
  products: db.products,
  menuGroups: menuGroups(db),
  categories: db.categories,
  fingerprint: menuSelectionFingerprint(db),
  sourceMenuVersion: null,
};
const view = await menuProvider.resolve({
  req,
  cacheDir,
  product: "EMENU",
  staticView: seedView,
});
// createLiveMenuProvider 的 staticView 在 factory 上；此处若 provider 已闭包 staticView，则 handler 改为：
```

更干净：`createLiveMenuProvider({ fetchImpl, getStaticView })` 不够。handler 这样写：

```js
const view = await menuProvider.resolve({ req, cacheDir, product: "EMENU" });
if (view.source === "static") {
  db = { ...db, __menuSource: "static", __menuFromCache: false };
} else {
  db = applyMenuView(db, view);
}
if (view.fromCache) res.setHeader("X-Seasoning-Menu-Cache", "1");
if (view.source) res.setHeader("X-Seasoning-Menu-Source", view.source);
```

无主机时 live provider 返回空 static；handler 检测到 `source==="static"` **不覆盖** seed。有缓存/live 则 `applyMenuView`。

- [ ] **Step 2:** UI：`menu_unavailable` 不再作为选品阻断。`menuFromCache` 仍提示 `seasoning.menuUsingCache`。`source=static` 且本有主机意图时提示 `seasoning.menuUsingStatic`（中英）。无主机默认静态可不提示。

若响应带 `X-Seasoning-Menu-Source: static` 且 cookie 有主机 → 显示静态提示。浏览器侧从 API JSON 带 `menuSource` 更稳：在 `/menu-structure` 与 `/relations/products` 响应加 `menuSource` / `menuFromCache`（若尚无）。

检查现有 `/menu-structure` JSON，有则复用；无则加 `menuSource` 字段，UI 读取。

- [ ] **Step 3:** verify-settings 删除「必须映射 menu_unavailable 硬失败」中与空态阻断相关的断言；保留 cache 提示。跑 `npm run verify:emenu-local-seasoning`。

---

### Task 5: 选择器 POS 列 + 注入树 + 保留树外 key

**Files:**
- Modify: `admin-web/src/config/brand-menu-structure-picker-ui.ts`
- Modify: `admin-web/src/config/module-settings-store-brand-management-ui.ts`（`empty`/`coerce` 字面量含 pos）
- Create or modify verify：`admin-web/scripts/verify-brand-menu-structure-picker.mjs`（搜现有 verify 文件名，有则扩展）

- [ ] **Step 1:** `BRAND_MENU_LINE_OPTIONS` 增加 `{ id: "pos", label: "POS" }`。`emptyBrandMenuStructureByLine` 返回 `{ kiosk: [], emenu: [], sdi: [], pos: [] }`。`cloneBrandMenuStructureByLine` / `coerce` 旧 keys 复制到四条产线。`BRAND_MENU_STRUCTURE_BY_LINE.pos` 与 emenu 相同裁剪，菜名后缀 `（POS）`。

- [ ] **Step 2:** 导出

```ts
export function collectBrandMenuTreeKeys(tree: BrandMenuGroupNode[]): Set<string> {
  const keys = new Set<string>();
  for (const g of tree) {
    keys.add(groupKey(g.id));
    for (const c of g.categories) {
      keys.add(categoryKey(g.id, c.id));
      for (const d of c.dishes) keys.add(dishKey(g.id, c.id, d.id));
    }
  }
  return keys;
}

export function mergeKeysOutsideTree(prevKeys: string[], nextKeys: string[], tree: BrandMenuGroupNode[]): string[] {
  const inTree = collectBrandMenuTreeKeys(tree);
  const outside = prevKeys.filter((k) => !inTree.has(k));
  return [...new Set([...outside, ...nextKeys])];
}
```

`bindBrandMenuStructurePicker` 的 change 里，`selectionToKeys` 之后：

```ts
const nextKeys = mergeKeysOutsideTree(prevKeys, selectionToKeys(nextSelection), tree);
```

`enableLines` 分支对 `byLine[activeLine]` 同样处理。

- [ ] **Step 3:** 注入树

`RenderBrandMenuStructurePickerOptions` 增加 `tree?: BrandMenuGroupNode[]` 与 `menuSource?: "live" | "cache" | "static" | "snapshot"`。`resolveTree` / `renderBrandMenuStructurePickerHtml` / `resolvePickerTree` 优先用 options.tree / `picker` 上 `data-brand-menu-tree` JSON。rerender 必须把当前 tree 传回去（存在 `picker.dataset.brandMenuTree`）。

- [ ] **Step 4:** 写/扩 verify：POS 在 empty 中；mergeKeysOutsideTree 保留 `d:old:x:y`；跑 PASS。

---

### Task 6: Catalog API + 选择器拉树

**Files:**
- Create: `admin-web/scripts/lib/emenu-local-menu-catalog.mjs`
- Create: `admin-web/scripts/lib/emenu-local-menu-catalog-api-handler.mjs`
- Create: `admin-web/scripts/verify-emenu-local-menu-catalog.mjs`
- Create: `admin-web/src/config/brand-menu-catalog-client.ts`
- Modify: `admin-web/vite.config.ts` attach catalog
- Modify: picker bind 打开/切产线时 fetch
- Modify: `admin-web/package.json` 把 catalog verify 挂进合适 script（可并入 `verify:emenu-local-seasoning` 或单独 `verify:brand-menu-catalog`）

- [ ] **Step 1: Catalog**

```js
export function lineIdToMenuProduct(lineId) {
  const map = { kiosk: "KIOSK", emenu: "EMENU", pos: "POS", sdi: "SDI" };
  return map[lineId] || "EMENU";
}

export async function resolveMenuCatalog({ req, cacheDir, product, menuProvider, staticTree }) {
  const prod = normalizeMenuProduct(product);
  const view = await menuProvider.resolve({ req, cacheDir, product: prod });
  if (view.source === "live" || view.source === "cache") {
    return {
      tree: mapSeasoningViewToBrandMenuTree(view),
      source: view.source,
      fromCache: Boolean(view.fromCache),
      product: prod,
    };
  }
  return { tree: staticTree, source: "static", fromCache: false, product: prod };
}
```

API：`GET /api/v1/emenu-local/menu-catalog?product=KIOSK`
Cookie 同调味。响应 `{ tree, source, fromCache, product }`。GitHub Pages 无此 API。

静态树：handler 不读 TS 的 `BRAND_MENU_STRUCTURE_*`。浏览器 client 在 fetch 失败或 404 时用本地 `BRAND_MENU_STRUCTURE_BY_LINE` / `TREE`。Vite API 在 `source=static` 时可返回 `tree: null`，让前端用本地静态，避免在 Node 复制一份 TS 树。

约定：**API `source=static` 时 `tree` 为 `null`**，前端用本地预设。live/cache 才返回映射树。

- [ ] **Step 2: `brand-menu-catalog-client.ts`**

```ts
export async function fetchBrandMenuCatalog(product: string): Promise<{
  tree: BrandMenuGroupNode[] | null;
  source: "live" | "cache" | "static";
}> {
  try {
    const res = await fetch(`/api/v1/emenu-local/menu-catalog?product=${encodeURIComponent(product)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return { tree: null, source: "static" };
    const body = await res.json();
    if (body.source === "live" || body.source === "cache") {
      return { tree: body.tree, source: body.source };
    }
    return { tree: null, source: "static" };
  } catch {
    return { tree: null, source: "static" };
  }
}
```

选择器宿主：不要改 11 个 settings 文件各写一遍。在 `bindBrandMenuStructurePicker` 启动时根据 `enableLines` / `treeLineId` / 默认 EMENU 拉 catalog，写入 dataset 后 rerender。切产线先 fetch 再 rerender。

无产线上下文：`product=EMENU`；`tree===null` 时用 `BRAND_MENU_STRUCTURE_TREE`。有产线：`tree===null` 时用 `BRAND_MENU_STRUCTURE_BY_LINE[line]`。

轻量提示：`source=cache` / （fetch 成功但 static 且 document.cookie 含 kpos-target）显示 i18n。

- [ ] **Step 3:** vite `attachEmenuMenuCatalogApi(server.middlewares, process.cwd())` 与 seasoning 并列。verify 用 fixture provider 断言 live 返回 tree、无 cookie 返回 source static tree null。

---

### Task 7: 回归校验

- [ ] `npm run verify:emenu-local-seasoning` PASS
- [ ] 新 catalog / picker verify PASS
- [ ] 生成 browser handler（若 Task 4 改了 handler 源）
- [ ] 抽查：`emptyBrandMenuStructureByLine` 字面量无遗漏 `pos`（store-brand-management）

---

## Spec coverage

| Spec | Task |
| --- | --- |
| 共享 Catalog、product 四值 | 3, 6 |
| 缓存主机+产线、旧 EMENU 兼容 | 1 |
| 无主机/失败→静态，不硬失败 | 3, 4 |
| picker 按产线 / treeLineId / 默认 EMENU | 6 |
| POS 列与 BrandMenuLineId 副作用 | 5 |
| 树外 key 在收集勾选时保留 | 5 |
| 调味固定 EMENU、seed 回退、cache 提示 | 4 |
| GitHub Pages 不连 KPOS | 6 client catch → static |
| 不做时段过滤、不映射静态 ID | 不实现 |
