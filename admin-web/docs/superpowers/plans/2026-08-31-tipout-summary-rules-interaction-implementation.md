# TipOut Summary and Rules Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the TipOut date tabs with a daily summary list that opens an independent detail page, and reorganize rule management to match the approved prototype without changing any business calculation, persistence, or Payroll behavior.

**Architecture:** Keep the existing plain HTML/CSS/global-JavaScript application and its `ruleData`, `TipAllocation`, localStorage, and Payroll bridge contracts. Extract only presentation-safe daily aggregation and navigation helpers, then make `index.html`, `detail.html`, `rules.html`, and `rule-add.html` consume those helpers while retaining their existing calculation and submit functions.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js verification scripts, Vite project shell.

**Spec:** `docs/superpowers/specs/2026-08-31-tipout-summary-rules-interaction-design.md`

## Global Constraints

- Only interaction organization and visual hierarchy may change; calculations and functional outcomes must remain unchanged.
- Every date row opens independent `detail.html`; no inline detail, drawer, or modal is allowed.
- Daily row state is only `已分配` or `待分配`, derived from `tipout_allocated`.
- `doAllocateTips()` and `doCancelAllocate()` continue to operate on the complete filtered date range.
- Do not add localStorage business keys, rule fields, versions, drafts, audits, enable/disable state, or effective dates.
- Preserve both `legacy_pool` and `order_tip_then_residual`, including every conditional field and validation branch.
- Preserve `updateTipData()`, `saveDetail()`, `saveAndNext()`, rule overwrite save, exports, and Payroll bridge calls.
- Do not edit `vendor/emenu-new`; the project-level eMenu embed build rule is therefore not triggered by this plan.

---

## File Structure

- Create `dist/TipOut/tipout-summary-ui.js`: pure daily aggregation, detail URL creation, and summary history-state helpers. It must not read or write localStorage.
- Modify `dist/TipOut/index.html`: daily list markup, adapters from existing `genDailyTip()` to the pure aggregator, daily navigation, and UI-state restoration.
- Modify `dist/TipOut/detail.html`: prototype-aligned page heading/context layout, universal no-rule empty state, and shared return-to-summary behavior.
- Modify `dist/TipOut/rules.html`: rule management list/card hierarchy while retaining current operations.
- Modify `dist/TipOut/rule-add.html`: section IDs, section navigation, and responsive editor layout without changing form controls or submit functions.
- Modify `dist/TipOut/common.css`: scoped styles for daily rows, detail context, rule records, and editor navigation.
- Create `scripts/verify-tipout-interaction-refresh.mjs`: structural and pure-helper regression checks.
- Modify `package.json`: add `verify:tipout-interaction-refresh`.

### Task 1: Lock the Business Baseline and Add Pure Summary Helpers

**Files:**
- Create: `dist/TipOut/tipout-summary-ui.js`
- Create: `scripts/verify-tipout-interaction-refresh.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing daily employee records shaped as `{ before, deducted, received, after }`.
- Produces: `window.TipOutSummaryUi.summarizeDailyResults(records)`, `buildDetailUrl(context)`, `buildSummaryHistoryState(values)`, and `readSummaryHistoryState(state)`.

- [ ] **Step 1: Write the failing helper verifier**

Create `scripts/verify-tipout-interaction-refresh.mjs` with a VM loader and exact assertions:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const helperPath = path.join(root, 'dist/TipOut/tipout-summary-ui.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(helperPath, 'utf8'), context);
const ui = context.window.TipOutSummaryUi;

assert.deepEqual(
  JSON.parse(JSON.stringify(ui.summarizeDailyResults([
    { before: 10, deducted: 2, received: 4, after: 12 },
    { before: 20, deducted: 1, received: 3, after: 22 },
  ]))),
  { before: 30, deducted: 3, received: 7, after: 34 },
);
assert.equal(
  ui.buildDetailUrl({ date: '2026-08-02', store: 'Downtown LA', fromSummary: true }),
  'detail.html?date=2026-08-02&store=Downtown%20LA&from=summary',
);
const historyState = ui.buildSummaryHistoryState({
  dateStart: '2026-08-01', dateEnd: '2026-08-07', store: 'Downtown LA',
  roles: ['Server'], employees: ['Olivia Martin'], scrollY: 420, returnDate: '2026-08-02',
});
assert.equal(historyState.tipoutSummaryUiState.returnDate, '2026-08-02');
assert.equal(ui.readSummaryHistoryState(historyState).scrollY, 420);
```

