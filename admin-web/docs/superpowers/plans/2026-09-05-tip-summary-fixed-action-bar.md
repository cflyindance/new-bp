# Tip Summary Fixed Action Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the native tip summary actions into one view-aware fixed bottom bar and export the correct date-task or employee-reconciliation dataset.

**Architecture:** Keep one action bar in the native distribution template and let `syncSummaryViewUi()` control its view-specific actions. Add explicit date-task and employee-reconciliation export collectors plus format-specific branches, while keeping the existing allocation, cancellation, rule navigation, download, and email-modal entry points intact.

**Tech Stack:** Native HTML template, shadow-root CSS, browser JavaScript runtime stored as `.js.txt`, Node verification scripts, Vite build.

**Spec:** `docs/superpowers/specs/2026-09-05-tip-summary-fixed-action-bar-design.md`

## Global Constraints

- Modify only the native small-fee management implementation under `src/team/tips`; do not use the old TipOut pages as the implementation surface.
- Keep allocation calculations, persisted results, cancellation scope, allocation dialog, and rule-entry routing unchanged.
- Date-task export includes only allocated dates in the active date range and applies the active store, role, and employee filters.
- Employee reconciliation hides role/employee controls and exports every unique employee in the active date/store range, ignoring retained date-task role/employee selections.
- PDF, CSV, and email must all resolve their dataset from the current view at action time.

---

### Task 1: Add native regression contracts for the fixed action bar

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: native template strings and runtime functions from the existing tip summary implementation.
- Produces: assertions for `tipout-summary-action-bar`, `summaryDateActions`, `syncSummaryViewUi()`, `collectDateTaskExportData()`, `collectEmployeeReconciliationExportData()`, and `collectCurrentSummaryExportData()`.

- [ ] **Step 1: Replace the obsolete heading-order assertion with failing native action-bar assertions**

Add checks equivalent to:

```js
const headingActions = distributionTemplate.match(/<div class="tipout-heading-actions">[\s\S]*?<\/div>\s*<\/div>/)?.[0] || "";
if (!headingActions.includes("summaryRuleEntryBtn")) failures.push("distribution: rule entry must remain in heading");
for (const label of [">取消分配</button>", ">导出结果</button>", "allocateBtn"]) {
  if (headingActions.includes(label)) failures.push(`distribution: ${label} must move out of heading`);
}
for (const token of ["tipout-summary-action-bar", "summaryDateActions", "exportMenu", "allocateBtn"]) {
  if (!distributionTemplate.includes(token)) failures.push(`distribution: fixed summary action bar missing ${token}`);
}
```

Also require runtime tokens for the three collector functions and action visibility syncing.

- [ ] **Step 2: Run the verifier and confirm the new contract fails**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the top actions have not moved and the new collector functions do not exist.

- [ ] **Step 3: Commit the failing regression contract**

```bash
git add scripts/verify-team-tips-native-views.mjs
git commit -m "test: define tip summary fixed action contracts"
```

### Task 2: Build the shared fixed action bar and view-aware state

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/tips-page.css`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Test: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `activeSummaryView`, `syncSummaryViewUi()`, `doCancelAllocate()`, `toggleExportMenu()`, `openTipAllocationModal()`, and `updateAllocateButton()`.
- Produces: DOM nodes `summaryDateActions`, `summaryActionBar`, and view-aware visibility controlled by `syncSummaryViewUi()`.

- [ ] **Step 1: Move the date actions out of the heading**

Keep only `summaryRuleEntryBtn` in `.tipout-heading-actions`. Insert one action bar after the summary panels and before modal markup:

```html
<div id="summaryActionBar" class="tipout-summary-action-bar" aria-label="小费汇总操作">
  <div id="summaryDateActions" class="tipout-summary-date-actions">
    <button type="button" class="btn btn-lg" data-native-onclick="doCancelAllocate()">取消分配</button>
  </div>
  <div class="export-dropdown">
    <!-- retain the existing export button and exportMenu markup unchanged -->
  </div>
  <div id="summaryAllocateAction" class="tipout-summary-date-actions">
    <button id="allocateBtn" class="btn btn-primary btn-lg" data-native-onclick="openTipAllocationModal()">分配小费</button>
  </div>
</div>
```

- [ ] **Step 2: Add fixed positioning and content-safe spacing**

Add native-scoped CSS using the existing fidelity variables:

```css
.tipout-page-summary .tipout-page-section { padding-bottom: 88px; }
.tipout-page-summary .tipout-summary-action-bar {
  position: fixed;
  z-index: 40;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  border-top: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6px 20px rgba(15, 23, 42, 0.08);
}
.tipout-page-summary .tipout-summary-date-actions { display: contents; }
.tipout-page-summary.is-employee-view .tipout-summary-date-actions { display: none; }
```

Use the native shell's content inset/custom property if present; otherwise scope the bar to the summary content host so it does not overlap the app sidebar. Add a mobile rule that preserves right alignment, permits wrapping, and keeps the final list row visible.

- [ ] **Step 3: Make `syncSummaryViewUi()` the single state synchronizer**

Extend the function with:

```js
var summaryRoot = document.querySelector('.tipout-page-summary');
if (summaryRoot) summaryRoot.classList.toggle('is-employee-view', employeeActive);
var dateActions = document.getElementById('summaryDateActions');
var allocateAction = document.getElementById('summaryAllocateAction');
if (dateActions) dateActions.hidden = employeeActive;
if (allocateAction) allocateAction.hidden = employeeActive;
var menu = document.getElementById('exportMenu');
if (menu) menu.classList.remove('show');
```

Wrap the role and employee filter fields with stable IDs and toggle them hidden for employee view without clearing checkbox selections. Ensure initialization, query-string view resolution, history restore, and `pageshow` continue to call this function.

- [ ] **Step 4: Run the native verifier**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: fixed-action layout and view-state assertions PASS; export collector assertions still FAIL until Task 3.

- [ ] **Step 5: Commit the layout and state behavior**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/tips-page.css src/team/tips/programs/distribution.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: add view-aware fixed tip summary actions"
```

