# 业务对象统一授权 Implementation Plan

> **For agentic workers:** 按用户已确认方案在当前隔离检出内联实施；不自动提交或推送。步骤使用复选框。

**Goal:** 同对象内容和编辑/对应保存合成一个不可见/可见不可编辑/可编辑授权字段；特殊操作独立。

**Architecture:** 新建 center-authorization.ts 明确绑定可见内容键与同对象编辑/保存键，复用原稳定资源和父级/依赖计算。共享 UI 聚合选中状态及原子草稿更新，不迁移扩大旧授权；部分旧配置或员工混合覆盖显示需复核且原值保持。导出/发布等未纳入组合，字段及只读内容保持两态。

**Tech Stack:** TypeScript、Node assert、Vite、agent-browser；沿用现有简洁后台样式。

**Spec:** 用户确认“对象三态合并、特殊操作独立”，PERM-20261014-07；产品 V3.3、研发/个人 V2.3。

## Global Constraints

- 当前仅本地配置与示例预览，不接管生产路由/DOM/API，不执行真实业务或发信。
- 上级关闭阻断但保留原始下级值；同级、对象、门店互不联动。
- 不可见=content hidden+编辑/保存 hidden；只读=content read+编辑/保存 hidden；可编辑=content read+全部编辑/保存 edit。
- 旧组合键、内容键及存储结构不变；只有明确点击三态才联动写入；混合旧值保持并提示需复核，不自动补允许。
- 设置三态和敏感字段可见性保留；独立导出/发布/发放等仅受原父链和内容依赖。
- 不采用同页面统一可编辑，不把区域/桌台或员工/岗位混成一项。

## Task 1: 统一对象授权模型和交互

**Files:** 新建 src/permissions/center-authorization.ts、scripts/verify-permission-authorization.ts；修改 center-editor.ts、center-ui.ts。

**Interfaces:** authorizationRows(catalog,page): AuthorizationRow[]；authorizationSelection(row,own): Access|'inherit'|'mixed'；applyAuthorization(target,row,value):void。每个对象保留 contentKey 与 editKeys，名称来自实际编辑对象、help 列真实组合及对应保存。

- [x] RED：员工页面无重复员工内容/编辑员工/保存行，只有员工管理三态；岗位独立；字段无假编辑状态。
- [x] 登记全部29组以及薪资身份编辑，保存仅明确同对象（员工、班次、声明）；模型校验键存在、对象/页面一致、无重复编辑归属。
- [x] 三态更新只改映射键；跟随角色删除映射键；混合值不写、不选可编辑；错误输入更新前校验，原对象不变。
- [x] 单授权表混排对象三态、只读内容/字段两态和独立特殊动作；问号说明实际能力；预览每行合并样例/状态/已允许编辑入口，隐藏无权项，不重复原动作。
- [x] 点击事件处理三态/继承，复用滚动恢复、dirty、保存/冲突/取消；三态联动及继承/门店由回归验证，员工逐店浏览器状态仍待补。

## Task 2: 回归、浏览器和文档

- [x] 原脚本仅更新UI变化断言，保留领域原权限含义；八个权限脚本及 tsc 通过。
- [x] 独立 Vite build --outDir .cache/permission-unified-build-20261014（553模块、既有警告）；不覆盖 dist 或 eMenu。
- [x] 重启仅监听58183的当前隔离Vite；独立无成员角色查看/编辑/隐藏、旧混合提示、问号、独立操作、保存刷新、父级恢复、Esc和键盘区域滚动，六张新图均检查；未调用真实业务。
- [x] 三份权威文档同步PERM07、产品V3.3/研发个人V2.3、配对/当前定义及历史图标记；逐元素说明及六张实页图，本地链接有效、git diff --check通过。
- [x] 自检对象授权映射/不扩权/异常保留/原只读字段和特殊动作；交付说明当前边界、不自动提交。
