# Payroll Cross-Year Period Numbering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate payroll years through the next calendar year and number biweekly Sun–Sat periods by their ending year, including safe migration of cached period references.

**Architecture:** Add one dependency-free calendar/migration module as the single source of truth for standalone TipOut Payroll and the native Team Payroll runtime. `payroll.js` consumes its generated periods and migration map; the native runtime copies and evaluates the same helper before `payroll.js` so both entry points remain behaviorally identical.

**Tech Stack:** Vanilla JavaScript, TypeScript/Vite native wrapper, Node.js assertion scripts, in-app browser verification.

**Spec:** `docs/superpowers/specs/2026-09-03-payroll-cross-year-period-numbering-design.md`

## Global Constraints

- Payroll periods are 14 calendar days, Sunday through Saturday.
- A period belongs to the year of its end date.
- `12/21/2025–01/03/2026` is `p2026-01`; `01/04/2026–01/17/2026` is `p2026-02`.
- Supported years run from 2025 through runtime current year plus one.
- Migration must be idempotent and must not overwrite or silently discard user data.
- Existing Paycheck Date behavior remains period end date plus six days.

---

### Task 1: Pure payroll calendar module

**Files:**
- Create: `dist/TipOut/payroll-period-calendar.js`
- Create: `scripts/verify-payroll-period-calendar.mjs`

**Interfaces:**
- Consumes: a runtime `Date` and optional status map keyed by final period ID.
- Produces: `window.PayrollPeriodCalendar.buildSupportedPeriods(now, statusById)` and `window.PayrollPeriodCalendar.periodDateKey(period)`.

- [ ] **Step 1: Write the failing calendar verification**

Create `scripts/verify-payroll-period-calendar.mjs` that evaluates the UMD helper in a `vm` context and asserts exact boundaries:

```js
const periods = api.buildSupportedPeriods(new Date(2026, 8, 3), {});
const byId = new Map(periods.map((period) => [period.id, period]));
assert.equal(byId.get("p2026-01").rangeLabel, "12/21/2025 (Sun) – 01/03/2026 (Sat)");
assert.equal(byId.get("p2026-02").rangeLabel, "01/04/2026 (Sun) – 01/17/2026 (Sat)");
assert.equal(periods.some((period) => period.year === 2027), true);
assert.equal(periods.filter((period) => period.year === 2027).length, 26);
assert.equal(periods.filter((period) => period.year === 2028).length, 0);

const through2028 = api.buildSupportedPeriods(new Date(2027, 0, 1), {});
assert.equal(through2028.filter((period) => period.year === 2028).length, 27);
assert.equal(byPeriodId(through2028, "p2028-27").rangeLabel, "12/17/2028 (Sun) – 12/30/2028 (Sat)");
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node scripts/verify-payroll-period-calendar.mjs`

Expected: FAIL because `dist/TipOut/payroll-period-calendar.js` does not exist.

- [ ] **Step 3: Implement the calendar helper**

Use the confirmed anchor and calendar-day arithmetic:

```js
(function (global) {
  const ANCHOR_START = { year: 2025, month: 12, day: 21 };
  const FIRST_SUPPORTED_YEAR = 2025;

  function utcDate(parts) {
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  }

  function addCalendarDays(date, days) {
    const next = new Date(date.getTime());
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  function buildSupportedPeriods(now, statusById) {
    const lastYear = now.getFullYear() + 1;
    const anchor = utcDate(ANCHOR_START);
    const result = [];
    const counts = new Map();
    for (let start = anchor; start.getUTCFullYear() <= lastYear; start = addCalendarDays(start, 14)) {
      const end = addCalendarDays(start, 13);
      const year = end.getUTCFullYear();
      if (year < FIRST_SUPPORTED_YEAR || year > lastYear) continue;
      const periodNumber = (counts.get(year) || 0) + 1;
      counts.set(year, periodNumber);
      const id = `p${year}-${String(periodNumber).padStart(2, "0")}`;
      result.push({ id, year, periodNumber, rangeLabel: formatRange(start, end), paycheckDate: formatPaycheck(end), status: statusById[id] || "draft" });
    }
    return result;
  }

  global.PayrollPeriodCalendar = { buildSupportedPeriods, periodDateKey };
})(window);
```

The implementation must include strict `MM/DD/YYYY` validation and return `YYYY-MM-DD/YYYY-MM-DD` from `periodDateKey`.

