# Buffet Dish-Set Dual Measure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move dish-set measurement into each quota scene so one scene can enforce piece and kind limits together while preserving one shared product-piece protection model.

**Architecture:** Add a root `quotaSchemaVersion: 2` authoring contract and scene-local `measures.piece/kind` values in the policy layer, then make the editor, persistence/profile adapter, runtime compiler, evaluator, authorization, and summaries consume that contract. Keep dish/category rules on the existing maps, adapt dish-set v1 maps exactly once, and compile all dish-set limits into explicit `piece`, `kind`, and `product_piece` constraints.

**Tech Stack:** Browser JavaScript, DOM/CSS, Node.js verification scripts using `node:assert`, localStorage-backed prototype repository, existing `BuffetRulePolicy`, `BuffetRuleDomain`, and `ORDER_LIMIT_MODULE_PROFILE` globals.

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-dish-set-dual-measure-design.md`

## Global Constraints

- Only `targetType === "dish_set"` uses scene-local dual measures; dish and category stay on existing piece-based maps.
- `quotaSchemaVersion=2` exists once at the rule authoring root.
- `kindKey` and `productKey` are both `productLineId + ":" + dishId`; names and upstream SPU labels never merge counters.
- Every dish-set scene enables at least one of `piece` or `kind`; every enabled metric has at least one applicable configured maximum.
- Reaching a maximum is allowed; only a candidate quantity greater than the maximum is rejected.
- Product protection remains one `product_piece` model shared by piece and kind measures.
- v1 migration is idempotent and preserves store, period, party range ID, round range ID, zero values, default product limits, and exceptions.
- Old clients without `buffet_dish_set_dual_measure_v1` may view summaries but receive `409 UNSUPPORTED_BUFFET_QUOTA_SCHEMA` for edit, copy, enable, and publish operations.
- Batch scene updates are atomic; one invalid target leaves every target unchanged.
- Single-scene quota tables must remain free of horizontal scrolling at `1024 × 768`.

---

## File Structure

- `dist/Configuration center/assets/buffet-rule-policy.js`: schema constructors, stable keys, v1-to-v2 normalization, metric validation, and scene-copy primitives.
- `dist/Configuration center/assets/buffet-rule-domain.js`: constraint compilation, candidate counting, violations, authorization matching, conflict identity, and runtime snapshots.
- `dist/Configuration center/assets/buffet-rule-profile.js`: default-rule initialization, capability gate, repository round-trip, activation, and snapshot persistence.
- `dist/Configuration center/assets/order-limit-flow.js`: rule-type form, scene quota card, switches, batch interactions, status, summaries, and publication validation.
- `dist/Configuration center/assets/order-limit-flow.css`: responsive dual-measure quota layout without single-scene horizontal scrolling.
- `scripts/verify-buffet-dual-measure-policy.mjs`: schema, stable identity, migration, validation, and copy regression.
- `scripts/verify-buffet-dual-measure-runtime.mjs`: compilation, simultaneous limits, decrement behavior, violations, and authorization regression.
- `scripts/verify-buffet-dual-measure-editor.mjs`: static editor contract, field placement, batch semantics, summary, and default identity regression.
- `scripts/verify-buffet-dual-measure-lifecycle.mjs`: repository/capability/version/snapshot round-trip regression.
- `scripts/verify-buffet-dual-measure-browser.mjs`: browser workflow and responsive layout acceptance.
- `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`: authoritative status updated only if implementation requires a factual deviation from the approved spec.

---

### Task 1: Define and Migrate the Scene-Measure Contract

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Create: `scripts/verify-buffet-dual-measure-policy.mjs`

**Interfaces:**
- Produces: `productKey(item): string`, `emptyDishSetMeasures(): object`, `dishSetSceneMeasures(rule, config, period, partyIndex, roundIndex): object`, `migrateDishSetQuotaV2(rule): { rule, migrated }`, `validateDishSetMeasures(rule, config, period, partyIndex, roundIndex): { valid, code?, metric? }`, `copyDishSetSceneQuota(source, destination, sourceKey, destinationKey): object`.
- Consumes: existing `scenarioTargetKey`, `configuredNumber`, `normalizeStoreConfig`, and `menuIdentity` behavior.

- [ ] **Step 1: Write the failing schema and migration verification**

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const window = {};
vm.runInNewContext(
  fs.readFileSync(path.join(root, "dist/Configuration center/assets/buffet-rule-policy.js"), "utf8"),
  { window, Number, String, Array, Object, Math, JSON }
);
const policy = window.BuffetRulePolicy;

assert.equal(policy.productKey({ productLineId: "kiosk", dishId: "beef" }), "kiosk:beef");
const migrated = policy.migrateDishSetQuotaV2(oldOrderPieceRule).rule;
assert.equal(migrated.quotaSchemaVersion, 2);
assert.deepEqual(migrated.storeConfigs.s1.periodValues.per_round.measures.piece.perTableMax["p1|r1"], { configured: true, value: 3 });
assert.equal(migrated.storeConfigs.s1.periodValues.per_round.measures.piece.enabled["p1|r1"], true);
assert.equal(policy.migrateDishSetQuotaV2(migrated).migrated, false);
```

