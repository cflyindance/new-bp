# 组合平铺左侧场景导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在多轮「组合平铺」且组合数 ≥ 2 时，于矩阵区左侧提供粘性场景导航；点击锚点滚动到对应组合块，手动滚动时导航高亮双向跟随。

**Architecture:** 导航 HTML 由 `sceneCombos` + `sceneComboCompletion` 派生渲染；块增加稳定 `id` 锚点；点击走 `scrollIntoView`；`IntersectionObserver` 在 `renderEditor` 后挂载、离开平铺条件时卸载。高亮只改 DOM class，不写入 `editorState` / 草稿。权威源码：`dist/Configuration center/assets/order-limit-flow.js` + `.css`。worktree 改完后双写主工作区 `admin-web/`。

**Tech Stack:** 原生 JS（IIFE）、CSS sticky + IntersectionObserver、Node assert 专项脚本

**Spec:** `docs/superpowers/specs/2026-08-16-order-limit-scene-combo-nav-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-scene-combo-nav`，分支 `wt/order-limit-scene-combo-nav`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `admin-web/scripts/verify-order-limit-scene-combo-nav.mjs` | 出现条件、锚点、导航标记、完成度、生命周期断言 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | 导航渲染、锚点、点击滚动、scrollspy 挂载 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.css` | 两栏布局、粘性导航、高亮/完成态、≤960px 隐藏 |

---

### Task 1: 建立失败验证脚本

**Files:**
- Create: `admin-web/scripts/verify-order-limit-scene-combo-nav.mjs`

- [ ] **Step 1: 写入专项脚本**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function shouldShowSceneComboNav\(/, "应提供导航出现条件助手");
assert.match(source, /function sceneComboAnchorId\(/, "应提供组合块锚点 id 助手");
assert.match(source, /function renderSceneComboNav\(/, "应渲染左侧场景导航");
assert.match(source, /function mountSceneComboNavSpy\(/, "应挂载 scrollspy");
assert.match(source, /function teardownSceneComboNavSpy\(/, "应卸载 scrollspy");
assert.match(source, /function scrollToSceneCombo\(/, "应提供点击滚动助手");

assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /sceneComboNav|activeSceneCombo/,
  "导航高亮不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function toast)/)?.[0] ?? "",
  /sceneComboNav|activeSceneCombo/,
  "导航高亮不得进入兼容规则或发布快照",
);

assert.match(source, /data-scene-combo-nav/, "应有导航容器标记");
assert.match(source, /data-scene-combo-nav-item/, "应有导航项标记");
assert.match(source, /id="scene-combo-|['"]scene-combo-/, "组合块应有 scene-combo 锚点 id");
assert.match(source, /sceneComboCompletion\(/, "导航完成度应复用 sceneComboCompletion");
assert.match(source, /olf-scene-combo-layout/, "平铺矩阵区应使用两栏布局类名");

const shouldShowFn = source.match(/function shouldShowSceneComboNav\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(shouldShowFn, /isSceneTileMode/, "出现条件须依赖平铺模式");
assert.match(shouldShowFn, /sceneCombos\(draft\)\.length\s*>=\s*2|combos\.length\s*>=\s*2/, "出现条件须要求组合数 ≥ 2");

const renderEditorFn = source.match(/function renderEditor\([\s\S]*?(?=\n\s*function openDialog)/)?.[0] ?? "";
assert.match(renderEditorFn, /mountSceneComboNavSpy|teardownSceneComboNavSpy/, "renderEditor 后应同步 scrollspy 生命周期");

assert.match(css, /\.olf-scene-combo-layout/, "应提供两栏布局样式");
assert.match(css, /\.olf-scene-combo-nav/, "应提供导航样式");
assert.match(css, /scroll-margin-top/, "组合块应设置 scroll-margin-top");
assert.match(css, /@media\s*\(max-width:\s*960px\)[\s\S]*?olf-scene-combo-nav[\s\S]*?display:\s*none/, "≤960px 应隐藏左导航");

console.log("Menu order limit scene combo nav verification passed");
```

- [ ] **Step 2: 运行确认 RED**

Run: `node scripts/verify-order-limit-scene-combo-nav.mjs`

Expected: FAIL（找不到 `shouldShowSceneComboNav` 等）

- [ ] **Step 3: Commit + 同步主工作区脚本**（仅当用户明确要求提交时执行 commit；否则只同步文件）

```bash
# 同步到主工作区
cp "scripts/verify-order-limit-scene-combo-nav.mjs" \
  "F:/米聚/GitHub仓库/new-bp/admin-web/scripts/verify-order-limit-scene-combo-nav.mjs"
```

