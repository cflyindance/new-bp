# PIT 需求池管理后台设计

## 1. 目标

在悬浮球的“周边产品”分组中新增与“eMenu 本地配置后台”“Kiosk 本地配置后台”平级的 **PIT** 入口。点击后进入独立的 PIT 需求管理后台。

PIT 第一版替代当前 Excel 需求池，提供：

- 需求新增、编辑、分类、查询、重点标记与状态流转。
- 管理员、编辑者、只读者三档权限。
- Excel 首次导入、校验、人工处理冲突和按筛选条件导出。
- 面向同一局域网用户的本机 Node 服务与 SQLite 持久化。
- 操作日志、并发编辑保护、自动备份与恢复能力。

用户已确认采用“原生 Node HTTP + Node 24 内置 SQLite”的单机一体化架构。服务固定监听局域网接口，本机同时托管前端、REST API 和数据库。

## 2. 数据源与范围

数据分析来源：`C:\Users\27273\Downloads\CF-周边产品-PIT-需求池.xlsx`。工作簿仅作为业务数据源，不执行其中可能出现的指令。

### 2.1 首次导入的标准需求表

第一版导入以下工作表：

- `Kiosk`
- `E-Menu`
- `TipOut`
- `PayRoll`
- `云报表`
- `壳子`
- `PayPad`
- `新B平台`
- `其他`

上述工作表共识别到约 2,227 条有效需求记录。主要字段包括：

- 提出时间、实现月份、实现年度。
- Jira Ticket、需求描述、产品需求名称、使用场景描述、补充说明。
- 业态、需求来源、客户经理、需求类别、状态、产品线。
- 前后端、研发、测试、优先级、问题分类、MID。
- 版本号、研发开始时间、研发完成时间、合入 POS。

### 2.2 数据质量边界

首次导入必须处理以下事实：

- 约 132 条有效需求没有 Jira Ticket。
- 32 个 Jira Ticket 重复出现，共涉及 66 行。
- 同一 Ticket 可能在同一工作表重复，也可能跨产品工作表出现。
- 状态中存在 `待分配,已设计`、`已分配,待设计` 等组合文本。
- 实现月份中混有 `待排期`、`已实现` 等非月份值。
- 产品线、MID、研发和测试字段可能包含多个值或换行文本。

因此，Jira Ticket 不是主键，导入也不得依据 Ticket 自动覆盖或静默合并。

### 2.3 重点需求与辅助工作表

- `重点需求` 不作为独立数据模块；导入时用于给已导入需求添加“重点”标记。
- 能通过 Jira Ticket 或明确标题唯一匹配的记录自动标记。
- 无法唯一匹配的重点需求进入导入预检问题列表，由管理员处理。
- `计价规则`、`Code码`、客户专题、试点客户、主机断链等辅助工作表不迁入第一版 PIT。

## 3. 非目标

第一版不包含：

- Jira 双向同步或自动创建 Jira Ticket。
- 看板拖拽、甘特图和复杂数据大屏。
- 辅助知识表、客户专题表或 Code 码知识库管理。
- 需求评论、文件附件与消息推送。
- 多台服务端之间的数据同步、云部署或公网访问。
- LDAP、SSO、企业微信或飞书账号接入。
- 离线浏览器编辑或客户端本地主数据副本。

## 4. 总体架构

```text
局域网浏览器
    │  HTTP，同源 Cookie
    ▼
PIT Node 服务（0.0.0.0:3020）
    ├── 构建后的前端静态资源
    ├── /api/v1/pit REST API
    ├── 登录、权限、导入导出、审计与备份
    └── SQLite 连接
          ├── .data/pit/pit.db
          └── .data/pit/backups/
```

### 4.1 运行模式

- 开发：`npm run dev:pit` 同时启动 Vite 与 PIT API；Vite 将 `/api/v1/pit` 代理到 API 服务。
- 生产：`npm run pit-server` 启动 Node 服务，直接托管 `dist` 和 API。
- 默认端口为 `3020`，可用 `PIT_PORT` 覆盖。
- 服务固定绑定 `0.0.0.0`，启动日志同时输出 `localhost` 和检测到的局域网 IPv4 地址。
- 生产模式只允许一个 PIT 进程打开同一数据目录；第二个进程启动失败并给出明确提示。

### 4.2 技术选择

