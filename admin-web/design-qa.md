# TipOut 原型还原 Design QA

## 验收范围

- 参考原型：`C:\Users\27273\Downloads\原型预览.html`
- 实现页面：`/TipOut/index.html`、`/TipOut/detail.html`、`/TipOut/rules.html`、`/TipOut/rule-add.html`
- 桌面视口：1280 × 720
- 移动视口：390 × 720（iframe 验收壳，仅用于走查，已清理）
- 原则：仅调整 UI 与交互呈现，不改变现有字段、数据计算、保存、复制、删除和分配业务逻辑。

## 同图视觉对照

- 汇总：`tipout-fidelity-qa/comparison-summary.png`
- 明细：`tipout-fidelity-qa/comparison-detail.png`
- 规则列表：`tipout-fidelity-qa/comparison-rules.png`
- 规则编辑：`tipout-fidelity-qa/comparison-rule-editor.png`
- 对照产物目录：`C:\Users\27273\.codex\visualizations\2026\08\31\01a05691-1562-70c1-a8da-ee58e4b8e18f\tipout-fidelity-qa`

桌面端同视口对照已完成。页面外壳、层级、留白、指标区、提醒区、筛选条、表格、规则卡片、上下文栏与底部操作区均按参考原型收敛；现有业务字段和真实状态仍以当前实现为准。

## 交互走查

- 汇总按日列表展示；鼠标点击、Enter 和 Space 均可从日期行进入独立明细页。
- 明细 URL 携带日期、门店及 `from=summary&return=history`；返回汇总后恢复原筛选、滚动位置和日期行焦点。
- 规则列表的新建池类型弹窗、更多菜单、复制、删除确认与空状态均通过。
- 规则编辑的两种分配模式、取值条件抽屉、只读上下文同步、取消确认和保存链路均通过。
- 明细页的公式说明、更新数据、比例调整、折叠/展开、删除/新增行、保存和保存并进入下一天均通过。
- 移动端侧栏展开、筛选折叠、规则弹窗、编辑页底部操作以及按日期进入独立明细页均通过。
- 浏览器控制台错误：0。

## 走查修正

- 修正 1280px 桌面视口下汇总筛选条换行。
- 修正规则“更多”菜单被表格容器裁切。
- 修正 390px 移动视口下“菜单”文字纵向换行。

## 自动化回归

- `verify:tipout-interaction-refresh`：通过
- `verify:tipout-work-hours-layout`：通过
- `verify-personal-sales-deduct.ts`：通过
- `verify-personal-sales-deduct-pipeline.ts`：通过
- `verify-personal-sales-pool.ts`：通过
- `git diff --check`（本轮 CSS 与验证脚本）：通过

## 构建说明

在隔离的干净 HEAD 工作树执行完整构建时，被仓库既有基线问题阻断：`src/config/json-menu-editor-ui.ts:25` 引用了未纳入干净 HEAD 的 `./json-menu-search-autofill-guard`。主工作树中存在同名用户未跟踪文件，本次未复制、修改或纳入提交；该失败与 TipOut 变更无关。隔离工作树与临时依赖连接均已清理。

final result: passed
