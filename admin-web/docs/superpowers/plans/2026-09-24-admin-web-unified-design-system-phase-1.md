# Main Admin Unified Design System Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the enforceable main-admin design-system foundation and migrate `/orders/settings` as the first production sample without changing its six-group information architecture or the existing overlay secondary-navigation interaction.

**Architecture:** Keep the current Vite + TypeScript + HTML-string runtime. Add a small, framework-neutral design-system layer for tokens, page-pattern contracts, settings layout primitives, routing state, and verification; integrate CC FE Kit only after an isolated compatibility spike proves that its runtime and CSS can coexist with the current application. Reuse the existing page-draft and deployment pipeline so the sample page remains one Hub, one draft bucket, and one global save.

**Tech Stack:** Vite 6, TypeScript 5.6, Tailwind CSS v4, native DOM/HTML-string rendering, Node/tsx verification scripts; CC FE Kit version and peer dependencies are gated by Task 1.

**Spec:** `docs/superpowers/specs/2026-09-24-admin-web-unified-design-system-design.md`

## Global Constraints

- Scope is limited to the main admin under `src`; do not modify `TipOut`, `vendor/emenu-new`, `src/emenu-local`, `src/pit`, authentication onboarding, or embedded-app internals.
- Keep the current interaction: secondary navigation slides over and replaces primary navigation inside the same sidebar footprint; the main content does not move, resize, or dim.
- Use cobalt blue `#146EF5` as the light-theme primary color, with `#0E5ED7` hover and `#0A4FB8` active states.
- `/orders/settings` keeps exactly these groups and order: `order-basics`, `order-edit-split-merge`, `order-void-refund`, `order-discount`, `order-surcharge-fees`, `order-settlement-rounding`.
- CSS viewport `>=1024px` uses a vertical settings category nav; `<1024px` uses a category Select. Settings content width `<720px` uses the single-column field layout.
- The Hub owns one draft bucket and one global save/cancel action across all categories; hidden dirty/error categories remain visible through status indicators.
- Basic controls must use CC FE Kit when Task 1 proves compatibility; otherwise use only an approved shared-project fallback recorded in `docs/design-system/cc-fe-kit-gap-matrix.md`.
- Visual checks cover `1440x1024`, `1280x720`, and `1024x768`; Chinese is the baseline and English is an overflow smoke test.
- Preserve unrelated working-tree changes. Execute this plan in an isolated worktree created from the intended base commit; do not build on the currently dirty checkout.
- Changes under `vendor/emenu-new` are forbidden in this phase, so `npm run build:emenu-new-embed -- --skip-install` is not expected. If scope changes and that directory is touched, the repository AGENTS.md build/publish verification becomes mandatory.

---

## File Structure

### New files

- `DESIGN.md` — short, agent-facing entry point linking the normative spec and enforceable rules.
- `docs/design-system/cc-fe-kit-gap-matrix.md` — compatibility result and approved fallbacks.
- `docs/design-system/page-patterns.md` — seven `pagePattern` definitions and Figma-node mapping.
- `docs/design-system/page-review-checklist.md` — PR/QA checklist.
- `src/ui/design-system/page-pattern.ts` — supported pattern names and structural class contracts.
- `src/ui/design-system/settings-layout.ts` — framework-neutral settings Hub HTML helpers.
- `src/config/order-settings-route-state.ts` — pure route normalization and category history/scroll rules.
- `src/config/order-settings-group-status.ts` — pure dirty/error aggregation by group.
- `scripts/verify-cc-fe-kit-probe.mjs` — deterministic compatibility assertions for the spike.
- `scripts/verify-admin-design-system-contract.ts` — token, pattern, and prohibited-control checks.
- `scripts/verify-order-settings-route-state.ts` — route-state contract tests.
- `scripts/verify-order-settings-group-status.ts` — hidden dirty/error aggregation tests.
- `scripts/verify-order-settings-page-ui.mjs` — static DOM/ARIA/layout contract checks.
- `docs/design-system/baselines/README.md` — screenshot names, routes, fixtures, and viewport matrix.

