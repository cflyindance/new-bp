# Demo Switch Non-MVP Badge Line Break Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the “非MVP版本” badges below and left-aligned with the “集团总部” and “M平台” labels in the flat Demo switch panel.

**Architecture:** Keep the shared badge renderer unchanged. Add a local stacked label-and-badge wrapper only to the two flat view cards, preserving the existing button, state, grid, and event-binding contracts.

**Tech Stack:** TypeScript, template-string HTML, Tailwind CSS utilities, Vite.

---

### Task 1: Lock the target flat-card structure with a failing check

**Files:**
- Modify: `scripts/verify-emenu-local-config-shell.mjs`
- Test: `scripts/verify-emenu-local-config-shell.mjs`

- [ ] **Step 1: Add a structural assertion for the local stacked badge wrapper**

Add this assertion beside the existing Demo switch checks:

```js
expect(viewSwitch, /data-demo-switch-non-mvp-stack/, "Flat non-MVP cards must expose a stacked badge wrapper");
expect(viewSwitch, /perspective === "group-hq"[\s\S]*renderFlatNonMvpContent/, "Flat Group HQ card must use the stacked badge wrapper");
expect(viewSwitch, /renderFlatNonMvpContent\(t\("shell\.mPlatform"\)\)/, "Flat M Platform card must use the stacked badge wrapper");
```

- [ ] **Step 2: Run the verifier and preserve RED evidence**

Run: `node scripts/verify-emenu-local-config-shell.mjs`

Expected: FAIL with `Flat non-MVP cards must expose a stacked badge wrapper`.

### Task 2: Stack the two flat-card badges

**Files:**
- Modify: `src/shell/view-switch-control.ts`
- Test: `scripts/verify-emenu-local-config-shell.mjs`

- [ ] **Step 1: Add a local stacked content renderer**

Add a helper near `FLAT_CARD_CLASS`:

```ts
function renderFlatNonMvpContent(label: string): string {
  return `
    <span data-demo-switch-non-mvp-stack class="flex min-w-0 flex-1 flex-col items-start gap-1 leading-5">
      <span>${escapeHtml(label)}</span>
      <span class="-ml-1 flex">${renderNonMvpBadgeHtml()}</span>
    </span>`;
}
```

The `-ml-1` wrapper cancels the shared badge renderer’s `ml-1` without changing shared consumers.

- [ ] **Step 2: Use the helper only for Group HQ and M Platform**

In `renderFlatChainCard`, replace the name and badge output with:

```ts
${perspective === "group-hq"
  ? renderFlatNonMvpContent(labelForChainPerspective(perspective))
  : `<span class="min-w-0 flex-1 leading-5">${escapeHtml(labelForChainPerspective(perspective))}</span>`}
```

In `renderFlatMPlatformCard`, replace the name and badge output with:

```ts
${renderFlatNonMvpContent(t("shell.mPlatform"))}
```

Do not modify the selection icon, button attributes, shared badge renderer, or legacy dropdown renderers.

- [ ] **Step 3: Run GREEN and type checks**

Run: `node scripts/verify-emenu-local-config-shell.mjs`

Expected: PASS with `eMenu local configuration shell verification passed`.

Run: `npx.cmd tsc --noEmit`

Expected: exit code 0.

Run: `git diff --check -- scripts/verify-emenu-local-config-shell.mjs src/shell/view-switch-control.ts`

Expected: exit code 0.

### Task 3: Verify the target page and commit

**Files:**
- Verify: `src/shell/view-switch-control.ts`
- Verify: `scripts/verify-emenu-local-config-shell.mjs`

- [ ] **Step 1: Confirm service provenance**

Open `http://127.0.0.1:64907/src/shell/view-switch-control.ts` and confirm the served module contains `data-demo-switch-non-mvp-stack`. If not, restart port 64907 from `F:\米聚\GitHub仓库\new-bp\admin-web` before browser QA.

- [ ] **Step 2: Run browser E2E on the reported route**

Open `http://127.0.0.1:64907/#/operations/queue-call/menu-order-limits`, open the Demo switch panel, and verify:

```text
集团总部
非MVP版本

M平台
非MVP版本
```

Confirm both badges are below and left-aligned with their names, the panel still has three flat groups, and no nested dropdown triggers are present.

- [ ] **Step 3: Commit only the task files**

```bash
git add -- scripts/verify-emenu-local-config-shell.mjs src/shell/view-switch-control.ts
git commit -m "fix: stack demo switch non-mvp badges"
```
