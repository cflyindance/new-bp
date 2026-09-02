# Team Payroll 视觉还原与滚动修复设计

## 目标

以仓库内的 [`team-payroll-visual-reference.png`](../assets/team-payroll-visual-reference.png) 为唯一视觉基准，修正当前原生 Payroll 页面中的滚动、整体留白、卡片、表格和表单控件样式。原图尺寸为 1687×1966，其中 1687px 是 Payroll 内容画布宽度，不是浏览器宽度，且基准图不包含主项目外壳。对比时使用中文界面、Golden Dragon Chinese Kitchen、2026 年第 1 期、Bowen one 数据。保留主项目左侧导航、顶部账号栏、现有字段结构、数据与交互行为。

## 范围

- `/team/payroll-report` 页面内部的 Payroll 视觉样式。
- 主内容区纵向滚动和考勤宽表横向滚动。
- 顶部操作区、筛选器、员工信息卡、考勤汇总卡、周明细表及 Manage Payroll 表单。
- 桌面端主视图，并保证较窄窗口不破版。

不调整业务计算、字段名称、数据来源、保存逻辑、导出逻辑或主项目导航结构。

## 实现方案

在生成的 `payroll-page.css` 之后加载一份人工维护的 `payroll-polish.css`。修正层只允许 `:host` 和 `.team-payroll-page…` 选择器，不允许 `html`、`body`、裸标签全局规则或 `@import`。`src/team/payroll-page.ts` 必须按 `payroll-page.css`、`payroll-polish.css`、模板的顺序注入，以稳定覆盖原 TipOut CSS 中的重复规则，同时避免污染主项目。

滚动采用单一非弹窗纵向滚动容器：`src/main.ts` 中 `[data-team-payroll-scroll]` 是唯一滚动归属，使用 `min-height:0; overflow-y:auto`；`[data-team-payroll-root]` 使用 `display:block; min-height:100%`。Shadow Root 内 `:host`、`.team-payroll-page`、`#view-workspace`、`.payroll-workspace-layout` 和 `.payroll-workspace-main` 均取消固定高度与纵向滚动，使用 `height:auto; min-height:0; overflow-y:visible`，不得以内容高度之外的约束截断页面。考勤表包装层是唯一允许的横向滚动区域。弹窗 body、员工列表和下拉菜单可独立纵向滚动，并在关闭后解除滚动锁。

## 视觉规格

- 页面背景 `#f3f4f6`，内容画布为 `#fff`，画布圆角 16px。
- 页面主留白 24px，模块纵向间距 20px；和参考图的主要边界偏差不得超过 4px。
- 顶部按钮和筛选胶囊高度 42px，操作按钮圆角 10px。
- 员工 Hero 使用深色横向卡片，圆角 14px；在 1280px 及以上保持单行层级。
- 三张考勤汇总卡使用 `#f7f7f7` 背景、无显眼描边、14px 圆角和 16px 内边距。
- 周摘要条使用浅灰底；明细表为紧凑行高、细分割线和稳定列宽。
- Manage Payroll 分组使用 `#f7f7f7` 背景；输入框为白底、`1px solid #d9d9d9`、12px 圆角、42px 高度和 12px 水平内边距。
- 视觉密度、文字大小和对齐关系以设计稿为准，不引入额外装饰或动效。

像素对比允许文字渲染存在抗锯齿差异；区块位置、宽高、间距和圆角误差不超过 4px，颜色的 RGB 单通道误差不超过 8。

## 响应式矩阵

- 1687×1000：顶部操作、筛选、Hero 和三张汇总卡均保持横向布局。
- 1440×900：与 1687 桌面布局一致，考勤表允许自身横向滚动。
- 1024×768：顶部操作和筛选可换行，Hero 操作区可换到下一行；三张汇总卡保持三列，Manage Payroll 的四列表单可变两列。
- 小于 1024px 不属于本轮验收范围，但不得导致主页面级横向滚动；只有考勤表允许横向滚动。

## 状态与交互

所有现有弹窗、筛选、编辑、员工切换、保存和导出行为保持不变。聚焦态使用主项目蓝色描边，禁用态和占位符保持清晰可辨。滚轮在 Payroll 内容任意非弹窗区域均可驱动页面纵向滚动。

必须冒烟验证：Store/Year/Period 筛选；`payrollEmployeePickerModal` 员工切换、确认和关闭；`payrollEmployeeEditModal` 打开、字段回填、取消和确认；Manage Payroll 输入后保存并在路由往返后保留；ADP 下拉打开/关闭；`employeesDetailPreviewModal` 打开/关闭。其余模板内弹窗至少验证打开时局部滚动不推动后台页面、关闭后页面滚动恢复。

## 验证

- 新增 `scripts/verify-team-payroll-polish.mjs`，检查注入顺序、选择器作用域、禁止全局选择器/导入、滚动归属和关键视觉规则。
- TypeScript 与生产构建通过。
- 浏览器验证无 iframe、主导航与顶部栏存在。
- 浏览器计算样式断言输入框、Hero、汇总卡及分组容器的高度、边框、圆角、背景和内边距符合上述数值。
- 断言恰好只有 `[data-team-payroll-scroll]` 一个非弹窗纵向滚动容器；在响应式矩阵三个视口均可从顶部滚动到 Manage Payroll 最后一组，且页面级无横向溢出。
- 验证考勤表和上文列出的交互流程。
- 响应式行为使用 1687×1000、1440×900、1024×768 三个浏览器视口分别截图，截图包含主项目外壳，仅检查布局状态和溢出，不直接与基准图像素比较。
- 像素对比使用独立的 Payroll 画布捕获：测试时把浏览器宽度调到使 `[data-team-payroll-root]` 的实际 `getBoundingClientRect().width` 恰好为 1687px；裁剪掉左侧导航和顶部栏，只截取该宿主的内容区域。分别在 `[data-team-payroll-scroll]` 的 `scrollTop` 为 0、相邻视口高度和最大值时截图，并按宿主坐标无重叠拼接；拼接图预期尺寸为 1687×1966（允许内容总高度 ±4px）。该拼接图才按前述 4px/颜色容差与基准图比较。