### Existing files to modify

- `package.json` — add focused verification commands and only the dependencies approved by Task 1.
- `src/styles/app.css` — semantic cobalt tokens and reusable page/settings pattern classes.
- `src/ui/index.ts` — export the design-system primitives.
- `src/main.ts` — consume route state, settings layout helpers, category status, and existing sidebar contract.
- `src/config/order-settings-group-keys.ts` — export a typed canonical group list instead of duplicating keys.
- `src/config/page-settings-draft.ts` — expose read-only draft inspection needed for category status; do not change persistence semantics.
- `scripts/verify-recursive-navigation-interaction.mjs` — extend assertions for focus, inert primary nav, same-footprint overlay, and main-content stability.

---

### Task 1: Prove or Reject CC FE Kit Compatibility

**Files:**
- Create: `docs/design-system/cc-fe-kit-gap-matrix.md`
- Create: `scripts/verify-cc-fe-kit-probe.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: CC FE Kit Button, Input, Select, Switch, and Modal documentation/API available at implementation time.
- Produces: one decision value recorded in the matrix: `native-compatible`, `react-island`, or `blocked`; exact package/version/peer dependency data; approved component source for later tasks.

- [ ] **Step 1: Record the pre-install dependency baseline**

Run:

```powershell
npm ls --depth=0
npm run build
```

Expected: the existing project builds; output contains no CC FE Kit, React, or Ant Design dependency unless another in-flight branch intentionally added it.

- [ ] **Step 2: Inspect the live component documentation and internal package metadata**

Record these exact rows in `docs/design-system/cc-fe-kit-gap-matrix.md`:

```markdown
| Requirement | Evidence | Result |
|---|---|---|
| Package name and allowed version | package metadata / internal registry | native-compatible, react-island, or blocked |
| Required runtime | peerDependencies | exact package names and versions |
| CSS entry/reset | documented import | exact import path and load order |
| Button/Input/Select/Switch/Modal | documented API pages | supported or gap ID |
| Keyboard/focus behavior | isolated probe | pass or gap ID |
| Theme override | isolated probe | token mapping or gap ID |
```

Do not infer prop names. Copy import paths and APIs from the version actually available during implementation.

- [ ] **Step 3: Add the smallest isolated probe supported by the discovered runtime**

If the library exports framework-neutral custom elements/functions, create a hidden development-only mount in `scripts/verify-cc-fe-kit-probe.mjs`. If it requires React, add one isolated probe entry under `src/ui/cc-fe-kit-probe/` and do not convert the application shell. If package access is blocked, do not add dependencies; record `blocked` and map all five components to the existing shared-project fallback with owner and review date.

The verifier must assert these exact gates:

```js
assert.equal(result.buildSucceeded, true);
assert.equal(result.duplicateRuntimeDetected, false);
assert.equal(result.globalStyleLeakDetected, false);
assert.deepEqual(result.keyboardChecks, {
  button: true,
  input: true,
  select: true,
  switch: true,
  modalFocusTrap: true,
});
assert.equal(result.themePrimaryApplied, "#146EF5");
```

- [ ] **Step 4: Add and run the probe command**

Add to `package.json`:

```json
"verify:cc-fe-kit-probe": "node scripts/verify-cc-fe-kit-probe.mjs"
```

Run:

```powershell
npm run verify:cc-fe-kit-probe
npm run build
```

Expected: PASS for all applicable gates, or a deliberate `blocked` result with complete gap rows and no partial dependency installation.

- [ ] **Step 5: Commit the compatibility decision**

```powershell
git add package.json package-lock.json docs/design-system/cc-fe-kit-gap-matrix.md scripts/verify-cc-fe-kit-probe.mjs src/ui/cc-fe-kit-probe
git commit -m "docs: validate cc fe kit integration"
```

Omit paths that were not created by the selected decision.

---

### Task 2: Freeze Design Tokens and Governance Entry Points

**Files:**
- Create: `DESIGN.md`
- Create: `docs/design-system/page-patterns.md`
- Create: `docs/design-system/page-review-checklist.md`
- Create: `scripts/verify-admin-design-system-contract.ts`
- Modify: `src/styles/app.css:13-91`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 component decision and the normative spec.
- Produces: Tailwind semantic tokens, seven canonical `pagePattern` names, and the first static enforcement command.

- [ ] **Step 1: Write the failing token and governance verifier**

Create `scripts/verify-admin-design-system-contract.ts` with assertions for the frozen values:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/app.css", import.meta.url), "utf8");
const design = readFileSync(new URL("../DESIGN.md", import.meta.url), "utf8");

assert.match(css, /--color-primary:\s*#146EF5;/i);
assert.match(css, /--color-primary-hover:\s*#0E5ED7;/i);
assert.match(css, /--color-primary-active:\s*#0A4FB8;/i);
assert.match(css, /--color-sidebar:\s*#142235;/i);
assert.match(css, /--color-background:\s*#F5F8FC;/i);
assert.match(css, /--color-ring:\s*#3B73D1;/i);
assert.match(design, /CC FE Kit/);
assert.match(design, /pagePattern/);
assert.match(design, /\/orders\/settings/);
```

