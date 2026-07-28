# 营业与运营 · 额外时间关联营业时间 — 设计文档

> 日期：2026-07-28  
> 模块：门店信息 / seq 418 营业时段  
> 状态：已批准（brainstorm）  
> 主要改动文件：`src/config/module-settings-store-business-hours-ui.ts`

## 1. 背景与目标

现状「额外时间」是独立分区，自填开闭市与日期/星期，`mode` 为 include/exclude，但**不绑定**营业时间库中的具体规则。运营无法表达：「在某日期时段内，哪些营业时间不生效 / 应按额外开闭市覆盖」。

目标：在新增/编辑额外时间时**必选**关联 ≥1 条营业时间；UI 改为挂在对应营业时间卡片下管理。

## 2. 已确认决策

| 项 | 决策 |
|----|------|
| 交互骨架 | 方案 C：去掉独立「额外时间」分区；在每张营业时间卡片下展示/增删改 |
| 关联模型 | 一条额外时间可关联多条营业时间；在各相关卡片下镜像展示 |
| 自填时段 | 保留 exception 自身的 open/close |
| 保存校验 | `scheduleIds` 至少 1 条，否则不能保存 |
| include | 在 exception 日期∩星期∩[open,close) 内，用 exception 开闭市**覆盖**所选规则原开闭市 |
| exclude | 在同样窗口内，所选规则**暂停生效** |
| 删营业时间 | 从各 exception 的 `scheduleIds` 摘掉该 id；若变空则保留记录为待修，不自动删额外时间 |
| 新建默认 | 从来源卡片进入时预勾选该规则；开闭市默认带来源规则的 open/close |
| 原型范围 | 只做配置与 UI；不做「此刻是否营业」解析预览 / 点餐端引擎 |

## 3. 信息架构

```
营业时段
└── 营业时间卡片（早上 / 中午 / …）
    ├── 规则摘要（名称、开闭市、日期、星期）
    ├── 额外时间子列表（仅 scheduleIds 含本卡 id 的 exception）
    │   └── 行：mode 徽标 · 名称 · 日期 · 开闭市 · 若还关联其他规则则提示
    └── + 添加额外时间
```

- 原独立 `额外时间` section 移除。
- 无营业时间规则时：不展示额外时间入口（先建营业时间）。

## 4. 对话框与校验

字段（相对现状）：

1. 类型 include / exclude（文案补充覆盖/暂停说明）
2. 名称
3. 开始/结束时间
4. 开始/结束日期、星期（现状控件）
5. **作用于营业时间**（多选 checkbox 列表，必填）— 展示各 schedule 名称 + 开闭市

校验（在现有基础上增加）：

- 未选任何营业时间 →「请至少选择一条营业时间」
- 其余：名称非空、日期合法、≥1 星期、结束时间晚于开始

编辑：从任意关联卡片进入，编辑同一 `exception.id`；保存后所有镜像行同步。

## 5. 数据模型

```ts
type StoreBusinessHourException = {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  fromDate: string;
  toDate: string;
  fromDay: StoreBusinessHourDay;
  toDay: StoreBusinessHourDay;
  activeDays?: StoreBusinessHourDay[];
  mode: "include" | "exclude";
  /** 必填，≥1；指向 StoreBusinessHourSchedule.id */
  scheduleIds: string[];
};
```

- 存储键不变：`418-business-hour-exceptions`
- `normalizeException`：缺省或空 `scheduleIds` → 规范化为 `[]`（视为待修，不丢弃记录）
- 写入路径：仅对话框保存且校验通过时写入非空 `scheduleIds`

### 5.1 删除营业时间

