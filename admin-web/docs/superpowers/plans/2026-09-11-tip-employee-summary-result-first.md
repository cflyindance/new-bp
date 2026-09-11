# Tip Employee Summary Result-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the employee tip-allocation summary around each employee's confirmed final amount, processing state, and focused reconciliation actions while preserving allocation business behavior.

**Architecture:** Keep employee aggregation as a pure shared module in `tipout-summary-ui.js.txt`, and make the distribution page consume one filtered/sorted aggregate collection for metrics, rows, navigation, and export. The page program owns UI state and derives validation signals from existing allocation-result and roster-rule validators; templates and CSS only provide accessible controls and presentation.

**Tech Stack:** Native HTML templates, scoped CSS, browser JavaScript, localStorage-backed TipOut modules, Node.js VM contract tests, Vite.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-employee-summary-result-first-design.md`

## Global Constraints

- Do not change allocation formulas, rule persistence, confirm allocation, cancel allocation, manual-hours entry, payroll synchronization, or role/employee master-data behavior.
- Aggregate employees by stable `employeeId`; names are display values, never aggregation keys.
- Employee monetary totals include only confirmed, validated allocation results.
- Invalid employee totals render as `—` and are excluded from the overview final-total metric.
- Store monetary values as integer cents during aggregation; format only at the rendering/export boundary.
- Status priority is `异常 > 待处理 > 已完成`, and every visible employee belongs to exactly one state.
- Preserve store/date context, detail navigation, return-state restoration, and both date-summary and employee-summary modes.
- Do not stage unrelated generated or dirty files.

---

### Task 1: Build one result-first employee aggregation contract

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt:1-130`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: daily rows shaped as `{ dateKey, allocated, allocationValidationError, ruleIssues, employeeResults[] }` and employee records shaped as `{ employeeId, name, role, hours, before, deducted, received, after }`.
- Produces: `TipOutSummaryUi.aggregateEmployeeDailyDatasets(dailyRows)` returning employee aggregates with `roles`, integer-cent totals, `netAdjustmentCents`, `finalAmountCents`, `hasConfirmedAmount`, `hasPartialConfirmed`, `status`, `issueReasons`, and `firstActionDate`.
- Produces: `TipOutSummaryUi.summarizeEmployeeAggregates(aggregates)` returning `{ employeeCount, finalAmountCents, hasConfirmedAmount, completedCount, pendingCount, exceptionCount }`.
- Produces: `TipOutSummaryUi.filterAndSortEmployeeAggregates(aggregates, filters, sort)` for the page and exporter.

- [ ] **Step 1: Add failing VM tests for cents, status exclusivity, filtering, and sorting**

Add after the existing `summaryUi` setup in `scripts/verify-team-tips-native-views.mjs`:

```js
const employeeDailyFixture = [
  {
    dateKey: "2026-09-10", allocated: true, allocationValidationError: "", ruleIssues: [],
    employeeResults: [
      { employeeId: "e1", name: "Olivia", role: "Server", hours: 8, before: 100.10, deducted: 10.05, received: 20.15, after: 110.20 },
      { employeeId: "e2", name: "Noah", role: "Busser", hours: 6, before: 0, deducted: 0, received: 40, after: 40 },
    ],
  },
  {
    dateKey: "2026-09-11", allocated: false, allocationValidationError: "", ruleIssues: [],
    employeeResults: [
      { employeeId: "e1", name: "Olivia", role: "Bartender", hours: 4, before: 50, deducted: 5, received: 8, after: 53 },
    ],
  },
  {
    dateKey: "2026-09-12", allocated: true, allocationValidationError: "金额校验失败", ruleIssues: [],
    employeeResults: [
      { employeeId: "e3", name: "Emma", role: "Host", hours: 5, before: 25, deducted: 0, received: 10, after: 35 },
    ],
  },
];
const employeeAggregates = summaryUi.aggregateEmployeeDailyDatasets(employeeDailyFixture);
assert.equal(employeeAggregates.length, 3);
const olivia = employeeAggregates.find((item) => item.employeeId === "e1");
assert.deepEqual(Array.from(olivia.roles), ["Server", "Bartender"]);
assert.equal(olivia.beforeCents, 10010);
assert.equal(olivia.netAdjustmentCents, 1010);
assert.equal(olivia.finalAmountCents, 11020);
assert.equal(olivia.status, "待处理");
assert.equal(olivia.hasPartialConfirmed, true);
assert.equal(olivia.firstActionDate, "2026-09-11");
const emma = employeeAggregates.find((item) => item.employeeId === "e3");
assert.equal(emma.status, "异常");
assert.equal(emma.finalAmountCents, null);
assert.deepEqual(Array.from(emma.issueReasons), ["金额校验失败"]);
const employeeOverview = summaryUi.summarizeEmployeeAggregates(employeeAggregates);
assert.deepEqual(JSON.parse(JSON.stringify(employeeOverview)), {
  employeeCount: 3,
  finalAmountCents: 15020,
  hasConfirmedAmount: true,
  completedCount: 1,
  pendingCount: 1,
  exceptionCount: 1,
});
assert.equal(employeeOverview.employeeCount, employeeOverview.completedCount + employeeOverview.pendingCount + employeeOverview.exceptionCount);
const filteredEmployees = summaryUi.filterAndSortEmployeeAggregates(employeeAggregates, { search: "oliv", roles: ["Bartender"], statuses: ["待处理"] }, { key: "finalAmount", direction: "desc" });
assert.deepEqual(Array.from(filteredEmployees, (item) => item.employeeId), ["e1"]);
```

