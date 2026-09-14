# Employee Role Summary Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add filter-aware, clickable role summary cards above the employee allocation summary list.

**Architecture:** Keep role aggregation as a pure function in the existing summary data module, consuming unmerged `dailyRows[].employeeResults[]` so historical role attribution remains intact. The distribution program derives the eligible employee IDs with the existing employee filter pipeline, renders cards from the same daily dataset, and reuses the existing role filter state for card interaction.

**Tech Stack:** Vanilla JavaScript legacy runtime, HTML templates, CSS Grid, Node.js assertion scripts, Vite/TypeScript build.

**Spec:** `docs/superpowers/specs/2026-09-14-tip-employee-role-summary-cards-design.md`

## Global Constraints

- Role attribution uses the role on each daily employee allocation record, not the employee's current primary role.
- Pending records contribute only to `beforeCents`; deducted, received, and final amounts use allocated records only.
- Role cards follow the active store, date, role, employee-scope, and allocation-status filters.
- Clicking a card must reuse `employeeSummaryFilters.role`; do not create a second role-selection state.
- Do not change the tip allocation algorithm, employee/role master data, date summary view, or employee detail navigation.
- Do not modify `vendor/emenu-new`; the special eMenu embed build is therefore not required.

---

### Task 1: Pure daily-role aggregation

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Test: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `dailyRows: Array<{dateKey, allocated, allocationValidationError?, employeeResults: EmployeeDailyRecord[]}>`; `options: {employeeIds?: string[], role?: string}`.
- Produces: `aggregateRoleDailyDatasets(dailyRows, options): RoleAggregate[]`, exported on `TipOutSummaryUi`.
- `RoleAggregate`: `{role, employeeIds, employeeCount, beforeCents, deductedCents, receivedCents, finalAmountCents, allocatedRecordCount, pendingRecordCount, status, hasConfirmedAmount}`.

- [ ] **Step 1: Write failing aggregation tests**

Add fixtures to `scripts/verify-team-tips-native-views.mjs` that cover role splitting, employee ID de-duplication, pending amounts, filtering, and sort order:

```js
const roleDailyRows = [
  { dateKey: '2026-09-13', allocated: true, employeeResults: [
    { employeeId: 'e1', role: 'Server', before: 10, deducted: 2, received: 5 },
    { employeeId: 'e2', role: 'Busser', before: 4, deducted: 0, received: 8 },
  ]},
  { dateKey: '2026-09-14', allocated: false, employeeResults: [
    { employeeId: 'e1', role: 'Bartender', before: 7, deducted: 99, received: 99 },
    { employeeId: 'e3', role: 'Server', before: 3, deducted: 99, received: 99 },
  ]},
];
const roleAggregates = summaryUi.aggregateRoleDailyDatasets(roleDailyRows, {});
assert.deepEqual(roleAggregates.map(item => item.role), ['Busser', 'Server', 'Bartender']);
assert.deepEqual(roleAggregates.find(item => item.role === 'Server'), {
  role: 'Server', employeeIds: ['e1', 'e3'], employeeCount: 2,
  beforeCents: 1300, deductedCents: 200, receivedCents: 500, finalAmountCents: 1300,
  allocatedRecordCount: 1, pendingRecordCount: 1, status: 'partial', hasConfirmedAmount: true,
});
assert.equal(roleAggregates.find(item => item.role === 'Bartender').deductedCents, 0);
assert.equal(roleAggregates.find(item => item.role === 'Bartender').hasConfirmedAmount, false);
assert.deepEqual(
  summaryUi.aggregateRoleDailyDatasets(roleDailyRows, { employeeIds: ['e1'], role: 'Server' }).map(item => item.role),
  ['Server']
);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because `summaryUi.aggregateRoleDailyDatasets` is not defined.

- [ ] **Step 3: Implement the pure aggregator**

Add focused helpers and the aggregator to `tipout-summary-ui.js.txt`:

```js
function stableRoleEmployeeId(record) {
  var value = record && (record.employeeId || record.rosterEmployeeId || record.id);
  return value == null || String(value).trim() === '' ? '' : String(value);
}

