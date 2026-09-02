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
export interface PayrollScopeSnapshot {
  brandId: string;
  regionId: string;
  storeId: string;
  storeLabel: string;
  storeLabelEn: string;
  isAllStores: boolean;
  usesInPageStorePicker: boolean;
  stores: Array<{ id: string; labelZh: string; labelEn: string }>;
}

export interface PayrollPageContext {
  getScope(): PayrollScopeSnapshot;
  setStoreScope(storeId: string): void;
  subscribeScopeChange(listener: (scope: PayrollScopeSnapshot) => void): () => void;
  getLocale(): "zh" | "en";
  subscribeLocaleChange(listener: (locale: "zh" | "en") => void): () => void;
}

export interface PayrollPageHandle {
  unmount(): void;
}

export function mountPayrollPage(container: HTMLElement, context: PayrollPageContext): PayrollPageHandle;
```

职责：

- 向指定容器渲染 Payroll 主体结构。
- 初始化数据、筛选器、宽表、表单和弹窗。
- 管理页面级事件监听和定时器。
- 返回幂等的 `unmount()`，用于路由切换时清理资源。
- 只通过 `PayrollPageContext` 读取或更新主应用范围和语言，不直接读取主 Shell DOM。

### 4.2 `src/team/payroll-page.css`

承载从 `dist/TipOut/payroll.css` 以及 `dist/TipOut/common.css` 提取的 Payroll 必需样式。提取范围必须覆盖按钮、输入框、表格、卡片、菜单、提示、弹窗、排版和 Payroll 使用的设计变量；TipOut 导航、Header、布局壳层和移动侧栏规则不迁入。

所有选择器必须位于 `.team-payroll-page` 根节点下。原 `:root` 变量改为 `.team-payroll-page` 局部变量，`*` reset 改为 `.team-payroll-page, .team-payroll-page *`，不得增加新的全局 `body`、`.header`、`.sidebar` 或无作用域选择器。可直接映射的颜色、字体和边框优先引用主应用 token；为保证视觉等价而保留的 Payroll token只定义在根节点。

### 4.3 Payroll 领域模块

为避免新的入口文件继续膨胀，按现有逻辑边界拆分：

- `src/team/payroll/payroll-types.ts`：Period、Employee、Segment、Snapshot 等类型。
- `src/team/payroll/payroll-api.ts`：`/api/v1/payroll` 请求和错误归一化。
- `src/team/payroll/payroll-state.ts`：快照加载、迁移、有效选择恢复及持久化。
- `src/team/payroll/payroll-calculations.ts`：从旧脚本迁移的纯计算函数。
- `src/team/payroll/payroll-view.ts`：主体 DOM 模板和局部渲染函数。
- `src/team/payroll/payroll-controller.ts`：事件绑定、菜单、弹窗和生命周期清理。
- `src/team/payroll/payroll-i18n.ts`：迁移 `payroll-i18n.js` 的文案、格式化和语言刷新，不注册全局函数。
- `src/team/payroll/payroll-adp.ts`：迁移 `payroll-adp-mapping.js`、ADP CSV 组装和下载逻辑。
- `src/team/payroll/payroll-export.ts`：迁移 `payroll-detail-export.js` 的明细导出和打印文档构建。
- `src/team/payroll/payroll-rule-data.ts`：迁移 Payroll 实际使用的 `ruleData.js` 常量和规则查询；不引入 TipOut 页面无关数据。
- `src/team/payroll/payroll-roster-adapter.ts`：通过主项目 `TEAM_EMPLOYEE_ROSTER_STORAGE_KEY` 和现有员工主档能力读取、同步员工，并返回可取消的订阅。

拆分遵循现有行为迁移原则：先保持输入输出一致，再做模块化；本次不改变业务计算结果。

旧静态依赖的处理方式固定如下：

- `common.js`：不整体迁入；Payroll 使用到的通知、转义、日期及下载帮助函数改为局部模块函数或复用主项目现有工具。
- `global-scope-filter.js`：不迁入；由 `PayrollPageContext` 替代。
- `tipout-payroll-bridge.js`：删除依赖；原 `postMessage` 双向通信由同文档内的直接 scope API 替代。
- `ruleData.js`、`payroll-adp-mapping.js`、`payroll-i18n.js`、`payroll-detail-export.js`：按上述 TypeScript 模块迁移，不继续依赖 `window` 全局。
- `payroll-api-client.js`：由 `payroll-api.ts` 取代。
- `payroll.js`：按状态、计算、视图和 controller 边界迁移；原生路由不得动态加载该脚本。

## 5. 主路由整合

`src/main.ts` 保留 `isTeamPayrollReportIframePath()` 所表达的路径判断，但将其重命名为不包含 iframe 语义的 `isTeamPayrollReportPath()`。

删除该路由对以下实现的依赖：

- `TEAM_PAYROLL_REPORT_IFRAME_SRC`
- `renderTeamPayrollReportIframePanel()`

新增主内容挂载容器：

```html
<div class="team-payroll-page" data-team-payroll-root></div>
```

主应用完成通用 Shell 渲染后构造 `PayrollPageContext` 并调用 `mountPayrollPage(root, context)`。context 使用 `readScopeFilters()`、`writeScopeFilters()`、`getScopedFilterOptions()` 和 `menusifu:scope-filter-change` 事件实现范围读写；语言使用主应用现有 locale 读写和变更事件。下一次 `mount()` 或路由切换前调用当前 Payroll handle 的 `unmount()`。

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

Payroll 不再依赖 `postMessage` 接收主应用范围。进入页面时调用 `context.getScope()`；范围变化由 `context.subscribeScopeChange()` 通知 Payroll controller。页内门店下拉只有在 `scope.usesInPageStorePicker` 为 `true` 时展示；用户选择门店后必须调用 `context.setStoreScope(storeId)`，由主应用 `writeScopeFilters()` 完成权限收敛、sessionStorage 更新和全局事件派发。Payroll 收到同一次范围事件后重新解析员工，不直接写主应用的 sessionStorage，也不保留第二份门店真值。

## 7. 生命周期与隔离

每次挂载创建独立的 `AbortController`，DOM 事件使用其 `signal` 注册；卸载时统一 `abort()`。模块产生的 timeout、interval、document 级监听、焦点陷阱和打开的弹窗均登记在 handle 中并在卸载时清理。

挂载函数检测容器上的实例标记。重复调用时先卸载旧实例，确保不会出现重复保存、重复弹窗或一次点击触发多次处理。

CSS 只允许影响 `.team-payroll-page` 内部元素。Payroll 弹窗保留在该根节点内，不创建根节点外 portal；卸载时随根节点内容和 controller 状态一起清理。

## 8. 状态和错误处理

- API 不可用：保留现有 `payroll-api-client.js` 的 localStorage 降级语义，显示非阻断的“本地模式”提示；API 恢复后下一次保存同步完整快照。localStorage 中没有快照表示首次使用，必须按“快照为空”建立默认数据；只有存储访问自身抛错且 API 同时不可用时，才显示 Payroll 内容区阻断错误和“重新加载”按钮。任何失败都不得把主应用跳转到其他页面。
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
- Network 不动态加载 `common.js`、`global-scope-filter.js`、`ruleData.js`、`tipout-payroll-bridge.js`、`payroll-adp-mapping.js`、`payroll-i18n.js`、`payroll-detail-export.js`、`payroll-api-client.js` 或 `payroll.js`。
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
- Context 契约测试：主应用范围变化驱动 Payroll，页内门店变化反向调用 `setStoreScope()`，卸载后订阅失效。
- 依赖隔离测试：原生路由不包含旧静态脚本和 `window` 全局依赖。
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
