# eMenu 调味单商品编辑与拖动排序设计

## 背景与目标

当前“调味关联”主列表已经按商品聚合展示，但点击商品行右侧“编辑”仍打开旧版侧边抽屉。旧抽屉的动作、Option 和价格编辑布局与“批量建立关联”不一致，也缺少新批量流程中的输入原价、加价系数、实际价格和批量价格编辑能力。

本次目标：

- 单商品编辑复用“批量建立关联”的动作与 Option 配置工作区。
- 单商品编辑不出现“选择商品”，采用“设置动作与 Option → 预览确认”两步流程。
- 批量新增和单商品编辑都支持动作排序与动作内 Option 排序。
- 排序必须进入预览、保存结果和调味关联主列表，关闭后重新进入仍保持一致。
- 单商品编辑保留并可修改历史关系状态；批量新增延续现有“配置到停用关系时重新启用”的语义，继续兼容只保存实际价格的现有关系模型。

## 已确认方案

采用“共享配置工作区 + 单商品两步编辑 + 复用现有 `sortOrder`”方案。

不复制一份批量向导配置页，也不增加 `actionSortOrder` 数据字段。批量新增与单商品编辑共享动作、Option、价格、状态和排序的草稿模型及配置工作区；两个外层流程分别负责商品范围、预览和提交。

## 用户流程

### 单商品编辑

1. 用户在“调味关联”商品行右侧点击“编辑”。
2. 页面打开与批量建立关联相同宽度和视觉结构的居中对话框。
3. 标题为“编辑商品调味关联”，步骤条只包含：
   - 设置动作与 Option
   - 预览确认
4. 步骤条下固定展示当前商品名称、分类、编码和关系数量，并标识“指定商品”。此流程不展示或允许切换商品。
5. 页面加载该商品全部现有关系与公共调味 Option，直接进入配置步骤。
6. 用户可新增、移除、切换和拖动动作；可对当前动作新增、移除、启停、调价及拖动 Option。
7. 点击“生成预览”，进入该商品修改后的完整配置预览。
8. 预览按当前动作顺序和动作内 Option 顺序展示名称、输入原价、加价系数、实际价格和状态。
9. 点击“确认保存”调用单商品关系保存接口；成功后关闭对话框并刷新主列表。

### 批量新增

批量建立关联仍保留原三步：

1. 选择商品
2. 设置动作与 Option
3. 预览确认

第二步改用共享配置工作区，并增加动作与 Option 拖动排序。预览和提交使用当前草稿顺序，不再把动作恢复成固定顺序，也不再按公共 Option 库顺序重新排序。

## 界面设计

### 对话框与商品上下文

- 单商品编辑使用与批量向导一致的居中大对话框：`max-w-6xl`、最大视口高度、固定标题与底部操作区，中部独立滚动。
- 商品信息采用弱底色信息条，位于步骤条和配置工作区之间。
- 第一步底部主按钮为“生成预览”；第二步为“确认保存”。
- 第二步允许返回第一步，返回后完整保留动作、Option、价格、状态和排序草稿。

### 动作区

- 左侧动作列表维持批量向导卡片样式。
- 每个动作卡片左侧增加拖动手柄。
- 拖动仅改变当前草稿中的动作顺序，不改变动作代码。
- 支持新增、移除和切换活动动作。
- 拖动过程中显示移动态和插入位置，放下后保持当前活动动作。

### Option 区

单商品编辑的 Option 表格列顺序：

`拖动 | 批量选择 | Option | 输入原价 | 加价系数 | 实际价格 | 状态 | 删除`

- Option 只能在当前动作内部拖动，不允许跨动作拖放。
- 批量选择只服务于价格填充，不参与排序选择。
- 输入原价允许编辑并参与批量填充。
- 加价系数只读。
- 实际价格实时按定点金额规则计算。
- 保留启用/停用开关；新增 Option 默认启用。
- 搜索只是过滤当前动作的 Option 行，不改变完整草稿顺序。
- 搜索词非空时暂停 Option 拖动和键盘排序，并提示“清除搜索后可调整顺序”；清空搜索后按完整草稿顺序恢复手柄。

批量建立关联不展示状态列，也不提供状态编辑。它继续沿用现有语义：本次配置命中某商品下已停用的同动作、同 Option 关系时，确认提交会将其重新启用；未被本次配置命中的停用关系保持停用。

### 拖动与无障碍

