# eMenu / Kiosk 本地配置 UI 中英文切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 eMenu / Kiosk 本地配置后台支持中英文界面切换，默认中文；壳层与本地原生页走全局 `i18n`，嵌入 iframe 经 URL/`emenu_lang` 跟随。

**Architecture:** 抽出公共 `ui-locale-control`（与商家后台共用 `menusifu-admin-ui-locale`）。本地壳层顶栏在主题按钮左侧挂同一控件；切换后 `setUiLocale` → `applyUiLocaleToDocument` → `menusifu:ui-locale-change` → remount。iframe `src` 追加 `language=zh-cn|en`；eMenu 同源再写入 `localStorage.emenu_lang`（因当前 embed 启动读的是该键，而非查询串）。

**Tech Stack:** TypeScript、现有 `admin-web/src/i18n.ts`、Vite 壳层 HTML 字符串渲染、`npx tsx` + `node:assert` 校验脚本

**Spec:** `admin-web/docs/superpowers/specs/2026-08-16-emenu-kiosk-local-ui-locale-design.md`

**Worktree:** `admin-web-emenu-kiosk-local-i18n` / 分支 `wt/emenu-kiosk-local-i18n`。每步业务改动须 **双写** 到主工作区 `new-bp/admin-web/`（`sync-worktree-and-dev`）。

---

## File map

| File | Responsibility |
|------|----------------|
| `admin-web/src/shell/ui-locale-control.ts` | 公共语言下拉 render + bind |
| `admin-web/src/shell/embed-ui-locale.ts` | `zh`/`en` → embed `language`、拼 iframe query、写 `emenu_lang` |
| `admin-web/src/main.ts` | 商家后台改用公共控件 |
| `admin-web/src/shell/emenu-local-shell.ts` | 顶栏挂控件；iframe src 带 language；文案键 |
| `admin-web/src/shell/kiosk-local-shell.ts` | 同上（去掉写死的 `language=zh-cn`） |
| `admin-web/src/i18n.ts` | 壳层/调味补键 |
| `admin-web/src/emenu-local/seasoning/*.ts` | 硬编码中文 → `t()`/`tf()` |
| `admin-web/scripts/verify-emenu-kiosk-local-ui-locale.ts` | 静态断言控件、映射、iframe 拼接、禁止硬编码 Local configuration |

---

### Task 1: 嵌入语言映射 helper + 失败校验

**Files:**
- Create: `admin-web/src/shell/embed-ui-locale.ts`
- Create: `admin-web/scripts/verify-emenu-kiosk-local-ui-locale.ts`

- [ ] **Step 1: 写校验脚本（此时应失败：helper 尚不存在）**

```typescript
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const helperPath = join(root, "src/shell/embed-ui-locale.ts");
assert.ok(existsSync(helperPath), "embed-ui-locale.ts must exist");

const helper = readFileSync(helperPath, "utf8");
assert.match(helper, /export function uiLocaleToEmbedLanguage/);
assert.match(helper, /export function withEmbedLanguageParam/);
assert.match(helper, /export function syncEmenuLangStorage/);
assert.match(helper, /zh-cn/);
assert.match(helper, /emenu_lang/);

console.log("embed-ui-locale presence check passed (partial).");
```

- [ ] **Step 2: 运行确认 RED**

Run: `npx tsx scripts/verify-emenu-kiosk-local-ui-locale.ts`  
Expected: FAIL — `embed-ui-locale.ts must exist`（或后续断言失败）

- [ ] **Step 3: 实现 helper**

```typescript
import type { UiLocale } from "../i18n";
import { getUiLocale } from "../i18n";

/** 壳层 zh/en → 嵌入端 URL language（Kiosk Lite 约定） */
export function uiLocaleToEmbedLanguage(locale: UiLocale = getUiLocale()): "zh-cn" | "en" {
  return locale === "en" ? "en" : "zh-cn";
}

/** eMenu i18n 码：localStorage emenu_lang 存 JSON 字符串 "zh" | "en" */
export function uiLocaleToEmenuLang(locale: UiLocale = getUiLocale()): "zh" | "en" {
  return locale === "en" ? "en" : "zh";
}

/**
 * 在已有 iframe URL 上写入/覆盖 language 查询参数。
 * 支持 `...?a=1#/hash`：language 落在 search，不破坏 hash。
 */
