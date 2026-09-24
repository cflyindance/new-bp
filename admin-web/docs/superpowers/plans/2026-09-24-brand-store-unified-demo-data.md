# Brand–Store Unified Demo Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one deterministic demo-data source in which organization, employees, products, orders, marketing, payments, payroll, and finance all share the same brand and store identities.

**Architecture:** Keep `enterprise-merchant-store.ts` as the organization authority, then build a normalized `demo-scenario` domain around it. Pure generators create a 30-local-business-day event window from stable seeds; domain adapters expose current page-specific shapes while all aggregation and cross-domain references remain centralized.

**Tech Stack:** TypeScript 5.6, Vite 6, browser `localStorage`/`sessionStorage`, `npx tsx` verification scripts, existing HTML/TypeScript UI modules.

**Spec:** `docs/superpowers/specs/2026-09-24-brand-store-unified-demo-data-design.md`

## Global Constraints

- `src/config/enterprise-merchant-store.ts` remains the only authority for group, brand, region, and store identities.
- Store data uses brand-template inheritance plus explicit store overrides.
- The generated date window is exactly `anchorDate - 29 days` through `anchorDate`, inclusive, in the local business timezone.
- Money is stored as integer minor units; generators must not call uncontrolled `Math.random()`.
- Seed-version changes reset registered business-demo storage keys instead of migrating user edits.
- Stable-entity runtime overrides survive an anchor-date change; dated-event overrides survive only while their event remains inside the 30-day window.
- Login, language, theme, navigation layout, and view-selection storage keys must never be cleared by demo-data reset.
- No business module may add a private static brand or store list.
- Existing unrelated worktree changes must be preserved; every commit stages only files named by its task.
- If implementation touches `vendor/emenu-new`, run `npm run build:emenu-new-embed -- --skip-install` from the project root and verify `dist/emenu-new/index.html`, `dist/emenu-new/.emenu-embed-build.json`, and the command exit status.

---

## File Map

Create these focused files under `src/demo-scenario/`:

- `demo-scenario-types.ts`: normalized entities, event types, scope, overrides, and metadata.
- `demo-scenario-random.ts`: seeded hash/PRNG and stable ID helpers.
- `demo-scenario-date.ts`: local business-date parsing and inclusive 30-day window.
- `demo-scenario-catalog.ts`: brand templates and explicit store profiles keyed by organization IDs.
- `demo-scenario-generator.ts`: pure full-scenario generation entry point.
- `demo-scenario-products.ts`: brand product/template merge and store catalog projection.
- `demo-scenario-orders.ts`: deterministic order, discount, payment, tip, and refund events.
- `demo-scenario-team.ts`: employees, shifts, attendance, wages, and tip allocations.
- `demo-scenario-marketing.ts`: campaigns and redemptions linked to orders.
- `demo-scenario-finance.ts`: payment, settlement, payroll-expense, and aggregate projections.
- `demo-scenario-validation.ts`: foreign-key, scope, and monetary invariants.
- `demo-scenario-storage.ts`: exact-key reset registry, metadata, serialized snapshot, and overrides.
- `demo-scenario-repository.ts`: initialize/rebuild/query/update public API.
- `demo-scenario-scope.ts`: permission-first group/brand/store filtering and aggregation scope.
- `adapters/*.ts`: thin projections for existing product/order/team/marketing/finance consumers.

Create verification scripts under `scripts/` and add one aggregate npm command. Modify existing UI/data modules only when their adapter is ready.

---

### Task 1: Define the normalized scenario contract

**Files:**
- Create: `src/demo-scenario/demo-scenario-types.ts`
- Create: `scripts/verify-demo-scenario-types.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Existing `merchantId`, `storeId`, `groupId`, and region identifiers from `EnterpriseMerchantSnapshot`.
- Produces: `DemoScenario`, `DemoScenarioScope`, `DemoScenarioMetadata`, `MoneyMinor`, and stable entity/event interfaces used by all later tasks.

- [ ] **Step 1: Write the type contract verification**

```ts
import type { DemoScenario, DemoScenarioScope, MoneyMinor } from "../src/demo-scenario/demo-scenario-types";

