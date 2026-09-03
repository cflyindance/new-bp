# Employee Reconciliation Filter and Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add attendance filtering and PDF, CSV, and simulated-email export to the native employee reconciliation detail page without changing tip allocation results.

**Architecture:** The employee detail program owns one normalized attendance-status function and one current filtered snapshot; rendering, summaries, and export adapters consume that same state. The template supplies detail-specific controls and email modal markup, while the native runtime exposes the existing shared export helpers to this view without invoking distribution-only collectors.

**Tech Stack:** Native HTML templates, legacy-compatible JavaScript executed through the TypeScript shadow-DOM runtime, CSS, Node `assert`/`vm` verification scripts, Vite production build.

**Spec:** `docs/superpowers/specs/2026-09-03-tip-employee-reconciliation-filter-export-design.md`

## Global Constraints

- Attendance options are exactly `全部状态`, `已打卡`, and `未打卡`.
- Only `clockStatus === '已打卡'` is considered clocked in; missing, invalid, or any other value is `未打卡`.
- Date and attendance filters jointly control visible rows, six summary metrics, and all export payloads.
- Export is read-only and must not recalculate, overwrite, or mutate tip allocation data.
- CSV means CSV, uses field quoting, and neutralizes text beginning with `=`, `+`, `-`, or `@`.
- PDF uses a browser-print document so Chinese text remains readable.
- Email remains the existing simulated-send interaction; no backend mail service is added.
- Only native team tips files are changed; the old `TipOut` project is not used.

---

### Task 1: Attendance normalization and combined filtering

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`

**Interfaces:**
- Consumes: employee daily rows containing `dateKey` and optional `clockStatus`.
- Produces: `employeeDetailAttendanceStatus(row) -> '已打卡' | '未打卡'` and `filterEmployeeDetailRows(rows, start, end, attendance) -> row[]`.

- [ ] **Step 1: Extend the native verification with failing normalization and filter assertions**

Add assertions equivalent to:

```js
assert.equal(employeeDetailContext.employeeDetailAttendanceStatus({ clockStatus: "已打卡" }), "已打卡");
assert.equal(employeeDetailContext.employeeDetailAttendanceStatus({ clockStatus: "未打卡" }), "未打卡");
assert.equal(employeeDetailContext.employeeDetailAttendanceStatus({ requiresAttendance: false }), "未打卡");
assert.deepEqual(
  Array.from(employeeDetailContext.filterEmployeeDetailRows([
    { dateKey: "2026-01-01", clockStatus: "已打卡" },
    { dateKey: "2026-01-02", clockStatus: "未打卡" },
    { dateKey: "2026-01-03" }
  ], "2026-01-01", "2026-01-03", "未打卡"), (row) => row.dateKey),
  ["2026-01-02", "2026-01-03"]
);
```

- [ ] **Step 2: Run the verification and confirm the new assertions fail**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because `employeeDetailAttendanceStatus` does not exist or the fourth filter argument is ignored.

- [ ] **Step 3: Implement the normalized status and combined predicate**

Use one status function everywhere:

```js
function employeeDetailAttendanceStatus(row) {
  return row && row.clockStatus === '已打卡' ? '已打卡' : '未打卡';
}
function filterEmployeeDetailRows(rows, start, end, attendance) {
  return (rows || []).filter(function(row) {
    var inDateRange = row.dateKey >= start && row.dateKey <= end;
    return inDateRange && (attendance === '全部状态' || employeeDetailAttendanceStatus(row) === attendance);
  });
}
```

Change row rendering to call `employeeDetailAttendanceStatus(row)` and remove the `requiresAttendance`/`无需打卡` branch. Use `is-complete` for 已打卡 and `is-pending` for 未打卡.

- [ ] **Step 4: Run the focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS, including legacy date-only assertions by passing `全部状态` explicitly where needed.

- [ ] **Step 5: Commit the normalized attendance contract**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/programs/employee-reconciliation.js.txt
git commit -m "feat: normalize employee attendance status"
```

