# 服务商员工商户访问授权实施计划

> 执行方式：顺序实施并逐项验证；不自动提交、合并或推送。

**Goal:** 服务商员工按目标品牌／门店绑定角色进入后台，菜单与操作受到商户上限和商业权益共同限制。
**Architecture:** 独立领域模型和存储；M 平台授权 UI；代管身份适配现有商家权限运行时；统一对象范围检查。
**Tech Stack:** TypeScript、Vite、原生 DOM、现有本地持久化与权限编辑器。
**Spec:** ../specs/2026-11-02-provider-merchant-access-design.md
**基线:** ecc540bf；分支 codex/provider-merchant-access-20261102。

## 全局约束
- 数据仅为现有原型本地授权，不提供生产服务端安全保证。
- 角色与范围一起匹配；普通员工默认拒绝；不模拟品牌 Admin。
- 独立存储，不覆盖品牌内部账号；损坏存储拒绝且保留原值。
- 权限变更重新鉴权；草稿不自动保存；三份文档同步 V1.6。
- 外部浏览器验收，交付预览链接显示实际端口。

## 顺序任务

- [x] 1. 领域模型：新增 provider-access-domain.ts；导出 ProviderAccessState、ProviderScope、providerCanTarget、providerRoleAccess。测试同店不同角色、跨店不串权、未知资源、空绑定和品牌范围。
- [x] 2. 持久化：新增 provider-access-store.ts 与惰性 runtime 接口，currentMAccount 映射、初始系统身份、revision、审计和管理动作。测试并发、停用、损坏存储、授权上限及保存失败。
- [x] 3. 管理 UI：新增 provider-access-ui.ts 和独立样式；商家后台访问角色、角色编辑复用 renderPermissionEditor；员工行配置范围与访问角色。管理操作使用独立 M 资源；取消保留现有未保存确认。
- [x] 4. 对象隔离：M runtime 检查详情路径和动作；商户列表、分析、订阅、设备使用统一目标授权投影；后台写入再次校验目标。
- [x] 5. 代管接入：enterprise-merchant-impersonate 保留真实员工 ID，brand-access-store 通过委托身份构造独立权限上下文；统一使用菜单和操作计算及撤权检查。
- [x] 6. 验证：纯领域测试与 TypeScript；既有 M 权限、商家菜单回归；浏览器内验证代登录和订阅对象范围；外部浏览器双员工双门店及撤权、直接地址验证。
- [x] 7. 文档：三份既有文档同步 V1.6、共同编号 M-MERCHANT-ACCESS-20261102-01；页面实采图；独立交付缺口清单和验证记录。

## 核心断言
`providerCanTarget(state, staff, {brandId:'b', storeId:'s1'})` 只看匹配绑定；`providerRoleAccess(...,'page:/orders/all',...)` 不允许把 s2 角色用于 s1。
保存使用 `expectedRevision === current.revision`，写入成功才发出授权变更事件；错误不产生假审计。
代管进入函数再次检查 M 进入动作与目标；任何校验失败均不写会话。
