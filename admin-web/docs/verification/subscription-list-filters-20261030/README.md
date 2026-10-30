# 服务包与商家订阅列表字段及筛选验证

功能分支codex/subscription-list-filters-20261030；起始main@e94df384。已获取远端main，本地main包含此前已合并未推送提交。实际目录D:/Projects/new-bp-worktrees/subscription-list-filters-20261030/admin-web，功能预览5287。

服务包增加收费类型、试用政策、更新时间，价格明确计费单位；名称、发布状态、菜单/主体入口保留。提供名称、发布状态、收费类型、试用筛选。商家订阅增加门店所属品牌、剩余天数，paid统一付费开通；提供品牌/类型/服务包/状态、方式/到期/搜索，默认全部展开。

查询和Enter应用组合条件、重置立即恢复；筛选不写入业务数据。两列表会话条件独立。期限边界、历史计费单位缺失、非法时间、未生效/停用/到期、隐式继承不扩大为授权均按三份文档定义。

verify-subscription-list-filters.cjs通过查询前不生效、查询、重置、Enter、试用/收费/品牌/类型/方式/状态/到期组合、无结果、菜单预览、去重入口回归、精确7天及毫秒边界、剩余天数、1000px不撑破页面；verify-service-package-drilldown.cjs回归通过，TypeScript通过，diff检查通过。packages.png/subscriptions.png/subscriptions-narrow.png为功能实采，已核验宽屏截图。

三份需求文档V1.13，变更SUBSCRIPTION-LIST-FILTERS-20261030-86。尚未提交、合并、推送。
