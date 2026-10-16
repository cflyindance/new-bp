# 订单中心入口分离实施计划

Goal: 按用户已确认方案，将折扣预设、收费预设提升为独立二级入口，规则保留设置。
Architecture: 复用既有 catalog、seq、存储及保存桶；先过滤授权条目，再生成页面视图。
Tech Stack: TypeScript / Vite。
Spec: 本次用户确认建议；ORDER-NAV-20261016-01。

- [x] 核验远端 main，基线 8e415a0c；独立 codex/orders-secondary-navigation-20261016。
- [x] navigation.ts 增加两个叶子；order-center-navigation.ts 分离列表与四组设置。
- [x] 兼容搜索链接、旧地址、预设及订阅原设置授权，复用原保存桶。
- [x] TypeScript 检查及针对性分组、路由、保存桶、权限验证。
- [x] 功能预览验收列表、弹框、设置、旧地址、跨页草稿。
- [x] 更新侧栏三份文档、原订单方案有效定义和截图。

用户于本轮明确授权提交、合并并推送；只提交本任务文件。原功能无关目录保持原状。

验证限制：全量 catalog 生成器 source 670 / catalog 462 退出 1；原 main 脚本同样失败。新路由模板已同步，其他生成差异未纳入。
