# Buffet Quantity Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the buffet rule quantity step as a scenario-first workbench that remains understandable with more than 50 products, puts shared dish-set quotas in one place, and makes bulk and cross-store operations explicit and safe.

**Architecture:** Keep the existing buffet V4 draft and validation model, but split quantity rendering into focused helpers for context, scenario selection, shared quota controls, filters, and target rows. Extend editor-only UI state for paging and explicit selection scope; implement cross-store copying as a pure preview/apply pair keyed by stable store, line, category, and dish IDs.

**Tech Stack:** Existing plain JavaScript/CSS editor in `dist/Configuration center`, Node.js assertion scripts, local Vite preview, in-app browser automation.

**Spec:** `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

## Global Constraints

- Product scope and all quantities remain independently stored per store.
- Empty limit means unconfigured; `0` means prohibit ordering; a positive integer is the maximum quantity.
- Dish-set members may be combined across product lines, but the shared quota is configured once per active store/period/party/round scenario.
- Current-page selection and all-filtered-results selection are separate explicit states.
- Switching store, party range, or round range saves current inputs and clears target selection.
- Cross-store copying matches targets by stable IDs only; it never maps by display name or silently creates missing products.
- Copying fills empty destination cells by default. Overwriting configured values requires a separate choice, an impact preview, and confirmation.
- Do not modify menu-order-limit routes, storage keys, drafts, or runtime behavior.
- Do not modify `vendor/emenu-new`; the eMenu embed build is not required for this feature.

---

### Task 1: Workbench state and stable target identities

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-quantity-workbench-state.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `editorState`, `v4MenuIdentity(dish)`, `v4TargetCellKey(...)`, `quantityScenarioIndexes(...)`, and `storeConfigFor(...)`.
- Produces: `normalizeBuffetQuantityWorkbenchState(draft)`, `clearBuffetQuantitySelection()`, `buffetWorkbenchTargetIdentity(draft, target)`, and `filteredBuffetWorkbenchTargets(draft, config, state)`.

- [ ] **Step 1: Write the failing state test**

Create `scripts/verify-buffet-quantity-workbench-state.mjs` with assertions that the flow source exports the four test helpers when `window.__BUFFET_QUANTITY_WORKBENCH_TEST__` is true. Exercise a state object containing `storeId`, `lineId`, `query`, `page`, `pageSize`, `selectionMode`, and `selectedIds`; verify switching store or scenario resets `selectionMode` to `"page"` and empties `selectedIds`.

```js
const state = api.normalizeBuffetQuantityWorkbenchState(draft);
assert.deepEqual(Object.keys(state).sort(), [
  "lineId", "page", "pageSize", "query", "selectedIds", "selectionMode", "storeId"
].sort());
state.selectedIds = ["store-1|line-1|dish-1"];
state.selectionMode = "filtered";
api.clearBuffetQuantitySelection();
assert.deepEqual(state.selectedIds, []);
assert.equal(state.selectionMode, "page");
assert.equal(api.buffetWorkbenchTargetIdentity(draft, { lineId: "line-1", id: "dish-1" }), "line-1|dish-1");
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node scripts/verify-buffet-quantity-workbench-state.mjs`

Expected: FAIL because the workbench helpers and test export do not exist.

- [ ] **Step 3: Implement normalized UI state and identity helpers**

Add `editorState.buffetQuantityWorkbench` with the exact fields in Step 1. Keep selection UI-only; never persist it to the draft. Category identity is `lineId + "|" + categoryId`, dish identity is `lineId + "|" + dishId`, and dish-set member identity is also `lineId + "|" + dishId`. Reset selection from the existing handlers for `data-buffet-quantity-store`, party tab/range changes, and round tab/range changes.

- [ ] **Step 4: Register and run the test**

Add:

```json
"verify:buffet-quantity-workbench": "node scripts/verify-buffet-quantity-workbench-state.mjs"
```

Run: `npm run verify:buffet-quantity-workbench`

Expected: PASS.

- [ ] **Step 5: Commit the state boundary**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-quantity-workbench-state.mjs package.json
git commit -m "refactor: add buffet quantity workbench state"
```

### Task 2: Scenario-first page hierarchy

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-quantity-workbench-layout.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `renderBuffetLimitContent(draft)`, `renderBuffetQuantityRanges(draft)`, `subjectLabel(...)`, `targetShortLabel(...)`, and `buffetPeriodSummaryLabel(...)`.
- Produces: `renderBuffetRuleContext(draft)`, `renderBuffetScenarioWorkspace(draft)`, `renderBuffetQuantityWorkbench(draft, configuredStores)`, and the required order in `renderBuffetQuantityStep(draft)`.

- [ ] **Step 1: Write the failing hierarchy test**

Parse the HTML returned for a V4 party-size/multi-round draft and assert these headings occur strictly in order:

