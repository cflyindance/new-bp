# Payroll Batch Employee Detail Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native payroll action that exports all or selected employees as detailed or summary PDF/CSV files, either merged or packaged per employee, with progress, cancellation, Draft labeling, and remembered preferences.

**Architecture:** Keep the existing payroll legacy runtime as the payroll data source, but expose a typed read-only bridge from it to new native TypeScript modules. Pure modules own employee classification, CSV contracts, filenames, preferences, and task transitions; a browser export service owns PDF/ZIP creation; a native controller mounted beside the legacy runtime owns the Shadow DOM modal and progress UI.

**Tech Stack:** TypeScript 5.6, Vite 6, native DOM/Shadow DOM, existing jsPDF/html2canvas globals, JSZip 3.10, Node `assert` verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-05-payroll-batch-employee-detail-export-design.md`

## Global Constraints

- First-open defaults are all employees, summary detail, PDF, and one merged file.
- Persist detail type, format, organization, and summary-PDF pagination at Start Export; never persist a manual employee selection.
- Summary PDF supports `single-page` and `auto-pages`; the pagination control is visible only for summary PDF.
- One employee starts on a new page in merged PDFs.
- CSV is UTF-8 with BOM, comma-separated, CRLF, RFC-style quoted cells, `YYYY-MM-DD` dates, `HH:mm` times, two-decimal money/hours, and empty fields for missing values.
- A task classifies every employee into exactly one of `ready`, `incomplete`, `unconfirmed`, or `no_data`, in that priority order: `no_data`, `incomplete`, `unconfirmed`, `ready`.
- `incomplete` and `unconfirmed` exports carry Draft markers; `no_data` employees are reported and omitted from artifacts.
- Batch generation is browser-local, permits one running task, supports at most 200 selected employees, and does not survive refresh or tab close.
- Preserve every existing single-employee detail, print, PDF, CSV, and email flow.

## File Structure

- `src/team/payroll/payroll-batch-export-types.ts`: shared domain contracts and exact option/status enums.
- `src/team/payroll/payroll-batch-export-data.ts`: snapshot selection, employee classification, immutable task input, CSV row models, safe names.
- `src/team/payroll/payroll-batch-export-csv.ts`: canonical summary/detailed CSV schemas and serialization.
- `src/team/payroll/payroll-batch-export-artifacts.ts`: merged PDF, per-employee PDF/CSV ZIP, downloading, and library adapters.
- `src/team/payroll/payroll-batch-export-task.ts`: progress state machine, cancellation, retries, and preference persistence.
- `src/team/payroll/payroll-batch-export-controller.ts`: modal, employee picker, task panel, and DOM events.
- `src/team/payroll/payroll-legacy-runtime.ts`: expose a read-only batch bridge and audit hook from the scoped legacy runtime.
- `src/team/payroll-page.ts`: mount and destroy the new controller with the existing runtime.
- `src/team/payroll/payroll-template.html`: top action button and semantic modal/task panel markup.
- `src/team/payroll/payroll-page.css`: batch-export controls, responsive modal, Draft and status styles.
- `scripts/verify-payroll-batch-export.ts`: executable domain and CSV verification.
- `scripts/verify-payroll-batch-export-ui.mjs`: static template/CSS/integration assertions.
- `package.json`: verification scripts.

---

### Task 1: Batch Contracts, Snapshot Bridge, and Employee Classification

**Files:**
- Create: `src/team/payroll/payroll-batch-export-types.ts`
- Create: `src/team/payroll/payroll-batch-export-data.ts`
- Modify: `src/team/payroll/payroll-legacy-runtime.ts`
- Modify: `src/team/payroll/payroll-types.ts`
- Create: `scripts/verify-payroll-batch-export.ts`

**Interfaces:**
- Produces: `BatchExportOptions`, `BatchEmployeeRecord`, `BatchExportInput`, `PayrollBatchBridge`.
- Produces: `buildBatchExportInput(snapshot, options, selectedIds)` and `sanitizePayrollFilePart(value)`.
- Consumes: `PayrollSnapshot`, `PayrollPeriod`, `PayrollEmployee`, and legacy `buildDetailExportPayload(emp, period)`.

- [ ] **Step 1: Write failing classification and snapshot tests**

Add assertions to `scripts/verify-payroll-batch-export.ts` for defaults, store/period scoping, stable employee order, 200-person validation, mutually exclusive counts, missing-field codes, and `no_data` precedence:

```ts
assert.deepEqual(DEFAULT_BATCH_EXPORT_OPTIONS, {
  scope: "all",
  detailType: "summary",
  format: "pdf",
  organization: "merged",
  summaryPagination: "single-page",
});
const input = buildBatchExportInput(snapshot, DEFAULT_BATCH_EXPORT_OPTIONS, []);
assert.equal(input.records.length, 4);
assert.deepEqual(input.counts, { ready: 1, incomplete: 1, unconfirmed: 1, noData: 1 });
assert.equal(input.records.find((item) => item.employee.id === "missing")?.status, "incomplete");
assert.deepEqual(input.records.find((item) => item.employee.id === "missing")?.missingFields, ["employee_ssn"]);
assert.equal(input.records.find((item) => item.employee.id === "empty")?.status, "no_data");
assert.throws(() => buildBatchExportInput(over200Snapshot, DEFAULT_BATCH_EXPORT_OPTIONS, []), /200/);
```

- [ ] **Step 2: Run the verification and observe failure**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: FAIL because `payroll-batch-export-data.ts` and its exports do not exist.

- [ ] **Step 3: Add exact domain contracts**

Define these unions and bridge shape in `payroll-batch-export-types.ts`:

```ts
export type BatchEmployeeStatus = "ready" | "incomplete" | "unconfirmed" | "no_data";
export type BatchDetailType = "detailed" | "summary";
export type BatchFormat = "pdf" | "csv";
export type BatchOrganization = "merged" | "zip";
export type SummaryPagination = "single-page" | "auto-pages";
export type BatchTaskStatus =
  | "idle" | "preparing" | "generating" | "packaging"
  | "completed" | "partial" | "failed" | "cancelling" | "cancelled";

