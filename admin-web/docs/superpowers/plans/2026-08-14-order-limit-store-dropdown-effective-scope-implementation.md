# 数量与频次规则门店下拉与生效范围实施计划

## 目标

把门店商品配置与规则生效范围彻底分离：第 2 步使用单选下拉切换各门店商品配置，第 5 步使用门店表格选择本次生效范围；移除后置门店选择流程，同时保证未生效门店在发布后仍可用于后续编辑。

设计依据：`docs/superpowers/specs/2026-08-14-order-limit-store-dropdown-effective-scope-design.md`

开发分支：`codex/order-limit-store-scope-flow`

开发目录：`F:\米聚\GitHub仓库\new-bp-worktrees\order-limit-store-scope-flow\admin-web`

## 实施原则

- 全部功能修改只在独立 worktree 中进行。
- 先更新专项验证使其按新口径失败，再实施功能直至通过。
- 保留 `storeConfigs[storeId]` 的门店隔离结构。
- 运行快照与后台编辑快照分离，禁止未生效门店进入下发数据。
- 不改动与数量及频次规则无关的文件。
- 完成专项验证、既有回归、完整构建和浏览器流程后再提交并合并 `main`。

## 任务 1：建立新交互的失败验证

涉及文件：

- 修改 `scripts/verify-order-limit-store-specific-config.mjs`
- 新增 `scripts/verify-order-limit-store-scope-flow.mjs`

验证内容：

1. 第 2 步存在 `data-config-store-select` 单选下拉。
2. 第 2 步不再渲染 `data-participating-store` 门店表格和 `data-store-tab` 标签。
3. 下拉选项只输出门店名称，不拼接“已添加/未添加”。
4. 第 5 步渲染 `data-effective-store` 表格、地址和商品状态。
5. 未添加门店复选框禁用，已添加门店允许选择。
6. 第 5 步校验至少一家 `deployStoreIds`。
7. 第 7 步直接跳转发布确认页。
8. 旧门店页只执行安全重定向，不再渲染选择表格。
9. 发布对象同时包含完整 `authoringDraft` 和裁剪后的运行快照。
10. 正式规则编辑优先读取 `authoringDraft`。
11. 历史生效、排除和悬空 ID 归一化规则存在且可重复执行。

执行：

```powershell
node scripts/verify-order-limit-store-scope-flow.mjs
```

预期：实施前失败，并准确指出旧表格仍在第 2 步或缺少第 5 步生效门店表格。

## 任务 2：调整门店集合归一化与发布生命周期

涉及文件：

- 修改 `dist/Configuration center/assets/order-limit-flow.js`

实施内容：

1. 将 `participatingStoreIds` 归一化为当前可用且具有有效商品目标的门店集合。
2. 增加生效集合归一化函数：
   - 移除不可用、无商品或悬空的 `deployStoreIds`。
   - 保留有效 `deployExcludedStoreIds`。
   - 历史对象存在 `deployStoreIds` 时，用有效交集和差集重建选择与排除集合。
   - 历史对象缺少该字段时，默认全部有效已添加门店生效。
3. 商品从空变为非空时，非排除门店默认加入生效范围。
4. 商品从非空变为空时，移除生效选择、清空该门店数量矩阵并保留人工排除记录。
5. 扩展正式规则保存结构：
   - `authoringDraft` 保存发布前完整草稿。
   - `editorDraft`、顶层 `storeConfigs` 和兼容字段继续保存仅生效门店的运行快照。
6. `draftFromRule` 优先深复制并读取 `authoringDraft`；历史规则回退到现有 `editorDraft` 或兼容字段。
7. 保证迁移幂等，`loadRules` 检测变化后立即持久化。

验证：

```powershell
node --check "dist/Configuration center/assets/order-limit-flow.js"
node scripts/verify-order-limit-store-scope-flow.mjs
```

## 任务 3：把第 2 步改为门店下拉

涉及文件：

- 修改 `dist/Configuration center/assets/order-limit-flow.js`
- 修改 `dist/Configuration center/assets/order-limit-flow.css`

实施内容：

1. 删除第 2 步参与门店表格和门店标签渲染。
2. 增加“配置门店”单选 `<select data-config-store-select>`：
   - 首项为“请选择配置门店”。
   - 后续选项只显示全部可用门店名称。
   - 新建规则不默认选择。
   - 草稿返回时恢复有效 `activeStoreId`。
3. 未选择门店时显示空状态，不绑定商品结构选择器。
4. 选择门店时创建或读取独立空配置，但不立即加入 `participatingStoreIds`。
5. 商品结构变更后重新计算当前门店目标，并同步参与和生效集合。
6. 清空全部商品时清理当前门店数量并恢复未配置状态。
7. 移除原门店复选框、取消门店确认弹窗和门店标签事件。
8. 保持规则名称、描述和原商品结构样式不变。

验证：

