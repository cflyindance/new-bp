# TipOut · 销售额取值条件 · 支付方式筛选与分摊设计方案

> **模块**：团队管理 / 报表中心 → TipOut 小费池规则 → 销售额规则 / Tip Claim  
> **版本**：v1.4  
> **日期**：2026-07-13  
> **状态**：已落地（方案 1；枚举见 v1.4）  
> **场景**：美国餐馆行业；混合支付订单按所选支付方式实付占比计入销售额基数  
> **关联**：[TipOut-销售额取值-含小费订单条件设计方案](./TipOut-销售额取值-含小费订单条件设计方案.md)、[订单中心-订单列表表头字段设计方案](./订单中心-订单列表表头字段设计方案.md)、`dist/TipOut/docs/TipOut计算公式.md`

---

## 一、背景与范围

### 1.1 需求

销售额取值条件需支持按**支付方式**筛选；混合支付订单按**实际使用的支付方式金额**参与计算，而非整单全额计入。

示例：订单营业额类型金额为 100，信用卡支付 80、现金支付 20；条件仅选「信用卡」时，只计入：

```text
100 × (80 / 100) = 80
```

### 1.2 本期范围

| 包含 | 不包含 |
|------|--------|
| 销售额取值条件新增「支付方式」多选 | 卡品牌（Visa/Amex 等）细分 |
| Tip Claim 取值条件同步新增「支付方式」 | 小费 / 加收 / 手动上报条件抽屉 |
| 按含小费实付占比分摊营业额类型金额 | 分配明细按支付方式拆账 KPI |
| 支付方式枚举（含 DoorDash/Uber D-Pay、券/积分分列） | 无 tender 时的人工补录 UI |
| 未配置时向后兼容（整单 R） | |

### 1.3 锁定口径

| 项 | 结论 |
|----|------|
| 计入公式 | `S_order = R × (P_sel / P_all)` |
| `R` | 本单「营业额类型」金额（Net Sales / Gross Sales 等） |
| `P_sel` / `P_all` | 所选 / 全部支付方式的**含小费**实付合计 |
| 选择方式 | **多选** |
| 枚举 | 现金、信用卡、礼品卡、会员卡、ALIPAY、WECHATPAY、DOORDASH_D-PAY（自定义）、UBER_EATS_D-PAY（自定义）、券抵扣、积分抵扣 |
| 作用范围 | 销售额取值条件 + Tip Claim 取值条件 |
| 未配置 | 不分摊，`S_order = R` |

---

## 二、方案选择

| 方案 | 做法 | 结论 |
|------|------|------|
| **1 可选条件「支付方式」+ 分摊函数** | 条件多选；计算层按实付占比分摊 R | **采用** |
| 2 新营业额类型按支付方式拆 | 如「信用卡 Net Sales」 | 与 Net/Gross、小费状态正交爆炸，不采用 |
| 3 仅整单过滤（有该方式才整单计入） | 类似订单小费状态 | 不符合混合支付只计部分金额，不采用 |

**采用方案 1**：与现有条件模型一致；销售额与 Tip Claim 共用同一分摊纯函数。

---

## 三、字段定义与分摊规则

### 3.1 条件类型

| 项 | 值 |
|----|-----|
| 中文名 | 支付方式 |
| 英文名 | Payment Method |
| 建议 key | `paymentMethods`（`string[]`） |
| 是否必填 | 否；未配置 / 空数组 = 不分摊 |
| 出现位置 | 销售额取值条件、Tip Claim 取值条件 |
| UI | 多选；同抽屉最多 1 张该条件卡片 |

### 3.2 枚举

