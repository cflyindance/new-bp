# TipOut Employee Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a “日期任务 / 员工对账” switch to the TipOut summary, aggregate the current filtered date range by employee, and provide a read-only employee daily reconciliation page without changing existing allocation behavior.

**Architecture:** Keep `dist/TipOut/index.html` as the single summary controller and build one shared daily dataset from the existing `getDailyEmployeeResults()` / `genDailyTip()` chain. Add pure aggregation, status, navigation, and snapshot helpers to `tipout-summary-ui.js`; the employee detail page consumes only a validated, versioned `sessionStorage` snapshot and never recalculates or writes allocation data. Render only the active summary panel while preserving the existing date view as the default and compatibility entry point.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser `history` and `sessionStorage`, Node.js `assert` + `vm` verification scripts, existing Vite/TypeScript project build.

**Spec:** `docs/superpowers/specs/2026-09-03-tipout-employee-reconciliation-design.md`

## Global Constraints

- Existing TipOut allocation formulas, rule serialization, allocated-date storage, export behavior, Payroll synchronization, and date-detail behavior must not change.
- “日期任务” remains the default view and preserves the current table, row activation, filters, summary metrics, and actions.
- Both views reuse the existing date, store, role, and employee filters; employee mode adds no search or status filter.
- Employee list and detail are read-only derived views; they write no new business data and never use `localStorage` for navigation data.
- Employee aggregation and navigation use durable `employeeId`, never `name + role`; legacy calculation inputs and lookup keys remain unchanged.
- Only participating records (non-zero financial amount or `hours > 0`) enter employee aggregation and status checks.
- Visual direction is a restrained, high-density operations workbench: preserve the existing TipOut neutral surfaces and typography, use amber only for focus/pending emphasis, and reproduce the approved visual companion rather than introducing a new theme.
- This work does not modify `vendor/emenu-new`; the eMenu embed build rule is therefore not triggered.
- Preserve all unrelated dirty-worktree changes and use path-scoped commits.

---

### Task 1: Add pure reconciliation contracts and executable verification

