# eMenu 单商品调味 Option 状态移除实施计划

## 任务 1：统一共享配置工作区列结构

文件：`src/emenu-local/seasoning/seasoning-configuration-workspace-ui.ts`

- 从配置草稿 Option 类型中移除关系状态。
- 历史关系转换为草稿时保留动作、Option、价格和关系 ID，不携带状态。
- 移除仅用于状态列的 workspace mode 分支，批量与单商品使用同一列模板。
- 删除状态表头、状态复选框和启停文案，保持拖动、批量改价、价格计算与删除列不变。

文件：`src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts`

- 删除共享工作区已不再需要的 batch mode 参数。

## 任务 2：调整单商品编辑、预览与保存

文件：`src/emenu-local/seasoning/seasoning-product-drawer-ui.ts`

- 删除共享工作区 product mode 参数和状态变更事件。
- 单商品预览改为 Option、输入原价、加价系数、实际加价价格四列。
- 保存 payload 对所有保留关系显式写入 `status: "active"`。
- 初次加载和版本冲突重新加载均通过不携带状态的草稿转换，保证历史停用关系仍显示但最终保存统一启用。

## 任务 3：更新验证

文件：`scripts/verify-emenu-local-seasoning-settings.mjs`

- 将“必须保留关系状态控件”断言改为“不得出现关系状态控件”。
- 验证共享表格不再按 product/batch 切换状态列。
- 验证单商品预览不包含状态列。
- 验证保存 payload 固定发送 `active`，不再读取草稿状态。
- 保留后端旧客户端 inactive round-trip 测试，证明 API 兼容性未删除。

## 任务 4：完整验证与页面检查

- 运行 `node scripts/verify-emenu-local-seasoning-settings.mjs`。
- 运行 `node scripts/verify-emenu-local-seasoning-api.mjs`。
- 运行 `npx.cmd tsc --noEmit`。
- 刷新本地调味设置页面，打开包含历史停用关系的商品编辑与预览，确认关系仍显示且两步均无状态字段。
- 确认公共调味库仍保留 Option 启停入口，页面控制台无错误。
