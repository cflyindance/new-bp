# eMenu 调味 Detail 入口与共用商品详情设计

## 1. 目标与范围

### 目标

在调味设置中为商品建立调味关联后，eMenu 点餐菜单对该商品展示 **Detail** 按钮。食客点击 Detail 打开**共用商品详情**（现有 DishDialog），并在现有 Option 区域下方追加调味 Option 选择；确认后可直接加入购物车。

从加号进入的商品详情**不展示**调味 Option，避免与「仅规格/POS Option」路径混淆。

### 本期范围

- 菜单卡片：当 `buildTerminalSeasoningGroups` 对该商品产生**至少一个候选项**时显示 Detail；否则不显示。
- 共用 `DishDialog`，以 `entrySource: 'detail' | 'add'` 区分入口。
- Detail 入口：在 OptionList 下方挂载 `SeasoningBlock`；加购时写入订单调味快照。
- 加号入口：不挂载 `SeasoningBlock`；购物车行不带调味。
- 无规格 / 无 POS Option 时，Detail 仍打开共用详情（右栏可仅有调味区），确认后加购；调味非必选。
- 选择互斥与候选项构建对齐 `seasoning-terminal-rules`；弹层内临时选择用 `OrderSeasoningSelection`，落购物车用 `createOrderSeasoningSnapshot`。
- 终端侧读取既有门店调味完整快照（版本同步契约见 2026-08-12）；本期消费快照驱动 UI，不重做同步协议。

### 不在本期范围

- 新建第二套独立详情页 UI（仅样式复用既有 DishDialog，业务字段隔离）。
- 从加号入口选择或编辑调味。
- 强制必选调味后方可加购。
- 修改调味后台配置模型、关联规则或 Option 库。
- 与配置项 27 / 608「展示菜详情」合并为同一开关。
- 重做终端调味配置同步协议（沿用 2026-08-12）。
- POS 最终提交协议若未就绪：本期保证购物车行可携带调味快照；对接 POS 另列任务。

## 2. 背景与现状

| 概念 | 现状 |
| --- | --- |
| 调味关联 | `emenu-local/seasoning` 维护 `ProductSeasoningRelation`（动作 + Option + priceDelta） |
| eMenu 详情 | `vendor/emenu-new` 的 `DishDialog`：规格 + POS `optionList` |
| 食客调味 | `seasoning-terminal-rules` 已具备分组、互斥与订单快照；**尚未**挂到 DishDialog |
| 展示菜详情 | 配置 27 / 608 控制部分商品点菜开详情；与本 Detail **独立** |

「调味 Option」与 POS `optionList` 是两套数据，不得混写同一状态树。

## 3. 架构

```text
菜单卡片
  ├─ buildTerminalSeasoningGroups 非空？ → 显示 [Detail]
  ├─ [Detail] → open DishDialog(entrySource=detail)
  │                 ├─ PriceList / OptionList（既有）
  │                 └─ SeasoningBlock（新增，Option 下方）
  │                 └─ 加入购物车 → 菜品行 + seasoningSnapshots[]
  └─ [+] → 有规格/Option？ → DishDialog(entrySource=add)（无 SeasoningBlock）
            无 → 直接加购（无调味）
```

### 关键组件

| 单元 | 职责 |
| --- | --- |
| 菜单卡片（DishItemCard 等） | 用 `buildTerminalSeasoningGroups` 非空判断 Detail 显隐；分别触发 detail / add 打开详情 |
| DishDialog | 共用容器；按 `entrySource` 决定是否渲染 SeasoningBlock |
| SeasoningBlock | 渲染 `TerminalSeasoningChoice`、互斥选择、`priceDelta` 展示 |
| 调味快照读取 | 消费终端本地完整快照（version + products/relations/options）；失败沿用 2026-08-12 缓存回退 |
| 购物车行扩展 | 仅 detail 路径附加 `seasoningSnapshots`（见 §6） |

## 4. 入口与展示规则

1. **Detail 显隐**：对当前菜单商品，用快照中的 product / relations / options 调用 `buildTerminalSeasoningGroups`；返回的任一动作组 `choices.length > 0` → 显示 Detail；否则不显示。  
   （等价于：商品启用且可售、关联启用、对应 Option 启用，且至少有一条可展示候选项——与 2026-08-12「只展示商品、关联和公共 Option 均为启用」一致。）
