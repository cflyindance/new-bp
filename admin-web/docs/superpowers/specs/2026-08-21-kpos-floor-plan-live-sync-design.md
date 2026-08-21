# KPOS 餐位平面图真实数据同步设计

## 1. 背景与目标

商家后台现有「前厅管理中心 → 餐位平面图」已经具备区域与桌台管理、拖拽画布、配置变更摘要、保存/放弃和按时计价规则绑定，但桌台主数据目前按门店存储在浏览器 `localStorage` 中。

本次改造将真实 KPOS Table 功能接入商家后台。商家用户通过现有悬浮球配置 KPOS 主机、PC License 和 Admin 密码，餐位平面图直接读取和写入对应 KPOS 主机。KPOS 是区域与桌台布局的唯一事实源；商家后台只保留 KPOS 不支持的扩展字段。

参考环境：`http://192.168.96.96:22080/kpos`。真实 Admin → Table 页面包含区域/楼层切换、区域新增/编辑/删除、桌台新增/编辑/删除，以及名称、人数、宽、高、形状、桌子类别和画布位置等字段。

## 2. 已确认范围

### 2.1 本次包含

- 扩展现有悬浮球主机配置，增加 PC License、Admin 密码、记住密码、测试连接和断开连接。
- 密码通过浏览器 Web Crypto 加密并存入 IndexedDB，不保存明文。
- 增加同源 KPOS 服务端代理，动态连接用户选择的 KPOS 主机。
- 代理负责主机校验、KPOS 登录会话、续期、SOAP XML 编解码和统一错误映射。
- 将餐位平面图的数据层从 `localStorage` 替换为真实 KPOS 适配器。
- 同步区域和桌台的查询、新增、编辑、删除及桌台画布位置。
- 保留现有页面的草稿、变更摘要、保存/放弃、按门店范围和按时计价规则绑定能力。
- 提供单元测试、代理集成测试、页面验证脚本和真实环境只读验证。

### 2.2 本次不包含

- iframe 嵌入原始 KPOS Admin 页面。
- 按真实 KPOS 的旧版视觉完整复刻商家后台页面。
- 将浏览器记住的密码上传并长期保存在服务端。
- 改造 KPOS 服务端或为 KPOS SOAP 操作增加其原本不存在的事务能力。
- 与本目标无关的前厅页面重构。

## 3. 方案选择

采用「保留现有餐位平面图 UI，替换数据层」方案。

没有选择完整视觉复刻，因为现有商家后台已经具备一致的视觉系统、发布变更流程和扩展字段能力。没有选择 iframe，因为它无法可靠纳入商家后台的权限、数据联动、错误处理和发布流程。

## 4. 总体架构

系统分为四个边界清晰的单元：

1. **悬浮球 KPOS 连接设置**：采集主机、端口、PC License 和 Admin 密码，管理浏览器加密凭据与连接状态。
2. **同源 KPOS 代理**：按商家用户和 KPOS 主机隔离会话，验证目标主机，调用 KPOS 接口并将 SOAP 转换为稳定 JSON。
3. **KPOS 餐位适配器**：把代理 JSON 映射为现有 `FloorPlanArea` / `FloorPlanTable` 模型，并生成保存操作序列。
4. **餐位平面图编辑器**：保留现有画布、表单、草稿和配置变更行为，只通过适配器读写桌台主数据。

数据流：

```text
悬浮球连接设置
  ├─ 主机 / 端口
  ├─ PC License
  └─ 浏览器加密密码
          │
          ▼
同源 KPOS 代理（用户 + 主机会话隔离）
          │
          ▼
/kpos/ws/kposService
  ├─ ListAreasType
  ├─ ListTablesType
  └─ SaveSeatingAreaType（整区域快照，包含桌台）
          │
          ▼
餐位平面图 KPOS 适配器 → 现有编辑器
```

## 5. 悬浮球连接设计

现有 `emenu-local-host-control` 继续负责主机规范化、主机/端口显示和嵌入页面路由。连接面板新增：

