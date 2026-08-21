# 商家后台 KPOS 桌台完整属性与同步设计

## 目标

在“前厅管理中心 → 餐位平面图”中统一实现新增与编辑桌台属性，并与真实 KPOS Admin → Table 双向同步。界面继续使用无滚动条的右侧紧凑侧栏，新增时保留画布预览，编辑时复用同一字段组件。

本设计基于对 `192.168.96.96:22080` 的只读浏览器交互，以及真实 `tableManagement.js`、`adminService.js` 的代码核验。核验过程未调用保存接口。

## 真实 KPOS 行为证据

KPOS 桌台页面提供以下类型：

| 值 | 标签 |
| --- | --- |
| `RECTANGLE` | 方桌 |
| `ROUND` | 圆桌 |
| `HIBACHI` | 铁板桌 |
| `BAR` | 吧台 |
| `KTV` | 卡拉 OK |

`HIBACHI` 条件字段：

- `hibachiTableShape`: `0` Default(3-4-3)、`1` 2-4-2、`2` 4-4-4。
- `seatingOrientation`: `0` Left、`1` Right。

`KTV` 条件字段：

- `defaultSaleItemId`，候选项由 `FindSaleItemsType` 且 `onlyKTVItem=true` 返回。

桌子类别是独立的 `tableCategoryId`，候选项由 `FindTableCategoriesType` 返回；它既不是区域，也不是商家后台原有的“标准桌/卡座/吧台/包间”。

宽、高在 KPOS 表单中显示为百分比。读取时执行 `serverRatio * 100`，保存时执行 `inputPercent / 100`，最多保留 KPOS 使用的 5 位精度。

## 协议边界

真实 KPOS 有两条不同的写入路径：

### `SaveTableType`

用于新增或编辑单张桌台，`<app:table>` 可包含：

- `id`（新增时省略）
- `name`
- `x`、`y`
- `areaId`
- `width`、`height`
- `shape`
- `hibachiTableShape`
- `seatingOrientation`
- `defaultSaleItemId`
- `tableCategoryId`
- `defaultGuestCount`

这是桌台完整属性同步的唯一主写入接口。

### `SaveSeatingAreaType`

用于区域画布和批量布局。真实 Admin 序列化器不会写入 `hibachiTableShape`、`seatingOrientation` 或 `tableCategoryId`，因此不得依赖它保存桌台完整属性。

## 数据模型

桌台模型增加并保留 KPOS 原值：

```ts
type KposTableShape = "RECTANGLE" | "ROUND" | "HIBACHI" | "BAR" | "KTV";
type HibachiTableShape = "0" | "1" | "2";
type SeatingOrientation = "0" | "1";

type KposTableProperties = {
  kposShape: KposTableShape | string;
  hibachiTableShape?: HibachiTableShape | string | null;
  seatingOrientation?: SeatingOrientation | string | null;
  tableCategoryId?: string | null;
  defaultSaleItemId?: string | null;
};
```

未知 KPOS 枚举必须保留并以“未知值（原值）”显示。用户未主动选择已知值时，客户端不得静默覆盖未知值。

原有桌位分类、旋转角和按时计价规则属于商家扩展，继续放入“商家扩展（不写入 KPOS）”折叠区。铁板桌类型和座位排布不再只作为商家扩展：它们以 KPOS 为主数据源，同时保留本地镜像用于离线展示和恢复。

## 表单与条件联动

新增和编辑复用一个桌台属性表单：

1. 所属区域：新增可选；编辑显示当前区域并允许通过 `areaId` 移动。
2. 名称：输入时转为大写，与 KPOS 行为一致。
3. 人数。
4. 宽、高：显示百分比，范围 `(0, 100]`，最多 5 位精度。
5. 类型。
6. KPOS 桌子类别。
7. `HIBACHI` 时显示铁板桌类型和座位排布，隐藏 KTV 商品。
8. `KTV` 时显示默认销售商品，隐藏铁板桌字段。
9. 其他类型隐藏上述条件字段，但保留服务器原值，直至用户确认改变类型并保存。
10. 商家扩展折叠区。

侧栏固定视口高度并隐藏滚动条；目标区域和名称为单行，人数/类型、宽/高使用两列，条件字段使用两列，商家扩展默认折叠，底部按钮固定显示。若视口高度不足，使用更紧凑的控件高度，而不是裁掉保存按钮。

## 读取流程

进入餐位平面图时并行读取：

- `ListAreasType`
- 每个区域的 `ListTablesType`
- `FindTableCategoriesType`
- `FindSaleItemsType(onlyKTVItem=true)`

