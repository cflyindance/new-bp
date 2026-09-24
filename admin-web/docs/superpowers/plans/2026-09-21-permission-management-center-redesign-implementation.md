# Permission Management Center Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current generic four-level RBAC editor with a typed permission resource model, per-binding authorization ceilings, user-specific overrides, explainable effective permissions, and a safer permission-management workflow.

**Architecture:** Keep functional permissions separate from `storeAccess` and `maxPerspective`. Build a pure permission domain layer first, migrate existing role selections into it, then make sessions, navigation, settings, role editing, staff editing, risk reporting, and API guards consume one effective-permission result. Release the new model behind a dark-launch flag until old/new comparison and guard coverage pass.

**Tech Stack:** TypeScript 5.6, Vite 6, DOM-rendered HTML, localStorage-backed demo stores, Node/`tsx` verification scripts.

**Spec:** `docs/superpowers/specs/2026-09-21-permission-management-center-redesign.md`

## Global Constraints

- Unknown, missing, inactive, not-yet-active, and expired permissions default to denied.
- Modules/pages use hidden/visible, actions use denied/allowed, and settings use hidden/read/edit.
- Real action resources must be explicitly registered; do not generate generic create/edit/delete/export/approve actions for every page.
- Each role binding and user `allow` is clipped by its own server-generated grant-time functional ceiling before merging.
- User `deny` wins over user `allow`; user `allow` wins over clipped role bindings.
- Functional permissions remain separate from `storeAccess` and `maxPerspective`.
- Request-time server time is the security boundary for temporary permission activation and expiry.
- Existing grants remain stable if the historical grantor later loses permission; that condition creates a review risk rather than an implicit cascade revoke.
- Frontend visibility is not an authorization boundary; every protected operation needs an enforceable policy key.
- This repository's localStorage/demo handlers can validate the policy contract but cannot serve as a production security boundary; production enforcement remains off until the owning backend service reports the policy as enforced.
- P0–P2 remain dark-launched until guard coverage, migration comparison, and rollback checks pass.

---

## File Structure

New focused domain files:

- `src/permissions/permission-resource-types.ts`: resource, grant, ceiling, override, and effective-result types.
- `src/permissions/permission-resource-registry.ts`: typed resource registry derived from navigation/settings plus explicit action registrations.
- `src/permissions/permission-effective.ts`: pure per-binding clipping and effective-permission calculation.
- `src/permissions/permission-migration.ts`: legacy `selection` migration and old/new comparison.
- `src/permissions/permission-policy.ts`: policy lookup and frontend/API guard facade.
- `src/permissions/permission-editor-ui.ts`: shared module-navigation and expandable permission-table renderer/binder.
- `src/permissions/permission-risk.ts`: risk and stale-authorization diagnostics.

Existing integration files:

- `src/permissions/rbac-types.ts`, `rbac-store-factory.ts`, `rbac-store.ts`, `enterprise-rbac-store.ts`: persistence and compatibility facade.
- `src/auth/session-permissions.ts`: effective snapshot creation and refresh.
- `src/permissions/nav-access.ts`, `rbac-setting-access.ts`: consume the unified result.
- `src/permissions/rbac-ui.ts`, `rbac-scope.ts`, `rbac-scope-types.ts`: redesigned pages and orchestration.
- `src/permissions/rbac-audit.ts`, `rbac-grant.ts`, `store-access.ts`: audit and grant validation.
- `src/main.ts`: route metadata and page binding only.
- `package.json`: verification commands.

Verification scripts:

- `scripts/verify-permission-resource-registry.ts`
- `scripts/verify-permission-effective.ts`
- `scripts/verify-permission-migration.ts`
- `scripts/verify-permission-policy-coverage.ts`
- `scripts/verify-permission-editor-ui.mjs`
- `scripts/verify-permission-management-flow.mjs`

---

### Task 1: Introduce typed permission resources and explicit action registration

