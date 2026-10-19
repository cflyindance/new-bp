# 菜单下单规则其他设置分类侧栏实施计划

基线 main@5aaeee2d，分支codex/menu-order-other-categories-20261019。
用户明确要求其他设置也展示侧栏分类；沿用已确认的同源权限分类要求。

- [x] 将原下单时间间隔、命中后授权、积分菜限制4/3/2项抽成共享定义，不改变字段标题或数值契约。
- [x] 复用settings-category-layout，保留全部表单挂载、分类深链接和整行点击。
- [x] 在现有other权限页注册九个逐项设置资源，同源三分类及既有分类批量行为；新增权限点缺省拒绝，不改变原授权值。
- [x] 专项、相关回归、类型检查和实际浏览器验证分类切换及值保留。
- [x] 同步导航与权限两组三份文档，补业务/权限实页截图；不提交、合并或推送。

验证记录：tsc --noEmit、verify-menu-order-other-categories.ts、verify-settings-category-sidebar.ts、verify-recursive-navigation-interaction.mjs、git diff --check均通过。浏览器5194验证三类点击、右侧留白点击、Enter切换、auth深链接和POS间隔61切换保值（已还原60）；权限编辑器核对三类4/3/2行及父级禁用。截图位于docs/项目文档/assets/menu-order-other-categories-20261019。

功能预览目录：C:/Users/27273/.codex/worktrees/menu-order-other-categories-20261019/admin-web；分支codex/menu-order-other-categories-20261019，HEAD/起始main为5aaeee2d，未提交。main预览5192保持原样，未合并或推送。完整权限脚本既有餐位平面图保存区缺口保留。
