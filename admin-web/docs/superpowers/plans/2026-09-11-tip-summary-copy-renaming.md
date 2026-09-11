# Tip Summary Copy Renaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the two native tip-management views to “日期分配汇总” and “员工分配汇总” across every user-visible UI and existing export path without changing behavior or technical contracts.

**Architecture:** Keep all existing routing, state, calculation, and export collectors intact. Add deterministic source-level regression assertions first, then update only presentation strings in the native templates and programs, and finally verify both summary views and the employee-detail view in the browser.

**Tech Stack:** HTML templates, browser JavaScript stored in `.js.txt`, Node.js `assert`/`vm` verification scripts, Vite.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-summary-copy-renaming-design.md`

## Global Constraints

- `分配汇总` becomes `日期分配汇总`; `员工对账` becomes `员工分配汇总` in user-visible copy.
- Preserve `/team/tips/distribution?view=employee`, `/team/tips/employee-reconciliation`, URL parameters, `employeeReconciliation*`/`dateTask*` identifiers, DOM IDs, storage keys, data shapes, filters, permissions, and all calculations.
- Date-summary exports use `Date Tip Allocation Summary` and `DateTipAllocationSummary_`.
- Employee-summary exports use `Employee Tip Allocation Summary` and `EmployeeTipAllocationSummary_`.
- Employee-detail print body uses `{employee} 员工分配汇总`; its browser `<title>` and employee/date-based filenames remain unchanged.
- Do not introduce an email subject field or a new employee-detail jsPDF/CSV-title path.
- Do not include unrelated dirty generated files in any commit.

---

### Task 1: Lock the renamed-copy and compatibility contracts

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs:205-299`

**Interfaces:**
- Consumes: source strings from the distribution template/program, employee-detail template/program, and shared export program.
- Produces: deterministic assertions that fail until all requested presentation strings are updated while technical identifiers remain present.

- [ ] **Step 1: Replace the old positive copy assertion with exact new UI assertions**

```js
for (const token of ["日期分配汇总", "员工分配汇总", "员工小费分配汇总", "当前筛选范围暂无员工分配汇总数据"]) {
  if (!distributionTemplate.includes(token)) failures.push(`distribution: renamed summary copy missing ${token}`);
}
for (const token of ["← 返回员工分配汇总", "分配汇总日期范围", "员工分配汇总金额概览", "员工逐日分配明细", "当前筛选条件下暂无分配明细", "无法展示分配汇总明细"]) {
  if (!employeeDetailTemplate.includes(token)) failures.push(`employee detail: renamed copy missing ${token}`);
}
```

- [ ] **Step 2: Add old-visible-copy rejection and technical-contract preservation assertions**

```js
for (const token of [">分配汇总</button>", ">员工对账</button>", "返回员工对账", "员工对账金额概览", "员工逐日对账明细", "暂无对账明细", "无法展示对账明细"]) {
  if (distributionTemplate.includes(token) || employeeDetailTemplate.includes(token)) failures.push(`tip copy: obsolete visible copy remains ${token}`);
}
for (const token of ["employeeReconciliationTab", "employeeReconciliationPanel", "employeeReconciliationList", "dateTaskTab", "setSummaryView('employee')"]) {
  if (!distributionTemplate.includes(token)) failures.push(`distribution: technical contract changed ${token}`);
}
```

- [ ] **Step 3: Add export-path assertions for exact titles, filenames, notifications, and preserved personal-detail title behavior**

