# eMenu 调味 Option 分类选择设计

## 1. 目标与范围

“新增关联”和“单商品编辑”中的“添加 Option”弹窗改为按“类 + Option”浏览和多选，结构参照批量关联的商品选择器，但只保留两列。公共调味库同时增加独立的 Option 分类管理能力。

本次不改变动作与 Option 的多对多关系、价格计算、动作/Option 排序或预览确认流程。

## 2. 核心规则

- 每个 Option 必须且只能属于一个 Option 分类。
- Option 分类为门店级本地配置，所有终端共用。
- 分类支持新增、编辑、拖动排序、停用和删除。
- 分类下仍有 Option 时禁止删除，必须先迁移 Option。
- 停用分类不能分配给新建或编辑的 Option；原有 Option 保留归属并可迁移。
- 系统分类“未分类”不可删除、不可停用、不可重命名，展示时固定置底。
- 现有未设置分类的 Option 在读取或迁移时归入“未分类”。

## 3. 数据模型

新增 `SeasoningOptionCategory`：

| 字段 | 说明 |
| --- | --- |
| `id` | 分类唯一标识 |
| `code` | 门店内唯一内部编码 |
| `name` | 分类名称 |
| `status` | `active` / `inactive` |
| `sortOrder` | 分类排序值 |
| `system` | 是否为系统分类 |
| `createdAt` / `updatedAt` | 审计时间 |

`SeasoningOption` 增加必填 `categoryId`。API 返回 Option 时可附带 `categoryName`，便于列表和选择器直接展示。

持久层初始化时创建固定 `id = "option-category-uncategorized"`、`code = "UNCATEGORIZED"` 的“未分类”。数据库加载时执行一次幂等迁移：创建缺失的系统分类并把缺少或引用不存在分类的旧 Option 持久化回填到该分类。只有实际发生变更时才将配置版本提升一次，并写一条 `migrate_option_categories` 审计；再次加载不得重复提升版本或记录审计。前端不承担旧数据兼容。

## 4. 添加 Option 选择器

### 4.1 页面结构

弹窗保持现有居中大弹窗，内部结构为：

1. 顶部：标题、当前动作说明、搜索框、已选择数量。
2. 主体一行两列：
   - 左列“类”：分类名称、`已选数/可选数`、复选框、半选状态。
   - 右列“Option”：当前分类下的 Option 列表，展示名称和内部编码，支持复选多选。
3. 底部：取消、确认添加。

分类按 `sortOrder` 排序，“未分类”无条件置底。Option 按 `sortOrder`、名称、ID 稳定排序。

### 4.2 交互规则

- 默认激活第一个包含可选 Option 的启用分类；若都不可选，则激活第一个可见分类。
- 点击分类名称只切换右侧内容，不改变选择状态。
- 点击分类复选框，选中或取消当前搜索范围内该分类的全部可用 Option。
- 分类复选框根据可见可用 Option 的选中数量展示未选、半选、全选。
- 已经存在于当前动作下的 Option 显示为已选且禁用，不重复创建关系，也不计入本次新增数量。
- 同一个 Option 仍可在其他动作下选择，延续现有允许重复关联的规则。
- 待添加选择跨分类保留；切换分类、搜索和清空搜索均不丢失。
- 确认按钮文案携带本次新增数量；没有新选择时禁用。
- 添加选择器只展示启用分类下的启用 Option。当前动作中属于停用分类或已停用的历史 Option 继续保留在动作配置表中，但不在添加选择器中重复展示。

选择集合定义如下：

- `M`：当前搜索条件命中的、分类启用且 Option 启用的 Option 集合。
- `E`：当前动作已关联的 Option 集合；其他动作中的关联不进入 `E`。
- `A = M - E`：当前搜索范围内可新增集合，也是分类复选框的分母。
- `P`：用户在本次弹窗中勾选的待新增集合，可跨分类、跨搜索保留。
- 分类计数显示 `|P ∩ A_category| / |A_category|`；`E` 在右侧显示为已选禁用，但不进入分子或分母。
- 顶部“已选择”始终显示全局 `|P|`，包含因搜索或切换分类而暂时不可见的待新增项。
- 分类全选/半选严格以 `A_category` 为范围；全选添加 `A_category`，取消只移除 `P ∩ A_category`，不影响其他分类或隐藏选择。