function aggregateRoleDailyDatasets(dailyRows, options) {
  options = options || {};
  var allowedIds = Array.isArray(options.employeeIds) ? uniqueIds(options.employeeIds) : [];
  var selectedRole = String(options.role || '');
  var byRole = Object.create(null);
  (dailyRows || []).forEach(function(day) {
    (day.employeeResults || []).forEach(function(record) {
      if (!record || !isParticipatingEmployeeRecord(record)) return;
      var employeeId = stableRoleEmployeeId(record);
      if (allowedIds.length && (!employeeId || allowedIds.indexOf(employeeId) < 0)) return;
      var role = String(record.role || '').trim() || '未设置角色';
      if (selectedRole && role !== selectedRole) return;
      var item = byRole[role] || (byRole[role] = {
        role: role, employeeIds: [], beforeCents: 0, deductedCents: 0,
        receivedCents: 0, finalAmountCents: 0,
        allocatedRecordCount: 0, pendingRecordCount: 0,
      });
      addUnique(item.employeeIds, employeeId);
      item.beforeCents += toCents(record.before) || 0;
      if (day.allocated && !day.allocationValidationError) {
        item.allocatedRecordCount += 1;
        item.deductedCents += toCents(record.deducted) || 0;
        item.receivedCents += toCents(record.received) || 0;
        item.finalAmountCents += (toCents(record.before) || 0) - (toCents(record.deducted) || 0) + (toCents(record.received) || 0);
      } else {
        item.pendingRecordCount += 1;
      }
    });
  });
  return Object.keys(byRole).map(function(role) {
    var item = byRole[role];
    item.employeeIds = item.employeeIds.filter(Boolean);
    item.employeeCount = item.employeeIds.length;
    item.hasConfirmedAmount = item.allocatedRecordCount > 0;
    item.status = item.allocatedRecordCount && item.pendingRecordCount ? 'partial' : item.allocatedRecordCount ? 'complete' : 'pending';
    return item;
  }).sort(function(a, b) {
    if (a.hasConfirmedAmount !== b.hasConfirmedAmount) return a.hasConfirmedAmount ? -1 : 1;
    if (a.finalAmountCents !== b.finalAmountCents) return b.finalAmountCents - a.finalAmountCents;
    return a.role.localeCompare(b.role);
  });
}
```

When adding employee IDs, guard the call so an empty identifier is never appended:

```js
if (employeeId) addUnique(item.employeeIds, employeeId);
```

Export `aggregateRoleDailyDatasets` in the existing `TipOutSummaryUi` object.

- [ ] **Step 4: Run aggregation tests**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: `Team tips native view verification passed.`

- [ ] **Step 5: Commit the aggregation unit**

```bash
git add admin-web/src/team/tips/legacy/tipout-summary-ui.js.txt admin-web/scripts/verify-team-tips-native-views.mjs
git commit -m "feat: aggregate employee tips by daily role"
```

---

### Task 2: Role cards, empty state, and filter interaction

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Test: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `TipOutSummaryUi.aggregateRoleDailyDatasets(dailyRows, {employeeIds, role})` from Task 1; existing `employeeSummaryFilters`, `allEmployeeSummaryAggregates`, `renderSummaryViews()`, and `handleEmployeeSummaryRoleChange()` state flow.
- Produces: `renderEmployeeRoleSummaryCards(roleAggregates)` and `toggleEmployeeRoleSummary(role)` in the distribution runtime; DOM IDs `employeeRoleSummary`, `employeeRoleSummaryCards`, and `employeeRoleSummaryEmpty`.

- [ ] **Step 1: Write failing markup and behavior contracts**

Add assertions to `verify-team-tips-native-views.mjs`:

```js
for (const token of [
  'id="employeeRoleSummary"', 'id="employeeRoleSummaryCards"',
  'id="employeeRoleSummaryEmpty"', '角色汇总',
]) assert.ok(distributionTemplate.includes(token));