- PC License 下拉框。
- Admin 密码框。
- 「在此浏览器加密记住密码」复选框。
- 「测试并连接」按钮。
- 「断开」按钮。
- 未连接、连接中、已连接、会话过期、License 占用、密码错误和主机离线状态。

交互顺序：

1. 用户输入主机和端口。
2. 页面请求代理探测主机。
3. 探测成功后加载可用 PC License。
4. 用户选择 License、输入 Admin 密码并连接。
5. 代理创建该用户与主机对应的 KPOS 会话。
6. 连接成功后刷新餐位平面图和受该 KPOS 主机影响的嵌入页面。

主机切换时立即清除旧主机的页面缓存和活动会话引用，禁止把旧主机草稿保存到新主机。若当前餐位平面图存在未保存草稿，切换前需要确认。

## 6. 浏览器凭据存储

密码不写入 `localStorage`、URL、日志、DOM 数据属性或普通应用状态。

浏览器为当前应用源生成不可导出的 Web Crypto 密钥。密钥句柄和加密后的凭据记录保存在 IndexedDB。凭据记录按以下维度隔离：

- 当前商家用户 ID。
- 规范化 KPOS 主机。
- PC License 名称。

记录至少包含密文、IV、算法版本、创建时间和更新时间。页面仅展示「已保存凭据」，不能回读明文给用户。连接时应用在内存中短暂解密密码，并仅通过 HTTPS 或同源本地开发代理发送到连接接口。切换商家账号时不得复用其他账号记录；退出账号可按产品策略清除当前账号凭据。

「记住密码」未勾选时，不创建或更新 IndexedDB 凭据，并删除当前用户/主机/License 已存在的记录。用户主动断开可以选择保留或删除已记住凭据；删除主机绑定和退出商家账号默认删除对应凭据。不可导出密钥丢失、IndexedDB 记录损坏、认证标签校验失败或算法版本不受支持时，立即删除不可用记录并要求重新输入，不能降级成明文。算法升级使用新密钥/新版本重新加密，成功后删除旧记录；任何失败都保留「需要重新输入」状态而不是猜测恢复。

浏览器加密不能防御已经获得同源脚本执行能力的 XSS，因此实现必须避免不受信任 HTML 注入，并在设计说明和 UI 中明确其安全边界。

## 7. 代理与安全边界

### 7.1 会话隔离

代理会话按「商家用户 ID + 商家门店范围 + 规范化主机 + PC License」隔离。服务端只在内存或短期会话存储中保存 KPOS Cookie/令牌与到期时间，不长期保存 Admin 密码。创建连接和所有读写接口都必须通过现有商家后台认证中间件，从服务端会话取得用户及可访问门店，不能接受客户端伪造的用户或门店 ID。

业务请求只提交代理生成的连接 ID，不能每次自由传入目标 URL。连接 ID 必须绑定当前商家用户和门店范围，服务端不得信任客户端提交的用户 ID。所有创建连接、续期、断开和写接口必须校验同源 CSRF Token 与 `Origin`；Cookie 使用 `HttpOnly`、`Secure`（非开发环境）和合适的 `SameSite` 策略。

### 7.2 SSRF 防护

动态主机代理必须：

- 只接受 `http`/`https`。
- 开发模式可显式允许 `localhost`；部署模式默认禁止 `localhost` 和代理服务器自身地址。部署配置按网络拓扑声明允许的 RFC1918 网段、端口范围和 HTTPS 隧道域名后缀，不能使用无边界的公网代理规则。
- 拒绝 URL 用户信息、路径穿透、非预期协议和无效端口。
- DNS 解析后再次校验目标地址并将通过校验的 IP 固定到该连接的底层 socket；Host/SNI 仍使用已验证主机名。连接生命周期内不得再次按未校验 DNS 结果发起请求，以防 DNS rebinding。
- 禁止访问云元数据地址、链路本地地址和未授权公网目标。
- 限制请求路径在 `/kpos` 范围内，并设置连接、响应和正文大小超时。
- 对重定向后的目标重复执行校验，或直接禁止代理跟随重定向。