**Files:**
- Create: `src/permissions/permission-resource-types.ts`
- Create: `src/permissions/permission-resource-registry.ts`
- Modify: `src/config/permission-registry.ts`
- Create: `scripts/verify-permission-resource-registry.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `PermissionResource`, `PermissionValue`, `PermissionResourceRegistry`, `buildPermissionResourceRegistry()`, `getPermissionResource(key)`.
- Preserves: `buildPermissionModuleGroups()` as a compatibility adapter until Task 8 removes four-column consumers.

- [ ] **Step 1: Write the failing registry verification**

```ts
import assert from "node:assert/strict";
import { buildPermissionResourceRegistry } from "../src/permissions/permission-resource-registry";

const registry = buildPermissionResourceRegistry();
assert.equal(registry.byKey.get("permissions")?.type, "module");
assert.equal(registry.byKey.get("permissions:roles")?.type, "page");
assert.equal(registry.byKey.get("permissions:roles:delete")?.type, "action");
assert.equal(registry.byKey.get("permissions:roles:delete")?.valueKind, "action");
assert.ok([...registry.byKey.values()].every((item) => item.key && item.risk && item.active));
assert.equal(
  [...registry.byKey.values()].some((item) => item.type === "action" && item.actionId === "approve" && item.pageId === "roles"),
  false,
);
console.log("permission resource registry verification passed");
```

- [ ] **Step 2: Run the verification and confirm it fails**

Run: `npx.cmd --yes tsx scripts/verify-permission-resource-registry.ts`  
Expected: FAIL because `permission-resource-registry.ts` does not exist.

- [ ] **Step 3: Add the resource types and explicit action catalog**

```ts
export type PermissionResourceType = "module" | "page" | "action" | "setting";
export type PermissionValueKind = "visibility" | "action" | "setting";
export type PermissionRisk = "normal" | "sensitive" | "critical";
export type PermissionValue = "hidden" | "visible" | "denied" | "allowed" | "read" | "edit";

export interface PermissionResource {
  key: string;
  type: PermissionResourceType;
  valueKind: PermissionValueKind;
  parentKey?: string;
  moduleId: string;
  pageId?: string;
  title: string;
  route?: string;
  actionId?: string;
  settingId?: string;
  risk: PermissionRisk;
  active: boolean;
  backendPolicyKey?: string;
}
```

Define `PAGE_ACTIONS` in `permission-resource-registry.ts` as an explicit record keyed by page id. Seed these verified permission-center actions: role `create/copy/edit/delete`, staff authorization `manage`, audit `view`, and staff-account `create/reset-password/revoke-session`. Omit unsupported generic actions. Add other business actions only in the same change that adds their policy guard.

- [ ] **Step 4: Add the legacy adapter and package command**

Make `buildPermissionModuleGroups()` derive its tree from the new registry so current pages keep working. Add:

```json
"verify:permissions:registry": "npx tsx scripts/verify-permission-resource-registry.ts"
```

- [ ] **Step 5: Run focused and compile verification**

Run: `npm.cmd run verify:permissions:registry`  
Expected: PASS with `permission resource registry verification passed`.

Run: `npx.cmd tsc --noEmit`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/permissions/permission-resource-types.ts src/permissions/permission-resource-registry.ts src/config/permission-registry.ts scripts/verify-permission-resource-registry.ts package.json
git commit -m "feat: add typed permission resource registry"
```

### Task 2: Build the effective-permission calculator