### 4.3 搜索

- 搜索匹配分类名称、Option 名称、英文名称和内部编码。若分类名称命中，则该分类下全部启用 Option 均属于 `M`；否则只包含 Option 文本命中项。
- 搜索结果仍按分类归组；左列只显示存在命中 Option 的分类。
- 分类批量勾选仅作用于当前搜索结果内可见、启用且未在当前动作中的 Option。
- 清空搜索后恢复原分类排序和激活位置；若原激活分类不可见，则定位第一个结果分类。

## 5. 公共调味库

公共调味库增加“分类管理”入口及所属分类能力：

- Option 列表增加分类筛选和分类展示。
- 新建/编辑 Option 时“所属分类”为必填。新建只列出启用分类；编辑额外展示当前已绑定的停用分类。编辑其他字段时可以原样保留停用分类，但显式更改 `categoryId` 时只能迁移到启用分类。
- 分类管理以独立弹窗或同页管理区呈现，支持新增、编辑、拖动排序、状态切换和删除。
- 停用分类前给出影响数量；停用不自动停用其 Option。
- 删除有关联 Option 的分类返回业务错误并展示可操作提示。
- “未分类”显示系统标识，相关管理操作禁用。

## 6. API 与一致性

### 6.1 选择器读取合同

新增 `GET /api/emenu-local/seasoning/option-picker?query=<text>`，返回一个非分页、同版本快照：

```ts
{
  version: number;
  categories: Array<{ id: string; code: string; name: string; sortOrder: number; system: boolean; optionCount: number }>;
  items: Array<SeasoningOption & { categoryName: string }>;
}
```

该专用接口返回当前查询下全部命中项，不复用现有游标分页 `/options`，因此分类计数、全选和半选不会遗漏尚未加载项。门店最多允许 10,000 个启用 Option；超过限制返回 `option_picker_limit_exceeded`，提示管理员缩减调味库后再配置，而不是静默截断。无查询时返回所有启用分类及其启用 Option；有查询时只返回命中分类和项目。`optionCount` 是当前查询快照内启用 Option 数量。

选择器确认仅修改客户端动作草稿，不产生服务端写请求。批量流程在生成预览时、单商品流程在最终 PUT 时分别重新校验配置版本、Option 启用状态、分类存在且启用。

### 6.2 分类写合同

- `GET /option-categories?includeInactive=1`：返回 `{ version, items }`，每项含全部状态 Option 的 `optionCount`。
- `POST /option-categories`：请求 `{ expectedVersion, code, name }`，返回 `{ version, category }`。
- `PATCH /option-categories/:id`：请求 `{ expectedVersion, name?, status? }`；系统分类拒绝修改。
- `PUT /option-categories/order`：请求 `{ expectedVersion, categoryIds }`，`categoryIds` 必须是除系统分类外全部分类 ID 的无重复有序全集；服务端在一次事务中按固定步长重排，系统分类继续置底。
- `DELETE /option-categories/:id`：请求体 `{ expectedVersion }`；服务端在同一事务内重新检查所有状态 Option 的引用，无引用才删除。

稳定错误码：`version_conflict`、`option_category_not_found`、`option_category_code_conflict`、`option_category_system_locked`、`option_category_in_use`（携带 `optionCount`）、`option_category_inactive`、`invalid_option_category_order`、`option_picker_limit_exceeded`、`option_active_limit_exceeded`。

### 6.3 Option 写兼容与事务校验

扩展 Option 写接口：

