# 限购数量已配置规则全量预览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在限购数量步骤提供只读弹层，二次确认全部门店 / 人数 / 轮次 / 产线中已配置的限购数量规则。

**Architecture:** 对齐「查看已选商品」弹层模式：在 `editorState` 增加临时 `configuredLimitPreview` 状态；用 `eachLimitCell` 口径汇总 `configured === true` 的单元格为表格行；步骤 4「产线配置」标题旁入口打开独立 overlay。权威源码在 `dist/Configuration center/assets/order-limit-flow.js`（Vite 经 iframe 直接服务该目录）。

**Tech Stack:** 原生 JS（IIFE）、现有 `order-limit-flow.css`、Node assert 专项脚本

**Spec:** `docs/superpowers/specs/2026-08-16-order-limit-configured-rules-preview-design.md`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `admin-web/scripts/verify-order-limit-configured-limit-preview.mjs` | 专项断言入口、行生成、只读、状态、生命周期、样式 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | 行汇总、筛选分页、弹层渲染、事件与生命周期 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.css` | 预览筛选栅格与复用弹层样式扩展 |

不新建独立 JS 模块：与现有选品预览同文件，保持原型仓库惯例。

---

### Task 1: 建立失败验证脚本

**Files:**
- Create: `admin-web/scripts/verify-order-limit-configured-limit-preview.mjs`

- [ ] **Step 1: 写入专项验证脚本**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function createConfiguredLimitPreviewState\(\)/, "应提供已配置规则预览临时状态工厂");
assert.match(source, /configuredLimitPreview:\s*createConfiguredLimitPreviewState\(\)/, "编辑器初始化应挂载已配置规则预览状态");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /configuredLimitPreview/,
  "预览状态不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "",
  /configuredLimitPreview/,
  "预览状态不得进入兼容规则或发布快照",
);

assert.match(source, /function configuredLimitPreviewRows\(draft\)/, "应按 eachLimitCell 口径汇总已配置行");
assert.match(
  source,
  /function configuredLimitPreviewRows\(draft\)[\s\S]*?eachLimitCell\(draft/,
  "行汇总应复用 eachLimitCell，避免跨门店串用商品范围",
);
assert.match(
  source,
  /configuredLimitPreviewRows\(draft\)[\s\S]*?configured === true|cell\.configured/,
  "仅 configured===true 的单元格进入预览",
);
assert.match(source, /0（禁止）/, "数量 0 应展示为禁止文案");
assert.match(source, /查看已配置规则/, "步骤 4 应提供查看已配置规则入口文案");
assert.match(source, /data-configured-limit-preview-open/, "应提供打开预览入口标记");
assert.match(source, /data-configured-limit-preview-overlay/, "应提供独立预览遮罩");
assert.match(source, /data-configured-limit-preview-store/, "应提供门店筛选");
assert.match(source, /data-configured-limit-preview-party/, "应提供人数场景筛选");
assert.match(source, /data-configured-limit-preview-round/, "应提供轮次筛选标记");
assert.match(source, /data-configured-limit-preview-line/, "应提供产线筛选");
assert.match(source, /data-configured-limit-preview-search/, "应提供菜单搜索");
assert.match(source, /data-configured-limit-preview-page/, "应提供分页");
assert.match(source, /data-configured-limit-preview-page-size/, "应提供每页条数");
assert.match(source, /data-configured-limit-preview-close/, "应提供关闭入口");
assert.doesNotMatch(
  source.match(/function renderConfiguredLimitPreviewDialog[\s\S]*?(?=\n\s*function [a-zA-Z]+)/)?.[0] ?? "",
  /data-configured-limit-preview-delete|contenteditable|type="number"/,
  "预览弹层必须只读，不得提供删除或数量编辑",
);

assert.match(source, /function openConfiguredLimitPreview\(\)/, "应提供打开预览函数");
assert.match(source, /function closeConfiguredLimitPreview\(\)/, "应提供关闭预览函数");
assert.match(
  source,
  /function goToEditorStep[\s\S]*?currentStep === 4[\s\S]*?closeConfiguredLimitPreview\(\)/,
  "离开限购数量步骤应关闭预览",
);
assert.match(source, /Escape[\s\S]{0,200}closeConfiguredLimitPreview|closeConfiguredLimitPreview[\s\S]{0,200}Escape/, "Esc 应可关闭预览");

assert.match(css, /\.olf-configured-limit-preview-filters|\.olf-selected-preview-filters/, "应提供预览筛选布局样式");
assert.match(css, /\.olf-configured-limit-preview-overlay|\.olf-selected-preview-overlay/, "应复用或扩展弹层遮罩样式");

console.log("Menu order limit configured rules preview verification passed");
```

