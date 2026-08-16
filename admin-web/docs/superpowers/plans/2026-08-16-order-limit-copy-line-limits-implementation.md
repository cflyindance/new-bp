# 限购数量复制到其他产线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前门店内，将源产线全部人数×轮次限购数量按菜单 `key` 覆盖复制到多选的其他产线。

**Architecture:** 在 `editorState` 增加临时 `lineLimitCopy`；提供按 `key` 对齐写入 `activeStoreConfig(draft).limits` 的纯函数；步骤 4 产线标题旁入口 + 轻量 overlay 多选确认。权威源码：`dist/Configuration center/assets/order-limit-flow.js`（及必要时 CSS）。worktree 改完后双写主工作区 `admin-web/`。

**Tech Stack:** 原生 JS（IIFE）、现有 overlay/dialog 样式、Node assert 专项脚本

**Spec:** `docs/superpowers/specs/2026-08-16-order-limit-copy-line-limits-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-copy-line-limits`，分支 `wt/order-limit-copy-line-limits`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `admin-web/scripts/verify-order-limit-copy-line-limits.mjs` | 入口、状态、对齐写入、空覆盖、生命周期断言 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | 助手、弹层、事件 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.css` | 弹层多选列表小样式（可复用现有 dialog） |

---

### Task 1: 建立失败验证脚本

**Files:**
- Create: `admin-web/scripts/verify-order-limit-copy-line-limits.mjs`

- [ ] **Step 1: 写入专项脚本**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const [source, css] = await Promise.all([readFile(jsPath, "utf8"), readFile(cssPath, "utf8")]);

assert.match(source, /function createLineLimitCopyState\(\)/, "应提供复制弹层临时状态工厂");
assert.match(source, /lineLimitCopy:\s*createLineLimitCopyState\(\)/, "编辑器初始化应挂载 lineLimitCopy");
assert.doesNotMatch(
  source.match(/function defaultDraft\(\)[\s\S]*?(?=\n\s*function normalizeLoadedEditorDraft)/)?.[0] ?? "",
  /lineLimitCopy/,
  "复制状态不得进入规则默认草稿",
);
assert.doesNotMatch(
  source.match(/function buildCompatibilityRule\(draftRule, status\)[\s\S]*?(?=\n\s*function ruleSummary)/)?.[0] ?? "",
  /lineLimitCopy/,
  "复制状态不得进入兼容规则或发布快照",
);

assert.match(source, /function lineHasConfiguredLimits\(/, "应判断源产线是否有已配置格");
assert.match(source, /function copyLineLimitCandidateLines\(/, "应列出可勾选目标产线");
assert.match(source, /function estimateLineLimitCopy\(/, "应提供对齐/跳过摘要计数");
assert.match(source, /function applyLineLimitCopy\(/, "应提供按 key 覆盖写入助手");

const applyFn = source.match(/function applyLineLimitCopy\([\s\S]*?(?=\n\s*function [a-zA-Z])/)?.[0] ?? "";
assert.match(applyFn, /activeStoreConfig\(draft\)/, "写入应针对当前门店 config");
assert.match(applyFn, /configured:\s*false,\s*value:\s*null/, "源未配置应对齐写成未配置");
assert.match(applyFn, /target\.key|sourceTarget\.key|\.key\b/, "应按菜单 key 对齐");
assert.match(applyFn, /limitKey\(/, "应写入 limitKey");

assert.match(source, /复制到其他产线/, "步骤 4 应有入口文案");
assert.match(source, /data-line-limit-copy-open/, "应有打开入口标记");
assert.match(source, /data-line-limit-copy-overlay/, "应有弹层遮罩标记");
assert.match(source, /data-line-limit-copy-target/, "应有目标产线勾选标记");
assert.match(source, /data-line-limit-copy-apply/, "应有覆盖复制按钮");
assert.match(source, /data-line-limit-copy-close/, "应有关闭入口");

assert.match(source, /function openLineLimitCopy\(/, "应提供打开函数");
assert.match(source, /function closeLineLimitCopy\(/, "应提供关闭函数");
assert.match(
  source,
  /function goToEditorStep[\s\S]*?currentStep === 4[\s\S]*?closeLineLimitCopy\(\)/,
  "离开步骤 4 应关闭复制弹层",
);
assert.match(source, /Escape[\s\S]{0,240}closeLineLimitCopy|closeLineLimitCopy[\s\S]{0,240}Escape/, "Esc 应可关闭");

assert.match(css, /\.olf-line-limit-copy|\.olf-selected-preview-dialog/, "应提供或复用弹层样式");

console.log("Menu order limit copy line limits verification passed");
```

