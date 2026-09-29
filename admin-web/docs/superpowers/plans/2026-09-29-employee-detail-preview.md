# Employee daily contribution preview

**Spec:** User-approved continuation: pending daily contribution shows estimate; range contribution total combines confirmed and estimated with question-mark breakdown. Other allocation results remain confirmed-only.
**Architecture:** Consume estimatedDeducted and contributionPreviewError already copied through the employee summary snapshot. Never calculate independently or mutate allocation records. Old snapshots without estimates show unavailable, not zero; return to summary to refresh.
**Tech stack:** Existing scoped JS, native popover, existing CSS, Node VM and browser regressions.

- [x] Update employee-reconciliation.js.txt summary using integer cents for estimated/confirmed contributions; keep received/after confirmed-only.
- [x] Render pending daily estimates/errors, range total and click breakdown; preserve estimate labels in export.
- [x] Verify mixed, pending, error and filtered totals, actual browser popup, no allocation writes.

Passed: verify-tipout-detail-contribution.mjs, verify-tipout-pending-summary.mjs, verify-tipout-employee-reconciliation.mjs and extended verify-tipout-pending-summary-browser.cjs. Browser checks exercise real summary-to-detail snapshot transfer, estimate and error rendering, breakdown click/Escape, confirmed-only received/final totals, and absence of allocation writes.

No commit or push requested.
