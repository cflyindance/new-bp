# TipOut Prototype Fidelity Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faithfully restore the four TipOut screens to the selected prototype's visual structure and interaction model without changing current TipOut business fields, calculations, persistence, or actions.

**Architecture:** Keep the existing static TipOut pages and their inline business scripts as the source of truth. Add one page-scoped fidelity stylesheet, reshape only the four page shells and render templates, and extend the existing pure summary helper for observable navigation and presentation-only aggregates. Lock the business boundary with structural regression tests, then use same-viewport browser captures and a blocking `design-qa.md` comparison loop.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js assertion scripts, Vite local static middleware, Codex Desktop in-app Browser.

**Spec:** `docs/superpowers/specs/2026-08-31-tipout-prototype-fidelity-restoration-design.md`

## Global Constraints

- Visual truth is `C:\Users\27273\Downloads\原型预览.html` and the previously captured 1280×720 reference states under `C:\Users\27273\.codex\visualizations\2026\08\31\01a05691-1562-70c1-a8da-ee58e4b8e18f\tipout-audit\`.
- Preserve `tipout_rules`, `tipout_allocated`, Payroll bridge payloads, all current rule fields, both allocation modes, and every existing calculate/save/copy/delete/export action.
- Do not add rule versions, status workflows, draft state, effective dates, audit logs, date selection, artificial adjustments, or new localStorage keys.
- Use `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Desktop measurements are sidebar `212±4px`, topbar `68±4px`, content padding `28±4px`, primary button height `36±2px`, font-size drift at most `1px`, and peer-card spacing drift at most `4px`.
- Primary actions are black with white text; TipOut must not use saturated blue as its primary-action language.
- Do not create new inline SVG, CSS drawings, emoji, or text-glyph substitutes for icons. Retain existing supplied icons when they already exist and prefer explicit text actions when no matching project icon is available.
- Maintain a unique `h1`, visible labels, text-backed statuses, keyboard-operable rows, `aria-label` on icon buttons, and fixed-region focus clearance.
- Work only in the files named by each task. Preserve all unrelated staged, unstaged, and untracked work.

## File Structure

- Create `dist/TipOut/prototype-fidelity.css`: page-scoped tokens, white application shell, shared headings, metrics, tables, context rails, sticky action bars, and responsive rules for the four target pages.
- Modify `dist/TipOut/tipout-summary-ui.js`: keep pure summary aggregation and history-state helpers; add the `return=history` marker and a pure pending-day count helper.
- Modify `dist/TipOut/index.html`: summary heading, metrics, reminder, compact filters, daily table, and current allocation/export actions.
- Modify `dist/TipOut/detail.html`: independent detail layout, context bar/rail, formula and role-table presentation, sticky existing actions, and safe summary return.
- Modify `dist/TipOut/rules.html`: derived metrics, compact filter, rules table, existing menu operations, and structured empty state.
- Modify `dist/TipOut/rule-add.html`: card-based editor layout, live read-only context rail, and sticky existing submit/cancel actions; existing fields and serializers remain in place.
- Modify `scripts/verify-tipout-interaction-refresh.mjs`: pure-helper and static DOM contracts for fidelity, navigation, accessibility, and prohibited business additions.
- Create `design-qa.md`: final comparison evidence, interaction checks, console check, iteration history, and exact `final result`.

---

### Task 1: Lock the Shared Fidelity Shell Contract

**Files:**
- Create: `dist/TipOut/prototype-fidelity.css`
- Modify: `dist/TipOut/index.html:7-182`
- Modify: `dist/TipOut/detail.html:7-210`
- Modify: `dist/TipOut/rules.html:7-106`
- Modify: `dist/TipOut/rule-add.html:7-430`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: existing `.layout`, `.sidebar`, `.main-content`, `.header`, `.content-area`, `.btn`, `.form-control`, modal, drawer, and embedded-mode behavior from `common.css` and `common.js`.
- Produces: body modifiers `tipout-fidelity`, `tipout-page-summary`, `tipout-page-detail`, `tipout-page-rules`, `tipout-page-rule-editor`; shell elements `.tipout-breadcrumb`, `.tipout-page-heading`, `.tipout-heading-actions`; shared CSS tokens under `.tipout-fidelity`.

- [ ] **Step 1: Add failing shell-contract assertions**

Extend the verifier with exact contracts for the new shared stylesheet and all four pages:

```js
const fidelityCssPath = path.join(root, 'dist/TipOut/prototype-fidelity.css');
assert.equal(fs.existsSync(fidelityCssPath), true);

const pageContracts = [
  ['index.html', 'tipout-page-summary'],
  ['detail.html', 'tipout-page-detail'],
  ['rules.html', 'tipout-page-rules'],
  ['rule-add.html', 'tipout-page-rule-editor'],
];
for (const [fileName, pageClass] of pageContracts) {
  const html = fs.readFileSync(path.join(root, 'dist/TipOut', fileName), 'utf8');
  assert.match(html, /href="prototype-fidelity\.css"/);
  assert.match(html, new RegExp('<body class="[^"]*tipout-fidelity[^"]*' + pageClass));
  assert.match(html, /class="tipout-breadcrumb"/);
  assert.doesNotMatch(html, /class="page-tabs"/);
}
```

