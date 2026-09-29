# Participation and allocation hours linkage

**Spec:** User-approved relationship: clock/unrestricted permit actual or capped hours; time_window uses actual on-duty intervals only, no daily cap. Non-hours modes do not use hour config. Existing capped time-window rules require explicit confirmation before saving updated semantics; preserve historical allocation snapshots.
**Architecture:** Rule editor retains draft cap across radio switches but serializes actual-only for time_window. Explicit legacy acknowledgment checkbox gates saving old capped time-window rules. Time-window engine rejects legacy capped rules for new calculations until edited, instead of silently truncating attendance. No snapshot migration.
**Tech stack:** Existing JS editor/template, time-window engine, VM and browser tests.

- [x] Add linked read-only time-window explanation, contextual labels/help, cap disable/hide and legacy acknowledgement in rule-editor files.
- [x] Guard engine against legacy capped time-window calculations and preserve actual interval allocation; verify late tips still allocated to on-duty employees.
- [x] Test all three eligibility options, non-hours mode, cap restoration, legacy confirmation/save data, engine and existing hours/weight regressions.

Verification passed: participation-hours unit and real-browser checks; time-window engine late-tip and legacy-cap guard tests; zero-hours and employee-weight regressions. Browser used isolated storage and confirmed checkbox interaction does not automatically save/migrate legacy rules. Editor validation blocks an unacknowledged legacy change, and collection serializes actual/no cap for time-window rules.

No commit/push or user data writes during tests. Existing daily manual overrides for ordinary hours rules remain unchanged. Time-window participation still requires timestamped attendance.
