# Team Employees Native Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/team/roles-employees` iframe with a native employee-and-role workspace that preserves every existing workflow, storage contract, and Payroll integration while keeping the main application shell visible.

**Architecture:** Extract the functional body and assets from `dist/TipOut/employees.html` into an isolated Shadow DOM module under `src/team/employees`. A controlled legacy runtime provides scoped DOM queries, tracked browser listeners/timers, and the existing store/localStorage contracts; `src/main.ts` owns route mount, unmount, and scrolling.

**Tech Stack:** TypeScript 5.6, Vite 6 raw imports, browser DOM and Shadow DOM APIs, existing TipOut JavaScript/localStorage contracts, Node and tsx verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-02-team-employees-native-integration-design.md`

## Global Constraints

- Both “员工” and “岗位” tabs must be native and fully functional.
- Preserve employee and role create/edit/delete, store filtering, form validation, role occupancy rules, dialogs, dropdowns, and help content.
- Preserve `tipout-employees-roster-v1`, `tipout-employee-role-options-v1`, `tipout-employee-role-hidden-system-v1`, `tipout-employee-role-meta-v1`, and session key `tipout-employees-page-tab` without data migration.
- Preserve `tipout-roster-updated`, storage, and global-scope event behavior so Payroll sees employee changes without an application reload.
- `/team/roles-employees` must not render an iframe or request `TipOut/employees.html`.
- The main sidebar, account header, access control, route state, and content scroll owner remain in `src/main.ts`.
- Remove inline handler attributes from the extracted template and bind their actions inside the controlled runtime.
- Missing raw assets are build failures; post-load runtime failures clean up and render an in-panel error.
- Do not modify `vendor/emenu-new`; the eMenu embedded-package build rule is not triggered.
- Commit only task-specific files and preserve unrelated working-tree changes.

---

### Task 1: Define the native route contract

**Files:**
- Create: `scripts/verify-team-employees-native-route.mjs`
- Reference: `src/main.ts`

**Interfaces:**
- Consumes: `src/main.ts` as UTF-8 source.
- Produces: a failing process until the route uses `mountEmployeesPage`, a native root, and no employee iframe constant or renderer.

- [ ] **Step 1: Write the failing route verification**

```js
import fs from "node:fs";

