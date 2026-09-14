# Remove Employee Summary Status Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the four-card employee status summary row without affecting the amount summary, employee list, filters, or detail navigation.

**Architecture:** Delete the complete metrics container from the distribution template and remove its dedicated render function/call sites. Keep shared employee aggregate calculations because the list and filters still consume them. Reverse the static verification contract so removed IDs and copy are forbidden.

**Tech Stack:** HTML templates, legacy browser JavaScript, Node.js static verification, Vite build

**Spec:** `docs/superpowers/specs/2026-09-14-remove-employee-summary-status-metrics-design.md`

## Global Constraints

- Remove all four cards and the exception helper copy as one unit.
- Do not hide the block with CSS.
- Preserve the amount summary, filters, employee table, row status, export, and detail navigation.
- Do not remove shared aggregate calculations used outside this metrics block.

---

### Task 1: Remove status metrics safely

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/programs/distribution.js.txt`

**Interfaces:**
- Consumes: existing employee summary render pipeline and employee aggregate array.
- Produces: an employee summary panel whose first child is the employee table and which has no `employeeMetric*` DOM dependency.

- [ ] **Step 1: Reverse the static verification contract**

Remove the old uniqueness/presence assertions for the four metric IDs and add absence assertions:

```js
for (const token of [
  'employeeSummaryMetrics', 'employeeMetricCount', 'employeeMetricFinal',
  'employeeMetricCompleted', 'employeeMetricPending', 'employeeMetricExceptions',
  '当前筛选员工数', '已确认最终获得合计', '已完成人数', '待确认人数',
  '仅统计已确认且校验通过的结果'
]) {
  if (distributionTemplate.includes(token)) failures.push(`distribution: removed employee metric returned ${token}`);
}
```

Add a program assertion that `renderEmployeeSummaryMetrics` and direct `employeeMetric` DOM references no longer occur. Retain the existing checks for `employeeSummaryList`, filters, sort buttons, and employee row rendering.

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the metrics template and renderer still exist.

- [ ] **Step 3: Delete the template block**

Delete the entire element beginning with:

```html
<div id="employeeSummaryMetrics" class="tipout-metric-strip tipout-employee-metrics" aria-label="员工分配结果概览">
```

and ending after the `employeeMetricPending` card. Leave the following `.tipout-table-wrap` intact.

- [ ] **Step 4: Delete dedicated render code and calls**

Delete `renderEmployeeSummaryMetrics(aggregates)` in full. Locate every call with:

```bash
rg -n "renderEmployeeSummaryMetrics|employeeMetric" src/team/tips/programs/distribution.js.txt
```

Remove only the dedicated call(s). Do not remove `TipOutSummaryUi.summarizeEmployeeAggregates` or aggregate fields still used for table rows, filters, sorting, export, or status.

- [ ] **Step 5: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `git diff --check -- scripts/verify-team-tips-native-views.mjs src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt`

Expected: no whitespace errors.

- [ ] **Step 6: Run full build**

Run: `npm.cmd run build`

Expected: exit code 0; existing non-blocking bundle-size and missing kiosklite embed notices are acceptable.

- [ ] **Step 7: Verify in browser**

Open `#/team/tips/distribution?view=employee` and verify the amount summary remains, the removed four-card row leaves no blank placeholder, and filters, list rows, and employee-detail navigation still work.

- [ ] **Step 8: Commit scoped files**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt
git commit -m "refactor: remove employee summary status metrics"
```