- [ ] **Step 2: Run the verifier and confirm the shell contract fails**

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: FAIL because `prototype-fidelity.css`, the body modifiers, and `.tipout-breadcrumb` do not exist yet.

- [ ] **Step 3: Create the page-scoped prototype token and shell stylesheet**

Create `prototype-fidelity.css` with the exact shared foundation below, then continue the same file with the page-specific selectors added by Tasks 2–5:

```css
.tipout-fidelity {
  --primary: #000000;
  --primary-hover: #181818;
  --primary-bg: #f4f4f5;
  --primary-border: #d4d4d8;
  --danger: #b83232;
  --danger-bg: #fff0f0;
  --success: #168f5b;
  --success-bg: #eef9f3;
  --warning: #9a6410;
  --warning-bg: #fff7e6;
  --info: #3168a6;
  --info-bg: #eef5fd;
  --sidebar-bg: #ffffff;
  --sidebar-active: #000000;
  --header-bg: rgba(255, 255, 255, 0.94);
  --body-bg: #ffffff;
  --card-bg: #ffffff;
  --border-color: #d9d9dc;
  --border-light: #ededf0;
  --text-primary: #000000;
  --text-secondary: #55555c;
  --text-tertiary: #7b7b83;
  --font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  background: #ffffff;
}

.tipout-fidelity .sidebar {
  width: 212px;
  padding: 16px;
  border-right: 1px solid var(--border-light);
  background: #ffffff;
  color: #000000;
}

.tipout-fidelity .main-content { margin-left: 212px; background: #ffffff; }
.tipout-fidelity .header { height: 68px; padding: 0 28px; backdrop-filter: blur(14px); }
.tipout-fidelity .content-area { padding: 28px; }
.tipout-fidelity .sidebar-logo { padding: 4px 4px 22px; }
.tipout-fidelity .sidebar-logo .logo-icon { background: #000000; }
.tipout-fidelity .sidebar-logo .logo-text,
.tipout-fidelity .sidebar-submenu-title,
.tipout-fidelity .sidebar-menu-item { color: #000000; }
.tipout-fidelity .sidebar-menu-item.active { background: #000000; color: #ffffff; }
.tipout-fidelity .sidebar-menu-item:hover:not(.active) { background: #f4f4f5; color: #000000; }
.tipout-fidelity .tipout-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.tipout-fidelity .tipout-breadcrumb span { color: var(--text-tertiary); }
.tipout-fidelity .btn-primary { min-height: 36px; border-color: #000000; border-radius: 16px; background: #000000; color: #ffffff; }
.tipout-fidelity .btn-primary:hover { border-color: #181818; background: #181818; }
.tipout-fidelity .btn:focus-visible,
.tipout-fidelity a:focus-visible,
.tipout-fidelity [tabindex]:focus-visible { outline: 2px solid #000000; outline-offset: 2px; }

@media (max-width: 768px) {
  .tipout-fidelity .main-content { margin-left: 0; }
  .tipout-fidelity .sidebar { width: min(280px, 86vw); }
  .tipout-fidelity .header { height: 60px; padding: 0 16px; }
  .tipout-fidelity .content-area { padding: 16px; }
}
```

- [ ] **Step 4: Apply the same shell markup to all four pages**

On each target page, load the override after `common.css`, set the two body classes, replace the empty left header with a breadcrumb, remove the `.page-tabs` block, and make the existing Tip Out submenu expose only real destinations:

```html
<link rel="stylesheet" href="common.css">
<link rel="stylesheet" href="prototype-fidelity.css">
<body class="tipout-fidelity tipout-page-summary">
<nav class="sidebar-menu" aria-label="小费管理导航">
  <div class="sidebar-submenu-title open"><span>Tip Out</span></div>
  <div class="sidebar-submenu-items" style="max-height:200px">
    <a href="index.html" class="sidebar-menu-item active">小费分配汇总</a>
    <a href="rules.html" class="sidebar-menu-item">分配规则</a>
  </div>
  <div class="sidebar-submenu-title open"><span>员工管理</span></div>
  <div class="sidebar-submenu-items" style="max-height:200px">
    <a href="employees.html" class="sidebar-menu-item">员工列表</a>
  </div>
  <div class="sidebar-submenu-title open"><span>Payroll</span></div>
  <div class="sidebar-submenu-items" style="max-height:200px">
    <a href="payroll.html" class="sidebar-menu-item">报税报表</a>
  </div>
</nav>
<div class="header-left">
  <button class="mobile-menu-btn" onclick="toggleSidebar()" aria-label="打开导航菜单">菜单</button>
  <div class="tipout-breadcrumb"><span>Tip Out</span><b aria-hidden="true">/</b><strong>小费分配汇总</strong></div>
</div>
```

Use `tipout-page-detail`, `tipout-page-rules`, or `tipout-page-rule-editor` and the corresponding breadcrumb title on the other pages. On `detail.html`, the summary link calls `returnToSummary(); return false`; on `rules.html` and `rule-add.html`, the Rules link is active and remains an ordinary link.

