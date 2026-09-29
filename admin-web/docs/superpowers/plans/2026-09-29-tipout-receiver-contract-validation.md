# Receiver contract validation — 2026-09-29

## Scope and outcome

Implemented in the active application checkout, without changing the UI structure, committing, pushing, migrating attendance or rewriting historical snapshots.

Confirmed root causes: time-window allocation split one receiver row by role count; ordinary funding rejected multi-role/nested rows; unrestricted average admitted absent candidates; editor discarded incomplete receiver rows; automatic detail amounts reused rounded display percentages.

Shared receiver groups and eligibility now serve the editor, ordinary detail calculation, ordinary funding and time-window allocator. Automatic amounts use exact weighted bases and integer-cent remainder allocation; new snapshots preserve automatic/manual source metadata.

## Verification

- RED: $120 for a single receiver row containing two roles and three equal employees produced $30/$30/$60 instead of $40 each.
- GREEN: `verify-tipout-receiver-contract.mjs` covers multi-role and nested groups, three weighted methods, separate groups, absent/manual admission, malformed shares, zero bases and immutable facts.
- PASS: funding, employee-weights, time-window, participation, participation-hours, detail-manual-allocation, demo-funding (496 scenarios), day-payout, payout-lock and employee-reconciliation Node scripts.
- PASS: receiver-contract-browser (real quick allocation/editor/details), weights-browser, participation-hours-browser and existing-ui-funding-browser. Tests use isolated browser storage, not the user's current data.
- Raw modified JavaScript syntax checked with Node VM; whitespace checked with Git.

## Limitations

- Old quick-allocation comprehensive browser test has outdated percentage operations and display assertions; it was not reported passing and was left unchanged. New focused coverage validates quick allocation for the changed contract.
- Old manual-detail comprehensive browser test times out at employee-summary navigation; the same failure was reproduced serving unmodified HEAD scripts. This remains outside the receiver change.
- Active checkout has no node_modules; `npx tsc --noEmit` failed attempting dependency resolution. No successful TypeScript/build verification is claimed. No dependency/import/packaging changes were made.
- Production POS integration and the full combination matrix are not certified by these local fixtures. Time-window semantics are verified through the time-window allocator, not through standalone funding.calculate's daily implementation.

## Change boundaries

Runtime: employee-weights, time-window, funding, detail-snapshot, details and rule-editor raw scripts. Tests: two new receiver-contract scripts, dependency loading in funding/time tests, current eligibility/help UI expectations in weights/existing-UI funding browser tests. Authority: PRD chapter 24.10. Unrelated repository changes remain untouched.

Rollback must target these edits only; never reset the entire checkout. Existing historical snapshots are deliberately not migrated.
