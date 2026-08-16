# 限购数量人数×轮次组合平铺展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 多轮规则在限购数量步骤默认按「人数×轮次」组合平铺编辑，并保留「分开选择」两排 Tab。

**Architecture:** 在 `editorState` 增加临时 `sceneDisplayMode` 与按场景键隔离的批量勾选；步骤 4 按模式分支渲染。平铺下每个组合块显式携带 `partyIndex`/`roundIndex` 读写 `limits`，不依赖也不改动 `activePartyIndex`/`activeRoundIndex`。权威源码在 `dist/Configuration center/assets/order-limit-flow.js`（及同目录 CSS）；Vite 经 iframe 直接服务该目录。改动须在 worktree 完成后**双写同步**到主工作区 `admin-web/`。

**Tech Stack:** 原生 JS（IIFE）、`order-limit-flow.css`、Node assert 专项脚本

**Spec:** `docs/superpowers/specs/2026-08-16-order-limit-scene-combo-tile-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-scene-combo-tile`，分支 `wt/order-limit-scene-combo-tile`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `admin-web/scripts/verify-order-limit-scene-combo-tile.mjs` | 专项断言：模式状态、平铺块、批量作用域、生命周期、样式 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | 状态、完成度助手、步骤 4 渲染、事件 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.css` | 分段控件与组合块样式 |

不新建独立 JS 模块；与现有步骤 4 同文件。

---

### Task 1: 建立失败验证脚本

**Files:**
- Create: `admin-web/scripts/verify-order-limit-scene-combo-tile.mjs`

- [ ] **Step 1: 写入专项验证脚本**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /sceneDisplayMode:\s*["']tile["']/, "编辑器默认场景展示应为组合平铺");
assert.match(source, /batchSelectedByScene:\s*\{\}/, "平铺批量勾选应按场景键隔离初始化");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /sceneDisplayMode|batchSelectedByScene/,
  "场景展示状态不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "",
  /sceneDisplayMode|batchSelectedByScene/,
  "场景展示状态不得进入兼容规则或发布快照",
);

assert.match(source, /function sceneKey\(partyIndex,\s*roundIndex\)/, "应提供场景键助手");
assert.match(source, /function sceneCombos\(draft\)/, "应按 party×round 生成组合列表");
assert.match(source, /function isSceneTileMode\(draft\)/, "应提供平铺模式判断");
assert.match(source, /function resetSceneDisplayMode\(\)/, "应提供离开步骤时重置展示模式");
assert.match(source, /function sceneComboCompletion\(/, "应提供块级完成度助手");

assert.match(source, /data-scene-display-mode/, "多轮应渲染场景展示分段控件");
assert.match(source, /组合平铺/, "分段文案应含组合平铺");
assert.match(source, /分开选择/, "分段文案应含分开选择");
assert.match(source, /data-scene-block=/, "平铺应渲染组合块标记");
assert.match(source, /data-scene-party=/, "块/控件应显式携带人数索引");
assert.match(source, /data-scene-round=/, "块/控件应显式携带轮次索引");
assert.match(source, /data-scene-batch-target-id|data-batch-target-id=[\s\S]*data-scene-party/, "平铺批量勾选应绑定场景");
assert.match(source, /data-scene-apply-batch|data-apply-batch=[\s\S]*data-scene-party/, "平铺批量应用应绑定场景");
assert.match(source, /data-limit-target=[\s\S]*data-scene-party|data-scene-limit-target/, "平铺数量输入应绑定场景");

const leaveStep = source.match(/function goToEditorStep[\s\S]*?(?=\n\s*function handleEditorClick)/)?.[0] ?? "";
assert.match(leaveStep, /currentStep === 4[\s\S]*?resetSceneDisplayMode\(\)/, "离开步骤 4 应重置为平铺");
assert.match(leaveStep, /currentStep === 4[\s\S]*?resetBatchSelection\(\)/, "离开步骤 4 应清空批量勾选");

assert.match(
  source,
  /data-scene-display-mode[\s\S]{0,400}resetBatchSelection|resetBatchSelection[\s\S]{0,400}sceneDisplayMode/,
  "切换展示模式应清空勾选",
);

assert.match(css, /\.olf-scene-display-toggle|\.olf-segmented/, "应提供场景展示分段样式");
assert.match(css, /\.olf-scene-combo-block/, "应提供组合块样式");

console.log("Menu order limit scene combo tile verification passed");
```

