# 子导航页面三态 Implementation Plan

**Goal:** 子页面列表直接三态授权，移除配置权限按钮；目录保留二态。
**Architecture:** 新增同一页面状态读写适配器，优先复用主对象或设置页上限；无现有三态的页面补充默认不改变旧结果的上限，父列表和标题共用求值。角色只读/员工/预览无写入控件。
**Tech Stack:** TypeScript、tsx/assert、Vite。
**Spec:** 已确认三态列表方案；PERM-SUBMENU-THREE-STATE-20261019-01。

## Constraints
- 独立codex/permission-submenu-three-state-20261019，main@6a868db6。
- 不提交/合并/推送；保留上级/旧拒绝、兄弟隔离、局部更严格配置及既有独立特殊功能。
- 新增目录资源默认不写历史存储、不自动增授动作；旧显示二态规则标为历史。

## Tasks
- [x] PERM-PARENT-HEADER-20261019-01补充：父级标题二态复用左侧control，67个父级标题RED/GREEN验证，readonly/preview只显示状态；三份文档升至V3.35/V2.35。
- [x] 新专项先RED（模块缺失）再GREEN：211页面三态与标题逐页一致、局部上限、目录二态、无配置按钮、只读隔离、旧权限不扩张。
- [x] page-mode适配器注册补充上限，读写复用已有pagePolicy/settingPageGate；父列表与页面标题同步状态；保留历史独立个人授权的中性上限计算。
- [x] 同步产品V3.34、研发V2.34、个人V2.34，旧子页面二态方案标为历史，截图缺口就近标明。
- [x] 14项权限专项/回归、tsc、diff及Vite隔离构建通过；58210独立功能预览PID7388，浏览器实页/截图未验收，未提交/合并/推送。

预览目录：本独立功能worktree的admin-web；URL：http://127.0.0.1:58210/?preview=permission-submenu-three-state#/permissions/roles/edit/store-manager
主线58183未改动，基线main@6a868db6。构建仅输出.cache/submenu-three-state-build，保留原有分包及大包警告。
