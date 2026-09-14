# Employee Tip Summary Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ambiguous employee-summary metrics with four employee-scoped metrics whose values and labels match the filtered employee result set.

**Architecture:** Keep `TipOutSummaryUi.summarizeEmployeeAggregates()` as the single pure aggregation boundary and pass it the already-filtered, pre-pagination aggregate list. Update only the employee metric template and renderer; keep the date-summary strip and all allocation calculations unchanged.

**Tech Stack:** Static HTML templates, browser JavaScript, Node.js assertion-based verification script.

**Spec:** `docs/superpowers/specs/2026-09-14-employee-tip-summary-metrics-design.md`

## Global Constraints

- Date allocation summary continues to show `原始小费、入池金额、已分配、未分配、小费池数量` unchanged.
- Employee allocation summary shows only `当前筛选员工数、已确认最终获得合计、已完成人数、待确认人数`.
- Every employee metric is derived from the same fully filtered employee result set before pagination or viewport clipping.
- `异常` employees are counted only by the existing `另有异常 N 人` helper; `员工数 = 已完成 + 待确认 + 异常`.
- A valid empty confirmed total renders in the store currency; for the current USD demo store this is `$0.00`, never `—`.
- Do not change allocation, confirmation, cancellation, export, or employee-detail behavior.

---

### Task 1: Lock the employee metric contract and update the UI

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `src/team/tips/templates/distribution.html:227-232`
- Modify: `src/team/tips/programs/distribution.js.txt:813-822`

**Interfaces:**
- Consumes: `TipOutSummaryUi.summarizeEmployeeAggregates(aggregates)` returning `{ employeeCount, finalAmountCents, hasConfirmedAmount, completedCount, pendingCount, exceptionCount }`.
- Produces: `renderEmployeeSummaryMetrics(aggregates)` writing formatted values to `employeeMetricCount`, `employeeMetricFinal`, `employeeMetricCompleted`, `employeeMetricPending`, and the existing `employeeMetricExceptions` helper.

- [ ] **Step 1: Add failing contract assertions**

Extend `scripts/verify-team-tips-native-views.mjs` immediately after the existing employee metric ID checks:

```js
for (const copy of [
  "当前筛选员工数",
  "已确认最终获得合计",
  "已完成人数",
  "待确认人数",
  "仅统计已确认且校验通过的结果",
]) {
  if (!distributionTemplate.includes(copy)) failures.push(`distribution: employee metric copy missing ${copy}`);
}
for (const obsoleteCopy of [">员工人数<", ">最终获得合计<", ">已完成<", ">待处理<"]) {
  if (distributionTemplate.includes(obsoleteCopy)) failures.push(`distribution: ambiguous employee metric copy remains ${obsoleteCopy}`);
}
if (!distributionProgram.includes("money(summary.finalAmountCents / 100)")) failures.push("distribution: confirmed employee total must use store money formatter");
if (!distributionProgram.includes("money(0)")) failures.push("distribution: empty confirmed employee total must render a formatted zero");
if (!distributionProgram.includes("summary.employeeCount + ' 人'")) failures.push("distribution: employee count must include the 人 unit");
if (!distributionProgram.includes("summary.completedCount + ' 人'")) failures.push("distribution: completed count must include the 人 unit");
if (!distributionProgram.includes("summary.pendingCount + ' 人'")) failures.push("distribution: pending count must include the 人 unit");
```

Retain the existing pure aggregation fixture that asserts:

```js
assert.equal(employeeOverview.employeeCount, employeeOverview.completedCount + employeeOverview.pendingCount + employeeOverview.exceptionCount);
```

- [ ] **Step 2: Run verification and confirm the new assertions fail**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL messages report missing new labels, missing `人` units, and missing formatted zero behavior.

- [ ] **Step 3: Update the employee metric template copy**

Replace only the contents of `#employeeSummaryMetrics` in `src/team/tips/templates/distribution.html`:

```html
<div id="employeeSummaryMetrics" class="tipout-metric-strip tipout-employee-metrics" aria-label="员工分配结果概览">
  <div><span>当前筛选员工数</span><strong id="employeeMetricCount">0 人</strong></div>
  <div class="is-primary"><span>已确认最终获得合计</span><strong id="employeeMetricFinal">$0.00</strong><small>仅统计已确认且校验通过的结果</small></div>
  <div><span>已完成人数</span><strong id="employeeMetricCompleted">0 人</strong></div>
  <div><span>待确认人数</span><strong id="employeeMetricPending">0 人</strong><small id="employeeMetricExceptions" hidden></small></div>
</div>
```

Do not modify `#dateSummaryMetrics`.

- [ ] **Step 4: Update employee metric value formatting**

Change `renderEmployeeSummaryMetrics()` in `src/team/tips/programs/distribution.js.txt` to:

```js
function renderEmployeeSummaryMetrics(aggregates) {
  var summary = TipOutSummaryUi.summarizeEmployeeAggregates(aggregates);
  document.getElementById('employeeMetricCount').textContent = summary.employeeCount + ' 人';
  document.getElementById('employeeMetricFinal').textContent = summary.hasConfirmedAmount
    ? money(summary.finalAmountCents / 100)
    : money(0);
  document.getElementById('employeeMetricCompleted').textContent = summary.completedCount + ' 人';
  document.getElementById('employeeMetricPending').textContent = summary.pendingCount + ' 人';
  var exceptions = document.getElementById('employeeMetricExceptions');
  exceptions.hidden = summary.exceptionCount === 0;
  exceptions.textContent = summary.exceptionCount ? '另有异常 ' + summary.exceptionCount + ' 人' : '';
}
```

Keep the caller unchanged so the function continues to receive `visibleEmployeeSummaryAggregates`, the same post-filter list rendered by `renderEmployeeReconciliationList()`.

- [ ] **Step 5: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS with no employee metric contract failures.

- [ ] **Step 6: Run the production build**

Run: `npm.cmd run build`

Expected: command exits with code 0. Because this task does not modify `vendor/emenu-new`, the eMenu embed build is not required.

- [ ] **Step 7: Verify both views in the browser**

Open `/team/tips/distribution?view=employee` and verify:

- the four labels match the specification;
- counts include `人`;
- no confirmed result displays `$0.00` for the USD demo store;
- role, employee, and status filter changes update the cards and rows together;
- filtering to `异常` shows `0 人` completed, `0 人` pending, and `另有异常 N 人`.

Switch to `/team/tips/distribution` and verify the original five date/pool metrics remain unchanged.

- [ ] **Step 8: Commit the implementation**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt
git commit -m "feat: clarify employee tip summary metrics"
```

