# Buffet Dual Measure Full-Width Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dish-set piece and SPU measure cards fill the quota dialog as an equal two-column row while retaining a usable narrow-screen layout.

**Architecture:** Keep the existing HTML and data flow unchanged. Adjust only the dish-set grid CSS, update the source-level layout regression, and verify the rendered dialog at three viewport widths.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js assertion scripts, local in-app browser.

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-dual-measure-full-width-layout-design.md`

## Global Constraints

- The current dish-set description occupies its own row.
- At viewport widths greater than `720px`, the measure cards are equal-width columns that fill the content area.
- At viewport widths less than or equal to `720px`, both cards and their internal fields become one column.
- Do not change quota data, validation, persistence, or summary behavior.
- Do not modify or commit unrelated generated files.

---

### Task 1: Lock the layout contract in regression coverage

**Files:**
- Modify: `scripts/verify-buffet-dual-measure-editor.mjs`
- Test: `scripts/verify-buffet-dual-measure-editor.mjs`

**Interfaces:**
- Consumes: CSS selectors `.olf-v4-target-row--dish-set`, `.olf-dish-set-measures`, `.olf-dish-set-measure__fields`.
- Produces: source-level assertions for the desktop and `720px` layout contract.

- [ ] **Step 1: Write the failing assertions**

```js
assert.match(css, /\.olf-v4-target-row--dish-set\{[^}]*grid-template-columns:1fr/);
assert.match(css, /\.olf-dish-set-measures\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(css, /@media\(max-width:720px\)\{[^}]*\.olf-dish-set-measures\{grid-template-columns:1fr\}/);
assert.doesNotMatch(css, /@media\(max-width:900px\)\{[^}]*\.olf-dish-set-measures/);
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node scripts/verify-buffet-dual-measure-editor.mjs`

Expected: FAIL because the current parent grid reserves a `180–260px` column and the narrow-screen rule uses `900px`.

### Task 2: Implement the full-width responsive layout

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.css:1119`
- Test: `scripts/verify-buffet-dual-measure-editor.mjs`

**Interfaces:**
- Consumes: the existing unchanged dish-set markup.
- Produces: one-column parent grid, two equal measure columns above `720px`, and one measure column at or below `720px`.

- [ ] **Step 1: Apply the minimal CSS change**

```css
.olf-v4-target-row--dish-set{align-items:flex-start;display:grid;grid-template-columns:1fr;gap:16px}
.olf-dish-set-measures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:100%}
@media(max-width:720px){.olf-dish-set-measures{grid-template-columns:1fr}.olf-dish-set-measure__fields{grid-template-columns:1fr}}
```

- [ ] **Step 2: Run the focused regression**

Run: `node scripts/verify-buffet-dual-measure-editor.mjs`

Expected: PASS.

- [ ] **Step 3: Run all buffet regressions**

Run:

```powershell
$failed=@(); Get-ChildItem scripts -Filter 'verify-buffet-*.mjs' | Sort-Object Name | ForEach-Object { node $_.FullName; if($LASTEXITCODE -ne 0){$failed += $_.Name} }; if($failed.Count){ exit 1 }
```

Expected: every buffet verification passes.

### Task 3: Browser acceptance and commit

**Files:**
- Verify: `dist/Configuration center/buffet-rule-editor.html`
- Commit: CSS, regression script, and this implementation plan.

**Interfaces:**
- Consumes: local server at `http://127.0.0.1:5181` and the existing dual-measure draft.
- Produces: visible layout evidence at `1024px`, `800px`, and `720px`.

- [ ] **Step 1: Verify at `1024px`**

Expected: description on its own row; cards on one equal two-column row; no horizontal overflow.

- [ ] **Step 2: Verify at `800px`**

Expected: cards remain on one equal two-column row, proving the obsolete `900px` behavior is gone.

- [ ] **Step 3: Verify at `720px`**

Expected: cards and internal fields become one column; no horizontal overflow.

- [ ] **Step 4: Restore the normal viewport and commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-dual-measure-editor.mjs docs/superpowers/plans/2026-09-21-buffet-dual-measure-full-width-layout.md
git commit -m "style: expand buffet dual measure cards"
```

Expected: only the intended files are committed; unrelated generated-file status remains untouched.
