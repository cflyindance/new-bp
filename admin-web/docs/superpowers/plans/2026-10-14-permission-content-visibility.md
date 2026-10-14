# 内容可见与操作隐藏 Implementation Plan

> **For agentic workers:** Execute inline under the approved granularity design; steps use checkboxes.

**Goal:** 区分导航/页面、内容/字段、操作与设置，预览隐藏无权按钮与内容而非禁用。

**Architecture:** 新增 content/field 资源及 requires 依赖，复用角色/门店计算、保存、编辑/预览。内容目录从已确认的 29 个业务对象组合建立可见点，并显式补薪资身份、明细、ADP/SSN/金额字段。源对象控制点只是配置依据，不等同于真实业务 DOM/服务鉴权接入。

**Tech Stack:** TypeScript、Vite、Node assert、agent-browser。

**Spec:** 用户已确认上一轮导航→页面→内容→操作→设置颗粒度；三份文档同步 PERM-20261014-06。

## Constraints

- 任意祖先关闭阻断，下级值保留；同级及不同门店不联动。
- 操作禁止时效果预览不出现名称/按钮；管理编辑界面仍展示全部配置。
- 设置 hidden/read/edit 保留；只读不显示编辑入口；新内容/字段缺失默认 hidden，不迁移扩大允许。
- 内容隐藏阻断关联动作；敏感导出/打印须有对应内容及字段可见，当前仍为本地模拟。
- 不接管真实业务路由/DOM/API、导出过滤或邀请；不自动提交、推送。

## Steps

- [x] verify-permission-visibility.ts 先 RED：禁止 PDF 行完全不出现；覆盖内容字段门控、依赖、设置三态、静态页、旧值保留/门店/保存。
- [x] center-visibility.ts 内容登记及明确依赖；center-domain.ts Resource 加 content/field/previewValue/requires，seen 分支独立，所有依赖需可见；catalog 接入并校验来源/依赖。
- [x] center-editor.ts 内容区域与敏感字段两态、完整配置/过滤预览、关联内容禁用原因；原设置分类独立滚动保留，无可见设置仍允许页面显示空状态。
- [x] 更新旧脚本中“禁用按钮”的预览断言和需要新增内容授权的测试数据；七个权限脚本、tsc、独立 Vite build（552 模块）通过。
- [x] 三份产品 V3.2、研发/个人 V2.2 同步新定义/范围/算例/来源/未接入边界，标历史图中的灰按钮已过期；全部本地文档链接有效。
- [x] scoped Vite 重启，独立无成员角色实测 SSN/PDF 隐藏恢复、身份区域门控、只读设置、保存刷新及 Esc；门店隔离由领域回归验证，员工逐店实页仍待补。三张真实截图已检查，文档完成只读复核。

## Self-review

纯查看页不添加空泛操作。内容/字段本轮为可见层，编辑仍由操作/设置决定；不能绕过依赖或把新内容自动授予旧角色。保留 CRUD 合并的用户取舍。
