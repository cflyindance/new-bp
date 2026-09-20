# Buffet Scene Cross-Store Quota Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在单个自助餐人数/轮次场景的配置额度弹层中，统一展示所有参与门店已加入的限购对象，并支持门店筛选、跨门店批量设置及严格的门店/场景隔离。

**Architecture:** 保留 `storeConfigs[storeId]` 作为唯一持久化边界，在页面层新增跨门店场景行投影；所有筛选、选择和渲染使用带 `storeId`、场景键和目标类型的稳定行身份，写操作再按行路由回所属门店。场景弹层打开时保存全部参与门店快照，取消时整体回滚；商品选择器按门店维护临时选择，确认时一次性应用所有脏门店。

**Tech Stack:** 原生 JavaScript、HTML 字符串渲染、CSS、Node.js `assert`/`vm` 验证脚本、本地浏览器验收。

**Spec:** `docs/superpowers/specs/2026-09-20-buffet-scene-cross-store-quota-design.md`

## Global Constraints

- 额度页仅汇总当前规则参与门店中、当前场景已经加入的限购对象。
- `storeConfigs[storeId]` 继续作为门店数据边界，不创建跨门店共享额度。
- 同名或同 ID 对象必须以门店、场景、对象类型和对象 ID 隔离。
- 表头全选只作用于当前筛选条件下的当前页；翻页、页大小或筛选变化必须清空选择。
- 批量设置先校验全部选中行，全部通过后一次修改前端草稿；失败时不得部分写入。
- 添加、取消勾选和移除只修改对应门店的当前场景，不影响其他场景或其他门店。
- 旧单门店草稿只读打开不迁移，编辑时保留未知字段。
- 本功能不修改 `vendor/emenu-new`；若实施中实际触及该目录，必须执行 `npm run build:emenu-new-embed -- --skip-install` 并校验嵌入产物。

---

## File Structure

- Modify: `dist/Configuration center/assets/order-limit-flow.js` — 跨门店场景投影、筛选状态、表格渲染、批量写回、商品选择器与回滚逻辑。
- Modify: `dist/Configuration center/assets/order-limit-flow.css` — 门店筛选、所属门店列、跨门店统计和窄屏布局。
- Create: `scripts/verify-buffet-cross-store-scene-rows.mjs` — 稳定身份、跨门店投影、筛选排序和分页选择单元验证。
- Create: `scripts/verify-buffet-cross-store-scene-mutations.mjs` — 单项、批量、移除和回滚的门店/场景隔离验证。
- Modify: `scripts/verify-buffet-scene-unified-picker.mjs` — 多门店选择器草稿、切店恢复、确认与取消验证。
- Create: `scripts/verify-buffet-cross-store-scene-ui.mjs` — 门店筛选、所属门店列、统计文案和事件绑定静态契约验证。

### Task 1: Stable Cross-Store Scene Row Projection

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:1371-1512`
- Create: `scripts/verify-buffet-cross-store-scene-rows.mjs`

**Interfaces:**
- Consumes: `addedStoreIds(draft)`, `storeConfigFor(draft, storeId, false)`, `sceneScopeConfig(draft, config, combo)`, `v4TargetsForConfig(draft, config)`, `eligibleExceptionDishes(draft, storeId, config)`.
- Produces: `buffetSceneIdentity(draft, combo): string`, `buffetSceneRowIdentity(draft, combo, storeId, target): string`, `buffetSceneRows(draft, combo): Array<SceneRow>`, `filteredBuffetSceneRows(draft, combo, state): Array<SceneRow>`.

- [ ] **Step 1: Write the failing row-projection test**

Create `scripts/verify-buffet-cross-store-scene-rows.mjs` that extracts the new helpers from `order-limit-flow.js` and asserts two stores with the same local dish ID produce two rows and two different keys:

```js
const rows = api.buffetSceneRows(draft, combo);
assert.deepEqual(Array.from(rows, row => row.storeId), ['store-a', 'store-b']);
assert.notEqual(rows[0].rowKey, rows[1].rowKey);
assert.match(rows[0].rowKey, /store-a/);
assert.equal(rows[0].targetType, 'dish');
```

Also assert stable ordering, a store filter returning only one store, and category/dish-set identities remaining distinct when local IDs match.

- [ ] **Step 2: Run the test and verify the missing API failure**

Run:

```powershell
node scripts/verify-buffet-cross-store-scene-rows.mjs
```

Expected: FAIL because `buffetSceneRows` and `buffetSceneRowIdentity` are not defined.

- [ ] **Step 3: Implement stable identities and the row projection**

Add focused helpers near the existing workbench state:

```js
function stableBuffetKey(parts) {
  return parts.map(function (part) { return encodeURIComponent(String(part == null ? "" : part)); }).join("|");
}