**Files:**
- Create: `scripts/verify-tipout-employee-reconciliation.mjs`
- Modify: `dist/TipOut/tipout-summary-ui.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: Existing `summarizeDailyResults(records)`, `buildSummaryHistoryState(values)`, and `readSummaryHistoryState(state)`.
- Produces: `TipOutSummaryUi.isParticipatingEmployeeRecord(record)`, `resolveRequiresAttendance(rules)`, `aggregateEmployeeDailyDatasets(dailyRows)`, `resolveSummaryView(historyState, queryView)`, `buildEmployeeReconciliationDetailUrl(context)`, `buildEmployeeReconciliationSnapshot(values)`, `readEmployeeReconciliationSnapshot(raw, context)`, and `EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY`.
- `aggregateEmployeeDailyDatasets()` returns ordered records shaped as `{ employeeId, name, role, shifts, hours, before, deducted, received, after, status, missingAttendanceDays, pendingAllocationDays, dailyRows }`.

- [ ] **Step 1: Write the failing helper verification script**

Create `scripts/verify-tipout-employee-reconciliation.mjs` with the same `vm.runInContext()` loading pattern as `verify-tipout-interaction-refresh.mjs`, then add exact assertions for the approved contracts:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const helperPath = path.join(root, 'dist/TipOut/tipout-summary-ui.js');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(helperPath, 'utf8'), context);
const ui = context.window.TipOutSummaryUi;

assert.equal(ui.isParticipatingEmployeeRecord({ before: 0, deducted: 0, received: 0, after: 0, hours: 0 }), false);
assert.equal(ui.isParticipatingEmployeeRecord({ before: 0, deducted: 0, received: 0, after: 0, hours: 4 }), true);
assert.equal(ui.resolveRequiresAttendance([]), true);
assert.equal(ui.resolveRequiresAttendance([{ clockin: 'noclock' }, { clockin: 'noclock' }]), false);
assert.equal(ui.resolveRequiresAttendance([{ clockin: 'noclock' }, { clockin: 'clock' }]), true);

const rows = [
  {
    dateKey: '2026-01-01', allocated: true, requiresAttendance: true,
    employeeResults: [
      { employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 20, deducted: 3, received: 5, after: 22, hours: 8, clockStatus: '已打卡' },
      { employeeId: 'roster:b', name: 'Alex', role: 'Server', before: 10, deducted: 1, received: 2, after: 11, hours: 0, clockStatus: '未打卡' }
    ]
  },
  {
    dateKey: '2026-01-02', allocated: false, requiresAttendance: false,
    employeeResults: [
      { employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 12, deducted: 2, received: 4, after: 14, hours: 6, clockStatus: '未打卡' },
      { employeeId: 'roster:zero', name: 'Zero', role: 'Host', before: 0, deducted: 0, received: 0, after: 0, hours: 0, clockStatus: '未打卡' }
    ]
  }
];
const aggregates = JSON.parse(JSON.stringify(ui.aggregateEmployeeDailyDatasets(rows)));
assert.equal(aggregates.length, 2);
assert.deepEqual(aggregates.map((row) => row.employeeId), ['roster:a', 'roster:b']);
assert.deepEqual(aggregates[0], {
  employeeId: 'roster:a', name: 'Alex', role: 'Server', shifts: 2, hours: 14,
  before: 32, deducted: 5, received: 9, after: 36, status: '待补录',
  missingAttendanceDays: 0, pendingAllocationDays: 1,
  dailyRows: [
    { dateKey: '2026-01-01', allocated: true, requiresAttendance: true, employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 20, deducted: 3, received: 5, after: 22, hours: 8, clockStatus: '已打卡' },
    { dateKey: '2026-01-02', allocated: false, requiresAttendance: false, employeeId: 'roster:a', name: 'Alex', role: 'Server', before: 12, deducted: 2, received: 4, after: 14, hours: 6, clockStatus: '未打卡' }
  ]
});
assert.equal(aggregates[1].status, '待补录');
assert.equal(aggregates[1].missingAttendanceDays, 1);

assert.equal(ui.resolveSummaryView({ tipoutSummaryUiState: { activeView: 'date' } }, 'employee'), 'date');
assert.equal(ui.resolveSummaryView({ tipoutSummaryUiState: {} }, 'employee'), 'date');
assert.equal(ui.resolveSummaryView(null, 'employee'), 'employee');
assert.equal(ui.resolveSummaryView(null, 'unknown'), 'date');

const detailUrl = ui.buildEmployeeReconciliationDetailUrl({
  employeeId: 'roster:a/b', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
});
assert.equal(detailUrl, 'employee-reconciliation-detail.html?employeeId=roster%3Aa%2Fb&store=Downtown%20LA&start=2026-01-01&end=2026-01-02&from=summary&return=history');

const snapshot = ui.buildEmployeeReconciliationSnapshot({
  employeeId: 'roster:a', name: 'Alex', role: 'Server', store: 'Downtown LA',
  dateStart: '2026-01-01', dateEnd: '2026-01-02', createdAt: 123,
  dailyRows: aggregates[0].dailyRows, summary: aggregates[0], status: '待补录'
});
assert.equal(ui.readEmployeeReconciliationSnapshot(JSON.stringify(snapshot), {
  employeeId: 'roster:a', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
}).employeeId, 'roster:a');
assert.equal(ui.readEmployeeReconciliationSnapshot(JSON.stringify(snapshot), {
  employeeId: 'roster:b', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
}), null);
assert.equal(ui.readEmployeeReconciliationSnapshot('{bad json', {
  employeeId: 'roster:a', store: 'Downtown LA', dateStart: '2026-01-01', dateEnd: '2026-01-02'
}), null);

const legacyState = ui.buildSummaryHistoryState({
  dateStart: '2026-01-01', dateEnd: '2026-01-02', store: 'Downtown LA',
  roles: ['Server'], employees: ['Alex'], scrollY: 320, returnDate: '2026-01-02'
});
assert.equal(legacyState.tipoutSummaryUiState.activeView, 'date');
assert.equal(legacyState.tipoutSummaryUiState.returnDate, '2026-01-02');
assert.equal(legacyState.tipoutSummaryUiState.scrollY, 320);

console.log('TipOut employee reconciliation verification passed.');
```

- [ ] **Step 2: Register and run the test to verify it fails**

Add the package script:

```json
"verify:tipout-employee-reconciliation": "node scripts/verify-tipout-employee-reconciliation.mjs"
```

Run: `npm run verify:tipout-employee-reconciliation`

Expected: FAIL because `isParticipatingEmployeeRecord` and the other new helpers are not defined.

- [ ] **Step 3: Implement the pure helpers without changing calculation code**

Add pure functions to `tipout-summary-ui.js`. Use `employeeId` as the only grouping key, copy each qualifying daily row with its date-level flags, preserve first-seen employee order, and compute status after aggregation:

