# 商品配置「添加商品」弹层 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 第 2 步主区去掉内联选品；通过【添加商品】弹层编辑临时草稿，点【提交】才写入门店 `storeConfigs`，之后「查看已选商品」才展示。

**Architecture:** `editorState.productAddDialog` 持有 `open/storeId/structureByLine/dirty/query`；弹层内 picker/搜索只改草稿；`brand-menu-structure-change` 与搜索勾选在弹层打开时短路权威写入；提交调用现有 `applyStoreStructure(draft, storeId, byLine, …)`。主区仅摘要 + 两按钮。同步修正依赖「主区内联门店/搜索」的既有 verify 脚本。

**Tech Stack:** 原生 JS（IIFE）、现有 overlay/dialog 样式、Node assert 专项脚本

**Spec:** `docs/superpowers/specs/2026-08-17-order-limit-add-product-dialog-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-add-product-dialog`，分支 `wt/order-limit-add-product-dialog`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `admin-web/scripts/verify-order-limit-add-product-dialog.mjs` | 新专项：主区裁剪、弹层、草稿、提交路径、互斥 |
| `admin-web/scripts/verify-order-limit-store-specific-config.mjs` | 门店下拉改到弹层后的断言调整 |
| `admin-web/scripts/verify-order-limit-store-scope-flow.mjs` | 同上 |
| `admin-web/scripts/verify-order-limit-store-product-search.mjs` | 搜索改到弹层后的断言调整 |
| `admin-web/scripts/verify-order-limit-guidance-copy-removal.mjs` | 若仍要求主区 `data-config-store-select` 则改为弹层内存在 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | 状态、渲染、事件 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.css` | 弹层与底栏 |

---

### Task 1: 失败验证脚本 + 预调整会红的旧脚本期望

**Files:**
- Create: `admin-web/scripts/verify-order-limit-add-product-dialog.mjs`
- Modify: `admin-web/scripts/verify-order-limit-store-specific-config.mjs`
- Modify: `admin-web/scripts/verify-order-limit-store-scope-flow.mjs`
- Modify: `admin-web/scripts/verify-order-limit-store-product-search.mjs`
- Modify: `admin-web/scripts/verify-order-limit-guidance-copy-removal.mjs`（仅当其硬编码主区门店选择时）

- [ ] **Step 1: 写入新专项脚本**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function createProductAddDialogState\(/, "应提供添加商品弹层状态工厂");
assert.match(source, /productAddDialog:\s*createProductAddDialogState\(\)/, "编辑器初始化应挂载 productAddDialog");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /productAddDialog/,
  "添加商品弹层状态不得进入默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function toast)/)?.[0] ?? "",
  /productAddDialog/,
  "添加商品弹层状态不得进入兼容规则或发布快照",
);

assert.match(source, /function openProductAddDialog\(/, "应提供打开函数");
assert.match(source, /function closeProductAddDialog\(/, "应提供关闭函数");
assert.match(source, /function submitProductAddDialog\(/, "应提供提交函数");
assert.match(source, /function renderProductAddDialog\(/, "应渲染添加商品弹层");

assert.match(source, /data-product-add-open/, "主区应有添加商品入口");
assert.match(source, /data-product-add-overlay/, "应有弹层遮罩标记");
assert.match(source, /data-product-add-submit/, "应有提交按钮标记");
assert.match(source, /data-product-add-cancel|data-product-add-close/, "应有取消/关闭标记");
assert.match(source, /data-product-add-store-select/, "弹层内应有门店下拉标记");

const stepTwo = source.match(/function renderStepTwo\(draft\)[\s\S]*?(?=\n\s*function renderSelectedPreviewDialog|function renderProductAddDialog)/)?.[0] ?? "";
assert.match(stepTwo, /data-product-add-open/, "步骤 2 主区应渲染添加商品入口");
assert.doesNotMatch(stepTwo, /data-config-store-select/, "步骤 2 主区不得再渲染参与门店下拉");
assert.doesNotMatch(stepTwo, /data-brand-menu-structure-picker|data-product-search-surface/, "步骤 2 主区不得再内联矩阵/搜索表面");
assert.doesNotMatch(stepTwo, /data-product-search[^\-]/, "步骤 2 主区不得再渲染搜索输入（允许弹层内使用 data-product-add-search）");

const submitFn = source.match(/function submitProductAddDialog\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(submitFn, /applyStoreStructure\(/, "提交应调用按门店权威写入");

assert.match(
  source,
  /productAddDialog\.open[\s\S]{0,200}applyActiveStoreStructure|productAddDialog\.open[\s\S]{0,400}structureByLine/,
  "弹层打开时结构变更应写入草稿而非（或不先）权威 applyActiveStoreStructure",
);

assert.match(css, /\.olf-product-add-dialog|\.olf-product-add-overlay/, "应提供添加商品弹层样式");

console.log("Menu order limit add product dialog verification passed");
```

