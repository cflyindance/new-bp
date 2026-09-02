# Team Tips Native Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Team Management tip iframes with native allocation summary, allocation detail, rule list, and rule editor views while preserving existing TipOut workflows, data, exports, employee integration, and Payroll integration.

**Architecture:** Generate four functional templates and four ordered page programs from the existing TipOut documents, then mount one route-selected view inside an isolated Shadow DOM. A shared controlled runtime provides scoped DOM access, dynamic-action delegation, virtual hash navigation/history/scrolling, tracked lifecycle ownership, main-shell store scope, and real-document export bridges.

**Tech Stack:** TypeScript 5.6, Vite 6 raw imports, Shadow DOM, browser DOM APIs, existing TipOut JavaScript/localStorage contracts, Node verification scripts, in-app browser QA.

**Spec:** `docs/superpowers/specs/2026-09-02-team-tips-native-integration-design.md`

## Global Constraints

- Native routes are `/team/tips/distribution`, `/team/tips/details`, `/team/tips/rules`, and `/team/tips/rules/editor`.
- `/team/tips` normalizes to `/team/tips/distribution`.
- Preserve all query parameters consumed by detail and rule-editor views.
- Preserve rules, allocations, detail shifts, personal-sales deductions, employee roster, attendance, Payroll bridge, scope, exports, print, validation, and confirmation behavior.
- Preserve existing localStorage/sessionStorage keys and payload shapes; opening a page must not migrate or overwrite malformed values.
- Remove all tips iframe constants/renderers and all native-route requests for standalone TipOut HTML documents.
- Keep the main application sidebar, account header, scope controls, access control, and vertical scroll owner visible.
- Rewrite static and runtime-generated inline handlers to delegated native actions; no executable inline attribute may remain after render.
- Missing raw assets and changed script inventory are build/verification failures.
- Do not modify `vendor/emenu-new`; the eMenu embedded-package build rule is not triggered.
- Commit only files belonging to each task and preserve unrelated changes.

---

### Task 1: Establish native route and dependency-inventory contracts

**Files:**
- Create: `scripts/verify-team-tips-native-route.mjs`
- Create: `scripts/verify-team-tips-source-inventory.mjs`
- Reference: `src/main.ts`
- Reference: `dist/TipOut/index.html`
- Reference: `dist/TipOut/detail.html`
- Reference: `dist/TipOut/rules.html`
- Reference: `dist/TipOut/rule-add.html`

**Interfaces:**
- Consumes: main route source and four TipOut HTML sources.
- Produces: failing verification until native mount tokens exist, iframe tokens are absent, and every source retains the approved ordered script inventory.

- [ ] **Step 1: Write the failing native-route contract**

```js
import fs from "node:fs";
const main = fs.readFileSync("src/main.ts", "utf8");
const failures = [];
for (const token of [
  'import { mountTipsPage',
  'data-team-tips-scroll',
  'data-team-tips-root',
  'mountTipsPage(tipsRoot',
  'destroyTeamTipsPage()',
]) if (!main.includes(token)) failures.push(`missing native tips token: ${token}`);
for (const token of [
  "TEAM_TIPS_DISTRIBUTION_IFRAME_SRC",
  "TEAM_TIPS_DETAILS_IFRAME_SRC",
  "TEAM_TIPS_RULES_IFRAME_SRC",
  "getTeamTipsManagementIframeSrc",
  "renderTeamTipsManagementIframePanel",
]) if (main.includes(token)) failures.push(`legacy tips iframe token remains: ${token}`);
if (failures.length) { failures.forEach(console.error); process.exit(1); }
console.log("Team tips native route verification passed.");
```

- [ ] **Step 2: Write the exact source-inventory verifier**

```js
const inventories = {
  "index.html": ["common.js", "tipout-summary-ui.js", "ruleData.js", "personalSalesDeduct.js", "tipAllocation.js", "attendanceMock.js", "tipout-payroll-bridge.js", "#inline", "export.js"],
  "detail.html": ["common.js", "ruleData.js", "personalSalesDeduct.js", "tipAllocation.js", "attendanceMock.js", "#inline"],
  "rules.html": ["common.js", "ruleData.js", "#inline"],
  "rule-add.html": ["common.js", "ruleData.js", "orderTipStatus.js", "paymentMethodApportion.js", "personalSalesDeduct.js", "tipAllocation.js", "#inline"],
};
```