---

### Task 2: 助手函数与锚点 id

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（紧挨 `sceneComboCompletion` 之后）

- [ ] **Step 1: 插入助手（含 scrollspy 模块级句柄）**

在 `function sceneComboCompletion(...) { ... }` 之后插入：

```js
  var sceneComboNavSpy = null;

  function shouldShowSceneComboNav(draft) {
    return !!(isSceneTileMode(draft) && sceneCombos(draft).length >= 2);
  }

  function sceneComboAnchorId(partyIndex, roundIndex) {
    return "scene-combo-" + String(partyIndex) + "-" + String(roundIndex);
  }

  function teardownSceneComboNavSpy() {
    if (sceneComboNavSpy && typeof sceneComboNavSpy.disconnect === "function") {
      sceneComboNavSpy.disconnect();
    }
    sceneComboNavSpy = null;
  }

  function setActiveSceneComboNavItem(key) {
    var nav = document.querySelector("[data-scene-combo-nav]");
    if (!nav) return;
    var items = nav.querySelectorAll("[data-scene-combo-nav-item]");
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var itemKey = sceneKey(
        Number(item.getAttribute("data-scene-party")),
        Number(item.getAttribute("data-scene-round"))
      );
      if (itemKey === key) item.classList.add("is-active");
      else item.classList.remove("is-active");
    }
  }

  function scrollToSceneCombo(partyIndex, roundIndex) {
    var el = document.getElementById(sceneComboAnchorId(partyIndex, roundIndex));
    if (!el) return;
    setActiveSceneComboNavItem(sceneKey(partyIndex, roundIndex));
    if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function mountSceneComboNavSpy() {
    teardownSceneComboNavSpy();
    var draft = editorState && editorState.rule && editorState.rule.editorDraft;
    if (!shouldShowSceneComboNav(draft)) return;
    var blocks = document.querySelectorAll(".olf-scene-combo-block[data-scene-block]");
    if (!blocks.length || typeof IntersectionObserver !== "function") return;
    var ratios = {};
    sceneComboNavSpy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var key = entry.target.getAttribute("data-scene-block");
        if (!key) return;
        ratios[key] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var bestKey = "";
      var bestTop = Infinity;
      for (var i = 0; i < blocks.length; i += 1) {
        var block = blocks[i];
        var blockKey = block.getAttribute("data-scene-block");
        if (!blockKey || !(ratios[blockKey] > 0)) continue;
        var top = block.getBoundingClientRect().top;
        // Prefer the intersecting block closest to the sticky offset band.
        if (top >= 72 && top < bestTop) {
          bestTop = top;
          bestKey = blockKey;
        } else if (!bestKey && top < bestTop) {
          bestTop = top;
          bestKey = blockKey;
        }
      }
      if (bestKey) setActiveSceneComboNavItem(bestKey);
    }, {
      root: null,
      threshold: [0, 0.15, 0.35, 0.55, 0.75, 1],
      rootMargin: "-96px 0px -45% 0px"
    });
    for (var j = 0; j < blocks.length; j += 1) sceneComboNavSpy.observe(blocks[j]);
  }

  function renderSceneComboNav(draft, config) {
    if (!shouldShowSceneComboNav(draft)) return "";
    config = config || activeStoreConfig(draft);
    var items = sceneCombos(draft).map(function (combo, index) {
      var completion = sceneComboCompletion(draft, combo.partyIndex, combo.roundIndex, draft.activeLineId, config);
      var completeClass = completion.total > 0 && completion.complete === completion.total ? " is-complete" : "";
      var activeClass = index === 0 ? " is-active" : "";
      return '<button type="button" class="olf-scene-combo-nav__item' + activeClass + completeClass + '" data-scene-combo-nav-item data-scene-party="' + combo.partyIndex + '" data-scene-round="' + combo.roundIndex + '"><span class="olf-scene-combo-nav__title">' + esc(combo.title) + '</span><span class="olf-scene-combo-nav__completion">' + esc(completion.label) + '</span></button>';
    }).join("");
    return '<nav class="olf-scene-combo-nav" data-scene-combo-nav aria-label="场景组合">' + items + '</nav>';
  }
```

- [ ] **Step 2: 给组合块加锚点 id**

将 `renderSceneComboBlocks` 中 section 起始标签改为：

