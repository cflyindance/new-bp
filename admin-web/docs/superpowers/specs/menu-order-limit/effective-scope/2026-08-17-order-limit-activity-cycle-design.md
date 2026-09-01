# 生效范围「活动周期」设计
> [!IMPORTANT]
> **文档状态（截至 2026-08-19）：当前有效**
> **当前重建适用性：** 活动周期的每日 / 每周 / 每月选择已在 normalize、renderStepFive 和 validate 中实现，可用于当前重建。
> **替代 / 权威指向：** [文档索引](../README.md)；[当前产品 SPEC](../../../../产品PRD/exports/2026-08-19-menu-order-limit/SPEC.md)。


## 决策

用「活动周期」替换原「生效星期」区块：

- **每天**：有效期内每日生效，无额外日控件  
- **每周**：勾选周一至周日（承接原生效星期）  
- **每月**：勾选 1–31；当月无该日则跳过  

营业时段与时间范围三种周期共用。

## 字段

| 字段 | 取值 |
|---|---|
| `activityCycle` | `daily` \| `weekly` \| `monthly`，默认 `weekly` |
| `daysOfWeek` | 每周使用 |
| `daysOfMonth` | `number[]` 1–31，每月使用 |

## 兼容

旧草稿无 `activityCycle` → 视为 `weekly`。
