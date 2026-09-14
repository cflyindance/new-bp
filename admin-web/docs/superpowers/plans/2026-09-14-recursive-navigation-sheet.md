# Recursive Navigation Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every global menu branch open and recursively drill through one fixed-width navigation sheet, while only leaf nodes navigate to business content.

**Architecture:** Normalize existing module and special-purpose subnavigation constants into one recursive `NavigationNode` tree. Keep the drill-down stack in an ephemeral, framework-free state module, then replace the dedicated sheet renderers and click handlers in `main.ts` with one renderer/controller that consumes the normalized tree.

**Tech Stack:** TypeScript 5.6, Vite 6, Tailwind CSS 4 utility classes, hash routing, executable verification scripts via `npx tsx`.

**Spec:** `docs/superpowers/specs/2026-09-14-recursive-navigation-sheet-design.md`

## Global Constraints

- Any authored node with children is a branch and never navigates on click.
- Only an authored leaf with a valid route navigates and closes the sheet.
- Permission/platform filtering happens recursively; a branch with no visible descendants is hidden, never reclassified as a leaf.
- Sheet root, stack, search, animation, and focus origin are ephemeral and must not be restored from route or `sessionStorage`.
- The sheet is fixed width, single-panel, modal, keyboard-contained, and respects `prefers-reduced-motion`.
- Existing business-page-local tabs remain; global `tabs` / `sidebar` / `sheet` navigation placement is superseded.
- Do not edit `vendor/emenu-new`; therefore the eMenu embed publication command is not required by this change.

---

### Task 1: Canonical recursive navigation tree

**Files:**
- Create: `src/config/navigation-tree.ts`
- Modify: `src/config/navigation.ts`
- Create: `scripts/verify-recursive-navigation-tree.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `NAV_MODULES` and existing special-purpose constants from `src/config/navigation.ts`.
- Produces: `NavigationNode`, `NavigationRoot`, `buildNavigationRoots()`, `filterNavigationTree()`, `findNavigationNodeByRoute()`, and `flattenNavigationRoutes()`.

- [ ] **Step 1: Write the failing tree verifier**

Create `scripts/verify-recursive-navigation-tree.ts` with executable assertions that require stable IDs, recurse to four levels, and keep filtered branches from becoming leaves:

```ts
import assert from "node:assert/strict";
import {
  buildNavigationRoots,
  filterNavigationTree,
  flattenNavigationRoutes,
} from "../src/config/navigation-tree";

const roots = buildNavigationRoots();
assert.ok(roots.length > 0);
assert.equal(new Set(roots.flatMap(function ids(n): string[] {
  return [n.id, ...(n.children ?? []).flatMap(ids)];
})).size, roots.flatMap(function ids(n): string[] {
  return [n.id, ...(n.children ?? []).flatMap(ids)];
}).length, "navigation ids must be globally unique");

const product = roots.find((node) => node.id === "product-center-main");
assert.ok(product?.children?.find((node) => node.id === "pcm-brand-products")?.children?.length);
assert.ok(flattenNavigationRoutes(roots).includes("/brand-products/seasoning-mgmt/distribution-log"));

const hidden = filterNavigationTree([
  { id: "branch", title: "Branch", children: [{ id: "leaf", title: "Leaf", route: "/leaf" }] },
], (node) => node.id !== "leaf");
assert.deepEqual(hidden, []);
console.log("recursive navigation tree verified");
```

- [ ] **Step 2: Add and run the verification command to prove it fails**

Add `"verify:recursive-navigation-tree": "npx tsx scripts/verify-recursive-navigation-tree.ts"` to `package.json` and run:

```bash
npm run verify:recursive-navigation-tree
```

Expected: FAIL because `src/config/navigation-tree.ts` does not exist.

- [ ] **Step 3: Implement the normalized model and adapters**

Create `src/config/navigation-tree.ts` with these public contracts:

```ts
export interface NavigationNode {
  id: string;
  title: string;
  titleEn?: string;
  route?: string;
  matchPrefixes?: string[];
  children?: NavigationNode[];
  chainOnly?: boolean;
}

export type NavigationRoot = NavigationNode & { children: NavigationNode[] };