探测与登录按「用户 + 主机」限速，连续失败触发短时退避；每个连接限制并发读取数和串行写入队列长度。超过限制返回 `429`，不得继续向 KPOS 放大请求。

### 7.4 传输要求

开发模式仅允许商家后台运行在 `localhost` / `127.0.0.1` 时使用 HTTP 同源代理。任何非开发部署都必须使用 HTTPS，且浏览器凭据接口拒绝非安全上下文。代理到 KPOS 的 HTTP 仅允许经部署配置批准的受信私网；公网隧道必须使用 HTTPS。密码绝不通过查询参数、重定向或跨源浏览器请求传输。

### 7.3 日志

日志可以包含连接 ID、用户 ID、主机指纹、操作类型、耗时和 KPOS 错误码，不得包含密码、Cookie、会话令牌、完整 SOAP 认证字段或凭据密文。

## 8. 数据模型与字段映射

### 8.1 连接模型

```ts
type KposConnection = {
  id: string;
  host: string;
  licenseName: string;
  status: "disconnected" | "connecting" | "connected" | "expired" | "error";
  expiresAt?: number;
};
```

密码不属于该模型。

### 8.2 区域

现有 `FloorPlanArea` 映射 KPOS Seating Area：

- `id`：KPOS 区域 ID。
- `name`：区域/楼层名称。
- `canvasWidth` / `canvasHeight`：KPOS 支持时使用真实画布尺寸；缺失时使用兼容默认值。
- `tables`：区域内桌台集合。

读取时必须保留 KPOS 原始 ID。新增区域在 KPOS 返回真实 ID 后，替换客户端临时 ID，并同步修正引用。

### 8.3 桌台

现有 `FloorPlanTable` 映射 KPOS Table：

- `id`：KPOS 桌台 ID。
- `name`：名称。
- `seats`：人数。
- `width` / `height`：桌台尺寸。
- `x` / `y`：画布坐标。
- `shape`：矩形、圆形、椭圆等 KPOS 支持形状。
- `category`：KPOS 桌子类别。
- `areaId`：所属区域。

现有 `rotation` 若 KPOS 不支持，则作为商家后台扩展字段处理。`durationBillingRuleId` 同样作为扩展字段，以「主机指纹 + KPOS 桌台 ID」关联。删除桌台时同步删除或软删除关联扩展记录。

### 8.4 兼容策略

解析器必须容忍 KPOS 的单对象/数组两种 XML 结构、字符串数值、缺失可选字段和未知枚举。未知形状或类别保留原始值用于回写，并在 UI 显示兼容提示，不能静默改成默认值后覆盖远端。

## 9. KPOS Wire Driver 与 REST 代理契约

### 9.1 Wire Driver

代理内部必须通过单一 `KposFloorPlanWireDriver` 封装 KPOS 差异：

```ts
interface KposFloorPlanWireDriver {
  probe(target: PinnedKposTarget): Promise<KposProbeResult>;
  listPcLicenses(target: PinnedKposTarget): Promise<KposPcLicense[]>;
  login(input: KposLoginInput): Promise<KposWireSession>;
  listAreas(session: KposWireSession): Promise<KposWireArea[]>;
  listTables(session: KposWireSession, areaId: string): Promise<KposWireTable[]>;
  saveAreaSnapshot(session: KposWireSession, area: KposWireAreaSnapshot): Promise<KposWireArea>;
}
```

已从参考环境客户端确认的 SOAP 操作如下：

- `ListAreasType` 请求体含 `<fetchOrders>false</fetchOrders>`。
- `ListTablesType` 请求体含 `<fetchOrders>false</fetchOrders>` 与 `<areaId>`。
- `SaveSeatingAreaType` 发送一个 `<areaType>`，包含区域 `id`、`name` 和零到多个 `<tables>`。
- 每个 `<tables>` 包含 `id`、`name`、`shape`、`x`、`y`、`width`、`height`、`defaultGuestCount`、`currentGuestCount` 和 `status`。
- KPOS 形状值至少包括 `RECTANGLE`、`HIBACHI`、`ROUND`；适配器不得把未知值静默覆盖。

