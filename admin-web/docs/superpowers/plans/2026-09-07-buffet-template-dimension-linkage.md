# Buffet Template Dimension Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make buffet templates immediately select their explicitly defined subject and target dimensions while preserving safe reset behavior.

**Architecture:** Store optional `presetSubject` and `presetTargetType` metadata with each template. Apply those presets through the existing cloned-draft structure-change flow, clearing only subject- or target-dependent configuration when the preset actually changes a populated draft.

**Tech Stack:** Static JavaScript profile and editor flow, Node.js assertion scripts, browser E2E.

**Spec:** `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

## Global Constraints

- Templates never overwrite measure unit, stores, products unrelated to a changed target, or numeric values unrelated to a changed structure.
- New empty drafts apply presets without confirmation.
- Existing product or quantity data uses the structure-change confirmation flow.
- Menu order-limit behavior and storage remain unchanged.

---

### Task 1: Template dimension contract

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Test: `scripts/verify-buffet-template-applicability.mjs`

**Interfaces:**
- Produces: optional template fields `presetSubject: "order" | "party_size"` and `presetTargetType: "dish_set"`.

- [ ] Add failing assertions for every authoritative template preset.
- [ ] Run `node scripts/verify-buffet-template-applicability.mjs` and retain the RED result.
- [ ] Add preset metadata to the five predefined templates; leave unbound dimensions absent.
- [ ] Run the test and confirm GREEN.

### Task 2: Safe preset application

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Test: `scripts/verify-buffet-period-scenario-editor.mjs`

**Interfaces:**
- Consumes: `template.presetSubject` and `template.presetTargetType`.
- Produces: `applyBuffetTemplate(draft, templateId)` that applies template dimensions, periods and blocks atomically.

- [ ] Add failing tests proving templates set explicit dimensions and preserve unspecified dimensions.
- [ ] Run the focused test and retain the RED result.
- [ ] Apply preset subject/target before period blocks; reset only data dependent on dimensions that actually change.
- [ ] Mark later manual dimension edits as template modifications and retain current invalid-combination protection.
- [ ] Run focused and buffet-period regression scripts.
- [ ] In the browser, verify each template's selected card, linked dimensions, unchanged dimensions and console logs.
- [ ] Commit implementation and verification evidence.