- [ ] **Step 2: 运行验证确认 RED**

Run: `node scripts/verify-order-limit-scene-combo-tile.mjs`

Expected: FAIL（缺少 `sceneDisplayMode` 等符号）

- [ ] **Step 3: Commit**

```bash
git add admin-web/scripts/verify-order-limit-scene-combo-tile.mjs
git commit -m "$(cat <<'EOF'
test: add scene combo tile verification

Lock multi-round party×round tile display contract before implementation.
EOF
)"
```

同步：将同文件复制到主工作区 `admin-web/scripts/`。

---

### Task 2: 临时状态与助手函数

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（`resetBatchSelection` 附近、`completionFor` 附近、`openEditor`/`editorState` 初始化、`goToEditorStep`）

- [ ] **Step 1: 扩展 `resetBatchSelection`，并新增场景助手（放在 `resetBatchSelection` 之后）**

```js
function resetBatchSelection() {
  if (!editorState) return;
  editorState.batchSelectedTargetIds = [];
  editorState.batchSelectedByScene = {};
}

function resetSceneDisplayMode() {
  if (!editorState) return;
  editorState.sceneDisplayMode = "tile";
}

function sceneKey(partyIndex, roundIndex) {
  return String(partyIndex) + "|" + String(roundIndex);
}

function isSceneTileMode(draft) {
  return !!(draft && draft.period === "multi_round" && editorState && editorState.sceneDisplayMode === "tile");
}

function sceneCombos(draft) {
  if (!draft || draft.period !== "multi_round") return [];
  var combos = [];
  draft.partyRanges.forEach(function (partyRange, partyIndex) {
    draft.roundRanges.forEach(function (roundRange, roundIndex) {
      combos.push({
        partyIndex: partyIndex,
        roundIndex: roundIndex,
        partyRange: partyRange,
        roundRange: roundRange,
        key: sceneKey(partyIndex, roundIndex),
        title: formatRange(partyRange, "人") + " · " + formatRange(roundRange, "轮")
      });
    });
  });
  return combos;
}

function sceneComboCompletion(draft, partyIndex, roundIndex, lineId, config) {
  config = config || activeStoreConfig(draft);
  var targets = targetsForLine(draft, lineId, config);
  var total = targets.length;
  var complete = targets.reduce(function (count, target) {
    var cell = config.limits[limitKey(partyIndex, roundIndex, lineId, target.id)];
    return count + (cell && cell.configured ? 1 : 0);
  }, 0);
  return { complete: complete, total: total, label: complete + "/" + total };
}
```

- [ ] **Step 2: 更新 `completionFor`——多轮时跨全部人数×轮次汇总（产线 Tab）；非多轮保持现网「当前人数 × round0」**

将现有：

```js
function completionFor(draft, lineId, config) {
  config = config || activeStoreConfig(draft);
  var targets = targetsForLine(draft, lineId, config);
  var total = targets.length;
  var complete = targets.reduce(function (count, target) {
    var cell = config.limits[limitKey(draft.activePartyIndex, draft.period === "multi_round" ? draft.activeRoundIndex : 0, lineId, target.id)];
    return count + (cell && cell.configured ? 1 : 0);
  }, 0);
  return complete + "/" + total;
}
```

替换为：

```js
function completionFor(draft, lineId, config) {
  config = config || activeStoreConfig(draft);
  var targets = targetsForLine(draft, lineId, config);
  if (!targets.length) return "0/0";
  if (draft.period !== "multi_round") {
    var completeSingle = targets.reduce(function (count, target) {
      var cell = config.limits[limitKey(draft.activePartyIndex, 0, lineId, target.id)];
      return count + (cell && cell.configured ? 1 : 0);
    }, 0);
    return completeSingle + "/" + targets.length;
  }
  var total = 0;
  var complete = 0;
  draft.partyRanges.forEach(function (_, partyIndex) {
    draft.roundRanges.forEach(function (__ , roundIndex) {
      targets.forEach(function (target) {
        total += 1;
        var cell = config.limits[limitKey(partyIndex, roundIndex, lineId, target.id)];
        if (cell && cell.configured) complete += 1;
      });
    });
  });
  return complete + "/" + total;
}
```