所有 SOAP 调用使用同一 KPOS 登录会话向 `/kpos/ws/kposService` 发起 `POST`。具体 Envelope namespace、认证头/会话 Cookie、License 发现与 PC Admin 登录请求、成功响应根节点、Fault/error 节点，以及「删除桌台/删除区域」的真实表示，必须在实现写操作前通过参考环境网络录制或可审计客户端代码生成脱敏 golden fixtures。fixtures 进入测试目录，禁止包含密码、Cookie 或 token。

删除不是独立 `SaveTableType`：参考客户端以 `SaveSeatingAreaType` 保存整区域快照。桌台删除预期为在区域快照中省略该桌台；区域删除的 wire 语义尚需 fixture 验证。若目标 KPOS 版本无法证明删除语义，代理必须把对应删除能力标记为 `unsupported` 并禁用 UI 操作，不能试探性写生产数据。

Wire Driver 对上层只返回规范化结果或统一错误，SOAP XML 不泄露到浏览器。完成上述 golden fixtures 是实施计划的 P0 门禁；门禁未通过时只允许只读加载。

`currentGuestCount` 和 `status` 是 KPOS 运行态字段，不属于布局编辑模型。页面不得编辑或缓存后回写它们。若目标 KPOS 的 `SaveSeatingAreaType` 要求这两个字段，Wire Driver 必须在通过布局指纹检查后、实际写入前立即重新读取目标区域，并把每张现有桌台的最新运行态值合并到 wire 快照；新增桌台使用 KPOS fixture 证明的安全初始值。该写前读取与写入在同一连接的串行写锁内完成。若运行态读取失败则取消写入，不能使用旧值。

建议前端只使用以下同源接口：

### 9.2 连接

- `POST /api/kpos/connections/probe`
  - 输入：规范化前的主机和端口。
  - 输出：规范化主机、可达性、KPOS 版本或可解释错误。
- `GET /api/kpos/connections/licenses?probeId=...`
  - 输出：可用 PC License 列表及占用状态。
- `POST /api/kpos/connections/session`
  - 输入：`probeId`、License 名称和 Admin 密码。
  - 输出：连接 ID、状态和到期时间。
- `POST /api/kpos/connections/session/:connectionId/reauth`
  - 输入：Admin 密码；仅用于当前用户对原主机和 License 续期。
  - 输出：新的连接 ID、到期时间和旧连接失效标记。
- `DELETE /api/kpos/connections/session/:connectionId`
  - 清理当前用户的代理会话。

### 9.3 餐位平面图

- `GET /api/kpos/floor-plan?connectionId=...`
  - 组合 `ListAreasType` 与 `ListTablesType`，输出规范化完整布局及远端版本指纹。
- `PUT /api/kpos/floor-plan/areas/:areaId`
  - 输入：完整区域快照、该区域基线实体指纹和请求幂等键。
  - 输出：KPOS 归一化后的完整区域、最新实体指纹和临时 ID 到远端 ID 映射。
- `POST /api/kpos/floor-plan/areas`
  - 输入：完整新区域快照和请求幂等键。
  - 输出：KPOS 返回的完整区域、真实 ID 和实体指纹。
- `DELETE /api/kpos/floor-plan/areas/:areaId`
  - 仅当 Wire Driver fixtures 证明该 KPOS 版本支持区域删除时启用。

桌台新增、更新、移动和删除都通过其所属区域的完整快照写入，不暴露虚假的独立 Table CRUD wire 能力。代理将区域快照映射到 `SaveSeatingAreaType`。

v1 只允许桌台在所属区域画布内移动位置，不支持把现有桌台迁移到另一个区域。UI 不提供跨区域移动入口，适配器若检测到同一 KPOS 桌台 ID 的 `areaId` 改变则拒绝保存。跨区域移动需要 KPOS 提供原子操作或后续单独设计可恢复工作流后才能启用，以避免两次区域快照造成桌台丢失或重复。

### 9.4 指纹与并发

