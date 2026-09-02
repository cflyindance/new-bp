# Team Payroll Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `/team/payroll-report` to the supplied Payroll design while fixing mouse-wheel scrolling and preserving all existing fields and behavior.

**Architecture:** Keep generated legacy CSS unchanged and inject a focused `payroll-polish.css` after it inside the existing Shadow Root. Make the route panel the sole non-modal vertical scroll owner, use the polish layer for deterministic component dimensions, and validate the cascade with static and browser checks.

**Tech Stack:** TypeScript, Vite raw CSS imports, Shadow DOM, CSS, Node verification scripts, in-app browser automation.

**Spec:** `docs/superpowers/specs/2026-09-02-team-payroll-visual-polish-design.md`

## Global Constraints

- Preserve the main sidebar and top account header.
- Do not change Payroll fields, business calculations, data sources, save behavior, export behavior, or modal behavior.
- `payroll-polish.css` may use only `:host` and `.team-payroll-page…` scoped selectors; no `@import`, `html`, `body`, or unscoped selectors.
- `[data-team-payroll-scroll]` is the sole non-modal vertical scroll owner.
- Only attendance table wrappers may create page-content horizontal scrolling.
- Supported browser viewports: 1687×1000, 1440×900, and 1024×768.

---

### Task 1: Lock the CSS cascade and scroll contract

**Files:**
- Create: `scripts/verify-team-payroll-polish.mjs`
- Modify: `src/main.ts`
- Modify: `src/team/payroll-page.ts`
- Create: `src/team/payroll/payroll-polish.css`

**Interfaces:**
- Consumes: `mountPayrollPage(container, context)` and the existing generated `payroll-page.css`.
- Produces: `[data-team-payroll-scroll]` route container and an ordered `payrollCss` → `payrollPolishCss` injection.

- [ ] **Step 1: Write the failing verifier**

Create a Node verifier that asserts:

```js
const main = read("src/main.ts");
const mount = read("src/team/payroll-page.ts");
const polish = read("src/team/payroll/payroll-polish.css");
assert(main.includes("data-team-payroll-scroll"));
assert(mount.indexOf("payrollCss") < mount.indexOf("payrollPolishCss"));
assert(polish.includes(":host"));
assert(polish.includes(".team-payroll-page.payroll-workspace-active .payroll-workspace-main"));
assert(!/@import|(^|[}\n])\s*(html|body|\*)\b/m.test(polish));
```

- [ ] **Step 2: Run the verifier and confirm RED**

Run: `node scripts/verify-team-payroll-polish.mjs`

Expected: FAIL because the polish stylesheet and scroll marker do not exist.

- [ ] **Step 3: Implement the scroll ownership**

Change the native route wrapper to:

```html
<div data-team-payroll-scroll class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#f3f4f6]">
  <div class="block min-h-full min-w-0" data-team-payroll-root></div>
</div>
```

Import `payroll-polish.css?raw` and inject it after `payroll-page.css`. Begin the polish CSS with exact height-chain overrides:

```css
:host { display: block; min-height: 100%; }
.team-payroll-page,
.team-payroll-page #view-workspace,
.team-payroll-page .payroll-workspace-layout,
.team-payroll-page .payroll-workspace-main {
  height: auto;
  min-height: 0;
  overflow-y: visible;
}
```

- [ ] **Step 4: Run the verifier and TypeScript**

Run: `node scripts/verify-team-payroll-polish.mjs && npx.cmd tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-team-payroll-polish.mjs src/main.ts src/team/payroll-page.ts src/team/payroll/payroll-polish.css
git commit -m "fix: restore payroll scroll ownership"
```

### Task 2: Restore the desktop visual system

**Files:**
- Modify: `src/team/payroll/payroll-polish.css`
- Modify: `scripts/verify-team-payroll-polish.mjs`

**Interfaces:**
- Consumes: the scoped polish layer from Task 1.
- Produces: stable design tokens and component dimensions matching the reference.

- [ ] **Step 1: Extend the verifier with key tokens**

Assert exact presence of `--payroll-canvas-radius: 16px`, `--payroll-control-height: 42px`, `padding: 24px`, `border-radius: 14px`, `background: #f7f7f7`, and `border: 1px solid #d9d9d9`.

- [ ] **Step 2: Run the verifier and confirm RED**

Run: `node scripts/verify-team-payroll-polish.mjs`

Expected: FAIL on the missing visual tokens.

- [ ] **Step 3: Implement the top area, Hero, summaries, table, and form styles**

Add scoped rules for:

```css
.team-payroll-page { padding: 24px; background: #fff; border-radius: 16px; }
.team-payroll-page .payroll-workspace-topbar { min-height: 42px; margin-bottom: 14px; }
.team-payroll-page .payroll-store-bar { gap: 12px; margin-bottom: 20px; }
.team-payroll-page .payroll-employee-hero { padding: 20px; border-radius: 14px; }
.team-payroll-page .payroll-sum-card { padding: 16px; border: 0; border-radius: 14px; background: #f7f7f7; }
.team-payroll-page .payroll-wide-group { padding: 16px; border-radius: 14px; background: #f7f7f7; }
.team-payroll-page .payroll-wide-group .form-control { height: 42px; padding: 0 12px; border: 1px solid #d9d9d9; border-radius: 12px; background: #fff; }
```