- [ ] **Step 2: Run the verifier and confirm the new contract fails**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the current aggregates do not expose cents, role arrays, exception state, overview summary, or filter/sort helpers.

- [ ] **Step 3: Implement exact integer-cent and status helpers**

Add these private helpers to `tipout-summary-ui.js.txt`:

```js
function toCents(value) {
  var numeric = Number(value);
  return isFinite(numeric) ? Math.round(numeric * 100) : null;
}
function addUnique(list, value) {
  var text = String(value || "").trim();
  if (text && list.indexOf(text) < 0) list.push(text);
}
function resolveAggregateStatus(item) {
  if (item.issueReasons.length) return "异常";
  if (item.pendingAllocationDays > 0) return "待处理";
  return "已完成";
}
```

Rewrite `aggregateEmployeeDailyDatasets` so it:

1. Creates one aggregate per `employeeId`.
2. Adds a day only when `isParticipatingEmployeeRecord(record)` is true.
3. Adds each role to `roles` once.
4. Always aggregates shifts and hours from the existing attendance summarizer.
5. Adds money only for `day.allocated === true` and a blank `day.allocationValidationError`.
6. Marks an allocated invalid day with its validation error, sets all monetary cents to `null`, and excludes that employee from monetary overview totals.
7. Adds `day.ruleIssues[].message` only when its optional `employeeIds` is empty or includes the aggregate employee ID.
8. Sets `hasPartialConfirmed` when at least one related day is confirmed and at least one is pending.
9. Chooses the first issue date for `异常`, otherwise the first pending date for `待处理`.

The returned monetary fields are:

```js
{
  beforeCents: invalid ? null : beforeCents,
  deductedCents: invalid ? null : deductedCents,
  receivedCents: invalid ? null : receivedCents,
  netAdjustmentCents: invalid ? null : receivedCents - deductedCents,
  finalAmountCents: invalid ? null : beforeCents - deductedCents + receivedCents,
  hasConfirmedAmount: confirmedAllocationDays > 0,
}
```

Implement `summarizeEmployeeAggregates` with integer addition only. Include `finalAmountCents` only when `status !== "异常"`, `hasConfirmedAmount === true`, and `finalAmountCents != null`.

Implement `filterAndSortEmployeeAggregates` with:

```js
function filterAndSortEmployeeAggregates(aggregates, filters, sort) {
  var search = String(filters && filters.search || "").trim().toLocaleLowerCase();
  var roles = filters && Array.isArray(filters.roles) ? filters.roles : [];
  var statuses = filters && Array.isArray(filters.statuses) ? filters.statuses : [];
  var result = (aggregates || []).filter(function (item) {
    return (!search || String(item.name || "").toLocaleLowerCase().indexOf(search) >= 0) &&
      (!roles.length || item.roles.some(function (role) { return roles.indexOf(role) >= 0; })) &&
      (!statuses.length || statuses.indexOf(item.status) >= 0);
  });
  var key = sort && sort.key || "finalAmount";
  var direction = sort && sort.direction === "asc" ? 1 : -1;
  return result.slice().sort(function (a, b) {
    if (key === "employee") return direction * String(a.name).localeCompare(String(b.name));
    var field = key === "hours" ? "hours" : "finalAmountCents";
    if (a[field] == null && b[field] == null) return String(a.name).localeCompare(String(b.name));
    if (a[field] == null) return 1;
    if (b[field] == null) return -1;
    return direction * (a[field] - b[field]) || String(a.name).localeCompare(String(b.name));
  });
}
```