export function buildNavigationRoots(): NavigationRoot[];
export function filterNavigationTree(
  nodes: NavigationNode[],
  visible: (node: NavigationNode) => boolean,
): NavigationNode[];
export function findNavigationNodeByRoute(
  roots: NavigationNode[],
  route: string,
): NavigationNode | null;
export function flattenNavigationRoutes(roots?: NavigationNode[]): string[];
```

Implement explicit adapters for Product Center, Marketing, Promotions, Members, Gift Cards, Reports, Print, Reservations, Finance, Store Menu, Device Management, and every remaining dedicated sheet constant imported by `main.ts`. Branch adapters must reference existing constants for titles and routes, not duplicate route literals. Convert every `sidebarChildren` entry into recursive children and assign deterministic IDs of the form `${parent.id}--${slugOrIndex}` when the source has no ID.

- [ ] **Step 4: Route legacy helpers through the canonical tree**

Update `flattenNavPaths()` in `src/config/navigation.ts` to delegate to `flattenNavigationRoutes(buildNavigationRoots())`. Retain exported legacy title/active-path helpers temporarily, but make them traverse the normalized tree rather than their old parallel arrays.

- [ ] **Step 5: Run tree verification and type-check**

```bash
npm run verify:recursive-navigation-tree
npx tsc --noEmit
```

Expected: verifier prints `recursive navigation tree verified`; TypeScript exits 0.

- [ ] **Step 6: Commit the canonical tree**

```bash
git add package.json src/config/navigation.ts src/config/navigation-tree.ts scripts/verify-recursive-navigation-tree.ts
git commit -m "refactor: normalize recursive navigation tree"
```

---

### Task 2: Ephemeral drill-down state machine

**Files:**
- Create: `src/config/navigation-sheet-state.ts`
- Create: `scripts/verify-navigation-sheet-state.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `NavigationNode` and `NavigationRoot` from Task 1.
- Produces: `NavigationSheetState`, `openNavigationSheet()`, `pushNavigationLevel()`, `popNavigationLevel()`, `clearNavigationSheet()`, `setNavigationSheetQuery()`, and `getCurrentNavigationFrame()`.

- [ ] **Step 1: Write failing state-transition assertions**

Create `scripts/verify-navigation-sheet-state.ts`:

```ts
import assert from "node:assert/strict";
import {
  clearNavigationSheet,
  getCurrentNavigationFrame,
  openNavigationSheet,
  popNavigationLevel,
  pushNavigationLevel,
  setNavigationSheetQuery,
} from "../src/config/navigation-sheet-state";

const leaf = { id: "leaf", title: "Leaf", route: "/leaf" };
const branch = { id: "branch", title: "Branch", children: [leaf] };
const root = { id: "root", title: "Root", children: [branch] };

openNavigationSheet(root);
assert.equal(getCurrentNavigationFrame()?.parent.id, "root");
setNavigationSheetQuery("bran");
pushNavigationLevel(branch);
assert.equal(getCurrentNavigationFrame()?.parent.id, "branch");
assert.equal(getCurrentNavigationFrame()?.query, "");
assert.equal(popNavigationLevel()?.parent.id, "root");
assert.equal(getCurrentNavigationFrame()?.query, "");
clearNavigationSheet();
assert.equal(getCurrentNavigationFrame(), null);
```

- [ ] **Step 2: Add the command and verify failure**

Add `"verify:navigation-sheet-state": "npx tsx scripts/verify-navigation-sheet-state.ts"`, then run it. Expected: FAIL because the state module does not exist.

- [ ] **Step 3: Implement in-memory state**

Use module memory only—no storage and no hash inspection:

```ts
export interface NavigationSheetFrame {
  parent: NavigationNode;
  query: string;
  triggerNodeId?: string;
}

export interface NavigationSheetState {
  rootId: string | null;
  frames: NavigationSheetFrame[];
  direction: "forward" | "back" | "idle";
  originElementId: string | null;
  transitionLocked: boolean;
}
```

Opening a root replaces the entire state. Push and pop clear the query and set animation direction. Closing clears every field. Expose `lockNavigationSheetTransition()` / `unlockNavigationSheetTransition()` so UI code can reject repeated input during animation.

- [ ] **Step 4: Run state and tree verifiers**

```bash
npm run verify:navigation-sheet-state
npm run verify:recursive-navigation-tree
npx tsc --noEmit
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit the state machine**

```bash
git add package.json src/config/navigation-sheet-state.ts scripts/verify-navigation-sheet-state.ts
git commit -m "feat: add recursive navigation sheet state"
```

---

### Task 3: Unified recursive sheet renderer

**Files:**
- Create: `src/config/navigation-sheet-ui.ts`
- Create: `scripts/verify-navigation-sheet-ui.ts`
- Modify: `src/main.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: current frame/state from Task 2, recursively filtered nodes from Task 1, existing translation helpers and sidebar visual tokens supplied by `main.ts`.
- Produces: `renderRecursiveNavigationSheet(options)` and stable DOM hooks `data-navigation-sheet-root`, `data-navigation-branch`, `data-navigation-leaf`, `data-navigation-back`, `data-navigation-close`, `data-navigation-query`.

- [ ] **Step 1: Write failing HTML contract verification**

Create `scripts/verify-navigation-sheet-ui.ts` that calls the renderer with one branch and one leaf, then asserts:

```ts
assert.match(html, /role="dialog"/);
assert.match(html, /aria-modal="true"/);
assert.match(html, /data-navigation-branch="branch"/);
assert.match(html, /data-navigation-leaf="leaf"/);
assert.match(html, /data-navigation-back/);
assert.doesNotMatch(html, /aria-expanded=/);
assert.match(emptyHtml, /未找到匹配菜单/);
```

Also assert that a closed sheet contains `inert` and `aria-hidden="true"`.

- [ ] **Step 2: Add the command and verify failure**

Add `"verify:navigation-sheet-ui": "npx tsx scripts/verify-navigation-sheet-ui.ts"` and run it. Expected: FAIL because the renderer does not exist.

- [ ] **Step 3: Implement the focused renderer**

`renderRecursiveNavigationSheet` accepts plain values so it stays independently testable:

```ts
export interface NavigationSheetRenderOptions {
  open: boolean;
  frame: NavigationSheetFrame | null;
  visibleNodes: NavigationNode[];
  activeRoute: string;
  reducedMotion: boolean;
  labels: {
    back: string;
    close: string;
    searchPlaceholder: string;
    empty: string;
  };
}
```

Render branches as `<button type="button" data-navigation-branch="...">` with a trailing chevron and visually hidden “进入下一级” text. Render leaves as `<a href="#..." data-navigation-leaf="...">`. Use one absolutely positioned panel with direction classes for forward/back animations; do not render ancestor panels. Keep `role="dialog" aria-modal="true"`, `inert` while closed, current-route highlighting, and a `tabindex="-1"` heading fallback.

- [ ] **Step 4: Replace all sheet markup in `main.ts`**

Render one recursive sheet beside the primary navigation. Remove calls to the dedicated inventory/product/marketing/promotions/members/gift-cards/reports/print/reservations/finance/generic sheet renderers. Delete renderer functions only after `rg` confirms there are no remaining call sites. Keep business-content renderers and page-local tabs unchanged.

- [ ] **Step 5: Make every global branch a sheet trigger**

Update `renderSidebarModule()` so `module.children.length > 0` always renders a button with `data-navigation-root="${module.id}"`; only modules without children render direct links. Remove dispatch decisions based on `subNavPlacement`, and mark `subNavPlacement` deprecated in `NavModule` until all callers are removed.

- [ ] **Step 6: Run renderer verification and type-check**

```bash
npm run verify:navigation-sheet-ui
npm run verify:navigation-sheet-state
npm run verify:recursive-navigation-tree
npx tsc --noEmit
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit the renderer migration**

```bash
git add package.json src/main.ts src/config/navigation-sheet-ui.ts scripts/verify-navigation-sheet-ui.ts
git commit -m "feat: render recursive navigation sheet"
```

---

### Task 4: Recursive interaction, focus, and routing

**Files:**
- Create: `src/config/navigation-sheet-controller.ts`
- Create: `scripts/verify-navigation-sheet-controller.ts`
- Modify: `src/main.ts`
- Modify: `src/config/hub-sheet-search.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: canonical nodes from Task 1, state transitions from Task 2, DOM hooks from Task 3, existing `replaceHashPath()` callback supplied by `main.ts`.
- Produces: `bindRecursiveNavigationSheet(options)`, `closeRecursiveNavigationSheet()`, and deterministic focus/search behavior.

- [ ] **Step 1: Write failing controller contract verification**

Create a source-level/executable verifier following existing project script conventions. It must assert these exported controller outcomes through injected callbacks and minimal fake elements:

```ts
// root click: open(root), render(), route unchanged
// branch click: push(branch), render(), route unchanged
// leaf click: clear(), navigate(leaf.route), render()
// back with depth > 1: pop(), render()
// back at root: clear(), render(), focus origin
// Escape: clear(), render(), focus origin
// transitionLocked: branch and leaf clicks are ignored
```

Also assert query clearing on open, push, pop, leaf, and close.

- [ ] **Step 2: Run the verifier to prove failure**

Add `"verify:navigation-sheet-controller": "npx tsx scripts/verify-navigation-sheet-controller.ts"`; run it and expect missing controller exports.

- [ ] **Step 3: Implement event delegation**

Create `bindRecursiveNavigationSheet({ container, roots, render, navigate, getVisibleChildren, prefersReducedMotion })`. Delegate root, branch, leaf, back, close, search input, overlay, and Escape behavior from stable data attributes. A branch click pushes state and never calls `navigate`. A leaf click validates `route`, clears state, then calls `navigate(route)` exactly once.

- [ ] **Step 4: Implement deterministic focus and modal behavior**

