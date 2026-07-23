# 复杂功能 CRUD · 集合变更下发记录设计方案

> **模块**：页面级业务实体的新增 / 编辑 / 删除 →「保存并下发」变更预览与下发记录  
> **版本**：v1.0  
> **日期**：2026-07-23  
> **状态**：已确认（实现计划见同目录实现计划文档）  
> **关联文档**：  
> - [配置变更预览-层级对比可读化设计方案](./配置变更预览-层级对比可读化设计方案.md)（设置项预览；本方案为其 CRUD 场景扩展）  
> - [设置页-按页面批量保存与下发设计方案](./设置页-按页面批量保存与下发设计方案.md)  
> - [云端下发本地-配置同步与下发记录设计方案](./云端下发本地-配置同步与下发记录设计方案.md)

---

## 一、背景与问题

### 1.1 适用场景

凡「有新增就会有编辑、删除」的页面级复杂功能，保存后需下发终端，例如：

| 域 | 示例 |
|----|------|
| 团队管理 | 角色与员工、自定义休息、加班规则、排班表 / 班次 |
| 前厅 | 餐位平面图、店中店管理、品类 / 分类管理、菜单下单限制规则 |

### 1.2 现状问题

| 问题 | 影响 |
|------|------|
| 整包 before/after 摘要 | 如「N 个区域，M 张桌位」或 `formatConfigDisplayValue` 整对象，看不清改了谁、改了什么 |
| 与设置项模型错位 | 设置项已有 `details` 逐行对比；CRUD 仍按「整份配置」记账 |
| 写入时机不一 | 部分页写即记变更，易碎片化，且难「放弃修改」 |

### 1.3 目标

1. **按资源集合记一条**变更（如「员工列表」），一次保存可含多条集合  
2. **集合内按实体分组，实体内字段「改前 → 改后」**（尽量全量字段）  
3. **触发与设置页一致**：页内多次 CRUD 只改草稿；「保存并下发」再落库 + 下发  
4. **确认变更与变更记录同构**，复用预览壳，扩展 `entities` 渲染分支  

### 1.4 非目标

- 不改下发协议 / 终端 Sync API / Batch·Item·Target 结构  
- 不引入通用 JSON Diff 引擎或「查看原始 JSON」入口  
- 不按单实体拆成多条下发批次  
- 本期不做平面图可视化 diff（坐标等仍以字段行展示）  

---

## 二、方案定稿

**方案 B · 集合级 `DeploymentConfigChange` + `entities[]` 子模型**

- 设置项继续走 `details`  
- CRUD 集合走 `entities`（实体块 → 字段行）  
- 页面草稿 + 通用 Collection Adapter 做 diff，业务页只注册字段清单  

已否决：

- **A**：仅把实体压扁进 `details` — 实体边界与徽标语义弱  
- **C**：各页自研摘要字符串 — 不可维护、审计不一致  

---

## 三、信息架构

```
确认变更 / 变更记录（同一预览壳）
└── 导航分组（如：团队管理 / 角色与员工）
    └── 资源集合卡片（如「员工列表」+ 汇总：新增 2 · 修改 1 · 删除 1）
        └── 实体块（张三 · 新增 | 李四 · 修改 | 王五 · 删除）
            └── 字段行：字段名 | 改前 | → | 改后（改后高亮）
```

### 3.1 分组与卡片规则

- `groupPath` 写入侧一次算好（与层级对比方案相同）  
- 集合卡片 `label` = 集合中文名；`operation` = 汇总文案（新增 a · 修改 b · 删除 c）  
- 实体块徽标：`create` / `update` / `delete` → 新增 / 修改 / 删除  

### 3.2 字段行规则

- 仅展示 `before !== after` 的字段（写入侧过滤；预览侧兜底）  
- 新增：改前为空；删除：改后为空；修改：两侧均有值  
- 尽量全量业务字段（含平面图坐标、尺寸等）；预览区滚动，不默认截断  

### 3.3 预览优先级

