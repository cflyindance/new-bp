# 支付中心 · Dual Pricing 开通流程自动化 — 实现计划

> **版本**：v1.1 · 2026-07-13  
> **状态**：P0 骨架已落地（双层状态）；Step 7 联调验收待做  
> **关联设计**：[支付中心-DualPricing开通流程自动化设计方案](./支付中心-DualPricing开通流程自动化设计方案.md)  
> **范围**：admin-web P0 前端可演示闭环；后端/SFDC/POS/飞书以接口契约与联调清单列出（本仓外或后继迭代）

---

## 一、目标与验收

### 1.1 P0 验收（admin-web）

| # | 验收项 |
|---|--------|
| 1 | 支付中心滑层出现 **Dual Pricing**，与「设置」并列 |
| 2 | 单页门店列表：筛选（门店下拉/MID + 查找/重置）+ 表列对齐原型；空值 `/` |
| 3 | 行内「任务列表」→ **当前页弹层**，按该门店过滤 |
| 4 | 任务表两列：**上游同步** / **POS 下发**；仅上游失败或 POS 失败显示「更新」，其余 `/` |
| 5 | 点击「更新」后 `manualRetryCount++`（demo：推进至 `received` + `ok` 并回写 Snapshot） |
| 6 | 当前门店若 `lockedBySfdc`：设置 · 454/172 灰显 + 链到 Dual Pricing |
| 7 | 空态 / 加载失败（可用 mock 开关模拟）可展示 |

### 1.2 非本仓 P0（联调清单，不阻塞前端骨架）

| 系统 | 能力 |
|------|------|
| 同步服务 | SFDC Tech Case → 创建 DpTask |
| 中台任务服务 | 双层状态机、自动重试 ≤3、手动更新入队 |
| 配置 + 下发 | 写 454/172、DeploymentJob `payment.card-pricing`、POS ACK |
| 飞书 | `posStatus=ok` 后通知技服群 |

---

## 二、对标实现与文件结构

### 2.1 对标页面

| 能力 | 对标 |
|------|------|
| 滑层一级 + 页内 Tab | `finance-register-audit-pages.ts` |
| 筛选条 + 重置 | `notifications-hub-pages.ts`（补「查找」按钮） |
| Mock 表 + bind | `order-list-pages.ts` / finance audit 可变状态 |
| main 挂载 | `isXxxPath` → `wideContentLayout` → render → `bindXxxUi(mount)` |

### 2.2 新建文件

```text
src/config/
  dual-pricing-types.ts   # DpStoreSnapshot, DpTask, status/type 枚举与文案
  dual-pricing-seed.ts    # 演示种子（含上海/北京有值、南京 /、失败任务）
  dual-pricing-store.ts   # list/filter、retryTask、lockedBySfdc 查询
  dual-pricing-ui.ts      # path 常量、is*、render*、bind*
```

### 2.3 必改现有文件

| 文件 | 改动 |
|------|------|
| `src/config/navigation.ts` | `transactions.children` 增加 Dual Pricing |
| `src/main.ts` | import、path 判断、wide layout、render、bind |
| `src/config/module-settings-payment-card-fees-ui.ts` | SFDC 锁定只读 + 引导链接 |
| （可选）`src/i18n.ts` | Dual Pricing 中英文标题（若侧栏走 i18n） |

---

## 三、分步实施（按顺序）

### Step 1 — 类型与种子数据 ✅

**文件**：`dual-pricing-types.ts`、`dual-pricing-seed.ts`

- 定义（对齐设计 §5）：
  - `DpUpstreamStatus`：`pending` | `received` | `failed`（上游同步 SFDC → 商家后台）
  - `DpPosStatus`：`none` | `pending` | `ok` | `failed`（POS 下发；`none` UI 显示 `/`）
  - `DpTaskType`：`open` | `close`
  - `DpStoreSnapshot`、`DpTask`（`upstreamStatus` + `posStatus`）
- 文案 map + `isDpRetryableTask`（仅上游失败或 POS 失败可重试）
- 种子：上海/北京（Rate + Card Price）、南京（`/`）；各双层状态组合；含可「更新」失败样例；至少 1 店 `lockedBySfdc: true`

**完成标准**：类型可编译；seed 可被 store import。

---

### Step 2 — Store（查询 / 过滤 / 重试） ✅

**文件**：`dual-pricing-store.ts`

| API | 行为 |
|-----|------|
| `listDpStores({ storeId?, mid? })` | 门店下拉 + MID；无数据返回 `[]` |
| `listDpTasks({ storeId?, mid?, upstreamStatus?, posStatus? })` | P0 门店过滤；P1 再加类型/时间 |
| `retryDpTask(taskId)` | 仅 `isDpRetryableTask`；`manualRetryCount++`；demo 直接 `upstream=received` + `pos=ok` 并回写 Snapshot |
| `isStoreLockedBySfdc(storeId)` | 供 card-fees 只读 |
| `getDpStore(storeId)` | 单店 |

持久化：P0 模块级内存；刷新保留可后续挂 `localStorage`。

**完成标准**：过滤/重试行为正确。

---

### Step 3 — UI：单页门店表 + 任务弹层 ✅

**文件**：`dual-pricing-ui.ts`

常量：

- `DUAL_PRICING_PATH = "/transactions/dual-pricing"`
- `DUAL_PRICING_TASKS_PATH`：旧书签兼容，重定向到主路径并打开对应弹层

导出：

- `isDualPricingPath` / `renderDualPricingPageContent` / `bindDualPricingUi`

**布局**：无顶栏 Tab；单页门店列表；行内「任务列表」→ 当前页弹层。

