# 使用情况本地抽屉验证

变更编号：USAGE-DRAWER-20261029-64。起始main：58364281。分支：codex/usage-inline-drawer-20261029。目录：D:/Projects/new-bp-worktrees/usage-inline-drawer-20261029/admin-web。功能预览：http://127.0.0.1:5259/#/m-platform/merchants/merchant-zhangji/usage 。用户已授权提交、合并与推送；实际Git结果以主线提交日志和交付回复为准。

## 范围与文档

共享分析UI在管理页嵌入模式使用本地门店抽屉；显式分析导航与独立分析深链保持原规则。没有修改统计、数据标识、演示生成或权限资源目录。

商户管理中心产品V1.61、研发V1.60、个人规范V1.60；商户使用活跃分析三份V2.6，互链和共同编号已同步。各文档“使用情况：当前页面查看门店详情”章节定义当前行为并内嵌截图。

## 验证

- TypeScript --noEmit通过。
- verify-usage-inline-drawer.cjs：品牌／门店背景、URL及历史不变、产线与键盘操作、关闭／遮罩／Esc、精确焦点、真实滚动区与未提交草稿恢复、原inert还原、导航／卸载／归属失效清理、只读与撤权、独立分析路径通过。
- verify-usage-demo-identities.cjs：8门店／7品牌、设备与产线入口、搜索、旧标识兼容、刷新不写入、关联更新、自定义空数据及权限回归通过；回归临时图片写入任务临时目录，未覆盖历史证据。
- verify-activity-drilldown.ts、verify-usage-analysis-entry.ts、verify-usage-demo-identities.ts、verify-m-platform-permissions.ts、verify-activity-navigation.ts通过。
- 新图片：../../项目文档/assets/usage-inline-drawer-20261029/；brand-drawer.png经目视检查，管理详情背景与宽抽屉正确。

## 未闭合范围

本地演示实现及浏览器回归不代表后端、CI或部署验收。既有原生日历G34–36、复杂历史G43及冲突G27等独立记录不由本任务关闭。未修改eMenu源码，无需嵌入包构建。用户已授权本次Git交付；CI与部署状态须另行核验。
