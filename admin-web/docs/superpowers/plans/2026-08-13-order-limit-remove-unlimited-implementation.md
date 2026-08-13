# 菜单下单限制移除“不限制”实施计划

## 目标

在「限购数量 > 产线配置」彻底移除单项和批量“不限制”入口，并把全部历史明确“不限制”状态统一、持久地恢复为未配置。

## 任务 1：建立失败验证

新增 `scripts/verify-order-limit-remove-unlimited.mjs`，静态验证：

- 表格和批量工具栏不再渲染“不限制”入口或操作列。
- 点击处理不再包含单项“不限制”分支。
- 页面说明与校验提示不再包含“不限制”口径。
- 存在统一、幂等的历史状态归一化函数。
- `loadRules` 会在发现变化时立即持久化。
- 编辑、门店选择、发布确认和兼容输出均经过归一化边界。

先运行并确认验证失败，再实施代码。

## 任务 2：统一归一化与持久化

修改 `dist/Configuration center/assets/order-limit-flow.js`：

1. 增加仅负责将 `{ configured: true, value: null }` 转为 `{ configured: false, value: null }` 的幂等函数。
2. 同步清理规则兼容层 `limits` 数组中的对应状态。
3. `loadRules` 解析全部规则后执行归一化；发现变化时直接写回 `localStorage`。
4. `normalizeLoadedEditorDraft` 和 `buildCompatibilityRule` 再做防御性归一化，保证所有入口与输出一致。

## 任务 3：清理页面与交互

修改 `dist/Configuration center/assets/order-limit-flow.js` 和相关 CSS：

1. 表格删除「操作」表头及对应单元格。
2. 删除单行「设为不限制」按钮和点击分支。
3. 批量工具栏删除「设为不限制」。
4. 批量应用只接受 `value` 和 `zero`。
5. 状态渲染仅保留未配置、禁止下单、已配置。
6. 更新数量页、场景页和校验提示文案。
7. 删除不再使用的 unlimited 样式。

## 任务 4：更新既有回归验证

修改 `scripts/verify-order-limit-batch-target-selection.mjs`：

- 批量应用分支的截取边界不再依赖已删除的单项按钮分支。
- 删除“单行不限制操作应保留”的旧断言。
- 增加批量数量和禁止能力仍存在的断言。

## 任务 5：验证与交付

依次执行：

- 新增验证脚本。
- 批量目标选择、规则列表滚动、标题焦点回归脚本。
- `node --check`。
- TypeScript `--noEmit`。
- `git diff --check`。
- 浏览器验证菜品和分类两种规则、历史状态归一化、批量选择和禁止操作。

验证通过后提交功能分支，以 `--autostash` 合并到 `main`，再次运行自动化验证并保留本地预览页面。