- [ ] **Step 2: 运行验证确认 RED**

Run: `node scripts/verify-order-limit-configured-limit-preview.mjs`

Expected: FAIL（缺少 `createConfiguredLimitPreviewState` 等符号）

- [ ] **Step 3: Commit**

```bash
git add admin-web/scripts/verify-order-limit-configured-limit-preview.mjs
git commit -m "$(cat <<'EOF'
test: add configured limit preview verification

Lock the read-only cross-store limit preview contract before implementation.
EOF
)"
```

---

### Task 2: 临时状态与行汇总助手

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（在 `createSelectedPreviewState` / `selectedPreviewRows` 附近新增；在 `mountEditor` 的 `editorState` 初始化处挂载）

- [ ] **Step 1: 新增状态工厂与重置**

紧挨 `createSelectedPreviewState` 之后加入：

```js
  function createConfiguredLimitPreviewState() {
    return {
      open: false,
      query: "",
      searchComposing: false,
      storeId: "",
      partyKey: "",
      roundKey: "",
      lineId: "",
      page: 1,
      pageSize: 20
    };
  }

  function resetConfiguredLimitPreview() {
    if (!editorState) return;
    editorState.configuredLimitPreview = createConfiguredLimitPreviewState();
  }
```

在 `editorState = { ... }` 初始化中，`selectedPreview: createSelectedPreviewState()` 旁增加：

```js
      configuredLimitPreview: createConfiguredLimitPreviewState(),
```

- [ ] **Step 2: 新增行汇总与筛选项助手**

