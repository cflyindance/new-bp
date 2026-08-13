# 菜单下单限制规则列表滚动区实施计划

## 目标

将「数量与频次限制」默认列表页的滚动责任从外层 iframe/页面收敛到「现有规则」数据区，并移除列表页外围的背景、边框、圆角与阴影。

## 任务 1：建立失败验证

新增 `scripts/verify-order-limit-rule-list-scroll.mjs`，读取真实承载组件与 iframe 页面源码，验证：

1. 数量页 panel 不包含 `rounded-xl`、`border`、`bg-card`、`shadow-sm`。
2. embedded 模式下页面占满可用高度、禁止整页滚动并去掉外层背景/留白。
3. `#rulesPanel` 为占满高度的纵向 flex 容器。
4. `.section-body` 是唯一的规则列表滚动区。
5. 表头使用 sticky 定位。

先运行并保留失败证据，确保测试确实命中当前缺口。

## 任务 2：调整外层数量页承载区

修改 `src/config/foh-menu-order-limits-ui.ts`：

- 保留 quantity panel 的 `flex`、`min-h-0`、`flex-1` 与 `overflow-hidden`。
- 移除装饰性圆角、边框、背景与阴影。
- 不改 iframe 全屏页面识别及进入/退出逻辑。

## 任务 3：调整 iframe 列表页滚动结构

修改 `dist/Configuration center/order-limit.html`：

- 为 embedded 模式建立 `html/body/.page` 的完整高度链路。
- 禁止 embedded 页面整页纵向滚动，移除灰色背景和页面 padding。
- 将 `#rulesPanel` 设为占满高度的 flex column。
- 保持 `.section-head` 在滚动区之外。
- 让 `.section-body` 使用 `min-height: 0; flex: 1; overflow: auto`。
- 让 `thead th` sticky 到滚动视口顶部，并使用不透明背景与层级。
- 保留横向滚动能力和既有表格数据/操作逻辑。

## 任务 4：自动验证

- 运行 `node scripts/verify-order-limit-rule-list-scroll.mjs`，取得 GREEN。
- 运行现有 `node scripts/verify-order-limit-heading-focus.mjs`，确认前序标题焦点修复未回归。
- 运行 `git diff --check`。
- 本次不执行 production build：修改未触及依赖、构建配置、入口、模块解析或生产专属分支。

## 任务 5：浏览器验证

在独立 worktree 启动本地服务并验证：

1. 默认列表页直接展示「现有规则」。
2. 外层装饰性卡片和灰色背景消失。
3. 页面/iframe 外层没有纵向滚动条。
4. 规则数据区可纵向滚动。
5. 滚动数据行时标题操作栏与表头保持固定。
6. 点击新增规则进入全屏编辑页；返回列表后布局恢复。
7. 控制台无错误。

## 任务 6：提交与合并

- 仅暂存本计划、验证脚本和两个目标实现文件。
- 提交 worktree 分支。
- 确认 main 无目标文件重叠修改后，以 `--autostash` 合并，保留 main 现有未提交内容。
- 在 main 上重跑聚焦验证。