for (const token of [
  'function renderEmployeeRoleSummaryCards(roleAggregates)',
  'function toggleEmployeeRoleSummary(role)',
  'TipOutSummaryUi.aggregateRoleDailyDatasets(dailyRows',
  "employeeSummaryFilters.role === role ? '' : role",
  "handleEmployeeSummaryRoleChange()",
  'aria-pressed',
]) assert.ok(distributionProgram.includes(token));

for (const token of [
  '.tipout-employee-role-summary', '.tipout-role-summary-grid',
  '.tipout-role-summary-card', '.tipout-role-summary-card.is-active',
]) assert.ok(pageCss.includes(token));
```

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL with missing role summary template/program/style contracts.

- [ ] **Step 3: Add the role summary region above the employee table**

In `templates/distribution.html`, insert this as the first child of `#employeeReconciliationPanel`:

```html
<section id="employeeRoleSummary" class="tipout-employee-role-summary" aria-labelledby="employeeRoleSummaryTitle">
  <div class="tipout-role-summary-heading">
    <h2 id="employeeRoleSummaryTitle">角色汇总</h2>
    <span>按员工实际参与分配的角色统计</span>
  </div>
  <div id="employeeRoleSummaryCards" class="tipout-role-summary-grid"></div>
  <div id="employeeRoleSummaryEmpty" class="tipout-role-summary-empty" hidden>当前筛选条件下暂无角色汇总</div>
</section>
```

- [ ] **Step 4: Render accessible cards with confirmed/pending semantics**

In `programs/distribution.js.txt`, add:

```js
function renderEmployeeRoleSummaryCards(roleAggregates) {
  var container = document.getElementById('employeeRoleSummaryCards');
  var empty = document.getElementById('employeeRoleSummaryEmpty');
  if (!container || !empty) return;
  empty.hidden = roleAggregates.length > 0;
  container.hidden = roleAggregates.length === 0;
  container.innerHTML = roleAggregates.map(function(item) {
    var active = employeeSummaryFilters.role === item.role;
    var status = item.status === 'partial' ? '<span class="tipout-role-summary-status">部分待分配</span>' : '';
    return '<button type="button" class="tipout-role-summary-card' + (active ? ' is-active' : '') +
      '" aria-pressed="' + active + '" data-role="' + escapeSummaryHtml(item.role) +
      '" onclick="toggleEmployeeRoleSummary(this.dataset.role)">' +
      '<span class="tipout-role-summary-title"><strong>' + escapeSummaryHtml(item.role) + '</strong><small>' + item.employeeCount + ' 人</small></span>' +
      status +
      '<span><small>分配前小费</small><strong>' + formatEmployeeSummaryMoney(item.beforeCents, true) + '</strong></span>' +
      '<span><small>扣除</small><strong class="tip-amount--deduct">' + formatEmployeeSummaryMoney(item.deductedCents, item.hasConfirmedAmount) + '</strong></span>' +
      '<span><small>分配获得</small><strong class="tip-amount--receive">' + formatEmployeeSummaryMoney(item.receivedCents, item.hasConfirmedAmount) + '</strong></span>' +
      '<span><small>分配后小费</small><strong>' + formatEmployeeSummaryMoney(item.finalAmountCents, item.hasConfirmedAmount) + '</strong></span>' +
      '</button>';
  }).join('');
}
```

Use existing money formatting behavior so `hasConfirmedAmount === false` renders `—` for the last three values.

- [ ] **Step 5: Wire card selection to the existing role filter**

Add the interaction without introducing new state:

```js
function toggleEmployeeRoleSummary(role) {
  employeeSummaryFilters.role = employeeSummaryFilters.role === role ? '' : role;
  var select = document.getElementById('employeeSummaryRoleFilter');
  if (select) select.value = employeeSummaryFilters.role;
  handleEmployeeSummaryRoleChange();
}
```

