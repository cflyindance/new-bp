# TipOut Allocation Hours Rule Type Implementation Plan

> **For agentic workers:** Execute these tasks inline in order. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show rule name and pool-kind rule type in both allocation-hours detail dialogs without mislabeling old records.

**Architecture:** Add `poolKind` to daily allocation-hour entries, preserve it in the shared normalizer and cross-date aggregator, then render it in the two existing dialogs. The browser-facing label comes from a shared formatter, not a lookup of the current rule. Unknown historical entries remain a distinct group and display `—`.

**Tech Stack:** Vite, TypeScript shell, legacy JavaScript modules, Node VM contract test, Playwright browser regression.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-allocation-hours-rule-type-design.md`

## Global Constraints

- Dialog columns: 小费池、规则名称、规则类型、工时来源、分配工时.
- `surcharge` means 加收服务费池; `tip` means 小费池; absent type means —.
- Unspecified kind on a newly generated legacy rule is `tip`; an old hour entry without type stays unknown.
- Do not alter hour values, allocation money, rule editing, or current modal open/close behavior.

---

### Task 1: Preserve rule type in allocation-hour records

**Files:**
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/legacy/tipout-summary-ui.js.txt`
- Modify: `scripts/verify-tipout-employee-hours-contract.mjs`

**Interfaces:**
- Consumes: `rule.poolKind` while building `row.allocationHourEntries`.
- Produces: normalized/aggregated `entry.poolKind` with values `tip`, `surcharge`, or empty string, plus `TipOutSummaryUi.allocationHourPoolKindLabel(kind)`.

- [x] **Step 1: Add failing contract assertions** for normalization, `tip`/`surcharge`/unknown grouping, and label mapping:

  ```js
  assert.equal(ui.allocationHourPoolKindLabel('tip'), '小费池');
  assert.equal(ui.allocationHourPoolKindLabel('surcharge'), '加收服务费池');
  assert.equal(ui.allocationHourPoolKindLabel(''), '—');
  const kinds = ui.aggregateAllocationHourEntries([{ dateKey: '2026-09-15', allocationHourEntries: [
    { poolId: 'P1', ruleId: 'R1', poolKind: 'tip', hours: 2, hoursValid: true },
    { poolId: 'P1', ruleId: 'R1', hours: 3, hoursValid: true }
  ] }]);
  assert.equal(kinds.length, 2);
  ```
- [x] **Step 2: Run the contract test and confirm failure**, then implement kind capture, normalization, aggregation key separation, and shared label formatter. Keep the prior base `entry.key` contract for entries without kind.
- [x] **Step 3: Run `node scripts/verify-tipout-employee-hours-contract.mjs` and confirm pass.**

### Task 2: Show rule type in both dialogs

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/templates/employee-reconciliation.html`
- Modify: `src/team/tips/programs/distribution.js.txt`
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `scripts/verify-tipout-quick-allocation-browser.cjs`

**Interfaces:**
- Consumes: `TipOutSummaryUi.allocationHourPoolKindLabel(entry.poolKind)` from Task 1.
- Produces: five-column dialogs with unchanged trigger and close behavior.

- [x] **Step 1: Add failing browser assertions** that both templates have five headers and that visible rows map rule name and type into columns 2 and 3:

  ```js
  assert.deepEqual(await page.locator('#allocationHoursDetailModal thead th').allTextContents(), ['小费池','规则名称','规则类型','工时来源','分配工时']);
  assert.equal(await page.locator('#allocationHoursDetailRows tr').first().locator('td').count(), 5);
  ```
- [x] **Step 2: Run the browser regression and confirm the header assertion fails.**
- [x] **Step 3: Add the new table header/cell to both dialogs.** For summary HTML, escape the shared label; for employee detail DOM, use `textContent`. Keep hours at the last cell.
- [x] **Step 4: Run browser regression, native-view verification, the hours contract, and `tsc --noEmit`; inspect row structure at desktop width.**
- [ ] **Step 5: Commit only these task files and this plan on local `main`.**