- [ ] **Step 2: Run the verifier and confirm it fails**

Run:

```powershell
npx.cmd --yes tsx scripts/verify-admin-design-system-contract.ts
```

Expected: FAIL on the current teal/OKLCH primary token or missing `DESIGN.md`.

- [ ] **Step 3: Replace light-theme tokens with the approved semantic values**

In `src/styles/app.css`, define these values in `@theme` and keep dark mode functional but out of visual-baseline scope:

```css
--color-primary: #146EF5;
--color-primary-hover: #0E5ED7;
--color-primary-active: #0A4FB8;
--color-primary-foreground: #FFFFFF;
--color-accent: #EAF3FF;
--color-accent-foreground: #0A4FB8;
--color-background: #F5F8FC;
--color-foreground: #142033;
--color-card: #FFFFFF;
--color-card-foreground: #142033;
--color-muted: #EDF2F8;
--color-muted-foreground: #607089;
--color-border: #D9E2EF;
--color-input: #66758A;
--color-ring: #3B73D1;
--color-sidebar: #142235;
--color-sidebar-foreground: #F7FAFF;
--color-sidebar-muted: #AEBBC9;
--color-sidebar-active: #146EF5;
--color-sidebar-active-fg: #FFFFFF;
```

Also add `--spacing-*`, `--radius-*`, `--control-height-*`, and motion tokens exactly as specified in the design document. Do not add page-local hexadecimal colors.

- [ ] **Step 4: Write the three governance documents**

`DESIGN.md` must contain: scope matrix, normative-spec link, source priority, token rule, page-pattern declaration rule, CC FE Kit gate, navigation invariant, settings layout invariant, and verification commands.

`docs/design-system/page-patterns.md` must list exactly:

```ts
type PagePattern =
  | "table-list"
  | "card-list"
  | "settings-detail"
  | "fullscreen-form"
  | "modal-compact"
  | "modal-standard"
  | "modal-wide";
```

`docs/design-system/page-review-checklist.md` must use checkboxes for structure, one-primary-action, states, keyboard, focus restoration, 1024 compatibility, 200% zoom, Chinese baseline, English overflow, and gap-matrix references.

- [ ] **Step 5: Add the verifier command and run all gates**

Add:

```json
"verify:admin-design-system": "npx tsx scripts/verify-admin-design-system-contract.ts"
```

Run:

```powershell
npm run verify:admin-design-system
npm run build
```

Expected: PASS; generated CSS uses the approved cobalt system and the existing application still builds.

- [ ] **Step 6: Commit tokens and governance**

```powershell
git add DESIGN.md docs/design-system src/styles/app.css scripts/verify-admin-design-system-contract.ts package.json
git commit -m "feat: establish admin design system tokens"
```

---

### Task 3: Add Framework-Neutral Page Pattern Primitives

**Files:**
- Create: `src/ui/design-system/page-pattern.ts`
- Create: `src/ui/design-system/settings-layout.ts`
- Modify: `src/ui/index.ts`
- Modify: `src/styles/app.css`
- Modify: `scripts/verify-admin-design-system-contract.ts`