- [ ] **Step 2: 调整旧脚本（实现前先改期望，使其在实现后 GREEN；实现前会对新脚本 RED、旧脚本可能仍 GREEN 或部分 RED）**

对 `verify-order-limit-store-specific-config.mjs` / `store-scope-flow.mjs`：

- 将「`renderStepTwo` 必须含 `data-config-store-select` / `olf-config-store-select…>参与门店<` / `请选择参与门店` / `stores.map`」等**主区门店下拉**断言全部改为：
  - `assert.doesNotMatch(stepTwo, /data-config-store-select|olf-config-store-select/)`
  - 在全文件或 `renderProductAddDialog` 上：`assert.match(source, /data-product-add-store-select/)`、`assert.match(source, /请选择参与门店/)`、`assert.match(source, /stores\.map/)`（门店列表仍由弹层渲染）
- `handleEditorInput` 中门店切换断言改为匹配 `data-product-add-store-select`（可保留 clearProductPickerNav / 清空搜索语义，见下）

对 `verify-order-limit-store-product-search.mjs`：

- 搜索框断言改为弹层：`data-product-add-search`，且出现在 `renderProductAddDialog`（或 overlay HTML）中
- 删除「主区 `olf-store-search-row` + `data-config-store-select` + searchFieldHtml」拼装断言
- 「切换门店清空搜索」改为断言 `switchProductAddStore` / 弹层切门店路径将 `productAddDialog.query` 置 `""`（不要再要求主区 `data-config-store-select` + `clearProductSearch`）
- 搜索勾选断言保留，但须在 `productAddDialog.open` 分支下改草稿 `structureByLine`

对 `verify-order-limit-guidance-copy-removal.mjs`：若列表要求存在 `data-config-store-select`，改为 `data-product-add-store-select`。

- [ ] **Step 3: 跑新脚本确认 RED**

Run: `node scripts/verify-order-limit-add-product-dialog.mjs`  
Expected: FAIL（缺少 `createProductAddDialogState`）

- [ ] **Step 4: 同步脚本到主工作区**（仅文件同步；commit 仅当用户要求）

---

### Task 2: 状态工厂与打开/关闭/提交助手

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（靠近 `createSelectedPreviewState`；`editorState` 初始化）

- [ ] **Step 1: 状态与克隆助手**

```js
  function createProductAddDialogState() {
    return {
      open: false,
      storeId: "",
      structureByLine: MenuPicker ? MenuPicker.emptyByLine() : { kiosk: [], emenu: [], sdi: [] },
      dirty: false,
      query: "",
      searchComposing: false
    };
  }

  function cloneStructureByLine(byLine) {
    if (!MenuPicker) return { kiosk: [], emenu: [], sdi: [] };
    return MenuPicker.normalizeByLine(cloneValue(byLine || MenuPicker.emptyByLine()));
  }

  function loadProductAddDialogStructure(storeId) {
    if (!isAvailableStoreId(storeId)) return cloneStructureByLine(null);
    var config = storeConfigFor(editorState.rule.editorDraft, storeId, false);
    return cloneStructureByLine(config ? config.structureByLine : null);
  }

  function resetProductAddDialog() {
    if (!editorState) return;
    editorState.productAddDialog = createProductAddDialogState();
  }
```

在 `mountEditor` 的 `editorState = { ... }` 中增加：

```js
      productAddDialog: createProductAddDialogState(),
```

- [ ] **Step 2: open / requestClose / close / submit**

