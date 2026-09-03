# Native Team Tips Rules Fullscreen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the native Team Tips rules list and rule editor occupy the full application viewport while preserving route history, layered Escape handling, and scroll restoration.

**Architecture:** Route helpers derive fullscreen and transition behavior from exact normalized Team Tips paths. The light-DOM tips scroll host owns fullscreen positioning and vertical scrolling; `TipsPageHandle` owns all classes, listeners, history metadata, and cleanup while the existing Shadow DOM legacy runtime remains responsible for page business behavior.

**Tech Stack:** TypeScript, Vite raw imports, Shadow DOM, History API, DOM events, CSS, Node verification scripts, in-app browser.

**Spec:** `docs/superpowers/specs/2026-09-03-team-tips-rules-fullscreen-design.md`

## Global Constraints

- Fullscreen applies only to exact normalized `/team/tips/rules` and `/team/tips/rules/editor` routes, with optional trailing slash and query.
- The light-DOM `[data-team-tips-scroll]` element is the only main scroll owner.
- Rules list and editor remain fullscreen across their internal transition; returning to distribution exits fullscreen.
- Fullscreen uses `z-index: 2147483000` and must not use the browser Fullscreen API or a TipOut iframe.
- Destroy must be idempotent and remove fullscreen classes, attributes, listeners, and DOM/in-memory scroll locks while preserving history entry state.

---

### Task 1: Exact fullscreen routes and history metadata

**Files:**
- Modify: `src/team/tips/tips-navigation.ts`
- Modify: `src/team/tips/tips-context.ts`
- Create: `scripts/verify-team-tips-fullscreen-navigation.ts`

**Interfaces:**
- Produces: `isTipsFullscreenRoute(route: TipsRoute): boolean`
- Produces: `TipsHistoryEntryState` with `flowId`, `viewHref`, `scrollTop`, `parentHref`, `summaryHref`, `summaryScrollTop`
- Produces: `navigateToRules`, `navigateToEditor`, `returnToParent`, and `returnToSummary` context behavior.

- [ ] **Step 1: Write the failing route/history verification**

Create assertions covering exact routes, trailing slashes, query preservation, rejection of `/team/tips/rules-foo`, and validation of trusted history state:

```ts
assert.equal(isTipsFullscreenRoute(parseTipsRoute("#/team/tips/rules")), true);
assert.equal(isTipsFullscreenRoute(parseTipsRoute("#/team/tips/rules/editor?id=2")), true);
assert.equal(isTipsFullscreenRoute(parseTipsRoute("#/team/tips/rules-foo")), false);
assert.equal(isTrustedTipsHistoryState(validState, "/team/tips/rules"), true);
assert.equal(isTrustedTipsHistoryState({ ...validState, scrollTop: -1 }, "/team/tips/rules"), false);
```

- [ ] **Step 2: Run the verification and confirm failure**

Run: `npm.cmd exec tsx -- scripts/verify-team-tips-fullscreen-navigation.ts`

Expected: FAIL because fullscreen and trusted-state helpers do not exist.

- [ ] **Step 3: Implement exact route and history helpers**

Normalize only the pathname, preserve query separately, validate finite non-negative scroll values, and update the current entry with its scroll position before pushing a child entry. Use `history.back()` only when the current trusted state names the expected parent; otherwise replace with the safe fallback route.

- [ ] **Step 4: Run TypeScript and navigation verification**

Run: `npm.cmd exec tsc -- --noEmit`