```js
for (const token of ["Date Tip Allocation Summary", "DateTipAllocationSummary_", "Employee Tip Allocation Summary", "EmployeeTipAllocationSummary_", "正在生成员工分配汇总", "员工分配汇总 CSV 导出成功", "员工分配汇总 PDF 导出成功"]) {
  if (!distributionExport.includes(token)) failures.push(`distribution export: renamed contract missing ${token}`);
}
for (const token of ["Employee Reconciliation Report", "Tip Pool Date Report", "EmployeeReconciliation_", "TipPoolDateReport_", "TipDistribution_"]) {
  if (distributionExport.includes(token)) failures.push(`distribution export: obsolete name remains ${token}`);
}
assert.equal(employeeDetailContext.employeeDetailExportFilename({ name: '王店长', start: '2026-01-01', end: '2026-01-31' }, 'pdf'), '王店长_2026-01-01_2026-01-31.pdf');
const detailPrintHtml = employeeDetailContext.buildEmployeeDetailPrintHtml({ name: '王店长', role: 'Manager', start: '2026-01-01', end: '2026-01-31', attendance: '全部状态', rows: [] });
assert.ok(detailPrintHtml.includes('<h1>王店长 员工分配汇总</h1>'));
assert.ok(detailPrintHtml.includes('<title>王店长_2026-01-01_2026-01-31</title>'));
```

- [ ] **Step 4: Run the focused verification and confirm it fails on missing new copy**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL with one or more `renamed ... missing` failures; existing calculation assertions still execute without reporting changed totals.

- [ ] **Step 5: Commit the failing contract test**

```bash
git add scripts/verify-team-tips-native-views.mjs
git commit -m "test: lock tip summary display names"
```

### Task 2: Rename native summary and employee-detail UI copy

**Files:**
- Modify: `src/team/tips/templates/distribution.html:140-230`
- Modify: `src/team/tips/templates/employee-reconciliation.html:5-56`
- Modify: `src/team/tips/programs/distribution.js.txt:629`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt:135-222`

**Interfaces:**
- Consumes: existing `setSummaryView`, `openEmployeeReconciliationDetail`, employee snapshot, and export filename helpers without changing signatures.
- Produces: new visible Tab, accessible, empty/error, notification, and employee-detail print copy.

- [ ] **Step 1: Update the summary Tabs and employee-list accessible/empty copy**

```html
<button type="button" id="dateTaskTab" ...>日期分配汇总</button>
<button type="button" id="employeeReconciliationTab" ...>员工分配汇总</button>
<tbody id="employeeReconciliationList" aria-label="员工小费分配汇总"></tbody>
<div id="employeeReconciliationEmpty" class="tipout-empty-state" hidden>当前筛选范围暂无员工分配汇总数据</div>
```

- [ ] **Step 2: Update all employee-detail visible and accessible strings while retaining DOM IDs and handlers**

```html
<button type="button" class="btn" data-native-onclick="returnToEmployeeReconciliation()">← 返回员工分配汇总</button>
<div class="tipout-detail-date-range" aria-label="分配汇总日期范围">
<div class="tipout-employee-detail-metrics" aria-label="员工分配汇总金额概览">
<tbody id="employeeDetailRows" aria-label="员工逐日分配明细"></tbody>
<strong>当前筛选条件下暂无分配明细</strong>
<strong>无法展示分配汇总明细</strong><p>分配汇总明细上下文已失效，请返回员工分配汇总列表重新进入。</p>
```

- [ ] **Step 3: Update programmatic UI messages and print-body heading only**

```js
showNotification('无法打开员工分配汇总明细，请重试', 'error');
return String(value || '员工分配汇总').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
// In buildEmployeeDetailPrintHtml only:
employeeDetailEscapeHtml(data.name) + ' 员工分配汇总</h1>'
```

Keep `employeeDetailExportFilename(data, extension)` unchanged so its `<title>` remains `员工姓名_开始日期_结束日期`.

- [ ] **Step 4: Run the focused verification and isolate any remaining failure to shared exports**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: UI/template/program assertions PASS; export-name assertions remain FAIL until Task 3.

- [ ] **Step 5: Commit the native UI rename**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/distribution.js.txt src/team/tips/programs/employee-reconciliation.js.txt
git commit -m "feat: rename tip summary views"
```

### Task 3: Rename existing export presentation contracts and verify end to end

