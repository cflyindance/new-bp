# Payroll workspace reference-style restoration

## Goal

Restore the payroll workspace to the user-provided full-page reference while keeping the existing TipOut sidebar and account header visible. Treat the screenshot as the visual specification for the workspace content area, not for the global application shell.

This specification refines the presentation requirements in `2026-08-06-payroll-screenshot-ui-interactions-design.md`. It does not replace the employee edit modal specification or any existing payroll business behavior.

## Scope and shell boundary

- Keep the fixed left navigation, top account header, mobile menu behavior, and their dimensions unchanged.
- Apply the restoration only while `payroll-workspace-active` is present.
- Period and employee list views retain their current appearance.
- The workspace fills the available main-content width instead of emulating a fixed 1686 px canvas or scaling the page.
- The workspace remains usable inside the narrower area created by the persistent sidebar.

## Workspace canvas

- Present the workspace as one continuous white rounded canvas over the application's light-gray content background.
- Visually join the existing workspace top bar, filter bar, and scrollable main panel so they read as one surface without gray seams or nested-card framing.
- Use compact edge padding comparable to the reference: approximately 20–24 px on desktop, decreasing to 12–16 px at narrower widths.
- Preserve the current internal scrolling behavior so the global account header and sidebar remain stable.
- Keep the native workspace scrollbar subtle and aligned at the canvas's right edge.

## Header, actions, and filters

- Place the localized payroll title at the upper left with the three current actions aligned at the upper right.
- Remove the visible eyebrow from this workspace presentation.
- Style the ADP export, Employees Detail, and Confirm & Save controls as compact reference-style buttons with small line icons, soft-gray secondary fills, and the existing blue primary action.
- Keep all existing action IDs, menus, disabled states, and click behavior.
- Place Store, Year, and Period triggers on the row below the title as rounded light-gray pills.
- Maintain current Store, Year, and Period selection and dirty-state behavior.
- Truncate the Store value with an ellipsis before it can push Year or Period out of the row.

## Employee summary card

- Use a full-width dark charcoal card with a 12–14 px radius and minimal shadow.
- Preserve the current employee identity, metadata, pay-period, salary, hours, and paycheck fields.
- Keep the avatar, employee name, and role at the upper left; keep Update Data, Edit, and Switch at the upper right.
- Add the reference's restrained vertical light panels and subtle texture without reducing text contrast.
- Keep metadata compact on a single wrapping line and place the three main metrics below it with thin vertical separators.
- Preserve the existing employee edit and switch dialogs and all current action semantics.

## Attendance details summary

- Place `Attendance Details` immediately after the employee card.
- Render the three existing summary groups as equal-width, flat light-gray panels on desktop.
- Match the reference's compact icon badge, title row, muted labels, tabular right-aligned values, 12 px radius, and no heavy shadow.
- Preserve the current summary field structure and calculations even where the reference contains different sample labels such as OT3.

## Attendance table

- Place the two-week attendance table after the summary cards and before Manage Payroll.
- Use a rounded light-gray strip for each week summary, followed by a borderless table header and rows separated only by subtle horizontal rules.
- Keep existing attendance fields, paid/unpaid break semantics, editable inputs, add/remove controls, calculations, and field-help behavior.
- Make inactive inputs visually read as plain table text; retain visible hover, focus, invalid, and dirty states.
- Use stable column widths and tabular figures. If the persistent sidebar leaves insufficient width, scroll the table horizontally rather than collapsing columns.

## Manage Payroll form

- Place Manage Payroll after both attendance weeks.
- Display groups in reference order: Tips and service fees, Additional income, Deductions and benefits, Meal compliance and Exempt.
- Use a small muted group caption above each flat light-gray group surface.
- Use two columns for the first two groups and four columns for the latter two at wide widths, with consistent white inputs, 1 px neutral borders, and 10–12 px radii.
- Preserve all existing `adj-*` IDs, help controls, draft state, diff output, and final save behavior.
- Collapse to two columns and then one column at narrower breakpoints.

## Localization and data

- The reference controls visual style only; displayed copy continues to follow the current payroll locale.
- Do not hard-code the reference's employee, dates, period number, rates, hours, or salary values.
- Do not add OT3 or alter the existing payroll field structure merely to match sample content.

## Responsive behavior

- At desktop widths, maintain the reference hierarchy and three-card/two-or-four-column layouts within the available content area.
- At intermediate widths, allow action wrapping, reduce gaps, use two-column form groups, and retain the employee card's hierarchy.
- At narrow widths, stack title/actions, summary cards, and form fields; preserve attendance with horizontal scrolling.
- Do not hide or resize the global sidebar or account header as part of this work.

## Acceptance criteria

1. Entering the payroll workspace leaves the sidebar and account header visible.
2. The right-side workspace reads as a single white rounded canvas matching the reference's hierarchy and density.
3. Header actions, filter pills, employee card, three summary panels, attendance weeks, and Manage Payroll groups appear in the reference order.
4. No gray seam separates the header, filters, and scrollable workspace body.
5. The Manage Payroll groups appear in the specified reference order and grid sizes.
6. Existing employee editing, employee switching, menu, attendance editing, export, dirty-state, and save flows remain functional.
7. Existing payroll IDs, calculations, localization, and persisted data shapes remain unchanged.
8. Desktop visual comparison confirms spacing, radii, colors, and typography; intermediate and narrow checks confirm wrapping and horizontal table scrolling.
9. JavaScript syntax, TypeScript, the payroll structural verifier, and browser console checks pass.