- 桌面端支持鼠标拖动，触屏设备使用 Pointer Events 拖动。
- 仅拖动手柄可以开始排序，避免输入框、复选框和状态开关误触。
- 手柄使用按钮语义和可读标签。
- 键盘聚焦手柄后可通过 `Alt + ArrowUp` / `Alt + ArrowDown` 调整顺序。
- 拖动状态使用样式和 `aria-live` 文案反馈；拖动结束后焦点返回被移动项手柄。

## 共享组件与状态边界

### 共享草稿模型

新增独立的关系配置草稿模型，负责：

- 有序动作集合。
- 每个动作下的有序 Option 集合。
- 每条 Option 的输入原价、只读系数、派生实际价格和原始关系标识。
- 状态是单商品编辑模式的可选扩展字段；批量模式不把跨商品的不同历史状态压入共享草稿。
- 新增/移除动作。
- 新增/移除/启停 Option。
- 动作和 Option 重排。
- 批量价格填充。
- 生成预览及保存载荷。

外层控制器不得通过 DOM 顺序作为最终数据源；拖动结束必须调用草稿模型的纯重排函数，再由模型重新渲染。

### 共享配置工作区

配置工作区负责渲染动作列表、Option 表格、动作选择器、Option 多选器及拖动交互。批量向导和单商品编辑向其提供草稿模型和变更回调。

批量向导继续负责商品选择 token、服务端批量预览 token、冲突恢复和批量提交。单商品编辑负责加载指定商品、生成本地完整预览和调用单商品保存接口。

## 价格与状态规则

### 历史关系

现有商品关系只持久化 `priceDelta`，不持久化输入原价与加价系数。加载历史关系时采用：

- `inputPrice = priceDelta`
- `markupCoefficient = 1.00`
- `actualPrice = priceDelta`

这保持现有关系模型和终端计价协议不变，也与此前“系数只存在于当前配置草稿”的决策一致。

### 新增关系

- 新增 Option 时生成一次 `0.50–2.00` 的随机只读系数。
- 输入原价默认为 `0`。
- 实际价格使用共享定点计算函数生成。
- 删除后重新加入视为新关系，并重新生成系数。

### 保存

单商品和批量提交最终仍只保存派生的实际价格 `priceDelta`、`sortOrder` 和状态，不保存输入原价与系数。

## 排序合同与编码

### 有序载荷是排序事实来源

前端提交时必须保持数组顺序：动作按草稿动作顺序出现，每个动作内的 Option 按草稿 Option 顺序出现。服务端不信任前端提交的任意 `sortOrder` 数字：

- 单商品 PUT 以请求 `relations` 中动作第一次出现的次序作为动作顺序，并以该动作关系在请求数组中的次序作为 Option 顺序。
- 批量预览以 `actionOptions` 数组顺序作为动作顺序，以每个 `optionPrices` 数组顺序作为 Option 顺序。
- 服务端统一生成持久化 `sortOrder`，前端不得用自定义数字覆盖。
- 请求中的动作、同动作 Option 组合必须唯一；出现重复时整次请求失败。
- 一个商品最多支持 4 个动作；每个动作最多支持 10,000 个 Option，超过限制返回明确校验错误。

### 新格式

复用现有关系 `sortOrder` 同时表达动作顺序和动作内 Option 顺序：

```text
sortOrder = 10_000_000 + actionIndex * 1_000_000 + (optionIndex + 1) * 10
```

其中动作和 Option 索引均从 0 开始。动作索引只能为 `0–3`，Option 索引只能为 `0–9,999`。所有生成值必须是正安全整数且在同一商品内唯一。`10_000_000` 是新排序格式的数字标记；每个动作占用独立的百万区间。

### 历史格式兼容

旧数据通常在每个动作内部从 `10` 重新编号，因此多个动作的最小排序值相同。只有当一个商品的全部关系同时满足以下条件时，才识别为新格式：

- 全部 `sortOrder` 都是大于等于 `10_000_010` 的正安全整数。
- 每个值减去 `10_000_000` 后可解析为动作区间 `0–3` 和 `10` 的正整数倍 Option 位次。
- 同一动作代码的全部关系落在同一动作区间，不同动作代码不共享区间。
- 每个动作内 Option 位次不超过 `10,000`，所有 `sortOrder` 唯一。

任一条件不满足时，整个商品一律作为历史格式处理，不允许部分按新格式、部分按旧格式混排。读取历史格式时：

