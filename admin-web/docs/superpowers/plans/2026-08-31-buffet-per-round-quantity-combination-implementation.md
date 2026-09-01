# Buffet Per-Round Quantity Combination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement fixed and per-person per-round total bounds, per-round dish/category/dish-set caps, and uniform same-dish caps in the independent buffet-rule module.

**Architecture:** Extend the existing shared rule engine with a buffet-only `constraintKind` discriminator while preserving legacy target rules. Store total-bound and same-dish cells per store and scene, reuse the existing store/effective-scope lifecycle, and compile all rule kinds into one atomic runtime evaluator. Existing menu-order-limit behavior and existing buffet category/dish/dish-set records remain unchanged.

**Tech Stack:** Static HTML/CSS/JavaScript, localStorage repository envelope v1, rule-level schema v3, Node verification scripts, Vite/TypeScript project build.

**Spec:** `docs/superpowers/specs/2026-08-31-buffet-per-round-quantity-combination-design.md`

## Global Constraints

- `N` is the current order's effective party size; no diner-level counters are introduced.
- Fixed per-round values are not multiplied by `N`; per-person per-round values are multiplied by `N`.
- Total lower bounds only apply to total quantity rules; selected dish/category/dish-set rules are maximum-only.
- Upper bounds run on every quantity-increasing mutation; total lower bounds run only when submitting or closing a non-empty round.
- Static feasibility is evaluated for integer party sizes `1..supportedPartySizeMax`; the prototype fallback is `99`.
- Blank means unconfigured and `0` means prohibit; blank must never normalize to `0`.
- All matching constraints use logical AND; total lower bounds merge by maximum and upper bounds by minimum.
- Category members and dish-set members aggregate into shared pools; same-dish limits apply independently to each menu identity.
- Store product scope and quantity data remain store-specific.
- Existing menu-order-limit routes, storage, rule choices, and runtime behavior must not change.

---

### Task 1: Constraint-kind profile and schema

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-per-round-profile.mjs`

**Interfaces:**
- Produces: `constraintKind` values `target_max | round_total | same_dish_max`.
- Produces: rule-level schema v3 fields `totalBoundsByStore` and `sameDishLimitsByStore` through normalized store configs.

- [ ] **Step 1: Write the failing profile/schema verification**

Assert that buffet choices include fixed order/per-round and party/per-round combinations, while menu-order-limit does not expose the new kinds. Assert normalization preserves `{minConfigured,min,maxConfigured,max}` and same-dish cells.

- [ ] **Step 2: Run the verification and confirm RED**

Run: `node scripts/verify-buffet-per-round-profile.mjs`  
Expected: FAIL because `constraintKind` and the new cells are absent.

- [ ] **Step 3: Implement normalized schema v3**

Add pure helpers:

```js
function constraintKindOf(draft) {
  return draft.constraintKind || "target_max";
}

function totalBoundKey(partyIndex, roundIndex) {
  return partyIndex + "|" + roundIndex;
}

function normalizeTotalBound(cell) {
  return {
    minConfigured: !!(cell && cell.minConfigured && Number.isInteger(Number(cell.min)) && Number(cell.min) >= 0),
    min: cell && cell.minConfigured ? Number(cell.min) : null,
    maxConfigured: !!(cell && cell.maxConfigured && Number.isInteger(Number(cell.max)) && Number(cell.max) >= 0),
    max: cell && cell.maxConfigured ? Number(cell.max) : null
  };
}
```

Keep existing records defaulted to `target_max`; only newly edited new-kind records use schema v3.

- [ ] **Step 4: Run profile/schema and legacy scenario verifications**

Run: `node scripts/verify-buffet-per-round-profile.mjs && node scripts/verify-buffet-rule-scenarios.mjs && node scripts/verify-buffet-dish-set-schema.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-per-round-profile.mjs
git commit -m "feat: add buffet per-round constraint schema"
```

### Task 2: Rule-type and scenario editor

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-per-round-editor.mjs`

**Interfaces:**
- Consumes: `constraintKindOf(draft)`.
- Produces: buffet-only rule type choices and correct period/subject normalization.

- [ ] **Step 1: Write failing editor assertions**

Verify the editor contains:

```text
每轮菜品总量
指定菜品/分类/菜品集上限
相同菜品统一上限
```

