# Manage Payroll 宽表字段分析

**版本**：1.0  
**日期**：2026-06-30  
**适用范围**：团队管理 → 薪资管理（`/team/payroll-report`，TipOut `payroll.html`）  
**关联文档**：`dist/TipOut/docs/payroll-需求分析.md`、`dist/TipOut/docs/payroll-报表功能设计.md`

---

## 1. 背景与定位

**Manage Payroll 宽表**是薪资管理工作区中、考勤明细与 Pay Period 汇总之外的 **本期手工调整/申报项** 录入区，对应数据模型中的 `PayPeriodAdjustments`（库表 `payroll_employee_period.adjustments_json`）。

宽表不是全部薪酬数据。Manage Payroll 工作区实际为分层结构：

| 区块 | 内容 | 与宽表关系 |
|------|------|------------|
| 身份区 | ADP File#、SSN、Hire Date | 表头元数据，非宽表 |
| 考勤明细 | Date、In/Out、Meal、Rate、Regular/OT/OT2 | Rate 按日维护，非宽表 |
| Pay Period 汇总 | 工时/金额合计 | 只读汇总 |
| 加班时薪 | OT、OT2 倍率 | 只读计算 |
| **宽表** | 下文 12 列 | 本期调整项 |
| 下游视图 | Employees Detail、ADP Report | 宽表保存后的投影 |

**单一事实来源**：以 Manage Payroll 保存库为准；Detail 与 ADP 为视图/投影，由同一套字段映射生成。

需求文档写「约 13 列可编辑」，历史上 **Rate** 曾属宽表；**现版 Rate 已移至考勤明细按日填写**，宽表为 **12 列**。

---

## 2. 字段一览

| # | 字段 | 中文含义 | 数据类型 | DOM ID | adjustments 键名 |
|---|------|----------|----------|--------|------------------|
| 1 | Exempt | 豁免加班标识 | 文本代码 | `adj-exempt` | `exempt` |
| 2 | Incentive | 激励/奖金 | 金额 | `adj-incentive` | `incentive` |
| 3 | Breakfast | 早餐班餐次 | 计数 | `adj-breakfast` | `breakfast` |
| 4 | Lunch | 午餐班餐次 | 计数 | `adj-lunch` | `lunch` |
| 5 | Dinner | 晚餐班餐次 | 计数 | `adj-dinner` | `dinner` |
| 6 | Sick Hours | 病假工时 | 小时 | `adj-sick` | `sickHours` |
| 7 | SVCW | 服务费（Service Charge） | 金额 | `adj-svcw` | `svcw` |
| 8 | Tips | 小费 | 金额 | `adj-tips` | `tips` |
| 9 | Child sup | 子女抚养费扣款 | 金额 | `adj-child-sup` | `childSup` |
| 10 | Med Ded | 医疗保险扣款 | 金额 | `adj-med-ded` | `medDed` |
| 11 | Eee 40% | 健康险员工分摊 | 金额 | `adj-eee40` | `eee40` |
| 12 | Eer 60% | 健康险雇主分摊 | 金额 | `adj-eer60` | `eer60` |

所有字段支持手工录入/修正；SVCW、Tips 可与 TipOut 分配结果不同，允许覆盖后作为报税最终值。

---

## 3. 字段分类（5 类）

按 **业务语义、编辑频率、ADP 导出关联** 划分：

### 3.1 计薪属性（1 列）

| 字段 | 说明 |
|------|------|
| **Exempt** | 是否豁免加班（如部分月薪管理岗），影响 OT 规则是否适用；填写 ADP 模板要求的代码或留空 |

特点：每期填一次，偏配置，与金额无关。

### 3.2 餐休合规（3 列）

| 字段 | 说明 |
|------|------|
| **Breakfast / Lunch / Dinner** | 三餐时段餐次或用餐合规计数，用于加州等合规申报 |

特点：计数型、彼此强相关。

### 3.3 额外收入（2 列）

| 字段 | 说明 |
|------|------|
| **Incentive** | 一次性奖金/津贴，非工时乘数 |
| **Sick Hours** | 带薪病假工时，与正常出勤分开统计 |

特点：均为考勤表不能直接算出的补充收入项。

### 3.4 小费与服务费（2 列）— 核心高频

