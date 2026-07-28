# 门店信息 · 技术规格（SPEC）

> 范围：门店信息（一级导航 `store-mgmt`，设置页 `/stores/settings`）  
> 版本：v1.1  
> 导出日期：2026-07-28  
> 代码依据：commit `1455f50` + 裁决落地（`deployment-config-domains.ts` 增 `store.profile`；`main.ts` 细化 `/store/*` 重定向）  
> 关联 PRD：`./PRD.md`  
> 关联 DIFF：`./DIFF.md`  
> 技术栈假设：当前为 Vue/TS 壳 + 配置 UI 原型（localStorage）；工程实现可替换为真实 API，契约以本 SPEC 为准

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 首次从原型导出（v1） |
| 2026-07-28 | v1.1：范围锁定 4 seq；登记 `store.profile`；旧路由重定向；582 明确无 POS |

---

## 1. 规格元信息

### 1.1 模块定位

侧栏一级 **门店信息**（`id: store-mgmt`，`titleEn: Store information`）：滑层二级仅「设置」，落地 `/stores/settings`。页面内按 catalog 分组展示设置项（当前 **4** 条：seq 417 / 433 / 418 / 582）。

证据：`src/config/navigation.ts`（`NAV_MODULES`）、`src/config/module-settings-catalog.ts`（`"/stores/settings"`）

### 1.2 证据文件清单

| 路径 | 用途 |
|------|------|
| `src/config/navigation.ts` | 一级导航、默认子路径 |
| `src/config/module-settings-catalog.ts` | hub 分组与 seq 清单 |
| `src/config/module-settings-store-basic-info-ui.ts` | seq 417 表单 |
| `src/config/module-settings-store-profile-master.ts` | 417 只读主数据解析 |
| `src/config/module-settings-store-business-hours-ui.ts` | seq 418 营业时间库 |
| `src/config/module-settings-store-closing-alert-ui.ts` | seq 582 打烊前提示 |
| `src/config/module-settings-store-brand-logo-ui.ts` | seq 433 LOGO |
| `src/config/module-settings-toggle-ui.ts` | 582 主开关 seq 列表 |
| `src/config/module-settings-form-ui.ts` | 设置读写存储键（间接） |
| `src/config/deployment-config-domains.ts` | `store.hours` 下发域 |
| `src/config/deployment-seed.ts` | 演示下发种子 |
| `src/main.ts` | 行渲染路由（`renderModuleSetting*`） |
| `docs/项目文档/门店管理-设置二级导航重设计方案.md` | 产品分组意图（可能超出现网 catalog） |
| `docs/项目文档/云端下发本地-配置同步与下发记录设计方案.md` | `store.profile` / `store.hours` |

### 1.3 与 PRD 对应

本 SPEC 覆盖 PRD 编号 **SI-01～SI-31**（模块壳 + 四设置项 + 下发域 + 旧路由废弃）。设计文档中 173/170/77 等**不在本模块交付范围**（见 DIFF 已关闭项）。

---

## 2. 术语与枚举

### StoreBusinessHourDay

| 值 | 含义 |
|----|------|
| `mon`…`sun` | 周一…周日 |

证据：`module-settings-store-business-hours-ui.ts` → `StoreBusinessHourDay`、`STORE_BUSINESS_HOUR_DAYS`

### StoreBusinessHourExceptionMode

| 值 | 含义 |
|----|------|
| `include` | 额外时间：在窗口内用 exception 开闭市覆盖所选营业时间 |
| `exclude` | 额外时间：在窗口内暂停所选营业时间 |

### StoreClosingAlertProductLineId

| 值 | 含义 | 默认启用 |
|----|------|----------|
| `kiosk` | Kiosk | true |
| `emenu` | eMenu | true |
| `sdi` | SDI | true |

**约束（已裁决）**：不包含 `pos`；工程实现不得自行增加 POS 行。

证据：`STORE_CLOSING_ALERT_PRODUCT_LINES`

### StoreRestaurantLogoValue.source

| 值 | 含义 |
|----|------|
| `upload` | 本地上传 |
| `library` | 图片素材库 |

### 国家/地区、餐厅模式（代码存在，本模块不交付）

