# Tip Detail Rule Name Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a select-all, multi-select rule-name filter to the native tip allocation detail page, with consistent visible summaries and full-rule allocation safety.

**Architecture:** Introduce a small pure helper for rule identity, selected-rule projection, shared-pool aggregation, and rule-set equality. The detail runtime will maintain a full rule-state model separately from `selectedRuleIds`; view rendering uses the selected projection, while auto-allocation, validation, snapshot creation, persistence, and payroll sync always consume the complete rule set.

**Tech Stack:** TypeScript/Vite shell, raw HTML/CSS templates, browser JavaScript runtime (`*.js.txt`), Node assertion verifier.

**Spec:** `docs/superpowers/specs/2026-09-12-tip-detail-rule-name-filter-design.md`

## Global Constraints

- Modify only the native `src/team/tips` implementation; do not use the old standalone TipOut project.
- `selectedRuleIds` is display-only and must never define allocation, validation, persistence, or payroll scope.
- Confirmed snapshots must contain exactly the current store/date applicable rule IDs.
- Filter changes must not trigger auto-allocation or payroll synchronization.
- Existing uncommitted and generated files outside this feature must not be staged.

---

### Task 1: Pure rule-filter projection and integrity helpers

**Files:**
- Create: `src/team/tips/legacy/tipout-detail-rule-filter.js.txt`
- Modify: `src/team/tips/tips-legacy-runtime.ts`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: rule objects with stable `id`, display name, and optional pool identity; pool execution objects with `ruleId`, pool ID, and monetary fields.
- Produces: global `TipOutDetailRuleFilter` with `ruleId(rule, index)`, `buildOptions(rules)`, `normalizeSelection(rules, selectedIds)`, `filterRules(rules, selectedIds)`, `aggregateVisibleSummary(summary, selectedIds)`, and `sameRuleSet(snapshotPools, rules)`.

- [ ] **Step 1: Write failing helper tests**

Add verifier fixtures for three rules, including two duplicate names and two rules sharing `pool-1`. Assert stable ID selection, duplicate labels, empty selection, selected contribution sums, and order-independent full-set equality:

```js
const options = detailRuleFilter.buildOptions(rules);
assert.equal(options[0].label, 'Tip Pool · Main Pool');
assert.deepEqual(detailRuleFilter.filterRules(rules, ['rule-b']).map(r => r.id), ['rule-b']);
assert.deepEqual(detailRuleFilter.aggregateVisibleSummary(summary, ['rule-a', 'rule-b']), {
  originalTips: 420,
  poolAmount: 86,
  allocatedAmount: 80,
  unallocatedAmount: 6,
  poolCount: 1,
  ruleCount: 2,
  poolExecutions: expectedSharedPoolRows,
});
assert.equal(detailRuleFilter.sameRuleSet([{ ruleId: 'rule-b' }, { ruleId: 'rule-a' }], rules.slice(0, 2)), true);
```

- [ ] **Step 2: Run verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because `tipout-detail-rule-filter.js.txt` and its global API do not exist.

- [ ] **Step 3: Implement the pure helper and load it before details runtime**

Implement ID normalization without using display names. For duplicate rule names, append pool name to every duplicate; append a short ID if the combined labels still collide. Aggregate selected rule executions by pool ID with integer cents:

```js
function cents(value) { return Math.round((Number(value) || 0) * 100); }
function sameRuleSet(pools, rules) {
  var actual = (pools || []).map(function(pool) { return String(pool.ruleId || ''); }).sort();
  var expected = (rules || []).map(ruleId).sort();
  return actual.length === expected.length && actual.every(function(id, index) { return id === expected[index]; });
}
```

Import the raw helper in `tips-legacy-runtime.ts` and concatenate it before `details` so `window.TipOutDetailRuleFilter` exists when the page initializes.

- [ ] **Step 4: Run tests**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS for all helper fixtures, including shared-pool aggregation and reordered rule IDs.

- [ ] **Step 5: Commit**

```bash
git add src/team/tips/legacy/tipout-detail-rule-filter.js.txt src/team/tips/tips-legacy-runtime.ts scripts/verify-team-tips-native-views.mjs
git commit -m "feat: add tip detail rule filter model"
```

### Task 2: Multi-select control and display-only view linkage

**Files:**
- Modify: `src/team/tips/templates/details.html:159-178`
- Modify: `src/team/tips/programs/details.js.txt:179-257`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `TipOutDetailRuleFilter.buildOptions`, `normalizeSelection`, `filterRules`, and `aggregateVisibleSummary` from Task 1.
- Produces: `detailAllRules`, `detailSelectedRuleIds`, `initializeDetailRuleFilter(rules)`, `toggleDetailRuleFilter()`, `toggleAllDetailRules(checked)`, `handleDetailRuleSelection()`, and `renderVisibleRuleView()`.

- [ ] **Step 1: Add failing template and behavior assertions**

Assert the template contains `detailRuleFilter`, `detailRuleFilterAll`, `detailRuleFilterOptions`, an accessible “规则名称” label, and native event adapters. Assert program source separates `initializeDetailRuleFilter()` from `renderVisibleRuleView()` and the filter handlers do not call `renderDetailPage`, `scheduleDetailAutoAllocation`, or payroll sync.

- [ ] **Step 2: Run verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL with missing rule-filter IDs and handlers.