1. 有 `entities` → 集合 → 实体 → 字段  
2. 否则有 `details` → 沿用设置项逐行对比  
3. 否则 → 单行 before/after 文本（旧数据回退）  

---

## 四、数据模型

在 `DeploymentConfigChange` 上扩展（均可选，向后兼容）：

```ts
type EntityChangeOp = "create" | "update" | "delete";

interface EntityFieldChange {
  key: string;
  label: string;
  before: string;
  after: string;
}

interface EntityChangeBlock {
  /** 稳定 id，如 employee:e_12、table:t_3 */
  entityKey: string;
  /** 展示名，如「张三」「A1」 */
  entityLabel: string;
  operation: EntityChangeOp;
  fields: EntityFieldChange[];
}

interface DeploymentConfigChange {
  fieldKey?: string;
  label: string;
  operation?: string;
  before: string;
  after: string;
  settingsPath?: string;
  groupPath?: string[];
  details?: ChangeDetailRow[];
  /** CRUD 集合结构化明细；预览优先于 details */
  entities?: EntityChangeBlock[];
  /** 缺省：有 entities → collection，否则 setting */
  changeKind?: "setting" | "collection";
}
```

### 4.1 摘要与相等性（强制）

缓冲层合并 / 去重与设置项方案对齐：

- **有 `entities`**：任一块 `operation` 或任一字段行 `before !== after` 即视为有变更；合并时按 `entityKey` 合并实体块，块内按字段 `key` 合并，再重算摘要与集合 `operation`  
- **无 `entities`**：沿用现有 `details` / `before === after` 规则  
- **禁止**两侧摘要写成相同空话；建议：  
  - `before`：如「原 12 项」  
  - `after`：如「现 13 项（新增 2 · 修改 1 · 删除 1）」或首个实体差异拼接  

### 4.2 集合去重键

`fieldKey` 使用集合稳定键，例如：

| fieldKey | label |
|----------|--------|
| `team.employees` | 员工列表 |
| `team.roles` | 角色列表 |
| `team.custom-breaks` | 自定义休息 |
| `team.overtime-rules` | 加班规则 |
| `team.shift-types` | 班次类型 |
| `team.shift-assignments` | 排班安排 |
| `foh.floor-plan` | 餐位平面图 |
| `foh.store-brands` | 店中店 |
| `foh.categories` / `foh.classifications` | 品类 / 分类 |
| `foh.menu-order-limits` | 菜单下单限制 |

---

## 五、写入流程

### 5.1 状态机

```
进入页面 → 快照 baseline（已保存集合）
     ↓
页内新增 / 编辑 / 删除 → 只改 pageDraft（不落库、不下发）
     ↓
点击「保存并下发」
  → 对各 Collection Adapter：diff(baseline, draft)
  → 产出 0..N 条带 entities 的 DeploymentConfigChange
  → 确认变更弹窗（层级 + 实体分组预览）
  → 确认后：落库 + 一条 DeploymentBatch（configChanges 含全部集合）
  → 清草稿，baseline = draft
```

放弃修改 / 离开拦截：复用页面批量保存的 dirty probe 与 guard。

### 5.2 Collection Adapter

业务页注册适配器，不自研预览文案：

```ts
interface CollectionAdapter<T> {
  collectionKey: string;   // → fieldKey
  collectionLabel: string; // → label
  idOf(item: T): string;
  labelOf(item: T): string;
  fields: Array<{
    key: string;
    label: string;
    get: (item: T) => unknown;
    format?: (v: unknown) => string;
  }>;
}
```

### 5.3 Diff 规则

| baseline | draft | 结果 |
|----------|-------|------|
| 无 | 有 | `create`，字段 before 空、after 为格式化值 |
| 有 | 有 | 逐字段比较，仅保留差异 → `update`；无差异则丢弃该实体 |
| 有 | 无 | `delete`，字段 after 空 |

补充：