```js
const headings = ["当前规则", "限制内容", "适用场景", "当前配置场景", "门店与商品数量"];
let cursor = -1;
for (const heading of headings) {
  const next = html.indexOf(heading);
  assert.ok(next > cursor, `${heading} must follow the previous workbench section`);
  cursor = next;
}
assert.doesNotMatch(html, /<h3>参与门店和商品<\/h3>[\s\S]*<h3>限制内容<\/h3>/);
```

- [ ] **Step 2: Run the hierarchy test and confirm RED**

Run: `node scripts/verify-buffet-quantity-workbench-layout.mjs`

Expected: FAIL because the current page renders product scope before limit content and ranges.

- [ ] **Step 3: Implement the page shell**

Change `renderBuffetQuantityStep` to return, in order: a read-only rule context with “修改规则类型”, limit-content cards, compact applicable-range summaries with “管理区间”, the active party/round selectors and copy-neighbor actions, then the store/product workbench. Range tables start collapsed and expand in place; existing range IDs and mutation handlers remain unchanged.

- [ ] **Step 4: Add responsive workbench CSS**

Use one-column sections below 900px. Keep the rule context and active scenario sticky only within the quantity content container, not at viewport level. Add focused classes rather than inline styles: `.olf-quantity-context`, `.olf-scenario-summary`, `.olf-active-scenario`, `.olf-quantity-workbench`.

- [ ] **Step 5: Run layout and existing migration tests**

Run:

```bash
node scripts/verify-buffet-quantity-workbench-layout.mjs
npm run verify:buffet-period-selection
npm run verify:buffet-limit-content-quantity-step
```

Expected: all PASS.

