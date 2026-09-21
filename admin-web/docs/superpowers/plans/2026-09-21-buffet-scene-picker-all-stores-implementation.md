# Buffet Scene Picker All Stores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the current-scene product picker browse every valid store and atomically add selected new stores to the rule without removing stores when scene products are cleared.

**Architecture:** Separate read-only picker initialization from draft mutation. Build per-store temporary picker states from either existing scene projections or empty state, validate every dirty store, then apply a single change set that creates new store configs, extends the base product pool, writes current-scene targets, and normalizes deployment selection.

**Tech Stack:** Vanilla JavaScript, existing BrandMenuStructurePicker, Node.js assertion scripts, local browser verification.

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-scene-picker-all-stores-design.md`

## Global Constraints

- The picker lists every valid entry in `stores`; nonparticipating options display `（未参与）`.
- Browsing, searching, switching stores, canceling, or closing must not mutate the draft.
- A new store joins only with at least one dish/category or at least two dish-set members.
- An existing participating store may clear the current scene.
- Scene deletion never shrinks the base `targetIds` / `structureByLine` pool and never removes a participating store.
- Save is atomic across all dirty stores.
- Deployment normalization is `addedStoreIds - deployExcludedStoreIds`; existing exclusions remain intact.
- Do not stage the unrelated seasoning file.

---

### Task 1: Make picker initialization read-only for all stores

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:6230-6518`
- Modify: `scripts/verify-buffet-scene-unified-picker.mjs`

**Interfaces:**
- Consumes: draft, scene combo, store id, and existing `storeConfigs`.
- Produces: `scenePickerStoreState(draft, combo, storeId)` with `wasParticipating`, `initialEntries`, `byLine`, and no draft writes.

- [ ] **Step 1: Add failing tests**

Assert:
```js
assert.equal(source.includes('addedStoreIds(draft).map(function (storeId)'), false);
assert.match(source, /stores\.map\(function \(item\)/);
assert.match(source, /（未参与）/);
assert.doesNotMatch(extractedInitializer, /storeConfigFor\([^)]*,\s*true\)/);
assert.doesNotMatch(extractedInitializer, /editableSceneTargets/);
```

Add a frozen draft fixture for a nonparticipating store and assert initialization leaves its JSON unchanged.

- [ ] **Step 2: Run and verify failure**

Run: `node scripts/verify-buffet-scene-unified-picker.mjs`

Expected: FAIL because the current initializer calls `editableSceneTargets`, which creates store/scene data.

- [ ] **Step 3: Implement read-only state construction**

Create a helper that reads an existing config with `storeConfigFor(draft, storeId, false)`. For existing stores, resolve the current scene from a cloned config; for missing stores, initialize an empty selection. Never call a create=true helper during rendering or store switching.

Generate options from `stores`:

```js
var participating = addedStoreIds(draft);
var storeOptions = stores.map(function (item) {
  var suffix = participating.indexOf(item.id) >= 0 ? '' : '（未参与）';
  return option(item.id, item.name + suffix, sceneStoreId);
}).join('');
```

- [ ] **Step 4: Run picker tests**

```powershell
node scripts/verify-buffet-scene-unified-picker.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-scene-unified-picker.mjs
git commit -m "refactor: make buffet scene picker read only"
```

