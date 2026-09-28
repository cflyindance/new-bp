# TipOut Rule List Columns Implementation Plan

> **For agentic workers:** Execute this single scoped task inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show rule name by default in its own column and store in a separate column on the TipOut rule list.

**Architecture:** Keep the existing `ruleName` and `store` values, filtering, validation, and actions. Change only the rules template header, row renderer, empty-state colspan, and table column widths. Extend the existing browser regression that mounts the native rules view.

**Tech Stack:** Vite, TypeScript shell, legacy JavaScript rule renderer, CSS, Playwright browser regression.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-rule-list-columns-design.md`

## Global Constraints

- Column order: 规则名称、门店、池类型与规则摘要、分配说明、操作.
- Rule name is the primary, bold first-column text. Store is plain second-column text.
- Keep invalid-reference badges beside the rule name and the existing explanation in the description column.
- No data migration, rule algorithm, filter, or action changes.

---

### Task 1: Split rule identity into two table cells

**Files:**
- Modify: `src/team/tips/templates/rules.html`
- Modify: `src/team/tips/programs/rules.js.txt`
- Modify: `src/team/tips/tips-page.css`
- Test: `scripts/verify-tipout-quick-allocation-browser.cjs`

**Interfaces:**
- Consumes: `rule.ruleName`, `rule.store`, `TipOutRosterDirectory.validateRuleReferences` from the existing renderer.
- Produces: five header cells and five matching data cells per rule row; no JavaScript API changes.

- [x] **Step 1: Add a failing browser assertion.** After `mountRulesTest()`, assert header text equals `['规则名称','门店','池类型与规则摘要','分配说明','操作']`, the first row has five `td` elements, its first `td` contains `.tipout-rule-name`, and its second `td` contains `.tipout-rule-store`. In an empty filtered result, assert the empty `td` has `colspan="5"`.

  ```js
  assert.deepEqual(await page.locator('.tipout-rules-table thead th').allTextContents(), ['规则名称','门店','池类型与规则摘要','分配说明','操作']);
  const firstRule = page.locator('#rulesTableBody tr.tipout-rule-record').first();
  assert.equal(await firstRule.locator('td').count(), 5);
  assert.equal(await firstRule.locator('td:nth-child(1) .tipout-rule-name').count(), 1);
  assert.equal(await firstRule.locator('td:nth-child(2) .tipout-rule-store').count(), 1);
  ```
- [x] **Step 2: Run `scripts/verify-tipout-quick-allocation-browser.cjs` and confirm the new assertion fails against the combined column.**
- [x] **Step 3: Update the template to five headers, split the renderer's first cell into a name/status cell plus store cell, set empty `colspan` to 5, and change CSS widths for all five columns.** Preserve escaping and existing status/actions markup.

  ```html
  <th>规则名称</th><th>门店</th><th>池类型与规则摘要</th><th>分配说明</th><th>操作</th>
  ```

  ```js
  '<td><div class="tipout-rule-identity"><strong class="tipout-rule-name">' + escapeHtml(rule.ruleName || '') + '</strong>' + statusBadge + '</div></td>' +
  '<td><span class="tipout-rule-store">' + escapeHtml(rule.store || '') + '</span></td>'
  ```
- [x] **Step 4: Run the browser regression, `node scripts/verify-tipout-interaction-refresh.mjs`, and `tsc --noEmit`; inspect the rules view at a standard desktop width.** Browser regression, native-view verification, and type check pass. The older interaction-refresh script fails on its unrelated `pendingDateCount` expectation in legacy summary HTML; this change does not touch that HTML.
- [ ] **Step 5: Stage only the four task files plus this plan and commit on local `main`.**

  ```bash
  git add -- admin-web/src/team/tips/templates/rules.html admin-web/src/team/tips/programs/rules.js.txt admin-web/src/team/tips/tips-page.css admin-web/scripts/verify-tipout-quick-allocation-browser.cjs admin-web/docs/superpowers/plans/2026-09-28-tipout-rule-list-columns.md
  git commit -m "feat(tipout): split rule name and store columns"
  ```