1. 动作一律按 `ADD → LESS → MORE → NONE` 回退，不从旧数字猜测动作顺序。
2. 动作内按原 `sortOrder`、Option 库排序和稳定标识作为后续比较条件。
3. 用户保存后由服务端使用新格式重新编号该商品的全部关系。

单商品 PUT 和批量提交都必须由服务端在写库前生成并验证完整结果；禁止保存负数、小数、重复值、超出容量或不符合新编码的 `sortOrder`。

## 批量合并规则

批量建立关联不会删除未包含在本次草稿中的历史关系。服务端预览必须为每个目标商品构造“合并后的完整关系集”，而不是只返回本次候选。对每个目标商品分别合并：

- 本次配置的动作按拖动顺序排在前面。
- 未包含的历史动作排在后面，并保持原相对顺序。
- 在本次配置的动作内，本次配置的 Option 按拖动顺序排在前面。
- 未包含的历史 Option 排在后面，并保持原相对顺序。
- 合并后对该商品全部关系统一重新生成 `sortOrder`。
- 本次配置中已存在但仅排序变化的关系也必须更新，不得因为价格相同而跳过顺序保存。

批量预览把“候选判定”和“最终关系集”分开表达。商品项使用以下合同：

```ts
type BatchFinalConfiguredRelation = {
  source: "configured";
  includedInFinal: true;
  candidateId: string;
  relationId?: string;
  action: SeasoningActionCode;
  optionId: string;
  optionName: string;
  inputPrice: number;
  markupCoefficient: number;
  priceDelta: number;
  status: "active";
  kind: "new" | "same" | "different" | "inactive";
};

type BatchFinalPreservedRelation = {
  source: "preserved";
  includedInFinal: true;
  relationId: string;
  action: SeasoningActionCode;
  optionId: string;
  optionName: string;
  inputPrice: number;
  markupCoefficient: 1;
  priceDelta: number;
  status: SeasoningStatus;
  preservedReason: "not_configured" | "configured_but_unavailable" | "product_unavailable";
};

type BatchExcludedCandidate = {
  source: "configured";
  includedInFinal: false;
  candidateId: string;
  action: SeasoningActionCode;
  optionId: string;
  optionName: string;
  inputPrice: number;
  markupCoefficient: number;
  priceDelta: number;
  kind: "unavailable";
  reason: "product_inactive" | "product_not_sellable" | "option_inactive";
  existingRelationId?: string;
};

type BatchPreviewFinalProduct = {
  productId: string;
  productName: string;
  disposition: "merge" | "unchanged_unavailable";
  actions: Array<{
    action: SeasoningActionCode;
    items: Array<BatchFinalConfiguredRelation | BatchFinalPreservedRelation>;
  }>;
  excludedCandidates: BatchExcludedCandidate[];
  finalRelationCount: number;
};
```

`actions` 是唯一的最终写回关系集，只允许放入 `includedInFinal: true` 的判别联合；`excludedCandidates` 只用于解释不可用项，永不进入 `finalRelationCount` 或写回集合。两类最终关系都必须带有服务端补全后的价格与状态，前端不需要从候选信息推断持久化值。preserved 历史关系按现有兼容规则返回 `inputPrice = priceDelta`、`markupCoefficient = 1.00`，因此共享预览组件始终可以渲染输入原价、加价系数和实际价格三列。

不可用分支规则：

- 商品停用或不可售时，该商品 `disposition = "unchanged_unavailable"`；全部当前关系按 `source: "preserved"` 原值、原状态和原顺序进入 `actions`，所有本次候选进入 `excludedCandidates`。提交必须完全跳过该商品，连排序也不得修改。
- Option 在预览时已停用时，本次对应候选进入 `excludedCandidates`。若数据库中没有该关系，不进入最终关系集；若已有该关系，则它以 `preservedReason: "configured_but_unavailable"` 进入 `actions`，保持原价格、状态和相对于其他 preserved 关系的原顺序，不按本次拖动位置提前。
- 只有 `new / same / different / inactive` configured 项进入最终关系集；其中 inactive 按现有语义在最终结果中变为 active。

- 原有 `total`、冲突数和 created/updated/reactivated/skipped 计数只统计本次 configured 候选，避免改变现有统计含义。
- `finalRelationCount` 严格等于 `actions[].items.length` 之和，不包含 `excludedCandidates`。
- 提交时服务端重新解析同一预览 token 中的完整关系集和决定，逐商品原子写回最终排序。
- preserved 条目的价格、状态、关系 ID 和创建时间保持不变，只更新因完整重排产生的 `sortOrder`；是否把排序变化计入 updated 由审计事件单独记录，不进入原有业务统计。
- configured 的 inactive 条目按现有语义重新启用；preserved 的 inactive 条目保持停用。
- 任一目标商品校验失败时整次提交不写入，禁止出现部分商品已重排、部分未写入。

