# 自助餐每轮总量、指定对象与相同菜品组合规则

> 状态：已确认  
> 日期：2026-08-31  
> 适用范围：前厅管理中心 / 自助餐规则  
> 权威关系：本文是《前厅管理中心「自助餐规则」独立模块设计》和《自助餐规则“菜品集”限购对象设计》的规范性扩展。涉及每轮固定额度、总量上下限、指定分类、指定菜品集及相同菜品上限时，以本文为准。

## 1. 变更结论

自助餐规则新增并统一支持三类约束：

1. 每轮菜品总量上下限；
2. 指定菜品、指定分类或指定菜品集的最大上限；
3. 每轮相同菜品的统一最大上限。

旧设计中“按桌/订单不配置轮次”“不支持固定每桌每轮上限”的限制，不再适用于本文定义的每轮规则。按桌/订单仍表示整桌共享固定额度，但统计周期可以是整个订单或当前轮；按人数规则表示人均配置额度乘当前订单有效就餐人数，不识别具体食客。

本文确认两组指定对象组合：

- 菜品集版本：指定菜品、指定菜品集；
- 分类版本：指定菜品、指定分类。

分类和菜品集均为共享数量池，但来源不同：分类来自正式菜单分类结构；菜品集是规则内人工选择的多个菜品身份，可以跨产线。

## 2. 统一术语与公式

设：

- `N`：当前订单有效就餐人数；
- `Q_total`：当前订单当前轮全部有效菜品数量，不限定商品范围；
- `Q_dish(d)`：当前轮指定菜品 `d` 的有效数量；
- `Q_category(c)`：当前轮分类 `c` 下全部有效菜品数量之和；
- `Q_set(s)`：当前轮菜品集 `s` 的全部有效成员数量之和；
- `L`：规则中配置的数量；
- `Min`、`Max`：规则中配置的总量下限和上限。

按桌/订单的有效额度：

```text
EffectiveLimit = L
```

按人数的有效额度：

```text
EffectiveLimit = L × N
```

按人数仅用于计算整桌共享额度，不建立食客、座位或点餐人的独立计数器。

## 3. 权威场景表

### 3.1 总量约束

| 场景 | 实际约束 | 含义 |
|---|---|---|
| 每轮菜品总数最少 `Min` | `Q_total >= Min` | 整桌当前轮至少提交多少份 |
| 每轮菜品总数最多 `Max` | `Q_total <= Max` | 整桌当前轮最多提交多少份 |
| 每人每轮菜品总数最少 `Min` | `Q_total >= Min × N` | 按有效人数计算当前轮最低数量 |
| 每人每轮菜品总数最多 `Max` | `Q_total <= Max × N` | 按有效人数计算当前轮最高数量 |

总量规则允许同时配置最少与最多。最少数量只属于总量约束，不用于强制点指定菜品、分类或菜品集。

### 3.2 指定菜品、分类和菜品集上限

| 场景 | 实际约束 |
|---|---|
| 每轮指定菜品最多 `L` | `Q_dish(d) <= L` |
| 每轮指定分类最多 `L` | `Q_category(c) <= L` |
| 每轮指定菜品集最多 `L` | `Q_set(s) <= L` |
| 每人每轮指定菜品最多 `L` | `Q_dish(d) <= L × N` |
| 每人每轮指定分类最多 `L` | `Q_category(c) <= L × N` |
| 每人每轮指定菜品集最多 `L` | `Q_set(s) <= L × N` |

指定分类与指定菜品集均按成员合并统计，不是对每个成员分别配置同一个上限。

### 3.3 相同菜品上限

| 场景 | 实际约束 |
|---|---|
| 每轮相同菜品最多 `L` | 当前轮任意菜品 `d` 均满足 `Q_dish(d) <= L` |
| 每人每轮相同菜品最多 `L` | 当前轮任意菜品 `d` 均满足 `Q_dish(d) <= L × N` |

“相同菜品”规则是统一单品上限，不要求逐项选择菜品。本期不提供额外商品范围字段，对生效门店全部菜单菜品分别执行。菜品身份固定为 `storeId + productLineId + dishId`；相同 `dishId` 出现在不同产线时是两个独立身份，各自拥有一份额度。

## 4. 组合计算

所有命中的规则为逻辑“并且”，必须同时满足，不采用后配置覆盖前配置。

### 4.1 总量边界合并

```text
EffectiveMin = max(所有命中的固定下限和按人数换算后的下限)
EffectiveMax = min(所有命中的固定上限和按人数换算后的上限)

EffectiveMin <= Q_total <= EffectiveMax
```