- [ ] **Step 6: Commit the workbench hierarchy**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quantity-workbench-layout.mjs package.json
git commit -m "feat: organize buffet quantities by active scenario"
```

### Task 3: Target-specific quota presentation

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-quantity-target-presenters.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing V4 maps `targetLimits`, `tableTargetCaps`, `defaultDishLimits`, `exceptionDishLimits`, plus `renderV4LimitInput(...)`.
- Produces: `renderBuffetSharedQuotaPanel(draft, config, period, scenario)`, `renderBuffetDishRows(...)`, `renderBuffetCategoryRows(...)`, and `renderBuffetDishSetMemberRows(...)`.

- [ ] **Step 1: Write failing presenter tests for all three targets**

Assert dish HTML contains one editable limit per dish row; category HTML contains one editable shared limit per category row and member rows without inputs; dish-set HTML contains one shared quota input above the table, one default protection input, member rows with “使用默认值 X”, and no repeated shared quota input in member rows.

```js
assert.equal(count(dishSetHtml, "data-v4-map=\"targetLimits\""), 1);
assert.match(dishSetHtml, /使用默认值 2 份/);
assert.doesNotMatch(dishSetMemberRow, /data-v4-map=\"targetLimits\"/);
assert.match(categoryRow, /包含 12 个菜品/);
```

- [ ] **Step 2: Run the presenter test and confirm RED**

Run: `node scripts/verify-buffet-quantity-target-presenters.mjs`

Expected: FAIL because the existing V4 scenario card does not expose target-specific workbench presenters.

- [ ] **Step 3: Implement the shared quota panel**

For every active period/scenario, render total min/max, dish-set shared total/kind cap, default same-dish/per-kind protection, and optional table caps once above the object table. Reuse the existing period-value maps and scenario keys; do not add persisted fields.

- [ ] **Step 4: Implement dish, category, and dish-set rows**

Dish rows edit their own `targetLimits` cell. Category rows edit one category cell and expose a disclosure-only member list. Dish-set rows display member metadata and resolve their effective protection from `exceptionDishLimits[scenarioKey]` before `defaultDishLimits[scenarioKey]`; “恢复默认” removes only the exception entry.

- [ ] **Step 5: Run presenter, policy, and validation tests**

Run:

```bash
node scripts/verify-buffet-quantity-target-presenters.mjs
npm run verify:buffet-period-selection
node scripts/verify-buffet-v4-validation.mjs
```

Expected: all PASS, including empty/0/positive semantics.

- [ ] **Step 6: Commit target-specific rendering**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quantity-target-presenters.mjs package.json
git commit -m "feat: clarify buffet quota input ownership"
```

### Task 4: Search, pagination, and explicit bulk selection scope

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-quantity-bulk-selection.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `filteredBuffetWorkbenchTargets(...)`, `buffetWorkbenchTargetIdentity(...)`, and `editorState.buffetQuantityWorkbench`.
- Produces: `currentBuffetWorkbenchPage(...)`, `selectBuffetWorkbenchPage(...)`, `selectAllFilteredBuffetTargets(...)`, and `applyBuffetBulkValue(draft, operation)`.

- [ ] **Step 1: Write failing selection-scope tests**

Build 55 targets with page size 20. Verify current-page selection returns 20 IDs, explicit filtered selection returns all 55 IDs, page changes retain the visible count label, and store/scenario changes clear the selection. Verify a bulk value updates exactly the selected stable IDs and no hidden unselected target.

- [ ] **Step 2: Run the bulk-selection test and confirm RED**

Run: `node scripts/verify-buffet-quantity-bulk-selection.mjs`

Expected: FAIL because page-vs-filtered selection is not implemented.

- [ ] **Step 3: Implement filters and paging**

Render one row containing current store, product line, product/category search, and reset. Search matches only product or category display names. Add 20/50/100 page-size choices and preserve configured values across filtering and paging.

- [ ] **Step 4: Implement explicit selection escalation and bulk actions**

The header checkbox selects only the current page. When every current-page row is selected and additional filtered rows exist, render “选择全部筛选结果，共 X 项”. Bulk actions show the exact selected count and support apply value, clear exception, and remove target/member according to target type. After a successful action, return selection to empty/page mode.

- [ ] **Step 5: Run bulk and existing selected-product tests**

Run:

```bash
node scripts/verify-buffet-quantity-bulk-selection.mjs
npm run verify:buffet-quantity-workbench
npm run verify:buffet-period-selection
```

Expected: all PASS.

- [ ] **Step 6: Commit large-product operations**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quantity-bulk-selection.mjs package.json
git commit -m "feat: add scoped buffet quantity bulk actions"
```

### Task 5: Safe cross-store copy preview and end-to-end verification

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-cross-store-copy-preview.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the existing `copyBuffetV4StorePeriodValues(...)` data maps and stable identities from Task 1.
- Produces: `previewBuffetStoreCopy(draft, sourceStoreId, destinationStoreIds, options)` and `applyBuffetStoreCopyPreview(draft, preview)` where `options.overwriteConfigured` is boolean.

- [ ] **Step 1: Write failing pure copy-preview tests**

Create source and two destination stores containing: matching stable IDs with empty cells, matching IDs with configured cells, same-name/different-ID dishes, and missing IDs. Assert preview counts `fill`, `overwrite`, and `missing` separately for shared quota cells, target cells, and exception cells. Assert default mode preserves configured destinations; overwrite mode lists them but performs no mutation until apply.

```js
const preview = api.previewBuffetStoreCopy(draft, "store-a", ["store-b"], { overwriteConfigured: false });
assert.deepEqual(preview.summary, { fill: 3, overwrite: 0, preserved: 2, missing: 1 });
assert.equal(destinationBefore, JSON.stringify(draft.storeConfigs["store-b"]));
api.applyBuffetStoreCopyPreview(draft, preview);
assert.equal(readCell("store-b", "line-1|dish-1").value, 4);
assert.equal(readCell("store-b", "line-9|dish-1").configured, false);
```

- [ ] **Step 2: Run the copy-preview test and confirm RED**

Run: `node scripts/verify-buffet-cross-store-copy-preview.mjs`

Expected: FAIL because the current copy action immediately replaces destination period maps and has no multi-store preview.

- [ ] **Step 3: Implement pure preview and apply functions**

Compare source and destination cells by stable object identity and scenario identity. Preview must not mutate the draft. Store immutable operation records containing destination store ID, period, map name, cell key, previous cell, next cell, and status (`fill`, `overwrite`, `preserved`, or `missing`). Apply only `fill`, plus `overwrite` when explicitly authorized.

- [ ] **Step 4: Implement the multi-store confirmation dialog**

Allow selecting multiple target stores. Default “覆盖已有配置” to unchecked. The dialog lists each store and counts for filled, overwritten, preserved, and missing objects; missing rows state that they will be skipped. Require a second confirmation only when overwrite is checked and `overwrite > 0`; cancellation must leave every store byte-for-byte unchanged.

- [ ] **Step 5: Run the full automated regression set**

Run:

```bash
node scripts/verify-buffet-cross-store-copy-preview.mjs
npm run verify:buffet-quantity-workbench
npm run verify:buffet-period-selection
npm run verify:buffet-rule-type-order
npm run verify:buffet-limit-content-quantity-step
git diff --check
```

Expected: all PASS and no whitespace errors.

- [ ] **Step 6: Verify the complete flow in the local browser**

Create a fresh buffet draft and verify: rule summary order; collapsed/expanded range management; scenario switch clears selection; dish rows edit independent limits; category rows own shared category limits; dish-set shared/default limits appear once; exceptions can be added and restored; current-page selection does not select later pages; explicit all-filtered selection does; cross-store default copy preserves configured values; overwrite preview and cancellation work; browser console has no errors.

- [ ] **Step 7: Commit the safe copy flow**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-cross-store-copy-preview.mjs package.json
git commit -m "feat: preview buffet quantity copies across stores"
```

## Self-Review

- Spec coverage: Tasks 2–5 cover section 5 ordering, limit content, ranges, current scenario, target-specific rendering, large-product operations, cross-store copying, and acceptance criteria 22–24.
- Placeholder scan: every implementation and verification step names concrete functions, files, commands, and expected outcomes.
- Type consistency: all tasks use the same stable identity format and the same `editorState.buffetQuantityWorkbench` fields; cross-store preview consumes those identities without display-name matching.
- Scope: this plan changes only the buffet quantity editor and its tests; menu order limits and eMenu sources remain outside scope.