- [ ] **Step 3: `editorState` 初始化增加字段（`openEditor` / 创建 `editorState` 处，与 `batchSelectedTargetIds: []` 并列）**

```js
sceneDisplayMode: "tile",
batchSelectedByScene: {},
```

- [ ] **Step 4: `goToEditorStep` 离开步骤 4 时重置展示模式**

在现有：

```js
if (editorState.currentStep === 4 && step !== 4) {
  resetBatchSelection();
  closeConfiguredLimitPreview();
}
```

改为：

```js
if (editorState.currentStep === 4 && step !== 4) {
  resetBatchSelection();
  resetSceneDisplayMode();
  closeConfiguredLimitPreview();
}
```

- [ ] **Step 5: 跑验证——部分仍 RED 可接受；确认初始化相关断言将通过**

Run: `node scripts/verify-order-limit-scene-combo-tile.mjs`

Expected: 仍 FAIL（缺渲染标记），但不应再因缺少 `sceneDisplayMode:` / `sceneKey` / `resetSceneDisplayMode` 失败。若这些仍 FAIL，先修到通过再继续。

- [ ] **Step 6: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js"
git commit -m "$(cat <<'EOF'
feat: add scene display state helpers

Introduce temporary tile/split mode state and combo completion helpers.
EOF
)"
```

同步：双写 JS 到主工作区同路径。

---

### Task 3: 分段与组合块样式

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.css`

- [ ] **Step 1: 在 `.olf-tabs` / `.olf-batch-*` 附近追加样式**

```css
.olf-scene-display {
  margin-top: 18px;
}
.olf-scene-display-label {
  display: block;
  margin-bottom: 8px;
  color: var(--olf-secondary);
  font-size: 13px;
  font-weight: 500;
}
.olf-segmented {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0;
  border: 1px solid var(--olf-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--olf-subtle);
}
.olf-segmented__btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--olf-secondary);
  font: inherit;
  font-size: 13px;
  padding: 8px 14px;
  cursor: pointer;
}
.olf-segmented__btn + .olf-segmented__btn {
  border-left: 1px solid var(--olf-border);
}
.olf-segmented__btn.is-active {
  background: #fff;
  color: var(--olf-primary-text);
  font-weight: 600;
}
.olf-scene-combo-block {
  margin-top: 18px;
  padding-top: 4px;
  border-top: 1px solid var(--olf-border);
}
.olf-scene-combo-block:first-of-type {
  border-top: 0;
  padding-top: 0;
}
.olf-scene-combo-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  margin: 12px 0 8px;
}
.olf-scene-combo-head h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.olf-scene-combo-completion {
  color: var(--olf-secondary);
  font-size: 13px;
}
```

- [ ] **Step 2: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.css"
git commit -m "$(cat <<'EOF'
style: add scene combo tile layout styles

Support segmented display toggle and per-combo matrix blocks.
EOF
)"
```

同步：双写 CSS 到主工作区。

---

### Task 4: 步骤 4 渲染（分段 + 平铺块 / 分开选择）

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（`cellFor` / `renderLimitRows` / `renderStepFour`）

- [ ] **Step 1: 扩展单元格与行渲染，支持显式 party/round（平铺）**

在 `cellFor` 旁增加（或改写为带可选索引）：

```js
function cellForScene(draft, partyIndex, roundIndex, targetId, config) {
  config = config || activeStoreConfig(draft);
  var round = draft.period === "multi_round" ? roundIndex : 0;
  return config.limits[limitKey(partyIndex, round, draft.activeLineId, targetId)] || { configured: false, value: null };
}

