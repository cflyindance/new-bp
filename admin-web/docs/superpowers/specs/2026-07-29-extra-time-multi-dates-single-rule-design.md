# 营业与运营 · 额外时间多生效日期 + 单规则约束 — 设计文档

> 日期：2026-07-29
> 模块：门店信息 / seq 418 营业时段（含 seq 583 额外时间）
> 状态：待批准（brainstorm）
> 主要改动文件：`src/config/module-settings-store-business-hours-ui.ts`

## 1. 背景与目标

现状一条额外时间只有一对 `fromDate`/`toDate`；从营业时间卡片进入（MVP）时被 `syncExceptionRangeFromSingleDate` 强制收窄为单日。要表达「国庆期间 10-01、10-03、10-05 三天额外营业」，运营必须在同一张卡片下建三条额外时间，卡片下方列表迅速变长，且三条记录的名称与开闭市重复维护。

同时现状一条营业时间可挂任意多条额外时间，缺少「一条营业时间对应一份额外安排」的收敛约束，导致同一天出现多条语义重叠的规则。

目标：

1. 一条额外时间规则可包含**多个单日生效时间**
2. **每条营业时间下最多 1 条**额外时间规则
3. 存量数据自动合并迁移，不丢日期

## 2. 已确认决策

| 项 | 决策 |
|----|------|
| 生效时间颗粒度 | 单个日期（`YYYY-MM-DD`），不含时刻、不是区间、不是星期周期 |
| 单规则约束范围 | 每条营业时间下最多 1 条额外时间规则 |
| 存量数据处理 | 自动合并为一条，汇总全部日期并去重升序 |
| 合并冲突取值 | 采用最早一条旧规则（按 `fromDate` 升序）的 `name` / `openTime` / `closeTime` / `mode` |
| 数据模型 | `fromDate`/`toDate` 替换为 `dates: string[]`（方案 A） |
| 每周重复 | 保留 `activeDays` / `fromDay` / `toDay` 字段与现有默认逻辑，MVP 卡片入口仍隐藏该控件 |
| 原型范围 | 只做配置与 UI；不做「此刻是否营业」解析预览 |

## 3. 数据模型

```ts
type StoreBusinessHourException = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  /** 多个单日生效时间，YYYY-MM-DD，已去重升序，长度 ≥1 */
  dates: string[];
  fromDay: StoreBusinessHourDay;
  toDay: StoreBusinessHourDay;
  activeDays?: StoreBusinessHourDay[];
  mode: "include" | "exclude";
  /** 新数据固定长度 1；空数组为待补全孤儿 */
  scheduleIds: string[];
};
```

- 存储键不变：`418-business-hour-exceptions`
- `StoreBusinessHourSchedule` 不变，营业时间仍是单一 `fromDate`/`toDate`

## 4. 迁移策略

迁移在 `readBusinessHourExceptions()` 读取路径内完成，对调用方透明。

**4.1 单条规范化（`normalizeException`）**

按优先级解析日期来源，产出 `dates`：

1. `raw.dates` 为数组 → 过滤合法 ISO 日期
2. 否则 `raw.fromDate` ~ `raw.toDate` → 按天展开为闭区间内所有日期
3. 否则 legacy `raw.date` → 单元素数组
4. 全部缺失 → `[currentDate()]`

展开上限设 366 天，超出则截断，避免历史脏数据（例如误存 `2000-01-01 ~ 2099-12-31`）产生数万条日期拖垮渲染。结果统一去重升序。

**4.2 跨条合并（读取后处理）**

规范化完成后，按「每个 `scheduleId` 最多一条」收敛：

1. 遍历规范化结果，按 `scheduleIds` 展开为 `(scheduleId, exception)` 对
2. 同一 `scheduleId` 下若有多条：按 `dates[0]` 升序、`name` 次序排序，取首条为基准
3. 基准条的 `dates` 并入其余条的全部日期，去重升序
4. `name` / `openTime` / `closeTime` / `mode` / `activeDays` 取基准条
5. 非基准条从结果中移除
6. 孤儿（`scheduleIds` 为空）不参与合并，原样保留

合并只发生在读取路径的内存结果里；下一次任意保存动作会把合并结果写回存储。不主动在读取时写盘，避免只读渲染产生副作用。

**4.3 排序**

对外返回结果按 `dates[0]` 升序、`name` 次序排序，替换现有的 `fromDate.localeCompare`。

## 5. 页面交互

**5.1 营业时间卡片**

```
营业时间卡片（早上 / 中午 / …）
├── 规则摘要（名称、开闭市、星期徽章）
└── 额外时间
    ├── 无规则：显示「+ 添加额外时间」
    └── 有 1 条：隐藏「+ 添加额外时间」，只保留编辑 / 删除
```

子行展示：mode 徽标 · 名称 · 多个日期 · 开闭市。日期展示规则：

- ≤3 个：全部列出，顿号分隔（`10-01、10-03、10-05`）
- \>3 个：列出前 3 个 + `等 N 天`（`10-01、10-03、10-05 等 6 天`）

**5.2 添加 / 编辑弹窗（从卡片进入，MVP 简化态）**

字段自上而下：