- [ ] **Step 2: Run the new verification and confirm the missing API failure**

Run: `node scripts/verify-buffet-dual-measure-policy.mjs`

Expected: FAIL because `productKey` or `migrateDishSetQuotaV2` is not exported.

- [ ] **Step 3: Implement canonical constructors and keys**

```js
function productKey(item) {
  return String(item && item.productLineId || "") + ":" + String(item && item.dishId || "");
}

function emptyMetricValues() {
  return { enabled: {}, perPersonMax: {}, perTableMax: {} };
}

function emptyDishSetMeasures() {
  return { piece: emptyMetricValues(), kind: emptyMetricValues() };
}
```

Export these functions on `window.BuffetRulePolicy` and use the existing stable `scenarioTargetKey` as the map key inside every metric.

- [ ] **Step 4: Implement idempotent v1 migration with subject and default-rule branches**

```js
function v1Destination(rule, mapName) {
  if (mapName === "tableTargetCaps") return "perTableMax";
  if (String(rule.defaultScenarioKey || "").startsWith("combo|per_round|dish_set|")) {
    return String(rule.defaultScenarioKey).endsWith("|party_size") ? "perPersonMax" : "perTableMax";
  }
  return rule.subject === "party_size" ? "perPersonMax" : "perTableMax";
}
```

For each store and period, copy configured cells from `targetLimits/tableTargetCaps` into the metric selected by legacy `measureUnit`, copy `defaultDishLimits/exceptionDishLimits` into `productLimits`, retain original range-ID keys, set the corresponding `enabled[sceneKey]`, and set root `quotaSchemaVersion=2`. Return `{ migrated:false }` without touching values when the root version is already 2.

- [ ] **Step 5: Add validation and copy assertions**

Cover piece-only, kind-only, both enabled, both disabled, enabled-without-value, configured zero, order subject, party subject, C2/C3/C5/C6, multi-period, same-line same-dish specifications, cross-line same-name products, and copying a scene without retaining shared object references.

- [ ] **Step 6: Run policy verification and relevant legacy regressions**

Run:

```bash
node scripts/verify-buffet-dual-measure-policy.mjs
node scripts/verify-buffet-range-id-migration.mjs
node scripts/verify-buffet-combo-range-identity.mjs
node scripts/verify-buffet-v4-policy.mjs
```

Expected: all PASS.

- [ ] **Step 7: Commit the policy contract**

```bash
git add "dist/Configuration center/assets/buffet-rule-policy.js" scripts/verify-buffet-dual-measure-policy.mjs
git commit -m "feat: add buffet scene dual measure schema"
```

---

