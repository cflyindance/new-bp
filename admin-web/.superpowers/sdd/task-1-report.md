# Task 1 Report: 表头字段元数据模块

**Status:** DONE  
**Branch:** `feat/order-list-columns`  
**Date:** 2026-07-13

## Summary

Implemented the order-list column field catalog as specified in the task brief. All column metadata, helper functions, verify script, and npm script were created verbatim. Verification passes with exit code 0.

## Files Created / Modified

| File | Action |
|------|--------|
| `src/config/order-list-columns.ts` | Created |
| `scripts/verify-order-list-columns.ts` | Created |
| `package.json` | Modified — added `verify:order-list-columns` script |

## Deliverables Checklist

- [x] `OrderListColumnKey` — 19 literal union types
- [x] `OrderListColumnDef` — `{ key, order, titleZh, titleEn, defaultVisible }`
- [x] `ORDER_LIST_COLUMNS` — readonly array, length 19, order 1..19 ascending
- [x] `getDefaultVisibleColumns()` — returns 13 default-visible columns
- [x] `getOptionalColumns()` — returns 6 optional columns
- [x] `verify:order-list-columns` npm script registered
- [x] Verify script passes all column assertions

## Test Results

```
npm run verify:order-list-columns
→ verify-order-list-columns: columns OK
→ exit code 0
```

Assertions verified:
- 19 columns total
- Key order matches design doc §4.1
- `order` values are 1..19
- 13 default-visible / 6 optional split
- Default keys: orderNumber through openedAt
- Optional keys: closerName, closedAt, paymentMethodSummary, discount, guestCount, storeName
- Presence checks for serverName, closerName, openedAt, closedAt, serviceCharge, cardTip, cashTip

## Commit

| SHA | Subject |
|-----|---------|
| `6e34141` | feat(orders): add order list column field catalog |

Body: *Codify the 19 US restaurant order-list headers with default/optional visibility for later list UI.*

## Self-Review

### Correctness
- Column definitions match the brief exactly — keys, order, bilingual titles, and `defaultVisible` flags are verbatim.
- `getDefaultVisibleColumns` / `getOptionalColumns` are simple filters; no side effects.
- `as const` on `ORDER_LIST_COLUMNS` preserves literal types for consumers.

### Scope
- Did not touch navigation, list UI, or amount formulas (reserved for Task 2).
- Verify script contains only column assertions; amount assertions deferred per brief.

### Code Quality
- No linter errors on new files.
- Follows existing project pattern (e.g. other `verify:*` scripts using `npx tsx`).
- Module is self-contained under `src/config/` with no external dependencies.

### Concerns
- None. Task 1 is complete and ready for Task 2 to consume `ORDER_LIST_COLUMNS` and extend the verify script.

## Next Steps (Task 2)

- Wire column metadata into order list UI
- Add amount formula assertions to `verify-order-list-columns.ts`
- Add navigation entry if required by design