- HTTP 服务沿用项目现有 `node:http` 模式，不新增 Express 或 Fastify。
- 数据库使用项目固定 Node 24 运行时的 `node:sqlite` `DatabaseSync`。
- Excel 读写使用 `exceljs`，封装在独立 importer/exporter 适配层，业务层不直接依赖工作簿 API。
- SQLite 备份使用 Node `node:sqlite` 提供的在线 `backup()` API，不直接复制正在写入的数据库文件。

### 4.3 SQLite 设置

数据库初始化时启用：

- `PRAGMA foreign_keys = ON`。
- `PRAGMA journal_mode = WAL`。
- `PRAGMA synchronous = NORMAL`。
- 合理的 busy timeout，避免短暂写锁立即变成用户错误。

所有迁移使用版本化 SQL migration。服务启动时只能向前迁移，迁移前先创建备份。

## 5. 悬浮球入口与独立壳层

### 5.1 周边产品入口

`src/shell/peripheral-products-control.ts` 的产品类型扩展为：

- `emenu-local`
- `kiosk-local`
- `pit`

PIT 在“周边产品”中作为第三个平级入口展示，位于 Kiosk 本地配置后台之后。入口同时适配悬浮球菜单和展开后的平铺产品卡片。

### 5.2 Shell 模式与路由

`AppShellMode` 新增 `pit`。点击入口时：

1. 写入 PIT shell mode。
2. 导航到 `#pit/requirements`。
3. 挂载 PIT 独立后台壳层。

PIT 壳层沿用现有周边产品后台的视觉结构：左侧导航、顶部标题与用户区域、主内容区、移动端横向导航。

主要路由：

| 路由 | 页面 |
| --- | --- |
| `#pit/requirements` | 需求池 |
| `#pit/requirements/:id` | 需求详情深链；桌面端仍可表现为抽屉 |
| `#pit/highlights` | 重点需求快捷视图 |
| `#pit/my-tasks` | 当前用户待办 |
| `#pit/imports` | 导入记录与预检 |
| `#pit/exports` | 导出记录 |
| `#pit/dictionaries` | 分类配置，管理员可见 |
| `#pit/users` | 用户与权限，管理员可见 |
| `#pit/audit-log` | 操作日志，管理员可见 |

## 6. 前端信息架构

### 6.1 需求池工作台

默认页从上到下包含：

1. 页面标题、Excel 导入和“新建需求”。
2. 待评审、待排期、开发/测试中、重点需求四个摘要卡片。
3. 快捷视图：全部、待我处理、我关注的、开发中、已完成。
4. 搜索和组合筛选。
5. 服务端分页需求表格。

列表默认列：

- 系统需求编号 / Jira Ticket / 标题与摘要。
- 产品线。
- 需求类别与问题分类。
- 状态。
- 优先级。
- 负责人。
- 更新时间。

筛选条件包括产品线、状态、优先级、需求类别、问题分类、需求来源、负责人、提出时间、计划年度/月度、是否重点。搜索覆盖系统需求编号、Jira Ticket、标题、需求描述与 MID。

筛选、排序、分页写入 URL query，刷新、浏览器前进后退和复制链接后均可恢复。

### 6.2 需求详情

桌面端点击列表行打开右侧详情抽屉，同时将需求 ID 写入 URL；移动端和直接访问深链使用完整详情页。关闭抽屉后恢复原列表滚动位置和筛选条件。

详情按以下顺序分组：

- 需求内容：标题、需求描述、使用场景、补充说明。
- 分类与客户：产品线、需求来源、需求类别、问题分类、优先级、MID、Jira Ticket。
- 执行信息：状态、负责人、前后端、研发、测试、计划年度/月度、版本和研发时间。
- 推进与记录：下一步状态动作、重点标记和操作日志。
- 导入追溯：原工作表、原行号、原状态和导入批次。

### 6.3 权限呈现

- 管理员：显示全部页面和操作。
- 编辑者：可新增、编辑、标记重点和执行状态流转；不显示用户、字典和恢复操作。
- 只读者：仅显示查询、详情和导出；所有写入入口不可见。

前端隐藏只用于减少误操作，API 必须再次执行相同权限判断。

## 7. 状态模型

### 7.1 主状态

```text
待评审 → 待设计 → 待排期 → 开发中 → 测试中 → 已完成
```

内部枚举：

- `review_pending`
- `design_pending`
- `scheduling_pending`
- `development`
- `testing`
- `completed`
- `paused`
- `rejected`

### 7.2 异常动作

