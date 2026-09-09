# Employee Reconciliation Manual Hours Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the per-rule manual hours actually used by tip distribution into employee reconciliation and present them as manual or mixed work-hour sources without changing monetary results.

**Architecture:** Add a small shared manual-hours store used by the allocation detail and distribution summary programs. Project its normalized records into each daily employee result and snapshot, then extend the existing attendance presentation adapter so table rendering, metrics, filtering, CSV, PDF, and email all consume one display model.

**Tech Stack:** Legacy JavaScript loaded as raw text by the TypeScript host, HTML templates, CSS, browser storage, Node verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-employee-reconciliation-manual-hours-design.md`

## Global Constraints

- Modify only native `src/team/tips`; do not edit the retired standalone TipOut project.
- Keep one employee row and one set of monetary values per date.
- Never sum manual hours across pools or reinterpret them as attendance.
- Preserve the current allocation pipeline and saved `before`, `deducted`, `received`, and `after` values.
- `punchSessions` remains authoritative for actual attendance; `manualHourEntries` is authoritative for manual allocation inputs.
- Old snapshots without manual-hour entries must continue to render without invented data.

---

### Task 1: Persist and normalize manual-hour inputs

**Files:**
- Create: `src/team/tips/legacy/tipout-manual-hours-store.js.txt`
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `src/team/tips/tips-legacy-runtime.ts`
- Create: `scripts/verify-team-tips-manual-hours-store.mjs`

**Interfaces:**
- Produces: `window.TipOutManualHours.set(entry)`, `get(ruleId, dateKey, employeeName)`, and `listForEmployee(dateKey, employeeName)`.
- Entry shape: `{ poolId, poolName, ruleId, ruleName, dateKey, employeeName, hours }`.

- [ ] **Step 1: Write the failing store verification**

Create a VM-based test that loads the module with an in-memory `localStorage`, writes two rules for one employee/date, overwrites one key, and asserts deterministic normalized output:

```js
const entries = store.listForEmployee('2026-01-02', '王店长');
assert.deepEqual(entries.map(({ poolId, ruleId, hours }) => ({ poolId, ruleId, hours })), [
  { poolId: 'front', ruleId: 'front-hours', hours: 6 },
  { poolId: 'bar', ruleId: 'bar-hours', hours: 4 }
]);
```

Also assert that `0` is retained, negative/non-finite hours are rejected, pool/rule names use “未命名小费池” and “未命名规则”, and unrelated employee/date entries are excluded.

- [ ] **Step 2: Run the store verification and confirm RED**

Run: `node scripts/verify-team-tips-manual-hours-store.mjs`

Expected: FAIL because `TipOutManualHours` does not exist.

- [ ] **Step 3: Implement the shared store**

Use storage key `tipout-manual-hours-v1` and composite identity `ruleId|dateKey|employeeName`. Normalize `hours` to a non-negative finite number, clone returned objects, and sort by `poolName`, `ruleName`, `poolId`, then `ruleId`. A storage parse failure must return an empty collection without throwing.

- [ ] **Step 4: Route detail-page edits through the store**

Replace direct reads/writes of `detailManualHoursState` in `getDetailEmployeeHours` and `onDetailManualHoursInput`. Resolve the current rule with its stable ID and write:

```js
TipOutManualHours.set({
  poolId: String(rule.poolId || rule.id || ruleId),
  poolName: rule.poolName || rule.name || '未命名小费池',
  ruleId: String(rule.id || ruleId),
  ruleName: rule.name || '未命名规则',
  dateKey,
  employeeName,
  hours: parseHoursInput(input.value)
});
```

Load the store before `details` and `distribution` in `tips-legacy-runtime.ts`.

- [ ] **Step 5: Run verification and commit**

Run: `node scripts/verify-team-tips-manual-hours-store.mjs`

Expected: PASS.

Commit:

```bash
git add src/team/tips/legacy/tipout-manual-hours-store.js.txt src/team/tips/programs/details.js.txt src/team/tips/tips-legacy-runtime.ts scripts/verify-team-tips-manual-hours-store.mjs
git commit -m "feat: persist manual hours by tip rule"
```

### Task 2: Carry manual-hour records into daily results and snapshots

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Create: `scripts/verify-team-tips-manual-hours-snapshot.mjs`

**Interfaces:**
- Consumes: `TipOutManualHours.listForEmployee(dateKey, employeeName)`.
- Produces: daily employee field `manualHourEntries: ManualHourEntry[]` and deep-cloned snapshot values.

- [ ] **Step 1: Write the failing projection test**

Assert that distribution attaches `manualHourEntries`, aggregation preserves them, snapshot creation deep-clones each object, and snapshot validation accepts both legacy rows without the field and new rows containing valid entries. Mutating the source after snapshot creation must not mutate the snapshot.

- [ ] **Step 2: Run the projection test and confirm RED**

Run: `node scripts/verify-team-tips-manual-hours-snapshot.mjs`

Expected: FAIL because daily results do not carry manual-hour records.

- [ ] **Step 3: Attach entries without touching money calculations**

In `attachAttendance`, read manual records for the same employee and date and assign a cloned array to `row.manualHourEntries`. Do not pass them into `runLegacyDayPipeline` and do not modify any monetary field.

- [ ] **Step 4: Deep-clone and validate the snapshot field**

Extend `buildEmployeeReconciliationSnapshot` to clone `manualHourEntries` and `readEmployeeReconciliationSnapshot` to allow an absent field or an array of normalized entries. Reject malformed entries without changing the version-1 legacy fallback.

- [ ] **Step 5: Run verification and commit**

Run: `node scripts/verify-team-tips-manual-hours-snapshot.mjs`

Expected: PASS.

Commit:

```bash
git add src/team/tips/programs/distribution.js.txt src/team/tips/legacy/tipout-summary-ui.js.txt scripts/verify-team-tips-manual-hours-snapshot.mjs
git commit -m "feat: carry manual hours into reconciliation"
```

### Task 3: Build one reconciliation presentation model

**Files:**
- Modify: `src/team/tips/legacy/attendanceMock.js.txt`
- Modify: `scripts/verify-team-tips-employee-punch-sessions.mjs`

**Interfaces:**
- Consumes: `{ punchSessions?, clockStatus?, hours?, manualHourEntries? }`.
- Produces: `summarizeDayAttendance(row)` returning `{ status, hasPunchException, shifts, hours, clockIns, clockOuts, hourLines, manualEntries }`.

- [ ] **Step 1: Add failing source-state cases**

Add tests for: punch only (`已打卡`), manual only (`手动工时`), valid punch plus manual (`混合工时`), abnormal punch plus manual (`混合工时` with `hasPunchException: true`), no source (`未打卡`), and legacy punch rows. Assert manual lines remain separate:

```js
assert.deepEqual(mixed.hourLines, [
  { label: '打卡工时', hours: 8 },
  { label: '前厅小费池 · 前厅按工时分配', hours: 6 }
]);
```

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/verify-team-tips-employee-punch-sessions.mjs`

