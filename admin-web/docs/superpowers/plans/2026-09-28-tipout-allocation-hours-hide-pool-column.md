# TipOut Allocation Hours Hide Pool Column Implementation Plan

> **For agentic workers:** Execute this single task inline or with a delegated reviewer. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the 小费池 display column from both allocation-hours detail dialogs.

**Architecture:** Change only the two dialog templates and their row renderers. Keep `poolId`, `poolName`, `poolKind`, normalization, and aggregation untouched. Update the existing browser regression to assert four correctly aligned cells.

**Tech Stack:** Vite, legacy JavaScript templates/programs, Playwright browser regression.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-allocation-hours-hide-pool-column-design.md`

## Global Constraints

- Both dialogs show exactly: 规则名称、规则类型、工时来源、分配工时.
- Do not change allocation-hour records, aggregation keys, money or hour calculations.
- Preserve `tip` → 小费池, `surcharge` → 加收服务费池, and unknown → — in the rule-type column.

---

### Task 1: Remove the pool display column in both dialogs

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Test: `scripts/verify-tipout-quick-allocation-browser.cjs`

**Interfaces:**
- Consumes existing `entry.ruleName`, `entry.poolKind`, `entry.source`, `entry.hours`.
- Produces four `<th>` and four `<td>` elements per row in each dialog.

- [x] **Step 1: Change browser assertions to the desired four-column contract.** Replace each five-label expected array with `['规则名称','规则类型','工时来源','分配工时']`; change both cell-count assertions from `5` to `4`; move the rule name check to index `0` and type check to index `1`; read all employee-detail type labels with `td:nth-child(2)`.
- [x] **Step 2: Run the browser regression to confirm RED.** Set `TIPOUT_BROWSER_PACKAGES` to the available Playwright package directory and run `node scripts/verify-tipout-quick-allocation-browser.cjs`; expect the first header assertion to fail while it still contains 小费池.
- [x] **Step 3: Update both templates and renderers.** Remove the first `<th>小费池</th>` in each template. In `openAllocationHoursDetail`, start the `<tr>` with `entry.ruleName` and omit `entry.poolName`. In `openEmployeeDetailAllocationHours`, remove `entry.poolName` from the values array and move the bold hours index from `4` to `3`.
- [x] **Step 4: Run verification.** Re-run the browser regression, `node scripts/verify-tipout-employee-hours-contract.mjs`, `node scripts/verify-team-tips-native-views.mjs`, `tsc --noEmit`, and scoped `git diff --check`. Confirm both dialogs still open and close as before.
- [x] **Step 5: Commit scoped files on local main.** Stage only the five files above plus this plan; leave unrelated dirty files untouched. Do not push without a separate user request.
