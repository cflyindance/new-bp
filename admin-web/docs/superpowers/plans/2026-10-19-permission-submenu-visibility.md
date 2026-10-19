# 子导航查看权限快捷开关 Implementation Plan

**Goal:** 父目录列表直接切换子菜单不可见/可见，保留配置权限钻取入口。
**Architecture:** 共用子导航行渲染控件，事件调用原roleAccess求值和同一grant集合；隐藏保留页面内容，开启恢复配置或基本只读，不新建第二套权限字段。
**Tech Stack:** TypeScript、tsx/assert、Vite。
**Spec:** 用户确认的父目录子导航直接切换方案，PERM-SUBMENU-VISIBILITY-20261019-01。

## Constraints
- 基线main@4b926b1a，新分支codex/permission-submenu-visibility-20261019。
- 不搬运未提交的角色只读详情分支；只读/员工/预览不显示开关。
- 不自动打开祖先或兄弟页面，不新增edit/action授权。草稿保存与取消不变。
- 同步产品V3.33/研发V2.33/个人V2.33；V3.32/V2.32属于另一未合并功能，未视为本分支内容。

## Tasks
- [x] 新增verify-permission-submenu-visibility.ts，先RED（模块缺失）再GREEN，验证员工/岗位开关、页面状态联动、只读初始化、恢复、祖先拒绝、兄弟隔离和失败原子性；真实211个页面首次开启均成功且无新增edit。
- [x] 新增center-submenu-visibility.ts事务式更新纯函数；center-editor.ts统一列表控件；center-ui.ts专用事件和只读保护。
- [x] 同步三份权威文档有效正文、版本及截图缺口。
- [x] 12项权限专项/回归、tsc、diff、Vite隔离构建通过（分包与大包警告保留），58209功能预览PID44180；浏览器实页交互和截图未验收。不提交/合并/推送。

预览目录：本独立功能worktree的admin-web；URL：http://127.0.0.1:58209/?preview=permission-submenu-visibility#/permissions/roles/edit/store-manager
main58183未更新，上一角色只读详情功能仍在另一个独立分支。
