# Payroll Employee Declaration Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add governed multilingual employee declarations to Payroll so each employee can review and print an approved statement in their selected language, with optional English bilingual output and immutable historical snapshots.

**Architecture:** Add a typed declaration domain beside the existing Payroll schedule and batch-export domains. A repository boundary talks to explicit declaration API endpoints; the development mock implements the same transactions and optimistic version checks. The native Payroll shadow page mounts a full-screen template manager, extends employee preferences, resolves one declaration presentation per employee/period, and passes that frozen presentation to page, print, PDF, email, batch PDF, and legacy-compatible CSV consumers.

**Tech Stack:** TypeScript 5.6, Vite 6, native DOM/Shadow DOM, legacy Payroll runtime assets loaded as raw text, Node assertion verification scripts, development Mock REST API, html2canvas/jsPDF already used by Payroll exports.

**Spec:** `docs/superpowers/specs/2026-09-29-payroll-employee-declaration-localization-design.md`

## Global Constraints

- Do not change attendance, payroll, tips, gratuity, overtime, or pay-period calculations.
- Store declaration bodies as plain Unicode text; escape at every HTML, CSV, and document output boundary.
- Never infer an employee language from nationality, name, address, or browser locale.
- Missing required published templates block confirmation and formal output; never silently fall back to English.
- Published template versions and persistent declaration snapshots are immutable.
- `confirmation_date` only comes from the successful server confirmation transaction.
- Existing detailed and compact CSV schemas and filenames remain unchanged; only the existing `declaration` value becomes the frozen primary-language text.
- Multilingual fit-one-page output must stop below 7pt and require pagination.
- All tenant, organization, store, employee, family, and version scope checks execute server-side as well as in the UI.
- This work does not modify `vendor/emenu-new`; the eMenu embed build rule is therefore not triggered.

## Planned File Structure

- `src/team/payroll/payroll-declaration-types.ts`: canonical domain and API types.
- `src/team/payroll/payroll-declaration-engine.ts`: pure validation, resolution, rendering, canonicalization, and hash-input logic.
- `src/team/payroll/payroll-declaration-api.ts`: browser repository and HTTP error mapping.
- `src/team/payroll/payroll-declaration-settings.ts`: full-screen template-library UI controller.
- `src/team/payroll/payroll-declaration-presentation.ts`: employee/period presentation and export guards.
- `src/team/payroll/payroll-types.ts`: employee preferences and snapshot state references.
- `src/team/payroll/payroll-context.ts`: scope and declaration repository dependency.
- `src/team/payroll/payroll-legacy-runtime.ts`: expose typed declaration bridge to the legacy runtime.
- `src/team/payroll/payroll-template.html`: entry button, employee fields, detail controls, status/error regions.
- `src/team/payroll/payroll-page.css`: template manager, locale controls, RTL, print status, and responsive layout.
- `src/team/payroll/legacy/payroll.js.txt`: employee save, detail view, confirmation, and export integration.
- `src/team/payroll/legacy/payroll-detail-export.js.txt`: shared paginated declaration output.
- `src/team/payroll/legacy/payroll-adp-mapping.js.txt`: remove the fixed-English runtime dependency after migration.
- `src/team/payroll/payroll-batch-export-types.ts`: declaration presentation on batch records.
- `src/team/payroll/payroll-batch-export-data.ts`: declaration validation/classification.
- `src/team/payroll/payroll-batch-export-artifacts.ts`: multilingual merged/ZIP PDF artifacts.
- `src/team/payroll/payroll-batch-export-csv.ts`: legacy-schema declaration value.
- `scripts/lib/payroll-mock-api-handler.mjs`: transactional development declaration endpoints.
- `scripts/verify-payroll-declaration-*.ts|mjs`: focused domain, API, UI, export, and migration verification.
- `package.json`: aggregate verification command.

---

### Task 1: Declaration domain, rendering, and deterministic identity

