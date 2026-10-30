# 商家订阅“更多”Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将商家订阅明细的行内“更多”改为与服务包管理一致的原生 Popover 菜单，同时保持订阅操作矩阵和业务处理链不变。

**Architecture:** `subscription-operations-ui.ts` 负责输出 Popover 语义、共享样式类、禁用原因和绑定函数；`subscription-service-ui.ts` 只在页面挂载时调用绑定函数，并继续处理现有 `data-sub-operation` 业务事件。静态契约脚本先锁定 DOM、键盘、关闭、定位与禁用行为，再进行 TypeScript、业务回归和真实浏览器验收。

**Tech Stack:** TypeScript 5.6、原生 HTML Popover API、DOM KeyboardEvent、Vite 6、Node.js 静态契约脚本。

**Spec:** `docs/superpowers/specs/2026-10-30-subscription-more-popover-design.md`

## Global Constraints

- 起始基线固定为 `main@e7d38635`，分支为 `codex/subscription-more-popover-20261030`。
- 触发器和菜单直接复用服务包 `package-more`、`package-menu` 样式契约，不复制近似 CSS。
- 只改变“更多”菜单展示和交互；主操作、状态操作矩阵、权限、确认弹框、存储写入和审计保持不变。
- 禁用项使用 `aria-disabled="true"` 保持可聚焦，禁用原因使用可见文本并由 `aria-describedby` 关联，激活不得执行。
- 菜单内部滚动保持打开；表格、列表、页面及其他外层滚动关闭。
- 当前授权不包含 Git 提交、合并或推送；计划内不得执行 `git commit`。

---

### Task 1: 锁定“更多”Popover 静态契约

**Files:**
- Modify: `scripts/verify-subscription-operations-ui.cjs`
- Test: `scripts/verify-subscription-operations-ui.cjs`

**Interfaces:**
- Consumes: `src/config/subscription-operations-ui.ts` 与 `src/config/subscription-service-ui.ts` 的源码文本。
- Produces: 对 `data-sub-more`、`data-sub-operations-menu`、`popover="auto"`、共享样式类、ARIA、键盘按键、滚动关闭规则和页面绑定调用的可执行静态契约。

- [ ] **Step 1: 将旧行内展开断言改为 Popover 失败断言**

  删除 `assert(ui.includes('<details'), ...)`，加入以下明确断言：

  ```js
  assert(!ui.includes('<details'), 'row operations must not expand table rows');
  for (const hook of [
    'data-sub-more',
    'data-sub-operations-menu',
    'popover="auto"',
    'aria-haspopup="menu"',
    'aria-controls',
    'aria-expanded="false"',
    'role="menu"',
    'role="menuitem"',
    'package-more',
    'package-menu',
    'aria-disabled="true"',
    'aria-describedby',
  ]) assert(ui.includes(hook), `missing popover contract ${hook}`);
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Tab']) {
    assert(ui.includes(key), `missing keyboard behavior ${key}`);
  }
  assert(ui.includes("closest('[data-sub-operations-menu]')"), 'menu scroll must stay open');
  assert(page.includes('bindSubscriptionMoreMenus(document)'), 'subscription page must bind more menus');
  ```

- [ ] **Step 2: 运行契约脚本并确认先失败**

  Run: `npm.cmd run verify:subscription-operations-ui`

  Expected: FAIL，首个缺失项为 `data-sub-more`、`popover="auto"` 或 `bindSubscriptionMoreMenus(document)`，证明旧 `<details>` 实现未满足新契约。

---

### Task 2: 渲染并绑定订阅 Popover 菜单

**Files:**
- Modify: `src/config/subscription-operations-ui.ts`
- Modify: `src/config/subscription-service-ui.ts`
- Test: `scripts/verify-subscription-operations-ui.cjs`

**Interfaces:**
- Consumes: `subscriptionOperationPolicy(snapshot, subscription, now)` 返回的 `primary`、`allowed`、`disabled`；现有 `data-sub-operation` 和 `data-subscription-id` 业务事件契约。
- Produces: `export function bindSubscriptionMoreMenus(root: ParentNode): void`；DOM hooks `data-sub-more`、`data-sub-operations-menu`、`data-sub-disabled-reason`。

