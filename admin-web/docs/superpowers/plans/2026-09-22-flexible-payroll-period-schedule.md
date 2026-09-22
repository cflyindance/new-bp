# Flexible Payroll Period Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each store switch among weekly, biweekly, semimonthly, and monthly payroll schedules on any safe date, while preserving confirmed payroll history and offering a separate hours-only historical simulation.

**Architecture:** Build a pure local-date schedule engine, a versioned migration/publish layer, and a narrowly scoped native payroll settings controller. Existing legacy shared periods remain immutable; newly generated periods are store-specific. Publishing is an atomic revision-checked state update; confirmed records and formal exports are snapshots, never recomputed by viewing a different frequency.

**Tech Stack:** TypeScript 5.6, Vite 6, native DOM/Shadow DOM, Node.js mock payroll API, `npx tsx` assertion scripts, browser E2E.

**Spec:** `docs/superpowers/specs/2026-09-22-flexible-payroll-period-schedule-design.md`

## Global Constraints

- Preserve existing 2025/2026 legacy period IDs, dates, displayed numbers, employees, adjustments, confirmations, and prior exports.
- Weekly and biweekly anchors denote the first local calendar day of a complete 7/14-day period; never reset phase at New Year.
- A schedule may take effect on any local date only when no affected period contains confirmed, formally exported, or paid data.
- Affected per-period monetary adjustments require explicit reassignment; never prorate or silently move them.
- Pay date policy is `calendarDaysAfterPeriodEnd`, applied to the **actual** end of standard and transition periods; legacy offset is 6 days.
- Payroll frequency does not change the independent fixed workweek overtime calculation.
- Historical alternate-frequency simulation is hours-only; no simulated pay, tax, manual adjustment, payslip, or ADP export.
- California/Texas demo compliance policies must carry a reviewed version; unknown jurisdiction/classification blocks publishing.
- This repository's current payroll API is a local mock without authentication. Do not represent the delivered UI as a production payroll authorization or legal-compliance service.
- Do not modify `vendor/emenu-new`; if later work does, run the project-mandated `npm run build:emenu-new-embed -- --skip-install` and verify published artifacts.
- Preserve unrelated dirty worktree files. Build output under `dist/` is not committed unless explicitly required by the execution branch's release procedure.

---

## File map and ownership

| File | Responsibility |
| --- | --- |
| `src/team/payroll/payroll-schedule-types.ts` | Canonical rule, period, preview, and snapshot types. |
| `src/team/payroll/payroll-local-date.ts` | Strict ISO date parse/add/compare using calendar arithmetic. |
| `src/team/payroll/payroll-schedule-engine.ts` | Pure four-frequency generation, transition splitting, numbering. |
| `src/team/payroll/payroll-schedule-migration.ts` | Idempotent v4→v5 legacy migration and quarantine diagnostics. |
| `src/team/payroll/payroll-schedule-compliance.ts` | Versioned TX/CA demo policy evaluation, no UI or persistence. |
| `src/team/payroll/payroll-store-metadata.ts` | Explicit store ID → jurisdiction/timezone/classification inputs; unknown stores block publish. |
| `src/team/payroll/payroll-schedule-change.ts` | Pure preview, lock checks, explicit reassignment, publish result. |
| `src/team/payroll/payroll-schedule-repository.ts` | Revision-aware mock API publish client; no rules in UI. |
| `src/team/payroll/payroll-schedule-controller.ts` | Settings/preview/history/simulation DOM interaction. |
| `src/team/payroll/payroll-schedule-simulation.ts` | Hours-only regrouping from dated raw attendance. |
| `src/team/payroll/payroll-template.html`, `payroll-page.css`, `payroll-page.ts` | Native entry and visible UI, no business calculations. |
| `src/team/payroll/legacy/payroll.js.txt`, `payroll-legacy-runtime.ts`, `payroll-types.ts` | Compatibility bridge; stop destructive fixed-26 regeneration. |
| `scripts/lib/payroll-mock-api-handler.mjs`, `src/team/payroll/payroll-api.ts` | Revision-checked state persistence and audit. |
| `scripts/verify-payroll-schedule-*.ts`, `scripts/verify-payroll-schedule-ui.mjs` | Focused RED/GREEN verification. |

### Task 1: Pure local-date and four-frequency schedule engine

