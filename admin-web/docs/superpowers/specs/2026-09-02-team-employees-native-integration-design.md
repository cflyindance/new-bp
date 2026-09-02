# Team Employees Native Integration Design

## Objective

Replace the `/team/roles-employees` TipOut iframe with a page mounted directly by the admin-web application. Both the “员工” and “岗位” tabs must remain fully functional while the main application sidebar, account header, route state, and scroll behavior remain owned by the main shell.

## Scope

The native page includes:

- employee and role tabs;
- store filtering;
- employee and role tables;
- create, edit, and delete flows;
- employee grouped form navigation and validation;
- role assignment and occupied-employee behavior;
- all existing dialogs, dropdowns, help content, and confirmation flows;
- compatibility with the current TipOut roster, role, scope, and custom-event contracts.

The change does not redesign the workflows, rename storage keys, migrate data, or rewrite other TipOut pages.

## Architecture

### Shell integration

`src/main.ts` replaces `renderTeamRolesEmployeesIframePanel()` with a native panel renderer. The panel owns one vertical scroll container and exposes a `data-team-employees-root` mount node. Route setup mounts the employees page after the shell DOM is rendered and destroys the previous mount before navigation or rerender.

The main shell continues to render:

- the application sidebar;
- the top account bar;
- route navigation and access control;
- the content-area boundary and scroll owner.

No code on this route may create an iframe or navigate to `TipOut/employees.html`.

### Native page module

`src/team/employees-page.ts` owns the mount lifecycle. It attaches a shadow root, inserts the extracted employee/role template and scoped styles, starts the legacy-compatible runtime, and returns a `destroy()` function.

The Shadow DOM boundary is intentional. The source page uses broad selectors such as `.layout`, `.header`, `.card`, `.modal`, and `.btn`; isolation prevents those selectors from changing the main shell and prevents application styles from changing the employee forms.

### Template and styles

`src/team/employees/employees-template.html` contains only the functional page body:

- tabs;
- action bar and store selector;
- employee and role panels;
- every modal required by the current workflows.

It excludes the standalone TipOut document, sidebar, mobile overlay, header, and script/link tags.

The extraction removes inline event attributes. In particular, both controls that currently call `closeModal('addEmployeeModal')` are assigned stable `data-action` hooks and bound through the page runtime. No extracted control may depend on resolving a function name against the real browser `window`. Browser verification must exercise both the employee dialog close icon and cancel button.

`employees-page.css` is copied from the current `dist/TipOut/employees.css` and adapted only where required for the host content area. Shared declarations required from `common.css` are included in the isolated stylesheet. A small `employees-shell.css` layer defines the host page height, responsive width, modal stacking, and scroll behavior without changing business-facing visual semantics.

### Runtime isolation

The current runtime dependencies are copied as text assets under `src/team/employees/legacy/`:

- `common.js`;
- `global-scope-filter.js`;
- `ruleData.js`;
- `employees-field-help.js`;
- `employees.js`.

`employees-legacy-runtime.ts` evaluates them against a controlled page environment whose document queries resolve inside the page shadow root. It exposes only the browser capabilities needed by the current scripts.

The runtime lifecycle tracks and releases:

- `window` and document event listeners;
- timers and animation frames;
- open dropdowns and modal overlays;
- runtime-created global properties;
- page callbacks created during mounting.

Repeated route entry must not duplicate handlers or render duplicate rows.

Lifecycle verification is behavioral, not a token scan. The runtime harness instruments `addEventListener`, `removeEventListener`, `setTimeout`, `setInterval`, `requestAnimationFrame`, and their cleanup counterparts. After `destroy()`, listener and timer ownership must balance; dispatching the previously observed window/document events must produce no DOM mutation, storage write, or callback invocation.

## Data Compatibility

The native page preserves all existing storage keys and payload shapes used by `employees.js`, `ruleData.js`, Payroll, and the main application roster adapter. The compatibility fixture explicitly covers `tipout-employees-roster-v1`, `tipout-employee-role-options-v1`, `tipout-employee-role-hidden-system-v1`, and `tipout-employee-role-meta-v1`; tab persistence through `tipout-employees-page-tab` remains session-scoped. It continues to dispatch and listen for `tipout-roster-updated`, `storage`, and existing global-scope events.

The page calls the main application’s existing store-scope preparation before mount. Store aliases and suppressed roster aliases continue to be resolved through the copied `TipOutGlobalScopeFilter` contract. No one-time migration is introduced.

Employee changes must remain visible to the native Payroll page without reload beyond the event behavior already supported by the application.

The round-trip fixture includes a multi-role employee, custom role metadata, a hidden system role, canonical and suppressed store aliases, and create/edit/delete mutations. It asserts exact stored payload shapes, event propagation, and Payroll visibility without an application reload. Opening the page with malformed values must leave their raw stored strings byte-for-byte unchanged.

## Interaction and Layout

- The main application content area is the only page-level vertical scroll owner.
- Mouse wheel, trackpad, scrollbar drag, Page Up/Down, Home, and End work when the pointer is over tables or forms.
- Wide employee tables may scroll horizontally inside their table wrapper without creating document-level horizontal overflow.
- Dialog bodies scroll independently only when their content exceeds the viewport; their headers and action rows remain reachable.
- At desktop widths, employee and role tables retain their current column structure.
- At narrower supported widths, controls wrap without clipping and dialogs remain within the viewport.
- Focus returns to the triggering control when a dialog closes when the current runtime provides a trigger reference; Escape and close buttons retain existing behavior.

## Error Handling

- Runtime assets use Vite static raw imports. A missing source asset is therefore a compile/build failure. Evaluation or initialization failures that occur after module loading run cleanup and render a concise in-panel error instead of leaving a blank content area.
- Malformed stored employee or role data follows the existing fallback behavior and does not overwrite the stored value merely by opening the page.
- Runtime initialization is atomic: a partial failure runs cleanup before the error state is rendered.
- CRUD validation and user-facing messages remain behaviorally compatible with `employees.html`.

## Verification

Automated checks must prove:

1. `/team/roles-employees` contains a native mount root and no iframe or `employees.html` URL.
2. The extracted template includes both tabs, both tables, and every required modal.
3. All copied runtime assets exactly match their current `dist/TipOut` sources.
4. An instrumented lifecycle test proves listener/timer/animation-frame ownership is balanced and proves post-destroy events cause no callback, DOM, or storage effects.
5. TypeScript compilation and the production Vite build pass.

Browser verification must cover:

1. the main sidebar and account header remain visible;
2. both tabs switch correctly;
3. store filtering works;
4. employee create/edit/delete and validation work;
5. role create/edit/delete and occupied-role constraints work;
6. the four persistent storage keys and the session tab key pass the defined multi-role, role-metadata, hidden-role, alias-filter, CRUD-event, malformed-value, and Payroll-without-reload round trip;
7. wheel and keyboard scrolling work at desktop and compact viewport sizes;
8. repeated navigation away and back does not duplicate rows, dialogs, or handlers;
9. both the employee dialog close icon and cancel action close the dialog without real-window inline handlers;
10. no iframe exists and no browser console errors are emitted during these flows.

## Delivery Boundary

The source of truth moves to `src/team/employees/` for the main application route. `dist/TipOut/employees.html` remains available for other legacy consumers but is no longer loaded by `/team/roles-employees`.
