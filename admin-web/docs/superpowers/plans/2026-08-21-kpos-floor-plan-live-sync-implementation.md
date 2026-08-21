# KPOS 餐位平面图真实数据同步实施计划

> 权威设计：[KPOS 餐位平面图真实数据同步设计](../specs/2026-08-21-kpos-floor-plan-live-sync-design.md)
>
> 本文件维护实施顺序、代码边界与验证门禁；业务和安全口径以权威设计为准。

## 目标

扩展现有悬浮球，使商家用户可配置 KPOS 主机、PC License 与 Admin 密码，并通过同源代理把「前厅管理中心 → 餐位平面图」的区域和桌台主数据直接读写到对应 KPOS。保留现有现代编辑器、草稿、变更摘要、保存/放弃和按时计价扩展字段。

## 实施原则

- KPOS 是区域与桌台布局的唯一事实源；不再用 `localStorage` 保存桌台主数据。
- P0 Wire fixture 门禁未通过前只实现只读链路，不对真实 KPOS 发布局写请求。
- KPOS 以 `SaveSeatingAreaType` 保存完整区域快照，不虚构独立 Table 写接口。
- 动态目标代理必须先完成认证、门店授权、CSRF、SSRF、DNS pinning、限速和日志脱敏。
- 浏览器密码只以 Web Crypto 密文存入 IndexedDB；解密明文只短暂存在连接请求内存中。
- 页面保存保留 `base/local/remote`，部分失败后执行确定性三方合并。
- `currentGuestCount` 与 `status` 是运行态字段，写前回读合并，绝不从旧布局草稿覆盖。
- v1 禁止跨区域移动现有桌台。
- 所有真实环境写入验证必须由用户明确指定测试区域。

## Task 1：建立 P0 KPOS Wire 证据与脱敏 fixtures

**新增文件**

- `scripts/kpos-floor-plan/capture-kpos-wire-fixtures.mjs`
- `scripts/kpos-floor-plan/sanitize-kpos-wire-fixture.mjs`
- `tests/fixtures/kpos-floor-plan/README.md`
- `tests/fixtures/kpos-floor-plan/*.xml`
- `scripts/verify-kpos-floor-plan-wire-fixtures.mjs`

**工作内容**

- 从参考环境可审计客户端代码和授权网络录制确认 PC License 列表、Admin 登录、SOAP Envelope、认证 Cookie/Header、`ListAreasType`、`ListTablesType` 和 `SaveSeatingAreaType`。
- 分别采集成功、认证失败、License 占用、SOAP Fault、单对象和数组响应。
- 在专用测试区域确认桌台删除与区域删除的 wire 语义；未确认的删除能力标记为 unsupported。
- fixture 生成流程必须删除密码、Cookie、sessionKey、secretKey、用户信息和环境唯一标识。
- 验证脚本检查 fixture 完整、脱敏且不含已知敏感字段。

**完成门禁**

- 只读 fixture 完整后可进入只读实现。
- 写入 fixture 和删除语义未验证前，不得启用对应真实写操作。

## Task 2：实现 Wire Driver、XML codec 与字段映射

**新增文件**

- `server/kpos-floor-plan/kpos-floor-plan-wire-driver.mjs`
- `server/kpos-floor-plan/kpos-soap-codec.mjs`
- `server/kpos-floor-plan/kpos-floor-plan-mapper.mjs`
- `scripts/verify-kpos-floor-plan-soap-codec.mjs`
- `scripts/verify-kpos-floor-plan-mapper.mjs`

**工作内容**

- 实现 `probe`、`listPcLicenses`、`login`、`listAreas`、`listTables`、`saveAreaSnapshot`。
- XML builder 默认转义文本，禁止字符串拼接注入 SOAP。
- 解析器兼容单对象/数组、字符串数字、缺失可选字段和未知枚举。
- 映射 `RECTANGLE/HIBACHI/ROUND`，未知形状保留原始值并阻止无意覆盖。
- 明确桌台尺寸、坐标、默认人数与区域画布单位的归一化规则。
- 统一 KPOS Fault 与 HTTP/协议错误，不向浏览器暴露原始认证 XML。