and fixed per-round order rules no longer normalize to `order_lifetime`.

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/verify-buffet-per-round-editor.mjs`  
Expected: FAIL on missing choices.

- [ ] **Step 3: Implement buffet-only choices**

For `round_total`, display fixed/per-person subject choices and force `period = per_round`. For `same_dish_max`, use the same two subjects and `per_round`. For `target_max`, retain current order-lifetime and party periods while adding fixed order/per-round.

- [ ] **Step 4: Preserve destructive-change confirmation**

Changing `constraintKind`, subject, period, or target type after quantity data exists must clear incompatible downstream data only after the existing reset confirmation.

- [ ] **Step 5: Run editor and menu regression verification**

Run: `node scripts/verify-buffet-per-round-editor.mjs && node scripts/verify-buffet-rule-menu-regression.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-per-round-editor.mjs
git commit -m "feat: add buffet per-round rule choices"
```

### Task 3: Total-bound quantity UI

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/order-limit-flow.css`
- Create: `scripts/verify-buffet-total-bound-ui.mjs`

**Interfaces:**
- Consumes: store config `totalBounds: Record<partyRoundKey, TotalBoundCell>`.
- Produces: store × party range × round range rows with minimum and maximum inputs.

- [ ] **Step 1: Write failing total-bound UI verification**

Assert that total rules render `最少下单` and `最多下单`, omit product selection, and treat either blank side as absent while requiring at least one configured side.

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/verify-buffet-total-bound-ui.mjs`.

- [ ] **Step 3: Implement store selection without product targets**

Add a buffet store-scope selector for targetless rules. `storeHasTargets` must use configured store scope for `round_total` and `same_dish_max`, without creating fake menu targets.

- [ ] **Step 4: Render and bind total-bound rows**

Render one row per store/party/round scene. Validate integers `>= 0`, at least one side configured, and `min <= max` when both exist.

- [ ] **Step 5: Run UI verification and legacy product configuration tests**

Run: `node scripts/verify-buffet-total-bound-ui.mjs && node scripts/verify-buffet-rule-product-configuration.mjs`.

- [ ] **Step 6: Commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" scripts/verify-buffet-total-bound-ui.mjs
git commit -m "feat: configure buffet per-round total bounds"
```

### Task 4: Same-dish uniform cap UI

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Create: `scripts/verify-buffet-same-dish-ui.mjs`

**Interfaces:**
- Consumes: store config `sameDishLimits: Record<partyRoundKey, LimitCell>`.
- Produces: one shared same-dish cap per store/scene, applied independently to every dish.

- [ ] **Step 1: Write failing same-dish UI verification**

Assert no individual product is required, each configured store has one cap row per scene, and copy/summary text says “任意相同菜品分别计算”.

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/verify-buffet-same-dish-ui.mjs`.

- [ ] **Step 3: Implement same-dish rows and validation**

Bind blank/zero semantics to `sameDishLimits`; use existing party and round dimensions. Product scope defaults to all currently orderable dishes at the effective store.

- [ ] **Step 4: Run UI and menu regressions**

Run: `node scripts/verify-buffet-same-dish-ui.mjs && node scripts/verify-buffet-rule-menu-regression.mjs`.

- [ ] **Step 5: Commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" scripts/verify-buffet-same-dish-ui.mjs
git commit -m "feat: configure buffet same-dish caps"
```

### Task 5: Conflict and feasibility validation

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Create: `scripts/verify-buffet-per-round-conflicts.mjs`

**Interfaces:**
- Produces: `mergeTotalBounds(rules, context)` returning `{valid,min,max,code?}`.
- Produces: conflict identities that distinguish fixed and per-person mouths but reject exact duplicate mouths.

- [ ] **Step 1: Write failing conflict cases**

Cover exact duplicates, allowed fixed+per-person stacking, `min > max`, and party-range cases where converted lower bound exceeds the fixed upper bound.

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/verify-buffet-per-round-conflicts.mjs`.

- [ ] **Step 3: Extend mouth and target identity**

Include `constraintKind` in duplicate identity. Exact same kind/subject/period/object/store/conditions conflicts; fixed and per-person variants may coexist.

- [ ] **Step 4: Implement feasibility merge**

Calculate effective lower bounds with `Math.max` and upper bounds with `Math.min`; return `TOTAL_RANGE_UNSATISFIABLE` when the merged interval is empty.

- [ ] **Step 5: Run new and existing conflict suites**

Run: `node scripts/verify-buffet-per-round-conflicts.mjs && node scripts/verify-buffet-rule-conflicts.mjs && node scripts/verify-buffet-dish-set-domain.mjs`.

- [ ] **Step 6: Commit**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-per-round-conflicts.mjs
git commit -m "feat: validate buffet quantity combinations"
```

### Task 6: Atomic runtime evaluation

