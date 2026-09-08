# Buffet Product Filter Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved one-line buffet product filter toolbar with dynamic category and quantity-status filters.

**Architecture:** Extend the existing transient workbench state with `categoryId` and `status`, derive category and current-scenario configuration state from existing product and quantity data, then apply all filters before pagination. No persistence or calculation schema changes are required.

**Tech Stack:** Vanilla JavaScript renderers, CSS grid/flex layout, Node.js assertion scripts.

**Spec:** `docs/superpowers/specs/2026-09-08-buffet-product-table-optimization-design.md`

## Global Constraints

- Do not duplicate store, party, round, period, or target-type filters.
- Category is visible only for dish and dish-set member tables.
- Status values are mutually exclusive: positive configured, unconfigured, and zero/forbidden.
- Any filter change clears selection and returns to page 1.

---

### Task 1: Define filter behavior with tests

**Files:**
- Modify: `scripts/verify-buffet-product-table-shell.mjs`
- Modify: `scripts/verify-buffet-quantity-workbench-state.mjs`

- [ ] Assert the renderer contains `data-buffet-workbench-category`, `data-buffet-workbench-status`, all four status labels, and dynamic category rendering.
- [ ] Assert reset clears `lineId`, `categoryId`, `status`, and `query`.
- [ ] Run `npm run verify:buffet-product-table` and `npm run verify:buffet-quantity-workbench`; expect failure before implementation.

### Task 2: Implement state, filtering, and toolbar

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js:1366-1425,4180-4290,5687,6098-6110`
- Modify: `dist/Configuration center/assets/order-limit-flow.css:214-218`

- [ ] Add `categoryId: ""` and `status: ""` to `createBuffetQuantityWorkbenchState()` and normalize both fields.
- [ ] Add category metadata and current-scenario status helpers; filter before pagination using the active toolbar `combo` and `values`.
- [ ] Render line, conditional category, status, search, and reset controls in one row.
- [ ] Add category and status change handlers that return to page 1 and clear selections.
- [ ] Reset every filter field in the existing reset handler.
- [ ] Use a responsive grid with a flexible search column and a two-row narrow-screen fallback.

### Task 3: Verify

**Files:**
- Verify: `dist/Configuration center/buffet-rule-editor.html`

- [ ] Run `node --check "dist/Configuration center/assets/order-limit-flow.js"`.
- [ ] Run `npm run verify:buffet-product-table`, `npm run verify:buffet-quantity-workbench`, and `npm run verify:buffet-cross-store-copy-preview`; expect PASS.
- [ ] Open a rule with products, verify category is hidden for category rules, status filters current scenario values, search matches product/category names, and reset restores all results.
