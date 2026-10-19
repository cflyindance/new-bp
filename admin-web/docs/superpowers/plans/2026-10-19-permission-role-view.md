# 角色权限只读详情 Implementation Plan

**Goal:** 点击角色名称查看实际生效菜单及已授权功能，编辑入口保留完整目录。
**Architecture:** 新增独立view路由，复用roleAccess和effectiveMenuView；共用渲染器新增grantedOnly功能过滤，与原员工只读展示隔离。只读详情不提供保存/授权写入事件。
**Tech Stack:** TypeScript、权限中心HTML模板、tsx/assert、Vite。
**Spec:** 已确认的“查看权限与编辑权限分离”方案；三份权限文档PERM-ROLE-VIEW-20261019-01。

## Global Constraints
- 独立codex/permission-role-view-20261019，最新已获取main基线4b926b1a。
- 沿用roleAccess的祖先/旧拒绝/继承/依赖；不改授权、存储和员工面板语义。
- 未获提交/合并/推送授权，不执行上述操作；不制作缺失截图。

## Tasks
- [x] scripts/verify-permission-role-view.ts先RED（新模块缺失）后GREEN：路由解析、只读/编辑分离、空角色、继承和拒绝、隐藏功能/空分类、搜索、无写入控件、原角色数据不变。
- [x] center-role-route.ts识别view/edit路径；center-ui.ts角色名链接、只读标题与工具栏、只读footer与事件拦截；main.ts补充路由标题。
- [x] center-editor.ts添加grantedOnly和emptyMessage，按最终状态过滤功能/设置及分类，不使用preview的示例内容或操作按钮。
- [x] 更新产品V3.32／研发V2.32／个人V2.32对应正文、互链、同一变更编号与截图缺口。
- [x] 10项专项/相关回归、tsc --noEmit、git diff --check、Vite隔离构建通过；功能预览58208，PID48724。未进行浏览器实页验收，截图待补，未提交/合并/推送。

预览目录：本独立功能worktree的admin-web；URL：http://127.0.0.1:58208/?preview=permission-role-view#/permissions/roles
主线58183服务未改动。构建输出仅.cache/role-view-build，未发布或重构eMenu嵌入包。
