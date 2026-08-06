# Payroll screenshot UI and interaction redesign

## Goal

Update the payroll workspace to match the eight user-provided screenshots while preserving the existing payroll field IDs, calculations, dirty-state protection, save confirmation, TipOut synchronization, ADP export, Employees Detail, and employee refresh behavior.

## Scope

The redesign covers:

1. The workspace header, filters, employee summary, and attendance summary cards.
2. The two-week attendance table.
3. The Manage Payroll adjustment form.
4. Custom Store, Year, Period, and ADP menus.
5. The employee-and-role switch dialog.

Period and employee list views outside the payroll workspace are not redesigned.

## Workspace header and filters

- Show `Payroll Management` on the left.
- Place Export ADP Report, Employees Detail, and Confirm & Save on the right.
- Confirm & Save reuses the existing `confirm-employee` action and save-diff modal.
- Remove the fixed bottom save bar after its save action is available in the header.
- Render Store, Year, and Period as compact gray trigger pills below the title row.
- Preserve the existing selected store, year, and period state and navigation behavior.

### Store picker

- Open a white floating panel anchored to the Store trigger.
- Include a search input and a single-select store list.
- Each item shows store name and address, with the active store highlighted in pale blue.
- Search filters name and address locally.
- Selecting a store uses the existing unsaved-workspace confirmation path.
- Closing the panel or cancelling a dirty-state confirmation leaves the current store unchanged.

### Year and Period pickers

- Use scrollable white menus with radio-style selection.
- Highlight the current item in pale blue.
- Mark the current payroll period with a `Now` badge when applicable.
- Selection reuses existing period navigation and dirty-state protection.
- Escape and outside click close the menus without changing state.

### ADP menu

- Use the screenshot's larger white dropdown surface.
- Include Export Current ADP and Batch Export ADP.
- Use pale blue hover/focus/active feedback.
- Keep current export readiness, dirty-state, and missing-ADP validation behavior.

## Employee summary

- Keep the existing dark employee card.
- Display avatar, name, role, employee/ADP identity, SSN, hire date, pay-period range, paycheck, total salary, and total hours.
- Move Update Data, Edit, and Switch into the card's upper-right action area.
- Update Data reuses `refresh-employee-data` and its confirmation flow.
- Edit continues to reveal the existing identity inputs without changing their IDs.
- Switch opens the redesigned employee-and-role dialog.

## Employee-and-role switch dialog

- Present a centered modal with a store summary, employee column, role column, Close, and Confirm.
- Employee selection updates the available roles in the right column but does not switch the workspace immediately.
- Confirm remains disabled until a valid employee and role are selected.
- Confirm applies the employee switch through the existing navigation path and applies the selected role to the workspace display state.
- Close, overlay click, and Escape cancel the pending selection.
- If the current workspace is dirty, the existing unsaved-change confirmation is required before the switch is committed.
- The dialog supports scrolling and an explicit empty state when no employees or roles are available.

## Attendance summary cards

- Replace the current Pay Period Summary visual treatment with the screenshot's `Attendance Details` section.
- Preserve the current three-card field structure and all existing calculated values; only the presentation changes.
- Use three light-gray cards with compact icons, left-aligned labels, and tabular right-aligned values.
- Do not introduce OT3 or change calculation semantics merely because the screenshot contains different sample labels.

## Attendance table

- Keep the two existing week groups.
- Render each week header as a rounded light-gray information strip containing the week range and existing week totals.
- Present rows as a flat table with subtle horizontal dividers and no outer card border.
- Preserve Date, In/Out, paid/unpaid meal breaks, Rate, Regular, OT, OT rate, OT2, and OT2 rate fields.
- Existing inputs remain editable, but their borders are visually suppressed at rest.
- Hover, focus, invalid, and dirty states restore clear input affordances and visible focus rings.
- Existing add/remove In/Out controls remain available and become visible on row hover or keyboard focus.
- On narrow screens, keep the table readable through horizontal scrolling rather than compressing columns beyond usability.

## Manage Payroll form

- Replace the current independent mini-cards with four screenshot-aligned form groups:
  1. Tips and service fees: SVCW, Tips.
  2. Additional income: Incentive, Sick Hours.
  3. Deductions and benefits: Child sup, Med Ded, Eee 40%, Eer 60%.
  4. Meal compliance and Exempt: Breakfast, Lunch, Dinner, Exempt.
- Preserve every existing `adj-*` input ID, value type, field help, draft update, diff generation, and save behavior.
- Use light-gray group surfaces, two- or four-column grids, white inputs, subtle borders, and consistent label/help alignment.
- Adapt to two columns and then one column at narrower breakpoints.

## Interaction and accessibility

- All custom menu triggers expose expanded state and menu relationships.
- Menus and dialog controls remain keyboard reachable with visible focus rings.
- Escape closes the active menu or dialog.
- Outside click closes Store, Year, Period, and ADP menus.
- Modal focus is placed on the first meaningful control and returned to the Switch trigger on close.
- Loading, disabled, empty, and error states use existing notification and state mechanisms.
- Chinese and English labels are updated together.

## Implementation constraints

- Work in the existing vanilla HTML/CSS/JavaScript stack.
- Preserve business-critical element IDs and delegated action names.
- Prefer HTML grouping and CSS changes, with minimal JavaScript adapters for custom menus and the two-stage employee/role selection.
- Do not rewrite payroll calculation, export, synchronization, or persistence pipelines.
- Preserve unrelated worktree changes.

## Verification

- Static verifier checks new structural hooks, required existing IDs, and unique business field IDs.
- JavaScript and i18n files pass `node --check`.
- TypeScript passes `tsc --noEmit`.
- Browser checks cover:
  - 1440px desktop layout against the references.
  - 760px responsive layout and attendance horizontal scrolling.
  - Store search and selection.
  - Year and Period selection, current-item feedback, outside click, and Escape.
  - ADP menu visibility and both actions.
  - Employee/role staged selection, disabled Confirm, cancel, and confirmed switch.
  - Borderless attendance editing, focus state, and In/Out controls.
  - Header save action and existing save confirmation.
  - No new browser console errors.