### Task 2: Move Measure Selection into the Scene Quota Editor

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-dual-measure-editor.mjs`

**Interfaces:**
- Consumes: Task 1 `dishSetSceneMeasures`, `validateDishSetMeasures`, and `productKey`.
- Produces: `renderBuffetSharedQuotaPanel` with two switches, `setDishSetMetricEnabled`, `writeDishSetMetricCell`, and scene status/summary readers based on enabled metrics.

- [ ] **Step 1: Write static editor contract checks**

```js
assert.doesNotMatch(renderRuleTypeStep, /name="measureUnit"/);
assert.match(renderSharedPanel, /按份限制/);
assert.match(renderSharedPanel, /按种限制（SPU）/);
assert.match(renderSharedPanel, /data-metric="piece"/);
assert.match(renderSharedPanel, /data-metric="kind"/);
assert.match(source, /至少启用一种计量方式/);
```

Also assert that product rows still render one product-piece input and do not duplicate inputs for `piece` and `kind`.

- [ ] **Step 2: Run the editor verification and confirm it fails on the global selector**

Run: `node scripts/verify-buffet-dual-measure-editor.mjs`

Expected: FAIL because Step 1 still renders the global measure selector and the quota panel renders only one metric.

- [ ] **Step 3: Remove global measure selection from rule type rendering**

Delete the dish-set `measureUnit` radio group and its change handler. Keep dish/category behavior unchanged. Update preview text to show “按照菜品集限购”; do not show a measure until scene data exists.

- [ ] **Step 4: Render two independent metric blocks**

```js
function metricQuotaFields(metric, label, unit, cells, labels) {
  return '<section class="olf-dual-measure" data-metric="' + metric + '">' +
    '<label class="olf-switch-row"><input type="checkbox" data-action="toggle-dish-set-metric" data-metric="' + metric + '">' + label + '</label>' +
    '<div class="olf-dual-measure__fields">' + quotaInput(labels.perPerson, unit, cells.perPersonMax) + quotaInput(labels.perTable, unit, cells.perTableMax) + '</div>' +
  '</section>';
}
```

Use the existing subject/period label helpers so order scenes render only fixed table fields and party scenes render per-person plus optional table cap. Disabled blocks hide their fields but keep their switch visible.

- [ ] **Step 5: Implement safe toggle and cell writes**

When disabling a metric with configured cells, use the existing confirmation dialog. Confirming deletes only that scene's metric cells and enabled flag; cancel restores the checked state. Reject attempts to disable the last enabled metric. Parse empty, zero, integer, negative, decimal, and upper-bound values through existing numeric helpers.

- [ ] **Step 6: Replace scene status and summary logic**

```js
function dishSetMeasureSummary(metric, cells, labels, unit) {
  if (!cells.enabled) return "";
  return label + "：" + [
    configuredText(labels.perPerson, cells.perPersonMax, unit),
    configuredText(labels.perTable, cells.perTableMax, unit)
  ].filter(Boolean).join("；");
}
```

State priority is: any configured zero → “禁止下单”; every enabled metric has an applicable configured cell → “已配置”; otherwise → “未配置”.

- [ ] **Step 7: Add responsive styles**

Use a two-column metric grid above 720px and one column below it. Allow labels and inputs to wrap, keep product fields in their existing independent columns, and ensure the single-scene table never receives a fixed minimum width.

- [ ] **Step 8: Run editor and existing table regressions**

Run:

```bash
node scripts/verify-buffet-dual-measure-editor.mjs
node scripts/verify-buffet-rule-type-field-order.mjs
node scripts/verify-buffet-quota-labeled-columns.mjs
node scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs
node scripts/verify-buffet-quantity-target-presenters.mjs
```

Expected: all PASS.

- [ ] **Step 9: Commit the editor change**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-dual-measure-editor.mjs
git commit -m "feat: configure dish set measures by scene"
```

---

### Task 3: Add Atomic Scene Batch Updates, Copying, and All-Scene Summary

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/buffet-rule-policy.js`
- Extend: `scripts/verify-buffet-dual-measure-policy.mjs`
- Extend: `scripts/verify-buffet-dual-measure-editor.mjs`
- Modify: `scripts/verify-buffet-multi-field-bulk.mjs`

**Interfaces:**
- Consumes: Task 1 metric maps and copy primitive.
- Produces: `applyDishSetMetricBatch(draft, scenes, command): { ok, draft?, errors? }`, copied scene-local measures, and all-scene measure filters/summaries.

- [ ] **Step 1: Add failing batch atomicity cases**

```js
const result = policy.applyDishSetMetricBatch(draft, [sceneA, sceneB], {
  piece: { mode: "disable" },
  kind: { mode: "ignore" }
});
assert.equal(result.ok, false);
assert.deepEqual(result.errors.map(e => e.sceneKey), [sceneB.key]);
assert.deepEqual(result.draft, undefined);
assert.deepEqual(draft, originalDraft);
```

Add cases for `ignore`, `enable_and_set`, `disable_and_clear`, explicit zero, empty field preserving the original value, and one invalid scene rolling back every target.

- [ ] **Step 2: Implement clone-validate-commit batch semantics**

Clone the draft, apply both metric commands to the clone, call `validateDishSetMeasures` for every target, and return errors without mutating the input if any validation fails. Only return the completed clone when all target scenes pass.

- [ ] **Step 3: Separate scene batch controls from product selection**

The shared quota batch panel must show selected scene count, not product count. Keep table checkboxes exclusively connected to product-piece bulk editing. Label the three modes exactly “不处理 / 启用并设置 / 关闭并清除”.

- [ ] **Step 4: Copy all scene-local data by value**

Extend existing scenario-copy actions to copy `measures.piece`, `measures.kind`, and shared `productLimits` using stable source/destination scene keys. Verify that later editing the source does not change the destination.

- [ ] **Step 5: Update all-scene filters and flat rows**

Add filter values `all`, `piece`, `kind`, and `piece_kind`. Add independent “按份共享额度”和“按种共享额度” columns to flat rows; preserve one product-piece column. A row matches `piece_kind` only when both flags are enabled in that row's scene.

- [ ] **Step 6: Run batch, copy, and summary regressions**

Run:

```bash
node scripts/verify-buffet-dual-measure-policy.mjs
node scripts/verify-buffet-dual-measure-editor.mjs
node scripts/verify-buffet-multi-field-bulk.mjs
node scripts/verify-buffet-scenario-copy.mjs
node scripts/verify-buffet-all-scene-summary-model.mjs
node scripts/verify-buffet-all-scene-summary-ui.mjs
```

Expected: all PASS.

- [ ] **Step 7: Commit batch and summary support**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/buffet-rule-policy.js" scripts/verify-buffet-dual-measure-policy.mjs scripts/verify-buffet-dual-measure-editor.mjs scripts/verify-buffet-multi-field-bulk.mjs
git commit -m "feat: batch and summarize buffet dual measures"
```