**Files:**
- Create: `src/permissions/permission-effective.ts`
- Modify: `src/permissions/permission-resource-types.ts`
- Create: `scripts/verify-permission-effective.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `PermissionResourceRegistry`, typed permission values.
- Produces: `clipRoleBinding()`, `clipUserAllow()`, `resolveEffectivePermissions(input, now)`, `EffectivePermissionSnapshot`.

- [ ] **Step 1: Write table-driven failing tests for precedence and ceilings**

```ts
const cases = [
  { name: "separate ceilings before union", bindings: [cashierWithRefundCeiling, financeWithoutRefundCeiling], overrides: [], expected: "allowed" },
  { name: "deny beats all roles", bindings: [cashierWithRefundCeiling], overrides: [denyRefund], expected: "denied" },
  { name: "allow is clipped by its own ceiling", bindings: [], overrides: [allowRefundWithoutCeilingPermission], expected: "denied" },
  { name: "expired allow is ignored", bindings: [], overrides: [expiredAllowRefund], expected: "denied" },
  { name: "role expansion is clipped by binding ceiling", bindings: [expandedRoleWithOldCeiling], overrides: [], expected: "denied" },
];
for (const item of cases) {
  assert.equal(resolveEffectivePermissions(item.input, NOW).byKey.get(REFUND)?.value, item.expected, item.name);
}
```

Also assert multiple grantors, multi-level delegation, inactive resources, parent-hidden descendants, setting rank `edit > read > hidden`, and grantor post-authorization permission loss.

- [ ] **Step 2: Run and confirm failure**

Run: `npx.cmd --yes tsx scripts/verify-permission-effective.ts`  
Expected: FAIL because the calculator is absent.

- [ ] **Step 3: Implement pure clipping and merge functions**

```ts
export function resolveEffectivePermissions(
  input: ResolveEffectivePermissionInput,
  now = new Date(),
): EffectivePermissionSnapshot {
  const clippedBindings = input.roleBindings.map((binding) =>
    clipRoleBinding(binding, input.rolesById.get(binding.roleId), input.registry),
  );
  const roleBaseline = mergeClippedBindings(clippedBindings, input.registry);
  const activeAllows = input.overrides.filter((item) => item.mode === "allow" && isActiveAt(item, now));
  const activeDenies = input.overrides.filter((item) => item.mode === "deny" && isActiveAt(item, now));
  const withAllows = applyClippedAllows(roleBaseline, activeAllows, input.registry);
  const withDenies = applyDenies(withAllows, activeDenies, input.registry);
  return applyHardConstraints(withDenies, input.hardConstraints, input.registry, now);
}
```

Every result must include `source`, `sourceRoleIds`, `reason`, `validFrom`, and `validUntil` where applicable.

- [ ] **Step 4: Bound cache lifetime to the next time boundary**

Add `nextBoundaryAt` to `EffectivePermissionSnapshot`, calculated from the nearest future `effectiveFrom` or `expiresAt`. Consumers may cache only until that timestamp.

- [ ] **Step 5: Run verification and TypeScript compilation**

Run: `npm.cmd run verify:permissions:effective`  
Expected: PASS for all table rows.

Run: `npx.cmd tsc --noEmit`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/permissions/permission-resource-types.ts src/permissions/permission-effective.ts scripts/verify-permission-effective.ts package.json
git commit -m "feat: resolve explainable effective permissions"
```

### Task 3: Migrate role bindings, ceilings, and personnel overrides

