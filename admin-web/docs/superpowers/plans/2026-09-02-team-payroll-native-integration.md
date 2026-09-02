# Team Payroll Native Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/team/payroll-report` iframe with a native Payroll route module while preserving the approved Payroll UI, calculations, data, exports, dialogs, main sidebar, and account header.

**Architecture:** Move the Payroll document into scoped TypeScript, template, style, state, and controller modules under `src/team/payroll`. The main shell supplies typed scope and locale adapters, owns mount/unmount, and renders Payroll in its existing content pane without requesting any legacy TipOut Payroll document or script.

**Tech Stack:** TypeScript 5.6, Vite 6, browser DOM APIs, existing `/api/v1/payroll` mock REST API, Node/tsx verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-02-team-payroll-native-integration-design.md`

## Global Constraints

- Preserve the current Payroll UI, field structure, calculations, attendance wide table, summary cards, employee switcher, employee editor, save flow, ADP export, and detail export.
- The main application sidebar, account header, global scope controls, and locale controls remain owned and rendered by `src/main.ts`.
- `/team/payroll-report` must not render an iframe or request `TipOut/payroll.html` or its legacy JavaScript files.
- Keep `dist/TipOut/payroll.html` working as a temporary standalone comparison page.
- Scope all migrated styles beneath `.team-payroll-page`; do not add global `body`, `.header`, or `.sidebar` rules.
- Keep `/api/v1/payroll` and the existing snapshot contract as the single server-side source; preserve the localStorage fallback.
- Do not modify `vendor/emenu-new`; the project-specific eMenu embed build rule is therefore not triggered.
- The working tree contains unrelated changes. Before each commit, use `git commit --only -- <task files>` and never stage or alter unrelated paths.
- Build is required because the plan changes `src/main.ts`, new TypeScript imports, styles, and the application entry graph.

---

### Task 1: Establish the native-route RED contract

**Files:**
- Create: `scripts/verify-team-payroll-native-route.mjs`
- Reference: `src/main.ts`
- Reference: `dist/TipOut/payroll.html`

**Interfaces:**
- Consumes: repository source files as UTF-8 strings.
- Produces: a process exit code that fails until the native Payroll root, mount call, and iframe removal are implemented.

- [ ] **Step 1: Create the failing route contract**

```js
import fs from "node:fs";

const main = fs.readFileSync("src/main.ts", "utf8");
const failures = [];
const requireText = (text, label) => {
  if (!main.includes(text)) failures.push(`missing ${label}: ${text}`);
};
const forbidText = (text, label) => {
  if (main.includes(text)) failures.push(`unexpected ${label}: ${text}`);
};

requireText('import { mountPayrollPage', "native Payroll import");
requireText('data-team-payroll-root', "native Payroll root");
requireText('mountPayrollPage(payrollRoot, createPayrollPageContext())', "native Payroll mount");
requireText('isTeamPayrollReportPath', "non-iframe route predicate");
forbidText('TEAM_PAYROLL_REPORT_IFRAME_SRC', "Payroll iframe URL");
forbidText('renderTeamPayrollReportIframePanel', "Payroll iframe renderer");

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team Payroll native route verification passed.");
```

- [ ] **Step 2: Run the contract and retain RED evidence**

Run: `node scripts/verify-team-payroll-native-route.mjs`

Expected: FAIL for the missing native import/root/mount and the still-present iframe URL/renderer.

- [ ] **Step 3: Commit only the RED contract**

```bash
git add scripts/verify-team-payroll-native-route.mjs
git commit --only -m "test: define native payroll route contract" -- scripts/verify-team-payroll-native-route.mjs
```

### Task 2: Define Payroll types, selection repair, and snapshot state

**Files:**
- Create: `src/team/payroll/payroll-types.ts`
- Create: `src/team/payroll/payroll-state.ts`
- Create: `scripts/verify-team-payroll-state.ts`

**Interfaces:**
- Consumes: `PayrollSnapshot`, `PayrollPeriod[]`, `Record<string, PayrollEmployee[]>`, and `PayrollScopeSnapshot`.
- Produces: `resolvePayrollSelection(snapshot, scope): PayrollResolvedSelection` and `createPayrollState(snapshot): PayrollStateStore`.

- [ ] **Step 1: Write a failing functional state test**

```ts
import assert from "node:assert/strict";
import { resolvePayrollSelection } from "../src/team/payroll/payroll-state";

