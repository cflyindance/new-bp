# Merchant Subscription Subject Type Column Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Chinese subject-type column to merchant subscription details while keeping the subject name and ID clear and preserving existing subscription actions.

**Architecture:** Keep the change inside the existing subscription service UI renderer. Add small pure presentation helpers for runtime-safe subject-type and subject-name rendering, then update the table markup and verify the result through the existing subscription verification, production build, and browser assertions.

**Tech Stack:** TypeScript, template-string HTML, Tailwind CSS utility classes, Vite, existing Node/tsx verification script

**Spec:** `docs/superpowers/specs/2026-08-31-merchant-subscription-subject-type-column-design.md`

## Global Constraints

- The six columns must be ordered: 主体、主体类型、服务包、有效期、状态、操作.
- Runtime mappings are `group` → 集团, `brand` → 品牌, and `store` → 门店.
- Missing or invalid runtime subject types display 未知 and 未知主体 without mutating stored data.
- The subject column must not repeat an unresolved ID on two lines.
- The table minimum width is exactly 880px and retains horizontal scrolling.
- Existing create, renew, disable, status, and inheritance behavior must remain unchanged.
- No file under `vendor/emenu-new` is modified, so the eMenu embed build is out of scope.

---

### Task 1: Render and verify the dedicated subject-type column

**Files:**
- Modify: `src/config/subscription-service-ui.ts:122-137`
- Verify: `scripts/verify-subscription-service.ts`

**Interfaces:**
- Consumes: subscription records with runtime fields `subjectType` and `subjectId` from `readSubscriptionServiceSnapshot()`.
- Produces: `subjectTypeLabel(type: unknown): "集团" | "品牌" | "门店" | "未知"` and six-column subscription-table markup.

- [ ] **Step 1: Record the failing UI assertions against the current page**

Open `/#/subscription-service/merchant-subscriptions` after authentication and inspect the subscription table. Confirm the current implementation fails these assertions:

```text
headers === ["主体", "主体类型", "服务包", "有效期", "状态", "操作"]
every data row has 6 td elements
table class contains min-w-[880px]
empty-state td has colspan="6"
```

Expected: FAIL because the current table has five columns, no independent 主体类型 header, `min-w-[760px]`, and `colspan="5"`.

- [ ] **Step 2: Add runtime-safe presentation helpers**

In `src/config/subscription-service-ui.ts`, add the following helper beside `subjectLabel` and make `subjectLabel` reject unknown runtime types safely:

```ts
function subjectTypeLabel(type: unknown): "集团" | "品牌" | "门店" | "未知" {
  if (type === "group") return "集团";
  if (type === "brand") return "品牌";
  if (type === "store") return "门店";
  return "未知";
}

function subjectLabel(type: unknown, id: string): string {
  if (type === "group") return getGroups({ allEnterprises: true }).find((item) => item.groupId === id)?.name ?? id;
  if (type === "brand") return getMerchantById(id)?.name ?? id;
  if (type === "store") return getStoreById(id)?.name ?? id;
  return "未知主体";
}
```

- [ ] **Step 3: Render six cells and prevent duplicate fallback IDs**

Inside `renderSubscriptions()`, compute the presentation values once per row:

```ts
const typeLabel = subjectTypeLabel(subscription.subjectType);
const label = subjectLabel(subscription.subjectType, subscription.subjectId);
const subjectIdLine = label === subscription.subjectId
  ? ""
  : `<div class="mt-1 font-mono text-[10px] text-muted-foreground">${esc(subscription.subjectId)}</div>`;
```

Render the first two cells as:

```ts
<td class="px-4 py-4">
  <div class="font-semibold">${esc(label)}</div>${subjectIdLine}
</td>
<td class="px-4 py-4">
  <span class="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold">${typeLabel}</span>
</td>
```

Update the table markup to:

```html
<table class="w-full min-w-[880px] text-left">
  <thead class="bg-muted/50 text-xs text-muted-foreground">
    <tr>
      <th class="px-4 py-3 font-medium">主体</th>
      <th class="px-4 py-3 font-medium">主体类型</th>
      <th class="px-4 py-3 font-medium">服务包</th>
      <th class="px-4 py-3 font-medium">有效期</th>
      <th class="px-4 py-3 font-medium">状态</th>
      <th class="px-4 py-3 text-right font-medium">操作</th>
    </tr>
  </thead>
</table>
```

Change the empty-state cell to `colspan="6"`. Preserve the existing action-cell `text-right` class and all action data attributes.

- [ ] **Step 4: Run automated verification and production build**

Run:

```bash
npm run verify:subscription-service
npm run build
```

Expected: both commands exit with code 0; the verification prints `subscription-service verification passed`; TypeScript and Vite production build finish successfully.

- [ ] **Step 5: Verify the rendered table in the browser**

Reload the merchant subscriptions route and assert:

```text
headers === ["主体", "主体类型", "服务包", "有效期", "状态", "操作"]
group rows show 集团; brand rows show 品牌; store rows show 门店
each data row has 6 cells
主体 cells contain name plus ID, or one ID line when name resolution falls back
操作 header and cells are right-aligned
at viewport/container width below 880px, the table scrolls horizontally without overlap
续期 and 停用 controls still open their existing flows
browser console contains no errors
```

- [ ] **Step 6: Commit the focused implementation**

```bash
git add src/config/subscription-service-ui.ts
git commit -m "feat: show subscription subject type column"
```

Do not stage unrelated dirty-worktree changes.

