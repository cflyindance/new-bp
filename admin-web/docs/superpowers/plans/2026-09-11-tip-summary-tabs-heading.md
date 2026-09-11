# Tip Summary Heading Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visible “小费分配” heading with the existing “分配汇总 / 员工对账” tablist while preserving every view and filter behavior.

**Architecture:** Move the single existing `summaryViewSwitch` node from the collapsible filter bar into the heading’s left slot. Retain a screen-reader-only `#summaryTitle`, then scope small responsive CSS changes to the summary heading so desktop and mobile layouts remain stable.

**Tech Stack:** Native HTML templates, CSS, legacy JavaScript event bindings, Node static verification, Vite build.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-summary-tabs-heading-design.md`

## Global Constraints

- Modify only the native `src/team/tips` implementation and its verification scripts.
- Keep exactly one `#summaryViewSwitch`, `#dateTaskTab`, and `#employeeReconciliationTab`.
- Preserve every tab ID, ARIA attribute, keyboard handler, and `setSummaryView` binding.
- The filter collapse must not hide the tablist.
- Keep “新建/查看规则” behavior and heading action position unchanged.

---

### Task 1: Move the tablist into the heading

**Files:**
- Modify: `src/team/tips/templates/distribution.html`
- Modify: `src/team/tips/tips-page.css`
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: existing `setSummaryView(view)` and `handleSummaryViewKeydown(event)` handlers.
- Produces: one always-visible heading tablist and one screen-reader-only `#summaryTitle` referenced by the page section.

- [ ] **Step 1: Add failing structure assertions**

```js
assert.equal((template.match(/id="summaryViewSwitch"/g) || []).length, 1);
assert.equal((template.match(/id="dateTaskTab"/g) || []).length, 1);
assert.equal((template.match(/id="employeeReconciliationTab"/g) || []).length, 1);
assert.ok(template.indexOf('id="summaryViewSwitch"') < template.indexOf('class="filter-surface'));
assert.match(template, /<h1 id="summaryTitle" class="sr-only">小费分配<\/h1>/);
```

- [ ] **Step 2: Run verification and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the tablist is still inside the filter bar and the title is visible.

- [ ] **Step 3: Move the existing tablist**

In `distribution.html`, replace the visible title wrapper with the hidden semantic title followed by the unchanged `summaryViewSwitch`. Remove the old tablist from `indexFilterCollapsible`; do not copy it.

```html
<div class="tipout-heading-tabs">
  <h1 id="summaryTitle" class="sr-only">小费分配</h1>
  <div class="tipout-view-switch" id="summaryViewSwitch" role="tablist" aria-label="汇总视图">…</div>
</div>
```

- [ ] **Step 4: Adjust scoped responsive CSS**

Add `.tipout-heading-tabs` alignment rules. On desktop keep intrinsic tab width; inside the existing mobile breakpoint set the wrapper and tablist to `width: 100%` and retain equal tab flex sizing. Remove filter-order/margin assumptions that only applied when the tablist lived inside `.filter-bar--index`.

Because moving the tablist changes the child positions inside `.filter-bar--index`, update any `:nth-child(...)` selectors so the date, store, role, employee, and date-sort fields retain their current widths and responsive behavior.

- [ ] **Step 5: Run focused verification**

Run:

```bash
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-date-pool-view.mjs
node scripts/verify-tipout-clock-rule-auto-allocation.mjs
```

Expected: all commands PASS.

- [ ] **Step 6: Commit the layout change**

```bash
git add src/team/tips/templates/distribution.html src/team/tips/tips-page.css scripts/verify-team-tips-native-views.mjs
git commit -m "feat: move tip summary tabs into heading"
```

### Task 2: Build and visual acceptance

**Files:**
- Modify only Task 1 files if verification reveals a defect.

**Interfaces:**
- Consumes: completed heading layout.
- Produces: verified desktop/mobile native page.

- [ ] **Step 1: Run production build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite exit 0; restore unrelated generated artifacts afterward.

- [ ] **Step 2: Verify in the browser**

Confirm the visible “小费分配” title is absent; the tabs occupy its former position; the rule button remains right-aligned; collapsing filters does not hide tabs; both click and keyboard switching work; and narrow layout shows two equal-width tabs.

- [ ] **Step 3: Inspect final scope**

```bash
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Expected: only the approved spec/plan, template, scoped CSS, and test files are included.
