# Employee weights implementation plan

**Goal:** Editable daily receiver weights, default 1, with conserved recalculation and immutable paid results.
**Architecture:** Add a shared validated weight reader; wire detail rows and snapshots without writing rule storage. Apply weights to eligible bases before cent apportionment, including event-local time-window bases.
**Tech Stack:** Existing JavaScript runtime, Node regression scripts.
**Spec:** ../specs/2026-09-29-tipout-receiver-weight-display-design.md

## Constraints

No automatic commit/push. Preserve existing rounding fix. No changes to paid snapshots. Zero is valid; invalid input blocks confirmation. Daily edits do not mutate stored rules.

## Tasks

- [x] Add weight parsing/lookup and test default 1, zero, invalid input, 1:2, hours 4:8 × 2:1 and orders 2:3 × 3:1.
- [x] Add employee weight inputs to detail tables; recompute same receiver on weight/hour/employee changes. Keep manual percentage edits as final until next weight/hour edit.
- [x] Persist employee weight and receiver identity in allocation snapshot; restore independently of live rule. Paid rows display saved values only; old values show —.
- [x] Apply time-window weights inside each event's eligible participants and expose daily overrides without replacing unrelated drafts.
- [x] Run focused scripts, syntax checks, funding/manual-hours/rounding regressions; verify served source. Report any browser verification limitation.

Validation: isolated Chrome session against localhost:65021 passed average/hours/orders, separate claim/residual weights, time-window overrides, save/reopen, unchanged rule storage, invalid input and paid-lock checks. Node funding tests (including 496 demo daily cases), time-window tests, 2500 rounding cases and payout contracts passed. The user's existing browser storage was not changed. No commit or push performed.
