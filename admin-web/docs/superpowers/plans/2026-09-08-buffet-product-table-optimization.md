# Buffet Product Table Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the buffet quantity step's product cards with a consistent table workbench for dishes, categories, and dish-set members, including safe single and bulk removal.

**Architecture:** Keep the existing buffet V4 draft, store configuration, scenario keys, filters, paging, and quantity event handlers. Add small pure presenter and removal-planning helpers inside the existing embedded flow asset, then render object-specific table columns through the shared workbench shell. Removal first produces an impact plan and mutates the current store only after confirmation.

**Tech Stack:** Vanilla JavaScript embedded page, CSS, Node.js verification scripts, npm scripts, Vite build.

**Spec:** `docs/superpowers/specs/2026-09-08-buffet-product-table-optimization-design.md`

## Global Constraints

- Work only in `codex/buffet-product-table-optimization` worktree and commit each completed task.
- Do not add backend fields or change buffet quota calculation semantics.
- Do not modify the menu order limit module's behavior.
- Empty quantity means unconfigured, `0` means ordering is prohibited, and a positive integer is the maximum quantity.
- Dish identity is product-line ID plus dish ID; category identity is product-line ID plus category ID.
- Any modification under `vendor/emenu-new` would require `npm run build:emenu-new-embed -- --skip-install`; this plan does not modify that directory.
- Never stage the unrelated generated `src/emenu-local/seasoning/generated/seasoning-browser-handler.ts` status unless it has an intentional content diff caused by this feature.

---

### Task 1: Shared Product Table Skeleton

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-product-table-shell.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `normalizeBuffetQuantityWorkbenchState(draft)`, `buffetWorkbenchPageData(draft, config)`, `buffetWorkbenchTargetIdentity(draft, target)`.
- Produces: `buffetProductTableColumns(draft): Array<{ key: string, label: string, className?: string }>` and `renderBuffetProductTable(draft, config, combo, values): string`.

- [ ] **Step 1: Write the failing structural verification**

Create `scripts/verify-buffet-product-table-shell.mjs`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";

const flow = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.js", "utf8");
const css = fs.readFileSync("dist/Configuration center/assets/order-limit-flow.css", "utf8");

assert.match(flow, /function buffetProductTableColumns\(draft\)/);
assert.match(flow, /function renderBuffetProductTable\(draft, config, combo, values\)/);
assert.match(flow, /class="olf-v4-product-table"/);
assert.match(flow, /data-buffet-product-remove/);
assert.match(css, /\.olf-v4-product-table/);
assert.match(css, /\.olf-v4-product-cell/);
console.log("verify-buffet-product-table-shell: PASS");
```

Add to `package.json` scripts:

```json
"verify:buffet-product-table-shell": "node scripts/verify-buffet-product-table-shell.mjs"
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run verify:buffet-product-table-shell`

Expected: FAIL because `buffetProductTableColumns` and the table classes do not exist.

- [ ] **Step 3: Implement the shared table shell**

In `order-limit-flow.js`, create `buffetProductTableColumns(draft)` with these exact column orders:

```js
function buffetProductTableColumns(draft) {
  var columns = [
    { key: "select", label: "", className: "olf-batch-select-cell" },
    { key: "object", label: draft.targetType === "category" ? "分类" : "商品" },
    { key: "category", label: draft.targetType === "category" ? "包含商品" : "所属分类" },
    { key: "line", label: "产线" }
  ];
  if (draft.targetType === "dish_set") columns.push({ key: "sameDish", label: "相同菜品上限" }, { key: "status", label: "状态" });
  else columns.push({ key: "limit", label: buffetTargetLimitLabel(draft) });
  if (draft.subject === "party_size" && draft.targetType !== "dish_set") columns.push({ key: "tableCap", label: "整桌兜底" });
  columns.push({ key: "action", label: "操作" });
  return columns;
}
```

Add `renderBuffetProductTable` to render one `<table class="olf-table olf-v4-product-table">`, a generated `<thead>`, object-specific row HTML, and the existing pager below it. Change `renderBuffetTargetQuantityPanel` to call the shared table instead of emitting `.olf-v4-target-row` cards.

- [ ] **Step 4: Add table CSS and run verification**

Add CSS for fixed checkbox/action widths, aligned quantity inputs, two-line object cells, horizontal overflow below 1100px, and a separate table footer. Do not remove existing generic `.olf-table` styles.

Run: `npm run verify:buffet-product-table-shell`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-product-table-shell.mjs package.json
git commit -m "feat: render buffet quantities in a product table"
```

