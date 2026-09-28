# TipOut Employee Summary Total Labels Implementation Plan

> **For agentic workers:** Execute this single task inline or with a delegated reviewer. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the employee allocation summary table and role cards clearly label cumulative values over the selected period.

**Architecture:** Update only the employee-view table header template and role-card renderer; keep the data model, aggregation and sort handlers untouched. Extend existing native-view and browser regressions to lock the exact labels.

**Tech Stack:** Vite, legacy JavaScript templates/programs, Node contract verification, Playwright browser regression.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-employee-summary-total-labels-design.md`

## Global Constraints

- Table columns: 打卡总工时、分配工时、分配前总小费、贡献入池总额、从池分得总额、分配后总小费.
- Role cards use the same four monetary names as the table.
- Keep 分配工时 unchanged because multiple rule-specific hour values cannot be summed into one total.
- Do not alter calculations, sorting, filtering, navigation, or other TipOut views.

---

### Task 1: Rename cumulative labels in the employee summary view

**Files:**
- Modify: `src/team/tips/templates/distribution.html` — employee table header text only.
- Modify: `src/team/tips/programs/distribution.js.txt` — role summary card `<small>` labels only.
- Test: `scripts/verify-team-tips-native-views.mjs` — static exact header order and role-card text.
- Test: `scripts/verify-tipout-quick-allocation-browser.cjs` — rendered table and role-card labels.

**Interfaces:**
- Consumes the existing employee aggregates and role aggregates without changing their properties.
- Produces new visible labels while preserving the `employeeSortHours` and `employeeSortFinalAmount` buttons.

- [x] **Step 1: Write failing assertions.** In the native-view check, replace the employee amount header list with `["分配前总小费", "贡献入池总额", "从池分得总额", "分配后总小费"]` and assert `employeeTableHead` includes `打卡总工时` and `分配工时`. In the browser regression after `summaryRows.first().waitFor()`, assert the six header texts and that the first role card contains the four new monetary labels.
- [x] **Step 2: Run RED.** Run `node scripts/verify-team-tips-native-views.mjs`; expect the new header assertion to fail. Run the existing Playwright browser regression and expect the same label mismatch.
- [x] **Step 3: Make the minimal text changes.** Change `src/team/tips/templates/distribution.html` employee-view `<th>` text and the four `<small>` labels in `renderEmployeeRoleSummaryCards`; do not edit IDs, event handlers, or data expressions.
- [x] **Step 4: Run GREEN and safety checks.** Run both changed tests, `node scripts/verify-tipout-employee-hours-contract.mjs`, `tsc --noEmit`, and scoped `git diff --check`; confirm sort controls remain in place.
- [x] **Step 5: Commit on local main.** Stage only the four files above and this plan. Preserve unrelated dirty files; do not push without a separate request.
