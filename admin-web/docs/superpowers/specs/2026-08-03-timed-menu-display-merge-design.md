# 按照时段显示菜单合并 — 设计文档

> 日期：2026-08-03  
> 模块：前厅管理中心 / 设置 / 菜单查找与时段  
> 状态：已实现  
> 主要改动：`module-settings-timed-menu-display-ui.ts`、`module-settings-pos-menu-scope-lines-ui.ts`、`main.ts`、catalog / toggle / line-scope / product-version

## 1. 目标

将下列三项合并为一项 **「按照时段显示菜单」**（seq **348**）：

| 原 seq | 原标题 |
|--------|--------|
| 176 | 按时段显示菜单:堂吃菜单 |
| 177 | 按时段显示菜单:外食菜单 |
| 348 | 按照时段显示菜单 |

交互对齐 **点单显示座位**（seq 132）：主开关 + 按产线配置订单类型多选。

## 2. 已确认决策

| 项 | 决策 |
|----|------|
| 正式项 | 保留 348；176/177 从设置列表移除（退役） |
| 每行选项 | 订单类型：Dinein / Delivery / Pick Up / ToGo（多选） |
| 产线 | POS / POS GO / PayPad |
| 旧数据 | 不迁移；348 按空表重新配置 |
| UI 参照 | `module-settings-order-display-seat-ui.ts` |

## 3. 交互

1. 主开关关：仅标题 + 开关  
2. 主开关开：表格「产线 | 按时段显示菜单的订单类型（多选）」  
3. 某产线勾选 ≥1 种类型 → 该产线启用；全不勾 = 该产线不启用  

## 4. 数据

- Storage：`348-timed-menu-order-types-by-line`  
  形如 `{ pos: ["dine-in"], "pos-go": ["to-go"], paypad: [] }`  
- 不读 176/177/旧 `348-timed-menu-display-lines`

## 5. 验收

- [ ] 「菜单查找与时段」仅见一项「按照时段显示菜单」，无 176/177  
- [ ] 开关与表格行为与「点单显示座位」一致  
- [ ] 可按产线勾选不同订单类型并持久化（localStorage）  
- [ ] 118/148 行为不变  