**Files:**
- Modify: `src/team/tips/legacy/export.js.txt:110-523`
- Modify: `scripts/verify-team-tips-native-views.mjs:205-299` only if an assertion needs fixture correction, not to weaken coverage.

**Interfaces:**
- Consumes: unchanged `collectDateTaskExportData`, `collectEmployeeReconciliationExportData`, `collectCurrentSummaryExportData`, PDF/CSV data shapes, and email-format selection.
- Produces: renamed CSV headings/files, jsPDF titles/files, print fallback headings/titles, and email notifications.

- [ ] **Step 1: Rename date-summary CSV/PDF titles and every date-summary filename prefix**

```js
lines.push('Date Tip Allocation Summary');
a.download = 'DateTipAllocationSummary_' + data.dateStart + '_' + data.dateEnd + '.csv';
doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Date Tip Allocation Summary</title>...');
doc.write('<h1>Date Tip Allocation Summary</h1>...');
doc.text('Date Tip Allocation Summary', 14, 16);
doc.save('DateTipAllocationSummary_' + data.dateStart + '_' + data.dateEnd + '.pdf');
showNotification('正在生成日期分配汇总 PDF 预览页面...', 'info');
```

- [ ] **Step 2: Rename employee-summary CSV/PDF titles, filenames, and notifications**

```js
showNotification('正在生成员工分配汇总 CSV 文件...', 'info');
var lines = ['Employee Tip Allocation Summary'];
a.download = 'EmployeeTipAllocationSummary_' + data.dateStart + '_' + data.dateEnd + '.csv';
showNotification('员工分配汇总 CSV 导出成功', 'success');
doc.write('<title>Employee Tip Allocation Summary</title>');
doc.write('<h1>Employee Tip Allocation Summary</h1>...');
doc.text('Employee Tip Allocation Summary', 14, 16);
doc.save('EmployeeTipAllocationSummary_' + data.dateStart + '_' + data.dateEnd + '.pdf');
```

- [ ] **Step 3: Rename email simulation notifications without adding a subject field**

```js
var reportName = data.kind === 'employee' ? '员工分配汇总' : '日期分配汇总';
showNotification('正在发送' + reportName + ' ' + fmt + ' 到 ' + emails.join(', ') + ' ...', 'info');
```

- [ ] **Step 4: Run focused tests and scan native tip sources for forbidden visible/export names**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `rg -n "Employee Reconciliation Report|Tip Pool Date Report|EmployeeReconciliation_|TipPoolDateReport_|TipDistribution_|返回员工对账|员工对账金额概览|员工逐日对账明细|暂无对账明细|无法展示对账明细" src/team/tips`

Expected: no matches. Technical identifiers such as `employeeReconciliationTab` remain and are intentionally excluded.

- [ ] **Step 5: Run the production build**

Run: `npm.cmd run build`

Expected: exit code 0. Do not stage generated files unrelated to this copy-only change.

- [ ] **Step 6: Verify the browser flows at the local Vite URL**

Open `/team/tips/distribution` and verify `日期分配汇总`, then switch to `员工分配汇总`; verify filters, totals, row navigation, and bottom export action are unchanged. Open an employee detail and verify the new return/ARIA/empty-or-error copy as applicable; trigger CSV, PDF print, and email notification for the paths available in each view, confirming titles and filenames from the spec.

- [ ] **Step 7: Commit the export rename and test completion**

```bash
git add src/team/tips/legacy/export.js.txt scripts/verify-team-tips-native-views.mjs
git commit -m "feat: align tip summary export names"
```

## Self-Review

- Spec coverage: Tasks 1-3 cover Tabs, list/empty/accessibility strings, detail errors/return/print heading, both summary export families, email notifications, preserved filenames/routes/identifiers, tests, build, and browser verification.
- Placeholder scan: no `TBD`, `TODO`, deferred implementation, or unspecified test steps remain.
- Type consistency: all referenced functions and data properties already exist; no signatures or data structures are introduced or renamed.
