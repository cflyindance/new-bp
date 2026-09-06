# Tip Date Pool View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the date-task employee-led totals with a date summary and per-pool execution result while preserving the existing allocation engine and employee reconciliation behavior.

**Architecture:** Add a presentation-only pool projection beside the existing daily employee dataset. The projection reads the same store rules and deterministic day inputs already used by the detail page, aggregates pool execution rows by date, and passes the result to the summary table, date detail, and date export. Existing allocation writes and employee amount calculations remain unchanged.

**Tech Stack:** TypeScript/Vite host, native Shadow DOM templates, legacy JavaScript programs loaded as raw text, Node verification scripts.

**Spec:** `docs/项目文档/小费管理-日期任务小费池视角设计方案.md`

## Global Constraints

- Only native pages under `src/team/tips` may change; do not use the retired TipOut project.
- Do not change rule formulas, employee deduction/allocation algorithms, permissions, or stored historical allocation results.
- Uncalculated amounts display `—`; calculated zero displays `$0.00`.
- Original tips are counted once per date and are not summed from pool source amounts.

---

### Task 1: Date pool projection and summary table

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/tips-page.css`
- Test: `scripts/verify-team-tips-date-pool-view.mjs`

**Interfaces:**
- Consumes: `ruleData.getRulesForStore(store)`, existing `buildDailyDataset()` and allocation-date state.
- Produces: `buildDatePoolSummary(row)`, date rows containing `originalTips`, `poolAmount`, `allocatedAmount`, `unallocatedAmount`, `poolCount`, `poolExecutions`, and `aggregateStatus`.

- [ ] Write a failing verifier asserting the new headings, pool-count link, dash behavior, and pool summary projection.
- [ ] Run `node scripts/verify-team-tips-date-pool-view.mjs` and confirm failure.
- [ ] Implement the projection without changing `genDailyTip`, `TipAllocation`, or allocation persistence.
- [ ] Render `日期｜分配状态｜原始小费｜入池金额｜已分配｜未分配｜小费池｜操作`.
- [ ] Run the verifier and existing native tips verification.

### Task 2: Date detail pool hierarchy

**Files:**
- Modify: `src/team/tips/templates/details.html`
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Test: `scripts/verify-team-tips-date-pool-view.mjs`

**Interfaces:**
- Consumes: existing `genDayData()`, rule list, allocation-date state, and existing rule detail card builders.
- Produces: date-level metric strip and a pool execution summary table above existing employee allocation cards.

- [ ] Extend the failing verifier for date metrics and pool execution headings.
- [ ] Add the date summary metric strip without recalculating saved employee allocation results.
- [ ] Render one execution row per applicable rule/pool with its rule summary and status.
- [ ] Keep existing rule formula and employee detail cards as the third level.
- [ ] Verify empty-rule and unallocated-date states.

### Task 3: Date-task exports

**Files:**
- Modify: `src/team/tips/legacy/export.js.txt`
- Test: `scripts/verify-team-tips-date-pool-view.mjs`

**Interfaces:**
- Consumes: `buildDailyDataset()` and its pool projection.
- Produces: date-oriented export data with daily summaries, pool executions, and employee results.

- [ ] Extend the failing verifier for the new export columns and pool hierarchy.
- [ ] Change date CSV/PDF datasets to use the current filters and date/pool structure.
- [ ] Keep employee reconciliation export unchanged.
- [ ] Verify generated CSV/PDF fallback content uses the same displayed amounts.

### Task 4: Regression and browser verification

**Files:**
- Test: `scripts/verify-team-tips-date-pool-view.mjs`
- Test: existing `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: completed native date-task implementation.
- Produces: verified native UI behavior.

- [ ] Run focused and existing tips verification scripts.
- [ ] Run the project build.
- [ ] Open the native date-task page and verify allocated, unallocated, multiple-pool, detail-return, and employee-reconciliation states.
- [ ] Confirm no unrelated working-tree changes are included.