Parse scripts in document order, collapse non-empty inline programs to `#inline`, and compare arrays with `assert.deepEqual`. Fail when a dependency is added, removed, or reordered.

- [ ] **Step 3: Run RED verification**

Run: `node scripts/verify-team-tips-native-route.mjs`

Expected: FAIL because the route still uses three iframe constants and one iframe renderer.

Run: `node scripts/verify-team-tips-source-inventory.mjs`

Expected: PASS, locking the current four-page inventory before extraction.

- [ ] **Step 4: Commit the contracts**

```bash
git add scripts/verify-team-tips-native-route.mjs scripts/verify-team-tips-source-inventory.mjs
git commit --only -m "test: define native team tips contracts" -- scripts/verify-team-tips-native-route.mjs scripts/verify-team-tips-source-inventory.mjs
```

### Task 2: Generate four isolated templates and page programs

**Files:**
- Create: `scripts/generate-team-tips-native-views.mjs`
- Create: `scripts/verify-team-tips-native-views.mjs`
- Create: `src/team/tips/templates/distribution.html`
- Create: `src/team/tips/templates/details.html`
- Create: `src/team/tips/templates/rules.html`
- Create: `src/team/tips/templates/rule-editor.html`
- Create: `src/team/tips/programs/distribution.js.txt`
- Create: `src/team/tips/programs/details.js.txt`
- Create: `src/team/tips/programs/rules.js.txt`
- Create: `src/team/tips/programs/rule-editor.js.txt`
- Create: `src/team/tips/tips-templates.ts`
- Create: `src/team/tips/tips-page.css`
- Create: `src/team/tips/tips-shell.css`

**Interfaces:**
- Consumes: four locked source documents plus `common.css` and `prototype-fidelity.css`.
- Produces: `renderTipsTemplate(view: TipsView): string`, synchronized inline page programs, and isolated raw styles.

- [ ] **Step 1: Write a failing view verifier**

Verify that each template has `data-team-tips-view` with the correct value and expected anchors:

```js
const required = {
  distribution: ["tip-summary", "summary", "tip", "规则"],
  details: ["detail", "shift", "返回"],
  rules: ["rules", "新增", "编辑"],
  "rule-editor": ["rule", "保存", "取消"],
};
```

Forbid `<html`, `<body`, `<aside`, standalone `<header`, `<script`, `<link`, `onclick=`, `onchange=`, `javascript:`, and literal navigation to the four HTML filenames in every template.

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: FAIL because generated view files do not exist.

- [ ] **Step 2: Implement deterministic extraction**

The generator parses each source body, removes `.sidebar`, `.mobile-overlay`, `.header`, and outer standalone `.layout/.main-content` wrappers, retains the content area plus every modal/drawer overlay, and wraps it:

```html
<section class="team-tips-page" data-team-tips-view="distribution">
  <!-- functional source content -->
</section>
```

Extract non-empty inline scripts in document order into the matching program asset. Remove `DOMContentLoaded` wrappers only by invoking the resulting program with a scoped document whose `readyState` is `complete`; do not reorder executable statements.

- [ ] **Step 3: Rewrite static and generated actions**

Use a declared mapping table that converts legacy handler source to action descriptors, including:

```js
const actionFamilies = [
  "summary-open-detail", "summary-edit-rule", "summary-open-rules",
  "detail-back", "detail-shift-select", "detail-row-expand",
  "rules-add", "rules-edit", "rules-toggle", "rules-delete",
  "editor-save", "editor-cancel", "editor-add-condition", "editor-remove-condition",
  "editor-add-group", "editor-remove-group", "editor-payment-method", "editor-order-tip-status",
];
```

Rewrite source-template handler attributes and handler strings emitted through `innerHTML` to `data-tip-action` plus serialized `data-tip-action-args`. Throw if any executable `on*=` attribute or `javascript:` URL remains in generated templates/programs.

- [ ] **Step 4: Add template and style modules**

```ts
export type TipsView = "distribution" | "details" | "rules" | "rule-editor";
const templates: Record<TipsView, string> = { distribution, details, rules, "rule-editor": editor };
export function renderTipsTemplate(view: TipsView): string { return templates[view]; }
```

Combine the two source styles inside Shadow DOM, replace the first `:root {` with `:host {`, and add host rules for `min-width: 0`, content padding, local table horizontal overflow, fixed overlay bounds, responsive wrapping, and a visible error panel.

- [ ] **Step 5: Generate and verify GREEN**