**Files:**
- Create: `src/team/payroll/payroll-declaration-types.ts`
- Create: `src/team/payroll/payroll-declaration-engine.ts`
- Create: `scripts/verify-payroll-declaration-engine.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `DeclarationTemplateFamily`, `DeclarationTemplateVersion`, `EmployeeDeclarationPreference`, `DeclarationSnapshot`, `DeclarationVariables`, `resolveActiveDeclarationVersion()`, `validateDeclarationSource()`, `renderDeclarationText()`, `buildDeclarationCanonicalPayload()`.
- Consumes: no application state; this task is a pure domain leaf.

- [ ] **Step 1: Write the failing domain verification**

```ts
import assert from "node:assert/strict";
import {
  renderDeclarationText,
  resolveActiveDeclarationVersion,
  validateDeclarationSource,
  buildDeclarationCanonicalPayload,
} from "../src/team/payroll/payroll-declaration-engine";

const enterprise = { familyId: "fam-en", scope: { organizationId: "org-1" }, localeCode: "en-US", activeVersionId: "ver-en-2" };
const store = { familyId: "fam-es-store", scope: { organizationId: "org-1", storeId: "store-1" }, localeCode: "es-US", activeVersionId: "ver-es-3" };
assert.equal(resolveActiveDeclarationVersion({ families: [enterprise, store], versions: [{ versionId: "ver-en-2", familyId: "fam-en", status: "published", source: "Tips {{tips_amount}}" }, { versionId: "ver-es-3", familyId: "fam-es-store", status: "published", source: "Propinas {{tips_amount}}" }], organizationId: "org-1", storeId: "store-1", preferredFamilyId: "fam-es-store", localeCode: "es-US" })?.versionId, "ver-es-3");
assert.deepEqual(validateDeclarationSource("Tips {{unknown}}"), [{ code: "unknown_variable", variable: "unknown" }]);
assert.equal(renderDeclarationText("Propinas {{tips_amount}}", { tips_amount: "$144.00" }), "Propinas $144.00");
assert.equal(buildDeclarationCanonicalPayload({ localeCode: "es-US", printMode: "employee-only", source: "Cafe\u0301", variables: { tips_amount: "144.00" }, renderedText: "Café" }).source, "Café");
```

- [ ] **Step 2: Run the verification and confirm the missing-module failure**

Run: `npx.cmd --yes tsx scripts/verify-payroll-declaration-engine.ts`

Expected: FAIL with `Cannot find module '../src/team/payroll/payroll-declaration-engine'`.

- [ ] **Step 3: Define the exact domain types**

```ts
export type DeclarationStatus = "draft" | "published" | "retired";
export type DeclarationPrintMode = "employee-only" | "bilingual-english";
export interface DeclarationTemplateFamily { familyId: string; scope: { organizationId: string; storeId?: string }; localeCode: string; languageDisplayName: string; activeVersionId: string | null; }
export interface DeclarationTemplateVersion { versionId: string; familyId: string; version: number; status: DeclarationStatus; source: string; variableSchemaVersion: "v1"; createdBy: string; createdAt: string; reviewedBy?: string; reviewedAt?: string; publishedAt?: string; retiredAt?: string; }
export interface EmployeeDeclarationPreference { employeeId: string; defaultFamilyId: string; defaultLocaleCode: string; defaultPrintMode: DeclarationPrintMode; updatedBy: string; updatedAt: string; }
export interface DeclarationPeriodOverride { employeeId: string; periodId: string; familyId: string; localeCode: string; printMode: DeclarationPrintMode; }
export interface DeclarationSnapshot { snapshotId: string; employeeId: string; periodId: string; primaryVersionId: string; englishVersionId: string | null; localeCode: string; printMode: DeclarationPrintMode; source: string; englishSource: string | null; variables: DeclarationVariables; renderedText: string; renderedEnglishText: string | null; confirmedAt: string | null; lockedAt: string | null; hashAlgorithm: "SHA-256(canonical-json-v1)"; contentHash: string; }
export type DeclarationVariables = Partial<Record<"employee_name"|"pay_period_start"|"pay_period_end"|"regular_hours"|"overtime_hours"|"total_hours"|"tips_amount"|"gratuity_amount"|"store_name"|"confirmation_date", string>>;
```

- [ ] **Step 4: Implement strict source validation and deterministic resolution**

Implement `validateDeclarationSource()` to reject unknown variables, HTML, scripts, bidi overrides, unpaired isolates, and forbidden controls while allowing line breaks, tabs, and paired RTL isolates. Implement family resolution in this order: explicit applicable family, store family for the locale, enterprise family for the locale. Return `null` instead of an English fallback.

- [ ] **Step 5: Implement rendering and canonical payload normalization**

`renderDeclarationText(source, variables)` must return a structured missing-variable error rather than inserting an empty string. `buildDeclarationCanonicalPayload()` must recursively sort keys, normalize strings to NFC, and preserve decimal values as strings. Keep hashing itself async and browser/server specific; both sides hash the exact canonical JSON UTF-8 bytes.

- [ ] **Step 6: Run the focused verification and typecheck**

Run: `npx.cmd --yes tsx scripts/verify-payroll-declaration-engine.ts`

Expected: `Payroll declaration engine verification passed.`

Run: `npx.cmd tsc --noEmit`

Expected: exit 0.

- [ ] **Step 7: Commit the domain unit**

```bash
git add src/team/payroll/payroll-declaration-types.ts src/team/payroll/payroll-declaration-engine.ts scripts/verify-payroll-declaration-engine.ts package.json
git commit -m "feat(payroll): add declaration localization domain"
```

### Task 2: Transactional declaration API and browser repository

**Files:**
- Create: `src/team/payroll/payroll-declaration-api.ts`
- Modify: `scripts/lib/payroll-mock-api-handler.mjs`
- Create: `scripts/verify-payroll-declaration-api.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 types and canonical payload.
- Produces: `PayrollDeclarationRepository` with `listTemplates(scope)`, `createFamily(input)`, `saveDraft(input)`, `publishVersion(input)`, `retireVersion(input)`, `saveEmployeePreference(input)`, `savePeriodOverride(input)`, `confirmDeclaration(input)`, and `loadSnapshot(employeeId, periodId)`.

