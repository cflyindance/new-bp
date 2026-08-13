# eMenu 调味批量预览按商品分组设计

## 背景与目标

当前“调味设置 → 批量建立关联 → 预览确认”按候选关系逐条展示，同一商品的不同动作和 Option 会分散在多张卡片中，并可能因候选关系分页被拆到不同页面。此次将预览结构调整为“商品 → 动作 → Option”，使操作者能一次确认单个商品的完整调味配置。

目标：

- 每个商品作为一个顶层预览单元。
- 商品内部按动作分类，完整展示该动作下的 Option。
- 同一商品不跨页拆分。
- 预览提供可直接跳转的数字页码，并支持每页 `5、10、20、50` 个商品。
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

type BatchPreviewProductCursorPage = CursorPage<BatchPreviewProductGroup> & {
  unresolvedCount: number;
  summary: Record<BatchCandidateKind, number>;
};

type BatchPreviewProductNumberPage = {
  items: BatchPreviewProductGroup[];
  page: number;
  pageSize: 5 | 10 | 20 | 50;
  totalPages: number;
  totalProducts: number;
  unresolvedCount: number;
  summary: Record<BatchCandidateKind, number>;
};

type BatchPreviewProductPage = BatchPreviewProductCursorPage | BatchPreviewProductNumberPage;
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

客户端创建预览时同时提交原价、加价系数和实际价格。请求价格项只接受以下两种互斥格式：

- 新格式：`inputPrice`、`markupCoefficient`、`priceDelta` 三个字段全部存在且均为非 `null` 数值。
- 旧格式：仅存在 `priceDelta`；服务端规范化为 `inputPrice = priceDelta`、`markupCoefficient = 1.00`。

新增字段部分缺失、为 `null`、非数值或与旧格式混用不完整时返回 `invalid_price_fields`，不得静默按旧格式降级。无论请求采用哪种格式，两个预览读取接口始终返回完整三字段。

价格精度与边界规则：

- `inputPrice` 和 `priceDelta` 必须为有限数值且不小于 `0`，允许 `0`；金额精确到两位小数。
- `markupCoefficient` 必须为有限数值，范围为 `0.50–2.00`（含边界），精确到两位小数，不允许 `0` 或负数。
- 金额和系数输入本身不得超过两位小数；服务端基于数值的规范十进制字符串按 `整数部分 + 最多两位小数` 解析，不使用二进制浮点乘法。`1.005` 原价返回 `invalid_input_price`，`0.495` 或 `2.004` 系数返回 `invalid_markup_coefficient`；系数先验证原始精度，再验证范围，不先舍入后放行。
- 服务端将合法金额转换为整数分、系数转换为整数百分之一，再按 `实际价格分 = 四舍五入(原价分 × 系数百分之一 ÷ 100)` 计算；所有参与值均为整数，乘积只在此处进行一次正数四舍五入。
- 转换后的原价分、实际价格分以及中间乘积必须为安全整数；超出安全整数范围分别返回 `invalid_input_price` 或 `invalid_price_delta`。
- 输入原价非法返回 `invalid_input_price`；系数非法或越界返回 `invalid_markup_coefficient`；实际价格非法返回 `invalid_price_delta`。
- 服务端使用上述整数结果精确比较客户端 `priceDelta`；不一致返回 `invalid_price_calculation`，不创建预览。
- 设置动作页面必须调用与服务端同一合同的定点价格函数生成展示值和请求中的 `priceDelta`：原价转分、系数转百分之一、整数乘积单次舍入。前后端共用同一组精度测试向量，禁止前端直接使用浮点数相乘生成实际价格。

服务进程内可能已存在旧结构的活动预览。读取或提交旧候选关系时，服务端先按上述金额规则重新校验其 `priceDelta`，再按 `inputPrice = priceDelta`、`markupCoefficient = 1.00` 补全；负数、超过两位小数、非有限值或安全整数溢出返回 `invalid_price_delta` 并禁止提交，不得把未规范化值带入新响应。预览令牌过期或服务重启仍沿用现有 `preview_expired` 恢复流程。

现有 `BatchCandidate` 合同已经包含数值型 `sortOrder`，商品分组接口直接沿用该字段，不新增另一套 Option 顺序来源。对于历史或异常数据中缺失、非有限的 `sortOrder`，使用下述稳定回退顺序。

