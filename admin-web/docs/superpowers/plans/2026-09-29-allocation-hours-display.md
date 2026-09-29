# Allocation hours display implementation plan

**Spec:** Approved in conversation: rename column to 分配计入工时; identical totals display hours with info marker; differing totals display 按规则查看; no hour-based rules display 不适用; missing required hours display 待补录. Rule details include calculation explanation and valid/eligible days. Do not sum hours across rules or change monetary calculation.
**Architecture:** Centralize display states, explanation and coverage in TipOutSummaryUi. Consume from summary and employee daily detail. Correct display-only usesHours detection to use distribution, falling back to legacy aliases. Existing snapshot hour values remain authoritative; missing data is never zero-filled.
**Tech stack:** Scoped JavaScript, existing HTML modal, Node/Playwright regression scripts.

- [x] Add unit coverage for equal/different/non-hour/missing/partial hours and rule-day coverage.
- [x] Update summary helper and both UI consumers, headers and modal columns. Keep weighted units separate from actual hours; show explanation only supported by recorded source metadata.
- [x] Run unit and browser tests for summary and daily details, popup contents and unchanged contribution behavior.

Passed: hours-display, employee-hours-contract, pending-summary, detail-contribution, summary-switch-performance and extended real-browser regression. Browser verifies average rules are not applicable, different hour totals open rule details in summary and employee daily views, calculation descriptions/day coverage, and contribution previews still do not write allocation records. Modal assertions wait for visible rows before reading rendered text.

No commit or push. No monetary engine changes. Existing modal interaction is retained.