- [ ] **Step 2: Run the verifier to confirm it fails**

Run: `node scripts/verify-tipout-interaction-refresh.mjs`

Expected: FAIL with `ENOENT` for `dist/TipOut/tipout-summary-ui.js`.

- [ ] **Step 3: Implement the pure helper module**

Create `dist/TipOut/tipout-summary-ui.js` as a browser global without storage or DOM dependencies:

```js
(function (root) {
  function number(value) { return Number(value) || 0; }
  function summarizeDailyResults(records) {
    return (records || []).reduce(function (sum, item) {
      sum.before += number(item.before);
      sum.deducted += number(item.deducted);
      sum.received += number(item.received);
      sum.after += number(item.after);
      return sum;
    }, { before: 0, deducted: 0, received: 0, after: 0 });
  }
  function buildDetailUrl(context) {
    var query = ['date=' + encodeURIComponent(context.date || '')];
    if (context.store) query.push('store=' + encodeURIComponent(context.store));
    if (context.fromSummary) query.push('from=summary');
    return 'detail.html?' + query.join('&');
  }
  function buildSummaryHistoryState(values) {
    return { tipoutSummaryUiState: {
      dateStart: values.dateStart || '', dateEnd: values.dateEnd || '',
      store: values.store || '', roles: (values.roles || []).slice(),
      employees: (values.employees || []).slice(), scrollY: Number(values.scrollY) || 0,
      returnDate: values.returnDate || '',
    } };
  }
  function readSummaryHistoryState(state) {
    return state && state.tipoutSummaryUiState ? state.tipoutSummaryUiState : null;
  }
  root.TipOutSummaryUi = { summarizeDailyResults, buildDetailUrl, buildSummaryHistoryState, readSummaryHistoryState };
})(window);
```

- [ ] **Step 4: Add the package script and run the verifier**

Add to `package.json`:

```json
"verify:tipout-interaction-refresh": "node scripts/verify-tipout-interaction-refresh.mjs"
```

Run: `npm run verify:tipout-interaction-refresh`

Expected: PASS with no assertion failures.

- [ ] **Step 5: Commit the helper boundary**

```bash
git add dist/TipOut/tipout-summary-ui.js scripts/verify-tipout-interaction-refresh.mjs package.json
git commit -m "test: lock tipout interaction contracts"
```

### Task 2: Replace Date Tabs with the Daily Summary List

**Files:**
- Modify: `dist/TipOut/index.html:250-335, 753-1020`
- Modify: `dist/TipOut/common.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `TipOutSummaryUi.summarizeDailyResults`, existing `getDateRange()`, `getAllocatedDates()`, `getFilteredEmployees()`, `genDailyTip()`, and `money()`.
- Produces: `getDailyEmployeeResults(dateKey)`, `renderDailySummaryList()`, `openDailyDetail(dateKey)`, and rows with `data-date="YYYY-MM-DD"`.

- [ ] **Step 1: Extend the verifier with failing daily-list assertions**

Append:

```js
const indexHtml = fs.readFileSync(path.join(root, 'dist/TipOut/index.html'), 'utf8');
assert.match(indexHtml, /id="dailySummaryList"/);
assert.match(indexHtml, /function getDailyEmployeeResults\(dateKey\)/);
assert.match(indexHtml, /function renderDailySummaryList\(\)/);
assert.match(indexHtml, /TipOutSummaryUi\.summarizeDailyResults/);
assert.match(indexHtml, /data-date/);
assert.doesNotMatch(indexHtml, /id="dayTabs"/);
assert.doesNotMatch(indexHtml, /openDayAllocationStatusModal/);
assert.doesNotMatch(indexHtml, /id="employeeResults"/);
```

- [ ] **Step 2: Run the verifier to confirm the old tab UI fails**

Run: `npm run verify:tipout-interaction-refresh`

Expected: FAIL because `dailySummaryList` and the new functions do not exist.

- [ ] **Step 3: Replace summary markup and load the helper**

In `index.html`, load `tipout-summary-ui.js` after `common.js`. Replace the day-tab row, employee result container, and daily-status modal with:

```html
<div class="tipout-daily-list" id="dailySummaryList" aria-label="每日小费分配汇总"></div>
```

Keep the filter surface, full-range allocate/cancel buttons, and export bar unchanged.

- [ ] **Step 4: Extract the read-only daily adapter and render rows**

Add alongside the existing daily calculation helpers:

```js
function getDailyEmployeeResults(dateKey) {
  return getFilteredEmployees().map(function (emp) {
    return genDailyTip(emp, dateKey);
  });
}