为避免破坏现有候选关系读取契约，保留 `GET /relation-previews/:token/items` 的响应结构和候选关系分页语义，新增：

`GET /relation-previews/:token/products`

新接口按商品返回分组页：

- `limit` 表示每页商品数。
- `cursor` 指向下一商品边界。
- 新增 `page` 表示从 `1` 开始的目标页码；页码模式下 `limit` 缺失时默认 `5`，否则只接受整数 `5、10、20、50`。响应返回 `page`、`pageSize`、`totalPages` 和 `totalProducts`。
- `page` 与 `cursor` 互斥，同时提供时返回 `invalid_pagination`；不提供 `page` 时沿用现有游标模式及原 `limit` 兼容规则。
- 页码必须为正安全整数，且 `(page - 1) × limit` 必须为安全整数；非法或溢出的页码、重复 `page` 参数返回 `invalid_page`。
- 页码模式下非法、非整数、非允许档位或重复的 `limit` 参数返回 `invalid_page_size`。
- `totalProducts` 是当前 `kind` 索引下的商品数，未传 `kind` 时为全部候选商品数；`totalPages = ceil(totalProducts / pageSize)`。零商品规则优先：无论请求 `page=1` 还是更大页码，均返回 `totalPages = 0`、`page = 1`、`items = []`。
- 非零商品时，超过 `totalPages` 的页码返回空 `items`、请求中的 `page` 和真实分页元数据，服务端不自动改写请求页码。
- 页码模式强制返回完整页码元数据且不返回 `nextCursor`；游标模式保持旧 `items/nextCursor/total/unresolvedCount/summary` 字段且不返回任何页码元数据。
- `kind` 仍用于候选关系状态筛选。
- 顶部 `summary` 仍按全部候选关系统计；自动处理策略下全局和商品级 `unresolvedCount` 固定为 `0`。
- 分组内 `optionCount` 按当前筛选后的可见候选关系计算。

当前批量向导使用商品分组接口的页码模式；旧候选关系接口和商品分组游标模式继续由兼容测试覆盖。两个读取接口共享同一预览令牌、候选关系和决定状态。

候选关系更新接口为兼容旧客户端保留，当前批量向导不再调用。旧客户端仅 PATCH `priceDelta` 时，服务端先执行与创建预览完全相同的有限、非负、两位精度和安全整数校验，非法值返回同一 `invalid_price_delta`；合法时同时重置为 `inputPrice = priceDelta`、`markupCoefficient = 1.00`。PATCH 后两个读取接口必须继续满足实际价格公式。提交批次仍只接收 `previewToken` 和 `expectedVersion`，不得重新接收任何价格字段。

## 分组、筛选与排序

后端处理顺序：

1. 创建预览时，在已有候选关系数组之外建立 `candidatesByProduct`、全量有序 `productIds` 和各 `kind` 对应的有序 `productIdsByKind` 索引，并缓存全局 `summary`；同时生成只读的 `indexVersion`。
2. 读取商品分组页时，根据 `kind` 选择对应商品 ID 索引；未筛选时使用全量索引。
3. 页码模式按安全的 offset 对商品 ID 索引切片；游标模式按 `afterProductId` 边界切片。两种模式都只读取本页商品 ID。
4. 从 `candidatesByProduct` 读取本页商品明细，再应用 `kind` 筛选。
5. 商品内按固定动作顺序分组。
6. 动作内 Option 按候选关系已有的数值型 `sortOrder` 升序、Option 名称升序和 `candidateId` 升序稳定排序；缺失或非有限的 `sortOrder` 排在有效值之后。

商品顺序使用 `productId` 的 Unicode 码点升序，避免依赖运行环境区域设置。已知动作固定按 `ADD、LESS、MORE、NONE` 排序；未来未知动作排在已知动作之后，并按动作代码 Unicode 码点升序排列。

预览索引仅在创建预览时构建一次。兼容接口中的决定和价格更新不会改变候选关系的 `productId`、`action`、`kind` 或排序字段，因此无须重建商品索引。

接口状态筛选后的语义：