**Files:**
- Modify: `src/permissions/rbac-types.ts`
- Create: `src/permissions/permission-migration.ts`
- Modify: `src/permissions/rbac-store-factory.ts`
- Modify: `src/permissions/rbac-store.ts`
- Modify: `src/permissions/enterprise-rbac-store.ts`
- Create: `scripts/verify-permission-migration.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `StaffRoleBinding`, `FunctionalGrantCeiling`, `UserPermissionOverride`, `migrateRbacSnapshot()`, `compareLegacyAndTypedPermissions()`.
- Preserves read compatibility for legacy `roleIds` and `selection` during dark launch.

- [ ] **Step 1: Write migration equivalence verification**

Create a legacy fixture containing hidden/visible pages, display-only/editable L4 settings, multiple roles, `storeAccess`, and `maxPerspective`. Assert:

```ts
const migrated = migrateRbacSnapshot(legacySnapshot, migrationActor, registry);
assert.deepEqual(migrated.staff[0].storeAccess, legacySnapshot.staff[0].storeAccess);
assert.equal(migrated.staff[0].roleBindings.length, legacySnapshot.staff[0].roleIds.length);
assert.ok(migrated.staff[0].roleBindings.every((item) => item.functionalCeiling.hash));
assert.deepEqual(compareLegacyAndTypedPermissions(legacySnapshot, migrated, registry), []);
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx.cmd --yes tsx scripts/verify-permission-migration.ts`  
Expected: FAIL because migration types/functions do not exist.

- [ ] **Step 3: Add versioned persistence and normalization**

Extend stored snapshots with `schemaVersion: 4`, `roleBindings`, and `permissionOverrides`. Generate migrated ceilings from a named system migration actor and include `resourceVersion` plus a stable hash. Keep `roleIds` derived from bindings only in the compatibility facade.

- [ ] **Step 4: Add reversible migration comparison**

`compareLegacyAndTypedPermissions()` must return structured differences:

```ts
interface PermissionMigrationDifference {
  employeeId: string;
  resourceKey: string;
  legacyValue: PermissionValue;
  typedValue: PermissionValue;
  reason: string;
}
```

Do not delete legacy stored fields in this task.

- [ ] **Step 5: Run migration, calculator, and compile checks**

Run: `npm.cmd run verify:permissions:migration`  
Expected: PASS with zero differences for the fixture.

Run: `npm.cmd run verify:permissions:effective`  
Expected: PASS.

Run: `npx.cmd tsc --noEmit`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/permissions/rbac-types.ts src/permissions/permission-migration.ts src/permissions/rbac-store-factory.ts src/permissions/rbac-store.ts src/permissions/enterprise-rbac-store.ts scripts/verify-permission-migration.ts package.json
git commit -m "feat: migrate permission grants and ceilings"
```

### Task 4: Integrate effective permissions into sessions, navigation, and settings

**Files:**
- Modify: `src/auth/session-permissions.ts`
- Modify: `src/permissions/nav-access.ts`
- Modify: `src/permissions/rbac-setting-access.ts`
- Modify: `src/permissions/rbac-scope-types.ts`
- Create: `scripts/verify-permission-session-integration.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `resolveEffectivePermissions()` and migrated store records.
- Produces: `UserSessionContext.effectivePermissions`, `canViewResource()`, `resolveSettingAccess()`.

- [ ] **Step 1: Write failing session integration verification**

Assert that a user-denied page disappears from navigation, an allowed page remains reachable, a hidden setting row is removed, a read setting disables controls, an edit setting stays enabled, and `nextBoundaryAt` is retained in the session.

- [ ] **Step 2: Run and confirm failure**

Run: `npx.cmd --yes tsx scripts/verify-permission-session-integration.ts`  
Expected: FAIL because the session still exposes only `permissionSnapshot`.

- [ ] **Step 3: Add the effective snapshot to the session context**

```ts
export interface UserSessionContext {
  employeeId: string;
  roleIds: string[];
  effectivePermissions: EffectivePermissionSnapshot;
  permissionSnapshot: Record<string, PlatformPresetNodeSelection>; // compatibility during dark launch
}
```

Regenerate it on login, role changes, staff authorization changes, and resource-version changes.

- [ ] **Step 4: Switch navigation and setting access readers**

Make `isNavModuleVisible()` read the module resource value. Make `resolveCurrentUserL4SettingAccess()` map setting values exactly: `hidden → denied`, `read → display-only`, `edit → editable`.

- [ ] **Step 5: Run integration and existing build checks**

Run: `npm.cmd run verify:permissions:session`  
Expected: PASS.

Run: `npm.cmd run build`  
Expected: PASS. Do not include generated `dist` changes in the task commit unless repository policy explicitly requires them.

- [ ] **Step 6: Commit**

```bash
git add src/auth/session-permissions.ts src/permissions/nav-access.ts src/permissions/rbac-setting-access.ts src/permissions/rbac-scope-types.ts scripts/verify-permission-session-integration.ts package.json
git commit -m "feat: apply effective permissions to sessions"
```

### Task 5: Build the shared expandable permission editor

**Files:**
- Create: `src/permissions/permission-editor-ui.ts`
- Create: `scripts/verify-permission-editor-ui.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `renderPermissionEditor(model)`, `bindPermissionEditor(root, callbacks)`, `PermissionEditorDraft`.
- Supports modes: `role` and `staff-override`.

