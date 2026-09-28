# TipOut Date Summary Total Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make only the four date-range summary amount labels explicitly identify totals.

**Architecture:** Change the initial HTML labels and the dynamic summary render assignments together. A browser regression verifies rendered labels after mounting, including the unchanged daily-table headers.

**Tech Stack:** HTML template, legacy JavaScript runtime, Node.js/Playwright browser verification.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-date-summary-total-labels-design.md`

## Global Constraints

- Top labels are exactly `原始总小费`, `入池总金额`, `已分配总额`, `未分配总额` in that order.
- Daily-table headers and all calculation/filter/state behavior remain unchanged.
- Preserve unrelated dirty files in the existing main worktree.

## File Structure

- `src/team/tips/templates/distribution.html`: initial top labels, daily-table headers unchanged.
- `src/team/tips/programs/distribution.js.txt`: runtime re-render of the top labels.
- `scripts/verify-tipout-quick-allocation-browser.cjs`: browser regression for both top and daily-table text.

### Task 1: Update date-range summary labels

**Files:**
- Modify: `src/team/tips/templates/distribution.html:228-231`
- Modify: `src/team/tips/programs/distribution.js.txt:792-795`
- Test: `scripts/verify-tipout-quick-allocation-browser.cjs:31`

**Interfaces:**
- Consumes: existing DOM IDs `summaryBeforeLabel`, `summaryDeductedLabel`, `summaryReceivedLabel`, `summaryAfterLabel`.
- Produces: unchanged DOM IDs with new visible text; no JavaScript API changes.

- [x] **Step 1: Write the failing browser test**

Insert after the initial `page.evaluate` mount in `scripts/verify-tipout-quick-allocation-browser.cjs`:

```js
const totalLabels = ['原始总小费','入池总金额','已分配总额','未分配总额'];
assert.deepEqual(await page.locator('#dateSummaryMetrics span[id$="Label"]').allTextContents(), totalLabels);
assert.deepEqual((await page.locator('#dateTaskPanel thead th').allTextContents()).slice(4,8), ['原始小费','入池金额','已分配','未分配']);
```

- [x] **Step 2: Run the test and confirm the intended failure**

Run `scripts/verify-tipout-quick-allocation-browser.cjs` with `TIPOUT_BROWSER_PACKAGES` pointing to the bundled Playwright runtime. Expected: top labels still use old names.

- [x] **Step 3: Change the four labels at both render sites**

Replace the four old strings in the initial template and in `renderSummaryOverview` with `原始总小费`, `入池总金额`, `已分配总额`, `未分配总额` respectively. Leave the daily `<thead>` unchanged.

- [x] **Step 4: Run verification**

Run the browser test, `node scripts/verify-team-tips-native-views.mjs`, `tsc --noEmit`, and `git diff --check`. Expected: all pass.

- [ ] **Step 5: Commit scoped changes**

Stage only the three files in this task and this plan; commit as `fix(tipout): clarify date summary totals`.