- 只返回至少包含一条匹配候选关系的商品。
- 商品内仅展示匹配状态的 Option。
- 没有匹配 Option 的动作不展示。
- `optionCount` 和动作数量统计候选关系行数，而不是去重后的 `optionId` 数；同一个 Option 出现在不同动作下时分别计数。
- 筛选后的商品、动作和 Option 数量均以当前可见候选关系为准。
- `summary` 始终统计候选关系的原始 `kind`，不因分页、筛选、价格编辑或决定而改变。
- 全局和商品分组 `unresolvedCount` 固定为 `0`，确认操作不需要人工处理候选关系。
- 接口 `summary` 仍返回全局各原始状态数量，供兼容调用方使用；当前批量向导不展示该汇总。

## 更新后的页面行为

### 确认提交规则

- `new`：创建新关系并使用本批次价格。
- `same`：保持现有关系，计为跳过。
- `different`：自动使用本批次价格覆盖现有价格。
- `inactive`：自动重新启用并使用本批次价格。
- `unavailable`：自动跳过，不创建或修改关系。
- 预览页面不提供人工处理入口，确认按钮不受候选关系状态阻塞。
- 最终商品关系仍只保存 `priceDelta`（实际价格）；原价和加价系数仅属于本批次配置与预览数据，不改变终端快照结构。提交阶段只使用预览中已由服务端规范化并校验的 `priceDelta`，不得信任提交请求中的其他价格值。

### 分页

- 页面移除“全部状态”筛选区块，不再从批量向导传递 `kind`；接口仍保留 `kind` 供兼容调用方使用。
- 顶部商品/候选关系汇总继续保留，但移除“可直接确认”文案。
- 列表底部展示每页数量选择器、上一页、数字页码和下一页。
- 每页数量提供 `5、10、20、50`，默认 `5`；切换后回到第 `1` 页并重新请求。
- 点击数字页码可直接跳转，不依赖访问过的游标栈。
- 页码不超过 `7` 页时全部展示；超过 `7` 页时始终展示首页、末页和当前页前后各 `2` 页，断层位置使用省略号且省略号不可点击。
- 上一页和下一页分别切换到相邻数字页；首页禁用上一页，末页禁用下一页。
- 零商品时保留每页数量选择器，隐藏数字页码，上一页和下一页均禁用，当前页状态保持为 `1`。
- 单个商品的全部可见动作与 Option 始终位于同一页。
- 页码模式按 `start = (page - 1) × limit` 计算商品切片，商品顺序与现有稳定排序保持一致。
- 游标是服务端生成的不可透明解析字符串，内容绑定 `previewToken`、不可变的 `indexVersion`、`kind`、`limit` 和排他性的 `afterProductId`；任一作用域不匹配、商品 ID 不存在或游标格式无效时返回 `invalid_cursor`。
- 商品页按 `afterProductId` 之后的第一项开始，避免边界商品重复。
- 页码模式前端只保存 `previewPageNumber` 和 `previewPageSize`，不维护游标栈。
- 同一预览令牌内返回预览步骤时保留页码和每页数量；生成新预览令牌或关闭向导时重置为第 `1` 页、每页 `5` 个商品。
- 兼容游标调用方仍保存每页的“页起始游标”，第一页为 `undefined`。
- `indexVersion` 在预览创建时生成，只在重建或替换整个商品索引时变化；它不同于数据库 `expectedVersion`，决定和价格 PATCH 均不修改它。因此当前页起始游标不会因这些 PATCH 失效。若服务端检测到 `indexVersion` 不匹配，则返回 `invalid_cursor`，前端清空游标并回到当前筛选第一页，同时展示非阻断提示。
- 页码模式响应超过末页时：若 `totalPages > 0`，前端自动改为末页并重新请求；若 `totalPages = 0`，前端回到第 `1` 页并展示空状态。正常 UI 不生成超过 `totalPages` 的页码按钮。

### 折叠状态

- 首次出现的商品默认展开。
- 用户折叠后，以 `productId` 记录状态。
- 当前页刷新不改变折叠状态。
- 关闭批量向导后不持久化折叠状态。

## 异常处理

- 预览过期：沿用现有逻辑返回设置步骤并提示重新生成。
- 版本冲突：沿用现有版本冲突提示。
- 商品选择草稿失效：沿用现有恢复流程返回商品选择步骤。
- 页码模式分组页为空：按超末页规则自动恢复至末页，或在零商品时保持第 `1` 页空状态；兼容调用方可通过重新传入 `kind` 请求切换筛选。
- 商品游标无效：保留状态筛选和展开状态，清空分页游标并回到第一页。
- 页码参数无效：返回稳定错误码，前端恢复为默认每页 `5` 个商品的第 `1` 页。