- [ ] **Step 1: Write failing DOM contract verification**

The rendered fixture must contain:

```js
assert.match(html, /data-permission-module="orders"/);
assert.match(html, /data-permission-page="orders:order-list"/);
assert.match(html, /data-permission-resource="orders:order-list:refund"/);
assert.match(html, /data-permission-filter="differences"/);
assert.match(html, /data-permission-source/);
assert.doesNotMatch(html, /data-four-column-matrix/);
```

- [ ] **Step 2: Run and confirm failure**

Run: `node scripts/verify-permission-editor-ui.mjs`  
Expected: FAIL because the shared editor is absent.

- [ ] **Step 3: Render module navigation and expandable page rows**

Implement module selection, search, filters (`all`, `enabled`, `differences`, `high-risk`), page summary, and nested action/setting rows. Use native buttons, inputs, `aria-expanded`, labelled groups, and keyboard-focusable controls.

- [ ] **Step 4: Implement typed controls per resource**

- module/page: hidden/visible switch;
- action: denied/allowed switch;
- role setting: hidden/read/edit segmented control;
- staff override: inherit/allow/deny, with read/edit selector visible only for an allowed setting;
- staff rows: baseline, override, effective value, source, and “restore inheritance”.

- [ ] **Step 5: Add parent cascade and filtered bulk-action tests**

Verify a page hide makes descendants ineffective without erasing stored child values, and bulk actions apply only to the explicitly labelled filtered scope.

- [ ] **Step 6: Run UI and compile checks**

Run: `npm.cmd run verify:permissions:editor`  
Expected: PASS.

Run: `npx.cmd tsc --noEmit`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/permissions/permission-editor-ui.ts scripts/verify-permission-editor-ui.mjs package.json
git commit -m "feat: add expandable permission editor"
```

### Task 6: Redesign role management around the shared editor

**Files:**
- Modify: `src/permissions/rbac-ui.ts`
- Modify: `src/permissions/rbac-store-factory.ts`
- Modify: `src/permissions/rbac-audit.ts`
- Modify: `src/main.ts`
- Create: `scripts/verify-permission-role-flow.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: shared editor in `role` mode.
- Produces: role search, copy, member drill-down, typed role save, impact preview, and version-conflict handling.

- [ ] **Step 1: Write failing role-flow verification**

Verify role list controls, editor mount, member count link, impact-preview dialog, risk badges, required reason for sensitive/critical changes, and stale-version rejection.

- [ ] **Step 2: Run and confirm failure**

Run: `node scripts/verify-permission-role-flow.mjs`  
Expected: FAIL against the existing card list/four-column editor.

- [ ] **Step 3: Replace the role editor mount**

Use `renderPermissionEditor({ mode: "role", ... })`. Keep existing role URLs so bookmarks continue to work. Add search/copy/member actions to the role list.

- [ ] **Step 4: Add preview-before-save and optimistic concurrency**

Store a role `version`. Before save, calculate changed resources and affected staff. Require a reason when any changed resource has `risk !== "normal"`. Reject saves whose submitted version differs from the stored version and render the conflict summary.

- [ ] **Step 5: Record audit entries with before/after values**

Write one audit batch per save with actor, role, reason, changed resources, affected staff count, resource-version, and role version.

- [ ] **Step 6: Run role flow, calculator, and build**

Run: `npm.cmd run verify:permissions:roles`  
Expected: PASS.

Run: `npm.cmd run verify:permissions:effective`  
Expected: PASS.