2. **Detail 点击**：打开共用 DishDialog，`entrySource=detail`，展示调味区。
3. **加号点击**：
   - 需要规格或 POS Option 时打开同一 DishDialog，`entrySource=add`，**不**展示调味区。
   - 不需要弹窗时直接加购，购物车行无调味。
4. **与 27/608**：本 Detail 不依赖、不改写该配置；两者可并存，行为按各自入口解释。

## 5. 详情内布局

- 左栏：菜图 / 名称 / 数量（沿用现有）。
- 右栏自上而下：
  1. 规格 `PriceList`（有则显示）
  2. 现有 `OptionList`
  3. **`SeasoningBlock`（仅 `entrySource=detail`）**
  4. 备注等既有区块：调味块紧接 OptionList 之后、备注之前；实现时与现有 RightPanel 结构对齐
- 无规格且无 POS Option：右栏可仅有 SeasoningBlock + 加购。
- 调味与 POS Option 的 UI 状态、校验、提交字段完全隔离。

## 6. 数据与加购

### 候选项来源

- 统一调用 `buildTerminalSeasoningGroups`（内部已过滤停用项，并按动作固定顺序分组）。
- 同动作内排序：关联 `sortOrder`，相同再按 Option `sortOrder` 与名称（与 `seasoning-terminal-rules` 一致）。
- `priceDelta = 0` 不显示加价；大于零时用门店币种格式显示。

### 选择状态（弹层内）

- 使用 slim 类型 `OrderSeasoningSelection`：`{ action, optionId, priceDelta }`。
- 通过 `selectTerminalSeasoning` / `replaceSeasoningSelection` 维护：同一 Option 多动作互斥；不同 Option 可多选。
- 调味**非必选**：可不选任何调味直接加购。

### 购物车（落库形状）

两类形状职责分离，禁止混用：

| 用途 | 形状 |
| --- | --- |
| 弹层临时选择 | `OrderSeasoningSelection[]` |
| 购物车 / 订单行 | `createOrderSeasoningSnapshot` 的返回值数组，字段：`action`、`optionId`、`optionCode`、`optionName`、`transactionPrice`、`sortOrder` |

规则：

- `entrySource=detail`：菜品行带 `seasoningSnapshots`。未选任何调味时为 `[]`；有选则为对应 snapshot 数组。
- `entrySource=add`：行上**不出现** `seasoningSnapshots` 字段（不加空数组）。
- 成交价：在原有菜品价基础上累加所选 `transactionPrice`（即关联 `priceDelta` 快照）。

## 7. 错误与边界

| 场景 | 行为 |
| --- | --- |
| 无调味快照 / 校验失败 | 不显示 Detail；加号路径不受影响 |
| 打开 Detail 后快照更新导致候选项变空 | 打开详情且**不渲染** SeasoningBlock；不提示、不阻断规格选择与加购 |
| Option 停用 | 候选项不出现；已在购物车的历史行保留 snapshot |
| 仅有调味、无规格 | Detail → 确认可加购 |
| 同时有规格与调味 | Detail 一次完成规格 + 调味 + 加购 |

## 8. 验收标准

1. 仅当 `buildTerminalSeasoningGroups` 非空时菜单显示 Detail；否则不显示。
2. 点 Detail：详情中调味区在 Option 下方；未选调味时行上 `seasoningSnapshots=[]`；有选时含对应 snapshot。
3. 点加号进入详情：不可见调味区；加购行无 `seasoningSnapshots` 字段。
4. 同 Option 多动作互斥仍成立。
5. 仅有调味无规格时，Detail 可加购。
6. 不新增第二套详情页；不改调味后台配置模型。

## 9. 测试要点

- 卡片显隐：有可展示候选项 / 仅停用关联或停用 Option / 无快照。
- 双入口：detail 有调味块、add 无调味块。
- 互斥：同一 Option 切换动作。
- 加购载荷：detail 未选为 `[]`、有选为 snapshot；add 无字段。
- 无规格仅调味路径。
- 打开后候选项变空：不渲染 SeasoningBlock 仍可加购。
