# 服务包生命周期验证

基线main@3befcc51；分支codex/service-package-lifecycle-20261030；端口5297；2026-10-30。

- verify-service-package-lifecycle.cjs通过：上下架、已有权益保留、暂停与恢复、原因校验、无使用草稿删除、历史引用阻止删除、商业计费口径锁定、快照冲突、发布保留停用状态及只读存储防护。
- 页面实采：list、basic、off、on、disable、restore、delete、publish。
- 三份文档V1.23，共同变更编号SERVICE-PACKAGE-LIFECYCLE-20261030-96。
- 当前为本地浏览器存储演示；并发快照检查不替代生产后端事务、外部合同或支付系统。

原有verify-service-entitlements.cjs与verify-service-detail-layout.cjs均通过；TypeScript及git diff --check通过。补充标准订阅来源验证：下架保留路由、停用移除该来源、恢复后重新提供原有效来源。