seq 173 / 170 的 UI 仍在仓库，但 **不挂入** `/stores/settings` catalog，不纳入本 SPEC 验收（见 DIFF D2）。

---

## 3. 数据模型

### 3.1 设置项 Catalog（门店信息 hub）

| seq | catalog id | groupKey | groupTitle | title |
|-----|------------|----------|------------|-------|
| 417 | `s417-store-profile-基本信息` | `store-profile` | 门店档案 | 基本信息 |
| 433 | `s433-brand-identity-assets-餐厅LOGO` | `brand-identity-assets` | 品牌标识素材 | 餐厅LOGO |
| 418 | `s418-store-hours-operation-营业时段` | `store-hours-operation` | 营业与运营 | 营业时段 |
| 583 | `s583-store-hours-operation-额外时间` | `store-hours-operation` | 营业与运营 | 额外时间 |
| 582 | `s582-store-hours-operation-营业时间即将结束提示` | `store-hours-operation` | 营业与运营 | 营业时间即将结束提示 |

`groupOrder`：`store-profile` → `brand-identity-assets` → `store-hours-operation`

证据：`MODULE_SETTINGS_BY_PATH["/stores/settings"]`

### 3.2 StoreBasicProfileMaster（417 只读主数据）

| 字段名 | 类型 | 必填 | 默认值 | 说明 | 约束/校验 |
|--------|------|------|--------|------|-----------|
| restaurantName | string | 是* | 演示餐馆 | 餐馆名 | 平台/企业商户同步 |
| merchantNo | string | 是* | M00000000 | 商户编号（用 storeId） | 只读 |
| phone1 | string | 否 | — | 电话1 | 来自关联商户 contactPhone |
| phone2 | string | 否 | "" | 电话2 | 原型恒为空串 |
| addressLine1 | string | 否 | — | 地址栏1 | demo 表或解析 store.address |
| addressLine2 | string | 否 | — | 地址栏2 | |
| city | string | 否 | — | 城市 | |
| stateProvince | string | 否 | — | 州/省 | |
| zip | string | 否 | — | 邮编 | |
| region | string | 否 | — | 地区（大区名） | regions 查找 |
| dealer | string | 否 | MenuSifu | 经销商 | enterprise.name |
| versionCert | string | 否 | — | 版本证书信息 | `bid · POS v12.4 · License…` |

\*有门店上下文时从企业商户快照构建；否则 `FALLBACK_MASTER`。

证据：`StoreBasicProfileMaster`、`resolveStoreBasicProfileMaster`

### 3.3 417 可编辑字段（module setting text）

| 字段名 (fieldId) | 类型 | 必填 | 默认值 | 说明 | 约束/校验 |
|------------------|------|------|--------|------|-----------|
| `417-fax` | string | 否 | "" | 传真 | tel |
| `417-website` | string | 否 | "" | 网站 | url 占位 |
| `417-email` | string | 否 | "" | 邮箱 | email |
| `417-store-no` | string | 否 | "" | 门店编号 | |
| `417-merchant-group-no` | string | 否 | "" | 商家组编号 | |
| `417-merchant-code` | string | 否 | "" | 商家代号 | |
| `417-adp-co-code` | string | 否 | "" | ADP CO CODE（Payroll 导出） | 占位如 X0L |

只读 fieldId 映射见 `STORE_BASIC_PROFILE_MASTER_FIELD_MAP`（餐馆名、商户编号、电话、地址、经销商、证书、地区等）。

证据：`STORE_BASIC_INFO_SECTIONS`

### 3.4 StoreBusinessHourSchedule（418）

| 字段名 | 类型 | 必填 | 默认值 | 说明 | 约束/校验 |
|--------|------|------|--------|------|-----------|
| id | string | 是 | 生成 | 主键 | `bh-…` |
| name | string | 是 | — | 名称 | 非空 |
| openTime | string | 是 | `09:00` | 开始时间 | HH:mm；须 `< closeTime` |
| closeTime | string | 是 | `22:00` | 结束时间 | 可至 `24:00`（预设） |
| fromDate | string | 是 | 当月首日 | 生效起 | YYYY-MM-DD |
| toDate | string | 是 | ≥fromDate | 生效止 | YYYY-MM-DD |
| fromDay | StoreBusinessHourDay | 是 | mon | 由选中日推导 | |
| toDay | StoreBusinessHourDay | 是 | fri | 由选中日推导 | |
| activeDays | StoreBusinessHourDay[]? | 否 | 展开区间 | 精确选中日；与 from/to 区间相同时可省略 | 至少选 1 天 |