### Task 3: Add view-specific export datasets and formatters

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/export.js.txt`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `activeSummaryView`, `getDateRange()`, `getAllocatedDates()`, `getSelectedRoles()`, `getSelectedEmployees()`, `getDailyEmployeeResults(dateKey)`, `TipOutSummaryUi.aggregateEmployeeDailyDatasets()`, `money()`, and existing export/download helpers.
- Produces:
  - `buildEmployeeReconciliationDataset(): DailySummaryRow[]`, ignoring role/employee selections.
  - `collectDateTaskExportData(): { kind: "date", store, dateStart, dateEnd, employees }`.
  - `collectEmployeeReconciliationExportData(): { kind: "employee", store, dateStart, dateEnd, employees }`.
  - `collectCurrentSummaryExportData(): DateExportData | EmployeeExportData`.

- [ ] **Step 1: Add executable collector assertions to the verifier**

Extract the pure selection helpers into a VM context or assert their source contracts so tests prove:

```js
assert.equal(collectCurrentSummaryExportData.call({ activeSummaryView: "employee" }).kind, "employee");
assert.equal(collectCurrentSummaryExportData.call({ activeSummaryView: "date" }).kind, "date");
```

Add fixtures that prove allocated-only date rows, role/employee filtering in date mode, employee-ID deduplication in employee mode, and the combined shift text `6 个班次 / 43.5 h`.

- [ ] **Step 2: Run the collector tests and confirm they fail**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL with missing or incorrect collector/formatter behavior.

- [ ] **Step 3: Separate date-task and employee-reconciliation datasets**

In `distribution.js.txt`, let date rendering keep the filtered data path and add an employee-reconciliation builder that resolves employees by date/store only. Use that builder for both `renderEmployeeReconciliationList()` and the employee export collector so visible rows and exports cannot diverge. Preserve hidden role/employee selections for the date view.

- [ ] **Step 4: Route export collection by active view**

In `export.js.txt`, replace the old single collector call with:

```js
function collectCurrentSummaryExportData() {
  return activeSummaryView === 'employee'
    ? collectEmployeeReconciliationExportData()
    : collectDateTaskExportData();
}

function exportAs(type) {
  document.getElementById('exportMenu').classList.remove('show');
  var data = collectCurrentSummaryExportData();
  if (!data.employees.length) {
    showNotification('没有可导出的数据', 'warning');
    return;
  }
  if (type === 'pdf') exportPDF(data);
  else if (type === 'csv') exportCSV(data);
}
```

Date collection must iterate only the already filtered employees and allocated dates. Employee collection must map the same aggregate objects rendered in the employee table into one row per stable employee ID.

- [ ] **Step 5: Add employee CSV and PDF branches**

Branch on `data.kind === 'employee'`. The employee columns are `Employee,Role,Shifts / Hours,Tips Before($),Deducted($),Received($),Tips After($),Status`; use `N 个班次 / H h`, signed received values, and an `EmployeeReconciliation_<start>_<end>` filename. Apply the same columns to jsPDF and print fallback output. Leave the existing date-task report structure unchanged.

- [ ] **Step 6: Resolve email data at send time**

After validating addresses and selected format, call `collectCurrentSummaryExportData()` inside `sendEmail()`. Stop with the common empty-data warning when needed; otherwise continue the existing simulated-send workflow and pass the current view's data/format to the same PDF or CSV preparation branch used by downloads without triggering a local download.

- [ ] **Step 7: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS, including allocated-only date export, view routing, employee deduplication, and employee export column checks.

- [ ] **Step 8: Commit the export behavior**

```bash
git add src/team/tips/programs/distribution.js.txt src/team/tips/legacy/export.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: export tip summaries by active view"
```

### Task 4: Build and verify the native page end to end

**Files:**
- Verify: `src/team/tips/templates/distribution.html`
- Verify: `src/team/tips/tips-page.css`
- Verify: `src/team/tips/programs/distribution.js.txt`
- Verify: `src/team/tips/legacy/export.js.txt`
- Verify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: completed native template, runtime, export, and CSS changes.
- Produces: a passing production build and browser-verified native route at `#/team/tips/distribution`.

- [ ] **Step 1: Run focused native verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: exit code 0 with no TypeScript or Vite build error.

- [ ] **Step 3: Verify date-task behavior in the native browser route**

Open `http://127.0.0.1:5174/#/team/tips/distribution` and verify:

- title area contains only the rule button;
- fixed bottom bar remains visible while scrolling;
- cancel, export, and allocate/reallocate are present;
- the final date row is not obscured;
- PDF and CSV use the active date/store/role/employee range and exclude pending dates.

- [ ] **Step 4: Verify employee-reconciliation behavior**

Switch to employee reconciliation and verify:

- role and employee controls are hidden while date and store remain visible;
- only export remains in the bottom bar;
- every employee appears once;
- PDF and CSV contain employee summary columns rather than daily rows;
- switching views closes the export menu and restores the prior role/employee selections.

- [ ] **Step 5: Verify recovery and responsive states**

Check direct employee-view navigation, history back/forward, page reload, narrow viewport, and app sidebar expanded/collapsed. Confirm the action bar state is correct and does not cover content or navigation.

- [ ] **Step 6: Review the final diff and commit any verification fixes**

```bash
git status --short
git diff --check
git diff --stat
git add src/team/tips scripts/verify-team-tips-native-views.mjs
git commit -m "fix: harden native tip summary action bar"
```