- 打回：要求填写原因，目标状态回到 `review_pending`。它作为事件记录，不是长期状态。
- 暂停：要求填写原因，保存暂停前状态到 `paused_from_status`，状态变为 `paused`。
- 恢复：从 `paused` 回到 `paused_from_status`。
- 拒绝：要求填写原因，状态变为 `rejected`。
- 重新开启：仅管理员可将 `rejected` 或 `completed` 重新置为 `review_pending`。

所有状态动作必须写 `requirement_events`，包括操作者、前后状态、原因和时间。

### 7.3 Excel 状态映射

预检提供默认建议，但管理员可在提交前调整：

| 原状态特征 | 建议状态 |
| --- | --- |
| 已完成、已实现 | `completed` |
| 开发中 | `development` |
| 测试中、待测试 | `testing` |
| 包含“已设计” | `scheduling_pending` |
| 待设计、设计中、沟通中 | `design_pending` |
| 暂停 | `paused` |
| 拒绝 | `rejected` |
| 待分配、已打回、空值 | `review_pending` |
| 无法识别 | 预检问题；提交前必须选择映射或跳过 |

原状态始终保留在导入追溯字段中。

## 8. 领域模型

### 8.1 `requirements`

| 字段 | 类型/约束 | 说明 |
| --- | --- | --- |
| `id` | TEXT PK | UUID |
| `requirement_no` | TEXT UNIQUE NOT NULL | 系统编号，如 `REQ-000001` |
| `jira_ticket` | TEXT NULL | 非唯一外部编号 |
| `title` | TEXT NOT NULL | 产品需求名称优先；为空时由需求描述生成 |
| `description` | TEXT NOT NULL | 原需求描述 |
| `use_case` | TEXT NULL | 使用场景 |
| `notes` | TEXT NULL | 补充说明 |
| `status` | TEXT NOT NULL | 规范状态枚举 |
| `priority` | TEXT NULL | `urgent/high/medium/low` |
| `requirement_type_id` | TEXT FK NULL | 新功能、Bug、功能优化等 |
| `source_id` | TEXT FK NULL | 产品、运维、CES 等 |
| `problem_category_id` | TEXT FK NULL | 菜单、CRM、支付等 |
| `industry_id` | TEXT FK NULL | 业态 |
| `customer_manager` | TEXT NULL | 客户经理 |
| `owner_user_id` | TEXT FK NULL | 需求负责人 |
| `implementation_side` | TEXT NULL | `frontend/backend/both` |
| `developer_user_id` | TEXT FK NULL | 研发 |
| `tester_user_id` | TEXT FK NULL | 测试 |
| `proposed_at` | TEXT NULL | ISO 日期或月份精度值 |
| `planned_year` | INTEGER NULL | 计划年度 |
| `planned_month` | INTEGER NULL | 1–12 |
| `version_no` | TEXT NULL | 版本号 |
| `development_started_at` | TEXT NULL | ISO 日期 |
| `development_completed_at` | TEXT NULL | ISO 日期 |
| `pos_merge_version` | TEXT NULL | 合入 POS 版本 |
| `is_highlighted` | INTEGER NOT NULL | 0/1 |
| `paused_from_status` | TEXT NULL | 暂停恢复目标 |
| `source_sheet` | TEXT NULL | 原工作表 |
| `source_row` | INTEGER NULL | 原行号 |
| `source_status` | TEXT NULL | 原状态 |
| `import_job_id` | TEXT FK NULL | 导入批次 |
| `row_version` | INTEGER NOT NULL | 乐观锁版本，初始 1 |
| `created_by/updated_by` | TEXT FK NOT NULL | 操作者 |
| `created_at/updated_at` | TEXT NOT NULL | ISO 时间 |

### 8.2 关联表

- `requirement_product_lines(requirement_id, dictionary_id)`：一条需求可关联多个产品线。
- `requirement_mids(requirement_id, mid)`：MID 作为文本标识，可多值。
- `dictionaries(id, type, code, label, sort_order, active)`：产品线、来源、类别、问题分类、业态。
- `users(id, username, display_name, password_hash, role, active, created_at, updated_at)`。
- `sessions(id_hash, user_id, csrf_hash, expires_at, created_at, last_seen_at)`。
- `requirement_events(id, requirement_id, event_type, from_status, to_status, reason, diff_json, actor_user_id, created_at)`。
- `import_jobs(id, file_name, file_hash, status, summary_json, created_by, created_at, committed_at)`。
- `import_rows(id, import_job_id, sheet_name, row_number, raw_json, normalized_json, issue_json, decision_json)`。

删除需求采用软删除字段，由管理员恢复；普通列表不展示已删除记录。操作日志和导入追溯不可级联删除。

