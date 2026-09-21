# Buffet Quota Labeled Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ambiguous stacked quota inputs with field-accurate labeled columns across single-store, cross-store, combo-template, category, and batch-setting flows.

**Architecture:** Introduce one field-aware quota-column descriptor derived from draft, combo, and target type. Reuse it to generate table headings, row cells, batch inputs, units, and status evaluation so `targetLimits` and `tableTargetCaps` cannot drift between render paths. Preserve persisted data and runtime calculations.

**Tech Stack:** Vanilla JavaScript, HTML string renderers, CSS, Node.js assertion scripts, local browser verification.

**Spec:** `docs/superpowers/specs/2026-09-21-buffet-quota-labeled-columns-design.md`

## Global Constraints

- C01–C03 read and write only `tableTargetCaps`; C04–C06 read and write only `targetLimits`.
- Ordinary party-size rules may expose both fields; order-subject rules expose only the applicable main field.
- Kind-based shared quotas use `种（SPU）`; member protection always uses `份`.
- A visible configured zero has status priority `禁止下单`; otherwise a visible positive value is `已配置`; all visible fields empty is `未配置`.
- Do not change persisted field shapes or runtime quantity calculations.
- The single-scene table must not scroll horizontally at `1024 × 768`; the all-scene summary remains horizontally scrollable.
- Do not stage or modify the unrelated `src/emenu-local/seasoning/generated/seasoning-browser-handler.ts` change.

---

### Task 1: Define the field-aware quota column contract

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4281-4301`
- Create: `scripts/verify-buffet-quota-column-contract.mjs`

**Interfaces:**
- Consumes: `draft.subject`, `draft.targetType`, `draft.measureUnit`, combo period, and existing fixed-combination identity.
- Produces: `buffetProductQuotaColumns(draft, combo)` returning ordered descriptors `{ key, map, label, unit }`.

- [ ] **Step 1: Write the failing descriptor test**

Extract the helper with `vm` and assert:

```js
assert.deepEqual(columns(c01), [{ key: 'tableCap', map: 'tableTargetCaps', label: '整桌每轮最多', unit: '份' }]);
assert.deepEqual(columns(c04), [{ key: 'limit', map: 'targetLimits', label: '每人每轮最多', unit: '份' }]);
assert.deepEqual(columns(partyOrder), [
  { key: 'limit', map: 'targetLimits', label: '每人每单最多', unit: '份' },
  { key: 'tableCap', map: 'tableTargetCaps', label: '整桌整单最多', unit: '份' }
]);
assert.equal(columns(c03)[0].unit, '种（SPU）');
assert.equal(columns(c06)[0].unit, '种（SPU）');
assert.deepEqual(columns(tableRound).map(({ label }) => label), ['每轮最多']);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node scripts/verify-buffet-quota-column-contract.mjs`

Expected: FAIL because the shared descriptor does not exist.

- [ ] **Step 3: Implement the descriptor**

Use existing combination metadata, not display text:

```js
if (isFixedTableTargetCombo(draft)) return [quota('tableCap', 'tableTargetCaps', tableLabel, unit)];
if (isPerPersonTargetCombo(draft)) return [quota('limit', 'targetLimits', personLabel, unit)];
if (draft.subject === 'party_size') return [
  quota('limit', 'targetLimits', personLabel, unit),
  quota('tableCap', 'tableTargetCaps', tableLabel, unit)
];
return [quota('limit', 'targetLimits', tableLabelWithoutSubject, unit)];
```

Make `buffetProductTableColumns` append these descriptors.

- [ ] **Step 4: Run focused tests**

```powershell
node scripts/verify-buffet-quota-column-contract.mjs
node scripts/verify-buffet-quantity-target-presenters.mjs
node scripts/verify-buffet-combo-template-list-ui.mjs
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-quota-column-contract.mjs
git commit -m "refactor: unify buffet quota column mapping"
```

### Task 2: Render one cell per visible quota column

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4354-4540`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:1016-1030,1097-1111`
- Create: `scripts/verify-buffet-quota-table-columns.mjs`

**Interfaces:**
- Consumes: `buffetProductQuotaColumns(draft, combo)`.
- Produces: one `<td>` per visible descriptor in ordinary and cross-store tables.

- [ ] **Step 1: Write failing HTML structure tests**

```js
assert.match(partyHtml, /<th[^>]*>每人每轮最多<\/th>/);
assert.match(partyHtml, /<th[^>]*>整桌每轮最多<\/th>/);
assert.equal((partyRow.match(/data-v4-map="targetLimits"/g) || []).length, 1);
assert.equal((partyRow.match(/data-v4-map="tableTargetCaps"/g) || []).length, 1);
assert.doesNotMatch(c01Html, /data-v4-map="targetLimits"/);
assert.doesNotMatch(c04Html, /data-v4-map="tableTargetCaps"/);
assert.doesNotMatch(crossStoreHtml, /<th>限购数量<\/th>/);
```

Cover dish and category targets, per-round and multi-round, and one-store and multi-store rows.

- [ ] **Step 2: Run and verify failure**

Run: `node scripts/verify-buffet-quota-table-columns.mjs`

Expected: FAIL because cross-store markup combines both controls.

- [ ] **Step 3: Implement shared row-cell rendering**

Render each descriptor in its own cell, bind `data-v4-map` from the descriptor, and pass its unit to `buffetTableLimitCell`. Replace cross-store `limitHtml += ...` with ordered cells matching ordered headings. Preserve identity and action columns.

- [ ] **Step 4: Preserve responsive layout**

Keep the scene table at `width:100%; min-width:0; table-layout:fixed`. Add quota-cell classes that allow inputs to shrink. Remove obsolete stacked-control spacing only inside the scene workbench. Do not change `.olf-buffet-summary-table { min-width:1200px; }`.

- [ ] **Step 5: Run table tests**

```powershell
node scripts/verify-buffet-quota-table-columns.mjs
node scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs
node scripts/verify-buffet-cross-store-scene-ui.mjs
node scripts/verify-buffet-quantity-workbench-layout.mjs
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-quota-table-columns.mjs
git commit -m "fix: label buffet quota table columns"
```

### Task 3: Align batch fields and status with visible columns

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:1419-1430,4669-4673,6765-6820`
- Modify: `scripts/verify-buffet-scene-workbench.mjs`
- Modify: `scripts/verify-buffet-multi-field-bulk.mjs`
- Create: `scripts/verify-buffet-quota-status.mjs`