const snapshot = {
  view: "periods",
  periodId: null,
  employeeId: null,
  employeeStoreFilter: "Missing Store",
  data: {
    periods: [{ id: "p1", year: 2026, periodNumber: 1, startDate: "01/01/2026", endDate: "01/14/2026" }],
    employees: { p1: [{ id: "e1", name: "Bowen one", store: "Golden Dragon", segments: [], adjustments: {} }] },
    auditLog: [],
  },
};

const resolved = resolvePayrollSelection(snapshot, { storeId: "", storeLabel: "", isAllStores: true });
assert.equal(resolved.periodId, "p1");
assert.equal(resolved.employeeId, "e1");
assert.equal(resolved.storeFilter, "Golden Dragon");
assert.equal(resolved.repaired, true);
```

- [ ] **Step 2: Run the state test and retain RED evidence**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-state.ts`

Expected: FAIL because `payroll-state.ts` does not exist.

- [ ] **Step 3: Implement the exact public state contracts**

```ts
export interface PayrollResolvedSelection {
  periodId: string | null;
  employeeId: string | null;
  storeFilter: string;
  repaired: boolean;
}

export interface PayrollScopeSnapshot {
  brandId: string;
  regionId: string;
  storeId: string;
  storeLabel: string;
  storeLabelEn: string;
  isAllStores: boolean;
  usesInPageStorePicker: boolean;
  stores: Array<{ id: string; labelZh: string; labelEn: string }>;
}

export function resolvePayrollSelection(
  snapshot: PayrollSnapshot,
  scope: Pick<PayrollScopeSnapshot, "storeId" | "storeLabel" | "isAllStores">,
): PayrollResolvedSelection;

export interface PayrollStateStore {
  getSnapshot(): PayrollSnapshot;
  replaceSnapshot(snapshot: PayrollSnapshot): void;
  subscribe(listener: (snapshot: PayrollSnapshot) => void): () => void;
  destroy(): void;
}

export function createPayrollState(snapshot: PayrollSnapshot): PayrollStateStore;
```

Port the period normalization, employee lookup, store matching, stale selection repair, snapshot migration, and immutable subscriber notification from the legacy script. Keep DOM operations out of this module.

- [ ] **Step 4: Extend the test for valid selection, empty period, and destroy**

Add assertions that an already-valid selection returns `repaired: false`, an employee-free period returns `employeeId: null`, a subscriber receives one update, and `destroy()` prevents later notifications.

- [ ] **Step 5: Run GREEN and type checking for the focused modules**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-state.ts`

Expected: PASS with all selection and lifecycle assertions.

- [ ] **Step 6: Commit the state slice**

```bash
git add src/team/payroll/payroll-types.ts src/team/payroll/payroll-state.ts scripts/verify-team-payroll-state.ts
git commit --only -m "feat: add native payroll state model" -- src/team/payroll/payroll-types.ts src/team/payroll/payroll-state.ts scripts/verify-team-payroll-state.ts
```

### Task 3: Add API, local fallback, roster, scope, and locale adapters

**Files:**
- Create: `src/team/payroll/payroll-api.ts`
- Create: `src/team/payroll/payroll-roster-adapter.ts`
- Create: `src/team/payroll/payroll-context.ts`
- Create: `src/team/payroll/payroll-i18n.ts`
- Create: `scripts/verify-team-payroll-adapters.ts`
- Reference: `src/auth/session-scope.ts`
- Reference: `src/config/team-employee-roster-scope.ts`

**Interfaces:**
- Consumes: `fetch`, `Storage`, `readScopeFilters()`, `writeScopeFilters()`, `getScopedFilterOptions()`, `TEAM_EMPLOYEE_ROSTER_STORAGE_KEY`, and main locale functions.
- Produces: `createPayrollRepository()`, `createPayrollPageContext()`, `readPayrollRoster()`, and `createPayrollTranslator()`.

- [ ] **Step 1: Write failing adapter tests**

Create fakes for `fetch` and `Storage`. Assert that `load()` prefers `GET /api/v1/payroll/state`, falls back to `Storage.getItem("tipout-payroll-state-v1")` on a network error, returns the default snapshot when storage contains no value, and throws `PayrollStorageUnavailableError` only when both network and storage access fail. Assert that `save()` calls `PUT /api/v1/payroll/state` with the complete snapshot.

```ts
const repository = createPayrollRepository({ fetch: fakeFetch, storage: fakeStorage, defaultSnapshot });
assert.equal((await repository.load()).source, "api");
await repository.save(snapshot);
assert.equal(requests.at(-1)?.method, "PUT");
```

- [ ] **Step 2: Run the adapter test and retain RED evidence**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-adapters.ts`