```js
  function configuredLimitPreviewRows(draft) {
    var rows = [];
    eachLimitCell(draft, function (key, partyIndex, roundIndex, lineId, targetId, config, storeId) {
      var cell = config.limits[key];
      if (!cell || !cell.configured) return;
      var store = stores.find(function (item) { return item.id === storeId; });
      var line = lines.find(function (item) { return item.id === lineId; });
      var target = targetsForLine(draft, lineId, config).find(function (item) { return item.id === targetId; });
      if (!store || !target) return;
      var partyRange = draft.partyRanges[partyIndex];
      var roundRange = draft.roundRanges[roundIndex];
      var menuName = target.shortName || target.name;
      rows.push({
        rowId: [storeId, partyIndex, roundIndex, lineId, targetId].join("|"),
        storeId: storeId,
        storeName: store.name,
        partyIndex: partyIndex,
        partyLabel: formatRange(partyRange, "人"),
        roundIndex: roundIndex,
        roundLabel: draft.period === "multi_round" ? formatRange(roundRange, "轮") : "—",
        lineId: lineId,
        lineLabel: line ? line.name : (target.lineLabel || lineId),
        targetId: targetId,
        menuName: menuName,
        menuDetail: draft.targetType === "category" ? (target.count ? target.count + " 个菜品" : "") : "",
        value: cell.value
      });
    });
    rows.sort(function (a, b) {
      var storeOrder = function (id) {
        var index = stores.findIndex(function (store) { return store.id === id; });
        return index < 0 ? 999 : index;
      };
      var lineOrder = function (id) {
        var index = lines.findIndex(function (line) { return line.id === id; });
        return index < 0 ? 999 : index;
      };
      return storeOrder(a.storeId) - storeOrder(b.storeId)
        || a.partyIndex - b.partyIndex
        || a.roundIndex - b.roundIndex
        || lineOrder(a.lineId) - lineOrder(b.lineId)
        || String(a.menuName).localeCompare(String(b.menuName), "zh");
    });
    return rows;
  }

  function configuredLimitPreviewStoreOptions(rows) {
    var ids = rows.map(function (row) { return row.storeId; });
    return stores.filter(function (store) { return ids.indexOf(store.id) >= 0; });
  }

  function configuredLimitPreviewPartyOptions(draft, rows) {
    var indexes = [];
    rows.forEach(function (row) {
      if (indexes.indexOf(row.partyIndex) < 0) indexes.push(row.partyIndex);
    });
    indexes.sort(function (a, b) { return a - b; });
    return indexes.map(function (index) {
      return { key: String(index), label: formatRange(draft.partyRanges[index], "人") };
    });
  }

  function configuredLimitPreviewRoundOptions(draft, rows) {
    if (draft.period !== "multi_round") return [];
    var indexes = [];
    rows.forEach(function (row) {
      if (indexes.indexOf(row.roundIndex) < 0) indexes.push(row.roundIndex);
    });
    indexes.sort(function (a, b) { return a - b; });
    return indexes.map(function (index) {
      return { key: String(index), label: formatRange(draft.roundRanges[index], "轮") };
    });
  }

  function configuredLimitPreviewLineOptions(rows, storeId) {
    var ids = rows.filter(function (row) { return !storeId || row.storeId === storeId; }).map(function (row) { return row.lineId; });
    return lines.filter(function (line) { return ids.indexOf(line.id) >= 0; });
  }

  function filteredConfiguredLimitPreviewRows(rows, state) {
    var query = normalizeProductSearchQuery(state.query);
    return rows.filter(function (row) {
      var matchesQuery = !query || normalizeProductSearchQuery(row.menuName).indexOf(query) >= 0;
      var matchesStore = !state.storeId || row.storeId === state.storeId;
      var matchesParty = !state.partyKey || String(row.partyIndex) === state.partyKey;
      var matchesRound = !state.roundKey || String(row.roundIndex) === state.roundKey;
      var matchesLine = !state.lineId || row.lineId === state.lineId;
      return matchesQuery && matchesStore && matchesParty && matchesRound && matchesLine;
    });
  }

  function pagedConfiguredLimitPreviewRows(rows, state) {
    var start = (state.page - 1) * state.pageSize;
    return rows.slice(start, start + state.pageSize);
  }

  function normalizeConfiguredLimitPreviewState(draft) {
    var state = editorState.configuredLimitPreview;
    var rows = configuredLimitPreviewRows(draft);
    var storeIds = configuredLimitPreviewStoreOptions(rows).map(function (store) { return store.id; });
    if (state.storeId && storeIds.indexOf(state.storeId) < 0) state.storeId = "";
    var partyKeys = configuredLimitPreviewPartyOptions(draft, rows).map(function (item) { return item.key; });
    if (state.partyKey && partyKeys.indexOf(state.partyKey) < 0) state.partyKey = "";
    var roundKeys = configuredLimitPreviewRoundOptions(draft, rows).map(function (item) { return item.key; });
    if (state.roundKey && roundKeys.indexOf(state.roundKey) < 0) state.roundKey = "";
    var lineIds = configuredLimitPreviewLineOptions(rows, state.storeId).map(function (line) { return line.id; });
    if (state.lineId && lineIds.indexOf(state.lineId) < 0) state.lineId = "";
    var filtered = filteredConfiguredLimitPreviewRows(rows, state);
    var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize) || 1);
    state.page = Math.max(1, Math.min(Number(state.page) || 1, totalPages));
    return { rows: rows, filtered: filtered, pageRows: pagedConfiguredLimitPreviewRows(filtered, state), totalPages: totalPages };
  }

  function formatConfiguredLimitValue(value) {
    if (value === 0) return "0（禁止）";
    return String(value);
  }
```

- [ ] **Step 3: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js"
git commit -m "$(cat <<'EOF'
feat: add configured limit preview row helpers

Introduce temporary preview state and eachLimitCell-based row aggregation.
EOF
)"
```

---

### Task 3: 弹层渲染、入口与打开关闭

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（`renderStepFour`、`renderEditor`、`mountEditor` HTML、新增 render/open/close）
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.css`

- [ ] **Step 1: 实现弹层渲染与开关**

