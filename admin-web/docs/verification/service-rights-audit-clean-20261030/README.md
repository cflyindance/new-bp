# 服务变更记录清晰化验证

基线main@030e69cf，已fetch确认本地main包含此前已合并未推送提交；分支codex/service-rights-audit-clean-20261030。实际目录D:/Projects/new-bp-worktrees/service-rights-audit-clean-20261030/admin-web，功能预览5291。

移除顶部规则说明与折叠入口，保留成交价、服务标准价及操作时必要提示。服务变更记录由长段文字改为时间/服务/操作/变更内容/操作人/详情表格，事件倒序，首次20条并可显示更多，不再静默只展示最近20条。原ISO时间按设备本地年月日时分展示。演示事件标演示预设；旧文本缺失快照明确未记录，不取当前权益冒充历史。

新create/extend/disable审计在同次snapshot提交可选entitlementChange对象，保存事件服务名称、方式、范围、起止、成交金额与币种、依据及原因；修改前捕获旧结束时刻，续期展示原到期→新到期。保留原detail及既有事件，旧schema兼容，不自动迁移旧日志，不改变收费、授权、试用或权益校验。

通过：
- verify-service-rights-audit-clean.cjs：顶部说明移除、表格/本地时间/演示识别、旧字段缺失说明、连续A→B→C续期前后快照不覆盖、停用原因、只读更多20→32条、空/未知事件、含分隔符服务名及HTML转义。
- verify-brand-rights-overview.cjs：服务分组、当前/历史、范围并集、菜单/门店弹框、筛选、只读及取消无写入。
- verify-subscription-brand-rights.cjs：独立全屏/返回/只读无品牌权限/深链接与无写入。
- verify-service-entitlements.cjs：创建发布、免费/试用/精确到期、保留数据、一次试用、外部合同快照、指定门店/跨品牌拒绝、只读存储保护。
- TypeScript及diff检查通过。

audit.png、legacy-detail.png为默认演示数据实采；new-audit.png、new-detail.png为本地测试续期两次再停用的真实操作结果截图，并非生产数据。已视觉核验。

三份文档V1.17，SERVICE-RIGHTS-AUDIT-CLEAN-20261030-90。尚未提交、合并、推送。
