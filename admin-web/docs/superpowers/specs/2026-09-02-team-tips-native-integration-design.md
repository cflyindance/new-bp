# Team Tips Native Integration Design

## Objective

Replace every iframe-backed Team Management tip workflow with native content mounted by the admin-web application. The migration covers allocation summary, allocation details, rule management, and the rule editor while preserving the existing TipOut behavior, data, calculations, exports, employee/Payroll integration, and visual structure.

## Routes

The main application owns these routes:

- `/team/tips/distribution` — allocation summary extracted from `TipOut/index.html`;
- `/team/tips/details` — allocation details extracted from `TipOut/detail.html`;
- `/team/tips/rules` — rule list extracted from `TipOut/rules.html`;
- `/team/tips/rules/editor` — create/edit rule view extracted from `TipOut/rule-add.html`.

Hash-route query parameters preserve the current standalone-page inputs. Detail navigation carries the selected allocation date, shift, store, or identifier. Rule-editor navigation preserves `poolKind`, rule type, edit identifier, and every existing query parameter consumed by `rule-add.html`. Back actions return to the corresponding native summary or rule route without loading a standalone HTML document.

`/team/tips` continues to normalize to `/team/tips/distribution`.

## Shell Integration

`src/main.ts` removes `TEAM_TIPS_DISTRIBUTION_IFRAME_SRC`, `TEAM_TIPS_DETAILS_IFRAME_SRC`, `TEAM_TIPS_RULES_IFRAME_SRC`, `getTeamTipsManagementIframeSrc()`, and `renderTeamTipsManagementIframePanel()`. It renders one native content root with a main-shell-owned vertical scroll container.

The main application continues to own and display:

- the left navigation;
- the top account and scope controls;
- authorization and route normalization;
- page-level vertical scrolling;
- locale and current store scope.

No native tip route may create an iframe or request `index.html`, `detail.html`, `rules.html`, or `rule-add.html` from `dist/TipOut`.

## Module Architecture

### Page host

`src/team/tips-page.ts` owns the mount lifecycle. It receives the normalized tips route and query, attaches a Shadow DOM root, selects the matching template/controller, loads shared styles, starts the controlled legacy runtime, and returns a `destroy()` handle.

Only one tips view is mounted at a time. Route changes destroy the previous runtime before replacing markup. Re-entering or switching among the four routes must not duplicate rows, dialogs, calculations, exports, event handlers, or storage writes.

### Templates

Four generated templates live under `src/team/tips/templates/`. Each includes only the functional content region, drawers, and modal overlays required by its source page. They exclude the standalone TipOut document shell, sidebar, top header, mobile sidebar controls, script/link tags, and inline navigation to standalone HTML files.

Inline handler attributes are removed during extraction. Stable `data-action` hooks are introduced for any interaction previously resolved against the real browser `window`; these hooks are bound through the controlled runtime.

The same rule applies to markup created after mount. The generation step rewrites statically discoverable handler fragments inside page scripts to stable action descriptors, and the runtime installs a delegated action adapter on the active page root for action families created through `innerHTML`. A development assertion observes added nodes and fails verification when an executable inline attribute remains. Coverage includes summary edit/navigation actions, detail shift/table actions, rule-list edit/delete/toggle actions, and rule-editor condition/group/payment/status controls.

### Styles

Shared declarations from `common.css` and `prototype-fidelity.css` are loaded inside the Shadow DOM. Root variables are mapped from `:root` to `:host`. A small host stylesheet defines content padding, table horizontal scrolling, modal/drawer bounds, responsive wrapping, and main-shell scroll behavior.

Broad TipOut selectors remain isolated and cannot style the main application sidebar, header, dialogs, or buttons.

### Shared runtime

The runtime consumes synchronized raw copies of:

- `common.js`;
- `global-scope-filter.js`;
- `ruleData.js`;
- `personalSalesDeduct.js`;
- `tipAllocation.js`;
- `attendanceMock.js`;
- `tipout-summary-ui.js`;
- `tipout-payroll-bridge.js`;
- `orderTipStatus.js`;
- `paymentMethodApportion.js`;
- `export.js`.

Page-specific inline scripts are extracted from the four HTML sources into generated raw assets and evaluated after their required shared dependencies. The exact page execution order is:

- summary: `common.js`, `tipout-summary-ui.js`, `ruleData.js`, `personalSalesDeduct.js`, `tipAllocation.js`, `attendanceMock.js`, `tipout-payroll-bridge.js`, the summary inline program, then `export.js`;
- details: `common.js`, `ruleData.js`, `personalSalesDeduct.js`, `tipAllocation.js`, `attendanceMock.js`, then the detail inline program;
- rules: `common.js`, `ruleData.js`, then the rules inline program;
- editor: `common.js`, `ruleData.js`, `orderTipStatus.js`, `paymentMethodApportion.js`, `personalSalesDeduct.js`, `tipAllocation.js`, then the rule-editor inline program.

The generator records the ordered script inventory for each source page and fails when a dependency is missing, reordered, added, or removed. Exact-copy checks cover all eleven shared assets plus the four extracted inline programs.

The controlled environment proxies document lookup into the active Shadow DOM and exposes only the required browser APIs. It provides tracked window/document listeners, timeouts, intervals, animation frames, mutation/action delegation, and dynamically created overlays. `destroy()` aborts listeners, disconnects observers, clears scheduled work (including delayed navigation), removes generated overlays, restores body overflow state, and drops runtime globals.

