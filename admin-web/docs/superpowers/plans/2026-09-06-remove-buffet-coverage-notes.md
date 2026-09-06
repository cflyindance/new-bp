# Remove Buffet Coverage Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the yellow and blue explanatory note panels above buffet rule tables while preserving the table-level KPOS capability and coverage information.

**Architecture:** Make a presentation-only change in the standalone buffet rule list HTML. Remove the note renderer and its private styles, but retain shared capability/status mapping used by table cells.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node.js syntax verification

**Spec:** `docs/superpowers/specs/2026-09-06-remove-buffet-coverage-notes-design.md`

## Global Constraints

- Keep the “旧 KPOS 调研能力” and “覆盖结果” table columns and their data.
- Do not change rule defaults, persistence, editing, copying, toggling, or deletion behavior.
- Modify only `dist/Configuration center/buffet-rule.html` for runtime behavior.

---

### Task 1: Remove group-level explanatory notes

**Files:**
- Modify: `dist/Configuration center/buffet-rule.html`

**Interfaces:**
- Consumes: `profile.defaultScenarios`, `profile.legacyCapabilities`, and rule records loaded through `repo.loadForAuthoringList(...)`.
- Produces: The existing rule list markup without `.coverage-note` panels; `capabilityView(record)` continues producing table cell content.

- [ ] **Step 1: Verify the current page contains the note renderer and styles**

Run:

```powershell
rg -n "coverage-note|function groupNote|groupNote\(group\)" "dist/Configuration center/buffet-rule.html"
```

Expected: matches for `.coverage-note`, `.coverage-note-row`, `groupNote`, and the call inside `groupHtml`.

- [ ] **Step 2: Remove the note-only CSS and renderer**

In `dist/Configuration center/buffet-rule.html`:

1. Delete `.coverage-note`, `.coverage-note strong`, `.coverage-note-row`, and `.coverage-note.evidence` declarations.
2. Delete `function groupNote(group) {...}`.
3. Simplify `groupHtml(title,rows,group)` so it returns the section heading followed directly by the existing table.
4. Keep `statusView`, `capabilityFor`, and `capabilityView` unchanged because the rule table depends on them.

- [ ] **Step 3: Verify the removed UI code is absent and retained columns remain**

Run:

```powershell
rg -n "coverage-note|function groupNote|groupNote\(group\)" "dist/Configuration center/buffet-rule.html"
rg -n "旧 KPOS 调研能力|覆盖结果|function capabilityView" "dist/Configuration center/buffet-rule.html"
```

Expected: the first command has no matches; the second command matches all three retained items.

- [ ] **Step 4: Verify inline JavaScript syntax**

Extract the final inline script to a temporary file and run:

```powershell
node --check <temporary-script-path>
```

Expected: exit code 0 with no syntax error.

- [ ] **Step 5: Verify in the browser**

Open `Configuration center/buffet-rule.html?embedded=1`, reload the page, and confirm:

- No yellow or blue explanatory panel appears under a group title.
- The rule table starts immediately after the group title.
- “旧 KPOS 调研能力” and “覆盖结果” remain visible.

- [ ] **Step 6: Commit the implementation**

```powershell
git add -- "admin-web/dist/Configuration center/buffet-rule.html" "admin-web/docs/superpowers/plans/2026-09-06-remove-buffet-coverage-notes.md"
git commit -m "fix: remove buffet coverage notes"
```