### Task 2: Attendance control, empty state, and live summaries

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `filterEmployeeDetailRows(rows, start, end, attendance)` and `summarizeEmployeeDetailRows(rows)` from Task 1.
- Produces: DOM controls `employeeDetailAttendanceFilter` and `employeeDetailFilteredEmpty`, plus `getEmployeeDetailViewState() -> { snapshot, range, attendance, rows }` for exports.

- [ ] **Step 1: Add failing template and state-contract checks**

Require template tokens `employeeDetailAttendanceFilter` and `employeeDetailFilteredEmpty`, require options `全部状态`, `已打卡`, `未打卡`, and reject `无需打卡`. Add a pure-state assertion that the visible rows and summary share the same filtered array.

- [ ] **Step 2: Run verification to see the missing-control failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL listing the missing attendance filter or filtered-empty token.

- [ ] **Step 3: Add the filter markup and filtered-empty region**

Place this control after the end-date input:

```html
<label class="tipout-detail-attendance-filter">
  <span>考勤状态</span>
  <select id="employeeDetailAttendanceFilter" aria-label="考勤状态">
    <option value="全部状态">全部状态</option>
    <option value="已打卡">已打卡</option>
    <option value="未打卡">未打卡</option>
  </select>
</label>
```

Add a hidden, table-local empty region with the exact message `当前筛选条件下暂无对账明细`.

- [ ] **Step 4: Centralize current detail state and rerender from it**

Maintain module variables for the valid snapshot and visible rows. `renderEmployeeDetailRange(snapshot, changedSide)` must read the select value, call the combined filter, save `{ snapshot, range, attendance, rows }`, render zero totals when rows are empty, toggle the table/filtered-empty region, and render the same rows used by the summary. Bind the select `change` event and keep its value while either date input changes.

- [ ] **Step 5: Add responsive styling**

Style the label/select to match existing date inputs, keep a visible label, and allow controls to wrap on narrow viewports without changing the detail table columns.