function renderLimitRowsForScene(draft, partyIndex, roundIndex) {
  var config = activeStoreConfig(draft);
  var key = sceneKey(partyIndex, roundIndex);
  var batchSelectedIds = [];
  if (editorState) {
    if (isSceneTileMode(draft)) {
      batchSelectedIds = (editorState.batchSelectedByScene && editorState.batchSelectedByScene[key]) || [];
    } else {
      batchSelectedIds = editorState.batchSelectedTargetIds || [];
    }
  }
  var sceneAttrs = isSceneTileMode(draft)
    ? ' data-scene-party="' + partyIndex + '" data-scene-round="' + roundIndex + '"'
    : "";
  return targetsForLine(draft, draft.activeLineId, config).map(function (target) {
    var cell = cellForScene(draft, partyIndex, roundIndex, target.id, config);
    var targetName = target.shortName || target.name;
    var selectCell = '<td class="olf-batch-select-cell"><label class="olf-batch-check"><input type="checkbox" data-batch-target-id="' + esc(target.id) + '"' + sceneAttrs + (batchSelectedIds.indexOf(target.id) >= 0 ? " checked" : "") + ' /><span class="olf-sr-only">选择' + esc(targetName) + '</span></label></td>';
    return '<tr>' + selectCell + '<td><strong>' + esc(targetName) + '</strong>' + (target.count ? '<div class="olf-hint">包含 ' + target.count + ' 个菜品</div>' : '<div class="olf-hint">' + esc(target.category || "") + '</div>') + '</td><td><input class="olf-input olf-limit-input" type="number" min="0" value="' + (cell.configured && cell.value != null ? esc(cell.value) : "") + '" placeholder="未配置" data-limit-target="' + esc(target.id) + '"' + sceneAttrs + ' /></td></tr>';
  }).join("");
}
```

将现有 `renderLimitRows(draft)` 改为委托：

```js
function renderLimitRows(draft) {
  return renderLimitRowsForScene(
    draft,
    draft.activePartyIndex,
    draft.period === "multi_round" ? draft.activeRoundIndex : 0
  );
}
```

- [ ] **Step 2: 增加批量条与场景块渲染助手**

```js
function renderBatchPanelForScene(draft, partyIndex, roundIndex, batchSelectedCount, batchTargetCount) {
  var sceneAttrs = isSceneTileMode(draft)
    ? ' data-scene-party="' + partyIndex + '" data-scene-round="' + roundIndex + '"'
    : "";
  var idAttr = isSceneTileMode(draft)
    ? ' id="batchPanel-' + partyIndex + '-' + roundIndex + '"'
    : ' id="batchPanel"';
  var inputId = isSceneTileMode(draft)
    ? 'batchLimitValue-' + partyIndex + '-' + roundIndex
    : 'batchLimitValue';
  var allChecked = batchTargetCount > 0 && batchSelectedCount === batchTargetCount;
  return '<div' + idAttr + ' class="olf-summary olf-batch-panel"' + sceneAttrs + '><div class="olf-batch-toolbar"><strong class="olf-batch-count" data-batch-selected-count' + sceneAttrs + '>已选 ' + batchSelectedCount + ' 项</strong><button type="button" class="olf-button olf-button--small olf-button--quiet" data-batch-select-all-action' + sceneAttrs + '>全选当前产线</button><button type="button" class="olf-button olf-button--small olf-button--quiet" data-batch-clear' + sceneAttrs + (batchSelectedCount ? '' : ' disabled') + '>清空选择</button><span class="olf-batch-spacer"></span><input class="olf-input olf-limit-input" type="number" min="0" id="' + inputId + '" placeholder="数量"' + sceneAttrs + ' /><button type="button" class="olf-button olf-button--small" data-apply-batch="value"' + sceneAttrs + (batchSelectedCount ? '' : ' disabled') + '>应用数量</button></div></div>';
}

function selectedBatchTargetsForScene(draft, partyIndex, roundIndex) {
  var targets = currentBatchTargets(draft);
  var validIds = targets.map(function (target) { return target.id; });
  var selectedIds = [];
  if (editorState) {
    if (isSceneTileMode(draft)) {
      var key = sceneKey(partyIndex, roundIndex);
      selectedIds = ((editorState.batchSelectedByScene || {})[key] || []).filter(function (id) {
        return validIds.indexOf(id) >= 0;
      });
      editorState.batchSelectedByScene[key] = selectedIds;
    } else {
      selectedIds = (editorState.batchSelectedTargetIds || []).filter(function (id) {
        return validIds.indexOf(id) >= 0;
      });
      editorState.batchSelectedTargetIds = selectedIds;
    }
  }
  return targets.filter(function (target) { return selectedIds.indexOf(target.id) >= 0; });
}