---

### Task 4: Compile and Evaluate All Three Dish-Set Constraint Metrics

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Create: `scripts/verify-buffet-dual-measure-runtime.mjs`

**Interfaces:**
- Consumes: v2 scene measures, product keys, stable scene keys, existing counters and `evaluateBatch(input)`.
- Produces: compiled constraints with `metric: piece|kind|product_piece` and deterministic `violations[]`.

- [ ] **Step 1: Write failing compiler and evaluator cases**

```js
const compiled = domain.compileRuleConstraints(dualMeasureRule);
assert.deepEqual(compiled.map(x => x.metric).sort(), ["kind", "piece", "product_piece"]);

const result = domain.evaluateBatch(dualExceededInput);
assert.equal(result.allowed, false);
assert.deepEqual(result.violations.map(v => v.code), [
  "SAME_DISH_LIMIT_EXCEEDED",
  "DISH_SET_KIND_LIMIT_EXCEEDED",
  "DISH_SET_PIECE_LIMIT_EXCEEDED"
]);
```

Cover equality allowed, piece-only excess, kind-only excess, simultaneous excess, same dish from 1→2 not increasing kinds, 1→0 releasing a kind, cross-line same-name counting twice, and a mixed batch rejecting atomically.

- [ ] **Step 2: Run runtime verification and confirm legacy single-measure behavior fails the new assertions**

Run: `node scripts/verify-buffet-dual-measure-runtime.mjs`

Expected: FAIL because compilation currently reads only `measureUnit` and old target maps.

- [ ] **Step 3: Compile explicit metric constraints**

```js
constraints.push({
  ruleId: rule.id,
  ruleVersion: rule.version,
  metric: metric,
  sceneKey: stableSceneKey,
  targetKey: "dish_set:" + rule.id,
  perPersonMax: configuredValue(metricValues.perPersonMax[stableSceneKey]),
  perTableMax: configuredValue(metricValues.perTableMax[stableSceneKey])
});
```

Compile shared product limits as `product_piece` with `targetKey=productLineId:dishId`. Keep existing dish/category compilation unchanged.

- [ ] **Step 4: Count candidate pieces and kinds by stable identity**

Merge persisted counter items and input deltas by `productLineId:dishId`, reject a candidate total below zero, sum positive quantities for pieces, and count positive keys for kinds. Filter both counters to the current scene's dish-set members before comparison.

- [ ] **Step 5: Return deterministic multi-violation results**

Each violation includes `code`, `metric`, `ruleId`, `ruleVersion`, `sceneKey`, `targetKey`, `configuredLimit`, and `candidateValue`. Sort by `product_piece`, `kind`, then `piece`; preserve all violations and return no accepted items when the list is non-empty.

- [ ] **Step 6: Run runtime and conflict regressions**

Run:

```bash
node scripts/verify-buffet-dual-measure-runtime.mjs
node scripts/verify-buffet-v4-runtime.mjs
node scripts/verify-buffet-combo-template-runtime.mjs
node scripts/verify-buffet-v4-conflicts.mjs
node scripts/verify-buffet-combo-template-conflicts.mjs
```

Expected: all PASS; legacy tests may use the compatibility adapter but must retain their current results.

- [ ] **Step 7: Commit runtime constraints**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-dual-measure-runtime.mjs
git commit -m "feat: enforce buffet dual measure constraints"
```

---

### Task 5: Scope Authorization to Individual Violations

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Extend: `scripts/verify-buffet-dual-measure-runtime.mjs`

**Interfaces:**
- Consumes: Task 4 violations.
- Produces: authorization references keyed by `ruleId + ruleVersion + metric + sceneKey + targetKey + approvedLimit`.

- [ ] **Step 1: Add failing authorization isolation cases**

Create an input that exceeds piece and kind together. Assert that a credential covering only piece still leaves the kind violation, a credential covering only kind still leaves the piece violation, and two exact references allow the operation.

- [ ] **Step 2: Implement exact authorization reference matching**

```js
function violationAuthorizationKey(item) {
  return [item.ruleId, item.ruleVersion, item.metric, item.sceneKey, item.targetKey, item.configuredLimit].join("|");
}
```

Reject credentials whose rule ID, version, metric, scene, target, or approved limit does not match. Do not authorize parameter errors or minimum-bound failures.

- [ ] **Step 3: Update authorization UI summaries**

Render separate descriptions for piece, kind, and product-piece violations. When multiple violations exist, list all required authorization items before accepting credentials.

- [ ] **Step 4: Run authorization regressions**

Run:

```bash
node scripts/verify-buffet-dual-measure-runtime.mjs
node scripts/verify-buffet-rule-authorization.mjs
node scripts/verify-buffet-v4-runtime.mjs
```

Expected: all PASS.

- [ ] **Step 5: Commit scoped authorization**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-dual-measure-runtime.mjs
git commit -m "feat: scope buffet dual measure authorization"
```

---

### Task 6: Persist, Gate, and Publish v2 Rules Safely

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-dual-measure-lifecycle.mjs`

**Interfaces:**
- Consumes: Task 1 migration and Task 4 constraint compilation.
- Produces: capability-aware repository reads/writes, default-rule initialization, v2 authoring round-trip, and runtime snapshots containing explicit constraints.

- [ ] **Step 1: Write failing lifecycle cases**

```js
assert.equal(profile.requiredCapability(dualRule), "buffet_dish_set_dual_measure_v1");
assert.equal(profile.canMutateRule(dualRule, []).code, "UNSUPPORTED_BUFFET_QUOTA_SCHEMA");
assert.equal(profile.canMutateRule(dualRule, ["buffet_dish_set_dual_measure_v1"]).allowed, true);
assert.deepEqual(roundTrip.authoringConfig.storeConfigs, dualRule.authoringConfig.storeConfigs);
assert.ok(snapshot.rules[0].constraints.some(x => x.metric === "piece"));
assert.ok(snapshot.rules[0].constraints.some(x => x.metric === "kind"));
```

Add C2/C5 default initialization as piece-only, C3/C6 as kind-only, and conversion to a normal rule when a second metric is enabled.

- [ ] **Step 2: Add capability helpers and mutation gates**

Export `requiredCapability(rule)` and `canMutateRule(rule, capabilities)`. Apply the gate to edit, copy, activation, and publication entry points; use an error object with status 409 and code `UNSUPPORTED_BUFFET_QUOTA_SCHEMA`.

- [ ] **Step 3: Initialize defaults without conflating common templates**

The 10 common templates continue to set subject/period only. Selecting `dish_set` for a new ordinary rule initializes the first scene as piece-only. System defaults C2/C5 initialize piece; C3/C6 initialize kind. Enabling the second metric clears `defaultScenarioKey/defaultCatalogVersion` but does not modify `buffetTemplateModified`.

- [ ] **Step 4: Persist and compile the v2 snapshot**

Store `quotaSchemaVersion=2` once in `authoringConfig`. `compileRuntimeRules` must include `constraints[]` and omit runtime dependence on legacy `measureUnit` for v2 dish sets. Keep v1 published snapshots readable until replaced by a successfully published v2 snapshot.

- [ ] **Step 5: Run lifecycle and default-rule regressions**

Run:

```bash
node scripts/verify-buffet-dual-measure-lifecycle.mjs
node scripts/verify-buffet-default-catalog.mjs
node scripts/verify-buffet-default-scenario-lifecycle.mjs
node scripts/verify-buffet-default-reconciliation.mjs
node scripts/verify-buffet-v4-lifecycle.mjs
```

Expected: all PASS.

- [ ] **Step 6: Commit lifecycle support**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-dual-measure-lifecycle.mjs
git commit -m "feat: persist buffet dual measure rules"
```