On open and push, focus `[data-navigation-item]:not([disabled])`; fall back to `[data-navigation-sheet-heading]`. On pop, focus `[data-navigation-item-id="${triggerNodeId}"]`, with the same fallback. On close, restore the original root button by stable DOM ID. Trap Tab/Shift+Tab inside the open dialog and keep the existing background inert/overlay behavior. If reduced motion is requested, skip the transition lock timeout; otherwise unlock on `transitionend` with a defensive timeout equal to the CSS duration.

- [ ] **Step 5: Retire storage and route-driven auto-open logic**

Remove `NAV_MODULE_SHEETS_OPEN_KEY`, all dedicated sheet open keys, their `read*Open` / `set*Open` functions, `last*MountPath` auto-open synchronization, and route-change code that restores sheets. Refresh, deep link, and browser history must only render content with a closed navigation state.

- [ ] **Step 6: Reduce hub search to current-frame filtering**

Keep reusable normalization/highlight helpers in `hub-sheet-search.ts`, but remove hub-wide result panel and main-content jump coupling from navigation-sheet calls. The controller stores one current-frame query; entering or leaving any frame clears it. Zero matches render the Task 3 empty state.

- [ ] **Step 7: Run all navigation verification scripts**

```bash
npm run verify:recursive-navigation-tree
npm run verify:navigation-sheet-state
npm run verify:navigation-sheet-ui
npm run verify:navigation-sheet-controller
npx tsc --noEmit
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit interaction migration**

```bash
git add package.json src/main.ts src/config/hub-sheet-search.ts src/config/navigation-sheet-controller.ts scripts/verify-navigation-sheet-controller.ts
git commit -m "feat: add recursive navigation interactions"
```

---

### Task 5: Regression verification and production build

**Files:**
- Create: `scripts/verify-recursive-navigation-integration.ts`
- Modify: `package.json`
- Modify if defects are found: `src/config/navigation-tree.ts`, `src/config/navigation-sheet-state.ts`, `src/config/navigation-sheet-ui.ts`, `src/config/navigation-sheet-controller.ts`, `src/main.ts`

**Interfaces:**
- Consumes: completed recursive navigation implementation.
- Produces: one repeatable integration verification command and browser QA evidence.

- [ ] **Step 1: Add integration assertions**

Create `scripts/verify-recursive-navigation-integration.ts` to verify every visible root with children renders as a root button, every recursive authored branch renders as a branch button, every authored leaf has a valid route, all routes exist in `flattenNavigationRoutes()`, no `sessionStorage` navigation-sheet keys remain, and no dedicated sheet renderer call sites remain in `main.ts`.

- [ ] **Step 2: Add and run the integration command**

Add:

```json
"verify:recursive-navigation": "npm run verify:recursive-navigation-tree && npm run verify:navigation-sheet-state && npm run verify:navigation-sheet-ui && npm run verify:navigation-sheet-controller && npx tsx scripts/verify-recursive-navigation-integration.ts"
```

Run `npm run verify:recursive-navigation`. Expected: all assertions pass.

- [ ] **Step 3: Run the production build**

```bash
npm run build
```

Expected: TypeScript and Vite build exit 0. Preserve unrelated pre-existing `dist` changes; review generated changes before staging.

- [ ] **Step 4: Start the app and perform browser QA**

Run the existing development server and verify:

1. A root with second-level children opens the sheet without changing the hash.
2. Product Center drills from root to second, third, and available fourth levels in one fixed-width panel.
3. Back returns one level; back at root closes and restores focus.
4. A leaf changes the hash once, closes the sheet, and displays its content.
5. Search filters only the current frame, shows the named empty state, and clears on every frame transition.
6. Escape closes; Tab remains inside the open dialog; reduced-motion mode has no sliding animation.
7. Refresh, copied deep link, and browser back/forward keep the sheet closed.
8. Narrow viewport keeps one panel width and does not stack panels over the content.

- [ ] **Step 5: Inspect the final diff**

```bash
git diff -- src/config/navigation.ts src/config/navigation-tree.ts src/config/navigation-sheet-state.ts src/config/navigation-sheet-ui.ts src/config/navigation-sheet-controller.ts src/config/hub-sheet-search.ts src/main.ts scripts/verify-recursive-navigation-*.ts package.json
git status --short
```

Expected: only the planned source, verifier, package script, and intentional build outputs are attributable to this feature; unrelated user changes remain untouched.

- [ ] **Step 6: Commit verification and final fixes**

```bash
git add package.json scripts/verify-recursive-navigation-integration.ts src/config/navigation.ts src/config/navigation-tree.ts src/config/navigation-sheet-state.ts src/config/navigation-sheet-ui.ts src/config/navigation-sheet-controller.ts src/config/hub-sheet-search.ts src/main.ts
git commit -m "test: verify recursive navigation flow"
```