Export both new helpers through `root.TipOutSummaryUi`.

- [ ] **Step 4: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS, including exact cents, role de-duplication, status counts, null invalid totals, and deterministic sorting.

- [ ] **Step 5: Commit the shared aggregation contract**

```bash
git add src/team/tips/legacy/tipout-summary-ui.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: add result-first employee tip aggregation"
```

---

### Task 2: Add employee-only filters, result metrics, and accessible table structure

**Files:**
- Modify: `src/team/tips/templates/distribution.html:135-235`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: existing summary-view switching and date/store fields.
- Produces: controls `employeeSummarySearch`, `employeeSummaryRoleFilter`, and `employeeSummaryStatusFilter`; semantic employee metric IDs; sortable table-header buttons.

- [ ] **Step 1: Add failing template-contract assertions**

Add verifier checks for these unique IDs:

```js
for (const id of [
  "employeeSummarySearch", "employeeSummaryRoleFilter", "employeeSummaryStatusFilter",
  "employeeMetricCount", "employeeMetricFinal", "employeeMetricCompleted", "employeeMetricPending",
  "employeeSortEmployee", "employeeSortHours", "employeeSortFinalAmount",
]) {
  if ((distributionTemplate.match(new RegExp(`id="${id}"`, "g")) || []).length !== 1) {
    failures.push(`distribution: ${id} must be unique`);
  }
}
for (const removedHeading of [">分配前</th>", ">扣除</th>", ">分配获得</th>", ">实际获得</th>"]) {
  if (distributionTemplate.includes(removedHeading)) failures.push(`employee summary: legacy process column returned ${removedHeading}`);
}
```

- [ ] **Step 2: Run verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL for missing employee-only controls, result metrics, and sort buttons.

- [ ] **Step 3: Add employee-only controls inside the existing white filter surface**

Keep the common date range. Add a container with `id="employeeSummaryFilters"` that is hidden in date mode and contains:

```html
<div class="filter-field tipout-employee-search-field">
  <label class="filter-field-label" for="employeeSummarySearch">搜索员工</label>
  <input id="employeeSummarySearch" class="form-control form-control-lg" type="search" placeholder="输入员工姓名" data-native-oninput="handleEmployeeSummaryFilterChange()">
</div>
<div class="filter-field">
  <label class="filter-field-label" for="employeeSummaryRoleFilter">角色</label>
  <select id="employeeSummaryRoleFilter" class="form-control form-control-lg" data-native-onchange="handleEmployeeSummaryFilterChange()"><option value="">全部角色</option></select>
</div>
<div class="filter-field">
  <label class="filter-field-label" for="employeeSummaryStatusFilter">状态</label>
  <select id="employeeSummaryStatusFilter" class="form-control form-control-lg" data-native-onchange="handleEmployeeSummaryFilterChange()">
    <option value="">全部状态</option><option value="已完成">已完成</option><option value="待处理">待处理</option><option value="异常">异常</option>
  </select>
</div>
```

The existing date-mode `roleFilterField`, `employeeFilterField`, and `dateSortField` remain date-only. Do not change the store/date input IDs.

- [ ] **Step 4: Replace the employee-mode overview and table markup**

Keep the existing date metric strip unchanged. Add an employee metric strip in `employeeReconciliationPanel` before the table:

```html
<div id="employeeSummaryMetrics" class="tipout-metric-strip tipout-employee-metrics" aria-label="员工分配结果概览">
  <div><span>员工人数</span><strong id="employeeMetricCount">0</strong></div>
  <div class="is-primary"><span>最终获得合计</span><strong id="employeeMetricFinal">—</strong><small>仅统计已确认且校验通过的分配结果</small></div>
  <div><span>已完成</span><strong id="employeeMetricCompleted">0</strong></div>
  <div><span>待处理</span><strong id="employeeMetricPending">0</strong><small id="employeeMetricExceptions" hidden></small></div>
</div>
```

Replace the employee table header with:

```html
<thead><tr>
  <th aria-sort="none"><button id="employeeSortEmployee" type="button" class="tipout-table-sort" data-native-onclick="toggleEmployeeSummarySort('employee')">员工</button></th>
  <th>角色</th><th>班次</th>
  <th aria-sort="none"><button id="employeeSortHours" type="button" class="tipout-table-sort" data-native-onclick="toggleEmployeeSummarySort('hours')">工时</button></th>
  <th>原有小费</th><th>净调整</th>
  <th aria-sort="descending"><button id="employeeSortFinalAmount" type="button" class="tipout-table-sort" data-native-onclick="toggleEmployeeSummarySort('finalAmount')">最终获得 <span aria-hidden="true">↓</span></button></th>
  <th>状态</th><th aria-label="进入明细"></th>
</tr></thead>
```

- [ ] **Step 5: Add scoped responsive styling**

Add CSS for role-tag wrapping, emphasized final amount, muted “已确认部分”, error/pending/completed status colors, sortable header focus/arrow state, metric helper copy, and a minimum employee-table width of `1040px`. At the existing mobile breakpoint, stack employee filters to full width and render the employee metric strip as two columns. Do not alter date-summary styles.

- [ ] **Step 6: Run verifier and production build**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: exit code 0; existing chunk-size warnings are acceptable.

