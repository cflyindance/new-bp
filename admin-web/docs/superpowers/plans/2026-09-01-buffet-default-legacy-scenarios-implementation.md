# Buffet Default Legacy Scenarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current six broad buffet defaults with eight disabled, unconfigured system-default rules that directly cover the confirmed legacy KPOS whole-order and per-round scenarios, with safe migration and idempotent refill.

**Architecture:** Add a versioned, fixed default-scenario catalog to the buffet profile and reconcile repository records atomically on authoring-list load. Persist stable system-default identity inside both the record and authoring draft so the shared editor can lock the semantic axes while continuing to use the existing v4 policy, validation, conflict, authorization, publication, and runtime engines. Keep category, multi-round, custom rules, menu-order-limit storage, and menu-order-limit UI untouched.

**Tech Stack:** Static HTML/CSS/JavaScript, localStorage repository envelope v1, buffet rule schema v4, Node.js `assert`/`vm` verification scripts, Vite/TypeScript project build.

**Spec:** `docs/superpowers/specs/2026-09-01-buffet-default-legacy-scenarios-design.md`

## Global Constraints

- Generate exactly 8 authoritative defaults: 4 whole-order rules and 4 per-round rules.
- All generated defaults are `disabled`, have no stores/products/limits, and cannot publish until completed.
- Stable identity is `defaultScenarioKey`; editable names never participate in identity matching.
- A dish rule limits each selected dish independently; one dish-set rule contains one cross-line shared pool with at least 2 dishes.
- Party-size limits multiply by current effective party size; same-dish protection remains a fixed table/current-round cap and does not multiply by party size.
- Per-round dish defaults carry total minimum/maximum plus target limits; per-round dish-set defaults carry set limits plus same-dish protection.
- Total minimum is checked only on round submission; total maximum is checked during quantity increase and round submission.
- Blank means unconfigured; `0` is a configured value and means no minimum when used as minimum or prohibit when used as maximum.
- System-default subject, period, and target type are immutable; name and all downstream business configuration remain editable.
- Deleting a system default refills it as blank and disabled on the next list load.
- Automatic migration requires verifiable legacy-default provenance; uncertain records are retained as ordinary rules.
- Category and multi-round remain available only through ordinary “新增规则” creation.
- Saving a draft may retain a dish-set overlap with a warning; activation and publication must block it.
- Existing menu-order-limit routes, storage, defaults, editor behavior, and runtime behavior must not change.
- Do not modify `vendor/emenu-new`; therefore the eMenu embedded-package build is not part of this plan.

## File Map

- `dist/Configuration center/assets/buffet-rule-profile.js`: owns the v2 authoritative default catalog, default record factory, legacy provenance checks, repository reconciliation, copy identity cleanup, and activation hooks.
- `dist/Configuration center/assets/order-limit-flow.js`: reads system-default identity from the draft, locks semantic choices, restricts period blocks to the template, and warns while saving conflicting dish-set drafts.
- `dist/Configuration center/assets/order-limit-flow.css`: styles locked semantic cards and system-default notice without affecting menu-order-limit pages.
- `dist/Configuration center/buffet-rule.html`: groups default rows, renders the “系统默认” badge, and provides the refill-aware delete confirmation.
- `scripts/verify-buffet-default-catalog.mjs`: verifies the exact eight templates and blank factory output.
- `scripts/verify-buffet-default-reconciliation.mjs`: verifies migration, deduplication, refill, provenance safety, and idempotent repository writes.
- `scripts/verify-buffet-system-default-editor.mjs`: verifies locked semantic axes, allowed blocks, copy cleanup, and draft-overlap warning behavior.
- `scripts/verify-buffet-default-list-ui.mjs`: verifies grouping, badge, and delete copy.
- `scripts/verify-buffet-default-scenario-lifecycle.mjs`: verifies all eight defaults through validation, activation, publication compilation, minimum/maximum, party multiplier, dish-set pooling, and same-dish protection.
- Existing `scripts/verify-buffet-default-scenario-rules.mjs`, `scripts/verify-buffet-dish-set-profile.mjs`, and `scripts/verify-buffet-v4-profile.mjs`: update prior expectations from 6 broad defaults to the new eight-rule catalog.

