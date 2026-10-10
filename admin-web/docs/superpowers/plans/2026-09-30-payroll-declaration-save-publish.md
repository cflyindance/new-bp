# Declaration Save and Publish Implementation Plan

> Execute inline task-by-task as previously selected; executing-plans skill unavailable.

**Goal:** Save draft closes editor; save-and-publish persists current form in one click; new template has no status field.
**Architecture:** One settings saveDraft(publish=false) pipeline, local result reconciliation before optional publish, separate post-success refresh handling.
**Tech Stack:** TypeScript and Node VM tests.
**Spec:** docs/superpowers/specs/2026-09-30-payroll-declaration-save-publish-design.md

## Global Constraints
Keep input on failure. Preserve saved family/version after partial success. Do not change employee preferences, snapshots or template status constraints. No automatic commits.

## Tasks
- [ ] Add failing test scripts/verify-payroll-declaration-save-publish.mjs extracting controller save closure with mocked repositories: create/save/publish order, save-only closes, validation no request, save failure no publish, publish failure stays open, refresh failure reports successful mutation, duplicate submission skipped, stale response ignored.
```js
assert.deepEqual(calls,['create','save','publish','refresh']);
assert.equal(state.editorOpen,false);
```
- [ ] Modify src/team/payroll/payroll-declaration-settings.ts: optional publish flag, guard busy, reconcile saved version and revision, publish latest returned ID, close on mutation success before refresh. Keep conflict failures visible and input untouched.
- [ ] Remove separate publish-first-saved requirement; button calls saveDraft(true). Rename text to 保存并发布 and render status field only when selected family exists.
- [ ] Run new script plus renderer/settings/status regressions and tsc --noEmit. No new module/import/build boundary so skip full build.
- [ ] Browser verify using distinct test templates only: save draft closes, edit then save/publish closes and lists published, direct new publish succeeds. Leave test artifacts identifiable, no destructive cleanup.
- [ ] Record results and unverified paths.

Self-review: tests cover all specified failure stages; renderer covers new-only status removal; existing scoped guards and generation checks retained.

## Execution results

- Unified save pipeline implemented; latest form saved then optionally published using saved version ID and incremented revision. Success closes editor; partial failure keeps input. Refresh failure distinguished from mutation failure.
- RED: new test failed on missing 保存并发布 label. GREEN: flow VM tests (new/existing, save/publish failure, refresh failure, busy/validation/stale guards), store renderer, settings UI and TypeScript passed.
- Browser 57402: no status field on new form; 保存流程验收-0930 saved as draft and closed, then changed text saved/published and closed; 直接发布验收-0930 created and published directly without intermediate save. Both test templates retained, no employee assignments changed.
- Screenshot: declaration-save-publish.png. Network failures tested through mocks, not browser fault injection. No build boundary change; build skipped. Changes uncommitted.
