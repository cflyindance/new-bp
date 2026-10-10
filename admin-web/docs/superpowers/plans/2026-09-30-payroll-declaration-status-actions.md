# Declaration Status Actions Implementation Plan

> **For agentic workers:** Execute inline task-by-task; executing-plans skill unavailable in this session.

**Goal:** Draft update/delete and published retirement with confirmation and history protection.
**Architecture:** Add revision-checked repository operations in browser and Mock API; settings routes actions by latest version status. Preserve existing family identity and employee assignments.
**Tech Stack:** TypeScript, native dialogs, browser storage, Node Mock API/tests.
**Spec:** docs/superpowers/specs/2026-09-30-payroll-declaration-status-actions-design.md

## Global Constraints
Delete only draft version; retain published/retired history and employee associations. Retired is read-only. No production authentication claim. Preserve unrelated pending filter/layout edits.

## Task 1: Repository
- [ ] Add failing browser test for same-ID draft update, revision conflict, draft delete retaining active version, forbidden published/retired delete.
```ts
assert.equal(updated.versionId, draft.versionId);
await assert.rejects(repo.deleteDraft({versionId: published.versionId,expectedFamilyRevision: revision}));
```
- [ ] Add `updateDraft({versionId,source,expectedFamilyRevision})` returning version, `deleteDraft({versionId,expectedFamilyRevision})` returning void to payroll-declaration-api.ts; HTTP PUT/DELETE /versions/:id. Implement same checks in payroll-declaration-browser.ts and scripts/lib/payroll-mock-api-handler.mjs. Validate state/scope/revision; protect references; remove empty family only without references.
- [ ] Run compiled browser TS test and verify-payroll-declaration-api.mjs; expect pass.

## Task 2: UI
- [ ] Update payroll-declaration-settings.ts row actions by status; retired controls read-only. Draft modification updates latest existing draft rather than creates duplicate.
- [ ] Add application confirmation dialog identifying exact template/version. Cancel performs no writes. Confirm captures ID/revision; refresh after success preserving filters. Failure remains retryable with explicit message.
- [ ] Add renderer assertions to scripts/verify-payroll-declaration-store-selection.mjs for draft actions and retired absence of write buttons. Run settings/store tests plus tsc.

## Task 3: Validation
- [ ] Browser validate published confirmation cancellation, draft modification UI and retired read-only using test fixtures; do not permanently delete existing user templates.
- [ ] Run regression tests and record verified/unverified scopes. Build skipped unless a build boundary changes. Do not commit implementation until user requests.

Self review: repository guards cover deletion safety and concurrency; UI confirmation covers exact target and cancel; regression covers existing filters/assignment. No changes to employee preference, payroll or snapshot write paths.

## Execution record

- Implemented browser/HTTP/Mock draft update/delete, revision/state guards, latest-draft in-place save, status-specific row/detail controls and page-owned confirmation dialog. Existing published/retired version deletes rejected by tests.
- RED: TypeScript browser test failed for absent updateDraft/deleteDraft. GREEN: browser repository test, API test, renderer/status tests, existing settings and acceptance tests passed; TypeScript passed before final confirmation substitution and rerun scheduled below.
- Browser incident: while testing the original native confirm, existing local demo draft named 2222 was deleted. The command timed out, no inspectable JS dialog remained, and UI reported 草稿已删除. Do not attribute a specific browser root cause as confirmed. Known source from DOM: `111{{total_hours}}2222{{tips_amount}}`; locale code not observed. User informed immediately; recovery requires correct locale metadata. No further destructive browser operations performed.
- Replaced native confirm with explicit DOM dialog, default focus Cancel. Browser verified published retire opens confirmation and Cancel leaves templates published. User data recovery and full end-to-end status coverage remain outstanding. Implementation uncommitted.