```js
var EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY = 'tipout-employee-reconciliation-detail-v1';

function isParticipatingEmployeeRecord(record) {
  return ['before', 'deducted', 'received', 'after'].some(function (key) {
    return number(record && record[key]) !== 0;
  }) || number(record && record.hours) > 0;
}

function resolveRequiresAttendance(rules) {
  if (!Array.isArray(rules) || rules.length === 0) return true;
  return rules.some(function (rule) { return !rule || rule.clockin !== 'noclock'; });
}

function aggregateEmployeeDailyDatasets(dailyRows) {
  var order = [];
  var byId = Object.create(null);
  (dailyRows || []).forEach(function (day) {
    (day.employeeResults || []).forEach(function (record) {
      if (!record || !record.employeeId || !isParticipatingEmployeeRecord(record)) return;
      var employeeId = String(record.employeeId);
      if (!byId[employeeId]) {
        byId[employeeId] = {
          employeeId: employeeId, name: record.name || '', role: record.role || '',
          shifts: 0, hours: 0, before: 0, deducted: 0, received: 0, after: 0,
          status: '已完成', missingAttendanceDays: 0, pendingAllocationDays: 0, dailyRows: []
        };
        order.push(employeeId);
      }
      var aggregate = byId[employeeId];
      var daily = Object.assign({
        dateKey: day.dateKey || '', allocated: !!day.allocated,
        requiresAttendance: day.requiresAttendance !== false
      }, record);
      aggregate.dailyRows.push(daily);
      aggregate.shifts += number(record.hours) > 0 ? 1 : 0;
      aggregate.hours += number(record.hours);
      aggregate.before += number(record.before);
      aggregate.deducted += number(record.deducted);
      aggregate.received += number(record.received);
      aggregate.after += number(record.after);
      if (!day.allocated) aggregate.pendingAllocationDays += 1;
      if (day.requiresAttendance !== false && record.clockStatus === '未打卡') {
        aggregate.missingAttendanceDays += 1;
      }
    });
  });
  return order.map(function (employeeId) {
    var aggregate = byId[employeeId];
    aggregate.status = aggregate.pendingAllocationDays || aggregate.missingAttendanceDays ? '待补录' : '已完成';
    return aggregate;
  });
}

function resolveSummaryView(historyState, queryView) {
  var saved = readSummaryHistoryState(historyState);
  if (saved) return saved.activeView === 'employee' ? 'employee' : 'date';
  return queryView === 'employee' ? 'employee' : 'date';
}
```

Implement URL and snapshot builders with the exact field names from the spec:

```js
function buildEmployeeReconciliationDetailUrl(context) {
  var query = [
    'employeeId=' + encodeURIComponent(context.employeeId || ''),
    'store=' + encodeURIComponent(context.store || ''),
    'start=' + encodeURIComponent(context.dateStart || ''),
    'end=' + encodeURIComponent(context.dateEnd || ''),
    'from=summary',
    'return=history'
  ];
  return 'employee-reconciliation-detail.html?' + query.join('&');
}

function buildEmployeeReconciliationSnapshot(values) {
  return {
    version: 1,
    employeeId: String(values.employeeId || ''),
    name: String(values.name || ''),
    role: String(values.role || ''),
    store: String(values.store || ''),
    dateStart: String(values.dateStart || ''),
    dateEnd: String(values.dateEnd || ''),
    createdAt: Number(values.createdAt) || Date.now(),
    dailyRows: Array.isArray(values.dailyRows) ? values.dailyRows.map(function (row) { return Object.assign({}, row); }) : [],
    summary: Object.assign({}, values.summary || {}),
    status: values.status === '已完成' ? '已完成' : '待补录'
  };
}

function readEmployeeReconciliationSnapshot(raw, context) {
  try {
    var value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!value || value.version !== 1 || !Array.isArray(value.dailyRows)) return null;
    ['employeeId', 'name', 'role', 'store', 'dateStart', 'dateEnd'].forEach(function (key) {
      if (typeof value[key] !== 'string') throw new Error('invalid snapshot scalar');
    });
    if (!value.employeeId || !value.dateStart || !value.dateEnd) return null;
    if (!value.summary || typeof value.summary !== 'object') return null;
    if (value.status !== '已完成' && value.status !== '待补录') return null;
    var validRows = value.dailyRows.every(function (row) {
      return row && typeof row.dateKey === 'string' && typeof row.allocated === 'boolean' &&
        typeof row.requiresAttendance === 'boolean' && typeof row.employeeId === 'string' &&
        row.employeeId === value.employeeId && typeof row.name === 'string' && typeof row.role === 'string' &&
        ['before', 'deducted', 'received', 'after', 'hours'].every(function (key) { return isFinite(Number(row[key])); }) &&
        typeof row.clockStatus === 'string';
    });
    if (!validRows) return null;
    if (!context || value.employeeId !== context.employeeId || value.store !== context.store ||
        value.dateStart !== context.dateStart || value.dateEnd !== context.dateEnd) return null;
    return value;
  } catch (error) {
    return null;
  }
}
```

Expose the complete helper surface explicitly:

```js
root.TipOutSummaryUi = {
  summarizeDailyResults: summarizeDailyResults,
  countPendingDates: countPendingDates,
  buildDetailUrl: buildDetailUrl,
  buildSummaryHistoryState: buildSummaryHistoryState,
  readSummaryHistoryState: readSummaryHistoryState,
  isParticipatingEmployeeRecord: isParticipatingEmployeeRecord,
  resolveRequiresAttendance: resolveRequiresAttendance,
  aggregateEmployeeDailyDatasets: aggregateEmployeeDailyDatasets,
  resolveSummaryView: resolveSummaryView,
  buildEmployeeReconciliationDetailUrl: buildEmployeeReconciliationDetailUrl,
  buildEmployeeReconciliationSnapshot: buildEmployeeReconciliationSnapshot,
  readEmployeeReconciliationSnapshot: readEmployeeReconciliationSnapshot,
  EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY: EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY
};
```

- [ ] **Step 4: Extend history state compatibly**

Update `buildSummaryHistoryState()` so omitted new fields retain legacy behavior:

```js
activeView: values.activeView === 'employee' ? 'employee' : 'date',
returnDate: values.returnDate || '',
returnEmployeeId: values.returnEmployeeId || ''
```

Do not remove or rename the existing filter, scroll, or `returnDate` fields.

- [ ] **Step 5: Run the helper and existing interaction tests**

Run: `npm run verify:tipout-employee-reconciliation`

Expected: PASS and print `TipOut employee reconciliation verification passed.`

Run: `npm run verify:tipout-interaction-refresh`

Expected: PASS and retain existing date-detail/history assertions.

- [ ] **Step 6: Commit the helper contract**

```bash
git add package.json dist/TipOut/tipout-summary-ui.js scripts/verify-tipout-employee-reconciliation.mjs
git commit -m "test: define tipout employee reconciliation contracts"
```

---

### Task 2: Add the summary view switch and employee aggregation table

**Files:**
- Modify: `dist/TipOut/index.html`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Modify: `scripts/verify-tipout-employee-reconciliation.mjs`

**Interfaces:**
- Consumes: All helpers from Task 1; existing `getDateRange()`, `getDailyEmployeeResults(dateKey)`, `getAllocatedDates()`, `renderSummaryOverview()`, and filter handlers.
- Produces: `buildDailyDataset()`, `setSummaryView(view)`, `renderSummaryViews()`, `renderEmployeeReconciliationList(dailyRows)`, `openEmployeeReconciliationDetail(employeeId)`, and `activeSummaryView`.
- Keeps `renderDailySummaryList()` as the compatibility entry point used by existing inline filter handlers.

- [ ] **Step 1: Add failing static page-contract assertions**

Append exact checks to the verification script:

```js
const indexPath = path.join(root, 'dist/TipOut/index.html');
const cssPath = path.join(root, 'dist/TipOut/prototype-fidelity.css');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

for (const id of [
  'summaryViewSwitch', 'dateTaskTab', 'employeeReconciliationTab',
  'dateTaskPanel', 'employeeReconciliationPanel', 'employeeReconciliationList',
  'employeeReconciliationEmpty'
]) assert.match(indexHtml, new RegExp(`id="${id}"`));
assert.match(indexHtml, /function buildDailyDataset\(\)/);
assert.match(indexHtml, /function setSummaryView\(view\)/);
assert.match(indexHtml, /function renderEmployeeReconciliationList\(dailyRows\)/);
assert.match(indexHtml, /function openEmployeeReconciliationDetail\(employeeId\)/);
assert.match(indexHtml, /data-employee-id/);
assert.match(indexHtml, /sessionStorage\.setItem\(TipOutSummaryUi\.EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY/);
assert.match(css, /\.tipout-view-switch/);
assert.match(css, /\.tipout-employee-row/);
assert.match(css, /\.tipout-employee-status/);
```

- [ ] **Step 2: Run the static contract to verify it fails**

Run: `npm run verify:tipout-employee-reconciliation`

Expected: FAIL on missing `summaryViewSwitch`.

- [ ] **Step 3: Preserve durable employee IDs at the page boundary**

Add fixed `employeeId` values to every `DEFAULT_EMPLOYEES` item, using the `fallback:<slug>` namespace. In `buildEmployeesFromRoster()`, keep existing numeric/business fields, reject entries without their required persisted roster `id`, and add:

```js
employeeId: 'roster:' + String(e.id).trim()
```

Reject roster entries without both a non-empty `id` and name; if no valid roster entries remain, use the fixed fallback list. In `getDailyEmployeeResults()`, attach identity after the legacy calculation completes:

```js
function getDailyEmployeeResults(dateKey) {
  return getFilteredEmployees().map(function (emp) {
    return Object.assign({ employeeId: emp.employeeId, name: emp.name, role: emp.role }, genDailyTip(emp, dateKey));
  });
}
```

