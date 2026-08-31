# TipOut Rules Fullscreen Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the TipOut rule list and rule editor cover the entire merchant-admin viewport, using the existing marketing-screensaver iframe fullscreen pattern, and exit fullscreen when returning to the TipOut summary.

**Architecture:** A focused parent-app module derives an `enter | exit | preserve` transition from the same-origin TipOut iframe URL and toggles a dedicated fullscreen class on both TipOut embedding contexts. The existing iframe is never rebuilt during the rule flow; the rule list gains one normal link back to `index.html`, whose load event removes fullscreen state.

**Tech Stack:** TypeScript, DOM iframe APIs, CSS, static TipOut HTML, Node.js assertions, Vite dev server

**Spec:** `docs/superpowers/specs/2026-08-31-tipout-rules-fullscreen-flow-design.md`

## Global Constraints

- Do not use the browser Fullscreen API.
- `rules.html` and `rule-add.html` enter or remain fullscreen; `index.html` exits fullscreen; other TipOut pages preserve current state.
- Apply the same behavior to the team-management and reports-center TipOut iframe contexts.
- Reuse the screensaver fullscreen dimensions, positioning, stacking level, border, and background.
- The rule-list return copy must be exactly `返回小费分配汇总`.
- Do not change rule storage, creation, editing, copying, deletion, or allocation logic.
- Preserve unrelated working-tree changes and the user's staged PIT specification.

---

### Task 1: Implement and unit-test the TipOut fullscreen state controller

**Files:**
- Create: `src/config/tipout-rules-fullscreen.ts`
- Create: `scripts/verify-tipout-rules-fullscreen-flow.ts`

**Interfaces:**
- Produces: `TipOutRulesFullscreenTransition = "enter" | "exit" | "preserve"`.
- Produces: `resolveTipOutRulesFullscreenTransition(url: string): TipOutRulesFullscreenTransition`.
- Produces: `bindTipOutRulesFullscreenFlow(root?: ParentNode): void`.
- Consumes later: iframe selector `[data-tipout-rules-frame]`, class `tipout-rules-flow-fullscreen`, attribute `data-tipout-rules-flow-fullscreen`.

- [ ] **Step 1: Write the failing state and idempotency verifier**

Create `scripts/verify-tipout-rules-fullscreen-flow.ts` with URL cases for query strings and hashes, plus a lightweight fake iframe that verifies one listener after two binds:

```ts
import assert from "node:assert/strict";
import {
  bindTipOutRulesFullscreenFlow,
  resolveTipOutRulesFullscreenTransition,
} from "../src/config/tipout-rules-fullscreen";

const cases = [
  ["https://example.test/TipOut/rules.html?embedded=1", "enter"],
  ["https://example.test/TipOut/rule-add.html?poolKind=tip#editor", "enter"],
  ["https://example.test/TipOut/index.html?qa=return#summary", "exit"],
  ["https://example.test/TipOut/detail.html?date=2026-01-01", "preserve"],
] as const;

for (const [url, expected] of cases) {
  assert.equal(resolveTipOutRulesFullscreenTransition(url), expected, url);
}

const classes = new Set<string>();
const attributes = new Set<string>();
let listenerCount = 0;
const frame = {
  dataset: {} as Record<string, string>,
  src: "https://example.test/TipOut/rules.html",
  contentWindow: { location: { href: "https://example.test/TipOut/rules.html" } },
  classList: { toggle: (name: string, on: boolean) => on ? classes.add(name) : classes.delete(name) },
  toggleAttribute: (name: string, on: boolean) => on ? attributes.add(name) : attributes.delete(name),
  addEventListener: (type: string) => { if (type === "load") listenerCount += 1; },
} as unknown as HTMLIFrameElement;
const root = { querySelectorAll: () => [frame] } as unknown as ParentNode;

bindTipOutRulesFullscreenFlow(root);
bindTipOutRulesFullscreenFlow(root);
assert.equal(listenerCount, 1);
assert.equal(classes.has("tipout-rules-flow-fullscreen"), true);
assert.equal(attributes.has("data-tipout-rules-flow-fullscreen"), true);
```

- [ ] **Step 2: Run the verifier and confirm it fails**

```powershell
npx.cmd --yes tsx scripts/verify-tipout-rules-fullscreen-flow.ts
```

Expected: FAIL because `src/config/tipout-rules-fullscreen.ts` does not exist.

- [ ] **Step 3: Implement the focused controller**

Create `src/config/tipout-rules-fullscreen.ts`:

```ts
const TIPOUT_RULES_FULLSCREEN_ENTRY_FILES = new Set(["rules.html", "rule-add.html"]);
const TIPOUT_RULES_FULLSCREEN_EXIT_FILES = new Set(["index.html"]);

export type TipOutRulesFullscreenTransition = "enter" | "exit" | "preserve";

function getPageFileName(url: string): string {
  try {
    const baseUrl = typeof window === "undefined" ? "http://localhost/" : window.location.href;
    return decodeURIComponent(new URL(url, baseUrl).pathname.split("/").pop() ?? "").toLowerCase();
  } catch {
    return "";
  }
}

export function resolveTipOutRulesFullscreenTransition(url: string): TipOutRulesFullscreenTransition {
  const fileName = getPageFileName(url);
  if (TIPOUT_RULES_FULLSCREEN_ENTRY_FILES.has(fileName)) return "enter";
  if (TIPOUT_RULES_FULLSCREEN_EXIT_FILES.has(fileName)) return "exit";
  return "preserve";
}

function setTipOutRulesFullscreen(frame: HTMLIFrameElement, fullscreen: boolean): void {
  frame.classList.toggle("tipout-rules-flow-fullscreen", fullscreen);
  frame.toggleAttribute("data-tipout-rules-flow-fullscreen", fullscreen);
}

function syncTipOutRulesFullscreen(frame: HTMLIFrameElement): void {
  let currentUrl = "";
  try {
    currentUrl = frame.contentWindow?.location.href ?? frame.src;
  } catch {
    return;
  }
  const transition = resolveTipOutRulesFullscreenTransition(currentUrl);
  if (transition === "enter") setTipOutRulesFullscreen(frame, true);
  if (transition === "exit") setTipOutRulesFullscreen(frame, false);
}

export function bindTipOutRulesFullscreenFlow(root: ParentNode = document): void {
  root.querySelectorAll<HTMLIFrameElement>("[data-tipout-rules-frame]").forEach((frame) => {
    if (frame.dataset.tipoutRulesFullscreenBound === "true") return;
    frame.dataset.tipoutRulesFullscreenBound = "true";
    frame.addEventListener("load", () => syncTipOutRulesFullscreen(frame));
    syncTipOutRulesFullscreen(frame);
  });
}
```

- [ ] **Step 4: Run the verifier and confirm it passes**

```powershell
npx.cmd --yes tsx scripts/verify-tipout-rules-fullscreen-flow.ts
```

Expected: `TipOut rules fullscreen flow verification passed.` and exit code 0.

- [ ] **Step 5: Commit the controller and verifier**

```powershell
git add -- src/config/tipout-rules-fullscreen.ts scripts/verify-tipout-rules-fullscreen-flow.ts
git commit --only -m "feat: add tipout rules fullscreen controller" -- src/config/tipout-rules-fullscreen.ts scripts/verify-tipout-rules-fullscreen-flow.ts
```

### Task 2: Integrate both parent iframes and add the rule-list return entry

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles/app.css`
- Modify: `dist/TipOut/rules.html`
- Modify: `dist/TipOut/prototype-fidelity.css`
- Modify: `scripts/verify-tipout-interaction-refresh.mjs`
- Modify: `scripts/verify-tipout-rules-fullscreen-flow.ts`

**Interfaces:**
- Consumes: `bindTipOutRulesFullscreenFlow(root?: ParentNode): void` from Task 1.
- Produces: two `[data-tipout-rules-frame]` iframes bound after every app mount.
- Produces: `.tipout-rules-flow-fullscreen` fixed viewport styling.
- Produces: `rules.html` link `href="index.html"` with copy `返回小费分配汇总`.

- [ ] **Step 1: Extend the verifier with failing integration contracts**

In `scripts/verify-tipout-rules-fullscreen-flow.ts`, read `src/main.ts`, `src/styles/app.css`, and `dist/TipOut/rules.html`, then assert:

```ts
const mainSource = fs.readFileSync(path.join(rootDir, "src/main.ts"), "utf8");
const appCss = fs.readFileSync(path.join(rootDir, "src/styles/app.css"), "utf8");
const rulesHtml = fs.readFileSync(path.join(rootDir, "dist/TipOut/rules.html"), "utf8");

