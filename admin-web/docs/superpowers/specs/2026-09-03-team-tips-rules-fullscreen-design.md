# 原生小费规则全屏交互设计

## 目标

在团队管理的小费分配页点击“新建/查看规则”后，以与屏保编辑流程一致的应用内全屏方式展示规则管理。规则列表与规则编辑器之间跳转时保持全屏；返回小费分配汇总时恢复主项目导航、顶部账号栏和进入前的滚动位置。

## 路由状态

- `/team/tips/rules`：进入并保持全屏。
- `/team/tips/rules/editor`：进入并保持全屏，包括新增与编辑查询参数。
- `/team/tips/distribution`：退出全屏并回到小费分配汇总。
- 离开 `/team/tips/*`：销毁小费页面时无条件清理全屏状态。

全屏状态完全由路由推导，不另存持久化布尔值。直接访问、刷新、浏览器前进和后退均以当前路由为准，避免 UI 状态与 URL 不一致。

路由判定先去除 query、规范尾斜杠，再做精确匹配。只有 `/team/tips/rules`、`/team/tips/rules/`、`/team/tips/rules/editor` 和 `/team/tips/rules/editor/` 属于全屏范围；`rules-foo` 等未知路径不得命中，并按主应用既有 fallback 处理。query 原样保留，用于规则类型和编辑 ID。

### History 契约

| 动作 | History 操作 | 结果 |
| --- | --- | --- |
| 汇总 → 规则列表 | push | Back 返回原汇总位置 |
| 规则列表 → 编辑器 | push | Back 返回规则列表并保持全屏 |
| 编辑器“返回/取消” → 规则列表 | back；无有效父状态时 replace | 不制造重复规则列表记录 |
| 规则列表“返回汇总”或 Esc | back；无有效汇总父状态时 replace | 正常入口退出后 Back 不会立刻重进全屏 |
| 编辑器无弹层时 Esc | back；无有效规则父状态时 replace 到规则列表 | 第一次 Esc 回规则列表，仍保持全屏 |

`menusifuTeamTips` 使用明确的 entry schema：`flowId`、`viewHref`、`scrollTop`、`parentHref`、`summaryHref`、`summaryScrollTop`。`scrollTop` 表示当前 history entry 自身的滚动位置；`parentHref` 表示直接父页；`summary*` 表示本次规则流程的汇总来源及滚动位置。导航前先用 replaceState 更新当前 entry 的 `scrollTop`，再 push 带完整状态的目标 entry。summary→rules 创建 flowId 并同时记录 summary；rules→editor 写入 rules 作为直接父页，同时继承 summary origin。Back 回 rules 时读取 rules entry 自身 scrollTop，再退出时读取 summary origin。

可信状态必须同时满足：`flowId` 是非空受控字符串、`viewHref` 与当前规范化路由完全相等、`parentHref` 属于该动作允许的直接前驱、所有 scrollTop 均为有限非负数、summaryHref 精确等于 `/team/tips/distribution`。不满足任一条件即使用 replace fallback 和 scrollTop 0。直接深链或刷新若无可信父状态同样使用 fallback。用户主动使用浏览器 Back/Forward 时尊重历史记录，因此允许从汇总通过 Forward 再进入全屏。

## 宿主与视觉行为

在主应用层给 `[data-team-tips-scroll]` 增加 `data-team-tips-flow-fullscreen` 属性和 `team-tips-flow-fullscreen` 类，而不是对 Shadow DOM 内部页面使用浏览器 Fullscreen API。该 light-DOM 宿主是唯一纵向滚动容器，使用 `overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain`。全屏状态采用 `position:fixed; inset:0; z-index:2147483000; width:100vw; height:100dvh; max-width:none; max-height:none; border:0; background:#f5f6f7`，与屏保层级一致并高于 sidebar/header。当前宿主祖先不得设置 transform、filter 或 contain；测试需断言 fixed containing block 是视口。

Shadow DOM 页面不再创建第二个主滚动区；规则内容、编辑器内容均由 light-DOM 宿主滚动。modal/drawer 仍在 Shadow DOM 内 fixed 定位，其 z-index 80/81 在全屏宿主 stacking context 内覆盖页面内容。打开 modal/drawer 时锁定主滚动容器，弹层内部可滚动；关闭后恢复。全屏时主导航及顶部账号栏被覆盖而非删除。

进入规则页前，将汇总宿主 `scrollTop` 写入 summary entry 的 `scrollTop`，并复制到规则 entry 的 `summaryScrollTop`；rules→editor 前把规则列表滚动写回 rules entry 的 `scrollTop`，editor entry 继承 `summaryScrollTop`。返回时读取对应 entry，但不删除 history 状态：先同步设置 scrollTop，再在连续两个 requestAnimationFrame 中按 `min(saved, scrollHeight-clientHeight)` clamp 重试，以适应全量重绘和异步内容撑高。无来源状态、直接深链或刷新时默认恢复为 0。状态跟随 history entry；离开小费模块只清除 DOM/内存临时状态，不篡改浏览器历史，从而保证 Back/Forward 可恢复。

