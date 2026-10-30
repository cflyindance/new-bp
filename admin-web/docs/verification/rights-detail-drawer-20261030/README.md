# 权益明细右侧抽屉验证

基线main@aa0090e6；已fetch确认本地main包含此前已合并未推送提交。分支codex/rights-detail-drawer-20261030，实际目录D:/Projects/new-bp-worktrees/rights-detail-drawer-20261030/admin-web，功能预览5293。

权益明细按钮替代展开明细，在右侧原生dialog抽屉展示；标题/状态、说明与标准价、当前权益、历史权益（首次折叠）、具体记录操作独立呈现。桌面1100px/92vw较小值，≤900px满幅，正文独立滚动，头尾关闭可见。列表不撑长，关闭保留筛选、页签、位置和焦点。名称仍查看菜单。

复用已有记录节点及事件处理，仍绑定具体记录和原权限/存储校验；取消确认保留抽屉，提交刷新后清理旧抽屉，重开读取新记录。路由变化或源页面被移除会清理抽屉及其门店/确认子弹框。未改变价格、权益授权、试用、审计或记录来源。

通过：
- verify-rights-detail-drawer.cjs：右侧/满高几何、窄屏满幅、当前/历史、门店及确认子弹框、只读无写入控件、Escape/关闭/焦点/筛选保留、独立滚动、停用提交刷新、路由及源页面移除清理。
- verify-brand-rights-overview.cjs：汇总与范围并集、记录和菜单/门店、取消无写入。
- verify-brand-rights-tabs.cjs：页签、各自筛选及滚动、日期、只读更多和重置。
- verify-service-entitlements.cjs：创建发布、免费、试用、精确到期、保留数据、成交快照、指定门店/跨品牌拒绝及只读存储保护。
- verify-service-entitlement-demo.cjs与verify-subscription-brand-rights.cjs：全部演示记录、无写入、只读全屏及返回/菜单。
- TypeScript及git diff --check通过。

list.png/drawer.png/history.png/narrow.png/management.png/renew.png/confirm.png为5293实采，管理页确认及提交为本地测试数据，不代表生产操作。已视觉核验。

三份文档V1.19，RIGHTS-DETAIL-DRAWER-20261030-92。尚未提交、合并、推送。