- [ ] **Step 1: Write failing API transaction verification**

Create a temporary mock DB, call `handlePayrollMockApi()` through an HTTP test server, and assert:

```js
const created = await request("POST", "/api/v1/payroll/declaration/families", { organizationId: "org-1", storeId: "store-1", localeCode: "es-US", languageDisplayName: "Español" });
assert.equal(created.status, 201);
const version = await request("POST", `/api/v1/payroll/declaration/families/${created.body.familyId}/versions`, { source: "Propinas {{tips_amount}}", variableSchemaVersion: "v1" });
const published = await request("POST", `/api/v1/payroll/declaration/versions/${version.body.versionId}/publish`, { expectedFamilyRevision: 0, reviewerId: "admin-1" });
assert.equal(published.status, 200);
const stale = await request("POST", `/api/v1/payroll/declaration/versions/${version.body.versionId}/publish`, { expectedFamilyRevision: 0, reviewerId: "admin-1" });
assert.equal(stale.status, 409);
```

- [ ] **Step 2: Run and verify the route does not exist**

Run: `node scripts/verify-payroll-declaration-api.mjs`

Expected: FAIL with HTTP 404 for `/declaration/families`.

- [ ] **Step 3: Add mock DB collections and scope guards**

Extend the mock DB with `declarationFamilies`, `declarationVersions`, `declarationPreferences`, `declarationOverrides`, `declarationSnapshots`, and `declarationAudit`. Every mutation must compare route/body organization and store scope, reject cross-scope IDs with 404, validate the acting permission supplied by the mock session, and append an immutable audit event.

- [ ] **Step 4: Implement publish and confirm transactions**

