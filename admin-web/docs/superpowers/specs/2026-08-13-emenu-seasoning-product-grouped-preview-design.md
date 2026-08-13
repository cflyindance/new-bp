# eMenu 调味批量预览按商品分组设计

## 背景与目标

当前“调味设置 → 批量建立关联 → 预览确认”按候选关系逐条展示，同一商品的不同动作和 Option 会分散在多张卡片中，并可能因候选关系分页被拆到不同页面。此次将预览结构调整为“商品 → 动作 → Option”，使操作者能一次确认单个商品的完整调味配置。

目标：

- 每个商品作为一个顶层预览单元。
- 商品内部按动作分类，完整展示该动作下的 Option。
- 同一商品不跨页拆分。
- 动作明细仅展示 Option 和只读价格，避免在确认阶段再次修改配置。
- 价格差异、停用关系和不可用关系采用统一自动处理策略，不阻塞确认。
- 保持现有预览令牌、提交和异常恢复流程稳定。

## 采用方案

采用后端按商品分页的方案。预览接口返回若干商品分组，每个分组携带该商品在当前筛选条件下的全部动作和 Option 明细。分页游标以商品为边界，避免前端聚合候选关系页导致商品明细不完整，也避免把全部候选关系一次传输到客户端。

## 信息架构

预览层级为：

```text
商品 A                                      5 个 Option  ▼
├─ 添加                                      2 个
│  Option              Option 原价   加价系数   实际价格
│  香菜                $1.00          1.20       $1.20
│  辣椒                $2.00          1.20       $2.40
└─ 少放                                      3 个
   Option              Option 原价   加价系数   实际价格
   盐                  $0.50          1.60       $0.80
   糖                  $1.00          1.10       $1.10
   蒜                  $0.50          1.20       $0.60
```

### 商品层

- 每个商品展示为一张顶层卡片。
- 标题展示商品名称和当前可见 Option 总数。
- 商品默认展开，点击标题区域可折叠或展开。
- 展开状态由前端按 `productId` 保存。
- 切换页面后，新出现的商品默认展开；返回已访问页面时恢复原展开状态。

### 动作层

- 仅展示当前商品下有可见 Option 的动作。
- 动作固定按“添加、少放、多放、不要”排序。
- 动作标题展示动作名称和可见 Option 数量。

### Option 层

- 每个动作内固定为 `Option | Option 原价 | 加价系数 | 实际价格` 四列。
- `Option 原价` 对应设置动作页面原“输入价格”字段；设置动作页面同步将字段名称改为“输入原价”。
- `实际价格 = Option 原价 × 加价系数`，金额和系数均展示两位小数。
- 四列全部只读，不展示候选关系状态、内部编码或处理按钮。

## API 与类型

候选关系仍是预览、决定和提交的最小业务单元。新增仅用于读取的商品分组结构：

```ts
type BatchPreviewActionGroup = {
  action: SeasoningActionCode;
  items: Array<BatchCandidate & { decision?: BatchDecision }>;
};

type BatchPreviewProductGroup = {
  productId: string;
  productName?: string;
  optionCount: number;
  unresolvedCount: number;
  actions: BatchPreviewActionGroup[];
};

type BatchPreviewProductPage = CursorPage<BatchPreviewProductGroup> & {
  unresolvedCount: number;
  summary: Record<BatchCandidateKind, number>;
};
```

价格字段扩展为：

```ts
type BatchOptionPrice = {
  optionId: string;
  inputPrice: number;
  markupCoefficient: number;
  priceDelta: number;
};

type BatchCandidate = {
  // 其余候选关系字段保持不变
  inputPrice: number;
  markupCoefficient: number;
  priceDelta: number;
};
```

客户端创建预览时同时提交原价、加价系数和实际价格。服务端分别规范化金额与系数，并重新计算 `inputPrice × markupCoefficient`；提交的 `priceDelta` 与重新计算结果不一致时返回 `invalid_price_calculation`，不创建预览。兼容旧调用方：缺少原价或系数时使用 `inputPrice = priceDelta`、`markupCoefficient = 1`，使旧请求仍可读取和提交。

现有 `BatchCandidate` 合同已经包含数值型 `sortOrder`，商品分组接口直接沿用该字段，不新增另一套 Option 顺序来源。对于历史或异常数据中缺失、非有限的 `sortOrder`，使用下述稳定回退顺序。

为避免破坏现有候选关系读取契约，保留 `GET /relation-previews/:token/items` 的响应结构和候选关系分页语义，新增：

`GET /relation-previews/:token/products`

新接口按商品返回分组页：

- `limit` 表示每页商品数。
- `cursor` 指向下一商品边界。
- `kind` 仍用于候选关系状态筛选。
- 顶部 `summary` 仍按全部候选关系统计；自动处理策略下全局和商品级 `unresolvedCount` 固定为 `0`。
- 分组内 `optionCount` 按当前筛选后的可见候选关系计算。

当前批量向导切换到新接口；旧候选关系接口继续由兼容测试覆盖。两个读取接口共享同一预览令牌、候选关系和决定状态。

候选关系更新接口为兼容旧客户端保留，当前批量向导不再调用。提交批次仍使用 `previewToken` 和 `expectedVersion`。

## 分组、筛选与排序

后端处理顺序：

1. 创建预览时，在已有候选关系数组之外建立 `candidatesByProduct`、全量有序 `productIds` 和各 `kind` 对应的有序 `productIdsByKind` 索引，并缓存全局 `summary`；同时生成只读的 `indexVersion`。
2. 读取商品分组页时，根据 `kind` 选择对应商品 ID 索引；未筛选时使用全量索引。
3. 先对商品 ID 索引执行游标分页，只读取本页商品 ID。
4. 从 `candidatesByProduct` 读取本页商品明细，再应用 `kind` 筛选。
5. 商品内按固定动作顺序分组。
6. 动作内 Option 按候选关系已有的数值型 `sortOrder` 升序、Option 名称升序和 `candidateId` 升序稳定排序；缺失或非有限的 `sortOrder` 排在有效值之后。

