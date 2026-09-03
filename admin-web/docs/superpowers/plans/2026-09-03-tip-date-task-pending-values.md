# Tip Date Task Pending Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show `—` for deducted, received, and after values on unallocated native date-task rows while preserving every underlying amount.

**Architecture:** Add one pure presentation helper to the native distribution program. The row renderer selects formatted currency for allocated rows and `—` for unallocated rows without mutating the daily dataset or changing any shared summary/export consumer.

**Tech Stack:** Embedded browser JavaScript, Node.js VM contract tests, Vite build.

**Spec:** `docs/superpowers/specs/2026-09-03-tip-date-task-pending-values-design.md`

## Global Constraints

- Modify only the native page and its native verification script.
- Do not modify the old `dist/TipOut` implementation.
- Preserve raw `deducted`, `received`, and `after` numeric values.
- Do not change overview, employee reconciliation, export, allocation, or cancellation behavior.

---

### Task 1: Add pending-value presentation contract

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `distribution.js.txt` in a VM context.
- Produces: contract for `dailySummaryResultValue(allocated, value, prefix)`.

- [ ] **Step 1: Write the failing assertions**

```js
assert.equal(context.dailySummaryResultValue(false, 12.34, '-'), '—');
assert.equal(context.dailySummaryResultValue(false, 56.78, '+'), '—');
assert.equal(context.dailySummaryResultValue(true, 12.34, '-'), '-$12.34');
assert.equal(context.dailySummaryResultValue(true, 56.78, '+'), '+$56.78');
```

Also construct an unallocated row, call the helper, and assert its original numeric fields remain unchanged.

- [ ] **Step 2: Run the native verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because `dailySummaryResultValue` does not exist.

### Task 2: Implement display-only row rendering

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `allocated: boolean`, numeric value, optional sign prefix.
- Produces: display string `—`, `-$N.NN`, `+$N.NN`, or `$N.NN` without mutation.

- [ ] **Step 1: Add the pure helper**

```js
function dailySummaryResultValue(allocated, value, prefix) {
  if (!allocated) return '—';
  return (prefix || '') + money(value);
}
```

- [ ] **Step 2: Use the helper only in the three result cells**

Keep `money(row.before)` unchanged. Render deducted, received, and after with the helper and `row.allocated`; do not alter `buildDailyDataset()` or its row objects.

- [ ] **Step 3: Run focused regression**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
```

Expected: both pass. The native test verifies pending/allocated formatting and raw-object immutability; the existing reconciliation test verifies shared values remain available.

- [ ] **Step 4: Commit**

```bash
git add admin-web/src/team/tips/programs/distribution.js.txt admin-web/scripts/verify-team-tips-native-views.mjs
git commit -m "fix: hide unallocated tip result values"
```

### Task 3: Build and browser verification

**Files:**
- No planned source changes.

**Interfaces:**
- Consumes: completed row-rendering change.
- Produces: verified native page behavior.

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 2: Verify browser states**

In `#/team/tips/distribution`, confirm an unallocated date shows its before amount plus three `—` cells. Confirm an allocated date still shows all amounts. Trigger existing allocate/cancel actions only when safe test data is available and verify the display follows `allocated` state.

- [ ] **Step 3: Check scope**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and no unplanned source changes.
