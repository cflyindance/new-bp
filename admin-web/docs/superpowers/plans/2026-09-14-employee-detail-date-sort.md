# Employee Detail Date Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible date-column sort toggle to employee allocation details, defaulting to newest-first on every detail entry.

**Architecture:** Add pure, non-persistent employee-detail sorting helpers to `TipOutSummaryUi` for deterministic testing, then keep the active direction as page-local state in the employee detail program. Filtering runs first, sorting runs second, and the existing summary calculation continues to consume the same rows independent of order.

**Tech Stack:** Static HTML templates, browser JavaScript, CSS, Node.js assertion-based verification.

**Spec:** `docs/superpowers/specs/2026-09-14-employee-detail-date-sort-design.md`

## Global Constraints

- Every employee-detail route activation or employee ID change initializes sorting to `desc`.
- Date range and attendance filter changes preserve the current in-page direction.
- Sort filtered rows without mutating snapshot `dailyRows`.
- Valid dates sort chronologically; invalid dates remain stable after valid dates in both directions.
- Do not read or write local storage, session storage, URL parameters, or summary-page history for this direction.
- Do not change export order, summary totals, attendance logic, allocation amounts, or date-summary sorting.

---

### Task 1: Add and test pure employee-detail date sorting

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt:197-221,312-320`
- Modify: `scripts/verify-team-tips-native-views.mjs:120-145`

**Interfaces:**
- Produces: `TipOutSummaryUi.normalizeEmployeeDetailDateSort(value): 'asc' | 'desc'`.
- Produces: `TipOutSummaryUi.sortEmployeeDetailRows(rows, direction): Array<Row>` returning a new array.
- Consumes: row objects with `dateKey` in ISO `YYYY-MM-DD` form.

- [ ] **Step 1: Add failing pure-function assertions**

After `summaryUi` is initialized in `scripts/verify-team-tips-native-views.mjs`, add:

```js
assert.equal(summaryUi.normalizeEmployeeDetailDateSort("asc"), "asc");
assert.equal(summaryUi.normalizeEmployeeDetailDateSort("unknown"), "desc");
const detailRowsToSort = [
  { id: "old", dateKey: "2026-08-12" },
  { id: "invalid-a", dateKey: "" },
  { id: "new", dateKey: "2026-09-14" },
  { id: "invalid-b", dateKey: "not-a-date" },
];
assert.deepEqual(summaryUi.sortEmployeeDetailRows(detailRowsToSort, "desc").map(row => row.id), ["new", "old", "invalid-a", "invalid-b"]);
assert.deepEqual(summaryUi.sortEmployeeDetailRows(detailRowsToSort, "asc").map(row => row.id), ["old", "new", "invalid-a", "invalid-b"]);
assert.deepEqual(detailRowsToSort.map(row => row.id), ["old", "invalid-a", "new", "invalid-b"]);
```

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because `normalizeEmployeeDetailDateSort` and `sortEmployeeDetailRows` do not exist.

- [ ] **Step 3: Implement the pure helpers**

Add to `src/team/tips/legacy/tipout-summary-ui.js.txt`:

```js
function normalizeEmployeeDetailDateSort(value) {
  return value === 'asc' ? 'asc' : 'desc';
}

function validEmployeeDetailDateKey(value) {
  var key = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return '';
  var date = new Date(key + 'T00:00:00');
  if (isNaN(date.getTime())) return '';
  var normalized = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  return normalized === key ? key : '';
}