- [ ] **Step 1: 把次要操作渲染为原生 Popover**

  在 `renderSubscriptionRowOperations` 中为每条记录生成稳定菜单 ID：

  ```ts
  const menuId = `subscription-operations-${encodeURIComponent(subscription.id)}`;
  ```

  用以下结构替换 `<details>`；`primary` 保持现有渲染：

  ```ts
  return `${primary}<button type="button" class="ba-btn package-more" data-sub-more="${esc(subscription.id)}" aria-haspopup="menu" aria-controls="${esc(menuId)}" aria-expanded="false">更多 <span aria-hidden="true">⌄</span></button><div id="${esc(menuId)}" popover="auto" class="package-menu" data-sub-operations-menu="${esc(subscription.id)}" role="menu" aria-label="订阅更多操作">${more}${unavailable}</div>`;
  ```

  非主操作按钮统一输出 `role="menuitem" tabindex="-1"`。危险操作继续携带可被共享 CSS 命中的危险状态属性。

- [ ] **Step 2: 让禁用项可聚焦、可读原因但不可执行**

  调整 `operationButton`：仅菜单项使用 `role="menuitem" tabindex="-1"`；禁用项不用原生 `disabled`，而是输出 `aria-disabled="true"`、`aria-describedby="<reason-id>"`，并在同一菜单内输出带 `data-sub-disabled-reason` 的可见原因文本。点击或键盘激活前以 `button.getAttribute('aria-disabled') === 'true'` 阻止业务处理。

  原因 ID 使用订阅 ID 与操作名组合，确保同页唯一：

  ```ts
  const reasonId = `subscription-${encodeURIComponent(subscriptionId)}-${operation}-reason`;
  ```

- [ ] **Step 3: 实现与服务包一致的打开、定位和单实例行为**

  在 `subscription-operations-ui.ts` 导出：

  ```ts
  export function bindSubscriptionMoreMenus(root: ParentNode): void
  ```

  函数逐个绑定 `[data-sub-more]`：根据 `aria-controls` 找到菜单；用触发器 `getBoundingClientRect()` 计算 `left/top/maxHeight`；菜单宽度按共享样式 170px 计算，视口边距 12px，默认下方 6px，下方不足则向上。调用 `showPopover()` 后聚焦首项，同一时刻依赖 `popover="auto"` 只保留一个菜单。

- [ ] **Step 4: 实现完整键盘矩阵**

  触发器：`ArrowDown` 打开首项，`ArrowUp` 打开末项，`Enter`／`Space` 使用按钮默认 click 开关。菜单：`ArrowDown`、`ArrowUp` 循环全部菜单项，`Home`、`End` 到首尾，`Escape` 关闭并恢复触发器焦点。`Tab`／`Shift+Tab` 只关闭，不调用 `preventDefault()`，让浏览器保持正常正反向焦点顺序。可执行项的 `Enter`／`Space` 沿用按钮 click；`aria-disabled="true"` 项的 click 立即 `preventDefault()` 与 `stopPropagation()`。

- [ ] **Step 5: 实现关闭与生命周期清理**

  通过模块级一次性全局监听关闭所有 `[data-sub-operations-menu]:popover-open`：`resize`、`hashchange`、外层捕获阶段 `scroll`。当 `scroll` 事件目标位于当前菜单内时不关闭；表格或页面滚动关闭。`toggle` 时同步触发器 `aria-expanded`。再次点击同一触发器时关闭；菜单或触发器断开 DOM 时安全退出。

- [ ] **Step 6: 接入页面挂载而不改变业务处理链**

  在 `subscription-service-ui.ts` 导入 `bindSubscriptionMoreMenus`，在订阅列表已渲染且绑定 `[data-sub-operation]` 之前调用：

  ```ts
  bindSubscriptionMoreMenus(document);
  ```

  现有 `[data-sub-operation]` click 回调开头加入禁用保护；其余 `subscriptionId`、`operation`、影响预览、`modalState` 与 `refresh(onMount)` 逻辑原样保留。