存储键：`418-business-hour-schedules`（JSON 数组）

### 3.5 StoreBusinessHourException（418 额外时间）

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | string | 是 | 生成 | 主键 |
| name | string | 是 | 额外时间 | 名称 |
| openTime / closeTime | string | 是 | 09:00 / 22:00 | 时段 |
| fromDate / toDate | string | 是 | — | 日期范围 |
| fromDay / toDay / activeDays | 同 schedule | | | |
| mode | ExceptionMode | 是 | include | 生效/不生效 |
| scheduleIds | string[] | 是（保存时 ≥1） | [] | 关联营业时间规则 id；空=待补全孤儿 |

存储键：`418-business-hour-exceptions`  

行为：独立设置项 **seq 583「额外时间」**（与 418 同组同级）提供总列表 CRUD；418 营业时间卡片下仍可添加；include=窗口内覆盖所选规则开闭市；exclude=窗口内暂停所选规则；删除 schedule 时从 scheduleIds 摘引用并立即落盘；孤儿经 583 顶栏待补全列表编辑/删除。

### 3.6 StoreClosingAlertLineConfig（582）

| 字段名 | 类型 | 必填 | 默认值 | 说明 | 约束/校验 |
|--------|------|------|--------|------|-----------|
| enabled | boolean | 是 | 产线默认 true | 该产线是否提示 | |
| minutes | number | 是 | 15 | 结束前提前分钟 | clamp 1～180，取整 |

聚合存储键：`582-closing-alert-by-line`（按 kiosk/emenu/sdi）  
遗留字段：`582-alert-minutes`、`582-c-line-*`（迁移后仍同步写出）

主开关：通用 module setting toggle（seq 582），见 `STORE_HOURS_OPERATION_TOGGLE_SEQ`

### 3.7 StoreRestaurantLogoValue（433）

| 字段名 | 类型 | 必填 | 默认值 | 说明 | 约束/校验 |
|--------|------|------|--------|------|-----------|
| dataUrl | string | 是 | — | 图片 Data URL | 非空 |
| source | upload\|library | 是 | upload | 来源 | |
| materialId | string? | 否 | — | 素材库 id | library 时 |
| name | string? | 否 | — | 展示名 | |

存储键：`433-restaurant-logo`  
上传：MIME ∈ jpeg/png/gif；≤ 1MB

---

## 4. 状态机

### 4.1 设置行 / 面板显隐（582）

**状态**：主开关 Off / On  

**流转**：

- Off → On：展开产线编辑面板（`setStoreClosingAlertPanelVisible`）  
- On → Off：隐藏面板；产线控件 disabled  

无独立业务状态机于 417/433。

### 4.2 营业时间实体生命周期（418）

**状态列表**：不存在 | 列表中 | 对话框编辑中 | 待确认删除  

**流转**：

- 新建 → 对话框校验通过 → 写入 schedules → 列表中（SI-12）  
- 列表中 → 编辑对话框 → 保存覆盖同 id  
- 列表中 → 删除确认 → 从数组移除  
- 额外时间同理（include/exclude）  

非法：名称为空、日期无效、结束日早于开始、未选星期、结束时间不晚于开始 → 对话框内错误文案，不落库。

证据：`saveScheduleDialog`、删除确认对话框

### 4.3 LOGO（433）

无 LOGO ↔ 有 LOGO；清除回到无。上传/素材选择覆盖。

---

## 5. 核心业务逻辑

### 5.1 解析当前门店主数据（SI-05）

**输入**：企业商户快照、连锁锚点门店、品牌上下文  
**输出**：`StoreBasicProfileMaster`  

**步骤**：