商品顺序使用 `productId` 的 Unicode 码点升序，避免依赖运行环境区域设置。已知动作固定按 `ADD、LESS、MORE、NONE` 排序；未来未知动作排在已知动作之后，并按动作代码 Unicode 码点升序排列。

预览索引仅在创建预览时构建一次。兼容接口中的决定和价格更新不会改变候选关系的 `productId`、`action`、`kind` 或排序字段，因此无须重建商品索引。

状态筛选后的语义：

- 只返回至少包含一条匹配候选关系的商品。
- 商品内仅展示匹配状态的 Option。
- 没有匹配 Option 的动作不展示。
- `optionCount` 和动作数量统计候选关系行数，而不是去重后的 `optionId` 数；同一个 Option 出现在不同动作下时分别计数。
- 筛选后的商品、动作和 Option 数量均以当前可见候选关系为准。
- `summary` 始终统计候选关系的原始 `kind`，不因分页、筛选、价格编辑或决定而改变。
- 全局和商品分组 `unresolvedCount` 固定为 `0`，确认操作不需要人工处理候选关系。
- 顶部状态汇总仍显示全局各原始状态数量，便于切换筛选。

## 更新后的页面行为

### 确认提交规则

- `new`：创建新关系并使用本批次价格。
- `same`：保持现有关系，计为跳过。
- `different`：自动使用本批次价格覆盖现有价格。
- `inactive`：自动重新启用并使用本批次价格。
- `unavailable`：自动跳过，不创建或修改关系。
- 预览页面不提供人工处理入口，确认按钮不受候选关系状态阻塞。
- 最终商品关系仍只保存 `priceDelta`（实际价格）；原价和加价系数仅属于本批次配置与预览数据，不改变终端快照结构。

### 分页

- 上一页和下一页按商品页切换。
- 单个商品的全部可见动作与 Option 始终位于同一页。
- 游标是服务端生成的不可透明解析字符串，内容绑定 `previewToken`、不可变的 `indexVersion`、`kind`、`limit` 和排他性的 `afterProductId`；任一作用域不匹配、商品 ID 不存在或游标格式无效时返回 `invalid_cursor`。
- 商品页按 `afterProductId` 之后的第一项开始，避免边界商品重复。
- 前端保存每页的“页起始游标”，第一页为 `undefined`，支持返回上一页以及更新候选关系后刷新原页。
- 切换 `kind` 时必须清空游标栈并回到第一页。
- `indexVersion` 在预览创建时生成，只在重建或替换整个商品索引时变化；它不同于数据库 `expectedVersion`，决定和价格 PATCH 均不修改它。因此当前页起始游标不会因这些 PATCH 失效。若服务端检测到 `indexVersion` 不匹配，则返回 `invalid_cursor`，前端清空游标并回到当前筛选第一页，同时展示非阻断提示。
- 空页或筛选结果耗尽时展示明确空状态。

### 折叠状态

- 首次出现的商品默认展开。
- 用户折叠后，以 `productId` 记录状态。
- 当前页刷新不改变折叠状态。
- 关闭批量向导后不持久化折叠状态。

## 异常处理

- 预览过期：沿用现有逻辑返回设置步骤并提示重新生成。
- 版本冲突：沿用现有版本冲突提示。
- 商品选择草稿失效：沿用现有恢复流程返回商品选择步骤。
- 分组页为空：展示空状态，并允许切换状态筛选或返回上一页。
- 商品游标无效：保留状态筛选和展开状态，清空分页游标并回到第一页。

## 测试与验收

### 自动化测试

- 同一商品的多个动作和 Option 被完整聚合。
- 动作固定按“添加、少放、多放、不要”排序。
- 动作内 Option 使用稳定排序。
- 商品分页不会拆分商品明细。
- 状态筛选只保留匹配的商品、动作和 Option。
- 同一个 `optionId` 出现在多个动作下时按多条候选关系统计并分别展示。
- `summary` 使用原始 `kind`，全局状态汇总不因当前分页改变。
- 设置动作页面使用“输入原价”字段名，并继续实时计算实际价格。
- 动作明细仅包含 Option、Option 原价、加价系数和实际价格，不存在价格输入框、状态标签和处理按钮。
- 预览接口返回的实际价格与服务端按原价和系数重新计算的结果一致；不一致请求被拒绝。
- 缺少新增价格字段的旧预览请求按系数 `1` 兼容。
- 无人工决定时，差异价格自动覆盖、停用关系自动启用且不可用关系自动跳过。
- 切换状态筛选会清空游标并从第一页开始。
- 更新候选关系后可使用当前页起始游标刷新，上一页导航仍正确。
- 无效、跨预览、跨筛选和错误 `limit` 的游标均被拒绝并触发前端恢复。
- 商品分组接口与旧候选关系接口共享预览数据，旧接口响应契约保持兼容。
- 现有批次提交与过期恢复验证继续通过。

### 浏览器验收

- 商品默认展开并支持折叠。
- 商品、动作和 Option 数量正确。
- 一个商品包含多个动作时，明细完整且层级清晰。
- 多商品分页不会把单个商品拆开。
- 状态筛选正常；动作内只展示 Option、Option 原价、加价系数和实际价格，均不可编辑。
- 无须处理冲突即可确认建立关联。
- 浏览器控制台无错误。

## 非目标

- 不支持商品级或动作级批量冲突处理。
- 不持久化商品折叠状态。
- 不改变批次提交后的商品关系数据结构。
