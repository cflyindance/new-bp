# Payroll employee edit modal

## Goal

Replace the payroll workspace's inline employee identity editor with the user-provided modal design while preserving the existing ADP ID, Employee SSN, and Hire Date data model, draft tracking, change summary, and final save behavior.

This specification supersedes only the inline-edit statement in `2026-08-06-payroll-screenshot-ui-interactions-design.md`. All other payroll redesign requirements remain unchanged.

## Entry point and presentation

- The existing Edit action in the dark employee summary card opens a centered modal instead of expanding fields below the card.
- The modal uses a dimmed gray page overlay and a compact white surface matching the supplied screenshot.
- The header contains, from left to right, a close button, the title `编辑员工信息`, and a primary `Confirm` button.
- The body contains the existing fields in this order:
  1. ADP ID with its existing help affordance.
  2. Employee SSN.
  3. Hire Date with its existing help affordance and date picker.
- The current employee values populate the fields every time the modal opens.
- Move only the three existing inputs and the ADP ID and Hire Date help controls into the static modal DOM.
- Remove the old inline editor from the visible workspace layout, but preserve the non-visual compatibility nodes `#ws-employee-switch`, `#ws-employee-role-tag`, and `#ws-breadcrumb-period` as hidden hooks because current rendering and navigation code still consumes them.

## Data and save semantics

- Keep the existing field IDs and value conversions used by payroll draft handling.
- Opening the modal captures a snapshot of the three current draft values.
- Editing the fields may update the in-memory workspace draft so existing derived rendering and dirty-state behavior continue to work.
- Pressing `Confirm` accepts the three current values into the workspace draft and closes the modal.
- `Confirm` does not persist the employee, mark payroll confirmed, or bypass the existing change-summary dialog.
- The page-level `确定并保存` action remains the only final commit path and continues to show the existing change summary before saving.

## Cancellation and dismissal

- The header close button, overlay click, and Escape key all cancel the modal edit.
- Cancellation restores the ADP ID, Employee SSN, and Hire Date values captured when the modal opened, then resynchronizes the workspace draft and derived displays.
- Cancellation must not discard unrelated payroll edits that existed before the modal opened.
- Dismissal is idempotent: only an open modal can restore its snapshot, and closing it multiple times cannot overwrite later edits.

## Validation and accessibility

- Preserve the existing SSN input mode, placeholder, and length behavior.
- Preserve the native date input and current ISO-to-display conversion path.
- The modal uses `role="dialog"`, `aria-modal="true"`, and an accessible title relationship.
- Focus moves to ADP ID after opening.
- While the modal is open, background content is non-interactive and focus is contained within the modal with Tab and Shift+Tab wrapping between its focusable controls.
- Escape closes the modal with cancellation semantics.
- Closing returns focus to the Edit trigger when it still exists.
- Keyboard users can reach the close button, all three fields, the visible ADP ID and Hire Date help controls, and Confirm in a predictable order.

### Nested field help

- Opening a field-help dialog from the employee edit modal keeps the employee edit modal open and preserves its snapshot.
- Escape and close actions affect only the topmost dialog. If field help is open, the first Escape closes field help and returns focus to the originating help control; a later Escape may cancel the employee edit modal.
- The background remains non-interactive until all modal layers are closed.

## Responsive behavior

- Use the screenshot's approximately 500 px desktop width, constrained by the viewport with safe horizontal margins.
- The body remains vertically scrollable if viewport height is limited.
- On narrow screens, the modal fills most of the available width without introducing horizontal overflow.

## Implementation boundaries

- Reuse the existing modal overlay conventions and payroll localization mechanism.
- Do not create a separate employee-save API or duplicate payroll persistence state.
- Do not rename the existing identity field IDs or change the employee snapshot/diff schema.
- Do not change employee switching, attendance, adjustment, ADP export, or payroll calculation behavior.

## Acceptance criteria

1. Clicking Edit opens the new modal with the selected employee's current ADP ID, SSN, and hire date.
2. Confirming a change closes the modal and makes it appear in the existing page-level save summary.
3. Before the page-level save completes, persisted employee data is unchanged.
4. Closing by X, overlay, or Escape restores only the three modal fields to their open-time values.
5. Reopening the modal after Confirm shows the accepted draft values; reopening after Cancel shows the restored values.
6. The page no longer exposes the old inline identity editor, while the three compatibility hooks remain present and workspace rendering does not throw.
7. While the employee edit modal is open, pointer and keyboard interaction cannot reach background controls, and focus wraps within the modal.
8. Closing returns focus to Edit; dialog role, modal state, and accessible title are exposed correctly.
9. A field-help dialog closes before its parent on Escape and restores focus without discarding employee edits.
10. At narrow width the modal fits without horizontal overflow; at low height the body scrolls while header actions remain reachable.
11. Existing payroll calculations, dirty-state warnings, and page-level save behavior continue to pass verification.