```js
  function renderConfiguredLimitPreviewDialog(draft, restoreSearchFocus) {
    var overlay = document.querySelector("[data-configured-limit-preview-overlay]");
    if (!overlay || !editorState || !editorState.configuredLimitPreview.open) return;
    var state = editorState.configuredLimitPreview;
    var data = normalizeConfiguredLimitPreviewState(draft);
    var storeOptions = '<option value="">全部门店</option>' + configuredLimitPreviewStoreOptions(data.rows).map(function (store) {
      return '<option value="' + esc(store.id) + '"' + (state.storeId === store.id ? " selected" : "") + ">" + esc(store.name) + "</option>";
    }).join("");
    var partyOptions = '<option value="">全部人数</option>' + configuredLimitPreviewPartyOptions(draft, data.rows).map(function (item) {
      return '<option value="' + esc(item.key) + '"' + (state.partyKey === item.key ? " selected" : "") + ">" + esc(item.label) + "</option>";
    }).join("");
    var roundFilterHtml = draft.period === "multi_round"
      ? '<label class="olf-field"><span class="olf-label">轮次</span><select class="olf-select" data-configured-limit-preview-round><option value="">全部轮次</option>' + configuredLimitPreviewRoundOptions(draft, data.rows).map(function (item) {
          return '<option value="' + esc(item.key) + '"' + (state.roundKey === item.key ? " selected" : "") + ">" + esc(item.label) + "</option>";
        }).join("") + "</select></label>"
      : "";
    var lineOptions = '<option value="">全部产线</option>' + configuredLimitPreviewLineOptions(data.rows, state.storeId).map(function (line) {
      return '<option value="' + esc(line.id) + '"' + (state.lineId === line.id ? " selected" : "") + ">" + esc(line.name) + "</option>";
    }).join("");
    var rowsHtml = data.pageRows.map(function (row) {
      return '<tr data-configured-limit-preview-row="' + esc(row.rowId) + '"><td>' + esc(row.storeName) + '</td><td>' + esc(row.partyLabel) + '</td><td>' + esc(row.roundLabel) + '</td><td>' + esc(row.lineLabel) + '</td><td><strong>' + esc(row.menuName) + '</strong>' + (row.menuDetail ? '<div class="olf-hint">' + esc(row.menuDetail) + '</div>' : '') + '</td><td>' + esc(formatConfiguredLimitValue(row.value)) + '</td></tr>';
    }).join("");
    var emptyHtml = data.filtered.length ? "" : '<div class="olf-empty olf-configured-limit-preview-empty"><strong>暂无已配置规则</strong><span>当前筛选条件下暂无已配置规则，请调整门店、场景或搜索条件。</span></div>';
    overlay.innerHTML = '<section class="olf-selected-preview-dialog olf-configured-limit-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="configuredLimitPreviewTitle"><div class="olf-selected-preview-head"><h3 id="configuredLimitPreviewTitle" tabindex="-1">查看已配置规则（' + data.rows.length + '）</h3><button type="button" class="olf-icon-button" data-configured-limit-preview-close aria-label="关闭已配置规则预览">' + icon("close", 19) + '</button></div><div class="olf-selected-preview-toolbar"><div class="olf-selected-preview-filters olf-configured-limit-preview-filters' + (draft.period === "multi_round" ? " is-multi-round" : "") + '"><label class="olf-field"><span class="olf-label">门店</span><select class="olf-select" data-configured-limit-preview-store>' + storeOptions + '</select></label><label class="olf-field"><span class="olf-label">人数场景</span><select class="olf-select" data-configured-limit-preview-party>' + partyOptions + '</select></label>' + roundFilterHtml + '<label class="olf-field"><span class="olf-label">产线</span><select class="olf-select" data-configured-limit-preview-line>' + lineOptions + '</select></label><label class="olf-field olf-configured-limit-preview-search"><span class="olf-label">菜单搜索</span><input class="olf-input" type="search" value="' + esc(state.query) + '" placeholder="搜索菜品/分类名称" autocomplete="off" data-configured-limit-preview-search /></label></div></div><div class="olf-selected-preview-table-wrap"><table class="olf-table"><thead><tr><th>配置门店</th><th>人数场景</th><th>轮次</th><th>产线</th><th>菜单</th><th>限购数量</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' + emptyHtml + '</div><div class="olf-selected-preview-pagination"><div></div><div class="olf-actions"><button type="button" class="olf-button olf-button--small" data-configured-limit-preview-page="previous"' + (state.page <= 1 ? " disabled" : "") + '>上一页</button><span>第 ' + state.page + ' / ' + data.totalPages + ' 页</span><button type="button" class="olf-button olf-button--small" data-configured-limit-preview-page="next"' + (state.page >= data.totalPages ? " disabled" : "") + '>下一页</button><label class="olf-selected-preview-page-size"><span class="olf-sr-only">每页条数</span><select class="olf-select" data-configured-limit-preview-page-size><option value="10"' + (state.pageSize === 10 ? " selected" : "") + '>10 条/页</option><option value="20"' + (state.pageSize === 20 ? " selected" : "") + '>20 条/页</option><option value="50"' + (state.pageSize === 50 ? " selected" : "") + '>50 条/页</option></select></label></div></div></section>';
    overlay.classList.add("is-open");
    if (restoreSearchFocus) {
      var searchInput = overlay.querySelector("[data-configured-limit-preview-search]");
      if (searchInput) {
        searchInput.focus();
        if (searchInput.setSelectionRange) searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }
  }

  function openConfiguredLimitPreview() {
    resetConfiguredLimitPreview();
    editorState.configuredLimitPreview.open = true;
    renderConfiguredLimitPreviewDialog(editorState.rule.editorDraft);
    window.setTimeout(function () {
      var title = document.getElementById("configuredLimitPreviewTitle");
      if (title) title.focus();
    }, 0);
  }

  function closeConfiguredLimitPreview() {
    var overlay = document.querySelector("[data-configured-limit-preview-overlay]");
    if (overlay) { overlay.classList.remove("is-open"); overlay.innerHTML = ""; }
    resetConfiguredLimitPreview();
    var entry = root.querySelector("[data-configured-limit-preview-open]");
    window.setTimeout(function () {
      if (entry && !entry.disabled) entry.focus();
    }, 0);
  }
```