Publishing must atomically mark the new version published, replace `activeVersionId`, retire the previous active version, and increment family revision. Confirmation must re-resolve active versions, reject stale preview version IDs with 409, generate server `confirmedAt`, render `confirmation_date`, calculate the SHA-256 hash, and persist one immutable snapshot.

- [ ] **Step 5: Implement the typed browser repository**

Map 409 to `PayrollDeclarationVersionConflictError`, 422 missing template/variable responses to `PayrollDeclarationValidationError`, and 403 to `PayrollDeclarationPermissionError`. Never fall back to localStorage for published versions or persistent snapshots; an unavailable API must disable declaration mutations and formal output.

- [ ] **Step 6: Run API verification and repository verification**

Run: `node scripts/verify-payroll-declaration-api.mjs`

Expected: `Payroll declaration API verification passed.`

Run: `npx.cmd tsc --noEmit`

Expected: exit 0.

- [ ] **Step 7: Commit the API unit**

```bash
git add src/team/payroll/payroll-declaration-api.ts scripts/lib/payroll-mock-api-handler.mjs scripts/verify-payroll-declaration-api.mjs package.json
git commit -m "feat(payroll): add declaration template transactions"
```

### Task 3: Full-screen declaration template manager

**Files:**
- Create: `src/team/payroll/payroll-declaration-settings.ts`
- Modify: `src/team/payroll/payroll-context.ts`
- Modify: `src/team/payroll/payroll-legacy-runtime.ts`
- Modify: `src/team/payroll/payroll-template.html:150-195`
- Modify: `src/team/payroll/payroll-page.css`
- Create: `scripts/verify-payroll-declaration-settings-ui.mjs`

**Interfaces:**
- Consumes: `PayrollDeclarationRepository`, template types, `PayrollPageContext.getScope()`.
- Produces: `createPayrollDeclarationSettingsController({ root, repository, getScope, actor })` with `open()`, `close()`, `refresh()`, and `destroy()`.

- [ ] **Step 1: Write failing static/UI verification**

Assert that the Payroll template contains `data-action="open-declaration-settings"`, the controller renders a full-screen surface with `data-payroll-declaration-settings`, and draft/published/retired actions obey their enabled states.

- [ ] **Step 2: Run and verify the missing entry/controller failure**

Run: `node scripts/verify-payroll-declaration-settings-ui.mjs`

Expected: FAIL with `declaration settings entry is missing`.

- [ ] **Step 3: Add the Payroll action entry and controller mount**

Place “员工声明设置” beside “发薪周期设置”. Mount inside the Payroll shadow root as a full-screen page, not a centered modal. Opening locks the underlying Payroll page scroll; closing restores the previous scroll position and focus.

- [ ] **Step 4: Build list, editor, preview, and lifecycle states**

The list shows language, BCP 47 code, enterprise/store scope, active version, status, reviewer, published time, and usage count. The editor uses a plain `<textarea>`, variable insertion buttons, validation results, and print preview. Published versions expose “创建新版本” and “停用”, never in-place edit.

- [ ] **Step 5: Add conflict and unavailable states**

On 409, keep the draft text, show that another version became active, and offer reload. On API unavailable, allow read-only cached rendering only when repository returned authoritative data from the same session; disable save/publish/retire.

- [ ] **Step 6: Run UI verification and build**

Run: `node scripts/verify-payroll-declaration-settings-ui.mjs`

Expected: `Payroll declaration settings UI verification passed.`

Run: `npm.cmd run build`

Expected: exit 0.

- [ ] **Step 7: Commit the template-manager unit**

```bash
git add src/team/payroll/payroll-declaration-settings.ts src/team/payroll/payroll-context.ts src/team/payroll/payroll-legacy-runtime.ts src/team/payroll/payroll-template.html src/team/payroll/payroll-page.css scripts/verify-payroll-declaration-settings-ui.mjs
git commit -m "feat(payroll): add declaration template manager"
```