**Interfaces:**
- Consumes: semantic tokens from Task 2.
- Produces: `PagePattern`, `PAGE_PATTERN_META`, `renderSettingsHubLayout()`, `renderSimpleSettingRow()`, and `renderComplexSettingRow()`.

- [ ] **Step 1: Add failing interface assertions**

Extend `scripts/verify-admin-design-system-contract.ts`:

```ts
import {
  PAGE_PATTERN_META,
  assertPagePattern,
} from "../src/ui/design-system/page-pattern";
import {
  renderComplexSettingRow,
  renderSettingsHubLayout,
  renderSimpleSettingRow,
} from "../src/ui/design-system/settings-layout";

assert.equal(Object.keys(PAGE_PATTERN_META).length, 7);
assert.equal(assertPagePattern("settings-detail"), "settings-detail");
assert.throws(() => assertPagePattern("freeform"));
assert.match(renderSettingsHubLayout({ categoryNavHtml: "NAV", contentHtml: "BODY" }), /data-page-pattern="settings-detail"/);
assert.match(renderSimpleSettingRow({ id: "demo", title: "Title", description: "Desc", controlHtml: "CONTROL" }), /data-setting-layout="simple"/);
assert.match(renderComplexSettingRow({ id: "demo", title: "Title", description: "Desc", controlHtml: "CONTROL" }), /data-setting-layout="complex"/);
```

- [ ] **Step 2: Run and confirm missing-module failure**

```powershell
npm run verify:admin-design-system
```

Expected: FAIL because the two new modules do not exist.

- [ ] **Step 3: Implement the page-pattern contract**

In `src/ui/design-system/page-pattern.ts` export:

```ts
export const PAGE_PATTERNS = [
  "table-list",
  "card-list",
  "settings-detail",
  "fullscreen-form",
  "modal-compact",
  "modal-standard",
  "modal-wide",
] as const;

export type PagePattern = (typeof PAGE_PATTERNS)[number];

export const PAGE_PATTERN_META: Record<PagePattern, { maxWidth?: number; modal: boolean }> = {
  "table-list": { modal: false },
  "card-list": { modal: false },
  "settings-detail": { modal: false },
  "fullscreen-form": { modal: true },
  "modal-compact": { modal: true, maxWidth: 640 },
  "modal-standard": { modal: true, maxWidth: 800 },
  "modal-wide": { modal: true, maxWidth: 1000 },
};

export function assertPagePattern(value: string): PagePattern {
  if (!PAGE_PATTERNS.includes(value as PagePattern)) {
    throw new Error(`Unsupported pagePattern: ${value}`);
  }
  return value as PagePattern;
}
```

- [ ] **Step 4: Implement settings layout helpers**

Use escaped text inputs and trusted pre-rendered control HTML. Required signatures:

```ts
export interface SettingRowInput {
  id: string;
  title: string;
  description: string;
  controlHtml: string;
  errorHtml?: string;
}

export function renderSettingsHubLayout(input: {
  categoryNavHtml: string;
  categorySelectHtml?: string;
  contentHtml: string;
}): string;

export function renderSimpleSettingRow(input: SettingRowInput): string;
export function renderComplexSettingRow(input: SettingRowInput): string;
```

The simple helper must render title and description before the control in DOM order even when CSS displays two columns. The complex helper must render title, description, then full-width control.

- [ ] **Step 5: Add reusable component-layer classes**

Add classes under `@layer components` in `src/styles/app.css` for:

```css
.admin-page-shell
.admin-page-header
.settings-hub-grid
.settings-category-nav
.settings-category-select
.setting-row-simple
.setting-row-complex
.settings-save-bar
```

Use `@media (max-width: 1023px)` for nav-to-Select and `@container (max-width: 719px)` for simple-row stacking. Do not encode page-specific selectors.

- [ ] **Step 6: Export, verify, build, and commit**