Do not pass `employeeId` into `TipAllocation.runLegacyDayPipeline()` or alter its `byName` lookup.

- [ ] **Step 4: Add the accessible view switch at the filter row’s right edge**

Append a fifth filter-row child after the employee filter:

```html
<div class="tipout-view-switch" id="summaryViewSwitch" role="tablist" aria-label="汇总视图">
  <button type="button" id="dateTaskTab" role="tab" aria-selected="true"
    aria-controls="dateTaskPanel" tabindex="0" onclick="setSummaryView('date')">日期任务</button>
  <button type="button" id="employeeReconciliationTab" role="tab" aria-selected="false"
    aria-controls="employeeReconciliationPanel" tabindex="-1" onclick="setSummaryView('employee')">员工对账</button>
</div>
```

Keep all four existing filters visible in employee mode. Add left/right arrow-key handling so keyboard focus and selection move between the two tabs.

- [ ] **Step 5: Add lazy-rendered tab panels without changing the date table contract**

Wrap the existing table in `dateTaskPanel` and add a hidden employee panel. The employee panel contains the approved columns and an explicit empty state:

```html
<div id="dateTaskPanel" role="tabpanel" aria-labelledby="dateTaskTab">
  <div class="tipout-table-wrap">
    <table class="data-table tipout-summary-table">
      <thead><tr><th>日期</th><th>状态</th><th>分配前</th><th>扣除</th><th>分得</th><th>分配后</th><th aria-label="进入明细"></th></tr></thead>
      <tbody id="dailySummaryList" aria-label="每日小费分配汇总"></tbody>
    </table>
  </div>
</div>
<div id="employeeReconciliationPanel" role="tabpanel" aria-labelledby="employeeReconciliationTab" hidden>
  <div class="tipout-table-wrap">
    <table class="data-table tipout-summary-table tipout-employee-table">
      <thead><tr><th>员工</th><th>角色</th><th>班次 / 工时</th><th>分配前</th><th>扣除</th><th>分配获得</th><th>实际获得</th><th>状态</th><th aria-label="进入明细"></th></tr></thead>
      <tbody id="employeeReconciliationList" aria-label="员工小费对账汇总"></tbody>
    </table>
  </div>
  <div id="employeeReconciliationEmpty" class="tipout-empty-state" hidden>当前筛选范围暂无员工对账数据</div>
</div>
```

Only fill the active panel’s rows. Do not add a second employee search or status filter.

- [ ] **Step 6: Build one daily dataset and dispatch rendering by active view**

Implement the page data adapter:

```js
function getCurrentLegacyRules() {
  if (!window.ruleData || !ruleData.getRulesForStore) return [];
  var store = (document.getElementById('storeSelect') || {}).value || '';
  return ruleData.getRulesForStore(store).filter(function (rule) {
    return (rule.allocationMode || 'legacy_pool') === 'legacy_pool';
  });
}

function buildDailyDataset() {
  var allocatedDates = getAllocatedDates();
  var requiresAttendance = TipOutSummaryUi.resolveRequiresAttendance(getCurrentLegacyRules());
  return getDateRange().map(function (dateKey) {
    var employeeResults = getDailyEmployeeResults(dateKey);
    return {
      dateKey: dateKey,
      date: new Date(dateKey + 'T00:00:00'),
      allocated: allocatedDates.has(dateKey),
      requiresAttendance: requiresAttendance,
      employeeResults: employeeResults,
      total: TipOutSummaryUi.summarizeDailyResults(employeeResults)
    };
  });
}
```

`renderSummaryViews()` calls `buildDailyDataset()` once, always updates the shared metric/notice region, and renders either date rows or employee rows. Keep `renderDailySummaryList()` as:

```js
function renderDailySummaryList() { renderSummaryViews(); }
```

- [ ] **Step 7: Render employee rows and navigation context**

Use `TipOutSummaryUi.aggregateEmployeeDailyDatasets(dailyRows)`, keep a current `employeeAggregateById` map for row activation, escape all text, and render the approved visual hierarchy:

```html
<tr class="tipout-employee-row" data-employee-id="roster:123" tabindex="0" role="link">
  <td><span class="tipout-employee-identity"><span class="tipout-employee-avatar">MG</span><strong>Maria Garcia</strong></span></td>
  <td>Server</td>
  <td><span class="tipout-shift-summary"><strong>6 个班次</strong><small>43.5 h</small></span></td>
  <td>$412.35</td><td class="tip-amount--deduct">-$61.85</td>
  <td class="tip-amount--receive">+$94.60</td><td><strong>$445.10</strong></td>
  <td><span class="tipout-employee-status is-complete">● 已完成</span></td>
  <td class="tipout-detail-link" aria-label="查看 Maria Garcia 对账明细">›</td>
</tr>
```