**Files:**
- Modify: `dist/Configuration center/assets/buffet-rule-domain.js`
- Create: `scripts/verify-buffet-per-round-runtime.mjs`

**Interfaces:**
- Consumes: `input.items`, `context.storeId`, `context.partySize`, `context.roundNo`, and counters.
- Produces: violations `TOTAL_MIN_NOT_MET`, `TOTAL_LIMIT_EXCEEDED`, `TARGET_LIMIT_EXCEEDED`, and `SAME_DISH_LIMIT_EXCEEDED`.

- [ ] **Step 1: Write failing atomic runtime cases**

Cover total minimum/maximum, category aggregation, cross-line dish-set aggregation, fixed+per-person strictest cap, same-dish independent menu identities, minimum ignored during incremental add, minimum enforced at non-empty round commit, empty-round behavior, batch atomic failure, and operation idempotency.

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/verify-buffet-per-round-runtime.mjs`.

- [ ] **Step 3: Compile normalized runtime rules**

Include `constraintKind`, party/round ranges, store configs, total bounds, target members, and same-dish cells in snapshots.

- [ ] **Step 4: Evaluate the complete proposed round state**

For maximum rules evaluate `used + increment` on every quantity-increasing mutation. Evaluate total minimum only when `input.phase` is `round_commit`, `round_close`, `next_round`, or `checkout_with_open_round`; an empty never-started round is exempt. Count each menu identity once per applicable pool and return all blocking violations without partial writes.

- [ ] **Step 5: Run runtime and lifecycle suites**

Run: `node scripts/verify-buffet-per-round-runtime.mjs && node scripts/verify-buffet-rule-runtime.mjs && node scripts/verify-buffet-rule-lifecycle.mjs`.

- [ ] **Step 6: Commit**

```bash
git add "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-per-round-runtime.mjs
git commit -m "feat: evaluate buffet per-round combinations"
```

### Task 7: Review, publish, and lifecycle compatibility

**Files:**
- Modify: `dist/Configuration center/assets/order-limit-flow.js`
- Modify: `dist/Configuration center/assets/buffet-rule-profile.js`
- Create: `scripts/verify-buffet-per-round-lifecycle.mjs`

**Interfaces:**
- Produces: list/review summaries for total, target, and same-dish rules.
- Preserves: repository envelope v1 and legacy rule authoring data.

- [ ] **Step 1: Write failing lifecycle verification**

Assert create/save/reload/copy/publish/disable/enable preserves the new fields and old rules remain editable.

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/verify-buffet-per-round-lifecycle.mjs`.

- [ ] **Step 3: Implement summaries and snapshot persistence**

Display total ranges, target pool caps, and same-dish caps explicitly in list and confirmation views. Unknown rule-level schema remains read-only and does not invalidate the repository envelope.

- [ ] **Step 4: Run repository and lifecycle suites**

Run: `node scripts/verify-buffet-per-round-lifecycle.mjs && node scripts/verify-buffet-rule-repository.mjs && node scripts/verify-buffet-default-scenario-rules.mjs`.

- [ ] **Step 5: Commit**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/buffet-rule-profile.js" scripts/verify-buffet-per-round-lifecycle.mjs
git commit -m "feat: persist buffet quantity combination rules"
```

### Task 8: Full regression, build, and browser verification

**Files:**
- Modify only if defects are discovered in scoped files.

**Interfaces:**
- Validates all prior task outputs as one feature.

- [ ] **Step 1: Run every buffet verification**

Run all `scripts/verify-buffet-*.mjs`; expected PASS.

- [ ] **Step 2: Run JavaScript syntax and repository diff checks**

Run `node --check` for the shared flow, profile, and domain files, then `git diff --check`.

- [ ] **Step 3: Run the complete project build**

Run: `npm.cmd run build`  
Expected: successful Vite/TypeScript build. Do not commit unrelated generated hashes.

- [ ] **Step 4: Browser-test representative flows**

Verify at least:

1. fixed per-round total min/max;
2. per-person per-round category max;
3. fixed plus per-person dish-set max;
4. same-dish max;
5. contradictory bounds are blocked;
6. existing order-lifetime dish/category/dish-set rule remains unchanged.

- [ ] **Step 5: Commit defect fixes if any**

```bash
git add "dist/Configuration center/assets/order-limit-flow.js" "dist/Configuration center/assets/order-limit-flow.css" "dist/Configuration center/assets/buffet-rule-profile.js" "dist/Configuration center/assets/buffet-rule-domain.js" scripts/verify-buffet-*.mjs
git commit -m "fix: complete buffet quantity combination flow"
```
