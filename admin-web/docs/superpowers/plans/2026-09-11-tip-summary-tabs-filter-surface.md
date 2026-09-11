# Tip Summary Tabs Filter Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place the date/employee summary Tabs and the active view filters inside one shared white toolbar while preserving all behavior and accessibility contracts.

**Architecture:** Move the existing Tab wrapper into the existing filter-surface container before the mobile filter toggle and collapsible filter body. Adjust only scoped summary-page CSS for desktop, intermediate, and mobile layout; keep all IDs, handlers, panels, and JavaScript state unchanged.

**Tech Stack:** HTML templates, CSS media queries, Node.js source-contract verification, Vite.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-summary-tabs-filter-surface-design.md`

## Global Constraints

- DOM order inside the white surface is `tipout-heading-tabs`, `filter-surface-toggle`, `indexFilterCollapsible`.
- Tabs must never be inside `indexFilterCollapsible`; collapsed mobile filters must not hide the Tabs.
- At 1280px and above, Tabs and filters share one row with filters right-aligned.
- From 769px through 1279px, filters may wrap to a full-width second row and align from the right.
- At 768px and below, equal-width Tabs occupy the first row; the filter toggle and collapsible content follow.
- Preserve store row, all IDs, handlers, routing, view/filter state, keyboard behavior, data, export, allocation, and fixed action bar.
- Do not stage unrelated dirty build artifacts.

---

### Task 1: Lock the shared-surface DOM and responsive contracts

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs:118-160`

**Interfaces:**
- Consumes: `distributionTemplate` and `pageCss` source strings already loaded by the verifier.
- Produces: failing structural and responsive assertions that accept only the approved DOM order and breakpoint behavior.

- [ ] **Step 1: Add exact DOM containment and ordering assertions**

```js
const filterSurfaceStart = distributionTemplate.indexOf('class="filter-surface tipout-compact-toolbar tipout-view-filter-group"');
const filterSurfaceEnd = distributionTemplate.indexOf('<div class="tipout-metric-strip', filterSurfaceStart);
const sharedFilterSurface = distributionTemplate.slice(filterSurfaceStart, filterSurfaceEnd);
const tabsIndex = sharedFilterSurface.indexOf('class="tipout-heading-tabs"');
const toggleIndex = sharedFilterSurface.indexOf('class="filter-surface-toggle"');
const collapsibleIndex = sharedFilterSurface.indexOf('id="indexFilterCollapsible"');
if (!(tabsIndex >= 0 && toggleIndex > tabsIndex && collapsibleIndex > toggleIndex)) {
  failures.push("distribution: shared filter surface order must be tabs, toggle, collapsible");
}
const collapsibleContent = sharedFilterSurface.slice(collapsibleIndex);
if (collapsibleContent.includes('id="summaryViewSwitch"')) {
  failures.push("distribution: summary Tabs must remain outside collapsible filters");
}
```

- [ ] **Step 2: Add CSS contract assertions for each breakpoint**

```js
for (const token of [
  ".tipout-page-summary .tipout-view-filter-group > .tipout-heading-tabs",
  "@media (min-width: 1280px)",
  "@media (min-width: 769px) and (max-width: 1279px)",
  "@media (max-width: 768px)",
]) {
  if (!pageCss.includes(token)) failures.push(`distribution: shared filter surface CSS missing ${token}`);
}
```

- [ ] **Step 3: Retain and extend accessibility assertions**

```js
for (const token of [
  'id="summaryViewSwitch" role="tablist"',
  'id="dateTaskTab" role="tab"',
  'id="employeeReconciliationTab" role="tab"',
  'aria-controls="dateTaskPanel"',
  'aria-controls="employeeReconciliationPanel"',
  'data-native-onkeydown="handleSummaryViewKeydown(event)"',
]) {
  if (!sharedFilterSurface.includes(token)) failures.push(`distribution: Tab accessibility contract changed ${token}`);
}
for (const token of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
  if (!distributionProgram.includes(token)) failures.push(`distribution: Tab keyboard behavior missing ${token}`);
}
```

- [ ] **Step 4: Run the verifier and confirm the new containment assertion fails**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL with `shared filter surface order must be tabs, toggle, collapsible`.

### Task 2: Move the Tabs into the white filter surface

**Files:**
- Modify: `src/team/tips/templates/distribution.html:137-153`

**Interfaces:**
- Consumes: existing `summaryViewSwitch`, filter toggle, and `indexFilterCollapsible` markup unchanged.
- Produces: a single white toolbar whose child order is Tabs, toggle, collapsible filters.

