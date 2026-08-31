# TipOut Summary Rule Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a “新建/查看规则” button to the TipOut summary page that opens the tip-pool rule editor when no rules exist and opens the rule list when any rule exists.

**Architecture:** Keep the change inside the existing static TipOut summary page. The button calls one page-level function that reads the already loaded `ruleData.getRules()` at click time, catches unavailable or failing data access, and performs a same-window navigation to one of the two existing routes.

**Tech Stack:** Static HTML, browser JavaScript, Node.js assertion verifier, in-app browser QA

**Spec:** `docs/superpowers/specs/2026-08-31-tipout-summary-rule-entry-design.md`

## Global Constraints

- Button copy must be exactly `新建/查看规则`.
- Desktop order must be `新建/查看规则` → `导出结果` → `分配小费`.
- Zero rules or a `ruleData` failure must navigate to `rule-add.html?poolKind=tip`.
- One or more rules must navigate to `rules.html`.
- Use current-window navigation; do not open a modal or a new browser tab.
- Do not change rule storage, rule editor, rule list, export, or allocation business logic.

---

### Task 1: Add the summary rule-entry contract and implementation

**Files:**
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`
- Modify: `dist/TipOut/index.html`

**Interfaces:**
- Consumes: `window.ruleData.getRules(): Array<object>` from the already loaded `dist/TipOut/ruleData.js`.
- Produces: `openSummaryRuleEntry(): void`, bound to `#summaryRuleEntryBtn`.

- [ ] **Step 1: Write the failing verifier assertions**

Add these assertions after `indexHtml` is loaded in `scripts/verify-tipout-interaction-refresh.mjs`:

```js
assert.match(
  indexHtml,
  /id="summaryRuleEntryBtn"[^>]*onclick="openSummaryRuleEntry\(\)"[^>]*>新建\/查看规则<\/button>/,
);
assert.match(
  indexHtml,
  /id="summaryRuleEntryBtn"[\s\S]*?toggleExportMenu\(\)[\s\S]*?id="allocateBtn"/,
);
assert.match(indexHtml, /function openSummaryRuleEntry\(\)/);
assert.match(indexHtml, /ruleData\.getRules\(\)/);
assert.match(indexHtml, /rule-add\.html\?poolKind=tip/);
assert.match(indexHtml, /window\.location\.href = hasRules \? 'rules\.html' : 'rule-add\.html\?poolKind=tip'/);
```

- [ ] **Step 2: Run the verifier and confirm the contract fails**

Run:

```powershell
npm.cmd run verify:tipout-interaction-refresh
```

Expected: FAIL because `summaryRuleEntryBtn` and `openSummaryRuleEntry()` do not exist yet.

- [ ] **Step 3: Add the button in the required visual order**

Insert this as the first child of `.tipout-heading-actions`, immediately before `.export-dropdown` in `dist/TipOut/index.html`:

```html
<button id="summaryRuleEntryBtn" type="button" class="btn btn-lg" onclick="openSummaryRuleEntry()">新建/查看规则</button>
```

- [ ] **Step 4: Add the minimal click handler**

Add this page-level function in the existing inline script before `hasTipRules()`:

```js
function openSummaryRuleEntry() {
  var rules = [];
  try {
    rules = window.ruleData && ruleData.getRules ? ruleData.getRules() : [];
  } catch (e) {
    rules = [];
  }
  var hasRules = Array.isArray(rules) && rules.length > 0;
  window.location.href = hasRules ? 'rules.html' : 'rule-add.html?poolKind=tip';
}
```

- [ ] **Step 5: Run automated regressions**

Run:

```powershell
npm.cmd run verify:tipout-interaction-refresh
npm.cmd run verify:tipout-work-hours-layout
```

Expected: both commands exit with code 0.

- [ ] **Step 6: Commit the independently testable change**

```powershell
git add -- dist/TipOut/index.html scripts/verify-tipout-interaction-refresh.mjs
git commit --only -m "feat: add tipout summary rule entry" -- dist/TipOut/index.html scripts/verify-tipout-interaction-refresh.mjs
```

### Task 2: Verify both routes and responsive placement

**Files:**
- Modify only if QA exposes a defect: `dist/TipOut/index.html`, `dist/TipOut/prototype-fidelity.css`, `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `#summaryRuleEntryBtn`, the existing rule creation flow, and the existing rule deletion flow.
- Produces: browser evidence that both data states route to the correct full-page destination without regressions.

- [ ] **Step 1: Verify the empty-rule route through visible UI**

Open `/TipOut/index.html?qa=summary-rule-entry-empty`, confirm there are no saved rules through `/TipOut/rules.html`, return to the summary, and click “新建/查看规则”.

Expected: the same tab displays `/TipOut/rule-add.html?poolKind=tip`; the heading is “新增小费分配规则”; no pool-type selection modal appears.

- [ ] **Step 2: Create one temporary rule through the existing editor**

Enter a clearly temporary rule name, select a store, keep the existing default tip-pool configuration, submit, and wait for the existing redirect to `/TipOut/rules.html`.

Expected: the rule list contains the temporary rule and its metrics show at least one rule.

- [ ] **Step 3: Verify the non-empty route through visible UI**

Return to `/TipOut/index.html?qa=summary-rule-entry-existing` and click “新建/查看规则”.

Expected: the same tab displays `/TipOut/rules.html`; it does not open `rule-add.html` or the pool-type modal.

- [ ] **Step 4: Restore the prototype data state**

Delete the temporary rule through the existing rule action menu and confirmation dialog.

Expected: `/TipOut/rules.html` returns to its pre-test rule state. Do not directly alter browser storage.

- [ ] **Step 5: Verify desktop and mobile presentation**

At 1280 × 720, confirm the button appears directly left of “导出结果”. At 390 × 720, confirm all three heading actions remain visible and usable with the existing wrapping behavior. Confirm the browser console has no new errors.

- [ ] **Step 6: Run the final targeted checks**

```powershell
npm.cmd run verify:tipout-interaction-refresh
npm.cmd run verify:tipout-work-hours-layout
git diff --check -- dist/TipOut/index.html scripts/verify-tipout-interaction-refresh.mjs dist/TipOut/prototype-fidelity.css
```

Expected: all commands pass and no whitespace errors are reported.