- [ ] **Step 3: Add the accessible multi-select UI**

Add the filter after date using the existing `.multi-select` pattern:

```html
<div class="filter-field tipout-detail-rule-filter-field">
  <span class="filter-field-label" id="detailRuleFilterLabel">规则名称</span>
  <div class="multi-select" id="detailRuleFilter" aria-labelledby="detailRuleFilterLabel">
    <button type="button" class="multi-select-input" data-native-onclick="toggleDetailRuleFilter()" aria-expanded="false"></button>
    <div class="multi-select-dropdown">
      <label><input id="detailRuleFilterAll" type="checkbox" data-native-onchange="toggleAllDetailRules(this.checked)"> 全选</label>
      <div id="detailRuleFilterOptions"></div>
    </div>
  </div>
</div>
```

Style the third field to grow, wrap selected tags, constrain dropdown height, and stack cleanly on narrow screens.

- [ ] **Step 4: Split full initialization from visible rendering**

Make `renderDetailPage()` build every rule bundle once, initialize full rule state, render the filter, call `renderVisibleRuleView()`, then schedule auto-allocation once. Filter changes update selection and only call `renderVisibleRuleView()`.

Use `hidden` on unselected `.detail-rule-bundle` elements instead of deleting them so edited controls and full snapshot inputs remain intact. Render the pool execution list and overview from the selected projection. With no selected rules, render the specified empty state, show monetary values as `—`, rule count `0`, and the helper text “确认分配仍将处理当天全部 N 条规则”.

- [ ] **Step 5: Preserve selection mechanics and accessibility**

Synchronize select-all checked/indeterminate state, `aria-expanded`, trigger summary, and tags after every change. Outside click closes the dropdown without changing selection. Switching store/date rebuilds options and selects all new rule IDs.

- [ ] **Step 6: Run tests and production build**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: successful TypeScript and Vite build; existing chunk-size warnings are allowed.

- [ ] **Step 7: Commit**

```bash
git add src/team/tips/templates/details.html src/team/tips/programs/details.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: filter tip detail by rule name"
```

### Task 3: Full-rule confirmation invariant and hidden-error recovery

**Files:**
- Modify: `src/team/tips/programs/details.js.txt:1228-1395`
- Modify: `src/team/tips/templates/details.html`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `detailAllRules`, intact hidden rule bundles, and `TipOutDetailRuleFilter.sameRuleSet`.
- Produces: `collectFullDetailAllocationSnapshot(store, dateKey, rules)`, `assertCompleteDetailRuleSnapshot(snapshot, rules)`, and `showInvalidDetailRule(ruleId, message)`.

- [ ] **Step 1: Add failing full-scope safety tests**

Add source/VM assertions proving snapshot collection is independent of `detailSelectedRuleIds`. Test A/B/C rules with only A selected and assert the snapshot rule IDs remain A/B/C. Test re-confirmation of an existing A/B/C result while A alone is visible and assert B/C remain. Assert filter handlers never invoke commit or payroll sync.

- [ ] **Step 2: Run verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL until the full-rule snapshot assertion exists.

- [ ] **Step 3: Enforce full-rule snapshot construction**

Rename `collectDetailAllocationSnapshot` to `collectFullDetailAllocationSnapshot` and iterate `detailAllRules` in stable order, locating each rule's retained bundle by full rule ID. Never query only visible elements and never read `detailSelectedRuleIds` in this function.

Before validation or commit:

```js
if (!TipOutDetailRuleFilter.sameRuleSet(snapshot.pools, rules)) {
  throw new Error('规则数据已变化，请刷新页面后重新确认分配');
}
```

Both manual `confirmDetailAllocation()` and `scheduleDetailAutoAllocation()` must pass the complete applicable rules array to `executeDetailAllocation()`.

- [ ] **Step 4: Add hidden-rule error recovery**

When validation can identify a rule, show “规则名称 · 小费池名称：错误原因” and a “查看该规则” action. `showInvalidDetailRule()` adds the rule ID to the display selection, refreshes the visible view, then scrolls/focuses the first invalid control. Do not commit or overwrite an existing result on any validation failure.

- [ ] **Step 5: Verify edit preservation and side-effect boundaries**

Add or execute browser checks:

1. Edit rule A hours, hide A, show A, and confirm the value remains.
2. Select only A from A/B/C, confirm, and inspect stored snapshot to verify A/B/C remain.
3. Toggle individual rules, select all, and clear all; verify no allocation record timestamp changes and no payroll-sync call occurs.
4. Hide an invalid rule, confirm, use “查看该规则”, and verify it is selected and focused.

- [ ] **Step 6: Run complete verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: PASS with no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/team/tips/programs/details.js.txt src/team/tips/templates/details.html scripts/verify-team-tips-native-views.mjs
git commit -m "fix: preserve full tip allocation scope"
```

## Self-Review

- Spec coverage: filter placement, select-all, default selection, all linked display areas, empty state, shared pools, duplicate labels, edit preservation, full-rule confirmation, auto-allocation isolation, error recovery, and accessibility are assigned to Tasks 1–3.
- Placeholder scan: no TBD, TODO, deferred implementation, or unspecified test steps remain.
- Type consistency: all later tasks consume the exact `TipOutDetailRuleFilter` APIs and `detailAllRules`/`detailSelectedRuleIds` state established earlier.