export interface BatchExportOptions {
  scope: "all" | "selected";
  detailType: BatchDetailType;
  format: BatchFormat;
  organization: BatchOrganization;
  summaryPagination: SummaryPagination;
}

export interface PayrollBatchBridge {
  getSnapshot(): PayrollSnapshot;
  getDetailPayload(employeeId: string): Record<string, unknown> | null;
  getDetailPrintHtml(employeeId: string, detailType: BatchDetailType, pagination: SummaryPagination): string | null;
  appendExportAudit(format: BatchFormat, employeeIds: string[], result: "completed" | "partial" | "failed"): void;
}
```

- [ ] **Step 4: Implement immutable selection and classification**

In `payroll-batch-export-data.ts`, export `DEFAULT_BATCH_EXPORT_OPTIONS`, `buildBatchExportInput`, `classifyBatchEmployee`, and `sanitizePayrollFilePart`. Use `structuredClone` when creating the task input. Treat an employee as `no_data` only when both payroll values and segments are absent/zero; otherwise collect missing required fields in the spec's fixed order, then inspect `employee.confirmed`.

```ts
const MISSING_FIELD_ORDER = ["employee_id", "employee_ssn", "hire_date", "role", "pay_period", "pay_date"] as const;
const selected = options.scope === "all"
  ? scopedEmployees
  : scopedEmployees.filter((employee) => selectedIds.includes(employee.id));
