# 团队管理薪资页面原生整合设计

## 1. 背景与目标

当前“团队管理 → 薪资管理”通过 `iframe` 加载 `dist/TipOut/payroll.html?embedded=1`。虽然嵌入参数会隐藏 TipOut 自身的侧栏和 Header，但页面仍存在独立文档、独立生命周期、iframe 通信、双层滚动以及入口状态不一致等问题。

本次目标是彻底取消该路由中的 iframe，把现有 Payroll 工作区作为主应用原生路由模块渲染。用户点击“薪资管理”后直接进入 Payroll 工作区，主应用左侧导航和顶部账号栏始终保留，不出现 TipOut 首页或二次跳转。

## 2. 范围

### 2.1 包含

- 将 Payroll 主体结构、样式和交互迁入 `src/team` 下的独立模块。
- `/team/payroll-report` 直接挂载 Payroll 页面模块。
- 继续使用现有 `/api/v1/payroll` 数据接口及快照结构。
- 保留当前 UI、字段、薪资计算、考勤宽表、汇总卡、筛选菜单和弹窗交互。
- 支持页面挂载、卸载以及重复进入。
- 失效门店、Period 或员工状态自动恢复到有效选择。

### 2.2 不包含

- 不重做 Payroll 视觉设计。
- 不修改薪资计算公式、字段含义或 ADP 导出格式。
- 不重构其他 TipOut 页面。
- 不删除 `dist/TipOut/payroll.html`；它继续作为临时独立调试入口。
- 不复制 Mock API 或创建第二套 Payroll 数据源。

## 3. 方案选择

采用“主应用原生路由模块”方案，不采用运行时抓取 HTML，也不把约 20 万字符的旧脚本直接粘贴进 `main.ts`。

原因：

- 主应用只保留一个页面文档和一个导航壳层。
- 生命周期和事件清理可以由路由统一管理。
- CSS 可以约束在 Payroll 根节点内，避免污染其他页面。
- 数据接口和独立调试页仍可复用，迁移风险可分段控制。

## 4. 模块结构

### 4.1 `src/team/payroll-page.ts`

导 Payroll 原生页面入口，公开以下接口：

```ts
export interface PayrollPageHandle {
  unmount(): void;
}

export function mountPayrollPage(container: HTMLElement): PayrollPageHandle;
```

职责：

- 向指定容器渲染 Payroll 主体结构。
- 初始化数据、筛选器、宽表、表单和弹窗。
- 管理页面级事件监听和定时器。
- 返回幂等的 `unmount()`，用于路由切换时清理资源。

### 4.2 `src/team/payroll-page.css`

承载从 `dist/TipOut/payroll.css` 迁移的 Payroll 页面样式。所有选择器必须位于 `.team-payroll-page` 根节点下；全局 reset、`body`、`.header`、`.sidebar` 和 TipOut 壳层规则不得迁入。

### 4.3 Payroll 领域模块

为避免新的入口文件继续膨胀，按现有逻辑边界拆分：

- `src/team/payroll/payroll-types.ts`：Period、Employee、Segment、Snapshot 等类型。
- `src/team/payroll/payroll-api.ts`：`/api/v1/payroll` 请求和错误归一化。
- `src/team/payroll/payroll-state.ts`：快照加载、迁移、有效选择恢复及持久化。
- `src/team/payroll/payroll-calculations.ts`：从旧脚本迁移的纯计算函数。
- `src/team/payroll/payroll-view.ts`：主体 DOM 模板和局部渲染函数。
- `src/team/payroll/payroll-controller.ts`：事件绑定、菜单、弹窗和生命周期清理。

拆分遵循现有行为迁移原则：先保持输入输出一致，再做模块化；本次不改变业务计算结果。

## 5. 主路由整合

`src/main.ts` 保留 `isTeamPayrollReportIframePath()` 所表达的路径判断，但将其重命名为不包含 iframe 语义的 `isTeamPayrollReportPath()`。

删除该路由对以下实现的依赖：

- `TEAM_PAYROLL_REPORT_IFRAME_SRC`
- `renderTeamPayrollReportIframePanel()`

新增主内容挂载容器：

```html
<div class="team-payroll-page" data-team-payroll-root></div>
```

主应用完成通用 Shell 渲染后调用 `mountPayrollPage(root)`。下一次 `mount()` 或路由切换前调用当前 Payroll handle 的 `unmount()`。

主应用的左侧导航、顶部账号栏、全局范围选择和语言控制不属于 Payroll 模块，不得在 Payroll 模块内隐藏或重新创建。

## 6. 数据流

