# 移除权限总览 Implementation Plan

**Goal:** 门店权限管理中心只保留角色、员工、变更记录，默认角色列表，旧总览地址兼容跳转。
**Architecture:** 从导航源删除总览叶子，纯路由归一化映射商户根/旧总览到roles；删除center-ui无用总览统计渲染。M平台独立总览不动，保存数据和退休grant不清理。
**Tech Stack:** TypeScript、Vite、tsx/assert。
**Spec:** 用户已确认移除；PERM-NO-OVERVIEW-20261019-01。

## Constraints
- 最新main@29b4b927，独立codex/permission-no-overview-20261019。
- 不扩大角色授权，不删除日志或历史数据；未获提交/合并/推送授权。
- 权限三份文档与侧栏导航三份文档同步受影响定义；缺失截图明确列出。

## Tasks
- [x] 新verify-permission-no-overview.ts先RED（模块缺失）后GREEN，验证三菜单、默认入口、旧路径/新路径/平台隔离、退休授权保存不变。
- [x] 路由归一化同时应用shell和center-ui默认，AI入口/旧设置兜底指向roles，删除商户总览模板。
- [x] 权限文档V3.36/V2.36与导航产品V2.13/研发V2.12/个人V2.12配套版本递增、互链、共同变更号。
- [x] 11项专项/权限回归、tsc/diff/Vite隔离构建通过（原分包/大包警告保留）；58211隔离功能预览PID44576，未做浏览器实页验收，截图待补，未提交/合并/推送。

预览目录：本独立功能worktree的admin-web；URL：http://127.0.0.1:58211/?preview=permission-no-overview#/permissions/roles
main58183未更新。旧总览别名可用#/permissions/overview检查跳转；不要以登录页证明跳转完成。