Expected: FAIL because the adapter modules do not exist.

- [ ] **Step 3: Implement the repository and adapters**

```ts
export interface PayrollRepository {
  load(): Promise<{ source: "api" | "local" | "default"; snapshot: PayrollSnapshot }>;
  save(snapshot: PayrollSnapshot): Promise<"api" | "local">;
  fetchAuditLog(limit: number): Promise<PayrollAuditEntry[]>;
}

export function createPayrollRepository(deps: {
  fetch: typeof fetch;
  storage: Storage;
  defaultSnapshot: PayrollSnapshot;
}): PayrollRepository;
```

Implement `createPayrollPageContext()` with the exact spec interface. `setStoreScope(storeId)` calls `writeScopeFilters({ ...readScopeFilters(), store: storeId })`; `subscribeScopeChange()` listens to `menusifu:scope-filter-change` and returns a remover. `readPayrollRoster()` reads the existing roster key and normalizes malformed values to an empty list.

- [ ] **Step 4: Extend tests for two-way scope and unsubscription**

Dispatch one scope event and assert the listener receives a normalized snapshot; call the returned unsubscribe function, dispatch again, and assert the call count does not increase. Assert `setStoreScope("M00000001")` preserves brand and region while changing only store.

- [ ] **Step 5: Run the adapter suite GREEN**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-adapters.ts`

Expected: PASS.

- [ ] **Step 6: Commit the integration adapters**

```bash
git add src/team/payroll/payroll-api.ts src/team/payroll/payroll-roster-adapter.ts src/team/payroll/payroll-context.ts src/team/payroll/payroll-i18n.ts scripts/verify-team-payroll-adapters.ts
git commit --only -m "feat: connect native payroll to app services" -- src/team/payroll/payroll-api.ts src/team/payroll/payroll-roster-adapter.ts src/team/payroll/payroll-context.ts src/team/payroll/payroll-i18n.ts scripts/verify-team-payroll-adapters.ts
```

### Task 4: Port calculations, rule data, ADP, and detail export

**Files:**
- Create: `src/team/payroll/payroll-calculations.ts`
- Create: `src/team/payroll/payroll-rule-data.ts`
- Create: `src/team/payroll/payroll-adp.ts`
- Create: `src/team/payroll/payroll-export.ts`
- Create: `scripts/verify-team-payroll-domain.ts`
- Reference: `dist/TipOut/ruleData.js`
- Reference: `dist/TipOut/payroll-adp-mapping.js`
- Reference: `dist/TipOut/payroll-detail-export.js`
- Reference: `dist/TipOut/payroll.js`

**Interfaces:**
- Consumes: normalized Payroll domain objects only.
- Produces: pure totals, weekly grouping, ADP rows/CSV, and detail export document functions without `window` globals.

- [ ] **Step 1: Write failing golden-master domain tests**

Use the `Bowen one` fixture values from the approved Payroll reference: Regular `47.50h`, OT `3.00h`, Regular salary `$674.50`, OT salary `$63.90`, Total Hours `50.50h`, Total Salary `$738.40`. Assert generated ADP CSV headers and escaped values, and assert the detail export HTML contains the employee name, pay period, totals, and weekly attendance rows.

```ts
assert.deepEqual(calculatePayrollTotals(fixtureEmployee), {
  regularHours: 47.5,
  overtimeHours: 3,
  totalHours: 50.5,
  regularSalary: 674.5,
  overtimeSalary: 63.9,
  totalSalary: 738.4,
});
```

- [ ] **Step 2: Run the domain suite and retain RED evidence**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-domain.ts`

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Port pure domain behavior**

Move calculation and formatting functions without DOM dependencies. Export concrete functions:

```ts
export function calculatePayrollTotals(employee: PayrollEmployee): PayrollTotals;
export function groupAttendanceByWeek(period: PayrollPeriod, employee: PayrollEmployee): PayrollWeek[];
export function buildAdpRows(period: PayrollPeriod, employee: PayrollEmployee, mapping: PayrollAdpMapping): string[][];
export function buildAdpCsv(rows: string[][], headers: string[]): string;
export function buildPayrollDetailHtml(input: PayrollDetailExportInput): string;
```

Copy only Payroll-consumed rule constants from `ruleData.js`. Convert `PAYROLL_ADP_MAPPING` into an imported constant and pass runtime store company code explicitly. Do not read `window` or query DOM in these files.

