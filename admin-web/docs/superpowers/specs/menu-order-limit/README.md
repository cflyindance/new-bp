# 菜单下单限制文档目录

> 基准日期：2026-08-19  
> 路径：`docs/superpowers/specs/menu-order-limit/`  
> 收录原则：只保留当前代码实际实现且仍在使用的字段、业务逻辑与设计方案。

## 研发交付文档

| 文档 | 职责 | 使用对象 |
|---|---|---|
| [PRD.md](../../../产品PRD/exports/2026-08-19-menu-order-limit/PRD.md) | MOL 需求与用户故事（代码反向导出） | 产品、测试、研发 |
| [PRD-2026-07-23-template-format.md](../../../产品PRD/exports/2026-08-19-menu-order-limit/PRD-2026-07-23-template-format.md) | 按公司 PRD 模板结构的字段定义版 | 产品、评审 |
| [PRD-2026-07-23-template-format.docx](../../../产品PRD/exports/2026-08-19-menu-order-limit/PRD-2026-07-23-template-format.docx) | 同上（Word） | 产品、评审 |
| [SPEC.md](../../../产品PRD/exports/2026-08-19-menu-order-limit/SPEC.md) | 字段、数据模型、状态机、六步流程、交互和存储契约 | 研发主用 |

## 完整设计方案

| 文档 | 说明 |
|---|---|
| [2026-08-20-menu-order-limit-complete-design.docx](./2026-08-20-menu-order-limit-complete-design.docx) | 按模板整理的完整设计方案（Word）；区分已落地配置原型与目标态运行时 |
| [2026-08-20-menu-order-limit-complete-design.md](./2026-08-20-menu-order-limit-complete-design.md) | 同上（Markdown 镜像，便于检索与 diff） |

## 设计文档（按功能归类）

### 编辑主流程 · `core/`

| 文档 | 说明 |
|---|---|
| [2026-08-18-order-limit-product-quantity-merge-design.md](./core/2026-08-18-order-limit-product-quantity-merge-design.md) | 六步非解耦流程、商品配置并入限购数量、完整商品规则列表 |

### 生效范围 · `effective-scope/`

| 文档 | 说明 |
|---|---|
| [2026-08-17-order-limit-activity-cycle-design.md](./effective-scope/2026-08-17-order-limit-activity-cycle-design.md) | 每日 / 每周 / 每月活动周期 |
| [2026-08-17-order-limit-business-hour-slots-design.md](./effective-scope/2026-08-17-order-limit-business-hour-slots-design.md) | 多营业时段及各时段独立配置 |
| [2026-08-17-order-limit-business-hour-time-range-design.md](./effective-scope/2026-08-17-order-limit-business-hour-time-range-design.md) | 营业时段内完整时段或自定义时间范围 |

### 数量语义与批量 · `quantity/`

| 文档 | 说明 |
|---|---|
| [2026-08-16-order-limit-remove-batch-forbid-design.md](./quantity/2026-08-16-order-limit-remove-batch-forbid-design.md) | 批量工具栏不提供单独「设为禁止」，通过数量 `0` 表达禁止 |
| [2026-08-13-order-limit-remove-unlimited-design.md](./quantity/2026-08-13-order-limit-remove-unlimited-design.md) | 不支持显式「不限制」；空值=未配置，`0`=禁止 |

### 规则列表 · `list/`

| 文档 | 说明 |
|---|---|
| [2026-08-20-menu-order-limit-rule-list-design.md](./list/2026-08-20-menu-order-limit-rule-list-design.md) | **规则列表页权威设计**：筛选条件、字段展示、字段设置、功能操作、状态与验收 |
| [2026-08-13-menu-order-limit-rule-list-scroll-design.md](./list/2026-08-13-menu-order-limit-rule-list-scroll-design.md) | 列表独立滚动、标题操作区与表头固定 |

## 当前重建口径

1. 数据模型使用 `editorDraft.storeConfigs[storeId]` 保存门店商品结构和数量。
2. 编辑流程为：规则类型 → 场景配置 → 限购数量 → 超限授权 → 生效范围 → 确认发布。
3. 商品选择并入限购数量步骤。
4. 数量规则按门店、人数、轮次、产线和商品完整展开。
5. 数量空值表示未配置，`0` 表示禁止。
6. 规则和草稿保存在 `localStorage["restaurantRules"]`。

除本目录列出的文档外，不再保留菜单下单限制的历史 plans、已移除功能设计或未实现方案。
