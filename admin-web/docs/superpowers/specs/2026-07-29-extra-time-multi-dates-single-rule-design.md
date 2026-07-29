# 营业与运营 · 额外时间多生效日期 + 单规则约束 — 设计文档

> 日期：2026-07-29
> 模块：门店信息 / seq 418 营业时段（含 seq 583 额外时间）
> 状态：待批准（brainstorm）
> 主要改动文件：`src/config/module-settings-store-business-hours-ui.ts`
>
> **取代**：`2026-07-29-extra-time-date-mutex-design.md` 中「同日多条允许」与「不拆多选」的结论。
> 互斥改为：`dates` 单日交集 + 每营业时间单规则占用；多选保存改为按营业时间拆条。

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
| 存量数据处理 | 自动拆分多关联 + 按营业时间合并为一条，汇总全部日期并去重升序 |
| 合并冲突取值 | 采用最早一条旧规则（按 `dates[0]` 升序，其次 `name`、`id`）的 `name` / `openTime` / `closeTime` / `mode` / `activeDays` |
| 数据模型 | `fromDate`/`toDate` 替换为 `dates: string[]`（方案 A） |
| `scheduleIds` 新数据形态 | **固定长度 1**（空数组为待补全孤儿）；多选入口保存时按营业时间拆成 N 条 |
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
- 无跨文件类型引用 exception 的 `fromDate`/`toDate`；下游仅消费 `readBusinessHourSchedules`

## 4. 迁移策略

迁移在 `readBusinessHourExceptions()` 读取路径内完成，对调用方透明。

**4.1 单条规范化（`normalizeException`）**

按优先级解析日期来源，产出 `dates`：

1. `raw.dates` 为数组 **且** 过滤合法 ISO 日期后 `length ≥ 1` → 采用该结果
2. 否则（含 `dates: []`、全非法、字段缺失）回退 `raw.fromDate` ~ `raw.toDate` → 按天展开为闭区间内所有日期
3. 否则 legacy `raw.date` → 单元素数组
4. 全部缺失 → `[currentDate()]`

展开上限 366 天，**自 `fromDate` 起向前取最多 366 天**（含起点）。超长脏数据（如 `2000-01-01 ~ 2099-12-31`）截断为 `2000-01-01` 起连续 366 天，优先保证不卡死；不保证保留「今天附近」。结果统一去重升序。

**4.2 跨条收敛（读取后处理）**

规范化完成后，两步收敛到「每个 `scheduleId` 最多一条，且 `scheduleIds` 长度恒为 0 或 1」：

**步骤 A — 拆分多关联**

对每条 `scheduleIds.length > 1` 的记录：

1. 按现有 `scheduleIds` 顺序，为每个 `scheduleId` 产出一条独立记录
2. **第一条保留原 `id`**，其余用 `newId("bhx")` 克隆
3. 每条克隆的 `scheduleIds` 改写为 `[该 scheduleId]`；其余字段（含完整 `dates`）原样复制
4. 原多关联记录从结果中移除，替换为上述独立记录

**步骤 B — 按营业时间合并**

1. 孤儿（`scheduleIds` 为空）不参与合并，原样保留
2. 对其余记录按唯一的 `scheduleId` 分组
3. 同组多条：按 `dates[0]` 升序、其次 `name`、再 `id` 排序，取首条为基准
4. 基准条的 `dates` 并入同组其余条的全部日期，去重升序
5. `name` / `openTime` / `closeTime` / `mode` / `activeDays` / `fromDay` / `toDay` 取基准条
6. 非基准条从结果中移除（含其独立 `id`）

合并只发生在读取路径的内存结果里；仅打开 418/583 面板或调用 `refreshAllBusinessHoursPanels` **不写盘**。下一次任意写盘动作（`saveExceptionDialog` / `removeException` / `removeSchedule`）会把已收敛结果持久化。

**4.3 排序**

对外返回结果按 `dates[0]` 升序、其次 `name`、再 `id` 排序，替换现有的 `fromDate.localeCompare`。

## 5. 页面交互

**5.1 营业时间卡片**