- [ ] **Step 2: 在 `renderStepFour` 加入口**

将产线配置标题行改为（仅 `hasConfiguredStores` 分支）：

```js
    var previewCount = configuredLimitPreviewRows(draft).length;
```

并把 section head 从：

```js
<div class="olf-section-head"><div><h3>产线配置</h3><div class="olf-help">当前门店：...</div></div></div>
```

改为：

```js
<div class="olf-section-head"><div><h3>产线配置</h3><div class="olf-help">当前门店：...</div></div><button type="button" class="olf-button olf-button--small olf-configured-limit-preview-entry" data-configured-limit-preview-open` + (previewCount ? "" : " disabled") + `>查看已配置规则（` + previewCount + `）</button></div>
```

- [ ] **Step 3: mountEditor 增加 overlay；renderEditor / goToEditorStep 挂钩**

在已有 `data-selected-preview-overlay` 旁增加：

```html
<div class="olf-overlay olf-selected-preview-overlay olf-configured-limit-preview-overlay" data-configured-limit-preview-overlay></div>
```

`renderEditor` 末尾 `syncBatchControls();` 之后：

```js
    if (editorState.configuredLimitPreview && editorState.configuredLimitPreview.open) {
      renderConfiguredLimitPreviewDialog(draft);
    }
```

`goToEditorStep` 中，离开步骤 4 时：

```js
    if (editorState.currentStep === 4 && step !== 4) {
      resetBatchSelection();
      closeConfiguredLimitPreview();
    }
```

（把原先单独的 `resetBatchSelection()` 行合并进该分支，避免重复调用。）

- [ ] **Step 4: 增加 CSS**

在 `order-limit-flow.css` 选品预览样式附近追加：

```css
.olf-configured-limit-preview-entry { white-space: nowrap; }
.olf-configured-limit-preview-filters { grid-template-columns: repeat(3, minmax(140px, 180px)) minmax(220px, 1fr); }
.olf-configured-limit-preview-filters.is-multi-round { grid-template-columns: repeat(4, minmax(130px, 170px)) minmax(200px, 1fr); }
.olf-configured-limit-preview-search { min-width: 200px; }
.olf-configured-limit-preview-empty { min-height: 130px; border-top: 1px solid var(--olf-border); }
```