const cents: MoneyMinor = 1299;
const scope: DemoScenarioScope = { groupId: "g", brandIds: ["b"], storeIds: ["s"] };
const sample: Pick<DemoScenario, "metadata" | "scopeIndex"> = {
  metadata: { scenarioId: "restaurant-chain", scenarioVersion: 1, anchorDate: "2026-09-24", generatedAt: "2026-09-24T00:00:00.000Z" },
  scopeIndex: { groupIds: ["g"], brandIds: ["b"], storeIds: ["s"] },
};
if (cents !== 1299 || scope.storeIds[0] !== sample.scopeIndex.storeIds[0]) throw new Error("type contract mismatch");
console.log("demo scenario type contract: ok");
```

- [ ] **Step 2: Run it and verify the missing-module failure**

Run: `npx tsx scripts/verify-demo-scenario-types.ts`

Expected: FAIL because `src/demo-scenario/demo-scenario-types.ts` does not exist.

- [ ] **Step 3: Add the normalized types**

Define integer money and branded local dates, then declare explicit interfaces for `DemoBrandTemplate`, `DemoStoreProfile`, `DemoEmployee`, `DemoProduct`, `DemoStoreProduct`, `DemoCampaign`, `DemoOrder`, `DemoOrderItem`, `DemoPayment`, `DemoRefund`, `DemoShift`, `DemoAttendance`, `DemoPayrollEntry`, and `DemoFinanceEntry`. The root must use maps keyed by stable IDs:

```ts
export type MoneyMinor = number;
export type LocalBusinessDate = `${number}-${number}-${number}`;
export interface DemoScenarioMetadata { scenarioId: string; scenarioVersion: number; anchorDate: LocalBusinessDate; generatedAt: string }
export interface DemoScenarioScope { groupId?: string; brandIds: string[]; storeIds: string[]; fromDate?: LocalBusinessDate; toDate?: LocalBusinessDate }
export interface DemoScenario {
  metadata: DemoScenarioMetadata;
  scopeIndex: { groupIds: string[]; brandIds: string[]; storeIds: string[] };
  brandTemplates: Record<string, DemoBrandTemplate>;
  storeProfiles: Record<string, DemoStoreProfile>;
  employees: Record<string, DemoEmployee>;
  products: Record<string, DemoProduct>;
  storeProducts: Record<string, DemoStoreProduct>;
  campaigns: Record<string, DemoCampaign>;
  orders: Record<string, DemoOrder>;
  payments: Record<string, DemoPayment>;
  refunds: Record<string, DemoRefund>;
  shifts: Record<string, DemoShift>;
  attendance: Record<string, DemoAttendance>;
  payrollEntries: Record<string, DemoPayrollEntry>;
  financeEntries: Record<string, DemoFinanceEntry>;
}
```

- [ ] **Step 4: Add and run the package command**

Add `"verify:demo-scenario": "npx tsx scripts/verify-demo-scenario-types.ts"` to `scripts`, then run `npm run verify:demo-scenario`.

Expected: PASS with `demo scenario type contract: ok`.

- [ ] **Step 5: Commit**

```bash
git add package.json src/demo-scenario/demo-scenario-types.ts scripts/verify-demo-scenario-types.ts
git commit -m "feat: define unified demo scenario contracts"
```

### Task 2: Add deterministic dates, random values, and stable IDs

**Files:**
- Create: `src/demo-scenario/demo-scenario-date.ts`
- Create: `src/demo-scenario/demo-scenario-random.ts`
- Create: `scripts/verify-demo-scenario-determinism.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `LocalBusinessDate`.
- Produces: `buildBusinessDateWindow(anchorDate, days)`, `seedFromParts(...parts)`, `createSeededRandom(seed)`, and `stableDemoId(namespace, ...parts)`.

- [ ] **Step 1: Write failing deterministic tests**