1. 规则类型：该时间生效 / 不生效（radio，现状保留）
2. **生效时间列表**（新增，替换原单日期输入）
   - 每行一个 `type="date"` 输入 + 删除按钮
   - 底部「+ 添加生效时间」追加新行，默认值为今天
   - 仅剩 1 行时隐藏该行的删除按钮
   - 分区标题随 mode 切换：生效日期 / 不生效日期（沿用 `syncExceptionDateSectionLabel`）
3. 作用于营业时间：锁定为来源卡片，不可改选（现状保留）
4. 名称 / 开闭市 / 每周重复：MVP 卡片入口继续隐藏，保存时沿用现状默认值（名称 `额外时间`、开闭市取来源规则、星期取来源规则 `activeDays`）

非 MVP 的 seq 583 独立入口：显示完整字段，同样使用生效时间列表；「作用于营业时间」仍是多选，但保存时对每个被选中的营业时间执行单规则校验。

**5.3 保存校验**

在现有校验基础上调整：

| 场景 | 提示 |
|------|------|
| 无任何日期行 / 全部为空 | `请选择生效日期`（mode=exclude 时为「不生效日期」） |
| 存在非法日期 | `请选择有效的生效日期` |
| 日期重复 | `生效日期不可重复` |
| 目标营业时间已有其他额外时间 | `「<营业时间名>」已存在额外时间，请直接编辑` |
| 同日对立 mode 冲突 | 沿用现有文案，判定改为按单日交集 |

`findExceptionDateModeConflict` 改造：不再比较 `fromDate`/`toDate` 全等，改为求 `dates` 交集，命中则取交集中最早一天作为 `dateLabel`。

「相同规则已存在」重复判定：`fromDate`/`toDate` 比较替换为 `dates.join(",")` 比较。

## 6. 影响面

**必须同步改造（同文件内）**

- 类型与规范化：`StoreBusinessHourException`、`normalizeException`
- 读写：`readBusinessHourExceptions`、`readBusinessHourExceptionsForDisplay`、排序逻辑
- 渲染：`renderNestedExceptionRow`、`renderOrphanExceptionRow`、`renderStandaloneExceptionCard`、`renderScheduleCard`（按已有规则隐藏添加入口）、`renderExceptionDialog`
- 弹窗逻辑：`resetExceptionDialog`、`openExceptionDialog`、`saveExceptionDialog`、`syncExceptionDialogMvpCardUi`、`openDeleteExceptionDialog`（删除确认文案里的日期描述）
- 移除：`syncExceptionRangeFromSingleDate`（单日强制同步不再需要）
- 事件绑定：`bindStoreBusinessHoursControls` 增加日期行的添加 / 删除委托

**无需改动**

- `StoreBusinessHourSchedule` 及其读写、营业时间弹窗
- 下游 `scheduleIds` 消费方：`foh-category-settings-ui.ts`、`foh-classification-settings-ui.ts`、`module-settings-store-brand-management-ui.ts`（营业时间 id 语义未变）
- 下发域 `deployment-config-domains.ts` / `deployment-seed.ts`（`store.hours` 结构未变）

**文档回写**

- `docs/产品PRD/exports/2026-07-28-store-info/PRD.md`（SI-11～14）
- `docs/产品PRD/exports/2026-07-28-store-info/SPEC.md`（§3.4 / §3.5）

## 7. 不在范围内

- 营业时间本身的多生效日期（营业时间仍是单区间）
- 日期区间重叠拦截（沿用现状：不拦截）
- 跨午夜时段（`openTime >= closeTime` 仍被拒，见 PRD Q3）
- include / exclude 优先级解析与「此刻是否营业」计算
- MVP 下孤儿额外时间不可达问题（seq 583 隐藏导致，属既有遗留）

## 8. 测试要点

手工验证（仓库无自动化测试覆盖该模块）：

1. 空态：某营业时间无额外时间 → 显示「+ 添加额外时间」
2. 新增单日期 → 保存后卡片子行显示该日期，「+ 添加额外时间」消失
3. 新增 3 个日期 → 子行顿号分隔展示三个日期
4. 新增 6 个日期 → 子行显示前 3 个 + `等 6 天`
5. 添加两个相同日期 → 报错「生效日期不可重复」
6. 删除全部日期行至 0（或清空唯一一行）→ 报错要求选择日期
7. 编辑已有规则 → 日期行正确回显，可增删后保存
8. 删除额外时间 → 卡片恢复「+ 添加额外时间」
9. 迁移：手工在 localStorage 写入同一 `scheduleId` 下的两条旧结构（含区间）→ 刷新后合并为一条，日期为两段区间的并集，名称与开闭市取更早那条
10. 迁移：旧结构含 `2000-01-01 ~ 2099-12-31` → 日期数被截断到 366 且页面不卡死
11. mode 互斥：同一营业时间下先存「生效」含 10-01，编辑改为「不生效」且仍含 10-01 → 按预期拦截或通过（同一条规则改 mode 应允许，冲突仅针对其他规则）
12. seq 583 独立入口（切到非 MVP 版本）：多选两条营业时间，其中一条已有额外时间 → 拦截并提示该营业时间名
13. 删除营业时间 → 关联额外时间变孤儿，日期信息不丢失