```js
  function renderProductAddDialog(draft) {
    // Task 3 实现正文；此处先留函数壳或与 Task 3 一并落地
  }

  function openProductAddDialog() {
    closeSelectedPreview();
    var draft = editorState.rule.editorDraft;
    var storeId = isAvailableStoreId(draft.activeStoreId) ? draft.activeStoreId : "";
    editorState.productAddDialog = {
      open: true,
      storeId: storeId,
      structureByLine: loadProductAddDialogStructure(storeId),
      dirty: false,
      query: "",
      searchComposing: false
    };
    clearProductSearch();
    clearProductPickerNav();
    renderProductAddDialog(draft);
    window.setTimeout(function () {
      var title = document.getElementById("productAddTitle");
      if (title) title.focus();
    }, 0);
  }

  function closeProductAddDialog() {
    var overlay = document.querySelector("[data-product-add-overlay]");
    if (overlay) { overlay.classList.remove("is-open"); overlay.innerHTML = ""; }
    resetProductAddDialog();
    clearProductSearch();
    clearProductPickerNav();
  }

  function requestCloseProductAddDialog() {
    var state = editorState.productAddDialog;
    if (!state || !state.open) return;
    if (!state.dirty) { closeProductAddDialog(); return; }
    openDialog("确定放弃未提交的修改？", "关闭后不会保存本次在弹层中的选品变更。", "放弃修改", function () {
      closeDialog(false);
      closeProductAddDialog();
    });
  }

  function switchProductAddStore(nextStoreId) {
    var state = editorState.productAddDialog;
    var draft = editorState.rule.editorDraft;
    var applySwitch = function () {
      state.storeId = isAvailableStoreId(nextStoreId) ? nextStoreId : "";
      state.structureByLine = loadProductAddDialogStructure(state.storeId);
      state.dirty = false;
      state.query = "";
      state.searchComposing = false;
      if (state.storeId) draft.activeStoreId = state.storeId;
      clearProductPickerNav();
      renderProductAddDialog(draft);
    };
    if (!state.dirty) { applySwitch(); return; }
    openDialog("切换门店将丢弃当前未提交改动", "确认后将加载目标门店已提交的商品配置。", "确认切换", function () {
      closeDialog(false);
      applySwitch();
    }, {
      onCancel: function () { renderProductAddDialog(draft); }
    });
  }

  function submitProductAddDialog() {
    var state = editorState.productAddDialog;
    var draft = editorState.rule.editorDraft;
    if (!state || !state.open) return;
    if (!isAvailableStoreId(state.storeId)) { toast("请选择参与门店", true); return; }
    if (!applyStoreStructure(draft, state.storeId, state.structureByLine, { render: false })) {
      toast("商品结构无效，请重试", true);
      return;
    }
    draft.activeStoreId = state.storeId;
    closeProductAddDialog();
    renderEditor();
    toast("商品已提交");
  }
```

注意：`openDialog` 的 `onCancel` 若现网不支持，用现有 `editorState.dialogOptions.onCancel`（已有 `cancelDialog` 调用）；切换门店确认取消时重绘以恢复 select 显示值。

- [ ] **Step 3: 同步 JS 到主工作区（可选中间态）**

---

### Task 3: 主区裁剪 + 弹层渲染 + CSS

**Files:**
- Modify: `order-limit-flow.js`（`renderStepTwo`、`renderProductAddDialog`、`mountEditor` overlay、`renderEditor` 挂载 picker）
- Modify: `order-limit-flow.css`

- [ ] **Step 1: 重写 `renderStepTwo` 选择商品区**

```js
  function renderStepTwo(draft) {
    normalizeStoreDraft(draft);
    var hasActiveStore = isAvailableStoreId(draft.activeStoreId);
    var config = hasActiveStore ? storeConfigFor(draft, draft.activeStoreId, false) : null;
    var byLine = MenuPicker ? MenuPicker.normalizeByLine(config ? config.structureByLine : MenuPicker.emptyByLine()) : null;
    var summary = hasActiveStore && MenuPicker ? MenuPicker.formatSummary(byLine) : "未选择门店";
    var previewCount = selectedPreviewRows(draft).length;
    return '<div class="olf-content-head"><h2 tabindex="-1">商品配置</h2></div>' +
      '<section class="olf-section"><h3>基础信息</h3><div class="olf-field-grid"><label class="olf-field olf-field--full"><span class="olf-label olf-required">规则名称</span><input class="olf-input" data-field="name" value="' + esc(draft.name) + '" maxlength="60" /></label><label class="olf-field olf-field--full"><span class="olf-label">规则描述</span><textarea class="olf-textarea" data-field="description" maxlength="200">' + esc(draft.description) + '</textarea></label></div></section>' +
      '<section class="olf-section olf-store-product-config"><div class="olf-section-head"><div><h3 id="selectedProductHeading" tabindex="-1">选择商品</h3><p class="olf-structure-summary" id="structureSummary">' + esc(summary) + '</p><div class="olf-help">请通过添加商品为各门店配置限购对象。</div></div><div class="olf-line-limit-head-actions"><button type="button" class="olf-button olf-button--small olf-button--primary" data-product-add-open>添加商品</button><button type="button" class="olf-button olf-button--small olf-selected-preview-entry" data-selected-preview-open' + (previewCount ? '' : ' disabled') + '>查看已选商品（' + previewCount + '）</button></div></div></section>';
  }
```