Run: `npm.cmd exec tsx -- scripts/verify-team-tips-fullscreen-navigation.ts`

Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add src/team/tips/tips-navigation.ts src/team/tips/tips-context.ts scripts/verify-team-tips-fullscreen-navigation.ts
git commit -m "feat: define tips fullscreen navigation"
```

### Task 2: Fullscreen host and lifecycle

**Files:**
- Modify: `src/team/tips-page.ts`
- Modify: `src/main.ts`
- Modify: `src/styles/app.css`
- Create: `scripts/verify-team-tips-fullscreen-host.mjs`

**Interfaces:**
- Consumes: `isTipsFullscreenRoute(route)` and trusted history state from Task 1.
- Produces: `data-team-tips-flow-fullscreen` and `team-tips-flow-fullscreen` on the light-DOM scroll owner.

- [ ] **Step 1: Write the failing structural verification**

Assert that the host style contains the exact fixed-position contract and that `TipsPageHandle.destroy()` removes both fullscreen markers:

```js
for (const token of ["position: fixed", "z-index: 2147483000", "100dvh", "overscroll-behavior: contain"]) assert(css.includes(token));
for (const token of ["team-tips-flow-fullscreen", "data-team-tips-flow-fullscreen", "classList.remove", "removeAttribute"]) assert(page.includes(token));
```

- [ ] **Step 2: Run and confirm failure**

Run: `node scripts/verify-team-tips-fullscreen-host.mjs`

Expected: FAIL because the native host has no fullscreen contract.

- [ ] **Step 3: Add route-derived host state and CSS**

Render fullscreen markers synchronously for rules routes, then reinforce them during `mountTipsPage`. Add:

```css
[data-team-tips-scroll].team-tips-flow-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483000 !important;
  width: 100vw !important;
  height: 100dvh !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  border: 0 !important;
  background: #f5f6f7;
}
```

- [ ] **Step 4: Implement idempotent cleanup and scroll restoration**

On mount, restore the current entry scroll immediately and over two animation frames using a clamped maximum. On destroy, cancel frames and remove fullscreen/scroll-lock DOM state without deleting `history.state.menusifuTeamTips`.

- [ ] **Step 5: Run checks and commit**

Run: `npm.cmd exec tsc -- --noEmit`

Run: `node scripts/verify-team-tips-fullscreen-host.mjs`

Expected: PASS.

```bash
git add src/team/tips-page.ts src/main.ts src/styles/app.css scripts/verify-team-tips-fullscreen-host.mjs
git commit -m "feat: fullscreen native tips rule flow"
```

### Task 3: Layered Escape behavior

**Files:**
- Modify: `src/team/tips-page.ts`
- Create: `src/team/tips/tips-escape.ts`
- Create: `scripts/verify-team-tips-fullscreen-escape.mjs`

**Interfaces:**
- Produces: `createTipsEscapeController(shadowRoot, route, context): { destroy(): void }`.
- Consumes: `returnToParent` and `returnToSummary` from Task 1.

- [ ] **Step 1: Write the failing Escape contract verification**

Check for capture-state and bubble-decision handlers, explicit `.tipout-rule-more`, modal/drawer/dropdown selectors, native select guard, `preventDefault`, `stopPropagation`, and idempotent destroy.

- [ ] **Step 2: Run and confirm failure**

Run: `node scripts/verify-team-tips-fullscreen-escape.mjs`

Expected: FAIL because no Escape controller exists.

- [ ] **Step 3: Implement two-phase Escape arbitration**

Capture records the pre-event top layer and active control. Bubble exits only when no layer/control consumed the event. If a layer remains open, close only that layer with its existing close button/function-compatible DOM action. Editor routes return to rules; rules routes return to distribution. Both listeners use one AbortController and `destroy()` is safe to call repeatedly.

- [ ] **Step 4: Run checks and commit**

Run: `npm.cmd exec tsc -- --noEmit`

Run: `node scripts/verify-team-tips-fullscreen-escape.mjs`

Expected: PASS.

```bash
git add src/team/tips-page.ts src/team/tips/tips-escape.ts scripts/verify-team-tips-fullscreen-escape.mjs
git commit -m "feat: handle layered tips fullscreen escape"
```

### Task 4: Build and browser acceptance

**Files:**
- Modify only if verification exposes a scoped defect in Tasks 1–3.

**Interfaces:**
- Consumes the completed native fullscreen flow.
- Produces browser evidence for route, layout, scrolling, Escape, and cleanup behavior.

- [ ] **Step 1: Run all native Tips verification and production build**

```bash
node scripts/verify-team-tips-source-inventory.mjs
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-native-runtime.mjs
node scripts/verify-team-tips-native-route.mjs
node scripts/verify-team-tips-fullscreen-host.mjs
node scripts/verify-team-tips-fullscreen-escape.mjs
npm.cmd exec tsc -- --noEmit
npm.cmd run build
```

Expected: all checks and build PASS.

- [ ] **Step 2: Verify the full route flow on port 5174**

Test distribution → rules → editor → rules → distribution, direct rules/editor deep links, refresh, Back/Forward, and leaving `/team/tips/*`. Assert the native host has no iframe; rules/editor cover the viewport; sidebar/header are visually covered; distribution restores them.

- [ ] **Step 3: Verify scrolling and Escape matrix**

Set distinct scroll positions on distribution and rules, enter editor, return through history, and assert restoration within 2px. Test Escape with no layer, modal, drawer, dropdown, `.tipout-rule-more`, and an active select; each key press must close or navigate exactly one level.

- [ ] **Step 4: Verify lifecycle and console**

Repeat rules/editor mounting and leaving the module. Assert no stale fullscreen class/attribute, no duplicate Escape action, no iframe marker, and no new console errors.

- [ ] **Step 5: Commit any verification-only fixes**

```bash
git add src scripts
git commit -m "test: verify native tips fullscreen flow"
```

