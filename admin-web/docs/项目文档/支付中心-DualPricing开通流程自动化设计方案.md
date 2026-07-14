# 支付中心 · Dual Pricing 开通流程自动化设计方案

> **模块**：支付中心 → Dual Pricing（双重计价）  
> **版本**：v1.0  
> **日期**：2026-07-13  
> **状态**：待评审（设计已对齐 PRD v1.0 + 中台原型）  
> **需求等级**：AA  
> **关联**：PRD《Dual Pricing 开通流程自动化》· [支付中心-设置二级导航重设计方案](./支付中心-设置二级导航重设计方案.md) · [支付中心-卡交易与附加费用-语义重设计方案](./支付中心-卡交易与附加费用-语义重设计方案.md) · [云端下发本地-配置同步与下发记录设计方案](./云端下发本地-配置同步与下发记录设计方案.md)

---

## 一、背景与目标

### 1.1 现状

Dual Pricing（DP）开通依赖多部门人工：SFDC Payment Case → Payment 审核与费率配置 → Tech Support Case → 技术登录 POS 后台手工开 DP。SFDC 与 Payment 已打通，瓶颈在 **POS 侧人工配置**。

### 1.2 目标

| 目标 | 说明 |
|------|------|
| 消除 POS 人工配置 | 中台按 Tech Case 自动配置并下发 DP |
| 可运维可重试 | 任务状态可见；失败自动重试 ≤3 + 人工「更新」无上限 |
| 开通成功率 | > 99%（运营指标） |

### 1.3 本期范围

| 包含 | 不包含 |
|------|--------|
| 支付中心 Dual Pricing 业务入口（门店配置 + 任务列表） | 中台手工编辑门店 DP |
| SFDC Case → DP Task → 写 454/172 → 下发 POS | 信用卡价生成逻辑（POS 负责） |
| 开启 / 关闭 DP 共用状态机 | 同店开/关并发锁（业务已确认不存在） |
| 454/172 在 SFDC 驱动门店只读锁定 | 配置中心新入口「信用卡加价策略」（规划中，本期沿用支付设置 454） |
| 下发成功飞书技服通知 | 商品中心改价 |

---

## 二、方案选择

| 方案 | 做法 | 结论 |
|------|------|------|
| **1 DP Task + 复用下发队列** | Case → Task 状态机；配置写 454/172；下发走现有 DeploymentJob | **采用** |
| 2 仅扩通用下发记录 | Case 直接打 DeploymentBatch | 缺配置/下发分层与 PRD 任务语义 |
| 3 DP 专用推送通道 | 直调 POS API | 与离线/ACK 双轨，不采用 |

**采用方案 1**：支付中心运维页 + 现有卡付加价 SSOT（454）+ 云端下发机制一条链路。

---

## 三、导航与信息架构

### 3.1 入口

支付中心滑层与「设置」并列新增 **Dual Pricing**：

```text
支付中心
├── Dual Pricing          ← 新增（业务运维）
└── 设置                  ← 既有；含 card-fees · 454 / 172
```

| 项 | 建议值 |
|----|--------|
| 路由 | `/transactions/dual-pricing` |
| navigation | `children` 增加 `tx-dual-pricing`；`defaultChildPath` 可保持 `/transactions/settings` |

### 3.2 模块内 IA（已确认）

**单页门店配置列表**；无顶栏 Tab。任务仅通过行内「任务列表」**当前页弹层**查看与重试。

| 区域 | 职责 |
|------|------|
| 门店配置（整页） | 品牌下门店 DP 生效态只读列表 |
| 任务弹层 | 该门店开启/关闭任务；失败可「更新」 |

### 3.3 与设置 · 454 的关系（已确认）

- 454「卡付加价策略」、172「收据未付价格显示」仍在 **设置 · 卡支付规则与合规**
- **SFDC 驱动门店**：配置成功起 `lockedBySfdc=true`，454/172 **只读**，引导至 Dual Pricing
- **关闭任务下发成功**：解锁，允许非 SFDC 场景再手配
- **未锁定门店**：454 保持可编辑（演示 / 非 SFDC）

---

## 四、页面设计（对齐中台原型）

### 4.1 门店配置

**筛选**：门店名称（下拉选择，含「全部门店」）、MID · 查找 / 重置；切换门店下拉即筛选

| 列 | 说明 |
|----|------|
| 门店名称 | 门店展示名 |
| MID | 商户号 |
| Rate | 双重计价比例；未开通显示 `/` |
| Receipt (Unpaid) Display | 如 `Card Price`；未开通 `/` |
| 按钮 | 仅 **「任务列表」** → **当前页弹层**展示该门店任务（关闭 / 遮罩 / Esc） |

**交互**

