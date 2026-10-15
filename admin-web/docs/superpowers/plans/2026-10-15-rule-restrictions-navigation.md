# 规则限制导航 Implementation Plan

> **For agentic workers:** Inline execution in this task; no autonomous commits or delegation.

**Goal:** 实施用户确认的 B 方案。

**Architecture:** 保留逻辑能力注册，将已过滤的前厅导航转换为显示分组。公共递归滑层负责下钻；原业务路由决定页面。

**Tech Stack:** TypeScript、Vite、现有导航渲染及 Node 断言。

**Spec:** `docs/superpowers/specs/2026-10-15-rule-restrictions-navigation-design.md`

## Global Constraints

执行记录：两项任务实现、三份文档与截图已完成；首次测试因本地无 tsx 启动器未运行，后使用 npx tsx 完成断言。类型检查、公共递归导航、自助餐导航／全屏、数量列表滚动检查通过。真实浏览器验证父项文字中心 (49,534) 与留白 (230,533)、单层返回、三个子页面和选中保持。未执行真实业务保存／下发、生产授权组合及草稿离页编辑验收。未提交；下列步骤保留为原计划，不代表每项均独立执行了红灯测试。

- 基线 main@e60bae40bcbaa26102ca3a0ac6a6ee25f81b7758；功能分支 codex/rule-restrictions-navigation。
- 不合并或新增授权能力；不修改业务数据、eMenu 源码；不提交、合并或推送。
- 复用 NAV-20261014-01 公共覆盖滑层，保留原 URL 和草稿保护。

### Task 1: 导航与页面

Files: `src/config/navigation.ts`、`src/config/platform-preset-nav-filter.ts`、`src/config/foh-menu-order-limits-ui.ts`、`src/main.ts`；新增测试 `scripts/verify-rule-restrictions-navigation.ts`。

- [ ] 创建纯函数 `groupRuleRestrictionsSubnav(items: ProductCenterSidebarSubItem[]): ProductCenterSidebarSubItem[]` 的测试：两能力可见 → 外层数量和三子项；单能力可见 → 两子项或一个子项；均不可见 → 无父项；无可见子叶 → 不生成空父项；不修改输入。
- [ ] 运行测试确认缺少导出失败，再实现纯函数。显示父项 id 为 qc-rule-restrictions，activePrefixes 仅含实际子叶路径；外层数量项不含子项。NAV_MODULES 保留原能力 ID，给数量能力登记 dish-round 和 other 两个原地址子项。
- [ ] 在 `getFilteredNavModuleSheetSubnav` 既有过滤之后分组；活动路径解析同样分组；main 父项回退查找使用过滤后的显示树。
- [ ] 移除页面顶部三项 tablist 和其事件绑定，将三个面板改为具名 region，保留业务绑定及 iframe 全屏。main 采用无参绑定调用。
- [ ] 运行 `verify-rule-restrictions-navigation.ts`、`verify-recursive-navigation-interaction.mjs`、`verify-buffet-rule-navigation.mjs`、`verify-buffet-rule-fullscreen.mjs` 和 `tsc --noEmit`。

### Task 2: 文档与验证

Files: `docs/项目文档/侧栏导航布局-门店版与连锁版.md`、`侧栏导航业务规格说明书（研发交付版）.md`、`侧栏导航需求文档（个人规范版）.md`；截图目录 `docs/项目文档/assets/rule-restrictions-navigation/`。

- [ ] 三份正文同步 NAV-20261015-07；版本产品 V2.0、研发 V1.9、个人 V1.9，更新互链和置顶版本记录。逐项定义父行、标题、返回和三个叶子，记录权限矩阵与旧地址兼容；不改历史业务。
- [ ] 隔离端口启动功能分支验证服务，明确不是 main 预览。不停止旧服务；检查三路由页面、无重复页签、整行点击、返回一层和高亮保持；保存真实截图，不能完成的证据明确列缺口。
- [ ] 检查三份文档互链、图片引用及代码 diff；报告实际通过的测试和未验证范围，不自动提交。
