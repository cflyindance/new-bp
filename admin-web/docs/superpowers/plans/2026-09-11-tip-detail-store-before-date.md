# Tip Detail Store Before Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the tip-allocation detail context fields to “门店 → 日期” while preserving their desktop widths, mobile behavior, events, and business logic.

**Architecture:** Move the existing store wrapper before the existing date wrapper in the HTML and add stable semantic classes to both wrappers. Replace the position-dependent desktop width selector with semantic class selectors; leave program logic untouched because it reads controls by ID.

**Tech Stack:** HTML template, scoped CSS, Node.js source-contract verification, Vite.

**Spec:** `docs/superpowers/specs/2026-09-11-tip-detail-store-before-date-design.md`

## Global Constraints

- DOM, visual, keyboard, and screen-reader order must be store then date.
- Desktop width is 260px for store and 200px for date.
- At 768px and below both fields remain full width, with store above date.
- Preserve `storeSelect`, `detailDate`, their options/defaults/onchange handlers, URL context, calculations, allocation, manual hours, storage, functions, and routes.
- Do not stage unrelated dirty generated files.

---

### Task 1: Lock and implement the semantic field order

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs:50-70`
- Modify: `src/team/tips/templates/details.html:159-170`
- Modify: `src/team/tips/tips-page.css:2002-2021`

**Interfaces:**
- Consumes: existing `renderDetailPage()`, `storeSelect`, `detailDate`, and `tipout-detail-context-bar`.
- Produces: store-first DOM order and semantic width classes without JavaScript changes.

- [ ] **Step 1: Add failing DOM-order and handler assertions**

```js
const detailContextStart = detailTemplate.indexOf('class="tipout-detail-context-bar"');
const detailContextEnd = detailTemplate.indexOf('</div>\n\n        <div id="detailMain"', detailContextStart);
const detailContext = detailTemplate.slice(detailContextStart, detailContextEnd);
const storeFieldIndex = detailContext.indexOf('class="filter-field tipout-detail-store-field"');
const dateFieldIndex = detailContext.indexOf('class="filter-field tipout-detail-date-field"');
if (!(storeFieldIndex >= 0 && dateFieldIndex > storeFieldIndex)) failures.push("detail: context field order must be store then date");
for (const token of [
  'id="storeSelect"',
  'id="detailDate"',
  'data-native-onchange="renderDetailPage()"',
]) {
  if (!detailContext.includes(token)) failures.push(`detail: context contract missing ${token}`);
}
```

- [ ] **Step 2: Add failing semantic-width assertions**

```js
const storeWidthRule = pageCss.match(/\.tipout-page-detail \.tipout-detail-store-field\s*\{([^}]*)\}/)?.[1] ?? "";
const dateWidthRule = pageCss.match(/\.tipout-page-detail \.tipout-detail-date-field\s*\{([^}]*)\}/)?.[1] ?? "";
for (const token of ["width: 260px", "max-width: 260px"]) if (!storeWidthRule.includes(token)) failures.push(`detail: store width missing ${token}`);
for (const token of ["width: 200px", "max-width: 200px"]) if (!dateWidthRule.includes(token)) failures.push(`detail: date width missing ${token}`);
if (pageCss.includes(".tipout-page-detail .tipout-detail-context-bar .filter-field:nth-child(2)")) failures.push("detail: field width must not depend on DOM position");
```

- [ ] **Step 3: Run the verifier and confirm failure**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL for missing semantic classes and width rules.

- [ ] **Step 4: Reorder the two existing wrappers and add semantic classes**

```html
<div class="tipout-detail-context-bar">
  <div class="filter-field tipout-detail-store-field">
    <label for="storeSelect">门店</label>
    <select id="storeSelect" class="form-control" data-native-onchange="renderDetailPage()">
      <option value="">请选择门店</option>
    </select>
  </div>
  <div class="filter-field tipout-detail-date-field">
    <label for="detailDate">日期</label>
    <input type="date" id="detailDate" class="form-control" value="2026-01-03" data-native-onchange="renderDetailPage()">
  </div>
</div>
```

- [ ] **Step 5: Replace the position-dependent CSS with semantic widths**

```css
.tipout-page-detail .tipout-detail-context-bar .filter-field {
  gap: 6px;
}

.tipout-page-detail .tipout-detail-store-field {
  width: 260px;
  max-width: 260px;
}

.tipout-page-detail .tipout-detail-date-field {
  width: 200px;
  max-width: 200px;
}
```

Keep the existing mobile selector that sets all context-bar filter fields to `width: 100%` and `max-width: none`.

- [ ] **Step 6: Run focused verification and production build**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: exit code 0; existing bundle-size warnings are acceptable.

- [ ] **Step 7: Browser-check desktop and mobile behavior**

Open a tip-allocation detail page and verify store appears left of date, the store remains visibly wider, changing either field still refreshes the same detail content, and the URL context remains valid. At 768px or narrower verify store is above date and both controls fill the available width.

- [ ] **Step 8: Commit only focused files**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/details.html src/team/tips/tips-page.css
git commit -m "feat: place tip detail store before date"
```

## Self-Review

- Spec coverage: the task covers DOM/accessibility order, stable semantic sizing, mobile full width, unchanged handlers and business logic, verification, build, and browser checks.
- Placeholder scan: every code change and command is explicit; no deferred implementation remains.
- Type consistency: no JavaScript interface or identifier is added or renamed.