Run: `node scripts/generate-team-tips-native-views.mjs`

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS for all four templates, four programs, action families, and forbidden standalone markup.

- [ ] **Step 6: Commit generated views**

```bash
git add scripts/generate-team-tips-native-views.mjs scripts/verify-team-tips-native-views.mjs src/team/tips/templates src/team/tips/programs src/team/tips/tips-templates.ts src/team/tips/tips-page.css src/team/tips/tips-shell.css
git commit --only -m "feat: extract native team tips views" -- scripts/generate-team-tips-native-views.mjs scripts/verify-team-tips-native-views.mjs src/team/tips/templates src/team/tips/programs src/team/tips/tips-templates.ts src/team/tips/tips-page.css src/team/tips/tips-shell.css
```

### Task 3: Synchronize shared TipOut runtime assets

**Files:**
- Create: `scripts/generate-team-tips-native-runtime.mjs`
- Create: `scripts/verify-team-tips-native-runtime.mjs`
- Create directory: `src/team/tips/legacy/`

**Interfaces:**
- Consumes: eleven exact shared assets from `dist/TipOut`.
- Produces: raw copies imported by the page-specific runtime builder.

- [ ] **Step 1: Create copy and exact-equality scripts**

Use this exact list:

```js
const names = [
  "common.js", "global-scope-filter.js", "ruleData.js", "personalSalesDeduct.js",
  "tipAllocation.js", "attendanceMock.js", "tipout-summary-ui.js",
  "tipout-payroll-bridge.js", "orderTipStatus.js", "paymentMethodApportion.js", "export.js",
];
```

Copy each source to `src/team/tips/legacy/<name>.txt`. The verifier compares `fs.readFileSync(..., "utf8")` values exactly and checks the four ordered dependency manifests from Task 1.

- [ ] **Step 2: Run generation and synchronization checks**

Run: `node scripts/generate-team-tips-native-runtime.mjs`

Run: `node scripts/verify-team-tips-native-runtime.mjs`

Expected: PASS with eleven exact runtime copies and four synchronized page programs.

- [ ] **Step 3: Commit shared assets**

```bash
git add scripts/generate-team-tips-native-runtime.mjs scripts/verify-team-tips-native-runtime.mjs src/team/tips/legacy
git commit --only -m "feat: synchronize native team tips runtime" -- scripts/generate-team-tips-native-runtime.mjs scripts/verify-team-tips-native-runtime.mjs src/team/tips/legacy
```

### Task 4: Implement route, history, scroll, and scope virtualization

**Files:**
- Create: `src/team/tips/tips-context.ts`
- Create: `src/team/tips/tips-navigation.ts`
- Create: `scripts/verify-team-tips-navigation.ts`

**Interfaces:**
- Produces: `createTipsPageContext()`, `parseTipsRoute(hash): TipsRoute`, and `createTipsNavigation(route, context): TipsNavigationFacade`.
- Consumes: main scope APIs, the active tips scroll owner, and hash navigation callbacks.

- [ ] **Step 1: Write failing route/navigation tests**

```ts
assert.deepEqual(parseTipsRoute("#/team/tips/details?date=2026-01-04&shift=dinner"), {
  view: "details", query: "?date=2026-01-04&shift=dinner",
});
assert.deepEqual(parseTipsRoute("#/team/tips/rules/editor?poolKind=tip&id=r1"), {
  view: "rule-editor", query: "?poolKind=tip&id=r1",
});
assert.equal(rewriteLegacyTipsUrl("detail.html?date=1"), "/team/tips/details?date=1");
assert.equal(rewriteLegacyTipsUrl("rule-add.html?poolKind=tip&id=r1"), "/team/tips/rules/editor?poolKind=tip&id=r1");
```

Add assertions for index/rules mapping, percent-encoded queries, direct refresh reconstruction, namespaced state, parent-route back, and scroll restoration.

Run: `npx.cmd --yes tsx scripts/verify-team-tips-navigation.ts`

Expected: FAIL because the navigation modules do not exist.

- [ ] **Step 2: Implement exact route and navigation contracts**

```ts
export interface TipsRoute { view: TipsView; query: string; href: string }
export interface TipsNavigationState { parentHref: string; parentScrollTop: number; payload: unknown }
export interface TipsPageContext {
  getScope(): TipsScopeSnapshot;
  setStoreScope(storeId: string): void;
  subscribeScopeChange(listener: (scope: TipsScopeSnapshot) => void): () => void;
  navigate(href: string, state?: TipsNavigationState): void;
  getNavigationState(): TipsNavigationState | null;
  getScrollOwner(): HTMLElement | null;
}
```