### Task 2: Build and atomically apply cross-store changes

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:6549-6580`
- Create: `scripts/verify-buffet-scene-picker-all-stores.mjs`
- Modify: `scripts/verify-buffet-cross-store-scene-mutations.mjs`

**Interfaces:**
- Consumes: dirty picker states and current scene combo.
- Produces: `buildScenePickerChanges(draft, pickerState, combo)` validation result and `applyScenePickerChanges(draft, changes, combo)`.

- [ ] **Step 1: Write failing atomic-change tests**

Cover:
```js
assert.equal(validate(newDishStore([])).valid, false);
assert.equal(validate(newDishStore([dish])).valid, true);
assert.equal(validate(newDishSetStore([dish])).valid, false);
assert.equal(validate(newDishSetStore([dishA, dishB])).valid, true);
assert.equal(validate(existingStore([])).valid, true);
assert.deepEqual(failedDraft, beforeDraft);
```

Also assert two valid dirty stores are applied together.

- [ ] **Step 2: Run and verify failure**

Run: `node scripts/verify-buffet-scene-picker-all-stores.mjs`

Expected: FAIL because validation and mutation are currently interleaved.

- [ ] **Step 3: Implement a two-phase save**

First build cloned change records and validate all stores. Only after success:

1. Clone/create each destination config.
2. For a new store, merge selected targets into base `structureByLine`, run `syncStoreTargetsFromStructure`, and append the store id to `participatingStoreIds`.
3. Write the selection to the current scene's `scenarioTargets`.
4. Remove only the current scene's deleted quota keys.
5. Assign prepared configs to the draft.
6. Sort/deduplicate `participatingStoreIds` using global store order.
7. Call `normalizeDeploymentSelection(draft, { needed:false, hadDeployField:true })`.

Do not mutate the live draft before every change validates.

- [ ] **Step 4: Run mutation tests**

```powershell
node scripts/verify-buffet-scene-picker-all-stores.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-scene-unified-picker.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-scene-picker-all-stores.mjs scripts/verify-buffet-cross-store-scene-mutations.mjs
git commit -m "feat: add stores from buffet scene picker"
```

### Task 3: Preserve store identity when scene products are removed

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:6580-6605`
- Modify: `scripts/verify-buffet-product-removal.mjs`
- Modify: `scripts/verify-buffet-scene-picker-all-stores.mjs`

**Interfaces:**
- Consumes: existing scene removal actions.
- Produces: scene-only deletion that leaves base pool, participation, deployment, and exclusions unchanged.

- [ ] **Step 1: Add failing lifecycle assertions**

Use a participating store with one scene target and assert after clearing:
```js
assert.deepEqual(config.scenarioTargets[currentScene], []);
assert.deepEqual(config.targetIds, originalTargetIds);
assert.ok(draft.participatingStoreIds.includes(storeId));
assert.deepEqual(draft.deployExcludedStoreIds, originalExclusions);
```

- [ ] **Step 2: Run and verify failure or current coverage gap**

```powershell
node scripts/verify-buffet-product-removal.mjs
node scripts/verify-buffet-scene-picker-all-stores.mjs
```

Expected: the new store-retention assertion initially fails or is uncovered.

- [ ] **Step 3: Restrict removal to scene projection**

Ensure picker deselection, row removal, and bulk removal update only `scenarioTargets`, current-scene quota maps, and dish-set exceptions. They must not call base target pruning or deployment normalization.

- [ ] **Step 4: Run lifecycle tests**

```powershell
node scripts/verify-buffet-product-removal.mjs
node scripts/verify-buffet-scene-picker-all-stores.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-all-scene-summary-model.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-product-removal.mjs scripts/verify-buffet-scene-picker-all-stores.mjs
git commit -m "fix: retain buffet stores after scene clearing"
```

### Task 4: Update authority docs and perform browser acceptance

**Files:**
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

**Interfaces:**
- Consumes: final behavior from Tasks 1–3.
- Produces: authoritative behavior and end-to-end acceptance evidence.

- [ ] **Step 1: Update the authority document**

Add the all-store picker rules, auto-participation, base-pool retention, atomic-save behavior, deployment exclusion handling, and acceptance cases.

- [ ] **Step 2: Run focused regression**

```powershell
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-buffet-scene-unified-picker.mjs
node scripts/verify-buffet-scene-picker-all-stores.mjs
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-product-removal.mjs
node scripts/verify-buffet-cross-store-scene-rows.mjs
node scripts/verify-buffet-all-scene-summary-model.mjs
```

Expected: PASS.

- [ ] **Step 3: Browser acceptance**

At the local draft route:

1. Open “添加当前场景商品” and verify all stores appear, with unparticipating labels.
2. Switch to a new store and close; verify no store was added.
3. Reopen, select a product in the new store, save, and verify the cross-store table immediately shows it as unconfigured.
4. Save/reload and verify the store and current-scene product persist.
5. Clear that scene selection and verify the store remains in store management while the scene row disappears.
6. Verify a previously excluded store remains excluded.
7. Verify category and dish-set modes use the same all-store behavior.

- [ ] **Step 4: Inspect and commit**

```powershell
git diff --check
git status --short
git add -- "dist/Configuration center/assets/order-limit-flow.js" docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md scripts/verify-buffet-scene-unified-picker.mjs scripts/verify-buffet-scene-picker-all-stores.mjs scripts/verify-buffet-cross-store-scene-mutations.mjs scripts/verify-buffet-product-removal.mjs
git commit -m "docs: record all-store buffet scene picker"
```
