# Contribution total help implementation plan

**Goal:** User-approved display: confirmed plus estimated contribution total, with clickable question-mark breakdown in role cards and employee rows.
**Architecture:** Keep existing cent-based aggregates unchanged; reuse one renderer and an accessible, dismissible native popover. Never substitute zero for failed estimates. Click/keyboard activation must not navigate or select a role.
**Tech Stack:** Existing scoped JavaScript runtime, CSS, Playwright regression fixture.
**Spec:** User-confirmed design in this conversation, 2026-09-29.

- [x] Change `renderContributionSummary` in `src/team/tips/programs/distribution.js.txt` to sum confirmed and estimated cents, store escaped breakdown on an accessible question-mark control, and open a native popover with separate confirmed, estimated and total lines.
- [x] Add scoped help-control/popover styling to `src/team/tips/tips-page.css`; dismiss via outside click/Escape and support keyboard activation.
- [x] Update `scripts/verify-tipout-pending-summary-browser.cjs` for hidden breakdown, click/keyboard, role-filter isolation and failed estimates; run existing aggregate and performance regressions.

Validation: pending-summary unit tests (including mixed $100+$50=$150 and failed estimates), styled real-browser click/Enter/Escape and role-filter isolation checks, and summary-switch performance regression passed. No allocation records written.

No allocation writes, commit or push. Confirmed-only and pending-only records show a zero for the absent category; invalid confirmed values or estimates keep the total unavailable.
