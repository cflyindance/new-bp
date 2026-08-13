# Demo Switch Flat Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Demo switch panel's three nested dropdown controls with directly visible, categorized two-column option cards.

**Architecture:** Keep view, version, and peripheral-product decisions inside their existing control modules. Each module exposes flat group markup and continues binding the same stable option markers; `demo-switch-control.ts` composes the groups and owns only panel visibility, focus flow, dragging, and viewport collision handling.

**Tech Stack:** TypeScript, Vite, Tailwind utility classes, hash routing, DOM event listeners, Node structural verifier, in-app browser QA.

---

### Task 1: Lock the flat-panel contract in the structural verifier

**Files:**
- Modify: `scripts/verify-emenu-local-config-shell.mjs`

- [ ] **Step 1: Add failing structural assertions**

Add reads and assertions that require stable flat-group markers and reject nested trigger markers in Demo composition:

```js
expect(demoSwitch, /data-demo-switch-view-group/, "Demo panel must expose the flat view group");
expect(demoSwitch, /data-demo-switch-version-group/, "Demo panel must expose the flat version group");
expect(demoSwitch, /data-demo-switch-products-group/, "Demo panel must expose the flat peripheral products group");
if (/renderViewSwitchControl\(\)/.test(demoSwitch)) throw new Error("Demo panel must not render the nested view control");
if (/renderVersionSwitchControl\(\)/.test(demoSwitch)) throw new Error("Demo panel must not render the nested version control");
if (/renderPeripheralProductsControl\(\)/.test(demoSwitch)) throw new Error("Demo panel must not render the nested products control");
expect(demoSwitch, /data-demo-switch-panel-scroll/, "Demo panel must constrain small-screen overflow");
expect(demoSwitch, /focus\(/, "Demo panel must manage keyboard focus");
```

- [ ] **Step 2: Run the verifier and confirm RED**

Run: `node scripts/verify-emenu-local-config-shell.mjs`

Expected: FAIL because the flat group markers do not exist and nested controls are still rendered.

### Task 2: Expose flat view cards while preserving view rules

**Files:**
- Modify: `src/shell/view-switch-control.ts`

- [ ] **Step 1: Add a flat group renderer**

Export `renderFlatViewSwitchGroup()` that returns a fieldset-like group with `data-demo-switch-view-group`. Reuse the existing store, chain perspective, M Platform, permission, product-version, active-state, badge, title, and option markers. Render option cards in:

```html
<div class="grid grid-cols-2 gap-2" data-demo-switch-view-options>…</div>
```

For restricted mode, render only the locked brand card plus visible text with a stable ID; connect the card using `aria-describedby`.

- [ ] **Step 2: Make the existing binder support flat markup**

Keep `bindViewSwitchControl(onMount)` as the public API. Bind `[data-view-switch-option]` and `[data-view-switch-chain-perspective]` inside both legacy and flat roots. Do not require a menu toggle before binding option clicks. On selection, call the existing `applyViewSwitchMode` or `applyChainPerspective` paths unchanged.

- [ ] **Step 3: Run TypeScript**

Run: `npx.cmd tsc --noEmit`

Expected: PASS for the modified control module.

### Task 3: Expose flat version cards while preserving remount behavior

**Files:**
- Modify: `src/shell/version-switch-control.ts`

- [ ] **Step 1: Add a flat group renderer**

Export `renderFlatVersionSwitchGroup()` with `data-demo-switch-version-group`, a two-column grid, and existing `[data-version-switch-option]` buttons for `mvp` and `future`. Preserve current-state styling and `aria-current`.

- [ ] **Step 2: Generalize binding**

Keep `bindVersionSwitchControl(onMount)` and bind option cards even when `[data-version-switch-toggle]` and `[data-version-switch-menu]` are absent. Continue calling `writeProductVersion(version)` followed by `onMount()`.

- [ ] **Step 3: Run TypeScript**

Run: `npx.cmd tsc --noEmit`

Expected: PASS.

### Task 4: Expose flat peripheral-product cards

**Files:**
- Modify: `src/shell/peripheral-products-control.ts`

- [ ] **Step 1: Add a flat group renderer**