任一时点出现 `EffectiveMin > EffectiveMax`，即为无可行解。

### 4.2 相同对象上限合并

同一菜品、分类或菜品集同时命中固定每轮和每人每轮规则时：

```text
对象最终上限 = min(每轮固定上限, 每人额度 × N, 其他命中上限)
```

例如肉类每轮最多 5 份、每人每轮最多 2 份，则：

```text
肉类最终上限 = min(5, 2 × N)
```

菜品集使用完全相同的组合公式。

### 4.3 不同层级叠加

一次加菜、改量或提交当前轮时依次受到以下约束：

```text
当前轮全部菜品总数
  ├─ 指定分类合计
  ├─ 指定菜品集合计
  ├─ 指定菜品数量
  └─ 任意相同菜品数量
```

总量未超限不代表指定分类、菜品集或单品一定允许；任一上限超限，整批操作失败。总量下限仅在“提交/结束当前轮”时检查，不在逐次加菜、减菜或改量时检查，避免阻止顾客逐步达到最低数量。

## 5. 组合示例

### 5.1 总量、分类和相同菜品

配置：

- 每轮总数最少 2、最多 8；
- 肉类每轮最多 5；
- 每轮相同菜品最多 2。

允许：五花肉 2 + 牛肉 2 + 羊肉 1 + 蔬菜 3，共 8 份。  
拒绝：五花肉 3 + 牛肉 1，共 4 份；虽然总量和肉类合计未超限，但相同菜品上限已超限。

### 5.2 总量、菜品集和指定菜品

菜品集 A 包含五花肉、牛肉和羊肉，配置：

- 每轮总数最多 8；
- 菜品集 A 每轮最多 5；
- 五花肉每轮最多 2。

允许：五花肉 2 + 牛肉 2 + 羊肉 1，共占用菜品集 5 份。  
拒绝：五花肉 3 + 牛肉 1；菜品集合计仅 4 份，但五花肉单品超限。

### 5.3 固定每轮与每人每轮共同生效

配置：

- 菜品集 A 每轮最多 5；
- 每人每轮菜品集 A 最多 2。

1、2、3 人时最终上限分别为 2、4、5。分类规则使用相同计算方法。

### 5.4 总量上下限共同生效

配置：

- 每轮总数范围 2～8；
- 每人每轮总数范围 1～3。

```text
最终下限 = max(2, 1 × N)
最终上限 = min(8, 3 × N)
```

当 `N = 9` 时最终下限为 9、上限为 8，规则无可行解。

## 6. 冲突与可满足性校验

草稿保存只要求 JSON 和字段结构可持久化；业务冲突、配置不完整和不可满足性作为草稿诊断展示，不阻止自动保存或“保存草稿”。发布、启用和运行时执行硬校验，至少包括：

1. 同一规则中总量 `Min <= Max`；
2. 在门店权威容量字段 `supportedPartySizeMax` 内，对规则覆盖的每个人数值换算后满足 `EffectiveMin <= EffectiveMax`；该字段来自门店配置并随发布快照固化，必须是大于 0 的整数；当前原型数据未配置时规范化为 `99`；
3. 同门店、同对象和适用范围存在交集时，不允许相同计算口径的重复规则；适用范围交集按人数区间、轮次区间、日期/周期、营业时段、会员、门店和启用状态的可满足交集计算，不要求区间或条件文本完全相等；
4. 同口径且生效条件重叠的两个菜品集不得包含相同菜单身份；
5. 不同口径可以叠加，例如固定每轮分类上限和每人每轮分类上限；
6. 总量最低要求必须在分类/菜品集上限、指定菜品上限、相同菜品上限和当前候选菜品集合下存在可行解；
7. 批量提交按整批新增后的最终状态校验，任一约束失败则整批不写入。

菜单可满足性可能因售罄、停售或菜单变化而动态改变。配置阶段基于发布候选菜单校验；进行中的订单继续使用锁定菜单/规则快照判断历史明细身份和累计量，售罄或停售不会移除已经计数的明细。提交当前轮时，以锁定快照中仍可追加的菜品作为可行性候选集合。若动态变化导致最低数量无法满足，返回明确原因，并只允许具有“取消/作废当前轮”权限的员工取消该轮；数量授权不得绕过最低数量。

## 7. 产品与数据边界

