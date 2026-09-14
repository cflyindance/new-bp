# Tip Date Business Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independently filtered business status to the date allocation summary and prevent every allocation path from writing results for closed or invalid business days.

**Architecture:** Introduce one legacy-compatible domain module that reconstructs unfiltered store-day facts and derives `open/closed`, issues, and allocation eligibility. Both summary and detail runtimes consume that module; the shared write boundary performs the final eligibility check so UI, automatic, manual, re-confirmation, and batch paths cannot diverge.

**Tech Stack:** TypeScript/Vite shell, legacy JavaScript source modules loaded as raw text, HTML templates, CSS, Node.js verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-14-tip-date-business-status-design.md`

## Global Constraints

- A day is open when Net Sales, original order tips, or at least one complete positive-duration punch is present.
- Schedule rows, manual hours, incomplete punches, and zero-duration punches are not business evidence.
- Invalid monetary or punch data produces issues and blocks first confirmation, automatic allocation, batch allocation, and re-confirmation.
- Business facts are reconstructed from the complete `store + date` dataset and never from employee, role, rule, or status-filtered rows.
- Closed dates remain viewable; closed unallocated dates show `无需分配`.
- Existing confirmed snapshots remain viewable and cancellable even when the reconstructed day is closed or invalid.
- The business status filter exists only in the date summary and defaults to all statuses.

---

### Task 1: Business-day facts and eligibility domain

**Files:**
- Create: `src/team/tips/legacy/tipout-business-status.js.txt`
- Modify: `src/team/tips/tips-legacy-runtime.ts`
- Create: `scripts/verify-tipout-business-status.mjs`

**Interfaces:**
- Consumes: complete store-day source data already available through rule, attendance, and allocation data modules.
- Produces: `TipOutBusinessStatus.getBusinessDayFacts(store, dateKey)`, `TipOutBusinessStatus.resolveBusinessStatus(facts)`, and `TipOutBusinessStatus.inspect(store, dateKey)`.
- `inspect` returns `{ facts, status: 'open' | 'closed', issues: Array<{ code, field }>, allocatable: boolean }`.

- [ ] **Step 1: Write the failing domain verification**

Create a VM-based test that loads the new legacy module and asserts these exact cases:

```js
assert.deepEqual(resolve({ salesAmount: 10, tipAmount: 0, punchRecords: [] }), { status: "open", issues: [] });
assert.equal(resolve({ salesAmount: 0, tipAmount: 2, punchRecords: [] }).status, "open");
assert.equal(resolve({ salesAmount: 0, tipAmount: 0, punchRecords: [completePunch(8)] }).status, "open");
assert.equal(resolve({ salesAmount: 0, tipAmount: 0, punchRecords: [] }).status, "closed");
assert.equal(resolve({ salesAmount: 0, tipAmount: 0, punchRecords: [manualHours(6)] }).status, "closed");
assert.equal(resolve({ salesAmount: Number.NaN, tipAmount: 0, punchRecords: [] }).issues[0].code, "invalid_amount");
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node scripts/verify-tipout-business-status.mjs`

Expected: FAIL because `tipout-business-status.js.txt` or `TipOutBusinessStatus` does not exist.

- [ ] **Step 3: Implement the pure resolver and unfiltered fact adapter**

Expose an IIFE module on `window.TipOutBusinessStatus`. Keep `resolveBusinessStatus(facts)` pure. Validate finite non-negative amounts; validate punches only when `source === 'punch'`, `status === 'complete'`, timestamps parse, and duration is positive. Implement `getBusinessDayFacts(store, dateKey)` as the only adapter that aggregates complete-day Net Sales, original tips, and punches without accepting page filters.

- [ ] **Step 4: Wire the module into both runtimes**

Import the raw module in `tips-legacy-runtime.ts`, prepend it to the `distribution` and `details` dependency lists, and expose:

```ts
"var TipOutBusinessStatus=window.TipOutBusinessStatus;"
```

- [ ] **Step 5: Run the domain verification**

Run: `node scripts/verify-tipout-business-status.mjs`

Expected: PASS for sales-only, tip-only, punch-only, closed, manual-hours-only, incomplete-punch, zero-duration, and invalid-data cases.

- [ ] **Step 6: Commit**

```bash
git add src/team/tips/legacy/tipout-business-status.js.txt src/team/tips/tips-legacy-runtime.ts scripts/verify-tipout-business-status.mjs
git commit -m "feat: add tip business day eligibility"
```

### Task 2: Date summary filter, row status, and metrics

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `scripts/verify-tipout-business-status.mjs`

**Interfaces:**
- Consumes: `TipOutBusinessStatus.inspect(store, dateKey)`.
- Produces: `dateSummaryFilters.businessStatus`, `TipOutSummaryUi.filterDailyRowsByBusinessStatus(rows, value)`, per-row `businessStatusResult`, and persisted `dateBusinessStatus`.

- [ ] **Step 1: Add failing UI and filter assertions**

Assert the template contains `dateBusinessStatusField`, `dateBusinessStatusFilter`, and options `全部状态/open/closed`. Assert summary UI filters rows with `open`, `closed`, or no filter, and distribution state restores unknown saved values to `''`.

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs && node scripts/verify-tipout-business-status.mjs`