KPOS 未确认提供原生版本号，因此 v1 使用规范化实体内容生成 SHA-256 指纹：字段按固定顺序序列化；区域内桌台按稳定 KPOS ID排序，临时 ID 按客户端创建序排序；忽略订单运行态、当前占用人数和无关服务端时间字段，只纳入布局可编辑字段。完整布局指纹由有序区域实体指纹生成。

每次 `GET` 返回布局指纹和每个区域实体指纹。每次 `PUT` 前，代理重新读取目标区域并比较基线指纹；不一致返回 `409 KPOS_CONFLICT` 且不写入。写成功后代理必须重新读取目标区域，以 KPOS 实际返回值计算并返回新指纹。后续区域写使用各自独立的基线指纹，因此同一批次前一个区域成功不会使后一个区域自冲突。若保存操作改变多个区域，保存器串行执行并在每一步更新相应指纹。

### 9.5 幂等账本与不确定写恢复

所有创建和区域快照写必须携带 UUID v4 幂等键。代理以「用户 + 门店 + 连接目标 + 操作类型 + 幂等键」建立服务端幂等账本，记录请求体 SHA-256、`pending/succeeded/ambiguous/failed` 状态和脱敏响应，保留 24 小时：

- 相同键与相同请求体在 `succeeded` 时直接重放已存响应，不再次调用 KPOS。
- 相同键与不同请求体返回 `409 IDEMPOTENCY_KEY_REUSED`。
- `pending` 或 `ambiguous` 不自动重放写入，先执行回读恢复。
- 明确的 KPOS 校验失败记为 `failed`，同键重放相同错误。

商家后台 v1 对同一 KPOS 主机强制区域名称唯一、同一区域内桌台名称唯一；创建前代理在串行写锁内回读并再次校验唯一性。创建响应不确定时，代理按唯一名称定位候选，再比较创建请求中的所有布局字段：只有恰好一个候选完全匹配才把账本修复为 `succeeded` 并返回其远端 ID；零个候选记为可安全重试前的 `failed-not-applied`，多个候选或字段不一致保持 `ambiguous` 并要求人工选择，绝不自动新建。账本状态和原幂等键必须随页面草稿保存到当前会话，用户重试时复用原键。

## 10. 页面加载与保存

### 10.1 加载

- 没有活动连接时显示连接空状态，并提供打开悬浮球的入口。
- 连接成功后读取完整布局，记录远端基线和版本指纹。
- 页面草稿由基线深拷贝得到；KPOS 主数据不再写入浏览器 `localStorage`。
- 页面扩展字段在主数据加载后按主机指纹和桌台 ID 合并。

### 10.2 保存顺序

页面继续使用现有 diff 与配置变更摘要。用户点击保存后先把变更按所属区域聚合，并按以下顺序执行：

1. 区域新增。
2. 现有区域完整快照更新；快照一次包含该区域桌台新增、更新、拖拽和删除。
3. 已由 Wire Driver fixture 验证支持的区域删除。
4. 商家后台扩展字段更新。

新增实体获得远端 ID 后立即更新后续操作中的引用。

KPOS SOAP 不提供整批事务。保存器必须记录每个区域和每条扩展记录的结果，并返回 `succeeded`、`failed`、`ambiguous`、新指纹和 ID 映射。只有全部成功时才将当前草稿设为新基线并清空页面变更。

客户端在保存开始前保留三份数据：`base`（加载基线）、`local`（用户草稿）和保存后从 KPOS 读取的 `remote`。部分失败后按实体 ID 与字段执行确定性三方合并：

- `local === base`：采用 `remote`。
- `remote === base`：保留 `local` 未保存修改。
- `local === remote`：采用该共同值并标记已同步。
- 三者均不同：生成字段级冲突，不自动覆盖，要求用户选择本地或远端。
- 新增实体只有收到真实 ID 且回读可见时才算成功；否则标记 `ambiguous`，禁止用新幂等键直接重试。
- 删除请求响应不确定时，先回读确认实体是否仍存在，再决定成功、失败或冲突。

扩展字段写入是同一保存结果的一部分。若 KPOS 成功而扩展存储失败，KPOS 新基线与 ID 映射仍被记录，扩展变更保留为可单独重试的失败项；不能回滚或重复 KPOS 新增。只有 KPOS 与扩展项全部成功时显示整体成功。

