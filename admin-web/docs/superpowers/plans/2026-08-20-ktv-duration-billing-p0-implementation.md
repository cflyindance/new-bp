# KTV 包间按时计价 · P0 实现计划

> 权威功能设计：[按时计价规则 README](../specs/ktv-duration-billing/README.md)

> **2026-08-20 配置口径更新：** seq 443「按照时长收费」及 KTV/VIP 场景选择已移除。规则区改为「计时与自助餐规则」组级独立入口；本计划中的历史步骤若与权威 README 冲突，以 README 为准。

> **For agentic workers:** 按 Task 顺序执行；每 Task 完成可验证一步后 **双写** 主工作区 `admin-web/`。Commit 仅为检查点，**禁止自动 commit/push**。

**Goal:** 落地 P0：通用按时计价规则 CRUD（单价/连续区间）+ 餐位平面图桌位绑定 + eMenu 开单/结束计时 + 计时费加收项。

**Architecture:**

- **规则 SSOT：** `DurationBillingRule[]` 按门店隔离存储（首期 localStorage，键与餐位平面图模式对齐）。
- **绑定：** `FloorPlanTable.durationBillingRuleId` 指向规则 id；开单时复制 `ruleSnapshot` 到会话。
- **运行时：** eMenu 扩展 `durationBillingSession`（idle → timing → ended）；结束授权复用 AdminLogin + seq 346 语义。
- **职责分离：** 规则管理和桌位绑定不依赖 seq 443；674/577 仅展示，不参与计价。

**Tech Stack:** admin-web TypeScript（module-settings、floor-plan-ui、main.ts）；eMenu React（vendor/emenu-new）；Node verify 脚本；自定义对话框 API。

**Spec:** `docs/superpowers/specs/ktv-duration-billing/README.md`

**Worktree:** `F:\米聚\GitHub仓库\new-bp-worktrees\ktv-duration-billing`，分支 `wt/ktv-duration-billing`

**双写：** 权威编辑在 worktree；相同 patch 镜像到 `F:\米聚\GitHub仓库\new-bp\admin-web\`。

**Git：** 每 Task 末尾可 commit 检查点；仅用户明确要求时提交。

**P0 不做：** 时段阶梯计价（P1）、批量绑定（P2）、服务端 API / 多店下发（P1）、POS 产线。

---

## 文件结构（P0 新增/修改）

| 文件 | 职责 |
|------|------|
| `src/config/duration-billing-rules-store.ts` | 规则 CRUD、按门店读写、校验、摘要文案 |
| `src/config/duration-billing-rules-ui.ts` | 组级规则列表 + 抽屉编辑 UI |
| `src/config/module-settings-duration-billing-scenes-ui.ts` | 规则管理区独立挂载 |
| `src/main.ts` | 规则区渲染与抽屉绑定 |
| `src/config/floor-plan-ui.ts` | 桌位 `durationBillingRuleId`、下拉、角标、校验 |
| `scripts/verify-duration-billing-rules-store.mjs` | 规则 store 专项断言（新建） |
| `scripts/verify-floor-plan-duration-billing-bind.mjs` | 平面图绑定字段断言（新建） |
| `vendor/emenu-new/src/utils/durationBilling.js` | 单价计价、会话状态、预估费 |
| `vendor/emenu-new/src/hooks/useDurationBilling.js` | 计时 tick、状态读写、与订单扩展字段同步 |
| `vendor/emenu-new/src/pages/Landing/index.jsx` | 首页开单计时入口、计时条 |
| `vendor/emenu-new/src/components/DurationBilling/` | EndTimingDialog、TimingBar（新建目录） |
| `scripts/verify-emenu-duration-billing-p0.mjs` | eMenu 关键符号断言（新建） |

eMenu 改动需同步：`admin-web/vendor/emenu-new/` 与 worktree 内同路径；若 dist 镜像用于预览，按项目惯例决定是否同步 `dist/emenu-new/`（本计划以 vendor 源码为准）。

---

## 依赖顺序

```text
Task 1–3（规则 store + 独立规则 UI）
    ↓
Task 4–5（平面图绑定，依赖规则列表可读）
    ↓
Task 6–9（eMenu 运行时，依赖绑定 + 规则快照）
    ↓
Task 10（文档与验收勾选）
```

---

## Task 1：规则数据模型与 store（先 RED）

**Files:**

- Create: `src/config/duration-billing-rules-store.ts`
- Create: `scripts/verify-duration-billing-rules-store.mjs`

- [x] **Step 1: 实现类型与存储键**

```typescript
// 与设计 spec §4.4 一致
export type DurationBillingScene = "ktv" | "vip-room";
export type DurationBillingRule = { /* id, name, scenes, enabled, pricing, storeIds, lines, ... */ };