- [ ] **Step 5: Run the verifier and confirm the shell contract passes**

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: PASS with all previous TipOut assertions still passing.

- [ ] **Step 6: Commit the shared shell**

```bash
git add dist/TipOut/prototype-fidelity.css dist/TipOut/index.html dist/TipOut/detail.html dist/TipOut/rules.html dist/TipOut/rule-add.html scripts/verify-tipout-interaction-refresh.mjs
git commit --only -m "style: restore tipout prototype shell" -- dist/TipOut/prototype-fidelity.css dist/TipOut/index.html dist/TipOut/detail.html dist/TipOut/rules.html dist/TipOut/rule-add.html scripts/verify-tipout-interaction-refresh.mjs
```

---

### Task 2: Restore the Daily Summary Workspace

**Files:**
- Modify: `dist/TipOut/tipout-summary-ui.js`
- Modify: `dist/TipOut/index.html:182-277,662-775`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `getDateRange()`, `getAllocatedDates()`, `getDailyEmployeeResults(dateKey)`, `doAllocateTips()`, `doCancelAllocate()`, export functions, and current filters.
- Produces: `TipOutSummaryUi.countPendingDates(dateKeys, allocatedDateKeys)`, detail URLs containing `from=summary&return=history`, `renderSummaryOverview(dailyRows, allocatedDates)`, and DOM IDs `summaryBefore`, `summaryDeducted`, `summaryReceived`, `summaryAfter`, `pendingDateCount`, `dailySummaryList`.

- [ ] **Step 1: Add failing pure-helper and summary-DOM assertions**

```js
assert.equal(
  ui.buildDetailUrl({ date: '2026-08-02', store: 'Downtown LA', fromSummary: true }),
  'detail.html?date=2026-08-02&store=Downtown%20LA&from=summary&return=history',
);
assert.equal(ui.countPendingDates(['2026-08-01', '2026-08-02'], ['2026-08-02']), 1);
for (const id of ['summaryBefore', 'summaryDeducted', 'summaryReceived', 'summaryAfter', 'pendingDateCount']) {
  assert.match(indexHtml, new RegExp('id="' + id + '"'));
}
assert.match(indexHtml, /<table[^>]*class="[^"]*tipout-summary-table/);
assert.match(indexHtml, /<tbody id="dailySummaryList"/);
assert.match(indexHtml, /function renderSummaryOverview\(dailyRows, allocatedDates\)/);
assert.match(indexHtml, /function activateDailySummaryRow\(event, dateKey\)/);
assert.doesNotMatch(indexHtml, /type="checkbox"[^>]*data-date/);
```

- [ ] **Step 2: Run the verifier and confirm the new summary contract fails**

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: FAIL on the missing return marker, pending helper, metrics, and table structure.

- [ ] **Step 3: Extend the pure summary helper without touching calculation code**

```js
function countPendingDates(dateKeys, allocatedDateKeys) {
  var allocated = new Set(allocatedDateKeys || []);
  return (dateKeys || []).reduce(function (count, dateKey) {
    return count + (allocated.has(dateKey) ? 0 : 1);
  }, 0);
}

function buildDetailUrl(context) {
  var query = ['date=' + encodeURIComponent(context.date || '')];
  if (context.store) query.push('store=' + encodeURIComponent(context.store));
  if (context.fromSummary) {
    query.push('from=summary');
    query.push('return=history');
  }
  return 'detail.html?' + query.join('&');
}
```

Export `countPendingDates` alongside the four existing helpers.

- [ ] **Step 4: Replace the summary content skeleton while retaining all current controls**

Use this exact region order inside `.content-area`:

```html
<section class="tipout-page-section" aria-labelledby="summaryTitle">
  <div class="tipout-page-heading">
    <div><p class="tipout-kicker">Tip Out 工作台</p><h1 id="summaryTitle">小费分配汇总</h1><p>按日期查看、核对并执行当前范围的小费分配。</p></div>
    <div class="tipout-heading-actions">
      <button type="button" class="btn btn-lg" onclick="toggleExportMenu()" aria-haspopup="menu">导出结果</button>
      <button id="allocateBtn" class="btn btn-primary btn-lg" onclick="doAllocateTips()">分配小费</button>
    </div>
  </div>
  <div class="tipout-metric-strip" aria-label="小费金额概览">
    <div><span>分配前</span><strong id="summaryBefore">$0.00</strong></div>
    <div><span>扣除</span><strong id="summaryDeducted">$0.00</strong></div>
    <div><span>分得</span><strong id="summaryReceived">$0.00</strong></div>
    <div class="is-primary"><span>分配后</span><strong id="summaryAfter">$0.00</strong></div>
  </div>
  <div class="tipout-inline-notice tipout-inline-notice--warning" role="status">
    <div><strong>当前范围有 <span id="pendingDateCount">0</span> 天待分配</strong><p>待分配数量只按日期、门店与当前分配记录计算。</p></div>
    <button type="button" class="btn" onclick="doCancelAllocate()">取消分配</button>
  </div>
  <div class="filter-surface tipout-compact-toolbar">保留现有 dateStart、dateEnd、storeSelect、roleFilter、employeeFilter 控件及原 onchange</div>
  <div class="tipout-table-wrap">
    <table class="data-table tipout-summary-table">
      <thead><tr><th>日期</th><th>状态</th><th>分配前</th><th>扣除</th><th>分得</th><th>分配后</th><th aria-label="进入明细"></th></tr></thead>
      <tbody id="dailySummaryList" aria-label="每日小费分配汇总"></tbody>
    </table>
  </div>
</section>
```