| value | 中文 | 英文 | 归入说明 |
|-------|------|------|----------|
| `cash` | 现金 | Cash | 现金通道 tender |
| `credit_card` | 信用卡 | Credit Card | Visa / MC / Amex / Discover 等卡类 tender |
| `gift_card` | 礼品卡 | Gift Card | 礼品卡核销 / 扣款 |
| `member_card` | 会员卡 | Member Card | 会员卡余额支付 |
| `alipay` | ALIPAY | ALIPAY | 支付宝 |
| `wechatpay` | WECHATPAY | WECHATPAY | 微信支付 |
| `doordash_d_pay` | DOORDASH_D-PAY（自定义） | DOORDASH_D-PAY (Custom) | DoorDash D-Pay |
| `uber_eats_d_pay` | UBER_EATS_D-PAY（自定义） | UBER_EATS_D-PAY (Custom) | Uber Eats D-Pay |
| `coupon` | 券抵扣 | Coupon | 券兑换 / 券抵扣 |
| `points` | 积分抵扣 | Points | 积分兑换 / 积分抵扣 |

> 旧版落库值 `other`（其他）、`custom`（自定义支付方式）仍可参与计算与摘要展示，但 UI 不再提供勾选。

### 3.3 单笔订单计入金额

```text
R      = 本单「营业额类型」金额
P_sel  = Σ 所选支付方式的实付金额（含小费）
P_all  = Σ 本单全部支付方式的实付金额（含小费）

若未配置 paymentMethods（或缺省 / 空数组）：S_order = R
若 P_all ≤ 0：S_order = 0
若 P_sel = 0：S_order = 0
否则：S_order = R × (P_sel / P_all)
```

金额四舍五入到分（与 TipOut `roundMoney` 一致），建议**先乘除再 round**。

### 3.4 混合支付示例

| 项目 | 值 |
|------|-----|
| R（营业额类型） | 100 |
| 信用卡实付（含 tip） | 80 |
| 现金实付 | 20 |
| 条件 | `["credit_card"]` |
| 计入 | `100 × 80/100 = 80` |

多选 `["credit_card", "cash"]` 且上表数据时：`P_sel = 100` → `S_order = R`。

### 3.5 与其它条件组合顺序

```text
候选订单
  → 角色 / 区域 / 时间 / 菜单 / 订单小费状态（整单过滤）…
  → 通过后：按 paymentMethods 对 R 分摊 → S_order
  → Σ S_order = 符合条件总销售额 S
  → 小费池销售额金额 = S × 计提占比（若适用）
```

| 条件 | 语义 |
|------|------|
| `orderTipStatus` | **整单**纳入 / 排除 |
| `paymentMethods` | **金额**按支付占比分摊 |
| `revenueType` | 提供被分摊的 `R` |

二者（小费状态 + 支付方式）可同时配置。

### 3.6 边界

| 场景 | 处理 |
|------|------|
| 未配置支付方式 | `S_order = R`（兼容存量） |
| 多选 | `P_sel` = 所选方式实付之和 |
| 退款后 | tender 以**当前有效**金额为准 |
| 无支付拆分明细 | `S_order = 0`，并打日志 / 标记（实现期） |
| 小费 / 加收 / 手动上报抽屉 | **不加**本条件 |

---

## 四、配置交互与落库

### 4.1 配置入口

| 抽屉 | 是否提供 |
|------|----------|
| 销售额取值条件 | ✓ 「+ 新增条件」→ 支付方式 |
| Tip Claim 取值条件 | ✓ 同枚举、同语义 |
| 小费 / 加收 / 手动上报 | ✗ |

### 4.2 配置步骤

| 步骤 | 行为 |
|------|------|
| 1 | 点「支付方式」→ 条件卡片（多选） |
| 2 | 勾选：现金、信用卡、礼品卡、会员卡、ALIPAY、WECHATPAY、DOORDASH_D-PAY（自定义）、UBER_EATS_D-PAY（自定义）、券抵扣、积分抵扣 |
| 3 | 至少勾 1 项才写入字段；全不勾提交 = 不写该字段（等同未配置） |
| 4 | 删除卡片 = 恢复不分摊 |
| 5 | 说明文案：混合支付按所选方式实付占比分摊营业额类型金额；实付含小费 |

### 4.3 落库形态（示意）

