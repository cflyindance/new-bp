# Payroll Dual Detail Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add detailed/compact employee payroll views with remembered A4 pagination and a complete detail-version × PDF/CSV/email export flow.

**Architecture:** Extend the existing normalized payroll detail payload once, render both views from it, and introduce a single A4 page builder used by print, PDF, and simulated email PDF. Keep standalone TipOut sources authoritative and regenerate the native Team Payroll template, CSS, and legacy runtime copies after each source change.

**Tech Stack:** Vanilla JavaScript/CSS/HTML, html2canvas, jsPDF, TypeScript/Vite Shadow DOM wrapper, Node.js assertions, headless Chromium PDF verification.

**Spec:** `docs/superpowers/specs/2026-09-03-payroll-dual-detail-export-design.md`

## Global Constraints

- Detailed payroll markup and detailed CSV schema remain backward compatible.
- Compact Paid Break values merge into Regular; detailed output keeps Paid Break separate.
- Print, PDF, and email PDF use the same pre-paginated A4 DOM.
- A4 pages are 210mm × 297mm with 8mm application margins and no break after the final page.
- CSV never applies print pagination.
- `printPagination` persists under `menusifu.payroll.detail.print-pagination.v1`; unknown values fall back to `fit-one-page`.
- Existing simulated email behavior remains simulated; no real email API or attachment upload is introduced.

---

### Task 1: Normalize compact payroll detail data

**Files:**
- Modify: `dist/TipOut/payroll.js`
- Create: `scripts/verify-payroll-compact-detail.mjs`

**Interfaces:**
- Consumes: existing `buildDetailExportPayload(emp, period)` inputs.
- Produces: payload fields `weeks[].days[].clockPairs`, `weeks[].days[].compactClockPairs`, `remainingClockPairCount`, `compactRegularHours`, `compactRegularAmount`, `storeName`, and `storeAddress`.

- [ ] **Step 1: Write failing payload assertions**

Create a VM-based focused verifier that loads the extracted pure payload helpers and asserts:

```js
assert.equal(payload.compactRegularHours, payload.regularHours + payload.paidBreakHours);
assert.equal(payload.compactRegularAmount, payload.regularAmount + payload.paidBreakAmount);
assert.equal(payload.compactRegularHours + payload.otHours + payload.ot2Hours, payload.totalHours);
assert.equal(payload.weeks[0].days[0].clockPairs.length, 4);
assert.equal(payload.weeks[0].days[0].compactClockPairs.length, 3);
assert.equal(payload.weeks[0].days[0].remainingClockPairCount, 1);
```

The fixture must include 14 dates, one day with four clock pairs, Paid Break, long store address, Regular/OT/OT2, tips, and service charge.

- [ ] **Step 2: Run RED**

Run: `node scripts/verify-payroll-compact-detail.mjs`

Expected: FAIL because compact payload fields do not exist.

- [ ] **Step 3: Extend the payload once**

Add a pure adapter used by `buildDetailExportPayload`:

```js
function buildCompactPayrollDetailData(payload) {
  return {
    ...payload,
    compactRegularHours: payload.regularHours + payload.paidBreakHours,
    compactRegularAmount: payload.regularAmount + payload.paidBreakAmount,
    weeks: payload.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        compactClockPairs: day.clockPairs.slice(0, 3),
        remainingClockPairCount: Math.max(0, day.clockPairs.length - 3),
      })),
    })),
  };
}
```

Preserve the complete `clockPairs` array for detailed output and CSV.

- [ ] **Step 4: Run GREEN**

Run: `node scripts/verify-payroll-compact-detail.mjs`

Expected: PASS for totals, Paid Break mapping, weeks, and excess clock pairs.

- [ ] **Step 5: Commit**

```bash
git add dist/TipOut/payroll.js scripts/verify-payroll-compact-detail.mjs
git commit -m "feat: normalize compact payroll detail data"
```

---

### Task 2: Add detail tabs, compact A4 preview, and remembered pagination