### Task 4: Employee default language and period override

**Files:**
- Modify: `src/team/payroll/payroll-types.ts:32-48`
- Modify: `src/team/payroll/payroll-roster-adapter.ts:3-14`
- Modify: `src/team/payroll/payroll-template.html:602-631`
- Modify: `src/team/payroll/legacy/payroll.js.txt` in the employee edit load/save handlers
- Create: `src/team/payroll/payroll-declaration-presentation.ts`
- Create: `scripts/verify-payroll-declaration-preferences.ts`

**Interfaces:**
- Consumes: template repository and Task 1 resolution.
- Produces: `resolveEmployeeDeclarationPresentation({ employee, period, families, versions, preference, override, snapshot, variables })` returning `{ status, primary, english, printMode, sourceScope, blockers }`.

- [ ] **Step 1: Write failing preference/presentation verification**

Test employee default inheritance, one-period override without changing the employee preference, store-over-enterprise source resolution, English bilingual deduplication, missing-English blocker, and immutable snapshot precedence.

- [ ] **Step 2: Run and verify missing presentation resolver**

Run: `npx.cmd --yes tsx scripts/verify-payroll-declaration-preferences.ts`

Expected: FAIL with missing module/export.

- [ ] **Step 3: Extend employee and roster contracts**

Add `declarationPreference?: { defaultFamilyId: string; defaultLocaleCode: string; defaultPrintMode: DeclarationPrintMode }` to `PayrollEmployee` and the roster adapter. Do not use UI locale as the default declaration locale.

- [ ] **Step 4: Add employee editor fields**

Add “默认声明语言”和“默认打印格式”. Populate only applicable published families. Save through `saveEmployeePreference()` before updating the local Payroll employee projection; roll back the local form state on API failure.

- [ ] **Step 5: Implement period override resolution**

For an unconfirmed period, expose “沿用员工默认” and applicable published families plus employee-only/bilingual mode. Save an override keyed by employee and period. For a confirmed/locked snapshot, render read-only snapshot metadata and ignore current preference/template changes.

- [ ] **Step 6: Run verification and typecheck**

Run: `npx.cmd --yes tsx scripts/verify-payroll-declaration-preferences.ts`

Expected: `Payroll declaration preference verification passed.`

Run: `npx.cmd tsc --noEmit`

Expected: exit 0.

- [ ] **Step 7: Commit employee preference unit**

```bash
git add src/team/payroll/payroll-types.ts src/team/payroll/payroll-roster-adapter.ts src/team/payroll/payroll-template.html src/team/payroll/legacy/payroll.js.txt src/team/payroll/payroll-declaration-presentation.ts scripts/verify-payroll-declaration-preferences.ts
git commit -m "feat(payroll): assign employee declaration languages"
```

### Task 5: Employee detail display and confirmation snapshot

**Files:**
- Modify: `src/team/payroll/payroll-template.html:500-565`
- Modify: `src/team/payroll/legacy/payroll.js.txt:50-85,3650-4050,4680-4770`
- Modify: `src/team/payroll/payroll-page.css`
- Modify: `src/team/payroll/payroll-legacy-runtime.ts`
- Create: `scripts/verify-payroll-declaration-detail.mjs`

**Interfaces:**
- Consumes: `resolveEmployeeDeclarationPresentation()`, `PayrollDeclarationRepository.confirmDeclaration()`.
- Produces: legacy bridge methods `getDeclarationPresentation(employeeId, periodId)`, `saveDeclarationOverride(input)`, and `confirmDeclaration(input)`.

- [ ] **Step 1: Write failing detail-state verification**

Verify the detail contains locale/version/source metadata, a primary-language body, optional English body, period override controls only before confirmation, and a blocking state when a required template is absent.

- [ ] **Step 2: Run and verify current fixed-English behavior fails**

Run: `node scripts/verify-payroll-declaration-detail.mjs`

Expected: FAIL because `renderDeclarationText(emp)` still reads the fixed English mapping.