**门店页**

- 筛：门店名称（下拉，含「全部门店」）、MID、查找、重置
- 表列：门店名称 | MID | Rate | Receipt (Unpaid) Display | 按钮
- Rate/Receipt 空 → `/`

**任务弹层表**

- 表列：任务ID | case number | 类型 | rate | **上游同步** | **POS 下发** | 更新时间 | 操作
- 操作：`isDpRetryableTask` →「更新」；否则 `/`

**空态文案**：`暂无门店 Dual Pricing 配置` / `暂无 Dual Pricing 任务`

**完成标准**：seed 可点通弹层与重试；`tsc --noEmit` 通过。

---

### Step 4 — 导航挂载

**文件**：`navigation.ts`

在 `transactions.children` 中 **设置之前** 增加：

```ts
{
  id: "tx-dual-pricing",
  title: "Dual Pricing",
  titleEn: "Dual Pricing",
  path: "/transactions/dual-pricing",
}
```

`defaultChildPath` 保持 `/transactions/settings`（商户默认进设置；技服可从滑层进 DP）。

**完成标准**：侧栏滑层可见 Dual Pricing 入口。

---

### Step 5 — main.ts 路由接入

**文件**：`src/main.ts`

1. import `isDualPricingPath`、`renderDualPricingPageContent`、`bindDualPricingUi`
2. 在 path 分支中增加 `isDualPricing`（与 `isFinanceRegisterAudit` 同类）
3. 纳入 `wideContentLayout`
4. content 三元分支渲染 `renderDualPricingPageContent(path)`
5. mount 后 `bindDualPricingUi(mount)`

**完成标准**：`#/transactions/dual-pricing` 与 `.../tasks` 可打开，无控制台报错。

---

### Step 6 — 454 / 172 SFDC 锁定

**文件**：`module-settings-payment-card-fees-ui.ts`（及必要时 main 行包装）

1. 增加 `readCardPricingLockedBySfdc()`：当前作用域门店调 `isStoreLockedBySfdc`（demo 用默认演示门店 ID）
2. `renderCardPricingStrategyHtml` / `renderReceiptUnpaidPriceDisplayHtml`：锁定时
   - radio / input `disabled`
   - 增加说明：「由 Dual Pricing 任务管理」+ `<a href="#/transactions/dual-pricing">前往 Dual Pricing</a>`
3. `bindCardFeesEditors`：锁定时不 `persist`（或 persist 前 no-op）

**完成标准**：种子中锁定门店下，设置 · 卡付规则 454/172 不可改且可跳转。

---

### Step 7 — 联调契约与 P0 收尾

**前端**

- [ ] 空态：临时清空 seed 验证文案
- [ ] 异常态：store 抛错或 `?mockError=1` 验证重试按钮
- [ ] `npm run build` 通过

**与后端约定（文档化即可，本步可写在本计划附录）**

| 方法 | 路径（建议） | 说明 |
|------|--------------|------|
| GET | `/api/dual-pricing/stores` | query: storeName, mid |
| GET | `/api/dual-pricing/tasks` | query: storeId, mid, type, upstreamStatus, posStatus, from, to |
| POST | `/api/dual-pricing/tasks/:id/retry` | 手动更新 |
| GET | `/api/dual-pricing/stores/:id/lock` | 或嵌在 store 字段 `lockedBySfdc` |

P0 用 seed；P0.5 将 store 换为 fetch，UI 不变。

---

## 四、P1（本计划不实施，仅排期）

| 项 | 说明 |
|----|------|
| 任务多维筛选 | 类型、状态、时间范围 |
| 失败原因列/详情 | 展示 `lastError` |
| 下发记录互链 | `deploymentJobId` → 系统设置下发记录 |
| localStorage / API | 替换内存 seed |
| 门店行详情 | PRD「查看」若产品补回 |

---

## 五、风险与注意

| 风险 | 缓解 |
|------|------|
| 支付中心仅有设置，宽页布局未测 | 严格抄 finance register-audit 的 wideContent 分支 |
| 454 锁定门店 ID 与品牌切换不一致 | 锁定读取与当前 session 门店/品牌选择器同一数据源 |
| 「查找」与即时过滤心智混 | P0 明确：点「查找」才过滤；「重置」清空条件并刷新全量 |
| 关闭任务 rate 展示 | 种子保留 Case rate 便于审计；与后端字段对齐 |

---

## 六、建议工时（前端）

| Step | 估时 |
|------|------|
| 1–2 类型/store | 0.5d |
| 3 UI | 1d |
| 4–5 导航 + main | 0.5d |
| 6 454 锁定 | 0.5d |
| 7 验收 + build | 0.5d |
| **合计** | **约 3d** |

后端状态机 + 下发 + 飞书另估（中台/POS 排期）。

---

## 七、实施顺序检查清单

```text
[x] Step 1  types + seed  （2026-07-13：dual-pricing-types.ts / dual-pricing-seed.ts）
[x] Step 2  store  （2026-07-13：dual-pricing-store.ts）
[x] Step 3  ui（Tab + 两表）（2026-07-13：dual-pricing-ui.ts）
[x] Step 4  navigation（2026-07-13：transactions.children + flattenNavPaths）
[x] Step 5  main.ts（2026-07-13：import / wideLayout / render / bind / 标题）
[x] Step 6  card-fees lock（2026-07-13：454/172 SFDC 只读 + 种子门店对齐 DEFAULT_DEMO_STORE_ID）
[ ] Step 7  build + 验收表 §1.1
```

确认本计划后，按 Step 1 → 7 在 admin-web 落地；需要我直接开工实现时说一声即可。