```ts
import { buildBusinessDateWindow } from "../src/demo-scenario/demo-scenario-date";
import { createSeededRandom, seedFromParts, stableDemoId } from "../src/demo-scenario/demo-scenario-random";

const dates = buildBusinessDateWindow("2026-03-01", 30);
if (dates.length !== 30 || dates[0] !== "2026-01-31" || dates.at(-1) !== "2026-03-01") throw new Error(JSON.stringify(dates));
const a = createSeededRandom(seedFromParts("v1", "2026-03-01", "M00000001", "orders"));
const b = createSeededRandom(seedFromParts("v1", "2026-03-01", "M00000001", "orders"));
if ([a(), a(), a()].join() !== [b(), b(), b()].join()) throw new Error("PRNG is not stable");
if (stableDemoId("order", "M00000001", "2026-03-01", 1) !== stableDemoId("order", "M00000001", "2026-03-01", 1)) throw new Error("ID drift");
console.log("demo scenario determinism: ok");
```

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-scenario-determinism.ts`

Expected: FAIL because date/random modules do not exist.

- [ ] **Step 3: Implement pure helpers**

Use local calendar arithmetic based on numeric year/month/day components. Implement a small deterministic 32-bit hash plus Mulberry32-style PRNG. `stableDemoId` must return readable IDs such as `demo-order-M00000001-20260301-0001`, not random UUIDs.

- [ ] **Step 4: Run leap-day and timezone checks**

Extend the script with anchors `2024-03-01` and `2026-01-01`, run it under the existing shell timezone, and verify both windows remain calendar-date based.

- [ ] **Step 5: Commit**

```bash
git add package.json src/demo-scenario/demo-scenario-date.ts src/demo-scenario/demo-scenario-random.ts scripts/verify-demo-scenario-determinism.ts
git commit -m "feat: add deterministic demo data primitives"
```

### Task 3: Build brand templates and store inheritance from organization data

**Files:**
- Create: `src/demo-scenario/demo-scenario-catalog.ts`
- Create: `src/demo-scenario/demo-scenario-products.ts`
- Create: `scripts/verify-demo-scenario-catalog.ts`
- Modify: `src/permissions/m-platform-store-scope.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `getEnterpriseMerchantSnapshot()` and stable merchant/store IDs.
- Produces: `buildDemoScenarioCatalog(snapshot)`, `resolveStoreCatalog(brandTemplate, storeProfile)`, and organization-backed scope entries.

- [ ] **Step 1: Write failing inheritance assertions**

Verify every store profile resolves to an existing organization store, its `brandId` matches the organization merchant relationship, all inherited products remain present, a store price override changes only that store, and a store-level disabled product is absent from its sellable menu but retained in the product map.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-scenario-catalog.ts`

Expected: FAIL because catalog builders do not exist.

- [ ] **Step 3: Implement explicit brand templates and store profiles**

Key templates by existing merchant IDs such as `merchant-zhangji` and `merchant-zhangji-skewers`. Key profiles by existing store IDs such as `M00000001`. Fail construction when a configured ID is missing; do not synthesize unknown organizations.

```ts
export function resolveStoreCatalog(template: DemoBrandTemplate, profile: DemoStoreProfile): DemoStoreProduct[] {
  return template.productIds.map((productId) => {
    const override = profile.productOverrides[productId];
    return { storeProductId: `${profile.storeId}:${productId}`, storeId: profile.storeId, productId, priceMinor: override?.priceMinor ?? template.basePrices[productId], enabled: override?.enabled ?? true, inventory: override?.inventory ?? null };
  });
}
```

- [ ] **Step 4: Replace fallback store options with organization-derived entries**

Keep legacy ID migration helpers in `m-platform-store-scope.ts`, but make the normal `buildDemoScopeStoreOptions()` path consume organization-backed entries only. Retain the single-store fallback only for a genuinely empty organization snapshot.

- [ ] **Step 5: Run catalog and existing scope verification**

Run: `npm run verify:demo-scenario` and `npx tsx scripts/verify-demo-scenario-catalog.ts`.

Expected: both PASS; each configured demo store belongs to exactly one configured brand.

- [ ] **Step 6: Commit**

```bash
git add package.json src/demo-scenario/demo-scenario-catalog.ts src/demo-scenario/demo-scenario-products.ts src/permissions/m-platform-store-scope.ts scripts/verify-demo-scenario-catalog.ts
git commit -m "feat: seed brand templates and store overrides"
```

### Task 4: Generate the core operating scenario

**Files:**
- Create: `src/demo-scenario/demo-scenario-team.ts`
- Create: `src/demo-scenario/demo-scenario-orders.ts`
- Create: `src/demo-scenario/demo-scenario-marketing.ts`
- Create: `src/demo-scenario/demo-scenario-finance.ts`
- Create: `src/demo-scenario/demo-scenario-generator.ts`
- Create: `scripts/verify-demo-scenario-generation.ts`

**Interfaces:**
- Consumes: catalog, deterministic primitives, `scenarioVersion`, `scenarioId`, and `anchorDate`.
- Produces: `generateDemoScenario(input): DemoScenario` and domain-specific pure generators.

- [ ] **Step 1: Write a failing end-to-end generator test**

Generate twice for `{ scenarioId: "restaurant-chain", scenarioVersion: 1, anchorDate: "2026-09-24" }`, compare normalized JSON equality, verify exactly 30 distinct business dates, and assert every configured brand has at least two stores with distinguishable order volume or average ticket.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-scenario-generation.ts`

