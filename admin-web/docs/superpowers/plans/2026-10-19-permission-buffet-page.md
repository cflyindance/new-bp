# 自助餐规则页面授权实现计划

基线 main@63f93073；分支 codex/permission-buffet-page-20261019。

目标：标题仅保留不可见/可见不可编辑/可编辑，统一控制新增、修改、删除、复制、启用/禁用，正文不再展示独立授权。

- 先补 verify-permission-buffet-page.ts：标题三态、正文无单独动作、所有操作同步、旧混合状态、祖先阻断与员工门店隔离。
- center-authorization 的自助餐统一行收齐原manage-rule/copy/toggle；center-page-policy同步原页面gate；center-editor仅标题渲染统一控件。
- 保留路由、原授权键、门店范围及生产鉴权边界；不自动扩大历史拒绝，不触及其他前厅页面。
- 同步权限三份文档，运行专项/前厅/权限回归与TypeScript检查，独立预览验收；未授权提交。