Employee row click, Enter, and Space call `openEmployeeReconciliationDetail(employeeId)`. That function writes `activeView`, scroll, and `returnEmployeeId` to the current history entry; writes the versioned snapshot; then navigates with `buildEmployeeReconciliationDetailUrl()`.

Extend the existing capture function without removing its date-return contract:

```js
function captureSummaryUiState(returnDate, returnEmployeeId) {
  history.replaceState(TipOutSummaryUi.buildSummaryHistoryState({
    dateStart: document.getElementById('dateStart').value,
    dateEnd: document.getElementById('dateEnd').value,
    store: document.getElementById('storeSelect').value,
    roles: getSelectedRoles(),
    employees: getSelectedEmployees(),
    activeView: activeSummaryView,
    scrollY: window.scrollY,
    returnDate: returnDate || '',
    returnEmployeeId: returnEmployeeId || ''
  }), '');
}
```

`openDailyDetail(dateKey)` continues calling `captureSummaryUiState(dateKey, '')`. The employee opener calls `captureSummaryUiState('', employeeId)`, serializes a snapshot built from the matching in-memory aggregate and current filter context, and only then assigns `window.location.href`.

- [ ] **Step 8: Restore view state with the specified precedence**

On initialization and `pageshow`, use:

```js
var queryView = new URLSearchParams(window.location.search).get('view');
activeSummaryView = TipOutSummaryUi.resolveSummaryView(history.state, queryView);
```

The view setter owns ARIA and panel state:

```js
function setSummaryView(view) {
  activeSummaryView = view === 'employee' ? 'employee' : 'date';
  var employeeActive = activeSummaryView === 'employee';
  var dateTab = document.getElementById('dateTaskTab');
  var employeeTab = document.getElementById('employeeReconciliationTab');
  dateTab.setAttribute('aria-selected', employeeActive ? 'false' : 'true');
  employeeTab.setAttribute('aria-selected', employeeActive ? 'true' : 'false');
  dateTab.tabIndex = employeeActive ? -1 : 0;
  employeeTab.tabIndex = employeeActive ? 0 : -1;
  document.getElementById('dateTaskPanel').hidden = employeeActive;
  document.getElementById('employeeReconciliationPanel').hidden = !employeeActive;
  captureSummaryUiState('', '');
  renderSummaryViews();
}
```

Restore legacy filters, scroll, and `returnDate` exactly as before. When returning to employee mode, render first, then focus `[data-employee-id="..."]` using `CSS.escape` when available or a safe element iteration fallback. If any summary history state exists, invalid/missing `activeView` defaults to date while the other legacy fields still restore. Only when no summary history state exists may the exact fallback query `view=employee` select employee mode.

- [ ] **Step 9: Add restrained, prototype-faithful styling**

In `prototype-fidelity.css`, use the existing white/gray utility language and amber focus accent rather than introducing a new theme. Required styling contracts:

```css
.tipout-page-summary .tipout-view-switch {
  display: inline-flex;
  flex: 0 0 auto;
  align-self: flex-end;
  margin-left: auto;
  padding: 3px;
  border-radius: 12px;
  background: #f1f1f2;
}
.tipout-page-summary .tipout-view-switch [role="tab"] {
  min-height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary);
}
.tipout-page-summary .tipout-view-switch [aria-selected="true"] {
  background: #fff;
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.13);
}
.tipout-page-summary .tipout-employee-table { min-width: 1120px; }
.tipout-page-summary .tipout-employee-row { cursor: pointer; }
.tipout-page-summary .tipout-employee-status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 8px;
  white-space: nowrap;
}
```

At `max-width: 768px`, make the switch span the expanded filter row and keep the employee table horizontally scrollable without hiding columns.

- [ ] **Step 10: Run contracts and commit the summary UI**

Run: `npm run verify:tipout-employee-reconciliation`

Expected: PASS.

Run: `npm run verify:tipout-interaction-refresh`

Expected: PASS; if an assertion encoded the old absence of employee markup, update only that assertion to protect the new approved contract while retaining all date-view assertions.

```bash
git add dist/TipOut/index.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-employee-reconciliation.mjs scripts/verify-tipout-interaction-refresh.mjs
git commit -m "feat: add tipout employee reconciliation view"
```

---

### Task 3: Add the read-only employee daily reconciliation page

**Files:**
- Create: `dist/TipOut/employee-reconciliation-detail.html`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Modify: `scripts/verify-tipout-employee-reconciliation.mjs`

**Interfaces:**
- Consumes: Query parameters from `buildEmployeeReconciliationDetailUrl()`, the `TipOutSummaryUi.EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY`, and `readEmployeeReconciliationSnapshot(raw, context)`.
- Produces: `renderEmployeeReconciliationDetail(snapshot)`, `returnToEmployeeReconciliation()`, and the full-page read-only detail UI.
- Does not consume `genDailyTip`, `TipAllocation`, allocated-date writers, or rule editors.