`ListTablesType` 解析必须包含 `hibachiTableShape`、`seatingOrientation`、`defaultSaleItemId` 和 `tableCategoryId`。类别或商品列表读取失败不应隐藏已有服务器原值；对应下拉变为只读并提示加载失败。

## 保存协调流程

### 新增桌台

1. 用户填写属性并生成画布预览。
2. “创建桌子”只生成带临时 ID 的本地草稿。
3. 点击“保存区域”时读取最新服务器基线并做冲突检查。
4. 对每张新增桌台调用一次 `SaveTableType`，省略 `id`，传递完整属性和目标 `areaId`。
5. 每次成功后立即回读目标区域，按区域、名称和完整属性签名唯一认领真实 ID，并持久化临时 ID → 真实 ID 映射。
6. 所有新增和属性编辑完成后，使用真实 ID 调用一次 `SaveSeatingAreaType` 保存最终布局。
7. 最终回读并用服务器快照替换本地状态。

### 编辑桌台

- 属性或 `areaId` 变化：调用 `SaveTableType`。
- 仅坐标或批量布局变化：调用 `SaveSeatingAreaType`。
- 属性和布局同时变化：先 `SaveTableType`，再 `SaveSeatingAreaType`。
- 商家扩展变化：写入扩展仓储，不进入 KPOS XML。

### 部分成功

每张桌台维护 `pending / table-saved / layout-saved / reconciled` 操作状态。`SaveTableType` 成功后必须先持久化真实 ID 和 `table-saved`，才能继续区域布局。若布局保存失败，界面显示“属性已同步，布局待同步”；重试只执行布局，不得再次新增桌台。

多个区域存在草稿时按区域顺序处理。某一区域失败后停止后续写入，已完成区域更新基线，失败和未提交区域保留草稿。

## 冲突、回读与幂等

- 每个区域首次变脏时固定服务器基线，重新打开侧栏不得覆盖。
- 保存前重新读取并比较桌台结构和属性指纹。
- 单桌目标指纹包含区域、名称、坐标、尺寸、人数、类型以及全部条件属性。
- `SaveTableType` 超时后必须回读：目标指纹唯一匹配则视为成功；基线匹配才允许明确重试；其他情况进入“结果不确定”并禁止重试。
- 新增桌台以目标区域、规范化名称和完整属性签名认领。0 匹配或多匹配均不得猜测 ID。
- 名称在 KPOS 全量桌台字典中保持唯一，与真实 `tableManagement.tables[name]` 行为一致，而不只在区域内唯一。
- 会话过期时停止写入并要求重新验证，不自动重放。
- 占用桌台允许修改非破坏性配置；删除仍要求状态为空或 `AVAILABLE` 且当前人数为 0。

## 校验

- 名称必填、转大写，并在 KPOS 全量桌台中唯一。
- 人数为大于 0 的整数。
- 宽、高为大于 0 且不超过 100 的有限数值，保存前除以 100。
- 类型为已知枚举；未知原值允许原样保存，但改变后只能选已知值。
- `HIBACHI` 必须选择合法的铁板桌类型和座位排布。
- `KTV` 的默认销售商品必须来自当前 KPOS 候选列表；若原值已失效，可保留并提示，用户主动更改后不得选择失效项。
- `tableCategoryId` 必须来自当前类别列表；服务器已有但列表缺失的原值按未知值保留。
- 坐标和尺寸不得超出逻辑画布。

## 测试与验收

### 纯逻辑

- 五种类型及未知值的双向映射。
- 百分比与归一化值往返精度。
- 条件字段显示、保留和清理规则。
- 全量名称唯一性。
- 完整属性指纹和临时 ID 唯一认领。
- `table-saved` 后布局失败的安全重试。

### UI

- 新增和编辑使用相同字段组件。
- 无滚动条侧栏在支持的桌面高度内完整显示操作按钮。
- HIBACHI/KTV/普通类型字段联动。
- 类别和 KTV 商品的加载中、失败、未知原值状态。
- 未同步、属性已同步、布局待同步、已同步状态展示。

### 集成

- 只读验证真实枚举、条件显示和接口响应。
- 在用户明确指定的测试区域中，分别新增并回读一种普通桌、铁板桌和 KTV 桌。
- 编辑既有测试桌的每个属性并回读确认。
- 验证并发修改、请求超时、会话过期和部分成功恢复。
- 未指定测试区域时不得向真实 KPOS 提交写请求。

## 非目标

- 不修改 KPOS 桌子类别管理本身。
- 不修改 KTV 商品管理。
- 不实现营运态开台、并台、转台或点餐功能。
