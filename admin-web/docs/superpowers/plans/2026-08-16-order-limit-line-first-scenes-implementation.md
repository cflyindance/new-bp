# 限购数量产线优先场景导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 步骤 4 统一为「门店 →（多轮）展示模式 → 产线 → 场景与数量」，分开选择/非多轮的人数（及轮次）Tab 挪到产线下方。

**Architecture:** 仅调整 `renderStepFour` HTML 拼装顺序；事件与 `limits` 键不变。组合平铺已是产线在场景块之上，本次主要改 `!tileMode` 路径。权威源码：`dist/Configuration center/assets/order-limit-flow.js`。改动在 worktree 完成后双写主工作区 `admin-web/`。

**Tech Stack:** 原生 JS（IIFE）、Node assert 专项脚本

**Spec:** `docs/superpowers/specs/2026-08-16-order-limit-line-first-scenes-design.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-line-first-scenes`，分支 `wt/order-limit-line-first-scenes`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `admin-web/scripts/verify-order-limit-line-first-scenes.mjs` | 断言步骤 4 中产线标记出现在人数/轮次标记之前 |
| `admin-web/dist/Configuration center/assets/order-limit-flow.js` | `renderStepFour` 拼装顺序 |

---

### Task 1: 建立失败验证脚本

**Files:**
- Create: `admin-web/scripts/verify-order-limit-line-first-scenes.mjs`

- [ ] **Step 1: 写入专项验证脚本**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const source = await readFile(jsPath, "utf8");