部分失败时：

- 保留失败项及错误信息。
- 合并成功项的远端 ID。
- 重新读取受影响实体或完整布局，并使用上述三方合并生成新基线和剩余草稿。
- 不显示整体成功，也不自动重复非幂等新增操作。

### 10.3 放弃

放弃修改恢复最近一次成功加载/保存后的基线，不向 KPOS 发写请求。

## 11. 错误处理

统一错误至少包括：

- `KPOS_HOST_UNREACHABLE`：主机不可达。
- `KPOS_HOST_NOT_ALLOWED`：代理安全策略拒绝目标。
- `KPOS_LICENSE_IN_USE`：PC License 已占用。
- `KPOS_AUTH_FAILED`：Admin 密码或权限错误。
- `KPOS_SESSION_EXPIRED`：会话过期。
- `KPOS_CONFLICT`：远端数据已变化。
- `KPOS_VALIDATION_FAILED`：字段不符合 KPOS 约束。
- `KPOS_PARTIAL_SAVE`：部分写入成功。
- `KPOS_WRITE_AMBIGUOUS`：无法确认写入是否到达 KPOS，必须回读。
- `KPOS_RATE_LIMITED`：探测、登录或并发请求超过限制。
- `KPOS_CSRF_REJECTED`：来源或 CSRF 校验失败。
- `KPOS_PROTOCOL_ERROR`：SOAP 响应无法解析或缺少必需字段。

认证失败、License 占用和权限不足不循环重试。网络读取可以有限退避重试；新增、删除等非幂等写操作在无法确认结果时不得自动重放。

页面错误提示必须说明影响对象和下一步操作，例如「Floor 2 · A12 保存失败：License 会话已过期，请重新连接」。重新拉取远端数据会覆盖未保存草稿时必须二次确认。

### 11.1 会话续期

普通业务请求只发送 `connectionId`，不携带密码。代理发现会话过期时返回 `401 KPOS_SESSION_EXPIRED`，并保证该次写操作尚未发出；客户端暂停保存队列但保留 `base`、`local` 和已完成结果。若浏览器存在已记住凭据，客户端解密后调用专用 `reauth` 接口；否则打开连接面板要求重新输入。续期成功返回新连接 ID，旧 ID 立即失效，客户端替换 ID 后只重试尚未发出的当前操作一次。若代理无法确定过期发生在写入前还是写入后，返回 `KPOS_WRITE_AMBIGUOUS`，客户端必须先回读，不得直接重试。

## 12. 与现有能力的关系

- 保留 `FLOOR_PLAN_PATH`、导航入口和页面挂载逻辑。
- 保留配置变更 diff、页面保存注册表、保存/放弃事件和门店范围展示。
- 将 `readState` / `writeState` 中的主数据持久化职责替换为异步仓储；UI 临时选择、弹窗和草稿状态仍可留在内存中。
- 原 `bplant-floor-plan:v1` 数据只用于迁移提示或开发夹具，不自动覆盖真实 KPOS。
- 按时计价等扩展能力继续通过 KPOS 桌台 ID 关联，切换主机后按主机指纹隔离。
- 复用现有悬浮球主机规范化和主机切换事件，避免出现两套 KPOS 目标配置。

### 12.1 扩展字段仓储

扩展字段使用商家后台同源 API，而不是 KPOS 或浏览器主数据缓存：

- `GET /api/kpos/floor-plan/extensions?connectionId=...`
- `PUT /api/kpos/floor-plan/extensions/:tableId`
- `DELETE /api/kpos/floor-plan/extensions/:tableId`

服务端主键为「租户 ID + 门店 ID + 主机指纹 + KPOS 桌台 ID」，并通过当前认证会话校验租户与门店所有权。主机规范身份为 `lowercase(protocol) + // + lowercase(hostname) + : + explicitPort`；IPv6 使用标准方括号形式，去除尾随点和默认路径，不包含凭据、查询或 fragment。主机指纹是该规范身份的 SHA-256，不以短哈希作为唯一键；数据库同时保存规范身份用于碰撞校验。

