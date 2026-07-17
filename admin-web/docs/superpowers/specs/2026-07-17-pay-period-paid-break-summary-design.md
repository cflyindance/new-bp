# Pay Period 汇总 · 带薪休息独立展示设计方案

> **模块**：团队管理 → 薪资管理（TipOut `payroll.html` / Manage Payroll）  
> **版本**：v1.0  
> **日期**：2026-07-17  
> **状态**：已落地  
> **场景**：Pay Period 汇总中将带薪休息与 Regular 拆分展示，并同步金额与总收入  
> **关联**：`dist/TipOut/payroll.js`、`dist/TipOut/payroll.html`、`dist/TipOut/payroll-i18n.js`、`docs/项目文档/Manage-Payroll-宽表字段分析.md`

---

## 一、背景与目标

### 1.1 现状

考勤明细已有「带薪用餐休息」字段（`paidMealBreak`），当前行为：

- 计入合规记录，但**不扣减** Regular 工时；
- Pay Period 汇总「工时 / 金额 / 总收入」三卡片**不展示**带薪休息；
- Regular 金额按 `reg × Rate` 计算，其中 `reg` 已含带薪休息对应时长。

### 1.2 目标

仅用于**区分 Regular 与休息时间**：

1. Regular **不包含**带薪休息时长；
2. 带薪休息在「工时」「金额」中**独立一行**展示；
3. 金额合计、考勤收入、总收入合计**同步纳入**带薪金额。

### 1.3 非目标

- 不新增考勤录入列（沿用现有 `paidMealBreak`）；
- 不改 ADP 导出列映射（本期仅 Manage 汇总与 Detail/导出合计口径）；
- 不改无薪用餐休息逻辑；
- 不改员工列表页周期工时列展示。

---

## 二、方案选型

采用**方案 A：汇总层拆分 + Regular 扣减**。

| 方案 | 说明 | 取舍 |
|------|------|------|
| **A（采用）** | Regular 扣带薪休息；汇总增行；总收入经考勤收入带入 | 改动小，满足拆分目的 |
| B | 同 A，总收入再加一行 | 与考勤收入语义重叠 |
| C | 日明细再拆「带薪休息工时」列 | 与已有餐休字段重复 |

---

## 三、计算口径

数据源：每日 `paidMealBreak`（时:分或分钟，复用现有 `mealMinutes`）。

```text
paidBreakHours(day) = round((mealMinutes(paidMealBreak) / 60) × 100) / 100
  （与 Regular 相同：两位小数）

Regular(day) = max(0, round(((在岗分钟 − 无薪餐休分钟 − 带薪休息分钟) / 60) × 100) / 100)

paidBreakAmt(period) = Σ (paidBreakHours(day) × Rate(day))

工时合计 = Regular + 带薪休息 + OT + OT2
金额合计 = Regular金额 + 带薪金额 + OT金额 + OT2金额
总收入 Regular = Regular金额
总收入 带薪休息 = 带薪金额
总收入 OT / OT2 = OT / OT2 金额
总收入合计 = 金额合计（不含 SVCW、Tips）
```

- Rate 口径与现有 Regular 一致：优先当日 Rate，否则员工默认 Rate。
- 现有 `syncDerived` 会经 `applyAutoRegularHours` **重写** `reg`，本期不新增「锁定手工 reg」能力。汇总带薪时**只**读 `paidMealBreak`，**不要**再对已扣减后的 `reg` 做二次扣减。
- OT / OT2 计算与录入规则不变。
- Detail 周标题旁 R/OT/OT2 三元组**可不展示**带薪分项；仅保证周 `T:` 工时/金额含带薪。
- 导出 `summary` / Week 段：合计含带薪；若 CSV 仍分列 Reg/OT/OT2，须在 Regular 与 OT 之间增加带薪列（或等价字段），避免 Reg+OT+OT2 ≠ Total。

---

## 四、展示

### 4.1 Pay Period 汇总卡片

| 卡片 | 变更 |
|------|------|
| **工时** | Regular 与 OT 之间新增「带薪休息」行（`#sum-paid-break-h`） |
| **金额** | Regular 与 OT 之间新增「带薪休息」行（`#sum-paid-break-amt`） |
| **总收入** | Regular / 带薪休息 / OT / OT2 / 合计（与金额卡同源，不含 SVCW、Tips）；`#sum-attendance-income` 等 |

行文案：中文「带薪休息」；英文「Paid Break」（i18n key 建议 `manage.paidBreak`）。

### 4.2 Employees Detail（同源、必须对齐）

与 Manage 使用同一套汇总函数（由 `syncDerived` 调用），禁止另写一套带薪公式。