---

### Task 1: Versioned eight-rule catalog and blank factory

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:15-22,103-125,364-406,534`
- Create: `scripts/verify-buffet-default-catalog.mjs`
- Modify: `scripts/verify-buffet-dish-set-profile.mjs:24-27`
- Modify: `scripts/verify-buffet-v4-profile.mjs:57-71`

**Interfaces:**
- Produces: `DEFAULT_CATALOG_VERSION = 2`.
- Produces: `DEFAULT_SCENARIOS: Array<{key,version,group,subject,targetType,name,enabledPeriods,blocks}>`.
- Produces: `createDefaultScenarioRule(template, id): RuleRecord` with identity duplicated into `authoringConfig` and `editorDraft`.
- Produces: exported `defaultScenarios` containing exactly the eight templates.

- [ ] **Step 1: Write the failing catalog verification**

Create `scripts/verify-buffet-default-catalog.mjs` that loads policy/profile in `vm`, then asserts the exact ordered keys:

```js
const expectedKeys = [
  "order|order_lifetime|dish",
  "order|order_lifetime|dish_set",
  "party_size|order_lifetime|dish",
  "party_size|order_lifetime|dish_set",
  "order|per_round|dish",
  "order|per_round|dish_set",
  "party_size|per_round|dish",
  "party_size|per_round|dish_set",
];
assert.deepEqual(Array.from(profile.defaultScenarios, item => item.key), expectedKeys);
assert.equal(profile.defaultScenarios.every(item => item.version === 2), true);
assert.deepEqual(Array.from(profile.defaultScenarios, item => item.group), [
  "order_lifetime", "order_lifetime", "order_lifetime", "order_lifetime",
  "per_round", "per_round", "per_round", "per_round",
]);
```

For every template call `profile.createDefaultScenarioRule(template, index + 1)` and assert:

```js
assert.equal(rule.status, "disabled");
assert.equal(rule.origin, "system_default");
assert.equal(rule.defaultScenarioKey, template.key);
assert.equal(rule.defaultCatalogVersion, 2);
assert.equal(rule.authoringConfig.defaultScenarioKey, template.key);
assert.equal(rule.authoringConfig.defaultCatalogVersion, 2);
assert.deepEqual(Array.from(rule.authoringConfig.enabledPeriods), Array.from(template.enabledPeriods));
assert.deepEqual(Array.from(rule.authoringConfig.participatingStoreIds), []);
assert.deepEqual(Array.from(rule.authoringConfig.deployStoreIds), []);
assert.deepEqual(Object.keys(rule.authoringConfig.storeConfigs), []);
```

Assert the block matrix:

```js
const byKey = Object.fromEntries(profile.defaultScenarios.map(item => [item.key, item]));
assert.deepEqual(byKey["order|per_round|dish"].blocks, { totalEnabled: true, targetEnabled: true, sameDishEnabled: false });
assert.deepEqual(byKey["party_size|per_round|dish"].blocks, { totalEnabled: true, targetEnabled: true, sameDishEnabled: false });
assert.deepEqual(byKey["order|per_round|dish_set"].blocks, { totalEnabled: false, targetEnabled: true, sameDishEnabled: true });
assert.deepEqual(byKey["party_size|per_round|dish_set"].blocks, { totalEnabled: false, targetEnabled: true, sameDishEnabled: true });
```

- [ ] **Step 2: Run the new and affected tests to verify RED**

Run:

```bash
node scripts/verify-buffet-default-catalog.mjs
node scripts/verify-buffet-dish-set-profile.mjs
node scripts/verify-buffet-v4-profile.mjs
```

Expected: FAIL because the profile still exposes six subject × target defaults and two-part keys.

- [ ] **Step 3: Replace the broad defaults with the fixed catalog**

In `buffet-rule-profile.js`, define the catalog explicitly rather than generating a Cartesian product:

```js
var DEFAULT_CATALOG_VERSION = 2;
var DEFAULT_SCENARIOS = [
  { key: "order|order_lifetime|dish", version: 2, group: "order_lifetime", subject: "order", targetType: "dish", name: "每个订单指定菜品限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
  { key: "order|order_lifetime|dish_set", version: 2, group: "order_lifetime", subject: "order", targetType: "dish_set", name: "每个订单指定菜品集限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
  { key: "party_size|order_lifetime|dish", version: 2, group: "order_lifetime", subject: "party_size", targetType: "dish", name: "每位食客每单指定菜品限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
  { key: "party_size|order_lifetime|dish_set", version: 2, group: "order_lifetime", subject: "party_size", targetType: "dish_set", name: "每位食客每单菜品集限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
  { key: "order|per_round|dish", version: 2, group: "per_round", subject: "order", targetType: "dish", name: "每轮指定菜品最多下多少份", enabledPeriods: ["per_round"], blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: false } },
  { key: "order|per_round|dish_set", version: 2, group: "per_round", subject: "order", targetType: "dish_set", name: "每轮指定菜品集最多下多少份", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: true } },
  { key: "party_size|per_round|dish", version: 2, group: "per_round", subject: "party_size", targetType: "dish", name: "每人每轮指定菜品最多下多少份", enabledPeriods: ["per_round"], blocks: { totalEnabled: true, targetEnabled: true, sameDishEnabled: false } },
  { key: "party_size|per_round|dish_set", version: 2, group: "per_round", subject: "party_size", targetType: "dish_set", name: "每人每轮指定菜品集最多下多少份", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: true } }
];
```

- [ ] **Step 4: Make the factory apply the template verbatim**

Change `createDefaultScenarioRule` so it does not search by only subject/target. Build `periodPolicies` from `template.enabledPeriods` and `template.blocks`, set `period` to the single enabled period, and persist:

```js
draft.origin = "system_default";
draft.defaultScenarioKey = scenario.key;
draft.defaultCatalogVersion = DEFAULT_CATALOG_VERSION;
record.origin = "system_default";
record.defaultScenarioKey = scenario.key;
record.defaultCatalogVersion = DEFAULT_CATALOG_VERSION;
```

Keep all store/product/quantity collections empty and keep status `disabled`.

- [ ] **Step 5: Update six-rule expectations and run GREEN**

Update the two existing scripts to assert 8 defaults, 4 `dish_set` defaults, no category default, and three-part keys. Run:

```bash
node scripts/verify-buffet-default-catalog.mjs
node scripts/verify-buffet-dish-set-profile.mjs
node scripts/verify-buffet-v4-profile.mjs
node scripts/verify-buffet-rule-scenarios.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-default-catalog.mjs scripts/verify-buffet-dish-set-profile.mjs scripts/verify-buffet-v4-profile.mjs
git commit -m "feat: define buffet legacy default catalog"
```

---

### Task 2: Safe, atomic repository reconciliation

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:103-125,470-490`
- Create: `scripts/verify-buffet-default-reconciliation.mjs`
- Modify: `scripts/verify-buffet-default-scenario-rules.mjs`

**Interfaces:**
- Produces: `reconcileDefaultRules(envelope, factory): {changed:boolean,envelope:Envelope}`.
- Produces: `verifiedLegacyDefaultKey(rule): string` returning a canonical three-part key or `""`.
- Produces: `isUntouchedLegacyDefault(rule): boolean` that is true only when every editable field is at its legacy initial value and no snapshot/version record references it.
- Consumes: `repository.loadForAuthoringList(factory)`; remains the only list-load mutation entry point.

- [ ] **Step 1: Write failing reconciliation fixtures**

Create a storage-backed verification covering these exact cases:

```js
// A. empty repository -> exactly 8 defaults and one revision increment
// B. second load -> byte-identical repository string and zero additional writes
// C. delete one system default, save, reload -> exactly that key is refilled blank/disabled
// D. four verifiable legacy defaults -> migrate to four order_lifetime keys, retain config/status, add four per_round defaults
// E. untouched disabled legacy category defaults -> removed
// F. configured or active legacy category defaults -> retained as ordinary rules with system identity removed
// G. legacy record changed to multi-period -> retained ordinary + canonical default added
// H. same semantic mouth without verified provenance -> retained ordinary + canonical default added
// I. multiple verified candidates -> published/current-snapshot candidate wins; other data-bearing candidates become ordinary
// J. configured duplicate -> never deleted
```

Use explicit provenance fixtures such as:

```js
{ origin: "system_default", defaultScenarioKey: "order|dish", defaultCatalogVersion: 1 }
```

and an unverified lookalike:

```js
{ name: "按桌/订单·按菜品限购", authoringConfig: { subject: "order", enabledPeriods: ["order_lifetime"], targetType: "dish" } }
```

Assert the lookalike remains ordinary and does not cover the canonical default.

- [ ] **Step 2: Run reconciliation tests to verify RED**

Run:

```bash
node scripts/verify-buffet-default-reconciliation.mjs
node scripts/verify-buffet-default-scenario-rules.mjs
```

Expected: FAIL because `missingScenarios` currently collapses any rule with the same subject/target and cannot migrate safely.

- [ ] **Step 3: Implement deterministic provenance and blank checks**

Replace `subjectTargetKey`, `defaultScenarioKeyForRule`, and `missingScenarios` with narrowly scoped helpers:

```js
function canonicalDefaultKey(subject, period, targetType) {
  var key = [subject, period, targetType].join("|");
  return DEFAULT_SCENARIOS.some(function (item) { return item.key === key; }) ? key : "";
}

function verifiedLegacyDefaultKey(rule) {
  if (!rule || rule.origin !== "system_default") return "";
  var parts = String(rule.defaultScenarioKey || "").split("|");
  if (parts.length !== 2 || Number(rule.defaultCatalogVersion || 1) !== 1) return "";
  return canonicalDefaultKey(parts[0], "order_lifetime", parts[1]);
}
```

`isUntouchedLegacyDefault` must inspect record and authoring draft values for name/description, products, stores, limits, period values, conditions, party/round ranges, authorization, status, published fields, snapshot references, and envelope snapshot membership. Return false on any uncertainty.

- [ ] **Step 4: Implement the single-pass reconcile transaction**

Inside `reconcileDefaultRules`:

1. Identify exact v2 defaults only by `origin + three-part defaultScenarioKey`.
2. Build verified v1 candidates only through `verifiedLegacyDefaultKey`.
3. Rank candidates: current snapshot/published reference, active status, configured-field score, then oldest creation/id.
4. Upgrade only the winner and preserve its user configuration/status/name.
5. Strip `origin`, `defaultScenarioKey`, and `defaultCatalogVersion` from all non-winning data-bearing candidates.
6. Remove only proven untouched/disabled legacy category or duplicate defaults.
7. Add every missing v2 template through the factory.
8. Return `changed:false` when serialized business state is unchanged.

Call this once inside `mutateEnvelope`; do not perform separate write cycles for migration, cleanup, and fill.

- [ ] **Step 5: Preserve snapshots and verify idempotency**

Assert reconciliation never regenerates runtime snapshots and never changes `currentSnapshotId`; only subsequent normal activation/publication may do so. Run:

```bash
node scripts/verify-buffet-default-reconciliation.mjs
node scripts/verify-buffet-default-scenario-rules.mjs
node scripts/verify-buffet-rule-repository.mjs
```

Expected: PASS with the second list load producing no storage write.

- [ ] **Step 6: Commit**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-default-reconciliation.mjs scripts/verify-buffet-default-scenario-rules.mjs
git commit -m "feat: reconcile buffet default rules safely"
```

---

### Task 3: System-default editor identity and semantic locking

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js:425-433`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:1128-1165,2081-2273,4359-4415`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-system-default-editor.mjs`

**Interfaces:**
- Consumes: draft fields `origin`, `defaultScenarioKey`, `defaultCatalogVersion`.
- Produces: `isSystemDefaultDraft(draft): boolean`.
- Produces: `systemDefaultTemplate(draft): Template|null` using `moduleProfile.defaultScenarios`.
- Produces: `prepareDraftCopy(input)` that always removes system identity from the copy.

- [ ] **Step 1: Write failing editor and copy assertions**

Load profile and flow test API, then assert:

```js
const copied = profile.lifecycle.prepareDraftCopy({
  origin: "system_default",
  defaultScenarioKey: "order|per_round|dish",
  defaultCatalogVersion: 2,
  name: "每轮指定菜品最多下多少份",
});
assert.equal(copied.origin, undefined);
assert.equal(copied.defaultScenarioKey, undefined);
assert.equal(copied.defaultCatalogVersion, undefined);
```

Render Step 1 for a system default and assert the selected subject/target cards are present but disabled, with a “系统默认场景，规则类型不可修改” notice. Render an ordinary rule and assert all current choices remain interactive.

- [ ] **Step 2: Run to verify RED**

Run:

```bash
node scripts/verify-buffet-system-default-editor.mjs
```

Expected: FAIL because copies retain identity and choices are not locked.

- [ ] **Step 3: Persist identity through edit, but remove it on copy**

Ensure `draftFromRule`/initialization retains system identity for edit and view. Extend `prepareDraftCopy`:

```js
["origin", "defaultScenarioKey", "defaultCatalogVersion"].forEach(function (field) {
  delete draft[field];
});
```

The generated draft record created for `copy=1` must not copy record-level identity either.

- [ ] **Step 4: Lock the three semantic axes**

Extend `renderChoice` with an optional `{disabled, locked}` option, render the selected system subject and target cards disabled, and render the template period as a locked summary in Step 2. Guard event handling as a second line of defense:

```js
if (isSystemDefaultDraft(draft) && ["subject", "period", "targetType"].indexOf(field) >= 0) {
  toast("系统默认规则的限购主体、额度周期和限购对象不可修改", true);
  return;
}
```

Do not lock name, description, party ranges, stores, products, quantity cells, conditions, authorization, or deployment scope.

- [ ] **Step 5: Enforce the template block structure**

For a system default, Step 2 must show its period as enabled and non-toggleable. Period blocks are read from the catalog:

```js
draft.enabledPeriods = template.enabledPeriods.slice();
draft.periodPolicies[template.enabledPeriods[0]].blocks = clone(template.blocks);
```

Do not silently overwrite user quantity values. The structure is repaired only when loading a recognized system default; if the record cannot be safely normalized, strip system identity and let reconciliation add a blank canonical rule.

- [ ] **Step 6: Style locked choices and run regressions**

Add scoped `.olf-choice.is-locked` and `.olf-system-default-note` styles; all selectors must live under the existing order-limit flow namespace. Run:

```bash
node scripts/verify-buffet-system-default-editor.mjs
node scripts/verify-buffet-period-scenario-editor.mjs
node scripts/verify-buffet-period-quantity-editor.mjs
node scripts/verify-buffet-rule-menu-regression.mjs
```

Expected: PASS; menu-order-limit choices remain unchanged.

- [ ] **Step 7: Commit**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-system-default-editor.mjs
git commit -m "feat: lock buffet system default semantics"
```

---

### Task 4: Grouped list, badge, and refill-aware deletion

**Files:**
- Modify: `dist/Configuration center/buffet-rule.html:10-35`
- Create: `scripts/verify-buffet-default-list-ui.mjs`

**Interfaces:**
- Consumes: record fields `origin`, `defaultScenarioKey`, and catalog template `group`.
- Produces: `groupFor(record): "order_lifetime"|"per_round"|"custom"`.
- Produces: system-default delete copy that explains automatic refill.

- [ ] **Step 1: Write the failing static and render checks**

Create a VM/DOM-light verification that asserts the page includes:

```text
整单限制
每轮限制
系统默认
删除后，下次进入列表会恢复为空白且禁用的默认规则
```

Seed the repository with eight defaults plus one custom rule and assert render order is four whole-order defaults, four per-round defaults, then custom rules.

- [ ] **Step 2: Run to verify RED**

Run: `node scripts/verify-buffet-default-list-ui.mjs`  
Expected: FAIL because the list is currently a single ungrouped table.

- [ ] **Step 3: Render grouped sections**

Add a catalog lookup by stable key. Render group headings only when rows exist, preserve the existing columns/actions, and add a small `系统默认` badge next to the editable name. Drafts and ordinary rules render under “其他规则”.

- [ ] **Step 4: Use identity-aware delete confirmation**

For ordinary rules keep the current irreversible-delete message. For a system default use:

```text
删除后，下次进入列表会恢复为空白且禁用的默认规则；当前商品、数量和生效范围配置不会保留。确定删除？
```

After confirmed deletion, call the existing save path; do not immediately add the record in the same handler. The next `render()`/list load invokes repository reconciliation and refills it once.

- [ ] **Step 5: Run list and lifecycle regressions**

Run:

```bash
node scripts/verify-buffet-default-list-ui.mjs
node scripts/verify-buffet-rule-lifecycle.mjs
node scripts/verify-buffet-rule-navigation.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "dist/Configuration center/buffet-rule.html" scripts/verify-buffet-default-list-ui.mjs
git commit -m "feat: group buffet system default rules"
```

---

### Task 5: Draft overlap warning and activation/publication blocking

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:1990-2070,5637`
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Modify: `scripts/verify-buffet-v4-conflicts.mjs`
- Extend: `scripts/verify-buffet-system-default-editor.mjs`

**Interfaces:**
- Consumes: `BuffetRuleDomain.findConflict(candidate, records, excludedIds)`.
- Produces: `dishSetOverlapDetails(candidate, records, excludedIds): null|{ruleId,storeIds,dishIds}`.
- Produces: draft save warning without preventing persistence; activation/publication remains blocking through existing lifecycle validation.

- [ ] **Step 1: Add failing overlap-scope cases**

Extend conflict tests with two dish-set rules and verify overlap comparison includes:

```text
subject + enabled period + store intersection + effective date/time intersection
+ member scope intersection + party range intersection + dish intersection
```

Assert non-overlapping stores, times, member levels, or party ranges do not conflict. Assert an overlapping active/published rule conflicts.

- [ ] **Step 2: Add failing draft-save behavior**

In the editor script, invoke the save path with a conflicting dish-set draft and assert:

- the draft is persisted;
- the warning toast/dialog is shown;
- the same rule fails `profile.lifecycle.validateActivation`;
- publish validation returns the same conflict reason.

- [ ] **Step 3: Run to verify RED**

Run:

```bash
node scripts/verify-buffet-v4-conflicts.mjs
node scripts/verify-buffet-system-default-editor.mjs
```

- [ ] **Step 4: Return structured dish-set overlap details**

Keep existing general conflict semantics stable. Add a dish-set-specific detail helper or enrich the existing conflict object without changing truthiness. Compare product identity using `productLineId + dishId`, and calculate intersections only across deployed stores and effective conditions.

- [ ] **Step 5: Warn after successful draft persistence**

After `saveEditorDraft(true)` succeeds, inspect dish-set overlap against other active/formal records. Show a non-blocking warning such as:

```text
草稿已保存，但与“{规则名称}”在 {门店数} 家门店存在菜品集重叠；启用或发布前需要调整。
```

Do not warn ordinary dish/category rules through this new path. Do not bypass `activationValidation`; it must continue to block activation and publication.

- [ ] **Step 6: Run conflict, authorization, and menu regressions**

Run:

```bash
node scripts/verify-buffet-v4-conflicts.mjs
node scripts/verify-buffet-system-default-editor.mjs
node scripts/verify-buffet-rule-authorization.mjs
node scripts/verify-buffet-rule-menu-regression.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-v4-conflicts.mjs scripts/verify-buffet-system-default-editor.mjs
git commit -m "feat: warn on buffet dish set draft overlap"
```

---

### Task 6: Eight-scenario lifecycle and runtime contract

**Files:**
- Create: `scripts/verify-buffet-default-scenario-lifecycle.mjs`
- Modify if a failing contract requires a minimal correction: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify if a failing contract requires a minimal correction: `dist/Configuration center/assets/buffet-rule-domain.js`

**Interfaces:**
- Consumes: `profile.createDefaultScenarioRule`, `profile.lifecycle.validateActivation`, `profile.lifecycle.prepareActivation`, `BuffetRuleDomain.compileRuntimeRules`, and the existing runtime evaluator.
- Produces: an executable acceptance suite for all eight canonical keys.

- [ ] **Step 1: Build complete fixtures for all eight defaults**

For each catalog template, populate one store, product scope, period values, deployment scope, and valid conditions. Use two cross-line dishes for dish-set fixtures. For party-size fixtures use `partyRanges: [{min:1,max:null}]` and runtime `partySize: 3`.

- [ ] **Step 2: Add whole-order assertions**

Verify:

```js
// order+dish: each selected dish is independent
// order+dish_set: cross-line members share one cap
// party+dish: configured cap 2 becomes effective cap 6 at N=3
// party+dish_set: configured shared cap 2 becomes effective cap 6 at N=3
```

Each fixture must pass activation, generate a published config containing only deployed stores, and compile into a runtime rule.

- [ ] **Step 3: Add per-round dish assertions**

For order/per-round/dish, configure total `{min:2,max:5}` and target max `2`. Assert add operations enforce max immediately, `submit_round` enforces min, and round 2 starts with fresh counters.

For party/per-round/dish, configure per-person `{min:1,max:3}`, table fallback `{min:4,max:8}`, target max `2`, and `N=3`. Assert merged total interval is `{min:4,max:8}` and target cap is `6`.

- [ ] **Step 4: Add per-round dish-set assertions**

For both subjects, configure target pool cap and same-dish cap `2`. Assert:

- different cross-line members consume the shared pool;
- the same dish cannot exceed 2 in the current table/current round;
- the party-size shared pool multiplies by `N`;
- same-dish cap stays 2 and does not multiply by `N`.

- [ ] **Step 5: Add blank, zero, authorization, and revalidation assertions**

Verify blank bounds remain unconfigured, minimum `0` does not require positive quantity, maximum `0` prohibits add, `min > max` blocks publication, cancellation/return below minimum is rechecked on round submission, and authorization scopes behave as follows:

```text
operation -> only the approved submission attempt
round     -> subsequent operations in the same round, not the next round
order     -> later rounds of the same order, not another order
```

- [ ] **Step 6: Run the acceptance suite and existing runtime suites**

Run:

```bash
node scripts/verify-buffet-default-scenario-lifecycle.mjs
node scripts/verify-buffet-v4-validation.mjs
node scripts/verify-buffet-v4-runtime.mjs
node scripts/verify-buffet-v4-lifecycle.mjs
node scripts/verify-buffet-same-dish-exceptions.mjs
node scripts/verify-buffet-dish-set-domain.mjs
```

Expected: PASS. If the new suite reveals an existing runtime defect, make only the smallest correction required by the confirmed spec and rerun all listed suites.

- [ ] **Step 7: Commit**

```bash
git add scripts/verify-buffet-default-scenario-lifecycle.mjs "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-domain.js"
git commit -m "test: cover buffet default scenario lifecycle"
```

---

### Task 7: Full regression, build, and browser acceptance

**Files:**
- Modify only if verification finds a defect: files already listed in Tasks 1-6
- Verify: `dist/Configuration center/buffet-rule.html`
- Verify: `dist/Configuration center/buffet-rule-editor.html`
- Verify: `dist/Configuration center/buffet-rule-publish-confirm.html`

**Interfaces:**
- Consumes: all deliverables from Tasks 1-6.
- Produces: clean build, browser acceptance evidence, and a clean worktree.

- [ ] **Step 1: Run all focused buffet tests**

Run:

```powershell
$tests = @(
  'verify-buffet-default-catalog.mjs',
  'verify-buffet-default-reconciliation.mjs',
  'verify-buffet-default-scenario-rules.mjs',
  'verify-buffet-system-default-editor.mjs',
  'verify-buffet-default-list-ui.mjs',
  'verify-buffet-default-scenario-lifecycle.mjs',
  'verify-buffet-v4-policy.mjs',
  'verify-buffet-v4-profile.mjs',
  'verify-buffet-v4-validation.mjs',
  'verify-buffet-v4-conflicts.mjs',
  'verify-buffet-v4-runtime.mjs',
  'verify-buffet-v4-lifecycle.mjs',
  'verify-buffet-rule-authorization.mjs',
  'verify-buffet-rule-repository.mjs',
  'verify-buffet-rule-menu-regression.mjs'
)
foreach ($test in $tests) { node (Join-Path 'scripts' $test); if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: every script prints `OK` or `PASS` and exits 0.

- [ ] **Step 2: Run project build**

Run: `npm.cmd run build`  
Expected: exit 0. No `vendor/emenu-new` source is changed, so `build:emenu-new-embed` is not required.

- [ ] **Step 3: Start a worktree-local preview service**

Run from the worktree `admin-web` directory:

```bash
npm run dev -- --host 127.0.0.1 --port 65163
```

Verify HTTP 200 for:

```text
http://127.0.0.1:65163/Configuration%20center/buffet-rule.html?embedded=1
http://127.0.0.1:65163/Configuration%20center/buffet-rule-editor.html?mode=create&embedded=1
```

- [ ] **Step 4: Perform browser acceptance**

In a clean localStorage state verify:

1. The list shows “整单限制” with 4 system defaults and “每轮限制” with 4 system defaults.
2. All eight rows show “系统默认” and “已禁用”, with zero effective stores.
3. Editing each row locks subject/period/target while leaving name and downstream steps editable.
4. Per-round dish rows show total min/max plus target limit; party-size version also shows table fallback min/max.
5. Per-round dish-set rows show shared set limit plus same-dish protection.
6. Copying a default creates an ordinary rule without the badge.
7. Deleting a default shows the refill warning and the row reappears blank/disabled after list reload.
8. A conflicting dish-set draft saves with warning; activation/publication is blocked.
9. Category and multi-round remain creatable through “新增规则”.
10. Menu-order-limit list/editor behavior is unchanged.

- [ ] **Step 5: Inspect repository diff and generated artifacts**

Run:

```bash
git status --short
git diff --check
git diff --stat main...HEAD
```

Expected: no whitespace errors, no cache/build artifacts, and no changes under `vendor/emenu-new` or menu-order-limit-only data files.

- [ ] **Step 6: Commit any verification-only corrections**

If browser/build verification required corrections, rerun the affected focused tests and commit only those corrections:

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-domain.js" "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "dist/Configuration center/buffet-rule.html" scripts
git commit -m "fix: complete buffet default scenario acceptance"
```

If no files changed, do not create an empty commit.

- [ ] **Step 7: Final status check**

Run: `git status --short`  
Expected: empty output.
