# 限购数量「复制到其他产线」设计

## 背景

步骤 4 采用「先产线、后场景」后，运营常先在一条产线配完各人数×轮次上限，再希望把同一套数量规则同步到其他产线。各产线商品集合可能不同，但大量菜单在结构上共享同一 `key`；手工逐产线重填成本高。

## 目标

- 在当前门店内，将**源产线**的限购数量配置，按菜单 `key` 对齐后，**覆盖**复制到用户勾选的其他产线。
- 支持一次选择多条目标产线。
- 不改变 `limits` 键结构与选品范围（不因复制新增目标商品）。

## 已确认决策

| 决策 | 结论 |
|---|---|
| 入口形态 | 产线配置区「复制到其他产线」按钮 + 确认弹层 |
| 源产线 | 当前 `activeLineId` |
| 作用门店 | 仅当前 `activeStoreId` |
| 场景范围 | 源产线全部人数×轮次（多轮笛卡尔；非多轮仅 round `0`） |
| 目标选择 | 弹层多选本店其他产线（排除源），至少选 1 |
| 冲突 | 覆盖 |
| 空格 | 源未配置 → 目标对应格也写成未配置（对齐 key 后严格镜像） |
| 对齐规则 | 同一门店内，目标商品与源商品按结构 `key` 匹配（`structureTargetId` 中 `lineId` 不同、`key` 相同） |

## 入口与可用性

位置：步骤 4「产线配置」标题行，与「查看已配置规则」同级或相邻。

- 无参与门店 / 当前门店无效：不展示或 disabled。
- 本店可用产线少于 2 条：disabled，提示需至少两条产线。
- 源产线在全部人数×轮次下**没有任何** `configured === true` 的格：disabled（避免空同步）；文案可提示「请先配置当前产线数量」。

## 弹层

1. 说明：将把「{源产线名}」的全部场景数量覆盖到所选产线；仅对齐到双方都有的菜单；未对齐项跳过。  
2. 目标产线多选列表（checkbox），默认不选。  
3. 可选摘要（打开或变更勾选时计算）：预计将对齐写入的「目标商品 × 场景」格数、无法对齐的源/目标商品数（计数即可，不做逐格 diff 表）。  
4. 主按钮「覆盖复制」：未选目标时 disabled。  
5. 取消 / 遮罩 / Esc 关闭；不改数据。

弹层状态仅存 `editorState`（如 `lineLimitCopy`），不入库。

## 写入算法

`config = activeStoreConfig(draft)`，只读写 `config.limits`（当前门店），不写顶层 `draft.limits`。

对每个勾选的目标产线 `targetLineId`：

1. `sourceTargets = targetsForLine(draft, sourceLineId, config)`  
2. `destTargets = targetsForLine(draft, targetLineId, config)`  
3. 建 `key → sourceTarget` 映射（`target.key`）。  
4. 对每个 `partyIndex` × `roundIndex`（口径同 `eachLimitCell` / 多轮）：  
   - 对每个 `destTarget`：  
     - 若无同 `key` 的源目标 → **跳过**（保留目标原 cell）  
     - 若有：读源 `limitKey(party, round, sourceLineId, sourceTarget.id)`  
       - 源 cell 已配置 → 写入目标 `config.limits[limitKey(..., targetLineId, destTarget.id)] = { configured: true, value }`  
       - 源未配置 / 无 cell → 写入 `{ configured: false, value: null }`（与现网清空输入一致，不另开删 key 分支）  
5. 不修改源产线；不修改未勾选产线；不修改其他门店。

成功后：`markEditorDirty()`、关闭弹层、toast、`renderEditor()`。

### 计数口径

- **对齐写入次数**：目标侧「有同 key 源商品」的 `(destTarget × party × round)` 写入次数（含写成未配置）。  
- **跳过商品数（toast）**：目标产线上**没有任何**同 `key` 源商品的 `destTarget` 个数（按商品计，不按场景展开）。  
- 弹层可选摘要另报：源独有 key 数（无法落到目标）、目标独有 key 数（即跳过商品数）。

## 与平铺 / 分开选择

复制与展示模式无关：一律按整产线全场景写入。复制后仍停留在当前产线与当前展示模式。

## 非目标

- 跨门店复制  
- 仅复制当前人数/轮次  
- 复制前逐格 diff 预览表  
- 按商品行内单独复制  
- 因复制自动勾选/新增菜单结构节点  

## 验证

专项脚本至少断言：

1. 存在「复制到其他产线」入口标记与弹层标记  
2. 存在按 `key` 对齐并写入目标 `limitKey(..., targetLineId, ...)` 的助手函数  
3. 空源 cell 对已对齐目标会写成未配置  
4. 状态不进入 `defaultDraft` / 发布快照  
5. 无第二条产线或源无已配置时入口不可用（代码分支可断言）

浏览器：

- Kiosk 配完 → 复制到 eMenu：同 key 商品全场景一致（含禁止 0 与清空）  
- eMenu 独有商品不被误改；Kiosk 独有不同步出新品  
- 多选两条目标一次成功  
- 单产线门店入口不可用  