function buffetSceneIdentity(draft, combo) {
  return stableBuffetKey([
    combo && combo.period,
    partyRangeKey(draft, combo && combo.partyIndex),
    roundRangeKey(draft, combo && combo.roundIndex)
  ]);
}

function buffetSceneRowIdentity(draft, combo, storeId, target) {
  return stableBuffetKey([
    storeId,
    buffetSceneIdentity(draft, combo),
    draft.targetType,
    target.id || target.dishId || target.categoryId
  ]);
}
```

Implement `buffetSceneRows` by iterating `addedStoreIds(draft)`, projecting each store with `sceneScopeConfig`, resolving target metadata and quota values, and returning rows containing:

```js
{
  rowKey, storeId, storeName, config, values, target, targetType,
  lineId, lineLabel, categoryId, categoryName, code, status
}
```

Sort by participating-store order, line order, category name, target display name and `rowKey`. Export only the pure helpers through `window.__BUFFET_CROSS_STORE_SCENE_TEST__.api` when the test hook exists.

- [ ] **Step 4: Run row projection and existing state tests**

Run:

```powershell
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-quantity-workbench-state.mjs
node scripts/verify-buffet-scenario-targets.mjs
```

Expected: all print `PASS`.

- [ ] **Step 5: Commit the projection**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" "scripts/verify-buffet-cross-store-scene-rows.mjs"
git commit -m "feat: project buffet scene quotas across stores"
```

### Task 2: Store Filter, Unified Table and Selection Semantics

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:1371-1456,4258-4396,4528-4547,6701-6736`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-cross-store-scene-ui.mjs`
- Modify: `scripts/verify-buffet-cross-store-scene-rows.mjs`

**Interfaces:**
- Consumes: `buffetSceneRows`, `filteredBuffetSceneRows`, `buffetSceneRowIdentity` from Task 1.
- Produces: `state.storeId === ""` for all participating stores, store-aware filter option values, unified page rows and current-page-only selection.

- [ ] **Step 1: Write failing UI and selection contracts**

Create `scripts/verify-buffet-cross-store-scene-ui.mjs` with source assertions for:

```js
assert.match(flow, /data-buffet-workbench-store/);
assert.match(flow, />所属门店</);
assert.match(flow, /限购对象.*来自.*家门店/);
assert.match(flow, /row\.storeName/);
```

Extend the row test to verify store, line and category filters use store-scoped values, and page selection contains only `pageRows.map(row => row.rowKey)`.

- [ ] **Step 2: Run the UI contract and verify failure**

Run:

```powershell
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
```

Expected: FAIL because the toolbar has no cross-store selector and the table has no store column.

- [ ] **Step 3: Change the workbench state to default to all stores**

Keep `createBuffetQuantityWorkbenchState()` with `storeId: ""`. Remove normalization that forces `draft.activeStoreId`; retain an empty value as “全部参与门店”. Represent line/category filter values as stable encoded pairs:

```js
function buffetStoreScopedFilterValue(storeId, localId) {
  return stableBuffetKey([storeId, localId]);
}
```

Changing `data-buffet-workbench-store`, line, category, status, query or page size must set `page = 1`, call `clearBuffetQuantitySelection()` and render again. Page navigation also clears selection.

- [ ] **Step 4: Render the unified toolbar, table and footer**

Update `renderBuffetWorkbenchToolbar`, `buffetProductTableColumns`, all three row renderers and `renderBuffetProductTable` to consume `SceneRow` rather than a target plus active-store config. Add:

