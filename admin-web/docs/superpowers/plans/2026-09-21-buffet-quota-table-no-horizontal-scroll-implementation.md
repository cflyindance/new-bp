# 自助餐配置额度商品表格无横向滚动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让单场景“配置额度”商品列表在最小 `1024 × 768` 桌面视口中保留全部字段和操作且不出现横向滚动条。

**Architecture:** 不修改表格数据和 DOM 字段，通过 `.olf-scene-workbench` 作用域下的固定表格布局、列宽分配、文本换行和额度输入弹性布局覆盖通用宽表样式。跨门店表格在相同作用域内取消固定最小宽度；“全部场景商品配置”汇总表不匹配这些选择器，因此保持现状。

**Tech Stack:** CSS、现有原生 JavaScript 表格、Node.js 静态验证、本地浏览器 `1024 × 768` 验收。

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-quota-table-no-horizontal-scroll-design.md`

## Global Constraints

- 只调整 `.olf-scene-workbench` 内的商品列表。
- 保留商品、产线、分类、门店、限购数量、状态、操作及勾选列。
- 保留添加商品、全选、单选、批量设置、移除、分页和纵向滚动。
- 最小支持桌面视口为 `1024 × 768`。
- 不修改 `.olf-buffet-summary-table` 的 `min-width: 1200px` 和横向滚动规则。
- 不提交既有无关修改 `src/emenu-local/seasoning/generated/seasoning-browser-handler.ts`。

---

### Task 1: 配置额度表格自适应布局

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.css:245-254`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:1015-1018`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:1080-1098`
- Create: `scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs`
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

**Interfaces:**
- Consumes: `.olf-scene-workbench`, `.olf-v4-product-table-wrap`, `.olf-v4-product-table`, `.olf-v4-product-cell`, `.olf-v4-table-limit`, `.olf-cross-store-table`, `.olf-cross-store-name`, `.olf-cross-store-limits`.
- Produces: scoped fixed-layout table with no minimum width; wrapping text and limit controls; no change to summary table selectors.

- [ ] **Step 1: Write the failing CSS contract test**

Create `scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs`:

```js
import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');

assert.match(css, /\.olf-scene-workbench \.olf-v4-product-table\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*table-layout:\s*fixed/s);
assert.match(css, /\.olf-scene-workbench \.olf-v4-product-table-wrap\s*\{[^}]*overflow-x:\s*hidden/s);
assert.match(css, /\.olf-scene-workbench \.olf-v4-product-table td\s*\{[^}]*overflow-wrap:\s*anywhere/s);
assert.match(css, /\.olf-scene-workbench \.olf-v4-table-limit\s*\{[^}]*white-space:\s*normal[^}]*flex-wrap:\s*wrap/s);
assert.match(css, /\.olf-scene-workbench \.olf-cross-store-table\s*\{[^}]*min-width:\s*0/s);
assert.match(css, /\.olf-scene-workbench \.olf-cross-store-limits\s*\{[^}]*min-width:\s*0/s);
assert.match(css, /\.olf-buffet-summary-table\s*\{[^}]*min-width:\s*1200px/s);

console.log('verify-buffet-quota-table-no-horizontal-scroll: PASS');
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs
```

Expected: FAIL because the scene table still inherits `min-width: 920px` / `1040px` and nowrap limit controls.

- [ ] **Step 3: Add scoped no-overflow table rules**

Append after the current scene-workbench table overrides:

```css
.olf-scene-workbench .olf-v4-product-table-wrap { overflow-x:hidden; }
.olf-scene-workbench .olf-v4-product-table {
  width:100%;
  min-width:0;
  table-layout:fixed;
}
.olf-scene-workbench .olf-v4-product-table th,
.olf-scene-workbench .olf-v4-product-table td {
  min-width:0;
  overflow-wrap:anywhere;
  white-space:normal;
}
.olf-scene-workbench .olf-v4-product-table .olf-batch-select-cell { width:42px; }
.olf-scene-workbench .olf-v4-product-table .olf-v4-product-cell { width:22%; }
.olf-scene-workbench .olf-v4-product-table .olf-v4-product-action { width:72px; }
.olf-scene-workbench .olf-v4-table-limit {
  display:flex;
  min-width:0;
  white-space:normal;
  flex-wrap:wrap;
}
.olf-scene-workbench .olf-v4-table-limit .olf-limit-input {
  flex:1 1 72px;
  width:auto;
  min-width:0;
}
.olf-scene-workbench .olf-cross-store-table,
.olf-scene-workbench .olf-cross-store-name,
.olf-scene-workbench .olf-cross-store-limits { min-width:0; }
```

Do not remove or change `.olf-buffet-summary-table { min-width:1200px; }`.

- [ ] **Step 4: Run CSS and existing workbench tests**

Run:

```bash
node scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs
node scripts/verify-buffet-quantity-workbench-layout.mjs
node scripts/verify-buffet-quantity-workbench-state.mjs
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-all-scene-summary-ui.mjs
git diff --check
```

Expected: all PASS and no whitespace errors.

- [ ] **Step 5: Update the authority document**

In `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`, add a “配置额度商品表格宽度” subsection stating:

```markdown
- 单场景配置额度商品表格在 1024 × 768 及以上桌面视口禁止横向滚动。
- 所有字段和操作保留；长文本及多额度输入在单元格内换行。
- 跨门店表格遵循相同规则；全部场景汇总表不受影响。
```

Add QA cases for ordinary, dish-set multi-input, cross-store, long-text and operation clickability.

- [ ] **Step 6: Browser acceptance at normal and minimum viewport**

1. At the normal local browser size, open a scene and confirm the table wrapper has no horizontal scrollbar.
2. Override viewport to `1024 × 768`; confirm both the page and `.olf-v4-product-table-wrap` satisfy `scrollWidth <= clientWidth`.
3. Confirm 商品、产线、分类、门店、限购数量、状态、操作 remain visible.
4. Confirm “＋ 添加商品” and each visible “移除” action remain clickable.
5. Open a cross-store or multi-input scene and repeat the overflow assertion.
6. Open the all-scene summary and confirm its existing wide-table behavior is unchanged.

- [ ] **Step 7: Commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md
git commit -m "fix: remove horizontal scroll from buffet quota table"
```

---

## Self-Review

- Spec coverage: ordinary, multi-input, cross-store, long text, minimum viewport, preserved fields/actions and summary-table isolation are covered.
- Placeholder scan: no TBD/TODO or unspecified implementation step remains.
- Selector consistency: every override is scoped by `.olf-scene-workbench`; summary rules remain under `.olf-buffet-summary-*`.
