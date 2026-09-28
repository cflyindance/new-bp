# TipOut Manual Allocation Hours and Percent Implementation Plan

> Execution: completed inline on 2026-09-28. The task checkboxes below retain the original implementation sequence.

**Goal:** Allow clocked-in and absent employees to edit adopted hours and final percentages in hours-based TipOut detail rules, with accurate saved snapshots and downstream hours.

**Architecture:** A pure allocation helper validates two-decimal inputs and apportions basis points/cents. The detail page uses it for both legacy-pool and order-tip cards, preserving explicit overrides through attendance refresh and snapshot save/restore. Employee summaries use confirmed snapshot hours instead of recomputing them from current attendance.

**Tech Stack:** Legacy JavaScript text modules assembled by `tips-legacy-runtime.ts`, Node.js tests, Playwright browser tests, TypeScript/Vite.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-manual-allocation-hours-percent-design.md`

## Global Constraints

- Non-hours distribution modes and POS original punch records must not change.
- Manual hours override the rule cap for that confirmation; attendance badges still show real clock status.
- Ratio edit is exact, not silently normalized: total below 100% leaves an undistributed remainder; total above 100% rejects confirmation.
- Paid dates remain read-only; only confirmed snapshots feed cross-page totals.
- Preserve unrelated dirty files in the existing main worktree.

## File Structure

- `src/team/tips/legacy/tipout-detail-manual-allocation.js.txt`: pure decimal parsing and largest-remainder basis-point/cent calculations.
- `src/team/tips/tips-legacy-runtime.ts`: load helper on the details view.
- `src/team/tips/programs/details.js.txt`: editable row UI, event routing, override protection, recalculation, snapshot validation/collection.
- `src/team/tips/legacy/tipout-detail-snapshot.js.txt`: restore manual source, edited row values, and full role allocation amount when employee percentages total below 100%.
- `src/team/tips/programs/distribution.js.txt`: read confirmed employee hours/source from matching saved pool/rule/employee.
- `scripts/verify-tipout-detail-manual-allocation.mjs`: pure helper contract tests.
- `scripts/verify-tipout-quick-allocation-browser.cjs`: browser interaction and snapshot regressions.
- `scripts/verify-tipout-manual-detail-browser.cjs`: order-tip cap override, exact percentage, re-confirmation, employee summary and daily-detail regression.

### Task 1: Pure hours, ratio and amount calculations

**Files:** Create `src/team/tips/legacy/tipout-detail-manual-allocation.js.txt`; modify `src/team/tips/tips-legacy-runtime.ts`; create `scripts/verify-tipout-detail-manual-allocation.mjs`.

**Interfaces:** `window.TipOutDetailManualAllocation` exposes `parseHours(value)`, `parsePct(value)`, `ratiosFromHours(hoursArray)` and `amountsFromPcts(roleCents, pctBasisPointsArray)`. Parsers throw on invalid input. `ratiosFromHours` returns integer basis points summing to 10000 for positive hours, otherwise zeros. `amountsFromPcts` returns `{ cents: number[], undistributedCents: number }`.

- [ ] **Step 1: Write failing helper tests**

```js
assert.deepEqual(api.ratiosFromHours([1,1,1]).reduce((a,b)=>a+b,0),10000);
assert.deepEqual(api.amountsFromPcts(3,[2400,2400,2400,2400]).cents.reduce((a,b)=>a+b,0),3);
assert.throws(()=>api.parseHours('-1'),/工时/);
assert.throws(()=>api.parseHours('1.234'),/工时/);
assert.throws(()=>api.parsePct('100.01'),/比例/);
```

- [ ] **Step 2: Run red** — `node scripts/verify-tipout-detail-manual-allocation.mjs` fails because the helper does not exist.
- [ ] **Step 3: Implement helper** — use integer basis points and cents; floor each exact share and distribute the remaining integer units by descending fractional remainder, tie by original row index. Reject invalid finite/nonnegative/two-decimal hours or percentages and ratio sums above 10000.
- [ ] **Step 4: Run green** — `node scripts/verify-tipout-detail-manual-allocation.mjs` passes.
- [ ] **Step 5: Commit** — commit only Task 1 files as `feat(tipout): add manual allocation arithmetic`.

### Task 2: Editable detail rows and confirmed snapshots

**Files:** Modify `src/team/tips/programs/details.js.txt`, `src/team/tips/legacy/tipout-detail-snapshot.js.txt`, `scripts/verify-tipout-quick-allocation-browser.cjs`.

**Interfaces:** Consumes Task 1 helper. Employee snapshot rows gain optional `hoursSource: 'manual' | 'pos'` without changing existing required fields. A row's `data-hours-manual="1"` protects explicitly edited hours; a manual percentage remains the field value until a later hours edit.

- [ ] **Step 1: Write failing browser assertions**

```js
assert.equal(await page.locator('.detail-emp-hours-input').first().isEditable(),true);
await page.locator('tr[data-attendance-status="absent"] .detail-emp-hours-input').first().fill('8');
await page.locator('tr[data-attendance-status="absent"] .detail-emp-hours-input').first().dispatchEvent('change');
assert.equal(await page.locator('tr[data-attendance-status="absent"] .detail-emp-hours-input').first().inputValue(),'8');
```

- [ ] **Step 2: Run red** — Playwright rejects the readonly hours field or finds that the value is reset.
- [ ] **Step 3: Implement editable rows** — remove clock-rule `readonly`, show hours in hours-based order-tip cards, use editable `.detail-emp-pct-input` in both card modes, route hours changes through `ratiosFromHours`, route percentage changes through `amountsFromPcts`, and preserve row overrides during attendance checks and snapshot collection. In employee selection changes, clear the previous employee's override and load the newly selected employee's default.
- [ ] **Step 4: Validate before commit** — parse each hours/percentage input; reject invalid values and per-role percent sums above 100%; restore saved hours, percentage, amount, `hoursSource` and manual markers from confirmed snapshots. Keep paid lock intact.
- [ ] **Step 5: Run green** — run Playwright test, `node scripts/verify-tipout-attendance-label.mjs`, `node scripts/verify-tipout-day-payout.mjs`.
- [ ] **Step 6: Commit** — commit only Task 2 files as `feat(tipout): edit hours and percentages in detail`.

### Task 3: Confirmed hours in employee summaries

**Files:** Modify `src/team/tips/programs/distribution.js.txt`, `scripts/verify-tipout-quick-allocation-browser.cjs`.

**Interfaces:** Matching key is saved `poolId + ruleId + employeeId` for each employee row. Snapshot `hours` and optional `hoursSource` override live calculation only after allocation is confirmed; old snapshots without source keep current compatibility labeling.

- [ ] **Step 1: Write failing browser assertions**

```js
assert.equal(savedEmployee.hours,8);
assert.equal(savedEmployee.hoursSource,'manual');
assert.equal(confirmedHoursEntry.hours,8);
assert.equal(confirmedHoursEntry.source,'manual');
```

- [ ] **Step 2: Run red** — saved manual value does not yet appear in the confirmed employee summary.
- [ ] **Step 3: Implement snapshot hour adapter** — for an allocated date, locate employee in the saved rule/pool snapshot and replace the matching allocation-hours entry's adopted `hours` and `source` with the confirmed values; never replace original punch hours or use unconfirmed draft values.
- [ ] **Step 4: Run green and regression** — run browser tests, native view verification, `tsc --noEmit`, `git diff --check`.
- [ ] **Step 5: Commit** — commit only Task 3 files and this plan as `feat(tipout): sync confirmed manual hours to employee views`.