Run: `npm.cmd run build`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/permissions/rbac-ui.ts src/permissions/rbac-store-factory.ts src/permissions/rbac-audit.ts src/main.ts scripts/verify-permission-role-flow.mjs package.json
git commit -m "feat: redesign role permission management"
```

### Task 7: Add staff overrides and final-permission preview

**Files:**
- Modify: `src/permissions/rbac-ui.ts`
- Modify: `src/permissions/rbac-grant.ts`
- Modify: `src/permissions/store-access.ts`
- Modify: `src/permissions/rbac-store-factory.ts`
- Modify: `src/permissions/rbac-audit.ts`
- Create: `scripts/verify-permission-staff-flow.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: shared editor in `staff-override` mode and effective calculator.
- Produces: role binding editor, data scope editor, max perspective, sparse overrides, expiry, final preview, and ceiling creation.

- [ ] **Step 1: Write failing end-to-end staff authorization verification**

Cover role binding, `brands/regions/stores` pickers, staff `deny`, ceiling-clipped staff `allow`, temporary expiry, restore inheritance, preserved non-editable grants, and final source explanation.

- [ ] **Step 2: Run and confirm failure**

Run: `node scripts/verify-permission-staff-flow.mjs`  
Expected: FAIL because staff overrides and preview do not exist.

- [ ] **Step 3: Split staff editing into ordered sections**

Render: identity → roles → data scope → max perspective → personnel exceptions → effective preview. Default the exception editor to the `differences` filter.

- [ ] **Step 4: Generate ceilings only in the trusted store boundary**

Change the save API to accept requested bindings/overrides but generate `FunctionalGrantCeiling` from the current grantor session inside `rbac-store-factory.ts`. Ignore any client-supplied ceiling. A `deny` has no ceiling.

- [ ] **Step 5: Add effective dates and expiry behavior**

Validate `expiresAt > effectiveFrom`, display timezone explicitly, use service time passed into the store boundary, and refresh the page/session when the nearest boundary is crossed. Keep API/request-time validation as the security rule.

- [ ] **Step 6: Extend audit and risk metadata**

Record before/after roles, overrides, scope, perspective, reason, expiry, actor, ceiling hash, and authorization chain. Mark currently redundant overrides without deleting them.

- [ ] **Step 7: Run staff, migration, and build checks**

Run: `npm.cmd run verify:permissions:staff`  
Expected: PASS.

Run: `npm.cmd run verify:permissions:migration`  
Expected: PASS.

Run: `npm.cmd run build`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/permissions/rbac-ui.ts src/permissions/rbac-grant.ts src/permissions/store-access.ts src/permissions/rbac-store-factory.ts src/permissions/rbac-audit.ts scripts/verify-permission-staff-flow.mjs package.json
git commit -m "feat: add staff permission overrides"
```

### Task 8: Add policy guards and coverage verification

**Files:**
- Create: `src/permissions/permission-policy.ts`
- Modify: `src/permissions/rbac-ui.ts`
- Modify: `src/permissions/staff-accounts-ui.ts`
- Modify: `src/main.ts`
- Create: `scripts/verify-permission-policy-coverage.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `authorizePolicy(context, policyKey, targetScope, now)`, `assertPolicy(...)`, `PermissionDeniedError`, and a policy coverage manifest with enforcement owner/state.
- Consumes: effective permission snapshot, current `storeAccess`, `maxPerspective`, and service time.

- [ ] **Step 1: Write the policy-coverage verifier**

Build a manifest of all active action/setting-edit resources with `backendPolicyKey`, `enforcementOwner`, and `enforcementState: "local-demo" | "remote-confirmed"`. Assert every key appears in a registered guard map and every registered guard refers to an active resource. Fail on duplicate or missing policy keys. The production gate must also fail while any active write policy is not `remote-confirmed`.

- [ ] **Step 2: Run and confirm failure**

Run: `npx.cmd --yes tsx scripts/verify-permission-policy-coverage.ts`  
Expected: FAIL with unguarded active policy keys.

- [ ] **Step 3: Implement the guard facade**