- [ ] **Step 2: 实现 `renderProductAddDialog`**

要点：

- 门店 options 与旧主区相同（全部门店 +「请选择参与门店」）。  
- 有 `storeId` 时渲染搜索 + `data-product-search-surface`，表面 HTML 用**草稿** config：`{ structureByLine: state.structureByLine }`。  
- 查询词读 `state.query`。必须把 query 贯通到结果渲染：

```js
  function renderProductSearchResults(draft, config, queryOverride) {
    var results = matchingProductSearchResults(
      queryOverride != null ? queryOverride : (editorState ? editorState.productSearchQuery : "")
    );
    // ...其余保持不变，仍用 config.structureByLine 判断勾选
  }

  function renderProductSearchSurfaceHtml(draft, config, queryOverride) {
    var query = queryOverride != null ? queryOverride : (editorState ? editorState.productSearchQuery : "");
    if (normalizeProductSearchQuery(query)) return renderProductSearchResults(draft, config, query);
    // ...矩阵分支不变
  }
```

弹层调用：`renderProductSearchSurfaceHtml(draft, draftConfig, state.query)`。**禁止**只改 Surface 而让 Results 仍读死 `productSearchQuery`。

示意骨架：

```js
  function renderProductAddDialog(draft) {
    var overlay = document.querySelector("[data-product-add-overlay]");
    var state = editorState && editorState.productAddDialog;
    if (!overlay || !state || !state.open) return;
    var storeOptions = '<option value="">请选择参与门店</option>' + stores.map(function (store) {
      return '<option value="' + esc(store.id) + '"' + (state.storeId === store.id ? ' selected' : '') + '>' + esc(store.name) + '</option>';
    }).join('');
    var hasStore = isAvailableStoreId(state.storeId);
    var draftConfig = { structureByLine: state.structureByLine };
    var searchHtml = hasStore
      ? '<label class="olf-field olf-product-search"><span class="olf-label">搜索商品</span><input class="olf-input" type="search" data-product-add-search value="' + esc(state.query) + '" placeholder="搜索当前门店全部产线商品" autocomplete="off" /></label>'
      : "";
    var surfaceHtml = hasStore
      ? '<div data-product-search-surface>' + renderProductSearchSurfaceHtml(draft, draftConfig, state.query) + '</div>'
      : '<div class="olf-empty"><strong>请选择参与门店</strong><span>选择门店后可搜索或勾选产线商品。</span></div>';
    overlay.innerHTML = '<section class="olf-product-add-dialog" role="dialog" aria-modal="true" aria-labelledby="productAddTitle">' +
      '<div class="olf-product-add-head"><h3 id="productAddTitle" tabindex="-1">添加商品</h3><button type="button" class="olf-icon-button" data-product-add-close aria-label="关闭">' + icon("close", 19) + '</button></div>' +
      '<div class="olf-product-add-body"><div class="olf-store-search-row"><label class="olf-field"><span class="olf-label olf-required">参与门店</span><select class="olf-select" data-product-add-store-select>' + storeOptions + '</select></label>' + searchHtml + '</div>' + surfaceHtml + '</div>' +
      '<div class="olf-product-add-footer"><button type="button" class="olf-button" data-product-add-cancel>取消</button><button type="button" class="olf-button olf-button--primary" data-product-add-submit' + (hasStore ? '' : ' disabled') + '>提交</button></div>' +
      '</section>';
    overlay.classList.add("is-open");
    var pickerElement = overlay.querySelector("[data-brand-menu-structure-picker]");
    if (pickerElement && MenuPicker) {
      MenuPicker.bind(pickerElement, { leafLevel: draft.targetType === "category" ? "category" : "dish" });
      captureProductPickerNavFromDom();
    }
  }
```

同步改 `renderProductSearchSurfaceHtml(draft, config, queryOverride)`：第三参存在则用其作为 query。

- [ ] **Step 3: `mountEditor` 增加 overlay**

在已有 preview overlays 旁增加：

