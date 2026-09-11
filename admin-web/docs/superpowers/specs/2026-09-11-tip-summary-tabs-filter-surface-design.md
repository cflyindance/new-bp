# 小费汇总 Tab 与筛选工具栏合并设计

## 目标

将“日期分配汇总 / 员工分配汇总”Tab 移入右侧筛选条件所在的白色区块，使视图切换与当前视图筛选形成一个完整的工具栏。此次只调整页面结构、布局和响应式表现，不改变任何业务逻辑。

## 桌面端布局

- 门店选择与“新建/查看规则”继续作为独立首行，位置和逻辑不变。
- 第二行使用一个完整的白色工具栏容器。
- “日期分配汇总 / 员工分配汇总”Tab 位于工具栏左侧。
- 当前视图适用的筛选条件位于工具栏右侧，并整体右对齐。
- Tab 与筛选条件处于同一白色背景、圆角、边框和内边距范围内，不再表现为两个分离区块。
- 工具栏使用弹性布局：左侧 Tab 不压缩文字，右侧筛选组占用剩余空间并靠右排列。

## 视图状态

### 日期分配汇总

右侧继续展示现有筛选项：

- 日期范围
- 角色
- 员工
- 日期展示顺序

### 员工分配汇总

右侧仅展示现有日期范围，不新增角色、员工或日期排序条件。

视图切换后只改变现有筛选项的显隐与列表内容。工具栏外框不重建、顶边位置不变；由于两个视图的筛选项数量不同，换行区间允许工具栏高度随实际内容变化，不要求两个视图强制等高。

## 响应式行为

- 1280px 及以上：Tab 与筛选条件保持同一行，Tab 左对齐，筛选组右对齐。
- 769px 至 1279px：工具栏允许换行；Tab 保持完整，筛选组空间不足时整体换到下一行，换行后占满可用宽度并从右侧排列。
- 768px 及以下：Tab 独占第一行且两个选项等宽；“筛选条件”折叠按钮位于下一行；展开后的筛选内容位于按钮下方。
- Tab 必须位于 indexFilterCollapsible 之外，DOM 顺序固定为 Tab、筛选折叠按钮、indexFilterCollapsible。折叠按钮只控制筛选内容，收起筛选时 Tab 始终可见。
- 响应式校验至少覆盖 1280px、1279px、769px 和 768px 四个边界宽度。

## 技术方案

- 在 distribution.html 中将 tipout-heading-tabs 移入现有 filter-surface tipout-compact-toolbar tipout-view-filter-group 容器，使 Tab 与筛选折叠按钮、筛选内容共享同一视觉和布局容器；不为无语义 div 虚构新的可访问性语义。
- 容器内部顺序保持为 tipout-heading-tabs、filter-surface-toggle、indexFilterCollapsible，不能把 Tab 放进 indexFilterCollapsible。
- 保留 summaryViewSwitch、dateTaskTab、employeeReconciliationTab、indexFilterCollapsible 等 ID，以及所有 data-native-* 处理器。
- 在 tips-page.css 中调整 tipout-view-filter-row、tipout-view-filter-group、tipout-heading-tabs 与移动端媒体查询的布局规则。
- 不新增状态、不改变脚本中的视图切换或筛选渲染代码。
- 保留 tablist/tab 角色、aria-selected、roving tabindex、aria-controls 与受控 panel 的关联，并回归验证方向键、Home、End 和焦点切换行为。

## 不修改范围

- 门店首行及规则入口。
- Tab 文案、Tab 状态记忆、键盘切换和 URL 参数。
- 日期、角色、员工、排序筛选的数据与事件逻辑。
- 汇总金额、列表数据、导出、分配、取消分配和底部操作栏。
- 路由、DOM ID、函数名、存储 Key 与数据结构。

## 验收标准

1. 桌面端两个 Tab 与筛选条件位于同一个连续白色圆角区块内。
2. Tab 左对齐，当前视图筛选项右对齐。
3. 日期分配汇总继续展示日期、角色、员工和日期顺序；员工分配汇总仍只展示日期范围。
4. 切换视图时工具栏不重建且顶边不移动；换行区间允许高度随筛选项数量变化。现有筛选、列表、导出和底部按钮行为不变。
5. 在 1280px、1279px、769px、768px 边界分别验证规定的同行、换行与移动端布局。
6. 移动端 Tab 位于折叠内容之外且始终可见，两个 Tab 等宽；折叠按钮只控制 indexFilterCollapsible。
7. 专项校验确认 Tab 位于筛选表面内部，同时原有 ID、处理器、tablist/tab 角色、aria-selected、roving tabindex、aria-controls 与 panel 关联未变化。
8. 键盘方向键、Home、End 和焦点切换行为保持正常。
