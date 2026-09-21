# Buffet Fixed-Period Scene Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make order-lifetime, per-round, order-lifetime plus per-round, and order-lifetime plus multi-round buffet rules use the same scene-card-to-quota-workbench flow as party-size and round scenarios.

**Architecture:** Add one canonical `allQuantityScenarios(draft)` navigation sequence above the existing period-specific scenario helpers. Render every enabled period as cards, and make dialog position, next-scene navigation, snapshots, validation, and focus restoration consume the same descriptor. Keep persisted quota keys and runtime calculations unchanged by continuing to call the existing canonical key helpers.

**Tech Stack:** Vanilla JavaScript, HTML/CSS strings, Node.js verification scripts, Vite local browser preview.

**Spec:** `docs/superpowers/specs/2026-09-20-buffet-fixed-period-scene-entry-design.md`

## Global Constraints

- Do not change quota calculation, conflict detection, publication structures, or field semantics.
- Do not create a new persisted scene key or migrate historical quota data.
- Empty input means unconfigured; numeric `0` means configured and forbidden.
- All participating stores in the current scene save or restore atomically.
- Product, category, dish-set, batch, filter, add, remove, and cross-store behavior must remain available inside the quota workbench.
- Do not modify `vendor/emenu-new`; the eMenu embed build requirement is therefore not triggered.

---

### Task 1: Add executable scene-sequence acceptance checks

**Files:**
- Create: `scripts/verify-buffet-fixed-period-scene-entry.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `dist/Configuration center/assets/order-limit-flow.js` as source text.
- Produces: `npm run verify:buffet-fixed-period-scene-entry`, which fails unless fixed periods render as cards and use one global scenario sequence.

- [ ] **Step 1: Write the failing verification script**

Create a Node script using `readFileSync`, `assert.match`, and `assert.doesNotMatch`. Extract functions with a balanced-brace helper, following `scripts/verify-buffet-period-scenario-editor.mjs`. Assert all of the following:

```js
assert.match(source, /function allQuantityScenarios\(draft\)/);
assert.match(source, /BUFFET_PERIOD_ORDER/);
assert.match(renderPeriodSection, /data-quantity-scene-open/);
assert.doesNotMatch(renderPeriodSection, /olf-inline-workbench/);
assert.match(renderDialog, /allQuantityScenarios\(draft\)/);
assert.match(renderDialog, /data-quantity-scene-next/);
assert.match(renderDialog, /position === scenarios\.length - 1 \? ['"] hidden['"] : ['"]/);
assert.match(clickHandler, /createQuantitySceneSession\(nextDraft, nextCombo\)/);
assert.match(closeDialog, /validateQuantitySceneForAllStores/);
assert.match(closeDialog, /restoreQuantitySceneSnapshots/);
```

Also assert the source still uses `v4ScenarioKey`, `comboScenarioKeyFor`, `v4TargetCellKey`, and `buffetSceneIdentity`, and does not introduce assignments that persist `buffetSceneIdentity` into `periodValues`.

- [ ] **Step 2: Register the command**

Add this exact package script:

```json
"verify:buffet-fixed-period-scene-entry": "node scripts/verify-buffet-fixed-period-scene-entry.mjs"
```

- [ ] **Step 3: Run the new verification and confirm it fails**

Run:

```bash
npm run verify:buffet-fixed-period-scene-entry
```

Expected: FAIL because `allQuantityScenarios`, atomic session helpers, and fixed-period card rendering do not yet exist.

- [ ] **Step 4: Commit the failing acceptance contract**

```bash
git add package.json scripts/verify-buffet-fixed-period-scene-entry.mjs
git commit -m "test: define unified buffet period scene entry"
```

### Task 2: Unify fixed and ranged periods behind one card sequence

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4049-4110`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4607-4650`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:6389-6475`
- Test: `scripts/verify-buffet-fixed-period-scene-entry.mjs`

**Interfaces:**
- Consumes: `BUFFET_PERIOD_ORDER`, `quantityScenarioIndexes(draft, period)`, `buffetSceneIdentity(draft, combo)`, and the draft's enabled periods.
- Produces: `allQuantityScenarios(draft): Array<{period:string,partyIndex:number,roundIndex:number,uiKey:string}>` and `quantityScenarioPosition(draft, combo): number`.

- [ ] **Step 1: Add the canonical flat sequence**

Implement helpers near `quantityScenarioIndexes`:

```js
function allQuantityScenarios(draft) {
  return (draft.enabledPeriods || []).slice().sort(function (a, b) {
    return BUFFET_PERIOD_ORDER.indexOf(a) - BUFFET_PERIOD_ORDER.indexOf(b);
  }).reduce(function (items, period) {
    return items.concat(quantityScenarioIndexes(draft, period).map(function (combo) {
      var scenario = { period: period, partyIndex: combo.partyIndex, roundIndex: combo.roundIndex };
      scenario.uiKey = buffetSceneIdentity(draft, scenario);
      return scenario;
    }));
  }, []);
}

function quantityScenarioPosition(draft, combo) {
  var key = buffetSceneIdentity(draft, combo);
  return allQuantityScenarios(draft).findIndex(function (item) { return item.uiKey === key; });
}
```

Do not derive persisted values from `uiKey`.

- [ ] **Step 2: Render cards for every enabled period**

Refactor `renderV4PeriodSection(draft, config, period)` so `order_lifetime`, `per_round`, and `multi_round` all use `.olf-scene-card` buttons. Preserve the current party grouping when `draft.subject === "party_size"`. Use these fixed-period titles:

```js
var title = period === "order_lifetime"
  ? "整单限购"
  : period === "per_round"
    ? "每轮限购"
    : formatRange(draft.roundRanges[combo.roundIndex], "轮");
```

For party-size drafts, keep the visible party-range group heading. Continue deriving configured state from target status, total bounds, table bounds, and dish-set cells so numeric zero remains configured.

- [ ] **Step 3: Use the global sequence in the dialog header**

In `renderQuantitySceneDialog`, replace the period-local `quantityScenarioIndexes` position with `allQuantityScenarios(draft)`. Render `场景 n / total` from this sequence. Omit the next button's `hidden` attribute only when a following global scene exists; otherwise render ` hidden` rather than a disabled placeholder.

- [ ] **Step 4: Use the global sequence for next-scene navigation**

In `handleEditorClick`, find the current scene with `quantityScenarioPosition(nextDraft, currentScene.combo)`, obtain `allQuantityScenarios(nextDraft)[position + 1]`, and open that exact descriptor after the current scene saves successfully. This must move `整单限购 → 每轮限购` and `整单限购 → 第一个轮次区间` across period boundaries.

- [ ] **Step 5: Run the focused verification**

Run:

```bash
npm run verify:buffet-fixed-period-scene-entry
```

Expected: the card, sequence, position, title, and next-button assertions pass; atomic-session assertions may still fail until Task 3.

- [ ] **Step 6: Commit the unified card sequence**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js"
git commit -m "feat: unify buffet period scene cards"
```

### Task 3: Make scene snapshots, validation, and navigation atomic across stores

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4642-4690`
- Modify: `dist/Configuration center/assets/order-limit-flow.js:6389-6475`
- Modify: `scripts/verify-buffet-fixed-period-scene-entry.mjs`
- Test: `scripts/verify-buffet-cross-store-scene-mutations.mjs`
- Test: `scripts/verify-buffet-cross-store-scene-ui.mjs`

**Interfaces:**
- Consumes: `addedStoreIds(draft)`, `storeConfigFor`, `cloneValue`, existing input validators, and a global scene descriptor.
- Produces: `createQuantitySceneSession(draft, combo)`, `restoreQuantitySceneSnapshots(draft, session)`, and `validateQuantitySceneForAllStores(draft, session)`.

- [ ] **Step 1: Centralize session creation**

Implement one constructor and use it both for card opening and next-scene opening:

```js
function createQuantitySceneSession(draft, combo) {
  var snapshotsByStoreId = {};
  addedStoreIds(draft).forEach(function (storeId) {
    snapshotsByStoreId[storeId] = cloneValue(storeConfigFor(draft, storeId, true));
  });
  return {
    storeId: draft.activeStoreId,
    snapshotsByStoreId: snapshotsByStoreId,
    combo: { period: combo.period, partyIndex: combo.partyIndex, roundIndex: combo.roundIndex },
    batchOpen: false
  };
}
```

Remove the next-scene path's single-store `snapshot` property. Every opened scene must have `snapshotsByStoreId`.

- [ ] **Step 2: Centralize all-store restoration**

Implement `restoreQuantitySceneSnapshots(draft, session)` to replace every captured `draft.storeConfigs[storeId]` with a clone of its snapshot. Call it only after the user confirms discarding a dirty scene. Keep the existing current-scene-only delete semantics because the snapshots are per session.

- [ ] **Step 3: Add normalized dirty detection and discard confirmation**

Add `quantitySceneIsDirty(draft, session)` by comparing stable serialized projections of the captured stores against current stores. The projection must include scene targets, total bounds, target limits, table caps, default dish limits, and exception rows for `session.combo`; ignore transient filter, page, selection, and scroll state.

On close button or Escape:

- close immediately when the projection is unchanged;
- otherwise render a confirmation dialog with `继续编辑` and `放弃修改`;
- restore all captured stores only after `放弃修改`;
- return focus to the originating scene card after close.

- [ ] **Step 4: Validate every participating store before saving**

Implement `validateQuantitySceneForAllStores(draft, session)` returning either `{ valid: true }` or `{ valid: false, storeId, field, message }`. For each participating store in the current scene, validate target count, integer range, and minimum/maximum relationships. Prefix the toast with the store name, switch the workbench store filter to the invalid store when needed, and focus the first invalid field. Do not validate other scenes.

- [ ] **Step 5: Preserve the session when save fails**

Make `closeQuantitySceneDialog(false)` return `false` without clearing the session, saving the draft, or changing the snapshot when validation fails. Return `true` only after the current scene has saved successfully. In next-scene handling, create the next session only when this call returns `true`.

- [ ] **Step 6: Strengthen the verification script**

Add assertions that both open paths call `createQuantitySceneSession`, discard calls `restoreQuantitySceneSnapshots`, save calls the all-store validator before `saveEditorDraft`, and a failed result returns before clearing `editorState.quantitySceneDialog`.

- [ ] **Step 7: Run focused and cross-store regressions**

Run:

```bash
npm run verify:buffet-fixed-period-scene-entry
node scripts/verify-buffet-cross-store-scene-mutations.mjs
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-period-quantity-editor.mjs
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit atomic scene sessions**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-fixed-period-scene-entry.mjs
git commit -m "fix: preserve buffet scene edits across stores"
```

### Task 4: Run full regression and browser acceptance

**Files:**
- Modify only if an acceptance defect is found: `dist/Configuration center/assets/order-limit-flow.js`
- Test: existing `scripts/verify-buffet-*.mjs` scripts listed below

**Interfaces:**
- Consumes: the completed scene sequence and session helpers.
- Produces: verified browser behavior at `#/operations/queue-call/buffet-rules` without changing unrelated generated assets.

- [ ] **Step 1: Run the buffet regression commands**

Run:

```bash
npm run verify:buffet-fixed-period-scene-entry
npm run verify:buffet-period-selection
npm run verify:buffet-product-table
npm run verify:buffet-quantity-workbench
npm run verify:buffet-quantity-workbench-layout
node scripts/verify-buffet-scene-cards.mjs
node scripts/verify-buffet-scene-workbench.mjs
node scripts/verify-buffet-combo-template-editor.mjs
node scripts/verify-buffet-order-capability-acceptance.mjs
```

Expected: every command exits 0.

- [ ] **Step 2: Start the isolated worktree preview**

If `node_modules` is absent, create a junction to the existing workspace dependency directory without reinstalling packages. Start Vite on an unused loopback port:

```bash
npm run dev -- --host 127.0.0.1 --port 5175
```

Open `http://127.0.0.1:5175/#/operations/queue-call/buffet-rules`.

- [ ] **Step 3: Verify the four fixed-period mappings**

Create or edit rules for each mapping and confirm:

- order lifetime: one `整单限购` card;
- per round: one `每轮限购` card;
- order lifetime plus per round: two cards, positions `1/2` and `2/2`;
- order lifetime plus multi round with two round ranges: three cards in order, positions `1/3`, `2/3`, `3/3`.

Confirm no inline product table remains on the rule page.

- [ ] **Step 4: Verify object and store regressions**

For product, category, and dish-set targets, verify the workbench retains store, line, category, status filters, add/remove, header select-all, and multi-field batch settings. With two participating stores, set different values in the same scene and confirm both remain after save and reopen.

- [ ] **Step 5: Verify save, next, discard, and validation states**

Confirm:

- save and return updates the originating card summary and focus;
- save and next crosses from order lifetime to per round or first round range;
- the final scene has no next button;
- numeric zero marks the card configured;
- closing a dirty scene asks for confirmation and discarding restores both stores;
- an invalid non-active store blocks save, identifies the store, and retains filters, page, scroll, and inputs;
- saving one scene, entering the next, and discarding does not roll back the saved scene.

- [ ] **Step 6: Review the final diff and commit any acceptance fix**

Run:

```bash
git diff --check
git status --short
git diff -- "dist/Configuration center/assets/order-limit-flow.js" package.json scripts/verify-buffet-fixed-period-scene-entry.mjs
```

If browser acceptance required a code correction, commit only the scoped files:

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" package.json scripts/verify-buffet-fixed-period-scene-entry.mjs
git commit -m "fix: complete buffet period scene acceptance"
```

Do not stage unrelated build output or workspace files.
