# Tip Payout Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a store/day allocation to be marked paid and permanently lock its exact confirmed allocation snapshot against every later mutation.

**Architecture:** Replace the split allocation-result/index writes with one versioned state document per normalized `storeId + businessDate`, guarded by `navigator.locks`. Keep synchronous reads for rendering, but make every mutation asynchronous and route it through one `assertDateWritable`/locked transaction boundary; paid reads and exports use the immutable snapshot embedded in that document.

**Tech Stack:** TypeScript/Vite shell, legacy browser JavaScript modules loaded as raw text, Web Locks API, Web Crypto SHA-256, localStorage, Node `vm` verification scripts.

**Spec:** `admin-web/docs/superpowers/specs/2026-09-14-tip-payout-lock-design.md`

## Global Constraints

- Lock granularity is exactly one `storeId + businessDate`; employee-level payout is out of scope.
- Paid state is separate from business status and allocation status; `已发放` has no outgoing transition.
- Every confirmed snapshot has monotonically increasing `snapshotVersion` and an RFC 8785-style canonical JSON SHA-256 `snapshotHash`.
- A payout record is append-only and must bind the exact `snapshotId + snapshotVersion + snapshotHash`.
- After payout, only valid frozen-snapshot view/export is allowed; every mutation and manual payroll resync is rejected.
- Each store/day is stored in one versioned document and mutated only while holding its `navigator.locks` exclusive lock; unsupported locking fails closed.
- `BroadcastChannel`/`storage` events refresh views after commits but never provide mutual exclusion.
- Payout corruption fails closed and exposes audit/error information without live recomputation or export.
- No undo-payout behavior is introduced.
- No source under `vendor/emenu-new` is changed, so the eMenu embed build is not required.

---

### Task 1: Canonical snapshot hashing and date-state contract

**Files:**
- Create: `admin-web/src/team/tips/legacy/tipout-date-state-store.js.txt`
- Modify: `admin-web/src/team/tips/tips-legacy-runtime.ts`
- Create: `admin-web/scripts/verify-tipout-date-state-store.mjs`
- Modify: `admin-web/package.json`

**Interfaces:**
- Produces: `TipOutDateState.read(storeId, businessDate): DateState | null`
- Produces: `TipOutDateState.inspect(storeId, businessDate): { allocationStatus, payoutStatus, locked, error, state }`
- Produces: `TipOutDateState.commitAllocation(snapshot, expectedVersion?): Promise<AllocationSnapshot>`
- Produces: `TipOutDateState.cancelAllocation(storeId, businessDate, expectedVersion?): Promise<void>`
- Produces: `TipOutDateState.confirmPayout(input): Promise<PayoutRecord>` where input contains `storeId`, `businessDate`, expected snapshot triple, `requestId`, and actor fields.
- Produces: `TipOutDateState.assertDateWritable(storeId, businessDate, state): void`

- [ ] **Step 1: Write the failing store verification**

Create a Node `vm` harness with fake `localStorage`, deterministic `crypto.subtle.digest`, and fake `navigator.locks.request`. Assert the public interface and exact state transitions:

```js
const first = await api.commitAllocation(validSnapshot('s1'), 0);
assert.equal(first.snapshotVersion, 1);
assert.match(first.snapshotHash, /^[0-9a-f]{64}$/);
const second = await api.commitAllocation(validSnapshot('s2'), 1);
assert.equal(second.snapshotVersion, 2);
const paid = await api.confirmPayout({
  storeId: STORE, businessDate: DAY,
  expectedSnapshotId: second.snapshotId,
  expectedSnapshotVersion: second.snapshotVersion,
  expectedSnapshotHash: second.snapshotHash,
  requestId: 'request-1', paidById: 'demo-manager', paidByDisplayName: '王店长'
});
assert.equal(api.inspect(STORE, DAY).payoutStatus, 'paid');
assert.equal((await api.confirmPayout(/* same request */)).recordId, paid.recordId);
await assert.rejects(api.cancelAllocation(STORE, DAY), /小费已发放/);
```

Also assert different-request concurrency creates one payout record, stale snapshot triples fail, unsupported `navigator.locks` rejects mutations, corrupt/duplicate/mismatched payout data reports `payout-error` and remains locked, canonical key order yields the same hash, and `paidAt`/actor fields remain unchanged on retry.