Expected: FAIL on manual and mixed source cases.

- [ ] **Step 3: Extend the attendance adapter**

Keep current punch validation unchanged. Normalize manual entries independently. Choose exactly one primary status in this order: any manual plus any punch data → `混合工时`; manual only → `手动工时`; otherwise current punch status. Set `hasPunchException` whenever punch normalization is abnormal. Never add manual hours to `hours`; that property remains actual valid punch hours.

- [ ] **Step 4: Run and commit**

Run: `node scripts/verify-team-tips-employee-punch-sessions.mjs`

Expected: PASS for old and new cases.

Commit:

```bash
git add src/team/tips/legacy/attendanceMock.js.txt scripts/verify-team-tips-employee-punch-sessions.mjs
git commit -m "feat: classify manual and mixed work hours"
```

### Task 4: Render, filter, summarize, and export manual hours

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Create: `scripts/verify-team-tips-employee-manual-hours-view.mjs`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: the Task 3 `summarizeDayAttendance(row)` result.
- Produces: synchronized screen/filter/metric/export behavior.

- [ ] **Step 1: Write failing view assertions**

Verify the template contains `手动工时` and `混合工时` filter options; the row renderer uses `hourLines`; mixed abnormal rows render both “混合工时” and the secondary “打卡异常” badge; and export rows contain `workHourSource`, `attendanceNote`, and `manualHourDetails`.

- [ ] **Step 2: Run view tests and confirm RED**

Run:

```bash
node scripts/verify-team-tips-employee-manual-hours-view.mjs
node scripts/verify-team-tips-native-views.mjs
```

Expected: the new verification fails on missing options, metrics, and export fields; existing tests remain green or fail only where superseded assertions require updating.

- [ ] **Step 3: Implement the two new filters and row content**

Add `手动工时` and `混合工时` options. Render `hourLines` as separate text lines. Manual-only rows show `—` for shifts and punch times. Mixed rows keep actual shifts and times. When `hasPunchException`, append an orange `打卡异常` secondary badge beside the `混合工时` primary badge.

- [ ] **Step 4: Replace the top total-hours metric**

Change the label and IDs to “手动工时记录”. From the currently visible rows, count distinct nonempty `poolId` values and all valid manual entries, rendering `N 个小费池 / M 条记录`. Recompute after both date and attendance filters. Keep shift and monetary summaries unchanged.

- [ ] **Step 5: Synchronize all export channels**

Add columns in this order after attendance status: `工时来源`, `考勤备注`, `班次`, `工时`, `上班时间`, `下班时间`, `手动工时明细`. Use `打卡异常` only for mixed abnormal rows; otherwise leave the note empty. Reuse the same collected row data for CSV, printable PDF, and email payloads, preserving embedded newlines and one monetary record per date.

- [ ] **Step 6: Style multiline work-hour content and secondary badges**

Use `white-space: pre-line`, tabular numerals, and a compact vertical gap. Keep the primary and secondary badges visually adjacent and accessible without relying on color alone.

- [ ] **Step 7: Run all focused regressions**

Run:

```bash
node scripts/verify-team-tips-manual-hours-store.mjs
node scripts/verify-team-tips-manual-hours-snapshot.mjs
node scripts/verify-team-tips-employee-punch-sessions.mjs
node scripts/verify-team-tips-employee-manual-hours-view.mjs
node scripts/verify-team-tips-employee-shifts-hours-columns.mjs
node scripts/verify-team-tips-native-views.mjs
```

Expected: all PASS.

- [ ] **Step 8: Build and visually verify**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build exit successfully. In the native route, verify manual-only, mixed, mixed-abnormal, filters, top metrics, CSV content, and the PDF print dialog. Do not include generated build artifacts in the feature commit unless they are repository policy.

- [ ] **Step 9: Commit**

```bash
git add src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/tips-page.css scripts/verify-team-tips-employee-manual-hours-view.mjs scripts/verify-team-tips-native-views.mjs
git commit -m "feat: show manual hours in employee reconciliation"
```