批量预览必须展示合并后的最终完整顺序，不能只展示候选关系顺序。

## 主列表顺序

商品聚合主列表不再无条件固定动作顺序：

- 通过完整格式校验的新数据按动作编码区间排序。
- 未通过完整格式校验的历史数据按固定动作顺序回退。
- 每个动作内 Option 按关系 `sortOrder` 排序。
- 搜索和动作筛选只裁剪可见内容，不修改保存顺序。

## 保存与冲突处理

### 单商品保存

- 进入编辑时记录配置版本。
- 生成预览不写服务器。
- “确认保存”使用记录的版本调用现有商品关系 PUT 接口。
- 保存载荷包含该商品全部关系，因此可正确表达删除、状态和完整顺序。
- 保存成功后刷新 bootstrap 与商品聚合列表。

### 错误处理

- 加载失败显示可重试状态，不进入空白编辑器。
- 非法价格阻止进入预览，并聚焦首个错误输入。
- 普通网络或暂时性保存失败时停留在预览步骤，保留完整草稿并允许直接重试。
- 版本冲突时禁止用旧版本直接重试。页面保留当前草稿，同时重新加载最新商品关系和版本，向用户展示“服务器最新配置”和“当前草稿”的冲突提示。用户可以选择放弃草稿并载入最新配置，或返回配置步骤在最新版本基础上重新确认完整覆盖；只有重新生成预览后才能再次保存。
- Option 在编辑期间被停用或删除时，保存失败并明确提示用户重新加载；不得静默丢弃。
- 关闭存在变更的编辑器时二次确认。

## 测试与验收

### 单元与结构测试

- 动作上移、下移和任意位置重排。
- Option 在动作内重排，拒绝跨动作移动。
- 键盘和 Pointer Events 最终调用相同纯重排函数。
- 搜索过滤后拖动不会丢失隐藏 Option，也不会错误覆盖完整顺序。
- 搜索词非空时鼠标、触屏和键盘排序全部禁用；清空后恢复完整顺序。
- 新 `sortOrder` 编码与恢复。
- 历史排序冲突回退固定顺序。
- 编码容量边界、正安全整数、唯一值以及非法格式拒绝。
- 历史价格按系数 `1.00` 初始化。
- 新增 Option 系数只生成一次。
- 状态保留和新增默认启用。

### API 测试

- 单商品保存后重新加载保持动作与 Option 顺序。
- 单商品删除 Option、删除整个动作后，PUT 发送该商品剩余全部关系且服务端准确删除缺失关系。
- 单商品价格、状态、排序保存后完整往返。
- 单商品生成本地预览不会写入服务端；从预览返回后草稿保持不变。
- 商品聚合接口按保存顺序返回动作和 Option。
- 批量预览保留请求中的拖动顺序。
- 批量提交更新仅排序变化的现有关系。
- 批量预览返回 configured 与 preserved 组成的完整最终关系集，计数语义保持兼容。
- 批量预览对新建 unavailable、已有 unavailable、Option 不可用及商品整体不可用分别返回确定的 final/excluded 归属。
- 批量合并保留未包含动作和 Option，并将其追加到配置内容之后；提交原子写回完整排序、价格和状态。
- 商品整体不可用时提交完全不修改该商品；其他任一商品写入失败时全批次回滚。
- 版本冲突不会覆盖其他配置；重新加载最新版本前不能再次保存。
- 编辑期间 Option 被停用或删除时阻止保存并保留草稿。

### 浏览器验收

- 点击商品“编辑”直接打开两步对话框，不出现商品选择。
- 编辑布局与批量建立关联配置步骤一致。
- 鼠标、触屏和键盘都可调整动作与 Option 顺序。
- 拖动价格输入、复选框或状态开关不会误触排序。
- 返回配置步骤后顺序、价格、状态不变。
- 保存后关闭并重新打开，顺序保持一致。
- 主列表按保存后的动作和 Option 顺序展示。

## 不在本次范围

- 不支持把 Option 直接跨动作拖放。
- 不持久化输入原价或加价系数。
- 不修改终端计价协议。
- 不提供跨商品的独立动作顺序模板。