```html
<div class="olf-overlay olf-product-add-overlay" data-product-add-overlay></div>
```

- [ ] **Step 4: CSS**

复用 selected-preview 尺寸节奏，追加：

```css
.olf-product-add-overlay { z-index: 81; }
.olf-product-add-dialog {
  width: min(960px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--olf-surface);
  box-shadow: 0 16px 48px rgba(0,0,0,.18);
}
.olf-product-add-head { /* 同 preview head */ }
.olf-product-add-body { padding: 0 24px 16px; overflow: auto; min-height: 320px; }
.olf-product-add-footer {
  padding: 14px 24px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--olf-border);
}
```

---

### Task 4: 事件接线（草稿写入 vs 权威写入）

**Files:**
- Modify: `order-limit-flow.js`（`handleEditorClick`、`handleEditorInput`、`brand-menu-structure-change`、Escape、`goToEditorStep`、`openSelectedPreview`）

- [ ] **Step 1: Click**

```js
    if (event.target && event.target.hasAttribute && event.target.hasAttribute("data-product-add-overlay")) {
      requestCloseProductAddDialog();
      return;
    }
    // buttons:
    if (button.hasAttribute("data-product-add-open")) { openProductAddDialog(); return; }
    if (button.hasAttribute("data-product-add-close") || button.hasAttribute("data-product-add-cancel")) {
      requestCloseProductAddDialog(); return;
    }
    if (button.hasAttribute("data-product-add-submit")) { submitProductAddDialog(); return; }
```

`openSelectedPreview` 开头加：`if (editorState.productAddDialog && editorState.productAddDialog.open) closeProductAddDialog();`（打开已选时若添加弹层无 dirty 可直接关；若 dirty 应先 `requestClose`——推荐打开已选前若 add 弹层 dirty 则先确认，确认后再 `openSelectedPreview`。实现可简化为：**互斥时先 requestClose；若用户取消放弃则不打开已选**。用回调链或 dirty 时只 toast「请先提交或关闭添加商品」更简单且符合互斥——采用：**若 productAddDialog.open，则 toast「请先关闭添加商品」并 return**；打开添加时 `closeSelectedPreview()`。）

- [ ] **Step 2: Input — 弹层门店与搜索**

```js
    if (target.hasAttribute("data-product-add-store-select")) {
      if (event.type !== "change") return;
      switchProductAddStore(target.value);
      return;
    }
    if (target.hasAttribute("data-product-add-search")) {
      if (event.type !== "input") return;
      if (editorState.productAddDialog.searchComposing) return;
      editorState.productAddDialog.query = target.value;
      renderProductAddDialog(draft);
      return;
    }
```

删除或废弃主区 `data-config-store-select` 分支（主区已无该控件）；保留函数无害但可删。

- [ ] **Step 3: 搜索勾选与 picker change 走草稿**

`data-product-search-target` 处理中：

```js
      if (editorState.productAddDialog && editorState.productAddDialog.open) {
        var addState = editorState.productAddDialog;
        addState.structureByLine = MenuPicker.setNodeSelected(addState.structureByLine, searchLineId, searchTargetKey, target.checked);
        addState.dirty = true;
        renderProductAddDialog(draft);
        return;
      }
```

`brand-menu-structure-change`：

```js
    root.addEventListener("brand-menu-structure-change", function (event) {
      var draft = editorState.rule.editorDraft;
      var byLine = event.detail && event.detail.byLine;
      var detail = event.detail || {};
      rememberProductPickerNav(detail.activeLine, detail.activeGroup, detail.activeCategory);
      if (editorState.productAddDialog && editorState.productAddDialog.open) {
        editorState.productAddDialog.structureByLine = MenuPicker.normalizeByLine(byLine);
        editorState.productAddDialog.dirty = true;
        return;
      }
      var pageScrollY = window.scrollY || window.pageYOffset || 0;
      if (!applyActiveStoreStructure(draft, byLine, false)) return;
      updateProductStructureSummary(draft);
      updateSelectedPreviewEntry(draft);
      window.scrollTo(0, pageScrollY);
    });
```

- [ ] **Step 4: Escape 与切步**

Escape 链在 selectedPreview 之前：

```js
      if (editorState.productAddDialog && editorState.productAddDialog.open) {
        requestCloseProductAddDialog();
        return;
      }
```

`goToEditorStep`：在真正改 `currentStep` 之前：