```ts
export function authorizePolicy(
  ctx: PermissionRequestContext,
  policyKey: string,
  target: PermissionTargetScope,
  now = new Date(),
): AuthorizationDecision {
  const permission = ctx.effectivePermissions.byPolicyKey.get(policyKey);
  if (!permission || !permission.allowed || !isWithinTime(permission, now)) return deny("permission");
  if (!isTargetWithinEffectiveScope(target, ctx.effectiveScope)) return deny("scope");
  return { allowed: true, resourceKey: permission.resourceKey };
}
```

- [ ] **Step 4: Guard permission-center mutations first**

Apply policies for create/copy/edit/delete role, manage staff authorization, view audit, create login accounts, reset login credentials, and revoke sessions. Return or render 403 behavior separately from 404.

- [ ] **Step 5: Guard every active registered action and setting write**

Keep the initially active registry limited to the permission-center operations guarded in `rbac-ui.ts` and `staff-accounts-ui.ts`, and follow the verifier output until it reports zero uncovered policies. Mark these guards `local-demo` in this repository. For operations backed by a different service/repository, add a typed outbound policy requirement and keep the resource inactive in production until that service confirms enforcement and the manifest changes to `remote-confirmed`.

- [ ] **Step 6: Run coverage, session, and build checks**

Run: `npm.cmd run verify:permissions:coverage`  
Expected: PASS for registry/guard consistency in local-demo mode, while the separate production-gate assertion remains blocked until all active write policies are `remote-confirmed`.

Run: `npm.cmd run verify:permissions:session`  
Expected: PASS.

Run: `npm.cmd run build`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/permissions/permission-policy.ts src/permissions/rbac-ui.ts src/permissions/staff-accounts-ui.ts src/main.ts scripts/verify-permission-policy-coverage.ts package.json
git commit -m "feat: enforce permission policy guards"
```

### Task 9: Redesign overview, risk diagnostics, and audit history

**Files:**
- Create: `src/permissions/permission-risk.ts`
- Modify: `src/permissions/rbac-ui.ts`
- Modify: `src/permissions/rbac-audit.ts`
- Create: `scripts/verify-permission-risk-and-audit.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildPermissionRiskReport(snapshot, now)`, risk drill-down models, filterable audit rows.

- [ ] **Step 1: Write failing risk-report verification**

Assert counts and drill-down records for critical grants, active effective overrides, redundant overrides, grants expiring within seven days, empty roles, inactive-resource grants, and historical grantors who are inactive or no longer hold the granted permission.

- [ ] **Step 2: Run and confirm failure**

Run: `npx.cmd --yes tsx scripts/verify-permission-risk-and-audit.ts`  
Expected: FAIL because risk reporting does not exist.

- [ ] **Step 3: Implement pure risk derivation**

Return stable issue codes (`critical-grant`, `expiring`, `redundant-override`, `empty-role`, `inactive-resource`, `stale-grant-source`) with affected employee/role/resource ids and recommended destination routes.

- [ ] **Step 4: Replace overview counts with actionable cards and queues**

Keep role and staff totals, then add personnel exceptions and high-risk authorization counts. Each warning must navigate to a filtered role, staff, or audit view.

- [ ] **Step 5: Add audit filters and immutable display snapshots**

Filter by employee, role, resource, module, actor, date, and risk. Render stored display names from the audit event so renamed/deactivated resources remain understandable.

- [ ] **Step 6: Run focused and build checks**

Run: `npm.cmd run verify:permissions:risk`  
Expected: PASS.

Run: `npm.cmd run build`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/permissions/permission-risk.ts src/permissions/rbac-ui.ts src/permissions/rbac-audit.ts scripts/verify-permission-risk-and-audit.ts package.json
git commit -m "feat: add permission risk diagnostics"
```

### Task 10: Dark-launch comparison, browser verification, and production gate

