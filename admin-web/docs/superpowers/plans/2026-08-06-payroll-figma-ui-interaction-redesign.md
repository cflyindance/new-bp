# 薪资管理 Figma UI 与交互优化实施计划

**设计依据**：`docs/superpowers/specs/2026-08-06-payroll-figma-ui-interaction-redesign.md`

**目标节点**：Figma `197:39453`

**原则**：保留计算、保存、TipOut 同步、Employees Detail 和 ADP 数据口径，仅重组呈现并补齐界面状态。

## 1. 建立回归护栏

- 新增 `scripts/verify-payroll-figma-redesign.mjs`；
- 校验关键 DOM ID、`data-action`、`adj-*` 字段和目标布局类；
- 校验当前/批量 ADP、Employees Detail、更新与保存入口仍存在；
- 先运行脚本确认它能识别改造前缺少的新结构，再在改造后转绿。

## 2. 重组工作区 HTML

- 文件：`dist/TipOut/payroll.html`；
- 移除工作区左侧期数导航的可见布局，但保留筛选能力；
- 新增工作区标题/操作区、门店/年度/期数紧凑筛选区；
- 将员工信息改为目标稿深色摘要区，保留 ADP File#、SSN、Hire Date 编辑能力；
- 将三张 Pay Period 汇总卡移到考勤明细之前；
- 保留 Manage Payroll 分组卡和全部 `adj-*` ID；
- 把 ADP 当前/批量导出合并为下拉菜单；
- 新增员工选择弹层，复用现有员工切换数据；
- 保留所有现有预览、确认与字段帮助弹层。

## 3. 适配页面状态与事件

- 文件：`dist/TipOut/payroll.js`；
- 渲染工作区门店、年度、期数筛选值；
- 渲染员工摘要中的头像首字母、姓名、角色、ID、SSN、Hire Date、范围、Paycheck、总工时、总薪资；
- 员工选择弹层复用 `navigateWorkspaceEmployee` 和现有未保存守卫；
- 上下文筛选复用 `navigateWorkspacePeriod` 与年度筛选逻辑；
- ADP 下拉菜单调用现有 `showAdpReportModal` / `exportBatchAdpCsv`；
- 更新按钮同步默认、加载、成功与失败状态；
- 保存按钮继续复用变更预览和确认逻辑；
- 导出与 Employees Detail 在存在未保存修改时继续读取已保存数据，沿用现有确认行为。

## 4. 对齐 Figma 视觉

- 文件：`dist/TipOut/payroll.css`；
- 工作区采用 1440px 目标稿的间距、冷灰表面与品牌蓝；
- 深色员工摘要使用高对比但非纯黑表面；
- 汇总卡、周头、表格与 Manage Payroll 分组建立统一垂直节奏；
- 数字使用 `tabular-nums`；
- 所有按钮、菜单、输入具备 hover、active、focus-visible、disabled、loading；
- 仅考勤表允许局部横向滚动；
- 增加较窄桌面断点和 `prefers-reduced-motion`。

## 5. 更新双语文案

- 文件：`dist/TipOut/payroll-i18n.js`；
- 增加 Payroll Management、筛选标签、切换员工、当前/批量 ADP、员工摘要指标和菜单 aria 文案；
- 继续复用现有保存、更新、导出、邮件与错误文案；
- 确保语言切换后新增 DOM 能同步刷新。

## 6. 验证与视觉回归

- 运行 `node scripts/verify-payroll-figma-redesign.mjs`；
- 运行 `npm run build`；
- 使用 `npm run dev:payroll` 验证：
  - 门店/年度/期数切换；
  - 员工选择与未保存拦截；
  - 更新员工数据加载态；
  - 当前/批量 ADP；
  - Employees Detail 与邮件；
  - 保存差异预览；
  - 中英文切换；
- 在 1440px 和较窄桌面视口截图对照 Figma；
- 检查控制台错误与主后台 iframe 滚动行为。