```powershell
npm run verify:admin-design-system
npm run build
git add src/ui/design-system src/ui/index.ts src/styles/app.css scripts/verify-admin-design-system-contract.ts
git commit -m "feat: add admin page pattern primitives"
```

Expected: both commands PASS.

---

### Task 4: Make Order Settings Routing Deterministic

**Files:**
- Create: `src/config/order-settings-route-state.ts`
- Create: `scripts/verify-order-settings-route-state.ts`
- Modify: `src/config/order-settings-group-keys.ts`
- Modify: `src/main.ts:4285-4330`
- Modify: `package.json`

**Interfaces:**
- Consumes: canonical order-settings groups.
- Produces: `ORDER_SETTINGS_GROUPS`, `resolveOrderSettingsRoute()`, `orderSettingsScrollKey()`, and `rememberOrderSettingsGroup()`.

- [ ] **Step 1: Export the canonical typed group list**

Add to `src/config/order-settings-group-keys.ts`:

```ts
export const ORDER_SETTINGS_GROUPS = [
  "order-basics",
  "order-edit-split-merge",
  "order-void-refund",
  "order-discount",
  "order-surcharge-fees",
  "order-settlement-rounding",
] as const;

export type OrderSettingsGroupKey = (typeof ORDER_SETTINGS_GROUPS)[number];
export const DEFAULT_ORDER_SETTINGS_GROUP: OrderSettingsGroupKey = "order-basics";
```

Derive `ORDER_SETTINGS_GROUP_TITLES` and validation from this list; do not introduce a second order source.

- [ ] **Step 2: Write route-state tests first**

The verifier must cover these inputs:

```ts
assert.deepEqual(resolveOrderSettingsRoute("/orders/settings", undefined), {
  kind: "replace",
  groupKey: "order-basics",
  path: "/orders/settings/order-basics",
});
assert.equal(resolveOrderSettingsRoute("/orders/settings/order-discount", undefined).kind, "valid");
assert.equal(resolveOrderSettingsRoute("/orders/settings/order-numbering", undefined).path, "/orders/settings/order-basics");
assert.equal(resolveOrderSettingsRoute("/orders/settings/unknown", undefined).showInvalidGroupMessage, true);
assert.equal(orderSettingsScrollKey("order-discount"), "/orders/settings::order-discount");
```

- [ ] **Step 3: Run and confirm failure**

```powershell
npx.cmd --yes tsx scripts/verify-order-settings-route-state.ts
```

Expected: FAIL because `order-settings-route-state.ts` does not exist.

- [ ] **Step 4: Implement the pure route resolver**

Required result type:

```ts
export interface OrderSettingsRouteResolution {
  kind: "valid" | "replace";
  groupKey: OrderSettingsGroupKey;
  path: string;
  showInvalidGroupMessage: boolean;
}
```

Root paths use the session-memory last group or default; legacy keys replace to canonical; unknown keys replace to default with the message flag. Scroll memory remains an in-memory `Map<string, number>` and is never persisted to localStorage.

- [ ] **Step 5: Replace inline legacy routing in `src/main.ts`**

Call the resolver during existing hash normalization. Use `replaceHashPath()` only for `kind === "replace"`; do not add history entries for normalization. Keep user category clicks as normal hash navigation so Back/Forward works.

- [ ] **Step 6: Add command, verify, and commit**

Add:

```json
"verify:order-settings-route": "npx tsx scripts/verify-order-settings-route-state.ts"
```

Run:

```powershell
npm run verify:order-settings-route
npm run verify:admin-design-system
npm run build
git add src/config/order-settings-group-keys.ts src/config/order-settings-route-state.ts src/main.ts scripts/verify-order-settings-route-state.ts package.json
git commit -m "refactor: centralize order settings routing"
```

---

### Task 5: Add Cross-Category Dirty and Error Status