- [ ] **Step 2: 运行确认 RED**

Run: `node scripts/verify-order-limit-copy-line-limits.mjs`  

Expected: FAIL

- [ ] **Step 3: Commit + 同步主工作区脚本**

```bash
git add admin-web/scripts/verify-order-limit-copy-line-limits.mjs
git commit -m "$(cat <<'EOF'
test: add copy line limits verification

Lock cross-line overwrite copy contract before implementation.
EOF
)"
```

---

### Task 2: 状态与对齐写入助手

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（靠近 `createConfiguredLimitPreviewState` / `limitKey` 附近；`editorState` 初始化）

- [ ] **Step 1: 状态工厂与可用性**

```js
function createLineLimitCopyState() {
  return { open: false, selectedLineIds: [] };
}

function resetLineLimitCopy() {
  if (!editorState) return;
  editorState.lineLimitCopy = createLineLimitCopyState();
}

function closeLineLimitCopy() {
  if (!editorState) return;
  editorState.lineLimitCopy = createLineLimitCopyState();
  var overlay = root.querySelector("[data-line-limit-copy-overlay]");
  if (overlay) {
    overlay.classList.remove("is-open");
    overlay.innerHTML = "";
  }
}

function sceneRoundCount(draft) {
  return draft.period === "multi_round" ? draft.roundRanges.length : 1;
}

function lineHasConfiguredLimits(draft, lineId, config) {
  config = config || activeStoreConfig(draft);
  var roundCount = sceneRoundCount(draft);
  var targets = targetsForLine(draft, lineId, config);
  var found = false;
  draft.partyRanges.forEach(function (_, partyIndex) {
    for (var roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
      targets.forEach(function (target) {
        var cell = config.limits[limitKey(partyIndex, roundIndex, lineId, target.id)];
        if (cell && cell.configured) found = true;
      });
    }
  });
  return found;
}

function copyLineLimitCandidateLines(draft, config) {
  config = config || activeStoreConfig(draft);
  return (config.productLines || []).filter(function (lineId) {
    return lineId !== draft.activeLineId;
  });
}

function canOpenLineLimitCopy(draft, config) {
  config = config || activeStoreConfig(draft);
  if (!addedStoreIds(draft).length) return false;
  if (copyLineLimitCandidateLines(draft, config).length < 1) return false;
  return lineHasConfiguredLimits(draft, draft.activeLineId, config);
}
```

- [ ] **Step 2: 摘要与写入**

```js
function estimateLineLimitCopy(draft, sourceLineId, targetLineIds, config) {
  config = config || activeStoreConfig(draft);
  var roundCount = sceneRoundCount(draft);
  var sourceTargets = targetsForLine(draft, sourceLineId, config);
  var sourceKeys = {};
  sourceTargets.forEach(function (t) { if (t.key) sourceKeys[t.key] = true; });
  var writeCount = 0;
  var skipDestProducts = 0;
  var sourceOnlyKeys = 0;
  var matchedKeys = {};
  targetLineIds.forEach(function (targetLineId) {
    var destTargets = targetsForLine(draft, targetLineId, config);
    var destKeys = {};
    destTargets.forEach(function (t) {
      if (!t.key) return;
      destKeys[t.key] = true;
      var sourceHit = sourceTargets.some(function (s) { return s.key === t.key; });
      if (!sourceHit) skipDestProducts += 1;
      else {
        matchedKeys[t.key] = true;
        writeCount += draft.partyRanges.length * roundCount;
      }
    });
    Object.keys(sourceKeys).forEach(function (key) {
      if (!destKeys[key]) sourceOnlyKeys += 1;
    });
  });
  return {
    writeCount: writeCount,
    skipDestProducts: skipDestProducts,
    sourceOnlyKeys: sourceOnlyKeys
  };
}

function applyLineLimitCopy(draft, sourceLineId, targetLineIds) {
  var config = activeStoreConfig(draft);
  var roundCount = sceneRoundCount(draft);
  var sourceTargets = targetsForLine(draft, sourceLineId, config);
  var sourceByKey = {};
  sourceTargets.forEach(function (t) {
    if (t.key) sourceByKey[t.key] = t;
  });
  var writeCount = 0;
  var skipDestProducts = 0;
  targetLineIds.forEach(function (targetLineId) {
    targetsForLine(draft, targetLineId, config).forEach(function (destTarget) {
      var sourceTarget = destTarget.key ? sourceByKey[destTarget.key] : null;
      if (!sourceTarget) {
        skipDestProducts += 1;
        return;
      }
      draft.partyRanges.forEach(function (_, partyIndex) {
        for (var roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
          var sourceCell = config.limits[limitKey(partyIndex, roundIndex, sourceLineId, sourceTarget.id)];
          var destKey = limitKey(partyIndex, roundIndex, targetLineId, destTarget.id);
          if (sourceCell && sourceCell.configured) {
            config.limits[destKey] = { configured: true, value: sourceCell.value };
          } else {
            config.limits[destKey] = { configured: false, value: null };
          }
          writeCount += 1;
        }
      });
    });
  });
  return { writeCount: writeCount, skipDestProducts: skipDestProducts };
}
```