- [ ] **Step 3: Replace fixed-English page rendering**

Remove the runtime declaration source selection from `payroll-adp-mapping.js.txt`. Make detail rendering consume the typed presentation. Use `textContent` for the declaration body and set `dir="rtl"` only for RTL locale families; keep amounts and numeric tokens in `<bdi dir="ltr">` wrappers.

- [ ] **Step 4: Add confirmation transaction UX**

Before confirmation, show the resolved version and an explicit placeholder for `confirmation_date`. Confirmation sends preview version IDs and variables; a 409 keeps the detail open, reloads the latest version, and requires re-review. A successful response replaces the live presentation with the returned persistent snapshot.

- [ ] **Step 5: Enforce unconfirmed output rules**

If the selected template references `confirmation_date`, disable print/PDF/email/CSV/batch and explain that employee confirmation is required. If it does not, allow an operation export snapshot without changing `confirmed`, `lockedAt`, or persistent declaration state.

- [ ] **Step 6: Run detail verification and regression verification**

Run: `node scripts/verify-payroll-declaration-detail.mjs`

Expected: `Payroll declaration detail verification passed.`

Run: `node scripts/verify-team-payroll-native-runtime.mjs`

Expected: existing runtime verification passes.

- [ ] **Step 7: Commit employee-detail unit**

```bash
git add src/team/payroll/payroll-template.html src/team/payroll/legacy/payroll.js.txt src/team/payroll/legacy/payroll-adp-mapping.js.txt src/team/payroll/payroll-page.css src/team/payroll/payroll-legacy-runtime.ts scripts/verify-payroll-declaration-detail.mjs
git commit -m "feat(payroll): render and confirm localized declarations"
```

### Task 6: Single-employee print, PDF, email, and CSV consistency

**Files:**
- Modify: `src/team/payroll/legacy/payroll-detail-export.js.txt`
- Modify: `src/team/payroll/legacy/payroll.js.txt:3650-3970,4690-4770`
- Modify: `src/team/payroll/payroll-export.ts`
- Modify: `src/team/payroll/payroll-page.css`
- Create: `scripts/verify-payroll-declaration-export.mjs`

**Interfaces:**
- Consumes: the resolved operation snapshot or persistent `DeclarationSnapshot`.
- Produces: one export payload field `declarationPresentation` shared by direct print, PDF, email PDF, detailed CSV, and compact CSV.

- [ ] **Step 1: Write failing export matrix verification**

Build fixtures for Spanish-only, Spanish+English, English bilingual deduplication, Vietnamese long text, Arabic RTL, missing font, and historical V1 snapshots. Assert identical declaration text/version across detailed/compact print, PDF payload, and email payload; assert the legacy CSV column list is unchanged.

- [ ] **Step 2: Run and verify fixed text/export divergence**

Run: `node scripts/verify-payroll-declaration-export.mjs`

Expected: FAIL because exporters do not share `declarationPresentation`.

- [ ] **Step 3: Thread one declaration presentation through all exporters**

Build the presentation once when the operation starts, clone it into the operation snapshot, and make every renderer consume it. Do not look up current templates after the export operation begins.

- [ ] **Step 4: Preserve CSV V1 contracts**

Detailed CSV keeps its current columns and filename. Compact CSV keeps its fixed schema. Write primary `renderedText` to the existing `declaration` cell; do not add locale, version, or English columns.

- [ ] **Step 5: Implement multilingual pagination boundaries**

For multilingual declarations, calculate effective declaration text size. Reject fit-one-page below 7pt with a user-facing switch-to-pagination action. In paginate mode, split only at paragraph or safe grapheme boundaries, repeat declaration title/locale/version on continuation pages, and keep signature plus store footer together after the final declaration segment.

- [ ] **Step 6: Run export matrix and existing export checks**

Run: `node scripts/verify-payroll-declaration-export.mjs`

Expected: `Payroll declaration export verification passed.`