function renderSceneComboBlocks(draft, config) {
  return sceneCombos(draft).map(function (combo) {
    var completion = sceneComboCompletion(draft, combo.partyIndex, combo.roundIndex, draft.activeLineId, config);
    var batchTargets = currentBatchTargets(draft);
    var batchSelected = selectedBatchTargetsForScene(draft, combo.partyIndex, combo.roundIndex);
    var selectHeader = '<th class="olf-batch-select-cell"><label class="olf-batch-check"><input type="checkbox" data-batch-select-all data-scene-party="' + combo.partyIndex + '" data-scene-round="' + combo.roundIndex + '"' + (batchTargets.length > 0 && batchSelected.length === batchTargets.length ? ' checked' : '') + ' /><span class="olf-sr-only">全选当前产线</span></label></th>';
    return '<section class="olf-scene-combo-block" data-scene-block="' + esc(combo.key) + '" data-scene-party="' + combo.partyIndex + '" data-scene-round="' + combo.roundIndex + '"><div class="olf-scene-combo-head"><h4>' + esc(combo.title) + '</h4><span class="olf-scene-combo-completion">已配 ' + completion.label + '</span></div>' +
      renderBatchPanelForScene(draft, combo.partyIndex, combo.roundIndex, batchSelected.length, batchTargets.length) +
      '<div class="olf-table-wrap"><table class="olf-table"><thead><tr>' + selectHeader + '<th>' + (draft.targetType === 'dish' ? '菜品' : '分类') + '</th><th>' + (draft.subject === 'party_size' ? '人均上限' : '订单上限') + '</th></tr></thead><tbody>' + renderLimitRowsForScene(draft, combo.partyIndex, combo.roundIndex) + '</tbody></table></div></section>';
  }).join('');
}

function renderSceneDisplayToggle(draft) {
  if (draft.period !== "multi_round") return "";
  var mode = editorState && editorState.sceneDisplayMode === "split" ? "split" : "tile";
  return '<div class="olf-scene-display"><span class="olf-scene-display-label">场景展示</span><div class="olf-segmented" role="group" aria-label="场景展示">' +
    '<button type="button" class="olf-segmented__btn' + (mode === "tile" ? ' is-active' : '') + '" data-scene-display-mode="tile">组合平铺</button>' +
    '<button type="button" class="olf-segmented__btn' + (mode === "split" ? ' is-active' : '') + '" data-scene-display-mode="split">分开选择</button>' +
    '</div></div>';
}
```

- [ ] **Step 3: 改写 `renderStepFour` 结构**

核心结构（保留现有门店下拉、产线 Tab、「查看已配置规则」、空门店提示）：

1. 配置门店  
2. 若 `hasConfiguredStores && multi_round`：插入 `renderSceneDisplayToggle(draft)`  
3. 若平铺（`isSceneTileMode`）：**不**渲染人数/轮次 Tab；产线区之后渲染 `renderSceneComboBlocks`，**不再**渲染单套 `batchPanel` + 单表  
4. 若分开选择或非多轮：保持现有人数/轮次 Tab + 单套批量条 + 单表（批量条可改为调用 `renderBatchPanelForScene(draft, activeParty, activeRound, ...)` 且不带 sceneAttrs）

将现有 `renderStepFour` 中场景区与矩阵区替换为等价逻辑，示意：

```js
var tileMode = isSceneTileMode(draft);
var sceneToggle = hasConfiguredStores ? renderSceneDisplayToggle(draft) : "";
var sceneTabsHtml = "";
if (hasConfiguredStores && !tileMode) {
  sceneTabsHtml = '<h3 style="margin-top:20px">人数场景</h3><div class="olf-tabs">' + partyTabs + '</div>' +
    (roundTabs ? '<h3 style="margin-top:20px">轮次场景</h3><div class="olf-tabs">' + roundTabs + '</div>' : '');
}
var matrixHtml = tileMode
  ? renderSceneComboBlocks(draft, config)
  : (batchPanel + '</section><section class="olf-section"><div class="olf-table-wrap"><table class="olf-table"><thead><tr>' + selectHeader + '<th>...' + '</th></tr></thead><tbody>' + renderLimitRows(draft) + '</tbody></table></div></section>');
