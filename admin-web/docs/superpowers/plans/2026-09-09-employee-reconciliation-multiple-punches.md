# Employee Reconciliation Multiple Punches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show ordered multi-shift clock-in and clock-out times on each employee reconciliation day while keeping tip amounts aggregated once per day.

**Architecture:** Extend the attendance adapter with normalized `punchSessions`, then derive a read-only daily attendance presentation shared by table rendering, filtering, metrics, and exports. Preserve top-level `hours` for the existing tip calculation pipeline and do not recalculate monetary results.

**Tech Stack:** Legacy JavaScript loaded by the TypeScript host, HTML templates, CSS, Node verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-employee-reconciliation-multiple-punches-design.md`

## Global Constraints

- Modify only native `src/team/tips`; do not edit the retired standalone TipOut project.
- Keep one row and one set of tip amounts per employee per date.
- `punchSessions` is authoritative when present; old rows without it use the documented non-fabricating fallback.
- Any invalid session makes the date status `打卡异常` and is excluded from shift and hour totals.
- Do not modify stored allocation results or monetary calculations.
- Export column order must match the interface.

---

### Task 1: Define the attendance session contract and tests

**Files:**
- Create: `scripts/verify-team-tips-employee-punch-sessions.mjs`
- Modify: `src/team/tips/legacy/attendanceMock.js.txt`

**Interfaces:**
- Consumes: employee name and `YYYY-MM-DD` date key.
- Produces: `getDayStatus(name, date)` returning `{ hours, clockStatus, punchSessions }` and `summarizeDayAttendance(row)` returning normalized display data.

- [ ] **Step 1: Write a failing test**

The test must execute `attendanceMock.js.txt` in `node:vm` and assert single-session, multi-session, missing-clock-out, stable ordering, and legacy fallback cases. It must also assert that invalid sessions do not contribute to `shifts` or `hours`.

- [ ] **Step 2: Run the test to verify failure**

Run: `node scripts/verify-team-tips-employee-punch-sessions.mjs`

Expected: FAIL because `punchSessions` and `summarizeDayAttendance` do not exist.

- [ ] **Step 3: Implement normalized session helpers**

Add these public helpers to `TipOutAttendance`:

```js
summarizeDayAttendance: function (row) {
  return {
    status: '已打卡',
    shifts: 2,
    hours: 9.33,
    clockIns: ['09:02', '17:01'],
    clockOuts: ['14:10', '21:13']
  };
}
```

The real implementation validates every session, sorts by `clockIn` with original-index tie-breaking, returns `打卡异常` for any invalid session, and applies the spec's legacy fallback without inventing times.

- [ ] **Step 4: Generate deterministic demo sessions**

Update `getDayStatus` so deterministic demo dates include no punches, one complete session, two complete sessions, and a mixed complete plus missing-clock-out case. Set returned `hours` to the sum of complete session durations.

- [ ] **Step 5: Run the focused test**

Run: `node scripts/verify-team-tips-employee-punch-sessions.mjs`

Expected: PASS.

- [ ] **Step 6: Commit the attendance contract**

```bash
git add scripts/verify-team-tips-employee-punch-sessions.mjs src/team/tips/legacy/attendanceMock.js.txt
git commit -m "feat: model employee punch sessions"
```

### Task 2: Carry sessions into reconciliation snapshots

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Test: `scripts/verify-team-tips-employee-punch-sessions.mjs`

**Interfaces:**
- Consumes: `TipOutAttendance.getDayStatus` result.
- Produces: daily result rows and cloned employee snapshots containing `punchSessions` without changing monetary fields.

- [ ] **Step 1: Attach punch sessions to daily rows**

```js
row.hours = att.hours;
row.clockStatus = att.clockStatus;
row.punchSessions = Array.isArray(att.punchSessions) ? att.punchSessions.map(function (session) { return Object.assign({}, session); }) : undefined;
```

- [ ] **Step 2: Clone nested session arrays in snapshots**

Change snapshot building from shallow row copies to row copies that clone `punchSessions`, preventing view code from mutating shared attendance data.

- [ ] **Step 3: Run focused and native summary tests**

Run:

```bash
node scripts/verify-team-tips-employee-punch-sessions.mjs
node scripts/verify-team-tips-native-views.mjs
```

Expected: both PASS.

- [ ] **Step 4: Commit snapshot propagation**

```bash
git add src/team/tips/programs/distribution.js.txt src/team/tips/legacy/tipout-summary-ui.js.txt scripts/verify-team-tips-employee-punch-sessions.mjs
git commit -m "feat: carry punch sessions into reconciliation"
```

### Task 3: Render times and add abnormal filtering

**Files:**
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Test: `scripts/verify-team-tips-employee-punch-sessions.mjs`

**Interfaces:**
- Consumes: `TipOutAttendance.summarizeDayAttendance(row)`.
- Produces: daily rows with `班次`, `工时`, `上班时间`, `下班时间`, and status filtering for `打卡异常`.

- [ ] **Step 1: Add table columns and filter option**

Insert `上班时间` and `下班时间` after `工时`, and add `<option value="打卡异常">打卡异常</option>` after `未打卡`.

- [ ] **Step 2: Use one presentation helper for status and values**

Call `summarizeDayAttendance(row)` from `employeeDetailAttendanceStatus`, row rendering, filtered metrics, and exports. Do not repeat validation logic in the renderer.

- [ ] **Step 3: Render aligned multiline time cells**

Render `clockIns` and `clockOuts` using one block per array item in identical order. Empty arrays render one `—`. Add a compact time-stack CSS class and increase the detail table minimum width while preserving horizontal scrolling.

- [ ] **Step 4: Verify all four filters**

Test `全部状态`, `已打卡`, `未打卡`, and `打卡异常`, including a day containing both complete and invalid sessions.

- [ ] **Step 5: Commit detail rendering**

```bash
git add src/team/tips/templates/employee-reconciliation.html src/team/tips/programs/employee-reconciliation.js.txt src/team/tips/tips-page.css
git commit -m "feat: show daily employee punch times"
```

### Task 4: Update CSV, PDF, print, and email exports

**Files:**
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Test: `scripts/verify-team-tips-employee-punch-sessions.mjs`

**Interfaces:**
- Consumes: normalized `clockIns` and `clockOuts` from the shared attendance presentation.
- Produces: export rows with `clockIns` and `clockOuts` strings positioned after `hours`.

- [ ] **Step 1: Extend the export projection**

```js
clockIns: attendance.clockIns.join('\n') || '—',
clockOuts: attendance.clockOuts.join('\n') || '—',
```

- [ ] **Step 2: Update all export headings and row arrays**

Use `上班时间`, then `下班时间` after `工时` in CSV and print/PDF builders. Email simulation continues to reuse those builders, so no separate schema is introduced.

- [ ] **Step 3: Verify multiline and amount behavior**

Assert CSV quoting preserves embedded `\n`, HTML renders line breaks, missing times use `—`, and one daily amount row is emitted regardless of session count.

- [ ] **Step 4: Commit export support**

```bash
git add src/team/tips/programs/employee-reconciliation.js.txt scripts/verify-team-tips-employee-punch-sessions.mjs
git commit -m "feat: export employee punch times"
```

### Task 5: Final verification and browser acceptance

**Files:**
- Verify: `scripts/verify-team-tips-employee-punch-sessions.mjs`
- Verify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: complete native implementation.
- Produces: regression and visual evidence for the approved B layout.

- [ ] **Step 1: Parse legacy JavaScript and run regressions**

Run:

```bash
node scripts/verify-team-tips-employee-punch-sessions.mjs
node scripts/verify-team-tips-employee-shifts-hours-columns.mjs
node scripts/verify-team-tips-native-views.mjs
node -e "const fs=require('fs'); for(const f of ['src/team/tips/legacy/attendanceMock.js.txt','src/team/tips/programs/distribution.js.txt','src/team/tips/programs/employee-reconciliation.js.txt']) new Function(fs.readFileSync(f,'utf8'));"
```

Expected: every command PASS.

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`

Expected: exit code 0 with no new compile errors.

- [ ] **Step 3: Browser acceptance**

Open `#/team/tips/employee-reconciliation`, verify single, multiple, missing, and mixed sessions; confirm filters, back navigation, CSV, PDF preview, and email-generated content.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check`

Expected: no whitespace errors in feature files and no generated build assets included.
