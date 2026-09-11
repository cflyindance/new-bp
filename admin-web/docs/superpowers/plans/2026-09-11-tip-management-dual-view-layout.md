# Tip Management Dual-View Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the native tip-management page as one URL-addressable workspace with “分配汇总 / 员工对账” tabs, view-specific controls, preserved context, and unchanged allocation calculations.

**Architecture:** Keep both summary views in the existing distribution template and use `TipOutSummaryUi` as the pure state/URL boundary. The page program owns rendering and history writes; existing daily datasets and employee aggregation remain the only calculation sources. Navigation continues through the native tips route adapter.

**Tech Stack:** TypeScript route adapter, native HTML template, CSS, legacy JavaScript page programs, Node assertion scripts, Vite.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-management-dual-view-layout-design.md`

## Global Constraints

- Modify only the native `src/team/tips` implementation and focused verification scripts.
- Do not use or update the retired `TipOut` project.
- Do not introduce new tip, hours, attendance, or status formulas.
- Employee identity is the stable employee ID from the shared role-and-employee master data.
- Keep existing allocation, cancellation, export, rule-entry, permission, and detail calculations unchanged.
- Keep exactly one `#summaryViewSwitch`, `#dateTaskTab`, and `#employeeReconciliationTab`.

---

### Task 1: Make the view URL and browser history deterministic

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/tips-context.ts`
- Modify: `src/team/tips/tips-legacy-runtime.ts`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `history.state`, `window.location.search`, existing `captureSummaryUiState(returnDate, returnEmployeeId)`.
- Produces: `TipOutSummaryUi.normalizeSummaryView(value) -> "date" | "employee"`, `TipOutSummaryUi.buildSummaryViewHref(view) -> string`, `TipsPageContext.replace(href, state?)`, and `setSummaryView(view, options)` with `{ historyMode: "push" | "replace" | "none" }`.

- [ ] **Step 1: Add failing pure-state assertions**

Extend the summary UI verification to assert:

```js
assert.equal(summaryUi.normalizeSummaryView('employee'), 'employee');
assert.equal(summaryUi.normalizeSummaryView('date'), 'date');
assert.equal(summaryUi.normalizeSummaryView('unknown'), 'date');
assert.equal(summaryUi.buildSummaryViewHref('date'), 'index.html');
assert.equal(summaryUi.buildSummaryViewHref('employee'), 'index.html?view=employee');
```

Also assert the page program contains one `history.pushState` path for user tab changes and one `history.replaceState` path for URL normalization.

- [ ] **Step 2: Run the focused verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the URL helpers and push-history behavior do not exist.

- [ ] **Step 3: Add the pure URL helpers**

Add to `tipout-summary-ui.js.txt` and export them on `TipOutSummaryUi`:

```js
function normalizeSummaryView(value) {
  return value === 'employee' ? 'employee' : 'date';
}
function buildSummaryViewHref(view) {
  return normalizeSummaryView(view) === 'employee'
    ? 'index.html?view=employee'
    : 'index.html';
}
```

- [ ] **Step 4: Separate user navigation from state restoration**

Add `replace(href, state?)` to `TipsPageContext`, implement it with `commitHash(..., "replace", ...)`, and intercept `location.replace(value)` in `tips-legacy-runtime.ts` so legacy hrefs pass through `rewriteLegacyTipsUrl` before replacement. Do not call native `window.location.replace`, which would bypass the hash router.

Change the page entry point to:

```js
function setSummaryView(view, options) {
  var nextView = TipOutSummaryUi.normalizeSummaryView(view);
  var historyMode = options && options.historyMode || 'push';
  activeSummaryView = nextView;
  syncSummaryViewUi();
  captureSummaryUiState('', '');
  var href = TipOutSummaryUi.buildSummaryViewHref(nextView);
  if (historyMode === 'push') window.location.href = href;
  if (historyMode === 'replace') window.location.replace(href);
  renderSummaryViews();
}
```

The native runtime rewrites `index.html` to `/team/tips/distribution` and `index.html?view=employee` to `/team/tips/distribution?view=employee`. Initialization and route restoration call the UI sync with `historyMode: 'none'`. Normalize `view=date` and unknown values with `historyMode: 'replace'`; do not append a second history entry.

- [ ] **Step 5: Verify history behavior**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS, including URL helper and history-mode assertions.

- [ ] **Step 6: Commit**

```bash
git add src/team/tips/legacy/tipout-summary-ui.js.txt src/team/tips/programs/distribution.js.txt src/team/tips/tips-context.ts src/team/tips/tips-legacy-runtime.ts scripts/verify-team-tips-native-views.mjs
git commit -m "feat: preserve tip summary view history"
```

### Task 2: Verify view-specific controls and shared context

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `activeSummaryView`, `syncSummaryViewUi()`, existing date/store/role/employee/date-sort controls.
- Produces: always-visible heading tablist; date-only role, employee, sort, cancel, allocate controls; employee-only export behavior; shared date/store values.

- [ ] **Step 1: Add failing structural and visibility assertions**

Assert the template contains the tablist before `.filter-surface`, a screen-reader-only `#summaryTitle`, unique tab IDs, and the existing rule button in `.tipout-heading-actions`. Assert `syncSummaryViewUi()` hides `roleFilterField`, `employeeFilterField`, `dateSortField`, `summaryDateActions`, and `summaryAllocateAction` only when the employee view is active.