In the employee branch of `renderSummaryViews()`, derive the eligible employee IDs after the existing employee filters and then build role cards from the raw daily rows:

```js
var eligibleIds = visibleEmployeeSummaryAggregates.map(function(item) { return item.employeeId; });
var roleAggregates = TipOutSummaryUi.aggregateRoleDailyDatasets(dailyRows, {
  employeeIds: eligibleIds,
  role: employeeSummaryFilters.role,
});
renderEmployeeRoleSummaryCards(roleAggregates);
```

When switching to the date view, clear the role card container and keep `#employeeReconciliationPanel` hidden through the existing view toggle.

- [ ] **Step 6: Add responsive role-card styling**

In `tips-page.css`, add a four-column desktop grid that collapses without horizontal overflow:

```css
.tipout-employee-role-summary { margin-bottom: 14px; padding: 16px; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: #fff; }
.tipout-role-summary-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.tipout-role-summary-heading h2 { margin: 0; font-size: 16px; }
.tipout-role-summary-heading span { color: var(--text-tertiary); font-size: 12px; }
.tipout-role-summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.tipout-role-summary-card { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 14px; border: 1px solid var(--border-light); border-radius: 10px; background: #fff; text-align: left; cursor: pointer; }
.tipout-role-summary-card:hover { border-color: var(--primary); }
.tipout-role-summary-card:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.tipout-role-summary-card.is-active { border-color: var(--primary); background: rgba(22, 119, 255, 0.04); }
.tipout-role-summary-title { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; }
.tipout-role-summary-card > span:not(.tipout-role-summary-title):not(.tipout-role-summary-status) { display: flex; flex-direction: column; gap: 4px; }
.tipout-role-summary-status { grid-column: 1 / -1; width: max-content; color: #ad6800; font-size: 12px; }
.tipout-role-summary-empty { padding: 24px; color: var(--text-tertiary); text-align: center; }
@media (max-width: 1400px) { .tipout-role-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 1000px) { .tipout-role-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .tipout-role-summary-grid { grid-template-columns: minmax(0, 1fr); } }
```

- [ ] **Step 7: Run UI contracts and focused regressions**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
npm.cmd run verify:tipout-payout-lock
```

Expected: all scripts exit 0 and print their existing `passed` messages.

- [ ] **Step 8: Commit the UI unit**

```bash
git add admin-web/src/team/tips/templates/distribution.html admin-web/src/team/tips/programs/distribution.js.txt admin-web/src/team/tips/tips-page.css admin-web/scripts/verify-team-tips-native-views.mjs
git commit -m "feat: show role cards in employee tip summary"
```

---

### Task 3: Production build and integration verification

**Files:**
- Verify only: `src/team/tips/**`, `scripts/verify-team-tips-native-views.mjs`
- Do not commit generated changes under `dist/`, `src/generated/build-stamp.ts`, or `src/emenu-local/seasoning/generated/seasoning-browser-handler.ts` from the local verification build.

**Interfaces:**
- Consumes: completed aggregation and role-card UI from Tasks 1–2.
- Produces: a verified feature branch ready to merge into local `main`.

- [ ] **Step 1: Run the production build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build exit 0. Existing chunk-size warnings are non-blocking.

- [ ] **Step 2: Inspect the build output and source diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: source changes match this plan; no whitespace errors. Restore only known build-generated tracked files and remove only the exact untracked hashed assets created by this build.

- [ ] **Step 3: Re-run focused tests after cleanup**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
npm.cmd run verify:tipout-payout-lock
```

Expected: all tests pass.

- [ ] **Step 4: Merge into local main**

From the existing local main worktree, preserve unrelated dirty files and run:

```bash
git merge --no-ff codex/tip-role-summary-cards -m "merge: add employee role summary cards"
```

Expected: merge succeeds without altering unrelated working-tree changes. Do not push GitHub unless the user explicitly asks.