```html
<select data-buffet-workbench-store aria-label="参与门店">
  <option value="">全部参与门店（3）</option>
</select>
```

Add “所属门店” after the object column. Use `row.rowKey` for checkbox and remove-button values. Render footer as “限购对象 N 条，来自 M 家门店；筛选结果 K 条”. Preserve the existing target-type-specific quota columns.

- [ ] **Step 5: Add focused responsive styles**

In `order-limit-flow.css`, add styles for the store selector minimum width, store-name cell, combined footer statistics and horizontal scrolling. Reuse existing colors, borders and spacing; do not create a separate visual language.

- [ ] **Step 6: Run UI, row and legacy layout tests**

Run:

```powershell
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-product-table-shell.mjs
node scripts/verify-buffet-product-table-objects.mjs
node scripts/verify-buffet-product-table-selection.mjs
node scripts/verify-buffet-quantity-workbench-layout.mjs
```

Expected: all print `PASS`.

- [ ] **Step 7: Commit the unified UI**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "scripts/verify-buffet-cross-store-scene-ui.mjs" "scripts/verify-buffet-cross-store-scene-rows.mjs"
git commit -m "feat: show cross-store buffet scene quotas"
```

### Task 3: Route Single and Batch Quota Mutations to Owning Stores

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4281-4338,4528-4568,6220-6355,6701-6736`
- Create: `scripts/verify-buffet-cross-store-scene-mutations.mjs`
- Modify: `scripts/verify-buffet-multi-field-bulk.mjs`

**Interfaces:**
- Consumes: `SceneRow.rowKey`, `SceneRow.storeId`, `SceneRow.config`, `SceneRow.values` from Tasks 1-2.
- Produces: `findBuffetSceneRow(draft, combo, rowKey): SceneRow|null`, `validateBuffetBulkMutation(draft, combo, rows, fields): string`, `applyBuffetBulkMutation(draft, combo, rows, fields): boolean`.

- [ ] **Step 1: Write failing mutation isolation tests**

Create a two-store fixture whose stores share the same dish ID and assert:

```js
api.applyBuffetBulkMutation(draft, combo, [rowA, rowB], { limit: 3 });
assert.equal(limitFor(draft.storeConfigs['store-a'], combo, rowA.target).value, 3);
assert.equal(limitFor(draft.storeConfigs['store-b'], combo, rowB.target).value, 3);

api.applyBuffetBulkMutation(draft, combo, [rowA], { limit: 5 });
assert.equal(limitFor(draft.storeConfigs['store-a'], combo, rowA.target).value, 5);
assert.equal(limitFor(draft.storeConfigs['store-b'], combo, rowB.target).value, 3);
```

Add an invalid row/value case and assert neither store changes. Add dish, category and dish-set cases.

- [ ] **Step 2: Run mutation tests and verify failure**

Run:

```powershell
node scripts/verify-buffet-cross-store-scene-mutations.mjs
```

Expected: FAIL because mutation helpers are absent and current handlers write only `activeStoreConfig(draft)`.

- [ ] **Step 3: Route inline input mutations by row identity**

Render `data-buffet-row-key` on every quota input. In the input handler, resolve the row through `findBuffetSceneRow`; then compute the existing `v4TargetKey` or dish-set scenario key against `row.config` and write only `storeConfigFor(draft, row.storeId, true)`.

- [ ] **Step 4: Implement atomic cross-store batch mutation**

Parse all visible bulk fields first, resolve all selected row keys, and validate the complete set before writing. Use cloned per-store period maps during validation:

```js
var nextByStore = {};
rows.forEach(function (row) {
  if (!nextByStore[row.storeId]) nextByStore[row.storeId] = cloneValue(storeConfigFor(draft, row.storeId, true));
});
```

Only replace affected store configs after every row passes. An invalid integer, missing row, inapplicable field or abnormal identity returns a message containing store, scene, object and field; no cloned config is committed.

- [ ] **Step 5: Snapshot and restore all participating stores in the scene dialog**