**Files:**
- Modify: `src/permissions/permission-migration.ts`
- Modify: `src/auth/session-permissions.ts`
- Create: `scripts/verify-permission-management-flow.mjs`
- Create: `docs/项目文档/权限管理中心迁移与回滚手册.md`
- Modify: `package.json`

**Interfaces:**
- Produces: old/new comparison report, rollout flag, rollback procedure, and final browser-flow verifier.

- [ ] **Step 1: Add a dark-launch switch and structured comparison report**

Use `permission-model-v4-shadow` to calculate both models while enforcing the legacy result. Log only permission keys and internal employee ids; do not log credentials or customer data. Keep a separate `permission-model-v4-enforced` gate that refuses activation unless every active write policy is `remote-confirmed`.

- [ ] **Step 2: Write the full-flow verifier**

Verify these routes and behaviors:

```text
/permissions/overview
/permissions/roles
/permissions/roles/new
/permissions/roles/edit/:id
/permissions/staff
/permissions/staff-accounts
/permissions/change-log
```

Cover role create/copy/edit, staff binding, scope selection, personal deny/allow, expiry, final preview, direct-route denial, 403 operation denial, audit record, conflict handling, and risk drill-down.

- [ ] **Step 3: Run the full verification suite**

Add the aggregate package command:

```json
"verify:permissions": "npm run verify:permissions:registry && npm run verify:permissions:effective && npm run verify:permissions:migration && npm run verify:permissions:session && npm run verify:permissions:editor && npm run verify:permissions:roles && npm run verify:permissions:staff && npm run verify:permissions:coverage && npm run verify:permissions:risk && node scripts/verify-permission-management-flow.mjs"
```

Run: `npm.cmd run verify:permissions`  
Expected: all permission registry, calculator, migration, session, editor, role, staff, coverage, risk, and full-flow checks pass.

Run: `npm.cmd run build`  
Expected: PASS.

- [ ] **Step 4: Perform browser verification at desktop and narrow widths**

Start: `npm run dev -- --host 127.0.0.1 --port 64906`.

Check at 1440px and 390px:

- module navigation and expandable rows remain usable;
- no horizontal page overflow at 390px;
- keyboard focus reaches filters, page expanders, and permission controls;
- visible labels explain baseline, override, effective result, and source;
- denied direct routes show a permission error, not a blank page;
- confirmation dialogs restore focus to their trigger.

- [ ] **Step 5: Write the migration and rollback runbook**

Document exact entry criteria: zero unexplained old/new differences, zero uncovered active policy keys, successful backup/export of legacy records, verified rollback flag, sampled high-risk accounts, and named approver. Document rollback as switching enforcement to legacy and restoring the saved schema-v3 payload without deleting schema-v4 data.

- [ ] **Step 6: Change the production gate only after criteria pass**

Move from `shadow` to `enforced` only when the runbook checklist is signed. Keep the legacy reader for one rollback cycle; remove it in a separate later change, not in this plan.

- [ ] **Step 7: Commit**

```bash
git add src/permissions/permission-migration.ts src/auth/session-permissions.ts scripts/verify-permission-management-flow.mjs docs/项目文档/权限管理中心迁移与回滚手册.md package.json
git commit -m "feat: gate permission model rollout"
```

---

## Final Verification

- [ ] Run `npm.cmd run verify:permissions` and confirm every permission verifier passes.
- [ ] Run `npx.cmd tsc --noEmit` and confirm no TypeScript errors.
- [ ] Run `npm.cmd run build` and confirm the production build succeeds.
- [ ] Confirm the resource registry contains no active action without a guard.
- [ ] Confirm the old/new comparison report has no unexplained differences.
- [ ] Confirm role binding ceiling tests cover multiple grantors, multi-level delegation, later role expansion, and historical grantor permission loss.
- [ ] Confirm temporary permissions deny requests at the server-time boundary without relying on session refresh.
- [ ] Confirm data-scope tests cover all, brands, regions, and stores.
- [ ] Confirm no unrelated dirty-worktree files are staged in any task commit.