- [ ] **Step 4: Run the calendar verification and confirm GREEN**

Run: `node scripts/verify-payroll-period-calendar.mjs`

Expected: PASS with exact 2026/2027/2028 assertions.

- [ ] **Step 5: Commit the calendar unit**

```bash
git add dist/TipOut/payroll-period-calendar.js scripts/verify-payroll-period-calendar.mjs
git commit -m "feat: add cross-year payroll calendar"
```

---

### Task 2: Snapshot migration and reference remapping

**Files:**
- Modify: `dist/TipOut/payroll-period-calendar.js`
- Modify: `scripts/verify-payroll-period-calendar.mjs`

**Interfaces:**
- Consumes: `migrateSnapshot(snapshot, selection, now, statusById)` where `snapshot` contains `periods`, `employees`, `auditLog`, and arbitrary extension fields.
- Produces: `{ snapshot, selection, legacyPeriods }`; `snapshot` is newly constructed, and `selection` contains remapped `periodId`, year filters, period-number filter, and employee ID.

- [ ] **Step 1: Add failing migration cases**

Add fixtures for the legacy 2025/2026 calendar and assert:

```js
const migrated = api.migrateSnapshot(legacySnapshot, {
  periodId: "p2026-01",
  employeeId: "employee-a",
  periodYearFilter: "2026",
  workspacePeriodYearFilter: "2026",
  periodNumberFilter: "1",
}, new Date(2026, 8, 3), {});

assert.deepEqual(migrated.snapshot.employees["p2026-02"], legacySnapshot.employees["p2026-01"]);
assert.equal(migrated.selection.periodId, "p2026-02");
assert.equal(migrated.selection.periodNumberFilter, "2");
assert.equal(migrated.snapshot.auditLog[0].periodId, "p2026-02");
assert.equal(migrated.snapshot.coCode, legacySnapshot.coCode);
assert.deepEqual(migrated.snapshot.extensionField, legacySnapshot.extensionField);
assert.deepEqual(api.migrateSnapshot(migrated.snapshot, migrated.selection, new Date(2026, 8, 3), {}), migrated);
```

Also assert `p2025-26 → p2026-01`, `p2026-26 → p2027-01`, target-ID collision safety, duplicate ranges, invalid dates, out-of-range isolation, legacy audit marking, and preservation of duplicate employee IDs.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node scripts/verify-payroll-period-calendar.mjs`

Expected: FAIL because `migrateSnapshot` is not implemented.

- [ ] **Step 3: Implement immutable migration**

Implement migration with these concrete stages:

```js
const oldSnapshot = deepClone(snapshot);
const oldSelectionKey = periodDateKey(oldSnapshot.periods.find((p) => p.id === selection.periodId));
const targetPeriods = buildSupportedPeriods(now, statusById);
const targetByKey = new Map(targetPeriods.map((period) => [periodDateKey(period), period]));
const oldIdToNewId = new Map();
const nextEmployees = {};
const legacyPeriods = [];
```

Index old periods without mutating them. Map only validated identical date keys; reconstruct missing legacy ranges from the known old annual start rules before rejecting them. Build `nextEmployees` from the frozen source, let migrated user data replace seed data, isolate conflicts without merging arrays, remap audit entries through `oldIdToNewId`, and mark unmappable entries with `legacyPeriodReference: true`. Spread the original snapshot first so unknown fields remain intact.

- [ ] **Step 4: Run the migration verification and confirm GREEN**

Run: `node scripts/verify-payroll-period-calendar.mjs`

Expected: PASS for boundary, collision, audit, preservation, and double-migration cases.

- [ ] **Step 5: Commit migration behavior**

```bash
git add dist/TipOut/payroll-period-calendar.js scripts/verify-payroll-period-calendar.mjs
git commit -m "fix: migrate payroll periods by date range"
```

---

### Task 3: Wire both Payroll entry points to the shared calendar

**Files:**
- Modify: `dist/TipOut/payroll.html`
- Modify: `dist/TipOut/payroll.js`
- Modify: `scripts/generate-team-payroll-native-runtime.mjs`
- Modify: `scripts/verify-team-payroll-native-runtime.mjs`
- Modify: `src/team/payroll/payroll-legacy-runtime.ts`
- Generate: `src/team/payroll/legacy/payroll-period-calendar.js.txt`
- Generate: `src/team/payroll/legacy/payroll.js.txt`

**Interfaces:**
- Consumes: `window.PayrollPeriodCalendar` from Task 1 and `migrateSnapshot` from Task 2.
- Produces: identical standalone/native period generation, migration, and year options.

- [ ] **Step 1: Extend the native-runtime verifier before integration**

Require `payroll-period-calendar.js` in the source/copy list, require its import before `payrollCode`, and assert `payroll.js` uses `PayrollPeriodCalendar.buildSupportedPeriods` and `PayrollPeriodCalendar.migrateSnapshot` rather than `buildYearPeriods`.

- [ ] **Step 2: Run native verification and confirm RED**

Run: `node scripts/verify-team-payroll-native-runtime.mjs`

Expected: FAIL because the helper is not yet copied or injected.

- [ ] **Step 3: Integrate the standalone runtime**

Add `<script src="payroll-period-calendar.js?...">` immediately before `payroll.js`. Replace `buildYearPeriods`/hard-coded `buildPresetPeriods` with the shared helper. During state load, call migration before demo-data filling; apply demo employees/status only where migration returned no source data. Update `getRecentYears()` to derive options from generated period years and order them consistently while guaranteeing `currentYear + 1`.

- [ ] **Step 4: Integrate the native runtime**

Add the helper to `generate-team-payroll-native-runtime.mjs`, import its raw copy in `payroll-legacy-runtime.ts`, and place `periodCalendarCode` before `payrollCode` in `buildRuntimeSource()`.

- [ ] **Step 5: Generate native runtime copies**

Run: `node scripts/generate-team-payroll-native-runtime.mjs`

Expected: `src/team/payroll/legacy/payroll-period-calendar.js.txt` and `payroll.js.txt` exactly match `dist/TipOut` sources.

- [ ] **Step 6: Run focused checks**

Run:

```bash
node scripts/verify-payroll-period-calendar.mjs
node scripts/verify-team-payroll-native-runtime.mjs
node scripts/verify-team-payroll-view.mjs
npx tsc --noEmit
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit runtime integration**