1. `resolveActiveStoreId`：优先 `readChainAnchorStoreId`，否则品牌视图首店，否则快照首店  
2. 找不到门店 → `FALLBACK_MASTER`  
3. `buildMasterFromStore`：店名/电话/地址/区域/经销商/证书  

证据：`module-settings-store-profile-master.ts`

### 5.2 营业时间首次初始化（SI-11）

**输入**：`418-business-hour-schedules`  
**输出**：非空 schedules 数组  

**步骤**：

1. 读 JSON；非空则 normalize 返回  
2. 空则 `defaultSchedulesFromLegacy`：若无旧纯文本则写入 All Day / 早上 / 中午 / 晚上 四条预设；否则一条「默认营业时间」  
3. **立即 write**，避免关联配置回显「未设置」  

证据：`readBusinessHourSchedules` 注释与实现

### 5.3 保存营业时间规则（SI-12）

见 §4.2 校验；`deriveFromToDays(selectedDays)` 后 `normalizeSchedule` 写入。

### 5.4 打烊提示读写与迁移（SI-18～SI-20）

**步骤**：

1. 首次访问 `ensureStoreClosingAlertMigrated`  
2. 若已有 by-line JSON → normalize  
3. 否则从遗留分钟数 + 产线 checkbox 迁移  
4. 每次 write 同步遗留字段  

分钟 `clampMinutes`：非有限 → 15；限制 1～180。

### 5.5 LOGO 本地上传（SI-15）

1. MIME / 大小校验，失败 `alert`  
2. 压缩或读 DataURL  
3. 可选写入素材库  
4. `writeStoreRestaurantLogo`  

证据：`applyLocalLogoFile`

### 5.6 模块设置行渲染分发（SI-04）

`main.ts`：按 seq 调用对应 `renderModuleSettingStore*` Row；582 为 toggle + panel；417/418/433 为专用行。

---

## 6. 交互与 UI 契约

| 控件/区域 | 行为 | 禁用/显隐 | 空态 | 文案/提示 | PRD |
|-----------|------|-----------|------|-----------|-----|
| 侧栏「门店信息」 | sheet 滑层，进设置 | 受视角/RBAC 过滤 | — | 门店信息 / Store information | SI-01 |
| 设置分组导航 | 按 groupOrder 三组 | — | — | 门店档案 / 品牌标识素材 / 营业与运营 | SI-02 |
| 417 只读输入 | 展示主数据 | readonly + muted | 主数据空串 | 分区：联系与展示、内部编码 | SI-06 |
| 417 可编辑输入 | `data-module-setting-text` | — | — | — | SI-07 |
| 418 列表 | 日程卡片下嵌套额外时间；孤儿顶栏待补全 | — | 虚线空态卡片 | 新建营业时间 / 卡片内 + 添加额外时间 | SI-11～14 |
| 418 对话框 | 名称、日期、星期芯片、开闭市 | 校验失败不关窗 | — | 错误：请填写名称等 | SI-12 |
| 433 预览 | 图 + 来源说明 | — | 暂未设置 LOGO | 上传/更换/清除 | SI-15～17 |
| 433 上传弹窗 | 本地 / 素材库 | — | 素材库空链到素材中心 | ≤1MB JPG/PNG/GIF | SI-15 |
| 582 主开关 | 开→下面板 | Off 隐藏面板 | — | 营业时间即将结束提示 | SI-18 |
| 582 产线表 | 启用 + 分钟 | 主开关关或未启用行则分钟 disabled | — | 结束前 N 分钟 | SI-19 |

---

## 7. 接口/存储契约

### 7.1 已存在（原型）

| 端点/存储键 | 方法 | 请求/写入 | 响应/读取 | 权限 |
|-------------|------|-----------|-----------|------|
| module setting text/json/checkbox/number（localStorage，键由 `moduleSettingStorageKey`） | R/W | fieldId + value | 同左 | 前端会话 |
| `getEnterpriseMerchantSnapshot()` | R | — | 企业/门店/商户 | 原型内存+持久化 |
| `material_images` 素材库 | R/W | LOGO 可选入库 | 分类+列表 | — |

### 7.2 建议契约（推测 → DIFF）

