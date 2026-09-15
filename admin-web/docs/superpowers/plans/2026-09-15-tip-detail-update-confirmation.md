# Tip Detail Update Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a destructive-change confirmation flow to “更新小费数据”, rebuild the editable detail from current rules only after confirmation, and prevent stale or unconfirmed drafts from being paid.

**Architecture:** Work from the current `main` native TipOut sources, not the legacy standalone HTML. Add the modal to the detail template, put the update-operation state machine in the detail program, and extend the shared date-state store with a persisted “unconfirmed update” marker keyed by store/date so refreshes, direct payout calls, and other tabs share one guard. Regenerate the native views, run the dedicated Node verifiers, then append the behavior to the existing authoritative PRD.

**Tech Stack:** Static HTML/CSS, browser JavaScript, `localStorage`, `storage` events, Node.js assertion scripts.

**Spec:** `docs/superpowers/specs/2026-09-15-tip-detail-update-confirmation-design.md`

## Global Constraints

- Confirmation must precede all rule and original-tip reads.
- Confirmed updates clear manual employees, manual hours, edited percentages, and derived temporary amounts.
- Failed, cancelled, stale, or superseded updates leave the complete prior state unchanged.
- An updated draft is not a confirmed allocation; payout remains disabled until re-confirmation.
- Paid dates remain read-only and cannot be updated.
- Do not modify unrelated dirty files in the shared worktree.

---

### Task 1: Lock the interaction and atomicity contract with regression assertions

**Files:**
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`
- Test: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `src/team/tips/templates/details.html`, `src/team/tips/programs/details.js.txt`, and `src/team/tips/legacy/tipout-date-state-store.js.txt` contracts.
- Produces: deterministic assertions for modal copy, entry guards, update state, storage synchronization, and success/failure behavior.

- [ ] **Step 1: Add failing structural assertions**

Add assertions that require `tipDataUpdateModal`, `confirmTipDataUpdate()`, `cancelTipDataUpdate()`, `isTipDataUpdatePending`, the exact destructive-change warning, a disabled processing state, and the success copy `小费数据已更新，请重新检查并补充需要的手工调整。`.

- [ ] **Step 2: Add failing domain-guard assertions**

Require helpers named `buildTipUpdateContext`, `buildTipUpdateFingerprint`, `hasUnconfirmedTipUpdate`, `markUnconfirmedTipUpdate`, and `clearUnconfirmedTipUpdate`; assert that the page listens for `storage` and that payout/update guards use the persisted store/date state rather than a page-only boolean.

- [ ] **Step 3: Run the verification and confirm failure**

Run: `node scripts/verify-tipout-interaction-refresh.mjs`

Expected: FAIL because the confirmation modal and update-state helpers are not present.

- [ ] **Step 4: Commit the failing test**

```bash
git add scripts/verify-tipout-interaction-refresh.mjs
git commit -m "test: cover tip detail update confirmation"
```

---

### Task 2: Implement the confirmation modal and atomic refresh flow

**Files:**
- Modify: `src/team/tips/templates/details.html:145-230`
- Modify: `src/team/tips/programs/details.js.txt:180-370`
- Modify: `src/team/tips/programs/details.js.txt:1690-1740`
- Test: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `ruleData.getRulesForStore()`, `renderDetailPage()`, current `storeSelect` and `detailDate` values, the existing manual-hours store/state, `TipOutDateState.assertDateWritable()`, and `showNotification(message, type)`.
- Produces: `updateTipData()`, `confirmTipDataUpdate()`, `cancelTipDataUpdate()`, `buildTipUpdateContext()`, and update-operation state scoped to the current store/date.

- [ ] **Step 1: Add the modal markup**

Insert `#tipDataUpdateModal` beside the existing formula modal. Use title `确认更新小费数据？`, the approved warning text, `取消` and `确认更新` buttons, an `aria-modal="true"` dialog role, and a live processing label. Do not allow overlay click or Escape to close while confirmation is processing.

- [ ] **Step 2: Change the update entry point**

Replace the immediate `renderDetailPage()` call in `updateTipData()` with guards for normal editable operation and unpaid state, capture the current store/date identity without reading rules, and open the modal. Cancelling or closing must restore focus to the update button and leave all mutable objects untouched.

- [ ] **Step 3: Compute against temporary state**

In `confirmTipDataUpdate()`, disable modal actions, capture rule/original-tip fingerprints, load current rules, create fresh manual state and calculation inputs in temporary variables, and render/recalculate only after all synchronous work succeeds. Do not clear `detailManualHoursState` before a successful commit.

- [ ] **Step 4: Revalidate before commit**

Before replacing the live draft, verify that store/date, paid state, rule fingerprint, original-tip fingerprint, and prior draft/confirmed fingerprint still match. If any value changed, discard the temporary result, close the processing state, reload current page state, and show a retry message.

- [ ] **Step 5: Finish success and failure states**

On success, atomically replace the editable state, re-render once, mark the date as having an unconfirmed update, disable payout, close the modal, restore focus, and show the approved success copy. On any exception, keep employees, hours, percentages, amounts, allocation state, snapshot, and audit values unchanged and show an error notification.

- [ ] **Step 6: Run the verification**

Run: `node scripts/verify-tipout-interaction-refresh.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the modal and refresh flow**

```bash
git add src/team/tips/templates/details.html src/team/tips/programs/details.js.txt scripts/verify-tipout-interaction-refresh.mjs
git commit -m "feat: confirm destructive tip data refresh"
```

---

### Task 3: Persist and synchronize the unconfirmed-update payout guard

**Files:**
- Modify: `src/team/tips/legacy/tipout-date-state-store.js.txt`
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`
- Test: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: store/date update fingerprint created in Task 2 and existing allocation/payout state used by the detail action bar.
- Produces: persisted `tipout_unconfirmed_updates_v1` entries, `TipOutDateState.hasUnconfirmedUpdate(store, date)`, `markUnconfirmedUpdate(store, date, fingerprint)`, and `clearUnconfirmedUpdate(store, date)`.

