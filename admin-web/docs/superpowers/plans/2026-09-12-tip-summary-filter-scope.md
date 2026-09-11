# Tip Summary Filter Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give date and employee tip summaries independent, relevant filters, including allocation status for dates and a role-linked employee multi-select for employees.

**Architecture:** Keep the existing distribution template and program, but move view-specific filter normalization into the existing `TipOutSummaryUi` pure helper so behavior can be verified without a browser. The page program owns DOM synchronization and persistence; all list metrics and exports consume the same visible row collections.

**Tech Stack:** TypeScript/Vite shell, legacy browser JavaScript fragments, HTML templates, CSS, Node verification script.

**Spec:** `docs/superpowers/specs/2026-09-12-tip-summary-filter-scope-design.md`

## Global Constraints

- Store remains one shared page-level filter for both tabs.
- Date summary only uses date range, allocation status, and date sort.
- Employee summary keeps date range and uses single-select role, employee multi-select, status, and existing table-header sorting.
- Empty employee selection and select-all normalize to the canonical “全部员工” scope.
- Hidden filters must not affect metrics, rows, or exports.
- Do not change allocation calculation, confirmation, cancellation, or employee/role data sources.

---

### Task 1: Add pure filter-state helpers and verification

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: employee aggregates `{ employeeId, roles, status }` and daily rows `{ allocated }`.
- Produces: `normalizeEmployeeScope(allIds, selectedIds)`, `reconcileEmployeeScope(scope, availableIds)`, `filterDailyRowsByAllocationStatus(rows, status)`, and employee-ID filtering through `filterAndSortEmployeeAggregates`.

- [ ] **Step 1: Write failing helper assertions**

Add VM assertions covering:

```js
assert.deepEqual(summaryUi.normalizeEmployeeScope(['a', 'b'], []), { mode: 'all', ids: [] });
assert.deepEqual(summaryUi.normalizeEmployeeScope(['a', 'b'], ['a']), { mode: 'subset', ids: ['a'] });
assert.deepEqual(summaryUi.reconcileEmployeeScope({ mode: 'subset', ids: ['a', 'x'] }, ['a', 'b']), { mode: 'subset', ids: ['a'] });
assert.deepEqual(summaryUi.filterDailyRowsByAllocationStatus([{ allocated: true }, { allocated: false }], 'allocated').map(row => row.allocated), [true]);
```

Also assert that employee aggregate filtering honors `employeeIds` only when `employeeScope.mode === 'subset'`.

- [ ] **Step 2: Run the verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: failure because the new helper functions or employee-scope behavior do not exist.

- [ ] **Step 3: Implement the pure helpers**

Expose functions equivalent to:

```js
function normalizeEmployeeScope(allIds, selectedIds) {
  var available = uniqueIds(allIds);
  var selected = uniqueIds(selectedIds).filter(function(id) { return available.indexOf(id) >= 0; });
  if (!selected.length || selected.length === available.length) return { mode: 'all', ids: [] };
  return { mode: 'subset', ids: selected };
}

function reconcileEmployeeScope(scope, availableIds) {
  if (!scope || scope.mode !== 'subset') return { mode: 'all', ids: [] };
  return normalizeEmployeeScope(availableIds, scope.ids);
}

function filterDailyRowsByAllocationStatus(rows, status) {
  if (status === 'allocated') return rows.filter(function(row) { return row.allocated === true; });
  if (status === 'unallocated') return rows.filter(function(row) { return row.allocated !== true; });
  return rows.slice();
}
```

Extend employee aggregate filtering with `employeeScope` and stable `employeeId` matching.

- [ ] **Step 4: Run the verifier and confirm helper tests pass**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: all new pure-helper assertions pass.

- [ ] **Step 5: Commit**

```bash
git add src/team/tips/legacy/tipout-summary-ui.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: add tip summary filter state helpers"
```

### Task 2: Render view-specific filter controls

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `activeSummaryView` from the distribution program.
- Produces DOM IDs `dateAllocationStatusFilter`, `employeeSummaryRoleFilter`, `employeeSummaryEmployeeFilter`, and `employeeSummaryEmployeeOptions`.

- [ ] **Step 1: Add failing template-contract checks**

Assert that the date-specific group contains date range, allocation status, and date sort but not employee/role fields; assert that the employee-specific group contains date range, role, employee, and status but no date sort. Assert one unique instance of the new employee multi-select IDs and its select-all checkbox.

- [ ] **Step 2: Run verifier and confirm template assertions fail**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: failure for missing status and employee multi-select contracts.

- [ ] **Step 3: Update the distribution template**

Replace the mixed filter controls with view-specific wrappers. Use the existing shared date inputs, moving them between wrappers is not allowed because duplicate IDs would break handlers; instead keep the shared date field and toggle only the remaining groups:

```html
<div id="dateSummaryFilters" class="tipout-summary-view-filters">
  <div class="filter-field">
    <label for="dateAllocationStatusFilter">分配状态</label>
    <select id="dateAllocationStatusFilter" data-native-onchange="handleDateAllocationStatusChange(this.value)">
      <option value="">全部状态</option>
      <option value="allocated">已分配</option>
      <option value="unallocated">未分配</option>
    </select>
  </div>
  <!-- existing dateSortField -->
</div>
<div id="employeeSummaryFilters" class="tipout-employee-summary-filters" hidden>
  <!-- existing single-select role and status -->
  <div class="filter-field" id="employeeSummaryEmployeeFilter">
    <span class="filter-field-label">员工</span>
    <div class="multi-select" data-placeholder="全部员工">...</div>
  </div>
</div>
```