- 只读，不提供中台手改 Rate / Receipt / 开关
- 行内「任务列表」不跳转路由，弹层内可「更新」失败任务；更新后弹层保持打开并刷新
- 空态：品牌下无门店或无任何 DP 配置 →「暂无门店 Dual Pricing 配置」
- 加载失败：异常态 + 重试

**相对 PRD 裁剪**：原型无独立「开关」「生效状态」「查看详情」；开启由 Rate/Receipt 有值表达，关闭成功后回 `/`。无顶栏「门店配置 / 任务列表」Tab。详情需求若后续补齐，可用行展开或抽屉，**不阻塞 P0**。

### 4.2 任务列表

| 列 | 说明 |
|----|------|
| 任务ID | 中台任务主键 |
| case number | SFDC Tech Case 编号 |
| 类型 | 开启 / 关闭 |
| rate | 开启任务携带的费率；关闭可仍展示历史 rate 或 `/`（与后端约定，建议关闭任务保留 Case 传入值便于审计） |
| 上游同步 | 见 §5.1 · `upstreamStatus`（SFDC → 商家后台） |
| POS 下发 | 见 §5.1 · `posStatus`（商家后台 → POS）；上游未成功时显示 `/` |
| 更新时间 | `YYYY-MM-DD HH:mm:ss`（窄列可上下折行） |
| 操作 | 上游同步失败 / POS 下发失败 → **更新**；其余 → `/` |

**建议筛选（P1）**：门店、任务类型、上游同步状态、POS 下发状态、时间范围。

---

## 五、状态机与重试

### 5.1 双层状态（已确认）

任务状态拆为两层，弹层/任务表用**两列**展示（不做单列拼接）。

| 字段 | 含义 | 取值 |
|------|------|------|
| `upstreamStatus` | 上游同步（SFDC → 商家后台：是否收到并落好变更） | `pending` 待同步 / `received` 已接收 / `failed` 同步失败 |
| `posStatus` | POS 下发（商家后台 → POS） | `none` 显示 `/`（上游未成功） / `pending` 待下发 / `ok` 下发成功 / `failed` 下发失败 |

```text
上游: 待同步 ──成功──▶ 已接收 ──▶ POS: 待下发 ──成功──▶ 下发成功（终态）
         │                │              │
         │失败            │              │失败
         ▼                │              ▼
      同步失败            │         下发失败
      （pos=/）           │              │
         │                └──────────────┘
         └──── 自动重试 ≤3 / 人工「更新」重做当前失败层 ──┘
```

开启 / 关闭共用上述状态机；关闭传参更少（关开关、清卡价展示相关配置）。

**旧单状态 → 双字段映射（兼容）**

| 旧 `status` | `upstreamStatus` | `posStatus` |
|-------------|------------------|-------------|
| `pending_config` | `pending` | `none` |
| `config_ok` | `received` | `pending` |
| `config_failed` | `failed` | `none` |
| `dispatch_ok` | `received` | `ok` |
| `dispatch_failed` | `received` | `failed` |

### 5.2 重试策略（已确认）

| 类型 | 规则 |
|------|------|
| 自动 | 上游同步失败 / POS 下发失败后入**统一任务队列**，最多 **3** 次 |
| 手动「更新」 | 仅上述失败层可点；无上限；`upstreamStatus=failed` 重做上游同步，`posStatus=failed` 重做 POS 下发 |
| 调度 | 自动 + 手动均走任务队列，与现有中台下发一致 |
| POS 离线 | 上游可已接收；POS 下发挂起至在线 ACK |

### 5.3 成功后副作用

1. 刷新门店 Snapshot（开：Rate + Receipt=`Card Price`；关：Rate/Receipt → `/`）——仅当 `posStatus=ok`
2. `posStatus=ok` → 飞书技服群同步 Case + 任务双层状态，便于关 Case
3. 满 3 次仍失败：停失败层，**不**自动关 Case

### 5.4 并发

业务上不存在同店同时开/关。若异常撞车：后到任务 `upstreamStatus=failed`，reason 记「存在进行中任务」。

---

## 六、数据模型与配置写入

### 6.1 DpStoreSnapshot（门店 Tab）

| 字段 | 说明 |
|------|------|
| `storeId` | 门店 ID |
| `storeName` | 展示名 |
| `mid` | MID |
| `rate` | 可空；空 → UI `/` |
| `receiptUnpaidDisplay` | 可空；开启默认 `Card Price`（对应 POS `DisplayCardPrice` / 172=`card`） |
| `sourceCaseId` | 最近驱动 Case |
| `lockedBySfdc` | 是否锁定设置页 454/172 |
| `updatedAt` | 更新时间 |

### 6.2 DpTask（任务）