export function withEmbedLanguageParam(src: string, locale: UiLocale = getUiLocale()): string {
  const language = uiLocaleToEmbedLanguage(locale);
  const hashIndex = src.indexOf("#");
  const beforeHash = hashIndex >= 0 ? src.slice(0, hashIndex) : src;
  const hash = hashIndex >= 0 ? src.slice(hashIndex) : "";
  const qIndex = beforeHash.indexOf("?");
  const path = qIndex >= 0 ? beforeHash.slice(0, qIndex) : beforeHash;
  const query = qIndex >= 0 ? beforeHash.slice(qIndex + 1) : "";
  const params = new URLSearchParams(query);
  params.set("language", language);
  const nextQuery = params.toString();
  return `${path}?${nextQuery}${hash}`;
}

/** 同源 eMenu iframe 启动读 emenu_lang；切换语言时先写再 remount。 */
export function syncEmenuLangStorage(locale: UiLocale = getUiLocale()): void {
  try {
    localStorage.setItem("emenu_lang", JSON.stringify(uiLocaleToEmenuLang(locale)));
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 4: 扩展校验脚本为完整断言并跑 GREEN**

把 `scripts/verify-emenu-kiosk-local-ui-locale.ts` 换成：

```typescript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  uiLocaleToEmbedLanguage,
  uiLocaleToEmenuLang,
  withEmbedLanguageParam,
} from "../src/shell/embed-ui-locale";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

assert.equal(uiLocaleToEmbedLanguage("zh"), "zh-cn");
assert.equal(uiLocaleToEmbedLanguage("en"), "en");
assert.equal(uiLocaleToEmenuLang("zh"), "zh");
assert.equal(uiLocaleToEmenuLang("en"), "en");

assert.equal(
  withEmbedLanguageParam("./emenu-new/index.html?embedded=1&v=1", "zh"),
  "./emenu-new/index.html?embedded=1&v=1&language=zh-cn",
);
assert.equal(
  withEmbedLanguageParam("./emenu-new/index.html?embedded=1&v=1#/setting", "en"),
  "./emenu-new/index.html?embedded=1&v=1&language=en#/setting",
);
assert.equal(
  withEmbedLanguageParam(
    "./kpos/kiosklite/index.html?embedded=1&language=zh-cn&v=1#/configApp",
    "en",
  ),
  "./kpos/kiosklite/index.html?embedded=1&language=en&v=1#/configApp",
);

const control = readFileSync(join(root, "src/shell/ui-locale-control.ts"), "utf8");
assert.match(control, /export function renderUiLocaleControl/);
assert.match(control, /export function bindUiLocaleControl/);
assert.match(control, /global-ui-locale/);

for (const shell of ["emenu-local-shell.ts", "kiosk-local-shell.ts"] as const) {
  const src = readFileSync(join(root, "src/shell", shell), "utf8");
  assert.match(src, /renderUiLocaleControl/);
  assert.match(src, /bindUiLocaleControl/);
  assert.match(src, /withEmbedLanguageParam/);
  assert.doesNotMatch(src, /Local configuration/);
}

const main = readFileSync(join(root, "src/main.ts"), "utf8");
assert.match(main, /from ["'].*shell\/ui-locale-control/);
assert.doesNotMatch(main, /function renderGlobalUiLocaleControl/);

console.log("emenu/kiosk local UI locale verification passed.");
```

说明：Task 1 末尾壳层/控件断言会失败，属预期；先只断言 helper，待后续 Task 完成后再启用全文脚本。**本 Task 收尾时**保留「仅 helper」版校验并 GREEN：

```typescript
// 临时：仅测 helper（Task 1 结束态）
import assert from "node:assert/strict";
import {
  uiLocaleToEmbedLanguage,
  uiLocaleToEmenuLang,
  withEmbedLanguageParam,
} from "../src/shell/embed-ui-locale";

assert.equal(uiLocaleToEmbedLanguage("zh"), "zh-cn");
assert.equal(uiLocaleToEmbedLanguage("en"), "en");
assert.equal(uiLocaleToEmenuLang("zh"), "zh");
assert.equal(uiLocaleToEmenuLang("en"), "en");
assert.ok(withEmbedLanguageParam("./x?a=1#/h", "en").includes("language=en"));
assert.ok(withEmbedLanguageParam("./x?a=1#/h", "en").endsWith("#/h"));
console.log("embed-ui-locale helper verification passed.");
```

Run: `npx tsx scripts/verify-emenu-kiosk-local-ui-locale.ts`  
Expected: `embed-ui-locale helper verification passed.`

- [ ] **Step 5: 双写 + Commit**

同步 `src/shell/embed-ui-locale.ts`、`scripts/verify-emenu-kiosk-local-ui-locale.ts` 到主工作区 `new-bp/admin-web/`。

```bash
git add admin-web/src/shell/embed-ui-locale.ts admin-web/scripts/verify-emenu-kiosk-local-ui-locale.ts
git commit -m "feat: add embed UI locale mapping helpers"
```

---

### Task 2: 抽出公共语言控件

**Files:**
- Create: `admin-web/src/shell/ui-locale-control.ts`
- Modify: `admin-web/src/main.ts`（约 3695–3723、`renderGlobalUiLocaleControl` 调用处、`bindGlobalUiLocaleControl` 调用处）

- [ ] **Step 1: 新建控件模块**

```typescript
import {
  applyUiLocaleToDocument,
  getUiLocale,
  setUiLocale,
  t,
  type UiLocale,
} from "../i18n";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 顶栏界面语言下拉（商家后台与 eMenu/Kiosk 本地壳层共用） */
export function renderUiLocaleControl(): string {
  const cur = getUiLocale();
  const lab = escapeHtml(t("locale.label"));
  return `<div class="flex shrink-0 items-center">
      <label for="global-ui-locale" class="sr-only">${lab}</label>
      <select
        id="global-ui-locale"
        title="${lab}"
        class="h-9 max-w-[8.5rem] cursor-pointer rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-11 sm:max-w-none sm:px-2.5"
        aria-label="${lab}"
      >
        <option value="zh" ${cur === "zh" ? "selected" : ""}>${escapeHtml(t("locale.optionZh"))}</option>
        <option value="en" ${cur === "en" ? "selected" : ""}>${escapeHtml(t("locale.optionEn"))}</option>
      </select>
    </div>`;
}

export function bindUiLocaleControl(onLocaleChange: (locale: UiLocale) => void): void {
  const sel = document.getElementById("global-ui-locale") as HTMLSelectElement | null;
  if (!sel) return;
  sel.value = getUiLocale();
  sel.addEventListener("change", () => {
    const v: UiLocale = sel.value === "en" ? "en" : "zh";
    setUiLocale(v);
    applyUiLocaleToDocument(v);
    window.dispatchEvent(new CustomEvent("menusifu:ui-locale-change", { detail: { locale: v } }));
    onLocaleChange(v);
  });
}
```

- [ ] **Step 2: 改 main.ts**

1. 顶部 import 区增加：

```typescript
import { renderUiLocaleControl, bindUiLocaleControl } from "./shell/ui-locale-control";
```

2. **删除**本地函数 `renderGlobalUiLocaleControl` / `bindGlobalUiLocaleControl`（整段）。

3. 模板里原 `${renderGlobalUiLocaleControl()}` 改为 `${renderUiLocaleControl()}`。

4. `bindGlobalUiLocaleControl()` 改为：

```typescript
bindUiLocaleControl(() => {
  mount();
});
```

确认仍从 `../i18n`（或原路径）导入 `getUiLocale` 等若别处还用；若仅控件使用可清理未用 import。

- [ ] **Step 3: 手动冒烟（商家后台）**

在主工作区 `npm run dev`：顶栏语言下拉仍可切中/英，刷新后偏好保留，默认仍为中文。

- [ ] **Step 4: 双写 + Commit**

```bash
git add admin-web/src/shell/ui-locale-control.ts admin-web/src/main.ts
git commit -m "refactor: extract shared UI locale control"
```

---

### Task 3: eMenu 本地壳层挂控件 + iframe 语言

**Files:**
- Modify: `admin-web/src/shell/emenu-local-shell.ts`
- Modify: `admin-web/src/i18n.ts`（补 `shell.emenuLocalKicker`）

- [ ] **Step 1: i18n 增加壳层 kicker 键**

在 `messages.zh` / `messages.en` 的 eMenu 本地段各加：

```typescript
// zh
"shell.emenuLocalKicker": "eMenu · 本地配置",

// en
"shell.emenuLocalKicker": "eMenu · Local configuration",
```

（`en` 块须与 `zh` 键集合保持一致，否则 `MessageKey` 类型报错。）

- [ ] **Step 2: 改 emenu-local-shell.ts**

Import：

```typescript
import { t } from "../i18n";
import { renderUiLocaleControl, bindUiLocaleControl } from "./ui-locale-control";
import { syncEmenuLangStorage, withEmbedLanguageParam } from "./embed-ui-locale";
import { renderEmenuHostIpControl, bindEmenuHostIpControl } from "./emenu-local-host-control-ui";
```

（若已有 host-control import，只追加 locale / embed。）

将常量改为函数（或渲染时再拼），避免写死语言：

```typescript
function emenuIframeSrc(): string {
  return withEmbedLanguageParam(`./emenu-new/index.html?embedded=1&v=${BUILD_STAMP}`);
}

function emenuSettingsIframeSrc(): string {
  return withEmbedLanguageParam(`./emenu-new/index.html?embedded=1&v=${BUILD_STAMP}#/setting`);
}
```

iframe `src` 改用上述函数返回值。

顶栏右侧顺序：**主机 IP → 语言 → 主题**：

```typescript
<div class="flex shrink-0 items-center gap-2">
  ${renderEmenuHostIpControl()}
  ${renderUiLocaleControl()}
  <button type="button" id="theme-toggle" ...>
```

Kicker：

```typescript
<p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">${escapeHtml(t("shell.emenuLocalKicker"))}</p>
```

`mountEmenuLocalShell` / 渲染前调用 `syncEmenuLangStorage()`。

`bindEmenuLocalShell(onMount)`：

```typescript
bindUiLocaleControl(() => {
  syncEmenuLangStorage();
  onMount();
});
```

保留既有 theme / demo / host / session / seasoning bind。

- [ ] **Step 3: 双写 + Commit**

```bash
git add admin-web/src/shell/emenu-local-shell.ts admin-web/src/i18n.ts
git commit -m "feat: add locale switcher to eMenu local shell"
```

---

### Task 4: Kiosk 本地壳层挂控件 + 动态 language

**Files:**
- Modify: `admin-web/src/shell/kiosk-local-shell.ts`
- Modify: `admin-web/src/i18n.ts`（`shell.kioskLocalKicker`）

- [ ] **Step 1: i18n**

```typescript
// zh
"shell.kioskLocalKicker": "Kiosk · 本地配置",

// en
"shell.kioskLocalKicker": "Kiosk · Local configuration",
```

- [ ] **Step 2: 改 kiosk-local-shell.ts**

删除写死的 `language=zh-cn` 常量拼接，改为：

```typescript
import { renderUiLocaleControl, bindUiLocaleControl } from "./ui-locale-control";
import { withEmbedLanguageParam } from "./embed-ui-locale";

function kioskIframeSrc(): string {
  return withEmbedLanguageParam(`/kpos/kiosklite/index.html?embedded=1&v=${BUILD_STAMP}`);
  // 若当前仓库常量是 ./kpos/... 或 /kpos/...，保持原 path，只包 withEmbedLanguageParam
}

function kioskSettingsIframeSrc(): string {
  return withEmbedLanguageParam(
    `/kpos/kiosklite/index.html?embedded=1&v=${BUILD_STAMP}#/configApp`,
  );
}
```

**注意：** 以 worktree 现有 path 为准（可能是 `./kpos/...`）；不要改代理路径，只加 language。

顶栏：host IP（若有）→ locale → theme；kicker 用 `t("shell.kioskLocalKicker")`。

```typescript
bindUiLocaleControl(() => {
  onMount();
});
```

- [ ] **Step 3: 双写 + Commit**

```bash
git add admin-web/src/shell/kiosk-local-shell.ts admin-web/src/i18n.ts
git commit -m "feat: add locale switcher to Kiosk local shell"
```

---

### Task 5: 调味页用户可见硬编码 → i18n（第一批）

**Files:**
- Modify: `admin-web/src/i18n.ts`
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-page.ts`
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-option-library-ui.ts`
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-option-category-manager-ui.ts`
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts`
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-menu-structure-picker-ui.ts`
- Modify: `admin-web/src/emenu-local/seasoning/seasoning-configuration-workspace-ui.ts`

- [ ] **Step 1: 在 i18n 追加键（zh / en 成对）**

```typescript
// —— zh 示例（en 同步英译）——
"seasoning.allOptionCategories": "全部 Option 分类",
"seasoning.uncategorized": "未分类",
"seasoning.editOption": "编辑 Option",
"seasoning.edit": "编辑", // 若已有则复用，勿重复
"seasoning.optionCategory": "所属分类",
"seasoning.pickCategory": "请选择分类",
"seasoning.categoryInactiveSuffix": "（已停用）",
"seasoning.disableOptionConfirm": "停用后，该 Option 将从食客端隐藏。确定继续吗？",
"seasoning.batchSaveSummary": "已新增 {created} 条，更新 {updated} 条，跳过 {skipped} 条。",
"seasoning.previewExpired": "预览已过期，请重新生成",
"seasoning.reloadMenu": "重新加载菜单",
"seasoning.search": "搜索",
"seasoning.previewProductCount": "{count} 个商品",
"seasoning.previewCandidateCount": "{count} 条候选关系",
"seasoning.optionCount": "{count} 个 Option",
"seasoning.unavailableCount": "{count} 条不可用",
"seasoning.optionBasePrice": "Option 原价",
"seasoning.markupCoefficient": "加价系数",
"seasoning.actualPrice": "实际价格",
"seasoning.noPreviewProducts": "暂无可预览商品",
"seasoning.previewPagination": "预览分页",
"seasoning.optionCategoryManagerTitle": "Option 分类管理",
"seasoning.optionCategoryManagerHint": "拖动调整分类顺序；未分类固定置底。",
"seasoning.categoryNamePrompt": "分类名称",
"seasoning.categoryCodePrompt": "内部编码",
"seasoning.deleteCategoryConfirm": "确认删除该分类？有关联 Option 时无法删除。",
"seasoning.categoryInUse": "该分类仍有关联 Option，请先迁移。",
"seasoning.menuGroup": "组",
"seasoning.menuGroupHint": "选择菜单分组",
"seasoning.menuCategory": "类",
"seasoning.menuCategoryHint": "选择商品分类",
"seasoning.menuDish": "菜",
"seasoning.menuDishHint": "勾选适用商品",
"seasoning.noMatchingGroups": "暂无匹配的菜单组",
"seasoning.pickMenuGroupFirst": "请选择菜单组",
"seasoning.noMatchingDishes": "没有匹配的菜品",
"seasoning.pickMenuCategoryFirst": "请选择商品分类",
"seasoning.loadMore": "加载更多",
"seasoning.selectAllInCategoryAria": "选择{name}下全部可用 Option",
"seasoning.alreadyInAction": "已在当前动作中",
"seasoning.searchOptionPicker": "搜索分类、Option 名称或编码",
```

英文块给出自然对应（例：`"seasoning.previewExpired": "Preview expired. Generate again."`）。已存在的键（如 `seasoning.edit`、`seasoning.perPage`）直接复用，勿重复定义。

- [ ] **Step 2: 替换各文件中的字面量**

模式：硬编码中文 → `t("...")` / `tf("...", { ... })`。例如 `seasoning-page.ts`：

```typescript
<option value="">${t("seasoning.allOptionCategories")}</option>
// ...
if (status === "inactive" && !window.confirm(t("seasoning.disableOptionConfirm"))) return;
// ...
this.showToast(tf("seasoning.batchSaveSummary", {
  created: String(result.created),
  updated: String(result.updated + result.reactivated),
  skipped: String(result.skipped),
}));
```

对其余文件同样替换；业务数据名（分类名、商品名）保持后端原文，不翻译。

- [ ] **Step 3: 扫漏**

Run（PowerShell）：

```powershell
rg "[\u4e00-\u9fff]" admin-web/src/emenu-local/seasoning --glob "*.ts" -n
```

对仍出现的**用户可见** UI 文案继续补键；注释/领域假数据（如 handler 里系统「未分类」种子名）可留到同 Task 末尾：若会显示给用户则必须 `t("seasoning.uncategorized")`。

- [ ] **Step 4: 双写 + Commit**

```bash
git add admin-web/src/i18n.ts admin-web/src/emenu-local/seasoning
git commit -m "feat: i18n seasoning local UI strings"
```

---

### Task 6: 完整校验脚本 GREEN + 手工验收

**Files:**
- Modify: `admin-web/scripts/verify-emenu-kiosk-local-ui-locale.ts`（启用 Task 1 中的完整版）

- [ ] **Step 1: 换上完整 verify 脚本（见 Task 1 Step 4 完整版）并运行**

Run: `npx tsx scripts/verify-emenu-kiosk-local-ui-locale.ts`  
Expected: `emenu/kiosk local UI locale verification passed.`

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`（在 `admin-web/`）  
Expected: 无因新增 MessageKey 导致的错误。

- [ ] **Step 3: 浏览器验收清单**

在主工作区 `npm run dev`：

1. 清除 `localStorage.menusifu-admin-ui-locale` 后进入 eMenu / Kiosk 本地配置 → 中文。
2. 顶栏主题左侧可切 English；侧栏、kicker、占位/调味文案变英文。
3. 切回商家后台仍为 English；再切回本地配置一致。
4. 打开 eMenu / 设置 / Kiosk / Kiosk 设置：iframe URL 含 `language=zh-cn` 或 `language=en`；嵌入 UI 语言大致一致（eMenu 依赖 `emenu_lang`）。
5. 切换语言后面板重载，语言跟随。
6. 窄屏下顶栏仍可见语言下拉。

- [ ] **Step 4: Commit verify**

```bash
git add admin-web/scripts/verify-emenu-kiosk-local-ui-locale.ts
git commit -m "test: verify eMenu/Kiosk local UI locale wiring"
```

---

## Self-review vs spec

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 默认中文 / 共用 `menusifu-admin-ui-locale` | 沿用 i18n；Task 2/3/4 控件 |
| 顶栏主题旁切换 | Task 3/4 |
| 壳层 + 原生页文案 | Task 3–5 |
| iframe URL language + 重载 | Task 1、3、4、6 |
| eMenu 实际读 `emenu_lang` | Task 1 `syncEmenuLangStorage` + Task 3 |
| 非目标（652/653、postMessage、第二套存储） | 未引入 |
| 验收 1–6 | Task 6 |

**占位符扫描：** 无 TBD/TODO 步骤。  
**类型一致：** `UiLocale`、`withEmbedLanguageParam`、`bindUiLocaleControl(onLocaleChange)` 贯穿全文。

**说明：** 若主仓另有「Kiosk 设置固定 zh-cn」的 verify（`verify-kiosk-local-settings-zh-ui`），实现时改为断言「settings src 经 `withEmbedLanguageParam`」或删除与本功能冲突的固定 zh 断言，避免双源真相。