记录包含扩展 schema 版本、`rotation`、`durationBillingRuleId`、更新时间和软删除时间。读取主布局后再合并扩展记录。KPOS 桌台被确认删除后软删除扩展记录；若删除结果不确定则保留并标记 orphan candidate，定期或下次完整读取确认后清理。KPOS ID 被复用时，若桌台创建指纹/首次见时间不匹配，不自动继承旧扩展。扩展 API 失败遵循第 10.2 节的独立失败和重试规则。

## 13. 测试与验收

### 13.1 单元测试

- 主机规范化、私网/隧道允许规则和 SSRF 拒绝规则。
- 浏览器凭据加密、解密、用户/主机/License 隔离与清理。
- KPOS SOAP 请求构造和响应解析。
- 区域/桌台字段映射、未知枚举兼容和临时 ID 替换。
- 保存排序、部分失败合并和非幂等操作不自动重放。
- 指纹规范化、区域写入后指纹刷新和多区域保存不自冲突。
- 三方合并对失败草稿、字段冲突和远端新增/删除的确定性结果。
- 主机指纹规范化、扩展字段所有权和 KPOS ID 复用保护。

### 13.2 集成测试

- 探测主机、加载 PC License、连接、续期和断开。
- 区域与桌台查询、新增和更新，以及经目标版本 fixture 验证后启用的删除。
- 拖拽位置、尺寸、人数、形状和类别写入后重新加载一致。
- 主机离线、密码错误、License 占用、会话过期和部分保存失败。
- 用户 A 不能访问用户 B 的连接或凭据记录。
- 主机 A 与主机 B 的草稿、扩展字段和连接不串用。
- CSRF/Origin 拒绝、认证门店越权、探测/登录限速和连接并发上限。
- DNS rebinding、重定向、代理自身 localhost、链路本地和云元数据地址拒绝。
- IndexedDB 密钥丢失、密文损坏、认证标签失败和算法轮换。
- 指纹在保存中途冲突，失败区域的本地草稿经三方合并后仍可继续编辑。
- KPOS 写入成功但扩展字段写入失败时，只重试扩展项。
- create/delete 网络结果不确定时先回读，不自动重复非幂等操作。
- 布局保存前合并最新 `currentGuestCount`/`status`，不会用旧运行态覆盖 KPOS。
- 跨区域桌台移动被 UI 和适配器双重拒绝。
- 幂等键成功响应重放、请求体不一致拒绝、24 小时账本保留和 ambiguous 创建唯一名称恢复。

### 13.3 真实环境验收

1. 使用 `192.168.96.96:22080` 只读加载区域和桌台，核对 Admin → Table 页面。
2. 经用户明确授权，在测试区域新增一张桌台并核对 KPOS 原页面。
3. 编辑名称、人数、尺寸、形状、类别和位置后重新加载核对。
4. 在 Wire Driver 已验证目标版本删除语义后，删除测试桌台和测试区域并确认无残留；否则验收明确标记删除不受支持且 UI 禁用。
5. 验证商家后台保存/放弃、变更摘要和扩展字段不回归。

任何真实环境写入测试都必须由用户确认目标区域，不得修改现有生产桌台。

## 14. 验收标准

- 商家用户可在悬浮球中配置主机、端口、PC License 和 Admin 密码。
- 勾选记住密码后，浏览器中不存在可直接读取的明文密码记录。
- 当前连接主机与 License 清晰展示在餐位平面图页。
- 餐位平面图加载的数据与 KPOS Admin → Table 一致。
- 区域和桌台的新增、编辑及拖拽位置能写回 KPOS；删除在目标版本 wire fixture 验证后启用并能正确写回，否则以明确不支持状态禁用。
- 主机切换、会话过期和部分失败不会造成跨主机误写或错误成功提示。
- KPOS 不支持的扩展字段仍可使用，并按主机和桌台 ID 正确隔离。
- 代理不能被用于访问未授权目标，日志不泄露凭据或会话。
- 构建、自动化测试和真实环境只读验证通过。