assert.equal((mainSource.match(/data-tipout-rules-frame/g) ?? []).length, 2);
assert.match(mainSource, /bindTipOutRulesFullscreenFlow\(app\)/);
assert.match(appCss, /iframe\.tipout-rules-flow-fullscreen/);
assert.match(rulesHtml, /href="index\.html"[^>]*>返回小费分配汇总<\/a>/);
```

Also add the same return-link assertion to `scripts/verify-tipout-interaction-refresh.mjs`.

- [ ] **Step 2: Run both verifiers and confirm the new contracts fail**

```powershell
npx.cmd --yes tsx scripts/verify-tipout-rules-fullscreen-flow.ts
npm.cmd run verify:tipout-interaction-refresh
```

Expected: FAIL on the missing parent integration, CSS class, and return link.

- [ ] **Step 3: Bind both TipOut iframe contexts in `src/main.ts`**

Import `bindTipOutRulesFullscreenFlow`, add `data-tipout-rules-frame` to the iframe returned by `renderReportsTipsAllocationIframePanel()` and `renderTeamTipsManagementIframePanel()`, and call:

```ts
bindMarketingScreensaverFullscreenFlow(app);
bindTipOutRulesFullscreenFlow(app);
```

immediately after the app DOM is rendered.

- [ ] **Step 4: Reuse the screensaver fullscreen CSS declaration**

Change the existing selector in `src/styles/app.css` to:

```css
iframe.marketing-screensaver-flow-fullscreen,
iframe.tipout-rules-flow-fullscreen {
```

Keep every existing declaration in that rule unchanged.

- [ ] **Step 5: Add the rule-list return link and responsive heading layout**

Change the `rules.html` heading to the same three-column structure used by the rule editor:

```html
<div class="tipout-page-heading tipout-page-heading--with-back">
  <a class="btn" href="index.html">返回小费分配汇总</a>
  <div>
    <p class="tipout-kicker">规则管理</p>
    <h1 id="rulesTitle">分配规则</h1>
    <p>配置当前门店的小费池来源、扣除方和接收方。</p>
  </div>
  <div class="tipout-heading-actions">
    <button type="button" class="btn btn-primary" onclick="openAddRuleModal()">新建规则</button>
  </div>
</div>
```

Add `.tipout-page-rules .tipout-page-heading--with-back` desktop grid and mobile flex rules in `prototype-fidelity.css`, matching the existing rule-editor values.

- [ ] **Step 6: Run the integration and TipOut regression verifiers**

```powershell
npx.cmd --yes tsx scripts/verify-tipout-rules-fullscreen-flow.ts
npx.cmd --yes tsx scripts/verify-marketing-screensaver-fullscreen-flow.ts
npm.cmd run verify:tipout-interaction-refresh
npm.cmd run verify:tipout-work-hours-layout
```

Expected: all commands exit with code 0; the existing screensaver flow remains green.

- [ ] **Step 7: Commit the integration change**

```powershell
git add -- src/main.ts src/styles/app.css dist/TipOut/rules.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs scripts/verify-tipout-rules-fullscreen-flow.ts
git commit --only -m "feat: fullscreen tipout rules flow" -- src/main.ts src/styles/app.css dist/TipOut/rules.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-interaction-refresh.mjs scripts/verify-tipout-rules-fullscreen-flow.ts
```

### Task 3: Verify the complete iframe lifecycle

**Files:**
- Modify only if QA exposes a defect: files listed in Task 2

**Interfaces:**
- Consumes: the parent app TipOut iframe, summary rule entry, rule-list return link, and existing rule editor navigation.
- Produces: verified fullscreen lifecycle for empty and non-empty rule states in both embedding contexts.

- [ ] **Step 1: Verify the empty-rule path**

In the running parent app, open the team-management TipOut summary with no rules and click `新建/查看规则`.

Expected: `rule-add.html?poolKind=tip` loads in the same iframe; the iframe has `tipout-rules-flow-fullscreen`; its viewport covers the parent sidebar and header; no browser fullscreen permission prompt appears.

- [ ] **Step 2: Verify the rule-list and editor path**

Create one temporary rule through the existing editor, confirm the rule list remains fullscreen, enter edit mode, and confirm the editor remains fullscreen.

Expected: rule data, editor fields, save, copy, delete, and confirmation behavior remain unchanged.

- [ ] **Step 3: Verify exit and state restoration**

From the fullscreen rule list, click `返回小费分配汇总`.

Expected: `index.html` loads, the fullscreen class and attribute are removed, and the parent sidebar and header are visible again. Delete the temporary rule through the visible rule UI and restore the pre-test rule state.

- [ ] **Step 4: Verify the reports-center context**

Repeat entry and exit through the reports-center TipOut iframe.

Expected: the same class lifecycle occurs on the second `[data-tipout-rules-frame]` context.

- [ ] **Step 5: Run final automated checks**

```powershell
npx.cmd --yes tsx scripts/verify-tipout-rules-fullscreen-flow.ts
npx.cmd --yes tsx scripts/verify-marketing-screensaver-fullscreen-flow.ts
npm.cmd run verify:tipout-interaction-refresh
npm.cmd run verify:tipout-work-hours-layout
npx.cmd --yes tsc --noEmit
git diff --check -- src/config/tipout-rules-fullscreen.ts src/main.ts src/styles/app.css dist/TipOut/rules.html dist/TipOut/prototype-fidelity.css scripts/verify-tipout-rules-fullscreen-flow.ts scripts/verify-tipout-interaction-refresh.mjs
```

Expected: all targeted checks pass. If TypeScript is blocked by an unrelated pre-existing file, record the exact diagnostic and do not modify unrelated code.