When opening `quantitySceneDialog`, store:

```js
{
  combo,
  snapshotsByStoreId: addedStoreIds(draft).reduce(function (map, storeId) {
    map[storeId] = cloneValue(storeConfigFor(draft, storeId, false));
    return map;
  }, {})
}
```

`closeQuantitySceneDialog(true)` restores every snapshot, not only the original active store. Saving validates every displayed participating store and retains the all-or-nothing rule draft behavior.

- [ ] **Step 6: Run mutation and regression tests**

Run:

```powershell
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-multi-field-bulk.mjs
node scripts/verify-buffet-quantity-bulk-selection.mjs
node scripts/verify-buffet-member-inline-limits.mjs
node scripts/verify-buffet-v4-validation.mjs
```

Expected: all print `PASS`.

- [ ] **Step 7: Commit mutation routing**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" "scripts/verify-buffet-cross-store-scene-mutations.mjs" "scripts/verify-buffet-multi-field-bulk.mjs"
git commit -m "feat: isolate buffet quotas by scene and store"
```

### Task 4: Multi-Store Scene Product Picker and Removal

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:1853-1894,5990-6145`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Modify: `scripts/verify-buffet-scene-unified-picker.mjs`
- Modify: `scripts/verify-buffet-cross-store-scene-mutations.mjs`

**Interfaces:**
- Consumes: current `scenePickerInitialState`, `scenePickerSelection`, `scenePickerDiff`, `applyStoreStructure`, `SceneRow.rowKey`.
- Produces: `createMultiStoreScenePickerState(draft, combo)`, `ensureScenePickerStoreState(state, draft, combo, storeId)`, `applyMultiStoreScenePickerDraft(draft, combo, state): {ok, message}`.

- [ ] **Step 1: Extend the picker test with A → B → A switching**

Add assertions that the state initializes a store lazily, preserves A changes while editing B, restores A draft on return, tracks only changed stores and discards all changes on cancel:

```js
const state = api.createMultiStoreScenePickerState(draft, combo);
const a = api.ensureScenePickerStoreState(state, draft, combo, 'store-a');
a.byLine = picker.setNodeSelected(a.byLine, 'kiosk', dishKey, false);
api.ensureScenePickerStoreState(state, draft, combo, 'store-b');
assert.equal(api.ensureScenePickerStoreState(state, draft, combo, 'store-a').byLine, a.byLine);
assert.deepEqual(Array.from(state.dirtyStoreIds), ['store-a']);
```

- [ ] **Step 2: Run picker tests and verify failure**

Run:

```powershell
node scripts/verify-buffet-scene-unified-picker.mjs
```

Expected: FAIL because the picker supports only the scene dialog's current store.

- [ ] **Step 3: Implement the multi-store picker state**

Replace the single `picker.scenePickerState` contract with:

```js
{
  activeStoreId,
  statesByStoreId: {},
  baselinesByStoreId: {},
  dirtyStoreIds: [],
  queryByStoreId: {}
}
```

Each store state uses the existing menu structure and current scene targets for that store. A structure change or search checkbox change marks only `activeStoreId` dirty.

- [ ] **Step 4: Render a participating-store selector in the picker**

Replace the readonly store input with `select[data-scene-product-store]`, populated only from `addedStoreIds(draft)`. Store switching saves the current query and in-memory `byLine`, then renders the chosen store's hierarchy. Keep the existing “产线 → 组 → 类 → 菜” and category leaf behavior; dish-set uses its existing member semantics.

- [ ] **Step 5: Apply all dirty stores atomically**

Before mutating the draft, calculate every dirty store's final selection and enforce minimum counts (`dish_set` 2, other types 1). Clone affected configs, apply added/removed targets and clear only the removed current-scene quota keys or member exceptions. Replace configs only after every dirty store succeeds. Closing the picker removes it without applying state.

- [ ] **Step 6: Route row removal by store and current scene**

Resolve selected `rowKey` values to `SceneRow` objects. Group by `storeId`; for each group remove only the matching target from the current scene scope and delete its current-scene quota/exception keys. Keep the existing confirmation dialog, but include affected store count and object count. Enforce each store's minimum remaining object count before applying any group.

