# Tip Detail Confirmation Allocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the detail page's notification-only save actions with a transactional confirm/reconfirm allocation flow whose formal result is shared by the summary and payroll views.

**Architecture:** Add one legacy-compatible allocation-result store as the single boundary for exact `store + date` snapshots, validation, rollback, and allocated-state writes. The detail page will collect its already-rendered calculation output into that store, while summary projection and payroll bridge prefer the snapshot only when the date remains allocated. Existing cancellation remains unchanged as a demo reset.

**Tech Stack:** TypeScript/Vite host, legacy browser JavaScript loaded as raw runtime modules, DOM/localStorage/sessionStorage, Node `assert`/`vm` verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-confirm-allocation-design.md`

## Global Constraints

- Preserve the current rule formulas, manual-hours persistence, and cancellation behavior.
- Use the full canonical store value and exact ISO date; do not use fuzzy store-name matching for new results.
- A formal result snapshot is effective only while the matching date exists in `tipout_allocated`.
- Reconfirmation overwrites one exact `store + date` result and never changes another date or store.
- Invalid rules, roster references, amounts, hours, or percentages must block every write and payroll sync.
- Snapshot/state write failure must restore both old values; payroll failure must keep the confirmed result and permit an idempotent retry.
- Remove the “小费池执行结果” block already approved for this page.

---

### Task 1: Formal allocation result store

**Files:**
- Create: `src/team/tips/legacy/tipout-allocation-results-store.js.txt`
- Modify: `src/team/tips/tips-legacy-runtime.ts`
- Create: `scripts/verify-tipout-confirm-allocation-store.mjs`

**Interfaces:**
- Consumes: browser `localStorage`; existing key `tipout_allocated`.
- Produces: `window.TipOutAllocationResults` with `read(store,date)`, `isAllocated(store,date)`, `commit(snapshot)`, and `validate(snapshot)`.

- [ ] **Step 1: Write the failing store contract test**

Create a `vm`-based test that loads the raw module and asserts exact-store isolation, first-write date de-duplication, one-key overwrite, ignored snapshot after cancellation, malformed top-level JSON rejection, malformed child isolation, rollback when either `setItem` fails, and rejection of negative/NaN values.

```js
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11"), null);
api.commit(validSnapshot("Golden Dragon - Dallas", "2026-09-11", 12.34));
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11").summary.allocatedAmount, 12.34);
assert.equal(api.read("Golden Dragon - Plano", "2026-09-11"), null);
allocated["Golden Dragon - Dallas"] = [];
assert.equal(api.read("Golden Dragon - Dallas", "2026-09-11"), null);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs`

Expected: FAIL because `tipout-allocation-results-store.js.txt` does not exist.

- [ ] **Step 3: Implement the store boundary and runtime dependency**

Implement strict top-level parsing, per-child sanitization, immutable clone-on-read, finite/nonnegative numeric validation, exact key access, and a two-document rollback inside `commit(snapshot)`. Export the API on `window.TipOutAllocationResults`, import it in `tips-legacy-runtime.ts`, add it to `distribution`, `details`, and `employee-reconciliation` dependencies, and expose `var TipOutAllocationResults=window.TipOutAllocationResults;`.

```js
var RESULT_KEY = "tipout_allocation_results_v1";
function resultKey(store, dateKey) { return String(store) + "\u0000" + String(dateKey); }
function read(store, dateKey) {
  if (!isAllocated(store, dateKey)) return null;
  return clone(readDocument()[resultKey(store, dateKey)] || null);
}
```

- [ ] **Step 4: Run the store test**

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs`

Expected: PASS with all isolation, validation, and rollback assertions.

- [ ] **Step 5: Commit the store**

```bash
git add src/team/tips/legacy/tipout-allocation-results-store.js.txt src/team/tips/tips-legacy-runtime.ts scripts/verify-tipout-confirm-allocation-store.mjs
git commit -m "feat: add formal tip allocation result store"
```

### Task 2: Collect and confirm detail calculations