function sortEmployeeDetailRows(rows, direction) {
  var multiplier = normalizeEmployeeDetailDateSort(direction) === 'asc' ? 1 : -1;
  return (Array.isArray(rows) ? rows : []).map(function(row, index) {
    return { row: row, index: index, dateKey: validEmployeeDetailDateKey(row && row.dateKey) };
  }).sort(function(a, b) {
    if (!a.dateKey && !b.dateKey) return a.index - b.index;
    if (!a.dateKey) return 1;
    if (!b.dateKey) return -1;
    return a.dateKey.localeCompare(b.dateKey) * multiplier || a.index - b.index;
  }).map(function(item) { return item.row; });
}
```

Export both functions on `global.TipOutSummaryUi`.

- [ ] **Step 4: Run verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS for direction normalization, ascending/descending order, invalid-date placement, stability, and immutability.

---

### Task 2: Wire the sortable date header into employee details

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html:44-48`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt:1-5,308-382`
- Modify: `src/team/tips/tips-page.css:2731-2752`
- Modify: `scripts/verify-team-tips-native-views.mjs:455-470`

**Interfaces:**
- Consumes: `TipOutSummaryUi.sortEmployeeDetailRows(rows, direction)` from Task 1.
- Produces: global page action `toggleEmployeeDetailDateSort()` used by `data-native-onclick`.
- Produces: `syncEmployeeDetailDateSortHeader()` updating `aria-sort`, icon, and accessible label.

- [ ] **Step 1: Add failing DOM and program contract assertions**

Add to the employee-detail verification block:

```js
for (const token of [
  'id="employeeDetailDateSortHeader" aria-sort="descending"',
  'id="employeeDetailDateSortButton"',
  'id="employeeDetailDateSortIcon" aria-hidden="true">↓',
  'data-native-onclick="toggleEmployeeDetailDateSort()"',
]) {
  if (!employeeDetailTemplate.includes(token)) failures.push(`employee reconciliation detail: date sort template contract missing ${token}`);
}
for (const token of [
  "var employeeDetailDateSort = 'desc'",
  "function toggleEmployeeDetailDateSort()",
  "function syncEmployeeDetailDateSortHeader()",
  "TipOutSummaryUi.sortEmployeeDetailRows(rows, employeeDetailDateSort)",
  "employeeDetailDateSort = 'desc'",
]) {
  if (!employeeDetailProgram.includes(token)) failures.push(`employee reconciliation detail: date sort behavior missing ${token}`);
}
for (const forbidden of ["localStorage", "sessionStorage", "employeeDetailDateSort="]) {
  if (forbidden !== "employeeDetailDateSort=" && employeeDetailProgram.includes(forbidden)) failures.push(`employee reconciliation detail: date sort must not persist through ${forbidden}`);
}
```

Use the existing variable names for the employee detail template and program in the verifier; do not introduce duplicate file reads.

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL for missing date sort header and behavior tokens.

- [ ] **Step 3: Replace the date header with an accessible button**

In `src/team/tips/templates/employee-reconciliation.html`, replace the first `<th>日期</th>` with:

```html
<th id="employeeDetailDateSortHeader" aria-sort="descending"><button type="button" id="employeeDetailDateSortButton" class="tipout-date-sort-button" aria-label="日期，当前倒序，点击切换为顺序" data-native-onclick="toggleEmployeeDetailDateSort()">日期 <span id="employeeDetailDateSortIcon" aria-hidden="true">↓</span></button></th>
```

- [ ] **Step 4: Add page-local state and header synchronization**

At the top of `employee-reconciliation.js.txt` add:

```js
var employeeDetailDateSort = 'desc';
```

Add:

```js
function syncEmployeeDetailDateSortHeader() {
  var descending = employeeDetailDateSort === 'desc';
  var header = document.getElementById('employeeDetailDateSortHeader');
  var button = document.getElementById('employeeDetailDateSortButton');
  var icon = document.getElementById('employeeDetailDateSortIcon');
  if (header) header.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
  if (icon) icon.textContent = descending ? '↓' : '↑';
  if (button) button.setAttribute('aria-label', descending
    ? '日期，当前倒序，点击切换为顺序'
    : '日期，当前顺序，点击切换为倒序');
}

function toggleEmployeeDetailDateSort() {
  employeeDetailDateSort = employeeDetailDateSort === 'desc' ? 'asc' : 'desc';
  if (employeeDetailViewState && employeeDetailViewState.snapshot) {
    renderEmployeeDetailRange(employeeDetailViewState.snapshot, 'sort');
  } else {
    syncEmployeeDetailDateSortHeader();
  }
}
```

- [ ] **Step 5: Apply sorting after filtering and reset on detail activation**

In `renderEmployeeDetailRange()` change:

```js
var filteredRows = filterEmployeeDetailRows(snapshot.dailyRows, range.start, range.end, attendance);
var rows = TipOutSummaryUi.sortEmployeeDetailRows(filteredRows, employeeDetailDateSort);
employeeDetailViewState = { snapshot: snapshot, range: range, attendance: attendance, rows: rows.slice() };
syncEmployeeDetailDateSortHeader();
```

At the beginning of `renderEmployeeReconciliationDetail(snapshot)` set:

```js
employeeDetailDateSort = 'desc';
```

This is the route/detail activation boundary; later filter-driven calls go only through `renderEmployeeDetailRange()` and therefore retain the direction.

- [ ] **Step 6: Reuse the date-sort button styling in employee details**

Extend the existing `.tipout-page-summary .tipout-date-sort-button` selector group in `src/team/tips/tips-page.css` to also cover `.tipout-page-employee-reconciliation-detail .tipout-date-sort-button` for base, hover, and focus-visible rules. Do not duplicate property blocks.

- [ ] **Step 7: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS with no employee detail date-sort failures.

- [ ] **Step 8: Run production build**

Run: `npm.cmd run build`

Expected: exit code 0. This task does not modify `vendor/emenu-new`, so the eMenu embed build is not required.

- [ ] **Step 9: Verify the browser interaction**

Open an employee detail route and verify:

- the latest date in the selected range is first on initial entry;
- the header displays `日期 ↓` and `aria-sort="descending"`;
- clicking the date header changes to oldest-first, `日期 ↑`, and `aria-sort="ascending"`;
- clicking again restores newest-first;
- changing the date range or attendance status preserves the current direction;
- returning to the employee summary and reopening a detail resets to descending;
- summary totals do not change when only the sort direction changes.

- [ ] **Step 10: Commit the implementation**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/legacy/tipout-summary-ui.js.txt src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/tips-page.css
git commit -m "feat: sort employee detail rows by date"
```

