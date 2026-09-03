# Simplify Team Tips Headings and Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the tip-detail summary rail and the requested helper copy from three Team Tips page headings without changing business behavior.

**Architecture:** Edit the standalone `dist/TipOut` HTML/CSS sources first, then regenerate the native Team Tips templates, page programs, and combined stylesheet with the existing generator. Strengthen the existing verifier with positive business-entry assertions and negative removed-markup/script/style assertions.

**Tech Stack:** Static HTML/CSS/JavaScript, generated native templates, Node.js verification scripts, TypeScript/Vite host application.

**Spec:** `docs/superpowers/specs/2026-09-03-remove-tip-detail-summary-design.md`

## Global Constraints

- Preserve existing date/store selection, detail rendering, save, save-and-next, return, and rule-management behavior.
- Treat `dist/TipOut` as the generation source and `src/team/tips` as generated native embed output.
- Remove only the requested heading helper copy and detail summary rail; retain main page titles and action buttons.

---

### Task 1: Add regression assertions

**Files:**
- Modify: `scripts/verify-team-tips-native-views.mjs`

**Interfaces:**
- Consumes: generated files under `src/team/tips` and source files under `dist/TipOut`.
- Produces: a verifier that exits nonzero when removed UI returns or required business controls disappear.

- [ ] **Step 1: Add negative and positive assertions**

Check source/detail template/detail program for `detailContextRail`, detail `has-aside`, and `renderDetailContextRail`; check detail CSS selectors are absent. Check `detailDate`, `storeSelect`, `detailRulesContainer`, `returnToSummary()`, `saveDetail()`, and `saveAndNext()` remain. Check the six requested heading strings are absent from source and generated templates.

- [ ] **Step 2: Run the verifier and confirm it fails**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because the summary rail and helper copy still exist.

### Task 2: Remove source UI and regenerate native views

**Files:**
- Modify: `dist/TipOut/detail.html`
- Modify: `dist/TipOut/index.html`
- Modify: `dist/TipOut/rules.html`
- Modify: `dist/TipOut/rule-add.html`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Regenerate: `src/team/tips/templates/*.html`
- Regenerate: `src/team/tips/programs/*.js.txt`
- Regenerate: `src/team/tips/tips-page.css`

**Interfaces:**
- Consumes: generator contract in `scripts/generate-team-tips-native-views.mjs`.
- Produces: standalone and native Team Tips pages with identical simplified UI.

- [ ] **Step 1: Remove the detail summary rail**

Change `detailWorkspace` to a single-column workspace, delete `detailContextRail`, delete the `renderDetailContextRail(...)` call and function, and delete only `.tipout-page-detail` rail/two-column CSS.

- [ ] **Step 2: Remove requested heading copy**

Delete the kicker and description paragraphs surrounding the existing main title in distribution, rules, and rule editor sources. Keep each `h1`, return control, and heading action container.

- [ ] **Step 3: Regenerate native views**

Run: `node scripts/generate-team-tips-native-views.mjs`

Expected: `Generated four native Team Tips templates and page programs.`

- [ ] **Step 4: Run automated checks**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: `Team tips native view verification passed.`

Run: `npm.cmd exec tsc -- --noEmit`

Expected: exit code 0.

Run: `git diff --check`

Expected: no whitespace errors.

### Task 3: Browser regression and commit

**Files:**
- Verify: `http://127.0.0.1:5174/#/team/tips/distribution`
- Verify: `http://127.0.0.1:5174/#/team/tips/details`
- Verify: `http://127.0.0.1:5174/#/team/tips/rules`
- Verify: `http://127.0.0.1:5174/#/team/tips/rules/editor?poolKind=tip`

**Interfaces:**
- Consumes: the running Vite application on port 5174.
- Produces: visual and interaction evidence for the changed pages.

- [ ] **Step 1: Verify visual removals**

Confirm the detail rail and its blank column are absent; confirm the six helper strings are absent while all main titles and actions remain.

- [ ] **Step 2: Verify key interactions and console**

Exercise return/navigation and available date/store/detail actions without mutating unrelated data. Confirm no console errors.

- [ ] **Step 3: Commit the implementation**

```bash
git add dist/TipOut src/team/tips scripts/verify-team-tips-native-views.mjs
git commit -m "refactor: simplify native tips page chrome"
```