- [ ] **Step 3: `editorState` 增加 `lineLimitCopy: createLineLimitCopyState()`**

- [ ] **Step 4: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js"
git commit -m "$(cat <<'EOF'
feat: add cross-line limit copy helpers

Estimate and apply key-aligned overwrite copies within a store.
EOF
)"
```

双写 JS。

---

### Task 3: 入口、弹层渲染与样式

**Files:**
- Modify: `order-limit-flow.js`（`renderStepFour` 产线标题行；新增 `renderLineLimitCopyDialog`）
- Modify: `order-limit-flow.css`（多选列表）

- [ ] **Step 1: 产线标题旁入口**

在「查看已配置规则」旁增加：

```js
var copyEnabled = canOpenLineLimitCopy(draft, config);
// ...
'<div class="olf-actions olf-line-limit-copy-actions">' +
  '<button type="button" class="olf-button olf-button--small" data-line-limit-copy-open' + (copyEnabled ? '' : ' disabled') + ' title="' + (copyEnabled ? '' : esc('需至少两条产线且当前产线已配置数量')) + '">复制到其他产线</button>' +
  '<button type="button" class="olf-button olf-button--small olf-configured-limit-preview-entry" data-configured-limit-preview-open' + ...
```

（保持现有预览按钮；可用 `olf-section-head` 右侧并排放两个按钮。）

- [ ] **Step 2: 打开时在 root 增加 overlay（若尚未挂载）**

在 `openEditor` 初始 HTML 中追加：

```html
<div class="olf-overlay olf-line-limit-copy-overlay" data-line-limit-copy-overlay></div>
```

- [ ] **Step 3: 渲染弹层**

```js
function renderLineLimitCopyDialog(draft) {
  var overlay = root.querySelector("[data-line-limit-copy-overlay]");
  if (!overlay || !editorState || !editorState.lineLimitCopy.open) return;
  var config = activeStoreConfig(draft);
  var state = editorState.lineLimitCopy;
  var sourceLine = lines.find(function (l) { return l.id === draft.activeLineId; });
  var candidates = copyLineLimitCandidateLines(draft, config);
  var estimate = estimateLineLimitCopy(draft, draft.activeLineId, state.selectedLineIds, config);
  var listHtml = candidates.map(function (lineId) {
    var line = lines.find(function (l) { return l.id === lineId; });
    var checked = state.selectedLineIds.indexOf(lineId) >= 0;
    return '<label class="olf-line-limit-copy-option"><input type="checkbox" data-line-limit-copy-target="' + esc(lineId) + '"' + (checked ? ' checked' : '') + ' /><span>' + esc(line ? line.name : lineId) + '</span></label>';
  }).join('');
  var canApply = state.selectedLineIds.length > 0;
  overlay.innerHTML = '<section class="olf-dialog olf-line-limit-copy-dialog" role="dialog" aria-modal="true" aria-labelledby="lineLimitCopyTitle"><h3 id="lineLimitCopyTitle" tabindex="-1">复制到其他产线</h3><p>将把「' + esc(sourceLine ? sourceLine.name : draft.activeLineId) + '」的全部人数/轮次数量覆盖到所选产线。仅对齐双方都有的菜单；源未配置的格也会清空目标对应格。</p><div class="olf-line-limit-copy-list">' + listHtml + '</div><div class="olf-help">预计写入 ' + estimate.writeCount + ' 格；目标侧跳过 ' + estimate.skipDestProducts + ' 个商品；源独有 ' + estimate.sourceOnlyKeys + ' 个 key。</div><div class="olf-dialog-actions"><button type="button" class="olf-button" data-line-limit-copy-close>取消</button><button type="button" class="olf-button olf-button--primary" data-line-limit-copy-apply' + (canApply ? '' : ' disabled') + '>覆盖复制</button></div></section>';
  overlay.classList.add("is-open");
}

