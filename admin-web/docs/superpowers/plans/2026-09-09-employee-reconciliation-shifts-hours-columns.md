# Employee Reconciliation Shifts and Hours Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split every employee reconciliation “Shifts / Hours” presentation into independent “Shifts” and “Hours” columns without changing attendance or tip calculations.

**Architecture:** Keep the existing aggregate and daily row models as the source of truth. Change only templates, renderers, and export projections so every consumer reads the existing numeric `shifts` and `hours` values separately and formats them consistently.

**Tech Stack:** TypeScript host runtime, legacy JavaScript loaded as text, HTML templates, CSS, Node verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-employee-reconciliation-shifts-hours-columns-design.md`

## Global Constraints

- Modify only native `src/team/tips`; do not modify the retired standalone TipOut project.
- Preserve attendance, allocation, filters, navigation, amount calculations, and persisted data.
- Summary and detail column order must be `Shifts`, then `Hours`.
- A detail row with no hours displays `—` for shifts and `0 h` for hours.
- CSV, PDF, print fallback, and email-generated content must use the same two fields and formatting as the interface.

---

### Task 1: Add failing coverage for the split contract

**Files:**
- Create: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`
- Test: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

**Interfaces:**
- Consumes: native tip templates and legacy program sources as UTF-8 text.
- Produces: a focused verification command that exits non-zero when a combined field remains in employee reconciliation UI or exports.

- [ ] **Step 1: Write the failing verification script**

```js
import fs from "node:fs";

const summaryTemplate = fs.readFileSync("src/team/tips/templates/distribution.html", "utf8");
const detailTemplate = fs.readFileSync("src/team/tips/templates/employee-reconciliation.html", "utf8");
const summaryProgram = fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8");
const detailProgram = fs.readFileSync("src/team/tips/programs/employee-reconciliation.js.txt", "utf8");
const exportProgram = fs.readFileSync("src/team/tips/legacy/export.js.txt", "utf8");
const failures = [];

if (!summaryTemplate.includes("<th>班次</th><th>工时</th>")) failures.push("summary headers are not split");
if (!detailTemplate.includes("<th>班次</th><th>工时</th>")) failures.push("detail headers are not split");
if (!summaryProgram.includes("aggregate.shifts + ' 个班次'</td>")) failures.push("summary shifts cell missing");
if (!summaryProgram.includes("formatHoursDisplay(aggregate.hours) + ' h'</td>")) failures.push("summary hours cell missing");
if (!detailProgram.includes("shifts: detailNumber(row.hours) > 0 ? '1 个班次' : '—'")) failures.push("detail export shifts missing");
if (!detailProgram.includes("hours: detailHours(row.hours) + ' h'")) failures.push("detail export hours missing");
if (!exportProgram.includes("shifts: aggregate.shifts + ' 个班次'")) failures.push("summary export shifts missing");
if (!exportProgram.includes("hours: formatHoursDisplay(aggregate.hours) + ' h'")) failures.push("summary export hours missing");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Employee reconciliation shifts/hours column verification passed.");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Expected: FAIL with missing split headers and fields.

- [ ] **Step 3: Commit the failing test**

```bash
git add scripts/verify-team-tips-employee-shifts-hours-columns.mjs
git commit -m "test: define employee reconciliation split columns"
```

### Task 2: Split summary and detail interface columns

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Test: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

**Interfaces:**
- Consumes: `aggregate.shifts`, `aggregate.hours`, and daily `row.hours` from existing tip summary models.
- Produces: two table cells in `Shifts`, `Hours` order for every employee summary and detail row.

- [ ] **Step 1: Split both HTML table headers**

Replace the summary combined header with:

```html
<th>班次</th><th>工时</th>
```

Replace the detail combined header with the same pair in the same order.

- [ ] **Step 2: Render two summary cells**

```js
'<td><strong>' + aggregate.shifts + ' 个班次</strong></td>' +
'<td><strong>' + formatHoursDisplay(aggregate.hours) + ' h</strong></td>' +
```

- [ ] **Step 3: Render two daily detail cells**

```js
tr.appendChild(makeDetailCell(detailNumber(row.hours) > 0 ? '1 个班次' : '—'));
tr.appendChild(makeDetailCell(detailHours(row.hours) + ' h'));
```

- [ ] **Step 4: Adjust column sizing without recombining content**

Keep `.tipout-table-wrap` horizontal overflow behavior. Add only targeted widths for employee table role, shifts, hours, status, and operation cells; do not reduce employee identity below its existing readable width.

- [ ] **Step 5: Run focused and existing native tests**

Run:

```bash
node scripts/verify-team-tips-employee-shifts-hours-columns.mjs
node scripts/verify-team-tips-native-views.mjs
```

Expected: both PASS.

- [ ] **Step 6: Commit the interface change**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/programs/distribution.js.txt src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/tips-page.css
git commit -m "feat: split employee reconciliation shifts and hours"
```

