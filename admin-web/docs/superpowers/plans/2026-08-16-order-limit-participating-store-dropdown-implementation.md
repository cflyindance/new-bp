# 数量与频次规则参与门店下拉实施计划

> 依据规格：`docs/superpowers/specs/2026-08-16-order-limit-participating-store-dropdown-design.md`

## 任务 1：建立失败验证

更新 `scripts/verify-order-limit-store-specific-config.mjs`，断言：

- 商品配置字段显示“参与门店”和“请选择参与门店”。
- 限购数量存在 `data-limit-store-select` 原生下拉。
- 限购数量不再存在 `data-limit-store-tab`。
- 下拉选项由 `addedStoreIds(draft)` 生成。
- 手动和自动门店切换均会清空批量状态。
- 无参与门店时清空活动门店和产线，并显示安全空态。

先运行该脚本，确认因现有门店 Tab 与旧文案而失败。

## 任务 2：调整商品配置文案

修改 `dist/Configuration center/assets/order-limit-flow.js`：

- “配置门店”改为“参与门店”。
- “请选择配置门店”改为“请选择参与门店”。
- 保留现有 `data-config-store-select`、全部门店选项和商品配置行为。

同步更新引用旧占位文案的回归断言。

## 任务 3：将限购数量门店 Tab 改为下拉

在 `renderStepFour(draft)` 中：

- 从 `addedStoreIds(draft)` 生成门店 `<option>`。
- 使用 `data-limit-store-select` 和 `draft.activeStoreId` 渲染当前选项。
- 删除门店 Tab 结构与 `data-limit-store-tab` 点击入口。
- 有参与门店时渲染人数、轮次、产线、批量入口和数量矩阵。
- 无参与门店时仅渲染禁用下拉和“暂无参与门店”空态。

在输入事件中处理门店下拉 `change`：校验参与门店、清理批量状态、更新活动门店、归一化活动产线并重绘。

## 任务 4：补齐自动归一化边界

- 让 `normalizeActiveDimensions(draft, true)` 在无参与门店时清空 `activeStoreId` 和 `activeLineId`。
- `renderStepFour` 在归一化前后比较活动门店；门店自动变化时清空批量状态。
- 保持所有门店的 `storeConfigs`、数量矩阵和生效门店集合不变。

## 任务 5：自动化回归

执行：

```powershell
node scripts/verify-order-limit-store-specific-config.mjs
node --check "dist/Configuration center/assets/order-limit-flow.js"
Get-ChildItem scripts/verify-order-limit-*.mjs | ForEach-Object { node $_.FullName }
git diff --check
npm.cmd run build
```

构建后清理仅由构建产生的哈希资产和时间戳文件，提交中只保留预期变更。

## 任务 6：浏览器验收

在独立端口验收：

1. 商品配置显示“参与门店”和新占位。
2. 配置两家门店商品后，限购数量下拉只显示这两家门店。
3. 切换门店时产线、商品和数量矩阵随门店切换，已填数量互不覆盖。
4. 在批量模式中切换门店后，批量模式自动退出且勾选清空。
5. 验证自动归一化和无参与门店空态不会显示旧门店矩阵。
6. 页面无错误遮罩、脚本错误和明显布局异常。

## 任务 7：提交和合并

- 在 `codex/order-limit-participating-store-dropdown` 提交生产代码、计划和测试。
- 使用 `git merge --autostash --no-ff` 合并到 `main`，保护主工作区其他未提交改动。
- 合并后再次执行专项验证和 JavaScript 语法检查。