### Task 2: Object-Specific Rows and Accurate Labels

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-product-table-objects.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `v4TargetKey(draft, combo, target)`, `v4ExceptionRows(values, scenario)`, `renderV4LimitInput(cell, attrs, label)`.
- Produces: `buffetTargetLimitLabel(draft, combo): string`, `renderBuffetDishTableRows(...)`, `renderBuffetCategoryTableRows(...)`, and `renderBuffetDishSetTableRows(...)`.

- [ ] **Step 1: Write the failing object presenter verification**

Create a script that asserts the three row functions exist and the flow contains the exact labels `所属分类`, `包含商品`, `分类共享上限`, `菜品集共享额度`, `使用默认值`, and `已设例外`. Also assert the dish-set member table does not call `renderV4LimitInput(values.targetLimits` inside member rows.

- [ ] **Step 2: Run the test and verify failure**

Run: `node scripts/verify-buffet-product-table-objects.mjs`

Expected: FAIL because the three table row presenters are absent.

- [ ] **Step 3: Implement dish and category rows**

For dishes, render name, stable product code, category name, product-line label, target limit input, optional table cap, and remove button. For categories, render category name, `查看 N 个商品`, combined product-line label, category shared limit, optional table cap, and remove button. Preserve `data-v4-limit-field`, `data-v4-map`, `data-v4-period`, and `data-v4-scenario` attributes so existing input handlers continue to work.

- [ ] **Step 4: Implement dish-set shared quota and member rows**

Keep `renderBuffetSharedQuotaPanel` above the table. In member rows, display the current scenario's `defaultDishLimits[scenario]` when no exception exists; render an editable exception input only when an exception exists. Add an action to create or clear an exception without changing shared `targetLimits`, `tableTargetCaps`, or `defaultDishLimits`.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm run verify:buffet-product-table-objects
npm run verify:buffet-quantity-target-presenters
npm run verify:buffet-limit-content-quantity-step
```

Expected: all PASS.

Commit:

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-product-table-objects.mjs package.json
git commit -m "feat: clarify buffet table quota ownership"
```

### Task 3: Selection, Filters, Paging, and Bulk Quantity

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-product-table-selection.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `clearBuffetQuantitySelection()`, `filteredBuffetWorkbenchTargets(...)`, `selectBuffetWorkbenchPage(...)`, `selectAllFilteredBuffetTargets(...)`.
- Produces: `buffetSelectionSnapshot(draft, config): string[]` and consistent selection-clearing behavior for filter and context changes.

- [ ] **Step 1: Write the failing selection verification**

Assert the bulk bar renders in the order: current-page checkbox, selected count, filtered-result action, bulk remove, spacer, quantity input, apply button. Assert search, line filter, page-size, page navigation, store, party, round, and period handlers all call `clearBuffetQuantitySelection()` before rendering.

- [ ] **Step 2: Run the test and verify failure**

Run: `node scripts/verify-buffet-product-table-selection.mjs`

Expected: FAIL because filter changes currently preserve some selections and there is no bulk-remove action.

- [ ] **Step 3: Implement stable filtered-result snapshots**

When the user selects all filtered results, save the current stable identity array in `selectedIds` and set `selectionMode` to `filtered`. Bulk execution must intersect `selectedIds` with identities that still exist in the current store config:

```js
function buffetSelectionSnapshot(draft, config) {
  var existing = {};
  filteredBuffetWorkbenchTargets(draft, config, normalizeBuffetQuantityWorkbenchState(draft)).forEach(function (target) {
    existing[buffetWorkbenchTargetIdentity(draft, target)] = true;
  });
  return normalizeBuffetQuantityWorkbenchState(draft).selectedIds.filter(function (id) { return existing[id]; });
}
```

- [ ] **Step 4: Clear selection at every defined boundary**