**Files:** Create `src/team/payroll/payroll-schedule-types.ts`, `payroll-local-date.ts`, `payroll-schedule-engine.ts`; test `scripts/verify-payroll-schedule-engine.ts`.

**Interfaces:** Produce `type IsoDate = string`, `PayrollScheduleRule`, `ScheduledPeriod`, `generatePeriods(rule, from, through): ScheduledPeriod[]`, and `numberPeriods(periods, previous): ScheduledPeriod[]`. These are pure and do not read `window`, storage, or current time. Define the minimum persisted rule and generated period shape exactly as follows; optional approval/audit metadata may be added in Task 5.

```ts
export type PayrollFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
export interface PayrollScheduleRule {
  id: string; storeId: string; version: number; effectiveFrom: IsoDate;
  frequency: PayrollFrequency; anchorDate?: IsoDate;
  calendarDaysAfterPeriodEnd: number; timezone: string;
  status: "draft" | "approved";
}
export interface ScheduledPeriod {
  id?: string; storeId: string; ruleVersionId: string;
  startDate: IsoDate; endDate: IsoDate; plannedPayDate: IsoDate;
  payYear?: number; periodNumber?: number; status: "draft";
}
```

- [ ] **Step 1: Write failing fixtures.** Add assertions for 2027-07-08→07-15 semimonthly short period, leap-year February, weekly Sunday anchor, 14-day continuity over New Year, and an anchor/pay-date combination yielding a 27th pay date. Example:

```ts
const periods = generatePeriods({ id: "r1", storeId: "s1", version: 1, status: "approved", frequency: "semimonthly", effectiveFrom: "2027-07-08", calendarDaysAfterPeriodEnd: 6, timezone: "America/Chicago" }, "2027-07-08", "2027-07-31");
assert.deepEqual(periods.map(({ startDate, endDate, plannedPayDate }) => [startDate, endDate, plannedPayDate]), [["2027-07-08", "2027-07-15", "2027-07-21"], ["2027-07-16", "2027-07-31", "2027-08-06"]]);
assert.equal(numberPeriods(periods, []).at(0)?.payYear, 2027);
```

- [ ] **Step 2: Run RED.** `npx.cmd --yes tsx scripts/verify-payroll-schedule-engine.ts`; expect missing module/export or failed assertions.
- [ ] **Step 3: Implement strict date primitives and generation.** `parseIsoDate` rejects rollover dates; `addCalendarDays` uses UTC calendar components rather than milliseconds in local time. For weekly/biweekly, `standardBoundaryEnd` returns `cursor + (cycleLength - 1 - positiveModulo(daysBetween(anchorDate, cursor), cycleLength))`; for semimonthly, day 1–15 ends on the 15th and day 16–month-end ends at month-end; for monthly, use month-end. Clip only the first generated period at `from`; `through` is a horizon for deciding which period starts to include, **not** a persisted final end-date clip. Derive `plannedPayDate = addCalendarDays(endDate, calendarDaysAfterPeriodEnd)`. `numberPeriods` preserves all historical display numbers and assigns each new period the next unused number after the maximum existing number for its pay-date year, including 27 when applicable; period ID remains the actual identity.

```ts
export function generatePeriods(rule: PayrollScheduleRule, from: IsoDate, through: IsoDate): ScheduledPeriod[] {
  assertValidRule(rule);
  if (compareIsoDate(from, through) > 0) return [];
  const result: ScheduledPeriod[] = [];
  for (let cursor = from; compareIsoDate(cursor, through) <= 0;) {
    const endDate = standardBoundaryEnd(rule, cursor);
    result.push({ storeId: rule.storeId, ruleVersionId: rule.id, startDate: cursor, endDate, plannedPayDate: addCalendarDays(endDate, rule.calendarDaysAfterPeriodEnd), status: "draft" });
    cursor = addCalendarDays(endDate, 1);
  }
  return result;
}
```

- [ ] **Step 4: Run GREEN and typecheck.** Same verifier, then `npx.cmd tsc --noEmit`; expect all cases pass.
- [ ] **Step 5: Commit only these files.** `git add -- <four paths>`; `git commit -m "feat: generate flexible payroll schedule periods"`.

### Task 2: Idempotent legacy migration without data loss

**Files:** Create `src/team/payroll/payroll-schedule-migration.ts`; modify `payroll-types.ts`, `legacy/payroll.js.txt`, `payroll-legacy-runtime.ts`; test `scripts/verify-payroll-schedule-migration.ts`.