if (selected.length === 0) throw new BatchExportValidationError("Select at least one employee");
if (selected.length > 200) throw new BatchExportValidationError("A batch can contain at most 200 employees");
```

- [ ] **Step 5: Expose a read-only legacy bridge**

Extend `PayrollRuntimeHandle` with `getBatchBridge(): PayrollBatchBridge`. Append bridge creation after `payrollCode` inside `buildRuntimeSource()` so it can read lexical `state`, `getEmployee`, `getPeriod`, `buildDetailExportPayload`, and the existing detailed/summary print builders. Return cloned snapshots and payloads; do not expose mutable `state`.

```ts
window.__teamPayrollBatchBridge = {
  getSnapshot: () => structuredClone(buildSnapshot()),
  getDetailPayload: (employeeId) => buildDetailExportPayload(getEmployee(state.periodId, employeeId), getPeriod(state.periodId)),
  getDetailPrintHtml: (employeeId, detailType, pagination) => buildBatchDetailPrintDocumentHtml(employeeId, detailType, pagination),
  appendExportAudit: (format, employeeIds, result) => { appendAudit("export_batch_detail", { format, employeeIds, result }); saveState(); },
};
```

- [ ] **Step 6: Run classification verification**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: PASS with `Payroll batch export domain verification passed.`

- [ ] **Step 7: Commit the task**

```bash
git add src/team/payroll/payroll-batch-export-types.ts src/team/payroll/payroll-batch-export-data.ts src/team/payroll/payroll-legacy-runtime.ts src/team/payroll/payroll-types.ts scripts/verify-payroll-batch-export.ts
git commit -m "feat: add payroll batch export domain"
```

### Task 2: Canonical Summary and Detailed CSV Generation

**Files:**
- Create: `src/team/payroll/payroll-batch-export-csv.ts`
- Modify: `scripts/verify-payroll-batch-export.ts`

**Interfaces:**
- Consumes: `BatchEmployeeRecord` and bridge detail payloads from Task 1.
- Produces: `buildSummaryCsv(records)`, `buildDetailedCsv(records)`, `buildEmployeeCsv(record, detailType)`.

- [ ] **Step 1: Add failing schema and escaping assertions**

Assert the exact column arrays from the spec, BOM/CRLF output, embedded quote/comma/newline escaping, one summary row per employee, one `employee_summary` plus N `shift` rows for detailed output, and an `employee_summary` row for a fixed-salary employee with no shifts.

```ts
const detailed = buildDetailedCsv([fixedSalaryRecord]);
assert.ok(detailed.startsWith("\uFEFFrow_type,"));
assert.match(detailed, /\r\nemployee_summary,/);
assert.doesNotMatch(detailed, /\r\nshift,/);
assert.equal(detailed.split("\r\n")[0].split(",").length, DETAILED_CSV_COLUMNS.length);
assert.equal(csvCell('A,"B"'), '"A,""B"""');
```

- [ ] **Step 2: Run the targeted verification and observe failure**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: FAIL because the CSV builders do not exist.

- [ ] **Step 3: Implement fixed schemas and row builders**

Export `SUMMARY_CSV_COLUMNS` and `DETAILED_CSV_COLUMNS` as readonly arrays copied exactly from the spec. Use separate `summary_*` and `line_*` names. For every detailed employee, emit `employee_summary` first; emit one `shift` row per normalized clock slot and leave the opposite row group's columns empty.

```ts
export function serializeCsv(columns: readonly string[], rows: CsvRow[]): string {
  const body = [columns, ...rows.map((row) => columns.map((column) => formatCsvValue(row[column])))]
    .map((cells) => cells.map(csvCell).join(","))
    .join("\r\n");
  return `\uFEFF${body}`;
}
```

- [ ] **Step 4: Run the CSV verification**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: PASS, including schema, empty-cell, Draft status, and no-shift cases.

- [ ] **Step 5: Commit the task**

```bash
git add src/team/payroll/payroll-batch-export-csv.ts scripts/verify-payroll-batch-export.ts
git commit -m "feat: generate payroll batch CSV files"
```

### Task 3: PDF, Merged File, and ZIP Artifact Service

**Files:**
- Create: `src/team/payroll/payroll-batch-export-artifacts.ts`
- Modify: `src/team/payroll/payroll-batch-export-types.ts`
- Modify: `scripts/verify-payroll-batch-export.ts`

**Interfaces:**
- Consumes: bridge HTML/payloads, CSV builders, `BatchExportInput`.
- Produces: `createBatchArtifact(input, bridge, dependencies, signal, onEmployeeComplete)` returning `{ blob, filename, succeededIds, failures }`.
- Dependencies: injected `renderHtmlToPdfPages`, `createPdf`, `createZip`, and `downloadBlob` adapters for deterministic verification.

- [ ] **Step 1: Add failing artifact matrix tests**

Cover all eight combinations: detailed/summary × PDF/CSV × merged/ZIP. Assert merged PDF page breaks between employees, ZIP entry count and safe unique names, Draft watermark forwarding, successful-employee count in the final name, `_retry_1`, and rejection when every employee is `no_data`.

```ts
const result = await createBatchArtifact(input, bridge, fakes, new AbortController().signal, progress.push.bind(progress));
assert.equal(result.filename, "Payroll_2026_Period_2_Summary_2_Employees.pdf");
assert.deepEqual(fakePdf.employeeStartPages, [1, 2]);
assert.equal(fakeZip.files.size, 2);
await assert.rejects(() => createBatchArtifact(allNoData, bridge, fakes, signal, noop), /no exportable payroll data/i);
```

- [ ] **Step 2: Run the artifact verification and observe failure**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: FAIL because `createBatchArtifact` is undefined.

- [ ] **Step 3: Implement PDF and ZIP adapters**

Use the bridge HTML for each employee. For merged PDF, append rendered pages to one jsPDF document and begin each employee on a new page. For independent PDF/CSV, add sanitized, collision-safe files to JSZip. Do not add `no_data` records. Count only successfully written employees in `{employeeCount}`.

```ts
for (const record of input.records.filter((item) => item.status !== "no_data")) {
  if (signal.aborted) throw new DOMException("Batch export cancelled", "AbortError");
  try {
    await appendEmployee(record);
    succeededIds.push(record.employee.id);
  } catch (error) {
    failures.push({ employeeId: record.employee.id, message: errorMessage(error) });
  }
  onEmployeeComplete({ completed: succeededIds.length + failures.length, total: exportable.length });
}
```

- [ ] **Step 4: Verify the entire artifact matrix**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: PASS for eight combinations, safe names, partial output, and all-no-data rejection.

- [ ] **Step 5: Commit the task**

```bash
git add src/team/payroll/payroll-batch-export-artifacts.ts src/team/payroll/payroll-batch-export-types.ts scripts/verify-payroll-batch-export.ts
git commit -m "feat: build payroll batch export artifacts"
```

### Task 4: Task State Machine, Cancellation, Retry, and Preferences

**Files:**
- Create: `src/team/payroll/payroll-batch-export-task.ts`
- Modify: `scripts/verify-payroll-batch-export.ts`

**Interfaces:**
- Consumes: `createBatchArtifact` from Task 3.
- Produces: `createPayrollBatchExportTask(dependencies)`, `loadBatchExportPreferences(storage)`, `saveBatchExportPreferences(storage, options)`.
- Emits: immutable `BatchTaskSnapshot` values through `subscribe(listener)`.

- [ ] **Step 1: Add failing state-transition tests**

Assert `idle → preparing → generating → packaging → completed`, partial/failed rules, single active task, preference write at start, cancel during generation, disabled cancel during packaging, complete temp-data disposal, and retry filename increment.

```ts
assert.deepEqual(states, ["preparing", "generating", "packaging", "completed"]);
assert.equal(task.canCancel(), false); // packaging
await task.cancel();
assert.equal(task.getSnapshot().status, "cancelled");
assert.equal(fakeArtifacts.disposed, true);
assert.equal(retry.getSnapshot().retryNumber, 1);
```

- [ ] **Step 2: Run and observe the failing task tests**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: FAIL because the task factory does not exist.

- [ ] **Step 3: Implement task transitions and local preference key**

Use `menusifu-payroll-batch-export-preferences-v1`. Persist only `detailType`, `format`, `organization`, and `summaryPagination`; construct scope as `all` on load. The task owns one `AbortController`. `cancel()` changes to `cancelling`, waits for the current employee promise, disposes intermediate data, then changes to `cancelled`. A cancellation failure restores the previous runnable status with `errorMessage`.

- [ ] **Step 4: Run state-machine verification**

Run: `npx tsx scripts/verify-payroll-batch-export.ts`

Expected: PASS for every terminal state, cancel gate, retry, and preference restoration.

- [ ] **Step 5: Commit the task**

```bash
git add src/team/payroll/payroll-batch-export-task.ts scripts/verify-payroll-batch-export.ts
git commit -m "feat: manage payroll batch export tasks"
```

### Task 5: Native Configuration Modal and Employee Picker

**Files:**
- Modify: `src/team/payroll/payroll-template.html`
- Modify: `src/team/payroll/payroll-page.css`
- Create: `scripts/verify-payroll-batch-export-ui.mjs`

**Interfaces:**
- Produces DOM hooks consumed by Task 6: `[data-action="open-batch-detail-export"]`, `#payrollBatchExportModal`, `#payrollBatchEmployeeSearch`, `#payrollBatchEmployeeList`, `#payrollBatchExportSummary`, `#payrollBatchExportStart`, and `#payrollBatchExportTaskPanel`.

