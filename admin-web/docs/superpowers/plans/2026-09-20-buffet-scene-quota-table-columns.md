# Buffet Scene Quota Table Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the buffet scene quota table into independent product, production line, category, and store columns while removing product codes and view-added production-line suffixes.

**Architecture:** Keep the existing cross-store row projection and mutation routing unchanged. Change only the scene table renderer so product/dish-set rows use eight columns, category rows use seven non-duplicated columns, and tests assert the generated markup and preserved row ownership attributes.

**Tech Stack:** Vanilla JavaScript string rendering, CSS, Node.js assertion scripts, local browser acceptance.

**Spec:** `docs/superpowers/specs/2026-09-20-buffet-scene-quota-table-columns-design.md`

## Global Constraints

- Product/dish-set columns are: selection, product, production line, category, store, quota, status, operation.
- Category-target columns are: selection, category, production line, store, quota, status, operation.
- Product names come directly from the row name source; do not trim legitimate source text.
- The scene quota table must not render product codes.
- Missing line/category values render `—`; missing store name falls back to store id, then `—`.
- Filtering, pagination, selection, bulk operations, removal, and per-store mutation routing must remain unchanged.

---

### Task 1: Lock the independent-column contract with a failing verification

**Files:**
- Modify: `scripts/verify-buffet-cross-store-scene-ui.mjs`
- Test: `scripts/verify-buffet-cross-store-scene-ui.mjs`

**Interfaces:**
- Consumes: source text from `dist/Configuration center/assets/order-limit-flow.js` and its CSS.
- Produces: static assertions for the new headings, separate field cells, dynamic category columns, correct colspan, and absence of the old combined/code markup.

- [ ] **Step 1: Replace the old combined-column assertions with failing independent-column assertions**

```js
assert.match(flow, /<th>产线<\/th>/);
assert.match(flow, /<th>分类<\/th>/);
assert.match(flow, /<th>门店<\/th>/);
assert.match(flow, /row\.lineLabel \|\| "—"/);
assert.match(flow, /row\.categoryName \|\| "—"/);
assert.match(flow, /row\.storeName \|\| row\.storeId \|\| "—"/);
assert.match(flow, /draft\.targetType === "category" \? 7 : 8/);
assert.doesNotMatch(flow, /<th>产线 · 分类 · 编码<\/th>/);
assert.doesNotMatch(flow, /<span>' \+ esc\(row\.code\)/);
```

- [ ] **Step 2: Run the verification and confirm it fails on the old markup**

Run: `node scripts/verify-buffet-cross-store-scene-ui.mjs`

Expected: FAIL because the renderer still contains “产线 · 分类 · 编码” and renders `row.code`.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add scripts/verify-buffet-cross-store-scene-ui.mjs
git commit -m "test: define buffet quota table columns"
```

### Task 2: Render independent fields and preserve behavior

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4423-4446`
- Modify: `dist/Configuration center/assets/order-limit-flow.css` (only if column widths need explicit tuning)
- Test: `scripts/verify-buffet-cross-store-scene-ui.mjs`
- Test: `scripts/verify-buffet-cross-store-scene-mutations.mjs`
- Test: `scripts/verify-buffet-cross-store-scene-rows.mjs`

**Interfaces:**
- Consumes: `renderCrossStoreSceneRow(draft, combo, row)` rows with `row.lineLabel`, `row.categoryName`, `row.storeName`, `row.storeId`, and ownership attributes.
- Produces: product/dish-set eight-cell rows and category seven-cell rows without identifiers in visible markup.

- [ ] **Step 1: Add explicit display-value fallbacks in the row renderer**

```js
var itemName = target.shortName || target.name || target.dishId || target.categoryId || "—";
var lineName = row.lineLabel || "—";
var categoryName = row.categoryName || "—";
var storeName = row.storeName || row.storeId || "—";
```

- [ ] **Step 2: Render product and category rows with different non-duplicated structures**

```js
var identityCells = draft.targetType === "category"
  ? '<td class="olf-v4-product-cell"><strong>' + esc(itemName) + '</strong></td>' +
    '<td>' + esc(lineName) + '</td><td class="olf-cross-store-name">' + esc(storeName) + '</td>'
  : '<td class="olf-v4-product-cell"><strong>' + esc(itemName) + '</strong></td>' +
    '<td>' + esc(lineName) + '</td><td>' + esc(categoryName) + '</td>' +
    '<td class="olf-cross-store-name">' + esc(storeName) + '</td>';
```

Keep checkbox, quota, status, operation, `data-limit-store-id`, and `data-buffet-row-key` markup unchanged.

- [ ] **Step 3: Render dynamic headings and empty-state colspan**

```js
var identityHeadings = draft.targetType === "category"
  ? '<th>分类</th><th>产线</th><th>门店</th>'
  : '<th>商品</th><th>产线</th><th>分类</th><th>门店</th>';
var columnCount = draft.targetType === "category" ? 7 : 8;
```

Use `columnCount` in the empty row and `identityHeadings` after the selection heading.

- [ ] **Step 4: Run focused verifications**

Run:

```bash
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-scene-unified-picker.mjs
```

Expected: all commands exit successfully and all scripts print `PASS`.

- [ ] **Step 5: Perform local browser acceptance**

Open the two-store draft, enter its quota scene, and verify:

1. The header order is 商品、产线、分类、门店、限购数量、状态、操作.
2. “可乐” is shown without “（eMenu）” and no product code is visible.
3. Production line, category, and store values occupy separate cells.
4. All-stores mode still reports 7 rows from 2 stores; filtering to 法拉盛店 still reports 3 rows.
5. Selecting a row and editing its quota retains the correct store ownership.

- [ ] **Step 6: Commit the implementation**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" \
  "dist/Configuration center/assets/order-limit-flow.css" \
  scripts/verify-buffet-cross-store-scene-ui.mjs
git commit -m "feat: split buffet quota product fields"
```

## Self-Review

- Spec coverage: independent product/line/category/store columns, category-target non-duplication, code removal, direct name rendering, fallbacks, behavior preservation, and browser acceptance are each covered.
- Placeholder scan: no deferred implementation steps or unspecified tests remain.
- Type consistency: the plan uses existing `row` fields and existing renderer/test names without introducing new external interfaces.