Keep the current export menu and email modal in the document; move only their trigger into the heading.

- [ ] **Step 5: Render table rows and presentation-only aggregates from the same daily rows**

Implement these functions and call `renderSummaryOverview(dailyRows, allocatedDates)` at the end of `renderDailySummaryList()`:

```js
function activateDailySummaryRow(event, dateKey) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openDailyDetail(dateKey);
}

function renderSummaryOverview(dailyRows, allocatedDates) {
  var totals = TipOutSummaryUi.summarizeDailyResults(dailyRows.map(function(row) { return row.total; }));
  document.getElementById('summaryBefore').textContent = money(totals.before);
  document.getElementById('summaryDeducted').textContent = money(totals.deducted);
  document.getElementById('summaryReceived').textContent = money(totals.received);
  document.getElementById('summaryAfter').textContent = money(totals.after);
  document.getElementById('pendingDateCount').textContent = String(
    TipOutSummaryUi.countPendingDates(dailyRows.map(function(row) { return row.dateKey; }), Array.from(allocatedDates))
  );
}
```

Build each row with `'<tr class="tipout-daily-row" data-date="' + dateKey + '" tabindex="0" role="link" onclick="openDailyDetail(\'' + dateKey + '\')" onkeydown="activateDailySummaryRow(event, \'' + dateKey + '\')">'`. Fill the cells from the current `dateKey`, allocated flag, and `total.before`, `total.deducted`, `total.received`, and `total.after`; make the final cell text `查看明细`. Do not call any new calculator; obtain each `total` from the existing `TipOutSummaryUi.summarizeDailyResults(getDailyEmployeeResults(dateKey))` call.

- [ ] **Step 6: Add summary-specific responsive CSS**

Add exact selectors for `.tipout-page-section`, `.tipout-page-heading`, `.tipout-metric-strip`, `.tipout-inline-notice`, `.tipout-compact-toolbar`, `.tipout-table-wrap`, and `.tipout-summary-table`. Use four equal metric columns above 760px, two columns below 760px, 56px table rows, 12px labels, 20px metric values, and horizontal scrolling below 900px. Remove card borders/radii/transforms from `.tipout-daily-row` in fidelity pages.

- [ ] **Step 7: Verify and commit the summary**

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: PASS.

```bash
git add dist/TipOut/tipout-summary-ui.js dist/TipOut/index.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
git commit --only -m "feat: restore tipout daily summary workspace" -- dist/TipOut/tipout-summary-ui.js dist/TipOut/index.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
```

---

### Task 3: Restore the Independent Allocation Detail Workspace

**Files:**
- Modify: `dist/TipOut/detail.html:204-254,448-615,1068-1290,1435-1501`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `renderDetailPage()`, formula builders, role/employee builders, `updateTipData()`, `saveDetail()`, `saveAndNext()`, `getDetailUrlParams()`, and current modal/drawer behavior.
- Produces: `#detailWorkspace`, `#detailMain`, `#detailContextRail`, `#detailActionBar`, `renderDetailContextRail(rules, dateKey, store)`, and the two-marker `returnToSummary()` contract.

- [ ] **Step 1: Add failing detail layout and return-contract assertions**

```js
for (const id of ['detailWorkspace', 'detailMain', 'detailContextRail', 'detailActionBar']) {
  assert.match(detailHtml, new RegExp('id="' + id + '"'));
}
assert.match(detailHtml, /function renderDetailContextRail\(rules, dateKey, store\)/);
assert.match(detailHtml, /params\.from === 'summary' && params\.return === 'history' && history\.length > 1/);
assert.match(detailHtml, /class="[^"]*tipout-detail-context-bar/);
assert.match(detailHtml, /class="[^"]*tipout-sticky-actions/);
```

- [ ] **Step 2: Run the verifier and confirm the detail contract fails**

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: FAIL on the missing workspace, rail, sticky action IDs, and second return marker.

- [ ] **Step 3: Reshape only the detail page-level layout**

Replace the existing heading/filter/container region with:

```html
<div class="tipout-page-heading tipout-page-heading--with-back">
  <button type="button" class="btn" onclick="returnToSummary()">返回汇总</button>
  <div><p class="tipout-kicker">分配核算</p><h1>小费分配明细</h1><p>查看并核对当前日期与门店的小费分配结果。</p></div>
  <div class="tipout-heading-actions"><button type="button" class="btn" onclick="updateTipData()">更新小费数据</button></div>
</div>
<div class="tipout-detail-context-bar">
  <div class="filter-field"><label for="detailDate">日期</label><input type="date" id="detailDate" class="form-control" onchange="renderDetailPage()"></div>
  <div class="filter-field"><label for="storeSelect">门店</label><select id="storeSelect" class="form-control" onchange="renderDetailPage()"></select></div>
  <div><span>当前页面</span><strong>小费分配明细</strong></div>
</div>
<div class="tipout-workspace has-aside" id="detailWorkspace">
  <main id="detailMain"><div id="detailRulesContainer"></div></main>
  <aside class="tipout-context-rail" id="detailContextRail" aria-label="当前明细上下文"></aside>
</div>
<div class="tipout-sticky-actions" id="detailActionBar">
  <span>保存只沿用当前明细页已有逻辑</span>
  <button class="btn" onclick="saveDetail()">保存</button>
  <button class="btn btn-primary" onclick="saveAndNext()">保存并跳转到下一天</button>
</div>
```

Keep `#formulaModal` and every existing rule/formula/employee function unchanged.

- [ ] **Step 4: Populate the read-only context rail from already loaded data**

Add and call this function from `renderDetailPage()` after the current date/store/rules are resolved:

```js
function renderDetailContextRail(rules, dateKey, store) {
  var rail = document.getElementById('detailContextRail');
  if (!rail) return;
  var names = (rules || []).map(function(rule) { return rule.ruleName || '未命名规则'; });
  rail.innerHTML =
    '<section><span>日期</span><strong>' + escHtml(dateKey || '—') + '</strong></section>' +
    '<section><span>门店</span><strong>' + escHtml(store || '—') + '</strong></section>' +
    '<section><span>分配规则</span><strong>' + escHtml(names.length ? names.join('、') : '暂无规则') + '</strong></section>';
}
```

This function is read-only and must not write storage, mutate rules, or change calculations.

- [ ] **Step 5: Apply prototype presentation classes to existing generated detail blocks**

In `buildOrderTipFormulaSectionHtml()` and `buildLegacyFormulaSectionHtml()`, add `.tipout-formula-strip` to the existing formula wrapper. In `buildOrderTipDetailCardHtml()` and `buildLegacyDetailCardHtml()`, add `.tipout-allocation-group` to the existing rule/role cards and `.tipout-allocation-table` to their existing tables. Preserve all existing IDs, data attributes, inline event handlers, inputs, and value interpolation.

- [ ] **Step 6: Make summary return observable and safe**

Replace only `returnToSummary()`:

```js
function returnToSummary() {
  var params = getDetailUrlParams();
  if (params.from === 'summary' && params.return === 'history' && history.length > 1) history.back();
  else window.location.href = 'index.html';
}
```

- [ ] **Step 7: Add detail workspace CSS and verify both empty and populated states**

Use a `minmax(0, 1fr) 260px` grid above 1100px, collapse the rail below the main content at 1100px, style formula strips with `#f9f9fa`, and keep the sticky action bar above the viewport bottom with `16px` radius and backdrop blur. Keep `.tipout-detail-empty` inside the same main column and style it as a light content card with a black primary link.

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: PASS.

- [ ] **Step 8: Commit the detail restoration**

```bash
git add dist/TipOut/detail.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
git commit --only -m "feat: restore tipout allocation detail workspace" -- dist/TipOut/detail.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
```

---

### Task 4: Restore the Allocation Rules Table

**Files:**
- Modify: `dist/TipOut/rules.html:100-229`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: `ruleData.getRules()`, `ruleData.buildRuleDescription(rule)`, pool-kind helpers, current store filter, add/edit/copy/delete functions, and accessible actions menu.
- Produces: `renderRuleMetrics(rules)`, metric IDs `ruleCount`, `tipPoolCount`, `surchargePoolCount`, and table body `rulesTableBody`.

- [ ] **Step 1: Add failing derived-metric and table assertions**

```js
for (const id of ['ruleCount', 'tipPoolCount', 'surchargePoolCount', 'rulesTableBody']) {
  assert.match(rulesHtml, new RegExp('id="' + id + '"'));
}
assert.match(rulesHtml, /function renderRuleMetrics\(rules\)/);
assert.match(rulesHtml, /<table[^>]*class="[^"]*tipout-rules-table/);
assert.match(rulesHtml, /role="menu"/);
assert.doesNotMatch(rulesHtml, /生效中|待补录|需处理|规则版本|生效日期/);
```

- [ ] **Step 2: Run the verifier and confirm the rules contract fails**

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: FAIL because metrics and `rulesTableBody` are absent.

- [ ] **Step 3: Replace the rules-page content skeleton**

Use a page heading with description and black `新建规则`, followed by three metrics, the existing store filter, and a compact table:

```html
<div class="tipout-page-heading">
  <div><p class="tipout-kicker">规则管理</p><h1>分配规则</h1><p>配置当前门店的小费池来源、扣除方和接收方。</p></div>
  <div class="tipout-heading-actions"><button type="button" class="btn btn-primary" onclick="openAddRuleModal()">新建规则</button></div>
</div>
<div class="tipout-metric-strip tipout-metric-strip--three">
  <div><span>规则总数</span><strong id="ruleCount">0</strong></div>
  <div><span>小费池</span><strong id="tipPoolCount">0</strong></div>
  <div><span>加收服务费池</span><strong id="surchargePoolCount">0</strong></div>
</div>
<div class="tipout-compact-toolbar"><label for="storeFilter">门店</label><select id="storeFilter" class="form-control" onchange="renderRulesTable()"></select></div>
<div class="tipout-table-wrap"><table class="data-table tipout-rules-table"><thead><tr><th>规则与门店</th><th>池类型与规则摘要</th><th>分配说明</th><th>操作</th></tr></thead><tbody id="rulesTableBody"></tbody></table></div>
```

Keep the pool-type modal unchanged apart from fidelity classes inherited from the shared stylesheet.

- [ ] **Step 4: Render derived metrics and rule rows without changing storage actions**

```js
function renderRuleMetrics(rules) {
  var list = rules || [];
  document.getElementById('ruleCount').textContent = String(list.length);
  document.getElementById('tipPoolCount').textContent = String(list.filter(function(rule) { return rule.poolKind !== 'surcharge'; }).length);
  document.getElementById('surchargePoolCount').textContent = String(list.filter(function(rule) { return rule.poolKind === 'surcharge'; }).length);
}
```

In `renderRulesTable()`, filter the current `ruleData.getRules()` exactly as today, call `renderRuleMetrics(rules)`, then set each row's class to `tipout-rule-record` and `data-rule-id` to `rule.id`. Map rule name/store, pool-kind label/description, distribution description, and the unchanged edit plus accessible more-actions menu into the four cells. For no rules, render `<tr><td colspan="4"><div class="tipout-rule-empty" role="status">暂无规则，请点击「新建规则」创建</div></td></tr>`.

- [ ] **Step 5: Retain and verify menu keyboard behavior**

Keep `toggleRuleActions()`, outside-click close, Escape close, focus-first-action, and focus-return unchanged. Verify that the row markup still contains the `data-rule-id` ancestor expected by `copyRule()` and `deleteRule()`.

- [ ] **Step 6: Add rules table CSS, verify, and commit**

Style 48px headers, 64px records, 12px descriptions, subtle separators, no card gaps, and horizontal scroll below 900px. On mobile, render the same table as horizontally scrollable data rather than dropping any business column.

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: PASS.

```bash
git add dist/TipOut/rules.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
git commit --only -m "feat: restore tipout allocation rules table" -- dist/TipOut/rules.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
```

---

### Task 5: Restore the Card-Based Rule Editor

**Files:**
- Modify: `dist/TipOut/rule-add.html:426-650,1074-1215,5376-5665`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: every existing editor field ID, `applyPoolKindUi()`, `onAllocationModeChange()`, drawers/modals, `collectFormData()`, `cancelRule()`, and `submitRule()`.
- Produces: `#ruleEditorWorkspace`, `#ruleEditorMain`, `#ruleEditorContextRail`, `#ruleEditorActions`, and read-only `syncRuleEditorContext()`.

- [ ] **Step 1: Add failing editor-layout and business-boundary assertions**

```js
for (const id of ['ruleEditorWorkspace', 'ruleEditorMain', 'ruleEditorContextRail', 'ruleEditorActions']) {
  assert.match(editorHtml, new RegExp('id="' + id + '"'));
}
assert.doesNotMatch(editorHtml, /class="tipout-rule-section-nav"/);
assert.match(editorHtml, /function syncRuleEditorContext\(\)/);
assert.match(editorHtml, /class="[^"]*tipout-form-card/);
for (const handler of ['openDrawer', 'closeDrawer', 'collectFormData', 'submitRule', 'cancelRule']) {
  assert.match(editorHtml, new RegExp('function ' + handler + '\\('));
}
assert.doesNotMatch(editorHtml, /effectiveDate|ruleVersion|saveDraft|auditLog|ruleStatus/);
```

Because `openDrawer` and `closeDrawer` live in `common.js`, assert those two against `common.js` instead of `editorHtml` when implementing the test.

- [ ] **Step 2: Run the verifier and confirm the editor contract fails**

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: FAIL on the new workspace and context rail and because the old section navigator still exists.

- [ ] **Step 3: Replace only the editor page shell and wrappers**

Remove `.tipout-rule-section-nav`, add a heading with a normal back link and a black submit button, and change only the wrapper tags around the existing field sections:

```html
<div class="tipout-page-heading tipout-page-heading--with-back">
  <a class="btn" href="rules.html">返回规则列表</a>
  <div><p class="tipout-kicker">规则配置</p><h1 id="pageTitle">小费分配规则</h1><p>配置现有小费池来源、扣除方、接收方和分配口径。</p></div>
  <div class="tipout-heading-actions"><button class="btn btn-primary" onclick="submitRule()">保存规则</button></div>
</div>
<div class="tipout-workspace has-aside" id="ruleEditorWorkspace">
  <main class="tipout-editor-main" id="ruleEditorMain"></main>
  <aside class="tipout-context-rail" id="ruleEditorContextRail" aria-label="当前规则上下文"></aside>
</div>
<div class="tipout-sticky-actions" id="ruleEditorActions">
  <span>规则字段与保存逻辑保持不变</span>
  <button class="btn" onclick="cancelRule()">取消</button>
  <button class="btn btn-primary" onclick="submitRule()">提交</button>
</div>
```