- 新版 POST 必须发送 `categoryId`；为兼容部署期间的旧客户端，缺少该字段时服务端归入“未分类”，并在审计详情中标记 `legacyCategoryFallback: true`。
- PATCH 缺少 `categoryId` 表示保持原分类；发送与原值相同的停用分类允许保存其他字段；显式变更时目标分类必须启用。
- 创建启用 Option，或将停用 Option 重新启用时，服务端必须在写事务中重新统计启用 Option；写入后超过 10,000 个则返回 `option_active_limit_exceeded`，不得产生第 10,001 个启用项。停用和编辑现有启用 Option 不受此限制。
- 分类新增、修改、排序、删除和 Option 写入均使用请求 `expectedVersion` 与当前数据库版本做乐观锁校验。
- 分类排序及删除在服务端事务内完成，不信任客户端任意 `sortOrder` 或前置引用计数。
- 批量预览和单商品保存发现失效项时返回 `option_configuration_invalid`，携带 `{ optionId, categoryId, reason }[]`；`reason` 只能是 `option_not_found`、`option_inactive`、`category_not_found`、`category_inactive`。客户端按 `optionId` 标记对应草稿行，并用 `categoryId` 和 `reason` 展示分类级提示。Option 仅迁移到另一个仍启用分类时身份仍有效，不阻止预览或保存。批量提交仍需再次检查 preview 版本，防止预览后状态变化。
- 所有成功写操作提升门店调味配置版本并写审计记录。

## 7. 组件边界

- 新增共享 `SeasoningOptionCategoryPicker`，只负责分类浏览、搜索、多选和选择状态计算。
- 批量关联和单商品编辑均通过共享配置工作区调用该选择器。
- 分类管理组件只负责分类 CRUD 与排序，不耦合关系配置草稿。
- 服务端集中完成旧数据归类、分类可分配校验和删除约束。

## 8. 错误处理

- 分类或 Option 加载失败：弹窗保留，显示错误及“重新加载”，不清空当前动作配置。
- 配置版本冲突：沿用现有重新加载/覆盖处理方式。
- 分类在操作期间停用或 Option 停用：确认时返回明确业务错误，保留弹窗选择以便用户调整。
- 分类删除受阻：提示仍有关联的 Option 数量，并引导先迁移。
- 空分类和无搜索结果分别展示不同空状态。

## 9. 响应式与可访问性

- 桌面端为“类 + Option”两列；窄屏改为上下两区，分类横向可滚动，Option 列表在下方，不能用固定最小宽度裁切内容。
- 分类列表使用可访问的单选浏览语义（`role="listbox"` / `option` 或等价 Tab 模式），当前分类暴露选中状态；分类复选框是独立焦点，不与切换分类混为一次操作。
- 原生复选框同步 `indeterminate` 和 `aria-checked="mixed"`；分类计数变化通过礼貌型 live region 播报。
- 打开后焦点落到搜索框；Esc 关闭，Tab 焦点约束在弹窗内；关闭后焦点返回触发“添加 Option”的按钮。
- 键盘可分别完成分类切换、分类全选和单 Option 勾选。

## 10. 验收与测试

- 单分类归属及旧 Option 自动进入“未分类”。
- 旧数据迁移持久化、幂等、版本只提升一次且审计只写一次。
- 分类排序、“未分类”置底、停用分类分配限制。
- 分类排序、删除和分配遇到并发版本变化时拒绝旧写入。
- 分类全选、取消、半选、已有关联 Option 的禁用与计数。
- 专用非分页快照下计数准确；超过上限不静默截断。
- 启用 Option 恰好 10,000 个时选择器可用；并发创建或重新启用导致第 10,001 个时事务拒绝且版本不变。
- 跨分类多选、分类名搜索、Option 文本搜索、搜索后批量选择、清空搜索后状态保持。
- 同一 Option 可在不同动作下选择，但当前动作内不重复。
- 动作 A 已有关联的 Option 在动作 B 的分类全选中仍可被选中。
- 批量新增和单商品编辑使用一致选择器行为。
- 分类有关联时禁止删除，无关联时可删除。
- 停用分类可原样保留、可迁出、不可作为新分配目标；其历史关系不从动作配置中消失。
- 旧客户端 POST 未传分类进入“未分类”，PATCH 未传分类保持原值。
- 选择后分类或 Option 被停用时，批量预览和单商品保存均返回可定位错误并保留草稿。
- `option_configuration_invalid` 的四种 reason 均可定位；Option 迁移到其他启用分类后仍可继续保存。
- API 乐观锁、审计记录与配置版本递增。
- 系统分类的修改、停用、删除和排序均被服务端拒绝。
- 中英文界面文案、键盘操作、焦点顺序及原生半选状态可访问性。