- [ ] **Step 2: Run the verification and confirm failure**

Run: `node scripts/verify-tipout-date-state-store.mjs`

Expected: FAIL because `tipout-date-state-store.js.txt` and `TipOutDateState` do not exist.

- [ ] **Step 3: Implement the single-document locked store**

Use one localStorage key per encoded store/day and one lock name per normalized store/day:

```js
var PREFIX = 'tipout-date-state-v1:';
function stateKey(storeId, businessDate) {
  return PREFIX + encodeURIComponent(storeId) + ':' + businessDate;
}
function lockName(storeId, businessDate) {
  return 'tipout-date-write:' + encodeURIComponent(storeId) + ':' + businessDate;
}
async function withDateWriteLock(storeId, businessDate, expectedVersion, mutate) {
  if (!root.navigator || !root.navigator.locks || !root.navigator.locks.request) {
    throw new Error('当前浏览器不支持安全修改小费数据');
  }
  return root.navigator.locks.request(lockName(storeId, businessDate), { mode: 'exclusive' }, async function () {
    var state = read(storeId, businessDate) || emptyState(storeId, businessDate);
    if (expectedVersion != null && state.documentVersion !== expectedVersion) throw new Error('数据已更新，请刷新后重试');
    var next = await mutate(clone(state));
    next.documentVersion = state.documentVersion + 1;
    root.localStorage.setItem(stateKey(storeId, businessDate), JSON.stringify(next));
    notify(next);
    return clone(next);
  });
}
```

Canonicalize plain JSON recursively with sorted object keys and JSON primitives, exclude `snapshotHash`, then use `crypto.subtle.digest('SHA-256', bytes)`. Validate the entire snapshot before assigning UUID, incremented version, UTC confirmation metadata, and hash. Store `{ schemaVersion, documentVersion, storeId, businessDate, allocationSnapshot, payoutRecords }` in one write. `confirmPayout` rechecks the expected triple inside the lock, is idempotent by `requestId`, and never exposes update/delete payout APIs.

- [ ] **Step 4: Register the runtime dependency and package verification command**

Import the raw module before allocation/manual-hours/payroll modules and expose `var TipOutDateState=window.TipOutDateState;`. Add:

```json
"verify:tipout-payout-lock": "node scripts/verify-tipout-date-state-store.mjs"
```

- [ ] **Step 5: Run the focused verification**

Run: `npm run verify:tipout-payout-lock`

Expected: PASS with canonical hashing, monotonic versions, idempotency, corruption locking, and concurrency assertions.

- [ ] **Step 6: Commit the state contract**

```bash
git add admin-web/src/team/tips/legacy/tipout-date-state-store.js.txt admin-web/src/team/tips/tips-legacy-runtime.ts admin-web/scripts/verify-tipout-date-state-store.mjs admin-web/package.json
git commit -m "feat: add locked tip payout date state"
```

### Task 2: Migrate allocation reads and mutations to the date-state boundary

**Files:**
- Modify: `admin-web/src/team/tips/legacy/tipout-allocation-results-store.js.txt`
- Modify: `admin-web/src/team/tips/programs/details.js.txt`
- Modify: `admin-web/src/team/tips/programs/distribution.js.txt`
- Modify: `admin-web/src/team/tips/legacy/tipout-payroll-bridge.js.txt`
- Modify: `admin-web/scripts/verify-tipout-confirm-allocation-store.mjs`
- Create: `admin-web/scripts/verify-tipout-payout-mutation-guard.mjs`
- Modify: `admin-web/package.json`

**Interfaces:**
- Consumes: Task 1 `TipOutDateState` APIs.
- Produces: compatibility `TipOutAllocationResults.read/isAllocated/validate/commit/cancel/listAllocatedDates`, with `commit` and `cancel` returning promises.
- Produces: `executeDetailAllocation(...)` and batch allocation/cancellation awaiting guarded commits before payroll sync.

- [ ] **Step 1: Extend failing tests to enumerate every allocation mutation**

Update the existing confirmation-store verification to expect date-state documents instead of `tipout_allocated` plus `tipout_allocation_results_v1`. Add a mutation-guard harness that first pays a date, then invokes each exposed path and compares serialized storage before/after:

```js
const before = dumpStorage();
for (const mutate of [overwriteAllocation, cancelSingle, cancelBatch, allocateBatch, autoAllocate, refreshTips]) {
  await assert.rejects(() => mutate(), /小费已发放/);
  assert.deepEqual(dumpStorage(), before);
}
assert.equal(payrollSyncCalls, 0);
```

For a mixed batch, assert `{ selectedCount: 4, successCount: 1, paidSkippedCount: 1, closedSkippedCount: 1, invalidSkippedCount: 1, failedCount: 0 }`; race payout against the per-date commit and assert that date moves to `paidSkippedCount` with count conservation.

- [ ] **Step 2: Run both tests and confirm failure**

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs && node scripts/verify-tipout-payout-mutation-guard.mjs`

Expected: FAIL because allocation still writes split legacy keys and mutation paths do not await a date lock.

- [ ] **Step 3: Turn the allocation-results module into a compatibility facade**

Keep its existing snapshot validation, but delegate persistence:

```js
function read(store, dateKey) { return root.TipOutDateState.readAllocation(store, dateKey); }
function isAllocated(store, dateKey) { return root.TipOutDateState.inspect(store, dateKey).allocationStatus === 'allocated'; }
function commit(snapshot, expectedVersion) { return root.TipOutDateState.commitAllocation(snapshot, expectedVersion); }
function cancel(store, dateKey, expectedVersion) { return root.TipOutDateState.cancelAllocation(store, dateKey, expectedVersion); }
```

Add a one-time read migration under the same date lock: import a valid legacy result for the requested date into a versioned date document, then stop writing both legacy keys. Invalid legacy pairs surface `allocation-error` rather than pretending the date is allocated.

- [ ] **Step 4: Await all detail and summary allocation paths**

Make `executeDetailAllocation`, `confirmDetailAllocation`, scheduled auto-allocation, `submitTipAllocationScope`, single cancellation, and batch cancellation asynchronous. Recheck each date inside its transaction; only call `TipOutPayrollBridge.syncAfterAllocation` after one or more successful commits. Return the six mutually exclusive batch counts and enforce their sum equals `selectedCount`.

- [ ] **Step 5: Remove direct allocated-index persistence**

Replace `getAllocatedDatesForStore`, `saveAllocatedDatesForStore`, and payroll bridge parsing of `tipout_allocated` with `TipOutDateState.listDates(storeId)`/`inspect`. No production path may call `localStorage.setItem('tipout_allocated', ...)` or `localStorage.setItem('tipout_allocation_results_v1', ...)`.

- [ ] **Step 6: Run focused and existing allocation tests**

Run: `node scripts/verify-tipout-confirm-allocation-store.mjs && node scripts/verify-tipout-payout-mutation-guard.mjs && node scripts/verify-tipout-clock-rule-auto-allocation.mjs`

Expected: PASS, including zero writes and zero payroll calls for fully locked batches.

- [ ] **Step 7: Commit guarded allocation mutations**

```bash
git add admin-web/src/team/tips/legacy/tipout-allocation-results-store.js.txt admin-web/src/team/tips/programs/details.js.txt admin-web/src/team/tips/programs/distribution.js.txt admin-web/src/team/tips/legacy/tipout-payroll-bridge.js.txt admin-web/scripts/verify-tipout-confirm-allocation-store.mjs admin-web/scripts/verify-tipout-payout-mutation-guard.mjs admin-web/package.json
git commit -m "refactor: guard tip allocation mutations by date"
```

### Task 3: Guard manual hours, refresh, initialization, and synchronization writes

**Files:**
- Modify: `admin-web/src/team/tips/legacy/tipout-manual-hours-store.js.txt`
- Modify: `admin-web/src/team/tips/programs/details.js.txt`
- Modify: `admin-web/src/team/tips/legacy/tipout-payroll-bridge.js.txt`
- Extend: `admin-web/scripts/verify-tipout-payout-mutation-guard.mjs`

**Interfaces:**
- Consumes: `TipOutDateState.mutateWritableDate(storeId, businessDate, expectedVersion, mutator)` added in Task 1.
- Produces: asynchronous `TipOutManualHours.set/seed/remove`, stored inside the corresponding date document.
- Produces: payroll sync preflight that rejects paid dates before changing payroll data or metadata.

- [ ] **Step 1: Add failing manual-hours and synchronization assertions**

Pay a date, then assert `set`, `seed`, `remove`, detail refresh, demo reset/migration, and manual payroll sync all reject with the unified lock message. Assert byte-for-byte equality for date state, payroll state, bridge metadata, and timestamps. Also mutate global employee/rule fixtures and assert the paid snapshot does not change.

- [ ] **Step 2: Run the guard verification and confirm failure**

Run: `node scripts/verify-tipout-payout-mutation-guard.mjs`

Expected: FAIL at the first unguarded manual-hours write.

- [ ] **Step 3: Move manual hours into the date document**

Implement `manualHours` as a collection in Task 1's date state. Every setter receives `storeId` and awaits `mutateWritableDate`; read/list functions stay synchronous. Update detail input handlers to await persistence and restore the rendered locked snapshot on rejection.

- [ ] **Step 4: Guard refresh, initialization, repair, reset, and payroll synchronization**

Before any date-derived write, resolve all affected store/day keys, acquire locks in sorted key order to avoid deadlock, and run `assertDateWritable` for all dates before the first external write. If any date is paid, reject the whole manual sync/reset operation; ordinary batch allocation retains Task 2's per-date skip behavior.

- [ ] **Step 5: Run the mutation-guard verification**

Run: `node scripts/verify-tipout-payout-mutation-guard.mjs`

Expected: PASS with every listed mutation rejected and all tracked storage unchanged.

- [ ] **Step 6: Commit the remaining mutation guards**

```bash
git add admin-web/src/team/tips/legacy/tipout-manual-hours-store.js.txt admin-web/src/team/tips/programs/details.js.txt admin-web/src/team/tips/legacy/tipout-payroll-bridge.js.txt admin-web/scripts/verify-tipout-payout-mutation-guard.mjs
git commit -m "fix: block paid-date tip mutations"
```

### Task 4: Add payout status and confirmation interaction to date summary

**Files:**
- Modify: `admin-web/src/team/tips/templates/distribution.html`
- Modify: `admin-web/src/team/tips/programs/distribution.js.txt`
- Modify: `admin-web/src/team/tips/tips-page.css`
- Create: `admin-web/scripts/verify-tipout-payout-summary-ui.mjs`
- Modify: `admin-web/package.json`

**Interfaces:**
- Consumes: `TipOutDateState.inspect` and `confirmPayout`.
- Produces: `openConfirmPayoutModal(dateKey)`, `submitConfirmPayout()`, and summary row payout statuses `待分配/待发放/已发放/发放数据异常/无需发放`.

- [ ] **Step 1: Write failing summary UI verification**

Assert the generated page contains a `发放状态` column, a `确认已发放` action only for open+allocated+unpaid dates, and a confirmation dialog containing store, date, total amount, employee count, irreversible warning, and confirm/cancel buttons. In a VM interaction harness, confirm a valid date and assert the row becomes `已发放`; assert closed, pending, and corrupt dates do not expose the action.

- [ ] **Step 2: Run the UI verification and confirm failure**

Run: `node scripts/verify-tipout-payout-summary-ui.mjs`

Expected: FAIL because payout status and modal are absent.

- [ ] **Step 3: Add the summary status column and action**

Render status with strict priority: payout record present but invalid → `发放数据异常`; valid payout → `已发放`; valid open allocation → `待发放`; open without snapshot → `待分配`; closed without payout → `无需发放`. A later business-status change must never demote valid paid or payout-error rows.

- [ ] **Step 4: Add the irreversible confirmation modal**

Capture the visible snapshot triple when opening the modal. Generate one `requestId` per dialog opening and reuse it while the same submission retries. Disable buttons while awaiting `confirmPayout`; on stale data show “分配结果已更新，请刷新后重新确认”; on success close, rerender, and announce “已确认发放，分配结果已锁定”.

- [ ] **Step 5: Style status and modal states**

Use existing badge/modal tokens; add focus restoration to the invoking button, Escape-to-close before submission, `role="dialog"`, `aria-modal="true"`, and a live result message. Do not rely on color alone for status.

- [ ] **Step 6: Run UI verification and build**

Run: `npm run verify:tipout-payout-summary-ui && npm run build`

Expected: both commands PASS.

- [ ] **Step 7: Commit the summary interaction**

```bash
git add admin-web/src/team/tips/templates/distribution.html admin-web/src/team/tips/programs/distribution.js.txt admin-web/src/team/tips/tips-page.css admin-web/scripts/verify-tipout-payout-summary-ui.mjs admin-web/package.json
git commit -m "feat: confirm employee tip payout by date"
```

### Task 5: Make paid details immutable and snapshot-backed

**Files:**
- Modify: `admin-web/src/team/tips/templates/details.html`
- Modify: `admin-web/src/team/tips/programs/details.js.txt`
- Modify: `admin-web/src/team/tips/tips-page.css`
- Create: `admin-web/scripts/verify-tipout-paid-detail-lock.mjs`
- Modify: `admin-web/package.json`

**Interfaces:**
- Consumes: `TipOutDateState.inspect` and its frozen `allocationSnapshot`.
- Produces: `applyDetailPayoutMode(inspection)` rendering editable, paid-read-only, or payout-error mode.

- [ ] **Step 1: Write failing paid-detail verification**

Assert a valid paid date renders frozen employee names, roles, rules, hours, percentages, and amounts from its snapshot even after live fixtures change. Assert `更新小费数据`, `确认/重新确认分配`, row add/delete, percentage/hour inputs, and manual sync actions are absent or disabled. Assert the banner displays `已发放`, `paidAt`, and captured confirmer name. For a mismatched snapshot, assert only audit/error content renders and the allocation workspace remains empty.

- [ ] **Step 2: Run the detail verification and confirm failure**

Run: `node scripts/verify-tipout-paid-detail-lock.mjs`

Expected: FAIL because the page still rebuilds from live rules and keeps edit controls.

- [ ] **Step 3: Render paid dates exclusively from the frozen snapshot**

At the start of `renderDetailPage`, inspect payout state. For valid paid dates bypass `ruleData`, attendance, manual hours, synthetic source data, and allocation recalculation; render cards and totals directly from the stored snapshot. For payout errors render only audit metadata and the explicit error reason.

- [ ] **Step 4: Disable every modifying detail control**

Hide update/reconfirm actions, replace inputs with text, remove add/delete links, and display “小费已发放，分配结果已锁定，无法修改”. Keep store/date navigation and export available only for valid paid snapshots. Retain Task 1's domain guard so DOM manipulation cannot bypass locking.

- [ ] **Step 5: Run detail and regression verifications**

Run: `node scripts/verify-tipout-paid-detail-lock.mjs && node scripts/verify-tipout-detail-confirm-allocation.mjs && node scripts/verify-tipout-clock-rule-auto-allocation.mjs`

Expected: PASS for frozen rendering, error mode, and existing unpaid detail behavior.

- [ ] **Step 6: Commit paid read-only details**

```bash
git add admin-web/src/team/tips/templates/details.html admin-web/src/team/tips/programs/details.js.txt admin-web/src/team/tips/tips-page.css admin-web/scripts/verify-tipout-paid-detail-lock.mjs admin-web/package.json
git commit -m "feat: render paid tip details as locked snapshots"
```

### Task 6: Export only valid frozen paid snapshots

**Files:**
- Modify: `admin-web/src/team/tips/legacy/export.js.txt`
- Modify: `admin-web/src/team/tips/programs/employee-reconciliation.js.txt`
- Create: `admin-web/scripts/verify-tipout-paid-export.mjs`
- Modify: `admin-web/package.json`

**Interfaces:**
- Consumes: `TipOutDateState.inspect` and immutable paid snapshots.
- Produces: export collectors that use paid snapshots, refuse payout-error dates, and preserve existing live behavior for unpaid dates.

- [ ] **Step 1: Write failing export verification**

Create a paid snapshot, change live rule/roster/tip/hour fixtures, collect CSV/PDF model data, and deep-equal exported rows to the frozen snapshot. Corrupt the snapshot hash and assert export returns no file payload and raises “发放快照不可用”. Assert an employee reconciliation range containing valid paid days reads those days from their frozen snapshots.

- [ ] **Step 2: Run the export verification and confirm failure**

Run: `node scripts/verify-tipout-paid-export.mjs`

Expected: FAIL because collectors currently rebuild from live summary data.

- [ ] **Step 3: Add a shared export source resolver**

Implement:

```js
function resolveDateExportSource(storeId, businessDate) {
  var inspection = TipOutDateState.inspect(storeId, businessDate);
  if (inspection.payoutStatus === 'error') throw new Error('发放快照不可用');
  if (inspection.payoutStatus === 'paid') return { mode: 'snapshot', snapshot: inspection.state.allocationSnapshot };
  return { mode: 'live', snapshot: null };
}
```

Use it consistently in date-summary, detail, and employee-reconciliation export collectors. Abort the whole requested export if any included paid date is corrupt; never silently mix live data for that date.

- [ ] **Step 4: Run export and reconciliation verifications**

Run: `node scripts/verify-tipout-paid-export.mjs && node scripts/verify-tipout-employee-reconciliation.mjs`

Expected: PASS with snapshot fidelity and corrupt-export rejection.

- [ ] **Step 5: Commit snapshot-backed exports**

```bash
git add admin-web/src/team/tips/legacy/export.js.txt admin-web/src/team/tips/programs/employee-reconciliation.js.txt admin-web/scripts/verify-tipout-paid-export.mjs admin-web/package.json
git commit -m "fix: export frozen paid tip snapshots"
```

### Task 7: Cross-tab refresh, full regression, and browser acceptance

**Files:**
- Modify: `admin-web/src/team/tips/legacy/tipout-date-state-store.js.txt`
- Modify: `admin-web/src/team/tips/programs/distribution.js.txt`
- Modify: `admin-web/src/team/tips/programs/details.js.txt`
- Create: `admin-web/scripts/verify-tipout-payout-cross-tab.mjs`
- Modify: `admin-web/package.json`

**Interfaces:**
- Consumes: all preceding payout APIs and UI states.
- Produces: one `tipout-date-state-changed` notification contract `{ storeId, businessDate, documentVersion }` and page subscriptions that re-read rather than trusting notification data.

- [ ] **Step 1: Write failing cross-tab verification**

Simulate two tabs reading version 1. Let one confirm payout while the other attempts overwrite/cancel. Assert exactly one valid payout record, immutable snapshot triple equality, the losing mutation's lock error, unchanged confirmation actor/time, and both listeners receiving a refresh notification. Assert notification payload cannot mutate local state by itself.

- [ ] **Step 2: Run cross-tab verification and confirm failure**

Run: `node scripts/verify-tipout-payout-cross-tab.mjs`

Expected: FAIL until page subscriptions and notification behavior are complete.

- [ ] **Step 3: Complete refresh subscriptions**

Create one BroadcastChannel when supported and also listen for storage events. After a matching notification, summary/detail pages call `read/inspect` again and rerender. Close the channel and remove listeners in the runtime cleanup path; never write in response to a notification.

- [ ] **Step 4: Run all tip payout and adjacent regressions**

Run:

```bash
npm run verify:tipout-payout-lock
node scripts/verify-tipout-confirm-allocation-store.mjs
node scripts/verify-tipout-payout-mutation-guard.mjs
node scripts/verify-tipout-payout-summary-ui.mjs
node scripts/verify-tipout-paid-detail-lock.mjs
node scripts/verify-tipout-paid-export.mjs
node scripts/verify-tipout-payout-cross-tab.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
node scripts/verify-tipout-clock-rule-auto-allocation.mjs
npm run build
```

Expected: all commands PASS; no `vendor/emenu-new` file changes.

- [ ] **Step 5: Perform browser acceptance**

Start `npm run dev -- --host 127.0.0.1`, then verify one normal open date through `待分配 → 待发放 → 已发放`. Confirm the summary badge/action, audit modal data, frozen detail rendering, successful valid export, blocked refresh/reconfirm/cancel/manual-hours edits, batch skip counts, and a closed date showing `无需发放`. In a second tab, open the same date before confirming in the first and verify it refreshes to locked state without allowing a stale commit.

- [ ] **Step 6: Commit the completed feature**

```bash
git add admin-web/src/team/tips/legacy/tipout-date-state-store.js.txt admin-web/src/team/tips/programs/distribution.js.txt admin-web/src/team/tips/programs/details.js.txt admin-web/scripts/verify-tipout-payout-cross-tab.mjs admin-web/package.json
git commit -m "test: verify tip payout lock workflow"
```