Expected: FAIL on missing business-status field and filter function.

- [ ] **Step 3: Add the date-only filter**

Place “营业状态” beside the existing date allocation-status control. Extend:

```js
var dateSummaryFilters = { allocationStatus: "", businessStatus: "" };
```

Persist only `open`, `closed`, or `''`. Hide the field when `activeSummaryView === 'employee'`; reset invalid saved values to all statuses.

- [ ] **Step 4: Derive row and task presentation**

Attach `businessStatusResult = TipOutBusinessStatus.inspect(store, dateKey)` before filtering. Render a green “正常营业” or gray “未营业” label and an error indicator when `issues.length > 0`. Apply this task state precedence:

```js
if (hasSnapshot) return issues.length ? "已分配（经营数据异常）" : (status === "closed" ? "已分配（营业状态异常）" : "已分配");
if (issues.length) return "经营数据异常";
return status === "closed" ? "无需分配" : "待分配";
```

- [ ] **Step 5: Implement intersected filtering and metric contributions**

Filter rows by business status and allocation status before calling `renderSummaryOverview`. Aggregate each visible day according to the specification’s contribution table; use snapshot values for confirmed rows, draft values for eligible pending rows, zeros for closed rows, and show “有 N 个日期经营数据异常，未计入拟分配金额” when applicable. Empty results render `$0.00` and pool count `0`.

- [ ] **Step 6: Add status styles**

Add scoped styles for open, closed, and data-error badges without altering employee summary badges.

- [ ] **Step 7: Run verification**

Run: `node scripts/verify-team-tips-native-views.mjs && node scripts/verify-tipout-business-status.mjs`

Expected: PASS, including open/closed/all filtering, intersection with allocation status, mixed metric aggregation, historical anomaly rows, and empty results.

- [ ] **Step 8: Commit**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt src/team/tips/legacy/tipout-summary-ui.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs scripts/verify-tipout-business-status.mjs
git commit -m "feat: add business status to tip date summary"
```

### Task 3: Detail-page closed and invalid states

**Files:**
- Modify: `src/team/tips/templates/details.html`
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `scripts/verify-tipout-business-status.mjs`

**Interfaces:**
- Consumes: `TipOutBusinessStatus.inspect(store, dateKey)`.
- Produces: `refreshDetailBusinessEligibility(store, dateKey)` and a detail eligibility message region.

- [ ] **Step 1: Add failing detail assertions**

Assert direct route initialization, store/date changes, and “更新小费数据” call `refreshDetailBusinessEligibility`; assert closed and invalid days do not call allocation calculation; assert the confirm button is disabled with the required message.

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs && node scripts/verify-tipout-business-status.mjs`

Expected: FAIL on missing eligibility refresh and message region.

- [ ] **Step 3: Add the detail eligibility presentation**

Add an `aria-live="polite"` message beside the fixed action area. Implement:

```js
function refreshDetailBusinessEligibility(store, dateKey) {
  detailBusinessEligibility = TipOutBusinessStatus.inspect(store, dateKey);
  renderDetailBusinessEligibility(detailBusinessEligibility);
  return detailBusinessEligibility;
}
```

Closed copy: “当天未营业，无法进行小费分配”。 Invalid copy: “经营数据异常，暂不可分配”。 Existing confirmed data remains visible and cancellable.

- [ ] **Step 4: Guard draft and auto calculation**

Before `scheduleDetailAutoAllocation`, rule recalculation, or update-data calculation, refresh eligibility. Do not create or refresh draft results unless `allocatable === true`.

- [ ] **Step 5: Run verification**

Run: `node scripts/verify-team-tips-native-views.mjs && node scripts/verify-tipout-business-status.mjs`

