# Buffet Limit Content Quantity Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move editable buffet limit-content controls from rule type to quantity configuration while keeping limit period in rule type.

**Architecture:** Reuse the existing period-policy model and structure-change transaction. Change only the five-step buffet renderer and validation routing: Step 1 renders templates, subject, period, target and subordinate fields; Step 2 renders product scope, limit content, ranges and quantities. Source-level regression scripts protect section order, validation ownership and menu-order-limit isolation.

**Tech Stack:** Vanilla JavaScript, static HTML assets, Node.js assertion scripts, Vite.

**Spec:** `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

## Global Constraints

- Limit period remains editable in Step 1.
- Limit content is editable only in Step 2.
- Template selection continues to prefill period and limit content without overwriting subject, target, measure, products or quantities.
- Disabling a populated limit content continues to use the existing structure-change confirmation and clears only affected quota cells.
- Menu order-limit remains a six-step flow with unchanged rendering and validation.

---

### Task 1: Add failing ownership and order tests

**Files:**
- Create: `scripts/verify-buffet-limit-content-quantity-step.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `renderStepOne`, modern buffet Step 2 routing, `validateStep`, and `requestBuffetStructureChange` in `order-limit-flow.js`.
- Produces: `npm run verify:buffet-limit-content-quantity-step`.

- [ ] Write assertions that Step 1 does not append `renderBuffetLimitContent`, Step 2 appends it after product configuration and before range/quantity rendering, Step 1 validation accepts a structurally valid draft with no enabled content, and Step 2 rejects it.
- [ ] Assert content toggles still call `requestBuffetStructureChange` and menu routing remains unchanged.
- [ ] Run the command and confirm it fails before implementation.
- [ ] Commit with `test: cover buffet limit content step ownership`.

### Task 2: Move rendering and validation ownership

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`

**Interfaces:**
- Consumes: `renderBuffetLimitContent(draft)`, `renderBuffetQuantityRanges(draft)`, `renderStepFour(draft, { embedded: true })`.
- Produces: `renderBuffetQuantityStep(draft)` and corrected five-step validation routing.

- [ ] Remove the limit-content block from modern buffet Step 1.
- [ ] Add a focused Step 2 renderer ordered as rule context → product configuration → limit content → ranges → quantity matrix.
- [ ] Move `enabledPeriodsHaveQuantityBlocks` and template-applicability completion checks from Step 1 validation ownership to Step 2 while keeping subject, period, target and period-combination validation in Step 1.
- [ ] Keep the existing content-toggle confirmation handler unchanged.
- [ ] Run the new regression plus `npm run verify:buffet-period-selection` and fix any obsolete test expectations.
- [ ] Commit with `feat: configure buffet limit content with quantities`.

### Task 3: Browser acceptance

**Files:**
- No planned source changes.

**Interfaces:**
- Consumes: local Vite page for a fresh buffet draft.
- Produces: verified visual and interaction behavior.

- [ ] Confirm Step 1 ends with rule preview and has no editable limit-content section.
- [ ] Continue to Step 2 and confirm product configuration precedes limit content, and enabled content immediately exposes its quantity fields.
- [ ] Toggle an empty content off/on and verify the quantity section responds without navigation.
- [ ] Confirm no browser console errors and no unexpected tracked files are modified.
