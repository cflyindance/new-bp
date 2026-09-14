# Employee Detail Allocation Status Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an allocation-status filter to employee detail that consistently scopes its metrics, rows, and exports.

**Architecture:** Extend the existing employee-detail filter pipeline with one normalized allocation-status value. Keep a single filtered row collection for rendering and exports, while preserving the existing page-only date sort behavior and resetting filter state when detail context is initialized.

**Tech Stack:** HTML templates, legacy browser JavaScript, Node.js `assert` verification, Vite build

**Spec:** `docs/superpowers/specs/2026-09-14-employee-detail-allocation-status-filter-design.md`

## Global Constraints

- Options are exactly `全部状态`, `已分配`, and `待分配`.
- Date, attendance, and allocation filters combine with AND semantics.
- Same-page changes preserve allocation status; entering another detail context resets it to `全部状态`.
- Page date sorting must not redefine existing export ordering behavior.
- Do not modify the allocation workflow or status source.

---

### Task 1: Add the status control and filter contract

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Test: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: daily rows with boolean `row.allocated` and existing `employeeDetailAttendanceStatus(row)`.
- Produces: `filterEmployeeDetailRows(rows, start, end, attendance, allocationStatus)` and view-state field `allocationStatus`.

- [ ] **Step 1: Write failing verification assertions**

Add template assertions for `employeeDetailAllocationStatusFilter` and its three exact values. Add pure filtering assertions such as:

```js
assert.deepEqual(
  Array.from(employeeDetailContext.filterEmployeeDetailRows([
    { dateKey: '2026-09-12', clockStatus: '已打卡', allocated: true },
    { dateKey: '2026-09-13', clockStatus: '已打卡', allocated: false }
  ], '2026-09-12', '2026-09-13', '全部状态', '已分配'), row => row.dateKey),
  ['2026-09-12']
);
```

Also assert `待分配` and a date + attendance + allocation combined case.

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the select and fifth filter argument are absent.

- [ ] **Step 3: Add the template control**

Place beside the attendance filter using the same wrapper class:

```html
<label class="tipout-detail-attendance-filter">
  <span>分配状态</span>
  <select id="employeeDetailAllocationStatusFilter" aria-label="分配状态">
    <option value="全部状态">全部状态</option>
    <option value="已分配">已分配</option>
    <option value="待分配">待分配</option>
  </select>
</label>
```

- [ ] **Step 4: Extend the pure filter**

Implement allocation matching from the existing boolean source:

```js
function filterEmployeeDetailRows(rows, start, end, attendance, allocationStatus) {
  return (rows || []).filter(function(row) {
    var inDateRange = row.dateKey >= start && row.dateKey <= end;
    var attendanceMatches = !attendance || attendance === '全部状态' || employeeDetailAttendanceStatus(row) === attendance;
    var rowAllocationStatus = row.allocated ? '已分配' : '待分配';
    var allocationMatches = !allocationStatus || allocationStatus === '全部状态' || rowAllocationStatus === allocationStatus;
    return inDateRange && attendanceMatches && allocationMatches;
  });
}
```

- [ ] **Step 5: Run verification and confirm pass**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

### Task 2: Wire lifecycle, metrics, and exports

**Files:**
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Test: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `employeeDetailAllocationStatusFilter` and extended filter from Task 1.
- Produces: `employeeDetailViewState.allocationStatus`; export data property `allocationStatus`.

- [ ] **Step 1: Add failing program/export contract assertions**

Assert that the program reads the new select, passes its value into filtering, stores it in view state, registers a change listener, resets the select to `全部状态` during `renderEmployeeReconciliationDetail`, and emits `分配状态筛选` in CSV/print metadata.

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL on the new program/export contracts.

- [ ] **Step 3: Wire render state and reset lifecycle**

In `renderEmployeeDetailRange`, read the select, pass it to the pure filter, and save it:

```js
var allocationStatus = allocationStatusInput ? allocationStatusInput.value : '全部状态';
var filteredRows = filterEmployeeDetailRows(snapshot.dailyRows, range.start, range.end, attendance, allocationStatus);
employeeDetailViewState = {
  snapshot: snapshot,
  range: range,
  attendance: attendance,
  allocationStatus: allocationStatus,
  rows: rows.slice()
};
```

In `renderEmployeeReconciliationDetail`, set the select value to `全部状态`, register its `change` listener, then render. This makes date, attendance, allocation, and sorting changes preserve state inside the same detail instance while every new detail initialization resets it.

- [ ] **Step 4: Include the filter in all export formats**

Add `allocationStatus: state.allocationStatus` to collected export data. Add:

```js
lines.push(['分配状态筛选', data.allocationStatus].map(employeeDetailCsvCell).join(','));
```

and append `分配状态：...` to print metadata. Email snapshots inherit the same collected data.

- [ ] **Step 5: Run verification and build**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: exit code 0; existing non-blocking bundle warnings are acceptable.

- [ ] **Step 6: Browser verification**

Open an employee detail and verify: default `全部状态`; `已分配` and `待分配` show only matching rows; metrics change with rows; date/attendance filters combine; clicking Date preserves allocation selection; leaving and reopening resets it.

- [ ] **Step 7: Commit scoped files**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt
git commit -m "feat: filter employee detail by allocation status"
```