**Files:**
- Modify: `src/team/tips/templates/details.html`
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `scripts/verify-team-tips-date-pool-view.mjs`
- Create: `scripts/verify-tipout-detail-confirm-allocation.mjs`

**Interfaces:**
- Consumes: `TipOutAllocationResults.commit(snapshot)`, existing rendered rule cards, `ruleData`, `TipOutRosterDirectory`, `TipOutPayrollBridge.syncAfterAllocation(store,date,date)`.
- Produces: `confirmDetailAllocation()`, `collectDetailAllocationSnapshot(store,date,rules)`, `validateDetailAllocationSnapshot(snapshot)`, and `syncDetailAllocationAction()`.

- [ ] **Step 1: Write failing template and behavior tests**

Assert the detail template has only `#confirmDetailAllocationBtn`, contains neither `saveDetail()` nor `saveAndNext()`, and no longer contains `#detailPoolExecutionList` or “小费池执行结果”. Exercise the confirmation function with fake DOM/storage to cover first confirmation, reconfirm cancel, reconfirm overwrite, invalid rule/roster/numeric data, double-click suppression, payroll failure, and success copy.

```js
assert.match(template, /id="confirmDetailAllocationBtn"/);
assert.doesNotMatch(template, /saveDetail\(\)|saveAndNext\(\)|小费池执行结果/);
assert.equal(confirmMessages[0], "该日期已分配，重新确认将覆盖当天原分配结果。");
```

- [ ] **Step 2: Run the detail tests and verify they fail**

Run: `node scripts/verify-tipout-detail-confirm-allocation.mjs`

Expected: FAIL because the page still exposes both legacy save actions.

- [ ] **Step 3: Replace the detail action bar and remove the execution block**

Keep the existing metric strip and rule detail cards. Delete the execution-result section and its table CSS. Replace both save buttons with one primary button:

```html
<button id="confirmDetailAllocationBtn" class="btn btn-primary" data-native-onclick="confirmDetailAllocation()">确认分配</button>
```

Guard `renderDatePoolOverview` when the removed table body is absent so metrics continue rendering.

- [ ] **Step 4: Implement snapshot collection and validation**

Collect each pool/rule input and employee result from the same in-memory calculations that render the page, including stable employee ID, role, hours, percentage, and assigned amount. Reject missing applicable rules, inactive/missing roster references, non-finite or negative numeric fields, and percentage groups that are required to total 100.

```js
function collectDetailAllocationSnapshot(store, dateKey, rules) {
  return { version: 1, store, dateKey, confirmedAt: new Date().toISOString(), pools, employees, summary };
}
```

- [ ] **Step 5: Implement confirm/reconfirm orchestration**

At render time call `syncDetailAllocationAction()` to set “确认分配” or “重新确认分配”. On reconfirm use `window.confirm` with the approved warning. Disable the button with “分配中…”/“重新分配中…”, validate before writes, call `TipOutAllocationResults.commit`, replace `tipout-date-pool-summary-v1` with the confirmed projection, then call payroll sync and rerender. Restore the enabled state in every success/error branch.

```js
if (alreadyAllocated && !window.confirm("该日期已分配，重新确认将覆盖当天原分配结果。")) return;
var snapshot = collectDetailAllocationSnapshot(store, dateKey, rules);
TipOutAllocationResults.commit(snapshot);
TipOutPayrollBridge.syncAfterAllocation(store, dateKey, dateKey);
```

- [ ] **Step 6: Run focused verification**

Run:

```bash
node scripts/verify-tipout-confirm-allocation-store.mjs
node scripts/verify-tipout-detail-confirm-allocation.mjs
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-date-pool-view.mjs
```

Expected: all four commands PASS; cancellation assertions remain unchanged.

- [ ] **Step 7: Commit the detail workflow**

```bash
git add src/team/tips/templates/details.html src/team/tips/programs/details.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs scripts/verify-team-tips-date-pool-view.mjs scripts/verify-tipout-detail-confirm-allocation.mjs
git commit -m "feat: confirm tip allocation from detail page"
```