Export `renderFlatPeripheralProductsGroup()` with `data-demo-switch-products-group`. Render eMenu and Kiosk in a two-column grid using the existing `[data-peripheral-product-option]` markers, active shell checks, default routes, and current-state styles.

For restricted mode, keep both buttons disabled and render a visible explanation referenced with `aria-describedby`.

- [ ] **Step 2: Generalize binding**

Keep `bindPeripheralProductsControl()` and bind both product buttons without requiring a nested toggle/menu. Preserve `enterEmenuLocalShell`, `enterKioskLocalShell`, and their default hashes.

- [ ] **Step 3: Run TypeScript**

Run: `npx.cmd tsc --noEmit`

Expected: PASS.

### Task 5: Compose the flat panel and implement focus/collision behavior

**Files:**
- Modify: `src/shell/demo-switch-control.ts`
- Modify: `src/i18n.ts`

- [ ] **Step 1: Replace nested controls in panel composition**

Import the three flat renderers and compose them in order:

```ts
const panelInner = `
  <div data-demo-switch-panel-scroll class="w-[min(22rem,calc(100vw-1.5rem))] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-xl">
    ${renderFlatViewSwitchGroup()}
    ${showVersionSwitch ? renderFlatVersionSwitchGroup() : ""}
    ${renderFlatPeripheralProductsGroup()}
  </div>`;
```

Add bilingual group-title and restricted-explanation keys only if existing keys cannot express them clearly.

- [ ] **Step 2: Add keyboard opening and focus restoration**

Track whether the panel opened through keyboard. Handle Enter/Space on the FAB, call `setDemoSwitchOpen(root, true)`, then focus the first enabled option with:

```ts
requestAnimationFrame(() => {
  root.querySelector<HTMLButtonElement>(
    "[data-demo-switch-panel] button:not(:disabled)",
  )?.focus();
});
```

When Esc, backdrop, or outside interaction closes the panel and focus was inside it, focus `[data-demo-switch-toggle]`.

- [ ] **Step 3: Keep the panel inside viewport margins**

On open and resize, measure the FAB and panel. Prefer expansion to the left when it fits, otherwise expand right; clamp top position within `VIEWPORT_MARGIN_PX`. Apply direction and offset through inline `left/right/top/transform` values without changing the stored FAB position.

- [ ] **Step 4: Remove nested-menu close bookkeeping**

Delete Demo-panel code that looks for view/version/product toggles and menus. Closing the Demo panel now only changes the panel visibility and focus state.

- [ ] **Step 5: Run structural verifier and TypeScript**

Run:

```powershell
node scripts/verify-emenu-local-config-shell.mjs
npx.cmd tsc --noEmit
```

Expected: both PASS.

### Task 6: Browser regression and commit

**Files:**
- Verify all files above

- [ ] **Step 1: Run whitespace check**

Run:

```powershell
git diff --check -- scripts/verify-emenu-local-config-shell.mjs src/i18n.ts src/shell/demo-switch-control.ts src/shell/view-switch-control.ts src/shell/version-switch-control.ts src/shell/peripheral-products-control.ts
```

Expected: no errors.

- [ ] **Step 2: Validate merchant backend**

In the browser, click the FAB once and verify all visible view, version, and peripheral-product cards appear without secondary clicks. Verify MVP/future visibility, selected states, and menu-free DOM markers.

- [ ] **Step 3: Validate independent backends**

Open eMenu, Kiosk, and M Platform. Verify the version group is absent while view and peripheral-product groups remain visible and functional.

- [ ] **Step 4: Validate accessibility and collision behavior**

Verify Enter/Space opens the panel and focuses the first enabled card; Esc closes and restores FAB focus. Drag the FAB near all viewport edges and verify the panel remains within margins and scrolls internally on a small viewport.

- [ ] **Step 5: Validate routing and console**

Switch through store, brand, group HQ when allowed, M Platform, eMenu, and Kiosk. Confirm expected hashes and no new console errors.

- [ ] **Step 6: Stage only task files and commit**

Run:

```powershell
git add -- scripts/verify-emenu-local-config-shell.mjs src/i18n.ts src/shell/demo-switch-control.ts src/shell/view-switch-control.ts src/shell/version-switch-control.ts src/shell/peripheral-products-control.ts
git diff --cached --check
git commit -m "feat: flatten demo switch groups"
```