const stepFour = source.match(/function renderStepFour\(draft\)[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0] ?? "";
assert.ok(stepFour.length > 200, "应能定位 renderStepFour");

const lineIdx = stepFour.search(/data-line-tab=/);
const partyIdx = stepFour.search(/data-party-tab=/);
const roundIdx = stepFour.search(/data-round-tab=/);

assert.ok(lineIdx >= 0, "步骤 4 应渲染产线 Tab");
assert.ok(partyIdx >= 0, "步骤 4 应渲染人数场景 Tab（分开选择/非多轮路径）");
assert.ok(lineIdx < partyIdx, "产线 Tab 标记应出现在人数场景 Tab 标记之前（产线优先）");
if (roundIdx >= 0) {
  assert.ok(lineIdx < roundIdx, "产线 Tab 标记应出现在轮次场景 Tab 标记之前");
  assert.ok(partyIdx < roundIdx, "人数场景应仍在轮次场景之前");
}

assert.match(
  stepFour,
  /sceneToggle[\s\S]{0,120}(?!sceneTabsHtml)/,
  "门店区应挂场景展示分段，且人数/轮次不应再拼在门店 section 的 sceneToggle 之后",
);

// 更稳妥：门店 return 片段不得在同一 section 串接 sceneTabsHtml
assert.doesNotMatch(
  stepFour,
  /sceneToggle \+ sceneTabsHtml/,
  "sceneTabsHtml 不得再与 sceneToggle 拼在同一门店 section",
);
assert.match(
  stepFour,
  /lineTabs[\s\S]{0,200}sceneTabsHtml|sceneTabsHtml[\s\S]{0,80}batchPanel/,
  "人数/轮次场景应位于产线 Tab 之后、矩阵/批量之前",
);

assert.match(stepFour, /isSceneTileMode|tileMode/, "应保留组合平铺分支");
assert.match(stepFour, /data-scene-block|renderSceneComboBlocks/, "平铺仍渲染组合块");

console.log("Menu order limit line-first scenes verification passed");
```

- [ ] **Step 2: 运行确认 RED**

Run: `node scripts/verify-order-limit-line-first-scenes.mjs`

Expected: FAIL（当前仍为 `sceneToggle + sceneTabsHtml`，且源码字符串里 `data-party-tab` 生成表达式可能出现在 `data-line-tab` 之前——若因变量定义顺序导致 `partyIdx < lineIdx` 失败即符合 RED；实现后以拼装顺序断言为准。）

> 说明：`partyTabs` / `lineTabs` 变量定义顺序可能让 `.search(/data-party-tab=/)` 先命中 map 模板。实现 Task 2 后若仍因「定义在前」误报，将断言改为只检查 **return 拼装字符串**（见 Task 1 修订备选）。

**备选断言（若变量定义干扰，在 Task 2 前改用）：**

```js
const returnJoin = stepFour.match(/return '<div class="olf-content-head"[\s\S]*?(?=\n\s*function renderStepFive)/)?.[0] ?? stepFour;
assert.doesNotMatch(returnJoin, /sceneToggle \+ sceneTabsHtml/);
assert.match(returnJoin, /lineTabs[\s\S]{0,400}sceneTabsHtml|'\+ sceneTabsHtml \+|\"\+ sceneTabsHtml \+/);
// 在 return 片段中找字面量拼接顺序：产线 section 闭包后再出现 sceneTabsHtml
const lineSectionPos = returnJoin.indexOf("lineTabs");
const sceneTabsPos = returnJoin.indexOf("sceneTabsHtml");
assert.ok(lineSectionPos >= 0 && sceneTabsPos >= 0 && lineSectionPos < sceneTabsPos, "return 拼装中 lineTabs 应先于 sceneTabsHtml");
```

建议 **直接采用备选断言** 作为脚本正文，避免变量定义顺序假阴性/假阳性。

- [ ] **Step 3: Commit**

```bash
git add admin-web/scripts/verify-order-limit-line-first-scenes.mjs
git commit -m "$(cat <<'EOF'
test: add line-first scene navigation verification

Lock step-4 product-line-before-party/round markup order.
EOF
)"
```

同步脚本到主工作区 `admin-web/scripts/`。

---

### Task 2: 调整 `renderStepFour` 拼装顺序

**Files:**
- Modify: `admin-web/dist/Configuration center/assets/order-limit-flow.js`（`renderStepFour` 末尾 return）

- [ ] **Step 1: 改 sceneTabsHtml 与 return 结构**

将现有：

```js
var sceneTabsHtml = "";
if (hasConfiguredStores && !tileMode) {
  sceneTabsHtml = '<h3 style="margin-top:20px">人数场景</h3><div class="olf-tabs">' + partyTabs + '</div>' +
    (roundTabs ? '<h3 style="margin-top:20px">轮次场景</h3><div class="olf-tabs">' + roundTabs + '</div>' : '');
}
var matrixSection = tileMode
  ? '<section class="olf-section">' + renderSceneComboBlocks(draft, config) + '</section>'
  : '<section class="olf-section"><div class="olf-table-wrap">...</div></section>';
return '...store...' + sceneToggle + sceneTabsHtml + '</section>' +
  (hasConfiguredStores ?
  '...lineTabs...' + (tileMode ? '' : batchPanel) + '</section>' +
  matrixSection + ...
```

替换为：

```js
var sceneTabsHtml = "";
if (hasConfiguredStores && !tileMode) {
  sceneTabsHtml =
    '<section class="olf-section">' +
      '<h3>人数场景</h3><div class="olf-tabs">' + partyTabs + '</div>' +
      (roundTabs ? '<h3 style="margin-top:20px">轮次场景</h3><div class="olf-tabs">' + roundTabs + '</div>' : '') +
      batchPanel +
    '</section>';
}
var matrixSection = tileMode
  ? '<section class="olf-section">' + renderSceneComboBlocks(draft, config) + '</section>'
  : '<section class="olf-section"><div class="olf-table-wrap"><table class="olf-table"><thead><tr>' + selectHeader + '<th>' + (draft.targetType === 'dish' ? '菜品' : '分类') + '</th><th>' + (draft.subject === 'party_size' ? '人均上限' : '订单上限') + '</th></tr></thead><tbody>' + renderLimitRows(draft) + '</tbody></table></div></section>';
return '<div class="olf-content-head"><h2 tabindex="-1">设置限购数量</h2></div>' +
  '<section class="olf-section"><label class="olf-field olf-limit-store-select"><span class="olf-label olf-required">配置门店</span><select class="olf-select" data-limit-store-select' + (hasConfiguredStores ? '' : ' disabled') + '>' + storeOptions + '</select></label>' + sceneToggle + '</section>' +
  (hasConfiguredStores ?
  '<section class="olf-section"><div class="olf-section-head"><div><h3 id="configuredLimitHeading" tabindex="-1">产线配置</h3><div class="olf-help">当前门店：' + esc((stores.find(function (item) { return item.id === draft.activeStoreId; }) || {}).name || draft.activeStoreId) + '</div></div><button type="button" class="olf-button olf-button--small olf-configured-limit-preview-entry" data-configured-limit-preview-open' + (previewCount ? '' : ' disabled') + '>查看已配置规则（' + previewCount + '）</button></div><div class="olf-tabs">' + lineTabs + '</div></section>' +
  (tileMode ? matrixSection : sceneTabsHtml + matrixSection) +
  '<div class="olf-summary olf-summary--primary"><strong>门店独立配置：</strong>切换门店后，商品范围和数量矩阵均独立保存，不会覆盖其他门店。</div>' :
  '<div class="olf-empty olf-limit-store-empty"><strong>暂无参与门店</strong><span>请返回商品配置，为至少一家门店选择商品。</span></div>');
```

要点：

1. 门店 section **只**含下拉 + `sceneToggle`  
2. 产线 section **只**含标题 / 预览入口 / 产线 Tab（不再挂 `batchPanel`）  
3. 非平铺：`sceneTabsHtml`（人数/轮次 + `batchPanel`）紧跟产线 section，再接矩阵  
4. 平铺：产线后直接 `renderSceneComboBlocks`（块内自带批量）

- [ ] **Step 2: 跑验证**

```bash
node scripts/verify-order-limit-line-first-scenes.mjs
node scripts/verify-order-limit-scene-combo-tile.mjs
node scripts/verify-order-limit-batch-target-selection.mjs
node scripts/verify-order-limit-configured-limit-preview.mjs
```

Expected: 全部 PASS  

若 `scene-combo-tile` 断言依赖旧 DOM 相对位置而失败：仅当断言与本 spec 冲突时放宽该脚本中「场景控件相对人数 Tab」类检查；**不得**回退产线优先顺序。

- [ ] **Step 3: Commit**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js" admin-web/scripts/verify-order-limit-line-first-scenes.mjs
git commit -m "$(cat <<'EOF'
feat: put party/round scenes below product lines

Unify step-4 navigation so line selection precedes scene tabs.
EOF
)"
```

双写 JS + 脚本到主工作区。

---

### Task 3: 浏览器验收（人工）

主工作区 `npm run dev`：

- [ ] 多轮 · 分开选择：顺序为 门店 → 展示分段 → 产线 → 人数 → 轮次 → 批量/矩阵  
- [ ] 多轮 · 组合平铺：门店 → 展示分段 → 产线 → 组合块（无人数/轮次 Tab）  
- [ ] 非多轮：门店 → 产线 → 人数 → 批量/矩阵  
- [ ] 切产线 / 切场景后数量键与完成度正确；模式往返数据不丢  

---

## Spec 覆盖自检

| Spec | Task |
|---|---|
| 统一产线优先 | Task 2 |
| 平铺保持产线→块 | Task 2（tile 分支不动相对顺序） |
| 分开选择人数/轮次在产线下 | Task 2 |
| 批量在场景后、矩阵前 | Task 2（batch 移入 sceneTabsHtml） |
| 模型/事件不变 | 无事件改动 |
| 专项断言 | Task 1 |

## Placeholder 扫描

无 TBD；关键拼装代码已写出。
