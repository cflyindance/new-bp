# Pending employee summary implementation

**Goal:** Show actual original tips for all selected days, and distinguish pending estimated contributions from confirmed contributions in employee and role summaries.
**Architecture:** Pure funding preview reuses source and contributor matching, without committing allocation state. Aggregates maintain separate actual-original, confirmed-original, confirmed-contribution and estimated-contribution amounts. Invalid previews remain unavailable with reasons, never zero.
**Tech Stack:** Existing JavaScript runtime and Node/browser regression scripts.
**Spec:** User-approved summary behavior in this conversation (2026-09-29).

## Constraints

No commit/push or allocation writes. Do not compute confirmed final tips using pending original tips. Match role and employee filters. Keep preview failures separate from historical confirmed values.

## Steps

- [x] Add pure contribution preview using integer cents, sequential contributor capacity, explicit shortage/unsupported errors; test against confirmed funding output and no mutation.
- [x] Add preview fields to employee daily rows only for pending business days, and aggregate separately; test pending/confirmed/mixed/failed cases.
- [x] Render original totals always; render confirmed/estimated breakdown and unavailable reasons consistently for roles and employees.
- [x] Verify real browser pending values, no persistent allocation changes, mixed totals and regressions.

## Verification

Passed pending-summary unit and isolated real-browser checks, employee reconciliation, summary switch performance, funding engine, and 496 default funding cases. Browser checks cover role/employee consistency, actual originals, estimated contributions, shortage errors, and absence of allocation writes.

The native-views aggregate assertions pass after updating expected total and preview fields. Its full suite still reports three pre-existing static-contract failures: removed participationHint markup and two obsolete navigation strings. Verified those tokens are also absent from HEAD; unrelated UI/navigation behavior was not changed.

No commit, push, or user allocation data modification performed.