**验证**

- 使用 Task 1 fixtures 做 request/response golden tests。
- 覆盖 XML 特殊字符、未知枚举、非法数字、空区域和大布局。

## Task 3：实现动态目标校验与固定连接

**新增文件**

- `server/kpos-floor-plan/kpos-target-policy.mjs`
- `server/kpos-floor-plan/kpos-pinned-transport.mjs`
- `scripts/verify-kpos-target-policy.mjs`

**修改文件**

- `vite.config.ts`

**工作内容**

- 复用 `src/shell/emenu-local-host-control.ts` 的前端规范化口径，在服务端重新规范化并独立校验。
- 开发模式只允许 localhost/127.0.0.1 和配置的私网；部署模式默认拒绝代理自身 localhost。
- 支持部署配置的 RFC1918 网段、端口范围和 HTTPS 隧道后缀。
- 拒绝 link-local、云元数据、URL 用户信息、非 HTTP(S)、异常端口和任意路径代理。
- DNS 解析后校验并把 IP 固定到实际 socket；禁止或重复校验重定向。
- 设置 connect/read/body-size 超时，并生成不含敏感信息的主机指纹。

**验证**

- 覆盖 IPv4、IPv6、默认端口、主机尾点、隧道域名、DNS rebinding、重定向和元数据地址。

## Task 4：实现连接会话、授权与保护中间件

**新增文件**

- `server/kpos-floor-plan/kpos-connection-store.mjs`
- `server/kpos-floor-plan/kpos-floor-plan-api-handler.mjs`
- `server/kpos-floor-plan/kpos-rate-limit.mjs`
- `server/kpos-floor-plan/kpos-idempotency-ledger.mjs`
- `scripts/verify-kpos-floor-plan-api.mjs`

**修改文件**

- `vite.config.ts`
- 生产服务入口/中间件文件（若仓库在实施时新增正式服务入口，以实际文件为准）

**工作内容**

- 实现 `/api/kpos/connections/probe`、licenses、session、reauth 和 disconnect。
- 连接按用户、门店、规范主机和 License 隔离；业务接口只接受 connection ID。
- 接入现有商家认证与门店授权；禁止客户端伪造用户/门店。
- 写接口校验 Origin 与 CSRF Token；非开发部署强制 HTTPS。
- 探测/登录失败退避，限制每用户/主机速率、读取并发和串行写队列。
- 实现 24 小时幂等账本、请求体哈希、响应重放和 ambiguous 状态。
- reauth 返回新 connection ID 并使旧 ID 失效；写入发送后状态不确定时返回 ambiguous。
- 日志只记录脱敏连接 ID、主机指纹、操作、耗时和错误码。

**验证**

- 覆盖越权连接、跨用户 ID、CSRF、Origin、限速、并发上限、连接过期和 ID 轮换。

## Task 5：实现浏览器加密凭据仓储

**新增文件**

- `src/shell/kpos-credential-vault.ts`
- `scripts/verify-kpos-credential-vault.ts`

**工作内容**

- 使用 Web Crypto AES-GCM 与不可导出设备密钥。
- IndexedDB 记录按用户、规范主机和 License 隔离，包含算法版本、IV、密文与时间。
- 未勾选「记住密码」时删除旧记录；主机绑定删除/退出账号按规格清理。
- 密钥丢失、密文损坏、认证标签失败和算法版本不支持时删除失效记录并要求重输。
- 页面只能查询“是否已保存”，不能提供回显明文的 API。

**验证**

- 覆盖加解密、隔离、注销、损坏记录、密钥丢失、算法升级和 IndexedDB 不可用。

## Task 6：扩展悬浮球 KPOS 连接 UI

**修改文件**

- `src/shell/emenu-local-host-control-ui.ts`
- `src/shell/emenu-local-host-control.ts`
- `src/shell/demo-switch-control.ts`
- `src/i18n.ts`

