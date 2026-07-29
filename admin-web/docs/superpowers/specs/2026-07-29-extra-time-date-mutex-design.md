# 营业与运营 · 额外时间同日互斥校验 — 设计文档

> 日期：2026-07-29  
> 模块：门店信息 / seq 583 额外时间（数据键仍为 `418-business-hour-exceptions`）  
> 状态：已实现  
> 主要改动文件：`src/config/module-settings-store-business-hours-ui.ts`  
> 关联：`2026-07-28-extra-time-schedule-binding-design.md`

## 1. 背景与目标

现状 `saveExceptionDialog` 仅拦截「整条字段完全相同」的重复规则。同一营业时间、同一生效日期下：

- 可重复创建多条不同名称的记录；
- 「该时间生效」与「该时间不生效」可并存，语义冲突。

目标：按**单条营业时间**做日期维度互斥；多选营业时间时各自独立、互不影响。

## 2. 已确认决策

| 项 | 决策 |
|----|------|
| 实现方式 | 方案 1：仅保存时校验 |
| 作用域 | 按 `scheduleId` 独立判断 |
| 多选营业时间 | 逐条校验；互不影响 |
| 日期相等 | `fromDate` + `toDate` 完全一致（MVP 单日即同一天）；**不做区间重叠拦截** |
| 生效 / 不生效 | **对称互斥**：同 `scheduleId` + 同日期区间，已有一侧则不可存另一侧 |
| 同日多条 | 允许；只要名称或开闭市不同即可（同类型） |
| 完全重复 | 保留现有「相同规则已存在」拦截 |
| 数据模型 | 不改；不拆多选为多条记录 |
| 即时 UI 禁用 | 不做 |

## 3. 校验规则（保存时）

在现有字段校验通过后、写盘前，对 `exception.scheduleIds` 中每个 `scheduleId`：

设 `peers` = 已有额外时间中（排除当前编辑 `id`）且 `scheduleIds` 含该 `scheduleId`，且 `fromDate/toDate` 与待保存完全一致的记录。

1. **模式互斥**  
   若 `peers` 中存在 `mode` 与待保存相反者 → 失败。  
   文案（首条冲突）：  
   `「{营业时间名称}」在 {日期文案} 已设为{生效|不生效}，不可再设为{不生效|生效}`  
   - 单日：`日期文案 = fromDate`  
   - 区间：`日期文案 = fromDate 至 toDate`

2. **同日多条**  
   同 `scheduleId` + 同日期 + 同 `mode`：名称或开闭市任一不同 → 允许。

3. **完全重复**  
   保留现有全字段相等校验（名称、日期、时段、星期、mode、scheduleIds 集合）。

任一条 `scheduleId` 触发互斥即整体失败：不关窗、不写盘。多选时只报**第一条**冲突，避免刷屏。

## 4. 边界

| 场景 | 行为 |
|------|------|
| 编辑当前条 | 排除自身 `id` 再比 |
| 改日期 / 改 mode 导致冲突 | 同样拦截 |
| 从营业时间卡片添加（锁定单 schedule） | 规则相同，只校验该条 |
| 583 总列表多选 | 对每个勾选 id 独立校验 |
| 孤儿 / 空 scheduleIds | 仍由现有「请至少选择一条营业时间」拦截，不进入本互斥 |

## 5. 实现要点

- 文件：`module-settings-store-business-hours-ui.ts` 的 `saveExceptionDialog`
- 抽取小函数（建议）：`findExceptionDateModeConflict(candidate, others, schedules) → { scheduleName, dateLabel, existingMode } | null`
- 不新增存储键；不改 `StoreBusinessHourException` 类型

## 6. 验收

- [ ] 同一营业时间、同一日：先「生效」再「不生效」→ 失败并提示
- [ ] 反之先「不生效」再「生效」→ 失败并提示
- [ ] 同一营业时间、同一日、同类型、不同开闭市或不同名称 → 可保存
- [ ] 营业时间 A 已生效某日，营业时间 B 同日设不生效 → 可保存
- [ ] 一条额外时间勾选 A+B，若仅 A 冲突 → 失败且文案点名 A
- [ ] 编辑自身改名不误伤；改成与另一条对立 mode 同日 → 失败