- [ ] **Step 4: Run the golden-master suite GREEN**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-domain.ts`

Expected: PASS with exact approved totals and export fixtures.

- [ ] **Step 5: Commit the domain slice**

```bash
git add src/team/payroll/payroll-calculations.ts src/team/payroll/payroll-rule-data.ts src/team/payroll/payroll-adp.ts src/team/payroll/payroll-export.ts scripts/verify-team-payroll-domain.ts
git commit --only -m "feat: port payroll calculations and exports" -- src/team/payroll/payroll-calculations.ts src/team/payroll/payroll-rule-data.ts src/team/payroll/payroll-adp.ts src/team/payroll/payroll-export.ts scripts/verify-team-payroll-domain.ts
```

### Task 5: Port the approved Payroll template and scoped styles

**Files:**
- Create: `src/team/payroll/payroll-template.ts`
- Create: `src/team/payroll/payroll-page.css`
- Create: `scripts/verify-team-payroll-view.mjs`
- Reference: `dist/TipOut/payroll.html`
- Reference: `dist/TipOut/payroll.css`
- Reference: `dist/TipOut/common.css`

**Interfaces:**
- Consumes: translator output and stable element/action identifiers.
- Produces: `renderPayrollPageTemplate(): string` and styles isolated under `.team-payroll-page`.

- [ ] **Step 1: Write a failing view contract**

Require the template source to contain `.team-payroll-page`, `payroll-workspace-topbar`, `payroll-workspace-filters`, `payroll-employee-hero`, `payrollEmployeePickerModal`, `payrollEmployeeEditModal`, all existing adjustment field IDs, and all existing `data-action` values. Forbid TipOut `.layout`, `.sidebar`, `.header`, and script/link tags. Require every top-level CSS selector to begin with `.team-payroll-page`, `@media`, `@keyframes`, or a documented Payroll animation selector.

- [ ] **Step 2: Run the view contract and retain RED evidence**

Run: `node scripts/verify-team-payroll-view.mjs`

Expected: FAIL because the native template and stylesheet do not exist.

- [ ] **Step 3: Create the native template**

Copy only the contents needed by the current `#view-workspace` and its Payroll dialogs. Wrap them once:

```ts
function renderPayrollTopbar(): string;
function renderPayrollEmployeeHero(): string;
function renderPayrollAttendanceSummaries(): string;
function renderPayrollAttendanceTables(): string;
function renderPayrollManageForm(): string;
function renderPayrollDialogs(): string;

export function renderPayrollPageTemplate(): string {
  return `<section class="team-payroll-page" data-team-payroll-page>
    <div class="payroll-native-status" data-payroll-status hidden></div>
    ${renderPayrollTopbar()}
    ${renderPayrollEmployeeHero()}
    ${renderPayrollAttendanceSummaries()}
    ${renderPayrollAttendanceTables()}
    ${renderPayrollManageForm()}
    ${renderPayrollDialogs()}
  </section>`;
}
```

Each section function copies the corresponding complete DOM subtree from `#view-workspace` or its associated dialogs while retaining every existing ID and `data-action`. The view contract enumerates and checks those identifiers, so omitted form fields or dialogs fail this task.

- [ ] **Step 4: Create the scoped stylesheet**

Extract Payroll-used variables and primitives from `common.css`, followed by the complete approved rules from `payroll.css`. Transform `:root` to `.team-payroll-page`, `*` to `.team-payroll-page, .team-payroll-page *`, and prefix each Payroll selector with `.team-payroll-page`. Exclude `.sidebar`, `.header`, `.layout`, `.main-content`, `.mobile-menu-btn`, `.mobile-overlay`, `.page-tabs`, and `.export-bar` shell rules.

- [ ] **Step 5: Run the view contract GREEN**

Run: `node scripts/verify-team-payroll-view.mjs`

Expected: PASS and report zero unscoped selectors.

- [ ] **Step 6: Commit the view slice**

```bash
git add src/team/payroll/payroll-template.ts src/team/payroll/payroll-page.css scripts/verify-team-payroll-view.mjs
git commit --only -m "feat: port native payroll view" -- src/team/payroll/payroll-template.ts src/team/payroll/payroll-page.css scripts/verify-team-payroll-view.mjs
```

### Task 6: Implement controller lifecycle and full Payroll interactions

**Files:**
- Create: `src/team/payroll/payroll-controller.ts`
- Create: `src/team/payroll-page.ts`
- Create: `scripts/verify-team-payroll-lifecycle.ts`
- Reference: `dist/TipOut/payroll.js`

