# 员工生效权限抽屉精简 Implementation Plan

**Goal:** 删除用户截图中指定的两段说明与抽屉查看菜单效果按钮。

**Architecture:** 只改showStaffEffective和对应专项测试，保留只读编辑器、当前生效角色、门店选择、空态及原权限求值/保存。其他角色页面预览保持不变。

**Tech Stack:** TypeScript、原生DOM、Vite、tsx。

**Spec:** 权限三份权威文档中的PERM-STAFF-EFFECTIVE-CLEAN-20261019-01，用户已明确要求删除，无新增交互决策。

## Global Constraints

- 起始main@2128e5e7；独立codex/permission-effective-clean-20261019。
- 只删除指定抽屉内容；不删除员工标题、当前生效角色、菜单内权限说明、角色页面预览。
- 不改角色、绑定、算法、草稿、持久化或审计；未授权提交/合并/推送。

## Steps

追加用户确认PERM-STAFF-BACKDROP-20261019-01：只在员工生效权限只读抽屉接入bindDialogBackdropClose，主指针按下和点击均在dialog矩形外才close，内部/拖动/取消/右键不关；沿用原close恢复焦点/保留草稿。新verify-permission-drawer-backdrop.ts事件单元测试已覆盖外侧/内部/子控件/双向拖动/取消/右键/边界/无pointerdown及唯一接入范围；三份文档升V3.41/V2.41。

执行记录：新专项先因data-effective-preview仍存在失败；实现后6项专项及相关回归、TypeScript、diff检查、Vite隔离构建通过。构建仅有原动态/静态导入及包体提示。预览58213，独立分支未提交；浏览器交互及新截图未验收，不以服务启动代替。

- [ ] 修改verify-permission-staff-effective-drawer.ts，断言抽屉无配置来源说明/各角色单独权限/菜单效果入口，保持只读导航和空态；先运行确认失败。
- [ ] showStaffEffective移除menuPreview、labels、modes、两段模板和按钮事件；renderPermissionEditor固定preview:false，删除不再使用的pageMode导入和贡献说明样式。
- [ ] 三份文档更新产品V3.40/研发V2.40/个人V2.40，替换对应有效元素；新图待补。
- [ ] 运行抽屉/员工范围/员工生效/角色查看/授权回归、tsc、diff检查、隔离构建。
- [ ] 启动新功能预览58213并核对服务来源；明确实页验证缺口，不覆盖旧功能或main服务。
