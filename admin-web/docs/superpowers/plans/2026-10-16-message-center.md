# 消息中心实施计划

基线 origin/main 18b4112f；分支 codex/message-center-hierarchy-20261016。
设计依据：用户三张截图。复用公共滑层与既有业务，先过滤能力再生成展示父组。

- [x] 独立检出保留原工作区。
- [x] navigation.ts 注册三个叶子及品牌／门店展示分组。
- [x] platform-preset-nav-filter.ts 在既有过滤后分组。
- [x] notifications-hub-pages.ts 为缺失业务显示待配置。
- [x] 同步三份导航文档与用户参考图。
- [x] TypeScript、递归导航、筛选边界和浏览器验收。

用户于后续指令授权提交、合并到 main 并推送；整合最新库存导航变更，三份文档版本更新为产品 V2.5 / 研发 V2.4 / 个人 V2.4。
