# Tip Management Store-First Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the native tip-management header into a store-first row and a second row with left-aligned view tabs plus right-aligned view-specific filters, without changing business behavior.

**Architecture:** Reuse and move the existing store select, rule button, tablist, and filter elements inside `distribution.html`; do not duplicate controls or handlers. Add page-scoped CSS layout containers and deterministic responsive rules, while the existing `syncSummaryViewUi()` remains the sole view-visibility controller.

**Tech Stack:** Native HTML template, page-scoped CSS, legacy JavaScript view controller, Node assertion scripts, Vite browser preview.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-management-store-first-toolbar-design.md`

## Global Constraints

- Modify only the native `src/team/tips` implementation and focused verification scripts.
- Do not use or update the retired `TipOut` project.
- Reuse existing controls and `data-native-*` handlers; do not duplicate IDs or event bindings.
- Do not change tip, hours, attendance, employee aggregation, allocation status, export, allocation, cancellation, or rule-entry calculations.
- Wide viewport is `>=1280px`, medium is `769px–1279px`, and mobile is `<=768px`.
- Employee reconciliation shows only store and date context; role, employee, and date-sort controls remain hidden without clearing their values.

---

### Task 1: Establish the two-row DOM contract

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `src/team/tips/templates/distribution.html`

**Interfaces:**
- Consumes: existing `#storeSelect`, `#summaryRuleEntryBtn`, `#summaryViewSwitch`, `#dateRangeFilterField`, `#roleFilterField`, `#employeeFilterField`, and `#dateSortField`.
- Produces: `.tipout-store-scope-row`, `.tipout-view-filter-row`, and `.tipout-view-filter-group` containing each existing control exactly once.

- [ ] **Step 1: Add failing structural assertions**

Add assertions that extract the two toolbar rows and verify ownership and order:

```js
const storeScopeRow = distributionTemplate.match(/<div class="tipout-store-scope-row">[\s\S]*?<\/div>\s*<div class="tipout-view-filter-row">/)?.[0] || "";
for (const token of ['id="storeFilterField"', 'id="summaryRuleEntryBtn"']) {
  if (!storeScopeRow.includes(token)) failures.push(`distribution: store scope row missing ${token}`);
}
const viewFilterRow = distributionTemplate.match(/<div class="tipout-view-filter-row">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)?.[0] || "";
for (const token of ['id="summaryViewSwitch"', 'id="dateRangeFilterField"', 'id="roleFilterField"', 'id="employeeFilterField"', 'id="dateSortField"']) {
  if (!viewFilterRow.includes(token)) failures.push(`distribution: view/filter row missing ${token}`);
}
```

Also assert that each existing ID appears exactly once and that the store row occurs before the view/filter row, which occurs before `.tipout-metric-strip`.

- [ ] **Step 2: Run the focused verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the two named row containers do not exist.

- [ ] **Step 3: Move existing controls into the two rows**

Use this structure without recreating any controls:

```html
<div class="tipout-store-scope-row">
  <div class="filter-field tipout-store-filter-field" id="storeFilterField">...</div>
  <div class="tipout-heading-actions">
    <button id="summaryRuleEntryBtn" ...>新建/查看规则</button>
  </div>
</div>
<div class="tipout-view-filter-row">
  <div class="tipout-heading-tabs">...</div>
  <div class="filter-surface tipout-compact-toolbar">
    ...date, role, employee, date-sort fields only...
  </div>
</div>
```

Keep the screen-reader-only `#summaryTitle` associated with the page section. Preserve every existing ID and `data-native-*` attribute.

- [ ] **Step 4: Run the focused verifier**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS for the structural assertions and all existing behavior assertions.

---

### Task 2: Implement right-aligned responsive layout

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `src/team/tips/tips-page.css`

**Interfaces:**
- Consumes: toolbar containers created in Task 1 and existing `[hidden]` view-state attributes.
- Produces: deterministic desktop, medium, mobile, long-store-name, and hidden-filter presentation.

- [ ] **Step 1: Add failing CSS contract assertions**

Assert that page-scoped CSS includes all layout selectors and breakpoint values:

```js
for (const token of [
  ".tipout-page-summary .tipout-store-scope-row",
  ".tipout-page-summary .tipout-view-filter-row",
  ".tipout-page-summary .tipout-view-filter-group",
  "@media (min-width: 1280px)",
  "@media (min-width: 769px) and (max-width: 1279px)",
  "@media (max-width: 768px)",
  "min-width: 340px",
  "text-overflow: ellipsis",
]) {
  if (!pageCss.includes(token)) failures.push(`distribution: store-first toolbar CSS missing ${token}`);
}
```

Keep the existing assertion requiring `.filter-field[hidden] { display: none; }`.

- [ ] **Step 2: Run the focused verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the new row layout CSS is absent.

- [ ] **Step 3: Add page-scoped layout rules**

Implement the core layout contract:

```css
.tipout-page-summary .tipout-store-scope-row,
.tipout-page-summary .tipout-view-filter-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.tipout-page-summary .tipout-view-filter-group {
  display: flex;
  flex: 1 1 auto;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}
.tipout-page-summary .tipout-store-filter-field {
  flex: 1 1 520px;
  min-width: 0;
}
.tipout-page-summary .tipout-store-filter-field select {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

At `>=1280px`, prevent the second row from wrapping. At `769px–1279px`, allow `.tipout-view-filter-group` to move to a full-width second line with `justify-content:flex-end`, and keep the date range at `min-width:340px`. At `<=768px`, stack the store field, rule action, tabs, and filter group; make the two tabs equal width and each visible filter field full width.

- [ ] **Step 4: Run focused and business-regression checks**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-date-pool-view.mjs
node scripts/verify-tipout-clock-rule-auto-allocation.mjs
```

Expected: all PASS.

---

### Task 3: Browser acceptance and focused commit

**Files:**
- Verify: `src/team/tips/templates/distribution.html`
- Verify: `src/team/tips/tips-page.css`
- Verify: `src/team/tips/programs/distribution.js.txt`
- Verify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: local Vite preview and the native hash routes `/team/tips/distribution` and `/team/tips/distribution?view=employee`.
- Produces: accepted visual behavior with no business-logic changes.

- [ ] **Step 1: Open the native distribution page at 1440px**

Verify the store row is first, the rule button is on its right, and the second row has left tabs plus right filters. Confirm visible filter order is date, role, employee, sort.

- [ ] **Step 2: Verify employee reconciliation**

Select role, employee, and date-sort values in distribution view, switch to employee reconciliation, and verify only date remains in the second-row filter group. Verify hidden fields are absent from the accessibility tree and keyboard sequence. Switch back and confirm the values remain.

- [ ] **Step 3: Verify responsive acceptance**

At 1024px verify the filter group wraps as one unit and stays right-aligned. At 375px verify the order is store, rule button, equal-width tabs, filters. At 200% browser zoom verify no content is lost or covered.

- [ ] **Step 4: Verify navigation and action regression**

Use Tab clicks, browser back/forward, and refresh to verify view and shared context restoration. Trigger only non-destructive entry points to verify the rule page and detail navigation still open once; rely on focused automated checks for allocation, cancellation, and export behavior.

- [ ] **Step 5: Commit only focused files**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: reorganize tip management toolbar"
```

Do not stage unrelated generated assets or other dirty-worktree files.
