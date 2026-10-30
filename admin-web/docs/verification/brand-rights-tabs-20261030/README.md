# 品牌服务权益顶部页签验证

基线main@8544da49，已fetch核验本地main包含此前已合并未推送提交。分支codex/brand-rights-tabs-20261030；实际目录D:/Projects/new-bp-worktrees/brand-rights-tabs-20261030/admin-web；功能预览5292。

顶部服务权益/变更记录（总条数）两个页签，默认服务权益，无底部重复入口或记录外层折叠；页签在内容滚动区顶部保持可见。服务与记录筛选独立；记录支持事件服务名、操作类型、本地起止日期（含结束当天）、重置、空状态、非法日期提示及每20条显示更多。页签选择/筛选/已加载行及滚动位置按品牌在本次页面会话保留，整页刷新恢复默认。路由、实际授权和审计写入契约不变。

通过：verify-brand-rights-tabs.cjs验证两种页面、默认/键盘切换、独立筛选、滚动恢复、日期边界/非法范围、重置/无结果、只读筛选和更多、刷新默认及浏览不写入；verify-service-rights-audit-clean.cjs验证原审计内容和旧文本兼容、连续续期快照不变、停用原因、转义与只读更多；verify-subscription-brand-rights.cjs验证全屏/返回位置、只读无品牌权限和深链接；TypeScript及diff检查通过。

新页签仅增加具体只读浏览控件允许清单，开通/续期/停用仍按原操作权限拦截。旧审计回归调整为使用页签进入记录，详情用键盘打开，避免演示切换悬浮工具遮挡点击位置。

services.png、audit.png、expanded.png、management.png、narrow.png及legacy-detail.png/new-audit.png/new-detail.png均为5292实采；后3张包含本地测试续期/停用场景，不代表生产数据。已视觉核验两个页签。

三份文档V1.18，BRAND-RIGHTS-TABS-20261030-91。尚未提交、合并、推送。