**Interfaces:**
- Consumes: the shared quota descriptors.
- Produces: batch controls carrying `data-buffet-workbench-bulk-map`, field-accurate writes, and status derived from visible fields.

- [ ] **Step 1: Write failing assertions**

```js
assert.match(c01Batch, /整桌每轮最多/);
assert.doesNotMatch(c01Batch, /data-buffet-workbench-bulk-map="targetLimits"/);
assert.match(c04Batch, /data-buffet-workbench-bulk-map="targetLimits"/);
assert.doesNotMatch(c04Batch, /data-buffet-workbench-bulk-map="tableTargetCaps"/);
assert.equal(status({ targetLimits: 2, tableTargetCaps: 0 }), 'forbidden');
assert.equal(status({ targetLimits: 2, tableTargetCaps: 5 }), 'configured');
assert.equal(c01Status({ tableTargetCaps: 3 }), 'configured');
```

Also cover category batch updates, current-round isolation, and blank sibling retention.

- [ ] **Step 2: Run and verify failure**

```powershell
node scripts/verify-buffet-scene-workbench.mjs
node scripts/verify-buffet-multi-field-bulk.mjs
node scripts/verify-buffet-quota-status.mjs
```

Expected: the new mapping/status assertions FAIL.

- [ ] **Step 3: Generate batch controls from descriptors**

Emit one control per visible descriptor with its map encoded, then apply only nonblank controls:

```js
controls.forEach(function (input) {
  if (input.value === '') return;
  var map = input.getAttribute('data-buffet-workbench-bulk-map');
  rowValues[map][rowKey] = { configured: true, value: Number(input.value) };
});
```

Retain validation, selection requirements, store/scene lookup, and dish-set member handling.

- [ ] **Step 4: Derive status from visible descriptors**

Collect only descriptor-bound cells. Return `forbidden` if any configured visible value is zero; otherwise `configured` if any visible cell is configured; otherwise `unconfigured`. Preserve dish-set member status.

- [ ] **Step 5: Run regression tests**

```powershell
node scripts/verify-buffet-scene-workbench.mjs
node scripts/verify-buffet-multi-field-bulk.mjs
node scripts/verify-buffet-quota-status.mjs
node scripts/verify-buffet-quantity-workbench-state.mjs
node scripts/verify-buffet-v4-lifecycle.mjs
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-scene-workbench.mjs scripts/verify-buffet-multi-field-bulk.mjs scripts/verify-buffet-quota-status.mjs
git commit -m "fix: align buffet batch quota fields"
```

### Task 4: Update authority docs and run full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`
- Modify if selectors require it: `scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs`

**Interfaces:**
- Consumes: final behavior from Tasks 1–3.
- Produces: authoritative documentation and regression evidence.

- [ ] **Step 1: Update the authority document**

Document the C01–C06 field matrix, ordinary party-size labels, zero-status precedence, unit rules, and the single-scene versus all-scene scrolling distinction.

- [ ] **Step 2: Run the buffet verification suite**

```powershell
Get-ChildItem scripts/verify-buffet-*.mjs | ForEach-Object { node $_.FullName }
```

Expected: every script exits zero. Record any unrelated pre-existing failure exactly and independently verify all affected scripts.

- [ ] **Step 3: Inspect the worktree**

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: only planned files plus the pre-existing seasoning file; no whitespace errors.

- [ ] **Step 4: Browser-verify the direct editor route**

At `http://127.0.0.1:5177/Configuration%20center/buffet-rule-editor.html?draftId=19` with a `1024 × 768` viewport:

1. Verify each combination scene shows one correctly labeled control per applicable field.
2. Verify C01–C03 use fixed-table labels and C04–C06 use per-person labels.
3. Verify an ordinary party-size rule can show two separate columns.
4. Verify category and cross-store rows align with headings.
5. Batch-change only one field, save, reopen, and confirm its sibling is unchanged.
6. Enter `0` in one visible field and a positive sibling value; confirm “禁止下单”.
7. Verify multi-round edits remain isolated to the selected round.
8. Confirm the single-scene table has no horizontal scrollbar.
9. Confirm “查看全部配置” retains horizontal scrolling.

- [ ] **Step 5: Commit docs and final test adjustments**

```powershell
git add -- docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md scripts/verify-buffet-quota-table-no-horizontal-scroll.mjs
git commit -m "docs: record labeled buffet quota columns"
```