```json
{
  "salesConditions": {
    "revenueType": "Net Sales (税前营业额)",
    "orderTipStatus": "has_tip",
    "paymentMethods": ["credit_card"]
  }
}
```

多选例：`"paymentMethods": ["credit_card", "cash"]`。

Tip Claim 条件对象同样使用 `paymentMethods: string[]`。

### 4.4 摘要展示

- 中文：`支付方式: 信用卡` / `支付方式: 信用卡、现金`
- 英文：`Payment: Credit Card` / `Payment: Credit Card, Cash`

### 4.5 纯函数契约

```text
apportionRevenueByPaymentMethods({
  revenueAmount,                         // R
  tenders: [{ method, amount }],         // amount 含 tip；method ∈ 枚举
  selectedMethods                        // string[] | 空
}) → S_order
```

销售额汇总与 Tip Claim 计取**必须共用**该函数，避免两处口径漂移。

---

## 五、与周边模块边界

| 模块 | 边界 |
|------|------|
| TipOut 销售额 / Tip Claim 条件 | **本期改动面** |
| `orderTipStatus` | 整单过滤；本条件负责金额分摊，不互相替代 |
| 订单中心 · 支付方式列 | 列表仅汇总文案；本条件依赖支付**拆分行**金额 |
| 支付中心 | 管可用支付方式配置；本条件消费结账落账 tender |
| 报表字段「支付方式」 | 对账维度；本方案定义 TipOut 扣点/计提基数分摊规则 |

---

## 六、验收标准

1. 销售额、Tip Claim 两处均可增删「支付方式」多选；其它取值条件抽屉无此项。  
2. 未配置 / 空数组时，`S_order = R`。  
3. 混合支付：`S_order = R × (P_sel / P_all)`；P 为含小费实付；仅选信用卡时例 `100×80/100=80`。  
4. `P_all ≤ 0` 或 `P_sel = 0` 时，`S_order = 0`。  
5. 多选时 `P_sel` = 所选方式实付之和。  
6. 枚举含现金、信用卡、礼品卡、会员卡、ALIPAY、WECHATPAY、DOORDASH_D-PAY（自定义）、UBER_EATS_D-PAY（自定义）、券抵扣、积分抵扣；可与 `orderTipStatus`、`revenueType` 同时生效。  
7. 规则摘要展示已选方式；保存后回显正确。  

---

## 七、非本期与风险

### 7.1 非本期

| 主题 | 说明 |
|------|------|
| 卡品牌细分 | 统一归 `credit_card` |
| 其它条件抽屉 | 小费 / 加收 / 手动上报不加 |
| 拆账 KPI 页 | 分配明细不展示按支付方式拆分 |
| 无 tender 补录 UI | 仅约定记 0 + 日志 |

### 7.2 风险

| 风险 | 缓解 |
|------|------|
| POS 未落 tender 明细 | 契约要求拆分行；缺失则 `S_order = 0`，避免误用整单 |
| 「含 tip 实付」与「R 通常不含 tip」被误解 | 条件说明写清：比例用含 tip 实付，被分摊对象仍是 R |
| Tip Claim 与销售额口径不一致 | 强制共用 `apportionRevenueByPaymentMethods` |

---

## 八、修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-07-13 | 初稿：方案 1；`paymentMethods` 多选；含 tip 实付占比分摊 R；销售额 + Tip Claim |
| v1.1 | 2026-07-13 | 落地：`paymentMethodApportion.js` + 双抽屉 UI + 公式文档 + `verify:payment-method-apportion` |
| v1.2 | 2026-07-13 | 支付方式枚举扩至 9 项（会员卡/ALIPAY/WECHATPAY/自定义/券抵扣/积分抵扣）；废弃 UI 中的 `other` |
| v1.3 | 2026-07-13 | 新增 DOORDASH_D-PAY / UBER_EATS_D-PAY（展示带「（自定义）」） |
| v1.4 | 2026-07-13 | UI 移除「自定义支付方式」；`custom` 仅兼容旧数据 |