`location.search` returns `route.query`. `pushState` and `replaceState` write `history.state.menusifuTeamTips`; `back()` navigates to the recorded native parent. `scrollY`, `pageYOffset`, `scrollTo`, and `scrollBy` read/write the main tips scroll owner.

- [ ] **Step 3: Run navigation GREEN**

Run: `npx.cmd --yes tsx scripts/verify-team-tips-navigation.ts`

Expected: PASS for four mappings, deep links, query parsing, history namespace, back, and scroll restoration.

- [ ] **Step 4: Commit navigation and context**

```bash
git add src/team/tips/tips-context.ts src/team/tips/tips-navigation.ts scripts/verify-team-tips-navigation.ts
git commit --only -m "feat: virtualize native tips navigation" -- src/team/tips/tips-context.ts src/team/tips/tips-navigation.ts scripts/verify-team-tips-navigation.ts
```

### Task 5: Build the shared lifecycle, dynamic-action, and export runtime

**Files:**
- Create: `src/team/tips/tips-legacy-runtime.ts`
- Create: `src/team/tips/tips-actions.ts`
- Create: `src/team/tips/tips-export-bridge.ts`
- Create: `scripts/verify-team-tips-lifecycle.ts`
- Create: `scripts/verify-team-tips-actions.ts`
- Create: `scripts/verify-team-tips-exports.ts`

**Interfaces:**
- Produces: `mountLegacyTipsRuntime(shadowRoot, pageRoot, route, context): TipsRuntimeHandle` with `destroy(): void`.
- Consumes: synchronized shared assets, active page program, virtual navigation, main scope, browser storage, and export bridge.

- [ ] **Step 1: Write failing lifecycle and action tests**

Instrument listeners, timeout/interval/RAF IDs, mutation observers, storage writes, DOM mutations, and navigations. After destroy assert all ownership counts are zero and dispatch `storage`, `resize`, `keydown`, `click`, scope-change, and roster-update events without callbacks, writes, DOM changes, or navigation.

Render one fixture from each action family, including a node added after mount, and assert delegated dispatch invokes exactly one scoped handler with parsed arguments and leaves zero executable inline attributes.

Run: `npx.cmd --yes tsx scripts/verify-team-tips-lifecycle.ts`

Run: `npx.cmd --yes tsx scripts/verify-team-tips-actions.ts`

Expected: FAIL because runtime and delegation modules do not exist.

- [ ] **Step 2: Implement controlled runtime ownership**

Proxy document lookup to the active Shadow DOM. Track window/document/page listeners through one `AbortController`; maintain sets for timeout, interval, and RAF IDs; track one mutation observer and runtime-created overlays. Build each view program in the exact Task 1 order and inject `TipOutGlobalScopeFilter`, virtual `location`, virtual `history`, and scroll methods.

The delegated action adapter reads `data-tip-action` and JSON-decoded `data-tip-action-args`, calls a scoped function registry returned by the evaluated program, and never publishes those functions on the real window. A mutation observer rejects or rewrites newly added inline handlers before interaction.

- [ ] **Step 3: Implement the real-document export bridge**

```ts
export interface TipsExportBridge {
  loadScript(url: string, globalName: string): Promise<unknown>;
  download(blob: Blob, filename: string): void;
  openPrintDocument(html: string): Window | null;
  destroy(): void;
}
```

Append only approved export-library scripts to real `document.head`, attach download anchors to one tracked real-document container, remove anchors immediately after click, serialize Shadow DOM styles/content for print, and remove pending nodes/listeners on destroy. Reject script load failures with the existing user-facing export error.

- [ ] **Step 4: Verify lifecycle, actions, and exports GREEN**

Run the three Task 5 tsx scripts. Expected: PASS for cleanup parity, dynamic actions, CSV/PDF row values, filenames, print HTML, popup failure, library failure, and temporary-node cleanup.

- [ ] **Step 5: Commit shared runtime**