- [ ] **Step 6: Run verification and build**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
npm.cmd run build
```

Expected: verification PASS and Vite build exit 0.

- [ ] **Step 7: Commit the filter interaction**

```bash
git add src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: filter employee reconciliation by attendance"
```

### Task 3: Detail-specific CSV and printable PDF exports

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `src/team/tips/tips-legacy-runtime.ts`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `getEmployeeDetailViewState()` from Task 2 and shared notification/runtime helpers.
- Produces: `collectEmployeeDetailExportData()`, `employeeDetailCsvCell(value)`, `exportEmployeeDetailCsv()`, `exportEmployeeDetailPdf()`, and `runEmployeeDetailExport(type)`.

- [ ] **Step 1: Add failing export contract tests**

Assert the employee template contains `employeeDetailExportButton` and `employeeDetailExportMenu`. Evaluate the program in `vm` and verify:

```js
assert.equal(employeeDetailContext.employeeDetailCsvCell('a,"b"'), '"a,""b"""');
assert.equal(employeeDetailContext.employeeDetailCsvCell('=SUM(1,1)'), "'=SUM(1,1)");
assert.equal(employeeDetailContext.employeeDetailSafeFilename('王/店长:2026'), '王_店长_2026');
```

Also assert the runtime includes `exportCode` for both `distribution` and `employee-reconciliation`, and the detail program contains neither `collectExportData()` nor `exportAs(` calls.

- [ ] **Step 2: Run verification and confirm export contracts fail**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL for missing export controls/helpers/runtime dependency.

- [ ] **Step 3: Add the title-area export dropdown**

Add `导出结果` with menu items `导出 PDF`, `导出 CSV`, and `发送至邮箱`. Use detail-specific inline handlers and close the menu after selection or outside click. Match the existing summary export button styling while keeping it aligned to the right of the heading.

- [ ] **Step 4: Build one immutable export adapter from visible state**

`collectEmployeeDetailExportData()` returns employee name, role, store metadata, start/end, and a copied `rows` array. Map each row to the eight specified export columns using `employeeDetailAttendanceStatus(row)` and existing money/hours formatters. Return `null` and show `当前筛选条件下没有可导出的数据` when no visible rows exist.

- [ ] **Step 5: Implement safe CSV download**

`employeeDetailCsvCell` must stringify nullish values as empty, prefix formula-leading text with `'`, double embedded quotes, and quote values containing comma, quote, CR, or LF. Generate a UTF-8 BOM CSV with the eight Chinese headings, create an object URL, click a temporary download link, and revoke the URL. Use the sanitized `员工姓名_开始日期_结束日期.csv` filename.

- [ ] **Step 6: Implement Chinese-safe printable PDF output**

Open a print document containing escaped employee metadata and the same eight-column table. Set `document.title` to the sanitized suggested filename, use Chinese-capable system font fallbacks, call `print()`, and close the print window after printing. If popups are blocked, show a failure notification instead of mutating state.

- [ ] **Step 7: Expose existing export foundations to the employee view**

Change `runtimeSource` so `exportCode` is appended for `distribution` and `employee-reconciliation`. Keep employee handlers detail-specific and do not invoke summary-only collectors.

- [ ] **Step 8: Run native verification and production build**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
npm.cmd run build
```

Expected: PASS and build exit 0; distribution export verification remains unchanged.

- [ ] **Step 9: Commit file exports**

```bash
git add src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/tips-page.css src/team/tips/tips-legacy-runtime.ts scripts/verify-team-tips-native-views.mjs
git commit -m "feat: export employee reconciliation details"
```

### Task 4: Simulated email flow and full regression verification

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: `collectEmployeeDetailExportData()` and CSV/PDF payload builders from Task 3.
- Produces: `openEmployeeDetailEmailModal()` and `sendEmployeeDetailEmail()` using the frozen payload captured when the modal opens.

- [ ] **Step 1: Add failing email modal and validation checks**

Require template IDs `employeeDetailEmailModal`, `employeeDetailExportEmail`, and `employeeDetailEmailFormat`. Add pure validation assertions for comma-separated valid addresses and rejection of invalid addresses. Require the exact simulated-success wording to include `已提交发送` rather than claiming delivery.

- [ ] **Step 2: Run verification to confirm the modal contract is absent**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL for missing detail email DOM/helpers.

- [ ] **Step 3: Add detail-specific email modal markup**

Reuse the summary modal structure and CSS classes, but use unique detail IDs. Include an email input, PDF/CSV radio buttons, Cancel, and `发送` actions. The modal must remain hidden until opened.

- [ ] **Step 4: Implement frozen-snapshot simulated submission**

When opening, call `collectEmployeeDetailExportData()` and store a deep-enough copy of the current filtered payload. On submit, split comma-separated addresses, trim, remove blanks, validate every address, require a selected format, then build the selected format from the frozen payload. Close the modal and show `已提交发送` with the selected format; do not call a backend and do not read a newer filter state during submission.

- [ ] **Step 5: Run all targeted regressions**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-tipout-employee-reconciliation.mjs
npm.cmd run build
```

Expected: both verification scripts PASS and build exit 0. The old TipOut verification is regression-only; no old-project file may be modified.

- [ ] **Step 6: Verify in the native browser route**

Open `http://127.0.0.1:5174/#/team/tips/distribution`, switch to employee reconciliation, enter one employee, and verify:

1. 全部状态 is the default and only 已打卡/未打卡 appear in rows.
2. Both status filters change rows and all six totals.
3. Date changes preserve the status filter.
4. Empty intersections show the filtered empty state and block export.
5. PDF opens a readable Chinese print preview, CSV contains the visible rows, and the email modal validates input and shows the simulated-submit wording.

- [ ] **Step 7: Clean only generated build artifacts**

Inspect `git status --short`. Restore tracked build-only files and remove only newly generated hashed files under this isolated worktree's `dist/assets`; do not touch source changes or unrelated user files. Re-run `git status --short` and confirm only intended source/test/docs changes remain.

- [ ] **Step 8: Commit the completed email and regression work**

```bash
git add src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: email filtered employee reconciliation"
```