function renderDailySummaryList() {
  var dates = getDateRange();
  var allocatedDates = getAllocatedDates();
  var container = document.getElementById('dailySummaryList');
  container.innerHTML = dates.map(function (dateKey) {
    var total = TipOutSummaryUi.summarizeDailyResults(getDailyEmployeeResults(dateKey));
    var allocated = allocatedDates.has(dateKey);
    return '<button type="button" class="tipout-daily-row" data-date="' + dateKey +
      '" onclick="openDailyDetail(\'' + dateKey + '\')">' +
      '<span class="tipout-daily-date"><strong>' + formatTabLabel(new Date(dateKey + 'T00:00:00')) +
      '</strong><small>' + dateKey + '</small></span>' +
      '<span class="status-pill ' + (allocated ? 'allocated' : 'pending') + '">' +
      (allocated ? '已分配' : '待分配') + '</span>' +
      '<span><small>分配前</small><strong>' + money(total.before) + '</strong></span>' +
      '<span><small>扣除</small><strong>' + money(total.deducted) + '</strong></span>' +
      '<span><small>分得</small><strong>' + money(total.received) + '</strong></span>' +
      '<span><small>分配后</small><strong>' + money(total.after) + '</strong></span>' +
      '<span aria-hidden="true">›</span></button>';
  }).join('');
  updateAllocateButton();
  restoreSummaryUiState();
}
```

Change filter onchange handlers and allocate/cancel completion from `renderDayTabs()` to `renderDailySummaryList()`. Remove `renderDayTabs()`, `renderEmployeeResults()`, `selectDay()`, the day status modal, and their unused styles only after the new list is working.

- [ ] **Step 5: Add scoped responsive styles**

Append to `common.css` using only `.tipout-daily-*` selectors. Desktop rows use columns for date, state, and four amounts; at the existing mobile breakpoint switch to a two-column amount grid while keeping the row a single native button with a visible focus outline.

- [ ] **Step 6: Run focused and existing TipOut verifiers**

Run:

```bash
npm run verify:tipout-interaction-refresh
npm run verify:tipout-work-hours-layout
npm run verify:personal-sales-deduct
npm run verify:personal-sales-pool
```

Expected: all PASS.

- [ ] **Step 7: Commit the daily list**

```bash
git add dist/TipOut/index.html dist/TipOut/common.css scripts/verify-tipout-interaction-refresh.mjs
git commit -m "feat: show tipout results by day"
```

### Task 3: Complete Independent Detail Navigation and Return Restoration

**Files:**
- Modify: `dist/TipOut/index.html`
- Modify: `dist/TipOut/detail.html:220-292, 470-520, 1466-1522`
- Modify: `dist/TipOut/common.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `TipOutSummaryUi.buildDetailUrl`, `buildSummaryHistoryState`, `readSummaryHistoryState`, current detail `applyUrlParams()`, `renderDetailPage()`, `updateTipData()`, `saveDetail()`, and `saveAndNext()`.
- Produces: `captureSummaryUiState(returnDate)`, `restoreSummaryUiState()`, `openDailyDetail(dateKey)`, and `returnToSummary()`.

- [ ] **Step 1: Add failing navigation assertions**

Append:

```js
const detailHtml = fs.readFileSync(path.join(root, 'dist/TipOut/detail.html'), 'utf8');
assert.match(indexHtml, /history\.replaceState/);
assert.match(indexHtml, /fromSummary: true/);
assert.match(indexHtml, /function restoreSummaryUiState\(\)/);
assert.match(detailHtml, /function returnToSummary\(\)/);
assert.match(detailHtml, /params\.from === 'summary'/);
assert.match(detailHtml, /返回汇总/);
assert.match(detailHtml, /还没有小费分配规则/);
assert.match(detailHtml, /updateTipData\(\)/);
assert.match(detailHtml, /saveDetail\(\)/);
assert.match(detailHtml, /saveAndNext\(\)/);
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run verify:tipout-interaction-refresh`