Expected: PASS for direct URL, date/store switch, update-data, closed, invalid, and historical-snapshot cases.

- [ ] **Step 6: Commit**

```bash
git add src/team/tips/templates/details.html src/team/tips/programs/details.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs scripts/verify-tipout-business-status.mjs
git commit -m "feat: guard tip detail by business status"
```

### Task 4: Shared write guard and batch allocation semantics

**Files:**
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/tipout-allocation-results-store.js.txt`
- Modify: `scripts/verify-tipout-business-status.mjs`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `TipOutBusinessStatus.inspect(store, dateKey)`.
- Produces: `TipOutAllocationResults.assertBusinessDayAllocatable(store, dateKey)` and batch result `{ allocatedCount, skippedClosedCount, skippedInvalidCount }`.

- [ ] **Step 1: Add failing write-boundary tests**

Test manual confirmation, re-confirmation, scheduled pure-punch allocation, and direct result-store writes against closed and invalid days. Test a mixed batch writes only eligible dates and returns exact allocated/skipped counts; an all-skipped batch performs no writes.

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-tipout-business-status.mjs`

Expected: FAIL because result-store writes are not domain guarded.

- [ ] **Step 3: Add the shared domain write guard**

Require every new or replacement confirmed snapshot write to pass:

```js
function assertBusinessDayAllocatable(store, dateKey) {
  var result = TipOutBusinessStatus.inspect(store, dateKey);
  if (!result.allocatable) {
    var error = new Error(result.issues.length ? "经营数据异常，暂不可分配" : "当天未营业，无法进行小费分配");
    error.code = result.issues.length ? "BUSINESS_DATA_INVALID" : "BUSINESS_DAY_CLOSED";
    throw error;
  }
  return result;
}
```

Do not apply this guard to read or cancel APIs.

- [ ] **Step 4: Route all detail writes through the guard**

Ensure manual confirm, re-confirm, and scheduled automatic allocation use the guarded write boundary. Catch domain errors, keep the prior snapshot unchanged, and render the canonical message.

- [ ] **Step 5: Implement skip-and-report batch behavior**

In `executeTipAllocationScope`, inspect each date before calculation and write. Skip closed and invalid dates; report “已分配 X 天，跳过未营业 Y 天，跳过数据异常 Z 天”. When `X === 0`, do not write or mark dates allocated.

- [ ] **Step 6: Run verification**

Run: `node scripts/verify-tipout-business-status.mjs && node scripts/verify-team-tips-native-views.mjs`

Expected: PASS for every write entry, unchanged historical snapshots, mixed batches, and all-skipped batches.

- [ ] **Step 7: Commit**

```bash
git add src/team/tips/programs/details.js.txt src/team/tips/programs/distribution.js.txt src/team/tips/legacy/tipout-allocation-results-store.js.txt scripts/verify-tipout-business-status.mjs scripts/verify-team-tips-native-views.mjs
git commit -m "feat: enforce tip business day allocation guard"
```

### Task 5: Integrated verification and browser acceptance

**Files:**
- Modify if verification gaps are found: `scripts/verify-tipout-business-status.mjs`
- Modify if static integration gaps are found: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: all interfaces from Tasks 1–4.
- Produces: a verified feature ready for review and merge.

- [ ] **Step 1: Run focused checks**

Run: `node scripts/verify-tipout-business-status.mjs`

Expected: PASS with no skipped cases.

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: `Team tips native view verification passed.`

- [ ] **Step 2: Run repository checks**

Run: `git diff --check`

Expected: exit code 0; line-ending warnings are acceptable, whitespace errors are not.

Run: `npm.cmd run build`

Expected: exit code 0 and Vite build completes.

- [ ] **Step 3: Verify date summary in browser**

Open `#/team/tips/distribution`. Confirm the business-status selector appears only on the date tab, defaults to all, filters open/closed rows, intersects with allocation status, updates five metrics, and shows `无需分配` for closed unallocated dates.

- [ ] **Step 4: Verify allocation protection in browser**

Open one open, one closed, and one invalid day. Confirm open dates retain current behavior; closed and invalid dates remain viewable but cannot calculate or confirm. Exercise a mixed batch and verify allocated/skipped counts.

- [ ] **Step 5: Commit verification-only changes if needed**

```bash
git add scripts/verify-tipout-business-status.mjs scripts/verify-team-tips-native-views.mjs
git commit -m "test: verify tip business status flow"
```

