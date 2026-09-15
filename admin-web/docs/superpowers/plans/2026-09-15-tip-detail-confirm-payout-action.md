# Tip Detail Confirm Payout Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已分配且待发放的小费分配明细页提供“确认已发放”，复用现有发放领域能力，并在成功后锁定当日结果。

**Architecture:** 明细模板只承载操作入口与确认弹框；`details.js.txt` 负责从 `TipOutDateState.inspect/ensureSnapshot/confirmPayout` 获取权威状态、驱动弹框和刷新页面。所有写入继续通过既有领域接口，页面用确认意图令牌隔离迟到回调，并通过同门店同日期状态通知处理跨标签竞态。

**Tech Stack:** 原生 HTML、CSS、ES5 风格浏览器 JavaScript、Node.js 结构契约验证脚本、Vite/TypeScript 构建。

**Spec:** `docs/superpowers/specs/2026-09-15-tip-detail-confirm-payout-action-design.md`

## Global Constraints

- 仅当 `allocationStatus=allocated`、`payoutStatus=pending` 且 `locked=false` 时展示“确认已发放”。
- “确认已发放”位于“重新确认分配”左侧，并复用日期汇总的弹框信息和警告语义。
- 发放必须调用同一套 `TipOutDateState.ensureSnapshot` 与 `TipOutDateState.confirmPayout`，不得直接写本地存储。
- 提交异常必须先用 `inspect` 对账；同一确认意图的重试复用同一 `requestId`。
- 跨标签新状态优先于本地提交，迟到回调不得覆盖最新状态。
- 已发放或异常锁定状态保持保护性只读，写入最终由 `assertDateWritable` 拦截。

---

## File Structure

- `src/team/tips/templates/details.html`：明细操作按钮、确认弹框和可聚焦锁定状态承载结构。
- `src/team/tips/programs/details.js.txt`：明细发放状态机、弹框生命周期、领域调用、异常对账和跨标签刷新。
- `src/team/tips/tips-page.css`：沿用现有弹框及操作栏样式，仅补充必要的按钮分组和提交禁用状态。
- `scripts/verify-tipout-payout-ui.mjs`：明细发放入口、公共领域调用、状态保护和无障碍契约验证。
- `scripts/verify-tipout-detail-payout-flow.mjs`：在隔离的浏览器模拟环境验证请求幂等、状态分支和迟到回调保护。

### Task 1: 明细发放入口与弹框结构

**Files:**
- Modify: `src/team/tips/templates/details.html`
- Modify: `scripts/verify-tipout-payout-ui.mjs`

**Interfaces:**
- Consumes: 现有 `detailActionBar`、`confirmDetailAllocationBtn` 和通用 `.modal-overlay` 结构。
- Produces: `confirmDetailPayoutBtn`、`detailConfirmPayoutModal`、`detailPayoutStore`、`detailPayoutDate`、`detailPayoutAmount`、`detailPayoutEmployees`、`submitDetailPayoutBtn`，供 Task 2 使用。

- [ ] **Step 1: 写失败的结构契约**

在 `scripts/verify-tipout-payout-ui.mjs` 中增加以下断言：

```js
for (const id of ['confirmDetailPayoutBtn', 'detailConfirmPayoutModal', 'detailPayoutStore', 'detailPayoutDate', 'detailPayoutAmount', 'detailPayoutEmployees', 'submitDetailPayoutBtn']) {
  assert.match(detailTemplate, new RegExp(`id="${id}"`));
}
assert.match(detailTemplate, /id="confirmDetailPayoutBtn"[\s\S]*id="confirmDetailAllocationBtn"/);
assert.match(detailTemplate, /确认后分配结果将锁定，无法修改或取消/);
```

- [ ] **Step 2: 运行验证并确认失败**

Run: `node scripts/verify-tipout-payout-ui.mjs`

Expected: FAIL，提示 `confirmDetailPayoutBtn` 不存在。

- [ ] **Step 3: 添加最小模板结构**

在 `detailActionBar` 的按钮容器中，把次级按钮放在现有主按钮之前：

```html
<button id="confirmDetailPayoutBtn" class="btn" hidden data-native-onclick="openDetailPayoutModal(event)">确认已发放</button>
<button id="confirmDetailAllocationBtn" class="btn btn-primary" data-native-onclick="confirmDetailAllocation()">确认分配</button>
```

在页面末尾增加 `detailConfirmPayoutModal`，展示门店、日期、已分配金额、去重员工人数、锁定警告，以及调用 `closeDetailPayoutModal()`、`submitDetailPayout()` 的取消/确认按钮；弹框默认关闭并使用现有 modal class。