- [ ] **Step 7: Run picker, removal and scenario isolation tests**

Run:

```powershell
node scripts/verify-buffet-scene-unified-picker.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-product-removal.mjs
node scripts/verify-buffet-scenario-targets.mjs
node scripts/verify-buffet-scenario-copy.mjs
```

Expected: all print `PASS`.

- [ ] **Step 8: Commit picker and removal support**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "scripts/verify-buffet-scene-unified-picker.mjs" "scripts/verify-buffet-cross-store-scene-mutations.mjs"
git commit -m "feat: edit buffet scene products across stores"
```

### Task 5: Full Regression and Browser Acceptance

**Files:**
- Modify only if failures reveal scoped defects: `dist/Configuration center/assets/order-limit-flow.js`, `dist/Configuration center/assets/order-limit-flow.css`, and the new verification scripts.

**Interfaces:**
- Consumes: all cross-store helpers and UI from Tasks 1-4.
- Produces: verified production behavior with no unrelated file changes.

- [ ] **Step 1: Run syntax and focused verification**

Run:

```powershell
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-scene-unified-picker.mjs
```

Expected: syntax exits 0 and every script prints `PASS`.

- [ ] **Step 2: Run the relevant buffet regression suite**

Run:

```powershell
node scripts/verify-buffet-scene-cards.mjs
node scripts/verify-buffet-scene-workbench.mjs
node scripts/verify-buffet-product-table-shell.mjs
node scripts/verify-buffet-product-table-objects.mjs
node scripts/verify-buffet-product-table-selection.mjs
node scripts/verify-buffet-multi-field-bulk.mjs
node scripts/verify-buffet-member-inline-limits.mjs
node scripts/verify-buffet-scenario-targets.mjs
node scripts/verify-buffet-scenario-copy.mjs
node scripts/verify-buffet-cross-store-copy-preview.mjs
node scripts/verify-buffet-v4-runtime.mjs
node scripts/verify-buffet-v4-validation.mjs
node scripts/verify-buffet-v4-conflicts.mjs
```

Expected: every script prints `PASS`.

- [ ] **Step 3: Run the local app and open the buffet rule page**

Run from this worktree:

```powershell
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/#/operations/queue-call/buffet-rules` and hard-refresh the page.

- [ ] **Step 4: Browser-accept the cross-store matrix**

Create or edit a test draft with at least two participating stores and verify:

1. Only current-scene selected objects appear in the unified table.
2. “全部参与门店” shows both stores and the footer counts records and stores correctly.
3. Store filter, line, category, status, search and reset compose correctly.
4. Two stores with the same product can retain different quotas after save and refresh.
5. Current-page select, page change and filter change follow the cleared-selection contract.
6. Cross-store batch settings update only selected rows.
7. Add picker preserves A → B → A temporary selections and cancel writes nothing.
8. Removing an object affects only its store and current scene.
9. Repeat representative checks for people-only, round-only and combined scenes, and for dish, category and dish-set targets.
10. Browser console has no new errors or warnings.

- [ ] **Step 5: Inspect the final diff and unrelated changes**

Run:

```powershell
git diff --check -- "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "scripts/verify-buffet-cross-store-scene-rows.mjs" "scripts/verify-buffet-cross-store-scene-ui.mjs" "scripts/verify-buffet-cross-store-scene-mutations.mjs" "scripts/verify-buffet-scene-unified-picker.mjs"
git status --short
```

Expected: no whitespace errors; only files intentionally changed by this plan are staged for the final commit, while unrelated worktree changes remain untouched.

- [ ] **Step 6: Commit acceptance fixes if Task 5 changed files**

If browser acceptance required scoped corrections, commit only those corrections and their tests:

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "scripts/verify-buffet-cross-store-scene-rows.mjs" "scripts/verify-buffet-cross-store-scene-ui.mjs" "scripts/verify-buffet-cross-store-scene-mutations.mjs" "scripts/verify-buffet-scene-unified-picker.mjs"
git commit -m "fix: complete cross-store buffet scene acceptance"
```