```

注意：平铺模式下产线 section 只含标题 + 产线 Tab，**不含**顶层 `batchPanel`；矩阵在后续 section 或直接跟在产线 Tab 后由 `renderSceneComboBlocks` 输出。拼 HTML 时勿破坏现有 `olf-section` 闭合标签。

分开选择路径继续用现有 `batchSelected` / `selectHeader` / `batchPanel` / `renderLimitRows(draft)` 即可（可逐步改为助手，但行为必须与现网一致）。

- [ ] **Step 4: 跑验证——渲染相关断言应变绿**

Run: `node scripts/verify-order-limit-scene-combo-tile.mjs`

Expected: 若事件断言仍红可接受；`data-scene-display-mode` / `data-scene-block` / CSS 类应通过。

- [ ] **Step 5: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js"
git commit -m "$(cat <<'EOF'
feat: render multi-round scene combo tiles

Default tile layout with per-combo matrices and display mode toggle.
EOF
)"
```

同步：双写 JS。

---

### Task 5: 事件处理（模式切换、块级批量、块级输入）

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（`setBatchSelection` / `syncBatchControls` / `handleEditorClick` / `handleEditorInput`）

- [ ] **Step 1: 场景批量读写与 scoped sync**

```js
function readSceneIndexes(el) {
  if (!el || !el.hasAttribute("data-scene-party")) return null;
  return {
    partyIndex: Number(el.getAttribute("data-scene-party")),
    roundIndex: Number(el.getAttribute("data-scene-round"))
  };
}

function setBatchSelection(targetIds, scene) {
  if (!editorState) return;
  var ids = targetIds.filter(function (targetId, index, list) { return list.indexOf(targetId) === index; });
  if (scene) {
    if (!editorState.batchSelectedByScene) editorState.batchSelectedByScene = {};
    editorState.batchSelectedByScene[sceneKey(scene.partyIndex, scene.roundIndex)] = ids;
    syncBatchControls(scene);
    return;
  }
  editorState.batchSelectedTargetIds = ids;
  syncBatchControls(null);
}

function syncBatchControls(scene) {
  if (!editorState) return;
  var draft = editorState.rule.editorDraft;
  var scopeRoot = root;
  if (scene) {
    var block = root.querySelector('[data-scene-block="' + sceneKey(scene.partyIndex, scene.roundIndex) + '"]');
    if (!block) return;
    scopeRoot = block;
  }
  var targets = currentBatchTargets(draft);
  var selected = scene
    ? selectedBatchTargetsForScene(draft, scene.partyIndex, scene.roundIndex)
    : selectedBatchTargets(draft);
  var selectedIds = selected.map(function (target) { return target.id; });
  scopeRoot.querySelectorAll("[data-batch-target-id]").forEach(function (checkbox) {
    checkbox.checked = selectedIds.indexOf(checkbox.getAttribute("data-batch-target-id")) >= 0;
  });
  var selectAll = scopeRoot.querySelector("[data-batch-select-all]");
  if (selectAll) {
    selectAll.checked = targets.length > 0 && selected.length === targets.length;
    selectAll.indeterminate = selected.length > 0 && selected.length < targets.length;
  }
  var count = scopeRoot.querySelector("[data-batch-selected-count]");
  if (count) count.textContent = "已选 " + selected.length + " 项";
  scopeRoot.querySelectorAll("[data-apply-batch]").forEach(function (button) { button.disabled = selected.length === 0; });
  var clearButton = scopeRoot.querySelector("[data-batch-clear]");
  if (clearButton) clearButton.disabled = selected.length === 0;
}
```

保留 `selectedBatchTargets(draft)` 供分开选择；内部继续只用 `batchSelectedTargetIds`。

- [ ] **Step 2: `handleEditorClick`——模式切换与带场景的批量按钮**

在 `data-choice-field` 等分支附近加入：

