# Payroll screenshot UI and interaction implementation plan

## Objective

Implement the approved screenshot-driven payroll workspace redesign without changing payroll calculations, persistence, exports, TipOut synchronization, or business field IDs.

## Tasks

1. Extend the structural verifier with required custom-picker, header-save, employee-role dialog, attendance, and Manage Payroll hooks.
2. Restructure `payroll.html`:
   - add custom Store/Year/Period triggers and menus while retaining native selects as state adapters;
   - move Confirm & Save into the header and Update/Edit/Switch into the employee card;
   - relabel the summary section as Attendance Details without changing its three-card fields;
   - regroup existing `adj-*` inputs into four screenshot-aligned form groups;
   - rebuild the employee picker markup as a staged employee-and-role dialog.
3. Adapt `payroll.js`:
   - render and synchronize custom filter menus;
   - manage menu open/close, outside click, Escape, search, and selection;
   - stage employee and authoritative role selection, validate Confirm, and commit through the existing dirty guard;
   - preserve transient role context without mutating payroll records;
   - update header and employee-card state rendering.
4. Add focused CSS overrides matching the references:
   - header/filter pills, dark employee card, summary cards;
   - flat borderless attendance table and focus/hover editing states;
   - grouped Manage Payroll surfaces;
   - custom dropdowns and employee-role modal;
   - desktop and narrow-screen layouts.
5. Add Chinese and English labels for all new controls and states.
6. Verify with `node --check`, the structural script, `tsc --noEmit`, and browser checks at 1440px and 760px covering menus, modal staging, editing, and console errors.

## Guardrails

- Preserve existing IDs used by payroll logic.
- Preserve unrelated worktree changes.
- Do not run the full generated build if it would overwrite pre-existing dirty build artifacts; use no-write type checking and direct browser validation instead.