- [ ] **Step 1: Move the existing Tab wrapper without changing its contents**

```html
<div class="tipout-view-filter-row">
  <div class="filter-surface tipout-compact-toolbar tipout-view-filter-group">
    <div class="tipout-heading-tabs">
      <div class="tipout-view-switch" id="summaryViewSwitch" role="tablist" aria-label="汇总视图">
        <button type="button" id="dateTaskTab" role="tab" aria-selected="true" aria-controls="dateTaskPanel" tabindex="0" data-native-onclick="setSummaryView('date')" data-native-onkeydown="handleSummaryViewKeydown(event)">日期分配汇总</button>
        <button type="button" id="employeeReconciliationTab" role="tab" aria-selected="false" aria-controls="employeeReconciliationPanel" tabindex="-1" data-native-onclick="setSummaryView('employee')" data-native-onkeydown="handleSummaryViewKeydown(event)">员工分配汇总</button>
      </div>
    </div>
    <button type="button" class="filter-surface-toggle" ...>...</button>
    <div id="indexFilterCollapsible" class="filter-surface-collapsible">...</div>
  </div>
</div>
```

- [ ] **Step 2: Run the verifier**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: DOM and accessibility assertions PASS; CSS assertion may still FAIL until Task 3.

### Task 3: Implement desktop, intermediate, and mobile alignment

**Files:**
- Modify: `src/team/tips/tips-page.css:2427-2525`
- Modify: `src/team/tips/tips-page.css:2575-2625`
- Modify: `src/team/tips/tips-page.css:2996-3001`

**Interfaces:**
- Consumes: the Task 2 child order and existing `filter-bar--index` sizing.
- Produces: one-row wide layout, two-row intermediate layout, and mobile Tabs-first layout.

- [ ] **Step 1: Make the shared surface own the complete row**

```css
.tipout-page-summary .tipout-view-filter-group {
  display: flex;
  flex: 1 1 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.tipout-page-summary .tipout-view-filter-group > .tipout-heading-tabs {
  flex: 0 0 auto;
}

.tipout-page-summary .tipout-view-filter-group > .filter-surface-collapsible {
  flex: 1 1 auto;
  min-width: 0;
}
```

- [ ] **Step 2: Define the 1280px and intermediate layouts**

```css
@media (min-width: 1280px) {
  .tipout-page-summary .tipout-view-filter-group { flex-wrap: nowrap; }
}

@media (min-width: 769px) and (max-width: 1279px) {
  .tipout-page-summary .tipout-view-filter-group { flex-wrap: wrap; }
  .tipout-page-summary .tipout-view-filter-group > .filter-surface-collapsible {
    flex: 1 1 100%;
    width: 100%;
  }
  .tipout-page-summary .filter-bar--index { justify-content: flex-end; }
}
```

- [ ] **Step 3: Keep Tabs visible and first on mobile**

```css
@media (max-width: 768px) {
  .tipout-page-summary .tipout-view-filter-group {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }
  .tipout-page-summary .tipout-view-filter-group > .tipout-heading-tabs {
    order: 0;
    width: 100%;
  }
  .tipout-page-summary .tipout-view-filter-group > .filter-surface-toggle { order: 1; }
  .tipout-page-summary .tipout-view-filter-group > .filter-surface-collapsible { order: 2; }
}
```

- [ ] **Step 4: Run verification and production build**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: exit code 0; existing bundle-size warnings are acceptable.

- [ ] **Step 5: Browser-check four boundary widths and both views**

At 1280px verify one shared row; at 1279px and 769px verify a Tabs-first wrapped toolbar; at 768px verify equal-width Tabs remain visible when filters are collapsed. In both views verify date filters and existing visibility rules, click Tabs with pointer and Arrow keys/Home/End, and confirm URL, panels, totals, export, and bottom actions are unchanged.

- [ ] **Step 6: Commit only the focused files**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/distribution.html src/team/tips/tips-page.css
git commit -m "feat: merge tip summary Tabs into filter toolbar"
```

## Self-Review

- Spec coverage: Tasks cover exact DOM order, white-surface containment, all four responsive boundaries, persistent mobile Tabs, view-specific filters, accessibility, unchanged behavior, build, and browser verification.
- Placeholder scan: every implementation and verification action has exact source or commands; no deferred work remains.
- Type consistency: no JavaScript interface, ID, handler, state, route, or data structure changes are introduced.