Expected: FAIL because `generateDemoScenario` does not exist.

- [ ] **Step 3: Implement employees, shifts, and attendance**

Generate stable employees per store, with explicit job, wage, home store, and optional cross-store assignment. Generate shifts before attendance so attendance references valid shifts.

- [ ] **Step 4: Implement campaigns, orders, payments, and refunds**

Generate campaigns before orders. Each order must select only enabled store products and an employee authorized for the store. Calculate amounts through one function:

```ts
export function calculateOrderMoney(input: { subtotalMinor: number; discountMinor: number; taxMinor: number; tipMinor: number; refundMinor: number }) {
  return input.subtotalMinor - input.discountMinor + input.taxMinor + input.tipMinor - input.refundMinor;
}
```

Generate payments from the final payable amount and refunds from explicit refund events.

- [ ] **Step 5: Derive payroll and finance entries**

Payroll consumes attendance and wage rates; tip allocation consumes order tips and worked hours. Finance entries consume payments, refunds, payroll, tax, discount, and settlement data rather than independently inventing amounts.

- [ ] **Step 6: Run the generator test twice**

Run: `npx tsx scripts/verify-demo-scenario-generation.ts` twice.

Expected: both runs PASS and print the same scenario digest.

- [ ] **Step 7: Commit**

```bash
git add src/demo-scenario/demo-scenario-team.ts src/demo-scenario/demo-scenario-orders.ts src/demo-scenario/demo-scenario-marketing.ts src/demo-scenario/demo-scenario-finance.ts src/demo-scenario/demo-scenario-generator.ts scripts/verify-demo-scenario-generation.ts
git commit -m "feat: generate linked restaurant demo events"
```

### Task 5: Validate references, money, and hierarchy rollups

**Files:**
- Create: `src/demo-scenario/demo-scenario-validation.ts`
- Create: `scripts/verify-demo-scenario-integrity.ts`
- Modify: `src/demo-scenario/demo-scenario-generator.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `DemoScenario`.
- Produces: `validateDemoScenario(scenario): DemoScenarioValidationIssue[]` and `assertValidDemoScenario(scenario): void`.

- [ ] **Step 1: Write tests that deliberately corrupt a valid scenario**

Create separate corruptions for an unknown store, wrong-brand product, unknown employee, expired campaign redemption, payment imbalance, and incorrect brand rollup. Assert each produces a code such as `UNKNOWN_STORE`, `CROSS_BRAND_PRODUCT`, or `ORDER_PAYMENT_IMBALANCE` containing the offending entity ID.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-scenario-integrity.ts`

Expected: FAIL because validation functions do not exist.

- [ ] **Step 3: Implement deterministic validation passes**

Return sorted issues so output is stable. Validate foreign keys first, then ownership, date ranges, order equations, payment/refund totals, employee attendance/payroll links, and store→brand→group rollups.

- [ ] **Step 4: Make generation fail closed in development**

Call `assertValidDemoScenario` before returning from `generateDemoScenario`. Error text must include issue code and entity ID.

- [ ] **Step 5: Run the integrity suite**