并在 `@media (max-width: 680px)` 中追加：

```css
  .olf-configured-limit-preview-filters,
  .olf-configured-limit-preview-filters.is-multi-round { grid-template-columns: 1fr; }
```

- [ ] **Step 5: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js" "admin-web/dist/Configuration center/assets/order-limit-flow.css"
git commit -m "$(cat <<'EOF'
feat: render configured limit preview dialog

Add step-4 entry, read-only overlay shell, and preview layout styles.
EOF
)"
```

---

### Task 4: 事件处理（筛选 / 分页 / Esc）

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（`handleEditorClick`、`handleEditorInput`、document keydown）

- [ ] **Step 1: click 处理**

在 `handleEditorClick` 中、选品预览分支附近增加：

```js
    if (button.hasAttribute("data-configured-limit-preview-open")) { openConfiguredLimitPreview(); return; }
    if (button.hasAttribute("data-configured-limit-preview-close")) { closeConfiguredLimitPreview(); return; }
    if (button.hasAttribute("data-configured-limit-preview-page")) {
      var limitPreviewState = editorState.configuredLimitPreview;
      limitPreviewState.page += button.getAttribute("data-configured-limit-preview-page") === "next" ? 1 : -1;
      renderConfiguredLimitPreviewDialog(editorState.rule.editorDraft);
      return;
    }
```

遮罩点击关闭：在 click 处理器开头（或现有 overlay 逻辑旁）增加：

```js
    if (event.target && event.target.hasAttribute && event.target.hasAttribute("data-configured-limit-preview-overlay")) {
      closeConfiguredLimitPreview();
      return;
    }
```

- [ ] **Step 2: input/change 处理**

在 `handleEditorInput` 中增加：

```js
    if (target.hasAttribute("data-configured-limit-preview-search")) {
      if (event.type !== "input") return;
      editorState.configuredLimitPreview.query = target.value;
      if (!editorState.configuredLimitPreview.searchComposing) {
        editorState.configuredLimitPreview.page = 1;
        renderConfiguredLimitPreviewDialog(draft, true);
      }
      return;
    }
    if (target.hasAttribute("data-configured-limit-preview-store")) {
      if (event.type !== "change") return;
      editorState.configuredLimitPreview.storeId = target.value;
      editorState.configuredLimitPreview.lineId = "";
      editorState.configuredLimitPreview.page = 1;
      renderConfiguredLimitPreviewDialog(draft);
      return;
    }
    if (target.hasAttribute("data-configured-limit-preview-party")) {
      if (event.type !== "change") return;
      editorState.configuredLimitPreview.partyKey = target.value;
      editorState.configuredLimitPreview.page = 1;
      renderConfiguredLimitPreviewDialog(draft);
      return;
    }
    if (target.hasAttribute("data-configured-limit-preview-round")) {
      if (event.type !== "change") return;
      editorState.configuredLimitPreview.roundKey = target.value;
      editorState.configuredLimitPreview.page = 1;
      renderConfiguredLimitPreviewDialog(draft);
      return;
    }
    if (target.hasAttribute("data-configured-limit-preview-line")) {
      if (event.type !== "change") return;
      editorState.configuredLimitPreview.lineId = target.value;
      editorState.configuredLimitPreview.page = 1;
      renderConfiguredLimitPreviewDialog(draft);
      return;
    }
    if (target.hasAttribute("data-configured-limit-preview-page-size")) {
      if (event.type !== "change") return;
      editorState.configuredLimitPreview.pageSize = Number(target.value) || 20;
      editorState.configuredLimitPreview.page = 1;
      renderConfiguredLimitPreviewDialog(draft);
      return;
    }
```

在现有 `compositionstart` / `compositionend` 监听中，对 `data-configured-limit-preview-search` 做与选品搜索相同的 composing 处理：

```js
      if (event.target.hasAttribute("data-configured-limit-preview-search")) {
        editorState.configuredLimitPreview.searchComposing = true; // start
        // end: searchComposing=false; page=1; renderConfiguredLimitPreviewDialog(draft, true);
      }