---

### Task 7: Complete Publication Validation and Browser Acceptance

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-dual-measure-browser.mjs`
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md` only if verified implementation details differ from the approved contract.

**Interfaces:**
- Consumes: all preceding tasks.
- Produces: end-to-end editor/publish behavior and browser evidence for the approved design.

- [ ] **Step 1: Add publication-validation regression cases**

Assert that publication fails with a message identifying store, period, party range, round range, and missing metric when both metrics are off or one enabled metric has no applicable value. Assert that configured zero passes completeness and renders “禁止下单”.

- [ ] **Step 2: Wire validation into save, next-scene, and publish actions**

Use the same `validateDishSetMeasures` result at all three boundaries. The error message must identify the exact scene and say either “至少启用一种计量方式” or “已启用的按份/按种限制至少配置一个上限”.

- [ ] **Step 3: Implement browser acceptance automation**

The browser script must:

1. Open `buffet-rule-editor.html?mode=create`.
2. Choose a dish-set target and verify Step 1 has no global measure selector.
3. Enter a quota scene and enable piece and kind.
4. Set per-person piece 5, per-person kind 3, and table kind 8.
5. Confirm the product table still has one product-piece input per row.
6. Save, reopen, and verify all values round-trip.
7. Copy the scene and verify values are copied independently.
8. Open all-scene summary and filter “按份＋按种”.
9. Resize to `1024 × 768` and assert the single-scene table `scrollWidth <= clientWidth`.
10. Capture one screenshot for review and exit with a nonzero status on any failed assertion.

- [ ] **Step 4: Run focused and full buffet verification suites**

Run:

```bash
node scripts/verify-buffet-dual-measure-policy.mjs
node scripts/verify-buffet-dual-measure-editor.mjs
node scripts/verify-buffet-dual-measure-runtime.mjs
node scripts/verify-buffet-dual-measure-lifecycle.mjs
node scripts/verify-buffet-dual-measure-browser.mjs
Get-ChildItem scripts/verify-buffet-*.mjs | ForEach-Object { node $_.FullName; if ($LASTEXITCODE -ne 0) { throw "verification failed: $($_.Name)" } }
```

Expected: every command exits 0.

- [ ] **Step 5: Perform manual browser review**

Verify piece-only, kind-only, dual, order-level, party-size, per-round, round-range, C2/C3/C5/C6, cross-store, batch rollback, legacy migration notice, old-client gate, simultaneous violations, and authorization isolation. Force-refresh the page before review so the iframe/page does not retain stale assets.

- [ ] **Step 6: Reconcile documentation with verified behavior**

Compare the implemented field names, error codes, capability name, stable keys, and QA outcomes against both design documents. If behavior differs, fix code to match the approved spec; change documentation only when the approved requirement itself has been explicitly revised.

- [ ] **Step 7: Commit final validation and documentation evidence**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-dual-measure-browser.mjs docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md
git commit -m "test: verify buffet dual measure workflow"
```

---

## Final Acceptance Checklist

- [ ] Rule type step contains no global dish-set measure selector.
- [ ] Each quota scene independently supports piece-only, kind-only, or both.
- [ ] Equality is allowed and any exceeded applicable constraint rejects the full operation.
- [ ] One product-piece protection model remains visible and executable.
- [ ] v1 order, party-size, C2/C3/C5/C6, and multi-period rules migrate without value or range-key loss.
- [ ] Reopening and saving v2 data is idempotent.
- [ ] Batch operations are atomic and distinguish scene selection from product selection.
- [ ] Default-rule identity and common-template state follow the approved separate rules.
- [ ] Violations and authorizations use the exact metric, scene, target, rule ID, and version.
- [ ] Old clients cannot mutate v2 rules.
- [ ] All-scene summaries expose both measure columns and the four measure filters.
- [ ] Single-scene tables have no horizontal scrollbar at `1024 × 768`.
- [ ] All focused and existing buffet verification scripts pass.