Run: `npx tsx scripts/verify-demo-scenario-integrity.ts && npx tsx scripts/verify-demo-scenario-generation.ts`.

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json src/demo-scenario/demo-scenario-validation.ts src/demo-scenario/demo-scenario-generator.ts scripts/verify-demo-scenario-integrity.ts
git commit -m "test: enforce demo scenario integrity"
```

### Task 6: Add versioned storage, exact reset, and rolling overrides

**Files:**
- Create: `src/demo-scenario/demo-scenario-storage.ts`
- Create: `src/demo-scenario/demo-scenario-repository.ts`
- Create: `scripts/verify-demo-scenario-storage.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `generateDemoScenario`, browser-like `Storage`, injected clock.
- Produces: `createDemoScenarioRepository(deps)`, `ensureDemoScenario()`, `readDemoScenario()`, `resetDemoScenario()`, and `applyRuntimeOverride()`.

- [ ] **Step 1: Write an in-memory storage test**

Seed old business keys plus protected keys. Verify a version bump deletes only registered business keys; protected auth/UI keys remain. Roll the anchor from `2026-09-24` to `2026-09-25`; verify stable product overrides remain, an order override dated `2026-08-27` is dropped, and an order override dated `2026-09-01` remains.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-scenario-storage.ts`

Expected: FAIL because repository/storage modules do not exist.

- [ ] **Step 3: Implement an explicit reset registry**

```ts
export const LEGACY_BUSINESS_DEMO_STORAGE_KEYS = [
  "tipout-payroll-state-v4",
  "menusifu:enterprise-hardware-demo-v3",
] as const;
```

Expand this list only when a later adapter takes ownership of that legacy store. Delete exact keys; for stores that use a known per-store prefix, enumerate valid organization store IDs and construct exact keys before deletion.

- [ ] **Step 4: Implement rebuild-once recovery**

`ensureDemoScenario()` validates loaded data. On failure, clear the scenario keys and rebuild once. If the rebuilt scenario fails, return a typed repository error and do not recurse.

- [ ] **Step 5: Initialize before page mount**

In `src/main.ts`, call `ensureDemoScenario()` after organization storage is available and before business routes render. Dispatch `menusifu:demo-scenario-change` after rebuild or runtime writes.

- [ ] **Step 6: Run storage and build checks**

Run: `npx tsx scripts/verify-demo-scenario-storage.ts` and `npm run build`.

Expected: PASS; no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/demo-scenario/demo-scenario-storage.ts src/demo-scenario/demo-scenario-repository.ts src/main.ts scripts/verify-demo-scenario-storage.ts
git commit -m "feat: persist and version unified demo scenarios"
```

### Task 7: Centralize permission-first scope queries

**Files:**
- Create: `src/demo-scenario/demo-scenario-scope.ts`
- Create: `scripts/verify-demo-scenario-scope.ts`
- Modify: `src/auth/session-scope.ts`
- Modify: `src/auth/effective-scope-api.ts`
- Modify: `src/shell/page-store-picker.ts`

**Interfaces:**
- Consumes: `DemoScenario`, `StaffStoreAccess`, and current UI filters.
- Produces: `resolveDemoScenarioScope(input)`, `queryScenarioStores(scope)`, and a scope passed to every domain adapter.

- [ ] **Step 1: Write cross-brand leakage tests**

For a user authorized only to `merchant-zhangji`, request a store belonging to `merchant-zhangji-skewers`; expect an empty/normalized store selection and no returned records. Verify brand aggregation equals the sum of only authorized stores.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-scenario-scope.ts`

Expected: FAIL because centralized scope resolution does not exist.

- [ ] **Step 3: Implement permission-before-aggregation filtering**

Intersect requested brand/store IDs with `StaffStoreAccess`, then verify store ownership against the scenario. Expose the normalized scope; do not expose full scenario records to UI callers.

- [ ] **Step 4: Route existing selectors through organization data**

Update session scope and page picker helpers to use the same organization-backed options and normalized scope. Preserve existing events and iframe metadata shapes.

- [ ] **Step 5: Run scope regressions**

Run: `npx tsx scripts/verify-demo-scenario-scope.ts`, existing order-scope scripts, and `npm run build`.

Expected: PASS; brand changes still clear an incompatible page-level store selection.

- [ ] **Step 6: Commit**

```bash
git add src/demo-scenario/demo-scenario-scope.ts src/auth/session-scope.ts src/auth/effective-scope-api.ts src/shell/page-store-picker.ts scripts/verify-demo-scenario-scope.ts
git commit -m "feat: centralize demo data scope filtering"
```

### Task 8: Connect product, menu, order, and payment consumers

**Files:**
- Create: `src/demo-scenario/adapters/product-demo-adapter.ts`
- Create: `src/demo-scenario/adapters/order-demo-adapter.ts`
- Create: `scripts/verify-demo-product-order-adapters.ts`
- Modify: `src/config/json-menu-demo-data.ts`
- Modify: `src/config/json-menu-document-repository.ts`
- Modify: `src/config/foh-menu-order-limits-ui.ts`
- Modify: `src/main.ts` order-list and order-detail render/data branches

**Interfaces:**
- Consumes: repository plus normalized scope.
- Produces: `listDemoStoreProducts(scope)`, `readDemoStoreMenu(scope)`, `listDemoOrders(scope)`, and `readDemoOrder(orderId, scope)`.

- [ ] **Step 1: Write adapter contract tests**

Verify store catalog inheritance, store-specific price/availability, order item snapshots, payment totals, refunds, and denial of order lookup outside the caller scope.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-product-order-adapters.ts`

