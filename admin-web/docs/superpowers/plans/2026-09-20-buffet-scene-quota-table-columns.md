# Buffet Scene Quota Table Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the buffet scene quota table into independent product, production line, category, and store columns while removing product codes and view-added production-line suffixes.

**Architecture:** Keep the existing cross-store row projection and mutation routing unchanged. Change only the scene table renderer so product/dish-set rows use eight columns, category rows use seven non-duplicated columns, and tests assert the generated markup and preserved row ownership attributes.

**Tech Stack:** Vanilla JavaScript string rendering, CSS, Node.js assertion scripts, local browser acceptance.

**Spec:** `docs/superpowers/specs/2026-09-20-buffet-scene-quota-table-columns-design.md`

## Global Constraints

- Product/dish-set columns are: selection, product, production line, category, store, quota, status, operation.
- Category-target columns are: selection, category, production line, store, quota, status, operation.
- Product names prefer `shortName`; legacy full names remove only a trailing `（lineName）` that exactly matches the current production line.
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
var lineName = row.lineLabel || "—";
var rawItemName = target.shortName || target.name || target.dishId || target.categoryId || "—";
var lineSuffix = lineName === "—" ? "" : "（" + lineName + "）";
var itemName = lineSuffix && rawItemName.slice(-lineSuffix.length) === lineSuffix
  ? rawItemName.slice(0, -lineSuffix.length)
  : rawItemName;
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

### Task 3: Merge cross-store filter options by visible name

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `scripts/verify-buffet-cross-store-scene-ui.mjs`

**Interfaces:**
- Consumes: current-scene rows from `buffetSceneRows(draft, combo)` and `state.storeId`.
- Produces: one line/category option per trimmed, case-sensitive display name and filters every matching store row.

- [ ] **Step 1: Add failing assertions for name-only, deduplicated filters**

```js
assert.match(flow, /function buffetSceneFilterName\(value\)/);
assert.match(flow, /stableBuffetKey\(\["line-name", lineName\]\)/);
assert.match(flow, /stableBuffetKey\(\["category-name", categoryName\]\)/);
assert.doesNotMatch(flow, /row\.storeName \+ " · "\) \+ row\.lineLabel/);
assert.doesNotMatch(flow, /row\.storeName \+ " · "\) \+ row\.categoryName/);
```

- [ ] **Step 2: Run the UI verification and confirm failure**

Run: `node scripts/verify-buffet-cross-store-scene-ui.mjs`

Expected: FAIL because the current keys are scoped by store ID and labels include store names.

- [ ] **Step 3: Implement canonical visible-name keys**

```js
function buffetSceneFilterName(value) {
  if (value == null) return "";
  var name = String(value).trim();
  return name && name !== "—" ? name : "";
}
```

Build line/category maps with `stableBuffetKey(["line-name", name])` and `stableBuffetKey(["category-name", name])`; use `name` as the option label. Apply the same key generation in `filteredBuffetSceneRows`.

When a line is selected, derive category options only from rows whose normalized line key matches the selection. Reset `state.categoryId` whenever `data-buffet-workbench-line` changes. Strip only an exact trailing `（lineName）` from category display names in both the selector and table cell.

- [ ] **Step 4: Run focused tests and browser acceptance**

Run the existing syntax check and four cross-store scripts. In the browser, verify the all-store line selector contains `Kiosk`; after selecting it, the category selector resets to `全部分类` and contains only `锅底` and `肉类`, without store prefixes, production-line suffixes, or duplicates. Selecting a merged value includes matching rows from all participating stores, while selecting a store resets line/category filters.

### Task 4: Move current-page selection into the table header

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `scripts/verify-buffet-cross-store-scene-ui.mjs`

**Interfaces:**
- Consumes: `buffetScenePageData(draft, combo).pageRows`, `normalizeBuffetQuantityWorkbenchState(draft).selectedIds`, and the existing `data-buffet-workbench-page-select` change handler.
- Produces: one header checkbox that keeps the existing current-page selection behavior and exposes `checked`, `indeterminate`, and `aria-label="全选当前页商品"` state.

- [ ] **Step 1: Add failing UI assertions**

Add assertions requiring the cross-store table header to contain `data-buffet-workbench-page-select`, requiring the toolbar to omit the `当前页全选` label, and requiring the dialog decorator to calculate the checkbox's indeterminate state for the cross-store table.

```js
assert.match(flow, /<th class="olf-batch-select-cell"><input type="checkbox" data-buffet-workbench-page-select/);
assert.doesNotMatch(flow, /data-buffet-workbench-page-select[^>]*\/> 当前页全选/);
assert.match(flow, /pageSelect\.indeterminate = visibleRowChecks\.some/);
```

- [ ] **Step 2: Run the focused verification and confirm failure**

Run: `node scripts/verify-buffet-cross-store-scene-ui.mjs`

Expected: FAIL because the current checkbox is still rendered in the toolbar and the cross-store decorator returns before attaching header state.

- [ ] **Step 3: Render the existing page-select control in the table header**

Remove the page-select label from `renderCrossStoreSceneToolbar`. In `renderCrossStoreSceneTable`, render the checkbox in the leading header cell with the current combo attributes and `checked` state derived from whether every current-page row key is present in `state.selectedIds`. Do not add a second selection handler.

```js
var pageSelected = data.pageRows.length > 0 && data.pageRows.every(function (row) {
  return state.selectedIds.indexOf(row.rowKey) >= 0;
});
var pageSelect = '<input type="checkbox" aria-label="全选当前页商品" data-buffet-workbench-page-select data-v4-period="' + combo.period + '" data-scene-party="' + combo.partyIndex + '" data-scene-round="' + combo.roundIndex + '"' + (pageSelected ? ' checked' : '') + ' />';
```

- [ ] **Step 4: Apply the half-selected state after rendering**

Allow `.olf-cross-store-table` through the existing table decorator, or add a focused cross-store branch before its early return. Resolve the checkbox from the current table header and set `indeterminate` when some, but not all, visible row checkboxes are selected. Keep the current-page selection handler unchanged.

- [ ] **Step 5: Run automated and browser acceptance**

Run:

```powershell
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-scene-unified-picker.mjs
git diff --check
```

Expected: all commands pass. In the browser, confirm the toolbar has no “当前页全选” field; the checkbox is left of “商品” or “分类”; selecting it checks only the visible page; selecting one row produces a half-selected header checkbox; clearing it clears the current page.