| 字段 | 说明 |
|------|------|
| **SVCW** | 服务费 → ADP `Earnings 3 Code = SVC` |
| **Tips** | 小费 → ADP `Earnings 3 Code = CCT` |

特点：

- 薪酬专员 **最常修改** 的字段
- 可与 TipOut 同步，允许手工覆盖
- Employees Detail 签字声明中须与最终值一致

### 3.5 扣款与福利分摊（4 列）

| 字段 | 说明 |
|------|------|
| **Child sup** | 子女抚养费代扣 |
| **Med Ded** | 医疗保险扣款 |
| **Eee 40%** | 健康险员工承担份额 |
| **Eer 60%** | 健康险雇主承担份额 |

特点：均为扣款或成本分摊；Eee + Eer 成对出现，需与福利台账一致。

### 分类结构

```
宽表（12 列）
├── ① 计薪属性      Exempt
├── ② 餐休合规      Breakfast, Lunch, Dinner
├── ③ 额外收入      Incentive, Sick Hours
├── ④ 小费与服务费  SVCW, Tips          ← 高频 / ADP 核心
└── ⑤ 扣款与福利    Child sup, Med Ded, Eee 40%, Eer 60%
```

---

## 4. ADP 导出映射（摘要）

宽表中与 ADP 直连映射最明确的字段（见 `dist/TipOut/payroll-adp-mapping.js`）：

| 宽表字段 | ADP 列 / Code |
|----------|----------------|
| Tips | `Earnings 3 Code = CCT`，`Earnings 3 Amount` |
| SVCW | `Earnings 3 Code = SVC`，`Earnings 3 Amount` |
| Exempt、Incentive、餐次、Sick、扣款、Eee/Eer | 依客户 ADP 模板映射 |

考勤与工时相关字段（Regular、OT 等）在考勤明细与汇总区，不在宽表内。

---

## 5. 展示问题与方案

### 5.1 问题

原实现为 **12 列横排单表**（`min-width: 76rem`），小屏幕必然出现 **左右横向滚动**；且字段语义跨度大（合规、收入、扣款、福利），混在一行不利于核对。

### 5.2 推荐方案：分组卡片 + 操作优先级

采用与 Pay Period 汇总卡片一致的风格，将宽表改为 **纵向堆叠的分组卡片**；组内 2～4 列网格，小屏单列，避免横向滚动。

**展示优先级**（按报税专员操作路径）：

| 顺序 | 分组 | 字段数 | 说明 |
|------|------|--------|------|
| 1 | 小费与服务费 | 2 | 置顶高亮；标注 ADP · CCT / SVC |
| 2 | 扣款与福利分摊 | 4 | 与福利台账对账 |
| 3 | 餐休合规 | 3 | 合规申报，改动较少 |
| 4 | 额外收入 | 2 | 有则填 |
| 5 | 计薪属性 | 1 | Exempt，偏配置 |

### 5.3 响应式规则

| 视口 | 行为 |
|------|------|
| 桌面 | 组内 2～3 列网格 |
| ≤640px | 全部单列堆叠；小费组 ADP 提示隐藏 |

### 5.4 实现状态

已于 2026-06-30 落地，涉及文件：

- `dist/TipOut/payroll.html` — 分组卡片结构
- `dist/TipOut/payroll.css` — `.payroll-wide-groups` 等样式
- `dist/TipOut/payroll-i18n.js` — 分组标题中英文

所有 `adj-*` 输入框 ID 未变，`payroll.js` 读写/保存/TipOut 同步逻辑无需修改。

---

## 6. 与其他模块的数据流

```
TipOut 小费分配 ──同步──► 宽表 Tips / SVCW（可手工覆盖）
                              │
Manage Payroll 保存 ◄─────────┘
       │
       ├──► EmployeesPayroll Detail（签字声明引用 Tips、SVCW）
       └──► ADP PAYROLL REPORT（CCT、SVC 等列）
```

---

## 7. 后续可选项

- 将「计薪属性」并入身份区，进一步减少宽表纵向高度
- 低频分组（餐休、计薪属性）默认折叠，仅展开小费与服务费
- 在宽表字段旁展示 `systemComputed` 与 `userFinal` 差异（设计文档已规划，待产品确认）