**Interfaces:** Consume Task 1 types. Produce `migratePayrollSnapshot(snapshot: PayrollSnapshot, stores: Array<{ id: string; timezone: string }>): { snapshot: PayrollSnapshot; diagnostics: MigrationDiagnostic[] }`. `PayrollData` gains `schemaVersion: 5`, `scheduleRules`, and structured period dates. Legacy periods with no `storeId` remain shared historical records; new periods always have one `storeId`. Store IDs/timezones come from explicit host metadata, never a substring of the store display name.

- [ ] **Step 1: Write RED fixtures.** Snapshot with `p2026-01`, `rangeLabel: "01/04/2026 (Sun) – 01/17/2026 (Sat)"`, employee adjustments and confirmation; assert unchanged ID/number/range/employee JSON, added ISO dates and one legacy rule per store. Run migration twice and assert identical result. Add an invalid date/range fixture whose record is retained with a diagnostic rather than overwritten.
- [ ] **Step 2: Run RED.** `npx.cmd --yes tsx scripts/verify-payroll-schedule-migration.ts`; expect missing export.
- [ ] **Step 3: Implement migration and remove reset path.** Parse legacy `rangeLabel` once to `startDate/endDate`, preserve `year`, `periodNumber`, `paycheckDate`, status and employee map. Set `ruleVersionId` to a deterministic legacy rule for each store only in store-specific derived views; shared legacy period itself keeps its existing ID and no `storeId`. Replace `migratePeriods()`'s `preset.map(...)` discard behavior with `migratePayrollSnapshot(...)`; make `ensureDataShape()` append genuinely missing future periods instead of replacing all periods. Preserve unparseable originals and surface diagnostics.

```ts
if (period.startDate && period.endDate) return period;
const range = parseLegacyRange(period.rangeLabel);
return range ? { ...period, ...range } : (diagnostics.push({ periodId: period.id, code: "invalid_legacy_range" }), period);
```

- [ ] **Step 4: Run GREEN plus existing payroll checks.** New verifier, `npx.cmd --yes tsx scripts/verify-team-payroll-domain.ts`, `npx.cmd --yes tsx scripts/verify-team-payroll-state.ts`, `npx.cmd tsc --noEmit`.
- [ ] **Step 5: Commit only task files.** `git commit -m "feat: preserve legacy payroll periods in schedule migration"`.

### Task 3: Change preview, split, reassignment, and lock rules

**Files:** Create `src/team/payroll/payroll-schedule-change.ts`; test `scripts/verify-payroll-schedule-change.ts`.

**Interfaces:** Consume `generatePeriods`. Produce `previewScheduleChange(snapshot, storeId, nextRule, through): ScheduleChangePreview` and `applyScheduleChange(snapshot, preview, assignments): PayrollSnapshot`. Preview contains `affectedPeriodIds`, `replacementPeriods`, `blockedPeriodIds`, `unassignedAdjustments`, `earliestSafeDate`, and `continuityErrors`.

