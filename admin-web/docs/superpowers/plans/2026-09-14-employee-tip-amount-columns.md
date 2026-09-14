# Employee Tip Amount Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the employee summary list's combined adjustment presentation with four auditable tip amount columns.

**Architecture:** Reuse the existing integer-cent fields produced by `aggregateEmployeeDailyDatasets()` and render them directly in the employee table. Keep `finalAmountCents` as the final-result and sort key, while changing only the table header, row cells, column alignment, and regression assertions.

**Tech Stack:** Static HTML templates, browser JavaScript, CSS, Node.js assertion-based verification.

**Spec:** `docs/superpowers/specs/2026-09-14-employee-tip-amount-columns-design.md`

## Global Constraints

- Employee table order is `员工｜角色｜班次｜工时｜分配前小费｜扣除｜分配获得｜分配后小费｜状态｜操作`.
- Amounts come from `beforeCents`, `deductedCents`, `receivedCents`, and `finalAmountCents`; do not recalculate with floating-point values.
- Partial confirmation continues to show only confirmed, valid dates and the `已确认部分` note.
- No confirmed result or an invalid employee renders `—` for all four amount columns.
- `分配后小费` continues to sort by `finalAmountCents`; null values stay after numeric values in both directions.
- Do not change date summary, allocation calculations, confirmation flow, detail view, or exports.

---

### Task 1: Replace the employee amount columns

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `src/team/tips/templates/distribution.html:236-245`
- Modify: `src/team/tips/programs/distribution.js.txt:925-955`
- Modify: `src/team/tips/tips-page.css:2754-2761`

**Interfaces:**
- Consumes: employee aggregates containing `beforeCents`, `deductedCents`, `receivedCents`, `finalAmountCents`, `hasConfirmedAmount`, and `hasPartialConfirmed`.
- Produces: `renderEmployeeReconciliationList(aggregates)` rows with four amount cells in the same order as the table headers.
- Preserves: `toggleEmployeeSummarySort('finalAmount')` and `filterAndSortEmployeeAggregates()` using `finalAmountCents`.

- [ ] **Step 1: Add failing table-contract assertions**

In `scripts/verify-team-tips-native-views.mjs`, extract the employee table header block and assert the new ordered labels:

```js
const employeeTableHead = distributionTemplate.slice(
  distributionTemplate.indexOf('<table class="data-table tipout-summary-table tipout-employee-table">'),
  distributionTemplate.indexOf('</thead>', distributionTemplate.indexOf('<table class="data-table tipout-summary-table tipout-employee-table">')),
);
const employeeAmountHeaders = ["分配前小费", "扣除", "分配获得", "分配后小费"];
let previousEmployeeAmountHeader = -1;
for (const header of employeeAmountHeaders) {
  const index = employeeTableHead.indexOf(header);
  if (index < 0) failures.push(`distribution: employee amount header missing ${header}`);
  if (index >= 0 && index <= previousEmployeeAmountHeader) failures.push(`distribution: employee amount headers out of order at ${header}`);
  previousEmployeeAmountHeader = index;
}
for (const obsoleteHeader of [">原有小费<", ">净调整<", ">最终获得 "]) {
  if (employeeTableHead.includes(obsoleteHeader)) failures.push(`distribution: obsolete employee amount header remains ${obsoleteHeader}`);
}
for (const field of ["aggregate.beforeCents", "aggregate.deductedCents", "aggregate.receivedCents", "aggregate.finalAmountCents"]) {
  if (!distributionProgram.includes(field)) failures.push(`distribution: employee row amount field missing ${field}`);
}
if (!distributionProgram.includes('class="tip-amount--deduct"')) failures.push("distribution: employee deduction semantic style missing");
if (!distributionProgram.includes('class="tip-amount--receive"')) failures.push("distribution: employee received semantic style missing");
```

Keep the existing aggregation assertions for `beforeCents`, `netAdjustmentCents`, and `finalAmountCents`; they protect calculation compatibility even though `netAdjustmentCents` is no longer displayed.

- [ ] **Step 2: Run the verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL for the missing four-column header contract and the missing direct deduction/received row cells.

- [ ] **Step 3: Replace the employee table headers**

In `src/team/tips/templates/distribution.html`, replace the three old amount headers with:

```html
<th>分配前小费</th>
<th>扣除</th>
<th>分配获得</th>
<th aria-sort="descending"><button id="employeeSortFinalAmount" type="button" class="tipout-table-sort" data-native-onclick="toggleEmployeeSummarySort('finalAmount')">分配后小费 <span aria-hidden="true">↓</span></button></th>
```

Do not change the employee, role, shift, hours, status, or operation headers.

- [ ] **Step 4: Render the four integer-cent fields directly**

In `renderEmployeeReconciliationList()` remove `netClass`, `netValue`, and its plus-sign formatting. Replace the three old amount cells with:

```js
'<td>' + formatEmployeeSummaryMoney(aggregate.beforeCents, aggregate.hasConfirmedAmount) + '</td>' +
'<td><strong class="tip-amount--deduct">' + formatEmployeeSummaryMoney(aggregate.deductedCents, aggregate.hasConfirmedAmount) + '</strong></td>' +
'<td><strong class="tip-amount--receive">' + formatEmployeeSummaryMoney(aggregate.receivedCents, aggregate.hasConfirmedAmount) + '</strong></td>' +
'<td><strong class="tipout-employee-final">' + formatEmployeeSummaryMoney(aggregate.finalAmountCents, aggregate.hasConfirmedAmount) + '</strong>' + (aggregate.hasPartialConfirmed ? '<small class="tipout-employee-partial">已确认部分</small>' : '') + '</td>' +
```

Do not add a leading plus sign to `分配获得`; the column label already supplies the semantic direction and the existing green style distinguishes it visually.

- [ ] **Step 5: Align all four amount columns**

In `src/team/tips/tips-page.css`, extend the employee table minimum width and numeric alignment range:

```css
.tipout-page-summary .tipout-employee-table { min-width: 1160px; }
.tipout-page-summary .tipout-employee-table th:nth-child(n + 5):nth-child(-n + 8),
.tipout-page-summary .tipout-employee-table td:nth-child(n + 5):nth-child(-n + 8) { text-align: right; }
```

Keep the existing final operation-column width. The existing responsive rule may keep its larger `1200px` minimum.

- [ ] **Step 6: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS with no employee amount-column contract failures.

- [ ] **Step 7: Run the production build**

Run: `npm.cmd run build`

Expected: exit code 0. This task does not modify `vendor/emenu-new`, so the eMenu embed build is not required.

- [ ] **Step 8: Verify browser states**

Open `/team/tips/distribution?view=employee` and verify:

- the four amount headers appear in the specified order;
- a valid confirmed employee satisfies `分配后小费 = 分配前小费 - 扣除 + 分配获得`;
- a partially confirmed employee shows `已确认部分` beside `分配后小费`;
- a pending employee without confirmed dates and an abnormal employee show `—` in all four amount cells;
- clicking `分配后小费` toggles sorting while empty values remain below numeric values;
- role, employee, and status filters still update both rows and top metrics.

Switch to `/team/tips/distribution` and verify the date summary table is unchanged.

- [ ] **Step 9: Commit the implementation**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt src/team/tips/tips-page.css
git commit -m "feat: show employee tip amount breakdown"
```