- [ ] **Step 1: Write failing markup and CSS assertions**

Read the template and CSS in `verify-payroll-batch-export-ui.mjs`. Assert the independent top action, dialog semantics, radio groups, conditional pagination section, employee search/list/count, summary counts, start/cancel controls, task panel, progressbar attributes, Draft styling, responsive rules, and no iframe.

```js
assert.match(html, /data-action="open-batch-detail-export"/);
assert.match(html, /id="payrollBatchExportModal"[\s\S]*role="dialog"/);
assert.match(html, /id="payrollBatchExportTaskProgress"[\s\S]*role="progressbar"/);
assert.doesNotMatch(html, /<iframe[^>]+payroll/i);
assert.match(css, /\.payroll-batch-export-modal/);
assert.match(css, /@media \(max-width: 768px\)/);
```

- [ ] **Step 2: Run UI verification and observe failure**

Run: `node scripts/verify-payroll-batch-export-ui.mjs`

Expected: FAIL because the batch markup is absent.

- [ ] **Step 3: Add semantic modal and task-panel markup**

Place the independent “批量导出详情” button in `.payroll-workspace-actions`. Add a full modal with native inputs, an employee list rendered by Task 6, a live summary, and buttons. Keep the task panel outside the modal so closing the modal does not hide progress.

