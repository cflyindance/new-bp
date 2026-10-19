# 页面不可见与独立功能联动实施计划

**Goal:** 落实已确认的薪资报表等页面隐藏时功能显示不可见且禁止开启，恢复后保留原决定。

**Architecture:** 在共用编辑器区分标题核心授权与正文visibility功能行。仅隐藏页面时遮蔽正文选中状态并禁用，不改raw grants；共用UI事件再次拒绝开启。非设置页read不限制独立编辑员工或导出。

**Spec:** PERM-PAGE-ACTION-20261019-01；产品V3.23/研发与个人V2.23。

**Tech Stack:** TypeScript、现有权限目录/模板/事件。

- [x] 获取最新origin/main@a402f9c1，新建codex/permission-page-hidden-actions-20261019独立worktree。
- [x] page-policy新增页面隐藏功能门控与事件校验；editor正文辅助行显示hidden并禁用，标题仍可开启核心授权；普通action行同时受页面隐藏约束。
- [x] 新增薪资/小费专项：保存值不被遮蔽写回、read/edit后恢复、独立功能开关、角色/员工和门店隔离。
- [x] 19项相关脚本、tsc与git diff --check通过；三份文档产品V3.23/研发与个人V2.23同步，保留已知grouped-edit基线失败和实页缺口。
- [x] 独立功能预览58199/PID1020，已发送打开请求；未提交合并推送。浏览器读取受限，实页渲染与配图待补。
