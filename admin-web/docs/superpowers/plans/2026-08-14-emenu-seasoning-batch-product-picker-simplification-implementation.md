# eMenu 调味批量关联商品选择简化实施计划

## 目标

按已确认的设计规格简化批量关联商品选择器：服务端只返回启用且可在 eMenu 销售的商品；前端移除筛选全选入口、说明文案、商品编码与不可用提示；动作选择器移除多选说明，同时保持搜索、组/类批量选择、分页和旧接口兼容。

## 实施步骤

1. 修改 `scripts/lib/emenu-local-seasoning-api-handler.mjs`
   - 在 `matchingMenuProductIds` 中统一过滤不可选商品。
   - 保持名称与内部编码搜索。
   - 菜单结构计数、组/类范围选择和分页复用同一匹配集合。

2. 修改商品选择前端
   - `seasoning-batch-wizard-ui.ts`：拆分搜索输入值与已应用查询；仅显式搜索应用输入值，其他刷新和分页使用服务端最近返回的 `menu.query`。
   - 移除“选择全部筛选结果”按钮、说明文案及点击分支。
   - `seasoning-menu-structure-picker-ui.ts`：菜品行隐藏编码和不可用原因，保留名称、勾选状态与已关联 Option 数量。

3. 修改共用动作选择器
   - `seasoning-configuration-workspace-ui.ts`：移除动作多选说明。
   - 清理批量向导遗留动作选择器中的同一说明和不再使用的中英文文案键。

4. 更新验证
   - `verify-emenu-local-seasoning-api.mjs`：验证不可用商品在默认、名称、编码查询中均被过滤；编码搜索仍有效；组/类计数、跨页全选、去重和旧 search scope 兼容。
   - `verify-emenu-local-seasoning-settings.mjs`：验证指定按钮、文案、商品编码和不可用原因不再渲染；三列、组/类复选框、Option 数量与已应用查询规则保留。

5. 验证与视觉回归
   - 运行 `npm run verify:emenu-local-seasoning`。
   - 运行 `npm run build`。
   - 在本地调味设置页面检查批量商品选择、搜索、组/类切换、勾选及加载更多。

## 完成标准

- 不可用商品不会进入菜单结构、计数或批量选择范围。
- 页面只移除确认范围内的控件和文案，结构与核心交互不回归。
- 搜索输入与已应用查询不会混用，分页游标与查询保持同源。
- 自动化验证、构建及本地视觉检查通过。