```js
    if (editorState.currentStep === 2 && step !== 2 && editorState.productAddDialog && editorState.productAddDialog.open) {
      if (editorState.productAddDialog.dirty) {
        openDialog("确定放弃未提交的修改？", "离开本步将关闭添加商品并丢弃未提交改动。", "放弃并离开", function () {
          closeDialog(false);
          closeProductAddDialog();
          goToEditorStep(step, skipValidation);
        });
        return;
      }
      closeProductAddDialog();
    }
```

注意避免无限递归：确认回调里先 `closeProductAddDialog` 再调用 `goToEditorStep`（此时 open 已 false）。

**离开编辑器（返回列表）同样要挡 dirty 弹层：**

`backButton` / `saveReturnButton` 在 `saveEditorDraft` 成功后、`openDialog(… go("order-limit.html"))` 之前：

```js
      var leaveEditor = function () {
        teardownSceneComboNavSpy();
        go("order-limit.html");
      };
      var confirmLeave = function () {
        openDialog("退出新增规则？", "…", "保存并返回", function () { leaveEditor(); });
        // saveReturnButton 文案用其现有文案
      };
      if (editorState.productAddDialog && editorState.productAddDialog.open && editorState.productAddDialog.dirty) {
        openDialog("确定放弃未提交的修改？", "返回列表将关闭添加商品并丢弃未提交改动。", "放弃并返回", function () {
          closeDialog(false);
          closeProductAddDialog();
          confirmLeave();
        });
        return;
      }
      if (editorState.productAddDialog && editorState.productAddDialog.open) closeProductAddDialog();
      confirmLeave();
```

（`saveReturnButton` 共用同一 dirty 拦截，但最终确认文案必须保留现网差异：`backButton` 用「退出新增规则？…保存并返回」；`saveReturnButton` 用「保存草稿并返回？…保存并返回」。）

若旧脚本仍断言 CSS `.olf-config-store-select`：弹层门店 label 可继续带该类名，或同步把旧断言改为不依赖该类。

`renderEditor` 末尾：若 `productAddDialog.open`，调用 `renderProductAddDialog(draft)`，避免整页重绘冲掉弹层。

composition 事件：为 `data-product-add-search` 设置 `productAddDialog.searchComposing`。

- [ ] **Step 5: 跑验证**

```bash
node scripts/verify-order-limit-add-product-dialog.mjs
node scripts/verify-order-limit-store-specific-config.mjs
node scripts/verify-order-limit-store-scope-flow.mjs
node scripts/verify-order-limit-store-product-search.mjs
```

Expected: 全部 PASS

- [ ] **Step 6: 双写 JS/CSS/脚本到主工作区 `F:/米聚/GitHub仓库/new-bp/admin-web/`**

---

### Task 5: 浏览器验收说明

1. 主区只有摘要 + 添加商品 + 查看已选；无门店/矩阵。  
2. 打开添加商品 → 选门店 → 勾选 → 不提交：查看已选仍为旧 N。  
3. 提交后 N 增加，列表可见。  
4. 取消/Esc（dirty）：不写入。  
5. 再打开：勾选与上次提交一致。  
6. 脏切门店：确认后加载目标店已提交态。  
7. 清空勾选并提交：门店变未添加，N 下降。  
8. 添加与查看已选互斥。  
9. 第 4 步目标与完成度正确。

---

## Spec 覆盖自检

| Spec | Task |
|---|---|
| 主区裁剪 | Task 3 |
| 弹层结构+提交 | Task 2–3 |
| 草稿写入时机 | Task 4 |
| 再次打开加载已提交 | Task 2 `loadProductAddDialogStructure` |
| 脏切门店确认 | Task 2 `switchProductAddStore` |
| 切步 dirty 确认 | Task 4 `goToEditorStep` |
| 离开编辑器 dirty 确认 | Task 4 `backButton` / `saveReturnButton` |
| 两弹层互斥 | Task 4 |
| 空结构提交覆盖 | Task 2 submit + 验收 7 |
| 不入库 | Task 1 asserts |
| 旧脚本不过时 | Task 1 调整 |

## 占位符扫描

无 TBD；旧脚本具体替换行以实现时打开文件对照本计划条目为准。

## 命名一致性

- `productAddDialog` / `createProductAddDialogState` / `openProductAddDialog` / `closeProductAddDialog` / `requestCloseProductAddDialog` / `submitProductAddDialog` / `switchProductAddStore` / `renderProductAddDialog`
- DOM：`data-product-add-open|overlay|submit|cancel|close|store-select|search`