1. `removeSchedule(id)` 时：更新内存 exceptions 摘掉该 id，并**立即** `writeBusinessHourExceptions` 持久化（与 §5.2「读时清洗不单独写盘」区分）
2. 不因 `scheduleIds.length === 0` 删除 exception
3. 孤儿 exception（`scheduleIds` 为空，或过滤无效 id 后为空）：不出现在任何卡片子列表
4. **孤儿可达路径（N≥1）**：营业时段面板顶部展示可展开的「待补全额外时间」条：
   - 文案：`有 N 条额外时间未关联营业时间`
   - 展开后列出全部孤儿行（名称 · mode · 日期 · 开闭市）
   - 每行提供「编辑」「删除」：编辑打开同一对话框（勾选列表无预勾选，须选 ≥1 条才能保存）；删除走现有确认对话框
   - 补全 `scheduleIds` 并保存成功后，该行从待补全列表消失，并出现在对应卡片子列表
5. 营业时间库为空时：卡片「+ 添加额外时间」不可用；孤儿仍可从待补全列表**删除**，编辑时勾选列表为空 → 无法满足 ≥1 校验，只能取消或删除

### 5.2 读时清洗

- 展示与保存前：`scheduleIds` 与当前 schedules 做交集，丢弃已不存在的 id（仅内存/写回时清洗）
- 若清洗后数组相对磁盘有变化：在下一次任意成功写入 exceptions 时一并持久化清洗结果；不单独自动写盘

### 5.3 旧数据迁移

- 无 `scheduleIds` 字段的历史 JSON：读入为 `[]`，走孤儿待补全列表，**不**自动绑定全部规则
- 若历史存在未使用的单数 `scheduleId?`：迁移时若存在有效 id 则写入 `scheduleIds: [scheduleId]`，否则仍为 `[]`
- 不提供一键「绑到全部」

## 6. 运行时语义（配置约定）

供下发域 `store.hours` 与下游消费约定（本原型不实现计算器）：

- **include**：窗口内，对每个 `scheduleId`，以 exception 的 open/close 覆盖该 schedule 的 open/close
- **exclude**：窗口内，这些 schedule 不参与营业
- 未列入 `scheduleIds` 的 schedule 不受该 exception 影响

冲突优先级、跨午夜：**Out**（保持开放问题，与门店信息 PRD Q3 一致）

## 7. 错误处理与边界

| 场景 | 行为 |
|------|------|
| 保存未选 schedule | 对话框内错误，不关闭 |
| 营业时间库为空时点添加 | 入口不可用或提示先创建营业时间 |
| 关联的 schedule 已被删（id 残留） | 读时过滤无效 id；若过滤后为空 → 孤儿待补全列表 |
| 删除额外时间（含孤儿） | 卡片行或待补全列表均可触发确认对话框；删除后各处同步 |

## 8. 测试要点（手工 / 后续单测）

1. 从「早上」添加额外时间：早上预勾选，开闭市=早上原值；仅勾早上保存后只在早上卡片下出现  
2. 再勾「中午」保存：早上、中午卡片均可见同一条；编辑任一入口改名称，两边同步  
3. 不选 schedule 保存：失败提示  
4. 删除「早上」：该 exception 的 scheduleIds 去掉早上；若仍含中午则只在中午下显示；若只绑了早上则变孤儿并进入待补全列表  
5. 历史无 scheduleIds 数据：待补全列表列出全部孤儿；可逐条编辑补全或删除；补全后方可保存  
6. N>1 条孤儿：列表中每条都能独立编辑/删除，互不影响  

## 9. Out of scope

- 点餐端 / Kiosk 真实解析引擎与预览计算器  
- 582 打烊提示逻辑变更  
- 下发协议字段重命名（仍整包 `store.hours`）  
- 独立「全部额外时间」总览分区  

## 10. 实现锚点

- UI/CRUD：`src/config/module-settings-store-business-hours-ui.ts`
- 类型与读写：`StoreBusinessHourException`、`normalizeException`、`saveExceptionDialog`、`removeSchedule`、`renderScheduleCard` / 移除 `renderExceptionsSection`
- 文档同步（实现后可选）：`docs/产品PRD/exports/2026-07-28-store-info/` 中 SI-14 与 SPEC 3.5 增补 `scheduleIds`