**Files:**
- Modify: `dist/TipOut/payroll.html`
- Modify: `dist/TipOut/payroll.css`
- Modify: `dist/TipOut/payroll.js`
- Modify: `scripts/verify-payroll-compact-detail.mjs`

**Interfaces:**
- Consumes: compact payload from Task 1.
- Produces: `setPayrollDetailVariant("detail" | "compact")`, `readPrintPagination()`, `setPrintPagination("fit-one-page" | "paginate")`, and compact preview markup.

- [ ] **Step 1: Add failing DOM/static assertions**

Require the two tabs, two panels, pagination control, storage key, and exact compact sections:

```js
for (const token of [
  'data-detail-variant="detail"', 'data-detail-variant="compact"',
  'id="employeesDetailCompactBody"', 'data-print-pagination="fit-one-page"',
  'data-print-pagination="paginate"', 'menusifu.payroll.detail.print-pagination.v1',
  'payroll-compact-summary', 'payroll-compact-week', 'payroll-compact-signature'
]) assert.ok(source.includes(token), token);
```

- [ ] **Step 2: Run RED**

Run: `node scripts/verify-payroll-compact-detail.mjs`

Expected: FAIL on missing tabs and compact markup.

- [ ] **Step 3: Implement view state and rendering**

Initialize:

```js
const detailPresentation = {
  activeVariant: "detail",
  exportVariant: "detail",
  printPagination: readPrintPagination(),
  operationId: 0,
  busyOperation: null,
};
```

Render the compact preview from the Task 1 payload. Tab clicks update ARIA selected/hidden state and never mutate employee data. Pagination clicks persist only valid enum values; storage exceptions are caught and remain non-blocking.

- [ ] **Step 4: Implement responsive and print-neutral CSS**

Use A4-preview proportions, 10–12pt header text, 7–9pt tables, 7–8pt declaration text, fixed bottom controls, and a single scrollable modal body. At narrow widths, pagination controls occupy a full row and buttons wrap without clipping.

- [ ] **Step 5: Run GREEN and visual check**

Run: `node scripts/verify-payroll-compact-detail.mjs`

Open the native Payroll route, switch both tabs, refresh after choosing `paginate`, and assert the setting remains selected while the active tab resets only on a new mount.

- [ ] **Step 6: Commit**

```bash
git add dist/TipOut/payroll.html dist/TipOut/payroll.css dist/TipOut/payroll.js scripts/verify-payroll-compact-detail.mjs
git commit -m "feat: add compact payroll detail view"
```

---

### Task 3: Build deterministic A4 pages for print and PDF

**Files:**
- Create: `dist/TipOut/payroll-detail-pages.js`
- Modify: `dist/TipOut/payroll.html`
- Modify: `dist/TipOut/payroll-detail-export.js`
- Modify: `dist/TipOut/payroll.js`
- Create: `scripts/verify-payroll-detail-pages.mjs`

**Interfaces:**
- Consumes: `buildPayrollDetailPages(payload, variant, pagination, operation)`.
- Produces: `{ iframe, pages, cleanup }`, where `pages` are fully constructed `.payroll-a4-page` elements shared by direct print and per-page PDF capture.

- [ ] **Step 1: Write failing pagination tests**

Assert generated document CSS contains exact physical sizing and final-page handling:

```js
assert.match(html, /@page\s*{[^}]*size:\s*A4 portrait;[^}]*margin:\s*0/);
assert.match(html, /width:\s*210mm/);
assert.match(html, /height:\s*297mm/);
assert.match(html, /padding:\s*8mm/);
assert.match(html, /\.payroll-a4-page:last-child[^}]*break-after:\s*auto/);
```

Use a measured-layout adapter fixture to assert fit-one-page returns one page and paginate repeats week headings/table headers when a week spans pages.

- [ ] **Step 2: Run RED**

Run: `node scripts/verify-payroll-detail-pages.mjs`

Expected: FAIL because the page builder does not exist.