### Task 3: Consume formal snapshots in summary and payroll

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/tipout-date-pool-view.js.txt`
- Modify: `src/team/tips/legacy/tipout-payroll-bridge.js.txt`
- Modify: `scripts/verify-team-tips-date-pool-view.mjs`
- Create: `scripts/verify-tipout-confirm-allocation-consumers.mjs`

**Interfaces:**
- Consumes: `TipOutAllocationResults.read(store,date)` and `TipOutAllocationResults.commit(snapshot)`.
- Produces: allocated summary rows and payroll Tips/SVCW derived from the same confirmed employee/pool results.

- [ ] **Step 1: Write failing consumer tests**

Assert the summary prefers snapshot totals for allocated dates, ignores snapshots for canceled dates, and keeps current projection when no snapshot exists. Assert payroll maps the confirmed per-employee result into Tips/SVCW and falls back to its current calculation for legacy allocated dates without snapshots.

```js
assert.equal(summaryRow.poolSummary.allocatedAmount, confirmed.summary.allocatedAmount);
assert.equal(payrollRows.find(row => row.employeeId === "emp-1").tips, confirmedEmployee.amount);
```

- [ ] **Step 2: Run consumer tests and verify they fail**

Run: `node scripts/verify-tipout-confirm-allocation-consumers.mjs`

Expected: FAIL because summary/payroll do not read the formal snapshot.

- [ ] **Step 3: Prefer snapshots in summary and payroll**

In daily summary construction, resolve the exact selected store/date snapshot before using `TipOutDatePoolView.projectDate`. In payroll bridge, read snapshot employees/pools only for allocated dates; retain the current legacy computation when no formal result exists. Do not alter `doCancelAllocate()`.

- [ ] **Step 4: Make range allocation overwrite canceled snapshots**

Before marking each range date allocated, compute a fresh snapshot with the current rules using the shared existing projection/calculation pipeline, commit it through `TipOutAllocationResults`, and then run the unchanged payroll sync. This prevents the old canceled snapshot from reviving.

- [ ] **Step 5: Run consumer and regression verification**

Run:

```bash
node scripts/verify-tipout-confirm-allocation-consumers.mjs
node scripts/verify-team-tips-date-pool-view.mjs
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-tipout-interaction-refresh.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
```

Expected: all commands PASS, including legacy fallback and untouched cancellation behavior.

- [ ] **Step 6: Commit the consumers**

```bash
git add src/team/tips/programs/distribution.js.txt src/team/tips/legacy/tipout-date-pool-view.js.txt src/team/tips/legacy/tipout-payroll-bridge.js.txt scripts/verify-team-tips-date-pool-view.mjs scripts/verify-tipout-confirm-allocation-consumers.mjs
git commit -m "feat: share confirmed tip results with summary and payroll"
```

### Task 4: Build and browser acceptance

**Files:**
- Modify only if verification exposes a defect in files already listed above.

**Interfaces:**
- Consumes: completed detail, summary, and payroll behavior.
- Produces: a verified production build and browser-tested workflow.

- [ ] **Step 1: Run the full focused test suite**

Run:

```bash
node scripts/verify-tipout-confirm-allocation-store.mjs
node scripts/verify-tipout-detail-confirm-allocation.mjs
node scripts/verify-tipout-confirm-allocation-consumers.mjs
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-date-pool-view.mjs
node scripts/verify-tipout-interaction-refresh.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
```

Expected: every script exits 0.

- [ ] **Step 2: Build the native application**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build exit 0. The generated seasoning browser handler may be refreshed by the standard prebuild script; do not commit it unless its source inputs changed for this feature.

- [ ] **Step 3: Verify in the browser**

Start the existing local Vite preview and verify: an unallocated date opens editable with “确认分配”; confirmation changes the date to allocated; returning to summary shows the confirmed totals; allocated date shows “重新确认分配”; canceling the overwrite prompt changes nothing; accepting it replaces totals; another store/date is unchanged; “取消分配” still resets demo state; and the removed pool-execution block stays absent.

- [ ] **Step 4: Inspect the final diff and commit any verification fixes**

```bash
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Expected: no whitespace errors, no unrelated files, and only the planned tip-management files plus spec/plan/test files.