- [ ] **Step 4: Add scoped responsive styling**

Style only beneath `.team-payroll-page`/`.payroll-page`. Provide a maximum-height employee list with contained wheel scrolling, visible focus rings, selected rows, Draft/no-data badges, disabled states, and a fixed lower-right task panel that does not cover the payroll footer.

- [ ] **Step 5: Run UI verification**

Run: `node scripts/verify-payroll-batch-export-ui.mjs`

Expected: PASS with `Payroll batch export UI verification passed.`

- [ ] **Step 6: Commit the task**

```bash
git add src/team/payroll/payroll-template.html src/team/payroll/payroll-page.css scripts/verify-payroll-batch-export-ui.mjs
git commit -m "feat: add payroll batch export dialog"
```

### Task 6: Controller Integration, Progress UI, Download, and Retry

**Files:**
- Create: `src/team/payroll/payroll-batch-export-controller.ts`
- Modify: `src/team/payroll-page.ts`
- Modify: `src/team/payroll/payroll-legacy-runtime.ts`
- Modify: `scripts/verify-payroll-batch-export-ui.mjs`

**Interfaces:**
- Consumes: `PayrollBatchBridge`, task factory, artifact service, template hooks.
- Produces: `mountPayrollBatchExportController(shadowRoot, pageRoot, bridge): PayrollBatchExportControllerHandle`.

- [ ] **Step 1: Add failing integration assertions**

Assert that `payroll-page.ts` obtains the bridge after mounting the legacy runtime, mounts the controller, destroys it before the runtime, and protects active tasks with `beforeunload`. Assert the controller binds search, select-all-results, clear, open, close, start, cancel, download, failure-detail, and retry controls.

- [ ] **Step 2: Run UI integration verification and observe failure**

Run: `node scripts/verify-payroll-batch-export-ui.mjs`

Expected: FAIL because the controller is not mounted.

- [ ] **Step 3: Implement modal option and employee selection behavior**