- 每个总量、指定菜品、指定分类、指定菜品集或相同菜品约束都是一条独立规则对象；一条规则不同时携带两种对象。不同对象规则可在同一门店部署并共同命中。
- 指定菜品、分类和菜品集只支持最大值；指定对象最少数量属于未来“必点规则”，不在限购模块实现。
- 分类身份至少包含 `storeId + productLineId + categoryId`；菜品集成员身份沿用 `storeId + productLineId + dishId`。
- 每家门店独立保存商品范围与数量矩阵。
- 固定每轮规则与每人每轮规则是不同计算口径，允许同时存在。
- `0` 表示禁止下单，空值表示未配置；未配置不得按 `0` 处理。

## 8. 授权边界

服务员密码授权仍支持“本次操作 / 当前轮 / 当前订单”。授权只绕过命中的数量规则，不绕过售罄、停售、年龄、支付限制或规则数据异常。授权后的数量继续进入 `Used`，后续操作仍基于授权后的真实累计量计算。

总量下限未满足不属于“超量”场景，默认不提供超限授权；若未来需要跳过最低消费要求，应定义独立权限和审计事件。

## 9. 验收标准

1. 每轮和每人每轮总量上下限可以组合，按最大下限、最小上限计算。
2. 分类内任意成员共同消耗分类额度；菜品集成员跨产线共同消耗菜品集额度。
3. 固定每轮与每人每轮的同对象规则可以叠加并取更严格上限。
4. 指定菜品上限、分类/菜品集共享上限和相同菜品上限同时命中时全部执行。
5. 总量下限高于有效上限时允许保存草稿，但阻止发布、启用或提交当前轮，并指出冲突区间。
6. 相同口径重复规则被阻止，不同口径叠加规则被允许。
7. 指定对象不提供最少数量配置。
8. 批量下单原子校验，失败时不产生部分写入。

## 10. 规范性数据模型

仓库 envelope 继续使用 `schemaVersion: 1`。使用本文新增能力的规则使用规则级 `schemaVersion: 3`；旧规则保持原版本并按 `constraintKind = target_max` 读取，不因查看而自动升级。

```ts
type ConstraintKind = "target_max" | "round_total" | "same_dish_max";
type Subject = "order" | "party_size";
type Period = "order_lifetime" | "per_round" | "multi_round";
type TargetType = "dish" | "category" | "dish_set" | null;

type LimitCell = {
  configured: boolean;
  value: number | null;
};

type TotalBoundCell = {
  minConfigured: boolean;
  min: number | null;
  maxConfigured: boolean;
  max: number | null;
};

type StoreConfigBaseV3 = {
  included: boolean;
  structureByLine: Record<string, unknown[]>;
  productLines: string[];
  targetIds: string[];
};

type TargetDishCategoryStoreConfigV3 = StoreConfigBaseV3 & {
  limits: Record<string, LimitCell>;
};

type DishSetStoreConfigV3 = StoreConfigBaseV3 & {
  dishSetMembers: DishSetMember[];
  dishSetLimits: Record<string, LimitCell>;
};

type RoundTotalStoreConfigV3 = StoreConfigBaseV3 & {
  totalBounds: Record<string, TotalBoundCell>;
};

type SameDishStoreConfigV3 = StoreConfigBaseV3 & {
  sameDishLimits: Record<string, LimitCell>;
};

type StoreConfigV3 =
  | TargetDishCategoryStoreConfigV3
  | DishSetStoreConfigV3
  | RoundTotalStoreConfigV3
  | SameDishStoreConfigV3;

type BuffetRuleV3 = {
  schemaVersion: 3;
  constraintKind: ConstraintKind;
  subject: Subject;
  period: Period;
  targetType: TargetType;
  partyRanges: Range[];
  roundRanges: Range[];
  storeConfigs: Record<string, StoreConfigV3>;
};
```

`round_total` 的 `totalBounds`、`same_dish_max` 的 `sameDishLimits` 和 `target_max + dish_set` 的共享 `dishSetLimits` 使用两段键 `partyRangeIndex|roundRangeIndex`。`target_max + dish/category` 继续使用原有四段键 `partyRangeIndex|roundRangeIndex|productLineId|targetId`，以表达多个独立目标。`order` 主体使用 `partyRangeIndex = 0`；`per_round` 使用 `roundRangeIndex = 0`；只有 `multi_round` 根据轮次区间选择索引。

字段有效性和权威来源：

| 组合 | 权威数量字段 | 其他数量字段 |
|---|---|---|
| `target_max + dish/category` | `limits` | 忽略 |
| `target_max + dish_set` | `dishSetLimits` | 忽略 |
| `round_total` | `totalBounds` | 忽略 |
| `same_dish_max` | `sameDishLimits` | 忽略 |

