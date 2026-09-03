# Tip Allocation Scope Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open a native modal for selecting store and inclusive dates before executing the existing tip allocation workflow.

**Architecture:** Add dialog markup to the native distribution template and keep its state in the existing embedded page program. Extract allocation execution into an explicit immutable scope function; the modal controller validates and locks submission, then synchronizes page filters and renders exactly once after the execution outcome.

**Tech Stack:** HTML template, embedded browser JavaScript, CSS, Node.js VM contract tests, Vite build.

**Spec:** `docs/superpowers/specs/2026-09-03-tip-allocation-scope-dialog-design.md`

## Global Constraints

- Modify only native team tips sources and native verification tests.
- Do not modify old `dist/TipOut` pages.
- Preserve rule validation, date allocation storage, payroll synchronization, cancellation, and result calculations.
- Use one frozen `{ store, startDate, endDate }` snapshot per submission.

---

### Task 1: Define modal and allocation-scope contracts

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: distribution template/program text.
- Produces: assertions for dialog fields, validation, scope snapshot, execution lock, and explicit allocation scope.

- [ ] **Step 1: Add failing template assertions**

Require ids `tipAllocationModal`, `allocationStore`, `allocationDateStart`, `allocationDateEnd`, `allocationScopeError`, `confirmAllocateBtn`, and handlers `openTipAllocationModal()`, `closeTipAllocationModal()`, `submitTipAllocationScope()`.

- [ ] **Step 2: Add failing pure-helper assertions**

Load or extract helpers and verify:

```js
assert.deepEqual(validateAllocationScope({ store: '', startDate: '2026-01-01', endDate: '2026-01-02' }), { field: 'store', message: '请选择门店' });
assert.deepEqual(validateAllocationScope({ store: 'Nai Cha', startDate: '2026-01-03', endDate: '2026-01-02' }), { field: 'dateStart', message: '开始日期不能晚于结束日期' });
assert.equal(validateAllocationScope({ store: 'Nai Cha', startDate: '2026-01-01', endDate: '2026-01-02' }), null);
```

- [ ] **Step 3: Run test and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because modal and helpers do not exist.

### Task 2: Implement modal UI and focus behavior

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/tips-page.css`
- Modify: `src/team/tips/programs/distribution.js.txt`

**Interfaces:**
- Consumes: page `storeSelect`, `dateStart`, `dateEnd`, and `allocateBtn`.
- Produces: `openTipAllocationModal()`, `closeTipAllocationModal(force)`, focus trap, Esc/overlay close, and modal field errors.

- [ ] **Step 1: Add accessible dialog markup**

Use the existing modal pattern with `role="dialog"`, `aria-modal="true"`, labelled title, description, store select, two date inputs, inline error, cancel, and submit actions. Change `#allocateBtn` to call `openTipAllocationModal()`.

- [ ] **Step 2: Populate fields on every open**

Clone store options from `#storeSelect`, copy its current value and both current dates, clear prior errors, show the dialog, and focus `#allocationStore`. If no rules exist, preserve the current notification and delayed rules navigation without opening.

- [ ] **Step 3: Implement close and keyboard behavior**

Cancel, close, overlay, and Esc close only while not submitting. Tab/Shift+Tab cycle inside the dialog. Closing restores focus to `#allocateBtn` and changes no page filter or allocation data.

- [ ] **Step 4: Style the dialog**

Match the screenshot: 400px desktop width, white panel, 12px radius, dim overlay, 24px padding, full-width controls, right-aligned actions, and responsive width `calc(100vw - 32px)`.

### Task 3: Execute one immutable allocation scope

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: validated `{ store, startDate, endDate }`.
- Produces: `validateAllocationScope(scope)`, `executeTipAllocationScope(scope)`, `submitTipAllocationScope()`, and a single refresh outcome.

- [ ] **Step 1: Validate and freeze scope**

Read modal values once, trim store, validate required fields and ordering, focus the invalid field, then create:

```js
var scope = Object.freeze({ store: store, startDate: startDate, endDate: endDate });
```

- [ ] **Step 2: Add a submission lock**

Set `allocationSubmitting = true`; disable modal actions and page allocation button. While true, close button, cancel, overlay, Esc, and repeated submit return without side effects.

- [ ] **Step 3: Extract explicit execution**

`executeTipAllocationScope(scope)` invalidates the cache, enumerates the inclusive scope dates without reading page controls, adds them to the existing allocated-date set, saves it, and calls payroll synchronization with exactly `scope.store`, `scope.startDate`, `scope.endDate`.

- [ ] **Step 4: Handle outcomes**

On success, copy the scope into page filters, call `renderDailySummaryList()` once, unlock, close, and show the existing success notification. Preserve the spec's separate pre-write, write-stage, and payroll-sync failure messages; refresh true stored state after any write-stage failure.

- [ ] **Step 5: Run focused regression**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
```

Expected: both pass, including no second confirmation and unchanged cancellation behavior.

- [ ] **Step 6: Commit implementation**

```bash
git add admin-web/src/team/tips/templates/distribution.html admin-web/src/team/tips/programs/distribution.js.txt admin-web/src/team/tips/tips-page.css admin-web/scripts/verify-team-tips-native-views.mjs
git commit -m "feat: select tip allocation scope"
```

### Task 4: Build and browser verification

**Files:**
- No planned source changes.

**Interfaces:**
- Consumes: completed modal workflow.
- Produces: verified native UI and production build.

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 2: Verify native browser flow**

Open `#/team/tips/distribution`; verify modal defaults, validation, Cancel/Esc/overlay behavior, focus return, store/date selection, no pre-submit allocation, successful filter synchronization, one visible refresh, and allocated rows showing amounts.

- [ ] **Step 3: Verify scope cleanliness**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and no unplanned source changes.