- [ ] **Step 1: Add failing detail-page assertions**

Extend the verification script:

```js
const detailPath = path.join(root, 'dist/TipOut/employee-reconciliation-detail.html');
assert.equal(fs.existsSync(detailPath), true);
const detailHtml = fs.readFileSync(detailPath, 'utf8');
for (const id of [
  'employeeDetailName', 'employeeDetailRole', 'employeeDetailStore', 'employeeDetailRange',
  'employeeDetailShifts', 'employeeDetailHours', 'employeeDetailBefore',
  'employeeDetailDeducted', 'employeeDetailReceived', 'employeeDetailAfter',
  'employeeDetailNotice', 'employeeDetailRows', 'employeeDetailEmpty'
]) assert.match(detailHtml, new RegExp(`id="${id}"`));
assert.match(detailHtml, /TipOutSummaryUi\.readEmployeeReconciliationSnapshot/);
assert.match(detailHtml, /function returnToEmployeeReconciliation\(\)/);
assert.match(detailHtml, /history\.back\(\)/);
assert.match(detailHtml, /index\.html\?view=employee/);
assert.doesNotMatch(detailHtml, /saveAllocatedDates|doAllocateTips|genDailyTip|runLegacyDayPipeline/);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run verify:tipout-employee-reconciliation`

Expected: FAIL because `employee-reconciliation-detail.html` does not exist.

- [ ] **Step 3: Build the detail page shell and context header**

Create a standalone TipOut page that loads `common.css`, `prototype-fidelity.css`, `common.js`, and `tipout-summary-ui.js`. Use the existing TipOut page chrome, with body class `tipout-fidelity tipout-page-employee-reconciliation-detail`. The content begins with:

```html
<section class="tipout-page-shell">
  <header class="tipout-page-heading tipout-page-heading--with-back">
    <button type="button" class="btn" onclick="returnToEmployeeReconciliation()">← 返回员工对账</button>
    <div>
      <span class="tipout-kicker">员工对账明细</span>
      <h1 id="employeeDetailName">—</h1>
      <p>核对选定日期范围内的班次、工时与逐日小费金额。</p>
    </div>
    <div class="tipout-employee-chip">
      <span class="tipout-employee-avatar" id="employeeDetailAvatar">—</span>
      <span><strong id="employeeDetailChipName">—</strong><small id="employeeDetailRole">—</small></span>
    </div>
  </header>
  <div class="tipout-detail-context">
    <span id="employeeDetailRange">—</span><span id="employeeDetailStore">—</span>
  </div>
</section>
```

Use text nodes / `textContent` for snapshot values; do not interpolate snapshot text into raw HTML.

- [ ] **Step 4: Add metrics, status notice, daily table, and empty state**

Use six metrics in this order: 班次、总工时、分配前、扣除、分配获得、实际获得. Add a table with the approved columns:

```html
<thead><tr><th>日期</th><th>考勤</th><th>班次 / 工时</th><th>分配前</th><th>扣除</th><th>分配获得</th><th>实际获得</th><th>分配状态</th></tr></thead>
<tbody id="employeeDetailRows"></tbody>
```

For each validated `dailyRows` item:

- Show `已打卡` / `未打卡`; when `requiresAttendance === false`, show `无需打卡`.
- Show one shift only when `hours > 0`, otherwise `—` and `0 h`.
- Show allocation as `已分配` or `待分配` from the snapshot flag.
- Apply a warning-row treatment when attendance is required and missing, or allocation is pending.

If snapshot validation fails, hide metrics/notice/table, show `employeeDetailEmpty` with “对账明细上下文已失效，请返回员工对账列表重新进入。”, and retain the return button.

- [ ] **Step 5: Implement return semantics and initialization**

Parse only the expected query fields and validate via the helper:

```js
var params = new URLSearchParams(window.location.search);
var detailContext = {
  employeeId: params.get('employeeId') || '',
  store: params.get('store') || '',
  dateStart: params.get('start') || '',
  dateEnd: params.get('end') || ''
};
var snapshot = TipOutSummaryUi.readEmployeeReconciliationSnapshot(
  sessionStorage.getItem(TipOutSummaryUi.EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY),
  detailContext
);
```

Return with:

```js
function returnToEmployeeReconciliation() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'summary' && params.get('return') === 'history' && history.length > 1) {
    history.back();
    return;
  }
  window.location.href = 'index.html?view=employee';
}
```

- [ ] **Step 6: Style the page responsively and accessibly**