从 v1 进入 v3 时，保留 `structureByLine/productLines/targetIds/limits` 并补充 `included`；从 dish-set v2 进入 v3 时，保留 `dishSetMembers/dishSetLimits` 并补充 `included`。切换到不同 `constraintKind` 必须经过重置确认，确认后清空不再权威的数量字段。旧规则仅查看或加载时不得写回升级。

规则合法组合：

| `constraintKind` | 主体 | 周期 | 对象 |
|---|---|---|---|
| `round_total` | `order` | `per_round` | `null` |
| `round_total` | `party_size` | `per_round` | `null` |
| `same_dish_max` | `order` | `per_round` | `null` |
| `same_dish_max` | `party_size` | `per_round` | `null` |
| `target_max` | `order` | `per_round` | `dish/category/dish_set` |
| `target_max` | `party_size` | `per_round` | `dish/category/dish_set` |

原有 `order_lifetime`、按人数每单和分轮次 `target_max` 组合继续合法。`round_total` 和 `same_dish_max` 本期只支持每轮，不支持整单或分轮次。

`round_total` 和 `same_dish_max` 不要求商品目标，但必须选择至少一家配置门店；通过 `StoreConfigV3.included` 表示门店参与配置。`target_max` 继续以有效商品目标判断配置门店。

## 11. 编辑器与完整性规则

- 规则类型增加“每轮菜品总量”“指定对象上限”“相同菜品统一上限”。
- 总量规则的数量页每个“门店 × 人数区间”显示最少、最多两个输入；至少配置一侧，双侧配置时必须 `min <= max`。
- 相同菜品规则的数量页每个“门店 × 人数区间”显示一个最大值输入。
- 指定对象规则沿用现有商品选择和数量矩阵；每轮固定规则不乘人数，每人每轮规则乘有效人数。
- 空值为未配置，`0` 为有效配置；总量最少为 `0` 等价于不要求最低数量，但仍是已配置值。
- 发布、启用前所有生效门店的必需数量单元必须完整；草稿允许不完整。

## 12. 运行时检查时点

| 操作 | 检查上限 | 检查总量下限 |
|---|---|---|
| 加菜、批量加菜、增加数量 | 是 | 否 |
| 减菜、退菜、取消未提交明细 | 重新计算但不因低于下限拒绝 | 否 |
| 提交/结束当前轮 | 是 | 是 |
| 进入下一轮 | 先完成上一轮提交检查 | 是 |
| 结账/关单且存在未提交当前轮 | 先完成当前轮提交检查 | 是 |
| 取消/作废当前轮 | 按权限和审计执行 | 否 |

空轮不触发最低数量：当前轮从未产生有效菜品明细时允许不创建该轮；一旦存在有效明细并尝试提交/结束，即必须满足下限。已提交轮次后发生退菜导致低于下限时不回滚历史提交，但记录审计事件；再次向该轮追加并提交时重新校验最终状态。

## 13. 可满足性算法

对每个门店、人数值和轮次场景建立有限整数约束模型：

- 每个候选菜单身份 `d` 对应非负整数变量 `x_d`；
- 总量为 `Σx_d`；
- 指定菜品和相同菜品上限形成 `x_d <= cap_d`；
- 分类上限形成 `Σ(category(d)=c)x_d <= cap_c`；
- 菜品集上限形成 `Σ(d∈set)x_d <= cap_s`；
- 总量范围形成 `EffectiveMin <= Σx_d <= EffectiveMax`。

候选菜单身份来自门店锁定/发布候选菜单。没有任何单品、分类、菜品集或相同菜品上限约束的身份，其静态容量按 `EffectiveMax` 截断；若没有有效总量上限，则只需证明可以达到 `EffectiveMin`。实现可以使用等价的最大流、整数规划或有界搜索，但必须得到确定的“存在/不存在整数解”结果，不得用可能误判的简单求和代替。

`supportedPartySizeMax` 随门店规则快照固化，保证进行中订单的验证边界不受门店配置变化影响。运行时 `N > supportedPartySizeMax` 时拒绝数量规则计算并返回 `PARTY_SIZE_ABOVE_SUPPORTED_MAX`，不得将其落入开放区间后继续使用未经静态验证的额度。

诊断至少返回门店、人数值/区间、轮次场景、有效上下限和不可满足核心中的全部规则 ID，包括总量最少、总量最多及造成容量不足的对象规则；只有对象容量参与冲突时才要求对象规则 ID。部分重叠的适用范围只在交集场景内参与该模型；不因局部冲突否定完全不重叠的场景。
