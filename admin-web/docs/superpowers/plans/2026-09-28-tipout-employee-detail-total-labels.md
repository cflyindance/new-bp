# TipOut Employee Detail Total Labels Implementation Plan

> **For agentic workers:** Execute this single task inline or with a delegated reviewer. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make employee daily-tip detail labels distinguish selected-period totals from per-day values.

**Architecture:** Change only static text in the employee-reconciliation template. Add exact-label assertions to native-view and browser regressions. Keep IDs, markup structure, rendering code, calculation, sorting and export untouched.

**Tech Stack:** Vite, legacy HTML template, Node static verification, Playwright browser regression.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-employee-detail-total-labels-design.md`

## Global Constraints

- Top metrics: 打卡总工时、分配工时、分配前总小费、贡献入池总额、从池分得总额、分配后总小费.
- Daily table: 打卡工时、分配工时、分配前小费、贡献入池、从池分得、分配后小费.
- Do not change computation, filtering, sorting, export, or other views.

---

### Task 1: Rename employee-detail labels

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html` — top metric labels and daily table headers.
- Test: `scripts/verify-team-tips-native-views.mjs` — exact template labels.
- Test: `scripts/verify-tipout-quick-allocation-browser.cjs` — rendered labels in the mounted employee detail fixture.

**Interfaces:**
- Consumes existing metric nodes `employeeDetailPunchHours`, `employeeDetailAllocationHours`, `employeeDetailBefore`, `employeeDetailDeducted`, `employeeDetailReceived`, `employeeDetailAfter`.
- Produces only new text nodes; no ID, data, or handler changes.

- [x] **Step 1: Add failing assertions.** In native-view verification, check the exact six `<span>` metric labels and daily `<th>` sequence. In the browser regression after `window.mountEmployeeDetailTest(employeeId)`, assert top metric label texts and the daily table header texts. Example: `assert.deepEqual(await page.locator('.tipout-employee-detail-metrics > div > span').allTextContents(), ['打卡总工时','分配工时','分配前总小费','贡献入池总额','从池分得总额','分配后总小费']);`.
- [x] **Step 2: Run RED.** Execute `node scripts/verify-team-tips-native-views.mjs` and the existing Playwright browser regression. Confirm old labels cause the new assertions to fail.
- [x] **Step 3: Update static template text.** Change only the six metric `<span>` labels and two daily `<th>` labels (`分配前` → `分配前小费`, `实际获得` → `分配后小费`). Leave other daily labels unchanged.
- [x] **Step 4: Run GREEN and safety checks.** Re-run both changed tests, `node scripts/verify-tipout-employee-hours-contract.mjs`, `tsc --noEmit`, and scoped `git diff --check`. Confirm row count, date sorting, and allocation-hours dialog continue to pass in the browser regression.
- [x] **Step 5: Commit on local main.** Stage only the three files above and this plan. Preserve unrelated dirty files; do not push without a separate request.
