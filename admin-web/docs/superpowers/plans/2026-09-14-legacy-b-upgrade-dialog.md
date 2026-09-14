# Legacy B Upgrade Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a mandatory upgrade dialog whenever the Legacy B merchant shell mounts, with actions to continue temporarily or switch to the brand-view new admin home.

**Architecture:** Keep dialog rendering and focus behavior inside the Legacy B shell, while exposing one reusable brand-view transition function from the existing view switch controller. The dialog mounts with the page DOM, temporarily makes the body-level demo switch inert, traps focus between its two actions, and restores both page interaction and focus when dismissed.

**Tech Stack:** TypeScript, template-string HTML, Tailwind utility classes, hash routing, Node static contract verification, Vite.

**Spec:** `docs/superpowers/specs/2026-09-14-legacy-b-upgrade-dialog-design.md`

## Global Constraints

- Every `mountLegacyBShell()` DOM instance starts with the dialog open; no localStorage, sessionStorage, or module-level dismissal state.
- The exact title is `全新后台已上线`.
- The exact body is `操作更顺、加载更快、数据更清晰。您当前的旧版入口即将停止维护，建议现在花 1 分钟切换体验。`.
- The exact actions are `立即切换到新版` and `暂不切换`.
- The primary action enters brand view at `#/nav-home`; the secondary action stays in Legacy B.
- Backdrop click and Escape do not dismiss the dialog.
- The demo switch remains visible but cannot receive pointer or keyboard input while the dialog is open.
- Existing unrelated working-tree changes must not be staged or rewritten.

---

### Task 1: Reusable Brand-View Transition

**Files:**
- Modify: `src/shell/view-switch-control.ts`
- Modify: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Consumes: `exitLegacyBShell()`, `markSidebarNavLayoutPresetManual()`, `writeSidebarNavLayoutPreset("chain")`, `writeChainDataPerspective("brand", options?)`, `ensureScopeFiltersForLayoutPreset("chain")`, `syncAllActiveMPlatformGroups()`, `resolveDefaultAnchorBrandId()`, and an `onMount: () => void` callback.
- Produces: `export function switchToBrandView(onMount: () => void): void`.

- [ ] **Step 1: Extend the static contract with the missing brand transition**

Add this assertion to the source expectation table in `scripts/verify-legacy-b-platform.mjs`:

```js
[switcher, "export function switchToBrandView", "reusable brand view transition"],
```

- [ ] **Step 2: Run the contract check and verify it fails**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL with `Missing reusable brand view transition`.

- [ ] **Step 3: Add the single brand transition entry point**

In `src/shell/view-switch-control.ts`, add an exported wrapper immediately after `applyChainPerspective`:

```ts
export function switchToBrandView(onMount: () => void): void {
  applyChainPerspective("brand", onMount);
}
```

Update internal brand-view callers to use `switchToBrandView(onMount)` where doing so removes duplicate entry paths, while leaving group-HQ behavior unchanged.

- [ ] **Step 4: Run focused verification**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: `Legacy B platform verification passed.`

- [ ] **Step 5: Commit the reusable transition**

```bash
git add src/shell/view-switch-control.ts scripts/verify-legacy-b-platform.mjs
git commit -m "refactor: expose brand view transition"
```

---

### Task 2: Dialog Rendering and Interaction

**Files:**
- Modify: `src/shell/legacy-b-shell.ts`
- Modify: `scripts/verify-legacy-b-platform.mjs`

**Interfaces:**
- Consumes: `switchToBrandView(onMount: () => void): void`, body-level `[data-demo-switch-root]`, page heading `[data-legacy-b-heading]`.
- Produces: dialog root `[data-legacy-b-upgrade-dialog]`, backdrop `[data-legacy-b-upgrade-backdrop]`, primary action `[data-legacy-b-upgrade-confirm]`, secondary action `[data-legacy-b-upgrade-dismiss]`, and `bindLegacyBUpgradeDialog(onMount: () => void): void`.

- [ ] **Step 1: Add failing static contracts for markup and behavior hooks**

Append exact source checks to `scripts/verify-legacy-b-platform.mjs`:

```js
[shell, 'role="dialog"', "upgrade dialog semantics"],
[shell, 'aria-modal="true"', "upgrade dialog modal state"],
[shell, "全新后台已上线", "upgrade dialog title"],
[shell, "立即切换到新版", "upgrade dialog primary action"],
[shell, "暂不切换", "upgrade dialog secondary action"],
[shell, "data-legacy-b-upgrade-confirm", "upgrade confirm hook"],
[shell, "data-legacy-b-upgrade-dismiss", "upgrade dismiss hook"],
[shell, "switchToBrandView", "brand transition binding"],
[shell, "data-legacy-b-heading", "dismiss focus target"],
[shell, "bindLegacyBUpgradeDialog", "upgrade dialog binding"],
```

- [ ] **Step 2: Run the contract check and verify it fails**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: FAIL on the first missing dialog contract.

- [ ] **Step 3: Render the dialog as part of every shell mount**

Import `switchToBrandView` beside `bindViewSwitchControl`. Add `tabindex="-1" data-legacy-b-heading` to the existing `您的商户` heading. Add a `renderLegacyBUpgradeDialog()` function that returns:

```html
<div data-legacy-b-upgrade-dialog class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
  <div data-legacy-b-upgrade-backdrop class="absolute inset-0 bg-[#080018]/70 backdrop-blur-[2px]" aria-hidden="true"></div>
  <section role="dialog" aria-modal="true" aria-labelledby="legacy-b-upgrade-title" aria-describedby="legacy-b-upgrade-description" class="relative w-full max-w-[520px] rounded-3xl bg-white p-6 text-[#160052] shadow-2xl sm:p-8">
    <!-- compact upgrade icon -->
    <h2 id="legacy-b-upgrade-title">全新后台已上线</h2>
    <p id="legacy-b-upgrade-description">操作更顺、加载更快、数据更清晰。您当前的旧版入口即将停止维护，建议现在花 1 分钟切换体验。</p>
    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button type="button" data-legacy-b-upgrade-dismiss>暂不切换</button>
      <button type="button" data-legacy-b-upgrade-confirm>立即切换到新版</button>
    </div>
  </section>
</div>
```

Use complete Tailwind button classes consistent with the existing page: secondary white/bordered, primary `bg-[#160052] text-white`, both at least 44px tall. Insert `${renderLegacyBUpgradeDialog()}` inside the root page so every `mountLegacyBShell()` call creates an open dialog.

- [ ] **Step 4: Bind modal focus and both actions**

Add `bindLegacyBUpgradeDialog(onMount)` with these exact responsibilities:

```ts
function bindLegacyBUpgradeDialog(onMount: () => void): void {
  const dialogRoot = document.querySelector<HTMLElement>("[data-legacy-b-upgrade-dialog]");
  const confirmButton = dialogRoot?.querySelector<HTMLButtonElement>("[data-legacy-b-upgrade-confirm]");
  const dismissButton = dialogRoot?.querySelector<HTMLButtonElement>("[data-legacy-b-upgrade-dismiss]");
  const demoSwitch = document.querySelector<HTMLElement>("[data-demo-switch-root]");
  if (!dialogRoot || !confirmButton || !dismissButton) return;

  demoSwitch?.setAttribute("inert", "");
  demoSwitch?.setAttribute("aria-hidden", "true");

  dialogRoot.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const target = event.target as Node | null;
    if (event.shiftKey && target === confirmButton) {
      event.preventDefault();
      dismissButton.focus();
    } else if (!event.shiftKey && target === dismissButton) {
      event.preventDefault();
      confirmButton.focus();
    }
  });

  dismissButton.addEventListener("click", () => {
    dialogRoot.remove();
    demoSwitch?.removeAttribute("inert");
    demoSwitch?.removeAttribute("aria-hidden");
    document.querySelector<HTMLElement>("[data-legacy-b-heading]")?.focus({ preventScroll: true });
  });

  confirmButton.addEventListener("click", () => switchToBrandView(onMount));
  requestAnimationFrame(() => confirmButton.focus({ preventScroll: true }));
}
```

The dialog root handles no click-to-dismiss listener and no Escape branch. Call `bindLegacyBUpgradeDialog(onMount)` after `mountDemoSwitchFab(...)` so the newly created floating control can be made inert.

- [ ] **Step 5: Run focused contract and type checks**

Run: `node scripts/verify-legacy-b-platform.mjs`

Expected: `Legacy B platform verification passed.`

Run: `npx.cmd tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 6: Commit the dialog implementation**

```bash
git add src/shell/legacy-b-shell.ts scripts/verify-legacy-b-platform.mjs
git commit -m "feat: prompt legacy B users to switch"
```

---

### Task 3: Build and Browser Acceptance

**Files:**
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: completed Legacy B dialog and local URL `http://127.0.0.1:59813/#/legacy-b/merchants`.
- Produces: recorded desktop/narrow-screen acceptance results in `design-qa.md`.

- [ ] **Step 1: Run the production build**

Run: `npx.cmd vite build`

Expected: exit code 0; existing chunk-size warnings are acceptable. Do not stage generated `dist/**` or `src/generated/build-stamp.ts` files that belonged to another working-tree workflow.

- [ ] **Step 2: Reload the Legacy B route and verify initial state**

Open or reload `http://127.0.0.1:59813/#/legacy-b/merchants`.

Verify:

- dialog is centered and does not overflow;
- exact title, body, and two action labels render;
- admin top bar and sidebar remain absent;
- demo switch is visible above the overlay but cannot be clicked or focused;
- initial focus is on `立即切换到新版`;
- clicking the backdrop and pressing Escape keep the dialog open;
- Tab and Shift+Tab loop between the two actions.

- [ ] **Step 3: Verify temporary dismissal and remount behavior**

Click `暂不切换` and verify the dialog is removed, focus moves to `您的商户`, and the demo switch becomes operable. Reload the route and verify the dialog returns.

- [ ] **Step 4: Verify brand-view switching**

Click `立即切换到新版` and verify the URL becomes `#/nav-home`, the Legacy B full-screen page exits, the normal new-admin shell returns, and the active view is 品牌版.

- [ ] **Step 5: Verify narrow-screen layout**

At a viewport near 390×844, reload the Legacy B route and verify the card stays within the viewport with vertically stacked full-width actions and no horizontal scroll.

- [ ] **Step 6: Record QA and commit**

Append the date, route, viewport coverage, interaction outcomes, and command results to `design-qa.md`, then commit only the relevant files:

```bash
git add design-qa.md
git commit -m "test: verify legacy B upgrade dialog"
```

## Self-Review

- Spec coverage: mount/remount display, exact copy, modal semantics, non-dismissible backdrop/Escape behavior, focus trap, inert-but-visible floating switch, dismissal focus restoration, brand transition, responsive layout, static checks, type check, build, and browser QA are each assigned to a task.
- Placeholder scan: no TBD/TODO/later placeholders remain; every code change names exact selectors, signatures, commands, and expected outcomes.
- Type consistency: `switchToBrandView(onMount: () => void): void` is produced in Task 1 and consumed with the same signature in Task 2; all dialog selectors match across rendering, binding, verification, and QA.