```js
if (button.hasAttribute("data-scene-display-mode")) {
  var nextMode = button.getAttribute("data-scene-display-mode") === "split" ? "split" : "tile";
  if (editorState.sceneDisplayMode === nextMode) return;
  editorState.sceneDisplayMode = nextMode;
  resetBatchSelection();
  renderEditor();
  return;
}
```

修改产线 Tab（保留模式，清勾选）：

```js
if (button.hasAttribute("data-line-tab")) {
  resetBatchSelection();
  editorState.rule.editorDraft.activeLineId = button.getAttribute("data-line-tab");
  renderEditor();
  return;
}
```

（人数/轮次 Tab 仍 `resetBatchSelection`；平铺下本就不渲染它们。）

改写全选 / 清空 / 应用，读取 `readSceneIndexes(button)`：

```js
if (button.hasAttribute("data-batch-select-all-action")) {
  var sceneAll = readSceneIndexes(button);
  setBatchSelection(currentBatchTargets(editorState.rule.editorDraft).map(function (t) { return t.id; }), sceneAll);
  return;
}
if (button.hasAttribute("data-batch-clear")) {
  setBatchSelection([], readSceneIndexes(button));
  return;
}
if (button.hasAttribute("data-apply-batch")) {
  var draft = editorState.rule.editorDraft;
  if (button.getAttribute("data-apply-batch") !== "value") return;
  var scene = readSceneIndexes(button);
  var partyIndex = scene ? scene.partyIndex : draft.activePartyIndex;
  var roundIndex = scene ? scene.roundIndex : (draft.period === "multi_round" ? draft.activeRoundIndex : 0);
  var input = scene
    ? document.getElementById("batchLimitValue-" + partyIndex + "-" + roundIndex)
    : document.getElementById("batchLimitValue");
  var batchTargets = scene
    ? selectedBatchTargetsForScene(draft, partyIndex, roundIndex)
    : selectedBatchTargets(draft);
  if (!batchTargets.length) { toast("请至少选择一个" + (draft.targetType === "dish" ? "菜品" : "分类"), true); syncBatchControls(scene); return; }
  if (!input || input.value === "") { toast("请输入大于或等于 0 的整数", true); return; }
  var value = Number(input.value);
  if (!Number.isInteger(value) || value < 0) { toast("请输入大于或等于 0 的整数", true); return; }
  var config = activeStoreConfig(draft);
  batchTargets.forEach(function (target) {
    config.limits[limitKey(partyIndex, roundIndex, draft.activeLineId, target.id)] = { configured: true, value: value };
  });
  markEditorDirty();
  if (scene) {
    setBatchSelection([], scene);
  } else {
    resetBatchSelection();
  }
  renderEditor();
  return;
}
```

重要：平铺路径**禁止**写入 `activePartyIndex` / `activeRoundIndex`。

- [ ] **Step 3: `handleEditorInput`——勾选与数量输入带场景**

替换 `data-batch-target-id` / `data-batch-select-all` / `data-limit-target` 分支：

```js
if (target.hasAttribute("data-batch-target-id")) {
  var batchTargetId = target.getAttribute("data-batch-target-id");
  var sceneCheck = readSceneIndexes(target);
  var selectedIds = sceneCheck
    ? (((editorState.batchSelectedByScene || {})[sceneKey(sceneCheck.partyIndex, sceneCheck.roundIndex)]) || []).slice()
    : editorState.batchSelectedTargetIds.slice();
  var selectedIndex = selectedIds.indexOf(batchTargetId);
  if (target.checked && selectedIndex < 0) selectedIds.push(batchTargetId);
  if (!target.checked && selectedIndex >= 0) selectedIds.splice(selectedIndex, 1);
  setBatchSelection(selectedIds, sceneCheck);
  return;
}
if (target.hasAttribute("data-batch-select-all")) {
  var sceneSelectAll = readSceneIndexes(target);
  setBatchSelection(target.checked ? currentBatchTargets(draft).map(function (item) { return item.id; }) : [], sceneSelectAll);
  return;
}
if (target.hasAttribute("data-limit-target")) {
  var sceneLimit = readSceneIndexes(target);
  var partyIndex = sceneLimit ? sceneLimit.partyIndex : draft.activePartyIndex;
  var roundIndex = sceneLimit ? sceneLimit.roundIndex : (draft.period === "multi_round" ? draft.activeRoundIndex : 0);
  var key = limitKey(partyIndex, roundIndex, draft.activeLineId, target.getAttribute("data-limit-target"));
  activeStoreConfig(draft).limits[key] = target.value === ""
    ? { configured: false, value: null }
    : { configured: true, value: Math.max(0, Number(target.value)) };
  markEditorDirty();
  return;
}
```

