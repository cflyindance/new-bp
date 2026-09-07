# Buffet Rule Type Field Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the buffet rule-type page to follow the confirmed template → subject → period → target → limit-content decision flow without changing rule data semantics.

**Architecture:** Keep the shared order-limit editor and buffet policy model intact. Split the current buffet rule-type renderer into a template renderer and a period/content renderer so the caller can place subject, period, target, subordinate fields, and content in the required order. Add a source-level regression test that verifies the rendered section order and the template safety contract.

**Tech Stack:** Static HTML, vanilla JavaScript, Node.js assertion scripts, Vite.

**Spec:** `docs/superpowers/specs/2026-09-07-buffet-scene-step-fusion-design.md`

## Global Constraints

- Only the buffet rule editor changes; menu order-limit keeps its six-step UI and existing field order.
- Templates continue to modify only period and limit-content structure.
- Subject, target, measure, stores, products, and quantities are not overwritten by template selection.
- The exact top-to-bottom order is: base information, common templates, limit subject, limit period, limit target, measure/effective-party-size subordinate fields, limit content, rule preview.
- No source under `vendor/emenu-new` is changed.

---

### Task 1: Add a failing field-order regression

**Files:**
- Create: `scripts/verify-buffet-rule-type-field-order.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `renderStepOne` source in `dist/Configuration center/assets/order-limit-flow.js`.
- Produces: `npm run verify:buffet-rule-type-order`, which fails unless buffet sections appear in the specified order and menu rendering remains separate.

- [ ] **Step 1: Write the failing test**

Create a Node assertion script that reads `order-limit-flow.js`, extracts `renderStepOne`, and asserts ordered source markers for `renderBuffetTemplateSelection(draft)`, subject section, `buffetPeriodBlock`, target section, `measureBlock`, `childBlock`, `renderBuffetLimitContent(draft)`, and rule preview. Assert that `applyBuffetTemplate` still only writes period policies, `buffetTemplateId`, and `buffetTemplateModified`.

- [ ] **Step 2: Register and run the test**

Run: `npm run verify:buffet-rule-type-order`

Expected: FAIL because the split render helpers and required order do not exist yet.

- [ ] **Step 3: Commit the regression test**

```bash
git add scripts/verify-buffet-rule-type-field-order.mjs package.json
git commit -m "test: cover buffet rule type field order"
```

### Task 2: Reorder the buffet rule-type sections

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`

**Interfaces:**
- Consumes: existing `moduleProfile.periodTemplates`, `renderBuffetPeriodSelection`, `renderBuffetPeriodBlocks`, `measureBlock`, and `childBlock`.
- Produces: `renderBuffetTemplateSelection(draft)`, `renderBuffetLimitContent(draft)`, and ordered buffet markup in `renderStepOne`.

- [ ] **Step 1: Split the buffet renderer**

Extract the template cards and modified-template warning into `renderBuffetTemplateSelection(draft)`. Extract only the limit-content section into `renderBuffetLimitContent(draft)`. Keep existing availability, disabled reason, selection, and warning markup unchanged.

- [ ] **Step 2: Place sections in the confirmed order**

In `renderStepOne`, construct `buffetTemplateBlock`, `buffetPeriodBlock`, and `buffetContentBlock`. For modern buffet drafts render them as: base information → template block → subject → period → target → measure → child/effective-party-size → content → preview. Keep the non-buffet path byte-for-byte equivalent in behavior.

- [ ] **Step 3: Run focused tests**

Run: `npm run verify:buffet-rule-type-order`

Expected: PASS.

Run: `npm run verify:buffet-period-selection`

Expected: all buffet migration, template, range, period, scenario, and validation checks PASS.

- [ ] **Step 4: Commit the implementation**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js"
git commit -m "feat: reorder buffet rule type decisions"
```

### Task 3: Browser acceptance

**Files:**
- No source files expected.

**Interfaces:**
- Consumes: local Vite preview of this worktree.
- Produces: visible browser verification of the new rule-type order.

- [ ] **Step 1: Start the worktree development server**

Run: `npm run dev -- --host 127.0.0.1 --port 65172 --strictPort`

Expected: HTTP 200 for `Configuration center/buffet-rule-editor.html?mode=create&embedded=1`.

- [ ] **Step 2: Verify the DOM order**

Open a fresh draft and confirm headings appear as 常用模板 → 限购主体 → 限制周期 → 限购对象 → 计量方式（when applicable）→ 有效人数口径（when applicable）→ 限购内容, with 规则预览 last.

- [ ] **Step 3: Verify template behavior**

Select a subject and target, apply a compatible template, and confirm only period/content selections change. Confirm incompatible templates remain disabled and explain why.

- [ ] **Step 4: Check repository status**

Run: `git status --short`

Expected: no unexpected source modifications; generated predev-only changes are not committed.
