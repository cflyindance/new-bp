# 服务商员工商户访问授权交付记录

变更编号：M-MERCHANT-ACCESS-20261102-01；基线 main@ecc540bf。
分支：codex/provider-merchant-access-20261102。功能验收预览端口：5301。Git 提交、合并和推送状态以交付回执为准。

## 验证
- TypeScript 检查。
- verify-provider-access.ts：同店不同角色、跨店绑定隔离、品牌范围、空授权、未知资源和失效角色。
- 既有 verify-m-platform-permissions.ts 与 verify-brand-menu-access.ts。
- verify-provider-access-browser.cjs：管理入口、范围弹框、角色编辑与目标预览、保存确认、同店不同菜单、跨店角色、直达拒绝、禁止门店授权提升为品牌、真实员工会话、跨窗口撤权、过期 revision、只读函数校验、存储失败和损坏数据拒绝。
- 浏览器测试在独立 Edge 上下文内初始化演示门店菜单，不修改用户浏览器配置或数据。截图位于 ../../项目文档/assets/provider-merchant-access-20261102/，执行记录 verification.json。
- 未运行生产构建及 CI；未修改 vendor/emenu-new，无需重建 eMenu 嵌入包。

## 明确交付缺口
1. 生产账号认证、接口层菜单／目标权限、跨服务商后端数据隔离和令牌撤销需要接入服务端；本地存储可被浏览器用户修改。
2. 浏览器本地 revision 比较是乐观冲突检测，不提供服务端事务锁。
3. 品牌 Admin 专属管理动作仍沿用原有限制；普通委托角色不因可见业务菜单自动获得品牌 Admin 身份。
4. 当前 M 平台商户访问管理与权限计算已接入；不宣称每个嵌入子系统均具备生产接口鉴权，嵌入子包接口需随服务端统一收口。

## 文档
三份既有 M 平台内部权限文档同步 V1.6、共同基线与变更编号；个人规范版逐页面配图。设计和计划文件为开发依据，不另建产品权威。
