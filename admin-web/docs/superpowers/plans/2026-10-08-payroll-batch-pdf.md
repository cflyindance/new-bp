# Batch PDF Implementation Plan

**Goal:** Implement approved centered employee picker, 1–10 employees, entry-defined detail type, merged PDF only.
**Architecture:** Reuse existing dropdown classes, batch controller and PDF artifact pipeline. Validate limits in UI, input builder and task boundary.
**Tech Stack:** TypeScript, HTML, CSS, Node verification scripts.
**Spec:** ../specs/2026-10-08-payroll-batch-pdf-interaction-design.md

## Constraints
- No automatic commit/push. Preserve unrelated working changes.
- No shared CSV renderer removal; only this entry becomes PDF-only.
- Current store/period scope; zero initial selections; merged PDF.

## Steps
- [x] Update domain verification: 10 succeeds, 11 fails; selected IDs cannot disappear silently.
- [x] Update HTML dropdown and picker, retaining existing modal and task IDs.
- [x] Controller fixes scope/format/organization, locks entry detail, checks context, selection limit and duplicate tasks.
- [x] Add task-boundary limit; retry filters original records and rejects changed context.
- [x] Run domain/UI tests, TypeScript check and HTTP preview verification.
- [x] Update affected documentation; report screenshot and baseline gaps.

Browser verification: isolated real component with 12 synthetic employees passed 10-cap, search retention, clear and entry title assertions. Screenshot output/playwright/batch-pdf-picker-test.png is a component fixture, not full app acceptance. Demo login redirects to onboarding; integrated PDF download remains unverified. No commit or push performed.
