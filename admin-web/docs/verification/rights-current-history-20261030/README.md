# 当前权益与历史权益分离验证

基线 main@73a57c94；功能分支 codex/rights-current-history-20261030；预览5295；2026-10-30。

当前权益主列表、历史专用抽屉、独立依据弹框实采见本目录图片。

验证：node scripts/verify-rights-current-history.cjs。覆盖当前成交价、只读无写入、历史不重复当前、零历史隐藏入口、门店筛选、菜单预览、依据弹框返回、续期取消。

历史脚本 verify-rights-detail-drawer.cjs、verify-brand-rights-overview.cjs、verify-service-entitlement-demo.cjs包含旧交互断言，不作为本版UI验收入口。授权和存储规则由verify-service-entitlements.cjs回归。

补充通过：多条当前记录合并名称、门店筛选后入口随首条可见记录移动、单条停用后转历史；verify-service-entitlements.cjs、verify-brand-rights-tabs.cjs、verify-subscription-brand-rights.cjs及TypeScript检查通过。