**Files:**
- Create: `src/config/order-settings-group-status.ts`
- Create: `scripts/verify-order-settings-group-status.ts`
- Modify: `src/config/page-settings-draft.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: page draft entries, catalog `seq -> groupKey`, field validation errors.
- Produces: `getOrderSettingsGroupStatuses()` and read-only `listPageDraftEntries()`.

- [ ] **Step 1: Expose draft entries without exposing mutable maps**

Add to `src/config/page-settings-draft.ts`:

```ts
export function listPageDraftEntries(pageKey: string): readonly PageDraftEntry[] {
  return [...(buckets.get(resolvePageSaveKey(pageKey))?.drafts.values() ?? [])];
}
```

Return a new array every time. Do not expose `buckets` or permit mutation through the returned collection.

- [ ] **Step 2: Write group-status tests**

Cover hidden dirty groups and multiple errors:

```ts
const statuses = getOrderSettingsGroupStatuses({
  drafts: [
    { kind: "toggle", seq: 126, value: true },
    { kind: "toggle", seq: 162, value: false },
  ],
  errors: [
    { seq: 162, fieldId: "discount-reason", message: "必填" },
    { seq: 163, fieldId: "discount-list", message: "至少一项" },
  ],
});
assert.equal(statuses["order-basics"].dirty, true);
assert.equal(statuses["order-discount"].dirty, true);
assert.equal(statuses["order-discount"].errorCount, 2);
assert.equal(firstInvalidOrderSettingsGroup(statuses), "order-discount");
```

- [ ] **Step 3: Implement aggregation**

Required types:

```ts
export interface OrderSettingsFieldError {
  seq: number;
  fieldId: string;
  message: string;
}

export interface OrderSettingsGroupStatus {
  dirty: boolean;
  errorCount: number;
}
```

Initialize all six canonical groups, map draft/error `seq` values through `resolveOrderCatalogGroupKeyForSeq()`, and return the first invalid group in canonical order.

- [ ] **Step 4: Add command and run the focused suite**

```json
"verify:order-settings-status": "npx tsx scripts/verify-order-settings-group-status.ts"
```

```powershell
npm run verify:order-settings-status
npm run verify:order-settings-route
npm run build
```

Expected: PASS; no persisted-setting semantics change.

- [ ] **Step 5: Commit status infrastructure**

```powershell
git add src/config/page-settings-draft.ts src/config/order-settings-group-status.ts scripts/verify-order-settings-group-status.ts package.json
git commit -m "feat: track order settings category status"
```

---

### Task 6: Migrate `/orders/settings` to the Standard Settings Layout

**Files:**
- Modify: `src/main.ts:5669-6088`
- Modify: `src/main.ts:6319-6687`
- Modify: `src/main.ts` module-settings page renderer around `renderModuleSettingsPage()`
- Modify: `src/styles/app.css`
- Create: `scripts/verify-order-settings-page-ui.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Tasks 3-5 helpers and existing `MODULE_SETTINGS_BY_PATH`, page-save draft, deployment, and toast APIs.
- Produces: categorized `/orders/settings` markup, responsive category Select, standard field rows, status badges, and one global save bar.

- [ ] **Step 1: Write static UI contract checks before markup changes**

`scripts/verify-order-settings-page-ui.mjs` must assert the built source contains:

```js
assert.match(source, /data-page-pattern="settings-detail"/);
assert.match(source, /aria-label="设置分类"/);
assert.match(source, /data-order-settings-category-select/);
assert.match(source, /data-setting-layout="simple"/);
assert.match(source, /data-setting-layout="complex"/);
assert.match(source, /data-order-settings-dirty/);
assert.match(source, /data-order-settings-error-count/);
assert.match(source, /data-page-save-bar/);
```

Also assert the six canonical group keys appear in the generated nav and that no seventh group is introduced.

- [ ] **Step 2: Run and confirm contract failure**

```powershell
node scripts/verify-order-settings-page-ui.mjs
```

Expected: FAIL on the missing standard-layout markers.

- [ ] **Step 3: Render category navigation and responsive Select**

For `/orders/settings` only, render the vertical nav from `ORDER_SETTINGS_GROUPS` and a Select with the same options. Both controls navigate to `/orders/settings/<groupKey>`; only CSS determines which is visible. Each option/nav item includes a dirty marker and visible error count when present.

Do not alter category data for other settings Hubs in this task.