门店切换处（`data-limit-store-select`）已有 `resetBatchSelection()` 则保留；确保**不**重置 `sceneDisplayMode`。

- [ ] **Step 4: 跑专项验证 + 既有批量脚本**

Run:

```bash
node scripts/verify-order-limit-scene-combo-tile.mjs
node scripts/verify-order-limit-batch-target-selection.mjs
node scripts/verify-order-limit-configured-limit-preview.mjs
```

Expected: 全部 PASS

若批量脚本因 `setBatchSelection` 签名变化失败：保证无第二参时行为与原来完全一致，并保留 `resetBatchSelection()` 在 apply 成功后的调用（分开选择路径）。

- [ ] **Step 5: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js" admin-web/scripts/verify-order-limit-scene-combo-tile.mjs
git commit -m "$(cat <<'EOF'
feat: wire scene tile batch and mode events

Scope batch/limit edits per party×round combo without mutating tab indexes.
EOF
)"
```

同步：双写 JS（及若改了脚本则同步脚本）。

---

### Task 6: 浏览器验收清单（人工）

登录墙可能导致自动化失败；由实现者或用户在主工作区 `npm run dev` 手工验收。

- [ ] **Step 1: 多轮 + 2 人数 × 2 轮次**

1. 默认看到「场景展示」分段，选中「组合平铺」  
2. 无人数/轮次 Tab；出现 4 个组合块，标题顺序为 party 外层 × round 内层  
3. 每块有「已配 x/y」与独立批量条  
4. 在块 A 填数量 / 批量，块 B 不受影响  
5. 产线 Tab 完成度为跨组合汇总  

- [ ] **Step 2: 模式往返**

1. 切到「分开选择」：出现两排 Tab；勾选被清空；limits 数值仍在  
2. 切回「组合平铺」：数值仍在；Tab 索引与进入平铺前一致（平铺编辑未改索引）  

- [ ] **Step 3: 非多轮**

无「场景展示」控件；人数 Tab + 单矩阵与现网一致。

- [ ] **Step 4: 离开步骤 4 再进入**

展示模式回到「组合平铺」。

- [ ] **Step 5: 若有缺口，修代码后重跑 Task 5 Step 4 脚本并补 commit**

---

## Spec 覆盖自检

| Spec 要求 | 任务 |
|---|---|
| 仅多轮显示模式切换 | Task 4 `renderSceneDisplayToggle` |
| 默认组合平铺 | Task 2 `sceneDisplayMode: "tile"` |
| 纵向组合块 + 块级完成度 | Task 4 `renderSceneComboBlocks` |
| 块级独立批量/勾选 | Task 2+5 `batchSelectedByScene` |
| 平铺不改 active 索引 | Task 5 显式 party/round |
| 切换清勾选不改 limits | Task 5 模式切换 |
| 离步骤 4 重置平铺 | Task 2 `goToEditorStep` |
| 切门店/产线保留模式、清勾选 | Task 5（既有 reset + 不调 resetSceneDisplayMode） |
| limits 键不变 | 全程 `limitKey(...)` |
| 非目标（宽表/跨块批量/持久化） | 未实现 |
| 专项脚本断言 | Task 1+5 |

## Placeholder 扫描

无 TBD / 「类似 Task N」占位；关键函数与 data 属性已写明。

## 类型/命名一致性

- `sceneDisplayMode`: `"tile" | "split"`
- `sceneKey` / `batchSelectedByScene[key]`
- `data-scene-display-mode` / `data-scene-block` / `data-scene-party` / `data-scene-round`
- `isSceneTileMode` / `sceneCombos` / `sceneComboCompletion` / `resetSceneDisplayMode`
