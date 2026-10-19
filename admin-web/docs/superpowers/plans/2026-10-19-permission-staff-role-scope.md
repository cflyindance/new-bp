# 员工角色与门店授权 Implementation Plan

> **For agentic workers:** Inline execution in the current session; no Git delivery without user authorization.

**Goal:** 在员工视角区分角色授权范围与门店最终权限。

**Architecture:** 新建纯 helper 处理范围展示、绑定范围更新和适用角色；center-ui 复用只读权限编辑器和原草稿持久化，不修改求值器。

**Tech Stack:** TypeScript、原生 DOM、Vite、tsx。

**Spec:** ../specs/2026-10-19-permission-staff-role-scope-design.md

## 执行记录

抽屉续作验证：规格复核Approved；11项专项/相关回归、TypeScript、git diff --check及隔离构建通过。远端重新fetch后HEAD与origin/main仍同为eb4dff28（0/0），在原未提交功能分支续作，无rebase/合并/提交/推送。端口58212服务PID4484的命令行确认来源本功能目录。抽屉浏览器实页及截图仍待补，入口打开不等于验收。

2026-10-19：规格审查Approved。代码及三份权威文档已更新；新专项先因模块缺失失败，随后通过。10项脚本（staff-role-scope、staff-effective、staff-role-only、role-view、assign-confirm-label、no-overview、authorization、navigation、submenu-three-state、setting-levels）、TypeScript、diff检查、Vite隔离构建通过。构建存在既有动态/静态导入及包体警告，无构建错误。功能分支codex/permission-staff-role-scope-20261019，HEAD/起始main=eb4dff28，改动未提交；实际目录为admin-web/.cache/permission-staff-role-scope-20261019/admin-web，端口58212。

浏览器实页交互和新截图未验证；只打开预览入口，不把服务启动或登录页当验收。保留图片缺口；不修改原有用户草稿或以注入演示数据绕过登录。

## Global Constraints

后续确认PERM-STAFF-EFFECTIVE-DRAWER-20261019-01：继续当前未提交功能分支；将常驻生效权限改为按需只读抽屉。

- [ ] 新增verify-permission-staff-effective-drawer.ts，验证常驻区域移除、次要入口、抽屉局部事件、空态区分、无mark/save及样式。
- [ ] center-staff-roles.ts角色表工具栏增加查看员工生效权限；center-ui.staffDetail只保留角色表；新增showStaffEffective维护抽屉内菜单/分类/搜索/预览，切店不render角色表，不写草稿。
- [ ] center.css加入右侧全高dialog布局，抽屉body弹性高度、窄屏全宽、关闭返回焦点；表单角色弹层维持原样。
- [ ] 三份文档升产品V3.39/研发V2.39/个人V2.39，替换常驻布局有效定义；回归员工/角色/范围/草稿及构建。

- 基线 main@eb4dff28；独立 codex/permission-staff-role-scope-20261019。
- 保留 stores/brands/regions、失效引用及所有无关绑定；无读操作写入。
- 保存员工详情后生效，不新增接口或授权。

### Task 1: 范围与列表 helper

- [ ] 新建 src/permissions/center-staff-roles.ts：renderStaffRoles(employee, roles, stores)、bindingStores(scope, stores)、updateBindingScope(employee, bindingId, scope)、applicableRoles(employee, roles, store)。输入输出通过命名导出测试。
- [ ] 新建 scripts/verify-permission-staff-role-scope.ts，覆盖跨店列表、门店名称、长列表、动态未来门店、孤立引用、更新范围无变化及空值拒绝。
- [ ] 运行专项测试；先红后绿。

### Task 2: 页面交互

- [x] center-ui.ts接入全部角色表；原下部常驻区域已被PERM-STAFF-EFFECTIVE-DRAWER-20261019-01替代，当前仅通过只读抽屉承载门店选择和权限提示。
- [ ] 只读角色权限弹层复用 renderPermissionEditor，局部维护 page/group/search，不改员工草稿或全屏路由。
- [ ] 修改范围和解除角色使用明确确认文案；搜索隐藏项不丢已选范围；未知旧范围保持可见，不静默清理。
- [ ] center.css 增加表格范围名单/门店编号/权限提示样式，沿用现有视觉体系。

### Task 3: 文档与回归

- [x] 前次执行已同步产品V3.38、研发V2.38、个人V2.38；本次抽屉调整以V3.39/V2.39为准，图片缺口就近说明。
- [ ] 运行新专项及 staff-effective/staff-role-only/role-view/assign-confirm-label/no-overview/authorization/navigation，tsc --noEmit、git diff --check、Vite隔离构建。
- [ ] 新端口58212功能预览；明确实页验证结果和未提交状态。