```powershell
node scripts/verify-order-limit-store-scope-flow.mjs
node scripts/verify-order-limit-store-specific-config.mjs
```

## 任务 4：把生效门店表格移到第 5 步

涉及文件：

- 修改 `dist/Configuration center/assets/order-limit-flow.js`
- 修改 `dist/Configuration center/assets/order-limit-flow.css`

实施内容：

1. 在第 5 步顶部增加“生效门店”区块。
2. 复用现有表格列：选择、门店名、MID、地址、商品状态。
3. 全部门店都展示：
   - 已添加：绿色，可勾选。
   - 未添加：红色，禁用。
   - 已选行：浅蓝背景。
4. 复选框使用 `data-effective-store`，变化时同步：
   - 勾选：加入 `deployStoreIds`，从 `deployExcludedStoreIds` 移除。
   - 取消：从 `deployStoreIds` 移除，加入 `deployExcludedStoreIds`。
5. 第 5 步校验增加至少一家生效门店和门店有效性校验。
6. 第 5 步其余日期、营业时段、星期和会员条件保持原行为。
7. 第 7 步复核增加最终生效门店摘要。

验证：

```powershell
node scripts/verify-order-limit-store-scope-flow.mjs
```

## 任务 5：移除后置门店选择流程并收紧路由

涉及文件：

- 修改 `dist/Configuration center/assets/order-limit-flow.js`

实施内容：

1. 第 7 步“保存并下发”保存草稿后直接跳转 `order-limit-publish-confirm.html?draftId=...`。
2. 发布确认页返回规则编辑页；依赖已经保存的 `currentStep = 7` 恢复，不使用通用步骤查询参数。
3. `mountStores` 不再渲染表格：
   - 草稿已解锁第 5 步时，安全保存 `currentStep = 5` 后重定向编辑页。
   - 未解锁时只返回其当前步骤，不提升 `highestStep`。
4. 发布确认和 `publishDraft` 都重新验证：
   - 至少一家生效门店。
   - 生效门店均已添加商品。
   - 生效门店数量矩阵完整。
5. 正式发布时同步生成裁剪运行快照和完整 `authoringDraft`。

验证：

```powershell
node scripts/verify-order-limit-store-scope-flow.mjs
```

## 任务 6：更新样式与清理旧代码

涉及文件：

- 修改 `dist/Configuration center/assets/order-limit-flow.css`
- 修改 `dist/Configuration center/assets/order-limit-flow.js`

实施内容：

1. 增加门店下拉容器、标签和空状态间距。
2. 保留并迁移门店表格、状态颜色和选中行样式到第 5 步。
3. 删除不再使用的第 2 步门店标签状态样式。
4. 删除 `renderStepTwoLegacy`、`mountStoresLegacy` 等与新流程冲突的遗留实现。
5. 保留第 4 步门店切换和批量配置样式。

验证：

```powershell
node --check "dist/Configuration center/assets/order-limit-flow.js"
git diff --check
```

## 任务 7：完整自动化回归

执行：

```powershell
node scripts/verify-order-limit-heading-focus.mjs
node scripts/verify-order-limit-rule-list-scroll.mjs
node scripts/verify-order-limit-batch-target-selection.mjs
node scripts/verify-order-limit-remove-unlimited.mjs
node scripts/verify-order-limit-store-specific-config.mjs
node scripts/verify-order-limit-store-scope-flow.mjs
npm.cmd run build
```

要求：

- 所有验证脚本通过。
- TypeScript 和 Vite 构建通过。
- 仅允许已有的大包体积警告，不得有新增错误。
- 构建产生的时间戳和带哈希产物不进入本功能提交。

## 任务 8：浏览器全流程验证

在独立 worktree 启动新的本地端口，避免旧浏览器缓存：

1. 新增按分类规则。
2. 第 2 步确认门店下拉无状态文案且初始为空。
3. 选择 A，配置商品；切换 B，配置不同商品。
4. 切回 A，确认原商品仍在。
5. 第 4 步分别为 A、B 设置不同数量并相互切换验证。
6. 第 5 步确认 A、B 已添加且默认勾选，其他门店未添加并禁用。
7. 取消 A，只保留 B；刷新并返回确认 A 仍未选择。
8. 返回第 2 步确认 A、B 商品配置均保留。
9. 第 7 步确认只展示 B，并直接进入发布确认页。
10. 发布后重新编辑，确认 A、B 编辑配置仍在，而生效范围只有 B。
11. 访问旧门店选择 URL，确认安全回到第 5 步且不出现选择页。
12. 检查控制台无 error 或 warning。

## 任务 9：提交与合并

1. 确认功能 worktree 仅包含预期文件。
2. 提交实现和验证脚本。
3. 在 `main` 使用 `git merge --autostash --no-ff` 合并功能分支，保护主工作区现有未提交修改。
4. 合并后在 `main` 再运行全部数量与频次规则专项脚本。
5. 不执行推送，除非用户另行要求。