### Task 3: Split summary and detail export fields

**Files:**
- Modify: `src/team/tips/legacy/export.js.txt`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Test: `scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

**Interfaces:**
- Consumes: existing numeric `aggregate.shifts`, `aggregate.hours`, and daily `row.hours`.
- Produces: export row objects with `shifts: string` and `hours: string`; CSV/PDF/print/email builders consume them in that order.

- [ ] **Step 1: Split the summary export projection**

```js
shifts: aggregate.shifts + ' 个班次',
hours: formatHoursDisplay(aggregate.hours) + ' h',
```

Update summary CSV and PDF rows so headers contain separate `Shifts` and `Hours` columns and values use `employee.shifts`, then `employee.hours`.

- [ ] **Step 2: Split the detail export projection**

```js
shifts: detailNumber(row.hours) > 0 ? '1 个班次' : '—',
hours: detailHours(row.hours) + ' h',
```

Update `buildEmployeeDetailCsv` and `buildEmployeeDetailPrintHtml` headings and row arrays to use `row.shifts`, then `row.hours`. Email simulation already reuses these builders, so it receives the same schema without a separate calculation path.

- [ ] **Step 3: Run focused export verification**

Run: `node scripts/verify-team-tips-employee-shifts-hours-columns.mjs`

Expected: PASS and no combined employee reconciliation header remains in the checked export builders.

- [ ] **Step 4: Run syntax and production build verification**

Run:

```bash
node -e "const fs=require('fs'); for(const f of ['src/team/tips/legacy/export.js.txt','src/team/tips/programs/distribution.js.txt','src/team/tips/programs/employee-reconciliation.js.txt']) new Function(fs.readFileSync(f,'utf8'));"
npm.cmd run build
```

Expected: JavaScript parsing succeeds and the production build exits with code 0.

- [ ] **Step 5: Commit export support**

```bash
git add src/team/tips/legacy/export.js.txt src/team/tips/programs/employee-reconciliation.js.txt scripts/verify-team-tips-employee-shifts-hours-columns.mjs
git commit -m "feat: split employee reconciliation export columns"
```

### Task 4: Browser acceptance

**Files:**
- Verify only: native route `#/team/tips/distribution?view=employee`
- Verify only: native route `#/team/tips/employee-reconciliation?...`

**Interfaces:**
- Consumes: built native tip runtime and existing demo data.
- Produces: visual confirmation that both tables remain readable and interaction behavior is unchanged.

- [ ] **Step 1: Open employee reconciliation summary**

Confirm independent `班次` and `工时` headers, one employee per row, and unchanged row navigation.

- [ ] **Step 2: Open one employee detail**

Confirm independent columns, `—` plus `0 h` on no-hours rows, attendance filtering, and back navigation.

- [ ] **Step 3: Exercise exports**

Generate summary CSV and detail CSV/PDF preview; confirm `Shifts`, then `Hours`, and verify email content uses the same generated CSV/PDF builders.

- [ ] **Step 4: Run final regression**

Run:

```bash
node scripts/verify-team-tips-employee-shifts-hours-columns.mjs
node scripts/verify-team-tips-native-views.mjs
git diff --check
```

Expected: all tests PASS and no whitespace errors are reported for feature files.
