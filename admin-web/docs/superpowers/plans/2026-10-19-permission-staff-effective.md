# 员工生效菜单 Implementation Plan

**Goal:** 员工门店与权限只列出当前门店可访问菜单，角色编辑目录不变。
**Architecture:** 使用既有 resolveAccess 求值，展示层递归裁剪菜单和空分类；重新选择可访问页面。无存储迁移、无授权写入。
**Tech Stack:** TypeScript，现有权限中心 HTML 渲染，tsx/assert。
**Spec:** 用户确认的仅展示有权限菜单方案；配套权限中心三份权威文档 PERM-STAFF-EFFECTIVE-20261019-01。

## Constraints
- 最新远端 main 起点 a2f31a8d，独立 codex/permission-staff-effective-20261019。
- 不改角色联合、祖先、旧拒绝门槛、范围与保存规则；不自动提交/合并/推送。
- 当前门店列表基于当前草稿，与既有角色分配保存流程一致。

## Tasks
- [x] 新增 scripts/verify-permission-staff-effective.ts：合成角色/门店测试，先运行证明未实现（ERR_MODULE_NOT_FOUND），实现后通过。
- [x] 新增 center-effective-menu.ts 纯函数，递归过滤 hidden、移除空分类、保留层级顺序，选择原可访问菜单或首个页面；测试 read/edit、父拒绝、联合、无权限、搜索、不可变。
- [x] center-editor.ts 增加 effectiveOnly 可选显示模式；center-ui.ts 仅员工使用并在重新渲染时更新选中页；角色编辑保持完整目录。
- [x] 同步产品V3.31／研发V2.31／个人V2.31受影响正文、互链及同一变更编号，截图缺口就近标明。
- [x] 9项专项/回归、tsc --noEmit、git diff --check、Vite隔离输出构建通过（保留分包/大包警告）。功能预览58207、PID35444，实际目录本功能worktree。浏览器实页/截图未验收。

预览：http://127.0.0.1:58207/?preview=permission-staff-effective#/permissions/staff/e001
仅功能分支未提交预览；main端口58183不变。未提交、合并或推送。