**新增文件**

- `src/shell/kpos-connection-client.ts`
- `src/shell/kpos-connection-state.ts`
- `scripts/verify-kpos-host-connection-ui.ts`

**工作内容**

- 保留现有主机/端口输入，增加 PC License、Admin 密码、记住密码、连接、断开与状态。
- 主机探测成功后才加载 PC License；连接成功后发布稳定的 host/session changed 事件。
- 主机切换前检查餐位平面图 dirty 状态，有草稿时要求确认。
- 切换后清理旧会话引用并刷新 eMenu/Kiosk 嵌入页与餐位平面图。
- 状态覆盖未连接、连接中、已连接、过期、License 占用、认证失败、不可达和安全策略拒绝。
- 使用自定义确认组件，避免原生 `alert/confirm`。

**验证**

- 键盘操作、焦点、错误提示、中英文和悬浮球收起/展开不回归。

## Task 7：实现扩展字段仓储

**新增文件**

- `server/kpos-floor-plan/kpos-floor-plan-extension-store.mjs`
- `src/config/floor-plan-extension-client.ts`
- `scripts/verify-kpos-floor-plan-extension-store.mjs`

**工作内容**

- 实现扩展字段 GET/PUT/DELETE API。
- 主键包含租户、门店、完整主机指纹和 KPOS 桌台 ID，并保存规范主机身份用于碰撞校验。
- 保存 `rotation`、`durationBillingRuleId` 和 schema 版本。
- KPOS 删除后软删除扩展记录；不确定删除标记 orphan candidate。
- 通过首次见时间/创建指纹防止 KPOS ID 复用继承旧扩展。
- 扩展写入失败可以独立重试，不能重复 KPOS 创建。

**验证**

- 覆盖租户/门店越权、主机隔离、哈希碰撞校验、软删除、孤儿恢复和 ID 复用。

## Task 8：把餐位平面图拆分为异步仓储与纯编辑状态

**修改文件**

- `src/config/floor-plan-ui.ts`
- `src/main.ts`

**新增文件**

- `src/config/floor-plan-types.ts`
- `src/config/floor-plan-repository.ts`
- `src/config/floor-plan-state.ts`
- `src/config/floor-plan-fingerprint.ts`
- `scripts/verify-floor-plan-live-repository.ts`

**工作内容**

- 从当前大文件抽离领域类型、异步仓储、页面状态和指纹逻辑，保持 UI 渲染边界可理解。
- `renderFloorPlanPage` 增加未连接、加载中、加载失败、已同步和保存中状态。
- KPOS 主数据从 `GET /api/kpos/floor-plan` 加载；`localStorage` 只作为旧版迁移提示或测试夹具。
- 合并扩展字段，但保留 KPOS 原始 shape/category 以支持未知值安全回写。
- 记录 base、local、区域指纹、布局指纹和 connection ID。
- 禁止同一桌台 ID 的 areaId 改变；UI 不提供跨区域移动入口。

**验证**

- 现有区域/桌台表单、拖拽、弹窗、预设选择、变更摘要、保存/放弃行为不回归。

## Task 9：实现区域快照保存协调器

**新增文件**

- `src/config/floor-plan-save-coordinator.ts`
- `src/config/floor-plan-three-way-merge.ts`
- `scripts/verify-floor-plan-save-coordinator.ts`
- `scripts/verify-floor-plan-three-way-merge.ts`

**工作内容**

- 将桌台变更按所属区域聚合，依次执行区域新增、区域快照更新、支持的区域删除和扩展写入。
- 写请求携带区域基线指纹与 UUID v4 幂等键。
- 每次区域成功后使用回读数据和新指纹更新操作上下文。
- Wire Driver 写前回读并合并最新 `currentGuestCount/status`。
- 保存结果区分 succeeded、failed、ambiguous，并维护临时 ID → KPOS ID。
- ambiguous create 复用原幂等键，按唯一名称与完整布局字段回读恢复。
- 部分失败执行字段级 base/local/remote 三方合并；冲突进入人工选择。
- KPOS 成功但扩展失败时只保留扩展重试项。