```
营业时间卡片（早上 / 中午 / …）
├── 规则摘要（名称、开闭市、星期徽章）
└── 额外时间
    ├── relatedExceptions.length === 0：显示「+ 添加额外时间」
    └── relatedExceptions.length >= 1：隐藏「+ 添加额外时间」，只保留编辑 / 删除
```

子行展示：mode 徽标 · 名称 · 多个日期 · 开闭市。新增 helper `formatExceptionDatesLabel(dates)`：

- 展示格式固定为完整 `YYYY-MM-DD`（避免跨年歧义）
- ≤3 个：全部列出，顿号分隔（`2026-10-01、2026-10-03、2026-10-05`）
- \>3 个：列出前 3 个 + `等 N 天`（`2026-10-01、2026-10-03、2026-10-05 等 6 天`）

删除确认文案同样走该 helper。

**5.2 添加 / 编辑弹窗（从卡片进入，MVP 简化态）**

字段自上而下：

1. 规则类型：该时间生效 / 不生效（radio，现状保留）
2. **生效时间列表**（新增，替换原单日期 / 日期区间输入）
   - 每行一个 `type="date"` 输入 + 删除按钮（`data-business-hour-exception-date-row`）
   - 底部「+ 添加生效时间」追加新行，默认值为今天
   - 仅剩 1 行时隐藏该行的删除按钮
   - 分区标题随 mode 切换：生效日期 / 不生效日期（沿用 `syncExceptionDateSectionLabel`）
3. 作用于营业时间：锁定为来源卡片，不可改选（现状保留）
4. 名称 / 开闭市 / 每周重复：MVP 卡片入口继续隐藏，保存时沿用现状默认值（名称 `额外时间`、开闭市取来源规则、星期取来源规则 `activeDays`）

`syncExceptionDialogMvpCardUi` 重写：不再切换 `single-date-field` / `date-range`；始终展示 dates 列表；MVP 卡片入口仅隐藏名称 / 开闭市 / 每周重复。移除 `syncExceptionRangeFromSingleDate`。`openExceptionDialog` 在 MVP 卡片态 focus 首个日期输入。

**非 MVP 的 seq 583 独立入口**

- 显示完整字段（名称、开闭市、每周重复、dates 列表）
- 「作用于营业时间」UI 仍允许多选
- **落盘形态写死为拆条**：每个合法 `scheduleId` 各写一条独立记录，`scheduleIds: [id]`
  - **新建**：每个选中 id 生成新 `id`（`newId("bhx")`），共享同一份表单字段（名称、dates、mode、开闭市、星期）
  - **编辑**：只更新当前这条（`editId` 对应记录）；若用户在编辑态勾选了额外营业时间，对新增勾选的每个 id 再各建一条克隆；取消勾选当前锁定 id 不允许（编辑态若从卡片进入仍锁定；从 583 进入编辑时，取消勾选当前条所属 id 视为删除关联 → 该条变孤儿或直接拦截「请至少选择一条营业时间」）。**简化实现**：从 583 编辑时，保存只更新当前条的 `scheduleIds` 为勾选结果中的**第一个**，其余新增勾选各建克隆；若勾选为空则报错。更干净的做法：编辑态禁止改选「作用于」，只允许在新建时多选拆条。**本设计采用后者**：编辑态（无论入口）锁定为当前条已有的唯一 `scheduleId`；新建才允许多选拆条。

**5.3 保存校验顺序**

按以下顺序短路返回：

1. 名称（非 MVP）/ MVP 默认名
2. dates：至少一个合法日期；非法 → `请选择有效的生效日期`；重复 → `生效日期不可重复`；全空 → `请选择生效日期`（exclude 时「不生效日期」）
3. 星期、开闭市（沿用现状）
4. `scheduleIds` 非空
5. **单规则占用**：对每个目标 `scheduleId`，若已存在其他额外时间（`id !== editId`）→ `「<营业时间名>」已存在额外时间，请直接编辑`
6. **dates 交集 mode 互斥**（`findExceptionDateModeConflict`）：求与其他规则 `dates` 的交集；命中则取交集最早一天作为 `dateLabel`。单规则落地后几乎不会触发，保留作防御性校验；编辑自身改 mode 时因排除 `editId`，必通过
7. 「相同规则已存在」：`dates.join(",")` 替换原 `fromDate`/`toDate` 比较