## 9. API 契约

### 9.1 通用格式

成功响应：

```json
{
  "data": {},
  "meta": {}
}
```

错误响应：

```json
{
  "error": {
    "code": "validation_failed",
    "message": "请求内容不合法",
    "fields": { "title": "标题不能为空" },
    "requestId": "req_..."
  }
}
```

主要错误码：

- `400 invalid_request`
- `401 authentication_required`
- `403 permission_denied`
- `404 not_found`
- `409 version_conflict`
- `413 file_too_large`
- `415 unsupported_file_type`
- `422 validation_failed`
- `503 service_unavailable`

### 9.2 登录与初始化

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/pit/setup/status` | 公共 | 是否需要首次初始化 |
| `POST` | `/api/v1/pit/setup/bootstrap` | 一次性 token | 创建首个管理员并立即失效 token |
| `POST` | `/api/v1/pit/auth/login` | 公共 | 用户名密码登录 |
| `POST` | `/api/v1/pit/auth/logout` | 登录 | 删除当前会话 |
| `GET` | `/api/v1/pit/auth/me` | 登录 | 当前用户、角色与 CSRF token |

首次启动若没有用户，服务在本机控制台输出一次性初始化 token。bootstrap 端点在首个管理员创建后永久关闭。

### 9.3 需求列表

`GET /api/v1/pit/requirements`

Query：

- `page`、`pageSize`，默认 1/20，最大 100。
- `q`。
- `productLine`、`status`、`priority`、`requirementType`、`problemCategory`、`source`、`owner`，允许重复参数表示多选。
- `highlighted`、`plannedYear`、`plannedMonth`、`proposedFrom`、`proposedTo`。
- `sort`，白名单：`updatedAt`、`createdAt`、`priority`、`plannedDate`；前缀 `-` 表示倒序。

响应：

```json
{
  "data": {
    "items": [
      {
        "id": "...",
        "requirementNo": "REQ-000001",
        "jiraTicket": "PIT-20527",
        "title": "Kiosk 手机号支持国际区号",
        "summary": "...",
        "productLines": [{ "id": "...", "label": "Kiosk" }],
        "status": "review_pending",
        "priority": "high",
        "owner": { "id": "...", "displayName": "王鹏" },
        "isHighlighted": true,
        "rowVersion": 3,
        "updatedAt": "2026-08-31T06:32:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 2227
  },
  "meta": { "requestId": "req_..." }
}
```

### 9.4 需求 CRUD

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/pit/requirements` | 管理员、编辑者 | 新建 |
| `GET` | `/api/v1/pit/requirements/:id` | 全部 | 详情与最近事件 |
| `PATCH` | `/api/v1/pit/requirements/:id` | 管理员、编辑者 | 修改业务字段 |
| `DELETE` | `/api/v1/pit/requirements/:id` | 管理员 | 软删除 |
| `POST` | `/api/v1/pit/requirements/:id/restore` | 管理员 | 恢复软删除 |
| `POST` | `/api/v1/pit/requirements/:id/transitions` | 管理员、编辑者 | 状态动作 |

`POST` 和 `PATCH` 使用 camelCase 字段，对产品线和 MID 传数组。`PATCH` 必须携带 `rowVersion`。服务端在一个事务中更新主表、关联表、行版本和事件。

状态动作请求：

```json
{
  "action": "advance",
  "targetStatus": "design_pending",
  "reason": "评审通过",
  "rowVersion": 3
}
```

`action` 允许 `advance`、`return`、`pause`、`resume`、`reject`、`reopen`。服务端校验状态机，不接受客户端任意写 `status`。

### 9.5 摘要、字典、用户和审计

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/pit/dashboard/summary` | 全部 | 摘要卡片与快捷视图计数 |
| `GET` | `/api/v1/pit/dictionaries` | 全部 | 有效字典 |
| `POST/PATCH` | `/api/v1/pit/dictionaries` | 管理员 | 新增、排序、停用字典；已使用值不可硬删除 |
| `GET/POST/PATCH` | `/api/v1/pit/users` | 管理员 | 用户、角色、启停与重置密码 |
| `GET` | `/api/v1/pit/audit-log` | 管理员 | 按用户、对象、动作和日期查询 |
| `GET` | `/api/v1/pit/health` | 公共 | 进程、数据库、备份状态；不返回敏感路径 |

### 9.6 导入

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/pit/imports/preview` | 管理员 | 上传 `.xlsx`，创建预检批次 |
| `GET` | `/api/v1/pit/imports/:id` | 管理员 | 批次摘要、问题和分页行 |
| `POST` | `/api/v1/pit/imports/:id/decisions` | 管理员 | 批量提交行/重复组决策 |
| `POST` | `/api/v1/pit/imports/:id/commit` | 管理员 | 事务导入 |
| `GET` | `/api/v1/pit/imports` | 管理员 | 历史批次 |

预检响应摘要至少包含：总行数、可导入行、缺少 Ticket、重复组、未知状态、未知字典、重点需求匹配结果和忽略的工作表。

重复决策：

- `keep_separate`：默认；每行创建独立需求。
- `merge`：显式选择目标行或现有需求，并指定字段优先级。
- `skip`：不导入。

只有所有阻断问题都已有决策时才能 commit。commit 前创建操作前备份；数据库写入、字典新增、重点标记和事件记录在同一事务中完成。

### 9.7 导出与备份

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/pit/exports/requirements.xlsx` | 全部 | 按列表同一筛选契约导出 |
| `GET` | `/api/v1/pit/backups` | 管理员 | 备份列表 |
| `POST` | `/api/v1/pit/backups` | 管理员 | 手工创建备份 |
| `GET` | `/api/v1/pit/backups/:id/download` | 管理员 | 下载备份文件 |

数据库恢复不提供在线 API，只能在停止 PIT 服务后执行 `npm run pit:restore -- <backup-file>`。恢复命令先备份当前数据库，再恢复并执行完整性检查。

## 10. 导入规范

### 10.1 字段归一化

- `title = 产品需求名称 || 需求描述`；若使用描述生成标题，保留完整描述。
- 系统为每一行生成独立 `REQ-xxxxxx`。
- Jira Ticket 只做格式清洗和索引，不做唯一约束。
- 工作表名作为默认产品线；行内产品线若存在则合并并去重。
- 多 MID、多产品线和多人字段按换行、逗号与中文逗号拆分，预检展示拆分结果。
- 日期转换成 ISO 文本；只精确到月份的数据保留月份精度，不伪造具体日期。
- `待排期` 等非月份值不写入 `planned_month`，而是用于状态建议。
- 未知字典值默认建议“创建并启用”；管理员可改为映射已有值或留空。

### 10.2 文件限制

- 只接受 `.xlsx`。
- 默认最大 20 MiB，可配置但必须设上限。
- 校验扩展名、MIME 和 ZIP/XLSX 文件签名。
- 解析文件保存在系统临时目录，预检结束或失败后删除。
- 公式只读取计算结果，不执行宏、不加载外部链接、不导入图片或附件。

### 10.3 幂等与重复导入

对上传文件计算 SHA-256。若相同文件已成功提交，preview 返回 `409 duplicate_import` 并给出原批次，不允许一键重复提交；管理员可显式创建新的预检批次并逐项确认。

## 11. 鉴权与安全

- 密码使用 Node `crypto.scrypt` 加随机盐，不保存可逆密码。
- 会话 token 只存在 HttpOnly、SameSite=Strict Cookie；数据库只保存 token hash。
- 登录成功后由 `/auth/me` 返回短期 CSRF token，所有写请求要求 `X-CSRF-Token`。
- 写请求验证 `Origin` 与当前服务地址一致。
- 登录失败进行基于用户名和来源 IP 的限速，错误信息不区分用户不存在或密码错误。
- 首次初始化 token 只打印到本机控制台，首个管理员创建后立即失效。
- 审计日志不记录密码、会话 token、CSRF token 或完整上传文件内容。

本方案固定使用 HTTP 并面向受信任局域网，不承诺抵抗同网段流量窃听。若部署网络不可信，必须在 PIT 服务前增加 HTTPS 反向代理；不允许直接暴露到公网。

## 12. 并发、一致性与刷新

- SQLite 是唯一主数据源；浏览器只保存会话和界面偏好。
- `row_version` 每次成功修改加 1。
- `PATCH` 和状态动作使用 `WHERE id = ? AND row_version = ?`。
- 版本不匹配返回 `409 version_conflict`，响应同时包含客户端提交版本和当前服务端版本。
- 前端展示字段差异，允许用户刷新后重新编辑；不得自动覆盖。
- 列表和摘要每 30 秒静默刷新；编辑抽屉中的表单不被后台刷新覆盖。
- 所有写入使用短事务；导入使用单事务，不允许半批成功。

## 13. 备份与恢复

备份时机：

- 每次服务启动并完成数据库检查后。
- 每次正式 Excel 导入前。
- 每次数据库 migration 前。
- 每日一次定时备份。
- 管理员手工触发。

保留策略：

- 最近 14 份每日备份。
- 最近 5 份操作前备份。
- 手工备份不自动删除，管理员自行管理。

每个备份同时写 manifest：创建时间、数据库 schema 版本、文件大小和 SHA-256。恢复后运行 `PRAGMA integrity_check` 和 migration 版本校验；失败则保持服务停止并给出可恢复的原数据库路径。

## 14. 错误与降级

- API 不可用：列表保留已展示内容，显示连接中断横幅，禁用全部写操作并提供重试。
- 权限变化：收到 403 后刷新 `/auth/me`，立即移除不再可用的入口。
- 会话过期：收到 401 后回到登录页，保留只读的列表 query 以便登录后恢复。
- 导入解析失败：保留批次失败原因，不产生需求数据，并删除临时源文件。
- 导入事务失败：回滚全部业务写入，批次标为 failed，备份仍保留。
- 数据库 busy：在 timeout 内重试；超时后返回 503，不在前端无限重放写请求。
- 备份失败：普通 CRUD 记录管理员告警；migration 和正式导入必须阻断，避免在无可恢复点时执行高风险操作。
- 导出失败：返回可读错误，不生成空文件。

## 15. 验证策略

### 15.1 领域与数据库

- 主状态合法流转、打回、暂停恢复、拒绝和管理员重开。
- `row_version` 乐观锁与 409 冲突。
- 字典停用后历史需求仍可显示。
- 软删除、恢复、事件和导入追溯完整。
- migration、WAL、外键、唯一系统编号和事务回滚。

### 15.2 API

- 登录、退出、会话过期、CSRF、三档角色权限矩阵。
- 分页、排序、组合筛选、搜索和参数白名单。
- 新建、修改、状态动作、重点标记、删除与恢复。
- 错误 envelope 和状态码。
- 服务重启后数据、会话策略、字典和日志正确。

### 15.3 Excel

- 使用真实结构缩小后的 fixture 覆盖 9 个标准工作表。
- 缺少 Ticket、32 类重复组场景、跨表重复、未知状态和未知字典。
- 重点需求唯一匹配、歧义和未匹配。
- 多值拆分、月份精度、公式结果、空白行和异常单元格。
- 文件 hash 幂等、20 MiB 上限、错误文件类型与事务回滚。
- 导出后字段、筛选范围和 UTF-8/中文内容可被 Excel 正常打开。

### 15.4 前端

- 悬浮球 PIT 入口与 shell mode 切换。
- 直接打开 PIT 深链、刷新和返回列表状态恢复。
- 工作台摘要、快捷视图、筛选、分页和列设置。
- 详情抽屉、移动端详情页、新增、编辑、状态流转和冲突差异。
- 管理员、编辑者、只读者的入口和按钮矩阵。
- 导入预检、冲突决策、提交、导出和错误提示。
- 桌面与移动视口无溢出或遮挡。

### 15.5 运行验收

- `npm run build` 成功。
- PIT 服务可使用项目 Node 24 启动并完成健康检查。
- 从本机和另一台同局域网电脑访问同一地址。
- 完成登录、查询、新建、编辑、冲突、重启持久化和备份下载的冒烟测试。
- Windows 防火墙未放行时，启动说明明确提示用户手工允许 3020 端口；程序不静默修改系统防火墙。

## 16. 验收标准

本功能完成需同时满足：

1. 周边产品中出现 PIT，与 Kiosk 本地配置后台平级，点击后进入独立 PIT 后台。
2. 需求池支持服务端分页、搜索、组合筛选、详情、新增、编辑、重点标记和规范状态流转。
3. 三档权限在前端和 API 中一致生效。
4. SQLite 成为唯一主数据源，服务重启后数据不丢失。
5. 真实来源工作簿能通过预检；重复、缺失 Ticket 和状态映射不会静默丢数据。
6. 正式导入具备事务性，并在导入前成功创建备份。
7. 多人同时编辑同一需求时不会静默覆盖。
8. 本机和同一局域网另一台电脑均能使用 PIT。
9. 自动备份、手工备份、离线恢复和完整性检查可用。
10. 项目构建、领域测试、API 测试、导入测试和关键前端验证全部通过。

## 17. 参考资料

- Node.js SQLite：<https://nodejs.org/docs/latest-v24.x/api/sqlite.html>
- ExcelJS：<https://github.com/exceljs/exceljs>