Expected: FAIL because adapters do not exist.

- [ ] **Step 3: Implement read adapters and preserve existing page shapes**

Keep conversion inside the adapters. UI modules receive their current row/document interfaces and do not import `DemoScenario` directly.

- [ ] **Step 4: Implement product/menu writes as store overrides**

Brand-template edits use an explicit brand command; store price, inventory, and availability edits call `applyRuntimeOverride({ kind: "store-product", storeId, productId, patch })`.

- [ ] **Step 5: Replace page-local seeds**

Remove the migrated product/order seed branches only after their pages read from adapters. Register their exact old storage keys in Task 6's reset list.

- [ ] **Step 6: Run adapter, order, menu, and build checks**

Run `npx tsx scripts/verify-demo-product-order-adapters.ts`, `npm run verify:order-list-columns`, relevant JSON-menu verification scripts, and `npm run build`.

- [ ] **Step 7: Commit**

```bash
git add src/demo-scenario/adapters/product-demo-adapter.ts src/demo-scenario/adapters/order-demo-adapter.ts src/config/json-menu-demo-data.ts src/config/json-menu-document-repository.ts src/config/foh-menu-order-limits-ui.ts src/main.ts src/demo-scenario/demo-scenario-storage.ts scripts/verify-demo-product-order-adapters.ts
git commit -m "feat: unify product and order demo data"
```

### Task 9: Connect employee, scheduling, attendance, payroll, and tips

**Files:**
- Create: `src/demo-scenario/adapters/team-demo-adapter.ts`
- Create: `scripts/verify-demo-team-adapter.ts`
- Modify: `src/config/team-employee-roster-scope.ts`
- Modify: `src/config/team-clock-in-ui.ts`
- Modify: `src/config/team-shift-scheduling-ui.ts`
- Modify: `src/team/payroll/payroll-roster-adapter.ts`
- Modify: `src/team/payroll/payroll-api.ts`
- Modify: `src/team/payroll/payroll-schedule-demo.ts`

**Interfaces:**
- Consumes: scenario employees, shifts, attendance, orders, tips, and normalized scope.
- Produces: existing roster, clock-in, schedule, payroll, and TipOut-compatible records.

- [ ] **Step 1: Write the cross-team contract test**