**Interfaces:**
- Consumes: `PayrollRepository`, `PayrollStateStore`, `PayrollPageContext`, domain functions, template, and translator.
- Produces: `mountPayrollPage(container, context): PayrollPageHandle` with an idempotent `unmount()`.

- [ ] **Step 1: Write a failing lifecycle test**

Use fake container/event-target implementations to assert one mount creates one controller, a second mount on the same container unmounts the first, `unmount()` aborts scope/locale/roster subscriptions, clears timers, removes Payroll dialogs, and can be called twice without throwing.

```ts
const first = mountPayrollPage(container, context);
const second = mountPayrollPage(container, context);
assert.equal(context.activeSubscriptions(), 3);
first.unmount();
second.unmount();
assert.equal(context.activeSubscriptions(), 0);
```

- [ ] **Step 2: Run the lifecycle test and retain RED evidence**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-lifecycle.ts`

Expected: FAIL because the controller and page entry do not exist.

- [ ] **Step 3: Implement the mount boundary**

```ts
export interface PayrollPageHandle {
  unmount(): void;
}

export function mountPayrollPage(container: HTMLElement, context: PayrollPageContext): PayrollPageHandle {
  unmountMountedPayrollPage(container);
  container.innerHTML = renderPayrollPageTemplate();
  const controller = createPayrollController({ root: container, context, repository: createPayrollRepositoryForBrowser() });
  controller.start();
  return registerMountedPayrollPage(container, () => controller.destroy());
}
```

- [ ] **Step 4: Port the complete interaction map**

Bind actions through one root-level delegated click handler and scoped query helpers. Port store/year/period menus, employee switcher, role selection, edit employee dialog, focus trapping, field edits, derived totals, attendance rendering, unsaved-change confirmation, refresh employee data, confirm/save, ADP preview/export, batch export, detail export, audit dialog, help tips, and locale refresh. Register `document`/`window` listeners through one `AbortController`; register timers in the controller and clear them in `destroy()`.

- [ ] **Step 5: Implement loading, local mode, empty, and error states**

Render a loading status before repository resolution, a non-blocking local-mode badge for fallback data, a Period-level employee empty state with filters enabled, and a blocking retry panel only for simultaneous API and storage access failure. Retry calls the same controller load method without remounting the shell.

- [ ] **Step 6: Run lifecycle and existing Payroll verification GREEN**

Run: `npx.cmd --yes tsx scripts/verify-team-payroll-lifecycle.ts`

Run: `node scripts/verify-payroll-figma-redesign.mjs`

Expected: both PASS; the standalone page remains unchanged and the native lifecycle contract is satisfied.

- [ ] **Step 7: Commit the interaction slice**

```bash
git add src/team/payroll/payroll-controller.ts src/team/payroll-page.ts scripts/verify-team-payroll-lifecycle.ts
git commit --only -m "feat: add native payroll page controller" -- src/team/payroll/payroll-controller.ts src/team/payroll-page.ts scripts/verify-team-payroll-lifecycle.ts
```

### Task 7: Switch the main route from iframe to native mount

**Files:**
- Modify: `src/main.ts:1798-1831`
- Modify: `src/main.ts:1915-1917`
- Modify: `src/main.ts:2073-2084`
- Modify: `src/main.ts:11451-11629`
- Modify: `src/main.ts:12117-13094`
- Test: `scripts/verify-team-payroll-native-route.mjs`

**Interfaces:**
- Consumes: `mountPayrollPage`, `createPayrollPageContext`, and `PayrollPageHandle`.
- Produces: native `#/team/payroll-report` rendering inside the existing shell.

- [ ] **Step 1: Import the native page and add one active handle**

```ts
import { mountPayrollPage, type PayrollPageHandle } from "./team/payroll-page";
import { createPayrollPageContext } from "./team/payroll/payroll-context";

let activePayrollPage: PayrollPageHandle | null = null;

function unmountActivePayrollPage(): void {
  activePayrollPage?.unmount();
  activePayrollPage = null;
}
```

Call `unmountActivePayrollPage()` before each full `mount()` rebuilds the app shell.

- [ ] **Step 2: Replace iframe-specific route symbols**

Rename `isTeamPayrollReportIframePath()` to `isTeamPayrollReportPath()`. Remove `TEAM_PAYROLL_REPORT_IFRAME_SRC` and `renderTeamPayrollReportIframePanel()`. Keep the existing route in the full-height content-pane condition so Payroll receives the available shell height.

