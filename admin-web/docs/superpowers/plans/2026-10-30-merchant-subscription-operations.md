# Merchant Subscription Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为商家订阅列表补齐状态驱动的编辑、立即生效、续期、调整到期、停用、撤销、重新开通、详情和操作记录，并提供影响预览与并发保护。

**Architecture:** 把生命周期、二维服务包状态、操作可用性和影响计算放入独立纯函数模块；存储层统一执行状态、权限语义、快照令牌和审计校验；现有页面只负责渲染“主操作 + 更多”、抽屉和确认弹框。继续使用当前 localStorage 快照，不新增后端依赖。

**Tech Stack:** TypeScript、Vite、原生 DOM 模板、localStorage、Node assert/tsx 验证脚本。

**Spec:** `docs/superpowers/specs/2026-10-30-merchant-subscription-operations-design.md`

## Global Constraints

- 不物理删除订阅；撤销只适用于从未生效的待生效订阅。
- 生命周期与服务包状态分开计算、展示和筛选。
- 商业权益订阅仍从品牌服务权益页办理，普通订阅写接口必须拒绝。
- 高风险写入必须使用五分钟或最近时间边界中较早者作为预览有效期，并在提交时重算影响。
- 当前任务未获 Git 提交授权；每个任务完成后只运行校验并保留未提交改动。

---

### Task 1: Lifecycle and operation policy

**Files:**
- Modify: `src/config/subscription-service-domain.ts`
- Create: `src/config/subscription-operations-domain.ts`
- Modify: `scripts/verify-subscription-service.ts`

**Interfaces:**
- Produces: `subscriptionLifecycle(subscription, now): SubscriptionLifecycle`
- Produces: `subscriptionPackageState(pkg): SubscriptionPackageState`
- Produces: `subscriptionOperationPolicy(snapshot, subscription, now): SubscriptionOperationPolicy`
- Produces: `buildSubscriptionImpactPreview(snapshot, subscriptionId, operation, now): SubscriptionImpactPreview`
- Produces: `assertSubscriptionImpactPreview(snapshot, preview, now): SubscriptionImpactPreview`

- [ ] **Step 1: Add failing assertions for cancelled records, two-dimensional status, operation matrix, route loss/gain and time-boundary expiry**

Add fixed-time cases to `scripts/verify-subscription-service.ts` asserting cancelled records are inactive and ignored by overlap, package `off` does not change lifecycle, package disabled pauses routes, scheduled/off only allows limited edit, and a preview expires at the nearest start/end boundary.

- [ ] **Step 2: Run the focused verification and confirm it fails**

Run: `npm.cmd run verify:subscription-service`

Expected: FAIL because lifecycle, policy and impact preview exports do not exist.

- [ ] **Step 3: Implement the pure domain contracts**

Extend `MerchantSubscription` with `updatedAt`, `cancelledAt`, `cancelledBy`, and `cancelReason`; make `isSubscriptionActive`, overlap checks and effective-route resolution ignore cancelled records. Implement the exact lifecycle priority `cancelled → disabled → scheduled → expired → active`, package-state derivation, action policy and deterministic impact preview fields `providedRouteCount`, `lostRouteCount`, `retainedRouteCount`, `gainedRouteCount`, `alreadyCoveredRouteCount`, `nextBoundaryAt`, `expiresAt`, and `snapshotToken`.

- [ ] **Step 4: Run focused verification**

Run: `npm.cmd run verify:subscription-service`

Expected: PASS with lifecycle, policy, impact, inheritance and overlap assertions.

### Task 2: Atomic storage operations and audit

**Files:**
- Modify: `src/config/subscription-service-store.ts`
- Create: `scripts/verify-subscription-operations.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 preview/policy functions.
- Produces: `updateScheduledMerchantSubscription(input, previewToken?)`
- Produces: `activateMerchantSubscriptionNow(subscriptionId, previewToken)`
- Produces: `adjustMerchantSubscriptionEnd(subscriptionId, endAt, reason, previewToken)`
- Produces: strengthened `extendMerchantSubscription` and `disableMerchantSubscription`
- Produces: `cancelScheduledMerchantSubscription(subscriptionId, reason, previewToken)`
- Produces: `createMerchantSubscriptionFromExisting(sourceId, input)`
- Produces: `getSubscriptionAuditEntries(subscriptionId)`

- [ ] **Step 1: Write store-level failing verification**

Create `scripts/verify-subscription-operations.ts` with isolated in-memory/localStorage stubs covering scheduled edit, off-package limited edit, immediate activation, strict extension, long-term early end, disable reason, cancellation retention, reopening with new ID, commercial rejection, stale token rejection and audit action names.

- [ ] **Step 2: Run the new script and confirm failure**

Run: `npx.cmd tsx scripts/verify-subscription-operations.ts`

Expected: FAIL on missing operation exports.

- [ ] **Step 3: Implement guarded writes**

Every write rereads the snapshot, derives current policy, validates reason length `1..200`, date order and overlap, checks the supplied preview token for high-risk operations, writes all fields and audit in one snapshot, then emits the existing change event. For off-package scheduled edit, compare every locked field and reject changes outside `endAt` and `note`. Reopen calls the existing creation validation with a new ID and logs both source and new IDs.

- [ ] **Step 4: Run store and legacy subscription verification**

Run: `npx.cmd tsx scripts/verify-subscription-operations.ts`

Run: `npm.cmd run verify:subscription-service`

Expected: both PASS.

### Task 3: Status-driven list actions, drawers and confirmation dialogs

**Files:**
- Create: `src/config/subscription-operations-ui.ts`
- Modify: `src/config/subscription-service-ui.ts`
- Modify: `src/config/subscription-list-filters.ts`
- Create: `scripts/verify-subscription-operations-ui.cjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1 policy/preview and Task 2 store functions.
- Produces: `renderSubscriptionRowOperations(...)`, `renderSubscriptionOperationLayer(...)`, and `bindSubscriptionOperationLayer(...)`.