- [ ] **Step 4: Render only the active category**

Filter normalized catalog items to the active `groupKey`. Preserve the existing catalog order inside that group and existing custom renderers for sequences `126-131`, `115-117`, `119`, `124`, `140`, `156-159`, `162-163`, `446-447`, `149`, `161`, and `147`.

Wrap simple controls with `renderSimpleSettingRow()` and composite/custom panels with `renderComplexSettingRow()`. The title and `sceneDesc` remain visible even when the current renderer previously omitted the description.

- [ ] **Step 5: Connect the global Hub save state**

Use `/orders/settings` as the page-save key. The save button commits all category drafts; cancel discards the whole Hub. On validation failure:

1. compute all group statuses;
2. navigate to the first invalid group in canonical order;
3. render;
4. scroll to and focus the first invalid field;
5. retain drafts from every category.

Keep the save-bar DOM position stable in pristine state and disable its save action; apply emphasis/visibility only when dirty.

- [ ] **Step 6: Bind category scroll memory**

Before category navigation, store the current content scrollTop under `orderSettingsScrollKey(groupKey)`. On Back/Forward restore the remembered value with `requestAnimationFrame`; on full reload start at zero. Category switches must not close the order-center secondary sheet.

- [ ] **Step 7: Add command and run focused regressions**

Add:

```json
"verify:order-settings-page": "node scripts/verify-order-settings-page-ui.mjs && npm run verify:order-settings-route && npm run verify:order-settings-status"
```

Run:

```powershell
npm run verify:order-settings-page
npm run verify:recursive-navigation
npm run build
```

Expected: PASS; legacy settings controls retain their existing behavior inside the new layout.

- [ ] **Step 8: Commit the sample migration**

```powershell
git add src/main.ts src/styles/app.css scripts/verify-order-settings-page-ui.mjs package.json
git commit -m "feat: migrate order settings to unified layout"
```

---

### Task 7: Lock the Sidebar Overlay and Accessibility Contract

**Files:**
- Modify: `scripts/verify-recursive-navigation-interaction.mjs`
- Modify: `src/main.ts:2550-3550`
- Modify: `src/main.ts:4882-5505`
- Modify: `src/styles/app.css`

**Interfaces:**
- Consumes: current sidebar sheet open/close functions.
- Produces: deterministic focus restoration, primary-nav inertness, reduced motion, and content geometry invariants.

- [ ] **Step 1: Add failing source-contract assertions**

Extend the verifier to require:

```js
assert.match(source, /primaryNav\.inert\s*=\s*sheetOpen/);
assert.match(source, /data-sidebar-secondary-sheet/);
assert.match(source, /focus\(\{\s*preventScroll:\s*true\s*\}\)/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(sheetOpenHandler, /classList\.(add|remove).*main.*(translate|scale|opacity)/);
```

Read both `src/main.ts` and `src/styles/app.css` in the verifier.

- [ ] **Step 2: Run and confirm failure**

```powershell
npm run verify:recursive-navigation
```

Expected: FAIL on any missing inert/focus marker.

- [ ] **Step 3: Implement focus and inert behavior**

When a secondary sheet opens: store the triggering primary button, set the covered primary nav container `inert = true`, expose the secondary nav to accessibility, and focus its back button without scrolling. When it closes: clear inert, restore the recorded scroll position, and focus the original primary button.

Do not add focus trap because this sheet is non-modal. Do not set main content inert, dimmed, translated, or resized.

- [ ] **Step 4: Implement reduced motion**

Keep the standard transition at `180ms cubic-bezier(0.2, 0, 0, 1)`. Under `prefers-reduced-motion: reduce`, eliminate transform transition duration while preserving final visibility and focus behavior.

- [ ] **Step 5: Run regressions and commit**

```powershell
npm run verify:recursive-navigation
npm run verify:order-settings-page
npm run build
git add src/main.ts src/styles/app.css scripts/verify-recursive-navigation-interaction.mjs
git commit -m "fix: enforce sidebar overlay accessibility"
```

---

### Task 8: Capture Acceptance Evidence and Finalize Enforcement