- [ ] **Step 3: Implement the offscreen iframe lifecycle**

Create a same-origin iframe with:

```css
position: fixed; left: -10000px; top: 0; width: 210mm; height: 297mm;
display: block; visibility: visible; opacity: 1; pointer-events: none;
```

Wait for `load`, `document.fonts.ready`, and all images before measurement. Never attach the document to the real page or Shadow DOM.

- [ ] **Step 4: Implement fit-one-page**

Measure at 194mm width, calculate:

```js
const scale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight) * 0.995;
```

Place one absolutely positioned scale layer in one fixed page. Reject if the post-scale bounding box exceeds the printable area.

- [ ] **Step 5: Implement paginate**

Pack the header/summary, week blocks, rows, and declaration/signature blocks into 281mm content height. Start an intact week on a fresh page when possible; split oversized weeks by rows, repeat headings, and place totals only on the final page of that week. Uniformly scale detailed wide-table wrappers to 194mm before vertical measurement.

- [ ] **Step 6: Route direct print and PDF through the builder**

Direct print calls the iframe window. PDF captures each page separately:

```js
for (let index = 0; index < pages.length; index += 1) {
  const canvas = await html2canvas(pages[index], captureOptions);
  if (index > 0) pdf.addPage("a4", "portrait");
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
}
```

Remove the old long-canvas slicing path.

- [ ] **Step 7: Add operation-token cleanup**

Increment `operationId`, disable print/export/email actions while busy, check the token after each await, and use `finally` to remove iframe, classes, variables, handlers, and busy state. Invalidate the token during Payroll unmount.

- [ ] **Step 8: Run GREEN**

Run: `node scripts/verify-payroll-detail-pages.mjs`

Expected: PASS for physical size, scale boundary, page packing, repeated headings, final-page break, and cleanup.

- [ ] **Step 9: Commit**

```bash
git add dist/TipOut/payroll-detail-pages.js dist/TipOut/payroll.html dist/TipOut/payroll-detail-export.js dist/TipOut/payroll.js scripts/verify-payroll-detail-pages.mjs
git commit -m "feat: paginate payroll detail for A4"
```

---

### Task 4: Implement two-step export and compact CSV

**Files:**
- Modify: `dist/TipOut/payroll.html`
- Modify: `dist/TipOut/payroll.css`
- Modify: `dist/TipOut/payroll-detail-export.js`
- Modify: `dist/TipOut/payroll.js`
- Create: `scripts/verify-payroll-detail-export-matrix.mjs`

**Interfaces:**
- Consumes: normalized payload and A4 page builder.
- Produces: `openPayrollDetailExportPanel()`, compact CSV serialization, `PayrollEmailExportSnapshot`, and detailed/compact × PDF/CSV/email behavior.

- [ ] **Step 1: Write failing export-matrix tests**

Assert all six combinations resolve to the correct variant/format without changing `activeVariant`. Add a compact CSV golden fixture with the exact 33-column order from the spec, BOM, CRLF, quotes, Paid Break merged into Regular, three explicit clock pairs, and remaining pairs in `additional_clock_pairs`.

- [ ] **Step 2: Run RED**

Run: `node scripts/verify-payroll-detail-export-matrix.mjs`

Expected: FAIL because version selection and compact CSV are absent.

- [ ] **Step 3: Implement the two-step panel**

Opening resets `exportVariant = activeVariant`. Version selection only updates `exportVariant`; PDF/CSV execute immediately using a frozen payload snapshot; email creates a frozen snapshot and opens the existing email modal.

- [ ] **Step 4: Implement compact CSV**

Serialize the exact spec columns and row types `meta`, `summary`, `week-1`, `week-2`, `week-1-total`, `week-2-total`, and `declaration`. Detailed CSV must continue through the unchanged legacy serializer and filename; only compact output receives `_Compact`.

- [ ] **Step 5: Close the email state flow**