Add scoped styles for `.tipout-page-employee-reconciliation-detail`: three-column heading, employee chip, context pills, six-column metric strip, 1040px minimum-width table, warning rows, and status pills. At `max-width: 768px`, stack the heading, switch metrics to two columns, and preserve horizontal table scrolling. Keep visible text on every status so color is never the sole signal.

- [ ] **Step 7: Run verification and commit the detail page**

Run: `npm run verify:tipout-employee-reconciliation`

Expected: PASS.

Run: `npm run verify:tipout-interaction-refresh`

Expected: PASS.

```bash
git add dist/TipOut/employee-reconciliation-detail.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-employee-reconciliation.mjs
git commit -m "feat: add tipout employee reconciliation detail"
```

---

### Task 4: Complete regression, browser, and build verification

**Files:**
- Modify only if verification exposes an in-scope defect: `dist/TipOut/index.html`, `dist/TipOut/employee-reconciliation-detail.html`, `dist/TipOut/tipout-summary-ui.js`, `dist/TipOut/prototype-fidelity.css`, `scripts/verify-tipout-employee-reconciliation.mjs`, `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: Completed summary and detail pages from Tasks 1–3.
- Produces: Verified implementation with no unrelated build output committed.

- [ ] **Step 1: Run focused TipOut verification**

Run each command separately:

```bash
npm run verify:tipout-employee-reconciliation
npm run verify:tipout-interaction-refresh
npm run verify:tipout-work-hours-layout
npm run verify:personal-sales-deduct
npm run verify:personal-sales-deduct-pipeline
npm run verify:personal-sales-pool
```

Expected: Every command exits 0. Fix only failures caused by the employee reconciliation changes.

- [ ] **Step 2: Run project build without invoking the eMenu embed-only workflow**

Run: `npm run build`

Expected: TypeScript and Vite build exit 0. Because `vendor/emenu-new` is untouched, do not run `build:emenu-new-embed` solely for this feature.

After the build, inspect `git status --short` and do not stage generated or pre-existing changes outside the task file list.

- [ ] **Step 3: Verify the desktop summary flow in the browser**

Open `http://127.0.0.1:5173/TipOut/index.html?qa=employee-reconciliation` and verify:

1. “日期任务” is selected by default and the existing date rows, actions, filters, summary metrics, and date-detail navigation still work.
2. The switch sits at the far right of the filter row.
3. Switching to “员工对账” preserves all four filter values and does not change summary metrics.
4. Changing each existing filter updates employee rows with no extra employee-mode filter.
5. Employee totals equal the corresponding daily totals for the same filtered range.
6. A complete employee shows “已完成”; an unallocated or required-missing-attendance employee shows “待补录”.

- [ ] **Step 4: Verify detail and restoration behavior**

From an employee row:

1. Activate the row by mouse, then repeat with Enter and Space.
2. Confirm the new page shows the same employee totals and only participating daily records.
3. Confirm missing attendance, no-clock, and pending allocation labels use the approved wording.
4. Return and verify employee mode, date/store/role/employee filters, scroll position, and original row focus are restored.
5. Open the detail URL in a new tab without its session snapshot and confirm the safe empty state with a working return action.

- [ ] **Step 5: Verify responsive and console behavior**

At desktop width and at a viewport no wider than 768px:

1. Expand/collapse filters and operate the view switch.
2. Confirm the switch uses a full filter row on mobile.
3. Confirm employee and detail tables scroll horizontally without hiding columns.
4. Confirm no button, notice, or return entry is obscured.
5. Confirm the browser console contains no errors.

- [ ] **Step 6: Inspect the final scoped diff and commit any QA fixes**

Run:

```bash
git diff --check -- dist/TipOut/index.html dist/TipOut/employee-reconciliation-detail.html dist/TipOut/tipout-summary-ui.js dist/TipOut/prototype-fidelity.css scripts/verify-tipout-employee-reconciliation.mjs scripts/verify-tipout-interaction-refresh.mjs package.json
git diff --stat -- dist/TipOut/index.html dist/TipOut/employee-reconciliation-detail.html dist/TipOut/tipout-summary-ui.js dist/TipOut/prototype-fidelity.css scripts/verify-tipout-employee-reconciliation.mjs scripts/verify-tipout-interaction-refresh.mjs package.json
```

Expected: no whitespace errors, no business-calculation files, and no unrelated generated bundles in the scoped diff.

If browser or regression fixes were required, commit only those task files:

```bash
git add dist/TipOut/index.html dist/TipOut/employee-reconciliation-detail.html dist/TipOut/tipout-summary-ui.js dist/TipOut/prototype-fidelity.css scripts/verify-tipout-employee-reconciliation.mjs scripts/verify-tipout-interaction-refresh.mjs package.json
git commit -m "fix: complete tipout employee reconciliation qa"
```
