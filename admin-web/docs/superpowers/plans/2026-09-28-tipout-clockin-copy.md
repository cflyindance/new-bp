# TipOut Clock-in Copy Implementation Plan

> **For agentic workers:** Execute this single task inline or with a delegated reviewer. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current rule editor's clock-in title and helper sentence with the approved copy.

**Architecture:** Edit only static text in the current application template. Add a focused native-view contract check and browser assertion; do not touch legacy static prototype, rule data, or clock-in behavior.

**Tech Stack:** Vite, legacy HTML template, Node native-view verification, Playwright browser regression.

**Spec:** `docs/superpowers/specs/2026-09-28-tipout-clockin-copy-design.md`

## Global Constraints

- Title is exactly `员工打卡方式` without `（单选）`.
- Helper text is exactly `未打卡员工需每日在小费分配明细中手动补录`.
- `小费分配方式（单选）`, the radio controls, field help icon and custom help text behavior remain unchanged.
- Do not modify `dist/TipOut/rule-add.html` or other legacy prototype files.

---

### Task 1: Change current rule-editor copy

**Files:**
- Modify: `src/team/tips/templates/rule-editor.html` — two visible text nodes.
- Test: `scripts/verify-team-tips-native-views.mjs` — static exact text assertions.
- Test: `scripts/verify-tipout-quick-allocation-browser.cjs` — rendered current editor text.

**Interfaces:**
- Consumes existing `field-desc-wrap[data-field-id="clockin"]` and its adjacent `.field-desc`.
- Produces the approved visible text without changing element IDs, classes, event bindings, or radio values.

- [x] **Step 1: Add failing tests.** Assert the current template contains `data-field-id="clockin">员工打卡方式 <span` and `<p class="field-desc">未打卡员工需每日在小费分配明细中手动补录</p>`; assert the old helper and `员工打卡方式（单选）` are absent. In the browser fixture, mount `rule-editor`, assert the clock-in title and helper exact text, and confirm the distribution-method title still includes `（单选）`.
- [x] **Step 2: Run RED.** Run `node scripts/verify-team-tips-native-views.mjs` and the browser regression; both should fail on the old clock-in copy.
- [x] **Step 3: Update the template.** Replace only the `clockin` title text and following `.field-desc` content. Keep `data-field-id`, icon attributes, radio markup and distribution-method section unchanged.
- [x] **Step 4: Run GREEN.** Re-run the two tests, `tsc --noEmit`, and scoped `git diff --check`. Inspect the diff to ensure no legacy prototype or behavior files changed.
- [x] **Step 5: Commit local main only.** Stage only the template, the two tests and this plan; preserve unrelated dirty files and do not push without a separate request.