Render employees from an immutable bridge snapshot. Preserve selected IDs across search changes, implement “全选当前结果” against the complete filtered result set, show hidden selected count, clear all selections, recompute the four mutually exclusive summary counts, and disable Start for zero, over-200, or missing period/store input.

```ts
const visibleIds = records.filter(matchesSearch).map((record) => record.employee.id);
function selectAllCurrentResults(): void {
  visibleIds.forEach((id) => selectedIds.add(id));
  renderEmployeePicker();
  renderSummary();
}
```

- [ ] **Step 4: Bind task lifecycle to the non-blocking panel**

On Start, persist preferences, create the immutable task input, close the modal, and subscribe to progress. Show completed/total employees, approximate pages, terminal CTA, skipped `no_data` records, failure reasons, and retry. Permit Cancel only while the task reports `canCancel()`. Call the bridge audit hook exactly once per terminal task.

- [ ] **Step 5: Mount and destroy the controller safely**

In `payroll-page.ts`, mount after `mountLegacyPayrollRuntime`, pass `runtime.getBatchBridge()`, remove all listeners and object URLs on destroy, and keep existing wheel handling unchanged. Register `beforeunload` only while a task is cancellable or packaging.

- [ ] **Step 6: Run domain, UI, type, and production checks**

Run:

```bash
npx tsx scripts/verify-payroll-batch-export.ts
node scripts/verify-payroll-batch-export-ui.mjs
npm run build
```

Expected: both verification scripts PASS; TypeScript/Vite build exits 0.

- [ ] **Step 7: Commit the task**

```bash
git add src/team/payroll/payroll-batch-export-controller.ts src/team/payroll-page.ts src/team/payroll/payroll-legacy-runtime.ts scripts/verify-payroll-batch-export-ui.mjs
git commit -m "feat: integrate payroll batch export workflow"
```

### Task 7: Browser Acceptance and Regression Coverage

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify-payroll-batch-export.ts`
- Modify: `scripts/verify-payroll-batch-export-ui.mjs`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: `npm run verify:payroll-batch-export` as the repeatable release gate.

- [ ] **Step 1: Add the combined verification command**

Add this package script:

```json
"verify:payroll-batch-export": "npx tsx scripts/verify-payroll-batch-export.ts && node scripts/verify-payroll-batch-export-ui.mjs"
```

- [ ] **Step 2: Run the complete automated release gate**

Run:

```bash
npm run verify:payroll-batch-export
npm run build
```

Expected: both commands exit 0; `dist/index.html` and current Vite assets are regenerated.

- [ ] **Step 3: Perform browser acceptance at the native route**

Start `npm run dev -- --host 127.0.0.1 --port 5174`, open `http://127.0.0.1:5174/#/team/payroll-report`, then verify:

1. Independent top button opens the modal with summary/PDF/merged defaults.
2. Search, manual selection, all-result selection, hidden-selection count, and clear work.
3. Summary-PDF pagination is visible only for summary PDF and restores after reopening.
4. All eight output combinations download non-empty artifacts with safe names.
5. Every employee starts on a new page in merged PDFs; Draft pages show Draft; detailed CSV has one `employee_summary` row plus shift rows.
6. Progress advances, generation can be cancelled, packaging cannot be cancelled, partial failure is downloadable, and Retry creates a new suffixed file.
7. Navigating within the SPA preserves the task panel; refreshing warns and ends the browser-local task.
8. Existing single-employee detail, print, PDF, CSV, and email actions still work.

- [ ] **Step 4: Commit the verification gate**

```bash
git add package.json scripts/verify-payroll-batch-export.ts scripts/verify-payroll-batch-export-ui.mjs
git commit -m "test: verify payroll batch detail exports"
```

## Self-Review Results

- Spec coverage: entry/defaults, selection semantics, eight artifact combinations, exact CSV contracts, PDF pagination, Draft/no-data rules, task states, cancellation, retry, permissions boundary, naming, capacity, and regressions each map to a task above.
- Placeholder scan: no deferred implementation placeholders are present.
- Type consistency: `BatchExportOptions`, `BatchExportInput`, `PayrollBatchBridge`, `createBatchArtifact`, and task/controller signatures are defined before downstream consumption.

