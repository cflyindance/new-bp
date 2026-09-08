# Buffet Quantity Store Context Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the permanently expanded cross-store copy controls in the buffet quantity step with the approved compact store-context bar and an on-demand copy panel.

**Architecture:** Keep the existing draft and copy-preview data paths unchanged. Add one transient UI flag to the existing buffet workbench state, render the copy trigger and panel from `order-limit-flow.js`, and update the scoped stylesheet so the table follows the context bar without dead space.

**Tech Stack:** Vanilla JavaScript HTML renderers, CSS, Node.js assertion scripts.

**Spec:** `docs/superpowers/specs/2026-09-08-buffet-product-table-optimization-design.md`

## Global Constraints

- Do not add persistence fields or change buffet quantity calculation semantics.
- Keep quantity data independent per store, party range, round range, and enabled period.
- Cross-store copy defaults to filling unconfigured values; overwrite remains explicit and unchecked.
- Switching the active configuration store clears unexecuted copy targets and closes the copy panel.
- Do not modify the menu order-limit module.

---

### Task 1: Add failing layout and interaction assertions

**Files:**
- Modify: `scripts/verify-buffet-cross-store-copy-preview.mjs`
- Modify: `scripts/verify-buffet-period-quantity-editor.mjs`

**Interfaces:**
- Consumes: `renderBuffetV4QuantityEditor(draft, configuredStores)` test export.
- Produces: assertions for `data-buffet-store-copy-toggle`, `data-buffet-store-copy-panel`, collapsed initial state, disabled empty-target action, and store-switch cleanup.

- [ ] **Step 1: Write the failing renderer assertions**

```js
assert.match(rendered, /data-buffet-store-copy-toggle/);
assert.doesNotMatch(rendered, /data-buffet-store-copy-panel/);
assert.match(flow, /copyPanelOpen/);
assert.match(flow, /data-buffet-store-copy[^>]*disabled/);
assert.match(flow, /workbenchState\.copyPanelOpen = false/);
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm run verify:buffet-cross-store-copy-preview && node scripts/verify-buffet-period-quantity-editor.mjs`

Expected: FAIL because the current renderer always outputs the copy controls and has no toggle or transient open state.

- [ ] **Step 3: Commit the failing test boundary**

```bash
git add scripts/verify-buffet-cross-store-copy-preview.mjs scripts/verify-buffet-period-quantity-editor.mjs
git commit -m "test: define buffet store copy layout behavior"
```

### Task 2: Implement the compact context bar and expandable copy panel

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:4375-4400,5763-5795,6369-6378`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:242-251`

**Interfaces:**
- Consumes: existing `normalizeBuffetQuantityWorkbenchState`, `previewBuffetStoreCopy`, and `applyBuffetStoreCopyPreview` behavior.
- Produces: `renderV4StoreCopy(draft, configuredStores, workbenchState)`, `data-buffet-store-copy-toggle`, and `workbenchState.copyPanelOpen: boolean`.

- [ ] **Step 1: Add transient open state and semantic render structure**

```js
function renderV4StoreCopy(draft, configuredStores, workbenchState) {
  if (configuredStores.length < 2) return "";
  var targets = configuredStores.filter(function (storeId) { return storeId !== draft.activeStoreId; });
  var trigger = '<button type="button" class="olf-button olf-button--small" data-buffet-store-copy-toggle>复制到其他门店</button>';
  if (!workbenchState.copyPanelOpen) return trigger;
  return trigger + '<div class="olf-v4-store-copy" data-buffet-store-copy-panel><label class="olf-field"><span class="olf-label">目标门店</span><select class="olf-select" data-buffet-store-copy-target multiple></select></label><label class="olf-v4-copy-overwrite"><input type="checkbox" data-buffet-store-copy-overwrite>覆盖目标门店已有配置</label><button type="button" class="olf-button olf-button--primary olf-button--small" data-buffet-store-copy disabled>预览并复制</button><small>默认只填充目标门店的未配置项，执行前展示差异预览。</small></div>';
}
```

The panel contains the existing target multi-select, unchecked overwrite checkbox, copy-preview button, and the copy guidance from the approved spec. The action button renders disabled while no target is selected.

- [ ] **Step 2: Add toggle and selection event handling**

```js
if (button.hasAttribute("data-buffet-store-copy-toggle")) {
  var state = normalizeBuffetQuantityWorkbenchState(editorState.rule.editorDraft);
  state.copyPanelOpen = !state.copyPanelOpen;
  renderEditor();
  return;
}
```

On target selection, render again so the action enablement reflects the current selection. Before rerendering, save selected target IDs in transient workbench state. After copy success, cancel, or current-store change, set `copyPanelOpen = false` and clear `copyTargetStoreIds`.

- [ ] **Step 3: Replace the toolbar CSS with a two-level layout**

```css
.olf-v4-quantity-toolbar { display:grid; grid-template-columns:minmax(210px,auto) 1fr auto; align-items:end; gap:18px; }
.olf-v4-store-copy { grid-column:1 / -1; display:grid; grid-template-columns:minmax(260px,1fr) auto auto; align-items:end; gap:12px; }
@media (max-width:900px) {
  .olf-v4-quantity-toolbar, .olf-v4-store-copy { grid-template-columns:1fr; }
}
```

Remove the multiple-select fixed height and right-aligned full-width note that produced the dead space. Keep all selectors under the existing `.olf-v4-*` namespace.

- [ ] **Step 4: Run focused tests**

Run: `npm run verify:buffet-cross-store-copy-preview && node scripts/verify-buffet-period-quantity-editor.mjs && npm run verify:buffet-product-table`

Expected: PASS.

- [ ] **Step 5: Commit the implementation**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css"
git commit -m "feat: streamline buffet store quantity workspace"
```

### Task 3: Verify regression and browser behavior

**Files:**
- Verify only: `dist/Configuration center/buffet-rule-editor.html`

**Interfaces:**
- Consumes: completed renderer, transient state, and styling.
- Produces: evidence that the approved layout works without altering quantity semantics.

- [ ] **Step 1: Run the buffet verification suite**

Run: `npm run verify:buffet-quantity-workbench-layout && npm run verify:buffet-product-table && npm run verify:buffet-cross-store-copy-preview && npm run verify:buffet-period-selection`

Expected: all commands PASS.

- [ ] **Step 2: Start the worktree preview**

Run: `npm run dev -- --host 127.0.0.1 --port 65204`

Expected: Vite serves the worktree at `http://127.0.0.1:65204`.

- [ ] **Step 3: Verify the create flow in the browser**

Open: `http://127.0.0.1:65204/Configuration%20center/buffet-rule-editor.html?mode=create&embedded=1&draftId=1`

Verify: copy panel is initially hidden; toggle opens it; no target keeps copy disabled; target enables preview; switching current store closes and clears the panel; filters, bulk actions, quantity inputs, and pagination remain usable.

- [ ] **Step 4: Confirm repository scope**

Run: `git status --short`

Expected: only the pre-existing unrelated `scripts/verify-buffet-period-quantity-editor.mjs` worktree anomaly may remain; no unrelated files are staged.
