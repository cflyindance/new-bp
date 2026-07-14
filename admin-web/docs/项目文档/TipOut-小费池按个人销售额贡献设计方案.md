# TipOut · 小费池「按个人销售额」贡献设计方案

> **模块**：TipOut → 小费池贡献规则 → 新增选项  
> **版本**：v1.0  
> **日期**：2026-07-14  
> **状态**：已落地（方案 1：多卡片多档费率）  
> **关联**：[TipOut-按个人销售额占比扣除设计方案](./TipOut-按个人销售额占比扣除设计方案.md)、`dist/TipOut/docs/TipOut计算公式.md`

---

## 一、场景

不同角色/员工按**本人销售额 × 不同占比**贡献小费池，例如：

| 人 | 角色 | 销售额 | 占比 | 进池 |
|----|------|--------|------|------|
| A | Server | 1000 | 3% | 30 |
| B | Bartender | 200 | 2% | 4 |
| **合计** | | | | **34** |

---

## 二、方案（已采用）

**多条「按个人销售额」池卡片**：

- 菜单项：`按个人销售额`（`type: personal_sales`）
- 取值条件与「销售额」同构，复用 `salesDrawer`
- 每条卡片各自占比 + 条件（可用角色区分档位；角色默认展示且必选）
- 池贡献：`Σ_卡片 Σ_命中员工 (S_i × 卡片占比%)`
- **与「销售额」(`sales`) 互斥**：菜单灰显对方；新增时拦截提示。同类型可多张卡片。

同一门店多档位：再加「按个人销售额」卡片，用不同角色条件区分（如 Server 3%、Bartender 2%）。

与扣除方 `personalSalesPct`：**并存**——池侧算进池金额，扣除侧算从谁小费扣。

---

## 三、落库示意

```json
{
  "poolRules": [
    {
      "type": "personal_sales",
      "id": "personal_sales_1",
      "name": "服务员进池",
      "pct": 3,
      "conditions": {
        "revenueType": "Net Sales (税前营业额)",
        "role": ["Server"]
      }
    },
    {
      "type": "personal_sales",
      "id": "personal_sales_2",
      "name": "酒保进池",
      "pct": 2,
      "conditions": {
        "revenueType": "Net Sales (税前营业额)",
        "role": ["Bartender"]
      }
    }
  ]
}
```

---

## 四、实现要点

| 项 | 说明 |
|----|------|
| 引擎 | `calcPersonalSalesPoolCard` / `calcPersonalSalesPoolFromRules` |
| UI | `rule-add.html` 可多开；条件必填校验同销售额 |
| 展示 | `detail.html` / `ruleData.poolTypeNames` |

---

## 五、修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-07-14 | 方案 1 落地：`personal_sales` 多卡片多档 |
| v1.1 | 2026-07-14 | 与「销售额」池项互斥（菜单禁用 + 新增拦截） |
| v1.2 | 2026-07-14 | 取值条件默认展示角色且必选 |
