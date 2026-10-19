# 设置类三级权限实施计划

**Goal:** 落实已确认的页面→分类→设置项上限，不覆盖下级配置。

**Architecture:** 独立setting类型上限资源，默认edit仅表示不额外限制，既有页面与设置项仍默认拒绝。沿用角色/门店个人例外及持久化。

**Spec:** PERM-SETTING-20261019-01；产品V3.17/研发与个人V2.17。

**Tech Stack:** TypeScript、既有权限目录/解析器/模板。

- [x] 从最新origin/main@29accf74创建独立codex/permission-setting-levels-20261019。
- [x] 新增center-setting-levels.ts注册页面/分类上限，设置项关联上限。
- [x] center-domain.ts角色和个人计算最严格上限，保留原始值。
- [x] center-editor.ts设置页统一标题三态、分类三态、逐项三态；单项不精简侧栏；readonly禁用局部edit。
- [x] center-ui.ts事件再次拒绝越过上级的edit选择。
- [x] 14项相关脚本、tsc、git diff --check通过；更新受影响旧布局断言。未宣称全仓测试通过。
- [x] 三份权限文档同步有效正文、版本、变更号和验证缺口。
- [x] 独立预览58194/PID33408，已发出打开请求；未提交合并推送。浏览器读取受限，实页渲染与图片待补。