```bash
git add dist/TipOut/payroll.html dist/TipOut/payroll.js scripts/generate-team-payroll-native-runtime.mjs scripts/verify-team-payroll-native-runtime.mjs src/team/payroll/payroll-legacy-runtime.ts src/team/payroll/legacy/payroll-period-calendar.js.txt src/team/payroll/legacy/payroll.js.txt
git commit -m "feat: support future payroll years"
```

---

### Task 4: Browser regression and final verification

**Files:**
- Modify only if a regression is found in Task 4: files owned by Tasks 1–3.

**Interfaces:**
- Consumes: completed calendar, migration, and native runtime integration.
- Produces: evidence that visible UI and persisted data use the same period identity.

- [ ] **Step 1: Reset only the Payroll test fixture and reload the native route**

Open `http://127.0.0.1:5174/#/team/payroll-report`, preserve unrelated browser storage, and reload the Payroll module so the new runtime is mounted.

- [ ] **Step 2: Verify visible year and period behavior**

Assert that the Year menu contains 2027, select 2026, then select Period 2. Verify the displayed range is exactly `01/04/2026 (Sun) – 01/17/2026 (Sat)` and the employee hero/detail both report Period 2.

- [ ] **Step 3: Verify migration in the UI**

Load a fixture where old `p2026-01` owns the `01/04/2026–01/17/2026` employee data. Reload and assert that the same employee values appear under `p2026-02`, with no duplicate or missing employees and with the audit row pointing to the new ID.

- [ ] **Step 4: Verify cross-year navigation**

Select 2027 and confirm Period 1 spans `12/20/2026 (Sun) – 01/02/2027 (Sat)`. Confirm switching years does not clear a valid store selection and does not throw console errors.

- [ ] **Step 5: Run the complete focused regression set**

Run:

```bash
node scripts/verify-payroll-period-calendar.mjs
node scripts/verify-team-payroll-native-runtime.mjs
node scripts/verify-team-payroll-polish.mjs
node scripts/verify-team-payroll-view.mjs
npx tsc --noEmit
git diff --check
```

Expected: all commands exit 0; no browser console errors occur.

- [ ] **Step 6: Commit any browser-found correction**

If Task 4 required a correction, stage only the affected Payroll source, generated copy, and focused verifier, then commit:

```bash
git commit -m "fix: align payroll period selection"
```

If no correction was required, do not create an empty commit.