**Files:**
- Create: `docs/design-system/baselines/README.md`
- Create: `docs/design-system/baselines/orders-settings-1440x1024-zh.png`
- Create: `docs/design-system/baselines/orders-settings-1280x720-zh.png`
- Create: `docs/design-system/baselines/orders-settings-1024x768-zh.png`
- Create: `docs/design-system/baselines/orders-settings-1280x720-en.png`
- Modify: `scripts/verify-admin-design-system-contract.ts`
- Modify: `docs/design-system/page-review-checklist.md`

**Interfaces:**
- Consumes: completed sample page and deterministic demo fixture.
- Produces: reviewable visual baselines and a release gate for future pages.

- [ ] **Step 1: Reset the deterministic order-settings fixture**

Use the existing demo account/scenario tooling. Confirm the same merchant, store, locale, six group keys, and saved values before every capture. Record the exact reset command and route in `docs/design-system/baselines/README.md`.

- [ ] **Step 2: Capture the three Chinese viewports**

At each viewport capture `/orders/settings/order-basics` with the order-center secondary sheet open:

```text
1440x1024 -> vertical category nav, two-column simple rows
1280x720  -> vertical category nav, layout determined by actual >=720px content width
1024x768  -> 220px global sidebar, 160px category nav, single-column fields
```

Also capture one dirty state where another hidden category carries both dirty and error indicators.

- [ ] **Step 3: Capture English overflow smoke evidence**

At `1280x720`, switch UI locale to English and verify category labels, field descriptions, controls, and the save bar remain reachable without root horizontal scrolling.

- [ ] **Step 4: Run keyboard and state walkthrough**

Check and record PASS/FAIL for:

```text
Tab: top bar -> visible sidebar -> category nav -> content -> save bar
Open secondary sheet -> focus back button
Close secondary sheet -> restore trigger focus
Category Back/Forward -> restore selection and session scroll
Dirty category switch -> no leave prompt and no draft loss
Leave Hub dirty -> unified confirmation
Save hidden invalid category -> navigate/focus first invalid field
200% zoom -> category Select and reachable save action
Reduced motion -> instant sheet state change
```

- [ ] **Step 5: Add final static enforcement**

Extend `verify-admin-design-system-contract.ts` to scan newly changed main-admin page modules and reject new raw `<button>`, `<input>`, `<select>`, `<textarea>`, or page-local primary hex values unless the file is listed with a gap ID in `cc-fe-kit-gap-matrix.md`. Limit the initial scan to files changed after this design-system rollout so legacy debt does not block adoption.

- [ ] **Step 6: Run the complete Phase 1 gate**

```powershell
npm run verify:cc-fe-kit-probe
npm run verify:admin-design-system
npm run verify:order-settings-page
npm run verify:recursive-navigation
npm run build
```

Expected: all commands PASS; screenshots and checklist are complete; no eMenu embed build is triggered because excluded sources were untouched.

- [ ] **Step 7: Commit acceptance evidence**

```powershell
git add docs/design-system scripts/verify-admin-design-system-contract.ts
git commit -m "test: add admin design system acceptance gate"
```

---

## Self-Review Results

- **Spec coverage:** Phase 1 covers CC FE Kit gating, cobalt semantic tokens, page-pattern contracts, existing sidebar overlay behavior, the `/orders/settings` six-group sample, one Hub-wide draft/save lifecycle, responsive category/field behavior, accessibility, visual baselines, and governance documents.
- **Deliberately deferred:** migrating every historical page; implementing production examples for all seven page patterns beyond the shared contracts; dark-theme visual redesign; authentication, PIT, M-platform content, TipOut, and embedded-app internals.
- **Completeness scan:** no unresolved marker, open-ended error-handling instruction, or undefined testing step remains. Task 1 uses an explicit three-outcome gate because the package/runtime is external and must not be invented.
- **Type consistency:** `PagePattern`, `OrderSettingsGroupKey`, `OrderSettingsRouteResolution`, `OrderSettingsGroupStatus`, and settings-layout helper names are defined before consumption.