- [ ] **Step 1: Write RED fixtures.** Double→semimonth 2027-07-01; double→weekly 2027-07-07 with first new week 07-07–07-10; a shared legacy period containing employees from two stores (changing one leaves the other's old record untouched); an employee confirmed in an otherwise draft period; a period with undated `tips: 85`; a dated attendance segment. Assert confirmed case blocked, undated amount unresolved, and every dated segment assigned exactly once.
- [ ] **Step 2: Run RED.** `npx.cmd --yes tsx scripts/verify-payroll-schedule-change.ts`; expect missing export.
- [ ] **Step 3: Implement pure preview and apply.** Compute old-period split at `effectiveFrom - 1`; generate new standard/short periods from effective date; use deterministic new ID `ps:${encodeURIComponent(storeId)}:${startDate}`. Select only matching-store employee records from shared legacy periods; retain other-store employees under the original ID. Group dated segments by inclusive date; require assignment keys `${oldPeriodId}:${employeeId}:${adjustmentField}` for every nonzero undated period-level adjustment. Reject unresolved assignments, duplicate dated segments, gaps, overlaps, locked status, or changed snapshot revision. Return a cloned snapshot and append an audit event only after all checks pass.

```ts
if (affected.some((period) => isLocked(period, snapshot.data.employees[period.id]))) {
  return { ok: false, blockedPeriodIds: affected.filter((p) => isLocked(p, snapshot.data.employees[p.id])).map((p) => p.id) };
}
```

- [ ] **Step 4: Run GREEN and domain regression.** New verifier, existing payroll domain and batch-export verifiers, `npx.cmd tsc --noEmit`.
- [ ] **Step 5: Commit.** `git commit -m "feat: preview safe payroll schedule transitions"`.

### Task 4: Versioned compliance policy and explicit pay-date review

**Files:** Create `src/team/payroll/payroll-schedule-compliance.ts`, `payroll-store-metadata.ts`; test `scripts/verify-payroll-schedule-compliance.ts`.

**Interfaces:** Produce `evaluateScheduleCompliance(input: { jurisdiction: "TX" | "CA" | string; classification: "exempt" | "nonexempt" | string; rule: PayrollScheduleRule; periods: ScheduledPeriod[]; policyVersion: string }): ComplianceResult`. Result has `allowed`, `code`, `periodId?`, `policyVersion`, `sourceUrl?`. It consumes no DOM or mutable global policy.

- [ ] **Step 1: Write RED fixtures.** TX nonexempt monthly blocked, TX nonexempt semimonth accepted with reviewed policy, CA nonexempt monthly blocked, CA weekly/biweekly pay date beyond seven calendar days blocked, CA 1–15/16–month-end semimonth deadlines checked separately, unknown state/classification/store metadata blocked, unreviewed policy version blocked, and a short transition period checked against its actual end date.
- [ ] **Step 2: Run RED.** `npx.cmd --yes tsx scripts/verify-payroll-schedule-compliance.ts`.
- [ ] **Step 3: Implement a small immutable policy registry.** Store `policyVersion`, `reviewedAt`, `reviewedBy`, and official source URLs alongside TX/CA rules. Add explicit store-ID metadata for the current demo stores, including IANA timezone, jurisdiction and classification source; unknown mappings block publish rather than guessing from store label. Validate frequency and pay-date limits against each `ScheduledPeriod`; return a structured blocking reason. Conservative CA monthly behavior: block absent a separately reviewed exception policy; do not infer eligibility from `exempt` alone. Non-business-day overrides require a reason, approver, and repeat compliance evaluation. Treat this registry as demo-reviewed configuration, not a legal opinion or a general law platform.

```ts
if (!policy || !policy.reviewedAt || !policy.reviewedBy) return { allowed: false, code: "policy_unreviewed", policyVersion };
if (classification === "nonexempt" && rule.frequency === "monthly") return { allowed: false, code: "monthly_not_allowed", policyVersion };
```

- [ ] **Step 4: Run GREEN and typecheck.** New verifier and `npx.cmd tsc --noEmit`.
- [ ] **Step 5: Commit.** `git commit -m "feat: validate payroll schedules against reviewed policies"`.

### Task 5: Revision-checked publish and immutable confirmation/export metadata

**Files:** Modify `scripts/lib/payroll-mock-api-handler.mjs`, `src/team/payroll/payroll-api.ts`, `payroll-types.ts`, `legacy/payroll.js.txt`, `payroll-legacy-runtime.ts`; create `payroll-schedule-repository.ts`; test `scripts/verify-payroll-schedule-publish.ts`.

**Interfaces:** Produce `publishSchedule(input: { expectedRevision: number; nextSnapshot: PayrollSnapshot; actorId: string; compliancePolicyVersion: string }): Promise<{ revision: number; snapshot: PayrollSnapshot }>`; mock API accepts `PUT /api/v1/payroll/state` with `If-Match` revision and returns `409` for stale writes. Schedule publishing requires API success; local fallback may cache reads but must not report publish success when server is unavailable.

- [ ] **Step 1: Write RED API/integration fixtures.** Two clients read revision 4; first publishes revision 5; second receives 409 and local cache remains at revision 4. API failure leaves old state intact. Confirmed employee fields, export batch ID/time/file identifier and planned/actual pay dates survive save/load. Draft export is not silently treated as formal export.
- [ ] **Step 2: Run RED.** `npx.cmd --yes tsx scripts/verify-payroll-schedule-publish.ts`.
- [ ] **Step 3: Implement atomic mock persistence and bridge.** Serialize writes to the one mock DB path with a promise queue, validate expected revision inside that queue, write a temporary JSON file in `.cache`, atomically replace the exact mock DB file, then reply with new revision; never update local storage before API success for schedule publishing. Extend normal legacy state saves to carry revision too, so a background save cannot clobber a published rule. In the legacy runtime, expose `getSnapshot()` and `replaceSnapshot(snapshot)` through a typed bridge; after successful publish, replace the in-memory snapshot and re-render. On employee confirmation, persist a frozen computed result with rule version and actor; when formal ADP export completes, append export batch metadata and lock affected periods.

```ts
if (Number(req.headers["if-match"]) !== Number(db.revision ?? 0)) {
  sendJson(res, 409, { error: "stale_revision", revision: db.revision ?? 0 });
  return true;
}
```

- [ ] **Step 4: Run GREEN and existing API/domain checks.** New verifier, `scripts/verify-team-payroll-domain.ts`, `scripts/verify-payroll-batch-export.ts`, `npx.cmd tsc --noEmit`. Verify legacy normal saves still work but cannot overwrite a newer published schedule revision.
- [ ] **Step 5: Commit.** `git commit -m "feat: publish payroll schedule changes with revision checks"`.

### Task 6: Native settings and transition preview UI

**Files:** Create `src/team/payroll/payroll-schedule-controller.ts`; modify `payroll-template.html`, `payroll-page.css`, `payroll-page.ts`, `payroll-legacy-runtime.ts`, `payroll-i18n.ts`; test `scripts/verify-payroll-schedule-ui.mjs`.

**Interfaces:** `mountPayrollScheduleController(shadowRoot, bridge, repository, context): { destroy(): void }`. Bridge provides Task 5 snapshot/replace methods plus `getSelectedStoreId()` from the current in-page store picker; a global all-stores scope alone is not a selected editing store. Controller consumes Tasks 3–5 preview/compliance/publish results, not raw dates guessed from labels.

- [ ] **Step 1: Write RED UI contract assertions.** Verify a visible “发薪周期设置” entry for a selected store, accessible controls for frequency/anchor/offset/effective date, a preview table with old/new six periods, affected adjustment list, rule history, disabled publish on blockers, and explicit confirmation. Verify `destroy()` removes listeners. Run `node scripts/verify-payroll-schedule-ui.mjs` and expect missing UI.
- [ ] **Step 2: Implement the minimum native UI.** Put settings in the current payroll Shadow DOM, retain host sidebar/topbar, and use the existing modal/fullscreen patterns. Show the `legacy-biweekly` current rule. Recompute preview on field changes; display exact date ranges, planned pay dates, short-period badge, affected employee count, unresolved adjustment rows and policy reason. Accept explicit per-field target-period assignment. Enable publish only with no blockers and a selected in-page store. All-stores scope without an in-page selected store is read-only for rule editing. A UI-only edit role is not a security boundary; the mock API remains demo-only until an authenticated backend authorizes publish.

```ts
const preview = previewScheduleChange(bridge.getSnapshot(), bridge.getSelectedStoreId(), draftRule, throughDate);
publishButton.disabled = !preview.ok || preview.unassignedAdjustments.length > 0 || !compliance.allowed;
```

- [ ] **Step 3: Handle publish lifecycle.** Require a second confirmation showing before/after rule and affected periods; invoke `repository.publishSchedule` once; on 409 reload and require a fresh preview; on failure keep the form and old state; on success update legacy bridge, selection and audit history. Prevent double submit; restore focus after close.
- [ ] **Step 4: Run GREEN plus browser E2E.** Verify 5174 route `#/team/payroll-report`: select store, open settings, preview 2027-07-01 double→semimonth, see short old period, cancel unchanged; publish in a safe draft fixture, reload, verify rule history and period picker; try confirmed fixture and see blocking reason. Run UI verifier, `npx.cmd tsc --noEmit`, and `npm.cmd run build`. Build may modify unrelated `dist/`; preserve those files rather than staging them blindly.
- [ ] **Step 5: Commit only source/test files.** `git commit -m "feat: manage versioned payroll schedules in native workspace"`.

### Task 7: Historical hours-only simulation

**Files:** Create `src/team/payroll/payroll-schedule-simulation.ts`; modify `payroll-schedule-controller.ts`, `payroll-template.html`, `payroll-page.css`; test `scripts/verify-payroll-schedule-simulation.ts` and UI verifier.

**Interfaces:** `simulateAttendance(input: { employees: PayrollEmployee[]; rule: PayrollScheduleRule; from: IsoDate; through: IsoDate }): SimulatedAttendancePeriod[]`. Output contains store, employee, start/end, workday count, Regular/OT/OT2/paid-break/total hours, and missing dates; no wages or adjustment fields.

- [ ] **Step 1: Write RED fixtures.** Last year's weekly attendance viewed as biweekly yields two weeks' combined hours but unchanged underlying confirmed snapshot; overtime totals equal the sum of original workweek results, not a 14-day threshold; missing raw dates show incomplete status. Assert output contains no salary, pay date, tax or adjustment property.
- [ ] **Step 2: Run RED.** `npx.cmd --yes tsx scripts/verify-payroll-schedule-simulation.ts`.
- [ ] **Step 3: Implement simulation and analysis UI.** Reuse `generatePeriods`; group dated raw segments by inclusive period range; sum existing per-day/per-workweek classified hour buckets without recalculating overtime. Track source coverage separately from worked days (`attendanceCoverage: { from: IsoDate; through: IsoDate; complete: boolean }[]`); an empty segment list is not evidence of missing attendance, while absent/unknown coverage on migrated data marks the simulation incomplete. Never derive missing raw hours from a confirmed wage snapshot. Add a separate “周期模拟汇总” tab, persistent “模拟考勤汇总，不替代工资单” marker, and frequency/anchor/range controls. No formal PDF/ADP button in this tab. If analytical CSV is offered, include `simulation=true`, frequency and anchor in each row.

```ts
const target = periods.find((period) => segment.date >= period.startDate && segment.date <= period.endDate);
if (target) addClassifiedHours(target, segment);
```

- [ ] **Step 4: Run GREEN and browser E2E.** New verifier, UI verifier, existing domain/batch verifiers, typecheck, then open actual-history and simulation tabs in browser; verify changing simulation frequency leaves actual amounts, period IDs and formal export state unchanged.
- [ ] **Step 5: Commit.** `git commit -m "feat: simulate historical attendance by alternate payroll period"`.

### Task 8: Cross-feature regression, migration rehearsal, and release gate

**Files:** Test-only updates under `scripts/verify-payroll-schedule-*.ts` and existing payroll verifiers; documentation update to the approved spec only if execution reveals an agreed behavioral correction.

**Interfaces:** No new production API. This task validates Tasks 1–7 together and records the exact supported demonstration boundary.

- [ ] **Step 1: Add a deterministic migration rehearsal fixture.** Clone a v4 snapshot with the existing 2025/2026 26-period data, two stores sharing a period ID, a confirmed employee, an exported period and a draft with Tips. Assert migration does not alter historical JSON fields; change only one store and verify the other store's employees and old period remain byte-for-byte equivalent in the relevant fields.
- [ ] **Step 2: Run all focused verifiers.** Run `npx.cmd --yes tsx` separately for `scripts/verify-payroll-schedule-engine.ts`, `scripts/verify-payroll-schedule-migration.ts`, `scripts/verify-payroll-schedule-change.ts`, `scripts/verify-payroll-schedule-compliance.ts`, `scripts/verify-payroll-schedule-publish.ts`, and `scripts/verify-payroll-schedule-simulation.ts`; then `node scripts/verify-payroll-schedule-ui.mjs`, `npm.cmd run verify:payroll-batch-export`, and `npx.cmd tsc --noEmit`. Record failures and correct the owning task's code, not the fixture expectation.
- [ ] **Step 3: Run build and browser journeys.** `npm.cmd run build`; visit `#/team/payroll-report` on the served build. Exercise all four frequencies, year crossing, 27th period, a midweek change, a partial-confirmation block, API conflict, failed publish rollback, history default, simulation and ADP export isolation. Confirm sidebar/topbar, scrolling and modal focus remain usable.
- [ ] **Step 4: Inspect the diff.** `git diff --check`, `git status --short`, and `git diff --name-only` restricted to task files; do not stage unrelated current worktree artifacts. Confirm no `vendor/emenu-new` source changed; if it did, follow `AGENTS.md` embed build/publish checks before reporting completion.
- [ ] **Step 5: Commit only final test/documentation corrections.** `git commit -m "test: cover flexible payroll schedule migration and transitions"`. Do not merge or push without a separate user request.
