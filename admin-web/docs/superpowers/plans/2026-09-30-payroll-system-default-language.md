# Payroll System Default Language Implementation Plan

> Execute inline in the existing worktree. User approved implementation of option 1; unavailable executing-plans sub-skill is replaced by the steps below.

**Goal:** Default unconfigured employees to the existing English declaration.

**Architecture:** A null language preference means system default. The presentation resolver returns ready English for that state; explicit templates and frozen snapshots keep precedence. Runtime supplies this default synchronously for detail/batch output and refreshes saved snapshots through the existing repository.

**Tech Stack:** TypeScript, legacy JavaScript, Node assertion tests, Vite.

**Spec:** `docs/superpowers/specs/2026-09-30-payroll-system-default-language-design.md` (review approved).

## Global Constraints

- Label exactly “系统默认语言”; do not follow administrator UI locale.
- Preserve configured employees and historical snapshots. Do not create editable system templates or add API endpoints.
- Do not commit or push without a separate user request.

## Task 1: Default selection and presentation

- [ ] Add assertions in `scripts/verify-payroll-declaration-preferences.ts`: null preference returns ready English with substituted amounts, snapshot has priority, explicit missing-template fails. Compare English source with existing mapping after variable syntax conversion.
- [ ] Extend `scripts/verify-payroll-declaration-language-options.mjs`: first option is system default, empty value is selected, custom selection survives refresh/failure.
- [ ] Run both tests before implementation and record failures.
- [ ] In `payroll-declaration-presentation.ts`, return ready system presentation only without preference/override. Keep snapshot check first.
- [ ] In `payroll-legacy-runtime.ts`, provide synchronous default resolver; skip template-list request for default, retain snapshot lookup.
- [ ] In `legacy/payroll.js.txt` and `payroll-template.html`, rename empty option; initialize default before detail/export payload; use readable default metadata; preserve custom preferences and confirmation flow.
- [ ] Synchronize `dist/TipOut/payroll.js` from source.

## Task 2: Verify

- [ ] Compile preference tests using TypeScript with `--module commonjs --moduleResolution node --target es2022 --esModuleInterop --skipLibCheck`; output to task temp directory and run with Node.
- [ ] Run language-options, declaration detail/export/settings/API/acceptance/merge regression scripts; `tsc --noEmit`; `git diff --check`.
- [ ] Browser port 57402: default selected, custom language selectable, switch back/confirm preserves default, detailed and compact previews show English without missing-preference warnings.
- [ ] Check shared print-document path via existing regression tests, without sending to a printer.

Build skipped: no new imports/dependencies or build/deployment configuration changes. Keep other generated build changes untouched.

## Execution record

Completed 2026-09-30 in the existing worktree (not committed or pushed).

- RED: option text remained “请选择已发布模板”; resolver returned blocked for a null preference. Both assertions failed before implementation.
- GREEN: language options and compiled preference tests passed, including current-English-source parity, snapshot precedence and explicit-template failure.
- Browser: default selected; custom Chinese template selectable and retained; switching back and confirming selects system default. Detailed and compact previews display the same English statement with gratuity $0.00 and tips $144.00.
- Browser exposed missing service-charge values rendered as $— in compact output; added a failing regression then normalized absent values to zero. Existing calculation logic is unchanged.
- Declaration API, settings UI, detail, export, acceptance, merge and dual-detail regression scripts passed. TypeScript `--noEmit` and scoped diff whitespace checks passed.
- Printed paper/PDF output was not physically produced; shared print/export behavior was checked through existing regression tests and previews. Production deployment was not performed.
- The executing-plans sub-skill is unavailable in this session; execution remained inline with the recorded test-first steps.