- [ ] **Step 1: Write static UI contract checks**

Assert the UI exposes lifecycle labels including `已作废`, row attributes for `编辑/立即生效/续期/调整到期时间/停用/撤销/重新开通/查看详情/操作记录`, disabled reasons, primary-plus-more structure, impact metrics, locked off-package fields, reason maxlength 200 and accessible dialog/drawer labels.

- [ ] **Step 2: Run the UI verification and confirm failure**

Run: `node scripts/verify-subscription-operations-ui.cjs`

Expected: FAIL because the new operation UI module is absent.

- [ ] **Step 3: Implement operation presentation**

Render one primary action and a keyboard-accessible more menu per lifecycle. Details and audit use right drawers; scheduled edit uses a large drawer; activate/adjust/disable/cancel use centered impact dialogs; reopen reuses the existing create dialog with permitted prefill. Show the lifecycle badge first and package warning badge second. Keep commercial rows routed to “查看品牌服务权益”.

- [ ] **Step 4: Bind writes with error-preserving dialogs**

Generate a fresh preview when opening a high-risk dialog, pass its token on submit, keep user input visible on validation/concurrency failure, and only close and refresh after success. More-menu actions receive explicit disabled explanations through `title` and inline help.

- [ ] **Step 5: Run UI and subscription verification**

Run: `node scripts/verify-subscription-operations-ui.cjs`

Run: `npm.cmd run verify:subscription-service`

Run: `npx.cmd tsx scripts/verify-subscription-operations.ts`

Expected: all PASS.

### Task 4: Regression, type checking and documentation alignment

**Files:**
- Modify: `docs/需求文档/服务与订阅/服务与订阅产品权威需求文档.md`
- Modify: `docs/需求文档/服务与订阅/服务与订阅业务规格说明书（研发交付版）.md`
- Modify: `docs/需求文档/服务与订阅/服务与订阅需求文档（个人规范版）.md`
- Create after browser acceptance: `docs/verification/subscription-operations-20261030/README.md`
- Create after browser acceptance: operation screenshots under `docs/verification/subscription-operations-20261030/`

**Interfaces:**
- Consumes: completed UI behavior and actual browser evidence.
- Produces: aligned acceptance evidence without fabricated screenshots.

- [ ] **Step 1: Run focused and neighboring regressions**

Run: `npm.cmd run verify:subscription-service`

Run: `npx.cmd tsx scripts/verify-subscription-operations.ts`

Run: `node scripts/verify-subscription-operations-ui.cjs`

Run: `node scripts/verify-subscriptions-brand-store.cjs`

Run: `node scripts/verify-subscription-list-filters.cjs`

- [ ] **Step 2: Run TypeScript and diff checks**

Run: `npx.cmd tsc --noEmit`

Run: `git diff --check`

Expected: zero errors.

- [ ] **Step 3: Start the feature preview and perform browser acceptance**

Start an isolated Vite port from this worktree. Verify at least scheduled/on, scheduled/off, active/on, active/off, disabled-package, expired, disabled and cancelled rows; exercise success, cancel and stale-preview failure paths without touching unrelated services.

- [ ] **Step 4: Capture real operation evidence and replace placeholders**

Capture actual entry, drawer/dialog and result states for each implemented operation into `docs/verification/subscription-operations-20261030/`. Replace only corresponding `待补页面图片` markers in all three documents; leave genuinely unverified states explicitly marked.

- [ ] **Step 5: Report the uncommitted delivery**

Report worktree, branch, base commit, changed files, verification commands, browser URL and remaining screenshot gaps. Do not commit, merge or push until the user separately authorizes those actions.