const main = fs.readFileSync("src/main.ts", "utf8");
const failures = [];
for (const required of [
  'import { mountEmployeesPage',
  'data-team-employees-scroll',
  'data-team-employees-root',
  'mountEmployeesPage(employeesRoot',
  'destroyTeamEmployeesPage()',
]) {
  if (!main.includes(required)) failures.push(`missing native employees contract: ${required}`);
}
for (const forbidden of [
  'TEAM_ROLES_EMPLOYEES_IFRAME_SRC',
  'renderTeamRolesEmployeesIframePanel',
  'src="${TEAM_ROLES_EMPLOYEES_IFRAME_SRC}"',
]) {
  if (main.includes(forbidden)) failures.push(`legacy employees iframe remains: ${forbidden}`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team employees native route verification passed.");
```

- [ ] **Step 2: Run the verification and retain RED evidence**

Run: `node scripts/verify-team-employees-native-route.mjs`

Expected: FAIL because `src/main.ts` still renders `TipOut/employees.html` in an iframe.

- [ ] **Step 3: Commit the RED contract**

```bash
git add scripts/verify-team-employees-native-route.mjs
git commit --only -m "test: define native team employees route contract" -- scripts/verify-team-employees-native-route.mjs
```

### Task 2: Extract and verify the employee workspace template and styles

**Files:**
- Create: `scripts/generate-team-employees-native-view.mjs`
- Create: `scripts/verify-team-employees-native-view.mjs`
- Create: `src/team/employees/employees-template.html`
- Create: `src/team/employees/employees-template.ts`
- Create: `src/team/employees/employees-page.css`
- Create: `src/team/employees/employees-shell.css`
- Reference: `dist/TipOut/employees.html`
- Reference: `dist/TipOut/common.css`
- Reference: `dist/TipOut/employees.css`

**Interfaces:**
- Consumes: the current standalone employee document and styles.
- Produces: `renderEmployeesPageTemplate(): string` and two page-scoped raw style assets.

- [ ] **Step 1: Write a failing structural verifier**

```js
import fs from "node:fs";

const template = fs.readFileSync("src/team/employees/employees-template.html", "utf8");
const failures = [];
for (const token of [
  'data-team-employees-page',
  'data-employees-tab="employees"',
  'data-employees-tab="roles"',
  'id="employeesTableBody"',
  'id="rolesTableBody"',
  'id="addEmployeeModal"',
  'id="employeeRoleAddModal"',
  'id="employeeDeleteConfirmModal"',
  'data-action="close-employee-modal"',
]) {
  if (!template.includes(token)) failures.push(`missing template token: ${token}`);
}
for (const forbidden of ["<html", "<body", "<aside", "<header", "<script", "<link", "onclick="]) {
  if (template.toLowerCase().includes(forbidden)) failures.push(`standalone or inline markup remains: ${forbidden}`);
}
if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team employees native view verification passed.");
```

- [ ] **Step 2: Run the verifier and retain RED evidence**

Run: `node scripts/verify-team-employees-native-view.mjs`

Expected: FAIL because the extracted template does not exist.

- [ ] **Step 3: Implement deterministic extraction**

Create `generate-team-employees-native-view.mjs` to read the source document, select the `.content-area` plus every `.modal-overlay.employees-page`, remove the standalone shell and script/link tags, replace both `onclick="closeModal('addEmployeeModal')"` attributes with `data-action="close-employee-modal"`, and wrap the result:

```html
<section class="team-employees-page employees-page" data-team-employees-page>
  <!-- extracted tabs, action bar, panels, and modal overlays -->
</section>
```

The script must throw unless exactly two inline close handlers are replaced and no `onclick=` remains.

- [ ] **Step 4: Add the template function and scoped styles**

```ts
import template from "./employees-template.html?raw";

export function renderEmployeesPageTemplate(): string {
  return template;
}
```

Build `employees-page.css` from the declarations required by `common.css` and all of `employees.css`. Keep it inside the Shadow DOM; do not add global stylesheet imports. Add `employees-shell.css` with these host guarantees:

```css
:host { display: block; min-width: 0; min-height: 100%; }
.team-employees-page { box-sizing: border-box; min-width: 0; min-height: 100%; padding: 24px; background: #f3f4f6; }
.team-employees-page *, .team-employees-page *::before, .team-employees-page *::after { box-sizing: border-box; }
.team-employees-page .employees-table-wrap { max-width: 100%; overflow-x: auto; }
.team-employees-page .modal-overlay { position: fixed; inset: 0; z-index: 80; }
.team-employees-page .employees-modal { max-width: min(940px, calc(100vw - 48px)); max-height: calc(100vh - 48px); }
@media (max-width: 720px) {
  .team-employees-page { padding: 16px; }
  .team-employees-page .employees-modal { max-width: calc(100vw - 24px); max-height: calc(100vh - 24px); }
}
```

- [ ] **Step 5: Generate and verify GREEN**

Run: `node scripts/generate-team-employees-native-view.mjs`

Run: `node scripts/verify-team-employees-native-view.mjs`

Expected: both commands exit 0; the verifier confirms both tabs, both tables, required dialogs, stable close hooks, and no standalone shell/inline handlers.

- [ ] **Step 6: Commit the native view assets**

```bash
git add scripts/generate-team-employees-native-view.mjs scripts/verify-team-employees-native-view.mjs src/team/employees/employees-template.html src/team/employees/employees-template.ts src/team/employees/employees-page.css src/team/employees/employees-shell.css
git commit --only -m "feat: extract native team employees view" -- scripts/generate-team-employees-native-view.mjs scripts/verify-team-employees-native-view.mjs src/team/employees/employees-template.html src/team/employees/employees-template.ts src/team/employees/employees-page.css src/team/employees/employees-shell.css
```

### Task 3: Copy runtime assets and build a lifecycle-safe compatibility host

**Files:**
- Create: `scripts/generate-team-employees-native-runtime.mjs`
- Create: `scripts/verify-team-employees-native-runtime.mjs`
- Create: `scripts/verify-team-employees-lifecycle.ts`
- Create: `src/team/employees/legacy/common.js.txt`
- Create: `src/team/employees/legacy/global-scope-filter.js.txt`
- Create: `src/team/employees/legacy/ruleData.js.txt`
- Create: `src/team/employees/legacy/employees-field-help.js.txt`
- Create: `src/team/employees/legacy/employees.js.txt`
- Create: `src/team/employees/employees-legacy-runtime.ts`

**Interfaces:**
- Consumes: `ShadowRoot`, page root, real browser storage and events, and `EmployeesPageContext` from Task 4.
- Produces: `mountLegacyEmployeesRuntime(shadowRoot, pageRoot, context): EmployeesRuntimeHandle` where the handle has `destroy(): void`.

- [ ] **Step 1: Add exact-copy generation and failing synchronization verification**

```js
import fs from "node:fs";

const names = ["common.js", "global-scope-filter.js", "ruleData.js", "employees-field-help.js", "employees.js"];
const failures = names.filter((name) =>
  fs.readFileSync(`dist/TipOut/${name}`, "utf8") !== fs.readFileSync(`src/team/employees/legacy/${name}.txt`, "utf8"),
);
if (failures.length) {
  failures.forEach((name) => console.error(`${name}: native runtime copy is stale`));
  process.exit(1);
}
console.log("Team employees native runtime assets are synchronized.");
```

Run: `node scripts/verify-team-employees-native-runtime.mjs`

Expected: FAIL because native runtime copies do not exist.

- [ ] **Step 2: Implement and run the copy generator**

The generator copies the five named files from `dist/TipOut` to `src/team/employees/legacy/<name>.txt` using `fs.copyFileSync` and exits nonzero for a missing source.

Run: `node scripts/generate-team-employees-native-runtime.mjs`

Run: `node scripts/verify-team-employees-native-runtime.mjs`

Expected: PASS with byte-for-byte source equality.

- [ ] **Step 3: Write a failing lifecycle harness**

Create fake listener/timer/RAF registries, mount the runtime with a minimal employee template, call `destroy()`, dispatch `resize`, `storage`, `keydown`, `click`, and `tipout-roster-updated`, then assert:

```ts
assert.equal(instrumentation.activeListenerCount(), 0);
assert.equal(instrumentation.activeTimerCount(), 0);
assert.equal(instrumentation.activeAnimationFrameCount(), 0);
assert.equal(instrumentation.callbackCountAfterDestroy, 0);
assert.equal(instrumentation.storageWritesAfterDestroy, 0);
assert.equal(instrumentation.domMutationsAfterDestroy, 0);
```

Run: `npx.cmd --yes tsx scripts/verify-team-employees-lifecycle.ts`

Expected: FAIL because `employees-legacy-runtime.ts` does not exist.

- [ ] **Step 4: Implement scoped DOM and tracked browser APIs**

```ts
export interface EmployeesRuntimeHandle { destroy(): void }

export function mountLegacyEmployeesRuntime(
  shadowRoot: ShadowRoot,
  pageRoot: HTMLElement,
  context: EmployeesPageContext,
): EmployeesRuntimeHandle;
```

Use an `AbortController` for window/document/page listeners; track timeout, interval, and animation-frame IDs in separate sets. Proxy `document.getElementById`, `querySelector`, `querySelectorAll`, `body`, and `activeElement` into the Shadow DOM. Expose real `localStorage` and `sessionStorage` unchanged. Supply the context-backed scope adapter instead of allowing the copied global-scope script to overwrite the main shell contract.

Before executing `employees.js`, bind every `[data-action="close-employee-modal"]` click to the scoped `closeModal("addEmployeeModal")` callable. Store the binding cleanup in the same lifecycle owner. Do not publish `closeModal` on the real window.

On evaluation failure, call the same cleanup path and rethrow an `EmployeesRuntimeInitializationError` containing the original cause.

- [ ] **Step 5: Prove lifecycle cleanup behavior**

Run: `npx.cmd --yes tsx scripts/verify-team-employees-lifecycle.ts`

Expected: PASS with zero owned listeners, timers, RAFs, callbacks, writes, and mutations after destroy.

- [ ] **Step 6: Commit the controlled runtime**

```bash
git add scripts/generate-team-employees-native-runtime.mjs scripts/verify-team-employees-native-runtime.mjs scripts/verify-team-employees-lifecycle.ts src/team/employees/legacy src/team/employees/employees-legacy-runtime.ts
git commit --only -m "feat: add native team employees runtime" -- scripts/generate-team-employees-native-runtime.mjs scripts/verify-team-employees-native-runtime.mjs scripts/verify-team-employees-lifecycle.ts src/team/employees/legacy src/team/employees/employees-legacy-runtime.ts
```

### Task 4: Add the main-shell scope context and data compatibility tests

**Files:**
- Create: `src/team/employees/employees-context.ts`
- Create: `scripts/verify-team-employees-data.ts`
- Reference: `src/auth/session-scope.ts`
- Reference: `src/config/team-employee-roster-scope.ts`
- Reference: `src/team/payroll/payroll-roster-adapter.ts`

**Interfaces:**
- Consumes: main scope readers/writers, store options, browser storage, and scope-change subscriptions.
- Produces: `createEmployeesPageContext(): EmployeesPageContext` and a compatibility fixture for all employee/role storage behavior.

- [ ] **Step 1: Write the failing data round-trip test**

Seed these exact values:

```ts
const keys = {
  roster: "tipout-employees-roster-v1",
  roles: "tipout-employee-role-options-v1",
  hiddenRoles: "tipout-employee-role-hidden-system-v1",
  roleMeta: "tipout-employee-role-meta-v1",
  tab: "tipout-employees-page-tab",
} as const;

const employee = {
  id: "employee-native-1",
  name: "Native Employee",
  store: "golden dragon chinese kitchen - dallas, tx 75231",
  role: "Server, Trainer",
  roles: ["Server", "Trainer"],
  adpFile: "106",
};
```

Assert that create/edit/delete preserve the roster array shape, custom role `Trainer`, its lowercase role-metadata key, hidden system roles, and the multi-role array/string encoding used by the existing script. Assert one `tipout-roster-updated` event per saved roster mutation and that `readPayrollRoster()` observes the updated employee immediately.

Seed malformed raw strings for each persistent key, open/read the page state without saving, and assert every raw string remains byte-for-byte equal. Add canonical/suppressed store-alias assertions using the existing global-scope behavior.

- [ ] **Step 2: Run the fixture and retain RED evidence**

Run: `npx.cmd --yes tsx scripts/verify-team-employees-data.ts`

Expected: FAIL because the native context is not implemented.

- [ ] **Step 3: Implement the context boundary**

```ts
export interface EmployeesScopeSnapshot {
  storeId: string;
  storeLabel: string;
  storeLabelEn: string;
  isAllStores: boolean;
  stores: Array<{ id: string; labelZh: string; labelEn: string }>;
}

export interface EmployeesPageContext {
  getScope(): EmployeesScopeSnapshot;
  setStoreScope(storeId: string): void;
  subscribeScopeChange(listener: (scope: EmployeesScopeSnapshot) => void): () => void;
}

export function createEmployeesPageContext(): EmployeesPageContext;
```

Reuse `ensureInPageDefaultStoreSelected()`, the existing scope metadata shape, and the same roster key exported by `team-employee-roster-scope.ts`. Keep data normalization in the copied runtime so the native route remains behaviorally identical to `employees.html`.

- [ ] **Step 4: Run the data fixture GREEN**

Run: `npx.cmd --yes tsx scripts/verify-team-employees-data.ts`

Expected: PASS for exact keys, payloads, multi-role behavior, aliases, events, malformed-value preservation, and immediate Payroll visibility.

- [ ] **Step 5: Commit context and compatibility coverage**

```bash
git add src/team/employees/employees-context.ts scripts/verify-team-employees-data.ts
git commit --only -m "feat: connect native employees to team data" -- src/team/employees/employees-context.ts scripts/verify-team-employees-data.ts
```

### Task 5: Mount the native page and replace the iframe route

**Files:**
- Create: `src/team/employees-page.ts`
- Modify: `src/main.ts`
- Modify: `scripts/verify-team-employees-native-route.mjs`

**Interfaces:**
- Consumes: template, raw styles, runtime, and `EmployeesPageContext` from Tasks 2–4.
- Produces: `mountEmployeesPage(container, context): EmployeesPageHandle` and a fully native `/team/roles-employees` route.

- [ ] **Step 1: Implement the page mount owner**

```ts
export interface EmployeesPageHandle { destroy(): void }

export function mountEmployeesPage(
  container: HTMLElement,
  context: EmployeesPageContext = createEmployeesPageContext(),
): EmployeesPageHandle {
  mountedPages.get(container)?.destroy();
  const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `<style>${pageCss}</style><style>${shellCss}</style>${renderEmployeesPageTemplate()}`;
  const pageRoot = shadowRoot.querySelector<HTMLElement>("[data-team-employees-page]");
  if (!pageRoot) throw new Error("Native employees page root was not rendered.");
  try {
    const runtime = mountLegacyEmployeesRuntime(shadowRoot, pageRoot, context);
    const handle = { destroy() { runtime.destroy(); shadowRoot.innerHTML = ""; mountedPages.delete(container); } };
    mountedPages.set(container, handle);
    return handle;
  } catch (error) {
    shadowRoot.innerHTML = `<style>${shellCss}</style><div class="team-employees-error" role="alert">员工与岗位页面加载失败，请刷新后重试。</div>`;
    throw error;
  }
}
```

- [ ] **Step 2: Replace iframe rendering in `src/main.ts`**

Import `mountEmployeesPage`, delete `TEAM_ROLES_EMPLOYEES_IFRAME_SRC`, rename the route predicate to `isTeamRolesEmployeesPath`, and render:

```html
<div data-team-employees-scroll class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#f3f4f6]">
  <div class="block min-h-full min-w-0" data-team-employees-root></div>
</div>
```

Track a module-level `EmployeesPageHandle | null`. Destroy it before every application rerender that leaves or remounts the route. After the shell HTML is committed, find `[data-team-employees-root]` and mount with `createEmployeesPageContext()`.

- [ ] **Step 3: Add wheel forwarding consistent with Payroll**

Inside `employees-page.ts`, forward non-modal vertical wheel deltas from the Shadow DOM host to the nearest `[data-team-employees-scroll]`. Do not intercept wheel events originating in a visible modal body that can still scroll in the requested direction.

- [ ] **Step 4: Run route, view, runtime, lifecycle, and type checks**

Run: `node scripts/verify-team-employees-native-route.mjs`

Run: `node scripts/verify-team-employees-native-view.mjs`

Run: `node scripts/verify-team-employees-native-runtime.mjs`

Run: `npx.cmd --yes tsx scripts/verify-team-employees-lifecycle.ts`

Run: `npx.cmd --yes tsx scripts/verify-team-employees-data.ts`

Run: `node_modules/.bin/tsc.cmd --noEmit`

Expected: every command exits 0 and no route source references the employee iframe constant or renderer.

- [ ] **Step 5: Commit the native route integration**

```bash
git add src/team/employees-page.ts src/main.ts scripts/verify-team-employees-native-route.mjs
git commit --only -m "feat: mount employees and roles natively" -- src/team/employees-page.ts src/main.ts scripts/verify-team-employees-native-route.mjs
```

### Task 6: Browser regression and production build

**Files:**
- Modify only if a verified defect requires it: `src/team/employees-page.ts`, `src/team/employees/*.ts`, `src/team/employees/*.css`, `src/team/employees/employees-template.html`, `src/main.ts`
- Test: all `scripts/verify-team-employees-*` files

**Interfaces:**
- Consumes: completed native employee route.
- Produces: browser evidence and a production-build result suitable for merging.

- [ ] **Step 1: Start the application from this worktree**

Run: `npm.cmd run dev -- --host 127.0.0.1 --port 5175`

Open: `http://127.0.0.1:5175/#/team/roles-employees`

- [ ] **Step 2: Verify shell, route, and scroll ownership**

Confirm the main sidebar and account header remain visible. Confirm `document.querySelectorAll("iframe").length` does not increase for the employee route and no request contains `/TipOut/employees.html`. Exercise mouse wheel, trackpad-equivalent wheel events, scrollbar drag, Page Up/Down, Home, and End over the table and form areas.

- [ ] **Step 3: Verify employee workflows**

Select a store, create a multi-role employee, exercise required-field and SSN/date/pay validation, edit the employee, close the dialog once with the close icon and once with cancel, and delete the employee through its confirmation flow. Verify the table and storage update exactly once after each mutation.

- [ ] **Step 4: Verify role workflows**

Switch to 岗位, create and edit a role with description metadata, assign it to an employee, confirm occupied count, exercise the occupied-role deletion constraint, then remove the assignment and delete the role. Verify hidden system role and custom role behavior remain consistent with the standalone page.

- [ ] **Step 5: Verify Payroll propagation and lifecycle re-entry**

Create or edit an employee, navigate to `/team/payroll-report`, and confirm Payroll sees the changed roster without reloading the application. Navigate between Payroll and roles/employees three times; confirm there is one table body, one copy of each modal, one response per click, and no duplicate rows or console errors.

- [ ] **Step 6: Verify responsive behavior**

At `1687x1000`, `1440x900`, and `1024x768`, confirm no document-level horizontal overflow, the employee wide table has local horizontal scrolling, dialogs remain within the viewport, dialog actions remain reachable, and the main route remains vertically scrollable.

- [ ] **Step 7: Run the complete static suite and production build**

```bash
node scripts/verify-team-employees-native-route.mjs
node scripts/verify-team-employees-native-view.mjs
node scripts/verify-team-employees-native-runtime.mjs
npx.cmd --yes tsx scripts/verify-team-employees-lifecycle.ts
npx.cmd --yes tsx scripts/verify-team-employees-data.ts
node_modules/.bin/tsc.cmd --noEmit
npm.cmd run build
```

Expected: every command exits 0. Vite may report the repository’s existing large-chunk advisory, but no employee-native error or TypeScript error is allowed.

- [ ] **Step 8: Commit only verified fixes, if any were required**

```bash
git status --short
git add src/team/employees-page.ts src/team/employees src/main.ts scripts/verify-team-employees-native-route.mjs scripts/verify-team-employees-native-view.mjs scripts/verify-team-employees-native-runtime.mjs scripts/verify-team-employees-lifecycle.ts scripts/verify-team-employees-data.ts
git commit --only -m "fix: complete native employees regression coverage" -- src/team/employees-page.ts src/team/employees src/main.ts scripts/verify-team-employees-native-route.mjs scripts/verify-team-employees-native-view.mjs scripts/verify-team-employees-native-runtime.mjs scripts/verify-team-employees-lifecycle.ts scripts/verify-team-employees-data.ts
```

Skip the commit when browser verification requires no code changes.