- [ ] **Step 7: Commit the accessible structure**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: add result-first employee summary layout"
```

---

### Task 3: Connect validation, filtering, sorting, metrics, and return state

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt:260-790,1000-1040`
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt:20-45`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: Task 1 aggregation/filter/sort helpers and Task 2 control IDs.
- Produces: `employeeSummaryFilters`, `employeeSummarySort`, `buildEmployeeSummaryDailyDataset()`, `renderEmployeeSummaryMetrics()`, `handleEmployeeSummaryFilterChange()`, and `toggleEmployeeSummarySort(key)`.

- [ ] **Step 1: Add failing state-restoration and source-contract tests**

Extend the existing history-state VM assertions:

```js
const employeeState = summaryUi.buildSummaryHistoryState({
  activeView: "employee", employeeSearch: "oli", employeeSummaryRole: "Server",
  employeeSummaryStatus: "待处理", employeeSortKey: "hours", employeeSortDirection: "asc",
});
const restoredEmployeeState = summaryUi.readSummaryHistoryState(employeeState);
assert.equal(restoredEmployeeState.employeeSearch, "oli");
assert.equal(restoredEmployeeState.employeeSummaryRole, "Server");
assert.equal(restoredEmployeeState.employeeSummaryStatus, "待处理");
assert.equal(restoredEmployeeState.employeeSortKey, "hours");
assert.equal(restoredEmployeeState.employeeSortDirection, "asc");
for (const token of [
  "buildEmployeeSummaryDailyDataset", "renderEmployeeSummaryMetrics",
  "handleEmployeeSummaryFilterChange", "toggleEmployeeSummarySort",
]) if (!distributionProgram.includes(token)) failures.push(`employee summary program missing ${token}`);
```

- [ ] **Step 2: Run verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because employee filter/sort state and renderer functions do not exist.

- [ ] **Step 3: Extend history state without breaking date-summary restoration**

Add these fields to `buildSummaryHistoryState`:

```js
employeeSearch: String(values.employeeSearch || ""),
employeeSummaryRole: String(values.employeeSummaryRole || ""),
employeeSummaryStatus: String(values.employeeSummaryStatus || ""),
employeeSortKey: ["employee", "hours", "finalAmount"].indexOf(values.employeeSortKey) >= 0 ? values.employeeSortKey : "finalAmount",
employeeSortDirection: values.employeeSortDirection === "asc" ? "asc" : "desc",
```

Existing saved states without these fields must restore to empty filters and final-amount descending.

- [ ] **Step 4: Add employee view state and existing-validator adapters**

Initialize:

```js
var employeeSummaryFilters = { search: "", roles: [], statuses: [] };
var employeeSummarySort = { key: "finalAmount", direction: "desc" };
```

Add `buildEmployeeSummaryDailyDataset()` as an adapter around `buildDailyDataset(getStoreEmployees())`. For each date row:

1. Read the confirmed snapshot only when `row.allocated` is true.
2. Set `allocationValidationError` to `TipOutAllocationResults.validate(snapshot)`; when an allocated date has no snapshot, set `"已分配日期缺少确认结果"`.
3. For unallocated dates only, call `TipOutRosterDirectory.validateRuleReferences(rule, store)` for current-store rules and normalize each existing issue to `{ code, message, employeeIds }`.
4. Map codes to fixed messages: `missing-role → 角色失效`, `missing-employee → 员工失效`, `empty-receiver → 接收方无有效员工`; include a roster employee ID only when the referenced value resolves to an existing employee.
5. Do not commit, repair, or recalculate allocation results.

- [ ] **Step 5: Populate employee filters and switch their visibility by view**

In `syncSummaryViewControls`, show `employeeSummaryFilters` only for employee view. Keep date role/employee/sort controls hidden in employee view.

Populate the role select from the unique roles in `getStoreEmployees()` after store initialization/change. Preserve a selected role only if it still exists; otherwise reset to all roles.

Implement:

```js
function handleEmployeeSummaryFilterChange() {
  employeeSummaryFilters = {
    search: document.getElementById("employeeSummarySearch").value,
    roles: document.getElementById("employeeSummaryRoleFilter").value ? [document.getElementById("employeeSummaryRoleFilter").value] : [],
    statuses: document.getElementById("employeeSummaryStatusFilter").value ? [document.getElementById("employeeSummaryStatusFilter").value] : [],
  };
  renderSummaryViews();
}
function toggleEmployeeSummarySort(key) {
  employeeSummarySort = employeeSummarySort.key === key
    ? { key: key, direction: employeeSummarySort.direction === "asc" ? "desc" : "asc" }
    : { key: key, direction: key === "employee" ? "asc" : "desc" };
  renderSummaryViews();
}
```

Update `aria-sort` and visible arrow state after every sort change.

- [ ] **Step 6: Render one filtered collection into metrics and rows**

In employee mode:

```js
var employeeDailyRows = buildEmployeeSummaryDailyDataset();
var allAggregates = TipOutSummaryUi.aggregateEmployeeDailyDatasets(employeeDailyRows);
var visibleAggregates = TipOutSummaryUi.filterAndSortEmployeeAggregates(allAggregates, employeeSummaryFilters, employeeSummarySort);
renderEmployeeSummaryMetrics(visibleAggregates);
renderEmployeeReconciliationList(visibleAggregates);
```

`renderEmployeeSummaryMetrics` uses `summarizeEmployeeAggregates`. Format `finalAmountCents / 100` only when `hasConfirmedAmount`; otherwise show `—`. Show `另有异常 N 人` only when `exceptionCount > 0`.

Change `renderEmployeeReconciliationList` to accept aggregates rather than daily rows. Render:

- `roles` as de-duplicated tags.
- money as `—` when cents are null or there is no confirmed amount.
- net adjustment with `+` only when positive and red styling only when negative.
- final amount as the emphasized cell, with `已确认部分` when `hasPartialConfirmed`.
- one of `is-complete`, `is-pending`, or `is-exception` status classes; exception text includes `（N）`.

Use `aggregate.firstActionDate` when opening detail so pending/error rows can locate the first actionable date. Keep employee ID, store, and date range in the existing detail URL.

- [ ] **Step 7: Persist and restore employee UI state**

Pass the five employee search/sort fields into `captureSummaryUiState`. In the existing restore path, set the three controls and `employeeSummarySort` before rendering, then preserve current scroll restoration. Existing date-summary state remains unchanged.

- [ ] **Step 8: Run verifier and browser-check interactions**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Browser checks:

1. Employee view defaults to final amount descending.
2. Search, role, and state filters update both metrics and rows.
3. Employee count equals completed + pending + exception.
4. Pending partial values show `已确认部分`; invalid values show `—`.
5. Clicking each sortable header updates arrow and `aria-sort`.
6. Opening an employee and returning restores filters, sorting, and scroll.
7. Switching back to date view restores the original date-only controls and metrics.

- [ ] **Step 9: Commit connected employee summary behavior**

```bash
git add src/team/tips/programs/distribution.js.txt src/team/tips/legacy/tipout-summary-ui.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: connect employee tip summary interactions"
```

---

### Task 4: Align CSV/PDF/email export with the visible employee result set

**Files:**
- Modify: `src/team/tips/legacy/export.js.txt`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: the Task 3 function `getVisibleEmployeeSummaryAggregates()` returning the current filtered and sorted aggregate array.
- Produces: employee export rows with separate before/deducted/received/net/final values, status, and issue reason while keeping existing date exports untouched.

- [ ] **Step 1: Add failing export-contract assertions**

```js
for (const token of [
  "getVisibleEmployeeSummaryAggregates()", "netAdjustment", "issueReasons",
  "Net Adjustment($)", "Exception Reason",
]) if (!distributionExport.includes(token)) failures.push(`employee export missing ${token}`);
```

- [ ] **Step 2: Run verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because exports still rebuild unfiltered aggregates and omit net adjustment/exception reason.

- [ ] **Step 3: Expose the exact visible aggregate collection**

In `distribution.js.txt`, store the latest unformatted visible collection and expose:

```js
var visibleEmployeeSummaryAggregates = [];
function getVisibleEmployeeSummaryAggregates() {
  return visibleEmployeeSummaryAggregates.slice();
}
```

Refresh the variable before rendering metrics and rows. This makes page, navigation, and export consume one ordering and filtering result.

- [ ] **Step 4: Map employee export rows without coercing missing money to zero**

Replace the employee collection in `collectEmployeeReconciliationExportData` with `getVisibleEmployeeSummaryAggregates()` and map:

```js
{
  employeeId: aggregate.employeeId,
  name: aggregate.name,
  role: aggregate.roles.join(" / "),
  shifts: aggregate.shifts + " 个班次",
  hours: formatHoursDisplay(aggregate.hours) + " h",
  before: aggregate.beforeCents == null || !aggregate.hasConfirmedAmount ? null : aggregate.beforeCents / 100,
  deducted: aggregate.deductedCents == null || !aggregate.hasConfirmedAmount ? null : aggregate.deductedCents / 100,
  received: aggregate.receivedCents == null || !aggregate.hasConfirmedAmount ? null : aggregate.receivedCents / 100,
  netAdjustment: aggregate.netAdjustmentCents == null || !aggregate.hasConfirmedAmount ? null : aggregate.netAdjustmentCents / 100,
  after: aggregate.finalAmountCents == null || !aggregate.hasConfirmedAmount ? null : aggregate.finalAmountCents / 100,
  status: aggregate.status,
  issueReasons: aggregate.issueReasons.join("；"),
}
```

Update CSV, jsPDF, print-PDF fallback, and email table builders to use the columns:

`Employee, Role, Shifts, Hours, Original Tips($), Deducted($), Received($), Net Adjustment($), Final Amount($), Status, Exception Reason`.

Use an export formatter that returns an empty string for `null`; do not use `Number(value || 0)`, which would turn unknown amounts into `$0.00`.

- [ ] **Step 5: Run complete verification and build**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: exit code 0; existing chunk-size warnings are acceptable.

- [ ] **Step 6: Browser-check all employee export paths**

Apply a search, role, state, and non-default sort, then verify:

1. CSV contains every filtered employee in the visible sort order and includes separate deducted/received/net/final fields.
2. Invalid amounts are blank, not zero, and the reason column is populated.
3. PDF and print fallback use the same field order and values.
4. Email preview uses the same employee collection.
5. Switching to date mode leaves date CSV/PDF/email content unchanged.

- [ ] **Step 7: Commit export alignment**

```bash
git add src/team/tips/legacy/export.js.txt src/team/tips/programs/distribution.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: align employee tip summary exports"
```

## Final Verification

- [ ] Run `node scripts/verify-team-tips-native-views.mjs` and confirm PASS.
- [ ] Run `npm.cmd run build` and confirm exit code 0.
- [ ] Verify employee and date tabs at desktop and mobile widths.
- [ ] Verify amount conservation using integer cents and the employee status-count identity.
- [ ] Inspect `git status --short` and stage only the files listed by the four tasks.

## Self-Review

- Spec coverage: the plan covers result-first metrics, unique employee aggregation, related-date state, confirmed-only money, invalid-money exclusion, role de-duplication, partial-result labeling, search/filter/sort, navigation restoration, export parity, empty/error behavior, responsive presentation, and preservation of allocation business logic.
- Placeholder scan: all implementation functions, input shapes, state fields, selectors, fixed copy, status rules, tests, commands, and commit scopes are specified; no deferred implementation remains.
- Type consistency: `aggregateEmployeeDailyDatasets`, `summarizeEmployeeAggregates`, `filterAndSortEmployeeAggregates`, `buildEmployeeSummaryDailyDataset`, and `getVisibleEmployeeSummaryAggregates` retain the same names and shapes across tasks.
