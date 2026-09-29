# TipOut receiver contract implementation plan

> Execution: inline in this conversation. The named executing-plans/subagent-driven-development skills are unavailable; use the existing verification scripts and RED/GREEN checkpoints. User approved the authoritative design and requested implementation; do not commit or push.

**Goal:** Unify receiver groups, participation admission and percentage validation without changing the interaction.

**Architecture:** Extend the already loaded employee-weights utility with receiver-group normalization/validation and daily eligibility. Reuse it in ordinary details, time-window allocation, funding and editor validation. Keep saved snapshot rendering untouched.

**Tech Stack:** Existing raw JavaScript programs, Node VM verification and isolated Playwright browser tests.

**Spec:** `dist/TipOut/docs/PRD_产品需求文档.md`, chapter 24 (V2.15).

## Constraints

- Same-row roles form one group; child percentages multiply parent percentages. Validate each sibling set totals 100% and reject invalid/empty leaves.
- Average unrestricted staff must be present or manually included. Orders unrestricted can participate through attributed orders. Manual ordinary hours remain editable.
- Do not alter original attendance, rule default weights or confirmed/paid snapshots.
- Build skipped: no dependency, import graph, entrypoint or packaging changes. CI build unknown. E2E required for shared money logic.
- Existing unrelated deletions/untracked plans and the prior PRD edits must be preserved.

## Task 1: Failing regression and shared receiver definitions

Files: `scripts/verify-tipout-receiver-contract.mjs`, `src/team/tips/legacy/tipout-employee-weights.js.txt`.

- [ ] RED: use the existing VM harness. Assert time-window $120 with roles Server/Busser and people A/B/C pays `[40,40,40]`, rather than `[30,30,60]`; funding must accept the same row. Assert unrestricted average excludes absent C until `{included:true}`; shares 90 or 110 and malformed children must throw.
- [ ] Implement `groups(receivers)` returning leaf `{roles,pct,employeeWeights,employeeRefs}` with parent multipliers and per-level sum validation; `eligible(rule,present,included)` allows unrestricted only for non-average algorithms.
- [ ] GREEN: `node scripts/verify-tipout-receiver-contract.mjs` covers method/weight matrix, zero bases, child shares, invalid shares, manual participant and time boundaries.

## Task 2: Runtime adapters

Files: `legacy/tipout-time-window.js.txt`, `legacy/tipout-funding.js.txt`, `programs/details.js.txt`, `programs/rule-editor.js.txt` under `src/team/tips`.

- [ ] Time allocation consumes `groups` and filters the union of leaf roles before allocating each event. Never divide group shares by role count.
- [ ] Funding consumes the same leaf groups, unions candidate facts, computes individual weights using each fact role, and preserves actual-funds reconciliation.
- [ ] Detail grouping uses the same normalizer. Average eligibility uses `eligible`; changing a weight cannot admit an absent employee. Existing explicit percentage/new-row inclusion remains available.
- [ ] Rule save validates receiver shares before storage. New snapshot confirmation validates configured shares and current group input shares; old snapshot reading stays unchanged.
- [ ] Regression: funding, employee-weights, participation, time-window, manual-allocation, participation-hours, demo-funding and snapshot/payout tests.

## Task 3: Browser verification and documentation

Files: `scripts/verify-tipout-receiver-contract-browser.cjs`; PRD chapter 24.10.

- [ ] Isolated browser: mount real rule editor and details runtime; verify grouped recipients, absent exclusion, explicit inclusion, weight changes, save/reopen and invalid share rejection. Use existing browser harness, not user localStorage.
- [ ] Run existing weight and participation-hours browser checks; run `npx tsc --noEmit` and `git diff --check`.
- [ ] Update implementation status only for verified cases, record remaining production interfaces and snapshot limitations. Leave Git uncommitted.

## Root cause and rollback

Daily detail grouping already unions roles, but time-window splits by role count; funding v1 rejects multi-role rows. Weight recalc and funding admitted every unrestricted candidate to average distribution. Editor only checked at least one positive receiver row. Regression tests must demonstrate each issue before changes.

Rollback is limited to the files edited in this task; never reset the worktree or historical snapshots. No migration or external writes are planned.