Call `clearBuffetQuantitySelection()` when query, line, page size, page, store, party, round, or period changes, and after successful bulk quantity or bulk removal. Do not clear selection on a failed validation or cancelled confirmation.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm run verify:buffet-product-table-selection
npm run verify:buffet-quantity-bulk-selection
npm run verify:buffet-quantity-workbench
```

Expected: all PASS.

Commit the flow asset, CSS, test, and package script as `feat: scope buffet table bulk actions`.

### Task 4: Removal Impact Planning and Safe Mutation

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-product-removal.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `previewBuffetProductRemoval(draft, storeId, targetIds): { storeId: string, targetType: string, targetIds: string[], removedObjects: number, removedCells: number, blockedReason: string }` and `applyBuffetProductRemoval(draft, preview): { removedObjects: number, removedCells: number }`.
- Consumes: stable target identities and all enabled-period value maps from the existing V4 model.

- [ ] **Step 1: Write a behavioral test harness**

Load `order-limit-flow.js` in the same VM/JSDOM style as existing buffet tests and export the two helpers under `window.__BUFFET_PRODUCT_REMOVAL_TEST__`. Construct two store configs with identical names but distinct stable IDs. Cover dish, category, and dish-set member removal.

- [ ] **Step 2: Define failing removal assertions**

Assert:

```js
assert.equal(dishPreview.removedObjects, 1);
assert.ok(dishPreview.removedCells >= 2);
assert.deepEqual(otherStoreAfter, otherStoreBefore);
assert.equal(setPreview.blockedReason, "菜品集至少保留 2 个成员");
assert.deepEqual(destination.periodValues.per_round.targetLimits, sharedQuotaBefore);
assert.equal(destination.periodValues.per_round.exceptionDishLimits[scenario].length, 0);
```

- [ ] **Step 3: Implement preview without mutation**

`previewBuffetProductRemoval` must clone or inspect only. For dishes, count range membership, matching `targetLimits`/`tableTargetCaps` keys, and matching exception rows. For categories, count category range membership and only category target keys. For dish-set members, count membership and matching exception rows; set `blockedReason` before returning if the remaining member count would be below two.

- [ ] **Step 4: Implement mutation from the preview**

`applyBuffetProductRemoval` must reject previews with `blockedReason`, mutate only `storeConfigFor(draft, storeId, false)`, and follow the exact cleanup matrix from spec section 7.4. Keep totals and default protection values. Return counts used by the success toast.

- [ ] **Step 5: Connect single and bulk confirmations**

Add `data-buffet-product-remove` to each row and `data-buffet-product-bulk-remove` to the bulk bar. The dialog must state current store name, object count, and affected quota cell count. Cancel performs no mutation. Success clears selection, marks the draft dirty, renders once, and shows the returned counts.

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm run verify:buffet-product-removal
npm run verify:buffet-period-selection
npm run verify:buffet-cross-store-copy-preview
```

Expected: all PASS.

Commit as `feat: safely remove buffet rule products`.

### Task 5: Full Regression and Browser Acceptance

**Files:**
- Modify only if verification exposes a defect: `dist/Configuration center/assets/order-limit-flow.js`, `dist/Configuration center/assets/order-limit-flow.css`, or the new verification scripts.

**Interfaces:**
- Consumes all helpers and UI produced by Tasks 1–4.
- Produces a verified worktree commit ready to merge.

- [ ] **Step 1: Run the complete targeted regression**

```bash
npm run verify:buffet-product-table-shell
npm run verify:buffet-product-table-objects
npm run verify:buffet-product-table-selection
npm run verify:buffet-product-removal
npm run verify:buffet-quantity-workbench
npm run verify:buffet-quantity-workbench-layout
npm run verify:buffet-quantity-target-presenters
npm run verify:buffet-quantity-bulk-selection
npm run verify:buffet-cross-store-copy-preview
npm run verify:buffet-period-selection
npm run verify:buffet-rule-type-order
npm run verify:buffet-limit-content-quantity-step
git diff --check
```

Expected: all scripts print `PASS`; `git diff --check` emits no errors.

- [ ] **Step 2: Build the project**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build exit successfully. Restore or exclude unrelated generated build-stamp/hash changes before committing; do not discard user-authored changes.

- [ ] **Step 3: Verify dishes in the in-app browser**

Create an editable buffet dish rule with at least two stores and over 20 dishes. Verify column alignment, category/product-line metadata, direct quantity entry, current-page selection, filtered-result selection, batch quantity, single removal cancellation, and confirmed removal isolation to the current store.

- [ ] **Step 4: Verify categories and dish sets in the in-app browser**

For a category rule, verify one quota per category and read-only member viewing. For a dish-set rule, verify shared quota appears once, default/exception status is correct, bulk member exceptions work, and removing down to one member is blocked.

- [ ] **Step 5: Verify state boundaries**

Select rows, then separately change query, product line, page, page size, store, party range, round range, and period. After each change assert the selected count is zero and no quantity was applied to the previous snapshot.

- [ ] **Step 6: Commit final fixes, if any**

If browser verification required changes, stage only feature files and commit as `fix: polish buffet product table workflow`. If no changes were required, do not create an empty commit.
