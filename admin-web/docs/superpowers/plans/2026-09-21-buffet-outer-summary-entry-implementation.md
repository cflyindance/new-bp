# 自助餐外层全部配置入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 仅在“设置限购数量”的最外层“门店与商品数量”区块保留“查看全部配置”，单场景配置额度页不展示该入口。

**Architecture:** 继续以 `buffetAllSceneSummaryRows()` 作为唯一数据投影，不新增汇总存储。汇总弹窗挂载在编辑器第 2 步公共层，仅由外层按钮打开；关闭时恢复外层按钮焦点，“进入配置”继续通过稳定场景标识创建场景会话。

**Tech Stack:** 原生 JavaScript、HTML `<dialog>`、现有 Order Limit Flow CSS、Node.js 静态验证脚本、Codex 本地浏览器验收。

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-all-scene-product-summary-design.md`

## Global Constraints

- 外层按钮位于“门店与商品数量”标题右侧，`查看全部配置` 为次级按钮，`+ 添加商品` 为主按钮。
- 单场景“配置额度”页不得展示“查看全部配置”。
- 没有商品时按钮仍可用，空状态固定为“暂无商品配置，请先添加商品”。
- 关闭、取消或 Escape 恢复到本次入口；“进入配置”不恢复入口焦点，而是进入准确场景。
- 不修改现有商品添加、删除、额度保存作用域。
- 不提交既有无关修改 `src/emenu-local/seasoning/generated/seasoning-browser-handler.ts`。

---

### Task 1: 提升汇总弹窗并增加外层入口

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4728-4740`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:5115-5125`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:5610-5680`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:5710-5720`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:6560-6580`
- Test: `scripts/verify-buffet-all-scene-summary-outer-entry.mjs`

**Interfaces:**
- Consumes: `renderBuffetAllSceneSummaryDialog(draft) -> string`, `defaultBuffetSummaryState() -> SummaryState`, `resolveBuffetSummaryScene(draft, row) -> {valid, storeId, combo}`.
- Produces: one outer button `[data-buffet-summary-open][data-buffet-summary-origin="outer"]`; no inner summary button; one globally rendered `#buffetAllSceneSummaryDialog` on modern buffet step 2.

- [ ] **Step 1: Write the failing outer-entry verification**

Create `scripts/verify-buffet-all-scene-summary-outer-entry.mjs`:

```js
import fs from 'node:fs';
import assert from 'node:assert/strict';

const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js', 'utf8');

assert.match(flow, /门店与商品数量[\s\S]*data-buffet-summary-open[\s\S]*data-buffet-summary-origin="outer"[\s\S]*查看全部配置[\s\S]*data-product-add-open/);
assert.ok(!flow.includes('data-buffet-summary-origin", "scene"'), '单场景配置额度不应展示汇总入口');
assert.match(flow, /renderBuffetQuantityWorkbench\(draft\)\s*\+\s*renderBuffetAllSceneSummaryDialog\(draft\)/, '汇总弹窗应在第 2 步公共层渲染');
assert.ok(!/renderQuantitySceneDialog\(draft, config\)[\s\S]{0,900}renderBuffetAllSceneSummaryDialog\(draft\)/.test(flow), '汇总弹窗不得依赖单场景弹窗渲染');
assert.ok(flow.includes('data-buffet-summary-origin="outer"'), '关闭后应恢复唯一外层入口焦点');

console.log('verify-buffet-all-scene-summary-outer-entry: PASS');
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
node scripts/verify-buffet-all-scene-summary-outer-entry.mjs
```

Expected: FAIL because the outer button and public dialog mount do not exist.

- [ ] **Step 3: Render the outer action group**

Change `renderBuffetQuantityWorkbench(draft)` so its header action area is:

```js
'<div class="olf-section-actions">' +
  '<button type="button" class="olf-button" data-buffet-summary-open data-buffet-summary-origin="outer">查看全部配置</button>' +
  '<button type="button" class="olf-button olf-button--primary" data-product-add-open>' + icon("plus", 15) + ' 添加商品</button>' +
'</div>'
```

Do not conditionally hide or disable the summary button when `productCount === 0`.

- [ ] **Step 4: Mount exactly one shared summary dialog**

Remove `+renderBuffetAllSceneSummaryDialog(draft)` from the return value of `renderQuantitySceneDialog()`.

In `renderBuffetQuantityStep(draft)`, append the shared dialog after the quantity workbench:

```js
return '<div class="olf-content-head"><h2 tabindex="-1">设置限购数量</h2></div>' +
  renderBuffetScenarioWorkspace(draft) +
  renderBuffetQuantityWorkbench(draft) +
  renderBuffetAllSceneSummaryDialog(draft);
```

`renderBuffetQuantityWorkbench()` already reaches `renderQuantitySceneDialog(draft, config)` through `renderStepFour()` / `renderBuffetV4QuantityEditor()`; do not call the scene renderer again. Do not create a second summary dialog or a second row projection.

- [ ] **Step 5: Remove the inner entry and restore focus to the outer entry**

Delete the dynamic `summaryButton` construction from `renderEditor()` and retain only the scene add button:

```js
var addButton = document.createElement("button");
addButton.type = "button";
addButton.className = "olf-button olf-button--primary";
addButton.setAttribute("data-scene-product-add", "");
addButton.textContent = "＋ 添加" + (draft.targetType === "category" ? "分类" : "商品");
if (productHeading) productHeading.appendChild(addButton);
```

Keep only the existing scene “添加商品” button. On outer open:

```js
editorState.buffetSummary = defaultBuffetSummaryState();
```

On close/cancel/Escape, clear state, re-render, then focus the only outer opener:

```js
editorState.buffetSummary = null;
renderEditor();
var opener = document.querySelector('[data-buffet-summary-open][data-buffet-summary-origin="outer"]');
if (opener) opener.focus();
```

Keep “进入配置” on the existing `resolveBuffetSummaryScene()` path without refocusing the outer opener.

- [ ] **Step 6: Run focused tests**

Run:

```bash
node scripts/verify-buffet-all-scene-summary-outer-entry.mjs
node scripts/verify-buffet-all-scene-summary-model.mjs
node scripts/verify-buffet-all-scene-summary-ui.mjs
node scripts/verify-buffet-all-scene-summary-navigation.mjs
node --check "dist/Configuration center/assets/order-limit-flow.js"
```

Expected: all PASS and syntax check exits 0.

- [ ] **Step 7: Commit the outer entry**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-all-scene-summary-outer-entry.mjs
git commit -m "feat: expose buffet summary from quantity overview"
```

---

### Task 2: Empty state, layout polish, and end-to-end regression

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4728-4736`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:1019-1037`
- Modify: `scripts/verify-buffet-all-scene-summary-outer-entry.mjs`
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

**Interfaces:**
- Consumes: `buffetSummaryPageData(draft, state)` with `allRows`, `filtered`, and `pageRows`.
- Produces: canonical empty text `暂无商品配置，请先添加商品`; responsive `.olf-section-actions`; authority-document QA rows for outer-only entry behavior.

- [ ] **Step 1: Extend the failing test for empty-state and action layout**

Append:

```js
const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');
assert.ok(flow.includes('暂无商品配置，请先添加商品'), '无商品时应展示规范空状态');
assert.ok(flow.includes('data.allRows.length'), '空商品与筛选无结果必须使用数据全集区分');
assert.match(css, /\.olf-section-actions\s*\{/);
```

Run `node scripts/verify-buffet-all-scene-summary-outer-entry.mjs` and expect FAIL before implementation.

- [ ] **Step 2: Distinguish empty dataset from filtered-empty**

In `renderBuffetAllSceneSummaryDialog(draft)`, compute:

```js
var emptyText = data.allRows.length
  ? "没有符合筛选条件的商品配置"
  : "暂无商品配置，请先添加商品";
```

Use `emptyText` in the table empty row. Keep reset available for filtered-empty; the no-product state must not mutate the draft.

- [ ] **Step 3: Style the paired header actions**

Add to `order-limit-flow.css`:

```css
.olf-section-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
@media (max-width: 720px) {
  .olf-section-head { align-items:flex-start; }
  .olf-section-actions { width:100%; justify-content:flex-start; }
}
```

Preserve the secondary/primary hierarchy shown in approved visual option A.

- [ ] **Step 4: Synchronize the authority document**

Add to `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md` section 15:

```markdown
- “查看全部配置”仅存在于最外层“门店与商品数量”；单场景“商品限购数量”不展示该入口。
- 无商品时入口仍可点击并显示“暂无商品配置，请先添加商品”。
```

Add acceptance rows verifying outer placement, inner entry absence, empty state, dismiss focus restoration, and exact-scene navigation.

- [ ] **Step 5: Run regression suite**

Run:

```bash
node scripts/verify-buffet-all-scene-summary-outer-entry.mjs
node scripts/verify-buffet-all-scene-summary-model.mjs
node scripts/verify-buffet-all-scene-summary-ui.mjs
node scripts/verify-buffet-all-scene-summary-navigation.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-quantity-workbench-state.mjs
node scripts/verify-buffet-quantity-workbench-layout.mjs
git diff --check
```

Expected: all named tests PASS; `git diff --check` has no whitespace errors.

- [ ] **Step 6: Browser acceptance**

Using the local browser on the feature branch:

1. Open step 2 without opening a scene; verify “查看全部配置” is beside “+ 添加商品”.
2. Open the summary and verify all scenes are listed.
3. Close with the × button and verify focus returns to the outer button.
4. Remove all products in a disposable draft; verify the button remains and the canonical empty message appears.
5. Open a scene and verify “商品限购数量” only shows the add action, without “查看全部配置”.
6. Return to the outer summary, click a row from a non-current scene, and verify the target scene opens.

- [ ] **Step 7: Commit the polish and authority update**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-all-scene-summary-outer-entry.mjs docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md
git commit -m "test: verify buffet summary entry parity"
```

---

## Self-Review

- Spec coverage: outer placement, shared dialog/model, empty state, focus restoration, exact navigation, responsive action layout, authority-document synchronization, automated and browser verification are each assigned to a task.
- Placeholder scan: no TBD/TODO or unspecified implementation step remains.
- Type consistency: the only opener uses `data-buffet-summary-origin="outer"`, and the existing `buffetSummary` data model remains unchanged.