| 字段 | 说明 |
|------|------|
| `taskId` | 任务 ID |
| `caseNumber` | SFDC case number |
| `storeId` / `mid` | 门店定位 |
| `type` | `open` \| `close` |
| `rate` | 开启必填；关闭可选 |
| `upstreamStatus` | §5.1 上游同步 |
| `posStatus` | §5.1 POS 下发 |
| `autoRetryCount` | 自动重试已用次数（0–3） |
| `lastError` | 最近失败原因 |
| `deploymentJobId` | 关联下发 Job |
| `updatedAt` | 更新时间 |

### 6.3 配置阶段写入（454 / 172）

| 任务类型 | 写入 |
|----------|------|
| 开启 | `454.mode=dual-pricing`，`454.percent=rate`；`172.priceType=card`（Card Price） |
| 关闭 | `454.mode=none`，清空 percent；Receipt 相关恢复默认或清空（与 POS 约定） |

上游同步成功（`upstreamStatus=received`）并完成云端写入 → `posStatus=pending` → 创建 DeploymentJob，建议配置域 **`payment.card-pricing`**（覆盖 454+172），复用 [云端下发](./云端下发本地-配置同步与下发记录设计方案.md) Push/Pull/ACK。

POS 落库后：

- Dual Pricing 开关开/关
- rate 按 Case 赋值
- Receipt (Unpaid) 按当前门店配置；**打印时实时读配置**，不依赖本次下发时刻（PRD 已确认）

### 6.4 端到端时序（开启）

```text
SFDC Tech Case
  → license / 同步服务
  → 中台创建 DpTask(upstream=pending, pos=none)
  → 写 454/172 + lockedBySfdc
  → upstream=received | failed（自动重试）
  → DeploymentJob 下发 POS（pos=pending）
  → POS ACK → pos=ok | failed（自动重试）
  → 飞书通知技服关 Case
```

---

## 七、异常与边界

| 场景 | 处理 |
|------|------|
| 列表加载失败 | 异常态 + 重试 |
| 无门店 / 无 DP 数据 | 空态文案见 §4.1 |
| 「更新」入队失败 | Toast；任务状态不变 |
| 开启 Case 缺 MID / rate | 直接上游同步失败；补数后「更新」 |
| POS 离线 | 见 §5.2 |
| 品牌切换 | 沿用全局品牌切换，本页无额外逻辑 |

---

## 八、对其它产品线影响

| 产品线 | 影响 |
|--------|------|
| 支付中心 · 设置 454/172 | SFDC 门店只读锁定；未锁定行为不变 |
| 云端下发 / 下发记录 | 新增域或 Job 类型关联 DP Task（P1 互链） |
| POS | 接收下发、开关与 rate、小票按配置实时展示 |
| 商品中心 | 仍维护现金价；卡价由 POS 生成，无改动 |
| 财务 307 | 对内成本率，无关对客 DP |

---

## 九、分期与前端落地要点（admin-web）

### 9.1 分期

| 期 | 内容 |
|----|------|
| **P0** | 导航 + 两 Tab（原型字段）+ Task 状态机联调 + 454 锁定文案 + 失败「更新」+ 飞书（后端） |
| **P1** | 任务多维筛选、失败原因详情、与系统下发记录互链 |
| 后续 | 配置中心「信用卡加价策略」入口规划；门店行详情（若产品补需求） |

### 9.2 admin-web 改动清单（示意）

| 位置 | 改动 |
|------|------|
| `src/config/navigation.ts` | 支付中心 `children` 增加 Dual Pricing |
| 新页面模块 | 门店表 + 任务表（筛选、空态、状态标签、「更新」） |
| `module-settings-payment-card-fees-ui.ts` | 读 `lockedBySfdc`：灰显 454/172 + 链到 Dual Pricing |
| 路由 / main | `/transactions/dual-pricing`、`.../tasks` |

---

## 十、已确认决策摘要

1. 入口：支付中心滑层一级 **Dual Pricing**（非塞进设置组）
2. IA：单页门店列表；行内「任务列表」当前页弹层（无顶栏 Tab）
3. 列表字段：对齐中台原型（空值 `/`；操作「更新」/「/」）
4. 技术路径：DP Task + 复用下发队列；配置写 454/172
5. SFDC 驱动门店 454/172 只读；关闭下发成功后解锁
6. 自动重试 ≤3；手动无上限；统一任务队列
7. 无同店并发锁；小票 Display 由 POS 实时读配置
8. 任务状态两列：`upstreamStatus`（上游同步）+ `posStatus`（POS 下发）

---

## 十一、附录

- 原始需求：Dual Pricing 开通流程自动化.pdf（v1.0，何剑）
- 原型：门店列表（门店名称/MID/Rate/Receipt/任务列表）；任务列表两列状态（上游同步 / POS 下发）
- 现有实现锚点：`CARD_PRICING_STRATEGY_SEQ = 454`，`RECEIPT_UNPAID_PRICE_DISPLAY_SEQ = 172`（`module-settings-payment-card-fees-ui.ts`）
