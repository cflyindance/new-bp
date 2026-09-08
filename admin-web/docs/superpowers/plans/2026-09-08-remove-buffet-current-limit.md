# Remove Buffet Current Limit Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the read-only “当前规则／当前限制” block from the buffet quantity step without changing rule data or behavior.

**Architecture:** Keep the existing buffet draft model, event handlers, validation, and persistence unchanged. Remove only the context renderer invocation and its now-unused presentation code, with a focused source-level regression assertion.

**Tech Stack:** Vanilla JavaScript, CSS, Node.js assertion scripts

**Spec:** `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

## Global Constraints

- Only the buffet quantity-step presentation changes.
- Do not modify limit data, template linkage, validation, persistence, or menu order-limit behavior.
- The quantity workbench must move up naturally without an empty placeholder.

---

### Task 1: Remove the Current Limit Presentation

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Modify: `scripts/verify-buffet-quantity-workbench-layout.mjs`

**Interfaces:**
- Consumes: `renderBuffetQuantityStep(draft)` and the existing section renderers.
- Produces: A quantity step beginning with `renderBuffetLimitContent(draft)` and no `.olf-quantity-context` markup.

- [x] **Step 1: Write the failing regression assertion**

Add assertions that the quantity-step source does not invoke `renderBuffetRuleContext(draft)`, the flow source does not contain `<h3>当前规则</h3>`, and the stylesheet does not contain `.olf-quantity-context`.

- [x] **Step 2: Run the focused test and verify RED**

Run: `node scripts/verify-buffet-quantity-workbench-layout.mjs`

Expected: FAIL because the current-limit renderer is still invoked.

- [x] **Step 3: Apply the minimal presentation removal**

Delete `renderBuffetRuleContext`, remove its call from `renderBuffetQuantityStep`, and remove the three `.olf-quantity-context` CSS rules. Keep all remaining renderers in their existing order.

- [x] **Step 4: Run focused and build verification**

Run: `node scripts/verify-buffet-quantity-workbench-layout.mjs`

Expected: PASS.

Run: `npm.cmd run build`

Expected: successful exit.

- [ ] **Step 5: Commit the isolated change**

```bash
git add "admin-web/dist/Configuration center/assets/order-limit-flow.js" "admin-web/dist/Configuration center/assets/order-limit-flow.css" "admin-web/scripts/verify-buffet-quantity-workbench-layout.mjs" "admin-web/docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md" "admin-web/docs/superpowers/plans/2026-09-08-remove-buffet-current-limit.md"
git commit -m "fix: remove buffet current limit summary"
```