- 嵌套对象 / 数组：浅层展开或走 `format`；**禁止**整段 JSON 进入预览  
- 无稳定 id：草稿阶段分配临时 id，commit 时落成正式 id  
- 仅 UI 态变更（选中项、弹窗开关）不参与 diff  

### 5.4 业务页映射

| 页面 | 集合（可多条） | 实体粒度 |
|------|----------------|----------|
| 角色与员工 | 员工列表；角色列表（若可维护） | 员工 / 角色 |
| 休息与加班 | 自定义休息、加班规则 | 休息项 / 规则项 |
| 排班 | 班次类型、排班安排 | 班次；某日×员工×班次 |
| 餐位平面图 | 平面图（或「区域」「桌位」两集合） | 区域 / 桌位（字段含坐标等） |
| 店中店 / 品类 / 分类 / 下单限制 | 各自列表集合 | 对应节点或规则 |

同一页多个集合 → 同一次保存写入多条 `configChanges`，共用导航 `groupPath`；无 diff 的集合不写。

---

## 六、边界情况

| 场景 | 处理 |
|------|------|
| 同实体先删后加（同 id） | 按最终态重算为一次 `update`（或净结果）；禁止同批同时出现删+增 |
| 同实体多次编辑 | 只保留 baseline → 最终 draft |
| 新建未填完又删除 | 相对 baseline 无净变更 → 不写该实体 |
| 全页无净变更 | 禁用「保存并下发」或提示无变更 |
| 旧历史无 `entities` | 回退 `details` / 单行文本 |
| 超长字段列表 | 预览滚动，不截断字段 |

---

## 七、UI 行为

- 「确认变更」与「变更记录」详情共用扩展后的 `renderChangePreviewSections`  
- 弹窗壳（标题、取消/确认、关闭）不变  
- 集合卡片汇总徽标色与现有新增/修改/删除一致；实体块使用同色系小徽标  
- 视觉沿用现有 design token  

---

## 八、改动文件清单（预期）

| 文件 / 模块 | 改动 |
|-------------|------|
| `deployment-types.ts` | `EntityFieldChange`、`EntityChangeBlock`、`entities`、`changeKind` |
| `deployment-change-buffer.ts` | `entities` 相等性、按 entityKey/字段 key 合并、摘要重算 |
| 新建 `collection-change-diff.ts`（或同目录） | Adapter 注册 + 通用 diff + 摘要生成 |
| `deployment-change-preview.ts` | 集合卡片 → 实体块 → 字段行 |
| `page-settings-draft` / `page-save-*` / `page-config-change` | 集合草稿与 commit 挂钩 |
| 各业务 UI（员工、休息加班、排班、平面图、店中店、分类、下单限制等） | 改草稿写入；commit 时 Adapter diff，去掉整包摘要记账 |

---

## 九、验收点

1. 员工页：新增 + 编辑 + 删除后一次保存 → 一条「员工列表」集合卡，实体分组 + 字段对比  
2. 自定义休息 / 加班规则：操作徽标正确，字段可读  
3. 排班：班次与安排可分两条集合；格子级实体字段可读，无整包 JSON  
4. 平面图：区域/桌位变更字段（含坐标等）出现在对应实体下  
5. 确认变更与变更记录详情同构  
6. 放弃修改不落库、不下发；旧记录可打开且不报错  

---

## 十、实现备注

- 与「层级对比可读化」并存：设置项 `details`、集合 `entities`，预览按优先级分支，勿互相覆盖  
- 平面图若拆成「区域」「桌位」两个 `fieldKey`，更易读；若单集合，则 `entityKey` 需带类型前缀（`area:` / `table:`）  
- 排班安排实体建议复合键：`assignment:{date}:{employeeId}:{shiftId}`，`entityLabel` 用人名 + 日期 + 班次名  
- P0 建议先接：自定义休息、餐位平面图、排班安排；再推广员工、店中店、分类、下单限制  
- 不改 Batch 下发协议；`configChanges` 仅增强可读快照，终端仍按配置域全量/增量拉取  