Move the existing section nodes into `#ruleEditorMain` in their current order. Change the opening tags for `ruleSectionBasic`, `sharedPoolRulesSection`, `allocationModeSection`, `deductRulesSection`, `legacyReceiversSection`, `orderTipClaimsSection`, and `orderResidualSection` from `class="form-section"` to `class="form-section tipout-form-card"`; add `tipout-form-card` to `distributionSection`. Keep every child node, ID, input name, value, and inline handler byte-for-byte unchanged while moving the wrappers.

- [ ] **Step 4: Make the basic fields two-column and all complex sections full-width**

Wrap the existing `ruleName` and `storeSelect` form groups in `.tipout-form-grid`; apply `grid-template-columns: repeat(2, minmax(0, 1fr))` above 900px and one column below. Do not move tables, condition cards, or dynamic rule containers into a two-column grid.

- [ ] **Step 5: Add a read-only live context rail**

```js
function syncRuleEditorContext() {
  var rail = document.getElementById('ruleEditorContextRail');
  if (!rail) return;
  var name = (document.getElementById('ruleName') || {}).value || '未命名规则';
  var store = (document.getElementById('storeSelect') || {}).value || '未选择门店';
  var mode = (document.querySelector('input[name="allocationMode"]:checked') || {}).value || 'legacy_pool';
  var modeLabel = mode === 'order_tip_then_residual' ? '计提小费占比分配' : '小费池汇总分配';
  rail.innerHTML =
    '<section><span>规则名称</span><strong>' + escapeHtmlText(name) + '</strong></section>' +
    '<section><span>门店</span><strong>' + escapeHtmlText(store) + '</strong></section>' +
    '<section><span>池类型</span><strong>' + (isSurchargePoolKind() ? '加收服务费池' : '小费池') + '</strong></section>' +
    '<section><span>分配模式</span><strong>' + modeLabel + '</strong></section>';
}
```

Call this after `applyPoolKindUi()`, after loading an edit record, and from a delegated `input`/`change` listener for `#ruleName`, `#storeSelect`, and `input[name="allocationMode"]`. It must never alter field values or serialized data.

- [ ] **Step 6: Preserve allocation-mode visibility and serializer behavior**

Do not change `onAllocationModeChange(skipEnsureClaimRow)`, `collectFormData()`, or field names. Keep `legacyAllocationSections` and `orderTipAllocationSection` as the same show/hide targets; only add fidelity classes. Remove static verifier expectations for `scrollToRuleSection()` and `syncRuleSectionNavigator()` only after their navigation markup is removed; leaving the unused functions is acceptable if they remain harmless.

- [ ] **Step 7: Add editor CSS, verify both modes, and commit**

Use the same `minmax(0,1fr) 260px` desktop grid, 20px-radius light cards, 20px card padding, 16px vertical gaps, sticky bottom actions, one-column form fields below 900px, and context rail below content under 1100px. Ensure drawers remain above the sticky bar through their existing z-index.

Run: `npm.cmd run verify:tipout-interaction-refresh`

Expected: PASS, including the unchanged field-ID and prohibited-business-term assertions.

```bash
git add dist/TipOut/rule-add.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
git commit --only -m "feat: restore tipout rule editor workspace" -- dist/TipOut/rule-add.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs
```

---

### Task 6: Browser Regression, Same-Image QA, and Final Build Gate

**Files:**
- Create: `design-qa.md`
- Modify only if QA finds a defect: `dist/TipOut/prototype-fidelity.css`, `dist/TipOut/index.html`, `dist/TipOut/detail.html`, `dist/TipOut/rules.html`, `dist/TipOut/rule-add.html`, `dist/TipOut/tipout-summary-ui.js`, `scripts/verify-tipout-interaction-refresh.mjs`

**Interfaces:**
- Consumes: reference screenshots `01-reference-start.png`, `03-reference-detail.png`, `04-reference-rules.png`, `05-reference-rule-editor.png`; local routes under `http://127.0.0.1:5173/TipOut/`.
- Produces: implementation captures, same-image comparisons, tested interaction evidence, a clean console result, and `design-qa.md` with exact `final result: passed`.

- [ ] **Step 1: Run automated regression before visual QA**

Run:

```bash
npm.cmd run verify:tipout-interaction-refresh
npm.cmd run verify:tipout-work-hours-layout
```

Expected: both commands exit `0`. Defer the full build to the isolated clean-worktree gate in Step 6 so the repository's unrelated dirty generated files are not overwritten.

- [ ] **Step 2: Open the four implementation routes in the Codex Desktop in-app Browser**

Use these exact routes at a 1280×720 viewport:

```text
http://127.0.0.1:5173/TipOut/index.html?qa=prototype-fidelity-final
http://127.0.0.1:5173/TipOut/detail.html?date=2026-01-03&store=Golden%20Dragon%20Chinese%20Kitchen%20-%20Dallas%2C%20TX%2075231&from=summary&return=history&qa=prototype-fidelity-final
http://127.0.0.1:5173/TipOut/rules.html?qa=prototype-fidelity-final
http://127.0.0.1:5173/TipOut/rule-add.html?poolKind=tip&qa=prototype-fidelity-final
```