**验证**

- 覆盖多区域串行保存、指纹冲突、响应丢失、重复点击、部分失败、扩展失败和删除不确定。

## Task 10：接入页面保存/放弃、冲突与续期 UX

**修改文件**

- `src/config/floor-plan-ui.ts`
- `src/config/page-save-registry.ts`（仅在现有 async 契约不足时最小扩展）
- `src/main.ts`
- `src/i18n.ts`

**工作内容**

- 将页面保存 pre-commit 接入异步保存协调器，保存完成前保持 busy 并阻止重复提交。
- 放弃只恢复最近一次成功 base，不发 KPOS 写请求。
- 会话过期时暂停队列；有记住密码则 reauth，无凭据则展开悬浮球要求重输。
- connection ID 轮换后仅重试尚未发送的操作一次。
- 展示具体区域/桌台/扩展项错误、ambiguous 状态和字段冲突选择。
- 重新加载会覆盖草稿时使用自定义二次确认。
- 只有 KPOS 与扩展项全部成功才清空变更并显示整体成功。

**验证**

- 保存按钮、dirty probe、发布变更摘要和全局导航离开保护保持一致。

## Task 11：安全、集成与回归自动化

**修改文件**

- `package.json`

**新增文件**

- `scripts/verify-kpos-floor-plan-live-sync.mjs`
- `scripts/verify-kpos-floor-plan-security.mjs`
- `scripts/verify-kpos-floor-plan-partial-save.mjs`

**工作内容**

- 汇总 Tasks 1–10 的验证脚本为稳定 npm 命令。
- 加入 mock KPOS server，覆盖登录、SOAP、延迟、断连、Fault、并发修改和 ambiguous response。
- 覆盖 CSRF、SSRF、DNS rebinding、限速、凭据损坏、会话续期、扩展失败与三方合并。
- 运行现有 floor plan、duration billing、host control、eMenu/Kiosk session bridge 相关测试。
- 运行 `npm run build`，确保 TypeScript 与 Vite 构建通过。

## Task 12：浏览器走查与真实环境验收

**只读阶段**

- 在悬浮球连接 `192.168.96.96:22080`，选择授权 PC License 并登录。
- 对比商家后台与 KPOS Admin → Table 的区域、桌台、名称、人数、尺寸、形状、类别和位置。
- 切换主机后确认旧布局、凭据状态、扩展字段和连接不串用。

**授权写入阶段**

- 用户明确指定测试区域后，新增唯一名称测试桌台。
- 编辑人数、尺寸、形状、类别和位置，重新加载两端核对。
- 验证冲突、断网和会话过期不会误报成功或重复创建。
- 仅在 Wire fixture 已确认删除语义时删除测试桌台/区域并核对无残留。
- 清除测试数据、连接和不再需要的浏览器凭据。

**交付证据**

- 保存自动化测试输出。
- 保存不含凭据的关键页面截图。
- 记录目标 KPOS 版本、支持/不支持能力和删除语义结论。

## 完成定义

- 权威设计第 14 节验收标准全部具备自动断言或可复现浏览器步骤。
- P0 Wire fixtures 完整、脱敏并通过验证。
- KPOS 区域和桌台查询、新增、更新与拖拽位置同步通过；删除按目标版本能力安全启用或明确禁用。
- 浏览器中不存在明文密码，代理日志不包含凭据、Cookie 或会话令牌。
- 跨用户、跨门店、跨主机访问被拒绝，CSRF/SSRF/DNS rebinding/限速测试通过。
- 部分保存、冲突和 ambiguous 写入不会丢失草稿或重复创建。
- 现有餐位平面图、按时计价扩展、eMenu/Kiosk 主机切换和配置发布流程不回归。
- `npm run build` 通过，真实环境只读核对通过；任何写入验收均有用户授权目标和清理记录。