## 测试与验收

### 自动化测试

- 同一商品的多个动作和 Option 被完整聚合。
- 动作固定按“添加、少放、多放、不要”排序。
- 动作内 Option 使用稳定排序。
- 商品分页不会拆分商品明细。
- 页码模式可直接跳转任意有效页面，并返回正确的 `page`、`pageSize`、`totalPages`。
- 每页 `5、10、20、50` 的商品切片、`totalProducts` 和总页数正确；覆盖零商品请求 `page=1` 与 `page>1` 均规范化为响应第 `1` 页、恰好整页、末页不足、非零商品 `page > totalPages` 以及带 `kind` 的统计；切换每页数量回到第一页。
- 页码响应强制具有完整数字分页元数据且无 `nextCursor`；游标响应保持旧合同且无数字分页元数据。
- 覆盖缺失 `limit` 默认值、非法/重复 `limit`、重复/超大页码和 `page + cursor` 冲突。
- 数字页码不超过 `7` 页时完整展示；以 `20` 页为例，首页为 `1 2 3 … 20`，第 `2` 页为 `1 2 3 4 … 20`，第 `10` 页为 `1 … 8 9 10 11 12 … 20`，第 `19` 页为 `1 … 17 18 19 20`，末页为 `1 … 18 19 20`。
- 新预览令牌重置为 `1/5`；同一令牌返回预览步骤恢复原页码和页容量；越界状态自动恢复到末页或空数据第 `1` 页。
- 兼容接口的状态筛选仍只保留匹配的商品、动作和 Option；当前页面不展示状态筛选。
- 同一个 `optionId` 出现在多个动作下时按多条候选关系统计并分别展示。
- `summary` 使用原始 `kind`，全局状态汇总不因当前分页改变。
- 设置动作页面使用“输入原价”字段名，并继续实时计算实际价格。
- 动作明细仅包含 Option、Option 原价、加价系数和实际价格，不存在价格输入框、状态标签和处理按钮。
- 预览接口返回的实际价格与服务端按原价和系数重新计算的结果一致；不一致请求被拒绝。
- 精确舍入用例覆盖乘积产生半分的场景，并断言只在最终乘积处舍入一次。
- 前后端使用同一组定点测试向量，设置动作页展示值、预览请求值和服务端响应值完全一致。
- 覆盖原价 `0`、系数 `0.50/2.00` 边界、负数、非有限数值、安全整数溢出和四类稳定错误码。
- 覆盖原价或系数超过两位小数时直接拒绝，不允许先舍入后通过范围或公式校验。
- 缺少新增价格字段的旧格式请求及旧活动预览按系数 `1.00` 兼容；部分字段缺失或 `null` 被拒绝。
- 旧价格 PATCH 后三个字段重新满足公式，两个预览读取接口返回一致。
- 旧价格 PATCH 的负数、超过两位小数、非有限值、边界值和安全整数溢出返回稳定结果。
- 旧活动预览中的合法价格被完整补全，非法旧值在读取和提交阶段均被拒绝。
- 批次提交只持久化服务端规范化的 `priceDelta`，商品关系和终端快照不包含原价或系数。
- 无人工决定时，差异价格自动覆盖、停用关系自动启用且不可用关系自动跳过。
- 更新候选关系后可使用当前页起始游标刷新，上一页导航仍正确。
- 无效、跨预览、跨筛选和错误 `limit` 的游标均被拒绝并触发前端恢复。
- 商品分组接口与旧候选关系接口共享预览数据，旧接口响应契约保持兼容。
- 现有批次提交与过期恢复验证继续通过。

### 浏览器验收

- 商品默认展开并支持折叠。
- 商品、动作和 Option 数量正确。
- 一个商品包含多个动作时，明细完整且层级清晰。
- 多商品分页不会把单个商品拆开。
- 页面不展示“可直接确认”和状态筛选区块。
- 分页展示可点击数字页码、上一页、下一页和每页数量选择器。
- 动作内只展示 Option、Option 原价、加价系数和实际价格，均不可编辑。
- 无须处理冲突即可确认建立关联。
- 浏览器控制台无错误。

## 非目标

- 不支持商品级或动作级批量冲突处理。
- 不持久化商品折叠状态。
- 不改变批次提交后的商品关系数据结构。