## 6. 影响面

**必须同步改造（同文件内）**

- 类型与规范化：`StoreBusinessHourException`、`normalizeException`（含空 `dates` 回退与 366 天自起点截断）
- 读写与收敛：`readBusinessHourExceptions`（拆分多关联 + 按营业时间合并）、`readBusinessHourExceptionsForDisplay`、排序逻辑
- 互斥：`findExceptionDateModeConflict`（改为 `dates` 交集）
- 展示 helper：新增 `formatExceptionDatesLabel`
- 渲染：`renderNestedExceptionRow`、`renderOrphanExceptionRow`、`renderStandaloneExceptionCard`、`renderScheduleCard`（`relatedExceptions.length >= 1` 时隐藏添加入口）、`renderExceptionDialog`（dates 列表 DOM / `data-*`）
- 弹窗逻辑：`resetExceptionDialog`、`openExceptionDialog`（回显 dates、MVP focus）、`saveExceptionDialog`（新建多选拆条；编辑锁定单 `scheduleId`）、`syncExceptionDialogMvpCardUi`（重写）、`openDeleteExceptionDialog`（日期文案）
- 移除：`syncExceptionRangeFromSingleDate`；对话框中 `single-date-field` / `date-range` 相关 DOM 与事件
- 事件绑定：`bindStoreBusinessHoursControls` 增加日期行的添加 / 删除委托

**无需改动**

- `StoreBusinessHourSchedule` 及其读写、营业时间弹窗
- 下游 `scheduleIds` 消费方：`foh-category-settings-ui.ts`、`foh-classification-settings-ui.ts`、`module-settings-store-brand-management-ui.ts`（仅用 `readBusinessHourSchedules`，无 exception `fromDate`/`toDate` 跨文件引用）
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
- 编辑态改挂其他营业时间（编辑锁定当前 `scheduleId`）

## 8. 测试要点

手工验证（仓库无自动化测试覆盖该模块）：

1. 空态：某营业时间无额外时间 → 显示「+ 添加额外时间」
2. 新增单日期 → 保存后卡片子行显示完整 `YYYY-MM-DD`，「+ 添加额外时间」消失
3. 新增 3 个日期 → 子行顿号分隔展示三个完整日期
4. 新增 6 个日期 → 子行显示前 3 个 + `等 6 天`
5. 添加两个相同日期 → 报错「生效日期不可重复」
6. 删除全部日期行至 0（或清空唯一一行）→ 报错要求选择日期
7. 编辑已有规则 → 日期行正确回显，可增删后保存；作用于营业时间不可改选
8. 删除额外时间 → 卡片恢复「+ 添加额外时间」
9. 迁移：同一 `scheduleId` 下两条旧结构（含区间）→ 刷新后合并为一条，日期为并集，字段取 `dates[0]` 更早那条
10. 迁移：旧结构 `2000-01-01 ~ 2099-12-31` → `dates.length === 366` 且首日为 `2000-01-01`，页面不卡死
11. 迁移：存量一条 `scheduleIds: [A,B]` → 读后拆成两条（一条保留原 id，一条新 id），分别挂在 A/B 卡下；分别编辑保存互不抹掉对方关联
12. 迁移：同 `scheduleId` 下一条 include + 一条 exclude → 合并后保留基准 `mode`，日期为并集
13. 只读合并不落盘：仅打开面板 / `refreshAllBusinessHoursPanels` 后检查 localStorage 仍为旧结构；任意一次保存或删除后才持久化收敛结果
14. mode 互斥：编辑自身把 include 改为 exclude（含相同日期）→ **必通过**
15. seq 583 新建（非 MVP）：多选两条皆无额外时间的营业时间 → 落盘 2 条，各 `scheduleIds.length === 1`，字段相同
16. seq 583 新建：多选中一条已有额外时间 → 拦截并提示该营业时间名，不写盘
17. 删除营业时间 → 关联额外时间变孤儿，`dates` 不丢失
