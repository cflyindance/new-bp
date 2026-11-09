# 订阅缓存配额导致导航中断修复计划

变更编号SUBSCRIPTION-READ-QUOTA-20261109-01，基线main@19cd7ea4，分支codex/subscription-quota-nav-20261109。

根因confirmed：Chrome真实主线页面点击前厅管理中心无变化；QuotaExceededError从subscription-service-store读取时自动写入冒泡至serviceEntitlementData、hasCommercialRoute和导航guard。旧try/catch把迁移写入失败当作读取失败，再seed重写，导致第二次错误逃逸。

边界：只改readSubscriptionServiceSnapshot及私有自动缓存助手；writeSubscriptionServiceSnapshot仍严格持久化，失败不通知、不返回成功。读到有效旧数据时，在深拷贝上迁移；迁移持久化失败回原数据，不返回新增demo权限。未初始化时正常seed仅作读取会话使用，缓存quota失败提示警告。读失败／JSON损坏／非法schema不seed、不覆写。只捕获明确配额错误；其他异常传播。

- [x] 写scripts/verify-subscription-read-quota.cjs并保留RED：当前代码QuotaExceededError逃逸。
- [x] 修改读取链路与私有助手，禁止有效数据的失败迁移回落seed，配额警告每页一次。
- [x] GREEN：正常读写、缓存满、初始空缓存、损坏／拒绝读取、禁用权益、显式保存失败及事件次数。
- [x] 运行原有服务订阅／权益回归、TypeScript检查。
- [x] 在独立5304端口运行原生E2E，注入此缓存写失败并验证前厅父子导航、受保护页面仍校验、显式写入抛错。
- [x] 核对三份产品文档，不改已确认业务定义，仅互链修复验证记录；保存截图和BugResult。

Build: skipped。未改依赖、入口、动态导入、构建脚本、生产专属分支或静态资源边界。CI Build: unknown，不以存在CI配置冒充构建验收。
回滚：获授权后通过Git回退本次限定源码，不清理用户localStorage、不扩大订阅或角色。
