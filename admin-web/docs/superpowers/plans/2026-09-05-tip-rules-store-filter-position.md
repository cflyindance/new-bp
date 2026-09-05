# Tip Rules Store Filter Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the existing native tip-rules store filter above the rule metrics strip without changing filtering, metrics, or rule-list behavior.

**Architecture:** Keep the existing toolbar node and all identifiers intact, and change only its position in the native rules template. Extend the existing static native-view verifier so DOM order, filter uniqueness, and event binding are regression protected.

**Tech Stack:** Native HTML template, Node.js static verification script.

**Spec:** `docs/superpowers/specs/2026-09-05-tip-rules-store-filter-position-design.md`

## Global Constraints

- The target order is heading → `tipout-rules-toolbar` → `tipout-metric-strip--three` → rules table.
- Keep exactly one `id="storeFilter"`.
- Preserve `data-native-onchange="renderRulesTable()"`.
- Do not change store options, selected state, metrics calculations, rule filtering, or rule actions.
- Do not modify the legacy `dist/TipOut` page.

---

### Task 1: Move the store filter and lock the order with a regression test

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`
- Modify: `src/team/tips/templates/rules.html`

**Interfaces:**
- Consumes: the existing `storeFilter` element and `renderRulesTable()` handler.
- Produces: the same filter contract, positioned before the rules metrics strip.

- [ ] **Step 1: Add a failing native-template order test**

After loading `src/team/tips/templates/rules.html`, add checks equivalent to:

```js
const rulesTemplate = fs.readFileSync("src/team/tips/templates/rules.html", "utf8");
const rulesHeadingIndex = rulesTemplate.indexOf("tipout-page-heading--with-back");
const rulesToolbarIndex = rulesTemplate.indexOf("tipout-rules-toolbar");
const rulesMetricsIndex = rulesTemplate.indexOf("tipout-metric-strip--three");
const rulesTableIndex = rulesTemplate.indexOf("tipout-rules-table");

if (!(rulesHeadingIndex < rulesToolbarIndex && rulesToolbarIndex < rulesMetricsIndex && rulesMetricsIndex < rulesTableIndex)) {
  failures.push("rules: store filter must appear between heading and metrics");
}
assert.equal((rulesTemplate.match(/id="storeFilter"/g) || []).length, 1);
if (!rulesTemplate.includes('id="storeFilter" data-native-onchange="renderRulesTable()"')) {
  failures.push("rules: store filter binding changed");
}
```

- [ ] **Step 2: Run the verifier and preserve RED evidence**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL with `rules: store filter must appear between heading and metrics` because the toolbar currently follows the metrics strip.

- [ ] **Step 3: Move the existing toolbar before the metrics strip**

In `src/team/tips/templates/rules.html`, move this existing block unchanged:

```html
<div class="tipout-compact-toolbar tipout-rules-toolbar">
  <label class="filter-field-label" for="storeFilter">门店</label>
  <select class="form-control" id="storeFilter" data-native-onchange="renderRulesTable()">
    <option value="">全部门店</option>
  </select>
</div>
```

Place it immediately after the closing tag of `tipout-page-heading--with-back` and immediately before `tipout-metric-strip--three`. Do not duplicate or edit the block.

- [ ] **Step 4: Run focused verification**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS.

- [ ] **Step 5: Verify the native page in the browser**

Open `http://127.0.0.1:5174/#/team/tips/rules` and verify:

1. The store filter appears below the title/actions and above the three metrics.
2. There is exactly one visible store selector.
3. Changing stores still updates both metrics and rule rows.

- [ ] **Step 6: Commit the implementation**

```bash
git add scripts/verify-team-tips-native-views.mjs src/team/tips/templates/rules.html
git commit -m "fix: move rules store filter above metrics"
```
