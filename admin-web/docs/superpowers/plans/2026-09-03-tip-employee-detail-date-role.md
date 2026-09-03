# Tip Employee Detail Date and Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the native employee reconciliation detail page filter its existing daily snapshot by date, show the employee role beside the name, and remove the store, employee chip, and notice card.

**Architecture:** Keep the existing session snapshot and route validation intact. Add pure helpers for date normalization, inclusive filtering, and summary reduction; the page binds two native date inputs to those helpers and re-renders existing metric and row components without invoking allocation logic.

**Tech Stack:** TypeScript template loader, embedded browser JavaScript, CSS, Node.js contract tests, Vite build.

**Spec:** `docs/superpowers/specs/2026-09-03-tip-employee-detail-date-role-design.md`

## Global Constraints

- Modify only the native page sources under `src/team/tips`; do not modify the old `dist/TipOut` project.
- Preserve snapshot validation, navigation, allocation, attendance, and monetary generation logic.
- Dates are inclusive local business-date strings in `YYYY-MM-DD` form.
- Date bounds come only from snapshot `dateStart` and `dateEnd`.

---

### Task 1: Define date-filter contracts

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `scripts/verify-tipout-employee-reconciliation.mjs`

**Interfaces:**
- Consumes: native template and embedded program text.
- Produces: assertions for `employeeDetailStartDate`, `employeeDetailEndDate`, role fallback, inclusive filtering, inverted-date synchronization, filtered totals, and removed UI ids.

- [ ] **Step 1: Write failing assertions**

Assert that the native template contains both date inputs and `employeeDetailRole`, and does not contain `employeeDetailStore`, `employeeDetailChipName`, or `employeeDetailNotice`. Load the program with the existing VM pattern and assert helpers equivalent to:

```js
assert.deepEqual(filterEmployeeDetailRows(rows, '2026-01-02', '2026-01-03').map((row) => row.dateKey), ['2026-01-02', '2026-01-03']);
assert.deepEqual(normalizeEmployeeDetailRange('2026-01-04', '2026-01-03', 'start'), { start: '2026-01-04', end: '2026-01-04' });
assert.deepEqual(normalizeEmployeeDetailRange('2026-01-04', '2026-01-03', 'end'), { start: '2026-01-03', end: '2026-01-03' });
assert.equal(employeeDetailRoleLabel(''), '未设置角色');
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs` and `node scripts/verify-tipout-employee-reconciliation.mjs` from `admin-web`.

Expected: at least one new assertion fails because the controls/helpers do not exist and removed components are still present.

- [ ] **Step 3: Commit the failing contract**

```bash
git add admin-web/scripts/verify-team-tips-native-views.mjs admin-web/scripts/verify-tipout-employee-reconciliation.mjs
git commit -m "test: define tip detail date filter contracts"
```

### Task 2: Implement native date filtering and simplified heading

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`

**Interfaces:**
- Consumes: snapshot `{ role, dateStart, dateEnd, dailyRows }` and existing daily-row fields.
- Produces: `normalizeEmployeeDetailRange(start, end, changedSide)`, `filterEmployeeDetailRows(rows, start, end)`, `summarizeEmployeeDetailRows(rows)`, `employeeDetailRoleLabel(role)`, and interactive native date controls.

- [ ] **Step 1: Replace heading and context markup**

Place the role next to the employee name and replace context pills with labeled date inputs:

```html
<div class="tipout-employee-detail-title">
  <h1 id="employeeDetailName">—</h1>
  <span id="employeeDetailRole" class="tipout-role-tag">未设置角色</span>
</div>
<div class="tipout-detail-date-range" aria-label="对账日期范围">
  <input id="employeeDetailStartDate" type="date" aria-label="开始日期">
  <span aria-hidden="true">～</span>
  <input id="employeeDetailEndDate" type="date" aria-label="结束日期">
</div>
```

Remove `.tipout-employee-chip`, `#employeeDetailStore`, `#employeeDetailRange`, and `#employeeDetailNotice` markup only.

- [ ] **Step 2: Add pure filtering and summary helpers**

Implement inclusive string filtering and totals over already-generated rows:

```js
function filterEmployeeDetailRows(rows, start, end) {
  return rows.filter(function(row) { return row.dateKey >= start && row.dateKey <= end; });
}
function summarizeEmployeeDetailRows(rows) {
  return rows.reduce(function(total, row) {
    total.shifts += detailNumber(row.hours) > 0 ? 1 : 0;
    total.hours += detailNumber(row.hours);
    total.before += detailNumber(row.before);
    total.deducted += detailNumber(row.deducted);
    total.received += detailNumber(row.received);
    total.after += detailNumber(row.after);
    return total;
  }, { shifts: 0, hours: 0, before: 0, deducted: 0, received: 0, after: 0 });
}
```

- [ ] **Step 3: Bind date controls and render filtered data**

Set both inputs' `min/max` from snapshot bounds. On `change`, synchronize the opposite endpoint when inverted, filter `snapshot.dailyRows`, derive totals with `summarizeEmployeeDetailRows`, and render metrics plus rows. Keep the original snapshot unchanged.

- [ ] **Step 4: Update scoped CSS**

Remove obsolete chip/notice/context rules. Style the title role tag and date inputs using existing border, radius, spacing, and focus tokens; preserve the current responsive metric/table behavior.

- [ ] **Step 5: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs` and `node scripts/verify-tipout-employee-reconciliation.mjs`.

Expected: both scripts print their pass messages and exit 0.

- [ ] **Step 6: Commit implementation**

```bash
git add admin-web/src/team/tips/templates/employee-reconciliation.html admin-web/src/team/tips/programs/employee-reconciliation.js.txt admin-web/src/team/tips/tips-page.css admin-web/scripts/verify-team-tips-native-views.mjs admin-web/scripts/verify-tipout-employee-reconciliation.mjs
git commit -m "feat: filter tip employee detail by date"
```

### Task 3: Build and browser regression

**Files:**
- Modify only if build tooling generates tracked native app output.

**Interfaces:**
- Consumes: completed native implementation.
- Produces: verified production build and browser-ready page.

- [ ] **Step 1: Run production build**

Run: `npm run build` from `admin-web`.

Expected: exit 0 without TypeScript or bundling errors.

- [ ] **Step 2: Re-run focused scripts after build**

Run: `node scripts/verify-team-tips-native-views.mjs` and `node scripts/verify-tipout-employee-reconciliation.mjs`.

Expected: both exit 0.

- [ ] **Step 3: Inspect the native route**

Open the native employee detail from `#/team/tips/distribution`, confirm date controls, role tag, filtered rows and totals, and verify the removed store/card/notice content is absent. Confirm browser history back returns to employee reconciliation.

- [ ] **Step 4: Check repository scope**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only planned source, tests, docs, and legitimate build output are present.

- [ ] **Step 5: Commit legitimate build output if tracked**

```bash
git add admin-web/dist
git commit -m "build: refresh native tip employee detail"
```

Skip this commit if the build produces no tracked changes.