const STORAGE_KEY_PREFIX = "bplant-duration-billing-rules:v1";
// storageKeyForStore(storeId) => `${PREFIX}:store:${encodeURIComponent(storeId)}`
```

- [x] **Step 2: 实现 CRUD API**

| 函数 | 行为 |
|------|------|
| `listDurationBillingRules(storeId)` | 返回该门店规则数组 |
| `getDurationBillingRule(storeId, id)` | 单条或 null |
| `upsertDurationBillingRule(storeId, draft)` | 校验后写入 |
| `deleteDurationBillingRule(storeId, id)` | 删除；返回是否成功 |
| `countTableBindings(storeId, ruleId)` | 供删除确认（Task 4 接平面图扫描） |
| `formatRulePricingSummary(rule)` | 列表摘要，如 `¥5/30min` |
| `validateDurationBillingRule(draft)` | 名称、场景、单价字段 |

- [x] **Step 3: 单价与区间模式校验**

- `amount > 0`，`unitMinutes` 为正整数（建议 1–1440）。
- 新规则写入 `scenes: []`，编辑旧规则保留历史场景字段。
- P0 允许 `pricing.type === "unit" | "interval"`；legacy `tiered` 只读兼容。

- [x] **Step 4: verify 脚本**

```bash
node admin-web/scripts/verify-duration-billing-rules-store.mjs
```

断言：导出函数存在、`STORAGE_KEY_PREFIX`、`validateDurationBillingRule`、`formatRulePricingSummary`。

- [x] **Step 5: 双写主工作区**

---

## Task 2：组级独立规则列表 UI

**Files:**

- Create: `src/config/duration-billing-rules-ui.ts`
- Modify: `src/config/module-settings-duration-billing-scenes-ui.ts`
- Modify: `src/main.ts`

- [x] **Step 1: 规则列表 HTML**

「计时与自助餐规则」组内独立挂载，不依赖设置项目录遍历：

- 标题「按时计价规则」
- 表格：名称 / 计价摘要 / 状态 / 操作（编辑、停用、删除）
- 「+ 新建规则」按钮

- [x] **Step 2: 空态**

无规则时展示说明 + 新建引导。

- [x] **Step 3: 删除确认**

调用 `openConfirmDialog`；若 `countTableBindings > 0`，正文含绑定桌位数。

- [x] **Step 4: main.ts 接入**

- 在组级设置内容末尾独立渲染规则区。
- `bindDurationBillingRulesUi()` 绑定列表与抽屉事件。
- 旧 seq 443 值无论为 0 或 1 均不影响规则区。

- [x] **Step 5: 源码与专项验证**

前厅设置 → 计时与自助餐规则 → 始终可见规则列表。

- [x] **Step 6: 双写**

---

## Task 3：规则编辑抽屉（单价模式 P0）

**Files:**

- Modify: `src/config/duration-billing-rules-ui.ts`
- Modify: `src/main.ts`

- [x] **Step 1: 抽屉结构**

- 右侧滑出，宽 `min(480px, 100%)`，与现有设置抽屉 z-index 对齐。
- 字段：名称、计价方式、启用开关、单价配置或连续区间配置、备注。
- 底部：取消 / 保存。

- [x] **Step 2: 移除场景约束**

不显示 KTV/VIP 场景字段；两种计价方式互斥，切换时保留当前抽屉周期内草稿。

- [x] **Step 3: 保存流程**

- `validateDurationBillingRule` → 失败 `showAppToast`。
- 成功 → `upsert` → 刷新列表 → 关闭抽屉。

- [x] **Step 4: Esc / 遮罩关闭**

抽屉关闭不丢列表滚动位置。

- [x] **Step 5: 双写**

---

## Task 4：餐位平面图绑定字段

**Files:**

- Modify: `src/config/floor-plan-ui.ts`
- Modify: `src/config/duration-billing-rules-store.ts`（`countTableBindings` 实现）
- Create: `scripts/verify-floor-plan-duration-billing-bind.mjs`

- [x] **Step 1: 扩展 `FloorPlanTable`**

```typescript
durationBillingRuleId?: string | null;
```

- [x] **Step 2: 桌位编辑表单**

- 当 `category === "private"` 且存在启用规则时，展示「按时计价规则」下拉。
- 选项：「不绑定」+ 全部启用规则。
- 否则字段隐藏。

- [x] **Step 3: 画布角标**

已绑定桌位渲染小角标（CSS class `floor-plan-table--duration-billing`），tooltip 规则名。

- [x] **Step 4: 持久化**

随现有 `localStorage` 平面图 JSON 一并读写；collection diff / 下发 buffer 若已注册，增量扩展字段。

- [x] **Step 5: `countTableBindings`**

扫描当前门店所有 area.tables 统计 `durationBillingRuleId === id` 数量。

- [x] **Step 6: verify + 双写**

```bash
node admin-web/scripts/verify-floor-plan-duration-billing-bind.mjs
```

断言：`durationBillingRuleId`、表单 field、`floor-plan-table--duration-billing`。

---

## Task 5：eMenu 配置下发桥接（原型期）

**Files:**

- Modify: `src/config/duration-billing-rules-store.ts` 或新建 `duration-billing-rules-export.ts`
- Modify: eMenu mock / embedded API（若已有 table 配置通道）

- [x] **Step 1: 明确 P0 配置来源**

首期可选方案（实现时二选一，优先 A）：

| 方案 | 说明 |
|------|------|
| A | eMenu dev 读 `localStorage` 同源键（与 admin-web 同域预览时） |
| B | 扩展 embedded-mock-api / table 接口返回 `durationBillingRuleId` + 规则快照 |

- [x] **Step 2: 桌位列表带绑定信息**

ChooseTable 可用的 table 对象含 `durationBillingRuleId`；可按 id 拉规则摘要。

- [x] **Step 3: 文档注释**

在 store 文件头注明 P0 配置桥接方式，P1 接正式 API。

- [x] **Step 4: 双写**

实现采用方案 A：eMenu 同源预览通过 `menusifu-scope-filter-meta` 解析门店，并由 `services/tables.js` 对接口桌位数据执行精确 ID 桥接。P1 接正式配置 API。专项验证：`node scripts/verify-emenu-duration-billing-bridge.mjs`。

---

## Task 6：eMenu 计价工具与会话模型

**Files:**

- Create: `vendor/emenu-new/src/utils/durationBilling.js`
- Create: `vendor/emenu-new/src/hooks/useDurationBilling.js`

- [x] **Step 1: 会话类型**

```javascript
// status: 'idle' | 'timing' | 'ended'
// ruleSnapshot, startedAt, endedAt, estimatedFee, finalFee, authorizedBy
```

- [x] **Step 2: 单价计算**

```javascript
export function calcUnitPricingFee(ruleSnapshot, startedAt, endedAt) {
  // units = ceil(durationMs / unitMinutes / 60000) when roundUp
  // return units * amount
}
```

- [x] **Step 3: Hook 职责**

- 读写在 `emenuKioskextendedInfo.durationBilling` 或等价扩展字段。
- `startTiming(ruleSnapshot)` / `endTiming(authorizedBy)`。
- 计时中每秒/每 30s 更新 `estimatedFee`（P0 可 30s）。

- [x] **Step 4: 双写 vendor**

实现备注：新增纯函数计价工具和 `useDurationBilling`；会话写入 `emenu_table.currentOrder.emenuKioskextendedInfo.durationBilling`，每 30 秒更新预估费用，结束时固化最终费用和授权人。专项验证：`node scripts/verify-emenu-duration-billing-session.mjs`。

---

## Task 7：Landing 首页 · 开单计时入口

**Files:**

- Modify: `vendor/emenu-new/src/pages/Landing/index.jsx`
- Create: `vendor/emenu-new/src/components/DurationBilling/TimingBar.jsx`
- Create: `vendor/emenu-new/src/components/DurationBilling/StartTimingButton.jsx`

- [x] **Step 1: 展示条件**

- 当前桌位有 `durationBillingRuleId` 且规则启用。
- 不读取 seq 443；该总闸已按权威规格移除。
- 会话 `status === 'idle'`。

- [x] **Step 2: UI**

- 包间名 + 规则摘要。
- 主按钮「开单计时」——**仅服务员已登录**可见（复用 Landing 现有 `adminLogin` / staff 状态）。

- [x] **Step 3: 点击开单**

- 拉规则快照 → `startTiming` → Toast 成功 → 进入 timing UI。

- [x] **Step 4: TimingBar**

- `status === 'timing'` 时顶部固定：已用时长 + 预估费用。

- [x] **Step 5: 计时中点单**

不阻断现有 Landing 分类/商品入口。

- [x] **Step 6: 双写**

实现备注：Landing 仅在桌位存在启用规则快照、会话空闲且服务员已登录时展示「开单计时」；计时中在页头下方固定展示秒级时长与预估费用，不阻断原点单入口。专项验证：`node scripts/verify-emenu-duration-billing-landing.mjs`。

---

## Task 8：结束计时 · 服务员授权

**Files:**

- Create: `vendor/emenu-new/src/components/DurationBilling/EndTimingDialog.jsx`
- Modify: `vendor/emenu-new/src/pages/Landing/index.jsx`
- Modify: `vendor/emenu-new/src/components/AdminLogin/index.jsx`（如需独立 permission 类型）

- [x] **Step 1: 结束入口**

- 「结束计时」仅服务员可见（弱样式 / 服务员菜单）。
- 食客模式不渲染。

- [x] **Step 2: 确认对话框**

- 展示：时长、计时费（final 预估）、点单费小计（从 orders 读）。
- 使用项目内 Dialog 组件（非 `window.confirm`）。

- [x] **Step 3: AdminLogin 授权**

- 确认后弹出 AdminLogin（与 SwitchTable 等一致）。
- 校验通过 → `endTiming(staffId)` → 写入 `finalFee`。

- [x] **Step 4: 失败处理**

密码错误 Toast；保持 timing。

- [x] **Step 5: 双写**

实现备注：服务员点击结束后锁定预览结束时刻，确认框展示时长、计时费和订单小计；AdminLogin 验证成功后回传 staff id 并按同一时刻固化最终费用，验证失败保持计时。专项验证：`node scripts/verify-emenu-duration-billing-end.mjs`。

---

## Task 9：计时费写入订单加收项

**Files:**

- Modify: `vendor/emenu-new/src/hooks/useDurationBilling.js`
- Modify: 订单生成/更新路径（参照 `services/orders.js` `generateOrder` 或 cart checkout）

- [x] **Step 1: 加收项结构**

- 名称：「包间计时费」或 i18n key。
- 金额：`finalFee`。
- 与商品 line items 分离。

- [x] **Step 2: 触发时机**

`endTiming` 成功后写入当前 order surcharge；若尚无 order 则创建/挂载扩展字段待结账合并。

- [x] **Step 3: 结账页展示**

购物车/结账摘要分开展示「计时费」「商品费」（查阅 PendingOrders / checkout 组件插入一行）。

- [x] **Step 4: verify**

```bash
node admin-web/scripts/verify-emenu-duration-billing-p0.mjs
```

断言：`calcUnitPricingFee`、`startTiming`、`EndTimingDialog`、无 `window.confirm`。

- [x] **Step 5: 双写**

实现备注：结束会话生成 `EMENU_DURATION_BILLING` 独立 surcharge，订单生成时保存在 `emenuKioskextendedInfo.durationBilling` 与 `surcharges`，不伪造 POS `orderCharges` 策略 ID；待下单与已下单摘要分别展示商品费和计时费。专项验证：`node scripts/verify-emenu-duration-billing-surcharge.mjs`。

---

## Task 10：文档、索引与验收

**Files:**

- Modify: `docs/superpowers/specs/ktv-duration-billing/README.md`
- Create: `scripts/verify-emenu-duration-billing-p0.mjs`

- [x] **Step 1: README 增加本 plan 链接**

- [x] **Step 2: 权威 README 增加「P0 落地状态」表**

- [x] **Step 3: 按权威 README 验收清单执行自动与源码走查**

| 场景 | 关键路径 |
|------|----------|
| 1 | 前厅设置规则区 → 新建 ¥5/30min / 连续区间 → 列表可见 |
| 2 | 平面图包间绑定 → 角标 → 刷新保留 |
| 3 | eMenu 服务员选桌 → 开单 → 点单 → 授权结束 → 加收项 |

- [x] **Step 4: 双写**

实现备注：同功能设计只更新权威 README，未向已废弃旧设计追加正文；新增统一入口 `node scripts/verify-emenu-duration-billing-p0.mjs`，串行执行后台规则、桌位绑定及 eMenu 桥接/会话/Landing/授权/加收项 7 套验证。

---

## P1 实现计划（概要，另开 plan 文件）

| 项 | 内容 |
|----|------|
| 时段阶梯计价 | `pricing.type === "tiered"` + 跨段计算 + 抽屉 UI |
| 预估费刷新 | 计时条 30s → 可配置 |
| 多店/下发 | 接入 deployment-change-buffer；规则随门店下发 |
| 正式 API | 替代 localStorage 桥接 |

文件建议：`plans/2026-08-20-ktv-duration-billing-p1-implementation.md`

---

## P2 实现计划（概要）

| 项 | 内容 |
|----|------|
| 批量绑定 | 平面图多选桌位 |
| 最低消费 / 封顶 | 规则字段 + 计算 |
| POS 产线 | `lines` 扩展 |

---

## 风险与对策

| 风险 | 对策 |
|------|------|
| admin-web 与 eMenu 跨应用配置 | P0 明确 localStorage/mock 桥接；文档写清 |
| 历史 seq 443 数据仍存在 | 目录与运行时均忽略该旧值，规则管理和桌位绑定保持可用 |
| 与 674 用餐时长混淆 | UI 文案区分「计时费」vs「用餐时长限制」 |
| 一桌多单 seq 592 | 计时会话挂同一 orderId；换桌须先结束（spec §8） |

---

## 建议 commit 检查点（用户触发）

1. `feat(duration-billing): add rules store and standalone rules list`
2. `feat(duration-billing): floor plan table rule binding`
3. `feat(emenu): duration billing start/end timing P0`