Expected: FAIL because return and restoration functions do not exist.

- [ ] **Step 3: Implement summary capture, navigation, and restoration**

In `index.html`, implement:

```js
function captureSummaryUiState(returnDate) {
  var state = TipOutSummaryUi.buildSummaryHistoryState({
    dateStart: document.getElementById('dateStart').value,
    dateEnd: document.getElementById('dateEnd').value,
    store: document.getElementById('storeSelect').value,
    roles: getSelectedRoles(), employees: getSelectedEmployees(),
    scrollY: window.scrollY, returnDate: returnDate,
  });
  history.replaceState(state, '');
}
function openDailyDetail(dateKey) {
  captureSummaryUiState(dateKey);
  window.location.href = TipOutSummaryUi.buildDetailUrl({
    date: dateKey, store: document.getElementById('storeSelect').value, fromSummary: true,
  });
}
```

`restoreSummaryUiState()` must restore values before rendering dependent employee options, then use `requestAnimationFrame` to restore scroll and focus the matching row. Call it from both `DOMContentLoaded` initialization and `pageshow`; guard with a boolean so the same history entry is not restored twice.

- [ ] **Step 4: Recompose the detail heading without changing actions**

Add a visible `返回汇总` button and retain exactly these current actions:

```html
<button type="button" class="btn btn-ghost" onclick="returnToSummary()">← 返回汇总</button>
<button type="button" class="btn btn-lg" onclick="updateTipData()">更新小费数据</button>
<button class="btn btn-primary btn-lg" onclick="saveDetail()">保存</button>
<button class="btn btn-primary btn-lg" onclick="saveAndNext()">保存并跳转到下一天</button>
```

Move the date and store controls into the prototype-aligned context header, keeping IDs and onchange handlers unchanged. Do not introduce draft, formal result, version, adjustment, or audit controls.

- [ ] **Step 5: Implement deterministic return and no-rule detail state**

Extend `applyUrlParams()` to retain `from`. Add:

```js
function returnToSummary() {
  var params = getDetailUrlParams();
  if (params.from === 'summary' && history.length > 1) history.back();
  else window.location.href = 'index.html';
}
```

Change the top summary tab to call `returnToSummary()`. When `renderDetailPage()` finds no applicable rules, render the existing “还没有小费分配规则” empty state with an explicit `rules.html` link; never redirect automatically and never add the date to `tipout_allocated`.

- [ ] **Step 6: Verify navigation and current detail controls**

Run: `npm run verify:tipout-interaction-refresh`

Then serve `dist/TipOut` locally and verify:

1. Every date row opens `detail.html?...&from=summary`.
2. Pending/no-rule dates first show the detail empty state.
3. Return restores filters, scroll, and focus.
4. Manual hours, role percentage, employee percentage, add/remove row, formula recalculation, fold, formula modal, update, save, and save-next still work.
5. Navigating alone does not change `tipout_allocated` or call Payroll.

- [ ] **Step 7: Commit detail navigation**

```bash
git add dist/TipOut/index.html dist/TipOut/detail.html dist/TipOut/common.css scripts/verify-tipout-interaction-refresh.mjs
git commit -m "feat: open tipout day details as a page"
```

### Task 4: Reorganize the Rule List Without Adding Rule State