- [ ] **Step 1: Add persisted marker helpers**

Store markers by normalized store and ISO date. Each entry contains the refreshed draft fingerprint and update timestamp. Reading must tolerate missing or malformed storage and default to no marker.

- [ ] **Step 2: Apply the payout guard**

When a marker exists, keep `#confirmDetailPayoutBtn` visible but disabled and show `请先重新确认分配后再确认发放`. `TipOutDateState.confirmPayout()` must repeat the same domain check and reject direct invocation, not rely only on the button state.

- [ ] **Step 3: Clear the marker only after allocation confirmation**

After “确认分配” or “重新确认分配” successfully writes the new confirmed snapshot, clear the matching marker and restore the payout action. Cancellation, validation failure, and write failure must retain the marker.

- [ ] **Step 4: Synchronize other tabs**

Listen for the `storage` event for the marker and allocation/payout keys. If the current store/date is affected, refresh action availability; a paid state always wins, and a stale callback from an earlier update must not rewrite the page.

- [ ] **Step 5: Run verification and production syntax checks**

Run: `node scripts/verify-tipout-interaction-refresh.mjs && node scripts/verify-tipout-payout-lock.mjs && node scripts/verify-tipout-detail-confirm-allocation.mjs`

Expected: PASS, including marker persistence, payout rejection, marker clearing, and storage-listener assertions.

- [ ] **Step 6: Commit the synchronized payout guard**

```bash
git add src/team/tips/templates/details.html src/team/tips/programs/details.js.txt src/team/tips/legacy/tipout-date-state-store.js.txt scripts/verify-tipout-interaction-refresh.mjs scripts/verify-tipout-payout-lock.mjs scripts/verify-tipout-detail-confirm-allocation.mjs
git commit -m "fix: block payout for unconfirmed tip updates"
```

---

### Task 4: Append the confirmed behavior to the authoritative PRD

**Files:**
- Modify: `dist/TipOut/docs/PRD_产品需求文档.md`
- Test: `C:/Users/27273/.codex/skills/prd-architect/scripts/check_prd_version_history.py`

**Interfaces:**
- Consumes: completed behavior from Tasks 2-3.
- Produces: a new top version row and an incremental subsection under `8. 小费分配明细`.

- [ ] **Step 1: Increment the PRD version history**

Prepend `V2.2 | 2026-09-15` with the concrete summary: `更新小费数据增加覆盖确认；补充全量重算、未确认更新及发放保护规则` while preserving V2.1 and all older rows.

- [ ] **Step 2: Append the update behavior**

Add a subsection that records the exact modal copy, cleared manual-data scope, success message, atomic failure behavior, persisted “存在未确认更新” state, disabled payout feedback, cross-tab handling, and the requirement to re-confirm allocation.

- [ ] **Step 3: Add acceptance checklist entries**

Add checks for confirmation-before-read, cancellation/failure immutability, full manual-data reset, refresh persistence, cross-tab payout blocking, direct payout guard, original-tip fingerprint conflict, and marker clearing after re-confirmation.

- [ ] **Step 4: Verify version history**

Run: `python C:/Users/27273/.codex/skills/prd-architect/scripts/check_prd_version_history.py dist/TipOut/docs/PRD_产品需求文档.md`

Expected: `PRD version history check passed: V2.2`.

- [ ] **Step 5: Commit the PRD append**

```bash
git add dist/TipOut/docs/PRD_产品需求文档.md
git commit -m "docs: append tip data refresh confirmation"
```

---

### Task 5: Final regression and browser verification

**Files:**
- Verify: `src/team/tips/templates/details.html`
- Verify: `src/team/tips/programs/details.js.txt`
- Verify: `src/team/tips/legacy/tipout-date-state-store.js.txt`
- Verify: `scripts/verify-tipout-interaction-refresh.mjs`
- Verify: `dist/TipOut/docs/PRD_产品需求文档.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: evidence that the confirmed interaction works without regressing current TipOut navigation and detail rendering.

- [ ] **Step 1: Run deterministic regression**

Run: `node scripts/verify-tipout-interaction-refresh.mjs && node scripts/verify-tipout-payout-lock.mjs && node scripts/verify-tipout-detail-confirm-allocation.mjs && npm.cmd run verify-team-tips-native-views`

Expected: PASS.

- [ ] **Step 2: Start the existing local preview**

Run: `npm.cmd run dev -- --host 127.0.0.1 --port 65019`

Open: `http://127.0.0.1:65019/#/team/tips/details?date=2026-09-14&store=Golden%20Dragon%20Chinese%20Kitchen%20-%20Dallas%2C%20TX%2075231&from=summary&return=history`

- [ ] **Step 3: Verify the safe path manually**

Add a manual employee/hours adjustment, click “更新小费数据”, verify the warning, cancel, and confirm all displayed inputs and amounts remain unchanged.

- [ ] **Step 4: Verify the destructive path manually**

Reopen the dialog, confirm, verify manual data is cleared and recalculated, verify the success message, and verify payout is disabled with the re-confirmation explanation.

- [ ] **Step 5: Verify recovery and synchronization**

Refresh the page and open a second tab to confirm payout remains disabled. Re-confirm allocation and verify both tabs restore payout availability. Verify a paid date never offers update.

- [ ] **Step 6: Record final repository state**

Run `git status --short` and `git log -5 --oneline`; report only files and commits belonging to this feature and leave unrelated dirty files untouched.
