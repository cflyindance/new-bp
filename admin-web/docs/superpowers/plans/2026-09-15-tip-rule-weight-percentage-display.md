# Tip Rule Weight Percentage Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a read-only percentage conversion beside each editable employee weight without changing stored `employeeWeights` or allocation behavior.

**Architecture:** Add one pure formatter and one row-sync handler to the native rule-editor program. The weight modal renders a derived column whose value is always calculated from the existing numeric input; save and rule serialization continue to read only the original input. A deterministic Node verifier locks the UI, formatting, real-time update, and no-persistence contracts.

**Tech Stack:** Native HTML template, browser JavaScript, Node.js assertion scripts.

**Spec:** `docs/superpowers/specs/2026-09-15-tip-rule-weight-percentage-display-design.md`

## Global Constraints

- `employeeWeights` remains the only persisted source.
- Conversion formula is `weight × 100%` and does not need to total 100%.
- Display uses at most two decimal places, removes trailing zeros, and never uses scientific notation.
- Finite non-negative legacy values are supported; invalid transient input displays `—`.
- Allocation and normalized employee percentage calculations must not change.

---

### Task 1: Add failing weight-percentage contract tests

**Files:**
- Create: `scripts/verify-tipout-rule-weight-percentage.mjs`
- Test: `scripts/verify-tipout-rule-weight-percentage.mjs`

**Interfaces:**
- Consumes: `src/team/tips/templates/rule-editor.html` and `src/team/tips/programs/rule-editor.js.txt`.
- Produces: structural and executable checks for `formatWeightAsPercentage(value)` and `syncWeightPercentage(input)`.

- [ ] **Step 1: Assert the modal structure**

Require a `权重换算百分比` table header, a per-row `.weight-percentage-value` output, and an input handler calling `syncWeightPercentage(this)`.

- [ ] **Step 2: Execute the pure formatter in a VM**

Extract and run `formatWeightAsPercentage`. Assert `1 → 100%`, `0.5 → 50%`, `1.1 → 110%`, `0 → 0%`, `0.3333 → 33.33%`, `0.125 → 12.5%`, and invalid/negative/non-finite values → `—`.

- [ ] **Step 3: Assert persistence isolation**

Require `saveWeight()` to continue reading only `input[type="number"]`, and reject any occurrence of `weightPercentage` inside the collected or serialized `employeeWeights` structure.

- [ ] **Step 4: Run and confirm failure**

Run: `node scripts/verify-tipout-rule-weight-percentage.mjs`

Expected: FAIL because the formatter and derived column do not exist.

---

### Task 2: Implement the derived percentage column and live updates

**Files:**
- Modify: `src/team/tips/templates/rule-editor.html:608-630`
- Modify: `src/team/tips/programs/rule-editor.js.txt:3990-4115`
- Test: `scripts/verify-tipout-rule-weight-percentage.mjs`

**Interfaces:**
- Consumes: the existing weight input and `employeeWeights` dataset JSON.
- Produces: `formatWeightAsPercentage(value)` returning a display string and `syncWeightPercentage(input)` updating only the same row’s derived output.

- [ ] **Step 1: Add the fourth table column**

Change modal column widths to accommodate `权重换算百分比`, and mark the output cells as read-only text with `.weight-percentage-value`.

- [ ] **Step 2: Implement deterministic formatting**

Convert the current value with `Number`, reject empty, negative, `NaN`, and infinite values, multiply by 100, round with decimal arithmetic to two fraction digits, and format without trailing zeros or exponential notation.

- [ ] **Step 3: Render the initial value from the same effective weight**

When an existing employee has no saved weight, continue to use the current default `1.0` for both the input and derived `100%` display. Existing high-precision finite values remain accepted for display.

- [ ] **Step 4: Add row-local live updates**

Attach `data-native-oninput="syncWeightPercentage(this)"` to every weight input. Update only `input.closest('tr').querySelector('.weight-percentage-value')`; invalid transient input displays `—`.

- [ ] **Step 5: Preserve save semantics**

Leave `saveWeight()` and rule serialization based exclusively on the numeric input and existing `employeeWeights` shape. Do not read or persist the derived cell.

- [ ] **Step 6: Run focused verification**

Run: `node scripts/verify-tipout-rule-weight-percentage.mjs`

Expected: PASS.

- [ ] **Step 7: Commit implementation**

```bash
git add src/team/tips/templates/rule-editor.html src/team/tips/programs/rule-editor.js.txt scripts/verify-tipout-rule-weight-percentage.mjs
git commit -m "feat: show employee weight percentage conversion"
```

---

### Task 3: Run regression and browser verification

**Files:**
- Verify: `src/team/tips/templates/rule-editor.html`
- Verify: `src/team/tips/programs/rule-editor.js.txt`
- Verify: `src/team/tips/legacy/tipAllocation.js.txt`

**Interfaces:**
- Consumes: completed Tasks 1-2.
- Produces: proof that the derived display does not alter rule persistence or allocation results.

- [ ] **Step 1: Run native and allocation regressions**

Run: `node scripts/verify-tipout-rule-weight-percentage.mjs && node scripts/verify-team-tips-native-views.mjs && node scripts/verify-tipout-detail-confirm-allocation.mjs`

Expected: all scripts PASS.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: exit code 0; existing bundle-size warnings are acceptable.

- [ ] **Step 3: Open the local page**

Run: `npm.cmd run dev -- --host 127.0.0.1 --port 65020`

Open the native “新增/编辑规则” route, select a receiver role, and open “设置员工小费权重”.

- [ ] **Step 4: Verify display and persistence manually**

Enter `1`, `0.5`, `1.1`, `0.3333`, `0`, and an invalid transient value. Verify the expected row-local displays, save the valid values, reopen the modal, and confirm only original weight numbers were persisted.

- [ ] **Step 5: Merge into main**

Merge the completed feature branch into `main` with a non-fast-forward merge after verifying the branch contains only this feature’s committed files.