```js
      return '<section class="olf-scene-combo-block" id="' + esc(sceneComboAnchorId(combo.partyIndex, combo.roundIndex)) + '" data-scene-block="' + esc(combo.key) + '" data-scene-party="' + combo.partyIndex + '" data-scene-round="' + combo.roundIndex + '"><div class="olf-scene-combo-head"><h4>' + esc(combo.title) + '</h4><span class="olf-scene-combo-completion">已配 ' + completion.label + '</span></div>' +
```

- [ ] **Step 3: Commit 检查点**（仅用户要求提交时）

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js"
git commit -m "$(cat <<'EOF'
feat: add scene combo nav helpers and anchors

Prepare sticky left nav jump targets for tiled multi-round limits.
EOF
)"
```

---

### Task 3: 步骤 4 两栏布局 + 点击 + scrollspy 生命周期

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（`renderStepFour`、`handleEditorClick`、`renderEditor`）

- [ ] **Step 1: 改 `renderStepFour` 矩阵区**

将现有：

```js
    var matrixSection = tileMode
      ? '<section class="olf-section">' + renderSceneComboBlocks(draft, config) + '</section>'
      : '<section class="olf-section">...';
```

替换为：

```js
    var matrixSection;
    if (tileMode) {
      var comboBlocksHtml = renderSceneComboBlocks(draft, config);
      if (shouldShowSceneComboNav(draft)) {
        matrixSection =
          '<section class="olf-section olf-scene-combo-layout">' +
            renderSceneComboNav(draft, config) +
            '<div class="olf-scene-combo-panels">' + comboBlocksHtml + '</div>' +
          '</section>';
      } else {
        matrixSection = '<section class="olf-section">' + comboBlocksHtml + '</section>';
      }
    } else {
      matrixSection =
        '<section class="olf-section"><div class="olf-table-wrap"><table class="olf-table"><thead><tr>' + selectHeader + '<th>' + (draft.targetType === 'dish' ? '菜品' : '分类') + '</th><th>' + (draft.subject === 'party_size' ? '人均上限' : '订单上限') + '</th></tr></thead><tbody>' + renderLimitRows(draft) + '</tbody></table></div></section>';
    }
```

注意：`else` 分支保持与现网 `matrixSection` 非平铺字符串完全一致（上例仅示意结构；实现时从当前文件原样搬迁，勿改字段）。

- [ ] **Step 2: `handleEditorClick` 增加导航点击**

在 `handleEditorClick` 内、处理 `data-scene-display-mode` 附近加入：

```js
    if (button.hasAttribute("data-scene-combo-nav-item")) {
      scrollToSceneCombo(
        Number(button.getAttribute("data-scene-party")),
        Number(button.getAttribute("data-scene-round"))
      );
      return;
    }
```

- [ ] **Step 3: `renderEditor` 末尾同步 spy（放在 scroll 恢复之后）**

在 `renderEditor` 的 `if (options.focusHeading) { ... } else { window.scrollTo(0, scrollY); }` **之后**加入：

```js
    teardownSceneComboNavSpy();
    if (editorState.currentStep === 4) mountSceneComboNavSpy();
```

这样首帧 IntersectionObserver 基于已恢复的 scrollY，避免高亮抖一下。

- [ ] **Step 4: 离开步骤 / 离开编辑器时卸载**

确认现有 `goToEditorStep` 离开步骤 4 会 `renderEditor`（从而走到 teardown）。  
在 `data-scene-display-mode` 切换分支中，模式变更后已有 `renderEditor()` 即可；无需把高亮写入 state。

另外：所有 `go("order-limit.html")` 离开编辑器的路径（`backButton` / `saveReturnButton` 确认回调、发布成功跳转等）在调用 `go(...)` 前补一行 `teardownSceneComboNavSpy();`，避免模块级 observer 残留。

- [ ] **Step 5: 同步 JS 到主工作区后跑验证（仍可能因缺 CSS 失败）**

```bash
# 从 worktree 同步
cp "dist/Configuration center/assets/order-limit-flow.js" \
  "F:/米聚/GitHub仓库/new-bp/admin-web/dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-order-limit-scene-combo-nav.mjs
```

Expected: 可能仍 FAIL 在 CSS 断言；JS 相关断言应通过。

---

### Task 4: CSS 两栏、粘性、高亮、窄屏隐藏

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.css`

- [ ] **Step 1: 在 `.olf-scene-combo-completion` 样式块后追加**