- [ ] **Step 4: 运行结构验证**

Run: `node scripts/verify-tipout-payout-ui.mjs`

Expected: 新增结构断言 PASS；行为断言尚未加入。

- [ ] **Step 5: 提交入口结构**

```bash
git add src/team/tips/templates/details.html scripts/verify-tipout-payout-ui.mjs
git commit -m "feat: add detail payout confirmation shell"
```

### Task 2: 明细发放状态机与领域提交

**Files:**
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `scripts/verify-tipout-payout-ui.mjs`

**Interfaces:**
- Consumes: Task 1 DOM IDs；`TipOutDateState.inspect(store,date)`、`ensureSnapshot(store,date)`、`confirmPayout(input)`。
- Produces: `syncDetailPayoutAction()`、`openDetailPayoutModal(event)`、`closeDetailPayoutModal()`、`submitDetailPayout()`；确认草稿形状为 `{storeId,businessDate,snapshotId,snapshotVersion,snapshotHash,requestId}`。

- [ ] **Step 1: 写失败的行为契约**

```js
assert.match(detailProgram, /function syncDetailPayoutAction\(\)/);
assert.match(detailProgram, /async function openDetailPayoutModal\(event\)/);
assert.match(detailProgram, /async function submitDetailPayout\(\)/);
assert.match(detailProgram, /TipOutDateState\.ensureSnapshot\(store, dateKey\)/);
assert.match(detailProgram, /TipOutDateState\.confirmPayout\(detailPayoutDraft\)/);
assert.match(detailProgram, /state\.allocationStatus === 'allocated'[\s\S]*state\.payoutStatus === 'pending'[\s\S]*!state\.locked/);
```

- [ ] **Step 2: 运行验证并确认失败**

Run: `node scripts/verify-tipout-payout-ui.mjs`

Expected: FAIL，提示 `syncDetailPayoutAction` 不存在。

- [ ] **Step 3: 实现权威状态驱动的入口**

增加单一 UI 状态来源：

```js
var detailPayoutDraft = null;
var detailPayoutSubmitting = false;
var detailPayoutIntentVersion = 0;

function syncDetailPayoutAction() {
  var button = document.getElementById('confirmDetailPayoutBtn');
  var store = ((document.getElementById('storeSelect') || {}).value || '').trim();
  var dateKey = ((document.getElementById('detailDate') || {}).value || '').trim();
  var state = window.TipOutDateState ? TipOutDateState.inspect(store, dateKey) : null;
  var visible = !!state && state.allocationStatus === 'allocated' && state.payoutStatus === 'pending' && !state.locked;
  button.hidden = !visible;
  button.style.display = visible ? '' : 'none';
  button.disabled = detailPayoutSubmitting;
}
```

从 `renderDetailPage()` 和 `syncDetailAllocationAction()` 调用该函数，确保切换日期、门店、分配成功及重渲染后同步。

- [ ] **Step 4: 实现打开、取消和提交**

`openDetailPayoutModal` 调用 `ensureSnapshot`，从快照填充金额与去重员工人数，保存快照三元组并生成一次 `requestId`；提交期间禁用所有关闭入口。`submitDetailPayout` 调用：

```js
await TipOutDateState.confirmPayout(detailPayoutDraft);
```

成功后清理草稿、关闭弹框、调用 `renderDetailPage()` 并提示“已确认发放”。普通关闭后将焦点返回 `confirmDetailPayoutBtn`。

- [ ] **Step 5: 运行领域与 UI 回归**

Run: `npm run verify:tipout-payout-lock`

Expected: `Tip payout lock verification passed.` 和 `Tip payout UI verification passed.`

- [ ] **Step 6: 提交基础行为**

```bash
git add src/team/tips/programs/details.js.txt scripts/verify-tipout-payout-ui.mjs
git commit -m "feat: confirm payout from tip detail"
```

### Task 3: 异常对账与跨标签迟到回调保护

**Files:**
- Create: `scripts/verify-tipout-detail-payout-flow.mjs`
- Modify: `src/team/tips/programs/details.js.txt`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2 的 `detailPayoutIntentVersion` 与 `detailPayoutDraft`。
- Produces: `reconcileDetailPayout(intentVersion, expectedSnapshot)`，返回 `'paid' | 'retry' | 'stale' | 'locked'`；`invalidateDetailPayoutIntent()` 使旧异步回调失效。