- [ ] **Step 7: 运行静态契约与 TypeScript 校验**

  Run:

  ```powershell
  npm.cmd run verify:subscription-operations-ui
  npx.cmd tsc --noEmit
  ```

  Expected: 契约脚本打印 `subscription operation UI verification passed`；TypeScript 退出码 0。

---

### Task 3: 回归业务规则并完成浏览器验收证据

**Files:**
- Modify: `docs/需求文档/服务与订阅/服务与订阅产品权威需求文档.md`
- Modify: `docs/需求文档/服务与订阅/服务与订阅业务规格说明书（研发交付版）.md`
- Modify: `docs/需求文档/服务与订阅/服务与订阅需求文档（个人规范版）.md`
- Create: `docs/verification/subscription-more-popover-20261030/README.md`
- Create: `docs/verification/subscription-more-popover-20261030/more-open-down.png`
- Create: `docs/verification/subscription-more-popover-20261030/more-open-up.png`

**Interfaces:**
- Consumes: Task 2 的 Popover DOM 与现有订阅操作业务链。
- Produces: V1.28 三文档的实采图片引用、变更编号 `SUBSCRIPTION-MORE-POPOVER-20261030-101` 的验证记录和可复核截图。

- [ ] **Step 1: 运行订阅业务回归**

  Run:

  ```powershell
  npm.cmd run verify:subscription-service
  npm.cmd run verify:subscription-operations-ui
  git diff --check
  ```

  Expected: 两个验证命令退出码 0；`git diff --check` 无输出。重点确认状态操作矩阵、禁用理由、订阅写入与审计未发生回归。

- [ ] **Step 2: 启动隔离功能预览**

  先检查目标端口未被占用，再从当前 worktree 执行 `npm.cmd run dev -- --host 127.0.0.1 --port <已核验空闲端口>`。记录实际 PID、端口、目录、分支 `codex/subscription-more-popover-20261030`、基线 `e7d38635` 和未提交状态。仅使用系统默认外部浏览器打开 `/#/subscription-service/merchant-subscriptions`。

- [ ] **Step 3: 验收鼠标、定位与关闭行为**

  在真实订阅明细页面验证：点击后行高不变；首行／中间行向下展开；视口底部行向上展开；菜单不越出左右视口；同一时刻仅一个菜单；重复点击、外部点击、表格横向滚动、页面纵向滚动、窗口缩放和 hash 路由切换关闭；菜单内部滚动保持打开。

- [ ] **Step 4: 验收键盘、禁用原因与业务衔接**

  验证触发器 `Enter`／`Space`／`ArrowDown`／`ArrowUp`，菜单 `ArrowDown`／`ArrowUp`／`Home`／`End`／`Escape`／`Tab`／`Shift+Tab`。验证禁用项可聚焦且可见原因与 `aria-describedby` 对应、激活不打开业务层；可用项执行后先关闭菜单，再打开原编辑、续期、详情或风险确认层，操作矩阵未改变。

- [ ] **Step 5: 实采并登记证据**

  保存默认向下展开态为 `more-open-down.png`，保存底部向上展开态为 `more-open-up.png`。在 `README.md` 记录日期、变更编号、分支、基线、工作目录、实际端口、URL、测试命令及逐项结果，不把功能分支称为 main。

- [ ] **Step 6: 将实采图就近嵌入三份 V1.28 文档**

  用实际相对路径替换三份文档中的本功能“待补页面图片”，图片标题分别说明默认向下展开与视口底部向上展开，图注写明日期、功能分支、基线和实际端口。其他既存截图缺口保持原状态，不宣称全部操作截图已覆盖。

- [ ] **Step 7: 最终无提交交付检查**

  Run:

  ```powershell
  git status --short
  git diff --stat
  git diff --check
  git rev-parse --short HEAD
  git branch --show-current
  ```

  Expected: 只出现本任务代码、脚本、设计稿、计划、三文档和验证资产；HEAD 仍为 `e7d38635`，分支为 `codex/subscription-more-popover-20261030`，没有新提交、合并或推送。

