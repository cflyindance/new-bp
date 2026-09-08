# Buffet Common Template Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the new-rule common template selector to eight user-facing templates covering the frequent subject and period combinations without multiplying templates by target type.

**Architecture:** Keep template definitions in `buffet-rule-profile.js` and reuse the existing `applyBuffetTemplate` linkage. Add three presets, mark the legacy decrement template as hidden for new creation, and filter only hidden templates at render time so saved drafts remain readable.

**Tech Stack:** Static JavaScript, HTML string rendering, Node.js assertion scripts.

**Spec:** `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

## Global Constraints

- User-facing cards are exactly eight and remain independent of target type.
- `multi-round-desc` remains resolvable for historical drafts but is hidden from the common-template selector.
- Templates never overwrite stores, products, or quantity values without the existing structure-change confirmation path.
- Menu order limits are unchanged.

---

### Task 1: Define and verify the expanded template catalog

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `scripts/verify-buffet-template-applicability.mjs`
- Modify: `scripts/verify-buffet-v4-profile.mjs`

**Interfaces:**
- Consumes: `PERIOD_TEMPLATES`, `applyBuffetTemplate(draft, templateId)`.
- Produces: `party-order-basic`, `order-round-basic`, and `party-multi-round` template definitions plus the hidden legacy alias.

- [x] **Step 1: Add failing assertions for the three stable IDs, their preset subjects, periods, and blocks.**
- [x] **Step 2: Run `node scripts/verify-buffet-template-applicability.mjs` and confirm the new assertions fail.**
- [x] **Step 3: Add the three definitions and mark `multi-round-desc` with `hidden: true`.**
- [x] **Step 4: Run the applicability and v4 profile scripts and confirm they pass.**

### Task 2: Render exactly eight new-rule cards

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `scripts/verify-buffet-period-scenario-editor.mjs`

**Interfaces:**
- Consumes: `moduleProfile.periodTemplates` including optional `hidden`.
- Produces: `visibleBuffetPeriodTemplates()` used by both template renderers.

- [x] **Step 1: Assert that hidden templates are filtered and all eight labels render.**
- [x] **Step 2: Run the scenario editor verification and confirm failure.**
- [x] **Step 3: Add the visibility helper and use it in both template-card render paths.**
- [x] **Step 4: Run all buffet template and scenario verifications.**

### Task 3: Browser regression

**Files:**
- Test: `dist/Configuration center/buffet-rule-editor.html`

**Interfaces:**
- Consumes: the rule editor and template-card linkage.
- Produces: verified card count and subject/period linkage evidence.

- [x] **Step 1: Open a new buffet rule and verify the eight card labels.**
- [x] **Step 2: Select each new template and verify the selected state plus linked subject and period.**
- [x] **Step 3: Switch repeatedly between new and existing templates and confirm selection remains responsive.**
- [ ] **Step 4: Run `git diff --check` and commit only the spec, plan, implementation, and tests.**
