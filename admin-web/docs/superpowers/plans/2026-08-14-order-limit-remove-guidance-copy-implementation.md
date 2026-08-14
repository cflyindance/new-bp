# 数量与频次规则说明文案精简实施计划

> 依据规格：`docs/superpowers/specs/2026-08-14-order-limit-remove-guidance-copy-design.md`

## 目标

删除新增数量与频次规则流程中已确认的七条辅助说明及对应空节点，不改变任何规则配置、校验、保存或发布行为。

## 任务 1：建立失败验证

新增 `scripts/verify-order-limit-guidance-copy-removal.mjs`：

- 读取 `dist/Configuration center/assets/order-limit-flow.js`。
- 断言七条目标原文均不存在。
- 断言五个步骤标题与“生效门店”标题仍存在。
- 断言商品配置、数量矩阵、生效门店、授权和发布的关键控件标记仍存在。

先运行脚本，确认它因目标文案仍存在而失败。

## 任务 2：删除目标文案节点

修改 `dist/Configuration center/assets/order-limit-flow.js`：

- 从商品配置标题区删除目标 `<p>`。
- 从“配置门店”字段删除目标 `.olf-hint`。
- 从设置限购数量、生效范围、超限授权和确认发布标题区删除各自目标 `<p>`。
- 从“生效门店”区块删除目标 `.olf-help`。
- 保留各级标题、焦点属性、控件和事件标记。

## 任务 3：自动化回归

依次执行：

```powershell
node scripts/verify-order-limit-guidance-copy-removal.mjs
node --check "dist/Configuration center/assets/order-limit-flow.js"
Get-ChildItem scripts/verify-order-limit-*.mjs | ForEach-Object { node $_.FullName }
git diff --check
```

如 worktree 可复用依赖，再执行 `npm.cmd run build`，并确保不提交构建产生的无关哈希文件。

## 任务 4：浏览器验收

在独立端口启动本 worktree 预览，检查商品配置、设置限购数量、生效范围、超限授权和确认发布步骤：

- 七条目标说明不可见。
- 标题和主要控件仍正常展示。
- 不存在空的帮助文案占位或明显间距异常。
- 页面无 Vite 错误遮罩和控制台脚本错误。

## 任务 5：提交和合并

- 在 `codex/order-limit-remove-guidance-copy` 提交计划、生产代码和专项验证。
- 确认 worktree 仅包含预期变更。
- 使用 `git merge --autostash --no-ff` 合并到 `main`，不覆盖主工作区的未提交内容。
- 合并后在 `main` 再运行语法检查和专项验证。