| 位置 | 行为 |
|------|------|
| **周期汇总栅格**（`#detail-hours-grid` 内 R/OT/OT2/合计） | 在 Regular 与 OT 之间**增加「带薪休息」列**（工时行 + 金额行各一格）；合计工时/合计金额 = Regular + 带薪 + OT + OT2（及对应金额），与 Manage 三卡片合计一致。表头文案与 Manage 共用 `manage.paidBreak`（或等价 i18n） |
| **日明细表**（`buildDayRowsHtml`） | 已有「带薪用餐休息」列，**不新增列**。当日 **Hours (h)** = Regular + 带薪小时 + OT + OT2；当日 **Total Amt** = Regular金额 + 带薪金额 + OT金额 + OT2金额 |
| **Detail 周合计**（`buildEmployeesDetailDailyHtml` 内 `wk.totals` / 周标题 `T:`） | `hours` / `amount`（及导出周汇总）须含带薪；与日行加总、周期栅格一致 |
| **Manage 周合计**（`sumWeekSegmentTotals` / `updateManageWeekSummaries`） | `data-week-total-hours` 等周合计 = Regular + 带薪 + OT + OT2，与 Pay Period 卡片「合计」同口径 |
| **导出**（`buildDetailExportPayload` / `payroll-detail-export.js`） | 日/周/期合计口径与上表一致；仍可保留原 `paidMealBreak` 时长列 |

### 4.3 本期非目标（展示范围）

- 员工列表页周期工时列（若仍为 `reg+ot+ot2`）**本期不改**，不要求与新「工时合计」对齐。
- ADP 预览行映射本期不改。

---

## 五、实现触点（规划用）

| 文件 / 函数 | 改动要点 |
|------|----------|
| `payroll.js` → `computeRegularHoursFromDay` | 在岗分钟同时扣无薪与带薪 |
| `payroll.js` → `sumSegments` / `sumSegmentPayAmounts`（或并列 `sumPaidBreak*`） | 汇总带薪工时与带薪金额；合计含带薪 |
| `payroll.js` → `sumWeekSegmentTotals` / `updateManageWeekSummaries` | 周合计含带薪 |
| `payroll.js` → `syncDerived` | 写 Manage 三卡片新行；渲染 Detail 周期汇总含带薪列 |
| `payroll.js` → `buildDayRowsHtml` | Hours / Total Amt 加回带薪 |
| `payroll.js` → `buildEmployeesDetailDailyHtml` | `wk.totals.hours` / `amount`（及展示）含带薪 |
| `payroll.js` → `buildDetailExportPayload`（及 `payroll-detail-export.js`） | 导出合计口径对齐 |
| `payroll.html` | 工时/金额卡片各增一行 |
| `payroll-i18n.js` | `manage.paidBreak` 等；字段帮助：带薪**不计入** Regular |

---

## 六、边界与兼容

| 场景 | 行为 |
|------|------|
| `paidMealBreak` 为空 | 带薪工时/金额为 0，展示 `0` |
| 带薪 + 无薪 > 在岗 | Regular 下限为 0；带薪仍按录入汇总展示 |
| 手工改 `reg` | 失焦/同步后仍被自动重算覆盖；汇总带薪只来自 `paidMealBreak` |
| 旧数据（此前 Regular 含带薪） | 打开后触发自动重算则 Regular 变小、带薪独立出现；需在发布说明中提示 |

---

## 七、验收标准

1. 某日仅有带薪休息、无 OT：Manage 工时卡可见独立「带薪休息」，Regular 比改前少等量小时。
2. 带薪金额 = 带薪小时 × 当日 Rate；金额合计 = Regular + 带薪 + OT + OT2 金额。
3. 总收入卡片：Regular、带薪休息、OT、OT2 分列；合计 = 金额合计；不展示 SVCW / Tips。
4. Employees Detail 周期汇总出现「带薪休息」列，其值与 Manage 同源；合计工时/金额与 Manage 一致。
5. Detail 日明细：Hours / Total Amt 含带薪；多日加总等于周期合计；Detail 周 `T:` 与 Manage 周合计亦含带薪。
6. 无带薪休息时，三卡片与 Detail 行为与改前一致（有带薪时 Regular 公式才变化）。
7. 中英切换下文案正确。
8. 员工列表工时列本期可不含带薪拆分（非目标）。

---

## 八、测试要点

- 单元/手工：`mealMinutes` 与带薪扣减（`0:30`、空、超在岗）。
- 手工：改 `paidMealBreak` 后 `syncDerived` 三卡片同步。
- 手工：改 Rate 后带薪金额重算。
- 回归：无薪餐休仍只扣 Regular；OT/OT2/SVCW/Tips 不变。