function openLineLimitCopy() {
  var draft = editorState.rule.editorDraft;
  if (!canOpenLineLimitCopy(draft)) {
    toast("需至少两条产线，且当前产线已配置数量", true);
    return;
  }
  editorState.lineLimitCopy = { open: true, selectedLineIds: [] };
  renderLineLimitCopyDialog(draft);
  var title = document.getElementById("lineLimitCopyTitle");
  if (title) title.focus();
}
```

- [ ] **Step 4: CSS**

```css
.olf-line-limit-copy-overlay.is-open { display: grid; }
.olf-line-limit-copy-dialog { max-width: 480px; width: min(480px, 92vw); }
.olf-line-limit-copy-list { display: grid; gap: 10px; margin: 14px 0; max-height: 240px; overflow: auto; }
.olf-line-limit-copy-option { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.olf-section-head .olf-line-limit-copy-actions,
.olf-line-limit-head-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
```

（若 `.olf-overlay` 默认已 `display:none` / `.is-open` 显示，对齐现有 selected-preview 写法。）

- [ ] **Step 5: Commit + 双写**

```bash
git commit -m "$(cat <<'EOF'
feat: render copy-to-other-lines dialog

Add step-4 entry and multi-select overwrite confirmation UI.
EOF
)"
```

---

### Task 4: 事件与生命周期

**Files:**
- Modify: `order-limit-flow.js`（`handleEditorClick` / `handleEditorInput` / `goToEditorStep` / Esc）

- [ ] **Step 1: Click**

```js
if (event.target && event.target.hasAttribute && event.target.hasAttribute("data-line-limit-copy-overlay")) {
  closeLineLimitCopy();
  return;
}
// in button branch:
if (button.hasAttribute("data-line-limit-copy-open")) { openLineLimitCopy(); return; }
if (button.hasAttribute("data-line-limit-copy-close")) { closeLineLimitCopy(); return; }
if (button.hasAttribute("data-line-limit-copy-apply")) {
  var draft = editorState.rule.editorDraft;
  var selected = (editorState.lineLimitCopy.selectedLineIds || []).slice();
  if (!selected.length) { toast("请至少选择一条目标产线", true); return; }
  var result = applyLineLimitCopy(draft, draft.activeLineId, selected);
  markEditorDirty();
  closeLineLimitCopy();
  var names = selected.map(function (id) {
    var line = lines.find(function (l) { return l.id === id; });
    return line ? line.name : id;
  }).join("、");
  toast("已复制到 " + names + "（写入 " + result.writeCount + " 格，跳过 " + result.skipDestProducts + " 个商品）");
  renderEditor();
  return;
}
```

- [ ] **Step 2: Change checkbox**

```js
if (target.hasAttribute("data-line-limit-copy-target")) {
  if (event.type !== "change") return;
  var lineId = target.getAttribute("data-line-limit-copy-target");
  var ids = editorState.lineLimitCopy.selectedLineIds.slice();
  var idx = ids.indexOf(lineId);
  if (target.checked && idx < 0) ids.push(lineId);
  if (!target.checked && idx >= 0) ids.splice(idx, 1);
  editorState.lineLimitCopy.selectedLineIds = ids;
  renderLineLimitCopyDialog(draft);
  return;
}
```

- [ ] **Step 3: `goToEditorStep` 离开步骤 4 时 `closeLineLimitCopy()`；Esc 在配置预览之后处理 `lineLimitCopy.open`**

- [ ] **Step 4: 跑验证**

```bash
node scripts/verify-order-limit-copy-line-limits.mjs
node scripts/verify-order-limit-line-first-scenes.mjs
node scripts/verify-order-limit-scene-combo-tile.mjs
node scripts/verify-order-limit-batch-target-selection.mjs
```

Expected: 全部 PASS

- [ ] **Step 5: Commit + 双写**

```bash
git commit -m "$(cat <<'EOF'
feat: wire copy line limit dialog events

Apply key-aligned overwrite copy and close on leave/Esc.
EOF
)"
```

---

### Task 5: 浏览器验收

- [ ] 源产线有配置、≥2 产线：入口可用；复制到一条/多条后同 key 全场景一致（含 0 与清空）  
- [ ] 目标独有商品不变；源独有不同步出新菜单  
- [ ] 单产线或源无配置：入口 disabled  
- [ ] Esc / 取消不改数据  

---

## Spec 覆盖自检

| Spec | Task |
|---|---|
| 入口与可用性 | Task 3 |
| 多选覆盖 + 空也覆盖 | Task 2+4 |
| 仅当前门店 limits | Task 2 `activeStoreConfig` |
| 不入库 | Task 1+2 |
| 验证脚本 | Task 1+4 |

## Placeholder 扫描

无 TBD；关键函数与 data 属性已给出。