**Files:**
- Modify: `dist/TipOut/rules.html:95-170, 191-320`
- Modify: `dist/TipOut/common.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `ruleData.getRules()`, `buildRuleDescription(rule)`, `getRulePoolKindLabel(rule)`, `getRulePoolKindTagClass(rule)`, `deleteRule(el)`, and `copyRule(el)`.
- Produces: `.tipout-rule-record` rows and `toggleRuleActions(button)`; data attributes keep the existing numeric rule ID.

- [ ] **Step 1: Add failing rule-list assertions**

Append:

```js
const rulesHtml = fs.readFileSync(path.join(root, 'dist/TipOut/rules.html'), 'utf8');
assert.match(rulesHtml, /tipout-rule-record/);
assert.match(rulesHtml, /ruleData\.buildRuleDescription/);
assert.match(rulesHtml, /deleteRule\(this\)/);
assert.match(rulesHtml, /copyRule\(this\)/);
assert.doesNotMatch(rulesHtml, /规则版本|生效日期|停用规则|启用规则/);
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run verify:tipout-interaction-refresh`

Expected: FAIL because `.tipout-rule-record` is absent.

- [ ] **Step 3: Replace the table presentation with accessible records**

Keep the store filter, empty state, pool type modal, and add button. Make `renderRulesTable()` render one record per rule with:

- `rule.store`
- existing pool kind tag
- `rule.ruleName`
- `ruleData.buildRuleDescription(rule)`
- direct edit link using the existing URL
- a native “更多操作” button containing copy and delete actions

Do not render status, version, update time, enable/disable, or effective date.

- [ ] **Step 4: Preserve operation wiring**

Ensure copy still clones the rule, assigns `getNextRuleId()`, appends ` (副本)`, saves, rerenders, and notifies. Ensure delete still calls the existing confirm dialog and `deleteRuleById(id)`. The only new function, `toggleRuleActions(button)`, may change menu visibility but must not touch `ruleData`.

- [ ] **Step 5: Run verifiers and browser checks**

Run:

```bash
npm run verify:tipout-interaction-refresh
npm run verify:tipout-work-hours-layout
```

Verify add, edit, copy, delete, store filter, outside-click menu close, keyboard focus, and mobile stacking.

- [ ] **Step 6: Commit the rule list**

```bash
git add dist/TipOut/rules.html dist/TipOut/common.css scripts/verify-tipout-interaction-refresh.mjs
git commit -m "feat: reorganize tipout rule management"
```

### Task 5: Add Prototype-Aligned Navigation to the Existing Rule Editor

**Files:**
- Modify: `dist/TipOut/rule-add.html:430-650, 5513-5810`
- Modify: `dist/TipOut/common.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: every existing form control and current `onAllocationModeChange`, `collectFormData`, validation, and `submitRule` functions.
- Produces: section anchors `ruleSectionBasic`, `sharedPoolRulesSection`, `allocationModeSection`, `deductRulesSection`, `legacyReceiversSection`, `orderTipClaimsSection`, `orderResidualSection`, and `distributionSection`; `scrollToRuleSection(id)` changes only viewport/focus.

- [ ] **Step 1: Add failing editor completeness checks**

Append assertions that require every anchor and every current data branch:

```js
const editorHtml = fs.readFileSync(path.join(root, 'dist/TipOut/rule-add.html'), 'utf8');
for (const id of [
  'ruleSectionBasic', 'sharedPoolRulesSection', 'allocationModeSection',
  'deductRulesSection', 'legacyReceiversSection', 'orderTipClaimsSection',
  'orderResidualSection', 'distributionSection',
]) assert.match(editorHtml, new RegExp('id="' + id + '"'));
for (const field of [
  'poolRules', 'deductRoles', 'deductEmployees', 'deductConfig', 'receivers',
  'tipClaims', 'residual', 'distribution', 'clockin', 'workHoursConfig',
]) assert.match(editorHtml, new RegExp(field));
assert.match(editorHtml, /function scrollToRuleSection\(id\)/);
assert.match(editorHtml, /function collectFormData\(\)/);
assert.match(editorHtml, /function submitRule\(\)/);
assert.doesNotMatch(editorHtml, /effectiveDate|ruleVersion|saveDraft|auditLog/);
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run verify:tipout-interaction-refresh`

Expected: FAIL on missing section IDs and navigation function.

- [ ] **Step 3: Add section IDs without moving control ownership**

Assign IDs to the existing wrappers:

- rule name/store → `ruleSectionBasic`
- receiver section → `legacyReceiversSection`
- tip claims section → `orderTipClaimsSection`
- residual section → `orderResidualSection`
- clock/distribution group wrapper → `distributionSection`

Keep existing `sharedPoolRulesSection`, `allocationModeSection`, and `deductRulesSection`. Do not duplicate controls, change `name` attributes, or move elements outside their existing conditional containers.

- [ ] **Step 4: Add a visual section navigator**

Add a sticky, responsive navigator whose buttons call:

```js
function scrollToRuleSection(id) {
  var section = document.getElementById(id);
  if (!section || section.offsetParent === null) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  var focusTarget = section.querySelector('input, select, button');
  if (focusTarget) focusTarget.focus({ preventScroll: true });
}
```

When `allocationMode` changes, hide navigator entries for inactive sections using the same condition as `onAllocationModeChange(false)`. The navigator must not call `collectFormData()` or mutate field values.

- [ ] **Step 5: Prove serialization and validation parity**

Use fixed fixtures for both modes. For identical initial rule JSON and identical user input, capture the object returned by `collectFormData()` before and after the layout change and compare JSON deeply. Exercise:

- all six contribution source types and condition panels
- all three deduction bases
- legacy primary/sub-receivers and employee weights
- tip claims and residual primary/sub-receivers
- average, hours actual, hours capped, orders, clock, and no-clock
- add/edit submit and all current validation errors

Run:

```bash
npm run verify:tipout-interaction-refresh
npm run verify:tipout-work-hours-layout
npm run verify:personal-sales-deduct
npm run verify:personal-sales-deduct-pipeline
npm run verify:personal-sales-pool
```

Expected: all PASS; fixture serialization is identical.

- [ ] **Step 6: Commit the editor reorganization**

```bash
git add dist/TipOut/rule-add.html dist/TipOut/common.css scripts/verify-tipout-interaction-refresh.mjs
git commit -m "feat: organize tipout rule editor sections"
```

### Task 6: Final Regression and Visual Verification

**Files:**
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`
- Modify: `docs/superpowers/specs/2026-08-31-tipout-summary-rules-interaction-design.md` only if an implementation-discovered clarification is required; do not change approved scope.

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: a complete automated regression gate and browser evidence for desktop/mobile behavior.

- [ ] **Step 1: Add forbidden-business-change assertions**

Add source assertions that fail if the implementation introduces forbidden keys or UI concepts:

```js
for (const source of [indexHtml, detailHtml, rulesHtml, editorHtml]) {
  assert.doesNotMatch(source, /tipout_rule_versions|tipout_result_versions|tipout_audit_log/);
}
assert.doesNotMatch(rulesHtml, /生成正式结果|保存草稿|调整记录|规则版本/);
```

Also snapshot the set of localStorage keys read/written by TipOut before and after the change and assert equality.

- [ ] **Step 2: Run the full relevant automated suite**

Run:

```bash
npm run verify:tipout-interaction-refresh
npm run verify:tipout-work-hours-layout
npm run verify:order-tip-status
npm run verify:payment-method-apportion
npm run verify:personal-sales-deduct
npm run verify:personal-sales-deduct-pipeline
npm run verify:personal-sales-pool
npm run build
```

Expected: all verification scripts and the production build PASS.

- [ ] **Step 3: Verify desktop behavior in the embedded route**

Run `npm run dev`, open `/team/tips/distribution`, reload the TipOut iframe, and verify at desktop width:

1. Date range shows one row per day.
2. Row totals match the old single-day output for the same fixture.
3. Every row opens independent detail with correct date/store.
4. No-rule detail does not redirect automatically.
5. Return restores filters, scroll, and focus.
6. Allocate/cancel still affect the entire date range and send identical Payroll parameters.
7. Rule list operations and both editor modes remain functional.

- [ ] **Step 4: Verify responsive behavior**

At 736px and 360px widths, verify no clipping or overlap in the daily list, detail controls/tables, rule list, or editor navigator. Confirm every essential action remains keyboard accessible and touch targets remain usable.

- [ ] **Step 5: Inspect the final diff for accidental business changes**

Run:

```bash
git diff --check
git diff -- dist/TipOut/index.html dist/TipOut/detail.html dist/TipOut/rules.html dist/TipOut/rule-add.html dist/TipOut/common.css dist/TipOut/tipout-summary-ui.js scripts/verify-tipout-interaction-refresh.mjs package.json
```

Expected: no whitespace errors; no change to calculation formulas, rule serialization fields, allocate/cancel date-range loops, or Payroll argument order.

- [ ] **Step 6: Commit final verification updates**

```bash
git add scripts/verify-tipout-interaction-refresh.mjs
git commit -m "test: verify tipout interaction refresh"
```