For one store, verify every attendance row references a scheduled/authorized employee, payroll regular/overtime hours derive from attendance, payroll wages use the employee wage rate, and total allocated tips equal eligible order tips.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-team-adapter.ts`

Expected: FAIL because the team adapter does not exist.

- [ ] **Step 3: Implement the adapter**

Convert unified employees into the existing roster shape; keep legacy formatting and translation outside the domain adapter. Expose explicit queries by store and pay-period date range.

- [ ] **Step 4: Replace independent team seeds**

Change roster, clock-in, scheduling, payroll, and TipOut sources to consume the adapter. Add the old payroll/roster keys to the exact reset registry only when all readers have moved.

- [ ] **Step 5: Run team regression suite**

Run `npx tsx scripts/verify-demo-team-adapter.ts`, `npx tsx scripts/verify-team-payroll-domain.ts`, `npx tsx scripts/verify-team-payroll-adapters.ts`, `npm run verify:payment-method-apportion`, and `npm run build`.

- [ ] **Step 6: Commit**

```bash
git add src/demo-scenario/adapters/team-demo-adapter.ts src/config/team-employee-roster-scope.ts src/config/team-clock-in-ui.ts src/config/team-shift-scheduling-ui.ts src/team/payroll/payroll-roster-adapter.ts src/team/payroll/payroll-api.ts src/team/payroll/payroll-schedule-demo.ts src/demo-scenario/demo-scenario-storage.ts scripts/verify-demo-team-adapter.ts
git commit -m "feat: unify team and payroll demo data"
```

### Task 10: Connect marketing and finance projections

**Files:**
- Create: `src/demo-scenario/adapters/marketing-demo-adapter.ts`
- Create: `src/demo-scenario/adapters/finance-demo-adapter.ts`
- Create: `scripts/verify-demo-marketing-finance-adapters.ts`
- Modify: `src/config/finance-register-audit-pages.ts`
- Modify: `dist/Configuration center/assets/marketing-ads-store.js`
- Modify: `vite.config.ts` or the existing embedded-page bridge used for marketing scope/data injection

**Interfaces:**
- Consumes: campaigns, redemptions, orders, payments, refunds, settlements, payroll expenses, and normalized scope.
- Produces: marketing list/effect rows plus finance payment/audit/summary rows in current page formats.

- [ ] **Step 1: Write reconciliation tests**

Verify every marketing redemption points to an eligible order; campaign order count and discount cost equal linked order data; finance gross, discount, tax, tip, refund, payment, payroll, and net totals recompute from event records for store and brand scopes.

- [ ] **Step 2: Run and verify failure**

Run: `npx tsx scripts/verify-demo-marketing-finance-adapters.ts`

Expected: FAIL because adapters do not exist.

- [ ] **Step 3: Implement finance projections**

Replace independently seeded register/audit rows with adapter output. Keep form-created demo entries as runtime event overrides with a store ID; reject writes without a valid store scope.

- [ ] **Step 4: Implement marketing projections and bridge**

Expose store-scoped ad/campaign data to the embedded marketing page through a serialized bridge or generated asset. The embedded page must receive the active store ID and must not maintain its own store list.

- [ ] **Step 5: Register and remove migrated legacy seeds**

Add exact finance and marketing keys to the reset registry, then delete only seed code that has no remaining consumer.

- [ ] **Step 6: Run reconciliation and browser-source checks**

Run `npx tsx scripts/verify-demo-marketing-finance-adapters.ts`, `npx tsx scripts/verify-marketing-screensaver-fullscreen-flow.ts`, and `npm run build`.

- [ ] **Step 7: Commit**

```bash
git add src/demo-scenario/adapters/marketing-demo-adapter.ts src/demo-scenario/adapters/finance-demo-adapter.ts src/config/finance-register-audit-pages.ts "dist/Configuration center/assets/marketing-ads-store.js" vite.config.ts src/demo-scenario/demo-scenario-storage.ts scripts/verify-demo-marketing-finance-adapters.ts
git commit -m "feat: reconcile marketing and finance demo data"
```

### Task 11: Unify store-bound operating-support data and remove duplicate store catalogs

**Files:**
- Create: `src/demo-scenario/adapters/store-support-demo-adapter.ts`
- Create: `scripts/verify-demo-store-support-adapter.ts`
- Modify: `src/config/deployment-mock-devices.ts`
- Modify: `src/config/enterprise-hardware-store.ts`
- Modify: `src/config/deployment-seed.ts`
- Modify: `src/config/dual-pricing-upstream.ts`
- Modify: `src/config/module-settings-store-profile-master.ts`

**Interfaces:**
- Consumes: organization stores and normalized scope.
- Produces: store/device/deployment rows that reference the same `storeId` and brand ownership as the unified scenario.

- [ ] **Step 1: Add a static duplicate-catalog scan**

Make the verification script scan `src/` for known retired demo brand/store constants and report file and line. Allow only the organization seed, legacy migration map, scenario catalog, and test fixtures.

- [ ] **Step 2: Run and capture current failures**

Run: `npx tsx scripts/verify-demo-store-support-adapter.ts`.

Expected: FAIL and list the remaining independent store catalogs.

- [ ] **Step 3: Migrate hardware and deployment generators**

Build device/deployment rows from organization-backed stores. Preserve domain-specific device state, but remove copied store names and ownership data.

- [ ] **Step 4: Resolve every reported duplicate catalog**

Replace the store-name constants in `deployment-seed.ts`, the fixed store bootstrap in `dual-pricing-upstream.ts`, and the store-keyed profile seed in `module-settings-store-profile-master.ts` with organization/scenario queries. Keep `enterprise-merchant-bid.ts` and the legacy maps in `m-platform-store-scope.ts` on the explicit migration-only allowlist. Re-run until the scan has no unexplained result.

- [ ] **Step 5: Run support and build checks**

Run: `npx tsx scripts/verify-demo-store-support-adapter.ts` and `npm run build`.

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/demo-scenario/adapters/store-support-demo-adapter.ts src/config/deployment-mock-devices.ts src/config/deployment-seed.ts src/config/dual-pricing-upstream.ts src/config/enterprise-hardware-store.ts src/config/module-settings-store-profile-master.ts scripts/verify-demo-store-support-adapter.ts
git commit -m "refactor: remove duplicate demo store catalogs"
```