## 交互

1. 汇总页“新建/查看规则”仍通过原生路由进入 `/team/tips/rules`。
2. 规则列表进入新增或编辑器时，路由切换到 `/team/tips/rules/editor`，全屏不中断。
3. 规则编辑器返回规则列表时仍保持全屏。
4. 规则列表“返回小费分配汇总”按 History 契约退出全屏。
5. Esc 使用同一控制器的 capture + bubble 两阶段协议。window capture 阶段只记录按键发生前是否存在可见 native dialog、modal、drawer、dropdown（包括 `.tipout-rule-more` 操作菜单）及 activeElement，不修改 UI；Shadow DOM 内部 handler 随后优先处理。window bubble 阶段若事件已 `defaultPrevented`，或 capture 快照显示按键前存在打开层，则本次不执行页面退出并调用 `preventDefault()`，从而兼容现有“关闭菜单但不 stopPropagation”的 handler，避免一次 Esc 双动作。若快照层仍可见，则宿主只关闭快照中最上层并调用 `preventDefault()` 与 `stopPropagation()`。若 capture 时 activeElement 是原生 `select`、可编辑组合框或其他由浏览器管理的展开控件，本次 Esc 不执行页面退出。编辑器无弹层时第一次 Esc 等同现有“取消”语义，返回规则列表且不新增未保存确认；规则列表无弹层时 Esc 返回汇总。连续 Esc 依次关闭最上层弹层、退出编辑器、退出全屏。

## 组件边界

- `tips-navigation.ts`：精确判断哪些小费路由需要全屏，并决定 history transition。
- `tips-page.ts`：挂载时同步给宿主类/属性，绑定 Esc、恢复滚动，并在销毁时清理。
- `tips-context.ts`：保留汇总页来源及滚动位置，提供返回汇总的原生导航。
- `app.css`：提供与屏保一致的全屏宿主样式。

旧的 iframe 全屏绑定不参与原生小费页面，避免两套机制同时修改布局。

## 异常与清理

- 页面初始化失败时，Esc 监听仍在 legacy runtime try/catch 之外生效，可按 fallback 路由退出。
- 全屏类/属性的唯一 owner 是 `TipsPageHandle`。`destroy()` 幂等：移除键盘监听、滚动锁、全屏类和属性。
- 主应用全量 mount 时先销毁旧实例，再同步渲染带全屏类/属性的新宿主；路由判定在 HTML 提交前完成，rules↔editor 不出现可见的非全屏帧。
- 离开小费模块时必须清除全屏类、属性以及 DOM/内存中的临时滚动缓存；history entry 中的恢复状态保留。
- 全屏切换不修改小费规则、分配结果或 Payroll 同步数据。
- 原生小费宿主不得出现 `tipout-rules-flow-fullscreen`、`data-tipout-rules-flow-fullscreen` 或任何小费 iframe；旧 iframe binder 对原生宿主无匹配结果。

## 验收

- 汇总页点击“新建/查看规则”后规则列表覆盖整个视口，主导航和顶部栏不可见。
- 进入新增/编辑规则后继续保持全屏。
- 返回汇总或按 Esc 后主导航和顶部栏恢复，汇总滚动位置恢复。
- 直接访问、刷新、前进和后退均与路由对应。
- 全屏规则页和编辑器能够纵向滚动，弹窗与抽屉正常。
- 离开小费模块后不存在残留全屏类或键盘监听。

## 自动化验证矩阵

- 单元测试：精确 route→fullscreen 映射（含尾斜杠、query、非法相似路径）、五类 history transition、重复 destroy 幂等。
- 集成测试：有滚动的汇总 → 规则列表滚动 → 编辑器 → Back/返回列表恢复规则滚动 → 返回汇总恢复汇总滚动；断言 URL、宿主类/属性、header/sidebar 可见性和 scrollTop 容差不超过 2px。
- 深链测试：直接进入规则列表/编辑器、刷新后仍全屏；无父状态的返回使用 replace fallback。
- 历史测试：Back/Forward 在汇总、规则和编辑器间切换，状态始终与路由一致且无重复退出记录。
- Esc 测试：无弹层、modal、drawer、dropdown、`.tipout-rule-more` 操作菜单、编辑器未保存字段、初始化失败；断言一次按键只关闭一层且监听每次只触发一次。
- 生命周期测试：连续 mount/destroy、离开 `/team/tips/*`；断言无残留全屏 class/attribute、滚动锁或 legacy iframe 标记。
- 滚动测试：规则页和编辑器由唯一宿主滚动；modal/drawer 打开时主区锁定且弹层内部可滚动；safe-area 下无横向溢出。