Run: `node scripts/verify-team-payroll-polish.mjs`

Expected: existing Payroll print/export checks pass.

- [ ] **Step 7: Commit single-export unit**

```bash
git add src/team/payroll/legacy/payroll-detail-export.js.txt src/team/payroll/legacy/payroll.js.txt src/team/payroll/payroll-export.ts src/team/payroll/payroll-page.css scripts/verify-payroll-declaration-export.mjs
git commit -m "feat(payroll): export localized employee declarations"
```

### Task 7: Batch export and mixed-language artifacts

**Files:**
- Modify: `src/team/payroll/payroll-batch-export-types.ts`
- Modify: `src/team/payroll/payroll-batch-export-data.ts`
- Modify: `src/team/payroll/payroll-batch-export-task.ts`
- Modify: `src/team/payroll/payroll-batch-export-artifacts.ts`
- Modify: `src/team/payroll/payroll-batch-export-csv.ts`
- Modify: `src/team/payroll/payroll-legacy-runtime.ts`
- Modify: `scripts/verify-payroll-batch-export.ts`

**Interfaces:**
- Consumes: `DeclarationSnapshot` or a per-record operation presentation.
- Produces: `BatchEmployeeRecord.declarationPresentation` and the existing `BatchArtifactResult` without changing public download organization options.

- [ ] **Step 1: Add failing mixed-language batch assertions**

Extend the batch fixture with Spanish, Vietnamese, English, missing-template, and unconfirmed-with-confirmation-date employees. Assert valid employees preserve individual languages in a merged PDF, blocked employees are reported by name/reason, and CSV schemas remain unchanged.

- [ ] **Step 2: Run and verify batch records lack declarations**

Run: `npx.cmd --yes tsx scripts/verify-payroll-batch-export.ts`

Expected: FAIL on missing `declarationPresentation` or blocker classification.

- [ ] **Step 3: Resolve declarations before task generation**

At `buildBatchExportInput()`, resolve and clone each record presentation. Extend status classification with explicit declaration blocker codes while retaining existing incomplete/unconfirmed/no-data counts for backward-compatible UI summaries.

- [ ] **Step 4: Render per-employee language in merged and ZIP output**

Pass each cloned presentation to `getDetailPrintHtml()`. Do not use a batch-wide locale. Apply the same font, RTL, bilingual deduplication, and pagination rules as Task 6.

- [ ] **Step 5: Preserve batch CSV contract**

Write each employee's primary frozen declaration into the existing declaration cell/row. A declaration-blocked employee must be skipped and listed in `failures`; it must not receive English fallback text.

- [ ] **Step 6: Run batch and full export verification**

Run: `npm.cmd run verify:payroll-batch-export`

Expected: exit 0 and both TypeScript and UI verification success messages.

Run: `node scripts/verify-payroll-declaration-export.mjs`

Expected: exit 0.

- [ ] **Step 7: Commit batch-export unit**

```bash
git add src/team/payroll/payroll-batch-export-types.ts src/team/payroll/payroll-batch-export-data.ts src/team/payroll/payroll-batch-export-task.ts src/team/payroll/payroll-batch-export-artifacts.ts src/team/payroll/payroll-batch-export-csv.ts src/team/payroll/payroll-legacy-runtime.ts scripts/verify-payroll-batch-export.ts
git commit -m "feat(payroll): batch export multilingual declarations"
```

### Task 8: Migration, activation gate, accessibility, and end-to-end acceptance

