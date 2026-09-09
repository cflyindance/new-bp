# Employee Reconciliation Hours Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove tip-pool and rule names from the employee reconciliation work-hours cell while retaining the hours value and manual-entry badge.

**Architecture:** Keep attendance aggregation and export records unchanged. Change only the DOM renderer `makeWorkHoursCell`, with a source-level verification script guarding both the simplified UI and preserved export detail.

**Tech Stack:** Vanilla JavaScript embedded as raw runtime programs, Node.js verification scripts, TypeScript/Vite build.

**Spec:** `docs/superpowers/specs/2026-09-09-employee-reconciliation-hours-display-design.md`

## Global Constraints

- The UI work-hours cell displays only the hours value and optional `录入` badge.
- CSV, PDF, and email export data retain the existing manual-hours detail.
- No changes to manual-hours storage or attendance aggregation.

---

### Task 1: Simplify the work-hours cell

**Files:**
- Modify: `src/team/tips/programs/employee-reconciliation.js.txt`
- Modify: `scripts/verify-team-tips-employee-manual-hours-view.mjs`

**Interfaces:**
- Consumes: `attendance.hourLines`, where each item contains `hours`, `source`, and optional `label`.
- Produces: `makeWorkHoursCell(lines)`, rendering `hours` and an `录入` badge only when `source === 'manual'`.

- [ ] **Step 1: Write the failing verification**

Add assertions that the renderer does not create `tipout-work-hours-label` or assign `line.label`, while export generation still references `manualHourDetails`.

```js
assert.ok(!source.includes("label.className = 'tipout-work-hours-label'"));
assert.ok(!source.includes('label.textContent = line.label'));
assert.ok(source.includes('manualHourDetails'));
```

- [ ] **Step 2: Run the verification and confirm it fails**

Run: `node scripts/verify-team-tips-employee-manual-hours-view.mjs`

Expected: FAIL because the current renderer creates and inserts the rule-name label.

- [ ] **Step 3: Implement the minimal renderer change**

Delete this block from `makeWorkHoursCell`:

```js
if (line.label) {
  var label = document.createElement('span');
  label.className = 'tipout-work-hours-label';
  label.textContent = line.label;
  row.appendChild(label);
}
```

Keep the hours value and manual badge branches unchanged.

- [ ] **Step 4: Verify behavior and build**

Run:

```powershell
node scripts/verify-team-tips-employee-manual-hours-view.mjs
npm.cmd run build
```

Expected: verification passes and Vite build exits successfully.

- [ ] **Step 5: Browser verification**

Open `/team/tips/employee-reconciliation` for an employee with manual hours and verify the work-hours cell displays `6 h 录入` without a pool or rule name.

- [ ] **Step 6: Commit**

```powershell
git add scripts/verify-team-tips-employee-manual-hours-view.mjs src/team/tips/programs/employee-reconciliation.js.txt
git commit -m "fix: simplify reconciliation manual hours display"
```
