# 收费服务菜单预览验证

变更SERVICE-MENU-PREVIEW-20261029-68；基线main@05b0d0019dca61342039e26a4fdaccd753d08ace。

功能分支codex/service-menu-inspect-20261029；目录D:/Projects/new-bp-worktrees/service-menu-inspect-20261029/admin-web；端口5266。属于未提交功能预览，不是main。

实现：收费服务增加查看菜单，读取当前已发布服务版本；仅展示绑定ID及结构祖先，不展示草稿、未绑定兄弟或子节点。支持搜索、目录折叠、只读用户、关闭/Escape/遮罩和路由切换清理。未发布、目录缺失节点与无搜索结果明确提示。无授权/权益/审计写入。

验证：tsc --noEmit、verify-service-menu-preview.cjs、verify-m-platform-permissions.ts。浏览器使用隔离上下文，发布版配置短信营销而草稿配置会员列表；断言仅发布版菜单及祖先可见、无可编辑勾选、搜索无结果提示、Escape和关闭有效、只读用户可查看、切换路由清理、前后服务存储一致；无pageerror。已目视核对截图。

配套：服务与订阅三文档V1.1；商户管理产品V1.65、研发与个人规范V1.64，同一变更编号。

当前预览反映当前发布版本，不是合同历史版本，也不是某品牌最终可用菜单。沿用现有本地存储原型边界。用户已授权本地提交与合并，提交以Git历史为准；尚未授权推送或部署。