**Files:**
- Create: `src/team/payroll/payroll-declaration-migration.ts`
- Modify: `src/team/payroll/payroll-rule-data.ts`
- Modify: `src/team/payroll/legacy/ruleData.js.txt`
- Modify: `src/team/payroll/payroll-template.html`
- Modify: `src/team/payroll/payroll-page.css`
- Create: `scripts/verify-payroll-declaration-migration.ts`
- Create: `scripts/verify-payroll-declaration-acceptance.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: all prior task interfaces.
- Produces: `migrateLegacyDeclarationState(snapshot)`, `getDeclarationActivationReadiness(snapshot)`, and aggregate script `verify:payroll-declarations`.

- [ ] **Step 1: Write failing migration and acceptance fixtures**

Cover: English V1 bootstrap, historical fixed-English preservation, explicit bulk assignment, activation readiness percentage, no automatic employee inference, incomplete migration with enforcement off, enforcement on after activation, keyboard navigation, focus restoration, RTL display, and all export combinations.

- [ ] **Step 2: Run and verify migration helpers are missing**

Run: `npx.cmd --yes tsx scripts/verify-payroll-declaration-migration.ts`

Expected: FAIL with missing migration module.

- [ ] **Step 3: Implement idempotent migration**

Create one enterprise English V1 family/version from the legacy body only when no migration marker exists. Preserve historical English declaration strings as historical snapshots without invented reviewer data. Expose an explicit bulk-assignment action; never assign by employee identity or browser locale.

- [ ] **Step 4: Implement the activation gate**

Before activation, show configured/total employee counts and allow existing behavior while administrators prepare templates. Activation requires an explicit authorized action and then enables missing-template blockers. Store activation state at organization scope, not browser-local scope.

- [ ] **Step 5: Complete accessibility and visual states**

Ensure full-screen manager focus trap/return, labelled language and print-mode controls, keyboard-selectable template rows, `aria-live` conflict/blocker feedback, visible focus, high-contrast status text, RTL paragraph direction, and 1024px/1440px responsive checks.

- [ ] **Step 6: Run the aggregate acceptance suite**

Add:

```json
"verify:payroll-declarations": "npx tsx scripts/verify-payroll-declaration-engine.ts && node scripts/verify-payroll-declaration-api.mjs && node scripts/verify-payroll-declaration-settings-ui.mjs && npx tsx scripts/verify-payroll-declaration-preferences.ts && node scripts/verify-payroll-declaration-detail.mjs && node scripts/verify-payroll-declaration-export.mjs && npx tsx scripts/verify-payroll-declaration-migration.ts && node scripts/verify-payroll-declaration-acceptance.mjs"
```

Run: `npm.cmd run verify:payroll-declarations`

Expected: every declaration verification prints its success message and exits 0.

Run: `npm.cmd run verify:payroll-batch-export`

Expected: exit 0.

Run: `npm.cmd run build`

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 7: Perform browser acceptance**

Run: `npm.cmd run dev -- --host 127.0.0.1`

Verify at `#/team/payroll-report`: template create/publish/retire, employee preference, period override, confirmation conflict, Spanish single-language preview, Spanish+English print preview, English deduplication, Arabic RTL, missing-template blocker, historical re-export, mixed-language batch PDF, 7pt fit-one-page guard, and paragraph continuation pages. Capture console logs and require zero uncaught errors.

- [ ] **Step 8: Commit migration and acceptance unit**

```bash
git add src/team/payroll/payroll-declaration-migration.ts src/team/payroll/payroll-rule-data.ts src/team/payroll/legacy/ruleData.js.txt src/team/payroll/payroll-template.html src/team/payroll/payroll-page.css scripts/verify-payroll-declaration-migration.ts scripts/verify-payroll-declaration-acceptance.mjs package.json
git commit -m "feat(payroll): activate multilingual declaration workflow"
```

## Final Verification Checklist

- [ ] `npm.cmd run verify:payroll-declarations`
- [ ] `npm.cmd run verify:payroll-batch-export`
- [ ] `node scripts/verify-team-payroll-native-runtime.mjs`
- [ ] `node scripts/verify-team-payroll-polish.mjs`
- [ ] `npx.cmd tsc --noEmit`
- [ ] `npm.cmd run build`
- [ ] Browser acceptance at `#/team/payroll-report` with no console errors
- [ ] `git status --short` reviewed so unrelated existing workspace changes are not committed
