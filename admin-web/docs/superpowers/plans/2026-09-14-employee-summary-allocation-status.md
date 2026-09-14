# Employee Summary Allocation Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename employee summary status to allocation status and calculate `已完成`, `部分待分配`, or `待分配` solely from daily allocation completion in the selected date range.

**Architecture:** Centralize status calculation and legacy-filter normalization in `tipout-summary-ui.js.txt`, where employee daily rows are already aggregated. The distribution template and program consume only the normalized status values, so filtering, display, history restoration, and date-range recomputation share one contract.

**Tech Stack:** HTML templates, legacy browser JavaScript, Node.js `assert` verification, Vite build

**Spec:** `docs/superpowers/specs/2026-09-14-employee-summary-allocation-status-design.md`

## Global Constraints

- Status is based only on `aggregate.dailyRows[].allocated === true` within the selected range.
- `已完成`, `部分待分配`, and `待分配` are mutually exclusive and exhaustive for non-empty aggregates.
- Attendance, hours, amount validation, and rule errors do not override allocation status.
- Legacy or unknown filter values fall back to `全部状态`.
- Existing amount validity and `已确认部分` behavior are not redefined by this change.

---

### Task 1: Define allocation status and compatibility helpers

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Test: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `aggregate.dailyRows: Array<{ allocated: boolean }>`.
- Produces: `employeeAllocationStatus(rows): '已完成' | '部分待分配' | '待分配'` and `normalizeEmployeeAllocationStatusFilter(value): '' | '已完成' | '部分待分配' | '待分配'`.

- [ ] **Step 1: Add failing helper assertions**

```js
assert.equal(summaryUi.employeeAllocationStatus([{ allocated: true }, { allocated: true }]), '已完成');
assert.equal(summaryUi.employeeAllocationStatus([{ allocated: true }, { allocated: false }]), '部分待分配');
assert.equal(summaryUi.employeeAllocationStatus([{ allocated: false }, { allocated: false }]), '待分配');
assert.equal(summaryUi.employeeAllocationStatus([{ allocated: true, allocationValidationError: '金额异常' }]), '已完成');
assert.equal(summaryUi.normalizeEmployeeAllocationStatusFilter('部分待分配'), '部分待分配');
assert.equal(summaryUi.normalizeEmployeeAllocationStatusFilter('待处理'), '');
assert.equal(summaryUi.normalizeEmployeeAllocationStatusFilter('异常'), '');
```

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement exact helpers**

```js
function employeeAllocationStatus(rows) {
  var dailyRows = Array.isArray(rows) ? rows : [];
  var allocatedDays = dailyRows.filter(function(row) { return row && row.allocated === true; }).length;
  var unallocatedDays = dailyRows.length - allocatedDays;
  if (allocatedDays > 0 && unallocatedDays === 0) return '已完成';
  if (allocatedDays > 0 && unallocatedDays > 0) return '部分待分配';
  return '待分配';
}

function normalizeEmployeeAllocationStatusFilter(value) {
  return ['已完成', '部分待分配', '待分配'].indexOf(value) >= 0 ? value : '';
}
```

Export both helpers through `TipOutSummaryUi`.

- [ ] **Step 4: Assign aggregate status from daily rows**

Replace the invalid/pending override with:

```js
aggregate.status = employeeAllocationStatus(aggregate.dailyRows);
```

Keep the existing error-driven amount nullability and issue reasons. Update `summarizeEmployeeAggregates` so both `部分待分配` and `待分配` count as pending if the helper remains part of the public test contract.

- [ ] **Step 5: Run verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: helper tests pass; old status expectations fail until Task 2 updates them.

### Task 2: Update UI copy, filters, and restoration

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Test: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `TipOutSummaryUi.normalizeEmployeeAllocationStatusFilter(value)` and aggregate `status` from Task 1.
- Produces: a four-option allocation-status select and matching employee rows.

- [ ] **Step 1: Add failing template/program assertions**

Require both the filter label and table header to be `分配状态`, require options `已完成`, `部分待分配`, `待分配`, and reject employee-filter options `待处理` and `异常`. Require history restoration and live selection reads to call the normalization helper.

- [ ] **Step 2: Update template copy**

```html
<label class="filter-field-label" for="employeeSummaryStatusFilter">分配状态</label>
<select id="employeeSummaryStatusFilter" ...>
  <option value="">全部状态</option>
  <option value="已完成">已完成</option>
  <option value="部分待分配">部分待分配</option>
  <option value="待分配">待分配</option>
</select>
```

Change the employee table header from `<th>状态</th>` to `<th>分配状态</th>`.

- [ ] **Step 3: Normalize restored and live filter values**

During history restoration:

```js
var restoredEmployeeStatus = TipOutSummaryUi.normalizeEmployeeAllocationStatusFilter(saved.employeeSummaryStatus);
employeeSummaryFilters.statuses = restoredEmployeeStatus ? [restoredEmployeeStatus] : [];
```

In `syncEmployeeSummaryFilterState`, normalize the select value before saving it. This prevents old `待处理`, `异常`, or unknown values from generating an empty result.

- [ ] **Step 4: Simplify status styling**

Use completed styling only for `已完成`; use pending styling for the other two statuses:

```js
var statusClass = aggregate.status === '已完成' ? 'is-complete' : 'is-pending';
```

- [ ] **Step 5: Update aggregation and filtering assertions**

Replace old `待处理`/`异常` expectations with the new three states. Add filtering assertions for each state and confirm an aggregate containing validation errors keeps the allocation-derived status. Add a two-range fixture where the same employee changes from `已完成` to `部分待分配`, and a range without participating rows where the employee is absent.

- [ ] **Step 6: Run verification and build**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: exit code 0; existing non-blocking bundle-size and missing kiosklite embed notices are acceptable.

- [ ] **Step 7: Browser verification**

Open `#/team/tips/distribution?view=employee`. Verify both labels say `分配状态`; the select contains only the four specified choices; rows show all three statuses according to their date range; each option filters correctly; changing the global date range recomputes status and matching rows.

- [ ] **Step 8: Commit scoped files**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/legacy/tipout-summary-ui.js.txt src/team/tips/programs/distribution.js.txt src/team/tips/templates/distribution.html
git commit -m "feat: clarify employee allocation statuses"
```