```bash
git add src/team/tips/tips-legacy-runtime.ts src/team/tips/tips-actions.ts src/team/tips/tips-export-bridge.ts scripts/verify-team-tips-lifecycle.ts scripts/verify-team-tips-actions.ts scripts/verify-team-tips-exports.ts
git commit --only -m "feat: add native team tips runtime" -- src/team/tips/tips-legacy-runtime.ts src/team/tips/tips-actions.ts src/team/tips/tips-export-bridge.ts scripts/verify-team-tips-lifecycle.ts scripts/verify-team-tips-actions.ts scripts/verify-team-tips-exports.ts
```

### Task 6: Verify rule, allocation, employee, and Payroll compatibility

**Files:**
- Create: `scripts/verify-team-tips-data.ts`
- Reference: `src/team/tips/legacy/ruleData.js.txt`
- Reference: `src/team/tips/legacy/tipAllocation.js.txt`
- Reference: `src/team/tips/legacy/personalSalesDeduct.js.txt`
- Reference: `src/team/tips/legacy/tipout-payroll-bridge.js.txt`
- Reference: `src/config/team-employee-roster-scope.ts`

**Interfaces:**
- Consumes: in-memory Storage/EventTarget fakes and the native controlled runtime.
- Produces: executable compatibility evidence for all persistent contracts.

- [ ] **Step 1: Create the round-trip fixture**

Seed one store, a multi-role employee, fixed and percentage rules, points allocation, personal-sales deduction, one attendance shift, and one allocation result. Exercise rule create/edit/toggle/delete, summary calculation, detail identity/totals, roster update, store alias filtering, and Payroll bridge observation.

Assert every source storage key remains the same name and payload shape. Seed malformed raw values, mount each view without saving, and assert the raw strings remain byte-for-byte unchanged.

- [ ] **Step 2: Run compatibility verification**

Run: `npx.cmd --yes tsx scripts/verify-team-tips-data.ts`

Expected: PASS for rule behavior, allocation totals, detail identity, multi-role targeting, employee event propagation, alias scope, Payroll bridge, and malformed-value preservation.

- [ ] **Step 3: Commit data coverage**

```bash
git add scripts/verify-team-tips-data.ts
git commit --only -m "test: verify native team tips data compatibility" -- scripts/verify-team-tips-data.ts
```

### Task 7: Mount native tips routes in the main shell

**Files:**
- Create: `src/team/tips-page.ts`
- Modify: `src/main.ts`
- Modify: `scripts/verify-team-tips-native-route.mjs`

**Interfaces:**
- Produces: `mountTipsPage(container, route, context): TipsPageHandle` and native rendering for all four routes.
- Consumes: template, styles, runtime, parser, and context modules from Tasks 2–6.

- [ ] **Step 1: Implement the mount owner**

```ts
export interface TipsPageHandle { destroy(): void }
export function mountTipsPage(container: HTMLElement, route: TipsRoute, context = createTipsPageContext()): TipsPageHandle {
  mountedPages.get(container)?.destroy();
  const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `<style>${pageCss}</style><style>${shellCss}</style>${renderTipsTemplate(route.view)}`;
  const pageRoot = shadowRoot.querySelector<HTMLElement>("[data-team-tips-view]");
  if (!pageRoot) throw new Error("Native tips page root was not rendered.");
  const runtime = mountLegacyTipsRuntime(shadowRoot, pageRoot, route, context);
  const handle = { destroy() { runtime.destroy(); shadowRoot.innerHTML = ""; mountedPages.delete(container); } };
  mountedPages.set(container, handle);
  return handle;
}
```

Catch post-load initialization errors, clean partial ownership, and render an in-panel alert.

- [ ] **Step 2: Replace iframe route rendering**

Delete the three tips iframe constants and iframe source/renderer functions. Render:

```html
<div data-team-tips-scroll class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#f3f4f6]">
  <div class="block min-h-full min-w-0" data-team-tips-root></div>
</div>
```

Parse the current hash to `TipsRoute`, destroy the previous handle before rerender, and mount after shell HTML is committed. Preserve existing `/team/tips` normalization.

- [ ] **Step 3: Forward non-modal wheel input**

Forward vertical wheel deltas from Shadow DOM to `[data-team-tips-scroll]` unless a visible modal/drawer descendant can scroll in the requested direction. Remove the listener on destroy.

- [ ] **Step 4: Run full static and type verification**

Run all `verify-team-tips-*` scripts plus `node_modules/.bin/tsc.cmd --noEmit`.

Expected: every command exits 0 and main route source contains no tips iframe tokens.

- [ ] **Step 5: Commit shell integration**