| 建议 API | 说明 |
|----------|------|
| `GET /stores/{storeId}/profile` | 返回 master 只读 + editable 分区 |
| `PATCH /stores/{storeId}/profile` | 仅可编辑字段 |
| `GET/PUT /stores/{storeId}/business-hours` | schedules + exceptions |
| `GET/PUT /stores/{storeId}/closing-alert` | masterEnabled + byLine |
| `GET/PUT /stores/{storeId}/logo` | 上传 URL 或 materialId，非长期存 DataURL |

### 7.3 下发域

| domainKey | 显示名 | 粒度 | pagePaths | 备注 |
|-----------|--------|------|-----------|------|
| `store.hours` | 营业时间 | store | `/stores/hours`、`/stores/settings`、`/stores/settings/store-hours-operation` | 含 418/582 |
| `store.profile` | 门店档案 | store | `/stores/settings`、`…/store-profile`、`…/brand-identity-assets` | 含 417/433；设计策略 **manual-only**（域表注释；接口字段待工程扩展） |

证据：`deployment-config-domains.ts`（v1.1 已登记 `store.profile`）

### 7.4 旧路由重定向（SI-30）

| 旧路径 | 新路径 |
|--------|--------|
| `/store/basic`（及子路径） | `/stores/settings/store-profile` |
| `/store/logo` | `/stores/settings/brand-identity-assets` |
| `/store/business-hours` | `/stores/settings/store-hours-operation` |
| 其余 `/store`、`/store/*` | `/stores/settings` |

证据：`main.ts`；`STORE_BASIC_SUBNAV` 标 `@deprecated`

数据库：`N/A` — 原型无表结构。

---

## 8. 权限与作用域

| 判定点 | 规则 | 证据 |
|--------|------|------|
| 当前门店上下文 | 417 主数据随锚点门店/品牌首店切换 | `resolveActiveStoreId` |
| 一级导航可见性 | 视角与 RBAC 过滤，避免重复「门店管理」项 | `platform-preset-tree.ts`、`nav-access.ts` |
| 设置页门店选择 | 连锁视角下配置页需先选门店（演示用例） | `docs/项目文档/演示账号-连锁视角联调用例.md` |
| 只读 vs 可编辑 | 平台同步字段不可改；联系/内部编码可改 | `isStoreBasicProfileReadOnlyFieldId` |

细粒度 permission code：原型未单独定义 → 工程实现需补齐（DIFF）。

---

## 9. 边界与并发

- **重复提交**：418/433/582 多为即时写 localStorage；工程侧应对 PUT 做幂等  
- **无数据**：418 空数组会自动灌预设；433 空态引导上传；582 默认产线全开 15 分钟  
- **跨页依赖**：营业时间 id 被品牌管理、前厅分类/品类设置引用（`foh-*-settings-ui`、`store-brand-management-ui`）；删除日程可能导致关联「未设置」  
- **遗留字段**：418 旧纯文本、582 旧分钟/checkbox 仅迁移用  
- **关闭时间 `24:00`**：预设允许；对话框校验 `openTime >= closeTime` 用字符串比较（需工程确认是否支持跨午夜）  

---

## 10. 实现检查清单

- [ ] SI-01 一级导航门店信息 → `/stores/settings`
- [ ] SI-02 三组顺序与 4 条 seq 齐全
- [ ] SI-05～07 417 只读主数据 + 可编辑分区落库
- [ ] SI-08 ADP CO CODE 可供薪资导出消费
- [ ] SI-11 首次进入营业时间有预设且持久化
- [ ] SI-12～14 日程/额外时间 CRUD + 校验文案
- [ ] SI-15～17 LOGO 上传/素材库/清除与格式限制
- [ ] SI-18～20 582 主开关 + 三产线独立分钟 + 旧数据迁移
- [ ] SI-21 `store.hours` 可纳入下发批次
- [ ] SI-29 `store.profile` 已登记并可被部署解析（417/433）
- [ ] SI-22 切换门店后 417 主数据刷新
- [ ] SI-30 旧 `/store/basic|logo|business-hours|*` 重定向正确
- [ ] SI-31 582 UI/API **无** POS 产线配置行