Also normalize table header/row heights, week summary bars, separators, typography, and the four Manage Payroll grouping grids to the reference without changing markup.

- [ ] **Step 4: Run all static Payroll checks**

Run:

```bash
node scripts/verify-team-payroll-polish.mjs
node scripts/verify-team-payroll-view.mjs
node scripts/verify-team-payroll-native-runtime.mjs
npx.cmd tsc --noEmit
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/team/payroll/payroll-polish.css scripts/verify-team-payroll-polish.mjs
git commit -m "style: match payroll visual reference"
```

### Task 3: Add responsive rules without page-level horizontal overflow

**Files:**
- Modify: `src/team/payroll/payroll-polish.css`
- Modify: `scripts/verify-team-payroll-polish.mjs`

**Interfaces:**
- Consumes: desktop component styles from Task 2.
- Produces: deterministic layouts at 1440px and 1024px while retaining table-only horizontal scrolling.

- [ ] **Step 1: Add failing breakpoint assertions**

Require `@media (max-width: 1279px)` and `@media (max-width: 1100px)`, plus scoped rules for topbar wrapping, Hero wrapping, two-column Manage Payroll grids, and `.payroll-table-scroll { overflow-x: auto; }`.

- [ ] **Step 2: Run the verifier and confirm RED**

Run: `node scripts/verify-team-payroll-polish.mjs`

Expected: FAIL on breakpoint rules.

- [ ] **Step 3: Implement responsive layout rules**

At 1279px allow the top actions, filters, and Hero actions to wrap. At 1100px keep the three summary cards in three columns, switch four-field Manage Payroll groups to two columns, and force all non-table containers to `max-width:100%; overflow-x:hidden`.

- [ ] **Step 4: Run static checks**

Run: `node scripts/verify-team-payroll-polish.mjs && npx.cmd tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/team/payroll/payroll-polish.css scripts/verify-team-payroll-polish.mjs
git commit -m "style: make payroll layout responsive"
```

### Task 4: Browser verification and production build

**Files:**
- Modify only if browser findings require scoped fixes: `src/team/payroll/payroll-polish.css`
- Modify only if assertions need correction: `scripts/verify-team-payroll-polish.mjs`

**Interfaces:**
- Consumes: the completed native Payroll route.
- Produces: browser evidence for scrolling, computed styles, interactions, responsive layout, and a successful production build.

- [ ] **Step 1: Verify scroll ownership at all viewports**

At 1687×1000, 1440×900, and 1024×768 assert:

```js
document.querySelectorAll("iframe").length === 0
document.querySelectorAll("[data-team-payroll-scroll]").length === 1
scroll.scrollHeight > scroll.clientHeight
scroll.scrollTop = scroll.scrollHeight
scroll.scrollTop > 0
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

Confirm the final Manage Payroll group is visible at maximum scroll.

- [ ] **Step 2: Verify computed visual styles**

Use `getComputedStyle` to assert the input is 42px high with a 1px border and 12px radius, the Hero has a 14px radius, summary cards have `rgb(247, 247, 247)` background, and page padding is 24px.

- [ ] **Step 3: Smoke-test interactions**

Open/close ADP export, `payrollEmployeePickerModal`, `payrollEmployeeEditModal`, and `employeesDetailPreviewModal`; change a Manage Payroll input, save it, navigate away/back, and assert the value remains. Confirm dialog-local scrolling does not move `[data-team-payroll-scroll]` and closing restores page scrolling.

- [ ] **Step 4: Capture visual evidence**

Capture shell-inclusive screenshots for the three browser viewports. For reference comparison, set the browser width until the Payroll host is exactly 1687px wide, capture consecutive non-overlapping scroll positions cropped to the host, stitch to 1687×1966, and compare the key block geometry to `docs/superpowers/assets/team-payroll-visual-reference.png` within the spec tolerances.

- [ ] **Step 5: Run the final checks and build**

Run:

```bash
node scripts/verify-team-payroll-native-route.mjs
node scripts/verify-team-payroll-view.mjs
node scripts/verify-team-payroll-native-runtime.mjs
node scripts/verify-team-payroll-polish.mjs
npx.cmd --yes tsx scripts/verify-team-payroll-state.ts
npx.cmd --yes tsx scripts/verify-team-payroll-adapters.ts
npx.cmd --yes tsx scripts/verify-team-payroll-domain.ts
npm.cmd run build
```

Expected: all checks and the production build PASS; no new browser console errors.

- [ ] **Step 6: Commit any verification-driven fixes**

```bash
git add src/team/payroll/payroll-polish.css scripts/verify-team-payroll-polish.mjs
git commit -m "fix: finish payroll visual verification"
```