- [ ] **Step 1: 写失败的流程验证脚本**

脚本加载明细程序并用可控的 `TipOutDateState` stub 覆盖四组场景：

```js
assert.equal(await reconcileCase({ payoutStatus: 'paid' }), 'paid');
assert.equal(await reconcileCase({ payoutStatus: 'pending', sameSnapshot: true }), 'retry');
assert.equal(await reconcileCase({ payoutStatus: 'pending', sameSnapshot: false }), 'stale');
assert.equal(await reconcileCase({ payoutStatus: 'error', locked: true }), 'locked');
assert.equal(await lateCallbackCase({ external: 'paid', callback: 'reject' }), 'paid');
assert.equal(await lateCallbackCase({ external: 'snapshot-changed', callback: 'resolve' }), 'stale');
```

同时断言迟到回调不会重开弹框、恢复旧控件或覆盖 `paidByDisplayNameAtConfirmation/paidAt`。

- [ ] **Step 2: 运行新脚本并确认失败**

Run: `node scripts/verify-tipout-detail-payout-flow.mjs`

Expected: FAIL，提示对账或意图作废函数不存在。

- [ ] **Step 3: 实现提交异常对账**

在 `submitDetailPayout` 的异常分支首先调用 `inspect`：已发放则进入只读；同快照待发放则保留弹框并允许原 `requestId` 重试；快照变化则作废并关闭；异常锁定则进入保护性只读。不得在 `catch` 中直接假定仍待发放。

- [ ] **Step 4: 实现跨标签状态优先**

接入项目现有的 tip-out 状态通知；只处理当前门店与日期。通知到达时递增 `detailPayoutIntentVersion`、关闭旧弹框并重新 `inspect/renderDetailPage`。每个提交回调在更新 UI 前比较捕获的 intent version；不一致时只重新读取领域状态，不触碰旧弹框控件。

- [ ] **Step 5: 加入 npm 验证入口并运行**

在 `package.json` 增加：

```json
"verify:tipout-detail-payout": "node scripts/verify-tipout-detail-payout-flow.mjs && node scripts/verify-tipout-payout-lock.mjs && node scripts/verify-tipout-payout-ui.mjs"
```

Run: `npm run verify:tipout-detail-payout`

Expected: 全部 PASS，且写入成功但响应异常的同 requestId 重试只保留一条发放记录。

- [ ] **Step 6: 提交竞态保护**

```bash
git add src/team/tips/programs/details.js.txt scripts/verify-tipout-detail-payout-flow.mjs package.json
git commit -m "fix: protect detail payout confirmation races"
```

### Task 4: 完整回归与交付

**Files:**
- Modify only if verification reveals a defect: `src/team/tips/templates/details.html`, `src/team/tips/programs/details.js.txt`, `src/team/tips/tips-page.css`, verification scripts.

**Interfaces:**
- Consumes: Tasks 1–3 的完整明细发放流程。
- Produces: 可合入 `main` 的验证通过提交。

- [ ] **Step 1: 运行小费原生页面契约**

Run: `node scripts/verify-team-tips-native-views.mjs`

Expected: PASS。

- [ ] **Step 2: 运行小费发放专项回归**

Run: `npm run verify:tipout-detail-payout`

Expected: PASS。

- [ ] **Step 3: 运行生产构建**

Run: `npm.cmd run build`

Expected: TypeScript 与 Vite 构建成功退出；本改动不涉及 `vendor/emenu-new`，无需执行 eMenu embed 构建。

- [ ] **Step 4: 浏览器验证关键状态**

在本地预览验证：未分配不展示按钮；已分配待发放时按钮位于重新确认左侧；取消不改变状态；确认后页面立即只读；刷新和返回日期汇总仍为已发放；另一个标签重分配或发放后旧弹框不能提交旧快照。

- [ ] **Step 5: 检查工作树并提交必要修复**

```bash
git diff --check
git status --short
git add src/team/tips/templates/details.html src/team/tips/programs/details.js.txt src/team/tips/tips-page.css scripts/verify-tipout-payout-ui.mjs scripts/verify-tipout-detail-payout-flow.mjs package.json
git commit -m "test: verify detail payout confirmation"
```

若没有额外修复，不创建空提交。

- [ ] **Step 6: 合入 main 并确认提交可达**

从主工作区在确认无冲突后执行 `git merge --no-ff codex/tip-detail-confirm-payout`，再运行 `git merge-base --is-ancestor codex/tip-detail-confirm-payout main`；只有命令成功才报告已合入。