```

- [ ] **Step 3: Esc 关闭**

找到现有 `Escape` → `closeSelectedPreview` 的 keydown 逻辑，扩展为：

```js
      if (editorState.configuredLimitPreview && editorState.configuredLimitPreview.open) {
        closeConfiguredLimitPreview();
        return;
      }
      if (editorState.selectedPreview && editorState.selectedPreview.open) {
        closeSelectedPreview();
        return;
      }
```

- [ ] **Step 4: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js"
git commit -m "$(cat <<'EOF'
feat: wire configured limit preview interactions

Handle open/close, filters, pagination, IME search, and Escape.
EOF
)"
```

---

### Task 5: 跑绿验证与浏览器核对

**Files:**
- Test: `admin-web/scripts/verify-order-limit-configured-limit-preview.mjs`
- Verify: 现有 order-limit 专项脚本

- [ ] **Step 1: 跑新专项脚本**

Run: `node scripts/verify-order-limit-configured-limit-preview.mjs`

Expected: `Menu order limit configured rules preview verification passed`

- [ ] **Step 2: 语法检查与相关回归**

Run:

```bash
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-order-limit-batch-target-selection.mjs
node scripts/verify-order-limit-store-specific-config.mjs
node scripts/verify-order-limit-selected-products-preview.mjs
node scripts/verify-order-limit-store-product-search.mjs
```

Expected: 全部 PASS

- [ ] **Step 3: 浏览器验收清单**

在 `http://localhost:5173/#/operations/queue-call/menu-order-limits`：

1. 至少两家参与门店、两条产线配置不同数量（含一个 `0`）
2. 步骤 4 看到「查看已配置规则（N）」，N>0 可点
3. 弹层列出全部门店/场景/产线已配置行；`0` 显示「0（禁止）」
4. 门店/人数/产线/搜索/分页可用；单轮无轮次筛选项且轮次列为「—」
5. Esc / 遮罩 / 关闭后，当前门店与产线 Tab 不变
6. 无已配置时入口禁用；离开步骤 4 后预览关闭
7. 控制台无报错

- [ ] **Step 4: 同步主工作区预览镜像**

将 worktree 中以下文件内容同步到 Cursor 打开的主工作区同名路径（供 Vite HMR）：

- `admin-web/dist/Configuration center/assets/order-limit-flow.js`
- `admin-web/dist/Configuration center/assets/order-limit-flow.css`
- `admin-web/scripts/verify-order-limit-configured-limit-preview.mjs`

- [ ] **Step 5: Commit（若验收中有小修）**

仅当有额外修复时提交；否则跳过。

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js" "admin-web/dist/Configuration center/assets/order-limit-flow.css" admin-web/scripts/verify-order-limit-configured-limit-preview.mjs
git commit -m "$(cat <<'EOF'
fix: polish configured limit preview edge cases

Address verification and browser findings from the preview checklist.
EOF
)"
```

---

## Self-Review

**Spec coverage**
- 只读弹层入口 / N 计数 / 无门店不渲染 → Task 3
- eachLimitCell 口径、仅 configured、0 禁止、单轮「—」→ Task 2–3
- 筛选、分页、空态 → Task 3–4
- 临时状态不入库 → Task 1–2
- 离开步骤 4 / Esc 关闭 → Task 3–4
- 专项验证 + 浏览器 → Task 1、5
- 非目标（编辑/导出/跳转）→ Task 1 只读断言约束

**Placeholder scan:** 无 TBD / “类似 Task N” / 空实现步骤

**Type consistency:** `configuredLimitPreview`、`partyKey`/`roundKey`、`data-configured-limit-preview-*` 命名在各任务一致；默认 `pageSize: 20` 与筛选重置 `page = 1` 一致

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-16-order-limit-configured-rules-preview-implementation.md`.

**Two execution options:**

1. **Subagent-Driven（推荐）** — 每个 Task 派独立子代理，任务间复核，迭代快  
2. **Inline Execution** — 本会话按 executing-plans 连续执行，带检查点  

Which approach?