1. 用户进入 `#/team/payroll-report`。
2. 主应用完成权限和平台预设校验，渲染原有应用 Shell。
3. Payroll 模块挂载并请求 `GET /api/v1/payroll/state`。
4. `payroll-state.ts` 迁移快照并解析有效 Period、门店和员工。
5. 如果持久化筛选无匹配员工，选择当前 Period 第一个具有门店的员工，将其门店作为有效筛选并保存修复后的快照。
6. View 根据同一个内存状态渲染 Hero、汇总卡、考勤宽表和 Manage Payroll 表单。
7. 用户编辑时只更新模块状态；现有确认和保存动作继续调用 `PUT /api/v1/payroll/state`。
8. 路由离开时卸载事件监听和临时 UI 状态，持久化数据不被清除。

Payroll 不再依赖 `postMessage` 接收主应用范围。进入页面时由主应用把当前有效范围作为挂载参数或通过现有范围读取函数提供；范围变化通过主应用事件订阅通知 Payroll controller。

## 7. 生命周期与隔离

每次挂载创建独立的 `AbortController`，DOM 事件使用其 `signal` 注册；卸载时统一 `abort()`。模块产生的 timeout、interval、document 级监听、焦点陷阱和打开的弹窗均登记在 handle 中并在卸载时清理。

挂载函数检测容器上的实例标记。重复调用时先卸载旧实例，确保不会出现重复保存、重复弹窗或一次点击触发多次处理。

CSS 只允许影响 `.team-payroll-page` 内部元素。确需 portal 的弹窗必须带 Payroll 专属类并由模块卸载时删除。

## 8. 状态和错误处理

- API 不可用：显示 Payroll 内容区错误状态和“重新加载”按钮，不把整个主应用跳转到其他页面。
- 快照为空：使用现有默认数据建立初始快照。
- Period 无员工：显示明确空状态，保留 Period 切换能力。
- 门店或员工引用失效：恢复到当前 Period 第一个有效门店和员工，并持久化修复。
- 保存失败：保留用户当前编辑值，显示局部失败提示，允许重试。
- 模块异常：错误限制在主内容区，主应用侧栏和顶部账号栏仍可操作。

## 9. 独立调试页兼容

`dist/TipOut/payroll.html` 在本阶段继续保留。它可以继续使用旧的静态脚本作为对照和回归入口，但团队管理主路由不得加载、fetch 或注入该文件。

后续只有在原生页面稳定并完成一轮验收后，才单独评估是否把独立调试页改为对原生模块的开发入口；该工作不属于本次范围。

## 10. 验收标准

- 点击“团队管理 → 薪资管理”直接展示 Payroll 工作区。
- 主页面 DOM 中不存在 Payroll iframe。
- Network 不请求 `TipOut/payroll.html`。
- 主应用左侧导航和顶部账号栏保持显示并可操作。
- 不出现 TipOut 自身的侧栏、Header 或页面跳转。
- Payroll UI、字段结构、薪资计算、宽表、筛选、员工切换、编辑员工、保存和导出行为与迁移前一致。
- 页面只有主内容区滚动，不出现 iframe 双滚动。
- 失效门店或员工状态不会导致页面回退到旧 Period 列表。
- 连续进入、离开、再次进入页面不会产生重复监听或重复请求。
- 独立 `dist/TipOut/payroll.html` 调试入口仍可打开。

## 11. 验证策略

### 自动测试

- 纯函数测试：计算、快照迁移和有效选择恢复。
- 页面测试：挂载生成关键结构，卸载清除监听和 portal。
- 路由测试：`/team/payroll-report` 使用原生根节点且不包含 iframe。
- 回归测试：现有 Payroll Figma 结构和交互标记仍存在。

### 浏览器 E2E

- 从左侧导航进入薪资管理。
- 验证外层导航和顶部账号栏可见。
- 验证无 iframe、无 TipOut 内层 Shell。
- 验证默认员工、三张汇总卡、考勤宽表和 Manage Payroll 表单。
- 验证门店、Year、Period 和员工切换。
- 验证编辑员工弹窗、确认保存和重新进入后的持久化。
- 验证失效筛选自动恢复。
- 检查 Console 和 Network 无相关错误。

## 12. 风险与回滚

主要风险是旧 Payroll 脚本体积大且依赖全局 DOM。迁移必须按“计算与状态 → 视图 → 交互 → 路由切换”的顺序分段完成，每段保留可运行验证。

回滚方式是恢复 `TEAM_PAYROLL_REPORT_IFRAME_SRC` 和 `renderTeamPayrollReportIframePanel()` 路由分支。由于独立调试页在本次范围内不会删除，回滚不需要恢复静态资产。
