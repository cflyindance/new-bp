# 品牌服务权益分组改版验证

基线main@ac6ac061（已fetch核验，本地包含上一任务已合并未推送提交）；分支codex/brand-rights-overview-20261030。实际目录D:/Projects/new-bp-worktrees/brand-rights-overview-20261030/admin-web，功能预览5290。

按服务汇总替代上下重复表格；名称点击菜单，范围点击门店，展开当前/待生效记录，历史默认折叠。标准价格与依据收进明细，状态/方式/范围/价格分离；标题用公开BID，规则收起。保留记录级续期/停用、商业开通动作和服务变更记录，筛选与展开状态按品牌在当前会话保留。不改变实际服务授权、收费、存储或试用资格。

只读访问只放行具体展开、筛选、门店预览控件；未放行开通/续期/停用。数据缺失/异常/服务移除保留历史记录和明确状态；指定门店不扩大为全品牌权益，多记录不合成统一有效期。金额复用真实成交快照，不补默认0或计费单位。

验证通过：
- verify-brand-rights-overview.cjs：当前/历史7条保留，摘要范围准确、展开/折叠、历史、菜单/门店弹框、三项筛选与空结果，只读动作隐藏，管理页单记录续期/停用取消不写入，多条指定门店并集仍为部分可用，窄屏无页面横向溢出。
- verify-subscription-brand-rights.cjs：独立全屏、深链接/刷新、返回/滚动恢复、只读且无品牌管理权限可浏览，缺失品牌，无写入。
- verify-service-entitlement-demo.cjs：全部演示记录状态、刷新不改数据、菜单预览。
- verify-service-entitlements.cjs：创建/发布、免费/试用/精确到期、保留数据、一次试用、外部合同成交快照、指定门店/跨品牌拒绝、只读存储保护。
- TypeScript与git diff --check通过。首次冷启动出现已有循环依赖的初始化顺序问题，新增视图导入移至既有业务依赖之后，重新冷加载及上述回归通过。

overview.png、expanded.png、history.png、stores.png、management.png、menu.png、narrow.png为5290功能实采，主汇总及展开视觉核验通过。三份文档V1.16，同变更BRAND-RIGHTS-OVERVIEW-20261030-89。

尚未提交、合并、推送。