### Task 12: Add the full acceptance gate and document operations

**Files:**
- Create: `scripts/verify-demo-scenario-acceptance.ts`
- Create: `docs/项目文档/品牌门店统一演示数据-维护说明.md`
- Modify: `package.json`
- Modify: `docs/项目文档/演示账号-连锁视角联调用例.md`

**Interfaces:**
- Consumes: all public repository and adapter APIs.
- Produces: one `npm run verify:demo-scenario` gate and maintainer instructions for versioning/reset/debugging.

- [ ] **Step 1: Write full acceptance assertions**

For each demo brand and store, execute every adapter under store scope; then aggregate by brand and group. Assert identity consistency, no unauthorized records, cross-domain foreign keys, monetary reconciliation, deterministic regeneration, 30-day boundary, and version-reset protection of non-business keys.

- [ ] **Step 2: Expand the aggregate verification command**

Set `verify:demo-scenario` to execute all scenario scripts in dependency order, ending with `verify-demo-scenario-acceptance.ts`.

- [ ] **Step 3: Run the complete automated gate**

Run: `npm run verify:demo-scenario`.

Expected: PASS with one summary per domain and a final `unified demo scenario acceptance: ok`.

- [ ] **Step 4: Run production build**

Run: `npm run build`.

Expected: successful TypeScript and Vite build. If `vendor/emenu-new` changed, also run the required embedded-package build and validate its three required outputs.

- [ ] **Step 5: Perform browser acceptance**

Use the documented demo accounts to verify single-store, brand multi-store, and group views. Switch brands and stores across product/menu, orders, team/payroll, marketing, and finance pages. Confirm the same IDs/names, store isolation, brand rollups, recent dates, and no stale iframe data after reload.

- [ ] **Step 6: Write maintenance documentation**

Document the organization authority, template/override rules, scenario version bump procedure, exact reset registry, anchor-date behavior, adapter ownership, validation commands, and steps for adding a new brand or store without creating duplicate catalogs.

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/verify-demo-scenario-acceptance.ts "docs/项目文档/品牌门店统一演示数据-维护说明.md" "docs/项目文档/演示账号-连锁视角联调用例.md"
git commit -m "docs: add unified demo data acceptance gate"
```

---

## Execution Order and Review Gates

- Foundation gate: Tasks 1–7. Do not start domain migration until deterministic generation, integrity validation, storage, and scope isolation pass.
- Core commerce gate: Task 8. Product, order, and payment references must reconcile before downstream domains move.
- Workforce gate: Task 9. Payroll and tips must reconcile with attendance and orders.
- Revenue gate: Task 10. Marketing and finance must derive from migrated core events.
- Cleanup gate: Tasks 11–12. Remove duplicate catalogs only after every consumer has an adapter and finish with the aggregate acceptance suite.

Each gate should receive a fresh code review before the next gate begins. If a task discovers a page with a materially different persistence contract, update this plan and the design spec before expanding scope.