- [ ] **Step 3: Render and mount the native root**

```ts
function renderTeamPayrollReportPanel(): string {
  return `<div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div class="min-h-0 flex-1 overflow-auto" data-team-payroll-root></div>
  </div>`;
}

const payrollRoot = document.querySelector<HTMLElement>("[data-team-payroll-root]");
if (payrollRoot && isTeamPayrollReportPath(mountPathForSheet)) {
  activePayrollPage = mountPayrollPage(payrollRoot, createPayrollPageContext());
}
```

- [ ] **Step 4: Run route, state, adapter, domain, view, and lifecycle suites**

Run:

```bash
node scripts/verify-team-payroll-native-route.mjs
npx.cmd --yes tsx scripts/verify-team-payroll-state.ts
npx.cmd --yes tsx scripts/verify-team-payroll-adapters.ts
npx.cmd --yes tsx scripts/verify-team-payroll-domain.ts
node scripts/verify-team-payroll-view.mjs
npx.cmd --yes tsx scripts/verify-team-payroll-lifecycle.ts
node scripts/verify-payroll-figma-redesign.mjs
```

Expected: every command exits `0`.

- [ ] **Step 5: Commit the route switch**

```bash
git add src/main.ts scripts/verify-team-payroll-native-route.mjs
git commit --only -m "feat: mount payroll natively in team management" -- src/main.ts scripts/verify-team-payroll-native-route.mjs
```

### Task 8: Build and browser E2E

**Files:**
- Verify only: all files from Tasks 1-7.

**Interfaces:**
- Consumes: built main app, authenticated demo account, `/api/v1/payroll`, and an invalid-store snapshot fixture.
- Produces: build output and browser evidence for the complete user-visible path.

- [ ] **Step 1: Run formatting checks and production build**

Run: `git diff --check -- src/team src/main.ts scripts/verify-team-payroll-*.mjs scripts/verify-team-payroll-*.ts`

Run: `npm.cmd run build`

Expected: zero whitespace errors and a successful TypeScript/Vite build. Confirm the build does not change `vendor/emenu-new` and does not require `npm run build:emenu-new-embed -- --skip-install`.

- [ ] **Step 2: Start exactly one development server**

Resolve and stop only processes listening on port `5173`, then run:

```bash
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Expected: Vite reports ready and `netstat` shows one listener on `127.0.0.1:5173`.

- [ ] **Step 3: Verify the main-shell path**

Open `http://127.0.0.1:5173/#/team/payroll-report` with an authenticated account whose platform preset and subscription allow the Team Payroll route. Confirm the main sidebar and account header are visible, `[data-team-payroll-root]` exists, Payroll renders inside it, and `document.querySelector('[data-team-payroll-root] iframe')` returns `null`.

- [ ] **Step 4: Verify Network and visual parity**

Confirm Network contains `/api/v1/payroll/state` but no request for `TipOut/payroll.html`, `payroll.js`, `common.js`, `global-scope-filter.js`, `tipout-payroll-bridge.js`, `payroll-i18n.js`, or `payroll-detail-export.js`. Compare the header, hero, three summary cards, two weekly tables, and Manage Payroll form against the approved screenshot.

- [ ] **Step 5: Verify interactions and lifecycle**

Exercise store, Year, Period, employee switch, employee edit, field edit, confirm/save, ADP export menu, and detail export. Navigate away and back twice; confirm each click fires once, only one `/api/v1/payroll/state` load occurs per entry, and no detached Payroll dialog remains.

- [ ] **Step 6: Verify stale selection and fallback paths**

PUT a snapshot with `employeeStoreFilter: "Missing Store"`, `periodId: null`, and `employeeId: null`; reload the native route and confirm it selects the first employee-backed store, opens the workspace, and persists the repaired snapshot. Temporarily make the API return a network error and confirm the local-mode badge appears with editable local data.

- [ ] **Step 7: Check browser logs and standalone compatibility**

Require zero Payroll-related console errors or warnings. Open `http://127.0.0.1:5173/TipOut/payroll.html` and run `node scripts/verify-payroll-figma-redesign.mjs` to confirm the legacy comparison page remains functional.

- [ ] **Step 8: Record final evidence without committing generated or unrelated files**

Run `git status --short`, identify build-generated and pre-existing unrelated changes, and do not stage them. The final report must list RED/GREEN evidence, build result, E2E result, changed source files, and any unverified scope.
