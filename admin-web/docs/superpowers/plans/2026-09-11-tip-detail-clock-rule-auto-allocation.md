# Tip Detail Clock-Rule Auto Allocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically confirm an unallocated tip date when every current-store rule uses clock data, while retaining manual confirmation whenever any no-clock rule exists.

**Architecture:** Refactor the detail page's existing confirmation function into a shared executor used by manual and automatic entry points. Add a small page-lifecycle gate that evaluates current `store + date + rules`, prevents render loops, and delegates all persistence, rollback, snapshot, and payroll work to the existing confirmation pipeline.

**Tech Stack:** TypeScript/Vite host, legacy browser JavaScript raw runtime, DOM/localStorage/sessionStorage, Node `assert`/`vm` verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-detail-clock-rule-auto-allocation-design.md`

## Global Constraints

- Current applicable rules are exactly `ruleData.getRulesForStore(store)`; do not add date or status filtering.
- Any `clockin === "noclock"` rule blocks auto allocation for the entire date.
- Preserve manual confirm, reconfirm overwrite, cancellation, snapshot, rollback, and payroll semantics.
- Auto allocation must start only after the current rules and detail rows finish rendering.
- Never auto-reconfirm an allocated date and never show the overwrite dialog from the auto path.
- A failed attempt must not loop on rerender; switching away and back or reloading may attempt again.

---

### Task 1: Extract a reusable confirmation executor

**Files:**
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `scripts/verify-tipout-detail-confirm-allocation.mjs`

**Interfaces:**
- Consumes: `collectDetailAllocationSnapshot(store,dateKey,rules)`, `TipOutAllocationResults.validate/commit`, `TipOutPayrollBridge.syncAfterAllocation`.
- Produces: `executeDetailAllocation(options)` where `options` contains `store`, `dateKey`, `rules`, `wasAllocated`, and `automatic`; returns `{ saved: boolean, payrollSynced: boolean }` or throws before a successful save.

- [ ] **Step 1: Add failing structural assertions**

```js
assert.match(program, /function executeDetailAllocation\(options\)/);
assert.match(program, /executeDetailAllocation\(\{[\s\S]*automatic:\s*false/);
assert.match(program, /TipOutAllocationResults\.commit\(snapshot\)/);
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node scripts/verify-tipout-detail-confirm-allocation.mjs`

Expected: FAIL because `executeDetailAllocation` has not been extracted.

- [ ] **Step 3: Extract the shared executor**

Move snapshot collection, validation, commit, session-summary replacement, payroll sync, rerender, and notification into `executeDetailAllocation(options)`. Keep the approved messages: manual success uses “分配成功/重新分配成功”; automatic success uses “已根据打卡规则自动完成分配”; payroll failure retains the saved allocation and uses the existing retry message.

```js
function executeDetailAllocation(options) {
  var snapshot = collectDetailAllocationSnapshot(options.store, options.dateKey, options.rules);
  var error = TipOutAllocationResults.validate(snapshot);
  if (error) throw new Error(error);
  TipOutAllocationResults.commit(snapshot);
  sessionStorage.setItem('tipout-date-pool-summary-v1', JSON.stringify({ dateKey: options.dateKey, store: options.store, poolSummary: snapshot.summary }));
  TipOutPayrollBridge.syncAfterAllocation(options.store, options.dateKey, options.dateKey);
  return { saved: true, payrollSynced: true };
}
```

- [ ] **Step 4: Keep manual confirm behavior on the executor**

`confirmDetailAllocation()` must still guard duplicate submits, ask the overwrite question only for allocated dates, set the existing progress labels, call the executor with `automatic: false`, and restore the button in `finally`.

- [ ] **Step 5: Run existing confirmation regressions**

Run:

```bash
node scripts/verify-tipout-detail-confirm-allocation.mjs
node scripts/verify-tipout-confirm-allocation-store.mjs
node scripts/verify-team-tips-date-pool-view.mjs
```

Expected: all commands PASS.

- [ ] **Step 6: Commit the executor refactor**

```bash
git add src/team/tips/programs/details.js.txt scripts/verify-tipout-detail-confirm-allocation.mjs
git commit -m "refactor: share tip detail allocation executor"
```

### Task 2: Add pure-clock eligibility and lifecycle gate

**Files:**
- Modify: `src/team/tips/programs/details.js.txt`
- Create: `scripts/verify-tipout-clock-rule-auto-allocation.mjs`

**Interfaces:**
- Consumes: `executeDetailAllocation(options)`, `TipOutAllocationResults.isAllocated(store,dateKey)`, `ruleData.getRulesForStore(store)`.
- Produces: `getDetailAutoAllocationEligibility(store,dateKey,rules)` and `scheduleDetailAutoAllocation(store,dateKey,rules)`.

- [ ] **Step 1: Write failing eligibility tests**

Extract and execute the pure helper in `vm`, asserting:

```js
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "clock" }]).eligible, true);
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "clock" }, { clockin: "clock" }]).eligible, true);
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "noclock" }]).reason, "manual-rule");
assert.equal(eligible("Store", "2026-09-11", [{ clockin: "clock" }, { clockin: "noclock" }]).reason, "manual-rule");
assert.equal(eligible("", "2026-09-11", [{ clockin: "clock" }]).reason, "invalid-scope");
assert.equal(eligible("Store", "2026-09-11", []).reason, "no-rules");
```

- [ ] **Step 2: Run the new test and verify failure**

Run: `node scripts/verify-tipout-clock-rule-auto-allocation.mjs`

Expected: FAIL because the eligibility helper is missing.

- [ ] **Step 3: Implement exact eligibility**

Return `{ eligible, reason }`; require a nonempty store, ISO date, at least one rule, every rule not equal to `noclock`, and an unallocated exact store/date. Do not mutate rules or infer future date effectiveness.

- [ ] **Step 4: Implement the page-lifecycle attempt gate**

Track `detailAutoAllocationSelectionKey`, `detailAutoAllocationAttemptedKey`, and `detailAutoAllocationRunning`. When selection changes, clear the old attempt lock. Mark the new key attempted and running before invoking the executor. Clear running in `finally`, but leave the attempt lock until selection changes or the page reloads.

```js
function scheduleDetailAutoAllocation(store, dateKey, rules) {
  var key = store + "\u0000" + dateKey;
  if (key !== detailAutoAllocationSelectionKey) {
    detailAutoAllocationSelectionKey = key;
    detailAutoAllocationAttemptedKey = '';
  }
  if (detailAutoAllocationRunning || detailAutoAllocationAttemptedKey === key) return;
  var eligibility = getDetailAutoAllocationEligibility(store, dateKey, rules);
  if (!eligibility.eligible) return;
  detailAutoAllocationAttemptedKey = key;
  detailAutoAllocationRunning = true;
  try {
    executeDetailAllocation({ store: store, dateKey: dateKey, rules: rules, wasAllocated: false, automatic: true });
  } finally {
    detailAutoAllocationRunning = false;
  }
}
```

- [ ] **Step 5: Trigger only after detail rendering**

At the end of the successful `renderDetailPage()` rule-card render, call `syncDetailAllocationAction()` and then queue `scheduleDetailAutoAllocation(store,dateKey,rules)` with `setTimeout(..., 0)` so all DOM-derived amounts exist. Do not schedule from the no-rule early return.

- [ ] **Step 6: Test success, blocking, and loop prevention**

Use fake executor/state functions to assert: pure-clock unallocated calls once; rerender calls zero additional times; allocated calls zero; no-clock and mixed rules call zero; switching away and back permits one new attempt; automatic path never calls `window.confirm`.

- [ ] **Step 7: Commit auto allocation**

```bash
git add src/team/tips/programs/details.js.txt scripts/verify-tipout-clock-rule-auto-allocation.mjs
git commit -m "feat: auto allocate pure clock tip rules"
```

### Task 3: Regression, build, and browser acceptance

**Files:**
- Modify only the Task 1–2 files if verification exposes a defect.

**Interfaces:**
- Consumes: completed automatic and manual detail allocation paths.
- Produces: verified native-page behavior and production build.

- [ ] **Step 1: Run all focused tests**

```bash
node scripts/verify-tipout-clock-rule-auto-allocation.mjs
node scripts/verify-tipout-detail-confirm-allocation.mjs
node scripts/verify-tipout-confirm-allocation-store.mjs
node scripts/verify-team-tips-date-pool-view.mjs
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
```

Expected: every command exits 0.

- [ ] **Step 2: Build the native application**

Run: `npm.cmd run build`

Expected: TypeScript and Vite exit 0. Restore unrelated generated build artifacts before committing.

- [ ] **Step 3: Verify browser scenarios**

Verify in the native page: entering a pure-clock unallocated date auto-allocates; switching to another pure-clock date auto-allocates once; entering a mixed/no-clock date remains manual; already allocated dates do not auto-run; canceling and re-entering a pure-clock date recalculates; payroll failure leaves an allocated result and “重新确认分配” allows retry.

- [ ] **Step 4: Inspect final scope**

```bash
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Expected: only the approved spec/plan, detail program, and focused verification files are included.