```css
.olf-scene-combo-layout {
  display: grid;
  grid-template-columns: 188px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.olf-scene-combo-nav {
  position: sticky;
  top: 110px;
  display: grid;
  gap: 4px;
  align-self: start;
  max-height: calc(100vh - 140px);
  overflow: auto;
  padding: 4px 0;
}
.olf-scene-combo-nav__item {
  appearance: none;
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 8px 10px;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--olf-secondary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.olf-scene-combo-nav__item:hover {
  background: rgba(0, 0, 0, 0.035);
}
.olf-scene-combo-nav__item.is-active {
  border-left-color: var(--olf-primary);
  background: var(--olf-primary-soft);
  color: var(--olf-primary-text);
  font-weight: 600;
}
.olf-scene-combo-nav__title {
  min-width: 0;
}
.olf-scene-combo-nav__completion {
  flex: none;
  color: var(--olf-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.olf-scene-combo-nav__item.is-complete .olf-scene-combo-nav__completion {
  color: var(--olf-primary);
}
.olf-scene-combo-panels {
  min-width: 0;
}
.olf-scene-combo-block {
  scroll-margin-top: 110px;
}
```

说明：若文件中已有 `.olf-scene-combo-block { ... }`，**不要重复整块定义**；只把 `scroll-margin-top: 110px;` 并入现有规则，并把导航相关新类追加在其后。

- [ ] **Step 2: 在现有 `@media (max-width: 960px)` 内追加**

```css
  .olf-scene-combo-layout { grid-template-columns: 1fr; }
  .olf-scene-combo-nav { display: none; }
```

- [ ] **Step 3: 跑验证确认 GREEN**

Run: `node scripts/verify-order-limit-scene-combo-nav.mjs`

Expected: `Menu order limit scene combo nav verification passed`

同时回归：

```bash
node scripts/verify-order-limit-scene-combo-tile.mjs
node scripts/verify-order-limit-line-first-scenes.mjs
node scripts/verify-order-limit-copy-line-limits.mjs
```

Expected: 全部 PASS

- [ ] **Step 4: 双写 CSS/JS/脚本到主工作区**

同步以下文件到 `F:/米聚/GitHub仓库/new-bp/admin-web/` 相同相对路径：

- `scripts/verify-order-limit-scene-combo-nav.mjs`
- `dist/Configuration center/assets/order-limit-flow.js`
- `dist/Configuration center/assets/order-limit-flow.css`

---

### Task 5: 浏览器验收说明（不自动化）

**Files:** 无代码；在实现完成后于回复中给出清单。

- [ ] **Step 1: 手工验收清单**

1. 多轮、2 人数 × 2 轮次、组合平铺：左侧 4 项导航 + 右侧 4 块  
2. 点击第 3 项：平滑滚到对应块，该项 `is-active`  
3. 手动滚动：导航高亮随最靠上可见块变化  
4. 切「分开选择」：导航消失；切回平铺恢复  
5. 将轮次改为仅 1 档使组合 = 1：无左导航，块全宽  
6. 浏览器宽度 ≤960px：无左导航，块可纵向编辑  
7. 输入数量 / 块内批量：只影响本块；`limits` 键仍含正确 party/round  
8. 切产线：导航完成度数字随产线更新；scrollY 不异常跳动

- [ ] **Step 2: 用户确认预览 OK 后再谈合并 / 推送**

---

## Spec 覆盖自检

| Spec 要求 | 对应 Task |
|---|---|
| 出现条件：多轮 + tile + 组合 ≥ 2 | Task 2 `shouldShowSceneComboNav` + Task 1 断言 |
| 左导航 + 右全量块 | Task 3 两栏 |
| 点击锚点滚动 | Task 2 `scrollToSceneCombo` + Task 3 click |
| 双向 scrollspy | Task 2 `mountSceneComboNavSpy` + Task 3 `renderEditor` |
| 完成度复用 `sceneComboCompletion` | Task 2 `renderSceneComboNav` |
| 高亮不入库 | Task 1 doesNotMatch + 实现不写 editorState |
| ≤960px 隐藏导航 | Task 4 media query（对齐现网 960px 断点，等价 spec「窄屏」） |
| 不做折叠 / chips / 单块切换 | 全计划无这些步骤 |
| 不改 limits / 批量口径 | 仅加 id 与外壳布局 |

## 占位符扫描

无 TBD / TODO /「类似 Task N」空引用。

## 命名一致性

- `shouldShowSceneComboNav` / `sceneComboAnchorId` / `renderSceneComboNav` / `mountSceneComboNavSpy` / `teardownSceneComboNavSpy` / `scrollToSceneCombo` / `setActiveSceneComboNavItem`
- DOM：`data-scene-combo-nav`、`data-scene-combo-nav-item`、`id="scene-combo-{p}-{r}"`、`.olf-scene-combo-layout`