- [ ] **Step 2: Run the verifier**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS for already-completed heading placement; any missing view-specific assertion must fail before its minimal correction.

- [ ] **Step 3: Complete only missing view-specific behavior**

Retain this state mapping:

```js
roleFilterField.hidden = employeeActive;
employeeFilterField.hidden = employeeActive;
dateSortField.hidden = employeeActive;
summaryDateActions.hidden = employeeActive;
summaryAllocateAction.hidden = employeeActive;
```

Do not recreate controls or duplicate IDs. Date range and store remain visible in both views. Keep the existing export dispatcher so it selects date-task or employee-reconciliation output from `activeSummaryView`.

- [ ] **Step 4: Check responsive rules**

Keep `.tipout-heading-tabs` full-width below 768px, give each tab `flex: 1 1 50%`, and preserve content bottom padding so the fixed action bar does not cover the last row. Update filter `:nth-child(...)` selectors only if moving controls changed their DOM positions.

- [ ] **Step 5: Run focused checks**

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-date-pool-view.mjs
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: align tip dual-view controls"
```

### Task 3: Close detail-return and aggregation acceptance coverage

**Files:**
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/tips-navigation.ts`
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `scripts/verify-team-tips-date-pool-view.mjs`

**Interfaces:**
- Consumes: `buildSummaryHistoryState`, `readSummaryHistoryState`, `aggregateEmployeeDailyDatasets`, `buildDetailUrl`, `buildEmployeeReconciliationDetailUrl`.
- Produces: restored shared and per-view context, stable-ID employee aggregation, and correct fallback return targets.

- [ ] **Step 1: Add failing state round-trip tests**

Use a state fixture containing dates, store, roles, employees, active view, scroll position, and focused row ID. Assert `buildSummaryHistoryState` followed by `readSummaryHistoryState` preserves every value. Assert date detail URLs carry `from=summary&return=history`, employee detail URLs carry the same markers plus employee/date/store context, and their native route rewrites target the correct detail routes.

- [ ] **Step 2: Add employee aggregation fixtures**

Create two daily rows for one stable employee ID and one row for a second ID. Assert the result contains two employees, sums existing `before`, `deducted`, `received`, and `after` values without recomputation, and uses existing attendance/manual-hours output for shifts and hours.

```js
assert.equal(result.length, 2);
assert.equal(result[0].employeeId, 'employee-1');
assert.equal(result[0].received, 42.5);
assert.equal(result[0].dailyRows.length, 2);
```

- [ ] **Step 3: Run verification and confirm any uncovered behavior fails**

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-date-pool-view.mjs
```

- [ ] **Step 4: Implement only missing restoration boundaries**

Keep `captureSummaryUiState()` before opening either detail. On summary restoration, resolve the view first, restore shared date/store fields, restore role and employee selections for the date view, render, restore scroll, then focus `returnDate` or `returnEmployeeId`. Preserve the existing fallback route `/team/tips/distribution` for date details and append `?view=employee` for employee-detail fallback.

- [ ] **Step 5: Run all tip checks**

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-date-pool-view.mjs
node scripts/verify-tipout-clock-rule-auto-allocation.mjs
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/team/tips/legacy/tipout-summary-ui.js.txt src/team/tips/programs/distribution.js.txt src/team/tips/tips-navigation.ts scripts/verify-team-tips-native-views.mjs scripts/verify-team-tips-date-pool-view.mjs
git commit -m "test: cover tip dual-view context restoration"
```

### Task 4: Production and browser acceptance

**Files:**
- Modify only files from Tasks 1–3 if acceptance reveals a defect.

**Interfaces:**
- Consumes: completed dual-view workspace.
- Produces: production-build and browser-verified native page.

- [ ] **Step 1: Run the production build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite exit 0. Restore only unrelated generated build artifacts afterward.

- [ ] **Step 2: Verify desktop interaction**

On `/team/tips/distribution`, confirm the visible page title is absent, tabs are in its former position, the rule button remains right-aligned, filters do not hide the tabs, and the date view shows its three bottom actions. Switch to employee view and confirm shared context remains, date-only controls disappear, the employee list contains unique IDs, and only export remains.

- [ ] **Step 3: Verify history and detail return**

Switch date → employee → date, use browser back/forward, open one date detail and one employee detail, and confirm each return restores the correct view, date/store context, scroll position, and focused source row. Directly load `?view=unknown` and confirm canonical fallback to the date view without a history loop.

- [ ] **Step 4: Verify narrow layout**

Below 768px, confirm the two tabs are equal width, the rule button wraps below without overlap, tables scroll horizontally, and the fixed bottom bar does not cover the last row.

- [ ] **Step 5: Verify the existing permission boundary**

Use an account without the existing “小费分配” page permission and directly load both `/team/tips/distribution?view=employee` and an employee-detail URL. Confirm the existing unauthorized-page handling runs and no employee rows, metrics, or snapshots are rendered. Confirm a permitted account can access both views without acquiring any additional operation permission.

- [ ] **Step 6: Inspect final scope**

```bash
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Expected: only the approved specs/plans and native tip implementation/verification files are included.
