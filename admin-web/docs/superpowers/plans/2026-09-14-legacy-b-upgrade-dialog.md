# Legacy B Upgrade Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Legacy B entry dialog so every visit prompts for upgrade, dismissal stays local to that visit, and confirmation opens the current brand in the new chain-layout admin.

**Architecture:** Keep dialog markup, visit-local state, focus management, and actions in `legacy-b-shell.ts`. Expose one guarded brand-view transition from `view-switch-control.ts`, reusing the existing chain perspective pipeline so layout, perspective, brand anchor, scope filters, and home routing change together.

**Tech Stack:** TypeScript, Vite, template-string HTML, Tailwind utilities, hash routing, session organization context, Node static verification, browser E2E.

**Spec:** `docs/superpowers/specs/2026-09-14-legacy-b-upgrade-dialog-design.md`

## Global Constraints

- A route entry or page refresh shows the dialog; dismissal is not persisted across visits.
- Ordinary remounts during one continuous Legacy B visit do not reopen a dismissed dialog.
- The primary action enters `chain` layout with `brand` perspective and preserves a valid current brand anchor.
- If no brand can be resolved, stay in the dialog and show `暂无可切换的品牌，请联系管理员`.
- `Escape` dismisses; backdrop click does not dismiss.
- Focus is trapped while open and returns to the focusable `您的商户` heading after dismissal.
- Existing unrelated working-tree changes and generated assets are not committed.

---

### Task 1: Guarded Brand-View Transition

**Files:**
- Modify: `src/shell/view-switch-control.ts`
- Modify: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Consumes: `resolveDefaultAnchorBrandId(): string | null`, `applyChainPerspective("brand", onMount)` and the existing Legacy B shell exit path.
- Produces: `export function switchToBrandView(onMount: () => void): boolean`; returns `false` without changing views when no brand ID is available.

- [ ] **Step 1: Add a failing source-contract assertion**

Add assertions requiring the exported boolean transition, resolved `brandId`, and a no-brand `return false` branch.

- [ ] **Step 2: Run the focused verifier and confirm failure**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL on the missing guarded brand transition.

- [ ] **Step 3: Implement the transition**

Add a wrapper that resolves the brand anchor before leaving Legacy B. Return `false` if missing. Otherwise call the existing brand perspective pipeline with that anchor, navigate to `APP_NAV_HOME_PATH`, mount, and return `true`. Update existing brand-view callers to use this shared entry point where signatures match.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: PASS.

Commit only the two task files with message `refactor: guard legacy B brand transition`.

---

### Task 2: Visit-Scoped Upgrade Dialog

**Files:**
- Modify: `src/shell/legacy-b-shell.ts`
- Modify: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Consumes: `switchToBrandView(onMount): boolean`, `[data-demo-switch-root]`.
- Produces: `beginLegacyBVisit()`, background wrapper `[data-legacy-b-page-content]`, dialog hooks `[data-legacy-b-upgrade-dialog]`, `[data-legacy-b-upgrade-confirm]`, `[data-legacy-b-upgrade-dismiss]`, `[data-legacy-b-upgrade-error]`, and `bindLegacyBUpgradeDialog(onMount)`.

- [ ] **Step 1: Add failing dialog contracts**

Require dialog semantics, exact copy, both action hooks, error hook, focusable heading, Escape handling, focus loop, inert background, and `beginLegacyBVisit` in `scripts/verify-legacy-b-platform.mjs`.

- [ ] **Step 2: Run the verifier and confirm failure**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL on the first missing dialog contract.

- [ ] **Step 3: Render visit-local modal state**

Maintain a module-local `legacyBDialogDismissedForVisit` boolean. `beginLegacyBVisit()` resets it to `false`; the shell renders the modal unless dismissed. Wrap the non-modal page in `[data-legacy-b-page-content]`, add `tabindex="-1"` to the merchant heading, and keep the dialog as its sibling so the background can become inert without disabling the dialog. Include the exact title, description, actions, and an initially hidden `role="alert"` error region.

- [ ] **Step 4: Bind complete modal behavior**

On open, set `inert` and `aria-hidden="true"` on `[data-legacy-b-page-content]` and the Demo switch, focus the primary action, loop `Tab`/`Shift+Tab` between the two actions, ignore backdrop clicks, and handle `Escape` through the same dismissal function as the secondary button. Dismissal sets visit state, removes the dialog, removes `inert` and `aria-hidden` before focusing the heading, and does not write storage. Confirmation calls `switchToBrandView`; when it returns `false`, reveal the error and keep focus inside the modal.

- [ ] **Step 5: Verify types and commit**

Run:

```powershell
node scripts/verify-legacy-b-platform.mjs
npx.cmd tsc --noEmit
```

Expected: both exit 0.

Commit only the task files with message `feat: complete legacy B upgrade dialog`.

---

### Task 3: Route Entry Reset and Acceptance

**Files:**
- Modify: `src/main.ts`
- Modify: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Consumes: `beginLegacyBVisit()` and `isLegacyBContentPath(path)`.
- Produces: reset only when the previous mounted route was outside Legacy B; same-route remount preserves dismissal.

- [ ] **Step 1: Add failing route-lifecycle assertions**

Require a previous-route marker and a call to `beginLegacyBVisit()` only when entering Legacy B from a non-Legacy-B route.

- [ ] **Step 2: Run the verifier and confirm failure**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL on the missing visit-entry lifecycle.

- [ ] **Step 3: Implement route-entry reset**

Before mounting the Legacy B shell, compare the current normalized route with a module-level last-mounted route. Call `beginLegacyBVisit()` for first load or cross-route entry, but not for a same-route remount. Update the marker before returning from the shell branch and when normal merchant routes mount.

- [ ] **Step 4: Run regression and production checks**

Run:

```powershell
node scripts/verify-legacy-b-platform.mjs
node scripts/verify-recursive-navigation-interaction.mjs
npm.cmd run build
```

Expected: all exit 0; existing Vite chunk-size warnings are acceptable.

- [ ] **Step 5: Browser acceptance on port 65018**

Verify all of the following:

- selecting 老B平台 opens `/legacy-b/merchants` with the modal;
- primary focus and two-button focus loop work;
- backdrop keeps the modal open;
- Escape and 暂不切换 close it and focus 您的商户;
- a same-route remount does not reopen it;
- leaving and re-entering, and refreshing, reopen it;
- 立即切换到新版 reaches the new admin home with `chain` layout, `brand` perspective, and the same valid brand;
- a forced missing-brand fixture shows the inline error without navigation.

- [ ] **Step 6: Commit lifecycle integration**

Commit only `src/main.ts` and the verifier with message `fix: reset legacy B dialog on route entry`.

## Self-Review

- Spec coverage: display lifecycle, dismiss/re-entry rules, brand identity, missing-brand behavior, modal semantics, keyboard behavior, inert background, focus restoration, build, and browser acceptance are covered.
- Placeholder scan: no TBD, TODO, or unspecified implementation steps remain.
- Type consistency: `switchToBrandView(onMount): boolean` is produced in Task 1 and consumed in Task 2; `beginLegacyBVisit()` is produced in Task 2 and consumed in Task 3.