```bash
git add src/team/tips-page.ts src/main.ts scripts/verify-team-tips-native-route.mjs
git commit --only -m "feat: mount team tips workflows natively" -- src/team/tips-page.ts src/main.ts scripts/verify-team-tips-native-route.mjs
```

### Task 8: Browser regression and production build

**Files:**
- Modify only verified defects in: `src/team/tips-page.ts`, `src/team/tips/**`, `src/main.ts`, `scripts/verify-team-tips-*`

**Interfaces:**
- Consumes: complete native tips route.
- Produces: browser and build evidence ready for main integration.

- [ ] **Step 1: Start an isolated development server**

Run: `npm.cmd run dev -- --host 127.0.0.1 --port 5176`

Open: `http://127.0.0.1:5176/#/team/tips/distribution`

- [ ] **Step 2: Verify all routes and shell ownership**

Open all four direct routes, including detail/editor queries. Confirm main navigation/header/scope remain visible, iframe count is zero, no request contains a standalone tips HTML filename, and refresh preserves the active native view/query.

- [ ] **Step 3: Verify summary/detail lifecycle**

Exercise store/date/shift filters, calculate an allocation, open its detail, compare identity and totals, expand detail rows, then use back. Confirm summary filters and scroll position restore exactly once.

- [ ] **Step 4: Verify rule lifecycle**

Create a tip-pool rule containing employee/role targets, order-tip status, payment apportionment, percentage/points conditions, and personal-sales deduction. Trigger validation, cancel once, save, edit, disable/enable, verify allocation changes once, then delete through confirmation.

- [ ] **Step 5: Verify employee and Payroll propagation**

Change an employee in the native employee route, return without application reload, and confirm selectors/results update. Save a tip result and confirm the native Payroll bridge reads it without reload.

- [ ] **Step 6: Verify exports, print, dynamic actions, and cleanup**

Exercise supported CSV/PDF/print actions and compare row data, filenames, and print headings. Confirm temporary real-document nodes are removed. Navigate among all four views three times and confirm one UI instance, one calculation/write per action, zero executable inline attributes, and no tips-route console errors.

- [ ] **Step 7: Verify scrolling and responsive layouts**

At `1687x1000`, `1440x900`, and `1024x768`, exercise wheel, scrollbar, Page Up/Down, Home/End, table horizontal scroll, modal/drawer scroll, and action-row reachability. Confirm no document-level horizontal overflow.

- [ ] **Step 8: Run production verification**

```bash
node scripts/verify-team-tips-native-route.mjs
node scripts/verify-team-tips-source-inventory.mjs
node scripts/verify-team-tips-native-views.mjs
node scripts/verify-team-tips-native-runtime.mjs
npx.cmd --yes tsx scripts/verify-team-tips-navigation.ts
npx.cmd --yes tsx scripts/verify-team-tips-lifecycle.ts
npx.cmd --yes tsx scripts/verify-team-tips-actions.ts
npx.cmd --yes tsx scripts/verify-team-tips-exports.ts
npx.cmd --yes tsx scripts/verify-team-tips-data.ts
node_modules/.bin/tsc.cmd --noEmit
npm.cmd run build
```

Expected: every command exits 0. Existing Vite large-chunk advisories are acceptable; TypeScript, runtime, route, data, action, export, or build failures are not.

- [ ] **Step 9: Commit only browser-discovered fixes when present**

```bash
git status --short
git add src/team/tips-page.ts src/team/tips src/main.ts scripts/verify-team-tips-native-route.mjs scripts/verify-team-tips-source-inventory.mjs scripts/verify-team-tips-native-views.mjs scripts/verify-team-tips-native-runtime.mjs scripts/verify-team-tips-navigation.ts scripts/verify-team-tips-lifecycle.ts scripts/verify-team-tips-actions.ts scripts/verify-team-tips-exports.ts scripts/verify-team-tips-data.ts
git commit --only -m "fix: complete native team tips regression coverage" -- src/team/tips-page.ts src/team/tips src/main.ts scripts/verify-team-tips-native-route.mjs scripts/verify-team-tips-source-inventory.mjs scripts/verify-team-tips-native-views.mjs scripts/verify-team-tips-native-runtime.mjs scripts/verify-team-tips-navigation.ts scripts/verify-team-tips-lifecycle.ts scripts/verify-team-tips-actions.ts scripts/verify-team-tips-exports.ts scripts/verify-team-tips-data.ts
```

Skip this commit when browser verification requires no code changes.
