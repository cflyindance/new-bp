# 下单规则简洁命名 Implementation Plan

> 当前任务内实施与核验；未获授权不提交、合并或推送。

**Goal:** 前厅导航显示下单规则，子项依次为自助餐限购、菜品搭配、下单设置。

**Architecture:** 仅更新既有节点显示名称；显示组装时按已过滤菜单ID规范化旧名称，保留路径、顺序、筛选、权限与公共下钻。列表及页面标题、aria名称同步，编辑器业务名称和规则数据不批量改名。

**Tech Stack:** TypeScript、原生HTML、Node/tsx、现有Chrome/Playwright验收。

**Spec:** 用户2026-11-10确认简洁命名；沿用唯一[侧栏导航产品权威](../../项目文档/侧栏导航布局-门店版与连锁版.md)及对应研发、个人规范版。

## Global Constraints

- main基线f6be9ebe已包含远端0aa320f0；另有本地已合入未推送提交，全部保留。
- ID qc-menu-order-limits、qc-rule-restrictions、foh-buffet-rules、qc-dish-round、qc-order-other不改，路由不改。
- 自助餐规则内容、配额、授权、保存与下发不变；菜品搭配仍指同一轮，九项下单设置及分类不变。
- 中文显示为下单规则／自助餐限购／菜品搭配／下单设置；英文为Order rules／Buffet limits／Dish pairing／Order settings。
- Build skipped：不修改应用入口、依赖、资源加载或编译配置；执行类型检查及浏览器验证，CI unknown。

## Task 1: 展示名称与回归

- [x] 修改scripts/verify-rule-restrictions-navigation.ts期望值及旧菜单名称输入断言，运行npx --no-install tsx取得RED。
- [x] src/config/navigation.ts更新默认定义及groupRuleRestrictionsSubnav，按ID给子项显示别名，不能新增未通过过滤的项。
- [x] 更新foh-buffet-rules-ui.ts的iframe标题、foh-menu-order-limits-ui.ts的区域名、module-settings-dish-rules-ui.ts的标题、buffet-rule.html的列表标题；不更改编辑器“新增自助餐规则”等业务操作名称。
- [x] 更新受标题影响的浏览器测试查找文本，保留原断言内容和交互。
- [x] 运行导航可见性矩阵、旧输入不变、路由高亮、下单设置分类、公共递归、自助餐回归和TypeScript --noEmit。

## Task 2: 浏览器与文档

- [x] 功能分支真实浏览器依次打开三个叶子，核对父标题、页面标题、原路径和高亮；保留截图。
- [x] 同步侧栏导航唯一三份文档的当前有效定义、共同版本和NAV-ORDER-LABELS-20261110-01编号，不修改其他模块规则。
- [x] git diff --check、图片互链检查；记录实际目录、端口和未提交状态。