Export behavior has an explicit host bridge. Styles and page-local nodes still target the Shadow DOM, while approved external-library `<script>` nodes used by `export.js` are appended to the real document head and tracked until load or cleanup. Download anchors are attached to a temporary real-document container, clicked, and removed. PDF/CSV/print globals are injected back into the controlled runtime only after successful load. Print windows use the real `window.open` contract and receive fully serialized page styles/content; cancellation or popup failure retains the current error behavior. Verification checks exported row values, filename, temporary-node cleanup, external-library failure, and printable content rather than only the existence of an export button.

## Navigation Adapter

The runtime intercepts assignments and link targets for:

- `index.html` → `/team/tips/distribution`;
- `detail.html?...` → `/team/tips/details?...`;
- `rules.html` → `/team/tips/rules`;
- `rule-add.html?...` → `/team/tips/rules/editor?...`.

It updates the admin-web hash route and dispatches the application navigation event instead of assigning the real top-level location. Unknown or external URLs are not silently rewritten.

Each view receives virtual navigation objects. `location.search` is derived from the query inside the current hash route, not from the outer document URL. `history.state` is stored under a Team Tips namespace, `pushState`/`replaceState` update only that namespace and route, and `history.back()` returns to the recorded native tips parent without escaping Team Management. Direct deep links and refresh reconstruct the same virtual query and state.

`window.scrollY`, `pageYOffset`, `scrollTo`, and `scrollBy` map to the main tips scroll container. Summary-to-detail navigation records the summary route, filter state, and scroll position; detail back restores them. Editor save/cancel returns to the recorded rule-list route. Timed navigations are registered with the runtime timer owner and cannot fire after destroy.

## Data and Integration Compatibility

All existing TipOut storage keys and payload shapes remain unchanged. This includes rule data, allocation snapshots, allocation/detail shift state, personal-sales deductions, employee roster references, attendance fixtures, page filters, and editor drafts currently read by the four source pages.

The runtime preserves existing custom events and storage listeners. It uses the main application scope context for current store reads, store option lists, store changes, canonical roster aliases, and suppressed aliases. Employee updates remain visible to tips views, and saved tip allocation/rule results remain visible to Payroll through the current bridge without an application reload.

No migration runs merely by opening a view. Malformed stored values follow the existing fallback behavior and remain byte-for-byte unchanged until the user performs an explicit save action.

Compatibility fixtures cover:

- rule create/edit/delete and enabled state;
- role and employee targets, including multi-role employees;
- fixed, percentage, points, and existing deduction/allocation conditions;
- allocation summary-to-detail identity and totals;
- store aliases and all-store scope;
- employee roster update propagation;
- Payroll bridge visibility;
- CSV/print export inputs and filenames;
- malformed persistent values.

## Interaction and Layout

- The main content container is the single page-level vertical scroll owner.
- Wide tables scroll horizontally within their table wrapper without document-level horizontal overflow.
- Modal and drawer bodies scroll locally when necessary, while their title and action regions remain reachable.
- Mouse wheel, trackpad, scrollbar drag, Page Up/Down, Home, and End work over tables and forms.
- Summary-to-detail, rule-list-to-editor, save, cancel, and back navigation preserve route/query state.
- The views remain usable at desktop widths and at `1440x900` and `1024x768` compact viewports.
- Focus, Escape, close, cancel, validation, confirmation, loading, empty, and error states remain behaviorally compatible with the standalone pages.

## Error Handling

- Missing statically imported raw assets fail TypeScript/Vite compilation.
- Page-script inventory mismatches fail the generation/verification scripts.
- Runtime evaluation or initialization failure cleans up partial ownership and renders a concise error state inside the tips content area.
- Invalid route/query values fall back to the corresponding existing page default without overwriting stored data.
- Calculation and export errors retain the existing user-facing error behavior and do not leave the route in a partially mounted state.

## Verification

Automated verification must prove:

1. the four native routes map to a native root and no tips iframe constants/renderers remain;
2. every template contains its required functional regions and excludes standalone shell/script/link/inline-navigation markup;
3. all shared runtime copies and extracted page scripts match the current TipOut sources;
4. route rewriting covers all four standalone HTML destinations, virtual `location.search`, namespaced history state/back, shell scrolling, delayed-navigation cancellation, and query preservation;
5. listener/timer/animation-frame/mutation-observer ownership balances after destroy and post-destroy events cause no navigation, DOM, or storage effects;
6. the compatibility fixtures cover rule, allocation, detail, employee, Payroll, scope, export, and malformed-data contracts;
7. TypeScript and production Vite builds pass.

Browser verification must cover:

1. main sidebar, account header, scope controls, and active tips navigation remain visible;
2. all four routes render without iframes or standalone HTML requests;
3. summary filters and allocation calculation work;
4. summary navigation opens the matching detail route and totals remain consistent;
5. rule creation, editing, enabling/disabling, occupied targets, validation, cancel, save, and deletion work;
6. rule changes affect allocation results exactly once;
7. employee changes appear in target selectors and tip results without application reload;
8. tip results remain visible to Payroll through the existing bridge;
9. CSV/PDF/print flows preserve row data, filenames, printable content, external-library loading/error behavior, and temporary-node cleanup;
10. repeated navigation across all four views does not duplicate UI, handlers, calculations, or writes;
11. scrolling, tables, drawers, dialogs, and responsive layouts work at the required viewport sizes;
12. direct deep links and refresh preserve detail/editor queries; summary → detail → back restores state and scroll; editor save/cancel returns to the native rule list;
13. dynamically rendered action families contain no executable inline attributes and all delegated actions work;
14. no tips-route console errors occur during the tested flows.

## Delivery Boundary

The main application routes use `src/team/tips/` as their source of truth. Existing files under `dist/TipOut` remain available for legacy consumers and as synchronization sources, but Team Management no longer loads their documents in iframes.