Remove the old date-view `roleFilterField` and `employeeFilterField` controls. Preserve the shared date-range field for both tabs.

- [ ] **Step 4: Add responsive styles**

Keep the desktop filters right-aligned in the existing white surface. Ensure `[hidden]` wins over flex display, the employee dropdown has a bounded scroll height, and view-specific groups wrap on tablet/mobile without changing the first-row store layout.

- [ ] **Step 5: Run verifier and confirm template/CSS checks pass**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: template IDs are unique, obsolete date role/employee controls are absent, and hidden wrappers use `display: none`.

- [ ] **Step 6: Commit**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: separate tip summary filter layouts"
```

### Task 3: Wire independent view state and role-linked employees

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: Task 1 helpers and Task 2 DOM contracts.
- Produces: `dateSummaryFilters`, extended `employeeSummaryFilters`, `renderEmployeeSummaryEmployeeOptions()`, `handleDateAllocationStatusChange()`, and `handleEmployeeSummaryEmployeeChange()`.

- [ ] **Step 1: Add failing behavior-contract checks**

Check that date list rendering calls `filterDailyRowsByAllocationStatus`, employee filters store stable IDs, role changes call `renderEmployeeSummaryEmployeeOptions`, and `syncSummaryViewUi` toggles only the two view-specific wrappers. Verify removed `getSelectedRoles()` and date-view employee filter paths no longer feed `buildDailyDataset`.

- [ ] **Step 2: Run verifier and confirm behavior checks fail**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: failure for missing independent state and role-linked employee handlers.

- [ ] **Step 3: Add independent state objects**

Use explicit structures:

```js
var dateSummaryFilters = { allocationStatus: '' };
var employeeSummaryFilters = {
  role: '',
  employeeScope: { mode: 'all', ids: [] },
  statuses: []
};
```

Preserve existing shared date inputs and table-header employee sort. Update saved preferences with backward-safe defaults; ignore obsolete `search` and date-view role/employee values.

- [ ] **Step 4: Implement role-to-employee option reconciliation**

Build available employees from the current store roster, filter by the single selected role, then call `reconcileEmployeeScope`. Render checkbox values with `employeeId`; show employee names only as labels. When no employees are available, disable the trigger and render “暂无可选员工”. Normalize full/cleared selections to `{ mode: 'all', ids: [] }` and show “全部员工”.

- [ ] **Step 5: Apply view-specific filters to rows and metrics**

In date rendering, filter generated rows by `dateSummaryFilters.allocationStatus` before totals and DOM rows are derived. In employee rendering, pass `role`, `employeeScope`, and statuses into the helper before metrics and table rows are derived. Do not consult hidden conditions.

- [ ] **Step 6: Synchronize Tab and store changes**

`syncSummaryViewUi()` shows `dateSummaryFilters` only for the date view and `employeeSummaryFilters` only for the employee view. Store changes rebuild employee roles/options and reconcile employee IDs. Tab switching restores each view state without resetting the other.

- [ ] **Step 7: Run verifier**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/team/tips/programs/distribution.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: link employee and role summary filters"
```

### Task 4: Align exports and complete browser verification

**Files:**
- Modify: `src/team/tips/legacy/export.js.txt`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `visibleDailySummaryRows` and existing `visibleEmployeeSummaryAggregates` after all active filters.
- Produces exports whose row set and ordering match the currently visible summary.

- [ ] **Step 1: Add failing export-contract checks**

Assert that date export receives filtered visible date rows rather than regenerating from obsolete role/employee filters, and employee export receives `visibleEmployeeSummaryAggregates`. Assert both paths retain their current ordering.

- [ ] **Step 2: Run verifier and confirm export assertions fail**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: failure until export inputs use the visible collections.

- [ ] **Step 3: Update export inputs**

Store the filtered date rows in `visibleDailySummaryRows` immediately before rendering. Pass a shallow copy of the correct visible collection to PDF, CSV, and email export paths based on `activeSummaryView`. Keep file columns and formatting unchanged.

- [ ] **Step 4: Run all source verification and build**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
npm.cmd run build
```

Expected: verifier passes and Vite build exits successfully. Do not stage generated `dist` or build-stamp changes unless they are explicitly part of the repository's existing release workflow.

- [ ] **Step 5: Browser verification**

Verify on `/team/tips/distribution`:

1. Date Tab shows only date, allocation status, and sort.
2. Allocated/unallocated selection changes rows and metrics together.
3. Employee Tab retains date and shows role, employee multi-select, and status.
4. Role selection narrows employee options and removes invalid selected employees.
5. Employee select-all/clear returns to “全部员工”; subset selection filters rows and metrics.
6. Tab switching restores independent values.
7. Store switching reconciles role and employee options.
8. PDF, CSV, and email use the visible rows and order.

- [ ] **Step 6: Commit**

```bash
git add src/team/tips/legacy/export.js.txt src/team/tips/programs/distribution.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "fix: align tip summary exports with filters"
```