The email modal displays frozen employee, Period, and variant. Format changes only update snapshot format. Failure retains snapshot and form values; cancel/success destroys it; sending disables duplicate submission. PDF uses the frozen pagination; CSV ignores pagination.

- [ ] **Step 6: Run GREEN**

Run: `node scripts/verify-payroll-detail-export-matrix.mjs`

Expected: PASS for all combinations, golden CSV, state transitions, retry, cancel, and duplicate-submit prevention.

- [ ] **Step 7: Commit**

```bash
git add dist/TipOut/payroll.html dist/TipOut/payroll.css dist/TipOut/payroll-detail-export.js dist/TipOut/payroll.js scripts/verify-payroll-detail-export-matrix.mjs
git commit -m "feat: add payroll detail export variants"
```

---

### Task 5: Regenerate native assets and verify real printing

**Files:**
- Modify: `scripts/generate-team-payroll-native-runtime.mjs`
- Modify: `scripts/verify-team-payroll-native-runtime.mjs`
- Modify: `src/team/payroll/payroll-legacy-runtime.ts`
- Generate: `src/team/payroll/payroll-template.html`
- Generate: `src/team/payroll/payroll-page.css`
- Generate: `src/team/payroll/legacy/payroll.js.txt`
- Generate: `src/team/payroll/legacy/payroll-detail-export.js.txt`
- Generate: `src/team/payroll/legacy/payroll-detail-pages.js.txt`
- Create: `scripts/verify-payroll-detail-print-pdf.mjs`

**Interfaces:**
- Consumes: standalone sources from Tasks 1–4.
- Produces: byte-identical native runtime copies and verified Chromium PDF artifacts.

- [ ] **Step 1: Extend native runtime verification**

Add `payroll-detail-pages.js` to the generator/verifier source list and require its raw code to execute before `payroll-detail-export.js` and `payroll.js`.

- [ ] **Step 2: Run RED**

Run: `node scripts/verify-team-payroll-native-runtime.mjs`

Expected: FAIL because the native copy/import is missing.

- [ ] **Step 3: Regenerate native view and runtime**

Run:

```bash
node scripts/generate-team-payroll-native-view.mjs
node scripts/generate-team-payroll-native-runtime.mjs
```

Import and evaluate `payroll-detail-pages.js.txt` before export/runtime code in `payroll-legacy-runtime.ts`.

- [ ] **Step 4: Add real Chromium PDF verification**

Use the same standalone A4 iframe HTML with Chromium `page.pdf({ format: "A4", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } })`. Parse the resulting PDF and assert MediaBox A4, fit-one-page count 1, paginate count equals page DOM count, and no blank final page.

- [ ] **Step 5: Run the full automated suite**

Run:

```bash
node scripts/verify-payroll-compact-detail.mjs
node scripts/verify-payroll-detail-pages.mjs
node scripts/verify-payroll-detail-export-matrix.mjs
node scripts/verify-payroll-detail-print-pdf.mjs
node scripts/verify-team-payroll-native-runtime.mjs
node scripts/verify-team-payroll-polish.mjs
node scripts/verify-team-payroll-view.mjs
npx tsc --noEmit
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 6: Run native browser E2E**

At `http://127.0.0.1:5174/#/team/payroll-report`, verify both tabs, employee/Period changes, remembered pagination, all six export combinations, email snapshot labels, busy states, modal scrolling, and no console errors. Inspect Chrome/Edge print preview once for fit-one-page and paginate fixtures.

- [ ] **Step 7: Commit generated native integration**

```bash
git add scripts/generate-team-payroll-native-runtime.mjs scripts/verify-team-payroll-native-runtime.mjs src/team/payroll/payroll-legacy-runtime.ts src/team/payroll/payroll-template.html src/team/payroll/payroll-page.css src/team/payroll/legacy/payroll.js.txt src/team/payroll/legacy/payroll-detail-export.js.txt src/team/payroll/legacy/payroll-detail-pages.js.txt scripts/verify-payroll-detail-print-pdf.mjs
git commit -m "feat: integrate dual payroll detail exports"
```