Capture each page into `C:\Users\27273\.codex\visualizations\2026\08\31\01a05691-1562-70c1-a8da-ee58e4b8e18f\tipout-fidelity-qa\` as `implementation-summary.png`, `implementation-detail.png`, `implementation-rules.png`, and `implementation-rule-editor.png`.

- [ ] **Step 3: Exercise the core interactions and inspect console errors**

Test all of the following in the rendered pages:

```text
Summary: change date/store/role/employee; allocate; cancel; open export; click a date row by mouse and keyboard.
Return: normal detail return restores state; refreshed detail uses both URL markers; copied detail URL in a fresh tab falls back to index; missing summary state leaves defaults intact.
Detail: update data; open formula; change hours/ratio; add/remove a row; fold/unfold; save; save-and-next.
Rules: filter store; open/close action menu; Escape returns focus; copy; delete through confirmation; open new-rule pool-type modal.
Editor: create and edit; switch legacy_pool/order_tip_then_residual; open representative drawers/modals; submit and cancel; verify context rail only mirrors values.
Responsive: 1280×720 and a mobile viewport have no hidden actions, obscured focus, or unreadable compressed tables.
```

After each route, inspect browser console output and record zero uncaught errors. Restore test-mutated localStorage to its pre-test values before final capture.

- [ ] **Step 4: Build four same-image comparisons and run the design-QA loop**

For each route, combine the matching reference and implementation capture in one image at equal scale. Compare the full view and focused regions for shell, heading/metrics, filters/tables, editor cards, context rails, typography, spacing, tokens, icon treatment, and copy. Record every P0/P1/P2 issue in `design-qa.md`, fix it, recapture at the same viewport/state, and compare again. Do not hand off while any actionable P0/P1/P2 remains.

After the comparison reaches zero P0/P1/P2 findings, commit any QA-driven source fixes with only the affected TipOut files and verifier staged:

```bash
git add dist/TipOut/prototype-fidelity.css dist/TipOut/index.html dist/TipOut/detail.html dist/TipOut/rules.html dist/TipOut/rule-add.html dist/TipOut/tipout-summary-ui.js scripts/verify-tipout-interaction-refresh.mjs
git commit --only -m "style: close tipout fidelity gaps" -- dist/TipOut/prototype-fidelity.css dist/TipOut/index.html dist/TipOut/detail.html dist/TipOut/rules.html dist/TipOut/rule-add.html dist/TipOut/tipout-summary-ui.js scripts/verify-tipout-interaction-refresh.mjs
```

- [ ] **Step 5: Write the blocking QA report**

Create `design-qa.md` with:

```markdown
**Source visual truth**
- Paths to the four reference captures.

**Implementation evidence**
- Paths to the four final implementation captures and four combined comparisons.
- Viewport: 1280×720 CSS px; deviceScaleFactor and source/implementation pixel dimensions.
- State and localStorage setup for each page.

**Full-view comparison**
- Shell, hierarchy, and density results for all four pages.

**Focused-region comparison**
- Typography, spacing, colors, controls, tables, context rails, and sticky actions.

**Interaction and console checks**
- The exact paths tested and zero uncaught console errors.

**Comparison history**
- Each P0/P1/P2 finding, fix, and post-fix evidence.

**Follow-up polish**
- Remaining P3 items only.

final result: passed
```

- [ ] **Step 6: Re-run gates and commit the verified result**

Run the two verifiers in the current workspace. Then create a detached build worktree at the explicit visualization path below, connect it to the existing dependency directory, and run the repository's real build there so build-stamp and generated-output writes cannot alter unrelated user work in the current workspace:

```powershell
npm.cmd run verify:tipout-interaction-refresh
npm.cmd run verify:tipout-work-hours-layout
$qaWorktree = 'C:\Users\27273\.codex\visualizations\2026\08\31\01a05691-1562-70c1-a8da-ee58e4b8e18f\tipout-build-worktree'
$qaRoot = 'C:\Users\27273\.codex\visualizations\2026\08\31\01a05691-1562-70c1-a8da-ee58e4b8e18f'
git worktree add --detach $qaWorktree HEAD
New-Item -ItemType Junction -Path (Join-Path $qaWorktree 'node_modules') -Target (Join-Path (Get-Location) 'node_modules')
Push-Location $qaWorktree
npm.cmd run build
Pop-Location
$resolvedQaWorktree = (Resolve-Path -LiteralPath $qaWorktree).Path
if (-not $resolvedQaWorktree.StartsWith($qaRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected QA worktree path' }
git worktree remove --force $resolvedQaWorktree
```

Expected: both verifiers and the isolated `npm.cmd run build` exit `0`; the resolved cleanup target is inside the named visualization root; `design-qa.md` ends with exactly `final result: passed`.

```bash
git add design-qa.md
git commit --only -m "test: verify tipout prototype fidelity" -- design-qa.md
```
